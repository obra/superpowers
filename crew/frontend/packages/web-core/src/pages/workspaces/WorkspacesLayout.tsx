import { useCallback, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from '@tanstack/react-router';
import { Group, Layout, Panel, Separator } from 'react-resizable-panels';
import { useWorkspaceContext } from '@/shared/hooks/useWorkspaceContext';
import { usePageTitle } from '@/shared/hooks/usePageTitle';
import { ExecutionProcessesProvider } from '@/shared/providers/ExecutionProcessesProvider';
import { CreateModeProvider } from '@/integrations/CreateModeProvider';
import { ReviewProvider } from '@/shared/hooks/ReviewProvider';
import { ChangesViewProvider } from '@/shared/hooks/ChangesViewProvider';
import { WorkspacesSidebarContainer } from './WorkspacesSidebarContainer';
import { LogsContentContainer } from './LogsContentContainer';
import {
  WorkspacesMainContainer,
  type WorkspacesMainContainerHandle,
} from './WorkspacesMainContainer';
import { RightSidebar } from './RightSidebar';
import { ChangesPanelContainer } from './ChangesPanelContainer';
import { CreateChatBoxContainer } from '@/shared/components/CreateChatBoxContainer';
import { PreviewBrowserContainer } from './PreviewBrowserContainer';
import { WorkspacesGuideDialog } from '@/shared/dialogs/shared/WorkspacesGuideDialog';
import { useUserSystem } from '@/shared/hooks/useUserSystem';

import {
  PERSIST_KEYS,
  usePaneSize,
  useWorkspacePanelState,
  RIGHT_MAIN_PANEL_MODES,
} from '@/shared/stores/useUiPreferencesStore';
import { toWorkspace } from '@/shared/lib/routes/navigation';

const WORKSPACES_GUIDE_ID = 'workspaces-guide';

export function WorkspacesLayout() {
  const navigate = useNavigate();
  const {
    workspaceId,
    workspace: selectedWorkspace,
    isLoading,
    isCreateMode,
    selectedSession,
    selectedSessionId,
    sessions,
    selectSession,
    repos,
    isNewSessionMode,
    startNewSession,
  } = useWorkspaceContext();

  const { t } = useTranslation('common');
  usePageTitle(
    isCreateMode ? t('workspaces.newWorkspace') : selectedWorkspace?.name
  );

  const mainContainerRef = useRef<WorkspacesMainContainerHandle>(null);

  const handleScrollToBottom = useCallback(() => {
    mainContainerRef.current?.scrollToBottom();
  }, []);

  const handleWorkspaceCreated = useCallback(
    (workspaceId: string) => {
      navigate(toWorkspace(workspaceId));
    },
    [navigate]
  );

  // Use workspace-specific panel state (pass undefined when in create mode)
  const {
    isLeftSidebarVisible,
    isLeftMainPanelVisible,
    isRightSidebarVisible,
    rightMainPanelMode,
    setLeftSidebarVisible,
    setLeftMainPanelVisible,
  } = useWorkspacePanelState(isCreateMode ? undefined : workspaceId);

  const {
    config,
    updateAndSaveConfig,
    loading: configLoading,
  } = useUserSystem();
  const hasAutoShownWorkspacesGuide = useRef(false);

  // Auto-show Workspaces Guide on first visit
  useEffect(() => {
    if (hasAutoShownWorkspacesGuide.current) return;
    if (configLoading || !config) return;

    const seenFeatures = config.showcases?.seen_features ?? [];
    if (seenFeatures.includes(WORKSPACES_GUIDE_ID)) return;

    hasAutoShownWorkspacesGuide.current = true;

    void updateAndSaveConfig({
      showcases: { seen_features: [...seenFeatures, WORKSPACES_GUIDE_ID] },
    });
    WorkspacesGuideDialog.show().finally(() => WorkspacesGuideDialog.hide());
  }, [configLoading, config, updateAndSaveConfig]);

  // Ensure left panels visible when right main panel hidden
  useEffect(() => {
    if (rightMainPanelMode === null) {
      setLeftSidebarVisible(true);
      if (!isLeftMainPanelVisible) setLeftMainPanelVisible(true);
    }
  }, [
    isLeftMainPanelVisible,
    rightMainPanelMode,
    setLeftSidebarVisible,
    setLeftMainPanelVisible,
  ]);

  const [rightMainPanelSize, setRightMainPanelSize] = usePaneSize(
    PERSIST_KEYS.rightMainPanel,
    50
  );

  const defaultLayout: Layout =
    typeof rightMainPanelSize === 'number'
      ? {
          'left-main': 100 - rightMainPanelSize,
          'right-main': rightMainPanelSize,
        }
      : { 'left-main': 50, 'right-main': 50 };

  const onLayoutChange = (layout: Layout) => {
    if (isLeftMainPanelVisible && rightMainPanelMode !== null)
      setRightMainPanelSize(layout['right-main']);
  };

  const mainContent = (
    <ReviewProvider attemptId={selectedWorkspace?.id}>
      <ChangesViewProvider>
        <div className="flex h-full">
          <Group
            orientation="horizontal"
            className="flex-1 min-w-0 h-full"
            defaultLayout={defaultLayout}
            onLayoutChange={onLayoutChange}
          >
            {isLeftMainPanelVisible && (
              <Panel
                id="left-main"
                minSize="20%"
                className="min-w-0 h-full overflow-hidden"
              >
                {isCreateMode ? (
                  <CreateChatBoxContainer
                    onWorkspaceCreated={handleWorkspaceCreated}
                  />
                ) : (
                  <WorkspacesMainContainer
                    ref={mainContainerRef}
                    selectedWorkspace={selectedWorkspace ?? null}
                    selectedSession={selectedSession}
                    sessions={sessions}
                    onSelectSession={selectSession}
                    isLoading={isLoading}
                    isNewSessionMode={isNewSessionMode}
                    onStartNewSession={startNewSession}
                  />
                )}
              </Panel>
            )}

            {isLeftMainPanelVisible && rightMainPanelMode !== null && (
              <Separator
                id="main-separator"
                className="w-1 bg-transparent hover:bg-brand/50 transition-colors cursor-col-resize"
              />
            )}

            {rightMainPanelMode !== null && (
              <Panel
                id="right-main"
                minSize="20%"
                className="min-w-0 h-full overflow-hidden"
              >
                {rightMainPanelMode === RIGHT_MAIN_PANEL_MODES.CHANGES &&
                  selectedWorkspace?.id && (
                    <ChangesPanelContainer
                      className=""
                      attemptId={selectedWorkspace.id}
                    />
                  )}
                {rightMainPanelMode === RIGHT_MAIN_PANEL_MODES.LOGS && (
                  <LogsContentContainer className="" />
                )}
                {rightMainPanelMode === RIGHT_MAIN_PANEL_MODES.PREVIEW &&
                  selectedWorkspace?.id && (
                    <PreviewBrowserContainer
                      attemptId={selectedWorkspace.id}
                      className=""
                    />
                  )}
              </Panel>
            )}
          </Group>

          {isRightSidebarVisible && !isCreateMode && (
            <div className="w-[300px] shrink-0 h-full overflow-hidden">
              <RightSidebar
                rightMainPanelMode={rightMainPanelMode}
                selectedWorkspace={selectedWorkspace}
                repos={repos}
              />
            </div>
          )}
        </div>
      </ChangesViewProvider>
    </ReviewProvider>
  );

  return (
    <div className="flex flex-1 min-h-0 h-full">
      {isLeftSidebarVisible && (
        <div className="w-[300px] shrink-0 h-full overflow-hidden">
          <WorkspacesSidebarContainer onScrollToBottom={handleScrollToBottom} />
        </div>
      )}

      <div className="flex-1 min-w-0 h-full">
        {isCreateMode ? (
          <CreateModeProvider>{mainContent}</CreateModeProvider>
        ) : (
          <ExecutionProcessesProvider
            key={`${selectedWorkspace?.id}-${selectedSessionId}`}
            sessionId={selectedSessionId}
          >
            {mainContent}
          </ExecutionProcessesProvider>
        )}
      </div>
    </div>
  );
}
