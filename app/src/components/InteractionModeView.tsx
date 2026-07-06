import { StaffRenderer, type Clef } from './StaffRenderer';
import { ChordNotationDisplay, type NotationStyle } from './ChordNotationDisplay';
import { ListeningModeDisplay } from './ListeningModeDisplay';
import type { VoicedChord } from '@chordwarrior/harmonic-engine';

export type InteractionMode = 'sheetMusic' | 'chordNotation' | 'listening';

export const INTERACTION_MODES: InteractionMode[] = ['sheetMusic', 'chordNotation', 'listening'];

export const INTERACTION_MODE_LABELS: Record<InteractionMode, string> = {
  sheetMusic: 'Sheet Music',
  chordNotation: 'Chord Notation',
  listening: 'Listening',
};

export interface InteractionModeViewProps {
  mode: InteractionMode;
  chord: VoicedChord | null;
  clef: Clef;
  notationStyle: NotationStyle;
}

/**
 * Cycles the visual/audio presentation between the three interaction modes
 * defined in the spec: Sheet Music (silent, VexFlow staff), Chord Notation
 * (silent, text symbol or roman numeral), and Listening (hidden prompt,
 * plays the chord once via the synth engine).
 */
export function InteractionModeView({ mode, chord, clef, notationStyle }: InteractionModeViewProps) {
  switch (mode) {
    case 'sheetMusic':
      return <StaffRenderer pitches={chord?.pitches ?? []} clef={clef} />;
    case 'chordNotation':
      return <ChordNotationDisplay chord={chord} style={notationStyle} />;
    case 'listening':
      return <ListeningModeDisplay chord={chord} />;
  }
}
