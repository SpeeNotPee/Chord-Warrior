import { describe, expect, it } from 'vitest';
import { detectPolyphonicPitches } from '../pitchDetector';

const SAMPLE_RATE = 44100;
const FFT_SIZE = 16384;
const NUM_BINS = FFT_SIZE / 2;

/** Synthesize a plausible dB-magnitude spectrum for a set of fundamental frequencies, each with a few decaying harmonics, atop a noise floor. */
function synthesizeSpectrum(fundamentals: number[], noiseFloorDb = -100): Float32Array {
  const spectrum = new Float32Array(NUM_BINS).fill(noiseFloorDb);
  const binHz = SAMPLE_RATE / FFT_SIZE;

  for (const f0 of fundamentals) {
    for (let harmonic = 1; harmonic <= 5; harmonic++) {
      const freq = f0 * harmonic;
      const bin = Math.round(freq / binHz);
      if (bin <= 0 || bin >= NUM_BINS - 1) continue;
      const amplitudeDb = -10 - (harmonic - 1) * 8; // fundamental loudest, harmonics decay
      spectrum[bin] = Math.max(spectrum[bin], amplitudeDb);
      // small spectral leakage into neighboring bins so the interpolation peak-finder has shape to work with
      spectrum[bin - 1] = Math.max(spectrum[bin - 1], amplitudeDb - 15);
      spectrum[bin + 1] = Math.max(spectrum[bin + 1], amplitudeDb - 15);
    }
  }
  return spectrum;
}

describe('detectPolyphonicPitches', () => {
  it('detects a single pure tone as its MIDI note (A4 = 440Hz = MIDI 69)', () => {
    const spectrum = synthesizeSpectrum([440]);
    const notes = detectPolyphonicPitches(spectrum, SAMPLE_RATE, FFT_SIZE);
    expect(notes).toEqual([69]);
  });

  it('detects a C major triad (C4, E4, G4) and rejects harmonic overtones as extra notes', () => {
    const spectrum = synthesizeSpectrum([261.63, 329.63, 392.0]);
    const notes = detectPolyphonicPitches(spectrum, SAMPLE_RATE, FFT_SIZE);
    expect(notes).toEqual([60, 64, 67]);
  });

  it('ignores bins below the noise floor threshold', () => {
    const spectrum = new Float32Array(NUM_BINS).fill(-120);
    const notes = detectPolyphonicPitches(spectrum, SAMPLE_RATE, FFT_SIZE);
    expect(notes).toEqual([]);
  });

  it('caps the number of detected notes at maxNotes', () => {
    const spectrum = synthesizeSpectrum([130.81, 164.81, 196.0, 246.94, 293.66, 349.23, 415.3]);
    const notes = detectPolyphonicPitches(spectrum, SAMPLE_RATE, FFT_SIZE, { maxNotes: 3 });
    expect(notes.length).toBeLessThanOrEqual(3);
  });
});
