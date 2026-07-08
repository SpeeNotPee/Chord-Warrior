import { detectPolyphonicPitches, type PitchDetectionOptions } from './pitchDetector';
import type { MidiNote } from '@chordwarrior/harmonic-engine';

export type PitchStreamListener = (notes: MidiNote[]) => void;

const FFT_SIZE = 16384;

// A single noisy frame (footstep, click, breath) can inject a false note.
// Requiring a note to show up in most of the last few frames before it's
// reported filters those transients out; sustained played notes, which persist
// across many frames, still pass through with negligible added latency.
const STABILITY_WINDOW = 4;
const STABILITY_MIN_HITS = 3;

/**
 * Wraps getUserMedia + AnalyserNode into a continuously-running polyphonic
 * pitch stream: captures microphone audio, runs an FFT each animation frame,
 * and reports detected MIDI note numbers to subscribers.
 */
export class MicrophonePitchStream {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private mediaStream: MediaStream | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private frameHandle: number | null = null;
  private listeners = new Set<PitchStreamListener>();
  private detectionOptions: Partial<PitchDetectionOptions>;
  private recentFrames: MidiNote[][] = [];

  constructor(detectionOptions: Partial<PitchDetectionOptions> = {}) {
    this.detectionOptions = detectionOptions;
  }

  get isSupported(): boolean {
    return typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia;
  }

  async start(): Promise<void> {
    if (!this.isSupported) throw new Error('Microphone capture is not supported in this environment.');

    this.mediaStream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
    });

    this.audioContext = new AudioContext();
    // The user-gesture chain from the "Start" click is broken by the `await`
    // above, so some browsers (notably Firefox) create the context suspended.
    // Without an explicit resume the analyser never receives real audio data.
    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }

    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = FFT_SIZE;
    this.analyser.smoothingTimeConstant = 0.2;

    this.sourceNode = this.audioContext.createMediaStreamSource(this.mediaStream);
    this.sourceNode.connect(this.analyser);

    this.tick();
  }

  stop(): void {
    if (this.frameHandle !== null) {
      cancelAnimationFrame(this.frameHandle);
      this.frameHandle = null;
    }
    this.sourceNode?.disconnect();
    this.mediaStream?.getTracks().forEach((track) => track.stop());
    this.audioContext?.close();
    this.sourceNode = null;
    this.analyser = null;
    this.mediaStream = null;
    this.audioContext = null;
    this.recentFrames = [];
  }

  onPitches(listener: PitchStreamListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private tick = (): void => {
    if (!this.analyser || !this.audioContext) return;
    const magnitudes = new Float32Array(this.analyser.frequencyBinCount);
    this.analyser.getFloatFrequencyData(magnitudes);

    const notes = detectPolyphonicPitches(magnitudes, this.audioContext.sampleRate, FFT_SIZE, this.detectionOptions);

    this.recentFrames.push(notes);
    if (this.recentFrames.length > STABILITY_WINDOW) this.recentFrames.shift();

    const stableNotes = this.selectStableNotes();
    this.listeners.forEach((l) => l(stableNotes));

    this.frameHandle = requestAnimationFrame(this.tick);
  };

  /** Keeps only notes that appeared in at least STABILITY_MIN_HITS of the recent frames. */
  private selectStableNotes(): MidiNote[] {
    const hitCounts = new Map<MidiNote, number>();
    for (const frame of this.recentFrames) {
      for (const note of frame) {
        hitCounts.set(note, (hitCounts.get(note) ?? 0) + 1);
      }
    }
    const minHits = Math.min(STABILITY_MIN_HITS, this.recentFrames.length);
    return Array.from(hitCounts.entries())
      .filter(([, count]) => count >= minHits)
      .map(([note]) => note)
      .sort((a, b) => a - b);
  }
}
