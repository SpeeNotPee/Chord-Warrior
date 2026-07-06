import type { ProgressionEntry } from './types';

/**
 * Curated historical/functional progressions. `degrees` are roman-numeral
 * tokens parsed by romanNumerals.ts against whatever key/scale the user selects
 * (scaleType here documents the idiomatic mode the progression was written for).
 */
export const PROGRESSION_LIBRARY: ProgressionEntry[] = [
  // --- Baroque / Classical ---
  {
    id: 'pac-major',
    name: 'Perfect Authentic Cadence',
    category: 'baroque',
    scaleType: 'major',
    degrees: ['I', 'IV', 'V7', 'I'],
    description: 'Tonic - Subdominant - Dominant seventh - Tonic, the classic full-close cadence.',
  },
  {
    id: 'plagal-cadence',
    name: 'Plagal Cadence ("Amen")',
    category: 'baroque',
    scaleType: 'major',
    degrees: ['I', 'IV', 'I'],
    description: 'The IV-I "Amen" cadence common in hymns and chorales.',
  },
  {
    id: 'circle-of-fifths-major',
    name: 'Circle-of-Fifths Sequence',
    category: 'baroque',
    scaleType: 'major',
    degrees: ['iii7', 'vi7', 'ii7', 'V7', 'IΔ7'],
    description: 'Descending-fifths sequence walking through diatonic sevenths to the tonic.',
  },
  {
    id: 'pac-minor',
    name: 'Perfect Authentic Cadence (Minor)',
    category: 'baroque',
    scaleType: 'harmonicMinor',
    degrees: ['i', 'iv', 'V7', 'i'],
    description: 'Minor-key cadence using the harmonic-minor raised leading tone for a true dominant.',
  },

  // --- Jazz ---
  {
    id: 'ii-V-I-major',
    name: 'ii-V-I (Major)',
    category: 'jazz',
    scaleType: 'major',
    degrees: ['ii7', 'V7', 'IΔ7'],
    description: 'The quintessential jazz major turnaround cadence.',
  },
  {
    id: 'ii-V-i-minor',
    name: 'ii-V-i (Minor)',
    category: 'jazz',
    scaleType: 'harmonicMinor',
    degrees: ['iiø7', 'V7', 'i'],
    description: 'Minor ii-V-i using a half-diminished ii chord resolving to the dominant.',
  },
  {
    id: 'secondary-dominant-V-of-V',
    name: 'Secondary Dominant (V7/V)',
    category: 'jazz',
    scaleType: 'major',
    degrees: ['I', 'V7/V', 'V7', 'I'],
    description: 'Tonicizes the V chord with its own applied dominant before resolving home.',
  },
  {
    id: 'turnaround-major',
    name: 'I-vi-ii-V Turnaround',
    category: 'jazz',
    scaleType: 'major',
    degrees: ['IΔ7', 'vi7', 'ii7', 'V7'],
    description: 'Classic rhythm-changes-style turnaround cycling back to the top of the form.',
  },
  {
    id: 'tritone-sub-turnaround',
    name: 'Turnaround with Tritone Substitution',
    category: 'jazz',
    scaleType: 'major',
    degrees: ['IΔ7', 'vi7', 'ii7', 'bII7'],
    description: 'Replaces V7 with its tritone substitute (bII7) for chromatic descending bass motion.',
  },

  // --- Pop / Rock ---
  {
    id: 'pop-I-V-vi-IV',
    name: 'I-V-vi-IV',
    category: 'pop',
    scaleType: 'major',
    degrees: ['I', 'V', 'vi', 'IV'],
    description: 'The ubiquitous four-chord pop progression.',
  },
  {
    id: 'pop-vi-IV-I-V',
    name: 'vi-IV-I-V',
    category: 'pop',
    scaleType: 'major',
    degrees: ['vi', 'IV', 'I', 'V'],
    description: "The 'sensitive songwriter' rotation of the four-chord progression.",
  },
];

export function progressionsByCategory(category: ProgressionEntry['category']): ProgressionEntry[] {
  return PROGRESSION_LIBRARY.filter((p) => p.category === category);
}
