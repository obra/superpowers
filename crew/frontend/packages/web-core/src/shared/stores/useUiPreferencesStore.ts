import { useCallback, useMemo } from 'react';
import { create } from 'zustand';
import type { RepoAction } from '@vibe/ui/components/RepoCard';
import type { IssuePriority } from 'shared/remote-types';

export const RIGHT_MAIN_PANEL_MODES = {
  CHANGES: 'changes',
  LOGS: 'logs',
  PREVIEW: 'preview',
} as const;

export type RightMainPanelMode =
  (typeof RIGHT_MAIN_PANEL_MODES)[keyof typeof RIGHT_MAIN_PANEL_MODES];

export type LayoutMode = 'workspaces' | 'kanban' | 'migrate';

export type KanbanViewMode = 'kanban' | 'list';

export type ContextBarPosition =
  | 'top-left'
  | 'top-right'
  | 'middle-left'
  | 'middle-right'
  | 'bottom-left'
  | 'bottom-right';

// Workspace-specific panel state
export type WorkspacePanelState = {
  rightMainPanelMode: RightMainPanelMode | null;
  isLeftMainPanelVisible: boolean;
};

const DEFAULT_WORKSPACE_PANEL_STATE: WorkspacePanelState = {
  rightMainPanelMode: null,
  isLeftMainPanelVisible: true,
};

// Kanban filter state
export type KanbanSortField =
  | 'sort_order'
  | 'priority'
  | 'created_at'
  | 'updated_at'
  | 'title';

export type KanbanFilterState = {
  searchQuery: string;
  priorities: IssuePriority[];
  assigneeIds: string[]; // 'unassigned' or '__self__' or user IDs
  tagIds: string[];
  sortField: KanbanSortField;
  sortDirection: 'asc' | 'desc';
};

export const DEFAULT_KANBAN_FILTER_STATE: KanbanFilterState = {
  searchQuery: '',
  priorities: [],
  assigneeIds: [],
  tagIds: [],
  sortField: 'sort_order',
  sortDirection: 'asc',
};

export const KANBAN_ASSIGNEE_FILTER_VALUES = {
  UNASSIGNED: 'unassigned',
  SELF: '__self__',
} as const;

export const KANBAN_PROJECT_VIEW_IDS = {
  TEAM: 'team',
  PERSONAL: 'personal',
} as const;

export const DEFAULT_KANBAN_PROJECT_VIEW_ID = KANBAN_PROJECT_VIEW_IDS.TEAM;
export const DEFAULT_KANBAN_SHOW_WORKSPACES = true;

export const getDefaultShowSubIssuesForView = (viewId: string): boolean =>
  viewId === KANBAN_PROJECT_VIEW_IDS.PERSONAL;

export type KanbanProjectView = {
  id: string;
  name: string;
  filters: KanbanFilterState;
  showSubIssues: boolean;
  showWorkspaces: boolean;
};

export type KanbanProjectViewSelection = {
  activeViewId: string;
};

export type KanbanProjectViewPreferences = {
  filters: KanbanFilterState;
  showSubIssues: boolean;
  showWorkspaces: boolean;
};

export type ResolvedKanbanProjectState = {
  activeViewId: string;
  filters: KanbanFilterState;
  showSubIssues: boolean;
  showWorkspaces: boolean;
};

const cloneKanbanFilters = (filters: KanbanFilterState): KanbanFilterState => ({
  searchQuery: filters.searchQuery,
  priorities: [...filters.priorities],
  assigneeIds: [...filters.assigneeIds],
  tagIds: [...filters.tagIds],
  sortField: filters.sortField,
  sortDirection: filters.sortDirection,
});

const isKanbanProjectViewId = (
  viewId: string
): viewId is (typeof KANBAN_PROJECT_VIEW_IDS)[keyof typeof KANBAN_PROJECT_VIEW_IDS] =>
  viewId === KANBAN_PROJECT_VIEW_IDS.TEAM ||
  viewId === KANBAN_PROJECT_VIEW_IDS.PERSONAL;

const getKanbanDefaultView = (viewId: string): KanbanProjectView => {
  if (viewId === KANBAN_PROJECT_VIEW_IDS.PERSONAL) {
    return {
      id: KANBAN_PROJECT_VIEW_IDS.PERSONAL,
      name: 'Personal',
      filters: {
        ...cloneKanbanFilters(DEFAULT_KANBAN_FILTER_STATE),
        assigneeIds: [KANBAN_ASSIGNEE_FILTER_VALUES.SELF],
        sortField: 'priority',
        sortDirection: 'asc',
      },
      showSubIssues: getDefaultShowSubIssuesForView(
        KANBAN_PROJECT_VIEW_IDS.PERSONAL
      ),
      showWorkspaces: DEFAULT_KANBAN_SHOW_WORKSPACES,
    };
  }

  return {
    id: KANBAN_PROJECT_VIEW_IDS.TEAM,
    name: 'Team',
    filters: cloneKanbanFilters(DEFAULT_KANBAN_FILTER_STATE),
    showSubIssues: getDefaultShowSubIssuesForView(KANBAN_PROJECT_VIEW_IDS.TEAM),
    showWorkspaces: DEFAULT_KANBAN_SHOW_WORKSPACES,
  };
};

const createDefaultKanbanProjectViewPreferences = (
  viewId: string
): KanbanProjectViewPreferences => {
  const view = getKanbanDefaultView(viewId);
  return {
    filters: cloneKanbanFilters(view.filters),
    showSubIssues: view.showSubIssues,
    showWorkspaces: view.showWorkspaces,
  };
};

export const resolveKanbanProjectState = (
  projectSelection: KanbanProjectViewSelection | undefined
): ResolvedKanbanProjectState => {
  const requestedViewId = projectSelection?.activeViewId;
  const activeViewId = isKanbanProjectViewId(requestedViewId ?? '')
    ? (requestedViewId ?? DEFAULT_KANBAN_PROJECT_VIEW_ID)
    : DEFAULT_KANBAN_PROJECT_VIEW_ID;
  const activeView = getKanbanDefaultView(activeViewId);

  return {
    activeViewId,
    filters: cloneKanbanFilters(activeView.filters),
    showSubIssues: activeView.showSubIssues,
    showWorkspaces: activeView.showWorkspaces,
  };
};

// Workspace sidebar filter state
export type WorkspacePrFilter = 'all' | 'has_pr' | 'no_pr';
export type WorkspaceSortBy = 'updated_at' | 'created_at';
export type WorkspaceSortOrder = 'asc' | 'desc';

export type WorkspaceFilterState = {
  projectIds: string[]; // remote project IDs
  prFilter: WorkspacePrFilter;
};

export type WorkspaceSortState = {
  sortBy: WorkspaceSortBy;
  sortOrder: WorkspaceSortOrder;
};

const DEFAULT_WORKSPACE_FILTER_STATE: WorkspaceFilterState = {
  projectIds: [],
  prFilter: 'all',
};

const DEFAULT_WORKSPACE_SORT_STATE: WorkspaceSortState = {
  sortBy: 'updated_at',
  sortOrder: 'desc',
};

// Centralized persist keys for type safety
export const PERSIST_KEYS = {
  // Sidebar sections
  workspacesSidebarArchived: 'workspaces-sidebar-archived',
  // v2 key forces accordion default to true for all users
  workspacesSidebarAccordionLayout: 'workspaces-sidebar-accordion-layout-v2',
  workspacesSidebarRaisedHand: 'workspaces-sidebar-raised-hand',
  workspacesSidebarNotRunning: 'workspaces-sidebar-not-running',
  workspacesSidebarRunning: 'workspaces-sidebar-running',
  // Right panel sections
  gitAdvancedSettings: 'git-advanced-settings',
  gitPanelRepositories: 'git-panel-repositories',
  gitPanelProject: 'git-panel-project',
  gitPanelAddRepositories: 'git-panel-add-repositories',
  rightPanelprocesses: 'right-panel-processes',
  rightPanelPreview: 'right-panel-preview',
  // Process panel sections
  processesSection: 'processes-section',
  // Changes panel sections
  changesSection: 'changes-section',
  // Preview panel sections
  devServerSection: 'dev-server-section',
  // Terminal panel section
  terminalSection: 'terminal-section',
  // Notes panel section
  notesSection: 'notes-section',
  // GitHub comments toggle
  showGitHubComments: 'show-github-comments',
  // Panel sizes
  rightMainPanel: 'right-main-panel',
  kanbanLeftPanel: 'kanban-left-panel',
  // Kanban issue panel sections
  kanbanIssueSubIssues: 'kanban-issue-sub-issues',
  kanbanIssueRelationships: 'kanban-issue-relationships',
  kanbanIssueAttachments: 'kanban-issue-attachments',
  // Dynamic keys (use helper functions)
  repoCard: (repoId: string) => `repo-card-${repoId}` as const,
} as const;

// Check if screen is wide enough to keep sidebar visible
const isWideScreen = () => window.innerWidth > 2048;

export type PersistKey =
  | typeof PERSIST_KEYS.workspacesSidebarArchived
  | typeof PERSIST_KEYS.workspacesSidebarAccordionLayout
  | typeof PERSIST_KEYS.workspacesSidebarRaisedHand
  | typeof PERSIST_KEYS.workspacesSidebarNotRunning
  | typeof PERSIST_KEYS.workspacesSidebarRunning
  | typeof PERSIST_KEYS.gitAdvancedSettings
  | typeof PERSIST_KEYS.gitPanelRepositories
  | typeof PERSIST_KEYS.gitPanelProject
  | typeof PERSIST_KEYS.gitPanelAddRepositories
  | typeof PERSIST_KEYS.processesSection
  | typeof PERSIST_KEYS.changesSection
  | typeof PERSIST_KEYS.devServerSection
  | typeof PERSIST_KEYS.terminalSection
  | typeof PERSIST_KEYS.notesSection
  | typeof PERSIST_KEYS.showGitHubComments
  | typeof PERSIST_KEYS.rightMainPanel
  | typeof PERSIST_KEYS.rightPanelprocesses
  | typeof PERSIST_KEYS.rightPanelPreview
  | typeof PERSIST_KEYS.kanbanLeftPanel
  | typeof PERSIST_KEYS.kanbanIssueSubIssues
  | typeof PERSIST_KEYS.kanbanIssueRelationships
  | typeof PERSIST_KEYS.kanbanIssueAttachments
  | `repo-card-${string}`
  | `diff:${string}`
  | `edit:${string}`
  | `plan:${string}`
  | `tool:${string}`
  | `todo:${string}`
  | `subagent:${string}`
  | `user:${string}`
  | `system:${string}`
  | `error:${string}`
  | `entry:${string}`
  | `list-section-${string}`;

type State = {
  // UI preferences
  repoActions: Record<string, RepoAction>;
  expanded: Record<string, boolean>;
  contextBarPosition: ContextBarPosition;
  paneSizes: Record<string, number | string>;
  collapsedPaths: Record<string, string[]>;
  fileSearchRepoId: string | null;

  // Global layout state (applies across all workspaces)
  layoutMode: LayoutMode;
  isLeftSidebarVisible: boolean;
  isRightSidebarVisible: boolean;
  isTerminalVisible: boolean;
  previewRefreshKey: number;
  // Note: Kanban issue panel state (selectedKanbanIssueId, createMode, etc.)
  // is now derived from URL via useKanbanNavigation hook

  // Workspace-specific panel state
  workspacePanelStates: Record<string, WorkspacePanelState>;

  // Selected built-in kanban view per project
  kanbanProjectViewSelections: Record<string, KanbanProjectViewSelection>;

  // In-memory kanban runtime preferences per project and view
  kanbanProjectViewPreferences: Record<
    string,
    Record<string, KanbanProjectViewPreferences>
  >;

  // Workspace sidebar filter state
  workspaceFilters: WorkspaceFilterState;
  workspaceSort: WorkspaceSortState;

  // Kanban view mode state
  kanbanViewMode: KanbanViewMode;
  listViewStatusFilter: string | null;

  // UI preferences actions
  setRepoAction: (repoId: string, action: RepoAction) => void;
  setExpanded: (key: string, value: boolean) => void;
  toggleExpanded: (key: string, defaultValue?: boolean) => void;
  setExpandedAll: (keys: string[], value: boolean) => void;
  setContextBarPosition: (position: ContextBarPosition) => void;
  setPaneSize: (key: string, size: number | string) => void;
  setCollapsedPaths: (key: string, paths: string[]) => void;
  setFileSearchRepo: (repoId: string | null) => void;

  // Layout actions
  setLayoutMode: (mode: LayoutMode) => void;
  toggleLayoutMode: () => void;
  toggleLeftSidebar: () => void;
  toggleLeftMainPanel: (workspaceId?: string) => void;
  toggleRightSidebar: () => void;
  toggleTerminal: () => void;
  setTerminalVisible: (value: boolean) => void;
  // Note: Kanban panel actions (openKanbanIssuePanel, closeKanbanIssuePanel, etc.)
  // are now handled by navigation via useKanbanNavigation hook
  toggleRightMainPanelMode: (
    mode: RightMainPanelMode,
    workspaceId?: string
  ) => void;
  setRightMainPanelMode: (
    mode: RightMainPanelMode | null,
    workspaceId?: string
  ) => void;
  setLeftSidebarVisible: (value: boolean) => void;
  setLeftMainPanelVisible: (value: boolean, workspaceId?: string) => void;
  triggerPreviewRefresh: () => void;

  // Workspace-specific panel state actions
  getWorkspacePanelState: (workspaceId: string) => WorkspacePanelState;
  setWorkspacePanelState: (
    workspaceId: string,
    state: Partial<WorkspacePanelState>
  ) => void;

  // Kanban view selection actions
  setKanbanProjectView: (projectId: string, viewId: string) => void;
  setKanbanProjectViewFilters: (
    projectId: string,
    viewId: string,
    filters: KanbanFilterState
  ) => void;
  setKanbanProjectViewShowSubIssues: (
    projectId: string,
    viewId: string,
    show: boolean
  ) => void;
  setKanbanProjectViewShowWorkspaces: (
    projectId: string,
    viewId: string,
    show: boolean
  ) => void;
  clearKanbanProjectViewPreferences: (
    projectId: string,
    viewId: string
  ) => void;

  // Workspace sidebar filter actions
  setWorkspaceProjectFilter: (projectIds: string[]) => void;
  setWorkspacePrFilter: (prFilter: WorkspacePrFilter) => void;
  clearWorkspaceFilters: () => void;
  setWorkspaceSortBy: (sortBy: WorkspaceSortBy) => void;
  setWorkspaceSortOrder: (sortOrder: WorkspaceSortOrder) => void;

  // Kanban view mode actions
  setKanbanViewMode: (mode: KanbanViewMode) => void;
  setListViewStatusFilter: (statusId: string | null) => void;
};

export const useUiPreferencesStore = create<State>()((set, get) => ({
  // UI preferences state
  repoActions: {},
  expanded: {},
  contextBarPosition: 'middle-right',
  paneSizes: {},
  collapsedPaths: {},
  fileSearchRepoId: null,

  // Global layout state
  layoutMode: 'workspaces' as LayoutMode,
  isLeftSidebarVisible: true,
  isRightSidebarVisible: true,
  isTerminalVisible: true,
  previewRefreshKey: 0,

  // Workspace-specific panel state
  workspacePanelStates: {},

  // Kanban per-project view selection
  kanbanProjectViewSelections: {},
  kanbanProjectViewPreferences: {},

  // Workspace sidebar filter state
  workspaceFilters: DEFAULT_WORKSPACE_FILTER_STATE,
  workspaceSort: DEFAULT_WORKSPACE_SORT_STATE,

  // Kanban view mode state
  kanbanViewMode: 'kanban' as KanbanViewMode,
  listViewStatusFilter: null,

  // UI preferences actions
  setRepoAction: (repoId, action) =>
    set((s) => ({ repoActions: { ...s.repoActions, [repoId]: action } })),
  setExpanded: (key, value) =>
    set((s) => ({ expanded: { ...s.expanded, [key]: value } })),
  toggleExpanded: (key, defaultValue = true) =>
    set((s) => ({
      expanded: {
        ...s.expanded,
        [key]: !(s.expanded[key] ?? defaultValue),
      },
    })),
  setExpandedAll: (keys, value) =>
    set((s) => ({
      expanded: {
        ...s.expanded,
        ...Object.fromEntries(keys.map((k) => [k, value])),
      },
    })),
  setContextBarPosition: (position) => set({ contextBarPosition: position }),
  setPaneSize: (key, size) =>
    set((s) => ({ paneSizes: { ...s.paneSizes, [key]: size } })),
  setCollapsedPaths: (key, paths) =>
    set((s) => ({ collapsedPaths: { ...s.collapsedPaths, [key]: paths } })),
  setFileSearchRepo: (repoId) => set({ fileSearchRepoId: repoId }),

  // Layout actions
  setLayoutMode: (mode) => set({ layoutMode: mode }),
  toggleLayoutMode: () =>
    set((s) => ({
      layoutMode: s.layoutMode === 'workspaces' ? 'kanban' : 'workspaces',
    })),
  toggleLeftSidebar: () =>
    set((s) => ({ isLeftSidebarVisible: !s.isLeftSidebarVisible })),

  toggleLeftMainPanel: (workspaceId) => {
    if (!workspaceId) return;
    const state = get();
    const wsState =
      state.workspacePanelStates[workspaceId] ?? DEFAULT_WORKSPACE_PANEL_STATE;
    if (wsState.isLeftMainPanelVisible && wsState.rightMainPanelMode === null)
      return;
    set({
      workspacePanelStates: {
        ...state.workspacePanelStates,
        [workspaceId]: {
          ...wsState,
          isLeftMainPanelVisible: !wsState.isLeftMainPanelVisible,
        },
      },
    });
  },

  toggleRightSidebar: () =>
    set((s) => ({ isRightSidebarVisible: !s.isRightSidebarVisible })),

  toggleTerminal: () =>
    set((s) => ({ isTerminalVisible: !s.isTerminalVisible })),

  setTerminalVisible: (value) => set({ isTerminalVisible: value }),

  toggleRightMainPanelMode: (mode, workspaceId) => {
    if (!workspaceId) return;
    const state = get();
    const wsState =
      state.workspacePanelStates[workspaceId] ?? DEFAULT_WORKSPACE_PANEL_STATE;
    const isCurrentlyActive = wsState.rightMainPanelMode === mode;

    set({
      workspacePanelStates: {
        ...state.workspacePanelStates,
        [workspaceId]: {
          ...wsState,
          rightMainPanelMode: isCurrentlyActive ? null : mode,
        },
      },
      isLeftSidebarVisible: isCurrentlyActive
        ? true
        : isWideScreen()
          ? state.isLeftSidebarVisible
          : false,
    });
  },

  setRightMainPanelMode: (mode, workspaceId) => {
    if (!workspaceId) return;
    const state = get();
    const wsState =
      state.workspacePanelStates[workspaceId] ?? DEFAULT_WORKSPACE_PANEL_STATE;
    set({
      workspacePanelStates: {
        ...state.workspacePanelStates,
        [workspaceId]: {
          ...wsState,
          rightMainPanelMode: mode,
        },
      },
      ...(mode !== null && {
        isLeftSidebarVisible: isWideScreen()
          ? state.isLeftSidebarVisible
          : false,
      }),
    });
  },

  setLeftSidebarVisible: (value) => set({ isLeftSidebarVisible: value }),

  setLeftMainPanelVisible: (value, workspaceId) => {
    if (!workspaceId) return;
    const state = get();
    const wsState =
      state.workspacePanelStates[workspaceId] ?? DEFAULT_WORKSPACE_PANEL_STATE;
    set({
      workspacePanelStates: {
        ...state.workspacePanelStates,
        [workspaceId]: {
          ...wsState,
          isLeftMainPanelVisible: value,
        },
      },
    });
  },

  triggerPreviewRefresh: () =>
    set((s) => ({ previewRefreshKey: s.previewRefreshKey + 1 })),

  // Workspace-specific panel state actions
  getWorkspacePanelState: (workspaceId) => {
    const state = get();
    return (
      state.workspacePanelStates[workspaceId] ?? DEFAULT_WORKSPACE_PANEL_STATE
    );
  },

  setWorkspacePanelState: (workspaceId, panelState) => {
    const state = get();
    const currentWsState =
      state.workspacePanelStates[workspaceId] ?? DEFAULT_WORKSPACE_PANEL_STATE;
    set({
      workspacePanelStates: {
        ...state.workspacePanelStates,
        [workspaceId]: {
          ...currentWsState,
          ...panelState,
        },
      },
    });
  },

  // Kanban view selection actions
  setKanbanProjectView: (projectId, viewId) => {
    if (!isKanbanProjectViewId(viewId)) {
      return;
    }

    set((s) => ({
      kanbanProjectViewSelections: {
        ...s.kanbanProjectViewSelections,
        [projectId]: { activeViewId: viewId },
      },
    }));
  },

  setKanbanProjectViewFilters: (projectId, viewId, filters) => {
    if (!isKanbanProjectViewId(viewId)) {
      return;
    }

    set((s) => {
      const projectPreferences =
        s.kanbanProjectViewPreferences[projectId] ?? {};
      const existingPreferences =
        projectPreferences[viewId] ??
        createDefaultKanbanProjectViewPreferences(viewId);

      return {
        kanbanProjectViewPreferences: {
          ...s.kanbanProjectViewPreferences,
          [projectId]: {
            ...projectPreferences,
            [viewId]: {
              ...existingPreferences,
              filters: cloneKanbanFilters(filters),
            },
          },
        },
      };
    });
  },

  setKanbanProjectViewShowSubIssues: (projectId, viewId, show) => {
    if (!isKanbanProjectViewId(viewId)) {
      return;
    }

    set((s) => {
      const projectPreferences =
        s.kanbanProjectViewPreferences[projectId] ?? {};
      const existingPreferences =
        projectPreferences[viewId] ??
        createDefaultKanbanProjectViewPreferences(viewId);

      return {
        kanbanProjectViewPreferences: {
          ...s.kanbanProjectViewPreferences,
          [projectId]: {
            ...projectPreferences,
            [viewId]: {
              ...existingPreferences,
              showSubIssues: show,
            },
          },
        },
      };
    });
  },

  setKanbanProjectViewShowWorkspaces: (projectId, viewId, show) => {
    if (!isKanbanProjectViewId(viewId)) {
      return;
    }

    set((s) => {
      const projectPreferences =
        s.kanbanProjectViewPreferences[projectId] ?? {};
      const existingPreferences =
        projectPreferences[viewId] ??
        createDefaultKanbanProjectViewPreferences(viewId);

      return {
        kanbanProjectViewPreferences: {
          ...s.kanbanProjectViewPreferences,
          [projectId]: {
            ...projectPreferences,
            [viewId]: {
              ...existingPreferences,
              showWorkspaces: show,
            },
          },
        },
      };
    });
  },

  clearKanbanProjectViewPreferences: (projectId, viewId) => {
    if (!isKanbanProjectViewId(viewId)) {
      return;
    }

    set((s) => {
      const projectPreferences = s.kanbanProjectViewPreferences[projectId];
      if (!projectPreferences || !projectPreferences[viewId]) {
        return {};
      }

      const nextProjectPreferences = { ...projectPreferences };
      delete nextProjectPreferences[viewId];

      const nextAllPreferences = { ...s.kanbanProjectViewPreferences };
      if (Object.keys(nextProjectPreferences).length === 0) {
        delete nextAllPreferences[projectId];
      } else {
        nextAllPreferences[projectId] = nextProjectPreferences;
      }

      return {
        kanbanProjectViewPreferences: nextAllPreferences,
      };
    });
  },

  // Workspace sidebar filter actions
  setWorkspaceProjectFilter: (projectIds) =>
    set((s) => ({
      workspaceFilters: { ...s.workspaceFilters, projectIds },
    })),

  setWorkspacePrFilter: (prFilter) =>
    set((s) => ({
      workspaceFilters: { ...s.workspaceFilters, prFilter },
    })),

  clearWorkspaceFilters: () =>
    set({ workspaceFilters: DEFAULT_WORKSPACE_FILTER_STATE }),

  setWorkspaceSortBy: (sortBy) =>
    set((s) => ({
      workspaceSort: { ...s.workspaceSort, sortBy },
    })),

  setWorkspaceSortOrder: (sortOrder) =>
    set((s) => ({
      workspaceSort: { ...s.workspaceSort, sortOrder },
    })),

  // Kanban view mode actions
  setKanbanViewMode: (mode) => set({ kanbanViewMode: mode }),

  setListViewStatusFilter: (statusId) =>
    set({ listViewStatusFilter: statusId }),
}));

// Hook for repo action preference
export function useRepoAction(
  repoId: string,
  defaultAction: RepoAction = 'pull-request'
): [RepoAction, (action: RepoAction) => void] {
  const action = useUiPreferencesStore(
    (s) => s.repoActions[repoId] ?? defaultAction
  );
  const setAction = useUiPreferencesStore((s) => s.setRepoAction);
  return [action, (a) => setAction(repoId, a)];
}

// Hook for persisted expanded state
export function usePersistedExpanded(
  key: PersistKey,
  defaultValue = true
): [boolean, (value?: boolean) => void] {
  const expanded = useUiPreferencesStore(
    (s) => s.expanded[key] ?? defaultValue
  );
  const setExpanded = useUiPreferencesStore((s) => s.setExpanded);
  const toggleExpanded = useUiPreferencesStore((s) => s.toggleExpanded);

  const set = (value?: boolean) => {
    if (typeof value === 'boolean') setExpanded(key, value);
    else toggleExpanded(key, defaultValue);
  };

  return [expanded, set];
}

// Hook for context bar position
export function useContextBarPosition(): [
  ContextBarPosition,
  (position: ContextBarPosition) => void,
] {
  const position = useUiPreferencesStore((s) => s.contextBarPosition);
  const setPosition = useUiPreferencesStore((s) => s.setContextBarPosition);
  return [position, setPosition];
}

// Hook for pane size preference
export function usePaneSize(
  key: PersistKey,
  defaultSize: number | string
): [number | string, (size: number | string) => void] {
  const size = useUiPreferencesStore((s) => s.paneSizes[key] ?? defaultSize);
  const setSize = useUiPreferencesStore((s) => s.setPaneSize);
  return [size, (s) => setSize(key, s)];
}

// Hook for bulk expanded state operations
export function useExpandedAll() {
  const expanded = useUiPreferencesStore((s) => s.expanded);
  const setExpanded = useUiPreferencesStore((s) => s.setExpanded);
  const setExpandedAll = useUiPreferencesStore((s) => s.setExpandedAll);
  return { expanded, setExpanded, setExpandedAll };
}

// Hook for persisted file tree collapsed paths (per workspace)
export function usePersistedCollapsedPaths(
  workspaceId: string | undefined
): [Set<string>, (paths: Set<string>) => void] {
  const key = workspaceId ? `file-tree:${workspaceId}` : '';
  const paths = useUiPreferencesStore((s) => s.collapsedPaths[key] ?? []);
  const setPaths = useUiPreferencesStore((s) => s.setCollapsedPaths);

  const pathSet = useMemo(() => new Set(paths), [paths]);
  const setPathSet = useCallback(
    (newPaths: Set<string>) => {
      if (key) setPaths(key, [...newPaths]);
    },
    [key, setPaths]
  );

  return [pathSet, setPathSet];
}

// Hook for workspace-specific panel state
export function useWorkspacePanelState(workspaceId: string | undefined) {
  // Get workspace-specific state (falls back to defaults when no workspaceId)
  const workspacePanelStates = useUiPreferencesStore(
    (s) => s.workspacePanelStates
  );
  const wsState = workspaceId
    ? (workspacePanelStates[workspaceId] ?? DEFAULT_WORKSPACE_PANEL_STATE)
    : DEFAULT_WORKSPACE_PANEL_STATE;

  // Global state (sidebars are global)
  const isLeftSidebarVisible = useUiPreferencesStore(
    (s) => s.isLeftSidebarVisible
  );
  const isRightSidebarVisible = useUiPreferencesStore(
    (s) => s.isRightSidebarVisible
  );
  const isTerminalVisible = useUiPreferencesStore((s) => s.isTerminalVisible);

  // Actions from store
  const toggleRightMainPanelMode = useUiPreferencesStore(
    (s) => s.toggleRightMainPanelMode
  );
  const setRightMainPanelMode = useUiPreferencesStore(
    (s) => s.setRightMainPanelMode
  );
  const setLeftMainPanelVisible = useUiPreferencesStore(
    (s) => s.setLeftMainPanelVisible
  );
  const setLeftSidebarVisible = useUiPreferencesStore(
    (s) => s.setLeftSidebarVisible
  );

  // Memoized callbacks that include workspaceId
  const toggleRightMainPanelModeForWorkspace = useCallback(
    (mode: RightMainPanelMode) => toggleRightMainPanelMode(mode, workspaceId),
    [toggleRightMainPanelMode, workspaceId]
  );

  const setRightMainPanelModeForWorkspace = useCallback(
    (mode: RightMainPanelMode | null) =>
      setRightMainPanelMode(mode, workspaceId),
    [setRightMainPanelMode, workspaceId]
  );

  const setLeftMainPanelVisibleForWorkspace = useCallback(
    (value: boolean) => setLeftMainPanelVisible(value, workspaceId),
    [setLeftMainPanelVisible, workspaceId]
  );

  return {
    // Workspace-specific state
    rightMainPanelMode: wsState.rightMainPanelMode,
    isLeftMainPanelVisible: wsState.isLeftMainPanelVisible,

    // Global state (sidebars and terminal)
    isLeftSidebarVisible,
    isRightSidebarVisible,
    isTerminalVisible,

    // Workspace-specific actions
    toggleRightMainPanelMode: toggleRightMainPanelModeForWorkspace,
    setRightMainPanelMode: setRightMainPanelModeForWorkspace,
    setLeftMainPanelVisible: setLeftMainPanelVisibleForWorkspace,

    // Global actions
    setLeftSidebarVisible,
  };
}
