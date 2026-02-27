import { create } from 'zustand';

interface InspectModeState {
  isInspectMode: boolean;
  setInspectMode: (active: boolean) => void;
  toggleInspectMode: () => void;
  pendingComponentMarkdown: string | null;
  setPendingComponentMarkdown: (markdown: string | null) => void;
  clearPendingComponentMarkdown: () => void;
}

export const useInspectModeStore = create<InspectModeState>((set) => ({
  isInspectMode: false,
  setInspectMode: (active) => set({ isInspectMode: active }),
  toggleInspectMode: () => set((s) => ({ isInspectMode: !s.isInspectMode })),
  pendingComponentMarkdown: null,
  setPendingComponentMarkdown: (markdown) =>
    set({
      pendingComponentMarkdown: markdown,
      ...(markdown !== null ? { isInspectMode: false } : {}),
    }),
  clearPendingComponentMarkdown: () => set({ pendingComponentMarkdown: null }),
}));
