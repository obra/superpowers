import { forwardRef, createElement } from 'react';
import type { Icon, IconProps } from '@phosphor-icons/react';
import type { Merge, Workspace } from 'shared/types';
import type { QueryClient } from '@tanstack/react-query';
import {
  CopyIcon,
  XIcon,
  PushPinIcon,
  ArchiveIcon,
  TrashIcon,
  PlusIcon,
  GearIcon,
  ColumnsIcon,
  RowsIcon,
  TextAlignLeftIcon,
  EyeSlashIcon,
  SidebarSimpleIcon,
  ChatsTeardropIcon,
  GitDiffIcon,
  TerminalIcon,
  SignInIcon,
  SignOutIcon,
  CaretDoubleUpIcon,
  CaretDoubleDownIcon,
  PlayIcon,
  PauseIcon,
  SpinnerIcon,
  GitPullRequestIcon,
  GitMergeIcon,
  GitForkIcon,
  ArrowsClockwiseIcon,
  CrosshairIcon,
  DesktopIcon,
  PencilSimpleIcon,
  ArrowUpIcon,
  HighlighterIcon,
  ListIcon,
  MegaphoneIcon,
  QuestionIcon,
  ArrowsLeftRightIcon,
  ArrowFatLineUpIcon,
  UsersIcon,
  TreeStructureIcon,
  LinkIcon,
  ArrowBendUpRightIcon,
  ProhibitIcon,
} from '@phosphor-icons/react';
import { useDiffViewStore } from '@/shared/stores/useDiffViewStore';
import {
  useUiPreferencesStore,
  RIGHT_MAIN_PANEL_MODES,
} from '@/shared/stores/useUiPreferencesStore';

import { attemptsApi, repoApi } from '@/shared/lib/api';
import { bulkUpdateIssues } from '@/shared/lib/remoteApi';
import { attemptKeys } from '@/shared/hooks/useAttempt';
import { repoBranchKeys } from '@/shared/hooks/useRepoBranches';
import { workspaceSummaryKeys } from '@/shared/hooks/workspaceSummaryKeys';
import { ConfirmDialog } from '@vibe/ui/components/ConfirmDialog';
import { ChangeTargetDialog } from '@vibe/ui/components/ChangeTargetDialog';
import { DeleteWorkspaceDialog } from '@vibe/ui/components/DeleteWorkspaceDialog';
import { RebaseDialog } from '@/shared/dialogs/command-bar/RebaseDialog';
import { ResolveConflictsDialog } from '@/shared/dialogs/tasks/ResolveConflictsDialog';
import { RenameWorkspaceDialog } from '@vibe/ui/components/RenameWorkspaceDialog';
import { ProjectsGuideDialog } from '@vibe/ui/components/ProjectsGuideDialog';
import { CreatePRDialog } from '@/shared/dialogs/command-bar/CreatePRDialog';
import { getIdeName } from '@/shared/lib/ideName';
import { EditorSelectionDialog } from '@/shared/dialogs/command-bar/EditorSelectionDialog';
import { StartReviewDialog } from '@/shared/dialogs/command-bar/StartReviewDialog';
import posthog from 'posthog-js';
import { WorkspacesGuideDialog } from '@/shared/dialogs/shared/WorkspacesGuideDialog';
import { SettingsDialog } from '@/shared/dialogs/settings/SettingsDialog';
import { CreateWorkspaceFromPrDialog } from '@/shared/dialogs/command-bar/CreateWorkspaceFromPrDialog';

// Mirrored sidebar icon for right sidebar toggle
const RightSidebarIcon: Icon = forwardRef<SVGSVGElement, IconProps>(
  (props, ref) =>
    createElement(SidebarSimpleIcon, {
      ref,
      ...props,
      style: { transform: 'scaleX(-1)', ...props.style },
    })
);
RightSidebarIcon.displayName = 'RightSidebarIcon';

import type {
  ActionExecutorContext,
  ActionDefinition,
  GlobalActionDefinition,
  WorkspaceActionDefinition,
  IssueActionDefinition,
  NavbarItem,
} from '@/shared/types/actions';
import { ActionTargetType, NavbarDivider } from '@/shared/types/actions';

// Helper to get workspace from query cache or fetch from API
async function getWorkspace(
  queryClient: QueryClient,
  workspaceId: string
): Promise<Workspace> {
  const cached = queryClient.getQueryData<Workspace>(
    attemptKeys.byId(workspaceId)
  );
  if (cached) {
    return cached;
  }
  // Fetch from API if not in cache
  return attemptsApi.get(workspaceId);
}

// Helper to invalidate workspace-related queries
function invalidateWorkspaceQueries(
  queryClient: QueryClient,
  workspaceId: string
) {
  queryClient.invalidateQueries({ queryKey: attemptKeys.byId(workspaceId) });
  queryClient.invalidateQueries({ queryKey: workspaceSummaryKeys.all });
}

// Helper to find the next workspace to navigate to when removing current workspace
function getNextWorkspaceId(
  activeWorkspaces: { id: string; isRunning?: boolean }[],
  removingWorkspaceId: string
): string | null {
  const currentIndex = activeWorkspaces.findIndex(
    (ws) => ws.id === removingWorkspaceId
  );
  if (currentIndex >= 0 && activeWorkspaces.length > 1) {
    const nextWorkspace =
      activeWorkspaces[currentIndex + 1] || activeWorkspaces[currentIndex - 1];
    return nextWorkspace?.id ?? null;
  }
  return null;
}

// Helper to navigate to create-issue form for a sub-issue, carrying over parent assignees
function navigateToCreateSubIssue(
  ctx: ActionExecutorContext,
  parentIssueId: string
) {
  const assigneeIds = ctx.projectMutations
    ?.getAssigneesForIssue(parentIssueId)
    .map((a) => a.user_id);
  ctx.navigateToCreateIssue({
    statusId: ctx.defaultCreateStatusId,
    parentIssueId,
    assigneeIds: assigneeIds?.length ? assigneeIds : undefined,
  });
}

// All application actions
export const Actions = {
  // === Workspace Actions ===
  DuplicateWorkspace: {
    id: 'duplicate-workspace',
    label: 'Duplicate',
    icon: CopyIcon,
    shortcut: 'W D',
    requiresTarget: ActionTargetType.WORKSPACE,
    execute: async (ctx, workspaceId) => {
      try {
        const [firstMessage, repos] = await Promise.all([
          attemptsApi.getFirstUserMessage(workspaceId),
          attemptsApi.getRepos(workspaceId),
        ]);

        // Find linked issue from remote workspace (synced via Electric)
        const remoteWs = ctx.remoteWorkspaces.find(
          (w) => w.local_workspace_id === workspaceId
        );
        const linkedIssue = remoteWs?.issue_id
          ? {
              issueId: remoteWs.issue_id,
              remoteProjectId: remoteWs.project_id,
            }
          : undefined;

        ctx.navigate({
          to: '/workspaces/create',
          state: (prev) => ({
            ...prev,
            initialPrompt: firstMessage,
            preferredRepos: repos.map((r) => ({
              repo_id: r.id,
              target_branch: r.target_branch,
            })),
            linkedIssue,
          }),
        });
      } catch {
        // Fallback to creating without the prompt/repos
        ctx.navigate({ to: '/workspaces/create' });
      }
    },
  },

  RenameWorkspace: {
    id: 'rename-workspace',
    label: 'Rename',
    icon: PencilSimpleIcon,
    shortcut: 'W R',
    requiresTarget: ActionTargetType.WORKSPACE,
    execute: async (ctx, workspaceId) => {
      const workspace = await getWorkspace(ctx.queryClient, workspaceId);
      await RenameWorkspaceDialog.show({
        currentName: workspace.name || workspace.branch,
        onRename: async (newName) => {
          await attemptsApi.update(workspaceId, { name: newName });
          invalidateWorkspaceQueries(ctx.queryClient, workspaceId);
        },
      });
    },
  },

  PinWorkspace: {
    id: 'pin-workspace',
    label: (workspace?: Workspace) => (workspace?.pinned ? 'Unpin' : 'Pin'),
    icon: PushPinIcon,
    shortcut: 'W P',
    requiresTarget: ActionTargetType.WORKSPACE,
    execute: async (ctx, workspaceId) => {
      const workspace = await getWorkspace(ctx.queryClient, workspaceId);
      await attemptsApi.update(workspaceId, {
        pinned: !workspace.pinned,
      });
      invalidateWorkspaceQueries(ctx.queryClient, workspaceId);
    },
  },

  ArchiveWorkspace: {
    id: 'archive-workspace',
    label: (workspace?: Workspace) =>
      workspace?.archived ? 'Unarchive' : 'Archive',
    icon: ArchiveIcon,
    shortcut: 'W A',
    requiresTarget: ActionTargetType.WORKSPACE,
    isVisible: (ctx) => ctx.hasWorkspace && ctx.layoutMode === 'workspaces',
    isActive: (ctx) => ctx.workspaceArchived,
    execute: async (ctx, workspaceId) => {
      const workspace = await getWorkspace(ctx.queryClient, workspaceId);
      const wasArchived = workspace.archived;

      // Calculate next workspace before archiving
      const nextWorkspaceId = !wasArchived
        ? getNextWorkspaceId(ctx.activeWorkspaces, workspaceId)
        : null;

      // Perform the archive/unarchive
      await attemptsApi.update(workspaceId, { archived: !wasArchived });
      invalidateWorkspaceQueries(ctx.queryClient, workspaceId);

      // Select next workspace after successful archive
      if (!wasArchived && nextWorkspaceId) {
        ctx.selectWorkspace(nextWorkspaceId);
      }
    },
  },

  DeleteWorkspace: {
    id: 'delete-workspace',
    label: 'Delete',
    icon: TrashIcon,
    shortcut: 'W X',
    variant: 'destructive',
    requiresTarget: ActionTargetType.WORKSPACE,
    execute: async (ctx, workspaceId) => {
      const workspace = await getWorkspace(ctx.queryClient, workspaceId);

      // Check if workspace is linked to a remote issue
      const remoteWs = ctx.remoteWorkspaces.find(
        (w) => w.local_workspace_id === workspaceId
      );
      const linkedIssueSimpleId = remoteWs?.issue_id
        ? ctx.projectMutations?.getIssue(remoteWs.issue_id)?.simple_id
        : undefined;
      const branchStatus = await attemptsApi.getBranchStatus(workspaceId);
      const hasOpenPR = branchStatus.some((repoStatus) =>
        repoStatus.merges?.some(
          (m: Merge) => m.type === 'pr' && m.pr_info.status === 'open'
        )
      );

      const result = await DeleteWorkspaceDialog.show({
        branchName: workspace.branch,
        hasOpenPR,
        isLinkedToIssue: Boolean(remoteWs?.issue_id),
        linkedIssueSimpleId,
      });
      if (result.action === 'confirmed') {
        // Calculate next workspace before deleting (only if deleting current)
        const isCurrentWorkspace = ctx.currentWorkspaceId === workspaceId;
        const nextWorkspaceId = isCurrentWorkspace
          ? getNextWorkspaceId(ctx.activeWorkspaces, workspaceId)
          : null;

        await attemptsApi.delete(workspaceId, result.deleteBranches);

        // Unlink from remote issue after successful deletion
        if (result.unlinkFromIssue) {
          await attemptsApi.unlinkFromIssue(workspaceId);
        }
        ctx.queryClient.invalidateQueries({
          queryKey: workspaceSummaryKeys.all,
        });

        // Navigate away if we deleted the current workspace
        if (isCurrentWorkspace) {
          if (nextWorkspaceId) {
            ctx.selectWorkspace(nextWorkspaceId);
          } else {
            ctx.navigate({ to: '/workspaces/create' });
          }
        }
      }
    },
  },

  StartReview: {
    id: 'start-review',
    label: 'Start Review',
    icon: HighlighterIcon,
    requiresTarget: ActionTargetType.WORKSPACE,
    isVisible: (ctx) => ctx.hasWorkspace,
    getTooltip: () => 'Review changes with agent',
    execute: async (_ctx, workspaceId) => {
      await StartReviewDialog.show({
        workspaceId,
      });
    },
  },

  SpinOffWorkspace: {
    id: 'spin-off-workspace',
    label: 'Spin off workspace',
    icon: GitForkIcon,
    requiresTarget: ActionTargetType.WORKSPACE,
    isVisible: (ctx) => ctx.hasWorkspace,
    execute: async (ctx, workspaceId) => {
      try {
        const [workspace, repos] = await Promise.all([
          getWorkspace(ctx.queryClient, workspaceId),
          attemptsApi.getRepos(workspaceId),
        ]);
        const remoteWs = ctx.remoteWorkspaces.find(
          (w) => w.local_workspace_id === workspaceId
        );
        const linkedIssue = remoteWs?.issue_id
          ? {
              issueId: remoteWs.issue_id,
              remoteProjectId: remoteWs.project_id,
            }
          : undefined;
        ctx.navigate({
          to: '/workspaces/create',
          state: (prev) => ({
            ...prev,
            preferredRepos: repos.map((r) => ({
              repo_id: r.id,
              target_branch: workspace.branch,
            })),
            linkedIssue,
          }),
        });
      } catch {
        ctx.navigate({ to: '/workspaces/create' });
      }
    },
  },

  // === Global/Navigation Actions ===
  NewWorkspace: {
    id: 'new-workspace',
    label: 'New Workspace',
    icon: PlusIcon,
    shortcut: 'G N',
    requiresTarget: ActionTargetType.NONE,
    execute: (ctx) => {
      ctx.navigate({ to: '/workspaces/create' });
    },
  },

  CreateWorkspaceFromPR: {
    id: 'create-workspace-from-pr',
    label: 'Create Workspace from PR',
    icon: GitPullRequestIcon,
    keywords: ['pull request'],
    requiresTarget: ActionTargetType.NONE,
    execute: async () => {
      await CreateWorkspaceFromPrDialog.show({});
    },
  } satisfies GlobalActionDefinition,

  Settings: {
    id: 'settings',
    label: 'Settings',
    icon: GearIcon,
    shortcut: 'G S',
    requiresTarget: ActionTargetType.NONE,
    execute: async () => {
      await SettingsDialog.show();
    },
  },

  ProjectSettings: {
    id: 'project-settings',
    label: 'Project Settings',
    icon: GearIcon,
    requiresTarget: ActionTargetType.NONE,
    isVisible: (ctx) => ctx.layoutMode === 'kanban',
    execute: async (ctx) => {
      await SettingsDialog.show({
        initialSection: 'remote-projects',
        initialState: {
          organizationId: ctx.kanbanOrgId,
          projectId: ctx.kanbanProjectId,
        },
      });
    },
  } satisfies GlobalActionDefinition,

  SignIn: {
    id: 'sign-in',
    label: 'Sign In',
    icon: SignInIcon,
    requiresTarget: ActionTargetType.NONE,
    isVisible: (ctx) => !ctx.isSignedIn,
    execute: async () => {
      const { OAuthDialog } = await import(
        '@/shared/dialogs/global/OAuthDialog'
      );
      await OAuthDialog.show({});
    },
  } satisfies GlobalActionDefinition,

  SignOut: {
    id: 'sign-out',
    label: 'Sign Out',
    icon: SignOutIcon,
    requiresTarget: ActionTargetType.NONE,
    isVisible: (ctx) => ctx.isSignedIn,
    execute: async (ctx) => {
      const { oauthApi } = await import('@/shared/lib/api');
      const { useOrganizationStore } = await import(
        '@/shared/stores/useOrganizationStore'
      );
      const { organizationKeys } = await import(
        '@/shared/hooks/organizationKeys'
      );

      await oauthApi.logout();
      useOrganizationStore.getState().clearSelectedOrgId();
      ctx.queryClient.removeQueries({ queryKey: organizationKeys.all });
      // Invalidate user-system query to update loginStatus/useAuth state
      await ctx.queryClient.invalidateQueries({ queryKey: ['user-system'] });
      ctx.navigate({ to: '/workspaces' });
    },
  } satisfies GlobalActionDefinition,

  Feedback: {
    id: 'feedback',
    label: 'Give Feedback',
    icon: MegaphoneIcon,
    requiresTarget: ActionTargetType.NONE,
    execute: () => {
      posthog.displaySurvey('019bb6e8-3d36-0000-1806-7330cd3c727e');
    },
  },

  WorkspacesGuide: {
    id: 'workspaces-guide',
    label: 'Workspaces Guide',
    icon: QuestionIcon,
    requiresTarget: ActionTargetType.NONE,
    isVisible: (ctx) => ctx.layoutMode === 'workspaces',
    execute: async () => {
      await WorkspacesGuideDialog.show();
    },
  },

  ProjectsGuide: {
    id: 'projects-guide',
    label: 'Projects Guide',
    icon: QuestionIcon,
    requiresTarget: ActionTargetType.NONE,
    isVisible: (ctx) => ctx.layoutMode === 'kanban',
    execute: async () => {
      await ProjectsGuideDialog.show();
    },
  } satisfies GlobalActionDefinition,

  OpenCommandBar: {
    id: 'open-command-bar',
    label: 'Open Command Bar',
    icon: ListIcon,
    shortcut: '{mod} K',
    requiresTarget: ActionTargetType.NONE,
    execute: async () => {
      // Dynamic import to avoid circular dependency (pages.ts imports Actions)
      const { CommandBarDialog } = await import(
        '@/shared/dialogs/command-bar/CommandBarDialog'
      );
      CommandBarDialog.show();
    },
  },

  // === Diff View Actions ===
  ToggleDiffViewMode: {
    id: 'toggle-diff-view-mode',
    label: () =>
      useDiffViewStore.getState().mode === 'unified'
        ? 'Switch to Side-by-Side View'
        : 'Switch to Inline View',
    icon: ColumnsIcon,
    requiresTarget: ActionTargetType.NONE,
    isVisible: (ctx) =>
      ctx.rightMainPanelMode === RIGHT_MAIN_PANEL_MODES.CHANGES &&
      ctx.layoutMode === 'workspaces',
    isActive: (ctx) => ctx.diffViewMode === 'split',
    getIcon: (ctx) => (ctx.diffViewMode === 'split' ? ColumnsIcon : RowsIcon),
    getTooltip: (ctx) =>
      ctx.diffViewMode === 'split' ? 'Inline view' : 'Side-by-side view',
    execute: () => {
      useDiffViewStore.getState().toggle();
    },
  },

  ToggleIgnoreWhitespace: {
    id: 'toggle-ignore-whitespace',
    label: () =>
      useDiffViewStore.getState().ignoreWhitespace
        ? 'Show Whitespace Changes'
        : 'Ignore Whitespace Changes',
    icon: EyeSlashIcon,
    requiresTarget: ActionTargetType.NONE,
    isVisible: (ctx) =>
      ctx.rightMainPanelMode === RIGHT_MAIN_PANEL_MODES.CHANGES &&
      ctx.layoutMode === 'workspaces',
    execute: () => {
      const store = useDiffViewStore.getState();
      store.setIgnoreWhitespace(!store.ignoreWhitespace);
    },
  },

  ToggleWrapLines: {
    id: 'toggle-wrap-lines',
    label: () =>
      useDiffViewStore.getState().wrapText
        ? 'Disable Line Wrapping'
        : 'Enable Line Wrapping',
    icon: TextAlignLeftIcon,
    shortcut: 'T W',
    requiresTarget: ActionTargetType.NONE,
    isVisible: (ctx) =>
      ctx.rightMainPanelMode === RIGHT_MAIN_PANEL_MODES.CHANGES &&
      ctx.layoutMode === 'workspaces',
    execute: () => {
      const store = useDiffViewStore.getState();
      store.setWrapText(!store.wrapText);
    },
  },

  // === Layout Panel Actions ===
  ToggleLeftSidebar: {
    id: 'toggle-left-sidebar',
    label: () =>
      useUiPreferencesStore.getState().isLeftSidebarVisible
        ? 'Hide Left Sidebar'
        : 'Show Left Sidebar',
    icon: SidebarSimpleIcon,
    shortcut: 'V S',
    requiresTarget: ActionTargetType.NONE,
    isVisible: (ctx) => ctx.layoutMode === 'workspaces',
    isActive: (ctx) => ctx.isLeftSidebarVisible,
    execute: () => {
      useUiPreferencesStore.getState().toggleLeftSidebar();
    },
  },

  ToggleLeftMainPanel: {
    id: 'toggle-left-main-panel',
    label: 'Toggle Chat Panel',
    icon: ChatsTeardropIcon,
    shortcut: 'V H',
    requiresTarget: ActionTargetType.NONE,
    isVisible: (ctx) => ctx.layoutMode === 'workspaces',
    isActive: (ctx) => ctx.isLeftMainPanelVisible,
    isEnabled: (ctx) =>
      !(ctx.isLeftMainPanelVisible && ctx.rightMainPanelMode === null),
    getLabel: (ctx) =>
      ctx.isLeftMainPanelVisible ? 'Hide Chat Panel' : 'Show Chat Panel',
    execute: (ctx) => {
      useUiPreferencesStore
        .getState()
        .toggleLeftMainPanel(ctx.currentWorkspaceId ?? undefined);
    },
  },

  ToggleRightSidebar: {
    id: 'toggle-right-sidebar',
    label: () =>
      useUiPreferencesStore.getState().isRightSidebarVisible
        ? 'Hide Right Sidebar'
        : 'Show Right Sidebar',
    icon: RightSidebarIcon,
    requiresTarget: ActionTargetType.NONE,
    isVisible: (ctx) => ctx.layoutMode === 'workspaces',
    isActive: (ctx) => ctx.isRightSidebarVisible,
    execute: () => {
      useUiPreferencesStore.getState().toggleRightSidebar();
    },
  },

  ToggleChangesMode: {
    id: 'toggle-changes-mode',
    label: 'Toggle Changes Panel',
    icon: GitDiffIcon,
    shortcut: 'V C',
    requiresTarget: ActionTargetType.NONE,
    isVisible: (ctx) => !ctx.isCreateMode && ctx.layoutMode === 'workspaces',
    isActive: (ctx) =>
      ctx.rightMainPanelMode === RIGHT_MAIN_PANEL_MODES.CHANGES,
    isEnabled: (ctx) => !ctx.isCreateMode,
    getLabel: (ctx) =>
      ctx.rightMainPanelMode === RIGHT_MAIN_PANEL_MODES.CHANGES
        ? 'Hide Changes Panel'
        : 'Show Changes Panel',
    execute: (ctx) => {
      useUiPreferencesStore
        .getState()
        .toggleRightMainPanelMode(
          RIGHT_MAIN_PANEL_MODES.CHANGES,
          ctx.currentWorkspaceId ?? undefined
        );
    },
  },

  ToggleLogsMode: {
    id: 'toggle-logs-mode',
    label: 'Toggle Logs Panel',
    icon: TerminalIcon,
    shortcut: 'V L',
    requiresTarget: ActionTargetType.NONE,
    isVisible: (ctx) => !ctx.isCreateMode && ctx.layoutMode === 'workspaces',
    isActive: (ctx) => ctx.rightMainPanelMode === RIGHT_MAIN_PANEL_MODES.LOGS,
    isEnabled: (ctx) => !ctx.isCreateMode,
    getLabel: (ctx) =>
      ctx.rightMainPanelMode === RIGHT_MAIN_PANEL_MODES.LOGS
        ? 'Hide Logs Panel'
        : 'Show Logs Panel',
    execute: (ctx) => {
      useUiPreferencesStore
        .getState()
        .toggleRightMainPanelMode(
          RIGHT_MAIN_PANEL_MODES.LOGS,
          ctx.currentWorkspaceId ?? undefined
        );
    },
  },

  TogglePreviewMode: {
    id: 'toggle-preview-mode',
    label: 'Toggle Preview Panel',
    icon: DesktopIcon,
    shortcut: 'V P',
    requiresTarget: ActionTargetType.NONE,
    isVisible: (ctx) => !ctx.isCreateMode && ctx.layoutMode === 'workspaces',
    isActive: (ctx) =>
      ctx.rightMainPanelMode === RIGHT_MAIN_PANEL_MODES.PREVIEW,
    isEnabled: (ctx) => !ctx.isCreateMode,
    getLabel: (ctx) =>
      ctx.rightMainPanelMode === RIGHT_MAIN_PANEL_MODES.PREVIEW
        ? 'Hide Preview Panel'
        : 'Show Preview Panel',
    execute: (ctx) => {
      useUiPreferencesStore
        .getState()
        .toggleRightMainPanelMode(
          RIGHT_MAIN_PANEL_MODES.PREVIEW,
          ctx.currentWorkspaceId ?? undefined
        );
    },
  },

  // === Diff Actions for Navbar ===
  ToggleAllDiffs: {
    id: 'toggle-all-diffs',
    label: () => {
      const { diffPaths } = useDiffViewStore.getState();
      const { expanded } = useUiPreferencesStore.getState();
      const keys = diffPaths.map((p) => `diff:${p}`);
      const isAllExpanded =
        keys.length > 0 && keys.every((k) => expanded[k] !== false);
      return isAllExpanded ? 'Collapse All Diffs' : 'Expand All Diffs';
    },
    icon: CaretDoubleUpIcon,
    requiresTarget: ActionTargetType.NONE,
    isVisible: (ctx) =>
      ctx.rightMainPanelMode === RIGHT_MAIN_PANEL_MODES.CHANGES &&
      ctx.layoutMode === 'workspaces',
    getIcon: (ctx) =>
      ctx.isAllDiffsExpanded ? CaretDoubleUpIcon : CaretDoubleDownIcon,
    getTooltip: (ctx) =>
      ctx.isAllDiffsExpanded ? 'Collapse all diffs' : 'Expand all diffs',
    execute: () => {
      const { diffPaths } = useDiffViewStore.getState();
      const { expanded, setExpandedAll } = useUiPreferencesStore.getState();
      const keys = diffPaths.map((p) => `diff:${p}`);
      const isAllExpanded =
        keys.length > 0 && keys.every((k) => expanded[k] !== false);
      setExpandedAll(keys, !isAllExpanded);
    },
  },

  // === ContextBar Actions ===
  OpenInIDE: {
    id: 'open-in-ide',
    label: 'Open in IDE',
    icon: 'ide-icon' as const,
    requiresTarget: ActionTargetType.NONE,
    isVisible: (ctx) => ctx.hasWorkspace,
    getTooltip: (ctx) => `Open in ${getIdeName(ctx.editorType)}`,
    execute: async (ctx) => {
      if (!ctx.currentWorkspaceId) return;
      try {
        const response = await attemptsApi.openEditor(ctx.currentWorkspaceId, {
          editor_type: null,
          file_path: null,
        });
        if (response.url) {
          window.open(response.url, '_blank');
        }
      } catch {
        // Show editor selection dialog on failure
        EditorSelectionDialog.show({
          selectedAttemptId: ctx.currentWorkspaceId,
        });
      }
    },
  },

  CopyWorkspacePath: {
    id: 'copy-workspace-path',
    label: 'Copy Workspace Path',
    icon: 'copy-icon' as const,
    shortcut: 'Y P',
    requiresTarget: ActionTargetType.NONE,
    isVisible: (ctx) => ctx.hasWorkspace,
    execute: async (ctx) => {
      if (!ctx.containerRef) return;
      await navigator.clipboard.writeText(ctx.containerRef);
    },
  },

  CopyRawLogs: {
    id: 'copy-raw-logs',
    label: 'Copy Raw Logs',
    icon: CopyIcon,
    shortcut: 'Y L',
    requiresTarget: ActionTargetType.NONE,
    isVisible: (ctx) =>
      ctx.rightMainPanelMode === RIGHT_MAIN_PANEL_MODES.LOGS &&
      ctx.logsPanelContent?.type !== 'terminal',
    execute: async (ctx) => {
      if (!ctx.currentLogs || ctx.currentLogs.length === 0) return;
      const rawText = ctx.currentLogs.map((log) => log.content).join('\n');
      await navigator.clipboard.writeText(rawText);
    },
  },

  ToggleDevServer: {
    id: 'toggle-dev-server',
    label: 'Dev Server',
    icon: PlayIcon,
    shortcut: 'T D',
    requiresTarget: ActionTargetType.NONE,
    isVisible: (ctx) => ctx.hasWorkspace,
    isEnabled: (ctx) =>
      ctx.devServerState !== 'starting' && ctx.devServerState !== 'stopping',
    getIcon: (ctx) => {
      if (
        ctx.devServerState === 'starting' ||
        ctx.devServerState === 'stopping'
      ) {
        return SpinnerIcon;
      }
      if (ctx.devServerState === 'running') {
        return PauseIcon;
      }
      return PlayIcon;
    },
    getTooltip: (ctx) => {
      switch (ctx.devServerState) {
        case 'starting':
          return 'Starting dev server...';
        case 'stopping':
          return 'Stopping dev server...';
        case 'running':
          return 'Stop dev server';
        default:
          return 'Start dev server';
      }
    },
    getLabel: (ctx) =>
      ctx.devServerState === 'running' ? 'Stop Dev Server' : 'Start Dev Server',
    execute: (ctx) => {
      if (ctx.runningDevServers.length > 0) {
        ctx.stopDevServer();
      } else {
        ctx.startDevServer();
        // Auto-open preview mode when starting dev server
        useUiPreferencesStore
          .getState()
          .setRightMainPanelMode(
            RIGHT_MAIN_PANEL_MODES.PREVIEW,
            ctx.currentWorkspaceId ?? undefined
          );
      }
    },
  },

  // === Git Actions ===
  GitCreatePR: {
    id: 'git-create-pr',
    label: 'Create Pull Request',
    icon: GitPullRequestIcon,
    shortcut: 'X P',
    requiresTarget: ActionTargetType.GIT,
    isVisible: (ctx) => ctx.hasWorkspace && ctx.hasGitRepos,
    execute: async (ctx, workspaceId, repoId) => {
      const workspace = await getWorkspace(ctx.queryClient, workspaceId);

      const repos = await attemptsApi.getRepos(workspaceId);
      const repo = repos.find((r) => r.id === repoId);

      // Resolve vibe-kanban identifier from remote workspace + issue
      let issueIdentifier: string | undefined;
      const remoteWs = ctx.remoteWorkspaces.find(
        (w) => w.local_workspace_id === workspaceId
      );
      if (remoteWs?.issue_id && ctx.projectMutations?.getIssue) {
        const issue = ctx.projectMutations.getIssue(remoteWs.issue_id);
        issueIdentifier = issue?.simple_id || remoteWs.issue_id;
      }

      const result = await CreatePRDialog.show({
        attempt: workspace,
        repoId,
        targetBranch: repo?.target_branch,
        issueIdentifier,
      });

      if (!result.success && result.error) {
        throw new Error(result.error);
      }
    },
  },

  GitLinkPR: {
    id: 'git-link-pr',
    label: 'Link Pull Request',
    icon: LinkIcon,
    requiresTarget: ActionTargetType.GIT,
    isVisible: (ctx) => ctx.hasWorkspace && ctx.hasGitRepos && !ctx.hasOpenPR,
    execute: async (ctx, workspaceId, repoId) => {
      const result = await attemptsApi.attachPr(workspaceId, {
        repo_id: repoId,
      });

      if (result.success && result.data.pr_attached && result.data.pr_number) {
        invalidateWorkspaceQueries(ctx.queryClient, workspaceId);
        ctx.queryClient.invalidateQueries({
          queryKey: ['branch-status'],
        });

        await ConfirmDialog.show({
          title: 'Pull Request Linked',
          message: `Linked PR #${result.data.pr_number}${result.data.pr_url ? ` — ${result.data.pr_url}` : ''}`,
          confirmText: 'OK',
          showCancelButton: false,
          variant: 'success',
        });
      } else if (result.success && !result.data.pr_attached) {
        await ConfirmDialog.show({
          title: 'No Pull Request Found',
          message:
            'No open pull request was found matching this branch. Make sure a PR exists for this branch on the remote.',
          confirmText: 'OK',
          showCancelButton: false,
          variant: 'info',
        });
      } else if (!result.success) {
        throw new Error(result.message || 'Failed to attach PR');
      }
    },
  },

  GitMerge: {
    id: 'git-merge',
    label: 'Merge',
    icon: GitMergeIcon,
    shortcut: 'X M',
    requiresTarget: ActionTargetType.GIT,
    isVisible: (ctx) => ctx.hasWorkspace && ctx.hasGitRepos,
    execute: async (ctx, workspaceId, repoId) => {
      // Check for existing conflicts first
      const branchStatus = await attemptsApi.getBranchStatus(workspaceId);
      const repoStatus = branchStatus?.find((s) => s.repo_id === repoId);

      // Check if repo has an open PR - cannot merge directly
      const hasOpenPR = repoStatus?.merges?.some(
        (m: Merge) => m.type === 'pr' && m.pr_info.status === 'open'
      );
      if (hasOpenPR) {
        await ConfirmDialog.show({
          title: 'Cannot Merge',
          message:
            'This repository has an open pull request. Please close or merge the PR before merging directly.',
          confirmText: 'OK',
          showCancelButton: false,
        });
        return;
      }

      const hasConflicts =
        repoStatus?.is_rebase_in_progress ||
        (repoStatus?.conflicted_files?.length ?? 0) > 0;

      if (hasConflicts && repoStatus) {
        // Skip showing the dialog if a process is already running
        // (e.g. an AI session is already resolving these conflicts)
        const isRunning = ctx.activeWorkspaces.find(
          (w) => w.id === workspaceId
        )?.isRunning;
        if (isRunning) return;

        // Show resolve conflicts dialog
        const workspace = await getWorkspace(ctx.queryClient, workspaceId);
        const result = await ResolveConflictsDialog.show({
          workspaceId,
          conflictOp: repoStatus.conflict_op ?? 'merge',
          sourceBranch: workspace.branch,
          targetBranch: repoStatus.target_branch_name,
          conflictedFiles: repoStatus.conflicted_files ?? [],
          repoName: repoStatus.repo_name,
        });

        if (result.action === 'resolved') {
          invalidateWorkspaceQueries(ctx.queryClient, workspaceId);
        }
        return;
      }

      // Check if branch is behind - need to rebase first
      const commitsBehind = repoStatus?.commits_behind ?? 0;
      if (commitsBehind > 0) {
        // Prompt user to rebase first
        const confirmRebase = await ConfirmDialog.show({
          title: 'Rebase Required',
          message: `Your branch is ${commitsBehind} commit${commitsBehind === 1 ? '' : 's'} behind the target branch. Would you like to rebase first?`,
          confirmText: 'Rebase',
          cancelText: 'Cancel',
        });

        if (confirmRebase === 'confirmed') {
          // Open rebase dialog - it loads branches/status internally
          await RebaseDialog.show({
            attemptId: workspaceId,
            repoId,
          });
        }
        return;
      }

      const confirmResult = await ConfirmDialog.show({
        title: 'Merge Branch',
        message:
          'Are you sure you want to merge this branch into the target branch?',
        confirmText: 'Merge',
        cancelText: 'Cancel',
      });

      if (confirmResult === 'confirmed') {
        await attemptsApi.merge(workspaceId, { repo_id: repoId });
        invalidateWorkspaceQueries(ctx.queryClient, workspaceId);
      }
    },
  },

  GitRebase: {
    id: 'git-rebase',
    label: 'Rebase',
    icon: ArrowsClockwiseIcon,
    shortcut: 'X R',
    requiresTarget: ActionTargetType.GIT,
    isVisible: (ctx) => ctx.hasWorkspace && ctx.hasGitRepos,
    execute: async (_ctx, workspaceId, repoId) => {
      // Open rebase dialog - it loads branches/status internally and handles conflicts
      await RebaseDialog.show({
        attemptId: workspaceId,
        repoId,
      });
    },
  },

  GitChangeTarget: {
    id: 'git-change-target',
    label: 'Change Target Branch',
    icon: CrosshairIcon,
    requiresTarget: ActionTargetType.GIT,
    isVisible: (ctx) => ctx.hasWorkspace && ctx.hasGitRepos,
    execute: async (ctx, workspaceId, repoId) => {
      const branches = await repoApi.getBranches(repoId);
      await ChangeTargetDialog.show({
        branches: branches.map((branch) => ({
          name: branch.name,
          isCurrent: branch.is_current,
        })),
        onChangeTargetBranch: async (newTargetBranch) => {
          await attemptsApi.change_target_branch(workspaceId, {
            new_target_branch: newTargetBranch,
            repo_id: repoId,
          });

          ctx.queryClient.invalidateQueries({
            queryKey: ['branchStatus', workspaceId],
          });
          ctx.queryClient.invalidateQueries({
            queryKey: attemptKeys.byId(workspaceId),
          });
          ctx.queryClient.invalidateQueries({
            queryKey: ['attemptRepo', workspaceId],
          });
          ctx.queryClient.invalidateQueries({
            queryKey: repoBranchKeys.byRepo(repoId),
          });
        },
      });
    },
  },

  GitPush: {
    id: 'git-push',
    label: 'Push',
    icon: ArrowUpIcon,
    shortcut: 'X U',
    requiresTarget: ActionTargetType.GIT,
    isVisible: (ctx) =>
      ctx.hasWorkspace &&
      ctx.hasGitRepos &&
      ctx.hasOpenPR &&
      ctx.hasUnpushedCommits,
    execute: async (ctx, workspaceId, repoId) => {
      const result = await attemptsApi.push(workspaceId, { repo_id: repoId });
      if (!result.success) {
        if (result.error?.type === 'force_push_required') {
          throw new Error(
            'Force push required. The remote branch has diverged.'
          );
        }
        throw new Error('Failed to push changes');
      }
      invalidateWorkspaceQueries(ctx.queryClient, workspaceId);
    },
  },

  // === Repo-specific Actions (for command bar when selecting a repo) ===
  RepoCopyPath: {
    id: 'repo-copy-path',
    label: 'Copy Repo Path',
    icon: CopyIcon,
    requiresTarget: ActionTargetType.GIT,
    isVisible: (ctx) => ctx.hasWorkspace && ctx.hasGitRepos,
    execute: async (_ctx, _workspaceId, repoId) => {
      try {
        const repo = await repoApi.getById(repoId);
        if (repo?.path) {
          await navigator.clipboard.writeText(repo.path);
        }
      } catch (err) {
        console.error('Failed to copy repo path:', err);
        throw new Error('Failed to copy repository path');
      }
    },
  },

  RepoOpenInIDE: {
    id: 'repo-open-in-ide',
    label: 'Open Repo in IDE',
    icon: DesktopIcon,
    requiresTarget: ActionTargetType.GIT,
    isVisible: (ctx) => ctx.hasWorkspace && ctx.hasGitRepos,
    execute: async (_ctx, _workspaceId, repoId) => {
      try {
        const response = await repoApi.openEditor(repoId, {
          editor_type: null,
          file_path: null,
        });
        if (response.url) {
          window.open(response.url, '_blank');
        }
      } catch (err) {
        console.error('Failed to open repo in editor:', err);
        throw new Error('Failed to open repository in IDE');
      }
    },
  },

  RepoSettings: {
    id: 'repo-settings',
    label: 'Repository Settings',
    icon: GearIcon,
    requiresTarget: ActionTargetType.GIT,
    isVisible: (ctx) => ctx.hasWorkspace && ctx.hasGitRepos,
    execute: async (_ctx, _workspaceId, repoId) => {
      await SettingsDialog.show({
        initialSection: 'repos',
        initialState: {
          repoId,
        },
      });
    },
  },

  // === Script Actions ===
  RunSetupScript: {
    id: 'run-setup-script',
    label: 'Run Setup Script',
    icon: TerminalIcon,
    shortcut: 'R S',
    requiresTarget: ActionTargetType.WORKSPACE,
    isVisible: (ctx) => ctx.hasWorkspace,
    isEnabled: (ctx) => !ctx.isAttemptRunning,
    execute: async (_ctx, workspaceId) => {
      const result = await attemptsApi.runSetupScript(workspaceId);
      if (!result.success) {
        if (result.error?.type === 'no_script_configured') {
          throw new Error('No setup script configured for this project');
        }
        if (result.error?.type === 'process_already_running') {
          throw new Error('Cannot run script while another process is running');
        }
        throw new Error('Failed to run setup script');
      }
    },
  },

  RunCleanupScript: {
    id: 'run-cleanup-script',
    label: 'Run Cleanup Script',
    icon: TerminalIcon,
    shortcut: 'R C',
    requiresTarget: ActionTargetType.WORKSPACE,
    isVisible: (ctx) => ctx.hasWorkspace,
    isEnabled: (ctx) => !ctx.isAttemptRunning,
    execute: async (_ctx, workspaceId) => {
      const result = await attemptsApi.runCleanupScript(workspaceId);
      if (!result.success) {
        if (result.error?.type === 'no_script_configured') {
          throw new Error('No cleanup script configured for this project');
        }
        if (result.error?.type === 'process_already_running') {
          throw new Error('Cannot run script while another process is running');
        }
        throw new Error('Failed to run cleanup script');
      }
    },
  },

  RunArchiveScript: {
    id: 'run-archive-script',
    label: 'Run Archive Script',
    icon: TerminalIcon,
    shortcut: 'R A',
    requiresTarget: ActionTargetType.WORKSPACE,
    isVisible: (ctx) => ctx.hasWorkspace,
    isEnabled: (ctx) => !ctx.isAttemptRunning,
    execute: async (_ctx, workspaceId) => {
      const result = await attemptsApi.runArchiveScript(workspaceId);
      if (!result.success) {
        if (result.error?.type === 'no_script_configured') {
          throw new Error('No archive script configured for this project');
        }
        if (result.error?.type === 'process_already_running') {
          throw new Error('Cannot run script while another process is running');
        }
        throw new Error('Failed to run archive script');
      }
    },
  } satisfies WorkspaceActionDefinition,

  // === Issue Actions ===
  CreateIssue: {
    id: 'create-issue',
    label: 'Create Issue',
    icon: PlusIcon,
    shortcut: 'I C',
    requiresTarget: ActionTargetType.NONE,
    isVisible: (ctx) => ctx.layoutMode === 'kanban' && !ctx.isCreatingIssue,
    execute: (ctx) => {
      ctx.navigateToCreateIssue({ statusId: ctx.defaultCreateStatusId });
    },
  } satisfies GlobalActionDefinition,

  ChangeIssueStatus: {
    id: 'change-issue-status',
    label: 'Change Status',
    icon: ArrowsLeftRightIcon,
    shortcut: 'I S',
    requiresTarget: ActionTargetType.ISSUE,
    isVisible: (ctx) =>
      ctx.layoutMode === 'kanban' && ctx.hasSelectedKanbanIssue,
    execute: async (ctx, projectId, issueIds) => {
      await ctx.openStatusSelection(projectId, issueIds);
    },
  } satisfies IssueActionDefinition,

  ChangeNewIssueStatus: {
    id: 'change-new-issue-status',
    label: 'Change Status',
    icon: ArrowsLeftRightIcon,
    shortcut: 'I S',
    requiresTarget: ActionTargetType.NONE,
    isVisible: (ctx) => ctx.layoutMode === 'kanban' && ctx.isCreatingIssue,
    execute: async (ctx) => {
      if (!ctx.kanbanProjectId) return;
      const { ProjectSelectionDialog } = await import(
        '@/shared/dialogs/command-bar/selections/ProjectSelectionDialog'
      );
      await ProjectSelectionDialog.show({
        projectId: ctx.kanbanProjectId,
        selection: { type: 'status', issueIds: [], isCreateMode: true },
      });
    },
  } satisfies GlobalActionDefinition,

  ChangePriority: {
    id: 'change-issue-priority',
    label: 'Change Priority',
    icon: ArrowFatLineUpIcon,
    shortcut: 'I P',
    requiresTarget: ActionTargetType.ISSUE,
    isVisible: (ctx) =>
      ctx.layoutMode === 'kanban' && ctx.hasSelectedKanbanIssue,
    execute: async (ctx, projectId, issueIds) => {
      await ctx.openPrioritySelection(projectId, issueIds);
    },
  } satisfies IssueActionDefinition,

  ChangeNewIssuePriority: {
    id: 'change-new-issue-priority',
    label: 'Change Priority',
    icon: ArrowFatLineUpIcon,
    shortcut: 'I P',
    requiresTarget: ActionTargetType.NONE,
    isVisible: (ctx) => ctx.layoutMode === 'kanban' && ctx.isCreatingIssue,
    execute: async (ctx) => {
      if (!ctx.kanbanProjectId) return;
      const { ProjectSelectionDialog } = await import(
        '@/shared/dialogs/command-bar/selections/ProjectSelectionDialog'
      );
      await ProjectSelectionDialog.show({
        projectId: ctx.kanbanProjectId,
        selection: { type: 'priority', issueIds: [], isCreateMode: true },
      });
    },
  } satisfies GlobalActionDefinition,

  ChangeAssignees: {
    id: 'change-assignees',
    label: 'Change Assignees',
    icon: UsersIcon,
    shortcut: 'I A',
    requiresTarget: ActionTargetType.ISSUE,
    isVisible: (ctx) =>
      ctx.layoutMode === 'kanban' && ctx.hasSelectedKanbanIssue,
    execute: async (ctx, projectId, issueIds) => {
      await ctx.openAssigneeSelection(projectId, issueIds, false);
    },
  } satisfies IssueActionDefinition,

  ChangeNewIssueAssignees: {
    id: 'change-new-issue-assignees',
    label: 'Change Assignees',
    icon: UsersIcon,
    shortcut: 'I A',
    requiresTarget: ActionTargetType.NONE,
    isVisible: (ctx) => ctx.layoutMode === 'kanban' && ctx.isCreatingIssue,
    execute: async (ctx) => {
      // Opens assignee selection for the issue being created
      // ProjectId will be resolved from route params inside the dialog
      await ctx.openAssigneeSelection('', [], true);
    },
  } satisfies GlobalActionDefinition,

  MakeSubIssueOf: {
    id: 'make-sub-issue-of',
    label: 'Make Sub-issue of',
    icon: TreeStructureIcon,
    shortcut: 'I M',
    requiresTarget: ActionTargetType.ISSUE,
    isVisible: (ctx) =>
      ctx.layoutMode === 'kanban' && ctx.hasSelectedKanbanIssue,
    execute: async (ctx, projectId, issueIds) => {
      if (issueIds.length === 1) {
        await ctx.openSubIssueSelection(projectId, issueIds[0], 'setParent');
      }
    },
  } satisfies IssueActionDefinition,

  AddSubIssue: {
    id: 'add-sub-issue',
    label: 'Add Sub-issue',
    icon: PlusIcon,
    shortcut: 'I B',
    requiresTarget: ActionTargetType.ISSUE,
    isVisible: (ctx) =>
      ctx.layoutMode === 'kanban' && ctx.hasSelectedKanbanIssue,
    execute: async (ctx, projectId, issueIds) => {
      if (issueIds.length !== 1) return;
      const parentIssueId = issueIds[0];
      const result = await ctx.openSubIssueSelection(
        projectId,
        parentIssueId,
        'addChild'
      );
      if (result?.type === 'createNew') {
        navigateToCreateSubIssue(ctx, parentIssueId);
      }
    },
  } satisfies IssueActionDefinition,

  CreateSubIssue: {
    id: 'create-sub-issue',
    label: 'Create Sub-issue',
    icon: PlusIcon,
    requiresTarget: ActionTargetType.ISSUE,
    isVisible: (ctx) =>
      ctx.layoutMode === 'kanban' && ctx.hasSelectedKanbanIssue,
    execute: async (ctx, _projectId, issueIds) => {
      if (issueIds.length !== 1) return;
      navigateToCreateSubIssue(ctx, issueIds[0]);
    },
  } satisfies IssueActionDefinition,

  RemoveParentIssue: {
    id: 'remove-parent-issue',
    label: 'Remove Parent',
    icon: XIcon,
    shortcut: 'I U',
    requiresTarget: ActionTargetType.ISSUE,
    isVisible: (ctx) =>
      ctx.layoutMode === 'kanban' &&
      ctx.hasSelectedKanbanIssue &&
      ctx.hasSelectedKanbanIssueParent,
    execute: async (_ctx, _projectId, issueIds) => {
      await bulkUpdateIssues(
        issueIds.map((issueId) => ({
          id: issueId,
          changes: {
            parent_issue_id: null,
            parent_issue_sort_order: null,
          },
        }))
      );
    },
  } satisfies IssueActionDefinition,

  LinkWorkspace: {
    id: 'link-workspace',
    label: 'Link Workspace',
    icon: LinkIcon,
    shortcut: 'I W',
    requiresTarget: ActionTargetType.ISSUE,
    isVisible: (ctx) =>
      ctx.layoutMode === 'kanban' && ctx.hasSelectedKanbanIssue,
    execute: async (ctx, projectId, issueIds) => {
      if (issueIds.length === 1) {
        await ctx.openWorkspaceSelection(projectId, issueIds[0]);
      }
    },
  } satisfies IssueActionDefinition,

  DeleteIssue: {
    id: 'delete-issue',
    label: 'Delete Issue',
    icon: TrashIcon,
    shortcut: 'I X',
    variant: 'destructive',
    requiresTarget: ActionTargetType.ISSUE,
    isVisible: (ctx) =>
      ctx.layoutMode === 'kanban' && ctx.hasSelectedKanbanIssue,
    execute: async (ctx, _projectId, issueIds) => {
      const count = issueIds.length;
      const result = await ConfirmDialog.show({
        title: count === 1 ? 'Delete Issue' : `Delete ${count} Issues`,
        message:
          count === 1
            ? 'Are you sure you want to delete this issue? This action cannot be undone.'
            : `Are you sure you want to delete these ${count} issues? This action cannot be undone.`,
        confirmText: 'Delete',
        cancelText: 'Cancel',
        variant: 'destructive',
      });
      if (result === 'confirmed' && ctx.projectMutations?.removeIssue) {
        for (const issueId of issueIds) {
          ctx.projectMutations.removeIssue(issueId);
        }
      }
    },
  } satisfies IssueActionDefinition,

  DuplicateIssue: {
    id: 'duplicate-issue',
    label: 'Duplicate Issue',
    icon: CopyIcon,
    shortcut: 'I D',
    requiresTarget: ActionTargetType.ISSUE,
    isVisible: (ctx) =>
      ctx.layoutMode === 'kanban' && ctx.hasSelectedKanbanIssue,
    execute: async (ctx, _projectId, issueIds) => {
      if (issueIds.length !== 1) {
        throw new Error('Can only duplicate one issue at a time');
      }
      ctx.projectMutations?.duplicateIssue(issueIds[0]);
    },
  } satisfies IssueActionDefinition,

  MarkBlocking: {
    id: 'mark-blocking',
    label: 'Mark Blocking',
    icon: ArrowBendUpRightIcon,
    requiresTarget: ActionTargetType.ISSUE,
    isVisible: (ctx) =>
      ctx.layoutMode === 'kanban' && ctx.hasSelectedKanbanIssue,
    execute: async (ctx, projectId, issueIds) => {
      if (issueIds.length === 1) {
        await ctx.openRelationshipSelection(
          projectId,
          issueIds[0],
          'blocking',
          'forward'
        );
      }
    },
  } satisfies IssueActionDefinition,

  MarkBlockedBy: {
    id: 'mark-blocked-by',
    label: 'Mark Blocked By',
    icon: ProhibitIcon,
    requiresTarget: ActionTargetType.ISSUE,
    isVisible: (ctx) =>
      ctx.layoutMode === 'kanban' && ctx.hasSelectedKanbanIssue,
    execute: async (ctx, projectId, issueIds) => {
      if (issueIds.length === 1) {
        await ctx.openRelationshipSelection(
          projectId,
          issueIds[0],
          'blocking',
          'reverse'
        );
      }
    },
  } satisfies IssueActionDefinition,

  MarkRelated: {
    id: 'mark-related',
    label: 'Mark Related',
    icon: ArrowsLeftRightIcon,
    requiresTarget: ActionTargetType.ISSUE,
    isVisible: (ctx) =>
      ctx.layoutMode === 'kanban' && ctx.hasSelectedKanbanIssue,
    execute: async (ctx, projectId, issueIds) => {
      if (issueIds.length === 1) {
        await ctx.openRelationshipSelection(
          projectId,
          issueIds[0],
          'related',
          'forward'
        );
      }
    },
  } satisfies IssueActionDefinition,

  MarkDuplicateOf: {
    id: 'mark-duplicate-of',
    label: 'Mark Duplicate Of',
    icon: CopyIcon,
    requiresTarget: ActionTargetType.ISSUE,
    isVisible: (ctx) =>
      ctx.layoutMode === 'kanban' && ctx.hasSelectedKanbanIssue,
    execute: async (ctx, projectId, issueIds) => {
      if (issueIds.length === 1) {
        await ctx.openRelationshipSelection(
          projectId,
          issueIds[0],
          'has_duplicate',
          'forward'
        );
      }
    },
  } satisfies IssueActionDefinition,
} as const satisfies Record<string, ActionDefinition>;

// Navbar action groups define which actions appear in each section
export const NavbarActionGroups = {
  left: [Actions.ArchiveWorkspace] as NavbarItem[],
  right: [
    Actions.ToggleDiffViewMode,
    Actions.ToggleAllDiffs,
    NavbarDivider,
    Actions.ToggleLeftSidebar,
    Actions.ToggleLeftMainPanel,
    Actions.ToggleChangesMode,
    Actions.ToggleLogsMode,
    Actions.TogglePreviewMode,
    Actions.ToggleRightSidebar,
    NavbarDivider,
    Actions.OpenCommandBar,
    Actions.Feedback,
    Actions.WorkspacesGuide,
    Actions.ProjectsGuide,
    Actions.Settings,
  ] as NavbarItem[],
};

// ContextBar action groups define which actions appear in each section
export const ContextBarActionGroups = {
  primary: [Actions.OpenInIDE, Actions.CopyWorkspacePath] as ActionDefinition[],
  secondary: [
    Actions.ToggleDevServer,
    Actions.TogglePreviewMode,
    Actions.ToggleChangesMode,
  ] as ActionDefinition[],
};
