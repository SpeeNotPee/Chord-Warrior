import { useEffect, useRef, useState } from 'react';
import { MicrophonePitchStream } from '../audio/microphonePitchStream';
import type { PitchDetectionOptions } from '../audio/pitchDetector';
import type { MidiNote } from '@chordwarrior/harmonic-engine';

export interface UseAudioPitchInputResult {
  detectedNotes: MidiNote[];
  isSupported: boolean;
  isActive: boolean;
  error: string | null;
  start: () => Promise<void>;
  stop: () => void;
}

/** React hook exposing live polyphonic pitch detection from the device microphone. */
export function useAudioPitchInput(detectionOptions?: Partial<PitchDetectionOptions>): UseAudioPitchInputResult {
  const streamRef = useRef<MicrophonePitchStream | null>(null);
  const [detectedNotes, setDetectedNotes] = useState<MidiNote[]>([]);
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!streamRef.current) streamRef.current = new MicrophonePitchStream(detectionOptions);
  const stream = streamRef.current;

  useEffect(() => {
    const unsubscribe = stream.onPitches(setDetectedNotes);
    return () => {
      unsubscribe();
      stream.stop();
    };
  }, [stream]);

  const start = async () => {
    try {
      await stream.start();
      setIsActive(true);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setIsActive(false);
    }
  };

  const stop = () => {
    stream.stop();
    setIsActive(false);
    setDetectedNotes([]);
  };

  return { detectedNotes, isSupported: stream.isSupported, isActive, error, start, stop };
}
