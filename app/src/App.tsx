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
        <h1>ChordWarrior</h1>
        <p className="app__subtitle">Sight-reading, ear-training &amp; chord recognition drills</p>
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
            <PianoKeyboard highlightedNotes={pianoHighlightedNotes} playedNotes={verifiedPitches} />
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
