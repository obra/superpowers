import { useEffect } from 'react';
import { ThemeMode } from 'shared/types';
import { useTheme } from '@/shared/hooks/useTheme';

interface VibeStyleOverrideMessage {
  type: 'VIBE_STYLE_OVERRIDE';
  payload:
    | {
        kind: 'cssVars';
        variables: Record<string, string>;
      }
    | {
        kind: 'theme';
        theme: ThemeMode;
      };
}

interface VibeIframeReadyMessage {
  type: 'VIBE_IFRAME_READY';
}

// Component that adds postMessage listener for style overrides
export function AppWithStyleOverride({
  children,
  setTheme,
}: {
  children: React.ReactNode;
  setTheme: (theme: ThemeMode) => void;
}) {
  useEffect(() => {
    function handleStyleMessage(event: MessageEvent) {
      if (event.data?.type !== 'VIBE_STYLE_OVERRIDE') return;

      // Origin validation (only if VITE_PARENT_ORIGIN is configured)
      const allowedOrigin = import.meta.env.VITE_PARENT_ORIGIN;
      if (allowedOrigin && event.origin !== allowedOrigin) {
        console.warn(
          '[StyleOverride] Message from unauthorized origin:',
          event.origin
        );
        return;
      }

      const message = event.data as VibeStyleOverrideMessage;

      // CSS variable overrides (only --vibe-* prefixed variables)
      if (
        message.payload.kind === 'cssVars' &&
        typeof message.payload.variables === 'object'
      ) {
        Object.entries(message.payload.variables).forEach(([name, value]) => {
          if (typeof value === 'string') {
            document.documentElement.style.setProperty(name, value);
          }
        });
      } else if (message.payload.kind === 'theme') {
        setTheme(message.payload.theme);
      }
    }

    window.addEventListener('message', handleStyleMessage);
    return () => window.removeEventListener('message', handleStyleMessage);
  }, [setTheme]);

  // Send ready message to parent when component mounts
  useEffect(() => {
    const allowedOrigin = import.meta.env.VITE_PARENT_ORIGIN;

    // Only send if we're in an iframe and have a parent
    if (window.parent && window.parent !== window) {
      const readyMessage: VibeIframeReadyMessage = {
        type: 'VIBE_IFRAME_READY',
      };

      // Send to specific origin if configured, otherwise send to any origin
      const targetOrigin = allowedOrigin || '*';
      window.parent.postMessage(readyMessage, targetOrigin);
    }
  }, []);

  return <>{children}</>;
}

export function useStyleOverrideThemeSetter() {
  const { setTheme } = useTheme();
  return setTheme;
}
