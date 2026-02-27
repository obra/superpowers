import type { ReactNode } from 'react';
import { ChatDotsIcon, CaretRightIcon } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import { cn } from '../lib/cn';

export interface ThinkingEntry {
  content: string;
  expansionKey: string;
}

export interface ChatCollapsedThinkingRenderProps {
  content: string;
  workspaceId?: string;
  className?: string;
}

interface ChatCollapsedThinkingProps {
  entries: ThinkingEntry[];
  expanded: boolean;
  isHovered: boolean;
  onToggle: () => void;
  onHoverChange: (hovered: boolean) => void;
  className?: string;
  taskAttemptId?: string;
  renderMarkdown: (props: ChatCollapsedThinkingRenderProps) => ReactNode;
}

/**
 * A collapsible group for thinking entries in previous conversation turns.
 * When collapsed, shows "Thinking" with the thinking icon.
 * When expanded, shows all thinking entries with their full content.
 */
export function ChatCollapsedThinking({
  entries,
  expanded,
  isHovered,
  onToggle,
  onHoverChange,
  className,
  taskAttemptId,
  renderMarkdown,
}: ChatCollapsedThinkingProps) {
  const { t } = useTranslation('common');

  if (entries.length === 0) return null;

  return (
    <div className={cn('flex flex-col', className)}>
      {/* Header row - clickable to expand/collapse */}
      <div
        className="flex items-center gap-base text-sm text-low cursor-pointer group"
        onClick={onToggle}
        onMouseEnter={() => onHoverChange(true)}
        onMouseLeave={() => onHoverChange(false)}
        role="button"
        aria-expanded={expanded}
      >
        <span className="shrink-0 pt-0.5">
          {isHovered ? (
            <CaretRightIcon
              className={cn(
                'size-icon-base transition-transform duration-150',
                expanded && 'rotate-90'
              )}
            />
          ) : (
            <ChatDotsIcon className="size-icon-base" />
          )}
        </span>
        <span className="truncate">{t('conversation.thinking')}</span>
      </div>

      {/* Expanded content */}
      {expanded && (
        <div className="ml-6 pt-1 flex flex-col gap-base">
          {entries.map((entry) => (
            <div key={entry.expansionKey} className="text-sm text-low pl-base">
              {renderMarkdown({
                content: entry.content,
                workspaceId: taskAttemptId,
                className: 'text-sm',
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
