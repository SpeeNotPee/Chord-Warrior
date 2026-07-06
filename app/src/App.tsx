import { useEffect } from 'react';
import { useAppStore } from './store/useAppStore';
import { useChordValidator } from './hooks/useChordValidator';
import { PROGRESSION_LIBRARY, SCALE_INTERVALS, SHARP_NAMES, type ScaleType } from '@chordwarrior/harmonic-engine';
import { InteractionModeView, INTERACTION_MODES, INTERACTION_MODE_LABELS } from './components/InteractionModeView';
import { ClefToggle } from './components/ClefToggle';
import type { GradingStrictness } from './validation/grading';
import './App.css';

const SCALE_TYPE_LABELS: Record<ScaleType, string> = {
  major: 'Major',
  naturalMinor: 'Natural Minor',
  harmonicMinor: 'Harmonic Minor',
};

const CATEGORY_LABELS: Record<(typeof PROGRESSION_LIBRARY)[number]['category'], string> = {
  baroque: 'Baroque / Classical',
  jazz: 'Jazz',
  pop: 'Pop / Rock',
};

function App() {
  const {
    key,
    tier,
    progressionMode,
    libraryProgressionId,
    algorithmicLength,
    clef,
    notationStyle,
    interactionMode,
    strictness,
    progression,
    currentIndex,
    setKeyRoot,
    setScaleType,
    setTier,
    setProgressionMode,
    setLibraryProgressionId,
    setAlgorithmicLength,
    setClef,
    setNotationStyle,
    setInteractionMode,
    setStrictness,
    generateProgression,
    next,
    prev,
  } = useAppStore();

  useEffect(() => {
    generateProgression();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const currentChord = progression[currentIndex] ?? null;
  const { verifiedPitches, midi, audio, result } = useChordValidator(currentChord, strictness);

  useEffect(() => {
    if (result?.isCorrect) {
      const timeout = setTimeout(next, 700);
      return () => clearTimeout(timeout);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result?.isCorrect]);

  return (
    <div className="app">
      <header className="app__header">
        <h1>ChordWarrior</h1>
        <p className="app__subtitle">Sight-reading, ear-training &amp; chord recognition drills</p>
      </header>

      <div className="app__layout">
        <aside className="app__panel">
          <section className="control-group">
            <h2>Progression Source</h2>
            <div className="segmented">
              <button
                type="button"
                className={progressionMode === 'library' ? 'segmented__button segmented__button--active' : 'segmented__button'}
                onClick={() => setProgressionMode('library')}
              >
                Library
              </button>
              <button
                type="button"
                className={progressionMode === 'algorithmic' ? 'segmented__button segmented__button--active' : 'segmented__button'}
                onClick={() => setProgressionMode('algorithmic')}
              >
                Algorithmic
              </button>
            </div>

            {progressionMode === 'library' ? (
              <label className="field">
                Progression
                <select value={libraryProgressionId} onChange={(e) => setLibraryProgressionId(e.target.value)}>
                  {(['baroque', 'jazz', 'pop'] as const).map((category) => (
                    <optgroup key={category} label={CATEGORY_LABELS[category]}>
                      {PROGRESSION_LIBRARY.filter((p) => p.category === category).map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </label>
            ) : (
              <label className="field">
                Progression Length
                <input
                  type="number"
                  min={2}
                  max={12}
                  value={algorithmicLength}
                  onChange={(e) => setAlgorithmicLength(Number(e.target.value))}
                />
              </label>
            )}
          </section>

          <section className="control-group">
            <h2>Key &amp; Mode</h2>
            <label className="field">
              Root
              <select value={key.root} onChange={(e) => setKeyRoot(Number(e.target.value))}>
                {SHARP_NAMES.map((name, pc) => (
                  <option key={name} value={pc}>
                    {name}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              Quality
              <select value={key.scaleType} onChange={(e) => setScaleType(e.target.value as ScaleType)}>
                {(Object.keys(SCALE_INTERVALS) as ScaleType[]).map((st) => (
                  <option key={st} value={st}>
                    {SCALE_TYPE_LABELS[st]}
                  </option>
                ))}
              </select>
            </label>
          </section>

          <section className="control-group">
            <h2>Complexity Tier</h2>
            <div className="segmented">
              {[1, 2, 3].map((t) => (
                <button
                  key={t}
                  type="button"
                  className={tier === t ? 'segmented__button segmented__button--active' : 'segmented__button'}
                  onClick={() => setTier(t as 1 | 2 | 3)}
                >
                  Tier {t}
                </button>
              ))}
            </div>
          </section>

          <button type="button" className="generate-button" onClick={generateProgression}>
            Generate New Progression
          </button>

          <section className="control-group">
            <h2>Grading Strictness</h2>
            <div className="segmented">
              {(['loose', 'strict'] as GradingStrictness[]).map((s) => (
                <button
                  key={s}
                  type="button"
                  className={strictness === s ? 'segmented__button segmented__button--active' : 'segmented__button'}
                  onClick={() => setStrictness(s)}
                >
                  {s[0].toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
          </section>

          <section className="control-group">
            <h2>Input</h2>
            <div className="input-status">
              <span>MIDI: {midi.isActive ? 'Active' : midi.isSupported ? 'Idle' : 'Unsupported'}</span>
              <button type="button" onClick={midi.isActive ? midi.stop : midi.start} disabled={!midi.isSupported}>
                {midi.isActive ? 'Stop' : 'Start'}
              </button>
            </div>
            {midi.error && <p className="error-text">{midi.error}</p>}
            <div className="input-status">
              <span>Microphone: {audio.isActive ? 'Active' : audio.isSupported ? 'Idle' : 'Unsupported'}</span>
              <button type="button" onClick={audio.isActive ? audio.stop : audio.start} disabled={!audio.isSupported}>
                {audio.isActive ? 'Stop' : 'Start'}
              </button>
            </div>
            {audio.error && <p className="error-text">{audio.error}</p>}
          </section>
        </aside>

        <main className="app__stage">
          <nav className="mode-tabs">
            {INTERACTION_MODES.map((m) => (
              <button
                key={m}
                type="button"
                className={interactionMode === m ? 'mode-tabs__button mode-tabs__button--active' : 'mode-tabs__button'}
                onClick={() => setInteractionMode(m)}
              >
                {INTERACTION_MODE_LABELS[m]}
              </button>
            ))}
          </nav>

          {interactionMode === 'sheetMusic' && <ClefToggle clef={clef} onChange={setClef} />}
          {interactionMode === 'chordNotation' && (
            <div className="segmented">
              <button
                type="button"
                className={notationStyle === 'symbol' ? 'segmented__button segmented__button--active' : 'segmented__button'}
                onClick={() => setNotationStyle('symbol')}
              >
                Chord Symbol
              </button>
              <button
                type="button"
                className={notationStyle === 'roman' ? 'segmented__button segmented__button--active' : 'segmented__button'}
                onClick={() => setNotationStyle('roman')}
              >
                Roman Numeral
              </button>
            </div>
          )}

          <div className="stage-content">
            <InteractionModeView mode={interactionMode} chord={currentChord} clef={clef} notationStyle={notationStyle} />
          </div>

          <div className="progression-nav">
            <button type="button" onClick={prev} disabled={progression.length === 0}>
              ← Prev
            </button>
            <span>
              {progression.length === 0 ? '0 / 0' : `${currentIndex + 1} / ${progression.length}`}
            </span>
            <button type="button" onClick={next} disabled={progression.length === 0}>
              Next →
            </button>
          </div>

          <div className={`grading-feedback${result ? (result.isCorrect ? ' grading-feedback--correct' : ' grading-feedback--incorrect') : ''}`}>
            <p>Verified pitches: {verifiedPitches.length > 0 ? verifiedPitches.join(', ') : '—'}</p>
            {result && (
              <p className="grading-feedback__status">
                {result.isCorrect
                  ? 'Correct!'
                  : `Missing: [${result.missingPitchClasses.join(', ')}] Extra: [${result.extraNotes.join(', ')}]`}
              </p>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
