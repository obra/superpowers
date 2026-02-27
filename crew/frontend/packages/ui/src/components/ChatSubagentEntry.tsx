import type { ReactNode } from 'react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  CaretDownIcon,
  CpuIcon,
  CheckCircleIcon,
  XCircleIcon,
  CircleNotchIcon,
} from '@phosphor-icons/react';
import { cn } from '../lib/cn';
import type { ToolStatusLike } from './ToolStatusDot';

export interface ChatSubagentResultLike {
  value?: unknown | null;
}

export interface ChatSubagentEntryRenderProps {
  content: string;
  workspaceId?: string;
}

interface ChatSubagentEntryProps {
  description: string;
  subagentType?: string | null;
  result?: ChatSubagentResultLike | null;
  expanded?: boolean;
  onToggle?: () => void;
  className?: string;
  status?: ToolStatusLike;
  workspaceId?: string;
  renderMarkdown: (props: ChatSubagentEntryRenderProps) => ReactNode;
}

/**
 * Renders a collapsible subagent (Task tool) entry showing:
 * - Header with subagent type and description
 * - Expandable content showing the subagent's output/conversation
 */
export function ChatSubagentEntry({
  description,
  subagentType,
  result,
  expanded = false,
  onToggle,
  className,
  status,
  workspaceId,
  renderMarkdown,
}: ChatSubagentEntryProps) {
  const { t } = useTranslation('common');

  // Determine status icon - consistent with ToolStatusDot
  const StatusIcon = useMemo(() => {
    if (!status) return null;
    const statusType = status.status;

    // Map status to visual state (consistent with ToolStatusDot)
    const isSuccess = statusType === 'success';
    const isError =
      statusType === 'failed' ||
      statusType === 'denied' ||
      statusType === 'timed_out';
    const isPending =
      statusType === 'created' || statusType === 'pending_approval';

    if (isSuccess) {
      return (
        <CheckCircleIcon className="size-icon-xs text-success" weight="fill" />
      );
    }
    if (isError) {
      return <XCircleIcon className="size-icon-xs text-error" weight="fill" />;
    }
    if (isPending) {
      return <CircleNotchIcon className="size-icon-xs text-low animate-spin" />;
    }
    return null;
  }, [status]);

  // Determine if status is an error state (for styling)
  const isErrorStatus = useMemo(() => {
    if (!status) return false;
    return (
      status.status === 'failed' ||
      status.status === 'denied' ||
      status.status === 'timed_out'
    );
  }, [status]);

  // Format the subagent type for display
  const formattedType = useMemo(() => {
    if (!subagentType) return t('conversation.subagent.defaultType');
    // Capitalize first letter and format
    return subagentType.charAt(0).toUpperCase() + subagentType.slice(1);
  }, [subagentType, t]);

  // Extract the result content for display
  const resultContent = useMemo(() => {
    if (!result?.value) return null;

    // Handle both string and object values
    if (typeof result.value === 'string') {
      return result.value;
    }

    // For JSON results, stringify with formatting
    return JSON.stringify(result.value, null, 2);
  }, [result]);

  // Determine if we have content to show
  const hasContent = Boolean(resultContent);

  return (
    <div
      className={cn(
        'rounded-sm border overflow-hidden',
        isErrorStatus && 'border-error bg-error/5',
        status?.status === 'success' && 'border-success/50',
        !isErrorStatus && status?.status !== 'success' && 'border-border',
        className
      )}
    >
      {/* Header */}
      <div
        className={cn(
          'flex items-center px-double py-base gap-base',
          isErrorStatus && 'bg-error/10',
          status?.status === 'success' && 'bg-success/5',
          onToggle && hasContent && 'cursor-pointer'
        )}
        onClick={hasContent ? onToggle : undefined}
      >
        <span className="relative shrink-0">
          <CpuIcon className="size-icon-base text-low" />
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-base">
            <span className="text-xs font-medium text-low uppercase tracking-wide">
              {formattedType}
            </span>
            {StatusIcon}
          </div>
          <span className="text-sm text-normal truncate block">
            {description}
          </span>
        </div>
        {onToggle && hasContent && (
          <CaretDownIcon
            className={cn(
              'size-icon-xs shrink-0 text-low transition-transform',
              !expanded && '-rotate-90'
            )}
          />
        )}
      </div>

      {/* Expanded content - shows subagent output */}
      {expanded && hasContent && (
        <div className="border-t p-double bg-panel/50">
          <div className="text-xs font-medium text-low pb-base uppercase tracking-wide">
            {t('conversation.output')}
          </div>
          <div className="prose prose-sm dark:prose-invert max-w-none">
            {renderMarkdown({ content: resultContent!, workspaceId })}
          </div>
        </div>
      )}
    </div>
  );
}
