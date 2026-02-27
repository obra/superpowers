import { forwardRef } from 'react';
import {
  ListMagnifyingGlassIcon,
  TerminalWindowIcon,
  FileTextIcon,
  GlobeIcon,
} from '@phosphor-icons/react';
import { cn } from '../lib/cn';
import { ToolStatusDot, type ToolStatusLike } from './ToolStatusDot';

interface ChatToolSummaryProps {
  summary: string;
  className?: string;
  expanded?: boolean;
  onToggle?: () => void;
  status?: ToolStatusLike;
  onViewContent?: () => void;
  toolName?: string;
  isTruncated?: boolean;
  /** The action type for determining the icon */
  actionType?: string;
}

export const ChatToolSummary = forwardRef<
  HTMLSpanElement,
  ChatToolSummaryProps
>(function ChatToolSummary(
  {
    summary,
    className,
    expanded,
    onToggle,
    status,
    onViewContent,
    toolName,
    isTruncated,
    actionType,
  },
  ref
) {
  // Can expand if text is truncated and onToggle is provided
  const canExpand = isTruncated && onToggle;
  const isClickable = Boolean(onViewContent || canExpand);

  const handleClick = () => {
    if (onViewContent) {
      onViewContent();
    } else if (canExpand) {
      onToggle();
    }
  };

  // Determine icon based on action type or tool name
  const getIcon = () => {
    if (toolName === 'Bash') return TerminalWindowIcon;
    switch (actionType) {
      case 'file_read':
        return FileTextIcon;
      case 'search':
        return ListMagnifyingGlassIcon;
      case 'web_fetch':
        return GlobeIcon;
      default:
        return ListMagnifyingGlassIcon;
    }
  };
  const Icon = getIcon();

  return (
    <div
      className={cn(
        'flex items-center gap-base text-sm text-low',
        isClickable && 'cursor-pointer',
        className
      )}
      onClick={isClickable ? handleClick : undefined}
      role={isClickable ? 'button' : undefined}
    >
      <span className="relative shrink-0 pt-0.5">
        <Icon className="size-icon-base" />
        {status && (
          <ToolStatusDot
            status={status}
            className="absolute -bottom-0.5 -left-0.5"
          />
        )}
      </span>
      <span
        ref={ref}
        className={cn(
          !expanded && 'truncate',
          expanded && 'whitespace-pre-wrap break-all'
        )}
      >
        {summary}
      </span>
    </div>
  );
});
