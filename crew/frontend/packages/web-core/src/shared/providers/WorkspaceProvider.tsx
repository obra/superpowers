import { ReactNode, useMemo, useCallback, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from '@tanstack/react-router';
import { useQueryClient } from '@tanstack/react-query';
import { useWorkspaces } from '@/shared/hooks/useWorkspaces';
import { workspaceSummaryKeys } from '@/shared/hooks/workspaceSummaryKeys';
import { useAttempt } from '@/shared/hooks/useAttempt';
import { useAttemptRepo } from '@/shared/hooks/useAttemptRepo';
import { useWorkspaceSessions } from '@/shared/hooks/useWorkspaceSessions';
import { useGitHubComments } from '@/shared/hooks/useGitHubComments';
import { useDiffStream } from '@/shared/hooks/useDiffStream';
import { attemptsApi } from '@/shared/lib/api';
import { useDiffViewStore } from '@/shared/stores/useDiffViewStore';
import {
  toWorkspace,
  toWorkspacesCreate,
} from '@/shared/lib/routes/navigation';
import type { DiffStats } from 'shared/types';

import { WorkspaceContext } from '@/shared/hooks/useWorkspaceContext';

interface WorkspaceProviderProps {
  children: ReactNode;
}

export function WorkspaceProvider({ children }: WorkspaceProviderProps) {
  const { workspaceId } = useParams({ strict: false });
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();

  // Derive isCreateMode from URL path instead of prop to allow provider to persist across route changes
  const isCreateMode = location.pathname === '/workspaces/create';

  // Fetch workspaces for sidebar display
  const {
    workspaces: activeWorkspaces,
    archivedWorkspaces,
    isLoading: isLoadingList,
  } = useWorkspaces();

  // Fetch real workspace data for the selected workspace
  const { data: workspace, isLoading: isLoadingWorkspace } = useAttempt(
    workspaceId,
    { enabled: !!workspaceId && !isCreateMode }
  );

  // Fetch sessions for the current workspace
  const {
    sessions,
    selectedSession,
    selectedSessionId,
    selectSession,
    selectLatestSession,
    isLoading: isSessionsLoading,
    isNewSessionMode,
    startNewSession,
  } = useWorkspaceSessions(workspaceId, { enabled: !isCreateMode });

  // Fetch repos for the current workspace
  const { repos, isLoading: isReposLoading } = useAttemptRepo(workspaceId, {
    enabled: !isCreateMode,
  });

  // Get first repo ID for PR comments.
  // TODO: Support multiple repos - currently only fetches comments from the primary repo.
  const primaryRepoId = repos[0]?.id;

  // Check if current workspace has a PR attached (from workspace summaries)
  const currentWorkspaceSummary = activeWorkspaces.find(
    (w) => w.id === workspaceId
  );
  const hasPrAttached = !!currentWorkspaceSummary?.prStatus;

  // GitHub comments hook (fetching, normalization, and helpers)
  const {
    gitHubComments,
    isGitHubCommentsLoading,
    showGitHubComments,
    setShowGitHubComments,
    getGitHubCommentsForFile,
    getGitHubCommentCountForFile,
    getFilesWithGitHubComments,
    getFirstCommentLineForFile,
  } = useGitHubComments({
    workspaceId,
    repoId: primaryRepoId,
    enabled: !isCreateMode && hasPrAttached,
  });

  // Stream diffs for the current workspace
  const { diffs } = useDiffStream(workspaceId ?? null, !isCreateMode);

  const diffPaths = useMemo(
    () =>
      new Set(diffs.map((d) => d.newPath || d.oldPath || '').filter(Boolean)),
    [diffs]
  );

  // Sync diffPaths to store for expand/collapse all functionality
  useEffect(() => {
    useDiffViewStore.getState().setDiffPaths(Array.from(diffPaths));
    return () => useDiffViewStore.getState().setDiffPaths([]);
  }, [diffPaths]);

  const diffStats: DiffStats = useMemo(
    () => ({
      files_changed: diffs.length,
      lines_added: diffs.reduce((sum, d) => sum + (d.additions ?? 0), 0),
      lines_removed: diffs.reduce((sum, d) => sum + (d.deletions ?? 0), 0),
    }),
    [diffs]
  );

  const isLoading = isLoadingList || isLoadingWorkspace;

  const selectWorkspace = useCallback(
    (id: string) => {
      // Fire-and-forget mark as seen (don't block navigation)
      attemptsApi
        .markSeen(id)
        .then(() => {
          // Invalidate summary cache to refresh unseen indicators
          queryClient.invalidateQueries({ queryKey: workspaceSummaryKeys.all });
        })
        .catch((error) => {
          // Silently fail - this is not critical
          console.warn('Failed to mark workspace as seen:', error);
        });
      navigate(toWorkspace(id));
    },
    [navigate, queryClient]
  );

  const navigateToCreate = useMemo(
    () => () => {
      navigate(toWorkspacesCreate());
    },
    [navigate]
  );

  const value = useMemo(
    () => ({
      workspaceId,
      workspace,
      activeWorkspaces,
      archivedWorkspaces,
      isLoading,
      isCreateMode,
      selectWorkspace,
      navigateToCreate,
      sessions,
      selectedSession,
      selectedSessionId,
      selectSession,
      selectLatestSession,
      isSessionsLoading,
      isNewSessionMode,
      startNewSession,
      repos,
      isReposLoading,
      gitHubComments,
      isGitHubCommentsLoading,
      showGitHubComments,
      setShowGitHubComments,
      getGitHubCommentsForFile,
      getGitHubCommentCountForFile,
      getFilesWithGitHubComments,
      getFirstCommentLineForFile,
      diffs,
      diffPaths,
      diffStats,
    }),
    [
      workspaceId,
      workspace,
      activeWorkspaces,
      archivedWorkspaces,
      isLoading,
      isCreateMode,
      selectWorkspace,
      navigateToCreate,
      sessions,
      selectedSession,
      selectedSessionId,
      selectSession,
      selectLatestSession,
      isSessionsLoading,
      isNewSessionMode,
      startNewSession,
      repos,
      isReposLoading,
      gitHubComments,
      isGitHubCommentsLoading,
      showGitHubComments,
      setShowGitHubComments,
      getGitHubCommentsForFile,
      getGitHubCommentCountForFile,
      getFilesWithGitHubComments,
      getFirstCommentLineForFile,
      diffs,
      diffPaths,
      diffStats,
    ]
  );

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  );
}
