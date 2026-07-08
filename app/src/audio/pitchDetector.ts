import { frequencyToMidi, type MidiNote } from '@chordwarrior/harmonic-engine';

export interface PitchDetectionOptions {
  minFrequency: number;
  maxFrequency: number;
  /** Magnitude (dB) threshold below which bins are ignored as noise floor. */
  dbThreshold: number;
  /**
   * Peaks quieter than (loudest peak in the frame - this many dB) are discarded.
   * Ambient noise is almost always much quieter than a deliberately played note,
   * so this relative gate rejects it even when it sits above the absolute floor.
   */
  relativeThresholdDb: number;
  maxNotes: number;
  /** Tolerance (in cents) used when deciding whether a peak is a harmonic overtone of an already-accepted fundamental. */
  harmonicToleranceCents: number;
}

export const DEFAULT_PITCH_DETECTION_OPTIONS: PitchDetectionOptions = {
  minFrequency: 60,
  maxFrequency: 2000,
  dbThreshold: -60,
  relativeThresholdDb: 30,
  maxNotes: 6,
  harmonicToleranceCents: 40,
};

interface Peak {
  frequency: number;
  magnitude: number;
}

/** Parabolic interpolation around a local-maximum bin for sub-bin frequency precision. */
function interpolatePeak(magnitudes: ArrayLike<number>, binIndex: number, sampleRate: number, fftSize: number): number {
  const y0 = magnitudes[binIndex - 1] ?? magnitudes[binIndex];
  const y1 = magnitudes[binIndex];
  const y2 = magnitudes[binIndex + 1] ?? magnitudes[binIndex];
  const denom = y0 - 2 * y1 + y2;
  const shift = denom !== 0 ? (0.5 * (y0 - y2)) / denom : 0;
  const refinedBin = binIndex + shift;
  return (refinedBin * sampleRate) / fftSize;
}

/** Find local-maxima bins above the noise floor within [minFrequency, maxFrequency]. */
function findPeaks(
  magnitudes: ArrayLike<number>,
  sampleRate: number,
  fftSize: number,
  opts: PitchDetectionOptions,
): Peak[] {
  const binHz = sampleRate / fftSize;
  const minBin = Math.max(1, Math.floor(opts.minFrequency / binHz));
  const maxBin = Math.min(magnitudes.length - 2, Math.ceil(opts.maxFrequency / binHz));

  const peaks: Peak[] = [];
  let loudest = -Infinity;
  for (let i = minBin; i <= maxBin; i++) {
    const m = magnitudes[i];
    if (m < opts.dbThreshold) continue;
    if (m >= magnitudes[i - 1] && m >= magnitudes[i + 1] && (m > magnitudes[i - 1] || m > magnitudes[i + 1])) {
      if (m > loudest) loudest = m;
      peaks.push({ frequency: interpolatePeak(magnitudes, i, sampleRate, fftSize), magnitude: m });
    }
  }
  return peaks.filter((p) => p.magnitude >= loudest - opts.relativeThresholdDb);
}

function centsDifference(freqA: number, freqB: number): number {
  return 1200 * Math.log2(freqA / freqB);
}

/**
 * Filter raw spectral peaks down to a set of likely fundamental frequencies by
 * discarding peaks that land on an integer-harmonic of an already-accepted,
 * stronger fundamental (basic harmonic-product-style rejection).
 */
function selectFundamentals(peaks: Peak[], opts: PitchDetectionOptions): number[] {
  const sorted = [...peaks].sort((a, b) => b.magnitude - a.magnitude);
  const accepted: number[] = [];

  for (const peak of sorted) {
    if (accepted.length >= opts.maxNotes) break;

    const isHarmonicOfAccepted = accepted.some((fundamental) => {
      const ratio = peak.frequency / fundamental;
      const nearestHarmonic = Math.round(ratio);
      if (nearestHarmonic < 1) return false;
      const harmonicFreq = fundamental * nearestHarmonic;
      return Math.abs(centsDifference(peak.frequency, harmonicFreq)) < opts.harmonicToleranceCents && nearestHarmonic >= 2;
    });
    if (isHarmonicOfAccepted) continue;

    accepted.push(peak.frequency);
  }

  return accepted;
}

/**
 * Detect the MIDI note numbers of the fundamental frequencies present in a
 * single FFT frame (magnitudes in dB, as returned by AnalyserNode.getFloatFrequencyData).
 * Returns unique, ascending, rounded MIDI note numbers.
 */
export function detectPolyphonicPitches(
  magnitudesDb: ArrayLike<number>,
  sampleRate: number,
  fftSize: number,
  options: Partial<PitchDetectionOptions> = {},
): MidiNote[] {
  const opts: PitchDetectionOptions = { ...DEFAULT_PITCH_DETECTION_OPTIONS, ...options };
  const peaks = findPeaks(magnitudesDb, sampleRate, fftSize, opts);
  const fundamentals = selectFundamentals(peaks, opts);

  const midiNotes = fundamentals.map((f) => Math.round(frequencyToMidi(f)));
  return Array.from(new Set(midiNotes)).sort((a, b) => a - b);
}
