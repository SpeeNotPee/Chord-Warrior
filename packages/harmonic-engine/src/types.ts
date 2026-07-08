// Core music-theory types shared across the harmonic engine.

/** Pitch class 0-11, where 0 = C, 1 = C#, ... 11 = B. */
export type PitchClass = number;

/** Absolute MIDI note number (60 = Middle C / C4). */
export type MidiNote = number;

export type NoteName =
  | 'C' | 'C#' | 'Db' | 'D' | 'D#' | 'Eb' | 'E' | 'F' | 'F#' | 'Gb'
  | 'G' | 'G#' | 'Ab' | 'A' | 'A#' | 'Bb' | 'B';

export type ScaleType = 'major' | 'naturalMinor' | 'harmonicMinor';

export type ChordCategory = 'major' | 'minor' | 'diminished' | 'augmented' | 'dominant' | 'other';

/** A chord formula: semitone intervals from the root, plus display metadata. */
export interface ChordFormula {
  id: string;
  /** Semitone offsets from the root. May exceed 11 for upper-structure extensions (9ths, 11ths, 13ths). */
  intervals: number[];
  /** Chord-symbol suffix, e.g. "", "m", "7", "Δ7" (maj7 delta), "m7♭5". */
  symbolSuffix: string;
  /** Broad category used for functional-harmony classification & voice leading. */
  category: ChordCategory;
  /** Complexity tier this formula belongs to (1 = triad, 2 = 7th, 3 = extended/altered). */
  tier: 1 | 2 | 3;
  /** Human-readable name. */
  name: string;
}

export interface ChordSpec {
  root: PitchClass;
  formula: ChordFormula;
  /** Optional explicit bass pitch class for slash chords / inversions. */
  bass?: PitchClass;
}

export interface VoicedChord extends ChordSpec {
  /** Absolute MIDI pitches actually voiced, low to high. */
  pitches: MidiNote[];
  /** Chord symbol text, e.g. "CΔ7", "F#m7♭5". */
  symbol: string;
  /** Roman numeral relative to the active key, if generated in a key context. */
  romanNumeral?: string;
}

export interface KeyCenter {
  root: PitchClass;
  scaleType: ScaleType;
}

export type FunctionalCategory = 'tonic' | 'predominant' | 'dominant';

export type ComplexityTier = 1 | 2 | 3;

export interface GenerationOptions {
  key: KeyCenter;
  tier: ComplexityTier;
  length: number;
  /** Chance [0,1] that a tier-3-eligible chord is actually decorated to an extended/altered formula. Defaults to 1. */
  decorateProbability?: number;
  /** Minimize movement of common tones between adjacent chords. Default true. */
  voiceLead?: boolean;
  /** MIDI range the voicing should stay within. */
  range?: [MidiNote, MidiNote];
}
