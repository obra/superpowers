import { create } from 'zustand';

type State = {
  expanded: Record<string, boolean>;
  setKey: (key: string, value: boolean) => void;
  toggleKey: (key: string, fallback?: boolean) => void;
  clear: () => void;
};

const useExpandableStore = create<State>((set) => ({
  expanded: {},
  setKey: (key, value) =>
    set((s) =>
      s.expanded[key] === value
        ? s
        : { expanded: { ...s.expanded, [key]: value } }
    ),
  toggleKey: (key, fallback = false) =>
    set((s) => {
      const next = !(s.expanded[key] ?? fallback);
      return { expanded: { ...s.expanded, [key]: next } };
    }),
  clear: () => set({ expanded: {} }),
}));

export function useExpandable(
  key: string,
  defaultValue = false
): [boolean, (next?: boolean) => void] {
  const expandedValue = useExpandableStore((s) => s.expanded[key]);
  const setKey = useExpandableStore((s) => s.setKey);
  const toggleKey = useExpandableStore((s) => s.toggleKey);

  const set = (next?: boolean) => {
    if (typeof next === 'boolean') setKey(key, next);
    else toggleKey(key, defaultValue);
  };

  return [expandedValue ?? defaultValue, set];
}
