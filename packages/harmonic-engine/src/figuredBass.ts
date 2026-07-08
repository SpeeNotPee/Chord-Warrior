import type { ChordSpec } from './types';

/**
 * Root-position figured-bass numerals per chord formula. The engine doesn't
 * model inversions (every generated voicing stacks root-third-fifth-...
 * from the bass up), so these are always the root-position figures; a
 * genuine inversion-aware figure (6, 6/4, 6/5, 4/3, 4/2, ...) would need the
 * voicing to track which chord tone is in the bass.
 */
const FIGURED_BASS_BY_FORMULA: Record<string, string> = {
  major: '5',
  minor: '5',
  diminished: '5♭',
  augmented: '5♯',
  sus2: '2',
  sus4: '4',

  maj7: '7',
  dom7: '7',
  min7: '7',
  min7b5: '7♭5',
  dim7: '°7',
  minMaj7: '7',
  augMaj7: '7',
  dom7sus4: '7',

  add9: '9',
  minAdd9: '9',
  maj9: '9',
  dom9: '9',
  min9: '9',
  minMaj9: '9',
  dom7sharp9: '7♯9',
  dom7flat9: '7♭9',
  dom13: '13',
  maj7sharp11: '7♯11',
  min11: '11',
};

/** Format a ChordSpec as a root-position figured-bass numeral string, e.g. "7", "7♭5", "9". */
export function chordToFiguredBass(chord: ChordSpec): string {
  return FIGURED_BASS_BY_FORMULA[chord.formula.id] ?? chord.formula.symbolSuffix;
}
