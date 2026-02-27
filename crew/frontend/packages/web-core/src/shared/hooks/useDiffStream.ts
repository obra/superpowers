import { useCallback, useMemo } from 'react';
import type { Diff, PatchType } from 'shared/types';
import { useJsonPatchWsStream } from '@/shared/hooks/useJsonPatchWsStream';

interface DiffEntries {
  [filePath: string]: PatchType;
}

type DiffStreamEvent = {
  entries: DiffEntries;
};

export interface UseDiffStreamOptions {
  statsOnly?: boolean;
}

interface UseDiffStreamResult {
  diffs: Diff[];
  error: string | null;
  isInitialized: boolean;
}

export const useDiffStream = (
  attemptId: string | null,
  enabled: boolean,
  options?: UseDiffStreamOptions
): UseDiffStreamResult => {
  const endpoint = (() => {
    if (!attemptId) return undefined;
    const query = `/api/task-attempts/${attemptId}/diff/ws`;
    if (typeof options?.statsOnly === 'boolean') {
      const params = new URLSearchParams();
      params.set('stats_only', String(options.statsOnly));
      return `${query}?${params.toString()}`;
    } else {
      return query;
    }
  })();

  const initialData = useCallback(
    (): DiffStreamEvent => ({
      entries: {},
    }),
    []
  );

  const { data, error, isInitialized } = useJsonPatchWsStream<DiffStreamEvent>(
    endpoint,
    enabled && !!attemptId,
    initialData
    // No need for injectInitialEntry or deduplicatePatches for diffs
  );

  const diffs = useMemo(() => {
    return Object.values(data?.entries ?? {})
      .filter((entry) => entry?.type === 'DIFF')
      .map((entry) => entry.content);
  }, [data?.entries]);

  return { diffs, error, isInitialized };
};
