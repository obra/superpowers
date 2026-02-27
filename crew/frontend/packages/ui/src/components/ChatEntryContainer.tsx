import { ComponentType } from 'react';
import {
  CaretDownIcon,
  UserIcon,
  ListChecksIcon,
  GearIcon,
  IconProps,
} from '@phosphor-icons/react';
import { cn } from '../lib/cn';

type Variant = 'user' | 'plan' | 'plan_denied' | 'system';

export interface ChatEntryStatusLike {
  status: string;
}

interface VariantConfig {
  icon: ComponentType<IconProps>;
  border: string;
  headerBg: string;
  bg: string;
}

const variantConfig: Record<Variant, VariantConfig> = {
  user: {
    icon: UserIcon,
    border: 'border-border',
    headerBg: '',
    bg: '',
  },
  plan: {
    icon: ListChecksIcon,
    border: 'border-brand',
    headerBg: 'bg-brand/20',
    bg: 'bg-brand/10',
  },
  plan_denied: {
    icon: ListChecksIcon,
    border: 'border-error',
    headerBg: 'bg-error/20',
    bg: 'bg-error/10',
  },
  system: {
    icon: GearIcon,
    border: 'border-border',
    headerBg: 'bg-gray-50 dark:bg-gray-900/30',
    bg: '',
  },
};

interface ChatEntryContainerProps {
  variant: Variant;
  title?: React.ReactNode;
  headerRight?: React.ReactNode;
  expanded?: boolean;
  onToggle?: () => void;
  children?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
  status?: ChatEntryStatusLike;
  isGreyed?: boolean;
}

export function ChatEntryContainer({
  variant,
  title,
  headerRight,
  expanded = false,
  onToggle,
  children,
  actions,
  className,
  status,
  isGreyed,
}: ChatEntryContainerProps) {
  // Special case for plan denied
  const config =
    variant === 'plan' && status?.status === 'denied'
      ? variantConfig.plan_denied
      : variantConfig[variant];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        'rounded-sm w-full',
        config.border && 'border',
        config.border,
        config.bg,
        isGreyed && 'opacity-50 pointer-events-none',
        className
      )}
    >
      {/* Header */}
      <div
        className={cn(
          'flex items-center px-double py-base gap-base rounded-sm overflow-hidden',
          config.headerBg,
          onToggle && 'cursor-pointer'
        )}
        onClick={onToggle}
      >
        <Icon className="size-icon-xs shrink-0 text-low" />
        {title && (
          <span className="flex-1 text-sm text-normal truncate">{title}</span>
        )}
        {headerRight}
        {onToggle && (
          <CaretDownIcon
            className={cn(
              'size-icon-xs shrink-0 text-low transition-transform',
              !expanded && '-rotate-90'
            )}
          />
        )}
      </div>

      {/* Content - shown when expanded */}
      {expanded && children && <div className="p-double">{children}</div>}

      {/* Actions footer - optional */}
      {actions && (
        <div className="bg-brand/20 backdrop-blur-sm flex items-center gap-base px-double py-base border-t sticky bottom-0 rounded-md">
          {actions}
        </div>
      )}
    </div>
  );
}
