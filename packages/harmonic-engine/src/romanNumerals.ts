import { mod12 } from './notes';
import { SCALE_INTERVALS, diatonicChords } from './scales';
import type { ChordFormula, ChordSpec, KeyCenter } from './types';

const DEGREE_LETTERS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];
const MAJOR_SCALE = SCALE_INTERVALS.major;

const CATEGORY_UPPERCASE: Record<ChordFormula['category'], boolean> = {
  major: true,
  dominant: true,
  augmented: true,
  minor: false,
  diminished: false,
  other: true,
};

const QUALITY_MARK_BY_FORMULA: Record<string, string> = {
  diminished: '°',
  augmented: '+',
  dim7: '°7',
  min7b5: 'ø7',
};

/** Format a ChordSpec back into a roman-numeral string relative to a key, for display. */
export function chordToRomanNumeral(chord: ChordSpec, key: KeyCenter): string {
  const diatonic = diatonicChords(key);
  const match = diatonic.find((d) => d.root === chord.root);
  const upperCase = CATEGORY_UPPERCASE[chord.formula.category];

  let letters: string;
  let accidentalPrefix = '';
  if (match) {
    letters = DEGREE_LETTERS[match.degreeIndex];
  } else {
    // Chromatic root: find nearest scale-degree-by-letter-position via major-scale offsets.
    let bestDegree = 0;
    let bestDelta = 99;
    let bestAccidental = 0;
    for (let i = 0; i < 7; i++) {
      const delta = mod12(chord.root - key.root - MAJOR_SCALE[i]);
      const signedDelta = delta > 6 ? delta - 12 : delta;
      if (Math.abs(signedDelta) < Math.abs(bestDelta)) {
        bestDelta = signedDelta;
        bestDegree = i;
        bestAccidental = signedDelta;
      }
    }
    letters = DEGREE_LETTERS[bestDegree];
    accidentalPrefix = bestAccidental < 0 ? 'b'.repeat(-bestAccidental) : '#'.repeat(bestAccidental);
  }

  const numeral = upperCase ? letters : letters.toLowerCase();
  const qualityMark = QUALITY_MARK_BY_FORMULA[chord.formula.id] ?? '';
  let extensionSuffix = qualityMark ? '' : chord.formula.symbolSuffix;

  // Lowercase numerals already imply minor quality, so drop the redundant leading "m"
  // (e.g. minor7's "m7" suffix becomes "7": "ii7" rather than "iim7").
  if (!qualityMark && chord.formula.category === 'minor' && extensionSuffix.startsWith('m')) {
    extensionSuffix = extensionSuffix.slice(1);
  }

  return `${accidentalPrefix}${numeral}${qualityMark}${extensionSuffix}`;
}
