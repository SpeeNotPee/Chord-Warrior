import { detectPolyphonicPitches, type PitchDetectionOptions } from './pitchDetector';
import type { MidiNote } from '@chordwarrior/harmonic-engine';

export type PitchStreamListener = (notes: MidiNote[]) => void;

const FFT_SIZE = 16384;

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
    this.listeners.forEach((l) => l(notes));

    this.frameHandle = requestAnimationFrame(this.tick);
  };
}
