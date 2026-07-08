import { describe, expect, it } from 'vitest';
import { computeOttavaShift } from '../ottava';

describe('computeOttavaShift', () => {
  it('applies no shift for a chord that fits comfortably on the staff', () => {
    expect(computeOttavaShift([60, 64, 67], 'treble')).toEqual({ shiftSemitones: 0, label: null });
  });

  it('applies no shift for a chord within a couple of ledger lines', () => {
    // C6 (84) is 7 semitones above the treble staff's top line (F5 = 77) — right at the threshold.
    expect(computeOttavaShift([84], 'treble')).toEqual({ shiftSemitones: 0, label: null });
  });

  it('marks 8va and shifts down an octave for a chord well above the treble staff', () => {
    const result = computeOttavaShift([79, 83, 86], 'treble'); // G5, B5, D6
    expect(result.label).toBe('8va');
    expect(result.shiftSemitones).toBe(12);
  });

  it('marks 8vb and shifts up an octave for a chord well below the bass staff', () => {
    const result = computeOttavaShift([34, 37, 41], 'bass'); // Bb1, C#2, F2
    expect(result.label).toBe('8vb');
    expect(result.shiftSemitones).toBe(-12);
  });

  it('marks 15ma for a chord two octaves above the staff', () => {
    const result = computeOttavaShift([100, 103, 107], 'treble');
    expect(result.label).toBe('15ma');
    expect(result.shiftSemitones).toBe(24);
  });

  it('marks 15mb for a chord two octaves below the staff', () => {
    const result = computeOttavaShift([16, 19, 23], 'bass');
    expect(result.label).toBe('15mb');
    expect(result.shiftSemitones).toBe(-24);
  });

  it('returns no shift for an empty chord', () => {
    expect(computeOttavaShift([], 'treble')).toEqual({ shiftSemitones: 0, label: null });
  });
});
