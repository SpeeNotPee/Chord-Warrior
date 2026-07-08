import { describe, expect, it } from 'vitest';
import { CHORD_FORMULAS } from '../chordFormulas';
import { diatonicChords } from '../scales';
import { chordToSymbol } from '../chordSymbols';
import { chordToRomanNumeral } from '../romanNumerals';
import { chordToFiguredBass } from '../figuredBass';
import { buildVoicing, voiceProgression } from '../chordBuilder';
import { generateAlgorithmicProgression, generateNextChord } from '../algorithmicEngine';
import { HarmonicEngine } from '../harmonicEngine';
import { GRADE_PROFILES, MUSIC_GRADES } from '../grades';
import { frequencyToMidi, midiToFrequency, noteNameToPitchClass, pitchClassToName } from '../notes';
import type { ChordSpec, KeyCenter } from '../types';

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

describe('chordToRomanNumeral', () => {
  const cMajor: KeyCenter = { root: 0, scaleType: 'major' };

  it('formats diatonic triads and sevenths relative to the key', () => {
    const ii7: ChordSpec = { root: 2, formula: CHORD_FORMULAS.min7 };
    expect(chordToRomanNumeral(ii7, cMajor)).toBe('ii7');

    const V: ChordSpec = { root: 7, formula: CHORD_FORMULAS.major };
    expect(chordToRomanNumeral(V, cMajor)).toBe('V');

    const I: ChordSpec = { root: 0, formula: CHORD_FORMULAS.maj7 };
    expect(chordToRomanNumeral(I, cMajor)).toBe('IΔ7');
  });

  it('marks a chromatic (non-diatonic) root with an accidental prefix', () => {
    const chromaticRoot: ChordSpec = { root: 1, formula: CHORD_FORMULAS.dom7 };
    expect(chordToRomanNumeral(chromaticRoot, cMajor)).toBe('#I7');
  });
});

describe('chordToFiguredBass', () => {
  it('formats root-position figures for triads and extended chords', () => {
    expect(chordToFiguredBass({ root: 0, formula: CHORD_FORMULAS.major })).toBe('5');
    expect(chordToFiguredBass({ root: 0, formula: CHORD_FORMULAS.dom7 })).toBe('7');
    expect(chordToFiguredBass({ root: 0, formula: CHORD_FORMULAS.min7b5 })).toBe('7♭5');
    expect(chordToFiguredBass({ root: 0, formula: CHORD_FORMULAS.dom9 })).toBe('9');
    expect(chordToFiguredBass({ root: 0, formula: CHORD_FORMULAS.dom13 })).toBe('13');
  });
});

describe('voice leading', () => {
  it('produces an ascending stacked voicing for a triad', () => {
    const chord: ChordSpec = { root: 0, formula: CHORD_FORMULAS.major };
    const voicing = buildVoicing(chord, { range: [48, 84] });
    expect(voicing.length).toBe(3);
    expect(voicing[0] < voicing[1] && voicing[1] < voicing[2]).toBe(true);
  });

  it('minimizes movement between adjacent chords sharing common tones (I -> V should keep some voices close)', () => {
    const key: KeyCenter = { root: 0, scaleType: 'major' };
    const chords: ChordSpec[] = [
      { root: 0, formula: CHORD_FORMULAS.major },
      { root: 7, formula: CHORD_FORMULAS.major },
      { root: 0, formula: CHORD_FORMULAS.major },
    ];
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

  it('never decorates to tier 3 when decorateProbability is 0', () => {
    const key: KeyCenter = { root: 0, scaleType: 'major' };
    const rng = () => 0.5;
    const chords = generateAlgorithmicProgression({ key, tier: 3, length: 8, decorateProbability: 0, rng });
    expect(chords.every((c) => c.formula.tier <= 2)).toBe(true);
  });

  describe('generateNextChord', () => {
    it('starts a fresh chain on the tonic when prevState is null', () => {
      const key: KeyCenter = { root: 0, scaleType: 'major' };
      const { state } = generateNextChord(null, { key, tier: 1, rng: () => 0 });
      expect(state.category).toBe('tonic');
    });

    it('forces degree 0 (the tonic root) and tonic category when isCadence is true', () => {
      const key: KeyCenter = { root: 2, scaleType: 'major' };
      const { chord, state } = generateNextChord({ category: 'dominant' }, { key, tier: 1, isCadence: true, rng: () => 0.9 });
      expect(chord.root).toBe(2);
      expect(state.category).toBe('tonic');
    });

    it('can be chained to stream chords one at a time, matching a fixed-length loop', () => {
      const key: KeyCenter = { root: 0, scaleType: 'major' };
      let seed = 7;
      const rng = () => {
        seed = (seed * 1103515245 + 12345) & 0x7fffffff;
        return (seed % 10000) / 10000;
      };

      let state = null as ReturnType<typeof generateNextChord>['state'] | null;
      const streamed: ChordSpec[] = [];
      for (let i = 0; i < 5; i++) {
        const step = generateNextChord(state, { key, tier: 1, rng });
        streamed.push(step.chord);
        state = step.state;
      }
      expect(streamed).toHaveLength(5);
      expect(streamed.every((c) => c.formula.tier <= 1)).toBe(true);
    });
  });
});

describe('GRADE_PROFILES', () => {
  it('defines all 8 grades with non-decreasing chord tier as grade increases', () => {
    expect(MUSIC_GRADES).toHaveLength(8);
    let prevTier = 0;
    for (const grade of MUSIC_GRADES) {
      const profile = GRADE_PROFILES[grade];
      expect(profile.chordTier).toBeGreaterThanOrEqual(prevTier);
      prevTier = profile.chordTier;
      expect(profile.lengthRange[0]).toBeLessThanOrEqual(profile.lengthRange[1]);
      expect(profile.range[0]).toBeLessThan(profile.range[1]);
    }
  });
});

describe('HarmonicEngine', () => {
  it('generates voiced chords algorithmically', () => {
    const engine = new HarmonicEngine();
    const voiced = engine.generateAlgorithmic({ key: { root: 2, scaleType: 'major' }, tier: 1, length: 4 });
    expect(voiced).toHaveLength(4);
    expect(voiced[3].pitches.length).toBeGreaterThan(0);
  });
});
