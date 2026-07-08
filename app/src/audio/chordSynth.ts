import * as Tone from 'tone';
import { midiToFrequency, type MidiNote } from '@chordwarrior/harmonic-engine';

let sampler: Tone.Sampler | null = null;

/**
 * Salamander Grand Piano samples hosted on Tone.js's own docs CDN — the same
 * sample set used in Tone.js's official examples. A sparse major-third-apart
 * sample grid is enough for Tone.Sampler to pitch-shift convincingly across
 * the app's C3-C6 voicing range.
 */
function getSampler(): Tone.Sampler {
  if (!sampler) {
    sampler = new Tone.Sampler({
      urls: {
        C3: 'C3.mp3', 'D#3': 'Ds3.mp3', 'F#3': 'Fs3.mp3', A3: 'A3.mp3',
        C4: 'C4.mp3', 'D#4': 'Ds4.mp3', 'F#4': 'Fs4.mp3', A4: 'A4.mp3',
        C5: 'C5.mp3', 'D#5': 'Ds5.mp3', 'F#5': 'Fs5.mp3', A5: 'A5.mp3',
      },
      release: 1,
      baseUrl: 'https://tonejs.github.io/audio/salamander/',
    }).toDestination();
  }
  return sampler;
}

/** Play a chord's pitches once, simultaneously, for ear-training "Listening" mode. */
export async function playChordOnce(pitches: MidiNote[], durationSeconds = 1.5): Promise<void> {
  if (pitches.length === 0) return;
  await Tone.start();
  const instrument = getSampler();
  await Tone.loaded();
  const freqs = pitches.map((m) => midiToFrequency(m));
  instrument.triggerAttackRelease(freqs, durationSeconds);
}

/** Play a chord's pitches one at a time, ascending, for arpeggio ear-training. */
export async function playChordArpeggio(pitches: MidiNote[], noteSpacingSeconds = 0.15, noteDurationSeconds = 1.0): Promise<void> {
  if (pitches.length === 0) return;
  await Tone.start();
  const instrument = getSampler();
  await Tone.loaded();
  const ascending = [...pitches].sort((a, b) => a - b);
  const now = Tone.now();
  ascending.forEach((midi, i) => {
    instrument.triggerAttackRelease(midiToFrequency(midi), noteDurationSeconds, now + i * noteSpacingSeconds);
  });
}

export function disposeChordSynth(): void {
  sampler?.dispose();
  sampler = null;
}
