import type { Icon } from '@phosphor-icons/react';
import type { NavigateFn } from '@tanstack/react-router';
import type { QueryClient } from '@tanstack/react-query';
import type {
  EditorType,
  ExecutionProcess,
  Workspace,
  PatchType,
} from 'shared/types';
import type { Workspace as RemoteWorkspace } from 'shared/remote-types';
import type { DiffViewMode } from '@/shared/stores/useDiffViewStore';
import type { LayoutMode } from '@/shared/stores/useUiPreferencesStore';
import { RIGHT_MAIN_PANEL_MODES } from '@/shared/stores/useUiPreferencesStore';
import type { IssueCreateRouteOptions } from '@/shared/lib/routes/projectSidebarRoutes';

// Portable type aliases (avoid importing from component containers)
export type LogEntry = Extract<
  PatchType,
  { type: 'STDOUT' } | { type: 'STDERR' }
>;

export type LogsPanelContent =
  | { type: 'process'; processId: string }
  | {
      type: 'tool';
      toolName: string;
      content: string;
      command: string | undefined;
    }
  | { type: 'terminal' };

// Special icon types for ContextBar
export type SpecialIconType = 'ide-icon' | 'copy-icon';
export type ActionIcon = Icon | SpecialIconType;

// Dev server state type for visibility context
export type DevServerState = 'stopped' | 'starting' | 'running' | 'stopping';

// Project mutations interface (registered by ProjectProvider consumers)
export interface ProjectMutations {
  removeIssue: (id: string) => void;
  duplicateIssue: (issueId: string) => void;
  getIssue: (issueId: string) => { simple_id: string } | undefined;
  getAssigneesForIssue: (issueId: string) => { user_id: string }[];
}

// Workspace type for sidebar (minimal subset needed for workspace selection)
interface SidebarWorkspace {
  id: string;
  isRunning?: boolean;
}

// Context provided to action executors (from React hooks)
export interface ActionExecutorContext {
  navigate: NavigateFn;
  queryClient: QueryClient;
  selectWorkspace: (workspaceId: string) => void;
  activeWorkspaces: SidebarWorkspace[];
  currentWorkspaceId: string | null;
  containerRef: string | null;
  runningDevServers: ExecutionProcess[];
  startDevServer: () => void;
  stopDevServer: () => void;
  // Logs panel state
  currentLogs: LogEntry[] | null;
  logsPanelContent: LogsPanelContent | null;
  // Command bar navigation
  openStatusSelection: (projectId: string, issueIds: string[]) => Promise<void>;
  openPrioritySelection: (
    projectId: string,
    issueIds: string[]
  ) => Promise<void>;
  openAssigneeSelection: (
    projectId: string,
    issueIds: string[],
    isCreateMode?: boolean
  ) => Promise<void>;
  openSubIssueSelection: (
    projectId: string,
    issueId: string,
    mode?: 'addChild' | 'setParent'
  ) => Promise<{ type: string } | undefined>;
  openWorkspaceSelection: (projectId: string, issueId: string) => Promise<void>;
  openRelationshipSelection: (
    projectId: string,
    issueId: string,
    relationshipType: 'blocking' | 'related' | 'has_duplicate',
    direction: 'forward' | 'reverse'
  ) => Promise<void>;
  // Kanban navigation (URL-based)
  navigateToCreateIssue: (options?: IssueCreateRouteOptions) => void;
  // Default status for issue creation based on current kanban tab
  defaultCreateStatusId?: string;
  // Current kanban context (for project settings action)
  kanbanOrgId?: string;
  kanbanProjectId?: string;
  // Project mutations (registered when inside ProjectProvider)
  projectMutations?: ProjectMutations;
  // Remote workspaces (from Electric sync via UserContext)
  remoteWorkspaces: RemoteWorkspace[];
}

// Context for evaluating action visibility and state conditions
export interface ActionVisibilityContext {
  // Layout state
  layoutMode: LayoutMode;
  rightMainPanelMode:
    | (typeof RIGHT_MAIN_PANEL_MODES)[keyof typeof RIGHT_MAIN_PANEL_MODES]
    | null;
  isLeftSidebarVisible: boolean;
  isLeftMainPanelVisible: boolean;
  isRightSidebarVisible: boolean;
  isCreateMode: boolean;

  // Workspace state
  hasWorkspace: boolean;
  workspaceArchived: boolean;

  // Diff state
  hasDiffs: boolean;
  diffViewMode: DiffViewMode;
  isAllDiffsExpanded: boolean;

  // Dev server state
  editorType: EditorType | null;
  devServerState: DevServerState;
  runningDevServers: ExecutionProcess[];

  // Git panel state
  hasGitRepos: boolean;
  hasMultipleRepos: boolean;
  hasOpenPR: boolean;
  hasUnpushedCommits: boolean;

  // Execution state
  isAttemptRunning: boolean;

  // Logs panel state
  logsPanelContent: LogsPanelContent | null;

  // Kanban state
  hasSelectedKanbanIssue: boolean;
  hasSelectedKanbanIssueParent: boolean;
  isCreatingIssue: boolean;

  // Auth state
  isSignedIn: boolean;
}

// Enum discriminant for action target types
export enum ActionTargetType {
  NONE = 'none',
  WORKSPACE = 'workspace',
  GIT = 'git',
  ISSUE = 'issue',
}

// Base properties shared by all actions
interface ActionBase {
  id: string;
  label: string | ((workspace?: Workspace) => string);
  icon: ActionIcon;
  shortcut?: string;
  variant?: 'default' | 'destructive';
  keywords?: string[];
  isVisible?: (ctx: ActionVisibilityContext) => boolean;
  isActive?: (ctx: ActionVisibilityContext) => boolean;
  isEnabled?: (ctx: ActionVisibilityContext) => boolean;
  getIcon?: (ctx: ActionVisibilityContext) => ActionIcon;
  getTooltip?: (ctx: ActionVisibilityContext) => string;
  getLabel?: (ctx: ActionVisibilityContext) => string;
}

// Global action (no target needed)
export interface GlobalActionDefinition extends ActionBase {
  requiresTarget: ActionTargetType.NONE;
  execute: (ctx: ActionExecutorContext) => Promise<void> | void;
}

// Workspace action (target required - validated by ActionsContext)
export interface WorkspaceActionDefinition extends ActionBase {
  requiresTarget: ActionTargetType.WORKSPACE;
  execute: (
    ctx: ActionExecutorContext,
    workspaceId: string
  ) => Promise<void> | void;
}

// Git action (requires workspace + repoId)
export interface GitActionDefinition extends ActionBase {
  requiresTarget: ActionTargetType.GIT;
  execute: (
    ctx: ActionExecutorContext,
    workspaceId: string,
    repoId: string
  ) => Promise<void> | void;
}

// Issue action (requires projectId + issueIds)
export interface IssueActionDefinition extends ActionBase {
  requiresTarget: ActionTargetType.ISSUE;
  execute: (
    ctx: ActionExecutorContext,
    projectId: string,
    issueIds: string[]
  ) => Promise<void> | void;
}

// Discriminated union
export type ActionDefinition =
  | GlobalActionDefinition
  | WorkspaceActionDefinition
  | GitActionDefinition
  | IssueActionDefinition;

// Divider markers
export const NavbarDivider = { type: 'divider' } as const;
export type NavbarItem = ActionDefinition | typeof NavbarDivider;
export const ContextBarDivider = { type: 'divider' } as const;
export type ContextBarItem = ActionDefinition | typeof ContextBarDivider;

// Helper to resolve dynamic label
export function resolveLabel(
  action: ActionDefinition,
  workspace?: Workspace
): string {
  return typeof action.label === 'function'
    ? action.label(workspace)
    : action.label;
}

// Helper to check if an icon is a special type
export function isSpecialIcon(icon: ActionIcon): icon is SpecialIconType {
  return icon === 'ide-icon' || icon === 'copy-icon';
}

// Pure action helper functions
export function isActionVisible(
  action: ActionDefinition,
  ctx: ActionVisibilityContext
): boolean {
  return action.isVisible ? action.isVisible(ctx) : true;
}

export function isActionActive(
  action: ActionDefinition,
  ctx: ActionVisibilityContext
): boolean {
  return action.isActive ? action.isActive(ctx) : false;
}

export function isActionEnabled(
  action: ActionDefinition,
  ctx: ActionVisibilityContext
): boolean {
  return action.isEnabled ? action.isEnabled(ctx) : true;
}

export function getActionIcon(
  action: ActionDefinition,
  ctx: ActionVisibilityContext
): ActionIcon {
  return action.getIcon ? action.getIcon(ctx) : action.icon;
}

export function getActionTooltip(
  action: ActionDefinition,
  ctx: ActionVisibilityContext
): string {
  return action.getTooltip ? action.getTooltip(ctx) : resolveLabel(action);
}

export function getActionLabel(
  action: ActionDefinition,
  ctx: ActionVisibilityContext,
  workspace?: Workspace
): string {
  return action.getLabel
    ? action.getLabel(ctx)
    : resolveLabel(action, workspace);
}
