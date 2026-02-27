import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  SortAscendingIcon,
  SortDescendingIcon,
  TagIcon,
  UsersIcon,
} from '@phosphor-icons/react';
import type { IssuePriority, Tag } from 'shared/remote-types';
import type { OrganizationMemberWithProfile } from 'shared/types';
import { cn } from '@/shared/lib/utils';
import {
  KANBAN_ASSIGNEE_FILTER_VALUES,
  type KanbanFilterState,
  type KanbanSortField,
} from '@/shared/stores/useUiPreferencesStore';
import { UserAvatar } from '@vibe/ui/components/UserAvatar';
import { KanbanAssignee } from '@vibe/ui/components/KanbanAssignee';
import { Badge } from '@vibe/ui/components/Badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@vibe/ui/components/Dialog';
import { Switch } from '@vibe/ui/components/Switch';
import { AssigneeSelectionDialog } from '@/shared/dialogs/kanban/AssigneeSelectionDialog';
import { PriorityFilterDropdown } from '@vibe/ui/components/PriorityFilterDropdown';
import {
  MultiSelectDropdown,
  type MultiSelectDropdownOption,
} from '@vibe/ui/components/MultiSelectDropdown';
import {
  PropertyDropdown,
  type PropertyDropdownOption,
} from '@vibe/ui/components/PropertyDropdown';

const SORT_OPTIONS: PropertyDropdownOption<KanbanSortField>[] = [
  { value: 'sort_order', label: 'Manual' },
  { value: 'priority', label: 'Priority' },
  { value: 'created_at', label: 'Created' },
  { value: 'updated_at', label: 'Updated' },
  { value: 'title', label: 'Title' },
];

interface KanbanFiltersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  currentUserId: string | null;
  tags: Tag[];
  users: OrganizationMemberWithProfile[];
  filters: KanbanFilterState;
  showSubIssues: boolean;
  showWorkspaces: boolean;
  onPrioritiesChange: (priorities: IssuePriority[]) => void;
  onAssigneesChange: (assigneeIds: string[]) => void;
  onTagsChange: (tagIds: string[]) => void;
  onSortChange: (
    sortField: KanbanSortField,
    sortDirection: 'asc' | 'desc'
  ) => void;
  onShowSubIssuesChange: (show: boolean) => void;
  onShowWorkspacesChange: (show: boolean) => void;
}

export function KanbanFiltersDialog({
  open,
  onOpenChange,
  projectId,
  currentUserId,
  tags,
  users,
  filters,
  showSubIssues,
  showWorkspaces,
  onPrioritiesChange,
  onAssigneesChange,
  onTagsChange,
  onSortChange,
  onShowSubIssuesChange,
  onShowWorkspacesChange,
}: KanbanFiltersDialogProps) {
  const { t } = useTranslation('common');

  const currentUser = useMemo(
    () => users.find((user) => user.user_id === currentUserId) ?? null,
    [users, currentUserId]
  );

  const assigneeDialogOptions = useMemo(
    () => [
      {
        value: KANBAN_ASSIGNEE_FILTER_VALUES.UNASSIGNED,
        label: t('kanban.unassigned', 'Unassigned'),
        renderOption: () => (
          <div className="flex items-center gap-base">
            <UsersIcon className="size-icon-xs text-low" weight="bold" />
            {t('kanban.unassigned', 'Unassigned')}
          </div>
        ),
      },
      {
        value: KANBAN_ASSIGNEE_FILTER_VALUES.SELF,
        label: t('kanban.self', 'Me'),
        renderOption: () => (
          <div className="flex items-center gap-base">
            {currentUser ? (
              <UserAvatar user={currentUser} className="h-4 w-4 text-[8px]" />
            ) : (
              <UsersIcon className="size-icon-xs text-low" weight="bold" />
            )}
            {t('kanban.self', 'Me')}
          </div>
        ),
      },
    ],
    [t, currentUser]
  );

  const tagOptions: MultiSelectDropdownOption<string>[] = useMemo(
    () =>
      tags.map((tag) => ({
        value: tag.id,
        label: tag.name,
        renderOption: () => (
          <div className="flex items-center gap-base">
            <span
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ backgroundColor: tag.color }}
            />
            {tag.name}
          </div>
        ),
      })),
    [tags]
  );

  const usersById = useMemo(() => {
    const map = new Map<string, OrganizationMemberWithProfile>();
    for (const user of users) {
      map.set(user.user_id, user);
    }
    return map;
  }, [users]);

  const renderAssigneeBadge = useMemo(
    () => (selectedIds: string[]) => {
      const resolved = selectedIds
        .filter((id) => id !== KANBAN_ASSIGNEE_FILTER_VALUES.UNASSIGNED)
        .map((id) => {
          if (id === KANBAN_ASSIGNEE_FILTER_VALUES.SELF) {
            return currentUser;
          }

          return usersById.get(id);
        })
        .filter((member): member is OrganizationMemberWithProfile => !!member);

      if (resolved.length === 0) {
        return (
          <Badge
            variant="secondary"
            className="h-5 min-w-5 justify-center border-none bg-brand px-1.5 py-0 text-xs"
          >
            {selectedIds.length}
          </Badge>
        );
      }

      return <KanbanAssignee assignees={resolved} />;
    },
    [currentUser, usersById]
  );

  const handleOpenAssigneeDialog = useCallback(() => {
    void AssigneeSelectionDialog.show({
      projectId,
      issueIds: [],
      isCreateMode: true,
      createModeAssigneeIds: filters.assigneeIds,
      onCreateModeAssigneesChange: onAssigneesChange,
      additionalOptions: assigneeDialogOptions,
    });
  }, [
    assigneeDialogOptions,
    filters.assigneeIds,
    onAssigneesChange,
    projectId,
  ]);

  const toggleSortDirection = useCallback(() => {
    onSortChange(
      filters.sortField,
      filters.sortDirection === 'asc' ? 'desc' : 'asc'
    );
  }, [filters.sortDirection, filters.sortField, onSortChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[720px] p-0">
        <div className="border-b border-border px-double pb-base pt-double">
          <DialogHeader className="space-y-half">
            <DialogTitle>{t('kanban.filters', 'Filters')}</DialogTitle>
            <DialogDescription>
              {t(
                'kanban.filtersDescription',
                'Adjust filters and sorting for this board view.'
              )}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="max-h-[72vh] overflow-y-auto px-double py-double">
          <div className="flex flex-wrap items-center gap-base">
            <PriorityFilterDropdown
              values={filters.priorities}
              onChange={onPrioritiesChange}
            />

            <button
              type="button"
              onClick={handleOpenAssigneeDialog}
              className={cn(
                'flex items-center gap-half rounded-sm bg-panel px-base py-half',
                'text-sm text-normal transition-colors hover:bg-secondary'
              )}
            >
              <UsersIcon className="size-icon-xs" weight="bold" />
              <span>{t('kanban.assignee', 'Assignee')}</span>
              {filters.assigneeIds.length > 0 &&
                renderAssigneeBadge(filters.assigneeIds)}
            </button>

            {tags.length > 0 && (
              <MultiSelectDropdown
                values={filters.tagIds}
                options={tagOptions}
                onChange={onTagsChange}
                icon={TagIcon}
                label={t('kanban.tags', 'Tags')}
                menuLabel={t('kanban.filterByTag', 'Filter by tag')}
              />
            )}

            <PropertyDropdown
              value={filters.sortField}
              options={SORT_OPTIONS}
              onChange={(field) => onSortChange(field, filters.sortDirection)}
              icon={
                filters.sortDirection === 'asc'
                  ? SortAscendingIcon
                  : SortDescendingIcon
              }
              label={t('kanban.sortBy', 'Sort')}
            />

            <button
              type="button"
              onClick={toggleSortDirection}
              className={cn(
                'flex items-center justify-center rounded-sm p-half',
                'text-normal transition-colors hover:bg-secondary'
              )}
              title={
                filters.sortDirection === 'asc'
                  ? t('kanban.sortAscending', 'Ascending')
                  : t('kanban.sortDescending', 'Descending')
              }
            >
              {filters.sortDirection === 'asc' ? (
                <SortAscendingIcon className="size-icon-base" />
              ) : (
                <SortDescendingIcon className="size-icon-base" />
              )}
            </button>

            <div className="flex items-center gap-half rounded-sm bg-panel px-base py-half">
              <span className="whitespace-nowrap text-sm text-normal">
                {t('kanban.subIssuesFilterLabel', 'Sub-issues')}
              </span>
              <Switch
                checked={showSubIssues}
                onCheckedChange={onShowSubIssuesChange}
              />
            </div>

            <div className="flex items-center gap-half rounded-sm bg-panel px-base py-half">
              <span className="whitespace-nowrap text-sm text-normal">
                {t('kanban.workspacesFilterLabel', 'Workspaces')}
              </span>
              <Switch
                checked={showWorkspaces}
                onCheckedChange={onShowWorkspacesChange}
              />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
