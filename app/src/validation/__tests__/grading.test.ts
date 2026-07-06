import { describe, expect, it } from 'vitest';
import { gradeChord } from '../grading';
import { CHORD_FORMULAS, type VoicedChord } from '@chordwarrior/harmonic-engine';

const cMajorTriad: VoicedChord = {
  root: 0,
  formula: CHORD_FORMULAS.major,
  pitches: [60, 64, 67], // C4 E4 G4
  symbol: 'C',
};

describe('gradeChord loose mode', () => {
  it('accepts the exact voicing', () => {
    expect(gradeChord(cMajorTriad, [60, 64, 67], 'loose').isCorrect).toBe(true);
  });

  it('accepts a different octave / inversion as long as pitch classes match', () => {
    expect(gradeChord(cMajorTriad, [48, 52, 55], 'loose').isCorrect).toBe(true); // C3 E3 G3
    expect(gradeChord(cMajorTriad, [64, 67, 72], 'loose').isCorrect).toBe(true); // first inversion, E4 G4 C5
  });

  it('rejects a missing chord tone', () => {
    const result = gradeChord(cMajorTriad, [60, 64], 'loose');
    expect(result.isCorrect).toBe(false);
    expect(result.missingPitchClasses).toEqual([7]); // missing G
  });

  it('ignores extra doubled notes of the same pitch classes', () => {
    expect(gradeChord(cMajorTriad, [48, 60, 64, 67, 72], 'loose').isCorrect).toBe(true);
  });

  it('rejects when an extra unrelated pitch class is played', () => {
    const result = gradeChord(cMajorTriad, [60, 62, 64, 67], 'loose');
    expect(result.isCorrect).toBe(false);
    expect(result.extraNotes).toEqual([2]);
  });
});

describe('gradeChord strict mode', () => {
  it('accepts only the exact absolute pitches', () => {
    expect(gradeChord(cMajorTriad, [60, 64, 67], 'strict').isCorrect).toBe(true);
  });

  it('rejects a different inversion even though pitch classes match', () => {
    const result = gradeChord(cMajorTriad, [64, 67, 72], 'strict');
    expect(result.isCorrect).toBe(false);
  });

  it('rejects a different octave', () => {
    expect(gradeChord(cMajorTriad, [48, 52, 55], 'strict').isCorrect).toBe(false);
  });
});
