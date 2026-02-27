'use client';

import { UsersIcon } from '@phosphor-icons/react';
import { cn } from '../lib/cn';
import { Tooltip } from './Tooltip';

const MAX_VISIBLE_AVATARS = 2;

export type KanbanAssigneeUser = {
  user_id: string;
  first_name?: string | null;
  last_name?: string | null;
  username?: string | null;
  avatar_url?: string | null;
};

export type KanbanAssigneeProps = {
  assignees: KanbanAssigneeUser[];
  className?: string;
};

const buildOptimizedImageUrl = (rawUrl: string): string => {
  try {
    const url = new URL(rawUrl);
    url.searchParams.set('width', '64');
    url.searchParams.set('height', '64');
    url.searchParams.set('fit', 'crop');
    url.searchParams.set('quality', '80');
    return url.toString();
  } catch {
    const separator = rawUrl.includes('?') ? '&' : '?';
    return `${rawUrl}${separator}width=64&height=64&fit=crop&quality=80`;
  }
};

const buildInitials = (user: KanbanAssigneeUser): string => {
  const first = user.first_name?.trim().charAt(0)?.toUpperCase() ?? '';
  const last = user.last_name?.trim().charAt(0)?.toUpperCase() ?? '';

  if (first || last) {
    return `${first}${last}`.trim() || first || last || '?';
  }

  const handle = user.username?.trim().charAt(0)?.toUpperCase();
  return handle ?? '?';
};

const buildLabel = (user: KanbanAssigneeUser): string => {
  const name = [user.first_name, user.last_name]
    .filter((value): value is string => Boolean(value && value.trim()))
    .join(' ');

  if (name) return name;
  if (user.username?.trim()) return user.username;
  return 'User';
};

const handleImageError = (event: React.SyntheticEvent<HTMLImageElement>) => {
  const img = event.currentTarget;
  img.style.display = 'none';
  const fallback = img.nextElementSibling;
  if (fallback instanceof HTMLElement) {
    fallback.style.display = 'flex';
  }
};

const AssigneeAvatar = ({ user }: { user: KanbanAssigneeUser }) => {
  const initials = buildInitials(user);
  const label = buildLabel(user);
  const imageUrl = user.avatar_url
    ? buildOptimizedImageUrl(user.avatar_url)
    : null;

  return (
    <Tooltip content={label}>
      <div
        className={cn(
          'flex size-icon-base shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-secondary text-xs font-medium text-low',
          'h-5 w-5 text-[10px] ring-1 ring-background'
        )}
        aria-label={label}
      >
        {imageUrl && (
          <img
            src={imageUrl}
            alt={label}
            className="h-full w-full object-cover"
            loading="lazy"
            onError={handleImageError}
          />
        )}
        <span style={imageUrl ? { display: 'none' } : undefined}>
          {initials}
        </span>
      </div>
    </Tooltip>
  );
};

export const KanbanAssignee = ({
  assignees,
  className,
}: KanbanAssigneeProps) => {
  if (assignees.length === 0) {
    return (
      <div
        className={cn('flex items-center justify-center', 'h-6 w-6', className)}
        aria-label="Unassigned"
      >
        <UsersIcon className="size-icon-xs text-low" weight="bold" />
      </div>
    );
  }

  const visibleAssignees = assignees.slice(0, MAX_VISIBLE_AVATARS);
  const remainingCount = assignees.length - MAX_VISIBLE_AVATARS;

  return (
    <div className={cn('flex items-center h-6', className)}>
      <div className="flex -space-x-1">
        {visibleAssignees.map((assignee) => (
          <AssigneeAvatar key={assignee.user_id} user={assignee} />
        ))}
      </div>
      {remainingCount > 0 && (
        <span className="ml-half text-xs text-low">+{remainingCount}</span>
      )}
    </div>
  );
};
