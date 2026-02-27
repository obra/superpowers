import {
  PushPinIcon,
  HandIcon,
  TriangleIcon,
  PlayIcon,
  FileIcon,
  CircleIcon,
  GitPullRequestIcon,
  DotsThreeIcon,
} from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import { cn } from '../lib/cn';
import { RunningDots } from './RunningDots';

const formatRelativeElapsed = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
};

export interface WorkspaceSummaryProps {
  name: string;
  workspaceId?: string;
  filesChanged?: number;
  linesAdded?: number;
  linesRemoved?: number;
  isActive?: boolean;
  isRunning?: boolean;
  isPinned?: boolean;
  hasPendingApproval?: boolean;
  hasRunningDevServer?: boolean;
  hasUnseenActivity?: boolean;
  latestProcessCompletedAt?: string;
  latestProcessStatus?: 'running' | 'completed' | 'failed' | 'killed';
  prStatus?: 'open' | 'merged' | 'closed' | 'unknown';
  onClick?: () => void;
  className?: string;
  summary?: boolean;
  /** Whether this is a draft workspace (shows "Draft" instead of elapsed time) */
  isDraft?: boolean;
  onOpenWorkspaceActions?: (workspaceId: string) => void;
}

export function WorkspaceSummary({
  name,
  workspaceId,
  filesChanged,
  linesAdded,
  linesRemoved,
  isActive = false,
  isRunning = false,
  isPinned = false,
  hasPendingApproval = false,
  hasRunningDevServer = false,
  hasUnseenActivity = false,
  latestProcessCompletedAt,
  latestProcessStatus,
  prStatus,
  onClick,
  className,
  summary = false,
  isDraft = false,
  onOpenWorkspaceActions,
}: WorkspaceSummaryProps) {
  const { t } = useTranslation('common');
  const hasChanges = filesChanged !== undefined && filesChanged > 0;
  const isFailed =
    latestProcessStatus === 'failed' || latestProcessStatus === 'killed';

  const handleOpenCommandBar = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!workspaceId || !onOpenWorkspaceActions) return;
    onOpenWorkspaceActions(workspaceId);
  };

  return (
    <div
      className={cn(
        'group relative rounded-sm transition-all duration-100 overflow-hidden',
        isActive ? 'bg-tertiary' : '',
        className
      )}
    >
      {/* Selection indicator - thin colored tab on the left */}
      <div
        className={cn(
          'absolute left-0 top-1 bottom-1 w-0.5 rounded-full transition-colors duration-100',
          isActive ? 'bg-brand' : 'bg-transparent'
        )}
      />
      <button
        onClick={onClick}
        className={cn(
          'flex w-full cursor-pointer flex-col text-left px-base py-half transition-all duration-150',
          isActive
            ? 'text-normal'
            : 'text-low opacity-60 hover:opacity-100 hover:text-normal'
        )}
      >
        <div
          className={cn(
            'overflow-hidden whitespace-nowrap pr-double',
            !summary && 'text-normal'
          )}
          style={{
            maskImage:
              'linear-gradient(to right, black calc(100% - 24px), transparent 100%)',
            WebkitMaskImage:
              'linear-gradient(to right, black calc(100% - 24px), transparent 100%)',
          }}
        >
          {name}
        </div>
        {(!summary || isActive) && (
          <div className="flex w-full items-center gap-base text-sm h-5">
            {/* Dev server running - leftmost */}
            {hasRunningDevServer && (
              <PlayIcon
                className="size-icon-xs text-brand shrink-0"
                weight="fill"
              />
            )}

            {/* Failed/killed status (only when not running) */}
            {!isRunning && isFailed && (
              <TriangleIcon
                className="size-icon-xs text-error shrink-0"
                weight="fill"
              />
            )}

            {/* Running dots OR hand icon for pending approval */}
            {isRunning &&
              (hasPendingApproval ? (
                <HandIcon
                  className="size-icon-xs text-brand shrink-0"
                  weight="fill"
                />
              ) : (
                <RunningDots />
              ))}

            {/* Unseen activity indicator (only when not running and not failed) */}
            {hasUnseenActivity && !isRunning && !isFailed && (
              <CircleIcon
                className="size-icon-xs text-brand shrink-0"
                weight="fill"
              />
            )}

            {/* PR status icon */}
            {prStatus === 'open' && (
              <GitPullRequestIcon
                className="size-icon-xs text-success shrink-0"
                weight="fill"
              />
            )}
            {prStatus === 'merged' && (
              <GitPullRequestIcon
                className="size-icon-xs text-merged shrink-0"
                weight="fill"
              />
            )}

            {/* Pin icon */}
            {isPinned && (
              <PushPinIcon
                className="size-icon-xs text-brand shrink-0"
                weight="fill"
              />
            )}

            {/* Time elapsed OR "Draft" label (when not running) */}
            {!isRunning &&
              (isDraft ? (
                <span className="min-w-0 flex-1 truncate">
                  {t('workspaces.draft')}
                </span>
              ) : latestProcessCompletedAt ? (
                <span className="min-w-0 flex-1 truncate">
                  {formatRelativeElapsed(latestProcessCompletedAt)}
                </span>
              ) : (
                <span className="flex-1" />
              ))}

            {/* Spacer when running (no elapsed time shown) */}
            {isRunning && <span className="flex-1" />}

            {/* File count + lines changed on the right */}
            {hasChanges && (
              <span className="shrink-0 text-right flex items-center gap-half">
                <FileIcon className="size-icon-xs" weight="fill" />
                <span>{filesChanged}</span>
                {linesAdded !== undefined && (
                  <span className="text-success">+{linesAdded}</span>
                )}
                {linesRemoved !== undefined && (
                  <span className="text-error">-{linesRemoved}</span>
                )}
              </span>
            )}
          </div>
        )}
      </button>

      {/* Right-side hover action - more options only */}
      {workspaceId && onOpenWorkspaceActions && (
        <div className="absolute right-0 top-0 bottom-0 flex items-center opacity-0 group-hover:opacity-100">
          {/* Gradient fade from transparent to background */}
          <div className="h-full w-6 pointer-events-none bg-gradient-to-r from-transparent to-secondary" />
          {/* Single action button */}
          <div className="flex items-center pr-base h-full bg-secondary">
            <button
              onClick={handleOpenCommandBar}
              onPointerDown={(e) => e.stopPropagation()}
              className="p-1.5 rounded-sm text-low hover:text-normal hover:bg-tertiary"
              title={t('workspaces.more')}
            >
              <DotsThreeIcon className="size-5" weight="bold" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
