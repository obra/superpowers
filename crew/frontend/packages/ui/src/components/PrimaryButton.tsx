import { SpinnerIcon, type Icon } from '@phosphor-icons/react';
import { cn } from '../lib/cn';

interface PrimaryButtonProps {
  variant?: 'default' | 'secondary' | 'tertiary';
  actionIcon?: Icon | 'spinner';
  value?: string;
  onClick?: () => void;
  disabled?: boolean;
  children?: React.ReactNode;
  className?: string;
}

export function PrimaryButton({
  variant = 'default',
  actionIcon: ActionIcon,
  value,
  onClick,
  disabled,
  children,
  className,
}: PrimaryButtonProps) {
  const variantStyles = disabled
    ? 'cursor-not-allowed bg-panel'
    : variant === 'default'
      ? 'bg-brand hover:bg-brand-hover text-on-brand'
      : variant === 'secondary'
        ? 'bg-brand-secondary hover:bg-brand-hover text-on-brand'
        : 'bg-panel hover:bg-secondary text-normal';

  return (
    <button
      className={cn(
        'rounded-sm px-base py-half text-cta h-cta flex gap-half items-center',
        variantStyles,
        className
      )}
      onClick={onClick}
      disabled={disabled}
    >
      {value}
      {children}
      {ActionIcon ? (
        ActionIcon === 'spinner' ? (
          <SpinnerIcon className={'size-icon-sm animate-spin'} weight="bold" />
        ) : (
          <ActionIcon className={'size-icon-xs'} weight="bold" />
        )
      ) : null}
    </button>
  );
}
