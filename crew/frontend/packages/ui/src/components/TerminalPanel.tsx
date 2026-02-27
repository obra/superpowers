import type { ReactNode } from 'react';

interface TerminalPanelProps {
  tabs: { id: string }[];
  activeTabId: string | null;
  renderTab: (tabId: string, isActive: boolean) => ReactNode;
}

export function TerminalPanel({
  tabs,
  activeTabId,
  renderTab,
}: TerminalPanelProps) {
  return <>{tabs.map((tab) => renderTab(tab.id, tab.id === activeTabId))}</>;
}
