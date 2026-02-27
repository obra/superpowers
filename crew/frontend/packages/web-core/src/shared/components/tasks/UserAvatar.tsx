import { useEffect, useMemo, useState } from 'react';
import { cn } from '@/shared/lib/utils';

interface UserAvatarProps {
  firstName?: string | null;
  lastName?: string | null;
  username?: string | null;
  imageUrl?: string | null;
  className?: string;
}

const buildInitials = (
  firstName?: string | null,
  lastName?: string | null,
  username?: string | null
) => {
  const first = firstName?.trim().charAt(0)?.toUpperCase() ?? '';
  const last = lastName?.trim().charAt(0)?.toUpperCase() ?? '';

  if (first || last) {
    return `${first}${last}`.trim() || first || last || '?';
  }

  const handle = username?.trim().charAt(0)?.toUpperCase();
  return handle ?? '?';
};

const buildLabel = (
  firstName?: string | null,
  lastName?: string | null,
  username?: string | null
) => {
  const name = [firstName, lastName]
    .filter((value): value is string => Boolean(value && value.trim()))
    .join(' ');

  if (name) {
    return name;
  }

  if (username && username.trim()) {
    return username;
  }

  return 'Unassigned';
};

const buildOptimizedImageUrl = (rawUrl?: string | null) => {
  if (!rawUrl) {
    return null;
  }
  try {
    const url = new URL(rawUrl);
    url.searchParams.set('width', '64');
    url.searchParams.set('height', '64');
    url.searchParams.set('fit', 'crop');
    url.searchParams.set('quality', '80');
    return url.toString();
  } catch (error) {
    const separator = rawUrl.includes('?') ? '&' : '?';
    return `${rawUrl}${separator}width=64&height=64&fit=crop&quality=80`;
  }
};

export const UserAvatar = ({
  firstName,
  lastName,
  username,
  imageUrl,
  className,
}: UserAvatarProps) => {
  const [imageError, setImageError] = useState(false);

  const effectiveFirstName = firstName ?? null;
  const effectiveLastName = lastName ?? null;
  const effectiveUsername = username ?? null;

  const optimizedImageUrl = useMemo(() => {
    return buildOptimizedImageUrl(imageUrl);
  }, [imageUrl]);

  useEffect(() => {
    setImageError(false);
  }, [optimizedImageUrl]);

  const shouldShowImage = Boolean(optimizedImageUrl) && !imageError;

  const initials = buildInitials(
    effectiveFirstName,
    effectiveLastName,
    effectiveUsername
  );
  const label = buildLabel(
    effectiveFirstName,
    effectiveLastName,
    effectiveUsername
  );

  return (
    <div
      className={cn(
        'flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-muted-foreground text-xs font-medium text-muted',
        className
      )}
      title={label}
      aria-label={label}
    >
      {shouldShowImage ? (
        <img
          src={optimizedImageUrl ?? undefined}
          alt={label}
          className="h-full w-full object-cover"
          loading="lazy"
          onError={() => setImageError(true)}
        />
      ) : (
        initials
      )}
    </div>
  );
};
