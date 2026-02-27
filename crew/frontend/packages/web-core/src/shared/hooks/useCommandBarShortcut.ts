import { useEffect, useCallback } from 'react';

/**
 * Hook that listens for CMD+K (Mac) or Ctrl+K (Windows/Linux) to open the command bar.
 * Uses native DOM event listener with capture phase to intercept before other handlers
 * like Lexical editor.
 */
export function useCommandBarShortcut(
  onOpen: () => void,
  enabled: boolean = true
) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // CMD+K (Mac) or Ctrl+K (Windows/Linux)
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const modifier = isMac ? event.metaKey : event.ctrlKey;

      if (modifier && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        event.stopPropagation();
        onOpen();
      }
    },
    [onOpen]
  );

  useEffect(() => {
    if (!enabled) return;

    // Use capture phase to intercept before other handlers (like Lexical editor)
    window.addEventListener('keydown', handleKeyDown, { capture: true });

    return () => {
      window.removeEventListener('keydown', handleKeyDown, { capture: true });
    };
  }, [handleKeyDown, enabled]);
}
