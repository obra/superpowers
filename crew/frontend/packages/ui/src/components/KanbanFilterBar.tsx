import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { FunnelIcon, PlusIcon, XIcon } from '@phosphor-icons/react';
import { cn } from '../lib/cn';
import type { PriorityLevel } from './PriorityIcon';
import { InputField } from './InputField';
import { PrimaryButton } from './PrimaryButton';
import { ButtonGroup, ButtonGroupItem } from './IconButtonGroup';

export interface KanbanFilterTag {
  id: string;
  name: string;
  color: string;
}

export interface KanbanFilterUser {
  user_id: string;
  first_name?: string | null;
  last_name?: string | null;
  username?: string | null;
  avatar_url?: string | null;
}

export interface KanbanFilterState<TSortField extends string = string> {
  searchQuery: string;
  priorities: PriorityLevel[];
  assigneeIds: string[];
  tagIds: string[];
  sortField: TSortField;
  sortDirection: 'asc' | 'desc';
}

export interface KanbanProjectViewIds {
  TEAM: string;
  PERSONAL: string;
}

const DEFAULT_KANBAN_PROJECT_VIEW_IDS: KanbanProjectViewIds = {
  TEAM: 'team',
  PERSONAL: 'personal',
};

export interface RenderKanbanFiltersDialogProps<
  TTag extends KanbanFilterTag = KanbanFilterTag,
  TUser extends KanbanFilterUser = KanbanFilterUser,
  TSortField extends string = string,
> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tags: TTag[];
  users: TUser[];
  projectId: string;
  currentUserId: string | null;
  filters: KanbanFilterState<TSortField>;
  showSubIssues: boolean;
  showWorkspaces: boolean;
  onPrioritiesChange: (priorities: PriorityLevel[]) => void;
  onAssigneesChange: (assigneeIds: string[]) => void;
  onTagsChange: (tagIds: string[]) => void;
  onSortChange: (sortField: TSortField, sortDirection: 'asc' | 'desc') => void;
  onShowSubIssuesChange: (show: boolean) => void;
  onShowWorkspacesChange: (show: boolean) => void;
}

interface KanbanFilterBarProps<
  TTag extends KanbanFilterTag = KanbanFilterTag,
  TUser extends KanbanFilterUser = KanbanFilterUser,
  TSortField extends string = string,
> {
  isFiltersDialogOpen: boolean;
  onFiltersDialogOpenChange: (open: boolean) => void;
  tags: TTag[];
  users: TUser[];
  activeViewId: string;
  onViewChange: (viewId: string) => void;
  viewIds?: KanbanProjectViewIds;
  projectId: string;
  currentUserId: string | null;
  filters: KanbanFilterState<TSortField>;
  showSubIssues: boolean;
  showWorkspaces: boolean;
  hasActiveFilters: boolean;
  onSearchQueryChange: (searchQuery: string) => void;
  onPrioritiesChange: (priorities: PriorityLevel[]) => void;
  onAssigneesChange: (assigneeIds: string[]) => void;
  onTagsChange: (tagIds: string[]) => void;
  onSortChange: (sortField: TSortField, sortDirection: 'asc' | 'desc') => void;
  onShowSubIssuesChange: (show: boolean) => void;
  onShowWorkspacesChange: (show: boolean) => void;
  onClearFilters: () => void;
  onCreateIssue: () => void;
  shouldAnimateCreateButton: boolean;
  renderFiltersDialog?: (
    props: RenderKanbanFiltersDialogProps<TTag, TUser, TSortField>
  ) => ReactNode;
}

export function KanbanFilterBar<
  TTag extends KanbanFilterTag = KanbanFilterTag,
  TUser extends KanbanFilterUser = KanbanFilterUser,
  TSortField extends string = string,
>({
  isFiltersDialogOpen,
  onFiltersDialogOpenChange,
  tags,
  users,
  activeViewId,
  onViewChange,
  viewIds = DEFAULT_KANBAN_PROJECT_VIEW_IDS,
  projectId,
  currentUserId,
  filters,
  showSubIssues,
  showWorkspaces,
  hasActiveFilters,
  onSearchQueryChange,
  onPrioritiesChange,
  onAssigneesChange,
  onTagsChange,
  onSortChange,
  onShowSubIssuesChange,
  onShowWorkspacesChange,
  onClearFilters,
  onCreateIssue,
  shouldAnimateCreateButton,
  renderFiltersDialog,
}: KanbanFilterBarProps<TTag, TUser, TSortField>) {
  const { t } = useTranslation('common');

  const handleClearSearch = () => {
    onSearchQueryChange('');
  };

  return (
    <>
      <div className="flex min-w-0 flex-wrap items-center gap-base">
        <ButtonGroup className="flex-wrap">
          <ButtonGroupItem
            active={activeViewId === viewIds.TEAM}
            onClick={() => onViewChange(viewIds.TEAM)}
          >
            {t('kanban.team', 'Team')}
          </ButtonGroupItem>
          <ButtonGroupItem
            active={activeViewId === viewIds.PERSONAL}
            onClick={() => onViewChange(viewIds.PERSONAL)}
          >
            {t('kanban.personal', 'Personal')}
          </ButtonGroupItem>
        </ButtonGroup>

        <InputField
          value={filters.searchQuery}
          onChange={onSearchQueryChange}
          placeholder={t('kanban.searchPlaceholder', 'Search issues...')}
          variant="search"
          actionIcon={filters.searchQuery ? XIcon : undefined}
          onAction={handleClearSearch}
          className="min-w-[160px] w-[220px] max-w-full"
        />

        <button
          type="button"
          onClick={() => onFiltersDialogOpenChange(true)}
          className={cn(
            'flex items-center justify-center p-half rounded-sm transition-colors',
            hasActiveFilters
              ? 'text-brand hover:text-brand'
              : 'text-low hover:text-normal hover:bg-secondary'
          )}
          aria-label={t('kanban.filters', 'Open filters')}
          title={t('kanban.filters', 'Open filters')}
        >
          <FunnelIcon className="size-icon-sm" weight="bold" />
        </button>

        {hasActiveFilters && (
          <PrimaryButton
            variant="tertiary"
            value={t('kanban.clearFilters', 'Clear filters')}
            actionIcon={XIcon}
            onClick={onClearFilters}
          />
        )}

        <PrimaryButton
          variant="secondary"
          value={t('kanban.newIssue', 'New issue')}
          actionIcon={PlusIcon}
          onClick={() => onCreateIssue()}
          className={cn(shouldAnimateCreateButton && 'create-issue-attention')}
        />
      </div>

      {renderFiltersDialog?.({
        open: isFiltersDialogOpen,
        onOpenChange: onFiltersDialogOpenChange,
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
      })}
    </>
  );
}
