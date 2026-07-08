import type { ComplexityTier, MidiNote } from './types';

/** A graded-curriculum difficulty level, loosely modeled on real graded music-theory syllabi. */
export type MusicGrade = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export interface GradeProfile {
  /** Which chord-formula pool the grade draws from: triads, 7ths, or extended/altered. */
  chordTier: ComplexityTier;
  /** Chance [0,1] that a tier-3-eligible chord is actually decorated to an extended/altered formula. */
  decorateProbability: number;
  /** Suggested progression length range [min, max]. */
  lengthRange: [number, number];
  /** Suggested voicing MIDI range. */
  range: [MidiNote, MidiNote];
}

export const GRADE_PROFILES: Record<MusicGrade, GradeProfile> = {
  1: { chordTier: 1, decorateProbability: 0, lengthRange: [3, 4], range: [55, 79] },
  2: { chordTier: 1, decorateProbability: 0, lengthRange: [3, 5], range: [53, 81] },
  3: { chordTier: 1, decorateProbability: 0, lengthRange: [4, 5], range: [50, 84] },
  4: { chordTier: 2, decorateProbability: 0, lengthRange: [4, 6], range: [48, 84] },
  5: { chordTier: 2, decorateProbability: 0, lengthRange: [5, 6], range: [48, 84] },
  6: { chordTier: 3, decorateProbability: 0.3, lengthRange: [5, 7], range: [48, 84] },
  7: { chordTier: 3, decorateProbability: 0.6, lengthRange: [6, 7], range: [45, 86] },
  8: { chordTier: 3, decorateProbability: 0.9, lengthRange: [6, 8], range: [43, 88] },
};

export const MUSIC_GRADES: MusicGrade[] = [1, 2, 3, 4, 5, 6, 7, 8];
