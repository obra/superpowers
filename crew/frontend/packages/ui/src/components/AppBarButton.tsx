import * as React from 'react';
import type { Icon } from '@phosphor-icons/react';
import { cn } from '../lib/cn';
import { Tooltip } from './Tooltip';

interface AppBarButtonProps {
  icon?: Icon;
  label: string;
  isActive?: boolean;
  onClick?: () => void;
  className?: string;
  children?: React.ReactNode;
}

export function AppBarButton({
  icon: IconComponent,
  label,
  isActive = false,
  onClick,
  className,
  children,
}: AppBarButtonProps) {
  const button = (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex items-center justify-center w-10 h-10 rounded-lg',
        'transition-colors cursor-pointer',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-brand',
        isActive
          ? 'bg-brand/20 text-brand'
          : 'bg-primary text-normal hover:bg-brand/10',
        className
      )}
      aria-label={label}
    >
      {IconComponent && (
        <IconComponent className="size-icon-base" weight="bold" />
      )}
      {children}
    </button>
  );

  return (
    <Tooltip content={label} side="right">
      {button}
    </Tooltip>
  );
}
