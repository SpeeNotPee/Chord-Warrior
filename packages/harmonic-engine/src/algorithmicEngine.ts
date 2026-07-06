import { CHORD_FORMULAS } from './chordFormulas';
import { diatonicChords } from './scales';
import type { ChordFormula, ChordSpec, ComplexityTier, FunctionalCategory, KeyCenter, ScaleType } from './types';

interface DegreeWeight {
  degreeIndex: number;
  category: FunctionalCategory;
  weight: number;
}

/** Functional-harmony role and selection weight for each scale degree, per scale type. */
const FUNCTIONAL_MAP: Record<ScaleType, DegreeWeight[]> = {
  major: [
    { degreeIndex: 0, category: 'tonic', weight: 2 },
    { degreeIndex: 1, category: 'predominant', weight: 1 },
    { degreeIndex: 2, category: 'tonic', weight: 0.5 },
    { degreeIndex: 3, category: 'predominant', weight: 1.5 },
    { degreeIndex: 4, category: 'dominant', weight: 2 },
    { degreeIndex: 5, category: 'tonic', weight: 1 },
    { degreeIndex: 6, category: 'dominant', weight: 0.5 },
  ],
  naturalMinor: [
    { degreeIndex: 0, category: 'tonic', weight: 2 },
    { degreeIndex: 1, category: 'predominant', weight: 1 },
    { degreeIndex: 2, category: 'tonic', weight: 0.5 },
    { degreeIndex: 3, category: 'predominant', weight: 1.5 },
    { degreeIndex: 4, category: 'dominant', weight: 1.5 },
    { degreeIndex: 5, category: 'tonic', weight: 1 },
    { degreeIndex: 6, category: 'dominant', weight: 0.5 },
  ],
  harmonicMinor: [
    { degreeIndex: 0, category: 'tonic', weight: 2 },
    { degreeIndex: 1, category: 'predominant', weight: 1 },
    { degreeIndex: 2, category: 'tonic', weight: 0.5 },
    { degreeIndex: 3, category: 'predominant', weight: 1.5 },
    { degreeIndex: 4, category: 'dominant', weight: 2 },
    { degreeIndex: 5, category: 'tonic', weight: 1 },
    { degreeIndex: 6, category: 'dominant', weight: 0.5 },
  ],
};

/** Functional-harmony Markov transition probabilities. */
const TRANSITIONS: Record<FunctionalCategory, Record<FunctionalCategory, number>> = {
  tonic: { tonic: 0.2, predominant: 0.45, dominant: 0.35 },
  predominant: { tonic: 0.05, predominant: 0.15, dominant: 0.8 },
  dominant: { tonic: 0.7, predominant: 0.05, dominant: 0.25 },
};

const TIER3_POOL: Record<ChordFormula['category'], string[]> = {
  major: ['maj9', 'add9', 'maj7sharp11'],
  minor: ['min9', 'minAdd9', 'minMaj9', 'min11'],
  dominant: ['dom9', 'dom13', 'dom7sharp9', 'dom7flat9'],
  diminished: ['dim7', 'min7b5'],
  augmented: ['augMaj7'],
  other: ['add9'],
};

function weightedChoice<T>(items: { value: T; weight: number }[], rng: () => number): T {
  const total = items.reduce((sum, i) => sum + i.weight, 0);
  let r = rng() * total;
  for (const item of items) {
    r -= item.weight;
    if (r <= 0) return item.value;
  }
  return items[items.length - 1].value;
}

function nextCategory(current: FunctionalCategory, rng: () => number): FunctionalCategory {
  const row = TRANSITIONS[current];
  return weightedChoice(
    (Object.keys(row) as FunctionalCategory[]).map((cat) => ({ value: cat, weight: row[cat] })),
    rng,
  );
}

function pickDegreeForCategory(scaleType: ScaleType, category: FunctionalCategory, rng: () => number): number {
  const candidates = FUNCTIONAL_MAP[scaleType].filter((d) => d.category === category);
  return weightedChoice(
    candidates.map((c) => ({ value: c.degreeIndex, weight: c.weight })),
    rng,
  );
}

function decorateToTier(baseFormula: ChordFormula, tier: ComplexityTier, rng: () => number): ChordFormula {
  if (tier <= baseFormula.tier || tier < 2) return baseFormula;
  if (tier === 2) {
    // Already tier-2-or-below formulas pass through; nothing further to do here since
    // diatonicChords already supplies the 7th-chord formula when requested.
    return baseFormula;
  }
  const pool = TIER3_POOL[baseFormula.category];
  if (!pool || pool.length === 0) return baseFormula;
  const choiceId = pool[Math.floor(rng() * pool.length)];
  return CHORD_FORMULAS[choiceId] ?? baseFormula;
}

export interface AlgorithmicGenerationParams {
  key: KeyCenter;
  tier: ComplexityTier;
  length: number;
  /** Injectable RNG for deterministic tests; defaults to Math.random. */
  rng?: () => number;
}

/**
 * Procedurally generate a chord progression using a Markov-chain model of
 * functional harmony (Tonic -> Predominant -> Dominant -> Tonic tendencies),
 * constrained to the given key's diatonic scale degrees and decorated up to
 * the requested complexity tier.
 */
export function generateAlgorithmicProgression(params: AlgorithmicGenerationParams): ChordSpec[] {
  const { key, tier, length } = params;
  const rng = params.rng ?? Math.random;
  const diatonic = diatonicChords(key);

  const categories: FunctionalCategory[] = ['tonic'];
  for (let i = 1; i < length; i++) {
    categories.push(nextCategory(categories[i - 1], rng));
  }
  // Resolve to a satisfying final cadence on the tonic degree.
  if (length > 1) categories[length - 1] = 'tonic';

  const chords: ChordSpec[] = categories.map((category, i) => {
    const degreeIndex =
      i === length - 1 && length > 1 ? 0 : pickDegreeForCategory(key.scaleType, category, rng);
    const degree = diatonic[degreeIndex];
    const baseFormula = tier === 1 ? degree.triad : degree.seventh ?? degree.triad;
    const formula = decorateToTier(baseFormula, tier, rng);
    return { root: degree.root, formula };
  });

  return chords;
}
