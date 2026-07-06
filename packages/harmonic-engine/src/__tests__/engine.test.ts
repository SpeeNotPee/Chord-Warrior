import { describe, expect, it } from 'vitest';
import { CHORD_FORMULAS } from '../chordFormulas';
import { diatonicChords } from '../scales';
import { chordToSymbol } from '../chordSymbols';
import { chordToRomanNumeral, parseProgression, parseRomanToken } from '../romanNumerals';
import { buildVoicing, voiceProgression } from '../chordBuilder';
import { PROGRESSION_LIBRARY } from '../library';
import { generateAlgorithmicProgression } from '../algorithmicEngine';
import { HarmonicEngine } from '../harmonicEngine';
import { frequencyToMidi, midiToFrequency, noteNameToPitchClass, pitchClassToName } from '../notes';
import type { KeyCenter } from '../types';

describe('notes', () => {
  it('round-trips note name <-> pitch class', () => {
    expect(noteNameToPitchClass('C')).toBe(0);
    expect(noteNameToPitchClass('F#')).toBe(6);
    expect(pitchClassToName(6)).toBe('F#');
    expect(pitchClassToName(6, true)).toBe('Gb');
  });

  it('maps frequency to MIDI using the standard log2 formula', () => {
    expect(frequencyToMidi(440)).toBeCloseTo(69, 5);
    expect(frequencyToMidi(261.6256)).toBeCloseTo(60, 2); // Middle C
    expect(midiToFrequency(69)).toBeCloseTo(440, 5);
  });
});

describe('diatonicChords', () => {
  it('derives correct triad qualities for C major', () => {
    const key: KeyCenter = { root: 0, scaleType: 'major' };
    const degrees = diatonicChords(key);
    const qualities = degrees.map((d) => d.triad.id);
    expect(qualities).toEqual(['major', 'minor', 'minor', 'major', 'major', 'minor', 'diminished']);
  });

  it('derives correct seventh chord qualities for C major (I maj7, V dom7, vii half-dim7)', () => {
    const key: KeyCenter = { root: 0, scaleType: 'major' };
    const degrees = diatonicChords(key);
    expect(degrees[0].seventh?.id).toBe('maj7');
    expect(degrees[4].seventh?.id).toBe('dom7');
    expect(degrees[6].seventh?.id).toBe('min7b5');
  });

  it('derives correct triad qualities for A harmonic minor (raised leading tone gives major V, dim vii)', () => {
    const key: KeyCenter = { root: 9, scaleType: 'harmonicMinor' };
    const degrees = diatonicChords(key);
    const qualities = degrees.map((d) => d.triad.id);
    // i, ii°, III+, iv, V, VI, vii°
    expect(qualities).toEqual(['minor', 'diminished', 'augmented', 'minor', 'major', 'major', 'diminished']);
  });
});

describe('chordToSymbol', () => {
  it('formats common chord symbols', () => {
    expect(chordToSymbol({ root: 0, formula: CHORD_FORMULAS.major })).toBe('C');
    expect(chordToSymbol({ root: 0, formula: CHORD_FORMULAS.maj7 })).toBe('CΔ7');
    expect(chordToSymbol({ root: 6, formula: CHORD_FORMULAS.min7b5 })).toBe('Gbø7');
  });
});

describe('roman numeral parsing', () => {
  const cMajor: KeyCenter = { root: 0, scaleType: 'major' };

  it('parses plain diatonic triads', () => {
    const ii = parseRomanToken('ii', cMajor);
    expect(ii.root).toBe(2); // D
    expect(ii.formula.id).toBe('minor');
  });

  it('parses diatonic 7th chords using the real diatonic quality', () => {
    const V7 = parseRomanToken('V7', cMajor);
    expect(V7.root).toBe(7); // G
    expect(V7.formula.id).toBe('dom7');

    const IM7 = parseRomanToken('IΔ7', cMajor);
    expect(IM7.root).toBe(0);
    expect(IM7.formula.id).toBe('maj7');
  });

  it('parses secondary dominants relative to the tonicized degree', () => {
    // V7/V in C major = D major triad root a 5th above G (V) -> root D, dominant7
    const secondaryV = parseRomanToken('V7/V', cMajor);
    expect(secondaryV.root).toBe(2); // D
    expect(secondaryV.formula.id).toBe('dom7');
  });

  it('parses chromatic tritone substitution (bII7)', () => {
    const tritoneSub = parseRomanToken('bII7', cMajor);
    expect(tritoneSub.root).toBe(1); // Db
    expect(tritoneSub.formula.id).toBe('dom7');
  });

  it('round-trips chordToRomanNumeral for diatonic chords', () => {
    const ii7 = parseRomanToken('ii7', cMajor);
    expect(chordToRomanNumeral(ii7, cMajor)).toBe('ii7');

    const V = parseRomanToken('V', cMajor);
    expect(chordToRomanNumeral(V, cMajor)).toBe('V');
  });

  it('parses every token in the static progression library without throwing', () => {
    for (const entry of PROGRESSION_LIBRARY) {
      const key: KeyCenter = { root: 0, scaleType: entry.scaleType };
      expect(() => parseProgression(entry.degrees, key)).not.toThrow();
    }
  });
});

describe('voice leading', () => {
  it('produces an ascending stacked voicing for a triad', () => {
    const key: KeyCenter = { root: 0, scaleType: 'major' };
    const chord = parseRomanToken('I', key);
    const voicing = buildVoicing(chord, { range: [48, 84] });
    expect(voicing.length).toBe(3);
    expect(voicing[0] < voicing[1] && voicing[1] < voicing[2]).toBe(true);
  });

  it('minimizes movement between adjacent chords sharing common tones (I -> V should keep some voices close)', () => {
    const key: KeyCenter = { root: 0, scaleType: 'major' };
    const chords = parseProgression(['I', 'V', 'I'], key);
    const voiced = voiceProgression(chords, key);
    expect(voiced).toHaveLength(3);
    // total movement between consecutive chords should be modest (well below a naive re-stack from range floor each time)
    for (let i = 1; i < voiced.length; i++) {
      const prev = voiced[i - 1].pitches;
      const curr = voiced[i].pitches;
      const totalMovement = curr.reduce((sum, note, idx) => sum + Math.abs(note - (prev[idx] ?? note)), 0);
      expect(totalMovement).toBeLessThan(24); // should not leap wildly across octaves
    }
  });
});

describe('algorithmic engine', () => {
  it('generates a progression of the requested length ending on tonic', () => {
    const key: KeyCenter = { root: 0, scaleType: 'major' };
    let seed = 42;
    const rng = () => {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      return (seed % 10000) / 10000;
    };
    const chords = generateAlgorithmicProgression({ key, tier: 1, length: 6, rng });
    expect(chords).toHaveLength(6);
    expect(chords[5].root).toBe(0); // resolves to tonic
    for (const c of chords) {
      expect(c.formula.tier).toBeLessThanOrEqual(1);
    }
  });

  it('respects tier 2 (sevenths) and tier 3 (extended) complexity', () => {
    const key: KeyCenter = { root: 0, scaleType: 'major' };
    const rng = () => 0.5;
    const tier2 = generateAlgorithmicProgression({ key, tier: 2, length: 4, rng });
    expect(tier2.every((c) => c.formula.tier >= 1)).toBe(true);

    const tier3 = generateAlgorithmicProgression({ key, tier: 3, length: 4, rng });
    expect(tier3.some((c) => c.formula.tier === 3)).toBe(true);
  });
});

describe('HarmonicEngine', () => {
  it('generates voiced chords from the static library', () => {
    const engine = new HarmonicEngine();
    const key: KeyCenter = { root: 0, scaleType: 'major' };
    const voiced = engine.generateFromLibrary('ii-V-I-major', key);
    expect(voiced.map((v) => v.symbol)).toEqual(['Dm7', 'G7', 'CΔ7']);
  });

  it('generates voiced chords algorithmically', () => {
    const engine = new HarmonicEngine();
    const voiced = engine.generateAlgorithmic({ key: { root: 2, scaleType: 'major' }, tier: 1, length: 4 });
    expect(voiced).toHaveLength(4);
    expect(voiced[3].pitches.length).toBeGreaterThan(0);
  });
});
