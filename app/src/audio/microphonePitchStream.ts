import { detectPolyphonicPitches, type PitchDetectionOptions } from './pitchDetector';
import type { MidiNote } from '@chordwarrior/harmonic-engine';

export type PitchStreamListener = (notes: MidiNote[]) => void;

// A large FFT gives finer frequency resolution but also more group delay
// (the window needs ~fftSize/sampleRate seconds of audio before a new note's
// energy is fully represented). 8192 keeps resolution good enough for
// interpolated peak-finding while roughly halving that latency vs. 16384.
const FFT_SIZE = 8192;

// Fast-attack/fast-release hysteresis: a note needs two consecutive raw
// detections before it's reported, which is enough to reject one-off noise
// blips (a stray overtone, a click) without adding perceptible latency
// (~33ms at 60fps) for real played notes. The release window is kept short
// on purpose — a longer grace period makes a genuinely deliberately-played
// note survive brief dropouts, but it also means any spurious "extra" note
// that does slip through (grading fails the instant there's an extra note
// present) lingers and keeps grading incorrect long after the blip is gone.
const ATTACK_FRAMES = 2;
const RELEASE_FRAMES = 5;

interface NoteTrackState {
  hits: number;
  misses: number;
  active: boolean;
}

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
  private noteStates = new Map<MidiNote, NoteTrackState>();

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
    this.noteStates.clear();
  }

  onPitches(listener: PitchStreamListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private tick = (): void => {
    if (!this.analyser || !this.audioContext) return;
    const magnitudes = new Float32Array(this.analyser.frequencyBinCount);
    this.analyser.getFloatFrequencyData(magnitudes);

    const rawNotes = detectPolyphonicPitches(magnitudes, this.audioContext.sampleRate, FFT_SIZE, this.detectionOptions);

    const activeNotes = this.updateNoteStates(rawNotes);
    this.listeners.forEach((l) => l(activeNotes));

    this.frameHandle = requestAnimationFrame(this.tick);
  };

  /** Advances the per-note attack/release counters from this frame's raw detections and returns the currently-active notes. */
  private updateNoteStates(rawNotes: MidiNote[]): MidiNote[] {
    const rawSet = new Set(rawNotes);

    for (const [note, state] of this.noteStates) {
      if (rawSet.has(note)) {
        state.hits += 1;
        state.misses = 0;
        if (state.hits >= ATTACK_FRAMES) state.active = true;
      } else {
        state.misses += 1;
        state.hits = 0;
        if (state.misses >= RELEASE_FRAMES) this.noteStates.delete(note);
      }
    }

    for (const note of rawSet) {
      if (!this.noteStates.has(note)) {
        this.noteStates.set(note, { hits: 1, misses: 0, active: ATTACK_FRAMES <= 1 });
      }
    }

    return Array.from(this.noteStates.entries())
      .filter(([, state]) => state.active)
      .map(([note]) => note)
      .sort((a, b) => a - b);
  }
}
