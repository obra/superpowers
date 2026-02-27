'use client';

import { cn } from '../lib/cn';
import { Tooltip } from './Tooltip';

export type UserAvatarUser = {
  first_name?: string | null;
  last_name?: string | null;
  username?: string | null;
  avatar_url?: string | null;
};

export interface UserAvatarProps {
  user: UserAvatarUser;
  className?: string;
}

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

const buildInitials = (user: UserAvatarUser): string => {
  const first = user.first_name?.trim().charAt(0)?.toUpperCase() ?? '';
  const last = user.last_name?.trim().charAt(0)?.toUpperCase() ?? '';

  if (first || last) {
    return `${first}${last}`.trim() || first || last || '?';
  }

  const handle = user.username?.trim().charAt(0)?.toUpperCase();
  return handle ?? '?';
};

const buildLabel = (user: UserAvatarUser): string => {
  const name = [user.first_name, user.last_name]
    .filter((value): value is string => Boolean(value && value.trim()))
    .join(' ');

  if (name) return name;
  if (user.username?.trim()) return user.username;
  return 'User';
};

// Helper to handle image error by hiding img and showing fallback via DOM
const handleImageError = (event: React.SyntheticEvent<HTMLImageElement>) => {
  const img = event.currentTarget;
  img.style.display = 'none';
  const fallback = img.nextElementSibling;
  if (fallback instanceof HTMLElement) {
    fallback.style.display = 'flex';
  }
};

export const UserAvatar = ({ user, className }: UserAvatarProps) => {
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
          className
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
