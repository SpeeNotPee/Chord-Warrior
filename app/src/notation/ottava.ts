import type { MidiNote } from '@chordwarrior/harmonic-engine';
import type { Clef } from '../components/StaffRenderer';

export type OttavaLabel = '8va' | '8vb' | '15ma' | '15mb';

export interface OttavaShift {
  /** Subtract this from each actual MIDI pitch to get the written/displayed pitch. */
  shiftSemitones: number;
  label: OttavaLabel | null;
}

/** Bottom/top staff-line MIDI pitches per clef (the 5-line staff's outer boundaries). */
const STAFF_RANGE: Record<Clef, [number, number]> = {
  treble: [64, 77], // E4 - F5
  bass: [43, 57], // G2 - A3
  alto: [53, 67], // F3 - G4
  tenor: [50, 64], // D3 - E4
};

/** Beyond this many semitones outside the staff, switch to an ottava marking instead of stacking ledger lines. */
const LEDGER_THRESHOLD_SEMITONES = 7;

function distanceFromStaff(midi: number, [lo, hi]: [number, number]): number {
  if (midi < lo) return lo - midi;
  if (midi > hi) return midi - hi;
  return 0;
}

const OTTAVA_LABELS: Record<number, OttavaLabel> = { 1: '8va', 2: '15ma', [-1]: '8vb', [-2]: '15mb' };

/**
 * Decide whether a chord should be displayed shifted by one or two octaves
 * (with an 8va/8vb/15ma/15mb marking) rather than rendered with a pile of
 * ledger lines. The whole chord renders as a single stacked notehead on one
 * staff, so only the chord's average position (not each note individually)
 * drives the decision.
 */
export function computeOttavaShift(pitches: MidiNote[], clef: Clef): OttavaShift {
  if (pitches.length === 0) return { shiftSemitones: 0, label: null };

  const range = STAFF_RANGE[clef];
  const maxDistance = Math.max(...pitches.map((p) => distanceFromStaff(p, range)));
  if (maxDistance <= LEDGER_THRESHOLD_SEMITONES) return { shiftSemitones: 0, label: null };

  const avg = pitches.reduce((a, b) => a + b, 0) / pitches.length;
  const center = (range[0] + range[1]) / 2;
  const octaves = Math.max(-2, Math.min(2, Math.round((avg - center) / 12)));
  if (octaves === 0) return { shiftSemitones: 0, label: null };

  return { shiftSemitones: octaves * 12, label: OTTAVA_LABELS[octaves] };
}
