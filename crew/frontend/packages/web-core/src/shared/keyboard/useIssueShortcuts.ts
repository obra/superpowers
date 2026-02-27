import { useCallback, useRef, useEffect, useMemo } from 'react';
import { useParams, useLocation } from '@tanstack/react-router';
import { useHotkeys } from 'react-hotkeys-hook';
import { useActions } from '@/shared/hooks/useActions';
import { Actions } from '@/shared/actions';
import {
  type ActionDefinition,
  ActionTargetType,
} from '@/shared/types/actions';
import { Scope } from '@/shared/keyboard/registry';

const SEQUENCE_TIMEOUT_MS = 1500;

const OPTIONS = {
  scopes: [Scope.KANBAN],
  sequenceTimeout: SEQUENCE_TIMEOUT_MS,
} as const;

export function useIssueShortcuts() {
  const { executeAction } = useActions();
  const { projectId, issueId } = useParams({ strict: false });
  const location = useLocation();

  const isKanban = location.pathname.startsWith('/projects');
  // Detect create mode from the URL path (e.g. /projects/:id/issues/new)
  // NOT from ?mode=create searchParam which is a legacy format
  const isCreatingIssue = location.pathname.endsWith('/issues/new');

  const executeActionRef = useRef(executeAction);
  const projectIdRef = useRef(projectId);
  const issueIdRef = useRef(issueId);
  const isKanbanRef = useRef(isKanban);
  const isCreatingIssueRef = useRef(isCreatingIssue);

  useEffect(() => {
    executeActionRef.current = executeAction;
    projectIdRef.current = projectId;
    issueIdRef.current = issueId;
    isKanbanRef.current = isKanban;
    isCreatingIssueRef.current = isCreatingIssue;
  });

  const issueIds = useMemo(() => (issueId ? [issueId] : []), [issueId]);
  const issueIdsRef = useRef(issueIds);
  useEffect(() => {
    issueIdsRef.current = issueIds;
  });

  const executeIssueAction = useCallback(
    (action: ActionDefinition, e?: KeyboardEvent) => {
      if (!isKanbanRef.current) return;
      // react-hotkeys-hook does not call preventDefault for sequence hotkeys,
      // so we must do it manually to stop the second keystroke from being typed
      // into any focused input (e.g. the title field after i>c opens create mode).
      e?.preventDefault();

      const currentProjectId = projectIdRef.current;
      const currentIssueIds = issueIdsRef.current;

      if (action.requiresTarget === ActionTargetType.ISSUE) {
        if (!currentProjectId || currentIssueIds.length === 0) return;
        executeActionRef.current(
          action,
          undefined,
          currentProjectId,
          currentIssueIds
        );
      } else if (action.requiresTarget === ActionTargetType.NONE) {
        executeActionRef.current(action);
      }
    },
    []
  );

  const enabled = isKanban;

  useHotkeys('i>c', (e) => executeIssueAction(Actions.CreateIssue, e), {
    ...OPTIONS,
    enabled,
  });
  useHotkeys(
    'i>s',
    (e) => {
      if (isCreatingIssueRef.current) {
        executeIssueAction(Actions.ChangeNewIssueStatus, e);
      } else {
        executeIssueAction(Actions.ChangeIssueStatus, e);
      }
    },
    { ...OPTIONS, enabled }
  );
  useHotkeys(
    'i>p',
    (e) => {
      if (isCreatingIssueRef.current) {
        executeIssueAction(Actions.ChangeNewIssuePriority, e);
      } else {
        executeIssueAction(Actions.ChangePriority, e);
      }
    },
    { ...OPTIONS, enabled }
  );
  useHotkeys(
    'i>a',
    (e) => {
      if (isCreatingIssueRef.current) {
        executeIssueAction(Actions.ChangeNewIssueAssignees, e);
      } else {
        executeIssueAction(Actions.ChangeAssignees, e);
      }
    },
    { ...OPTIONS, enabled }
  );
  useHotkeys('i>m', (e) => executeIssueAction(Actions.MakeSubIssueOf, e), {
    ...OPTIONS,
    enabled,
  });
  useHotkeys('i>b', (e) => executeIssueAction(Actions.AddSubIssue, e), {
    ...OPTIONS,
    enabled,
  });
  useHotkeys('i>u', (e) => executeIssueAction(Actions.RemoveParentIssue, e), {
    ...OPTIONS,
    enabled,
  });
  useHotkeys('i>w', (e) => executeIssueAction(Actions.LinkWorkspace, e), {
    ...OPTIONS,
    enabled,
  });
  useHotkeys('i>d', (e) => executeIssueAction(Actions.DuplicateIssue, e), {
    ...OPTIONS,
    enabled,
  });
  useHotkeys('i>x', (e) => executeIssueAction(Actions.DeleteIssue, e), {
    ...OPTIONS,
    enabled,
  });
}
