import { CHORD_FORMULAS } from './chordFormulas';
import { mod12 } from './notes';
import { SCALE_INTERVALS, diatonicChords } from './scales';
import type { ChordFormula, ChordSpec, KeyCenter } from './types';

const DEGREE_LETTERS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];
const MAJOR_SCALE = SCALE_INTERVALS.major;

function degreeIndexFromLetters(letters: string): number {
  const idx = DEGREE_LETTERS.indexOf(letters.toUpperCase());
  if (idx === -1) throw new Error(`Unknown roman numeral: ${letters}`);
  return idx;
}

/** Maps an extension suffix directly to a formula id, or a contextual marker resolved by base quality. */
const EXTENSION_SUFFIX_MAP: Record<string, string> = {
  M7: 'maj7', 'Δ7': 'maj7', maj7: 'maj7',
  m7: 'min7',
  'ø7': 'min7b5',
  '°7': 'dim7', dim7: 'dim7',
  'mΔ7': 'minMaj7', mM7: 'minMaj7',
  '+Δ7': 'augMaj7',
  add9: 'add9', '(add9)': 'add9',
  sus2: 'sus2', sus4: 'sus4', '7sus4': 'dom7sus4',
  13: 'dom13',
  '7♯9': 'dom7sharp9', '7#9': 'dom7sharp9',
  '7♭9': 'dom7flat9', '7b9': 'dom7flat9',
  'Δ7(♯11)': 'maj7sharp11', 'Δ7#11': 'maj7sharp11',
  11: 'min11',
  6: 'major', // simple 6-chords fall back to a plain triad for now
};

interface ParsedToken {
  accidental: -1 | 0 | 1;
  degreeIndex: number;
  isUpperCase: boolean;
  qualityMark: '°' | '+' | 'ø' | '';
  extension: string;
  secondaryTarget: string | null;
}

const TOKEN_RE = /^(b|#)?(VII|VI|V|IV|III|II|I|vii|vi|v|iv|iii|ii|i)(°|\+|ø)?([^/]*)(?:\/(.+))?$/;

function parseToken(token: string): ParsedToken {
  const match = TOKEN_RE.exec(token.trim());
  if (!match) throw new Error(`Cannot parse roman numeral token: ${token}`);
  const [, accidentalStr, letters, qualityMark, extension, secondaryTarget] = match;
  return {
    accidental: accidentalStr === 'b' ? -1 : accidentalStr === '#' ? 1 : 0,
    degreeIndex: degreeIndexFromLetters(letters),
    isUpperCase: letters === letters.toUpperCase(),
    qualityMark: (qualityMark as ParsedToken['qualityMark']) ?? '',
    extension: extension ?? '',
    secondaryTarget: secondaryTarget ?? null,
  };
}

function resolveFormula(base: ParsedToken): ChordFormula {
  const { qualityMark, extension, isUpperCase } = base;

  if (extension) {
    const mapped = EXTENSION_SUFFIX_MAP[extension];
    if (mapped) return CHORD_FORMULAS[mapped];

    if (extension === '7') {
      if (qualityMark === '°') return CHORD_FORMULAS.dim7;
      if (qualityMark === 'ø') return CHORD_FORMULAS.min7b5;
      return isUpperCase ? CHORD_FORMULAS.dom7 : CHORD_FORMULAS.min7;
    }
    if (extension === '9') {
      return isUpperCase ? CHORD_FORMULAS.dom9 : CHORD_FORMULAS.min9;
    }
  }

  if (qualityMark === '°') return CHORD_FORMULAS.diminished;
  if (qualityMark === '+') return CHORD_FORMULAS.augmented;
  if (qualityMark === 'ø') return CHORD_FORMULAS.min7b5;

  return isUpperCase ? CHORD_FORMULAS.major : CHORD_FORMULAS.minor;
}

/** Root pitch class for a degree letter + accidental, measured against the major-scale degree position from a tonic. */
function chromaticRootFromTonic(tonicPc: number, degreeIndex: number, accidental: -1 | 0 | 1): number {
  return mod12(tonicPc + MAJOR_SCALE[degreeIndex] + accidental);
}

/**
 * Parse a single roman-numeral token (e.g. "ii7", "V7/V", "bII7", "IΔ7") into a
 * concrete ChordSpec within the given key. Secondary dominants/applied chords
 * ("X/Y") tonicize scale degree Y (using its real diatonic root in this key) and
 * resolve X's degree as a major-scale offset from that temporary tonic.
 */
export function parseRomanToken(token: string, key: KeyCenter): ChordSpec {
  const parsed = parseToken(token);
  const diatonic = diatonicChords(key);

  let root: number;
  if (parsed.secondaryTarget) {
    const targetParsed = parseToken(parsed.secondaryTarget);
    const temporaryTonic = diatonic[targetParsed.degreeIndex].root;
    root = chromaticRootFromTonic(temporaryTonic, parsed.degreeIndex, parsed.accidental);
  } else if (parsed.accidental !== 0) {
    root = chromaticRootFromTonic(key.root, parsed.degreeIndex, parsed.accidental);
  } else {
    root = diatonic[parsed.degreeIndex].root;
  }

  let formula: ChordFormula;
  if (!parsed.secondaryTarget && parsed.accidental === 0 && !parsed.extension && !parsed.qualityMark) {
    formula = diatonic[parsed.degreeIndex].triad;
  } else if (!parsed.secondaryTarget && parsed.accidental === 0 && parsed.extension === '7' && !parsed.qualityMark) {
    formula = diatonic[parsed.degreeIndex].seventh ?? resolveFormula(parsed);
  } else {
    formula = resolveFormula(parsed);
  }

  return { root, formula };
}

export function parseProgression(tokens: string[], key: KeyCenter): ChordSpec[] {
  return tokens.map((t) => parseRomanToken(t, key));
}

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
