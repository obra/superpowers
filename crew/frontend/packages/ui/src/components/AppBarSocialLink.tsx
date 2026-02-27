import type { ReactNode } from 'react';
import { cn } from '../lib/cn';
import { Tooltip } from './Tooltip';

interface AppBarSocialLinkProps {
  href: string;
  label: string;
  iconPath: string;
  badge?: ReactNode;
}

export function AppBarSocialLink({
  href,
  label,
  iconPath,
  badge,
}: AppBarSocialLinkProps) {
  return (
    <Tooltip content={label} side="right">
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          'relative flex items-center justify-center w-10 h-10 rounded-lg',
          'text-sm font-medium transition-colors cursor-pointer',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-brand',
          'bg-panel text-normal hover:opacity-80'
        )}
        aria-label={label}
      >
        <svg
          className="w-5 h-5"
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d={iconPath} />
        </svg>
        {badge != null && badge !== false && (
          <span className="absolute -top-2 -right-1 min-w-[18px] h-[18px] px-1 flex items-center justify-center gap-0.5 rounded-full bg-brand-secondary text-[10px] font-medium text-white">
            {badge}
          </span>
        )}
      </a>
    </Tooltip>
  );
}
