import { create } from 'zustand';
import {
  harmonicEngine,
  generateNextChord,
  voiceChord,
  GRADE_PROFILES,
  type MusicGrade,
  type KeyCenter,
  type ScaleType,
  type StepState,
  type VoicedChord,
} from '@chordwarrior/harmonic-engine';
import type { Clef } from '../components/StaffRenderer';
import type { NotationStyle } from '../components/ChordNotationDisplay';
import type { InteractionMode } from '../components/InteractionModeView';
import type { GradingStrictness } from '../validation/grading';

export type KeyVariety = 'perProgression' | 'perChord';
export type Theme = 'light' | 'dark' | 'system';

const THEME_STORAGE_KEY = 'chordwarrior:theme';

function initialTheme(): Theme {
  if (typeof localStorage === 'undefined') return 'system';
  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  return stored === 'light' || stored === 'dark' || stored === 'system' ? stored : 'system';
}

interface AppState {
  selectedRoots: number[];
  selectedScaleTypes: ScaleType[];
  keyVariety: KeyVariety;
  /** The key currently driving generation, tracked so endless mode can keep reusing it under 'perProgression'. */
  activeKey: KeyCenter | null;
  grade: MusicGrade;
  algorithmicLength: number;
  endlessMode: boolean;
  clef: Clef;
  notationStyle: NotationStyle;
  interactionMode: InteractionMode;
  strictness: GradingStrictness;

  timerEnabled: boolean;
  timerDurationSeconds: number;
  timerAutoContinue: boolean;
  timerAutoContinueSeconds: number;

  theme: Theme;

  progression: VoicedChord[];
  currentIndex: number;
  stepState: StepState | null;

  toggleRoot: (root: number) => void;
  toggleScaleType: (scaleType: ScaleType) => void;
  setKeyVariety: (variety: KeyVariety) => void;
  setGrade: (grade: MusicGrade) => void;
  setAlgorithmicLength: (length: number) => void;
  setEndlessMode: (endless: boolean) => void;
  setClef: (clef: Clef) => void;
  setNotationStyle: (style: NotationStyle) => void;
  setInteractionMode: (mode: InteractionMode) => void;
  setStrictness: (strictness: GradingStrictness) => void;
  setTimerEnabled: (enabled: boolean) => void;
  setTimerDurationSeconds: (seconds: number) => void;
  setTimerAutoContinue: (auto: boolean) => void;
  setTimerAutoContinueSeconds: (seconds: number) => void;
  setTheme: (theme: Theme) => void;

  generateProgression: () => void;
  next: () => void;
  prev: () => void;
}

/** Cartesian product of the checked roots and scale qualities. */
export function keyCombos(roots: number[], scaleTypes: ScaleType[]): KeyCenter[] {
  const combos: KeyCenter[] = [];
  for (const root of roots) {
    for (const scaleType of scaleTypes) combos.push({ root, scaleType });
  }
  return combos;
}

function pickRandomKey(combos: KeyCenter[]): KeyCenter {
  return combos[Math.floor(Math.random() * combos.length)];
}

/** Roman numerals are only meaningful relative to a single, unambiguous key. */
function romanNumeralAvailable(roots: number[], scaleTypes: ScaleType[]): boolean {
  return roots.length === 1 && scaleTypes.length === 1;
}

export const useAppStore = create<AppState>((set, get) => ({
  selectedRoots: [0],
  selectedScaleTypes: ['major'],
  keyVariety: 'perProgression',
  activeKey: null,
  grade: 1,
  algorithmicLength: 6,
  endlessMode: false,
  clef: 'treble',
  notationStyle: 'symbol',
  interactionMode: 'sheetMusic',
  strictness: 'loose',

  timerEnabled: false,
  timerDurationSeconds: 20,
  timerAutoContinue: true,
  timerAutoContinueSeconds: 4,

  theme: initialTheme(),

  progression: [],
  currentIndex: 0,
  stepState: null,

  toggleRoot: (root) =>
    set((s) => {
      const has = s.selectedRoots.includes(root);
      if (has && s.selectedRoots.length === 1) return s; // always keep at least one root checked
      const selectedRoots = has ? s.selectedRoots.filter((r) => r !== root) : [...s.selectedRoots, root].sort((a, b) => a - b);
      const notationStyle =
        s.notationStyle === 'roman' && !romanNumeralAvailable(selectedRoots, s.selectedScaleTypes) ? 'symbol' : s.notationStyle;
      return { selectedRoots, notationStyle };
    }),

  toggleScaleType: (scaleType) =>
    set((s) => {
      const has = s.selectedScaleTypes.includes(scaleType);
      if (has && s.selectedScaleTypes.length === 1) return s; // always keep at least one quality checked
      const selectedScaleTypes = has ? s.selectedScaleTypes.filter((st) => st !== scaleType) : [...s.selectedScaleTypes, scaleType];
      const notationStyle =
        s.notationStyle === 'roman' && !romanNumeralAvailable(s.selectedRoots, selectedScaleTypes) ? 'symbol' : s.notationStyle;
      return { selectedScaleTypes, notationStyle };
    }),

  setKeyVariety: (keyVariety) => set({ keyVariety }),
  setGrade: (grade) => set({ grade }),
  setAlgorithmicLength: (algorithmicLength) => set({ algorithmicLength }),
  setEndlessMode: (endlessMode) => set({ endlessMode }),
  setClef: (clef) => set({ clef }),
  setNotationStyle: (notationStyle) => set({ notationStyle }),
  setInteractionMode: (interactionMode) => set({ interactionMode }),
  setStrictness: (strictness) => set({ strictness }),
  setTimerEnabled: (timerEnabled) => set({ timerEnabled }),
  setTimerDurationSeconds: (timerDurationSeconds) => set({ timerDurationSeconds }),
  setTimerAutoContinue: (timerAutoContinue) => set({ timerAutoContinue }),
  setTimerAutoContinueSeconds: (timerAutoContinueSeconds) => set({ timerAutoContinueSeconds }),
  setTheme: (theme) => {
    if (typeof localStorage !== 'undefined') localStorage.setItem(THEME_STORAGE_KEY, theme);
    set({ theme });
  },

  generateProgression: () => {
    const s = get();
    const combos = keyCombos(s.selectedRoots, s.selectedScaleTypes);
    const profile = GRADE_PROFILES[s.grade];

    if (s.endlessMode) {
      const key = pickRandomKey(combos);
      const { chord, state } = generateNextChord(null, { key, tier: profile.chordTier, decorateProbability: profile.decorateProbability });
      const voiced = voiceChord(chord, key, { range: profile.range });
      set({ progression: [voiced], currentIndex: 0, stepState: state, activeKey: key });
      return;
    }

    if (s.keyVariety === 'perChord') {
      const chords: VoicedChord[] = [];
      let state: StepState | null = null;
      let prevVoicing: number[] | undefined;
      for (let i = 0; i < s.algorithmicLength; i++) {
        const key = pickRandomKey(combos);
        const isCadence = i === s.algorithmicLength - 1 && s.algorithmicLength > 1;
        const step = generateNextChord(state, {
          key,
          tier: profile.chordTier,
          decorateProbability: profile.decorateProbability,
          isCadence,
        });
        const voiced = voiceChord(step.chord, key, { prevVoicing, range: profile.range });
        chords.push(voiced);
        state = step.state;
        prevVoicing = voiced.pitches;
      }
      set({ progression: chords, currentIndex: 0, stepState: state, activeKey: null });
      return;
    }

    const key = pickRandomKey(combos);
    const progression = harmonicEngine.generateAlgorithmic({
      key,
      tier: profile.chordTier,
      length: s.algorithmicLength,
      decorateProbability: profile.decorateProbability,
      range: profile.range,
    });
    set({ progression, currentIndex: 0, stepState: null, activeKey: key });
  },

  next: () => {
    const s = get();
    if (s.progression.length === 0) return;

    if (s.endlessMode && s.currentIndex === s.progression.length - 1) {
      const combos = keyCombos(s.selectedRoots, s.selectedScaleTypes);
      const profile = GRADE_PROFILES[s.grade];
      const key = s.keyVariety === 'perChord' ? pickRandomKey(combos) : (s.activeKey ?? pickRandomKey(combos));
      const lastVoiced = s.progression[s.progression.length - 1];
      const step = generateNextChord(s.stepState, { key, tier: profile.chordTier, decorateProbability: profile.decorateProbability });
      const voiced = voiceChord(step.chord, key, { prevVoicing: lastVoiced.pitches, range: profile.range });
      set({
        progression: [...s.progression, voiced],
        currentIndex: s.currentIndex + 1,
        stepState: step.state,
        activeKey: key,
      });
      return;
    }

    set({ currentIndex: (s.currentIndex + 1) % s.progression.length });
  },

  prev: () =>
    set((s) => ({
      currentIndex: s.progression.length === 0 ? 0 : (s.currentIndex - 1 + s.progression.length) % s.progression.length,
    })),
}));
