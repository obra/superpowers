import type { ReactNode } from 'react';
import { useCallback, useMemo, useRef } from 'react';
import {
  PlusIcon,
  ArrowLeftIcon,
  ArchiveIcon,
  StackIcon,
} from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import { InputField } from './InputField';
import { WorkspaceSummary } from './WorkspaceSummary';
import {
  CollapsibleSectionHeader,
  type SectionAction,
} from './CollapsibleSectionHeader';

export type WorkspaceLayoutMode = 'flat' | 'accordion';

export interface WorkspacesSidebarWorkspace {
  id: string;
  name: string;
  filesChanged?: number;
  linesAdded?: number;
  linesRemoved?: number;
  isRunning?: boolean;
  isPinned?: boolean;
  hasPendingApproval?: boolean;
  hasRunningDevServer?: boolean;
  hasUnseenActivity?: boolean;
  latestProcessCompletedAt?: string;
  latestProcessStatus?: 'running' | 'completed' | 'failed' | 'killed';
  prStatus?: 'open' | 'merged' | 'closed' | 'unknown';
}

export interface WorkspacesSidebarPersistKeys {
  raisedHand: string;
  notRunning: string;
  running: string;
}

const DEFAULT_PERSIST_KEYS: WorkspacesSidebarPersistKeys = {
  raisedHand: 'workspaces-sidebar-raised-hand',
  notRunning: 'workspaces-sidebar-not-running',
  running: 'workspaces-sidebar-running',
};

export interface WorkspacesSidebarProps {
  workspaces: WorkspacesSidebarWorkspace[];
  totalWorkspacesCount: number;
  archivedWorkspaces?: WorkspacesSidebarWorkspace[];
  selectedWorkspaceId: string | null;
  onSelectWorkspace: (id: string) => void;
  onAddWorkspace?: () => void;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  /** Whether we're in create mode */
  isCreateMode?: boolean;
  /** Title extracted from draft message (only shown when isCreateMode and non-empty) */
  draftTitle?: string;
  /** Handler to navigate back to create mode */
  onSelectCreate?: () => void;
  /** Whether to show archived workspaces */
  showArchive?: boolean;
  /** Handler for toggling archive view */
  onShowArchiveChange?: (show: boolean) => void;
  /** Layout mode for active workspaces */
  layoutMode?: WorkspaceLayoutMode;
  /** Handler for toggling layout mode */
  onToggleLayoutMode?: () => void;
  /** Handler to load more workspaces on scroll */
  onLoadMore?: () => void;
  /** Whether there are more workspaces to load */
  hasMoreWorkspaces?: boolean;
  /** Controls rendered beside the search input */
  searchControls?: ReactNode;
  /** Callback for opening workspace actions */
  onOpenWorkspaceActions?: (workspaceId: string) => void;
  /** Persist keys for collapsible sections */
  persistKeys?: WorkspacesSidebarPersistKeys;
}

function WorkspaceList({
  workspaces,
  selectedWorkspaceId,
  onSelectWorkspace,
  onOpenWorkspaceActions,
}: {
  workspaces: WorkspacesSidebarWorkspace[];
  selectedWorkspaceId: string | null;
  onSelectWorkspace: (id: string) => void;
  onOpenWorkspaceActions: (workspaceId: string) => void;
}) {
  return (
    <>
      {workspaces.map((workspace) => (
        <WorkspaceSummary
          key={workspace.id}
          name={workspace.name}
          workspaceId={workspace.id}
          filesChanged={workspace.filesChanged}
          linesAdded={workspace.linesAdded}
          linesRemoved={workspace.linesRemoved}
          isActive={selectedWorkspaceId === workspace.id}
          isRunning={workspace.isRunning}
          isPinned={workspace.isPinned}
          hasPendingApproval={workspace.hasPendingApproval}
          hasRunningDevServer={workspace.hasRunningDevServer}
          hasUnseenActivity={workspace.hasUnseenActivity}
          latestProcessCompletedAt={workspace.latestProcessCompletedAt}
          latestProcessStatus={workspace.latestProcessStatus}
          prStatus={workspace.prStatus}
          onOpenWorkspaceActions={onOpenWorkspaceActions}
          onClick={() => onSelectWorkspace(workspace.id)}
        />
      ))}
    </>
  );
}

export function WorkspacesSidebar({
  workspaces,
  totalWorkspacesCount,
  archivedWorkspaces = [],
  selectedWorkspaceId,
  onSelectWorkspace,
  onAddWorkspace,
  searchQuery,
  onSearchChange,
  isCreateMode = false,
  draftTitle,
  onSelectCreate,
  showArchive = false,
  onShowArchiveChange,
  layoutMode = 'flat',
  onToggleLayoutMode,
  onLoadMore,
  hasMoreWorkspaces = false,
  searchControls,
  onOpenWorkspaceActions,
  persistKeys = DEFAULT_PERSIST_KEYS,
}: WorkspacesSidebarProps) {
  const { t } = useTranslation(['tasks', 'common']);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const handleOpenWorkspaceActions = useCallback(
    (workspaceId: string) => {
      onOpenWorkspaceActions?.(workspaceId);
    },
    [onOpenWorkspaceActions]
  );

  // Handle scroll to load more
  const handleScroll = () => {
    if (!hasMoreWorkspaces || !onLoadMore) return;

    const container = scrollContainerRef.current;
    if (!container) return;

    const { scrollTop, scrollHeight, clientHeight } = container;
    // Load more when scrolled within 100px of the bottom
    if (scrollHeight - scrollTop - clientHeight < 100) {
      onLoadMore();
    }
  };

  // Categorize workspaces for accordion layout
  const { raisedHandWorkspaces, idleWorkspaces, runningWorkspaces } =
    useMemo(() => {
      // Running workspaces should stay in the "Running" section even if unseen.
      const needsAttention = (ws: WorkspacesSidebarWorkspace) =>
        ws.hasPendingApproval || (ws.hasUnseenActivity && !ws.isRunning);

      return {
        raisedHandWorkspaces: workspaces.filter((ws) => needsAttention(ws)),
        idleWorkspaces: workspaces.filter(
          (ws) => !ws.isRunning && !needsAttention(ws)
        ),
        runningWorkspaces: workspaces.filter(
          (ws) => ws.isRunning && !needsAttention(ws)
        ),
      };
    }, [workspaces]);

  const headerActions: SectionAction[] = [
    {
      icon: StackIcon,
      onClick: () => onToggleLayoutMode?.(),
      isActive: layoutMode === 'accordion',
    },
    {
      icon: PlusIcon,
      onClick: () => onAddWorkspace?.(),
    },
  ];

  return (
    <div className="w-full h-full bg-secondary flex flex-col">
      {/* Header + Search */}
      <div className="flex flex-col gap-base">
        <CollapsibleSectionHeader
          title={t('common:workspaces.title')}
          collapsible={false}
          actions={headerActions}
          className="border-b"
        />
        <div className="px-base flex items-stretch gap-half">
          <div className="flex-1 min-w-0">
            <InputField
              variant="search"
              value={searchQuery}
              onChange={onSearchChange}
              placeholder={t('common:workspaces.searchPlaceholder')}
            />
          </div>
          {searchControls}
        </div>
      </div>

      {/* Scrollable workspace list */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto py-base"
      >
        {showArchive ? (
          /* Archived workspaces view */
          <div className="flex flex-col gap-base">
            <span className="text-sm font-medium text-low px-base">
              {t('common:workspaces.archived')}
            </span>
            {archivedWorkspaces.length === 0 ? (
              <span className="text-sm text-low opacity-60 px-base">
                {t('common:workspaces.noArchived')}
              </span>
            ) : (
              archivedWorkspaces.map((workspace) => (
                <WorkspaceSummary
                  summary
                  key={workspace.id}
                  name={workspace.name}
                  workspaceId={workspace.id}
                  filesChanged={workspace.filesChanged}
                  linesAdded={workspace.linesAdded}
                  linesRemoved={workspace.linesRemoved}
                  isActive={selectedWorkspaceId === workspace.id}
                  isRunning={workspace.isRunning}
                  isPinned={workspace.isPinned}
                  hasPendingApproval={workspace.hasPendingApproval}
                  hasRunningDevServer={workspace.hasRunningDevServer}
                  hasUnseenActivity={workspace.hasUnseenActivity}
                  latestProcessCompletedAt={workspace.latestProcessCompletedAt}
                  latestProcessStatus={workspace.latestProcessStatus}
                  prStatus={workspace.prStatus}
                  onOpenWorkspaceActions={handleOpenWorkspaceActions}
                  onClick={() => onSelectWorkspace(workspace.id)}
                />
              ))
            )}
          </div>
        ) : layoutMode === 'accordion' ? (
          /* Accordion layout view */
          <div className="flex flex-col gap-base">
            {/* Needs Attention section */}
            <CollapsibleSectionHeader
              title={t('common:workspaces.needsAttention')}
              persistKey={persistKeys.raisedHand}
              defaultExpanded={true}
            >
              <div className="flex flex-col gap-base py-half">
                {draftTitle && (
                  <WorkspaceSummary
                    name={draftTitle}
                    isActive={isCreateMode}
                    isDraft={true}
                    onClick={onSelectCreate}
                  />
                )}
                {raisedHandWorkspaces.length === 0 && !draftTitle ? (
                  <span className="text-sm text-low opacity-60 pl-base">
                    {t('common:workspaces.noWorkspaces')}
                  </span>
                ) : (
                  <WorkspaceList
                    workspaces={raisedHandWorkspaces}
                    selectedWorkspaceId={selectedWorkspaceId}
                    onSelectWorkspace={onSelectWorkspace}
                    onOpenWorkspaceActions={handleOpenWorkspaceActions}
                  />
                )}
              </div>
            </CollapsibleSectionHeader>

            {/* Idle section */}
            <CollapsibleSectionHeader
              title={t('common:workspaces.idle')}
              persistKey={persistKeys.notRunning}
              defaultExpanded={true}
            >
              <div className="flex flex-col gap-base py-half">
                {idleWorkspaces.length === 0 ? (
                  <span className="text-sm text-low opacity-60 pl-base">
                    {t('common:workspaces.noWorkspaces')}
                  </span>
                ) : (
                  <WorkspaceList
                    workspaces={idleWorkspaces}
                    selectedWorkspaceId={selectedWorkspaceId}
                    onSelectWorkspace={onSelectWorkspace}
                    onOpenWorkspaceActions={handleOpenWorkspaceActions}
                  />
                )}
              </div>
            </CollapsibleSectionHeader>

            {/* Running section */}
            <CollapsibleSectionHeader
              title={t('common:workspaces.running')}
              persistKey={persistKeys.running}
              defaultExpanded={true}
            >
              <div className="flex flex-col gap-base py-half">
                {runningWorkspaces.length === 0 ? (
                  <span className="text-sm text-low opacity-60 pl-base">
                    {t('common:workspaces.noWorkspaces')}
                  </span>
                ) : (
                  <WorkspaceList
                    workspaces={runningWorkspaces}
                    selectedWorkspaceId={selectedWorkspaceId}
                    onSelectWorkspace={onSelectWorkspace}
                    onOpenWorkspaceActions={handleOpenWorkspaceActions}
                  />
                )}
              </div>
            </CollapsibleSectionHeader>
          </div>
        ) : (
          /* Active workspaces flat view */
          <div className="flex flex-col gap-base">
            <div className="flex items-center justify-between px-base">
              <span className="text-sm font-medium text-low">
                {t('common:workspaces.active')}
              </span>
              <span className="text-xs text-low">{totalWorkspacesCount}</span>
            </div>
            {draftTitle && (
              <WorkspaceSummary
                name={draftTitle}
                isActive={isCreateMode}
                isDraft={true}
                onClick={onSelectCreate}
              />
            )}
            {workspaces.map((workspace) => (
              <WorkspaceSummary
                key={workspace.id}
                name={workspace.name}
                workspaceId={workspace.id}
                filesChanged={workspace.filesChanged}
                linesAdded={workspace.linesAdded}
                linesRemoved={workspace.linesRemoved}
                isActive={selectedWorkspaceId === workspace.id}
                isRunning={workspace.isRunning}
                isPinned={workspace.isPinned}
                hasPendingApproval={workspace.hasPendingApproval}
                hasRunningDevServer={workspace.hasRunningDevServer}
                hasUnseenActivity={workspace.hasUnseenActivity}
                latestProcessCompletedAt={workspace.latestProcessCompletedAt}
                latestProcessStatus={workspace.latestProcessStatus}
                prStatus={workspace.prStatus}
                onOpenWorkspaceActions={handleOpenWorkspaceActions}
                onClick={() => onSelectWorkspace(workspace.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Fixed footer toggle - only show if there are archived workspaces */}
      <div className="border-t border-primary p-base">
        <button
          onClick={() => onShowArchiveChange?.(!showArchive)}
          className="w-full flex items-center gap-base text-sm text-low hover:text-normal transition-colors duration-100"
        >
          {showArchive ? (
            <>
              <ArrowLeftIcon className="size-icon-xs" />
              <span>{t('common:workspaces.backToActive')}</span>
            </>
          ) : (
            <>
              <ArchiveIcon className="size-icon-xs" />
              <span>{t('common:workspaces.viewArchive')}</span>
              <span className="ml-auto text-xs bg-tertiary px-1.5 py-0.5 rounded">
                {archivedWorkspaces.length}
              </span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
