import { cn } from '../lib/cn';

export interface ChatMarkdownRenderProps {
  content: string;
  className?: string;
  workspaceId?: string;
}

interface ChatMarkdownProps {
  content: string;
  maxWidth?: string;
  className?: string;
  workspaceId?: string;
  renderContent: (props: ChatMarkdownRenderProps) => React.ReactNode;
}

export function ChatMarkdown({
  content,
  maxWidth = '800px',
  className,
  workspaceId,
  renderContent,
}: ChatMarkdownProps) {
  const contentClassName = cn('whitespace-pre-wrap break-words', className);

  return (
    <div className="text-sm" style={{ maxWidth }}>
      {renderContent({
        content,
        className: contentClassName,
        workspaceId,
      })}
    </div>
  );
}
