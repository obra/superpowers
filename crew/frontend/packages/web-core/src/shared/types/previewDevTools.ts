// Message source identifier
export const PREVIEW_DEVTOOLS_SOURCE = 'vibe-devtools' as const;
export type PreviewDevToolsSource = typeof PREVIEW_DEVTOOLS_SOURCE;

// === Entry Types (for state management) ===

export interface NavigationState {
  url: string;
  title?: string;
  canGoBack: boolean;
  canGoForward: boolean;
}

// === Message Types (from iframe to parent) ===

export interface NavigationMessage {
  source: PreviewDevToolsSource;
  type: 'navigation';
  payload: NavigationState & {
    timestamp: number;
    docId?: string;
    seq?: number;
  };
}

export interface ReadyMessage {
  source: PreviewDevToolsSource;
  type: 'ready';
  payload?: {
    docId?: string;
  };
}

// === Command Types (from parent to iframe) ===

export interface NavigationCommand {
  source: PreviewDevToolsSource;
  type: 'navigate';
  payload: {
    action: 'back' | 'forward' | 'refresh' | 'goto';
    url?: string; // for 'goto' action
  };
}

// === Union Types ===

export type PreviewDevToolsMessage = NavigationMessage | ReadyMessage;

export type PreviewDevToolsCommand = NavigationCommand;

// === Type Guards ===

export function isPreviewDevToolsMessage(
  data: unknown
): data is PreviewDevToolsMessage {
  return (
    typeof data === 'object' &&
    data !== null &&
    'source' in data &&
    (data as { source: unknown }).source === PREVIEW_DEVTOOLS_SOURCE
  );
}
