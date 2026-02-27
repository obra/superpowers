import {
  DragDropContext,
  Draggable,
  Droppable,
  type DropResult,
} from '@hello-pangea/dnd';
import type { ReactNode } from 'react';
import {
  LayoutIcon,
  PlusIcon,
  KanbanIcon,
  SpinnerIcon,
  StarIcon,
} from '@phosphor-icons/react';
import { cn } from '../lib/cn';
import { AppBarButton } from './AppBarButton';
import { AppBarSocialLink } from './AppBarSocialLink';
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverClose,
} from './Popover';
import { Tooltip } from './Tooltip';
import { useTranslation } from 'react-i18next';

function formatStarCount(count: number): string {
  if (count < 1000) return String(count);
  const k = count / 1000;
  return k >= 10 ? `${Math.floor(k)}k` : `${k.toFixed(1)}k`;
}

function getProjectInitials(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return '??';

  const words = trimmed.split(/\s+/);
  if (words.length >= 2) {
    return (words[0].charAt(0) + words[1].charAt(0)).toUpperCase();
  }
  return trimmed.slice(0, 2).toUpperCase();
}

interface AppBarProps {
  projects: AppBarProject[];
  hosts?: AppBarHost[];
  activeHostId?: string | null;
  onCreateProject: () => void;
  onWorkspacesClick: () => void;
  onHostClick?: (hostId: string, status: AppBarHostStatus) => void;
  showWorkspacesButton?: boolean;
  onProjectClick: (projectId: string) => void;
  onProjectsDragEnd: (result: DropResult) => void;
  isSavingProjectOrder?: boolean;
  isWorkspacesActive: boolean;
  activeProjectId: string | null;
  isSignedIn?: boolean;
  isLoadingProjects?: boolean;
  onSignIn?: () => void;
  onMigrate?: () => void;
  userPopover?: ReactNode;
  starCount?: number | null;
  onlineCount?: number | null;
  githubIconPath: string;
  discordIconPath: string;
}

export interface AppBarProject {
  id: string;
  name: string;
  color: string;
}

export type AppBarHostStatus = 'online' | 'offline' | 'unpaired';

export interface AppBarHost {
  id: string;
  name: string;
  status: AppBarHostStatus;
}

function getHostStatusLabel(status: AppBarHostStatus): string {
  if (status === 'online') return 'Online';
  if (status === 'offline') return 'Offline';
  return 'Unpaired';
}

function getHostStatusIndicatorClass(status: AppBarHostStatus): string {
  if (status === 'online') return 'bg-success';
  if (status === 'offline') return 'bg-low';
  return 'bg-white border-warning';
}

export function AppBar({
  projects,
  hosts = [],
  activeHostId = null,
  onCreateProject,
  onWorkspacesClick,
  onHostClick,
  showWorkspacesButton = true,
  onProjectClick,
  onProjectsDragEnd,
  isSavingProjectOrder,
  isWorkspacesActive,
  activeProjectId,
  isSignedIn,
  isLoadingProjects,
  onSignIn,
  onMigrate,
  userPopover,
  starCount,
  onlineCount,
  githubIconPath,
  discordIconPath,
}: AppBarProps) {
  const { t } = useTranslation('common');

  return (
    <div
      className={cn(
        'flex flex-col items-center h-full p-base gap-base',
        'bg-secondary border-r border-border'
      )}
    >
      {(showWorkspacesButton || hosts.length > 0) && (
        <div className="flex flex-col items-center gap-1">
          {showWorkspacesButton && (
            <AppBarButton
              icon={LayoutIcon}
              label="Workspaces"
              isActive={isWorkspacesActive}
              onClick={onWorkspacesClick}
            />
          )}
          {hosts.map((host) => {
            const isOffline = host.status === 'offline';
            const isActiveHost = host.id === activeHostId;
            return (
              <Tooltip
                key={host.id}
                content={`${host.name} · ${getHostStatusLabel(host.status)}`}
                side="right"
              >
                <div className="relative">
                  <span
                    className={cn(
                      'absolute -top-1 -right-1 z-10',
                      'w-3.5 h-3.5 rounded-full border border-secondary',
                      getHostStatusIndicatorClass(host.status)
                    )}
                    aria-hidden="true"
                  />
                  <button
                    type="button"
                    disabled={isOffline}
                    onClick={() => {
                      if (isOffline) {
                        return;
                      }
                      onHostClick?.(host.id, host.status);
                    }}
                    className={cn(
                      'relative flex items-center justify-center w-10 h-10 rounded-lg',
                      'text-sm font-medium transition-colors',
                      'focus:outline-none focus-visible:ring-2 focus-visible:ring-brand',
                      isOffline
                        ? 'bg-primary text-low opacity-50 cursor-not-allowed'
                        : 'bg-primary text-normal cursor-pointer',
                      isActiveHost && 'ring-2 ring-brand',
                      host.status === 'online' && 'hover:bg-brand/10',
                      host.status === 'unpaired' &&
                        'text-warning hover:bg-warning/10'
                    )}
                    aria-label={`${host.name} (${getHostStatusLabel(host.status)})`}
                  >
                    {getProjectInitials(host.name)}
                  </button>
                </div>
              </Tooltip>
            );
          })}
        </div>
      )}

      {hosts.length > 0 && (
        <div className="w-8 h-px bg-border" aria-hidden="true" />
      )}

      {/* Project management popover for unsigned users */}
      {!isSignedIn && (
        <Popover>
          <Tooltip content={t('appBar.kanban.tooltip')} side="right">
            <PopoverTrigger asChild>
              <button
                type="button"
                className={cn(
                  'flex items-center justify-center w-10 h-10 rounded-lg',
                  'transition-colors cursor-pointer',
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-brand',
                  'bg-primary text-normal hover:bg-brand/10'
                )}
                aria-label={t('appBar.kanban.tooltip')}
              >
                <KanbanIcon className="size-icon-base" weight="bold" />
              </button>
            </PopoverTrigger>
          </Tooltip>
          <PopoverContent side="right" sideOffset={8}>
            <p className="text-sm font-medium text-high">
              {t('appBar.kanban.title')}
            </p>
            <p className="text-xs text-low mt-1">
              {t('appBar.kanban.description')}
            </p>
            <div className="mt-base flex items-center gap-half">
              <PopoverClose asChild>
                <button
                  type="button"
                  onClick={onSignIn}
                  className={cn(
                    'px-base py-1 rounded-sm text-xs',
                    'bg-brand text-on-brand hover:bg-brand-hover cursor-pointer'
                  )}
                >
                  {t('signIn')}
                </button>
              </PopoverClose>
              <PopoverClose asChild>
                <button
                  type="button"
                  onClick={onMigrate}
                  className={cn(
                    'px-base py-1 rounded-sm text-xs',
                    'bg-secondary text-normal hover:bg-panel border border-border cursor-pointer'
                  )}
                >
                  {t('appBar.kanban.migrateOldProjects')}
                </button>
              </PopoverClose>
            </div>
          </PopoverContent>
        </Popover>
      )}

      {/* Loading spinner for projects */}
      {isLoadingProjects && (
        <div className="flex items-center justify-center w-10 h-10">
          <SpinnerIcon className="size-5 animate-spin text-muted" />
        </div>
      )}

      {/* Middle section: Project buttons */}
      <DragDropContext onDragEnd={onProjectsDragEnd}>
        <Droppable
          droppableId="app-bar-projects"
          direction="vertical"
          isDropDisabled={isSavingProjectOrder}
        >
          {(dropProvided) => (
            <div
              ref={dropProvided.innerRef}
              {...dropProvided.droppableProps}
              className="flex flex-col items-center -mb-base"
            >
              {projects.map((project, index) => (
                <Draggable
                  key={project.id}
                  draggableId={project.id}
                  index={index}
                  disableInteractiveElementBlocking
                  isDragDisabled={isSavingProjectOrder}
                >
                  {(dragProvided, snapshot) => (
                    <div
                      ref={dragProvided.innerRef}
                      {...dragProvided.draggableProps}
                      {...dragProvided.dragHandleProps}
                      className="mb-base"
                      style={dragProvided.draggableProps.style}
                    >
                      <Tooltip content={project.name} side="right">
                        <button
                          type="button"
                          onClick={() => onProjectClick(project.id)}
                          className={cn(
                            'flex items-center justify-center w-10 h-10 rounded-lg',
                            'text-sm font-medium transition-colors cursor-grab',
                            'focus:outline-none focus-visible:ring-2 focus-visible:ring-brand',
                            snapshot.isDragging && 'shadow-lg',
                            activeProjectId === project.id
                              ? ''
                              : 'bg-primary text-normal hover:opacity-80'
                          )}
                          style={
                            activeProjectId === project.id
                              ? {
                                  color: `hsl(${project.color})`,
                                  backgroundColor: `hsl(${project.color} / 0.2)`,
                                }
                              : undefined
                          }
                          aria-label={project.name}
                        >
                          {getProjectInitials(project.name)}
                        </button>
                      </Tooltip>
                    </div>
                  )}
                </Draggable>
              ))}
              {dropProvided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {/* Create project button */}
      {isSignedIn && (
        <Tooltip content="Create project" side="right">
          <button
            type="button"
            onClick={onCreateProject}
            className={cn(
              'flex items-center justify-center w-10 h-10 rounded-lg',
              'text-sm font-medium transition-colors cursor-pointer',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-brand',
              'bg-primary text-muted hover:text-normal hover:bg-tertiary'
            )}
            aria-label="Create project"
          >
            <PlusIcon size={20} />
          </button>
        </Tooltip>
      )}

      {/* Bottom section: User popover + GitHub + Discord */}
      <div className="mt-auto pt-base flex flex-col items-center gap-4">
        {userPopover}
        <AppBarSocialLink
          href="https://github.com/BloopAI/vibe-kanban"
          label="Star on GitHub"
          iconPath={githubIconPath}
          badge={
            starCount != null && (
              <>
                <StarIcon size={10} weight="fill" />
                {formatStarCount(starCount)}
              </>
            )
          }
        />
        <AppBarSocialLink
          href="https://discord.gg/AC4nwVtJM3"
          label="Join our Discord"
          iconPath={discordIconPath}
          badge={
            onlineCount != null && (onlineCount > 999 ? '999+' : onlineCount)
          }
        />
      </div>
    </div>
  );
}
