import { useEffect, useRef } from 'react';
import { useWorkspaceContext } from '@/shared/hooks/useWorkspaceContext';
import { useTerminal } from '@/shared/hooks/useTerminal';
import { TerminalPanel } from '@vibe/ui/components/TerminalPanel';
import { XTermInstance } from './XTermInstance';

export function TerminalPanelContainer() {
  const { workspace } = useWorkspaceContext();
  const {
    getTabsForWorkspace,
    getActiveTab,
    createTab,
    closeTab,
    clearWorkspaceTabs,
  } = useTerminal();

  const workspaceId = workspace?.id;
  const containerRef = workspace?.container_ref ?? null;
  const tabs = workspaceId ? getTabsForWorkspace(workspaceId) : [];
  const activeTab = workspaceId ? getActiveTab(workspaceId) : null;

  const creatingRef = useRef(false);
  const prevWorkspaceIdRef = useRef<string | null>(null);

  // Clean up terminals when workspace changes
  useEffect(() => {
    if (
      prevWorkspaceIdRef.current &&
      prevWorkspaceIdRef.current !== workspaceId
    ) {
      clearWorkspaceTabs(prevWorkspaceIdRef.current);
    }
    prevWorkspaceIdRef.current = workspaceId ?? null;
  }, [workspaceId, clearWorkspaceTabs]);

  // Auto-create first tab when workspace is selected and terminal mode is active
  useEffect(() => {
    if (
      workspaceId &&
      containerRef &&
      tabs.length === 0 &&
      !creatingRef.current
    ) {
      creatingRef.current = true;
      createTab(workspaceId, containerRef);
    }
    if (tabs.length > 0) {
      creatingRef.current = false;
    }
  }, [workspaceId, containerRef, tabs.length, createTab]);

  return (
    <TerminalPanel
      tabs={tabs}
      activeTabId={activeTab?.id ?? null}
      renderTab={(tabId, isActive) => (
        <XTermInstance
          key={tabId}
          tabId={tabId}
          workspaceId={workspaceId ?? ''}
          isActive={isActive}
          onClose={() => workspaceId && closeTab(workspaceId, tabId)}
        />
      )}
    />
  );
}
