import { useMemo, type ReactNode } from 'react';
import type { CreateModeInitialState } from '@/shared/types/createMode';
import { useCreateModeState } from '@/integrations/useCreateModeState';
import { useWorkspaces } from '@/shared/hooks/useWorkspaces';
import { useUserContext } from '@/shared/hooks/useUserContext';
import {
  CreateModeContext,
  type CreateModeContextValue,
} from '@/shared/hooks/useCreateMode';

interface CreateModeProviderProps {
  children: ReactNode;
  initialState?: CreateModeInitialState | null;
  draftId?: string | null;
}

export function CreateModeProvider({
  children,
  initialState,
  draftId,
}: CreateModeProviderProps) {
  // Fetch most recent workspace to seed project selection only
  const {
    workspaces: activeWorkspaces,
    archivedWorkspaces,
    isLoading: localWorkspacesLoading,
  } = useWorkspaces();
  const { workspaces: remoteWorkspaces, isLoading: remoteWorkspacesLoading } =
    useUserContext();
  const mostRecentWorkspace = activeWorkspaces[0] ?? archivedWorkspaces[0];
  const localWorkspaceIds = useMemo(
    () =>
      new Set([
        ...activeWorkspaces.map((workspace) => workspace.id),
        ...archivedWorkspaces.map((workspace) => workspace.id),
      ]),
    [activeWorkspaces, archivedWorkspaces]
  );

  const state = useCreateModeState({
    initialState,
    draftId,
    lastWorkspaceId: mostRecentWorkspace?.id ?? null,
    remoteWorkspaces,
    localWorkspaceIds,
    localWorkspacesLoading,
    remoteWorkspacesLoading,
  });

  const value = useMemo<CreateModeContextValue>(
    () => ({
      repos: state.repos,
      addRepo: state.addRepo,
      removeRepo: state.removeRepo,
      clearRepos: state.clearRepos,
      targetBranches: state.targetBranches,
      setTargetBranch: state.setTargetBranch,
      hasResolvedInitialRepoDefaults: state.hasResolvedInitialRepoDefaults,
      preferredExecutorConfig: state.preferredExecutorConfig,
      message: state.message,
      setMessage: state.setMessage,
      clearDraft: state.clearDraft,
      hasInitialValue: state.hasInitialValue,
      linkedIssue: state.linkedIssue,
      clearLinkedIssue: state.clearLinkedIssue,
      executorConfig: state.executorConfig,
      setExecutorConfig: state.setExecutorConfig,
      images: state.images,
      setImages: state.setImages,
    }),
    [
      state.repos,
      state.addRepo,
      state.removeRepo,
      state.clearRepos,
      state.targetBranches,
      state.setTargetBranch,
      state.hasResolvedInitialRepoDefaults,
      state.preferredExecutorConfig,
      state.message,
      state.setMessage,
      state.clearDraft,
      state.hasInitialValue,
      state.linkedIssue,
      state.clearLinkedIssue,
      state.executorConfig,
      state.setExecutorConfig,
      state.images,
      state.setImages,
    ]
  );

  return (
    <CreateModeContext.Provider value={value}>
      {children}
    </CreateModeContext.Provider>
  );
}
