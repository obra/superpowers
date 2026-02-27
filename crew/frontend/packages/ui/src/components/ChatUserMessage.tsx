import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { PencilSimpleIcon, ArrowUUpLeftIcon } from '@phosphor-icons/react';
import { ChatEntryContainer } from './ChatEntryContainer';
import { Tooltip } from './Tooltip';

export interface ChatUserMessageRenderProps {
  content: string;
  workspaceId?: string;
}

interface ChatUserMessageProps {
  content: string;
  expanded?: boolean;
  onToggle?: () => void;
  className?: string;
  workspaceId?: string;
  onEdit?: () => void;
  onReset?: () => void;
  isGreyed?: boolean;
  renderMarkdown: (props: ChatUserMessageRenderProps) => ReactNode;
}

export function ChatUserMessage({
  content,
  expanded = true,
  onToggle,
  className,
  workspaceId,
  onEdit,
  onReset,
  isGreyed,
  renderMarkdown,
}: ChatUserMessageProps) {
  const { t } = useTranslation('tasks');

  const headerActions =
    !isGreyed && (onEdit || onReset) ? (
      <div className="flex items-center gap-1">
        {onReset && (
          <Tooltip content={t('conversation.actions.resetTooltip')}>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onReset();
              }}
              className="p-1 rounded hover:bg-muted text-low hover:text-normal transition-colors"
              aria-label={t('conversation.actions.reset')}
            >
              <ArrowUUpLeftIcon className="size-icon-xs" />
            </button>
          </Tooltip>
        )}
        {onEdit && (
          <Tooltip content={t('conversation.actions.edit')}>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              className="p-1 rounded hover:bg-muted text-low hover:text-normal transition-colors"
              aria-label={t('conversation.actions.edit')}
            >
              <PencilSimpleIcon className="size-icon-xs" />
            </button>
          </Tooltip>
        )}
      </div>
    ) : undefined;

  return (
    <ChatEntryContainer
      variant="user"
      title={t('conversation.you')}
      expanded={expanded}
      onToggle={onToggle}
      className={className}
      isGreyed={isGreyed}
      headerRight={headerActions}
    >
      {renderMarkdown({ content, workspaceId })}
    </ChatEntryContainer>
  );
}
