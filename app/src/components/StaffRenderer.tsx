import { useEffect, useRef } from 'react';
import { Accidental, Annotation, AnnotationVerticalJustify, Formatter, Renderer, Stave, StaveNote } from 'vexflow';
import { midiArrayToVexKeys } from '../notation/midiToVexKey';
import { computeOttavaShift } from '../notation/ottava';
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
 * is needed beyond picking the note's letter name and octave. Chords that
 * would need a pile of ledger lines are instead displayed shifted an octave
 * (or two) closer to the staff with an 8va/8vb/15ma/15mb marking, matching
 * how this is conventionally notated to keep the staff readable.
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

    const { shiftSemitones, label } = computeOttavaShift(pitches, clef);
    const displayPitches = shiftSemitones === 0 ? pitches : pitches.map((p) => p - shiftSemitones);

    const vexKeys = midiArrayToVexKeys(displayPitches, preferFlats);
    const note = new StaveNote({ keys: vexKeys.map((k) => k.key), duration: 'w', clef });

    vexKeys.forEach((vk, idx) => {
      if (vk.accidental) note.addModifier(new Accidental(vk.accidental), idx);
    });

    if (label) {
      const vj = label === '8vb' || label === '15mb' ? AnnotationVerticalJustify.BOTTOM : AnnotationVerticalJustify.TOP;
      note.addModifier(new Annotation(label).setVerticalJustification(vj), 0);
    }

    Formatter.FormatAndDraw(context, stave, [note]);
  }, [pitches, clef, preferFlats, width, height]);

  return <div ref={containerRef} className="staff-renderer" />;
}
