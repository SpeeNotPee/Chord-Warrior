import { useEffect, useRef, useState } from 'react';

export interface UseChordTimerOptions {
  enabled: boolean;
  durationSeconds: number;
  /** Changing this value restarts the countdown (e.g. pass the current chord index). */
  resetKey: unknown;
  /** Once true, the countdown stops advancing (the chord's already been solved). */
  isSolved: boolean;
}

export interface UseChordTimerResult {
  remainingSeconds: number;
  expired: boolean;
}

/** Per-chord countdown timer: restarts whenever `resetKey` or `durationSeconds` changes, pauses once `isSolved`. */
export function useChordTimer({ enabled, durationSeconds, resetKey, isSolved }: UseChordTimerOptions): UseChordTimerResult {
  const [remainingSeconds, setRemainingSeconds] = useState(durationSeconds);
  const [expired, setExpired] = useState(false);
  const expiresAtRef = useRef(Date.now() + durationSeconds * 1000);

  useEffect(() => {
    expiresAtRef.current = Date.now() + durationSeconds * 1000;
    setRemainingSeconds(durationSeconds);
    setExpired(false);
  }, [resetKey, durationSeconds]);

  useEffect(() => {
    if (!enabled || isSolved) return;
    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((expiresAtRef.current - Date.now()) / 1000));
      setRemainingSeconds(remaining);
      if (remaining <= 0) {
        setExpired(true);
        clearInterval(interval);
      }
    }, 250);
    return () => clearInterval(interval);
  }, [enabled, isSolved, resetKey, durationSeconds]);

  return { remainingSeconds, expired: enabled && expired };
}
