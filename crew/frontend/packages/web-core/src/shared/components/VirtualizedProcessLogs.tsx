import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  DataWithScrollModifier,
  ScrollModifier,
  VirtuosoMessageList,
  VirtuosoMessageListLicense,
  VirtuosoMessageListMethods,
  VirtuosoMessageListProps,
} from '@virtuoso.dev/message-list';
import { WarningCircleIcon } from '@phosphor-icons/react/dist/ssr';
import RawLogText from '@/shared/components/RawLogText';
import {
  INITIAL_TOP_ITEM,
  InitialDataScrollModifier,
  ScrollToBottomModifier as ScrollToLastItem,
} from '@/shared/lib/virtuoso-modifiers';
import type { PatchType } from 'shared/types';

export type LogEntry = Extract<
  PatchType,
  { type: 'STDOUT' } | { type: 'STDERR' }
>;

export interface VirtualizedProcessLogsProps {
  logs: LogEntry[];
  error: string | null;
  searchQuery: string;
  matchIndices: number[];
  currentMatchIndex: number;
}

type LogEntryWithKey = LogEntry & { key: string; originalIndex: number };

interface SearchContext {
  searchQuery: string;
  matchIndices: number[];
  currentMatchIndex: number;
}

const computeItemKey: VirtuosoMessageListProps<
  LogEntryWithKey,
  SearchContext
>['computeItemKey'] = ({ data }) => data.key;

const ItemContent: VirtuosoMessageListProps<
  LogEntryWithKey,
  SearchContext
>['ItemContent'] = ({ data, context }) => {
  const isMatch = context.matchIndices.includes(data.originalIndex);
  const isCurrentMatch =
    context.matchIndices[context.currentMatchIndex] === data.originalIndex;

  return (
    <RawLogText
      content={data.content}
      channel={data.type === 'STDERR' ? 'stderr' : 'stdout'}
      className="text-sm px-4 py-1"
      linkifyUrls
      searchQuery={isMatch ? context.searchQuery : undefined}
      isCurrentMatch={isCurrentMatch}
    />
  );
};

export function VirtualizedProcessLogs({
  logs,
  error,
  searchQuery,
  matchIndices,
  currentMatchIndex,
}: VirtualizedProcessLogsProps) {
  const { t } = useTranslation('tasks');
  const [channelData, setChannelData] =
    useState<DataWithScrollModifier<LogEntryWithKey> | null>(null);
  const messageListRef = useRef<VirtuosoMessageListMethods<
    LogEntryWithKey,
    SearchContext
  > | null>(null);
  const hasInitializedRef = useRef(false);
  const prevCurrentMatchRef = useRef<number | undefined>(undefined);
  const isAtBottomRef = useRef(true);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const logsWithKeys: LogEntryWithKey[] = logs.map((entry, index) => ({
        ...entry,
        key: `log-${index}`,
        originalIndex: index,
      }));

      // Use InitialDataScrollModifier (with purgeItemSizes) only on the
      // very first data load. For all subsequent updates, use ScrollToLastItem
      // which always jumps to the end — unlike auto-scroll-to-bottom which
      // only follows if the viewport is already at the bottom.
      let scrollModifier: ScrollModifier | null = null;
      if (!hasInitializedRef.current && logs.length > 0) {
        hasInitializedRef.current = true;
        scrollModifier = InitialDataScrollModifier;
      } else if (isAtBottomRef.current) {
        scrollModifier = ScrollToLastItem;
      }

      if (scrollModifier) {
        setChannelData({ data: logsWithKeys, scrollModifier });
      } else {
        setChannelData({ data: logsWithKeys });
      }
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [logs]);

  // Scroll to current match when it changes
  useEffect(() => {
    if (
      matchIndices.length > 0 &&
      currentMatchIndex >= 0 &&
      currentMatchIndex !== prevCurrentMatchRef.current
    ) {
      const logIndex = matchIndices[currentMatchIndex];
      messageListRef.current?.scrollToItem({
        index: logIndex,
        align: 'center',
        behavior: 'smooth',
      });
      prevCurrentMatchRef.current = currentMatchIndex;
    }
  }, [currentMatchIndex, matchIndices]);

  if (logs.length === 0 && !error) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-center text-muted-foreground text-sm">
          {t('processes.noLogsAvailable')}
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-center text-destructive text-sm">
          <WarningCircleIcon className="size-icon-base inline mr-2" />
          {error}
        </p>
      </div>
    );
  }

  const context: SearchContext = {
    searchQuery,
    matchIndices,
    currentMatchIndex,
  };

  return (
    <div className="h-full">
      <VirtuosoMessageListLicense
        licenseKey={import.meta.env.VITE_PUBLIC_REACT_VIRTUOSO_LICENSE_KEY}
      >
        <VirtuosoMessageList<LogEntryWithKey, SearchContext>
          ref={messageListRef}
          className="h-full"
          data={channelData}
          context={context}
          initialLocation={INITIAL_TOP_ITEM}
          onScroll={(location) => {
            isAtBottomRef.current = location.isAtBottom;
          }}
          computeItemKey={computeItemKey}
          ItemContent={ItemContent}
        />
      </VirtuosoMessageListLicense>
    </div>
  );
}
