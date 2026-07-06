import { mod12 } from './notes';
import type { ChordSpec, MidiNote, VoicedChord } from './types';
import { chordToSymbol } from './chordSymbols';
import { chordToRomanNumeral } from './romanNumerals';
import type { KeyCenter } from './types';

const DEFAULT_RANGE: [MidiNote, MidiNote] = [48, 84]; // C3 - C6

function candidatesInRange(pc: number, lo: number, hardCeiling: number): MidiNote[] {
  const out: MidiNote[] = [];
  let start = lo - ((lo - pc) % 12 + 12) % 12;
  for (let m = start; m <= hardCeiling; m += 12) {
    if (m >= lo) out.push(m);
  }
  // Ensure at least one candidate even if the strict range was exhausted.
  if (out.length === 0) {
    let m = pc;
    while (m < lo) m += 12;
    out.push(m);
  }
  return out;
}

/**
 * Build an absolute-MIDI voicing for a chord. When prevVoicing is supplied,
 * chooses octave placements that minimize movement from the previous chord's
 * notes (greedy nearest-available-voice assignment), while keeping notes in
 * ascending stacked order so tensions (9ths/11ths/13ths) sit above the core triad/7th.
 */
export function buildVoicing(
  chord: ChordSpec,
  opts: { prevVoicing?: MidiNote[]; range?: [MidiNote, MidiNote] } = {},
): MidiNote[] {
  const range = opts.range ?? DEFAULT_RANGE;
  const [lo, hi] = range;
  const availablePrev = opts.prevVoicing ? [...opts.prevVoicing] : [];
  const centerRef = availablePrev.length ? availablePrev.reduce((a, b) => a + b, 0) / availablePrev.length : (lo + hi) / 2;

  const assigned: MidiNote[] = [];
  let floor = lo - 1;

  for (const interval of chord.formula.intervals) {
    const pc = mod12(chord.root + interval);
    const candidates = candidatesInRange(pc, floor + 1, hi + 12);
    const refPoints = availablePrev.length ? availablePrev : [centerRef];

    let best = candidates[0];
    let bestCost = Infinity;
    for (const cand of candidates) {
      const cost = Math.min(...refPoints.map((r) => Math.abs(cand - r)));
      if (cost < bestCost) {
        bestCost = cost;
        best = cand;
      }
    }

    assigned.push(best);
    floor = best;

    if (availablePrev.length) {
      let closestIdx = 0;
      let closestDist = Infinity;
      availablePrev.forEach((r, i) => {
        const d = Math.abs(best - r);
        if (d < closestDist) {
          closestDist = d;
          closestIdx = i;
        }
      });
      availablePrev.splice(closestIdx, 1);
    }
  }

  return assigned;
}

export function voiceChord(
  chord: ChordSpec,
  key: KeyCenter | undefined,
  opts: { prevVoicing?: MidiNote[]; range?: [MidiNote, MidiNote] } = {},
): VoicedChord {
  const pitches = buildVoicing(chord, opts);
  return {
    ...chord,
    pitches,
    symbol: chordToSymbol(chord),
    romanNumeral: key ? chordToRomanNumeral(chord, key) : undefined,
  };
}

export function voiceProgression(
  chords: ChordSpec[],
  key: KeyCenter | undefined,
  range: [MidiNote, MidiNote] = DEFAULT_RANGE,
): VoicedChord[] {
  const result: VoicedChord[] = [];
  let prevVoicing: MidiNote[] | undefined;
  for (const chord of chords) {
    const voiced = voiceChord(chord, key, { prevVoicing, range });
    result.push(voiced);
    prevVoicing = voiced.pitches;
  }
  return result;
}
