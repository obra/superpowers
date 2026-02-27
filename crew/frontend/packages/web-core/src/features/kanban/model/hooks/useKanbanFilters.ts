import { useMemo } from 'react';
import {
  KANBAN_ASSIGNEE_FILTER_VALUES,
  type KanbanFilterState,
} from '@/shared/stores/useUiPreferencesStore';
import type {
  Issue,
  IssueAssignee,
  IssueTag,
  IssuePriority,
} from 'shared/remote-types';

type UseKanbanFiltersParams = {
  issues: Issue[];
  issueAssignees: IssueAssignee[];
  issueTags: IssueTag[];
  filters: KanbanFilterState;
  showSubIssues: boolean;
  currentUserId: string | null;
};

type UseKanbanFiltersResult = {
  filteredIssues: Issue[];
};

export const PRIORITY_ORDER: Record<IssuePriority, number> = {
  urgent: 0,
  high: 1,
  medium: 2,
  low: 3,
};

export function useKanbanFilters({
  issues,
  issueAssignees,
  issueTags,
  filters,
  showSubIssues,
  currentUserId,
}: UseKanbanFiltersParams): UseKanbanFiltersResult {
  // Create lookup maps for efficient filtering
  const assigneesByIssue = useMemo(() => {
    const map: Record<string, string[]> = {};
    for (const ia of issueAssignees) {
      if (!map[ia.issue_id]) {
        map[ia.issue_id] = [];
      }
      map[ia.issue_id].push(ia.user_id);
    }
    return map;
  }, [issueAssignees]);

  const tagsByIssue = useMemo(() => {
    const map: Record<string, string[]> = {};
    for (const it of issueTags) {
      if (!map[it.issue_id]) {
        map[it.issue_id] = [];
      }
      map[it.issue_id].push(it.tag_id);
    }
    return map;
  }, [issueTags]);

  // Filter issues
  const filteredIssues = useMemo(() => {
    let result = issues;

    // Filter sub-issues based on per-project preference
    if (!showSubIssues) {
      result = result.filter((issue) => issue.parent_issue_id === null);
    }

    // Text search (title)
    const query = filters.searchQuery.trim().toLowerCase();
    if (query) {
      result = result.filter((issue) =>
        issue.title.toLowerCase().includes(query)
      );
    }

    // Priority filter (OR within)
    if (filters.priorities.length > 0) {
      result = result.filter(
        (issue) =>
          issue.priority !== null && filters.priorities.includes(issue.priority)
      );
    }

    // Assignee filter (OR within)
    if (filters.assigneeIds.length > 0) {
      const includeUnassigned = filters.assigneeIds.includes(
        KANBAN_ASSIGNEE_FILTER_VALUES.UNASSIGNED
      );
      const selectedAssigneeIds = new Set(
        filters.assigneeIds.flatMap((assigneeId) => {
          if (assigneeId === KANBAN_ASSIGNEE_FILTER_VALUES.SELF) {
            return currentUserId ? [currentUserId] : [];
          }
          if (assigneeId === KANBAN_ASSIGNEE_FILTER_VALUES.UNASSIGNED) {
            return [];
          }
          return [assigneeId];
        })
      );

      result = result.filter((issue) => {
        const issueAssigneeIds = assigneesByIssue[issue.id] ?? [];

        // Check for 'unassigned' special case
        if (includeUnassigned) {
          if (issueAssigneeIds.length === 0) return true;
        }

        // Check if any of the issue's assignees match the filter
        return issueAssigneeIds.some((assigneeId) =>
          selectedAssigneeIds.has(assigneeId)
        );
      });
    }

    // Tags filter (OR within)
    if (filters.tagIds.length > 0) {
      result = result.filter((issue) => {
        const issueTagIds = tagsByIssue[issue.id] ?? [];
        return issueTagIds.some((tagId) => filters.tagIds.includes(tagId));
      });
    }

    // Note: Sorting is handled in KanbanContainer after grouping by status
    // so that sort order is applied within each column

    return result;
  }, [
    issues,
    filters,
    assigneesByIssue,
    tagsByIssue,
    showSubIssues,
    currentUserId,
  ]);

  return {
    filteredIssues,
  };
}
