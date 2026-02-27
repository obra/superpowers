import { useReducer, useMemo, useCallback, useRef, ReactNode } from 'react';
import type { Terminal } from '@xterm/xterm';
import type { FitAddon } from '@xterm/addon-fit';
import {
  TerminalContext,
  type TerminalTab,
  type TerminalInstance,
} from '@/shared/hooks/useTerminal';
import { openLocalApiWebSocket } from '@/shared/lib/localApiTransport';

interface TerminalConnection {
  ws: WebSocket;
  send: (data: string) => void;
  resize: (cols: number, rows: number) => void;
}

interface TerminalState {
  tabsByWorkspace: Record<string, TerminalTab[]>;
  activeTabByWorkspace: Record<string, string | null>;
}

type TerminalAction =
  | { type: 'CREATE_TAB'; workspaceId: string; cwd: string }
  | { type: 'CLOSE_TAB'; workspaceId: string; tabId: string }
  | { type: 'SET_ACTIVE_TAB'; workspaceId: string; tabId: string }
  | {
      type: 'UPDATE_TAB_TITLE';
      workspaceId: string;
      tabId: string;
      title: string;
    }
  | { type: 'CLEAR_WORKSPACE_TABS'; workspaceId: string };

function generateTabId(): string {
  return `term-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function encodeBase64(str: string): string {
  const bytes = new TextEncoder().encode(str);
  const binString = Array.from(bytes, (b) => String.fromCodePoint(b)).join('');
  return btoa(binString);
}

function decodeBase64(base64: string): string {
  const binString = atob(base64);
  const bytes = Uint8Array.from(binString, (c) => c.codePointAt(0)!);
  return new TextDecoder().decode(bytes);
}

function terminalReducer(
  state: TerminalState,
  action: TerminalAction
): TerminalState {
  switch (action.type) {
    case 'CREATE_TAB': {
      const { workspaceId, cwd } = action;
      const existingTabs = state.tabsByWorkspace[workspaceId] || [];
      const newTab: TerminalTab = {
        id: generateTabId(),
        title: `Terminal ${existingTabs.length + 1}`,
        workspaceId,
        cwd,
      };
      return {
        ...state,
        tabsByWorkspace: {
          ...state.tabsByWorkspace,
          [workspaceId]: [...existingTabs, newTab],
        },
        activeTabByWorkspace: {
          ...state.activeTabByWorkspace,
          [workspaceId]: newTab.id,
        },
      };
    }

    case 'CLOSE_TAB': {
      const { workspaceId, tabId } = action;
      const tabs = state.tabsByWorkspace[workspaceId] || [];
      const newTabs = tabs.filter((t) => t.id !== tabId);
      const wasActive = state.activeTabByWorkspace[workspaceId] === tabId;
      let newActiveTab = state.activeTabByWorkspace[workspaceId];

      if (wasActive && newTabs.length > 0) {
        const closedIndex = tabs.findIndex((t) => t.id === tabId);
        const newIndex = Math.min(closedIndex, newTabs.length - 1);
        newActiveTab = newTabs[newIndex]?.id ?? null;
      } else if (newTabs.length === 0) {
        newActiveTab = null;
      }

      return {
        ...state,
        tabsByWorkspace: {
          ...state.tabsByWorkspace,
          [workspaceId]: newTabs,
        },
        activeTabByWorkspace: {
          ...state.activeTabByWorkspace,
          [workspaceId]: newActiveTab,
        },
      };
    }

    case 'SET_ACTIVE_TAB': {
      const { workspaceId, tabId } = action;
      return {
        ...state,
        activeTabByWorkspace: {
          ...state.activeTabByWorkspace,
          [workspaceId]: tabId,
        },
      };
    }

    case 'UPDATE_TAB_TITLE': {
      const { workspaceId, tabId, title } = action;
      const tabs = state.tabsByWorkspace[workspaceId] || [];
      return {
        ...state,
        tabsByWorkspace: {
          ...state.tabsByWorkspace,
          [workspaceId]: tabs.map((t) =>
            t.id === tabId ? { ...t, title } : t
          ),
        },
      };
    }

    case 'CLEAR_WORKSPACE_TABS': {
      const { workspaceId } = action;
      const restTabs = Object.fromEntries(
        Object.entries(state.tabsByWorkspace).filter(
          ([key]) => key !== workspaceId
        )
      );
      const restActive = Object.fromEntries(
        Object.entries(state.activeTabByWorkspace).filter(
          ([key]) => key !== workspaceId
        )
      );
      return {
        tabsByWorkspace: restTabs,
        activeTabByWorkspace: restActive,
      };
    }

    default:
      return state;
  }
}

interface TerminalProviderProps {
  children: ReactNode;
}

export function TerminalProvider({ children }: TerminalProviderProps) {
  const [state, dispatch] = useReducer(terminalReducer, {
    tabsByWorkspace: {},
    activeTabByWorkspace: {},
  });

  // Store terminal instances in a ref to persist across re-renders
  const terminalInstancesRef = useRef<Map<string, TerminalInstance>>(new Map());

  // Store WebSocket connections in a ref to persist across component remounts
  const terminalConnectionsRef = useRef<Map<string, TerminalConnection>>(
    new Map()
  );

  // Store callback refs for each connection to prevent stale closures
  const connectionCallbacksRef = useRef<
    Map<string, { onData: (data: string) => void; onExit?: () => void }>
  >(new Map());

  // Store reconnection state for each connection
  const reconnectStateRef = useRef<
    Map<
      string,
      {
        endpoint: string;
        retryCount: number;
        retryTimer: ReturnType<typeof setTimeout> | null;
        intentionallyClosed: boolean;
      }
    >
  >(new Map());

  const getTabsForWorkspace = useCallback(
    (workspaceId: string): TerminalTab[] => {
      return state.tabsByWorkspace[workspaceId] || [];
    },
    [state.tabsByWorkspace]
  );

  const getActiveTab = useCallback(
    (workspaceId: string): TerminalTab | null => {
      const activeId = state.activeTabByWorkspace[workspaceId];
      if (!activeId) return null;
      const tabs = state.tabsByWorkspace[workspaceId] || [];
      return tabs.find((t) => t.id === activeId) || null;
    },
    [state.tabsByWorkspace, state.activeTabByWorkspace]
  );

  const createTab = useCallback((workspaceId: string, cwd: string) => {
    dispatch({ type: 'CREATE_TAB', workspaceId, cwd });
  }, []);

  const closeTerminalConnection = useCallback((tabId: string) => {
    // Mark as intentionally closed to prevent reconnection
    const reconnectState = reconnectStateRef.current.get(tabId);
    if (reconnectState) {
      reconnectState.intentionallyClosed = true;
      if (reconnectState.retryTimer) {
        clearTimeout(reconnectState.retryTimer);
      }
      reconnectStateRef.current.delete(tabId);
    }

    const conn = terminalConnectionsRef.current.get(tabId);
    if (conn) {
      conn.ws.close();
      terminalConnectionsRef.current.delete(tabId);
    }
    connectionCallbacksRef.current.delete(tabId);
  }, []);

  const closeTab = useCallback(
    (workspaceId: string, tabId: string) => {
      // Dispose the terminal instance when closing the tab
      const instance = terminalInstancesRef.current.get(tabId);
      if (instance) {
        instance.terminal.dispose();
        terminalInstancesRef.current.delete(tabId);
      }
      // Close the WebSocket connection
      closeTerminalConnection(tabId);
      dispatch({ type: 'CLOSE_TAB', workspaceId, tabId });
    },
    [closeTerminalConnection]
  );

  const setActiveTab = useCallback((workspaceId: string, tabId: string) => {
    dispatch({ type: 'SET_ACTIVE_TAB', workspaceId, tabId });
  }, []);

  const updateTabTitle = useCallback(
    (workspaceId: string, tabId: string, title: string) => {
      dispatch({ type: 'UPDATE_TAB_TITLE', workspaceId, tabId, title });
    },
    []
  );

  const clearWorkspaceTabs = useCallback(
    (workspaceId: string) => {
      // Dispose all terminal instances for this workspace
      const tabs = state.tabsByWorkspace[workspaceId] || [];
      tabs.forEach((tab) => {
        const instance = terminalInstancesRef.current.get(tab.id);
        if (instance) {
          instance.terminal.dispose();
          terminalInstancesRef.current.delete(tab.id);
        }
        // Close WebSocket connections
        closeTerminalConnection(tab.id);
      });
      dispatch({ type: 'CLEAR_WORKSPACE_TABS', workspaceId });
    },
    [state.tabsByWorkspace, closeTerminalConnection]
  );

  const registerTerminalInstance = useCallback(
    (tabId: string, terminal: Terminal, fitAddon: FitAddon) => {
      terminalInstancesRef.current.set(tabId, { terminal, fitAddon });
    },
    []
  );

  const getTerminalInstance = useCallback(
    (tabId: string): TerminalInstance | null => {
      return terminalInstancesRef.current.get(tabId) || null;
    },
    []
  );

  const unregisterTerminalInstance = useCallback((tabId: string) => {
    terminalInstancesRef.current.delete(tabId);
  }, []);

  const createTerminalConnection = useCallback(
    (
      tabId: string,
      endpoint: string,
      onData: (data: string) => void,
      onExit?: () => void
    ) => {
      // Close existing connection if any
      const existing = terminalConnectionsRef.current.get(tabId);
      if (existing) {
        existing.ws.close();
      }

      // Store callbacks in ref so they can be updated without recreating connection
      connectionCallbacksRef.current.set(tabId, { onData, onExit });

      // Initialize or reset reconnection state
      const existingReconnectState = reconnectStateRef.current.get(tabId);
      if (existingReconnectState?.retryTimer) {
        clearTimeout(existingReconnectState.retryTimer);
      }
      reconnectStateRef.current.set(tabId, {
        endpoint,
        retryCount: 0,
        retryTimer: null,
        intentionallyClosed: false,
      });

      const scheduleReconnect = () => {
        const state = reconnectStateRef.current.get(tabId);
        if (!state || state.intentionallyClosed) {
          return;
        }

        const maxRetries = 6;
        if (state.retryCount >= maxRetries) {
          return;
        }

        const delay = Math.min(8000, 500 * Math.pow(2, state.retryCount));
        state.retryCount += 1;
        state.retryTimer = setTimeout(() => {
          state.retryTimer = null;
          connectWebSocket();
        }, delay);
      };

      const connectWebSocket = () => {
        const reconnectState = reconnectStateRef.current.get(tabId);
        if (!reconnectState || reconnectState.intentionallyClosed) {
          return;
        }

        void (async () => {
          try {
            const ws = await openLocalApiWebSocket(endpoint);
            const state = reconnectStateRef.current.get(tabId);
            if (!state || state.intentionallyClosed) {
              ws.close();
              return;
            }

            ws.onopen = () => {
              // Reset retry count on successful connection
              const latestState = reconnectStateRef.current.get(tabId);
              if (latestState) {
                latestState.retryCount = 0;
              }
            };

            ws.onmessage = (event) => {
              try {
                const msg = JSON.parse(event.data);
                const callbacks = connectionCallbacksRef.current.get(tabId);
                if (msg.type === 'output' && msg.data && callbacks) {
                  callbacks.onData(decodeBase64(msg.data));
                } else if (msg.type === 'exit' && callbacks) {
                  callbacks.onExit?.();
                }
              } catch {
                // Ignore parse errors
              }
            };

            ws.onerror = () => {
              // Error will be followed by onclose, so we handle reconnection there
            };

            ws.onclose = (event) => {
              const latestState = reconnectStateRef.current.get(tabId);
              if (!latestState || latestState.intentionallyClosed) {
                return;
              }

              // Don't reconnect on clean close (code 1000) or if shell exited
              if (event.code === 1000 && event.wasClean) {
                return;
              }

              scheduleReconnect();
            };

            const send = (data: string) => {
              if (ws.readyState === WebSocket.OPEN) {
                ws.send(
                  JSON.stringify({ type: 'input', data: encodeBase64(data) })
                );
              }
            };

            const resize = (cols: number, rows: number) => {
              if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ type: 'resize', cols, rows }));
              }
            };

            const connection: TerminalConnection = { ws, send, resize };
            terminalConnectionsRef.current.set(tabId, connection);
          } catch {
            scheduleReconnect();
          }
        })();
      };

      connectWebSocket();

      // Return functions that use the current connection
      const send = (data: string) => {
        const conn = terminalConnectionsRef.current.get(tabId);
        conn?.send(data);
      };

      const resize = (cols: number, rows: number) => {
        const conn = terminalConnectionsRef.current.get(tabId);
        conn?.resize(cols, rows);
      };

      return { send, resize };
    },
    []
  );

  const getTerminalConnection = useCallback(
    (tabId: string): TerminalConnection | null => {
      return terminalConnectionsRef.current.get(tabId) || null;
    },
    []
  );

  const value = useMemo(
    () => ({
      getTabsForWorkspace,
      getActiveTab,
      createTab,
      closeTab,
      setActiveTab,
      updateTabTitle,
      clearWorkspaceTabs,
      registerTerminalInstance,
      getTerminalInstance,
      unregisterTerminalInstance,
      createTerminalConnection,
      getTerminalConnection,
    }),
    [
      getTabsForWorkspace,
      getActiveTab,
      createTab,
      closeTab,
      setActiveTab,
      updateTabTitle,
      clearWorkspaceTabs,
      registerTerminalInstance,
      getTerminalInstance,
      unregisterTerminalInstance,
      createTerminalConnection,
      getTerminalConnection,
    ]
  );

  return (
    <TerminalContext.Provider value={value}>
      {children}
    </TerminalContext.Provider>
  );
}
