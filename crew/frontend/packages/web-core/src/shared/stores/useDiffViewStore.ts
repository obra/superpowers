import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type DiffViewMode = 'unified' | 'split';

type State = {
  mode: DiffViewMode;
  setMode: (mode: DiffViewMode) => void;
  toggle: () => void;
  ignoreWhitespace: boolean;
  setIgnoreWhitespace: (value: boolean) => void;
  wrapText: boolean;
  setWrapText: (value: boolean) => void;
  // Current diff paths for expand/collapse all functionality
  diffPaths: string[];
  setDiffPaths: (paths: string[]) => void;
};

export const useDiffViewStore = create<State>()(
  persist(
    (set) => ({
      mode: 'unified',
      setMode: (mode) => set({ mode }),
      toggle: () =>
        set((s) => ({ mode: s.mode === 'unified' ? 'split' : 'unified' })),
      ignoreWhitespace: true,
      setIgnoreWhitespace: (value) => set({ ignoreWhitespace: value }),
      wrapText: false,
      setWrapText: (value) => set({ wrapText: value }),
      diffPaths: [],
      setDiffPaths: (paths) => set({ diffPaths: paths }),
    }),
    {
      name: 'diff-view-preferences',
      // Don't persist diffPaths as it's transient state
      partialize: (state) => ({
        mode: state.mode,
        ignoreWhitespace: state.ignoreWhitespace,
        wrapText: state.wrapText,
      }),
    }
  )
);

export const useDiffViewMode = () => useDiffViewStore((s) => s.mode);
export const useIgnoreWhitespaceDiff = () =>
  useDiffViewStore((s) => s.ignoreWhitespace);
export const useWrapTextDiff = () => useDiffViewStore((s) => s.wrapText);
