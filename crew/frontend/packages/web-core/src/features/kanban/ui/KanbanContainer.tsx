import { useMemo, useCallback, useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useProjectContext } from '@/shared/hooks/useProjectContext';
import { useOrgContext } from '@/shared/hooks/useOrgContext';
import { useWorkspaceContext } from '@/shared/hooks/useWorkspaceContext';
import { useActions } from '@/shared/hooks/useActions';
import { useAuth } from '@/shared/hooks/auth/useAuth';
import {
  useUiPreferencesStore,
  resolveKanbanProjectState,
  KANBAN_ASSIGNEE_FILTER_VALUES,
  KANBAN_PROJECT_VIEW_IDS,
  type KanbanFilterState,
  type KanbanSortField,
} from '@/shared/stores/useUiPreferencesStore';
import {
  useKanbanFilters,
  PRIORITY_ORDER,
} from '../model/hooks/useKanbanFilters';
import {
  bulkUpdateIssues,
  type BulkUpdateIssueItem,
} from '@/shared/lib/remoteApi';
import { useKanbanNavigation } from '@/shared/hooks/useKanbanNavigation';
import { PlusIcon, DotsThreeIcon } from '@phosphor-icons/react';
import { Actions } from '@/shared/actions';
import type { OrganizationMemberWithProfile } from 'shared/types';
import {
  KanbanProvider,
  KanbanBoard,
  KanbanCard,
  KanbanCards,
  KanbanHeader,
  type DropResult,
} from '@vibe/ui/components/KanbanBoard';
import { KanbanCardContent } from '@vibe/ui/components/KanbanCardContent';
import {
  IssueWorkspaceCard,
  type WorkspaceWithStats,
  type WorkspacePr,
} from '@vibe/ui/components/IssueWorkspaceCard';
import { resolveRelationshipsForIssue } from '@/shared/lib/resolveRelationships';
import { KanbanFilterBar } from '@vibe/ui/components/KanbanFilterBar';
import { ViewNavTabs } from '@vibe/ui/components/ViewNavTabs';
import { IssueListView } from '@vibe/ui/components/IssueListView';
import { CommandBarDialog } from '@/shared/dialogs/command-bar/CommandBarDialog';
import { KanbanFiltersDialog } from '@/shared/dialogs/kanban/KanbanFiltersDialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@vibe/ui/components/Dropdown';
import { SearchableTagDropdownContainer } from '@/shared/components/SearchableTagDropdownContainer';
import type { IssuePriority } from 'shared/remote-types';

const areStringSetsEqual = (left: string[], right: string[]): boolean => {
  if (left.length !== right.length) {
    return false;
  }

  const rightSet = new Set(right);
  return left.every((value) => rightSet.has(value));
};

const areKanbanFiltersEqual = (
  left: KanbanFilterState,
  right: KanbanFilterState
): boolean => {
  if (left.searchQuery.trim() !== right.searchQuery.trim()) {
    return false;
  }

  if (!areStringSetsEqual(left.priorities, right.priorities)) {
    return false;
  }

  if (!areStringSetsEqual(left.assigneeIds, right.assigneeIds)) {
    return false;
  }

  if (!areStringSetsEqual(left.tagIds, right.tagIds)) {
    return false;
  }

  return (
    left.sortField === right.sortField &&
    left.sortDirection === right.sortDirection
  );
};

function LoadingState() {
  const { t } = useTranslation('common');
  return (
    <div className="flex items-center justify-center h-full">
      <p className="text-low">{t('states.loading')}</p>
    </div>
  );
}

/**
 * KanbanContainer displays the kanban board using data from ProjectContext and OrgContext.
 * Must be rendered within both OrgProvider and ProjectProvider.
 */
export function KanbanContainer() {
  const { t } = useTranslation('common');

  // Get data from contexts (set up by WorkspacesLayout)
  const {
    projectId,
    issues,
    statuses,
    tags,
    issueAssignees,
    issueTags,
    getTagObjectsForIssue,
    getTagsForIssue,
    getPullRequestsForIssue,
    getWorkspacesForIssue,
    getRelationshipsForIssue,
    issuesById,
    insertIssueTag,
    removeIssueTag,
    insertTag,
    pullRequests,
    isLoading: projectLoading,
  } = useProjectContext();

  const {
    projects,
    membersWithProfilesById,
    isLoading: orgLoading,
  } = useOrgContext();
  const { activeWorkspaces } = useWorkspaceContext();
  const { userId } = useAuth();

  // Get project name by finding the project matching current projectId
  const projectName = projects.find((p) => p.id === projectId)?.name ?? '';

  // Apply filters
  // Navigation hook for opening issues and create mode
  const {
    issueId: selectedKanbanIssueId,
    openIssue,
    openIssueWorkspace,
    startCreate,
  } = useKanbanNavigation();

  // Get setter and executor from ActionsContext
  const {
    setDefaultCreateStatusId,
    executeAction,
    openPrioritySelection,
    openAssigneeSelection,
  } = useActions();
  const openProjectsGuide = useCallback(() => {
    executeAction(Actions.ProjectsGuide);
  }, [executeAction]);

  const projectViewSelection = useUiPreferencesStore(
    (s) => s.kanbanProjectViewSelections[projectId]
  );
  const projectViewPreferencesById = useUiPreferencesStore(
    (s) => s.kanbanProjectViewPreferences[projectId]
  );
  const setKanbanProjectView = useUiPreferencesStore(
    (s) => s.setKanbanProjectView
  );
  const setKanbanProjectViewFilters = useUiPreferencesStore(
    (s) => s.setKanbanProjectViewFilters
  );
  const setKanbanProjectViewShowSubIssues = useUiPreferencesStore(
    (s) => s.setKanbanProjectViewShowSubIssues
  );
  const setKanbanProjectViewShowWorkspaces = useUiPreferencesStore(
    (s) => s.setKanbanProjectViewShowWorkspaces
  );
  const clearKanbanProjectViewPreferences = useUiPreferencesStore(
    (s) => s.clearKanbanProjectViewPreferences
  );
  const resolvedProjectState = useMemo(
    () => resolveKanbanProjectState(projectViewSelection),
    [projectViewSelection]
  );
  const {
    activeViewId,
    filters: defaultKanbanFilters,
    showSubIssues: defaultShowSubIssues,
    showWorkspaces: defaultShowWorkspaces,
  } = resolvedProjectState;
  const projectViewPreferences = projectViewPreferencesById?.[activeViewId];
  const kanbanFilters = projectViewPreferences?.filters ?? defaultKanbanFilters;
  const showSubIssues =
    projectViewPreferences?.showSubIssues ?? defaultShowSubIssues;
  const showWorkspaces =
    projectViewPreferences?.showWorkspaces ?? defaultShowWorkspaces;

  const hasActiveFilters = useMemo(
    () =>
      !areKanbanFiltersEqual(kanbanFilters, defaultKanbanFilters) ||
      showSubIssues !== defaultShowSubIssues ||
      showWorkspaces !== defaultShowWorkspaces,
    [
      kanbanFilters,
      defaultKanbanFilters,
      showSubIssues,
      defaultShowSubIssues,
      showWorkspaces,
      defaultShowWorkspaces,
    ]
  );
  const shouldAnimateCreateButton = issues.length === 0;

  const { filteredIssues } = useKanbanFilters({
    issues,
    issueAssignees,
    issueTags,
    filters: kanbanFilters,
    showSubIssues,
    currentUserId: userId,
  });

  const setKanbanSearchQuery = useCallback(
    (searchQuery: string) => {
      setKanbanProjectViewFilters(projectId, activeViewId, {
        ...kanbanFilters,
        searchQuery,
      });
    },
    [activeViewId, kanbanFilters, projectId, setKanbanProjectViewFilters]
  );

  const setKanbanPriorities = useCallback(
    (priorities: IssuePriority[]) => {
      setKanbanProjectViewFilters(projectId, activeViewId, {
        ...kanbanFilters,
        priorities,
      });
    },
    [activeViewId, kanbanFilters, projectId, setKanbanProjectViewFilters]
  );

  const setKanbanAssignees = useCallback(
    (assigneeIds: string[]) => {
      setKanbanProjectViewFilters(projectId, activeViewId, {
        ...kanbanFilters,
        assigneeIds,
      });
    },
    [activeViewId, kanbanFilters, projectId, setKanbanProjectViewFilters]
  );

  const setKanbanTags = useCallback(
    (tagIds: string[]) => {
      setKanbanProjectViewFilters(projectId, activeViewId, {
        ...kanbanFilters,
        tagIds,
      });
    },
    [activeViewId, kanbanFilters, projectId, setKanbanProjectViewFilters]
  );

  const setKanbanSort = useCallback(
    (sortField: KanbanSortField, sortDirection: 'asc' | 'desc') => {
      setKanbanProjectViewFilters(projectId, activeViewId, {
        ...kanbanFilters,
        sortField,
        sortDirection,
      });
    },
    [activeViewId, kanbanFilters, projectId, setKanbanProjectViewFilters]
  );

  const setShowSubIssues = useCallback(
    (show: boolean) => {
      setKanbanProjectViewShowSubIssues(projectId, activeViewId, show);
    },
    [activeViewId, projectId, setKanbanProjectViewShowSubIssues]
  );

  const setShowWorkspaces = useCallback(
    (show: boolean) => {
      setKanbanProjectViewShowWorkspaces(projectId, activeViewId, show);
    },
    [activeViewId, projectId, setKanbanProjectViewShowWorkspaces]
  );

  const clearKanbanFilters = useCallback(() => {
    clearKanbanProjectViewPreferences(projectId, activeViewId);
  }, [activeViewId, clearKanbanProjectViewPreferences, projectId]);

  const handleKanbanProjectViewChange = useCallback(
    (viewId: string) => {
      setKanbanProjectView(projectId, viewId);
    },
    [projectId, setKanbanProjectView]
  );
  const kanbanViewMode = useUiPreferencesStore((s) => s.kanbanViewMode);
  const listViewStatusFilter = useUiPreferencesStore(
    (s) => s.listViewStatusFilter
  );
  const setKanbanViewMode = useUiPreferencesStore((s) => s.setKanbanViewMode);
  const setListViewStatusFilter = useUiPreferencesStore(
    (s) => s.setListViewStatusFilter
  );
  // Reset view mode when navigating projects
  const prevProjectIdRef = useRef<string | null>(null);

  // Track when drag-drop sync is in progress to prevent flicker
  const isSyncingRef = useRef(false);

  useEffect(() => {
    if (
      prevProjectIdRef.current !== null &&
      prevProjectIdRef.current !== projectId
    ) {
      setKanbanViewMode('kanban');
      setListViewStatusFilter(null);
    }

    prevProjectIdRef.current = projectId;
  }, [projectId, setKanbanViewMode, setListViewStatusFilter]);

  // Sort all statuses for display settings
  const sortedStatuses = useMemo(
    () => [...statuses].sort((a, b) => a.sort_order - b.sort_order),
    [statuses]
  );

  // Filter statuses: visible (non-hidden) for kanban, hidden for tabs
  const visibleStatuses = useMemo(
    () => sortedStatuses.filter((s) => !s.hidden),
    [sortedStatuses]
  );

  // Map status ID to 1-based column index for sort_order calculation
  const statusColumnIndexMap = useMemo(() => {
    const map = new Map<string, number>();
    visibleStatuses.forEach((status, index) => {
      map.set(status.id, index + 1);
    });
    return map;
  }, [visibleStatuses]);

  const hiddenStatuses = useMemo(
    () => sortedStatuses.filter((s) => s.hidden),
    [sortedStatuses]
  );

  const defaultCreateStatusId = useMemo(() => {
    if (kanbanViewMode === 'kanban') {
      return visibleStatuses[0]?.id;
    }
    if (listViewStatusFilter) {
      return listViewStatusFilter;
    }
    return sortedStatuses[0]?.id;
  }, [kanbanViewMode, visibleStatuses, listViewStatusFilter, sortedStatuses]);

  // Update default create status for command bar based on current tab
  useEffect(() => {
    setDefaultCreateStatusId(defaultCreateStatusId);
  }, [defaultCreateStatusId, setDefaultCreateStatusId]);

  const createAssigneeIds = useMemo(() => {
    const assigneeIds = new Set<string>();

    for (const assigneeId of kanbanFilters.assigneeIds) {
      if (assigneeId === KANBAN_ASSIGNEE_FILTER_VALUES.UNASSIGNED) {
        continue;
      }

      if (assigneeId === KANBAN_ASSIGNEE_FILTER_VALUES.SELF) {
        if (userId) {
          assigneeIds.add(userId);
        }
        continue;
      }

      assigneeIds.add(assigneeId);
    }

    return [...assigneeIds];
  }, [kanbanFilters.assigneeIds, userId]);

  // Get statuses to display in list view (all or filtered to one)
  const listViewStatuses = useMemo(() => {
    if (listViewStatusFilter) {
      return sortedStatuses.filter((s) => s.id === listViewStatusFilter);
    }
    return sortedStatuses;
  }, [sortedStatuses, listViewStatusFilter]);

  // Track items as arrays of IDs grouped by status
  const [items, setItems] = useState<Record<string, string[]>>({});
  const [isFiltersDialogOpen, setIsFiltersDialogOpen] = useState(false);

  // Sync items from filtered issues when they change
  useEffect(() => {
    // Skip rebuild during drag-drop sync to prevent flicker
    if (isSyncingRef.current) {
      return;
    }

    const { sortField, sortDirection } = kanbanFilters;
    const grouped: Record<string, string[]> = {};

    for (const status of statuses) {
      // Filter issues for this status
      let statusIssues = filteredIssues.filter(
        (i) => i.status_id === status.id
      );

      // Sort within column based on user preference
      statusIssues = [...statusIssues].sort((a, b) => {
        let comparison = 0;
        switch (sortField) {
          case 'priority':
            comparison =
              (a.priority ? PRIORITY_ORDER[a.priority] : Infinity) -
              (b.priority ? PRIORITY_ORDER[b.priority] : Infinity);
            break;
          case 'created_at':
            comparison =
              new Date(a.created_at).getTime() -
              new Date(b.created_at).getTime();
            break;
          case 'updated_at':
            comparison =
              new Date(a.updated_at).getTime() -
              new Date(b.updated_at).getTime();
            break;
          case 'title':
            comparison = a.title.localeCompare(b.title);
            break;
          case 'sort_order':
          default:
            comparison = a.sort_order - b.sort_order;
        }
        return sortDirection === 'desc' ? -comparison : comparison;
      });

      grouped[status.id] = statusIssues.map((i) => i.id);
    }
    setItems(grouped);
  }, [filteredIssues, statuses, kanbanFilters]);

  // Create a lookup map for issue data
  const issueMap = useMemo(() => {
    const map: Record<string, (typeof issues)[0]> = {};
    for (const issue of issues) {
      map[issue.id] = issue;
    }
    return map;
  }, [issues]);

  // Create a lookup map for issue assignees (issue_id -> OrganizationMemberWithProfile[])
  const issueAssigneesMap = useMemo(() => {
    const map: Record<string, OrganizationMemberWithProfile[]> = {};
    for (const assignee of issueAssignees) {
      const member = membersWithProfilesById.get(assignee.user_id);
      if (member) {
        if (!map[assignee.issue_id]) {
          map[assignee.issue_id] = [];
        }
        map[assignee.issue_id].push(member);
      }
    }
    return map;
  }, [issueAssignees, membersWithProfilesById]);

  const membersWithProfiles = useMemo(
    () => [...membersWithProfilesById.values()],
    [membersWithProfilesById]
  );

  const localWorkspacesById = useMemo(() => {
    const map = new Map<string, (typeof activeWorkspaces)[number]>();

    for (const workspace of activeWorkspaces) {
      map.set(workspace.id, workspace);
    }

    return map;
  }, [activeWorkspaces]);

  const prsByWorkspaceId = useMemo(() => {
    const map = new Map<string, WorkspacePr[]>();

    for (const pr of pullRequests) {
      if (!pr.workspace_id) continue;

      const prs = map.get(pr.workspace_id) ?? [];
      prs.push({
        number: pr.number,
        url: pr.url,
        status: pr.status as 'open' | 'merged' | 'closed',
      });
      map.set(pr.workspace_id, prs);
    }

    return map;
  }, [pullRequests]);

  const workspacesByIssueId = useMemo(() => {
    if (!showWorkspaces) {
      return new Map<string, WorkspaceWithStats[]>();
    }

    const map = new Map<string, WorkspaceWithStats[]>();

    for (const issue of issues) {
      const nonArchivedWorkspaces = getWorkspacesForIssue(issue.id)
        .filter(
          (workspace) =>
            !workspace.archived &&
            !!workspace.local_workspace_id &&
            localWorkspacesById.has(workspace.local_workspace_id)
        )
        .map((workspace) => {
          const localWorkspace = localWorkspacesById.get(
            workspace.local_workspace_id!
          );

          return {
            id: workspace.id,
            localWorkspaceId: workspace.local_workspace_id,
            name: workspace.name,
            archived: workspace.archived,
            filesChanged: workspace.files_changed ?? 0,
            linesAdded: workspace.lines_added ?? 0,
            linesRemoved: workspace.lines_removed ?? 0,
            prs: prsByWorkspaceId.get(workspace.id) ?? [],
            owner: membersWithProfilesById.get(workspace.owner_user_id) ?? null,
            updatedAt: workspace.updated_at,
            isOwnedByCurrentUser: workspace.owner_user_id === userId,
            isRunning: localWorkspace?.isRunning,
            hasPendingApproval: localWorkspace?.hasPendingApproval,
            hasRunningDevServer: localWorkspace?.hasRunningDevServer,
            hasUnseenActivity: localWorkspace?.hasUnseenActivity,
            latestProcessCompletedAt: localWorkspace?.latestProcessCompletedAt,
            latestProcessStatus: localWorkspace?.latestProcessStatus,
          };
        });

      if (nonArchivedWorkspaces.length > 0) {
        map.set(issue.id, nonArchivedWorkspaces);
      }
    }

    return map;
  }, [
    showWorkspaces,
    issues,
    getWorkspacesForIssue,
    localWorkspacesById,
    prsByWorkspaceId,
    membersWithProfilesById,
    userId,
  ]);

  // Calculate sort_order based on column index and issue position
  // Formula: 1000 * [COLUMN_INDEX] + [ISSUE_INDEX] (both 1-based)
  const calculateSortOrder = useCallback(
    (statusId: string, issueIndex: number): number => {
      const columnIndex = statusColumnIndexMap.get(statusId) ?? 1;
      return 1000 * columnIndex + (issueIndex + 1);
    },
    [statusColumnIndexMap]
  );

  // Simple onDragEnd handler - the library handles all visual movement
  const handleDragEnd = useCallback(
    (result: DropResult) => {
      const { source, destination } = result;

      // Dropped outside a valid droppable
      if (!destination) return;

      // No movement
      if (
        source.droppableId === destination.droppableId &&
        source.index === destination.index
      ) {
        return;
      }

      const isManualSort = kanbanFilters.sortField === 'sort_order';

      // Block within-column reordering when not in manual sort mode
      // (cross-column moves are always allowed for status changes)
      if (source.droppableId === destination.droppableId && !isManualSort) {
        return;
      }

      const sourceId = source.droppableId;
      const destId = destination.droppableId;
      const isCrossColumn = sourceId !== destId;

      // Update local state and capture new items for bulk update
      let newItems: Record<string, string[]> = {};
      setItems((prev) => {
        const sourceItems = [...(prev[sourceId] ?? [])];
        const [moved] = sourceItems.splice(source.index, 1);

        if (!isCrossColumn) {
          // Within-column reorder
          sourceItems.splice(destination.index, 0, moved);
          newItems = { ...prev, [sourceId]: sourceItems };
        } else {
          // Cross-column move
          const destItems = [...(prev[destId] ?? [])];
          destItems.splice(destination.index, 0, moved);
          newItems = {
            ...prev,
            [sourceId]: sourceItems,
            [destId]: destItems,
          };
        }
        return newItems;
      });

      // Build bulk updates for all issues in affected columns
      const updates: BulkUpdateIssueItem[] = [];

      // Always update destination column
      const destIssueIds = newItems[destId] ?? [];
      destIssueIds.forEach((issueId, index) => {
        updates.push({
          id: issueId,
          changes: {
            status_id: destId,
            sort_order: calculateSortOrder(destId, index),
          },
        });
      });

      // Update source column if cross-column move
      if (isCrossColumn) {
        const sourceIssueIds = newItems[sourceId] ?? [];
        sourceIssueIds.forEach((issueId, index) => {
          updates.push({
            id: issueId,
            changes: {
              sort_order: calculateSortOrder(sourceId, index),
            },
          });
        });
      }

      // Perform bulk update
      isSyncingRef.current = true;
      bulkUpdateIssues(updates)
        .catch((err) => {
          console.error('Failed to bulk update sort order:', err);
        })
        .finally(() => {
          // Delay clearing flag to let Electric sync complete
          setTimeout(() => {
            isSyncingRef.current = false;
          }, 500);
        });
    },
    [kanbanFilters.sortField, calculateSortOrder]
  );

  const handleCardClick = useCallback(
    (issueId: string) => {
      openIssue(issueId);
    },
    [openIssue]
  );

  const handleAddTask = useCallback(
    (statusId?: string) => {
      const createPayload = {
        statusId: statusId ?? defaultCreateStatusId,
        ...(createAssigneeIds.length > 0
          ? { assigneeIds: createAssigneeIds }
          : {}),
      };
      startCreate(createPayload);
    },
    [createAssigneeIds, defaultCreateStatusId, startCreate]
  );

  // Inline editing callbacks for kanban cards
  const handleCardPriorityClick = useCallback(
    (issueId: string) => {
      openPrioritySelection(projectId, [issueId]);
    },
    [projectId, openPrioritySelection]
  );

  const handleCardAssigneeClick = useCallback(
    (issueId: string) => {
      openAssigneeSelection(projectId, [issueId]);
    },
    [projectId, openAssigneeSelection]
  );

  const handleCardMoreActionsClick = useCallback(
    (issueId: string) => {
      CommandBarDialog.show({
        page: 'issueActions',
        projectId,
        issueIds: [issueId],
      });
    },
    [projectId]
  );

  const handleCardTagToggle = useCallback(
    (issueId: string, tagId: string) => {
      const currentIssueTags = getTagsForIssue(issueId);
      const existing = currentIssueTags.find((it) => it.tag_id === tagId);
      if (existing) {
        removeIssueTag(existing.id);
      } else {
        insertIssueTag({ issue_id: issueId, tag_id: tagId });
      }
    },
    [getTagsForIssue, insertIssueTag, removeIssueTag]
  );

  const getResolvedRelationshipsForIssue = useCallback(
    (issueId: string) =>
      resolveRelationshipsForIssue(
        issueId,
        getRelationshipsForIssue(issueId),
        issuesById
      ),
    [getRelationshipsForIssue, issuesById]
  );

  const handleCreateTag = useCallback(
    (data: { name: string; color: string }): string => {
      const { data: newTag } = insertTag({
        project_id: projectId,
        name: data.name,
        color: data.color,
      });
      return newTag.id;
    },
    [insertTag, projectId]
  );

  const isLoading = projectLoading || orgLoading;

  if (isLoading) {
    return <LoadingState />;
  }

  return (
    <div className="flex flex-col h-full space-y-base">
      <div className="px-double pt-double space-y-base">
        <div className="flex items-center gap-half">
          <h2 className="text-2xl font-medium">{projectName}</h2>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="p-half rounded-sm text-low hover:text-normal hover:bg-secondary transition-colors"
                aria-label="Project menu"
              >
                <DotsThreeIcon className="size-icon-sm" weight="bold" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={openProjectsGuide}>
                {t('kanban.openProjectsGuide', 'Projects guide')}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => executeAction(Actions.ProjectSettings)}
              >
                {t('kanban.editProjectSettings', 'Edit project settings')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex flex-wrap items-start gap-base">
          <ViewNavTabs
            activeView={kanbanViewMode}
            onViewChange={setKanbanViewMode}
            hiddenStatuses={hiddenStatuses}
            selectedStatusId={listViewStatusFilter}
            onStatusSelect={setListViewStatusFilter}
          />
          <KanbanFilterBar
            isFiltersDialogOpen={isFiltersDialogOpen}
            onFiltersDialogOpenChange={setIsFiltersDialogOpen}
            tags={tags}
            users={membersWithProfiles}
            activeViewId={activeViewId}
            onViewChange={handleKanbanProjectViewChange}
            viewIds={KANBAN_PROJECT_VIEW_IDS}
            projectId={projectId}
            currentUserId={userId}
            filters={kanbanFilters}
            showSubIssues={showSubIssues}
            showWorkspaces={showWorkspaces}
            hasActiveFilters={hasActiveFilters}
            onSearchQueryChange={setKanbanSearchQuery}
            onPrioritiesChange={setKanbanPriorities}
            onAssigneesChange={setKanbanAssignees}
            onTagsChange={setKanbanTags}
            onSortChange={setKanbanSort}
            onShowSubIssuesChange={setShowSubIssues}
            onShowWorkspacesChange={setShowWorkspaces}
            onClearFilters={clearKanbanFilters}
            onCreateIssue={handleAddTask}
            shouldAnimateCreateButton={shouldAnimateCreateButton}
            renderFiltersDialog={(props) => <KanbanFiltersDialog {...props} />}
          />
        </div>
      </div>

      {kanbanViewMode === 'kanban' ? (
        visibleStatuses.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-low">{t('kanban.noVisibleStatuses')}</p>
          </div>
        ) : (
          <div className="flex-1 overflow-x-auto px-double">
            <KanbanProvider onDragEnd={handleDragEnd}>
              {visibleStatuses.map((status) => {
                const issueIds = items[status.id] ?? [];

                return (
                  <KanbanBoard key={status.id}>
                    <KanbanHeader>
                      <div className="border-t sticky border-b top-0 z-20 flex shrink-0 items-center justify-between gap-2 p-base bg-secondary">
                        <div className="flex items-center gap-2">
                          <div
                            className="h-2 w-2 rounded-full shrink-0"
                            style={{ backgroundColor: `hsl(${status.color})` }}
                          />
                          <p className="m-0 text-sm">{status.name}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleAddTask(status.id)}
                          className="p-half rounded-sm text-low hover:text-normal hover:bg-secondary transition-colors"
                          aria-label="Add task"
                        >
                          <PlusIcon className="size-icon-xs" weight="bold" />
                        </button>
                      </div>
                    </KanbanHeader>
                    <KanbanCards id={status.id}>
                      {issueIds.map((issueId, index) => {
                        const issue = issueMap[issueId];
                        if (!issue) return null;
                        const issueWorkspaces =
                          workspacesByIssueId.get(issue.id) ?? [];
                        const workspaceIdsShownOnCard = new Set(
                          issueWorkspaces.map((workspace) => workspace.id)
                        );
                        const issueCardPullRequests = getPullRequestsForIssue(
                          issue.id
                        ).filter((pr) => {
                          if (!pr.workspace_id) {
                            return true;
                          }

                          // If this PR is already visible under a workspace card,
                          // do not render it again at the issue level.
                          return !workspaceIdsShownOnCard.has(pr.workspace_id);
                        });

                        return (
                          <KanbanCard
                            key={issue.id}
                            id={issue.id}
                            name={issue.title}
                            index={index}
                            className="group"
                            onClick={() => handleCardClick(issue.id)}
                            isOpen={selectedKanbanIssueId === issue.id}
                          >
                            <KanbanCardContent
                              displayId={issue.simple_id}
                              title={issue.title}
                              description={issue.description}
                              priority={issue.priority}
                              tags={getTagObjectsForIssue(issue.id)}
                              assignees={issueAssigneesMap[issue.id] ?? []}
                              pullRequests={issueCardPullRequests}
                              relationships={resolveRelationshipsForIssue(
                                issue.id,
                                getRelationshipsForIssue(issue.id),
                                issuesById
                              )}
                              isSubIssue={!!issue.parent_issue_id}
                              onPriorityClick={(e) => {
                                e.stopPropagation();
                                handleCardPriorityClick(issue.id);
                              }}
                              onAssigneeClick={(e) => {
                                e.stopPropagation();
                                handleCardAssigneeClick(issue.id);
                              }}
                              onMoreActionsClick={() =>
                                handleCardMoreActionsClick(issue.id)
                              }
                              tagEditProps={{
                                allTags: tags,
                                selectedTagIds: getTagsForIssue(issue.id).map(
                                  (it) => it.tag_id
                                ),
                                onTagToggle: (tagId) =>
                                  handleCardTagToggle(issue.id, tagId),
                                onCreateTag: handleCreateTag,
                                renderTagEditor: ({
                                  allTags,
                                  selectedTagIds,
                                  onTagToggle,
                                  onCreateTag,
                                  trigger,
                                }) => (
                                  <SearchableTagDropdownContainer
                                    tags={allTags}
                                    selectedTagIds={selectedTagIds}
                                    onTagToggle={onTagToggle}
                                    onCreateTag={onCreateTag}
                                    disabled={false}
                                    contentClassName=""
                                    trigger={trigger}
                                  />
                                ),
                              }}
                            />
                            {issueWorkspaces.length > 0 && (
                              <div className="mt-base flex flex-col gap-half">
                                {issueWorkspaces.map((workspace) => (
                                  <IssueWorkspaceCard
                                    key={workspace.id}
                                    workspace={workspace}
                                    onClick={
                                      workspace.localWorkspaceId
                                        ? () =>
                                            openIssueWorkspace(
                                              issue.id,
                                              workspace.localWorkspaceId!
                                            )
                                        : undefined
                                    }
                                    showOwner={false}
                                    showStatusBadge={false}
                                    showNoPrText={false}
                                  />
                                ))}
                              </div>
                            )}
                          </KanbanCard>
                        );
                      })}
                    </KanbanCards>
                  </KanbanBoard>
                );
              })}
            </KanbanProvider>
          </div>
        )
      ) : (
        <div className="flex-1 overflow-y-auto px-double">
          <KanbanProvider onDragEnd={handleDragEnd} className="!block !w-full">
            <IssueListView
              statuses={listViewStatuses}
              items={items}
              issueMap={issueMap}
              issueAssigneesMap={issueAssigneesMap}
              getTagObjectsForIssue={getTagObjectsForIssue}
              getResolvedRelationshipsForIssue={
                getResolvedRelationshipsForIssue
              }
              onIssueClick={handleCardClick}
              selectedIssueId={selectedKanbanIssueId}
            />
          </KanbanProvider>
        </div>
      )}
    </div>
  );
}
