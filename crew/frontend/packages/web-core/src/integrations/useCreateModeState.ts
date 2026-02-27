import { useCallback, useEffect, useMemo, useReducer, useRef } from 'react';
import { useLocation, useNavigate } from '@tanstack/react-router';
import type {
  DraftWorkspaceData,
  DraftWorkspaceImage,
  ExecutorConfig,
  Repo,
} from 'shared/types';
import { ScratchType } from 'shared/types';
import {
  PROJECT_ISSUES_SHAPE,
  type Workspace as RemoteWorkspace,
} from 'shared/remote-types';
import { useScratch } from '@/shared/hooks/useScratch';
import { useDebouncedCallback } from '@/shared/hooks/useDebouncedCallback';
import { useUserSystem } from '@/shared/hooks/useUserSystem';
import { useShape } from '@/shared/integrations/electric/hooks';
import { repoApi } from '@/shared/lib/api';
import { useWorkspaceCreateDefaults } from '@/shared/hooks/useWorkspaceCreateDefaults';
import type {
  CreateModeInitialState,
  LinkedIssue,
} from '@/shared/types/createMode';

// ============================================================================
// Types
// ============================================================================

/** Unified repo model - keeps repo and branch together */
interface SelectedRepo {
  repo: Repo;
  targetBranch: string | null;
}

type Phase = 'loading' | 'ready' | 'error';

interface DraftState {
  phase: Phase;
  error: string | null;
  repos: SelectedRepo[];
  message: string;
  linkedIssue: LinkedIssue | null;
  executorConfig: ExecutorConfig | null;
  images: DraftWorkspaceImage[];
}

type DraftAction =
  | {
      type: 'INIT_COMPLETE';
      data: Partial<Omit<DraftState, 'phase' | 'error'>>;
    }
  | { type: 'INIT_ERROR'; error: string }
  | { type: 'SET_PROJECT'; projectId: string | null }
  | { type: 'ADD_REPO'; repo: Repo; targetBranch: string | null }
  | { type: 'SET_REPOS_IF_EMPTY'; repos: SelectedRepo[] }
  | { type: 'REMOVE_REPO'; repoId: string }
  | { type: 'SET_TARGET_BRANCH'; repoId: string; branch: string }
  | { type: 'SET_MESSAGE'; message: string }
  | { type: 'CLEAR_REPOS' }
  | { type: 'CLEAR' }
  | { type: 'CLEAR_LINKED_ISSUE' }
  | { type: 'RESOLVE_LINKED_ISSUE'; simpleId: string; title: string }
  | {
      type: 'SET_EXECUTOR_CONFIG';
      config: ExecutorConfig | null;
    }
  | { type: 'SET_IMAGES'; images: DraftWorkspaceImage[] };

// ============================================================================
// Reducer
// ============================================================================

const draftInitialState: DraftState = {
  phase: 'loading',
  error: null,
  repos: [],
  message: '',
  linkedIssue: null,
  executorConfig: null,
  images: [],
};

function draftReducer(state: DraftState, action: DraftAction): DraftState {
  switch (action.type) {
    case 'INIT_COMPLETE':
      return {
        ...state,
        phase: 'ready',
        error: null,
        ...action.data,
      };

    case 'INIT_ERROR':
      return {
        ...state,
        phase: 'error',
        error: action.error,
      };

    case 'ADD_REPO': {
      // Don't add duplicate repos
      if (state.repos.some((r) => r.repo.id === action.repo.id)) {
        return state;
      }
      return {
        ...state,
        repos: [
          ...state.repos,
          { repo: action.repo, targetBranch: action.targetBranch },
        ],
      };
    }

    case 'SET_REPOS_IF_EMPTY':
      if (state.repos.length > 0) {
        return state;
      }
      return { ...state, repos: action.repos };

    case 'REMOVE_REPO':
      return {
        ...state,
        repos: state.repos.filter((r) => r.repo.id !== action.repoId),
      };

    case 'SET_TARGET_BRANCH':
      return {
        ...state,
        repos: state.repos.map((r) =>
          r.repo.id === action.repoId
            ? { ...r, targetBranch: action.branch }
            : r
        ),
      };

    case 'SET_MESSAGE':
      return { ...state, message: action.message };

    case 'CLEAR_REPOS':
      return { ...state, repos: [] };

    case 'CLEAR':
      return { ...draftInitialState, phase: 'ready' };

    case 'CLEAR_LINKED_ISSUE':
      return { ...state, linkedIssue: null };

    case 'RESOLVE_LINKED_ISSUE':
      if (!state.linkedIssue) return state;
      return {
        ...state,
        linkedIssue: {
          ...state.linkedIssue,
          simpleId: action.simpleId,
          title: action.title,
        },
      };

    case 'SET_EXECUTOR_CONFIG':
      return { ...state, executorConfig: action.config };

    case 'SET_IMAGES':
      return { ...state, images: action.images };

    default:
      return state;
  }
}

// ============================================================================
// Constants
// ============================================================================

const DRAFT_WORKSPACE_ID = '00000000-0000-0000-0000-000000000001';

function getLatestWorkspaceIdForRemoteProject({
  remoteWorkspaces,
  localWorkspaceIds,
  remoteProjectId,
}: {
  remoteWorkspaces: RemoteWorkspace[];
  localWorkspaceIds: Set<string>;
  remoteProjectId: string;
}): string | null {
  let latestWorkspaceId: string | null = null;
  let latestUpdatedAt = Number.NEGATIVE_INFINITY;

  for (const workspace of remoteWorkspaces) {
    if (!workspace.issue_id) continue;
    if (workspace.project_id !== remoteProjectId) continue;
    if (!workspace.local_workspace_id) continue;
    if (!localWorkspaceIds.has(workspace.local_workspace_id)) continue;

    const updatedAt = new Date(workspace.updated_at).getTime();
    if (updatedAt > latestUpdatedAt) {
      latestUpdatedAt = updatedAt;
      latestWorkspaceId = workspace.local_workspace_id;
    }
  }

  return latestWorkspaceId;
}

// ============================================================================
// Hook
// ============================================================================

interface UseCreateModeStateParams {
  initialProjectId?: string;
  initialState?: CreateModeInitialState | null;
  draftId?: string | null;
  lastWorkspaceId: string | null;
  remoteWorkspaces: RemoteWorkspace[];
  localWorkspaceIds: Set<string>;
  localWorkspacesLoading: boolean;
  remoteWorkspacesLoading: boolean;
}

interface UseCreateModeStateResult {
  repos: Repo[];
  targetBranches: Record<string, string | null>;
  hasResolvedInitialRepoDefaults: boolean;
  preferredExecutorConfig: ExecutorConfig | null;
  message: string;
  isLoading: boolean;
  hasInitialValue: boolean;
  linkedIssue: LinkedIssue | null;
  executorConfig: ExecutorConfig | null;
  setMessage: (message: string) => void;
  addRepo: (repo: Repo) => void;
  removeRepo: (repoId: string) => void;
  clearRepos: () => void;
  setTargetBranch: (repoId: string, branch: string) => void;
  clearDraft: () => Promise<void>;
  clearLinkedIssue: () => void;
  setExecutorConfig: (config: ExecutorConfig | null) => void;
  images: DraftWorkspaceImage[];
  setImages: (images: DraftWorkspaceImage[]) => void;
}

export function useCreateModeState({
  initialProjectId,
  initialState,
  draftId,
  lastWorkspaceId,
  remoteWorkspaces,
  localWorkspaceIds,
  localWorkspacesLoading,
  remoteWorkspacesLoading,
}: UseCreateModeStateParams): UseCreateModeStateResult {
  const location = useLocation();
  const navigate = useNavigate();
  const { profiles } = useUserSystem();
  const scratchId = draftId ?? DRAFT_WORKSPACE_ID;

  const {
    scratch,
    updateScratch,
    deleteScratch,
    isLoading: scratchLoading,
  } = useScratch(ScratchType.DRAFT_WORKSPACE, scratchId);

  const [state, dispatch] = useReducer(draftReducer, draftInitialState);

  // Capture navigation state once on mount
  const navStateRef = useRef<CreateModeInitialState | null>(
    initialState !== undefined
      ? initialState
      : draftId
        ? null
        : ((location.state as CreateModeInitialState | null) ?? null)
  );
  const hasInitialized = useRef(false);

  // Profile validator
  const isValidProfile = useCallback(
    (config: ExecutorConfig | null): boolean => {
      if (!config || !profiles) return false;
      const { executor, variant } = config;
      if (!(executor in profiles)) return false;
      if (variant === null || variant === undefined) return true;
      return variant in profiles[executor];
    },
    [profiles]
  );

  // ============================================================================
  // Single initialization effect
  // ============================================================================
  useEffect(() => {
    if (hasInitialized.current) return;
    if (scratchLoading) return;
    if (!profiles) return;

    hasInitialized.current = true;
    const navState = navStateRef.current;

    // Clear navigation state immediately to prevent re-initialization
    if (
      initialState === undefined &&
      !draftId &&
      (navState?.initialPrompt ||
        navState?.linkedIssue ||
        (navState?.preferredRepos?.length ?? 0) > 0 ||
        navState?.project_id)
    ) {
      navigate({
        to: '.',
        replace: true,
        state: {},
      });
    }

    // Determine initialization source and execute
    initializeState({
      navState,
      scratch,
      isValidProfile,
      dispatch,
    });
  }, [
    scratchLoading,
    profiles,
    initialState,
    draftId,
    initialProjectId,
    scratch,
    isValidProfile,
    navigate,
  ]);

  // ============================================================================
  // Auto-select project when none selected
  // ============================================================================
  const hasAttemptedAutoSelect = useRef(false);
  const repoDefaultsSourceRef = useRef<string | null>(null);
  const hasAppliedRepoDefaultsRef = useRef(false);
  const sourceWorkspaceId = useMemo(() => {
    if (state.linkedIssue) {
      const linkedIssueWorkspaceId = getLatestWorkspaceIdForRemoteProject({
        remoteWorkspaces,
        localWorkspaceIds,
        remoteProjectId: state.linkedIssue.remoteProjectId,
      });
      return linkedIssueWorkspaceId ?? lastWorkspaceId;
    }
    return lastWorkspaceId;
  }, [state.linkedIssue, remoteWorkspaces, localWorkspaceIds, lastWorkspaceId]);

  const shouldLoadWorkspaceDefaults =
    state.phase === 'ready' &&
    !localWorkspacesLoading &&
    (!state.linkedIssue || !remoteWorkspacesLoading);

  const { preferredRepos, preferredExecutorConfig, hasResolvedPreferredRepos } =
    useWorkspaceCreateDefaults({
      sourceWorkspaceId,
      enabled: shouldLoadWorkspaceDefaults,
    });

  const hasResolvedInitialRepoDefaults =
    (state.phase === 'ready' &&
      !localWorkspacesLoading &&
      (!state.linkedIssue || !remoteWorkspacesLoading) &&
      hasResolvedPreferredRepos &&
      (preferredRepos.length === 0 ||
        state.repos.length > 0 ||
        hasAppliedRepoDefaultsRef.current)) ||
    state.repos.length > 0;

  useEffect(() => {
    if (state.phase !== 'ready') return;
    if (hasAttemptedAutoSelect.current) return;

    hasAttemptedAutoSelect.current = true;
  }, [state.phase]);

  // ============================================================================
  // Auto-apply repos/branches defaults for fresh drafts
  // ============================================================================
  useEffect(() => {
    if (repoDefaultsSourceRef.current === sourceWorkspaceId) return;
    repoDefaultsSourceRef.current = sourceWorkspaceId;
    hasAppliedRepoDefaultsRef.current = false;
  }, [sourceWorkspaceId]);

  useEffect(() => {
    if (!shouldLoadWorkspaceDefaults) return;
    if (!hasResolvedPreferredRepos) return;
    if (hasAppliedRepoDefaultsRef.current) return;

    hasAppliedRepoDefaultsRef.current = true;
    if (state.repos.length > 0) return;
    if (preferredRepos.length === 0) return;

    dispatch({
      type: 'SET_REPOS_IF_EMPTY',
      repos: preferredRepos.map((repo) => ({
        repo,
        targetBranch: repo.target_branch || null,
      })),
    });
  }, [
    shouldLoadWorkspaceDefaults,
    hasResolvedPreferredRepos,
    state.repos.length,
    preferredRepos,
  ]);

  // ============================================================================
  // Persistence to scratch (debounced)
  // ============================================================================
  const { debounced: debouncedSave } = useDebouncedCallback(
    async (data: DraftWorkspaceData) => {
      const isEmpty =
        !data.message.trim() &&
        data.repos.length === 0 &&
        !data.executor_config &&
        data.images.length === 0;

      if (isEmpty && !scratch) return;

      try {
        await updateScratch({
          payload: { type: 'DRAFT_WORKSPACE', data },
        });
      } catch (e) {
        console.error('[useCreateModeState] Failed to save:', e);
      }
    },
    500
  );

  useEffect(() => {
    if (state.phase !== 'ready') return;

    debouncedSave({
      message: state.message,
      repos: state.repos.map((r) => ({
        repo_id: r.repo.id,
        target_branch: r.targetBranch ?? '',
      })),
      executor_config: state.executorConfig ?? null,
      linked_issue: state.linkedIssue
        ? {
            issue_id: state.linkedIssue.issueId,
            simple_id: state.linkedIssue.simpleId ?? '',
            title: state.linkedIssue.title ?? '',
            remote_project_id: state.linkedIssue.remoteProjectId,
          }
        : null,
      images: state.images,
    });
  }, [
    state.phase,
    state.message,
    state.repos,
    state.linkedIssue,
    state.executorConfig,
    state.images,
    debouncedSave,
  ]);

  // ============================================================================
  // Resolve linked issue details from Electric (when simpleId/title are missing)
  // ============================================================================
  const needsIssueResolution =
    !!state.linkedIssue && !state.linkedIssue.simpleId;
  const issueProjectId = state.linkedIssue?.remoteProjectId ?? '';

  const { data: issuesForResolution } = useShape(
    PROJECT_ISSUES_SHAPE,
    { project_id: issueProjectId },
    { enabled: needsIssueResolution && !!issueProjectId }
  );

  useEffect(() => {
    if (!needsIssueResolution || !state.linkedIssue) return;
    const issue = issuesForResolution.find(
      (i) => i.id === state.linkedIssue!.issueId
    );
    if (issue) {
      dispatch({
        type: 'RESOLVE_LINKED_ISSUE',
        simpleId: issue.simple_id,
        title: issue.title,
      });
    }
  }, [needsIssueResolution, issuesForResolution, state.linkedIssue]);

  // ============================================================================
  // Derived state
  // ============================================================================
  const repos = useMemo(() => state.repos.map((r) => r.repo), [state.repos]);

  const targetBranches = useMemo(
    () =>
      state.repos.reduce(
        (acc, r) => {
          acc[r.repo.id] = r.targetBranch;
          return acc;
        },
        {} as Record<string, string | null>
      ),
    [state.repos]
  );

  // ============================================================================
  // Actions
  // ============================================================================
  const setMessage = useCallback((message: string) => {
    dispatch({ type: 'SET_MESSAGE', message });
  }, []);

  const addRepo = useCallback((repo: Repo) => {
    // Branch is always selected manually by the user.
    dispatch({ type: 'ADD_REPO', repo, targetBranch: null });
  }, []);

  const removeRepo = useCallback((repoId: string) => {
    dispatch({ type: 'REMOVE_REPO', repoId });
  }, []);

  const clearRepos = useCallback(() => {
    dispatch({ type: 'CLEAR_REPOS' });
  }, []);

  const setTargetBranch = useCallback((repoId: string, branch: string) => {
    dispatch({ type: 'SET_TARGET_BRANCH', repoId, branch });
  }, []);

  const clearDraft = useCallback(async () => {
    try {
      await deleteScratch();
      dispatch({ type: 'CLEAR' });
    } catch (e) {
      console.error('[useCreateModeState] Failed to clear:', e);
    }
  }, [deleteScratch]);

  const clearLinkedIssue = useCallback(() => {
    dispatch({ type: 'CLEAR_LINKED_ISSUE' });
  }, []);

  const setExecutorConfig = useCallback((config: ExecutorConfig | null) => {
    dispatch({ type: 'SET_EXECUTOR_CONFIG', config });
  }, []);

  const setImages = useCallback((images: DraftWorkspaceImage[]) => {
    dispatch({ type: 'SET_IMAGES', images });
  }, []);

  return {
    repos,
    targetBranches,
    hasResolvedInitialRepoDefaults,
    preferredExecutorConfig,
    message: state.message,
    isLoading: scratchLoading,
    hasInitialValue: state.phase === 'ready',
    linkedIssue: state.linkedIssue,
    executorConfig: state.executorConfig,
    setMessage,
    addRepo,
    removeRepo,
    clearRepos,
    setTargetBranch,
    clearDraft,
    clearLinkedIssue,
    setExecutorConfig,
    images: state.images,
    setImages,
  };
}

// ============================================================================
// Initialization helper (pure-ish function for testability)
// ============================================================================

interface InitializeParams {
  navState: CreateModeInitialState | null;
  scratch: ReturnType<typeof useScratch>['scratch'];
  isValidProfile: (config: ExecutorConfig | null) => boolean;
  dispatch: React.Dispatch<DraftAction>;
}

async function resolveNavPreferredRepos(
  preferredRepos: NonNullable<CreateModeInitialState['preferredRepos']>
): Promise<SelectedRepo[]> {
  const reposById = new Map<string, Repo>();

  const missingRepoIds = preferredRepos
    .map((r) => r.repo_id)
    .filter((repoId) => !reposById.has(repoId));

  if (missingRepoIds.length > 0) {
    const fetchedRepos = await Promise.all(
      missingRepoIds.map(async (repoId) => {
        try {
          return await repoApi.getById(repoId);
        } catch {
          return null;
        }
      })
    );

    for (const repo of fetchedRepos) {
      if (repo) {
        reposById.set(repo.id, repo);
      }
    }
  }

  return preferredRepos.flatMap((preferredRepo) => {
    const repo = reposById.get(preferredRepo.repo_id);
    if (!repo) return [];

    return [
      {
        repo,
        targetBranch: preferredRepo.target_branch || null,
      },
    ];
  });
}

async function initializeState({
  navState,
  scratch,
  isValidProfile,
  dispatch,
}: InitializeParams): Promise<void> {
  try {
    // Priority 1: Navigation state
    const hasInitialPrompt = !!navState?.initialPrompt;
    const hasLinkedIssue = !!navState?.linkedIssue;
    const hasPreferredRepos = (navState?.preferredRepos?.length ?? 0) > 0;
    const hasProjectId = !!navState?.project_id;

    if (
      hasInitialPrompt ||
      hasLinkedIssue ||
      hasPreferredRepos ||
      hasProjectId
    ) {
      const data: Partial<DraftState> = {};
      let appliedNavState = false;

      // Handle initial prompt
      if (hasInitialPrompt) {
        data.message = navState!.initialPrompt!;
        appliedNavState = true;
      }

      // Handle linked issue
      if (hasLinkedIssue) {
        data.linkedIssue = navState!.linkedIssue!;
        appliedNavState = true;
      }

      // Handle preferred repos + target branches (e.g., from duplicate/spin-off)
      if (navState?.preferredRepos && navState.preferredRepos.length > 0) {
        const resolvedRepos = await resolveNavPreferredRepos(
          navState.preferredRepos
        );
        if (resolvedRepos.length > 0) {
          data.repos = resolvedRepos;
          appliedNavState = true;
        }
      }

      if (appliedNavState) {
        dispatch({ type: 'INIT_COMPLETE', data });
        return;
      }
    }

    // Priority 2: Restore from scratch
    const scratchData: DraftWorkspaceData | undefined =
      scratch?.payload?.type === 'DRAFT_WORKSPACE'
        ? scratch.payload.data
        : undefined;

    if (scratchData) {
      const restoredData: Partial<DraftState> = {};

      // Restore message
      if (scratchData.message) {
        restoredData.message = scratchData.message;
      }

      // Restore executor config if profile is still valid
      if (
        scratchData.executor_config &&
        isValidProfile(scratchData.executor_config)
      ) {
        restoredData.executorConfig = scratchData.executor_config;
      }

      // Restore linked issue
      if (scratchData.linked_issue) {
        restoredData.linkedIssue = {
          issueId: scratchData.linked_issue.issue_id,
          simpleId: scratchData.linked_issue.simple_id || undefined,
          title: scratchData.linked_issue.title || undefined,
          remoteProjectId: scratchData.linked_issue.remote_project_id,
        };
      }

      // Restore uploaded images
      if (scratchData.images?.length > 0) {
        restoredData.images = scratchData.images;
      }

      dispatch({ type: 'INIT_COMPLETE', data: restoredData });
      return;
    }

    // Priority 3: Fresh start
    dispatch({
      type: 'INIT_COMPLETE',
      data: {},
    });
  } catch (e) {
    console.error('[useCreateModeState] Initialization failed:', e);
    dispatch({
      type: 'INIT_ERROR',
      error: e instanceof Error ? e.message : 'Failed to initialize',
    });
  }
}
