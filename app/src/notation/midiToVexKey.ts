import { midiToOctave, midiToPitchClass, type MidiNote } from '@chordwarrior/harmonic-engine';

export interface VexKey {
  /** Full VexFlow key string including accidental, e.g. "c/4" or "c#/4". */
  key: string;
  /** Accidental to additionally register via an explicit Accidental modifier so the glyph renders. */
  accidental: '#' | 'b' | null;
}

const SHARP_LETTERS: [string, '#' | null][] = [
  ['c', null], ['c', '#'], ['d', null], ['d', '#'], ['e', null], ['f', null],
  ['f', '#'], ['g', null], ['g', '#'], ['a', null], ['a', '#'], ['b', null],
];

const FLAT_LETTERS: [string, 'b' | null][] = [
  ['c', null], ['d', 'b'], ['d', null], ['e', 'b'], ['e', null], ['f', null],
  ['g', 'b'], ['g', null], ['a', 'b'], ['a', null], ['b', 'b'], ['b', null],
];

/**
 * Convert an absolute MIDI pitch to a VexFlow key ("letter/octave") plus a
 * separate accidental marker. VexFlow's line/space position is driven purely
 * by the letter+octave; the accidental must be added as an explicit modifier
 * by the renderer for the sharp/flat glyph to actually be drawn.
 */
export function midiToVexKey(midi: MidiNote, preferFlats = false): VexKey {
  const pc = midiToPitchClass(midi);
  const octave = midiToOctave(midi);
  const [letter, accidental] = (preferFlats ? FLAT_LETTERS : SHARP_LETTERS)[pc];
  return { key: `${letter}${accidental ?? ''}/${octave}`, accidental };
}

export function midiArrayToVexKeys(pitches: MidiNote[], preferFlats = false): VexKey[] {
  return pitches.map((m) => midiToVexKey(m, preferFlats));
}
