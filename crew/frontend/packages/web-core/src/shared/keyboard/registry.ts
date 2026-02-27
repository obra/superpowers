export enum Scope {
  GLOBAL = 'global',
  DIALOG = 'dialog',
  CONFIRMATION = 'confirmation',
  KANBAN = 'kanban',
  PROJECTS = 'projects',
  SETTINGS = 'settings',
  EDIT_COMMENT = 'edit-comment',
  APPROVALS = 'approvals',
  FOLLOW_UP = 'follow-up',
  FOLLOW_UP_READY = 'follow-up-ready',
  WORKSPACE = 'workspace',
}

export enum Action {
  EXIT = 'exit',
  CREATE = 'create',
  SUBMIT = 'submit',
  FOCUS_SEARCH = 'focus_search',
  NAV_UP = 'nav_up',
  NAV_DOWN = 'nav_down',
  NAV_LEFT = 'nav_left',
  NAV_RIGHT = 'nav_right',
  OPEN_DETAILS = 'open_details',
  SHOW_HELP = 'show_help',
  DELETE_TASK = 'delete_task',
  APPROVE_REQUEST = 'approve_request',
  DENY_APPROVAL = 'deny_approval',
  SUBMIT_FOLLOW_UP = 'submit_follow_up',
  SUBMIT_TASK = 'submit_task',
  SUBMIT_TASK_ALT = 'submit_task_alt',
  SUBMIT_COMMENT = 'submit_comment',
  CYCLE_VIEW_BACKWARD = 'cycle_view_backward',
}

export interface KeyBinding {
  action: Action;
  keys: string | string[];
  scopes?: Scope[];
  description: string;
  group?: string;
}

/**
 * Sequential keyboard shortcut binding (e.g., "g s" for Go to Settings)
 */
export interface SequentialBinding {
  id: string;
  keys: string[];
  scopes?: Scope[];
  description: string;
  group: string;
  actionId: string;
}

/**
 * Valid first keys for sequential shortcuts.
 * These keys will be intercepted to start a sequence.
 */
export const SEQUENCE_FIRST_KEYS = new Set([
  'g', // Go/Navigate
  'w', // Workspace
  'v', // View
  'x', // eXecute (git)
  'y', // Yank/Copy
  't', // Toggle
  'r', // Run
  'i', // Issue
]);

/**
 * All sequential keyboard shortcuts organized by namespace
 */
export const sequentialBindings: SequentialBinding[] = [
  // Navigation (G = Go)
  {
    id: 'seq-go-settings',
    keys: ['g', 's'],
    description: 'Go to Settings',
    group: 'Navigation',
    actionId: 'settings',
  },
  {
    id: 'seq-go-new-workspace',
    keys: ['g', 'n'],
    description: 'Go to New Workspace',
    group: 'Navigation',
    actionId: 'new-workspace',
  },

  // Workspace (W)
  {
    id: 'seq-workspace-duplicate',
    keys: ['w', 'd'],
    description: 'Duplicate workspace',
    group: 'Workspace',
    actionId: 'duplicate-workspace',
  },
  {
    id: 'seq-workspace-rename',
    keys: ['w', 'r'],
    description: 'Rename workspace',
    group: 'Workspace',
    actionId: 'rename-workspace',
  },
  {
    id: 'seq-workspace-pin',
    keys: ['w', 'p'],
    description: 'Pin/Unpin workspace',
    group: 'Workspace',
    actionId: 'pin-workspace',
  },
  {
    id: 'seq-workspace-archive',
    keys: ['w', 'a'],
    description: 'Archive workspace',
    group: 'Workspace',
    actionId: 'archive-workspace',
  },
  {
    id: 'seq-workspace-delete',
    keys: ['w', 'x'],
    description: 'Delete workspace',
    group: 'Workspace',
    actionId: 'delete-workspace',
  },

  // View (V)
  {
    id: 'seq-view-changes',
    keys: ['v', 'c'],
    description: 'Toggle Changes panel',
    group: 'View',
    actionId: 'toggle-changes-mode',
  },
  {
    id: 'seq-view-logs',
    keys: ['v', 'l'],
    description: 'Toggle Logs panel',
    group: 'View',
    actionId: 'toggle-logs-mode',
  },
  {
    id: 'seq-view-preview',
    keys: ['v', 'p'],
    description: 'Toggle Preview panel',
    group: 'View',
    actionId: 'toggle-preview-mode',
  },
  {
    id: 'seq-view-sidebar',
    keys: ['v', 's'],
    description: 'Toggle Left Sidebar',
    group: 'View',
    actionId: 'toggle-left-sidebar',
  },
  {
    id: 'seq-view-chat',
    keys: ['v', 'h'],
    description: 'Toggle Chat panel',
    group: 'View',
    actionId: 'toggle-left-main-panel',
  },

  // Git (X = eXecute)
  {
    id: 'seq-git-pr',
    keys: ['x', 'p'],
    scopes: [Scope.WORKSPACE],
    description: 'Create Pull Request',
    group: 'Git',
    actionId: 'git-create-pr',
  },
  {
    id: 'seq-git-merge',
    keys: ['x', 'm'],
    scopes: [Scope.WORKSPACE],
    description: 'Merge branch',
    group: 'Git',
    actionId: 'git-merge',
  },
  {
    id: 'seq-git-rebase',
    keys: ['x', 'r'],
    scopes: [Scope.WORKSPACE],
    description: 'Rebase branch',
    group: 'Git',
    actionId: 'git-rebase',
  },
  {
    id: 'seq-git-push',
    keys: ['x', 'u'],
    scopes: [Scope.WORKSPACE],
    description: 'Push changes',
    group: 'Git',
    actionId: 'git-push',
  },

  // Yank/Copy (Y)
  {
    id: 'seq-yank-path',
    keys: ['y', 'p'],
    scopes: [Scope.WORKSPACE],
    description: 'Copy path',
    group: 'Yank',
    actionId: 'copy-path',
  },
  {
    id: 'seq-yank-logs',
    keys: ['y', 'l'],
    scopes: [Scope.WORKSPACE],
    description: 'Copy raw logs',
    group: 'Yank',
    actionId: 'copy-raw-logs',
  },

  // Toggle (T)
  {
    id: 'seq-toggle-dev-server',
    keys: ['t', 'd'],
    scopes: [Scope.WORKSPACE],
    description: 'Toggle dev server',
    group: 'Toggle',
    actionId: 'toggle-dev-server',
  },
  {
    id: 'seq-toggle-wrap',
    keys: ['t', 'w'],
    scopes: [Scope.WORKSPACE],
    description: 'Toggle line wrapping',
    group: 'Toggle',
    actionId: 'toggle-wrap-lines',
  },

  // Run (R)
  {
    id: 'seq-run-setup',
    keys: ['r', 's'],
    scopes: [Scope.WORKSPACE],
    description: 'Run setup script',
    group: 'Run',
    actionId: 'run-setup-script',
  },
  {
    id: 'seq-run-cleanup',
    keys: ['r', 'c'],
    scopes: [Scope.WORKSPACE],
    description: 'Run cleanup script',
    group: 'Run',
    actionId: 'run-cleanup-script',
  },
  {
    id: 'seq-run-archive',
    keys: ['r', 'a'],
    scopes: [Scope.WORKSPACE],
    description: 'Run archive script',
    group: 'Run',
    actionId: 'run-archive-script',
  },

  // Issue (I)
  {
    id: 'seq-issue-create',
    keys: ['i', 'c'],
    description: 'Create Issue',
    group: 'Issue',
    actionId: 'create-issue',
  },
  {
    id: 'seq-issue-status',
    keys: ['i', 's'],
    description: 'Change Status',
    group: 'Issue',
    actionId: 'change-issue-status',
  },
  {
    id: 'seq-issue-priority',
    keys: ['i', 'p'],
    description: 'Change Priority',
    group: 'Issue',
    actionId: 'change-issue-priority',
  },
  {
    id: 'seq-issue-assignees',
    keys: ['i', 'a'],
    description: 'Change Assignees',
    group: 'Issue',
    actionId: 'change-assignees',
  },
  {
    id: 'seq-issue-make-sub-issue',
    keys: ['i', 'm'],
    description: 'Make Sub-issue of',
    group: 'Issue',
    actionId: 'make-sub-issue-of',
  },
  {
    id: 'seq-issue-add-sub-issue',
    keys: ['i', 'b'],
    description: 'Add Sub-issue',
    group: 'Issue',
    actionId: 'add-sub-issue',
  },
  {
    id: 'seq-issue-remove-parent',
    keys: ['i', 'u'],
    description: 'Remove Parent',
    group: 'Issue',
    actionId: 'remove-parent-issue',
  },
  {
    id: 'seq-issue-link-workspace',
    keys: ['i', 'w'],
    description: 'Link Workspace',
    group: 'Issue',
    actionId: 'link-workspace',
  },
  {
    id: 'seq-issue-duplicate',
    keys: ['i', 'd'],
    description: 'Duplicate Issue',
    group: 'Issue',
    actionId: 'duplicate-issue',
  },
  {
    id: 'seq-issue-delete',
    keys: ['i', 'x'],
    description: 'Delete Issue',
    group: 'Issue',
    actionId: 'delete-issue',
  },
];

export const keyBindings: KeyBinding[] = [
  // Exit/Close actions
  {
    action: Action.EXIT,
    keys: 'esc',
    scopes: [Scope.CONFIRMATION],
    description: 'Close confirmation dialog',
    group: 'Dialog',
  },
  {
    action: Action.EXIT,
    keys: 'esc',
    scopes: [Scope.DIALOG],
    description: 'Close dialog or blur input',
    group: 'Dialog',
  },
  {
    action: Action.EXIT,
    keys: 'esc',
    scopes: [Scope.KANBAN],
    description: 'Close panel or navigate to projects',
    group: 'Navigation',
  },
  {
    action: Action.EXIT,
    keys: 'esc',
    scopes: [Scope.EDIT_COMMENT],
    description: 'Cancel comment',
    group: 'Comments',
  },
  {
    action: Action.EXIT,
    keys: 'esc',
    scopes: [Scope.SETTINGS],
    description: 'Close settings',
    group: 'Navigation',
  },

  // Creation actions
  {
    action: Action.CREATE,
    keys: 'c',
    scopes: [Scope.KANBAN],
    description: 'Create new task',
    group: 'Kanban',
  },
  {
    action: Action.CREATE,
    keys: 'c',
    scopes: [Scope.PROJECTS],
    description: 'Create new project',
    group: 'Projects',
  },

  // Submit actions
  {
    action: Action.SUBMIT,
    keys: 'enter',
    scopes: [Scope.DIALOG],
    description: 'Submit form or confirm action',
    group: 'Dialog',
  },

  // Navigation actions
  {
    action: Action.FOCUS_SEARCH,
    keys: 'slash',
    scopes: [Scope.KANBAN],
    description: 'Focus search',
    group: 'Navigation',
  },
  {
    action: Action.NAV_UP,
    keys: 'k',
    scopes: [Scope.KANBAN],
    description: 'Move up within column',
    group: 'Navigation',
  },
  {
    action: Action.NAV_DOWN,
    keys: 'j',
    scopes: [Scope.KANBAN],
    description: 'Move down within column',
    group: 'Navigation',
  },
  {
    action: Action.NAV_LEFT,
    keys: 'h',
    scopes: [Scope.KANBAN],
    description: 'Move to previous column',
    group: 'Navigation',
  },
  {
    action: Action.NAV_RIGHT,
    keys: 'l',
    scopes: [Scope.KANBAN],
    description: 'Move to next column',
    group: 'Navigation',
  },
  {
    action: Action.OPEN_DETAILS,
    keys: ['meta+enter', 'ctrl+enter'],
    scopes: [Scope.KANBAN],
    description:
      'Open details; when open, cycle views forward (attempt → preview → diffs)',
    group: 'Navigation',
  },
  {
    action: Action.CYCLE_VIEW_BACKWARD,
    keys: ['meta+shift+enter', 'ctrl+shift+enter'],
    scopes: [Scope.KANBAN],
    description: 'Cycle views backward (diffs → preview → attempt)',
    group: 'Navigation',
  },

  // Global actions
  {
    action: Action.SHOW_HELP,
    keys: 'shift+slash',
    scopes: [Scope.GLOBAL],
    description: 'Show keyboard shortcuts help',
    group: 'Global',
  },

  // Task actions
  {
    action: Action.DELETE_TASK,
    keys: 'd',
    scopes: [Scope.KANBAN],
    description: 'Delete selected task',
    group: 'Task Details',
  },

  // Approval actions
  {
    action: Action.APPROVE_REQUEST,
    keys: 'enter',
    scopes: [Scope.APPROVALS],
    description: 'Approve pending approval request',
    group: 'Approvals',
  },
  {
    action: Action.DENY_APPROVAL,
    keys: ['meta+enter', 'ctrl+enter'],
    scopes: [Scope.APPROVALS],
    description: 'Deny pending approval request',
    group: 'Approvals',
  },

  // Follow-up actions
  {
    action: Action.SUBMIT_FOLLOW_UP,
    keys: 'meta+enter',
    scopes: [Scope.FOLLOW_UP_READY],
    description: 'Send or queue follow-up (depending on state)',
    group: 'Follow-up',
  },
  {
    action: Action.SUBMIT_TASK,
    keys: ['meta+enter', 'ctrl+enter'],
    scopes: [Scope.DIALOG],
    description: 'Submit task form (Create & Start or Update)',
    group: 'Dialog',
  },
  {
    action: Action.SUBMIT_TASK_ALT,
    keys: ['meta+shift+enter', 'ctrl+shift+enter'],
    scopes: [Scope.DIALOG],
    description: 'Submit task form (Create Task)',
    group: 'Dialog',
  },
  {
    action: Action.SUBMIT_COMMENT,
    keys: ['meta+enter', 'ctrl+enter'],
    scopes: [Scope.EDIT_COMMENT],
    description: 'Submit review comment',
    group: 'Comments',
  },
];

/**
 * Get keyboard bindings for a specific action and scope
 */
export function getKeysFor(action: Action, scope?: Scope): string[] {
  const bindings = keyBindings
    .filter(
      (binding) =>
        binding.action === action &&
        (!scope || !binding.scopes || binding.scopes.includes(scope))
    )
    .flatMap((binding) =>
      Array.isArray(binding.keys) ? binding.keys : [binding.keys]
    );

  return bindings;
}

/**
 * Get binding info for a specific action and scope
 */
export function getBindingFor(
  action: Action,
  scope?: Scope
): KeyBinding | undefined {
  return keyBindings.find(
    (binding) =>
      binding.action === action &&
      (!scope || !binding.scopes || binding.scopes.includes(scope))
  );
}

/**
 * Get sequential binding for a specific action ID
 */
export function getSequentialBindingFor(
  actionId: string
): SequentialBinding | undefined {
  return sequentialBindings.find((binding) => binding.actionId === actionId);
}

/**
 * Format sequential keys for display (e.g., ['g', 's'] -> 'G S')
 */
export function formatSequentialKeys(keys: string[]): string {
  return keys.map((k) => k.toUpperCase()).join(' ');
}
