import { chordToFiguredBass, type VoicedChord } from '@chordwarrior/harmonic-engine';

export type NotationStyle = 'symbol' | 'roman' | 'figuredBass';

export interface ChordNotationDisplayProps {
  chord: VoicedChord | null;
  style: NotationStyle;
}

/** Chord Notation mode: raw text chord symbols (e.g. "CΔ7"), Roman numerals (e.g. "ii7"), or figured bass (e.g. "7"). */
export function ChordNotationDisplay({ chord, style }: ChordNotationDisplayProps) {
  if (!chord) return <div className="chord-notation-display chord-notation-display--empty">--</div>;

  const text =
    style === 'roman' ? chord.romanNumeral ?? chord.symbol : style === 'figuredBass' ? chordToFiguredBass(chord) : chord.symbol;

  return (
    <div className="chord-notation-display">
      <span className="chord-notation-display__text">{text}</span>
    </div>
  );
}
