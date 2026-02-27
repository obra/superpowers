import { useMemo } from 'react';
import {
  CaretDownIcon,
  ArrowSquareUpRightIcon,
  FileIcon as DefaultFileIcon,
} from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import { cn } from '../lib/cn';
import { ToolStatusDot, type ToolStatusLike } from './ToolStatusDot';
import type { ChatFileEntryDiffInput } from './ChatFileEntry';

export type ChatAggregatedDiffChange = {
  action: 'edit' | 'write' | 'delete' | 'rename';
  unified_diff?: string;
  has_line_numbers?: boolean;
  content?: string;
  new_path?: string;
};

export interface AggregatedDiffEntry {
  /** The file change data */
  change: ChatAggregatedDiffChange;
  /** Tool status for this change */
  status: ToolStatusLike | null;
  /** Unique key for expansion state */
  expansionKey: string;
}

interface ChatAggregatedDiffEntriesProps {
  /** The file path being edited */
  filePath: string;
  /** The individual diff entries for this file */
  entries: AggregatedDiffEntry[];
  /** Whether the accordion is expanded */
  expanded: boolean;
  /** Currently hovered state */
  isHovered: boolean;
  /** Callback when toggling expansion */
  onToggle: () => void;
  /** Callback when hover state changes */
  onHoverChange: (hovered: boolean) => void;
  /** Callback to open file in changes panel */
  onOpenInChanges: (() => void) | null;
  className?: string;
  fileIcon?: React.ElementType;
  isVSCode?: boolean;
  onOpenInVSCode?: (filePath: string) => void;
  renderDiffBody?: (args: {
    filePath: string;
    change: ChatAggregatedDiffChange;
    diffContent?: ChatFileEntryDiffInput;
  }) => React.ReactNode;
}

function parseUnifiedDiffStats(unifiedDiff: string) {
  let additions = 0;
  let deletions = 0;

  for (const line of unifiedDiff.split('\n')) {
    if (line.startsWith('+++') || line.startsWith('---')) {
      continue;
    }
    if (line.startsWith('+')) {
      additions += 1;
    } else if (line.startsWith('-')) {
      deletions += 1;
    }
  }

  return { additions, deletions };
}

function buildDiffContent(
  change: ChatAggregatedDiffChange,
  filePath: string
): ChatFileEntryDiffInput | undefined {
  if (change.action === 'edit' && change.unified_diff) {
    return {
      type: 'unified',
      path: filePath,
      unifiedDiff: change.unified_diff,
      hasLineNumbers: change.has_line_numbers ?? true,
    };
  }
  if (change.action === 'write' && change.content) {
    return {
      type: 'content',
      oldContent: '',
      newContent: change.content,
      newPath: filePath,
    };
  }
  return undefined;
}

function getActionLabel(change: ChatAggregatedDiffChange) {
  switch (change.action) {
    case 'edit':
      return 'Edit';
    case 'write':
      return 'Write';
    case 'delete':
      return 'Delete';
    case 'rename':
      return change.new_path ? `Rename → ${change.new_path}` : 'Rename';
    default:
      return 'Change';
  }
}

function DiffEntry({
  filePath,
  change,
  status,
  renderDiffBody,
}: {
  filePath: string;
  change: ChatAggregatedDiffChange;
  status: ToolStatusLike | null;
  renderDiffBody?: (args: {
    filePath: string;
    change: ChatAggregatedDiffChange;
    diffContent?: ChatFileEntryDiffInput;
  }) => React.ReactNode;
}) {
  const { additions, deletions } = useMemo(() => {
    if (change.action === 'edit' && change.unified_diff) {
      return parseUnifiedDiffStats(change.unified_diff);
    }
    return { additions: undefined, deletions: undefined };
  }, [change]);

  const writeAdditions =
    change.action === 'write' && change.content
      ? change.content.split('\n').length
      : undefined;
  const diffContent = useMemo(
    () => buildDiffContent(change, filePath),
    [change, filePath]
  );
  const hasStats =
    (additions !== undefined && additions > 0) ||
    (deletions !== undefined && deletions > 0) ||
    (writeAdditions !== undefined && writeAdditions > 0);

  return (
    <div className="border-t border-muted/50 first:border-t-0">
      <div className="flex items-center p-base bg-muted/10">
        <div className="flex-1 flex items-center gap-base min-w-0">
          <span className="relative shrink-0">
            {status && <ToolStatusDot status={status} className="size-2" />}
          </span>
          <span className="text-sm text-low">{getActionLabel(change)}</span>
          {hasStats && (
            <span className="text-sm shrink-0">
              {(additions ?? writeAdditions) !== undefined &&
                (additions ?? writeAdditions)! > 0 && (
                  <span className="text-success">
                    +{additions ?? writeAdditions}
                  </span>
                )}
              {(additions ?? writeAdditions) !== undefined &&
                deletions !== undefined &&
                deletions > 0 &&
                ' '}
              {deletions !== undefined && deletions > 0 && (
                <span className="text-error">-{deletions}</span>
              )}
            </span>
          )}
        </div>
      </div>

      {diffContent &&
        renderDiffBody?.({
          filePath,
          change,
          diffContent,
        })}
    </div>
  );
}

export function ChatAggregatedDiffEntries({
  filePath,
  entries,
  expanded,
  isHovered,
  onToggle,
  onHoverChange,
  onOpenInChanges,
  className,
  fileIcon,
  isVSCode = false,
  onOpenInVSCode,
  renderDiffBody,
}: ChatAggregatedDiffEntriesProps) {
  const { t } = useTranslation('tasks');
  const FileIcon = fileIcon ?? DefaultFileIcon;

  const handleClick = () => {
    if (isVSCode) {
      onOpenInVSCode?.(filePath);
      return;
    }
    onToggle();
  };

  const totalStats = useMemo(() => {
    let additions = 0;
    let deletions = 0;

    for (const entry of entries) {
      const { change } = entry;
      if (change.action === 'edit' && change.unified_diff) {
        const stats = parseUnifiedDiffStats(change.unified_diff);
        additions += stats.additions ?? 0;
        deletions += stats.deletions ?? 0;
      } else if (change.action === 'write' && change.content) {
        additions += change.content.split('\n').length;
      }
    }

    return { additions, deletions };
  }, [entries]);

  const aggregateStatus = useMemo(() => {
    return entries.reduce<ToolStatusLike | null>((worst, entry) => {
      if (!entry.status) return worst;
      if (!worst) return entry.status;

      const statusPriority: Record<string, number> = {
        failed: 6,
        denied: 5,
        timed_out: 4,
        pending_approval: 3,
        created: 2,
        success: 1,
      };

      const worstPriority = statusPriority[worst.status] || 0;
      const currentPriority = statusPriority[entry.status.status] || 0;

      return currentPriority > worstPriority ? entry.status : worst;
    }, null);
  }, [entries]);

  const isDenied = aggregateStatus?.status === 'denied';
  const hasStats = totalStats.additions > 0 || totalStats.deletions > 0;

  return (
    <div
      className={cn(
        'rounded-sm border overflow-hidden',
        isDenied && 'border-error bg-error/10',
        className
      )}
    >
      <div
        className={cn(
          'flex items-center p-base w-full',
          isDenied ? 'bg-error/20' : 'bg-panel',
          'cursor-pointer'
        )}
        onClick={handleClick}
        onMouseEnter={() => onHoverChange(true)}
        onMouseLeave={() => onHoverChange(false)}
        role="button"
        aria-expanded={expanded}
      >
        <div className="flex-1 flex items-center gap-base min-w-0">
          <span className="relative shrink-0">
            {!isVSCode && isHovered ? (
              <CaretDownIcon
                className={cn(
                  'size-icon-base transition-transform duration-150',
                  !expanded && '-rotate-90'
                )}
              />
            ) : (
              <FileIcon className="size-icon-base" />
            )}
            {aggregateStatus && (
              <ToolStatusDot
                status={aggregateStatus}
                className="absolute -bottom-0.5 -right-0.5"
              />
            )}
          </span>
          <span className="text-sm text-normal truncate">{filePath}</span>
          <span className="text-xs text-low shrink-0">
            · {entries.length} {entries.length === 1 ? 'edit' : 'edits'}
          </span>
          {!isVSCode && onOpenInChanges && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenInChanges();
              }}
              className="shrink-0 p-0.5 rounded hover:bg-muted text-low hover:text-normal transition-colors"
              title={t('conversation.viewInChangesPanel')}
            >
              <ArrowSquareUpRightIcon className="size-icon-xs" />
            </button>
          )}
          {hasStats && (
            <span className="text-sm shrink-0">
              {totalStats.additions > 0 && (
                <span className="text-success">+{totalStats.additions}</span>
              )}
              {totalStats.additions > 0 && totalStats.deletions > 0 && ' '}
              {totalStats.deletions > 0 && (
                <span className="text-error">-{totalStats.deletions}</span>
              )}
            </span>
          )}
        </div>
        {!isVSCode && (
          <CaretDownIcon
            className={cn(
              'size-icon-xs shrink-0 text-low transition-transform',
              !expanded && '-rotate-90'
            )}
          />
        )}
      </div>

      {!isVSCode && expanded && (
        <div className="border-t">
          {entries.map((entry) => (
            <DiffEntry
              key={entry.expansionKey}
              filePath={filePath}
              change={entry.change}
              status={entry.status}
              renderDiffBody={renderDiffBody}
            />
          ))}
        </div>
      )}
    </div>
  );
}
