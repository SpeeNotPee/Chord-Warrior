import { useEffect, useRef, useState } from 'react';
import { MidiInputTracker } from '../midi/midiInput';
import type { MidiNote } from '@chordwarrior/harmonic-engine';

export interface UseMidiInputResult {
  heldNotes: MidiNote[];
  isSupported: boolean;
  isActive: boolean;
  error: string | null;
  start: () => Promise<void>;
  stop: () => void;
}

/** React hook exposing live held-note state from all connected Web MIDI inputs. */
export function useMidiInput(): UseMidiInputResult {
  const trackerRef = useRef<MidiInputTracker | null>(null);
  const [heldNotes, setHeldNotes] = useState<MidiNote[]>([]);
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!trackerRef.current) trackerRef.current = new MidiInputTracker();
  const tracker = trackerRef.current;

  useEffect(() => {
    const unsubscribe = tracker.onChange(setHeldNotes);
    return () => {
      unsubscribe();
      tracker.stop();
    };
  }, [tracker]);

  const start = async () => {
    try {
      await tracker.start();
      setIsActive(true);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setIsActive(false);
    }
  };

  const stop = () => {
    tracker.stop();
    setIsActive(false);
    setHeldNotes([]);
  };

  return { heldNotes, isSupported: tracker.isSupported, isActive, error, start, stop };
}
