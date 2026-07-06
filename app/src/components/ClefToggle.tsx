import type { Clef } from './StaffRenderer';

const CLEFS: Clef[] = ['treble', 'bass', 'alto', 'tenor'];

export interface ClefToggleProps {
  clef: Clef;
  onChange: (clef: Clef) => void;
}

export function ClefToggle({ clef, onChange }: ClefToggleProps) {
  return (
    <div className="clef-toggle" role="radiogroup" aria-label="Clef">
      {CLEFS.map((c) => (
        <button
          key={c}
          type="button"
          role="radio"
          aria-checked={clef === c}
          className={c === clef ? 'clef-toggle__button clef-toggle__button--active' : 'clef-toggle__button'}
          onClick={() => onChange(c)}
        >
          {c[0].toUpperCase() + c.slice(1)}
        </button>
      ))}
    </div>
  );
}
