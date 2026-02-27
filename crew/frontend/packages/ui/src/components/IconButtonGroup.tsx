import type { ReactNode } from 'react';
import { cn } from '../lib/cn';
import type { Icon } from '@phosphor-icons/react';
import { Tooltip } from './Tooltip';

interface ButtonGroupProps {
  children: ReactNode;
  className?: string;
}

/**
 * ButtonGroup - A container for grouped buttons with a shared border
 * Can contain IconButtonGroupItem (icon-only) or ButtonGroupItem (text/mixed)
 */
export function ButtonGroup({ children, className }: ButtonGroupProps) {
  return (
    <div
      className={cn(
        'flex items-center rounded-sm border border-border overflow-hidden',
        className
      )}
    >
      {children}
    </div>
  );
}

// Alias for backwards compatibility
export const IconButtonGroup = ButtonGroup;

interface IconButtonGroupItemProps {
  icon: Icon;
  iconClassName?: string;
  onClick?: () => void;
  disabled?: boolean;
  active?: boolean;
  'aria-label': string;
  title?: string;
  className?: string;
}

export function IconButtonGroupItem({
  icon: IconComponent,
  iconClassName,
  onClick,
  disabled,
  active,
  'aria-label': ariaLabel,
  title,
  className,
}: IconButtonGroupItemProps) {
  const stateStyles = disabled
    ? 'opacity-40 cursor-not-allowed'
    : active
      ? 'bg-secondary text-normal'
      : 'text-low hover:text-normal hover:bg-secondary/50';

  const button = (
    <button
      type="button"
      className={cn('p-half transition-colors', stateStyles, className)}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
    >
      <IconComponent
        className={cn('size-icon-sm', iconClassName)}
        weight="bold"
      />
    </button>
  );

  return title ? <Tooltip content={title}>{button}</Tooltip> : button;
}

interface ButtonGroupItemProps {
  icon?: Icon;
  iconClassName?: string;
  onClick?: () => void;
  disabled?: boolean;
  active?: boolean;
  'aria-label'?: string;
  title?: string;
  className?: string;
  children?: ReactNode;
}

/**
 * ButtonGroupItem - A button within a ButtonGroup that supports text, icons, or both
 */
export function ButtonGroupItem({
  icon: IconComponent,
  iconClassName,
  onClick,
  disabled,
  active,
  'aria-label': ariaLabel,
  title,
  className,
  children,
}: ButtonGroupItemProps) {
  const stateStyles = disabled
    ? 'opacity-40 cursor-not-allowed'
    : active
      ? 'bg-secondary text-normal'
      : 'text-low hover:text-normal hover:bg-secondary/50';

  // Use smaller padding for icon-only, larger for text content
  const paddingStyles = children ? 'px-base py-half' : 'p-half';

  const button = (
    <button
      type="button"
      className={cn(
        'text-sm transition-colors',
        paddingStyles,
        stateStyles,
        className
      )}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
    >
      {IconComponent && (
        <IconComponent
          className={cn('size-icon-sm', children && 'mr-half', iconClassName)}
          weight="bold"
        />
      )}
      {children}
    </button>
  );

  return title ? <Tooltip content={title}>{button}</Tooltip> : button;
}
