import { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/shared/lib/utils';
import {
  type LogEntry,
  VirtualizedProcessLogs,
} from '@/shared/components/VirtualizedProcessLogs';
import { useLogStream } from '@/shared/hooks/useLogStream';
import { useLogsPanel } from '@/shared/hooks/useLogsPanel';
import { TerminalPanelContainer } from '@/shared/components/TerminalPanelContainer';
import { ArrowsInSimpleIcon } from '@phosphor-icons/react';

export type LogsPanelContent =
  | { type: 'process'; processId: string }
  | {
      type: 'tool';
      toolName: string;
      content: string;
      command: string | undefined;
    }
  | { type: 'terminal' };

interface LogsContentContainerProps {
  className: string;
}

export function LogsContentContainer({ className }: LogsContentContainerProps) {
  const {
    logsPanelContent: content,
    logSearchQuery: searchQuery,
    logCurrentMatchIdx: currentMatchIndex,
    setLogMatchIndices: onMatchIndicesChange,
    collapseTerminal,
  } = useLogsPanel();
  const { t } = useTranslation('common');
  // Get logs for process content (only when type is 'process')
  const processId = content?.type === 'process' ? content.processId : '';
  const { logs, error } = useLogStream(processId);

  // Get the current logs based on content type
  const currentLogs = useMemo(() => {
    if (content?.type === 'tool') {
      return content.content
        .split('\n')
        .map((line) => ({ type: 'STDOUT' as const, content: line }));
    }
    return logs;
  }, [content, logs]);

  // Compute which log indices match the search query (reversed for bottom-to-top)
  const matchIndices = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase();
    const matches = currentLogs
      .map((log, idx) => (log.content.toLowerCase().includes(query) ? idx : -1))
      .filter((idx) => idx !== -1);
    // Reverse so newest matches (bottom) come first
    return matches.reverse();
  }, [currentLogs, searchQuery]);

  // Report match indices to parent
  useEffect(() => {
    onMatchIndicesChange?.(matchIndices);
  }, [matchIndices, onMatchIndicesChange]);

  // Empty state
  if (!content) {
    return (
      <div className="w-full h-full bg-secondary flex items-center justify-center text-low">
        <p className="text-sm">{t('logs.selectProcessToView')}</p>
      </div>
    );
  }

  // Tool content - render static content using VirtualizedProcessLogs
  if (content.type === 'tool') {
    const toolLogs: LogEntry[] = content.content
      .split('\n')
      .map((line) => ({ type: 'STDOUT' as const, content: line }));

    return (
      <div className={cn('h-full bg-secondary flex flex-col', className)}>
        <div className="px-4 py-2 border-b border-border text-sm font-medium text-normal shrink-0">
          {content.toolName}
        </div>
        {content.command && (
          <div className="px-4 py-2 font-mono text-xs text-low border-b border-border bg-tertiary shrink-0">
            $ {content.command}
          </div>
        )}
        <div className="flex-1 min-h-0">
          <VirtualizedProcessLogs
            logs={toolLogs}
            error={null}
            searchQuery={searchQuery}
            matchIndices={matchIndices}
            currentMatchIndex={currentMatchIndex}
          />
        </div>
      </div>
    );
  }

  // Terminal content - render terminal with collapse button
  if (content.type === 'terminal') {
    return (
      <div className={cn('h-full bg-secondary flex flex-col', className)}>
        <div className="px-4 py-1 flex items-center justify-between shrink-0 h-8">
          <span className="text-sm font-medium text-normal">
            {t('processes.terminal')}
          </span>
          <button
            type="button"
            onClick={collapseTerminal}
            className="text-low hover:text-normal transition-colors"
            title={t('actions.collapse')}
          >
            <ArrowsInSimpleIcon className="size-icon-sm" weight="bold" />
          </button>
        </div>
        <div className="flex-1 flex min-h-0 border-t border-border">
          <div className="flex-1 min-h-0 w-full">
            <TerminalPanelContainer />
          </div>
        </div>
      </div>
    );
  }

  // Process logs - render with VirtualizedProcessLogs
  return (
    <div className={cn('h-full bg-secondary', className)}>
      <VirtualizedProcessLogs
        key={processId}
        logs={logs}
        error={error}
        searchQuery={searchQuery}
        matchIndices={matchIndices}
        currentMatchIndex={currentMatchIndex}
      />
    </div>
  );
}
