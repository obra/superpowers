import { useCallback, useEffect, useRef } from 'react';
import { useScratch } from '@/shared/hooks/useScratch';
import { useDebouncedCallback } from '@/shared/hooks/useDebouncedCallback';
import {
  ScratchType,
  type UiPreferencesData,
  type ScratchPayload,
  type WorkspacePanelStateData,
  type JsonValue,
} from 'shared/types';
import {
  useUiPreferencesStore,
  type RightMainPanelMode,
  type ContextBarPosition,
  type WorkspacePanelState,
  type WorkspaceFilterState,
  type WorkspaceSortState,
  type WorkspacePrFilter,
  type WorkspaceSortBy,
  type WorkspaceSortOrder,
} from '@/shared/stores/useUiPreferencesStore';
import type { RepoAction } from '@vibe/ui/components/RepoCard';

// Stable UUID for global UI preferences (not tied to a workspace/user)
// This is a deterministic UUID v5 generated from the namespace "ui-preferences"
// Using a fixed UUID ensures all users/sessions share the same preferences record
const UI_PREFERENCES_ID = '00000000-0000-0000-0000-000000000001';

/**
 * Converts store state to scratch data format (camelCase to snake_case)
 */
function storeToScratchData(state: {
  repoActions: Record<string, RepoAction>;
  expanded: Record<string, boolean>;
  contextBarPosition: ContextBarPosition;
  paneSizes: Record<string, number | string>;
  collapsedPaths: Record<string, string[]>;
  fileSearchRepoId: string | null;
  isLeftSidebarVisible: boolean;
  isRightSidebarVisible: boolean;
  isTerminalVisible: boolean;
  workspacePanelStates: Record<string, WorkspacePanelState>;
  workspaceFilters: WorkspaceFilterState;
  workspaceSort: WorkspaceSortState;
}): UiPreferencesData {
  const workspacePanelStates: { [key: string]: WorkspacePanelStateData } = {};
  for (const [key, value] of Object.entries(state.workspacePanelStates)) {
    workspacePanelStates[key] = {
      right_main_panel_mode: value.rightMainPanelMode,
      is_left_main_panel_visible: value.isLeftMainPanelVisible,
    };
  }

  return {
    repo_actions: state.repoActions as { [key: string]: string },
    expanded: state.expanded,
    context_bar_position: state.contextBarPosition,
    pane_sizes: state.paneSizes as { [key: string]: JsonValue },
    collapsed_paths: state.collapsedPaths,
    file_search_repo_id: state.fileSearchRepoId,
    is_left_sidebar_visible: state.isLeftSidebarVisible,
    is_right_sidebar_visible: state.isRightSidebarVisible,
    is_terminal_visible: state.isTerminalVisible,
    workspace_panel_states: workspacePanelStates,
    workspace_filters: {
      project_ids: state.workspaceFilters.projectIds,
      pr_filter: state.workspaceFilters.prFilter,
    },
    workspace_sort: {
      sort_by: state.workspaceSort.sortBy,
      sort_order: state.workspaceSort.sortOrder,
    },
  };
}

/**
 * Converts scratch data to store state format (snake_case to camelCase)
 */
function scratchDataToStore(data: UiPreferencesData): {
  repoActions: Record<string, RepoAction>;
  expanded: Record<string, boolean>;
  contextBarPosition: ContextBarPosition;
  paneSizes: Record<string, number | string>;
  collapsedPaths: Record<string, string[]>;
  fileSearchRepoId: string | null;
  isLeftSidebarVisible: boolean;
  isRightSidebarVisible: boolean;
  isTerminalVisible: boolean;
  workspacePanelStates: Record<string, WorkspacePanelState>;
  workspaceFilters: WorkspaceFilterState;
  workspaceSort: WorkspaceSortState;
} {
  const workspacePanelStates: Record<string, WorkspacePanelState> = {};
  if (data.workspace_panel_states) {
    for (const [key, value] of Object.entries(data.workspace_panel_states)) {
      if (value) {
        workspacePanelStates[key] = {
          rightMainPanelMode:
            (value.right_main_panel_mode as RightMainPanelMode) ?? null,
          isLeftMainPanelVisible: value.is_left_main_panel_visible ?? true,
        };
      }
    }
  }

  // Backwards compatibility with older payloads that used
  // file_search_repo_by_project (project_id -> repo_id).
  const legacyFileSearchRepoByProject = (
    data as UiPreferencesData & {
      file_search_repo_by_project?: Record<string, string>;
    }
  ).file_search_repo_by_project;
  const legacyFileSearchRepoId =
    legacyFileSearchRepoByProject &&
    Object.values(legacyFileSearchRepoByProject)[0]
      ? Object.values(legacyFileSearchRepoByProject)[0]
      : null;

  return {
    repoActions: (data.repo_actions ?? {}) as Record<string, RepoAction>,
    expanded: (data.expanded ?? {}) as Record<string, boolean>,
    contextBarPosition:
      (data.context_bar_position as ContextBarPosition) ?? 'middle-right',
    paneSizes: (data.pane_sizes ?? {}) as Record<string, number | string>,
    collapsedPaths: (data.collapsed_paths ?? {}) as Record<string, string[]>,
    fileSearchRepoId: data.file_search_repo_id ?? legacyFileSearchRepoId,
    isLeftSidebarVisible: data.is_left_sidebar_visible ?? true,
    isRightSidebarVisible: data.is_right_sidebar_visible ?? true,
    isTerminalVisible: data.is_terminal_visible ?? true,
    workspacePanelStates,
    workspaceFilters: {
      projectIds: data.workspace_filters?.project_ids ?? [],
      prFilter:
        (data.workspace_filters?.pr_filter as WorkspacePrFilter) ?? 'all',
    },
    workspaceSort: {
      sortBy: (data.workspace_sort?.sort_by as WorkspaceSortBy) ?? 'updated_at',
      sortOrder:
        (data.workspace_sort?.sort_order as WorkspaceSortOrder) ?? 'desc',
    },
  };
}

/**
 * Hook that syncs UI preferences between Zustand store and server scratch storage.
 * Should be used once at the app root level.
 */
export function useUiPreferencesScratch() {
  const { scratch, updateScratch, isLoading, isConnected } = useScratch(
    ScratchType.UI_PREFERENCES,
    UI_PREFERENCES_ID
  );

  // Track whether we've initialized from server
  const hasInitializedRef = useRef(false);
  // Track whether we're currently applying server data to prevent save loops
  const isApplyingServerDataRef = useRef(false);

  // Get current store state
  const storeState = useUiPreferencesStore((state) => ({
    repoActions: state.repoActions,
    expanded: state.expanded,
    contextBarPosition: state.contextBarPosition,
    paneSizes: state.paneSizes,
    collapsedPaths: state.collapsedPaths,
    fileSearchRepoId: state.fileSearchRepoId,
    isLeftSidebarVisible: state.isLeftSidebarVisible,
    isRightSidebarVisible: state.isRightSidebarVisible,
    isTerminalVisible: state.isTerminalVisible,
    workspacePanelStates: state.workspacePanelStates,
    workspaceFilters: state.workspaceFilters,
    workspaceSort: state.workspaceSort,
  }));

  // Extract scratch data
  const payload = scratch?.payload as ScratchPayload | undefined;
  const scratchData: UiPreferencesData | undefined =
    payload?.type === 'UI_PREFERENCES' ? payload.data : undefined;

  // Save to server function
  const saveToServer = useCallback(async () => {
    if (isApplyingServerDataRef.current || !hasInitializedRef.current) {
      return;
    }

    const currentState = useUiPreferencesStore.getState();
    const data = storeToScratchData({
      repoActions: currentState.repoActions,
      expanded: currentState.expanded,
      contextBarPosition: currentState.contextBarPosition,
      paneSizes: currentState.paneSizes,
      collapsedPaths: currentState.collapsedPaths,
      fileSearchRepoId: currentState.fileSearchRepoId,
      isLeftSidebarVisible: currentState.isLeftSidebarVisible,
      isRightSidebarVisible: currentState.isRightSidebarVisible,
      isTerminalVisible: currentState.isTerminalVisible,
      workspacePanelStates: currentState.workspacePanelStates,
      workspaceFilters: currentState.workspaceFilters,
      workspaceSort: currentState.workspaceSort,
    });

    try {
      await updateScratch({
        payload: {
          type: 'UI_PREFERENCES',
          data,
        },
      });
    } catch (e) {
      console.error('[useUiPreferencesScratch] Failed to save:', e);
    }
  }, [updateScratch]);

  const { debounced: debouncedSave } = useDebouncedCallback(saveToServer, 500);

  // Initialize store from server data when first loaded
  useEffect(() => {
    if (hasInitializedRef.current || isLoading || !isConnected) {
      return;
    }

    hasInitializedRef.current = true;

    if (scratchData) {
      // Server has data - apply it to store
      isApplyingServerDataRef.current = true;
      const serverState = scratchDataToStore(scratchData);

      // Merge server state into the store
      useUiPreferencesStore.setState({
        repoActions: serverState.repoActions,
        expanded: serverState.expanded,
        contextBarPosition: serverState.contextBarPosition,
        paneSizes: serverState.paneSizes,
        collapsedPaths: serverState.collapsedPaths,
        fileSearchRepoId: serverState.fileSearchRepoId,
        isLeftSidebarVisible: serverState.isLeftSidebarVisible,
        isRightSidebarVisible: serverState.isRightSidebarVisible,
        isTerminalVisible: serverState.isTerminalVisible,
        workspacePanelStates: serverState.workspacePanelStates,
        workspaceFilters: serverState.workspaceFilters,
        workspaceSort: serverState.workspaceSort,
      });

      // Allow a brief delay for state to settle
      setTimeout(() => {
        isApplyingServerDataRef.current = false;
      }, 100);
    }
  }, [isLoading, isConnected, scratchData]);

  // Subscribe to store changes and save to server
  useEffect(() => {
    const unsubscribe = useUiPreferencesStore.subscribe(() => {
      if (!isApplyingServerDataRef.current && hasInitializedRef.current) {
        debouncedSave();
      }
    });

    return unsubscribe;
  }, [debouncedSave]);

  return {
    isLoading,
    isConnected,
    // Expose for debugging
    scratchData,
    storeState,
  };
}
