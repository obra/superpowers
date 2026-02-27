import { useEffect, useRef, useState } from 'react';
import { Virtuoso, VirtuosoHandle } from 'react-virtuoso';
import { AlertCircle } from 'lucide-react';
import { useLogStream } from '@/shared/hooks/useLogStream';
import RawLogText from '@/shared/components/RawLogText';
import type { PatchType } from 'shared/types';

type LogEntry = Extract<PatchType, { type: 'STDOUT' } | { type: 'STDERR' }>;

interface ProcessLogsViewerProps {
  processId: string;
}

export function ProcessLogsViewerContent({
  logs,
  error,
}: {
  logs: LogEntry[];
  error: string | null;
}) {
  const virtuosoRef = useRef<VirtuosoHandle>(null);
  const didInitScroll = useRef(false);
  const prevLenRef = useRef(0);
  const [atBottom, setAtBottom] = useState(true);

  // 1) Initial jump to bottom once data appears.
  useEffect(() => {
    if (!didInitScroll.current && logs.length > 0) {
      didInitScroll.current = true;
      requestAnimationFrame(() => {
        virtuosoRef.current?.scrollToIndex({
          index: logs.length - 1,
          align: 'end',
        });
      });
    }
  }, [logs.length]);

  // 2) If there's a large append and we're at bottom, force-stick to the last item.
  useEffect(() => {
    const prev = prevLenRef.current;
    const grewBy = logs.length - prev;
    prevLenRef.current = logs.length;

    // tweak threshold as you like; this handles "big bursts"
    const LARGE_BURST = 10;
    if (grewBy >= LARGE_BURST && atBottom && logs.length > 0) {
      // defer so Virtuoso can re-measure before jumping
      requestAnimationFrame(() => {
        virtuosoRef.current?.scrollToIndex({
          index: logs.length - 1,
          align: 'end',
        });
      });
    }
  }, [logs.length, atBottom, logs]);

  const formatLogLine = (entry: LogEntry, index: number) => {
    return (
      <RawLogText
        key={index}
        content={entry.content}
        channel={entry.type === 'STDERR' ? 'stderr' : 'stdout'}
        className="text-sm px-4 py-1"
      />
    );
  };

  return (
    <div className="flex-1 min-h-0">
      {logs.length === 0 && !error ? (
        <div className="p-4 text-center text-muted-foreground text-sm">
          No logs available
        </div>
      ) : error ? (
        <div className="p-4 text-center text-destructive text-sm">
          <AlertCircle className="h-4 w-4 inline mr-2" />
          {error}
        </div>
      ) : (
        <Virtuoso<LogEntry>
          ref={virtuosoRef}
          className="h-full rounded-lg"
          data={logs}
          itemContent={(index, entry) =>
            formatLogLine(entry as LogEntry, index)
          }
          // Keep pinned while user is at bottom; release when they scroll up
          atBottomStateChange={setAtBottom}
          followOutput={atBottom ? 'smooth' : false}
          // Optional: a bit more overscan helps during bursts
          increaseViewportBy={{ top: 0, bottom: 600 }}
        />
      )}
    </div>
  );
}

export default function ProcessLogsViewer({
  processId,
}: ProcessLogsViewerProps) {
  const { logs, error } = useLogStream(processId);
  return <ProcessLogsViewerContent logs={logs} error={error} />;
}
