import type { ReactNode } from 'react';

export interface ChatAssistantMessageRenderProps {
  content: string;
  workspaceId?: string;
}

interface ChatAssistantMessageProps {
  content: string;
  workspaceId?: string;
  renderMarkdown: (props: ChatAssistantMessageRenderProps) => ReactNode;
}

export function ChatAssistantMessage({
  content,
  workspaceId,
  renderMarkdown,
}: ChatAssistantMessageProps) {
  return renderMarkdown({ content, workspaceId });
}
