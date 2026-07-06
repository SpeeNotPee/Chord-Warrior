import { generateAlgorithmicProgression } from './algorithmicEngine';
import { voiceProgression } from './chordBuilder';
import { PROGRESSION_LIBRARY, progressionsByCategory } from './library';
import { parseProgression } from './romanNumerals';
import type {
  ComplexityTier,
  GenerationOptions,
  KeyCenter,
  MidiNote,
  ProgressionEntry,
  VoicedChord,
} from './types';

export type ProgressionSource =
  | { mode: 'library'; progressionId: string; key: KeyCenter }
  | { mode: 'algorithmic'; options: GenerationOptions };

/**
 * Orchestrates the two progression-generation modes described in the spec:
 * a curated static library of historical/functional progressions, and a
 * rule-based Markov-chain algorithmic generator. Both paths converge on the
 * same voiced-chord output shape so downstream UI/grading code is agnostic
 * to which mode produced the progression.
 */
export class HarmonicEngine {
  listLibraryProgressions(category?: ProgressionEntry['category']): ProgressionEntry[] {
    return category ? progressionsByCategory(category) : PROGRESSION_LIBRARY;
  }

  getLibraryProgression(id: string): ProgressionEntry | undefined {
    return PROGRESSION_LIBRARY.find((p) => p.id === id);
  }

  /** Realize a library progression in a specific key as voiced chords. */
  generateFromLibrary(progressionId: string, key: KeyCenter, range?: [MidiNote, MidiNote]): VoicedChord[] {
    const entry = this.getLibraryProgression(progressionId);
    if (!entry) throw new Error(`Unknown progression: ${progressionId}`);
    const chords = parseProgression(entry.degrees, key);
    return voiceProgression(chords, key, range);
  }

  /** Procedurally generate a progression via the functional-harmony Markov engine. */
  generateAlgorithmic(options: GenerationOptions): VoicedChord[] {
    const chords = generateAlgorithmicProgression({
      key: options.key,
      tier: options.tier as ComplexityTier,
      length: options.length,
    });
    return voiceProgression(chords, options.key, options.range);
  }

  generate(source: ProgressionSource): VoicedChord[] {
    return source.mode === 'library'
      ? this.generateFromLibrary(source.progressionId, source.key)
      : this.generateAlgorithmic(source.options);
  }
}

export const harmonicEngine = new HarmonicEngine();
