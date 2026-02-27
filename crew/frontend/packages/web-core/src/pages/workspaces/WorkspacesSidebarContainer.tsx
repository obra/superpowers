import { useState, useMemo, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useWorkspaceContext } from '@/shared/hooks/useWorkspaceContext';
import { useUserContext } from '@/shared/hooks/useUserContext';
import { useScratch } from '@/shared/hooks/useScratch';
import { useAllOrganizationProjects } from '@/shared/hooks/useAllOrganizationProjects';
import { useUserOrganizations } from '@/shared/hooks/useUserOrganizations';
import { ScratchType, type DraftWorkspaceData } from 'shared/types';
import type { Project } from 'shared/remote-types';
import { splitMessageToTitleDescription } from '@/shared/lib/string';
import { cn } from '@/shared/lib/utils';
import {
  PERSIST_KEYS,
  usePersistedExpanded,
  useUiPreferencesStore,
  type WorkspacePrFilter,
  type WorkspaceSortBy,
  type WorkspaceSortOrder,
} from '@/shared/stores/useUiPreferencesStore';
import type { Workspace } from '@/shared/hooks/useWorkspaces';
import { CommandBarDialog } from '@/shared/dialogs/command-bar/CommandBarDialog';
import {
  WorkspacesSidebar,
  type WorkspacesSidebarPersistKeys,
} from '@vibe/ui/components/WorkspacesSidebar';
import {
  MultiSelectDropdown,
  type MultiSelectDropdownOption,
} from '@vibe/ui/components/MultiSelectDropdown';
import { PropertyDropdown } from '@vibe/ui/components/PropertyDropdown';
import { PrimaryButton } from '@vibe/ui/components/PrimaryButton';
import { IconButton } from '@vibe/ui/components/IconButton';
import {
  ButtonGroup,
  ButtonGroupItem,
} from '@vibe/ui/components/IconButtonGroup';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@vibe/ui/components/Dialog';
import {
  FunnelIcon,
  FolderIcon,
  GitPullRequestIcon,
  SortAscendingIcon,
  SortDescendingIcon,
  XIcon,
} from '@phosphor-icons/react';

export type WorkspaceLayoutMode = 'flat' | 'accordion';

// Fixed UUID for the universal workspace draft (same as in useCreateModeState.ts)
const DRAFT_WORKSPACE_ID = '00000000-0000-0000-0000-000000000001';

const PAGE_SIZE = 50;
const NO_PROJECT_ID = '__no_project__';
const DEFAULT_WORKSPACE_SORT = {
  sortBy: 'updated_at' as WorkspaceSortBy,
  sortOrder: 'desc' as WorkspaceSortOrder,
};

const PR_FILTER_OPTIONS: WorkspacePrFilter[] = ['all', 'has_pr', 'no_pr'];

const SORT_BY_OPTIONS: WorkspaceSortBy[] = ['updated_at', 'created_at'];

interface WorkspacesSidebarContainerProps {
  onScrollToBottom: () => void;
}

interface WorkspacesSortDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sortBy: WorkspaceSortBy;
  sortOrder: WorkspaceSortOrder;
  onSortByChange: (sortBy: WorkspaceSortBy) => void;
  onSortOrderChange: (sortOrder: WorkspaceSortOrder) => void;
}

function WorkspacesSortDialog({
  open,
  onOpenChange,
  sortBy,
  sortOrder,
  onSortByChange,
  onSortOrderChange,
}: WorkspacesSortDialogProps) {
  const { t } = useTranslation('common');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0">
        <div className="border-b border-border px-double pb-base pt-double">
          <DialogHeader className="space-y-half">
            <DialogTitle>
              {t('kanban.workspaceSidebar.sortDialogTitle')}
            </DialogTitle>
            <DialogDescription>
              {t('kanban.workspaceSidebar.sortDialogDescription')}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="px-double py-double">
          <div className="flex flex-col gap-base">
            <div className="flex items-center justify-between gap-base">
              <span className="text-sm text-low">
                {t('kanban.workspaceSidebar.sortByLabel')}
              </span>
              <PropertyDropdown
                value={sortBy}
                options={SORT_BY_OPTIONS.map((option) => ({
                  value: option,
                  label:
                    option === 'updated_at'
                      ? t('kanban.workspaceSidebar.sortUpdatedAt')
                      : t('kanban.workspaceSidebar.sortCreatedAt'),
                }))}
                onChange={onSortByChange}
              />
            </div>
            <div className="flex items-center justify-between gap-base">
              <span className="text-sm text-low">
                {t('kanban.workspaceSidebar.sortOrderLabel')}
              </span>
              <ButtonGroup>
                <ButtonGroupItem
                  active={sortOrder === 'desc'}
                  onClick={() => onSortOrderChange('desc')}
                >
                  {t('kanban.sortDescending')}
                </ButtonGroupItem>
                <ButtonGroupItem
                  active={sortOrder === 'asc'}
                  onClick={() => onSortOrderChange('asc')}
                >
                  {t('kanban.sortAscending')}
                </ButtonGroupItem>
              </ButtonGroup>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface WorkspacesFilterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectOptions: MultiSelectDropdownOption<string>[];
  projectIds: string[];
  prFilter: WorkspacePrFilter;
  hasActiveFilters: boolean;
  onProjectFilterChange: (projectIds: string[]) => void;
  onPrFilterChange: (prFilter: WorkspacePrFilter) => void;
  onClearFilters: () => void;
}

function WorkspacesFilterDialog({
  open,
  onOpenChange,
  projectOptions,
  projectIds,
  prFilter,
  hasActiveFilters,
  onProjectFilterChange,
  onPrFilterChange,
  onClearFilters,
}: WorkspacesFilterDialogProps) {
  const { t } = useTranslation('common');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0">
        <div className="border-b border-border px-double pb-base pt-double">
          <DialogHeader className="space-y-half">
            <DialogTitle>
              {t('kanban.workspaceSidebar.filterDialogTitle')}
            </DialogTitle>
            <DialogDescription>
              {t('kanban.workspaceSidebar.filterDialogDescription')}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="px-double py-double">
          <div className="flex flex-col items-start gap-base">
            <MultiSelectDropdown
              values={projectIds}
              options={projectOptions}
              onChange={onProjectFilterChange}
              icon={FolderIcon}
              label={t('kanban.workspaceSidebar.projectFilterLabel')}
            />
            <PropertyDropdown
              value={prFilter}
              options={PR_FILTER_OPTIONS.map((option) => ({
                value: option,
                label:
                  option === 'all'
                    ? t('kanban.workspaceSidebar.prFilterAll')
                    : option === 'has_pr'
                      ? t('kanban.workspaceSidebar.prFilterHasPr')
                      : t('kanban.workspaceSidebar.prFilterNoPr'),
              }))}
              onChange={onPrFilterChange}
              icon={GitPullRequestIcon}
              label={t('kanban.workspaceSidebar.prFilterLabel')}
            />
            {hasActiveFilters && (
              <div className="self-end">
                <PrimaryButton
                  variant="tertiary"
                  value={t('kanban.clearFilters')}
                  actionIcon={XIcon}
                  onClick={onClearFilters}
                />
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function toTimestamp(value: string | undefined): number | null {
  if (!value) {
    return null;
  }

  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? null : timestamp;
}

function getWorkspaceSortTimestamp(
  workspace: Workspace,
  sortBy: WorkspaceSortBy
): number | null {
  if (sortBy === 'updated_at') {
    return toTimestamp(workspace.latestProcessCompletedAt);
  }

  return toTimestamp(workspace.createdAt);
}

export function WorkspacesSidebarContainer({
  onScrollToBottom,
}: WorkspacesSidebarContainerProps) {
  const {
    workspaceId: selectedWorkspaceId,
    activeWorkspaces,
    archivedWorkspaces,
    isCreateMode,
    selectWorkspace,
    navigateToCreate,
  } = useWorkspaceContext();

  const [searchQuery, setSearchQuery] = useState('');
  const [showArchive, setShowArchive] = usePersistedExpanded(
    PERSIST_KEYS.workspacesSidebarArchived,
    false
  );
  const [isAccordionLayout, setAccordionLayout] = usePersistedExpanded(
    PERSIST_KEYS.workspacesSidebarAccordionLayout,
    true
  );
  const [isSortDialogOpen, setIsSortDialogOpen] = useState(false);
  const [isFilterDialogOpen, setIsFilterDialogOpen] = useState(false);
  const { t } = useTranslation('common');
  const sortDialogTitle = t('kanban.workspaceSidebar.sortButtonTitle');
  const filterDialogTitle = t('kanban.workspaceSidebar.filterButtonTitle');

  const layoutMode: WorkspaceLayoutMode = isAccordionLayout
    ? 'accordion'
    : 'flat';
  const toggleLayoutMode = () => setAccordionLayout(!isAccordionLayout);

  // Workspace sidebar filters + sort
  const workspaceFilters = useUiPreferencesStore((s) => s.workspaceFilters);
  const setWorkspaceProjectFilter = useUiPreferencesStore(
    (s) => s.setWorkspaceProjectFilter
  );
  const setWorkspacePrFilter = useUiPreferencesStore(
    (s) => s.setWorkspacePrFilter
  );
  const clearWorkspaceFilters = useUiPreferencesStore(
    (s) => s.clearWorkspaceFilters
  );
  const workspaceSort = useUiPreferencesStore((s) => s.workspaceSort);
  const setWorkspaceSortBy = useUiPreferencesStore((s) => s.setWorkspaceSortBy);
  const setWorkspaceSortOrder = useUiPreferencesStore(
    (s) => s.setWorkspaceSortOrder
  );

  // Remote data for project filter (all orgs)
  const { workspaces: remoteWorkspaces } = useUserContext();
  const { data: allRemoteProjects } = useAllOrganizationProjects();
  const { data: orgsData } = useUserOrganizations();
  const organizations = useMemo(
    () => orgsData?.organizations ?? [],
    [orgsData?.organizations]
  );

  // Map local workspace ID → remote project ID
  const remoteProjectByLocalId = useMemo(() => {
    const map = new Map<string, string>();
    for (const rw of remoteWorkspaces) {
      if (rw.local_workspace_id) {
        map.set(rw.local_workspace_id, rw.project_id);
      }
    }
    return map;
  }, [remoteWorkspaces]);

  // Build org name lookup
  const orgNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const org of organizations) {
      map.set(org.id, org.name);
    }
    return map;
  }, [organizations]);

  // Group projects by org, only including projects with linked workspaces
  const projectGroups = useMemo(() => {
    const linkedProjectIds = new Set(remoteProjectByLocalId.values());
    const relevant = allRemoteProjects.filter((p) =>
      linkedProjectIds.has(p.id)
    );

    const groupMap = new Map<string, Project[]>();
    for (const project of relevant) {
      const arr = groupMap.get(project.organization_id) ?? [];
      arr.push(project);
      groupMap.set(project.organization_id, arr);
    }

    return Array.from(groupMap.entries())
      .map(([orgId, projects]) => ({
        orgId,
        orgName: orgNameById.get(orgId) ?? 'Unknown',
        projects: projects.sort((a, b) => a.name.localeCompare(b.name)),
      }))
      .sort((a, b) => a.orgName.localeCompare(b.orgName));
  }, [allRemoteProjects, remoteProjectByLocalId, orgNameById]);

  // Build flat project options for MultiSelectDropdown
  const projectOptions = useMemo<MultiSelectDropdownOption<string>[]>(
    () => [
      {
        value: NO_PROJECT_ID,
        label: t('kanban.workspaceSidebar.noProject'),
      },
      ...projectGroups.flatMap((g) =>
        g.projects.map((p) => ({
          value: p.id,
          label: p.name,
          renderOption: () => (
            <div className="flex items-center gap-base">
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: `hsl(${p.color})` }}
              />
              {p.name}
            </div>
          ),
        }))
      ),
    ],
    [projectGroups, t]
  );

  const hasActiveFilters =
    workspaceFilters.projectIds.length > 0 ||
    workspaceFilters.prFilter !== 'all';
  const hasNonDefaultSort =
    workspaceSort.sortBy !== DEFAULT_WORKSPACE_SORT.sortBy ||
    workspaceSort.sortOrder !== DEFAULT_WORKSPACE_SORT.sortOrder;

  // Pagination state for infinite scroll
  const [displayLimit, setDisplayLimit] = useState(PAGE_SIZE);

  // Reset display limit when search, filter, or sort state changes
  useEffect(() => {
    setDisplayLimit(PAGE_SIZE);
  }, [searchQuery, showArchive, workspaceFilters, workspaceSort]);

  const searchLower = searchQuery.toLowerCase();
  const isSearching = searchQuery.length > 0;

  // Apply sidebar filters (project + PR), then search
  const filteredActiveWorkspaces = useMemo(() => {
    let result = activeWorkspaces;

    // Project filter
    if (workspaceFilters.projectIds.length > 0) {
      const includeNoProject =
        workspaceFilters.projectIds.includes(NO_PROJECT_ID);
      const realProjectIds = workspaceFilters.projectIds.filter(
        (id) => id !== NO_PROJECT_ID
      );
      result = result.filter((ws) => {
        const projectId = remoteProjectByLocalId.get(ws.id);
        if (!projectId) return includeNoProject;
        return realProjectIds.includes(projectId);
      });
    }

    // PR filter
    if (workspaceFilters.prFilter === 'has_pr') {
      result = result.filter((ws) => !!ws.prStatus);
    } else if (workspaceFilters.prFilter === 'no_pr') {
      result = result.filter((ws) => !ws.prStatus);
    }

    // Search filter
    if (searchLower) {
      result = result.filter(
        (ws) =>
          ws.name.toLowerCase().includes(searchLower) ||
          ws.branch.toLowerCase().includes(searchLower)
      );
    }

    return result;
  }, [activeWorkspaces, workspaceFilters, remoteProjectByLocalId, searchLower]);

  const filteredArchivedWorkspaces = useMemo(() => {
    let result = archivedWorkspaces;

    if (workspaceFilters.projectIds.length > 0) {
      const includeNoProject =
        workspaceFilters.projectIds.includes(NO_PROJECT_ID);
      const realProjectIds = workspaceFilters.projectIds.filter(
        (id) => id !== NO_PROJECT_ID
      );
      result = result.filter((ws) => {
        const projectId = remoteProjectByLocalId.get(ws.id);
        if (!projectId) return includeNoProject;
        return realProjectIds.includes(projectId);
      });
    }

    if (workspaceFilters.prFilter === 'has_pr') {
      result = result.filter((ws) => !!ws.prStatus);
    } else if (workspaceFilters.prFilter === 'no_pr') {
      result = result.filter((ws) => !ws.prStatus);
    }

    if (searchLower) {
      result = result.filter(
        (ws) =>
          ws.name.toLowerCase().includes(searchLower) ||
          ws.branch.toLowerCase().includes(searchLower)
      );
    }

    return result;
  }, [
    archivedWorkspaces,
    workspaceFilters,
    remoteProjectByLocalId,
    searchLower,
  ]);

  const sortWorkspaces = useCallback(
    (workspaces: Workspace[]) =>
      [...workspaces].sort((a, b) => {
        // Always keep pinned workspaces at the top.
        if (a.isPinned !== b.isPinned) {
          return a.isPinned ? -1 : 1;
        }

        const aTimestamp = getWorkspaceSortTimestamp(a, workspaceSort.sortBy);
        const bTimestamp = getWorkspaceSortTimestamp(b, workspaceSort.sortBy);

        // Workspaces without the selected timestamp are always sorted first.
        if (aTimestamp === null && bTimestamp === null) {
          return a.name.localeCompare(b.name);
        }
        if (aTimestamp === null) {
          return -1;
        }
        if (bTimestamp === null) {
          return 1;
        }

        if (aTimestamp === bTimestamp) {
          return a.name.localeCompare(b.name);
        }

        return workspaceSort.sortOrder === 'asc'
          ? aTimestamp - bTimestamp
          : bTimestamp - aTimestamp;
      }),
    [workspaceSort.sortBy, workspaceSort.sortOrder]
  );

  const sortedActiveWorkspaces = useMemo(
    () => sortWorkspaces(filteredActiveWorkspaces),
    [filteredActiveWorkspaces, sortWorkspaces]
  );

  const sortedArchivedWorkspaces = useMemo(
    () => sortWorkspaces(filteredArchivedWorkspaces),
    [filteredArchivedWorkspaces, sortWorkspaces]
  );

  // Apply pagination (only when not searching)
  const paginatedActiveWorkspaces = useMemo(
    () =>
      isSearching
        ? sortedActiveWorkspaces
        : sortedActiveWorkspaces.slice(0, displayLimit),
    [sortedActiveWorkspaces, displayLimit, isSearching]
  );

  const paginatedArchivedWorkspaces = useMemo(
    () =>
      isSearching
        ? sortedArchivedWorkspaces
        : sortedArchivedWorkspaces.slice(0, displayLimit),
    [sortedArchivedWorkspaces, displayLimit, isSearching]
  );

  // Check if there are more workspaces to load
  const hasMoreWorkspaces = showArchive
    ? sortedArchivedWorkspaces.length > displayLimit
    : sortedActiveWorkspaces.length > displayLimit;

  // Handle scroll to load more
  const handleLoadMore = useCallback(() => {
    if (!isSearching && hasMoreWorkspaces) {
      setDisplayLimit((prev) => prev + PAGE_SIZE);
    }
  }, [isSearching, hasMoreWorkspaces]);

  // Read persisted draft for sidebar placeholder
  const { scratch: draftScratch } = useScratch(
    ScratchType.DRAFT_WORKSPACE,
    DRAFT_WORKSPACE_ID
  );

  // Extract draft title from persisted scratch
  const persistedDraftTitle = useMemo(() => {
    const scratchData: DraftWorkspaceData | undefined =
      draftScratch?.payload?.type === 'DRAFT_WORKSPACE'
        ? draftScratch.payload.data
        : undefined;

    if (!scratchData?.message?.trim()) return undefined;
    const { title } = splitMessageToTitleDescription(
      scratchData.message.trim()
    );
    return title || 'New Workspace';
  }, [draftScratch]);

  // Handle workspace selection - scroll to bottom if re-selecting same workspace
  const handleSelectWorkspace = useCallback(
    (id: string) => {
      if (id === selectedWorkspaceId) {
        onScrollToBottom();
      } else {
        selectWorkspace(id);
      }
    },
    [selectedWorkspaceId, selectWorkspace, onScrollToBottom]
  );

  const handleOpenWorkspaceActions = useCallback((workspaceId: string) => {
    CommandBarDialog.show({
      page: 'workspaceActions',
      workspaceId,
    });
  }, []);

  const sidebarPersistKeys: WorkspacesSidebarPersistKeys = {
    raisedHand: PERSIST_KEYS.workspacesSidebarRaisedHand,
    notRunning: PERSIST_KEYS.workspacesSidebarNotRunning,
    running: PERSIST_KEYS.workspacesSidebarRunning,
  };

  const searchControls = (
    <>
      <div className="shrink-0">
        <div className="flex items-stretch">
          <IconButton
            icon={
              workspaceSort.sortOrder === 'asc'
                ? SortAscendingIcon
                : SortDescendingIcon
            }
            onClick={() => setIsSortDialogOpen(true)}
            aria-label={sortDialogTitle}
            title={sortDialogTitle}
            className={cn(
              '!h-cta !px-half !py-0',
              hasNonDefaultSort && 'text-brand hover:text-brand'
            )}
            iconClassName="size-icon-lg"
          />
          <IconButton
            icon={FunnelIcon}
            onClick={() => setIsFilterDialogOpen(true)}
            aria-label={filterDialogTitle}
            title={filterDialogTitle}
            className="!h-cta !px-half !py-0"
            iconClassName={cn('size-icon-lg', hasActiveFilters && 'text-brand')}
          />
        </div>
      </div>

      <WorkspacesSortDialog
        open={isSortDialogOpen}
        onOpenChange={setIsSortDialogOpen}
        sortBy={workspaceSort.sortBy}
        sortOrder={workspaceSort.sortOrder}
        onSortByChange={setWorkspaceSortBy}
        onSortOrderChange={setWorkspaceSortOrder}
      />

      <WorkspacesFilterDialog
        open={isFilterDialogOpen}
        onOpenChange={setIsFilterDialogOpen}
        projectOptions={projectOptions}
        projectIds={workspaceFilters.projectIds}
        prFilter={workspaceFilters.prFilter}
        hasActiveFilters={hasActiveFilters}
        onProjectFilterChange={setWorkspaceProjectFilter}
        onPrFilterChange={setWorkspacePrFilter}
        onClearFilters={clearWorkspaceFilters}
      />
    </>
  );

  return (
    <WorkspacesSidebar
      workspaces={paginatedActiveWorkspaces}
      totalWorkspacesCount={activeWorkspaces.length}
      archivedWorkspaces={paginatedArchivedWorkspaces}
      selectedWorkspaceId={selectedWorkspaceId ?? null}
      onSelectWorkspace={handleSelectWorkspace}
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      onAddWorkspace={navigateToCreate}
      isCreateMode={isCreateMode}
      draftTitle={persistedDraftTitle}
      onSelectCreate={navigateToCreate}
      showArchive={showArchive}
      onShowArchiveChange={setShowArchive}
      layoutMode={layoutMode}
      onToggleLayoutMode={toggleLayoutMode}
      onLoadMore={handleLoadMore}
      hasMoreWorkspaces={hasMoreWorkspaces && !isSearching}
      searchControls={searchControls}
      onOpenWorkspaceActions={handleOpenWorkspaceActions}
      persistKeys={sidebarPersistKeys}
    />
  );
}
