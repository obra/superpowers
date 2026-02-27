import { cn } from '../lib/cn';
import {
  ArrowFatLineUpIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  MinusIcon,
} from '@phosphor-icons/react';

export type PriorityLevel = 'urgent' | 'high' | 'medium' | 'low';

export interface PriorityIconProps {
  priority: PriorityLevel | null;
  className?: string;
}

const priorityConfig: Record<
  PriorityLevel,
  { icon: typeof ArrowUpIcon; colorClass: string }
> = {
  urgent: { icon: ArrowFatLineUpIcon, colorClass: 'text-error' },
  high: { icon: ArrowUpIcon, colorClass: 'text-brand' },
  medium: { icon: MinusIcon, colorClass: 'text-low' },
  low: { icon: ArrowDownIcon, colorClass: 'text-success' },
};

export const PriorityIcon = ({ priority, className }: PriorityIconProps) => {
  if (!priority) return null;
  const { icon: IconComponent, colorClass } = priorityConfig[priority];
  return (
    <IconComponent
      className={cn('size-icon-xs', colorClass, className)}
      weight="bold"
    />
  );
};
