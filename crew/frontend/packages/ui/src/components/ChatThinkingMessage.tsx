import type { ReactNode } from 'react';
import { ChatDotsIcon } from '@phosphor-icons/react';
import { cn } from '../lib/cn';

export interface ChatThinkingMessageRenderProps {
  content: string;
  workspaceId?: string;
  className?: string;
}

interface ChatThinkingMessageProps {
  content: string;
  className?: string;
  taskAttemptId?: string;
  renderMarkdown: (props: ChatThinkingMessageRenderProps) => ReactNode;
}

export function ChatThinkingMessage({
  content,
  className,
  taskAttemptId,
  renderMarkdown,
}: ChatThinkingMessageProps) {
  return (
    <div
      className={cn('flex items-start gap-base text-sm text-low', className)}
    >
      <ChatDotsIcon className="shrink-0 size-icon-base pt-0.5" />
      {renderMarkdown({
        content,
        workspaceId: taskAttemptId,
        className: 'text-sm',
      })}
    </div>
  );
}
