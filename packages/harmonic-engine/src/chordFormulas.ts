import type { ChordFormula } from './types';

/**
 * Chord formula library: semitone intervals from the root.
 * Intervals beyond 11 (e.g. 14 for a 9th) represent upper-structure tones
 * that should be voiced above the octave rather than collapsed to a pitch class.
 */
export const CHORD_FORMULAS: Record<string, ChordFormula> = {
  // --- Tier 1: diatonic triads ---
  major: { id: 'major', intervals: [0, 4, 7], symbolSuffix: '', category: 'major', tier: 1, name: 'Major' },
  minor: { id: 'minor', intervals: [0, 3, 7], symbolSuffix: 'm', category: 'minor', tier: 1, name: 'Minor' },
  diminished: { id: 'diminished', intervals: [0, 3, 6], symbolSuffix: '°', category: 'diminished', tier: 1, name: 'Diminished' },
  augmented: { id: 'augmented', intervals: [0, 4, 8], symbolSuffix: '+', category: 'augmented', tier: 1, name: 'Augmented' },
  sus2: { id: 'sus2', intervals: [0, 2, 7], symbolSuffix: 'sus2', category: 'other', tier: 1, name: 'Suspended 2nd' },
  sus4: { id: 'sus4', intervals: [0, 5, 7], symbolSuffix: 'sus4', category: 'other', tier: 1, name: 'Suspended 4th' },

  // --- Tier 2: standard 7th chords ---
  maj7: { id: 'maj7', intervals: [0, 4, 7, 11], symbolSuffix: 'Δ7', category: 'major', tier: 2, name: 'Major 7th' },
  dom7: { id: 'dom7', intervals: [0, 4, 7, 10], symbolSuffix: '7', category: 'dominant', tier: 2, name: 'Dominant 7th' },
  min7: { id: 'min7', intervals: [0, 3, 7, 10], symbolSuffix: 'm7', category: 'minor', tier: 2, name: 'Minor 7th' },
  min7b5: { id: 'min7b5', intervals: [0, 3, 6, 10], symbolSuffix: 'ø7', category: 'diminished', tier: 2, name: 'Half-Diminished 7th' },
  dim7: { id: 'dim7', intervals: [0, 3, 6, 9], symbolSuffix: '°7', category: 'diminished', tier: 2, name: 'Diminished 7th' },
  minMaj7: { id: 'minMaj7', intervals: [0, 3, 7, 11], symbolSuffix: 'mΔ7', category: 'minor', tier: 2, name: 'Minor-Major 7th' },
  augMaj7: { id: 'augMaj7', intervals: [0, 4, 8, 11], symbolSuffix: '+Δ7', category: 'augmented', tier: 2, name: 'Augmented Major 7th' },
  dom7sus4: { id: 'dom7sus4', intervals: [0, 5, 7, 10], symbolSuffix: '7sus4', category: 'dominant', tier: 2, name: 'Dominant 7 Suspended 4th' },

  // --- Tier 3: extended / altered chords ---
  add9: { id: 'add9', intervals: [0, 4, 7, 14], symbolSuffix: 'add9', category: 'major', tier: 3, name: 'Add 9' },
  minAdd9: { id: 'minAdd9', intervals: [0, 3, 7, 14], symbolSuffix: 'm(add9)', category: 'minor', tier: 3, name: 'Minor Add 9' },
  maj9: { id: 'maj9', intervals: [0, 4, 7, 11, 14], symbolSuffix: 'Δ9', category: 'major', tier: 3, name: 'Major 9th' },
  dom9: { id: 'dom9', intervals: [0, 4, 7, 10, 14], symbolSuffix: '9', category: 'dominant', tier: 3, name: 'Dominant 9th' },
  min9: { id: 'min9', intervals: [0, 3, 7, 10, 14], symbolSuffix: 'm9', category: 'minor', tier: 3, name: 'Minor 9th' },
  minMaj9: { id: 'minMaj9', intervals: [0, 3, 7, 11, 14], symbolSuffix: 'mΔ(9)', category: 'minor', tier: 3, name: 'Minor-Major 9th' },
  dom7sharp9: { id: 'dom7sharp9', intervals: [0, 4, 7, 10, 15], symbolSuffix: '7♯9', category: 'dominant', tier: 3, name: 'Dominant 7♯9' },
  dom7flat9: { id: 'dom7flat9', intervals: [0, 4, 7, 10, 13], symbolSuffix: '7♭9', category: 'dominant', tier: 3, name: 'Dominant 7♭9' },
  dom13: { id: 'dom13', intervals: [0, 4, 7, 10, 14, 21], symbolSuffix: '13', category: 'dominant', tier: 3, name: 'Dominant 13th' },
  maj7sharp11: { id: 'maj7sharp11', intervals: [0, 4, 7, 11, 18], symbolSuffix: 'Δ7(♯11)', category: 'major', tier: 3, name: 'Major 7♯11' },
  min11: { id: 'min11', intervals: [0, 3, 7, 10, 14, 17], symbolSuffix: 'm11', category: 'minor', tier: 3, name: 'Minor 11th' },
};

export const TRIAD_FORMULAS = ['major', 'minor', 'diminished', 'augmented'] as const;
export const SEVENTH_FORMULAS = ['maj7', 'dom7', 'min7', 'min7b5', 'dim7', 'minMaj7'] as const;

export function formulasByTier(tier: 1 | 2 | 3): ChordFormula[] {
  return Object.values(CHORD_FORMULAS).filter((f) => f.tier === tier);
}

export function formulasByCategory(category: ChordFormula['category']): ChordFormula[] {
  return Object.values(CHORD_FORMULAS).filter((f) => f.category === category);
}
