import { describe, expect, it } from 'vitest';
import { midiToVexKey } from '../midiToVexKey';

describe('midiToVexKey', () => {
  it('maps Middle C (MIDI 60) to c/4', () => {
    expect(midiToVexKey(60)).toEqual({ key: 'c/4', accidental: null });
  });

  it('maps sharps by default', () => {
    expect(midiToVexKey(61)).toEqual({ key: 'c#/4', accidental: '#' });
  });

  it('maps flats when preferFlats is set', () => {
    expect(midiToVexKey(61, true)).toEqual({ key: 'db/4', accidental: 'b' });
  });

  it('maps octave boundaries correctly', () => {
    expect(midiToVexKey(59)).toEqual({ key: 'b/3', accidental: null }); // B3 just below middle C
    expect(midiToVexKey(72)).toEqual({ key: 'c/5', accidental: null }); // C5
  });
});
