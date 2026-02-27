import { useMemo, useCallback, useState } from 'react';
import { DragDropContext, type DropResult } from '@hello-pangea/dnd';
import { PlusIcon, LinkIcon } from '@phosphor-icons/react';
import { useProjectContext } from '@/shared/hooks/useProjectContext';
import { useOrgContext } from '@/shared/hooks/useOrgContext';
import { useKanbanNavigation } from '@/shared/hooks/useKanbanNavigation';
import { useActions } from '@/shared/hooks/useActions';
import { Actions } from '@/shared/actions';
import { bulkUpdateIssues } from '@/shared/lib/remoteApi';
import { ConfirmDialog } from '@vibe/ui/components/ConfirmDialog';
import {
  IssueSubIssuesSection,
  type SubIssueData,
} from '@vibe/ui/components/IssueSubIssuesSection';
import type { SectionAction } from '@vibe/ui/components/CollapsibleSectionHeader';

interface IssueSubIssuesSectionContainerProps {
  issueId: string;
}

/**
 * Container component for the sub-issues section.
 * Fetches sub-issues from ProjectContext and transforms them for display.
 * Supports drag-and-drop reordering of sub-issues.
 */
export function IssueSubIssuesSectionContainer({
  issueId,
}: IssueSubIssuesSectionContainerProps) {
  const { projectId, openIssue } = useKanbanNavigation();
  const {
    executeAction,
    openSubIssueSelection,
    openPrioritySelection,
    openAssigneeSelection,
  } = useActions();

  const {
    issues,
    statuses,
    updateIssue,
    removeIssue,
    getAssigneesForIssue,
    isLoading: projectLoading,
  } = useProjectContext();

  const { membersWithProfilesById, isLoading: orgLoading } = useOrgContext();

  // Create lookup maps for efficient access
  const statusesById = useMemo(() => {
    return new Map(statuses.map((s) => [s.id, s]));
  }, [statuses]);

  // Filter, sort, and transform sub-issues
  const subIssues: SubIssueData[] = useMemo(() => {
    return issues
      .filter((issue) => issue.parent_issue_id === issueId)
      .sort((a, b) => {
        // Sort by parent_issue_sort_order (nulls last), then by created_at
        const aOrder = a.parent_issue_sort_order;
        const bOrder = b.parent_issue_sort_order;
        if (aOrder === null && bOrder === null) {
          return (
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          );
        }
        if (aOrder === null) return 1;
        if (bOrder === null) return -1;
        return aOrder - bOrder;
      })
      .map((issue) => {
        const status = statusesById.get(issue.status_id);
        const assigneeRecords = getAssigneesForIssue(issue.id);
        const assignees = assigneeRecords
          .map((a) => membersWithProfilesById.get(a.user_id))
          .filter((u): u is NonNullable<typeof u> => u !== undefined);

        return {
          id: issue.id,
          simpleId: issue.simple_id,
          title: issue.title,
          priority: issue.priority,
          statusColor: status?.color ?? '#888888',
          assignees,
          createdAt: issue.created_at,
          parentIssueSortOrder: issue.parent_issue_sort_order ?? null,
        };
      });
  }, [
    issues,
    issueId,
    statusesById,
    membersWithProfilesById,
    getAssigneesForIssue,
  ]);

  // Handle clicking on a sub-issue to navigate to it
  const handleSubIssueClick = useCallback(
    (subIssueId: string) => {
      openIssue(subIssueId);
    },
    [openIssue]
  );

  // Track reordering state for loading overlay
  const [isReordering, setIsReordering] = useState(false);

  // Handle drag and drop reordering
  const handleDragEnd = useCallback(
    (result: DropResult) => {
      if (!result.destination) return;
      if (result.source.index === result.destination.index) return;

      // Reorder locally
      const reordered = [...subIssues];
      const [moved] = reordered.splice(result.source.index, 1);
      reordered.splice(result.destination.index, 0, moved);

      // Build updates: all items get sequential integers 0, 1, 2, ...
      const updates = reordered.map((item, index) => ({
        id: item.id,
        changes: { parent_issue_sort_order: index },
      }));

      // Show loading overlay while saving
      setIsReordering(true);
      bulkUpdateIssues(updates)
        .catch((err) => {
          console.error('Failed to update sort order:', err);
        })
        .finally(() => {
          // Small delay before hiding loader to prevent flicker
          setTimeout(() => setIsReordering(false), 500);
        });
    },
    [subIssues]
  );

  const isLoading = projectLoading || orgLoading;

  // Handle clicking '+' to create new sub-issue immediately
  const handleCreateNewSubIssue = useCallback(() => {
    if (projectId) {
      void executeAction(Actions.CreateSubIssue, undefined, projectId, [
        issueId,
      ]);
    }
  }, [executeAction, projectId, issueId]);

  // Handle clicking link icon to select an existing issue as sub-issue
  const handleLinkSubIssue = useCallback(() => {
    if (projectId) {
      openSubIssueSelection(projectId, issueId);
    }
  }, [projectId, issueId, openSubIssueSelection]);

  // Inline editing callbacks for sub-issue rows
  const handleSubIssuePriorityClick = useCallback(
    (subIssueId: string) => {
      if (projectId) {
        openPrioritySelection(projectId, [subIssueId]);
      }
    },
    [projectId, openPrioritySelection]
  );

  const handleSubIssueAssigneeClick = useCallback(
    (subIssueId: string) => {
      if (projectId) {
        openAssigneeSelection(projectId, [subIssueId]);
      }
    },
    [projectId, openAssigneeSelection]
  );

  const handleSubIssueMarkIndependent = useCallback(
    (subIssueId: string) => {
      updateIssue(subIssueId, {
        parent_issue_id: null,
        parent_issue_sort_order: null,
      });
    },
    [updateIssue]
  );

  const handleSubIssueDelete = useCallback(
    async (subIssueId: string) => {
      const subIssue = issues.find((issue) => issue.id === subIssueId);
      const result = await ConfirmDialog.show({
        title: 'Delete Sub-issue',
        message: subIssue
          ? `Are you sure you want to delete "${subIssue.title}"? This action cannot be undone.`
          : 'Are you sure you want to delete this sub-issue? This action cannot be undone.',
        confirmText: 'Delete',
        cancelText: 'Cancel',
        variant: 'destructive',
      });

      if (result === 'confirmed') {
        removeIssue(subIssueId);
      }
    },
    [issues, removeIssue]
  );

  // Actions for the section header
  const actions: SectionAction[] = useMemo(
    () => [
      {
        icon: PlusIcon,
        onClick: handleCreateNewSubIssue,
      },
      {
        icon: LinkIcon,
        onClick: handleLinkSubIssue,
      },
    ],
    [handleCreateNewSubIssue, handleLinkSubIssue]
  );

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <IssueSubIssuesSection
        parentIssueId={issueId}
        subIssues={subIssues}
        onSubIssueClick={handleSubIssueClick}
        onSubIssueMarkIndependent={handleSubIssueMarkIndependent}
        onSubIssueDelete={handleSubIssueDelete}
        onSubIssuePriorityClick={handleSubIssuePriorityClick}
        onSubIssueAssigneeClick={handleSubIssueAssigneeClick}
        isLoading={isLoading}
        isReordering={isReordering}
        actions={actions}
      />
    </DragDropContext>
  );
}
