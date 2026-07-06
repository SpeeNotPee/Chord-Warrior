import { useEffect, useRef } from 'react';
import { Accidental, Formatter, Renderer, Stave, StaveNote } from 'vexflow';
import { midiArrayToVexKeys } from '../notation/midiToVexKey';
import type { MidiNote } from '@chordwarrior/harmonic-engine';

export type Clef = 'treble' | 'bass' | 'alto' | 'tenor';

export interface StaffRendererProps {
  /** Absolute MIDI pitches to render as a single stacked chord notehead. */
  pitches: MidiNote[];
  clef: Clef;
  preferFlats?: boolean;
  width?: number;
  height?: number;
}

/**
 * Renders a single chord (an array of absolute MIDI pitches) on a staff using
 * the given clef. The same MIDI values shift to different graphical
 * positions purely as a function of the clef param -- VexFlow derives the
 * line/space position from the stave's clef, so no separate pitch remapping
 * is needed beyond picking the note's letter name and octave.
 */
export function StaffRenderer({ pitches, clef, preferFlats = false, width = 300, height = 180 }: StaffRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    container.innerHTML = '';

    const renderer = new Renderer(container, Renderer.Backends.SVG);
    renderer.resize(width, height);
    const context = renderer.getContext();

    const stave = new Stave(10, height / 2 - 60, width - 20);
    stave.addClef(clef);
    stave.setContext(context).draw();

    if (pitches.length === 0) return;

    const vexKeys = midiArrayToVexKeys(pitches, preferFlats);
    const note = new StaveNote({ keys: vexKeys.map((k) => k.key), duration: 'w', clef });

    vexKeys.forEach((vk, idx) => {
      if (vk.accidental) note.addModifier(new Accidental(vk.accidental), idx);
    });

    Formatter.FormatAndDraw(context, stave, [note]);
  }, [pitches, clef, preferFlats, width, height]);

  return <div ref={containerRef} className="staff-renderer" />;
}
