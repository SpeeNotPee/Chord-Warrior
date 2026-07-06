import * as Tone from 'tone';
import { midiToFrequency, type MidiNote } from '@chordwarrior/harmonic-engine';

let synth: Tone.PolySynth | null = null;

function getSynth(): Tone.PolySynth {
  if (!synth) synth = new Tone.PolySynth(Tone.Synth).toDestination();
  return synth;
}

/** Play a chord's pitches once, simultaneously, for ear-training "Listening" mode. */
export async function playChordOnce(pitches: MidiNote[], durationSeconds = 1.5): Promise<void> {
  if (pitches.length === 0) return;
  await Tone.start();
  const freqs = pitches.map((m) => midiToFrequency(m));
  getSynth().triggerAttackRelease(freqs, durationSeconds);
}

export function disposeChordSynth(): void {
  synth?.dispose();
  synth = null;
}
