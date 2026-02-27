import { InfoIcon } from '@phosphor-icons/react';
import { cn } from '../lib/cn';

interface ChatSystemMessageProps {
  content: string;
  className?: string;
  expanded?: boolean;
  onToggle?: () => void;
}

export function ChatSystemMessage({
  content,
  className,
  expanded,
  onToggle,
}: ChatSystemMessageProps) {
  return (
    <div
      className={cn(
        'flex items-start gap-base text-sm text-low cursor-pointer',
        className
      )}
      onClick={onToggle}
      role="button"
    >
      <InfoIcon className="shrink-0 size-icon-base pt-0.5" />
      <span
        className={cn(
          !expanded && 'truncate',
          expanded && 'whitespace-pre-wrap break-all'
        )}
      >
        {content}
      </span>
    </div>
  );
}
