import { useContext } from 'react';
import { createHmrContext } from '@/shared/lib/hmrContext';
import { ThemeMode } from 'shared/types';

export type ThemeProviderState = {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
};

const initialState: ThemeProviderState = {
  theme: ThemeMode.SYSTEM,
  setTheme: () => null,
};

export const ThemeProviderContext = createHmrContext<ThemeProviderState>(
  'ThemeProviderContext',
  initialState
);

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);

  if (context === undefined)
    throw new Error('useTheme must be used within a ThemeProvider');

  return context;
};

export function getResolvedTheme(theme: ThemeMode): 'light' | 'dark' {
  if (theme === ThemeMode.SYSTEM) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  }
  return theme === ThemeMode.DARK ? 'dark' : 'light';
}
