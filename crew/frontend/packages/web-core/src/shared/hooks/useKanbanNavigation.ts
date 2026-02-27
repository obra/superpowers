import { useCallback, useMemo } from 'react';
import { useLocation, useNavigate, useSearch } from '@tanstack/react-router';
import type { IssuePriority } from 'shared/remote-types';
import {
  buildIssueCreatePath,
  buildIssuePath,
  buildIssueWorkspacePath,
  buildProjectRootPath,
  buildWorkspaceCreatePath,
  parseProjectSidebarRoute,
} from '@/shared/lib/routes/projectSidebarRoutes';

function isValidUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}

/**
 * Hook for project-kanban right sidebar navigation.
 * URL is the single source of truth for sidebar mode.
 *
 * URL patterns:
 * - View issue: /projects/:projectId/issues/:issueId
 * - View issue workspace: /projects/:projectId/issues/:issueId/workspaces/:workspaceId
 * - Create issue: /projects/:projectId/issues/new?statusId=xxx&priority=high
 * - Create workspace (linked): /projects/:projectId/issues/:issueId/workspaces/create/:draftId
 * - Create workspace (standalone): /projects/:projectId/workspaces/create/:draftId
 * - No issue: /projects/:projectId
 */
export function useKanbanNavigation() {
  const navigate = useNavigate();
  const location = useLocation();
  const search = useSearch({ strict: false });

  const routeState = useMemo(
    () => parseProjectSidebarRoute(location.pathname),
    [location.pathname]
  );

  const projectId = routeState?.projectId ?? null;

  const issueId = useMemo(() => {
    if (!routeState) return null;
    if (routeState.type === 'issue') return routeState.issueId;
    if (routeState.type === 'issue-workspace') return routeState.issueId;
    if (routeState.type === 'workspace-create') return routeState.issueId;
    return null;
  }, [routeState]);

  const workspaceId =
    routeState?.type === 'issue-workspace' ? routeState.workspaceId : null;
  const rawDraftId =
    routeState?.type === 'workspace-create' ? routeState.draftId : null;
  const draftId = rawDraftId && isValidUuid(rawDraftId) ? rawDraftId : null;
  const hasInvalidWorkspaceCreateDraftId =
    routeState?.type === 'workspace-create' && rawDraftId !== null && !draftId;

  const isCreateMode = routeState?.type === 'issue-create';
  const isWorkspaceCreateMode =
    routeState?.type === 'workspace-create' && draftId !== null;
  const isPanelOpen = !!routeState && routeState.type !== 'closed';

  const createDefaultStatusId = search.statusId ?? null;
  const createDefaultPriority = (search.priority as IssuePriority) ?? null;
  const createDefaultAssigneeIds =
    search.assignees?.split(',').filter(Boolean) ?? null;
  const createDefaultParentIssueId = search.parentIssueId ?? null;

  const openIssue = useCallback(
    (id: string) => {
      if (!projectId) return;
      navigate(buildIssuePath(projectId, id));
    },
    [navigate, projectId]
  );

  const openIssueWorkspace = useCallback(
    (id: string, workspaceAttemptId: string) => {
      if (!projectId) return;
      navigate(buildIssueWorkspacePath(projectId, id, workspaceAttemptId));
    },
    [navigate, projectId]
  );

  const openWorkspaceCreate = useCallback(
    (workspaceDraftId: string, options?: { issueId?: string | null }) => {
      if (!projectId) return;
      const targetIssueId = options?.issueId ?? issueId;
      navigate(
        buildWorkspaceCreatePath(projectId, workspaceDraftId, targetIssueId)
      );
    },
    [navigate, projectId, issueId]
  );

  const closePanel = useCallback(() => {
    if (!projectId) return;
    navigate(buildProjectRootPath(projectId));
  }, [navigate, projectId]);

  const startCreate = useCallback(
    (options?: {
      statusId?: string;
      priority?: IssuePriority;
      assigneeIds?: string[];
      parentIssueId?: string;
    }) => {
      if (!projectId) return;
      navigate(buildIssueCreatePath(projectId, options));
    },
    [navigate, projectId]
  );

  const updateCreateDefaults = useCallback(
    (options: {
      statusId?: string;
      priority?: IssuePriority | null;
      assigneeIds?: string[];
    }) => {
      if (!projectId || !isCreateMode) return;

      navigate({
        ...buildIssueCreatePath(projectId),
        search: {
          ...search,
          orgId: undefined,
          statusId:
            options.statusId !== undefined ? options.statusId : search.statusId,
          priority:
            options.priority !== undefined
              ? (options.priority ?? undefined)
              : search.priority,
          assignees:
            options.assigneeIds !== undefined
              ? options.assigneeIds.join(',')
              : search.assignees,
        },
        replace: true,
      });
    },
    [navigate, projectId, isCreateMode, search]
  );

  return {
    projectId,
    issueId,
    workspaceId,
    draftId,
    sidebarMode: routeState?.type ?? null,
    isCreateMode,
    isWorkspaceCreateMode,
    hasInvalidWorkspaceCreateDraftId,
    isPanelOpen,
    createDefaultStatusId,
    createDefaultPriority,
    createDefaultAssigneeIds,
    createDefaultParentIssueId,
    openIssue,
    openIssueWorkspace,
    openWorkspaceCreate,
    closePanel,
    startCreate,
    updateCreateDefaults,
  };
}
