import { CHORD_FORMULAS } from './chordFormulas';
import { mod12 } from './notes';
import type { ChordFormula, KeyCenter, PitchClass, ScaleType } from './types';

/** Scale-degree intervals from the tonic, in semitones. */
export const SCALE_INTERVALS: Record<ScaleType, number[]> = {
  major: [0, 2, 4, 5, 7, 9, 11],
  naturalMinor: [0, 2, 3, 5, 7, 8, 10],
  harmonicMinor: [0, 2, 3, 5, 7, 8, 11],
};

export const SCALE_DEGREE_NUMERALS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];

/** Absolute pitch classes of a key's scale, starting on the tonic. */
export function scalePitchClasses(key: KeyCenter): PitchClass[] {
  return SCALE_INTERVALS[key.scaleType].map((iv) => mod12(key.root + iv));
}

/** Find a chord formula whose interval set matches the given (root-relative, mod-12, deduped, sorted) intervals. */
function matchFormula(intervalsFromRoot: number[]): ChordFormula | undefined {
  const normalized = Array.from(new Set(intervalsFromRoot.map(mod12))).sort((a, b) => a - b);
  return Object.values(CHORD_FORMULAS).find((f) => {
    const candidate = Array.from(new Set(f.intervals.map(mod12))).sort((a, b) => a - b);
    return candidate.length === normalized.length && candidate.every((v, i) => v === normalized[i]);
  });
}

export interface DiatonicChord {
  degreeIndex: number; // 0-6
  root: PitchClass;
  triad: ChordFormula;
  seventh?: ChordFormula;
}

/**
 * Stack thirds within the scale (degree, +2, +4, +6 scale steps) to derive the
 * diatonic triad and seventh chord built on each scale degree.
 */
export function diatonicChords(key: KeyCenter): DiatonicChord[] {
  const pcs = scalePitchClasses(key);
  const degrees: DiatonicChord[] = [];
  for (let i = 0; i < 7; i++) {
    const root = pcs[i];
    const third = pcs[(i + 2) % 7];
    const fifth = pcs[(i + 4) % 7];
    const seventh = pcs[(i + 6) % 7];

    const triadIntervals = [0, mod12(third - root), mod12(fifth - root)];
    const seventhIntervals = [...triadIntervals, mod12(seventh - root)];

    const triad = matchFormula(triadIntervals) ?? CHORD_FORMULAS.major;
    const seventhFormula = matchFormula(seventhIntervals);

    degrees.push({ degreeIndex: i, root, triad, seventh: seventhFormula });
  }
  return degrees;
}
