import { useMemo } from 'react';
import { useLocation, useParams, useSearch } from '@tanstack/react-router';
import {
  useUiPreferencesStore,
  useWorkspacePanelState,
  type LayoutMode,
} from '@/shared/stores/useUiPreferencesStore';
import {
  useDiffViewStore,
  useDiffViewMode,
} from '@/shared/stores/useDiffViewStore';
import { useWorkspaceContext } from '@/shared/hooks/useWorkspaceContext';
import { useUserSystem } from '@/shared/hooks/useUserSystem';
import { useDevServer } from '@/shared/hooks/useDevServer';
import { useBranchStatus } from '@/shared/hooks/useBranchStatus';
import { useShape } from '@/shared/integrations/electric/hooks';
import { useExecutionProcessesContext } from '@/shared/hooks/useExecutionProcessesContext';
import { useLogsPanel } from '@/shared/hooks/useLogsPanel';
import { useAuth } from '@/shared/hooks/auth/useAuth';
import { PROJECT_ISSUES_SHAPE } from 'shared/remote-types';
import type { Merge } from 'shared/types';
import type {
  ActionVisibilityContext,
  DevServerState,
} from '@/shared/types/actions';

interface ActionVisibilityOptions {
  projectId?: string;
  issueIds?: string[];
}

/**
 * Hook that builds the visibility context from stores/context.
 * Used by both NavbarContainer and CommandBarDialog to evaluate
 * action visibility and state conditions.
 */
export function useActionVisibilityContext(
  options?: ActionVisibilityOptions
): ActionVisibilityContext {
  const { workspace, workspaceId, isCreateMode, repos } = useWorkspaceContext();
  // Use workspace-specific panel state (pass undefined when in create mode)
  const panelState = useWorkspacePanelState(
    isCreateMode ? undefined : workspaceId
  );
  const diffPaths = useDiffViewStore((s) => s.diffPaths);
  const diffViewMode = useDiffViewMode();
  const expanded = useUiPreferencesStore((s) => s.expanded);

  // Derive kanban state from URL (URL is single source of truth)
  const { projectId: routeProjectId, issueId: routeIssueId } = useParams({
    strict: false,
  });
  const search = useSearch({ strict: false });
  const kanbanCreateMode = search.mode === 'create';
  const effectiveProjectId = options?.projectId ?? routeProjectId;
  const optionIssueIds = options?.issueIds;
  const effectiveIssueIds = useMemo(
    () => optionIssueIds ?? (routeIssueId ? [routeIssueId] : []),
    [optionIssueIds, routeIssueId]
  );
  const hasSelectedKanbanIssue = effectiveIssueIds.length > 0;
  const shouldResolveSelectedIssueParent =
    !!effectiveProjectId && effectiveIssueIds.length === 1;

  const projectIssuesParams = useMemo(
    () => ({ project_id: effectiveProjectId ?? '' }),
    [effectiveProjectId]
  );
  const { data: projectIssues } = useShape(
    PROJECT_ISSUES_SHAPE,
    projectIssuesParams,
    {
      enabled: shouldResolveSelectedIssueParent,
    }
  );
  const hasSelectedKanbanIssueParent = useMemo(() => {
    if (!shouldResolveSelectedIssueParent) return false;
    const selectedIssue = projectIssues.find(
      (issue) => issue.id === effectiveIssueIds[0]
    );
    return !!selectedIssue?.parent_issue_id;
  }, [shouldResolveSelectedIssueParent, projectIssues, effectiveIssueIds]);

  // Derive layoutMode from current route instead of persisted state
  const location = useLocation();
  const layoutMode: LayoutMode = location.pathname.startsWith('/projects')
    ? 'kanban'
    : location.pathname.startsWith('/migrate')
      ? 'migrate'
      : 'workspaces';
  const { config } = useUserSystem();
  const { isStarting, isStopping, runningDevServers } =
    useDevServer(workspaceId);
  const { data: branchStatus } = useBranchStatus(workspaceId);
  const { isAttemptRunningVisible } = useExecutionProcessesContext();
  const { logsPanelContent } = useLogsPanel();
  const { isSignedIn } = useAuth();

  return useMemo(() => {
    // Compute isAllDiffsExpanded
    const diffKeys = diffPaths.map((p) => `diff:${p}`);
    const isAllDiffsExpanded =
      diffKeys.length > 0 && diffKeys.every((k) => expanded[k] !== false);

    // Compute dev server state
    const devServerState: DevServerState = isStarting
      ? 'starting'
      : isStopping
        ? 'stopping'
        : runningDevServers.length > 0
          ? 'running'
          : 'stopped';

    // Compute git state from branch status
    const hasOpenPR =
      branchStatus?.some((repo) =>
        repo.merges?.some(
          (m: Merge) => m.type === 'pr' && m.pr_info.status === 'open'
        )
      ) ?? false;

    const hasUnpushedCommits =
      branchStatus?.some((repo) => (repo.remote_commits_ahead ?? 0) > 0) ??
      false;

    return {
      layoutMode,
      rightMainPanelMode: panelState.rightMainPanelMode,
      isLeftSidebarVisible: panelState.isLeftSidebarVisible,
      isLeftMainPanelVisible: panelState.isLeftMainPanelVisible,
      isRightSidebarVisible: panelState.isRightSidebarVisible,
      isCreateMode,
      hasWorkspace: !!workspace,
      workspaceArchived: workspace?.archived ?? false,
      hasDiffs: diffPaths.length > 0,
      diffViewMode,
      isAllDiffsExpanded,
      editorType: config?.editor?.editor_type ?? null,
      devServerState,
      runningDevServers,
      hasGitRepos: repos.length > 0,
      hasMultipleRepos: repos.length > 1,
      hasOpenPR,
      hasUnpushedCommits,
      isAttemptRunning: isAttemptRunningVisible,
      logsPanelContent,
      hasSelectedKanbanIssue,
      hasSelectedKanbanIssueParent,
      isCreatingIssue: kanbanCreateMode,
      isSignedIn,
    };
  }, [
    layoutMode,
    panelState.rightMainPanelMode,
    panelState.isLeftSidebarVisible,
    panelState.isLeftMainPanelVisible,
    panelState.isRightSidebarVisible,
    isCreateMode,
    workspace,
    repos,
    diffPaths,
    diffViewMode,
    expanded,
    config?.editor?.editor_type,
    isStarting,
    isStopping,
    runningDevServers,
    branchStatus,
    isAttemptRunningVisible,
    logsPanelContent,
    hasSelectedKanbanIssue,
    hasSelectedKanbanIssueParent,
    kanbanCreateMode,
    isSignedIn,
  ]);
}
