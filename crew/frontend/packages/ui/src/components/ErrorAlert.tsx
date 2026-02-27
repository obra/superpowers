import { XIcon } from '@phosphor-icons/react';
import { cn } from '../lib/cn';

const splitLines = (value: string): string[] => value.split(/\r\n|\r|\n/);

interface ErrorAlertProps {
  message: string;
  className?: string;
  onDismiss?: () => void;
  dismissLabel?: string;
}

export function ErrorAlert({
  message,
  className,
  onDismiss,
  dismissLabel,
}: ErrorAlertProps) {
  return (
    <div
      role="alert"
      className={cn(
        'relative w-full rounded-sm border border-error bg-error/10 px-base py-half text-sm text-error',
        className
      )}
    >
      <div className={cn('leading-relaxed', onDismiss && 'pr-double')}>
        {splitLines(message).map((line, i, lines) => (
          <span key={i}>
            {line}
            {i < lines.length - 1 && <br />}
          </span>
        ))}
      </div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label={dismissLabel ?? 'Dismiss error'}
          className="absolute right-half top-half rounded-sm p-[2px] text-error/90 hover:bg-error/15 hover:text-error transition-colors"
        >
          <XIcon className="size-icon-xs" weight="bold" />
        </button>
      )}
    </div>
  );
}
