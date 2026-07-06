import { pitchClassToName } from './notes';
import type { ChordSpec } from './types';

const FLAT_PREFERRED_SUFFIXES = new Set(['min7b5']);

/** Format a ChordSpec as a plain chord symbol, e.g. "C", "F#m7b5", "Bbadd9". */
export function chordToSymbol(chord: ChordSpec, preferFlats = false): string {
  const useFlats = preferFlats || FLAT_PREFERRED_SUFFIXES.has(chord.formula.id);
  const rootName = pitchClassToName(chord.root, useFlats);
  const bass = chord.bass !== undefined ? `/${pitchClassToName(chord.bass, useFlats)}` : '';
  return `${rootName}${chord.formula.symbolSuffix}${bass}`;
}
