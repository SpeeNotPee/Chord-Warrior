import { generateAlgorithmicProgression } from './algorithmicEngine';
import { voiceProgression } from './chordBuilder';
import type { GenerationOptions, VoicedChord } from './types';

/**
 * Orchestrates algorithmic chord-progression generation: a rule-based
 * Markov-chain functional-harmony generator, voiced into absolute MIDI
 * pitches ready for display/grading.
 */
export class HarmonicEngine {
  /** Procedurally generate a progression via the functional-harmony Markov engine. */
  generateAlgorithmic(options: GenerationOptions): VoicedChord[] {
    const chords = generateAlgorithmicProgression({
      key: options.key,
      tier: options.tier,
      length: options.length,
      decorateProbability: options.decorateProbability,
    });
    return voiceProgression(chords, options.key, options.range);
  }
}

export const harmonicEngine = new HarmonicEngine();
