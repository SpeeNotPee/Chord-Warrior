import { mod12, type MidiNote, type VoicedChord } from '@chordwarrior/harmonic-engine';

export type GradingStrictness = 'loose' | 'strict';

export interface GradingResult {
  isCorrect: boolean;
  strictness: GradingStrictness;
  /** Pitch classes required by the target chord that are missing from the played input. */
  missingPitchClasses: number[];
  /** Pitch classes played that aren't part of the target chord (loose mode) or extra notes (strict mode). */
  extraNotes: number[];
}

function uniqueSorted(values: number[]): number[] {
  return Array.from(new Set(values)).sort((a, b) => a - b);
}

/**
 * Loose grading: correct if the played pitch-class set contains every pitch
 * class of the target chord, regardless of octave placement, doubling, or
 * which chord tone is in the bass (inversion-agnostic).
 */
function gradeLoose(target: VoicedChord, playedNotes: MidiNote[]): GradingResult {
  const targetPcs = uniqueSorted(target.pitches.map(mod12));
  const playedPcs = uniqueSorted(playedNotes.map(mod12));
  const playedSet = new Set(playedPcs);

  const missingPitchClasses = targetPcs.filter((pc) => !playedSet.has(pc));
  const targetSet = new Set(targetPcs);
  const extraNotes = playedPcs.filter((pc) => !targetSet.has(pc));

  return {
    isCorrect: missingPitchClasses.length === 0 && extraNotes.length === 0,
    strictness: 'loose',
    missingPitchClasses,
    extraNotes,
  };
}

/**
 * Strict grading: correct only if the played absolute-pitch set exactly
 * matches the target voicing's absolute pitches (same notes, same octave,
 * same inversion/layout as rendered).
 */
function gradeStrict(target: VoicedChord, playedNotes: MidiNote[]): GradingResult {
  const targetNotes = uniqueSorted(target.pitches);
  const playedUnique = uniqueSorted(playedNotes);
  const targetSet = new Set(targetNotes);
  const playedSet = new Set(playedUnique);

  const missingPitchClasses = targetNotes.filter((n) => !playedSet.has(n)).map(mod12);
  const extraNotes = playedUnique.filter((n) => !targetSet.has(n));

  return {
    isCorrect: missingPitchClasses.length === 0 && extraNotes.length === 0,
    strictness: 'strict',
    missingPitchClasses,
    extraNotes,
  };
}

export function gradeChord(target: VoicedChord, playedNotes: MidiNote[], strictness: GradingStrictness): GradingResult {
  return strictness === 'strict' ? gradeStrict(target, playedNotes) : gradeLoose(target, playedNotes);
}
