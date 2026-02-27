import { createSemanticHook } from '@/shared/keyboard/useSemanticKey';
import { Action } from '@/shared/keyboard/registry';

/**
 * Semantic keyboard shortcut hooks
 *
 * These hooks provide a clean, semantic interface for common keyboard actions.
 * All key bindings are centrally managed in the registry.
 */

/**
 * Exit/Close action - typically Esc key
 *
 * @example
 * // In a dialog
 * useKeyExit(() => closeDialog(), { scope: Scope.DIALOG });
 *
 * @example
 * // In kanban board
 * useKeyExit(() => navigateToProjects(), { scope: Scope.KANBAN });
 */
export const useKeyExit = createSemanticHook(Action.EXIT);

/**
 * Create action - typically 'c' key
 *
 * @example
 * // Create new task
 * useKeyCreate(() => openTaskForm(), { scope: Scope.KANBAN });
 *
 * @example
 * // Create new project
 * useKeyCreate(() => openProjectForm(), { scope: Scope.PROJECTS });
 */
export const useKeyCreate = createSemanticHook(Action.CREATE);

/**
 * Submit action - typically Enter key
 *
 * @example
 * // Submit form in dialog
 * useKeySubmit(() => submitForm(), { scope: Scope.DIALOG });
 */
export const useKeySubmit = createSemanticHook(Action.SUBMIT);

/**
 * Focus search action - typically '/' key
 *
 * @example
 * useKeyFocusSearch(() => focusSearchInput(), { scope: Scope.KANBAN });
 */
export const useKeyFocusSearch = createSemanticHook(Action.FOCUS_SEARCH);

/**
 * Navigation actions - arrow keys and vim keys (hjkl)
 */
export const useKeyNavUp = createSemanticHook(Action.NAV_UP);
export const useKeyNavDown = createSemanticHook(Action.NAV_DOWN);
export const useKeyNavLeft = createSemanticHook(Action.NAV_LEFT);
export const useKeyNavRight = createSemanticHook(Action.NAV_RIGHT);

/**
 * Open details action - typically Enter key
 *
 * @example
 * useKeyOpenDetails(() => openTaskDetails(), { scope: Scope.KANBAN });
 */
export const useKeyOpenDetails = createSemanticHook(Action.OPEN_DETAILS);

/**
 * Show help action - typically '?' key
 *
 * @example
 * useKeyShowHelp(() => openHelpDialog(), { scope: Scope.GLOBAL });
 */
export const useKeyShowHelp = createSemanticHook(Action.SHOW_HELP);

/**
 * Delete task action - typically 'd' key
 *
 * @example
 * useKeyDeleteTask(() => handleDeleteTask(selectedTask), { scope: Scope.KANBAN });
 */
export const useKeyDeleteTask = createSemanticHook(Action.DELETE_TASK);

/**
 * Approve pending approval action - typically Enter key
 *
 * @example
 * useKeyApproveRequest(() => approvePendingRequest(), { scope: Scope.APPROVALS });
 */
export const useKeyApproveRequest = createSemanticHook(Action.APPROVE_REQUEST);

/**
 * Deny pending approval action - typically Cmd/Ctrl+Enter
 *
 * @example
 * useKeyDenyApproval(() => denyPendingRequest(), { scope: Scope.GLOBAL });
 */
export const useKeyDenyApproval = createSemanticHook(Action.DENY_APPROVAL);

/**
 * Submit follow-up action - typically Cmd+Enter
 * Intelligently sends or queues based on current state (running vs idle)
 *
 * @example
 * useKeySubmitFollowUp(() => handleSubmit(), { scope: Scope.FOLLOW_UP_READY });
 */
export const useKeySubmitFollowUp = createSemanticHook(Action.SUBMIT_FOLLOW_UP);

/**
 * Submit task action - typically Cmd+Enter
 * Primary submit action in task dialog (Create & Start or Update)
 *
 * @example
 * useKeySubmitTask(() => handleSubmit(), { scope: Scope.DIALOG, when: canSubmit });
 */
export const useKeySubmitTask = createSemanticHook(Action.SUBMIT_TASK);

/**
 * Alternative task submit action - typically Cmd+Shift+Enter
 * Secondary submit action in task dialog (Create Task without starting)
 *
 * @example
 * useKeySubmitTaskAlt(() => handleCreateOnly(), { scope: Scope.DIALOG, when: canSubmit });
 */
export const useKeySubmitTaskAlt = createSemanticHook(Action.SUBMIT_TASK_ALT);

/**
 * Submit comment action - typically Cmd+Enter
 * Submit review comment in diff view
 *
 * @example
 * useKeySubmitComment(() => handleSave(), { scope: Scope.EDIT_COMMENT, when: hasContent });
 */
export const useKeySubmitComment = createSemanticHook(Action.SUBMIT_COMMENT);

/**
 * Cycle view backward action - typically Cmd+Shift+Enter
 * Cycle views backward in attempt area
 *
 * @example
 * useKeyCycleViewBackward(() => cycleBackward(), { scope: Scope.KANBAN });
 */
export const useKeyCycleViewBackward = createSemanticHook(
  Action.CYCLE_VIEW_BACKWARD
);
