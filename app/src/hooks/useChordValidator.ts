import { useMemo } from 'react';
import { useMidiInput, type UseMidiInputResult } from './useMidiInput';
import { useAudioPitchInput, type UseAudioPitchInputResult } from './useAudioPitchInput';
import { gradeChord, type GradingResult, type GradingStrictness } from '../validation/grading';
import type { MidiNote, VoicedChord } from '@chordwarrior/harmonic-engine';
import type { PitchDetectionOptions } from '../audio/pitchDetector';

export interface UseChordValidatorResult {
  /** Union of currently-held MIDI notes and currently-detected microphone pitches. */
  verifiedPitches: MidiNote[];
  midi: UseMidiInputResult;
  audio: UseAudioPitchInputResult;
  /** Grading result against the target chord, or null if no target is set. */
  result: GradingResult | null;
}

/**
 * Runs the two concurrent input-validation listeners (MIDI + microphone FFT
 * pitch detection) described in the spec's Grader pipeline, merges their
 * output into a single verified-pitch array, and grades it against a target
 * chord under the selected strictness setting.
 */
export function useChordValidator(
  target: VoicedChord | null,
  strictness: GradingStrictness,
  audioDetectionOptions?: Partial<PitchDetectionOptions>,
): UseChordValidatorResult {
  const midi = useMidiInput();
  const audio = useAudioPitchInput(audioDetectionOptions);

  const verifiedPitches = useMemo(() => {
    return Array.from(new Set([...midi.heldNotes, ...audio.detectedNotes])).sort((a, b) => a - b);
  }, [midi.heldNotes, audio.detectedNotes]);

  const result = useMemo(() => {
    if (!target) return null;
    return gradeChord(target, verifiedPitches, strictness);
  }, [target, verifiedPitches, strictness]);

  return { verifiedPitches, midi, audio, result };
}
