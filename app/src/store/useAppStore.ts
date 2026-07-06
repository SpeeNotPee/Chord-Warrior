import { create } from 'zustand';
import {
  harmonicEngine,
  PROGRESSION_LIBRARY,
  type ComplexityTier,
  type KeyCenter,
  type ScaleType,
  type VoicedChord,
} from '@chordwarrior/harmonic-engine';
import type { Clef } from '../components/StaffRenderer';
import type { NotationStyle } from '../components/ChordNotationDisplay';
import type { InteractionMode } from '../components/InteractionModeView';
import type { GradingStrictness } from '../validation/grading';

export type ProgressionMode = 'library' | 'algorithmic';

interface AppState {
  key: KeyCenter;
  tier: ComplexityTier;
  progressionMode: ProgressionMode;
  libraryProgressionId: string;
  algorithmicLength: number;
  clef: Clef;
  notationStyle: NotationStyle;
  interactionMode: InteractionMode;
  strictness: GradingStrictness;

  progression: VoicedChord[];
  currentIndex: number;

  setKeyRoot: (root: number) => void;
  setScaleType: (scaleType: ScaleType) => void;
  setTier: (tier: ComplexityTier) => void;
  setProgressionMode: (mode: ProgressionMode) => void;
  setLibraryProgressionId: (id: string) => void;
  setAlgorithmicLength: (length: number) => void;
  setClef: (clef: Clef) => void;
  setNotationStyle: (style: NotationStyle) => void;
  setInteractionMode: (mode: InteractionMode) => void;
  setStrictness: (strictness: GradingStrictness) => void;

  generateProgression: () => void;
  next: () => void;
  prev: () => void;
}

function generate(state: Pick<AppState, 'progressionMode' | 'libraryProgressionId' | 'key' | 'tier' | 'algorithmicLength'>): VoicedChord[] {
  if (state.progressionMode === 'library') {
    return harmonicEngine.generateFromLibrary(state.libraryProgressionId, state.key);
  }
  return harmonicEngine.generateAlgorithmic({ key: state.key, tier: state.tier, length: state.algorithmicLength });
}

export const useAppStore = create<AppState>((set, get) => ({
  key: { root: 0, scaleType: 'major' },
  tier: 1,
  progressionMode: 'library',
  libraryProgressionId: PROGRESSION_LIBRARY[0].id,
  algorithmicLength: 6,
  clef: 'treble',
  notationStyle: 'symbol',
  interactionMode: 'sheetMusic',
  strictness: 'loose',

  progression: [],
  currentIndex: 0,

  setKeyRoot: (root) => set((s) => ({ key: { ...s.key, root } })),
  setScaleType: (scaleType) => set((s) => ({ key: { ...s.key, scaleType } })),
  setTier: (tier) => set({ tier }),
  setProgressionMode: (progressionMode) => set({ progressionMode }),
  setLibraryProgressionId: (libraryProgressionId) => set({ libraryProgressionId }),
  setAlgorithmicLength: (algorithmicLength) => set({ algorithmicLength }),
  setClef: (clef) => set({ clef }),
  setNotationStyle: (notationStyle) => set({ notationStyle }),
  setInteractionMode: (interactionMode) => set({ interactionMode }),
  setStrictness: (strictness) => set({ strictness }),

  generateProgression: () => {
    const state = get();
    const progression = generate(state);
    set({ progression, currentIndex: 0 });
  },

  next: () =>
    set((s) => ({
      currentIndex: s.progression.length === 0 ? 0 : (s.currentIndex + 1) % s.progression.length,
    })),

  prev: () =>
    set((s) => ({
      currentIndex: s.progression.length === 0 ? 0 : (s.currentIndex - 1 + s.progression.length) % s.progression.length,
    })),
}));
