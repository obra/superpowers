import { useCallback, useEffect, useMemo, useRef } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import '@xterm/xterm/css/xterm.css';

import { useTheme } from '@/shared/hooks/useTheme';
import { getTerminalTheme } from '@/shared/lib/terminalTheme';
import { useTerminal } from '@/shared/hooks/useTerminal';

interface XTermInstanceProps {
  tabId: string;
  workspaceId: string;
  isActive: boolean;
  onClose?: () => void;
}

export function XTermInstance({
  tabId,
  workspaceId,
  isActive,
  onClose,
}: XTermInstanceProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const resizeRef = useRef<HTMLDivElement>(null);
  const terminalRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const initialSizeRef = useRef({ cols: 80, rows: 24 });
  const { theme } = useTheme();
  const {
    registerTerminalInstance,
    getTerminalInstance,
    createTerminalConnection,
    getTerminalConnection,
  } = useTerminal();

  const endpoint = useMemo(() => {
    const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';
    const host = window.location.host;
    return `${protocol}//${host}/api/terminal/ws?workspace_id=${workspaceId}&cols=${initialSizeRef.current.cols}&rows=${initialSizeRef.current.rows}`;
  }, [workspaceId]);

  const fitTerminal = useCallback(() => {
    fitAddonRef.current?.fit();
    if (terminalRef.current) {
      const conn = getTerminalConnection(tabId);
      conn?.resize(terminalRef.current.cols, terminalRef.current.rows);
    }
  }, [tabId, getTerminalConnection]);

  useEffect(() => {
    if (!containerRef.current) return;

    const existing = getTerminalInstance(tabId);
    if (existing) {
      const { terminal, fitAddon } = existing;
      if (terminal.element) {
        containerRef.current.appendChild(terminal.element);
        fitAddon.fit();
      }
      terminalRef.current = terminal;
      fitAddonRef.current = fitAddon;
      return;
    }

    if (terminalRef.current) return;

    const terminal = new Terminal({
      cursorBlink: true,
      fontSize: 12,
      fontFamily: '"IBM Plex Mono", monospace',
      theme: getTerminalTheme(),
    });

    const fitAddon = new FitAddon();
    const webLinksAddon = new WebLinksAddon();

    terminal.loadAddon(fitAddon);
    terminal.loadAddon(webLinksAddon);
    terminal.open(containerRef.current);

    fitAddon.fit();
    initialSizeRef.current = { cols: terminal.cols, rows: terminal.rows };

    terminalRef.current = terminal;
    fitAddonRef.current = fitAddon;

    if (!getTerminalConnection(tabId)) {
      createTerminalConnection(
        tabId,
        endpoint,
        (data) => terminal?.write(data),
        onClose
      );
    }

    registerTerminalInstance(tabId, terminal, fitAddon);

    terminal.onData((data) => {
      const conn = getTerminalConnection(tabId);
      conn?.send(data);
    });

    return () => {
      if (terminal.element && terminal.element.parentNode) {
        terminal.element.parentNode.removeChild(terminal.element);
      }
      terminalRef.current = null;
      fitAddonRef.current = null;
    };
  }, [
    tabId,
    endpoint,
    onClose,
    getTerminalInstance,
    registerTerminalInstance,
    createTerminalConnection,
    getTerminalConnection,
  ]);

  useEffect(() => {
    if (!resizeRef.current) return;
    const observer = new ResizeObserver(fitTerminal);
    observer.observe(resizeRef.current);
    return () => observer.disconnect();
  }, [fitTerminal]);

  useEffect(() => {
    if (isActive) terminalRef.current?.focus();
  }, [isActive]);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.options.theme = getTerminalTheme();
    }
  }, [theme]);

  return (
    <div ref={resizeRef} className="w-full h-full px-2 py-1">
      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
}
