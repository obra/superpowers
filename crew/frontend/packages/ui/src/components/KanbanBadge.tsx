'use client';

import { cn } from '../lib/cn';

export type KanbanBadgeProps = {
  name: string;
  color?: string;
  className?: string;
};

export const KanbanBadge = ({ name, color, className }: KanbanBadgeProps) => {
  return (
    <span
      className={cn(
        'inline-flex items-center justify-center',
        'h-5 px-base gap-half',
        'bg-panel rounded-sm',
        'text-sm text-low font-medium',
        'whitespace-nowrap',
        className
      )}
    >
      {color && (
        <span
          className="w-2 h-2 rounded-full shrink-0"
          style={{ backgroundColor: `hsl(${color})` }}
        />
      )}
      {name}
    </span>
  );
};
