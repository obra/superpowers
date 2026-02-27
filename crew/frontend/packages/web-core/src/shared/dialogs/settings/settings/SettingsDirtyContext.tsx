import { useContext, useState, useCallback } from 'react';
import { createHmrContext } from '@/shared/lib/hmrContext';
import type { ReactNode } from 'react';

interface SettingsDirtyContextValue {
  isDirty: boolean;
  setDirty: (sectionId: string, dirty: boolean) => void;
  clearAll: () => void;
}

const SettingsDirtyContext = createHmrContext<SettingsDirtyContextValue | null>(
  'SettingsDirtyContext',
  null
);

export function SettingsDirtyProvider({ children }: { children: ReactNode }) {
  const [dirtySections, setDirtySections] = useState<Set<string>>(new Set());

  const setDirty = useCallback((sectionId: string, dirty: boolean) => {
    setDirtySections((prev) => {
      const next = new Set(prev);
      if (dirty) {
        next.add(sectionId);
      } else {
        next.delete(sectionId);
      }
      return next;
    });
  }, []);

  const clearAll = useCallback(() => {
    setDirtySections(new Set());
  }, []);

  const isDirty = dirtySections.size > 0;

  return (
    <SettingsDirtyContext.Provider value={{ isDirty, setDirty, clearAll }}>
      {children}
    </SettingsDirtyContext.Provider>
  );
}

export function useSettingsDirty() {
  const context = useContext(SettingsDirtyContext);
  if (!context) {
    throw new Error(
      'useSettingsDirty must be used within a SettingsDirtyProvider'
    );
  }
  return context;
}
