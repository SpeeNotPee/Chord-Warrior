import { useEffect } from 'react';
import { useAppStore, type Theme } from './store/useAppStore';
import { useChordValidator } from './hooks/useChordValidator';
import { useChordTimer } from './hooks/useChordTimer';
import { SCALE_INTERVALS, SHARP_NAMES, type MusicGrade, type ScaleType } from '@chordwarrior/harmonic-engine';
import { InteractionModeView, INTERACTION_MODES, INTERACTION_MODE_LABELS } from './components/InteractionModeView';
import { ClefToggle } from './components/ClefToggle';
import { PianoKeyboard } from './components/PianoKeyboard';
import type { NotationStyle } from './components/ChordNotationDisplay';
import type { GradingStrictness } from './validation/grading';
import './App.css';

const SCALE_TYPE_LABELS: Record<ScaleType, string> = {
  major: 'Major',
  naturalMinor: 'Natural Minor',
  harmonicMinor: 'Harmonic Minor',
};

const NOTATION_STYLE_LABELS: Record<NotationStyle, string> = {
  symbol: 'Chord Symbol',
  roman: 'Roman Numeral',
  figuredBass: 'Figured Bass',
};

const THEME_LABELS: Record<Theme, string> = {
  light: 'Light',
  dark: 'Dark',
  system: 'System',
};

function App() {
  const {
    selectedRoots,
    selectedScaleTypes,
    keyVariety,
    grade,
    algorithmicLength,
    endlessMode,
    clef,
    notationStyle,
    interactionMode,
    strictness,
    timerEnabled,
    timerDurationSeconds,
    timerAutoContinue,
    timerAutoContinueSeconds,
    theme,
    pianoLabels,
    progression,
    currentIndex,
    toggleRoot,
    toggleScaleType,
    setKeyVariety,
    setGrade,
    setAlgorithmicLength,
    setEndlessMode,
    setClef,
    setNotationStyle,
    setInteractionMode,
    setStrictness,
    setTimerEnabled,
    setTimerDurationSeconds,
    setTimerAutoContinue,
    setTimerAutoContinueSeconds,
    setTheme,
    setPianoLabels,
    generateProgression,
    next,
    prev,
  } = useAppStore();

  useEffect(() => {
    generateProgression();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    const applyResolvedTheme = () => {
      const resolved = theme === 'system' ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') : theme;
      root.dataset.theme = resolved;
    };
    applyResolvedTheme();
    if (theme !== 'system') return;
    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    mql.addEventListener('change', applyResolvedTheme);
    return () => mql.removeEventListener('change', applyResolvedTheme);
  }, [theme]);

  const currentChord = progression[currentIndex] ?? null;
  const { verifiedPitches, midi, audio, result } = useChordValidator(currentChord, strictness);

  const timer = useChordTimer({
    enabled: timerEnabled,
    durationSeconds: timerDurationSeconds,
    resetKey: currentIndex,
    isSolved: !!result?.isCorrect,
  });

  // Reveal (timer expiry) takes precedence over the correct-answer auto-advance below.
  useEffect(() => {
    if (result?.isCorrect && !timer.expired) {
      const timeout = setTimeout(next, 700);
      return () => clearTimeout(timeout);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result?.isCorrect, timer.expired]);

  useEffect(() => {
    if (!timer.expired || !timerAutoContinue) return;
    const timeout = setTimeout(next, timerAutoContinueSeconds * 1000);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timer.expired, timerAutoContinue, timerAutoContinueSeconds]);

  const romanNumeralAvailable = selectedRoots.length === 1 && selectedScaleTypes.length === 1;
  const showKeyVariety = selectedRoots.length * selectedScaleTypes.length > 1;
  const notationStyles: NotationStyle[] = ['symbol', ...(romanNumeralAvailable ? (['roman'] as const) : []), 'figuredBass'];
  // Never reveal the target chord on the piano during normal play -- only a timer expiry reveals the answer.
  // A correct answer highlights green via the player's own (matching) notes, not by exposing the target directly.
  const pianoHighlightedNotes = timer.expired ? currentChord?.pitches ?? [] : result?.isCorrect ? verifiedPitches : [];

  return (
    <div className="app">
      <header className="app__header">
        <div className="app__masthead">
          <h1>ChordWarrior</h1>
          <p className="app__subtitle">Sight-reading, ear-training &amp; chord recognition drills</p>
        </div>
        {/* TODO: replace href="#" with real profile URLs. */}
        <nav className="app__socials" aria-label="Social links">
          <a className="app__social" href="#" aria-label="GitHub" title="GitHub" target="_blank" rel="noreferrer">
            <svg viewBox="0 0 16 16" width="18" height="18" aria-hidden="true" fill="currentColor">
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
            </svg>
          </a>
          <a className="app__social" href="#" aria-label="Discord" title="Discord" target="_blank" rel="noreferrer">
            <svg viewBox="0 0 16 16" width="18" height="18" aria-hidden="true" fill="currentColor">
              <path d="M13.55 3.02A13.06 13.06 0 0 0 10.3 2l-.16.33c1.06.26 1.94.7 2.76 1.27-1.43-.78-2.85-1.27-5.05-1.27S4.24 2.62 2.8 3.4c.82-.57 1.7-1.01 2.76-1.27L5.4 2c-1.14.2-2.24.55-3.25 1.02C.34 6.16-.15 9.22.09 12.24a13.2 13.2 0 0 0 3.98 2c.32-.44.6-.9.85-1.4-.47-.17-.92-.39-1.35-.65.11-.08.22-.17.33-.25 2.6 1.2 5.42 1.2 7.99 0 .11.09.22.17.33.25-.43.26-.88.47-1.35.65.24.5.53.96.85 1.4a13.14 13.14 0 0 0 3.98-2c.29-3.5-.5-6.54-2.15-9.22ZM5.35 10.4c-.79 0-1.44-.72-1.44-1.6 0-.89.63-1.61 1.44-1.61.8 0 1.45.72 1.44 1.6 0 .89-.64 1.61-1.44 1.61Zm5.3 0c-.79 0-1.44-.72-1.44-1.6 0-.89.63-1.61 1.44-1.61.8 0 1.45.72 1.44 1.6 0 .89-.63 1.61-1.44 1.61Z" />
            </svg>
          </a>
          <a className="app__social" href="#" aria-label="Homepage" title="Homepage" target="_blank" rel="noreferrer">
            <svg viewBox="0 0 16 16" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.4">
              <circle cx="8" cy="8" r="6.4" />
              <path d="M1.6 8h12.8M8 1.6c1.9 2 2.9 4.1 2.9 6.4S9.9 12.4 8 14.4C6.1 12.4 5.1 10.3 5.1 8S6.1 3.6 8 1.6Z" />
            </svg>
          </a>
        </nav>
      </header>

      <div className="app__layout">
        <aside className="app__panel">
          <section className="control-group">
            <h2>Roots</h2>
            <div className="checkbox-grid">
              {SHARP_NAMES.map((name, pc) => (
                <label key={name} className="checkbox-field">
                  <input type="checkbox" checked={selectedRoots.includes(pc)} onChange={() => toggleRoot(pc)} />
                  {name}
                </label>
              ))}
            </div>
          </section>

          <section className="control-group">
            <h2>Scale Qualities</h2>
            <div className="checkbox-grid">
              {(Object.keys(SCALE_INTERVALS) as ScaleType[]).map((st) => (
                <label key={st} className="checkbox-field">
                  <input type="checkbox" checked={selectedScaleTypes.includes(st)} onChange={() => toggleScaleType(st)} />
                  {SCALE_TYPE_LABELS[st]}
                </label>
              ))}
            </div>
            {showKeyVariety && (
              <div className="segmented" style={{ marginTop: '0.5rem' }}>
                <button
                  type="button"
                  className={keyVariety === 'perProgression' ? 'segmented__button segmented__button--active' : 'segmented__button'}
                  onClick={() => setKeyVariety('perProgression')}
                >
                  One key / progression
                </button>
                <button
                  type="button"
                  className={keyVariety === 'perChord' ? 'segmented__button segmented__button--active' : 'segmented__button'}
                  onClick={() => setKeyVariety('perChord')}
                >
                  New key / chord
                </button>
              </div>
            )}
          </section>

          <section className="control-group">
            <h2>Grade</h2>
            <label className="field">
              Grade {grade}
              <input type="range" min={1} max={8} value={grade} onChange={(e) => setGrade(Number(e.target.value) as MusicGrade)} />
            </label>
          </section>

          <section className="control-group">
            <h2>Progression</h2>
            <label className="checkbox-field">
              <input type="checkbox" checked={endlessMode} onChange={(e) => setEndlessMode(e.target.checked)} />
              Endless Mode
            </label>
            {!endlessMode && (
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
            <h2>Timer</h2>
            <label className="checkbox-field">
              <input type="checkbox" checked={timerEnabled} onChange={(e) => setTimerEnabled(e.target.checked)} />
              Enable Timer
            </label>
            {timerEnabled && (
              <>
                <label className="field">
                  Duration (seconds)
                  <input
                    type="number"
                    min={3}
                    max={120}
                    value={timerDurationSeconds}
                    onChange={(e) => setTimerDurationSeconds(Number(e.target.value))}
                  />
                </label>
                <label className="checkbox-field">
                  <input type="checkbox" checked={timerAutoContinue} onChange={(e) => setTimerAutoContinue(e.target.checked)} />
                  Auto-continue after reveal
                </label>
                {timerAutoContinue && (
                  <label className="field">
                    Auto-continue delay (seconds)
                    <input
                      type="number"
                      min={1}
                      max={30}
                      value={timerAutoContinueSeconds}
                      onChange={(e) => setTimerAutoContinueSeconds(Number(e.target.value))}
                    />
                  </label>
                )}
              </>
            )}
          </section>

          <section className="control-group">
            <h2>Display</h2>
            <div className="segmented">
              {(['light', 'dark', 'system'] as Theme[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  className={theme === t ? 'segmented__button segmented__button--active' : 'segmented__button'}
                  onClick={() => setTheme(t)}
                >
                  {THEME_LABELS[t]}
                </button>
              ))}
            </div>
            <label className="checkbox-field" style={{ marginTop: '0.6rem' }}>
              <input type="checkbox" checked={pianoLabels} onChange={(e) => setPianoLabels(e.target.checked)} />
              Note names on keyboard
            </label>
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
              {notationStyles.map((style) => (
                <button
                  key={style}
                  type="button"
                  className={notationStyle === style ? 'segmented__button segmented__button--active' : 'segmented__button'}
                  onClick={() => setNotationStyle(style)}
                >
                  {NOTATION_STYLE_LABELS[style]}
                </button>
              ))}
            </div>
          )}

          <div className="stage-content">
            <InteractionModeView mode={interactionMode} chord={currentChord} clef={clef} notationStyle={notationStyle} />
          </div>

          <div className="progression-nav">
            <button type="button" onClick={prev} disabled={progression.length === 0}>
              ← Prev
            </button>
            <span>{progression.length === 0 ? '0 / 0' : `${currentIndex + 1} / ${endlessMode ? '∞' : progression.length}`}</span>
            <button type="button" onClick={next} disabled={progression.length === 0}>
              Next →
            </button>
          </div>

          <div
            className={`grading-feedback${
              timer.expired ? ' grading-feedback--incorrect' : result ? (result.isCorrect ? ' grading-feedback--correct' : ' grading-feedback--incorrect') : ''
            }`}
          >
            {timer.expired ? (
              <p className="grading-feedback__status">Time&apos;s up! Correct notes:</p>
            ) : (
              <p>Verified pitches: {verifiedPitches.length > 0 ? verifiedPitches.join(', ') : '—'}</p>
            )}
            {!timer.expired && result && (
              <p className="grading-feedback__status">
                {result.isCorrect
                  ? 'Correct!'
                  : `Missing: [${result.missingPitchClasses.join(', ')}] Extra: [${result.extraNotes.join(', ')}]`}
              </p>
            )}
            {!timer.expired && timerEnabled && <p className="grading-feedback__timer">Time left: {timer.remainingSeconds}s</p>}
            <PianoKeyboard highlightedNotes={pianoHighlightedNotes} playedNotes={verifiedPitches} showLabels={pianoLabels} />
            {timer.expired && !timerAutoContinue && (
              <button type="button" onClick={next}>
                Continue
              </button>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
