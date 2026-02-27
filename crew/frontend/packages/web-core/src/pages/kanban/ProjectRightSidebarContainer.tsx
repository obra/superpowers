import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { ArrowsOutIcon, XIcon } from '@phosphor-icons/react';
import { useProjectContext } from '@/shared/hooks/useProjectContext';
import { useUserContext } from '@/shared/hooks/useUserContext';
import { useWorkspaceContext } from '@/shared/hooks/useWorkspaceContext';
import { ExecutionProcessesProvider } from '@/shared/providers/ExecutionProcessesProvider';
import { ApprovalFeedbackProvider } from '@/features/workspace-chat/model/contexts/ApprovalFeedbackContext';
import { EntriesProvider } from '@/features/workspace-chat/model/contexts/EntriesContext';
import { MessageEditProvider } from '@/features/workspace-chat/model/contexts/MessageEditContext';
import { CreateModeProvider } from '@/integrations/CreateModeProvider';
import { useWorkspaceSessions } from '@/shared/hooks/useWorkspaceSessions';
import { useAttempt } from '@/shared/hooks/useAttempt';
import { useKanbanNavigation } from '@/shared/hooks/useKanbanNavigation';
import { SessionChatBoxContainer } from '@/features/workspace-chat/ui/SessionChatBoxContainer';
import { CreateChatBoxContainer } from '@/shared/components/CreateChatBoxContainer';
import { KanbanIssuePanelContainer } from './KanbanIssuePanelContainer';
import {
  ConversationList,
  type ConversationListHandle,
} from '@/features/workspace-chat/ui/ConversationListContainer';
import { RetryUiProvider } from '@/features/workspace-chat/model/contexts/RetryUiContext';
import { createWorkspaceWithSession } from '@/shared/types/attempt';
import { toWorkspace } from '@/shared/lib/routes/navigation';

interface WorkspaceSessionPanelProps {
  workspaceId: string;
  onClose: () => void;
}

interface WorkspaceCreatePanelProps {
  linkedIssueId: string | null;
  linkedIssueSimpleId: string | null;
  onOpenIssue: (issueId: string) => void;
  onClose: () => void;
  children: ReactNode;
}

type IssuePanelResolution = 'resolving' | 'ready' | 'missing';

type RightPanelState =
  | { kind: 'closed' }
  | { kind: 'create-issue' }
  | { kind: 'issue'; issueId: string; resolution: IssuePanelResolution }
  | { kind: 'issue-workspace'; workspaceId: string }
  | { kind: 'workspace-create'; draftId: string; issueId: string | null };

function resolveIssuePanelResolution({
  issueId,
  hasIssue,
  isProjectLoading,
  expectedIssueId,
}: {
  issueId: string;
  hasIssue: boolean;
  isProjectLoading: boolean;
  expectedIssueId: string | null;
}): IssuePanelResolution {
  if (isProjectLoading) {
    return 'resolving';
  }

  if (hasIssue) {
    return 'ready';
  }

  if (expectedIssueId === issueId) {
    return 'resolving';
  }

  return 'missing';
}

function WorkspaceCreatePanel({
  linkedIssueId,
  linkedIssueSimpleId,
  onOpenIssue,
  onClose,
  children,
}: WorkspaceCreatePanelProps) {
  const { t } = useTranslation('tasks');
  const breadcrumbButtonClass =
    'min-w-0 text-sm text-normal truncate rounded-sm px-1 py-0.5 hover:bg-panel hover:text-high transition-colors';

  const handleOpenIssue = useCallback(() => {
    if (linkedIssueId) {
      onOpenIssue(linkedIssueId);
      return;
    }
    onClose();
  }, [linkedIssueId, onOpenIssue, onClose]);

  return (
    <div className="relative flex h-full flex-1 flex-col bg-primary">
      <div className="flex items-center justify-between px-base py-half border-b shrink-0">
        <div className="flex items-center gap-half min-w-0 font-ibm-plex-mono">
          <button
            type="button"
            onClick={handleOpenIssue}
            className={`${breadcrumbButtonClass} shrink-0`}
            aria-label="Open linked issue"
          >
            {linkedIssueSimpleId ?? 'Issue'}
          </button>
          <span className="text-low text-sm shrink-0">/</span>
          <span className={breadcrumbButtonClass}>
            {t('createWorkspaceFromPr.createWorkspace')}
          </span>
        </div>
        <div className="flex items-center gap-half">
          <button
            type="button"
            onClick={onClose}
            className="p-half rounded-sm text-low hover:text-normal hover:bg-panel transition-colors"
            aria-label="Close create workspace view"
          >
            <XIcon className="size-icon-sm" weight="bold" />
          </button>
        </div>
      </div>
      <div className="flex-1 min-h-0">{children}</div>
    </div>
  );
}

function WorkspaceSessionPanel({
  workspaceId,
  onClose,
}: WorkspaceSessionPanelProps) {
  const navigate = useNavigate();
  const { issueId: routeIssueId, openIssue } = useKanbanNavigation();
  const { projectId, getIssue } = useProjectContext();
  const { workspaces: remoteWorkspaces } = useUserContext();
  const { activeWorkspaces, archivedWorkspaces } = useWorkspaceContext();
  const conversationListRef = useRef<ConversationListHandle>(null);
  const { data: workspace, isLoading: isWorkspaceLoading } = useAttempt(
    workspaceId,
    { enabled: !!workspaceId }
  );
  const {
    sessions,
    selectedSession,
    selectedSessionId,
    selectSession,
    isLoading: isSessionsLoading,
    isNewSessionMode,
    startNewSession,
  } = useWorkspaceSessions(workspaceId, { enabled: !!workspaceId });

  const workspaceSummary = useMemo(
    () =>
      [...activeWorkspaces, ...archivedWorkspaces].find(
        (workspace) => workspace.id === workspaceId
      ),
    [activeWorkspaces, archivedWorkspaces, workspaceId]
  );

  const linkedWorkspace = useMemo(
    () =>
      remoteWorkspaces.find(
        (ws) =>
          ws.local_workspace_id === workspaceId && ws.project_id === projectId
      ) ?? null,
    [remoteWorkspaces, workspaceId, projectId]
  );

  const linkedIssueId = linkedWorkspace?.issue_id ?? null;
  const breadcrumbIssueId = routeIssueId ?? linkedIssueId;

  const issueSimpleId = useMemo(() => {
    if (!breadcrumbIssueId) return null;
    return getIssue(breadcrumbIssueId)?.simple_id ?? null;
  }, [breadcrumbIssueId, getIssue]);

  const workspaceBranch = workspace?.branch ?? workspaceSummary?.branch ?? null;

  const handleOpenIssuePanel = useCallback(() => {
    if (breadcrumbIssueId) {
      openIssue(breadcrumbIssueId);
      return;
    }
    onClose();
  }, [breadcrumbIssueId, openIssue, onClose]);

  const handleOpenWorkspaceView = useCallback(() => {
    navigate(toWorkspace(workspaceId));
  }, [navigate, workspaceId]);

  const breadcrumbButtonClass =
    'min-w-0 text-sm text-normal truncate rounded-sm px-1 py-0.5 hover:bg-panel hover:text-high transition-colors';

  const workspaceWithSession = useMemo(() => {
    if (!workspace) return undefined;
    return createWorkspaceWithSession(workspace, selectedSession);
  }, [workspace, selectedSession]);

  const handleScrollToPreviousMessage = useCallback(() => {
    conversationListRef.current?.scrollToPreviousUserMessage();
  }, []);

  const handleScrollToBottom = useCallback(() => {
    conversationListRef.current?.scrollToBottom();
  }, []);

  return (
    <ExecutionProcessesProvider
      key={`${workspaceId}-${selectedSessionId ?? 'new'}`}
      sessionId={selectedSessionId}
    >
      <ApprovalFeedbackProvider>
        <EntriesProvider key={`${workspaceId}-${selectedSessionId ?? 'new'}`}>
          <MessageEditProvider>
            <div className="relative flex h-full flex-1 flex-col bg-primary">
              <div className="flex items-center justify-between px-base py-half border-b shrink-0">
                <div className="flex items-center gap-half min-w-0 font-ibm-plex-mono">
                  <button
                    type="button"
                    onClick={handleOpenIssuePanel}
                    className={`${breadcrumbButtonClass} shrink-0`}
                    aria-label="Open linked issue"
                  >
                    {issueSimpleId ?? 'Issue'}
                  </button>
                  <span className="text-low text-sm shrink-0">/</span>
                  <button
                    type="button"
                    onClick={handleOpenWorkspaceView}
                    className={breadcrumbButtonClass}
                    aria-label="Open workspace"
                  >
                    {workspaceBranch ?? 'Workspace'}
                  </button>
                </div>

                <div className="flex items-center gap-half">
                  <button
                    type="button"
                    onClick={handleOpenWorkspaceView}
                    className="p-half rounded-sm text-low hover:text-normal hover:bg-panel transition-colors"
                    aria-label="Open in workspace view"
                  >
                    <ArrowsOutIcon className="size-icon-sm" weight="bold" />
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="p-half rounded-sm text-low hover:text-normal hover:bg-panel transition-colors"
                    aria-label="Close conversation view"
                  >
                    <XIcon className="size-icon-sm" weight="bold" />
                  </button>
                </div>
              </div>

              {workspaceWithSession ? (
                <div className="flex flex-1 min-h-0 overflow-hidden justify-center">
                  <div className="w-chat max-w-full h-full">
                    <RetryUiProvider attemptId={workspaceWithSession.id}>
                      <ConversationList
                        ref={conversationListRef}
                        attempt={workspaceWithSession}
                      />
                    </RetryUiProvider>
                  </div>
                </div>
              ) : (
                <div className="flex-1" />
              )}

              <div className="flex justify-center @container pl-px">
                <SessionChatBoxContainer
                  {...(isSessionsLoading || isWorkspaceLoading
                    ? {
                        mode: 'placeholder' as const,
                      }
                    : isNewSessionMode
                      ? {
                          mode: 'new-session' as const,
                          workspaceId,
                          onSelectSession: selectSession,
                        }
                      : selectedSession
                        ? {
                            mode: 'existing-session' as const,
                            session: selectedSession,
                            onSelectSession: selectSession,
                            onStartNewSession: startNewSession,
                          }
                        : {
                            mode: 'placeholder' as const,
                          })}
                  sessions={sessions}
                  filesChanged={workspaceSummary?.filesChanged ?? 0}
                  linesAdded={workspaceSummary?.linesAdded ?? 0}
                  linesRemoved={workspaceSummary?.linesRemoved ?? 0}
                  disableViewCode
                  showOpenWorkspaceButton
                  onScrollToPreviousMessage={handleScrollToPreviousMessage}
                  onScrollToBottom={handleScrollToBottom}
                />
              </div>
            </div>
          </MessageEditProvider>
        </EntriesProvider>
      </ApprovalFeedbackProvider>
    </ExecutionProcessesProvider>
  );
}

export function ProjectRightSidebarContainer() {
  const navigate = useNavigate();
  const {
    getIssue,
    isLoading: isProjectLoading,
    issuesById,
  } = useProjectContext();
  const {
    issueId,
    workspaceId,
    draftId,
    isCreateMode,
    isWorkspaceCreateMode,
    openIssue,
    openIssueWorkspace,
    closePanel,
  } = useKanbanNavigation();
  const [expectedIssueId, setExpectedIssueId] = useState<string | null>(null);

  const markExpectedIssue = useCallback((nextIssueId: string) => {
    setExpectedIssueId(nextIssueId);
  }, []);

  // Keep transient create expectations scoped to the current issue route only.
  useEffect(() => {
    if (!expectedIssueId) {
      return;
    }

    if (!issueId || issueId !== expectedIssueId) {
      setExpectedIssueId(null);
      return;
    }

    if (issuesById.has(expectedIssueId)) {
      setExpectedIssueId(null);
    }
  }, [expectedIssueId, issueId, issuesById]);

  const issuePanelResolution = useMemo<IssuePanelResolution | null>(() => {
    if (!issueId || isCreateMode || workspaceId || isWorkspaceCreateMode) {
      return null;
    }

    return resolveIssuePanelResolution({
      issueId,
      hasIssue: issuesById.has(issueId),
      isProjectLoading,
      expectedIssueId,
    });
  }, [
    issueId,
    isCreateMode,
    workspaceId,
    isWorkspaceCreateMode,
    issuesById,
    isProjectLoading,
    expectedIssueId,
  ]);

  const rightPanelState = useMemo<RightPanelState>(() => {
    if (isWorkspaceCreateMode) {
      if (draftId) {
        return {
          kind: 'workspace-create',
          draftId,
          issueId,
        };
      }
      return { kind: 'closed' };
    }

    if (workspaceId) {
      return { kind: 'issue-workspace', workspaceId };
    }

    if (isCreateMode) {
      return { kind: 'create-issue' };
    }

    if (issueId) {
      return {
        kind: 'issue',
        issueId,
        resolution: issuePanelResolution ?? 'resolving',
      };
    }

    return { kind: 'closed' };
  }, [
    isWorkspaceCreateMode,
    draftId,
    issueId,
    workspaceId,
    isCreateMode,
    issuePanelResolution,
  ]);

  const handleOpenIssueFromCreate = useCallback(
    (targetIssueId: string) => {
      openIssue(targetIssueId);
    },
    [openIssue]
  );

  const handleWorkspaceCreated = useCallback(
    (createdWorkspaceId: string) => {
      if (issueId) {
        openIssueWorkspace(issueId, createdWorkspaceId);
        return;
      }

      navigate(toWorkspace(createdWorkspaceId));
    },
    [issueId, openIssueWorkspace, navigate]
  );

  useEffect(() => {
    if (rightPanelState.kind !== 'issue') {
      return;
    }

    if (rightPanelState.resolution !== 'missing') {
      return;
    }

    closePanel();
  }, [rightPanelState, closePanel]);

  if (rightPanelState.kind === 'workspace-create') {
    const linkedIssueId = rightPanelState.issueId;
    const linkedIssueSimpleId = linkedIssueId
      ? (getIssue(linkedIssueId)?.simple_id ?? null)
      : null;

    return (
      <WorkspaceCreatePanel
        linkedIssueId={linkedIssueId}
        linkedIssueSimpleId={linkedIssueSimpleId}
        onOpenIssue={handleOpenIssueFromCreate}
        onClose={closePanel}
      >
        <CreateModeProvider
          key={rightPanelState.draftId}
          draftId={rightPanelState.draftId}
        >
          <CreateChatBoxContainer onWorkspaceCreated={handleWorkspaceCreated} />
        </CreateModeProvider>
      </WorkspaceCreatePanel>
    );
  }

  if (rightPanelState.kind === 'issue-workspace') {
    return (
      <WorkspaceSessionPanel
        workspaceId={rightPanelState.workspaceId}
        onClose={closePanel}
      />
    );
  }

  if (rightPanelState.kind === 'closed') {
    return null;
  }

  return (
    <KanbanIssuePanelContainer
      issueResolution={
        rightPanelState.kind === 'issue' ? rightPanelState.resolution : null
      }
      onExpectIssueOpen={markExpectedIssue}
    />
  );
}
