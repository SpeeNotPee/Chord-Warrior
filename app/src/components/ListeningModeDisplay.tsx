import { useEffect, useRef, useState } from 'react';
import { playChordOnce } from '../audio/chordSynth';
import type { VoicedChord } from '@chordwarrior/harmonic-engine';

export interface ListeningModeDisplayProps {
  chord: VoicedChord | null;
  /** Automatically play the chord once whenever it changes. */
  autoPlay?: boolean;
}

/** Listening mode: hidden visual prompt, plays the chord once via the synthesis engine for ear training. */
export function ListeningModeDisplay({ chord, autoPlay = true }: ListeningModeDisplayProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const lastPlayedChordRef = useRef<VoicedChord | null>(null);

  const play = async () => {
    if (!chord || isPlaying) return;
    setIsPlaying(true);
    await playChordOnce(chord.pitches);
    setIsPlaying(false);
  };

  useEffect(() => {
    if (autoPlay && chord && chord !== lastPlayedChordRef.current) {
      lastPlayedChordRef.current = chord;
      void play();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chord, autoPlay]);

  return (
    <div className="listening-mode-display">
      <div className="listening-mode-display__icon" aria-hidden="true">
        {isPlaying ? '🔊' : '🔈'}
      </div>
      <button type="button" onClick={play} disabled={!chord || isPlaying}>
        {isPlaying ? 'Playing...' : 'Replay Chord'}
      </button>
    </div>
  );
}
