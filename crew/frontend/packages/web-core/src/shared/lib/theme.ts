import { ThemeMode } from 'shared/types';

/**
 * Resolves the actual theme (light/dark) based on the theme mode setting.
 * Handles system theme detection properly.
 */
export function getActualTheme(
  themeMode: ThemeMode | undefined
): 'light' | 'dark' {
  if (!themeMode || themeMode === ThemeMode.LIGHT) {
    return 'light';
  }

  if (themeMode === ThemeMode.SYSTEM) {
    // Check system preference
    return window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  }

  // ThemeMode.DARK
  return 'dark';
}
