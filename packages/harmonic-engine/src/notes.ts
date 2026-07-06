import type { MidiNote, NoteName, PitchClass } from './types';

/** Sharp-preferred spelling for each pitch class, used as the default display name. */
export const SHARP_NAMES: NoteName[] = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

/** Flat-preferred spelling for each pitch class. */
export const FLAT_NAMES: NoteName[] = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

const NAME_TO_PITCH_CLASS: Record<string, PitchClass> = {};
SHARP_NAMES.forEach((n, i) => (NAME_TO_PITCH_CLASS[n] = i));
FLAT_NAMES.forEach((n, i) => (NAME_TO_PITCH_CLASS[n] = i));

export function noteNameToPitchClass(name: string): PitchClass {
  const pc = NAME_TO_PITCH_CLASS[name];
  if (pc === undefined) throw new Error(`Unknown note name: ${name}`);
  return pc;
}

export function pitchClassToName(pc: PitchClass, preferFlats = false): NoteName {
  const table = preferFlats ? FLAT_NAMES : SHARP_NAMES;
  return table[((pc % 12) + 12) % 12];
}

export function mod12(n: number): PitchClass {
  return ((n % 12) + 12) % 12;
}

/** Middle C (C4) = MIDI 60, matching the spec's clef-conversion reference point. */
export const MIDDLE_C: MidiNote = 60;

export function midiToPitchClass(midi: MidiNote): PitchClass {
  return mod12(midi);
}

export function midiToOctave(midi: MidiNote): number {
  return Math.floor(midi / 12) - 1;
}

export function noteNameOctaveToMidi(name: string, octave: number): MidiNote {
  return noteNameToPitchClass(name) + (octave + 1) * 12;
}

export function midiToNoteName(midi: MidiNote, preferFlats = false): string {
  return `${pitchClassToName(midiToPitchClass(midi), preferFlats)}${midiToOctave(midi)}`;
}

/** Standard mathematical mapping from frequency (Hz) to fractional MIDI note number. */
export function frequencyToMidi(freqHz: number): number {
  return 69 + 12 * Math.log2(freqHz / 440);
}

export function midiToFrequency(midi: MidiNote): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}
