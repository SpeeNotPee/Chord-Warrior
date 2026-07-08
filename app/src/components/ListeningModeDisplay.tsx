import { useEffect, useRef, useState } from 'react';
import { playChordArpeggio, playChordOnce } from '../audio/chordSynth';
import type { VoicedChord } from '@chordwarrior/harmonic-engine';

export interface ListeningModeDisplayProps {
  chord: VoicedChord | null;
  /** Automatically play the chord once whenever it changes. */
  autoPlay?: boolean;
}

/** Listening mode: hidden visual prompt, plays the chord via the piano sampler for ear training. */
export function ListeningModeDisplay({ chord, autoPlay = true }: ListeningModeDisplayProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const lastPlayedChordRef = useRef<VoicedChord | null>(null);

  const playBlock = async () => {
    if (!chord || isPlaying) return;
    setIsPlaying(true);
    await playChordOnce(chord.pitches);
    setIsPlaying(false);
  };

  const playArpeggio = async () => {
    if (!chord || isPlaying) return;
    setIsPlaying(true);
    await playChordArpeggio(chord.pitches);
    setIsPlaying(false);
  };

  useEffect(() => {
    if (autoPlay && chord && chord !== lastPlayedChordRef.current) {
      lastPlayedChordRef.current = chord;
      void playBlock();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chord, autoPlay]);

  return (
    <div className="listening-mode-display">
      <div className="listening-mode-display__icon" aria-hidden="true">
        {isPlaying ? '🔊' : '🔈'}
      </div>
      <div className="listening-mode-display__controls">
        <button type="button" onClick={playBlock} disabled={!chord || isPlaying}>
          {isPlaying ? 'Playing...' : 'Replay Chord'}
        </button>
        <button type="button" onClick={playArpeggio} disabled={!chord || isPlaying}>
          Play Arpeggio
        </button>
      </div>
    </div>
  );
}
