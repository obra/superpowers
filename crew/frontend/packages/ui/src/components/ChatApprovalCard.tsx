import type { ReactNode } from 'react';
import {
  ChatEntryContainer,
  type ChatEntryStatusLike,
} from './ChatEntryContainer';

export interface ChatApprovalCardRenderProps {
  content: string;
  workspaceId?: string;
}

interface ChatApprovalCardProps {
  title: string;
  content: string;
  expanded?: boolean;
  onToggle?: () => void;
  className?: string;
  workspaceId?: string;
  status: ChatEntryStatusLike;
  renderMarkdown: (props: ChatApprovalCardRenderProps) => ReactNode;
}

export function ChatApprovalCard({
  title,
  content,
  expanded = false,
  onToggle,
  className,
  workspaceId,
  status,
  renderMarkdown,
}: ChatApprovalCardProps) {
  return (
    <ChatEntryContainer
      variant="plan"
      title={title}
      expanded={expanded}
      onToggle={onToggle}
      className={className}
      status={status}
    >
      {renderMarkdown({ content, workspaceId })}
    </ChatEntryContainer>
  );
}
