import type { MidiNote } from '@chordwarrior/harmonic-engine';

export interface PianoKeyboardProps {
  /** Notes to highlight as "correct", e.g. the target chord on a timed-out reveal. */
  highlightedNotes?: MidiNote[];
  /** Notes the user actually played, shown distinctly when they don't land on a highlighted key. */
  playedNotes?: MidiNote[];
  width?: number;
  height?: number;
}

const WHITE_PITCH_CLASSES = new Set([0, 2, 4, 5, 7, 9, 11]);

function isWhiteKey(midi: MidiNote): boolean {
  return WHITE_PITCH_CLASSES.has(((midi % 12) + 12) % 12);
}

// Full standard 88-key piano range: A0 (21) through C8 (108) inclusive.
const START_MIDI = 21;
const END_MIDI = 109;

/** On-screen piano keyboard spanning the full 88-key range, highlighting given MIDI notes (e.g. for a timer-expiry reveal). */
export function PianoKeyboard({ highlightedNotes = [], playedNotes = [], width = 1200, height = 110 }: PianoKeyboardProps) {
  const highlightedSet = new Set(highlightedNotes);
  const playedSet = new Set(playedNotes);

  const midiRange = Array.from({ length: END_MIDI - START_MIDI }, (_, i) => START_MIDI + i);
  const whiteCount = midiRange.filter(isWhiteKey).length;
  const whiteWidth = width / whiteCount;
  const blackWidth = whiteWidth * 0.6;
  const blackHeight = height * 0.6;

  const whiteKeys: { midi: MidiNote; x: number }[] = [];
  const blackKeys: { midi: MidiNote; x: number }[] = [];
  let whiteIndex = 0;
  for (const midi of midiRange) {
    if (isWhiteKey(midi)) {
      whiteKeys.push({ midi, x: whiteIndex * whiteWidth });
      whiteIndex++;
    } else {
      blackKeys.push({ midi, x: whiteIndex * whiteWidth - blackWidth / 2 });
    }
  }

  function keyFill(midi: MidiNote, isBlack: boolean): string {
    if (highlightedSet.has(midi)) return 'var(--correct)';
    if (playedSet.has(midi)) return 'var(--incorrect)';
    return isBlack ? 'var(--piano-key-black)' : 'var(--piano-key-white)';
  }

  return (
    <svg
      className="piano-keyboard"
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label="Piano keyboard"
    >
      {whiteKeys.map(({ midi, x }) => (
        <rect key={midi} x={x} y={0} width={whiteWidth} height={height} fill={keyFill(midi, false)} className="piano-keyboard__white-key" />
      ))}
      {blackKeys.map(({ midi, x }) => (
        <rect key={midi} x={x} y={0} width={blackWidth} height={blackHeight} fill={keyFill(midi, true)} className="piano-keyboard__black-key" />
      ))}
    </svg>
  );
}
