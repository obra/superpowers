import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queueApi } from '@/shared/lib/api';
import type { ExecutorConfig, QueueStatus } from 'shared/types';

interface UseSessionQueueInteractionOptions {
  /** Session ID for queue operations */
  sessionId: string | undefined;
}

interface UseSessionQueueInteractionResult {
  /** Whether a message is currently queued */
  isQueued: boolean;
  /** The queued message content, if any */
  queuedMessage: string | null;
  /** The executor config from the queued message, if any */
  queuedConfig: ExecutorConfig | null;
  /** Whether a queue operation is in progress */
  isQueueLoading: boolean;
  /** Queue a message for later execution */
  queueMessage: (
    message: string,
    executorConfig: ExecutorConfig
  ) => Promise<void>;
  /** Cancel the queued message */
  cancelQueue: () => Promise<void>;
  /** Refresh queue status from server */
  refreshQueueStatus: () => Promise<void>;
}

const QUEUE_STATUS_KEY = 'queue-status';

/**
 * Hook to manage queue interaction for session messages.
 * Uses TanStack Query for caching and mutation handling.
 */
export function useSessionQueueInteraction({
  sessionId,
}: UseSessionQueueInteractionOptions): UseSessionQueueInteractionResult {
  const queryClient = useQueryClient();

  // Query for queue status
  const { data: queueStatus = { status: 'empty' as const }, refetch } =
    useQuery<QueueStatus>({
      queryKey: [QUEUE_STATUS_KEY, sessionId],
      queryFn: () => queueApi.getStatus(sessionId!),
      enabled: !!sessionId,
    });

  const isQueued = queueStatus.status === 'queued';
  const queuedMessageData = isQueued
    ? (queueStatus as Extract<QueueStatus, { status: 'queued' }>).message
    : null;
  const queuedMessage = queuedMessageData?.data.message ?? null;
  const queuedConfig: ExecutorConfig | null =
    queuedMessageData?.data.executor_config ?? null;

  // Mutation for queueing a message
  const queueMutation = useMutation({
    mutationFn: ({
      message,
      executorConfig,
    }: {
      message: string;
      executorConfig: ExecutorConfig;
    }) =>
      queueApi.queue(sessionId!, {
        message,
        executor_config: executorConfig,
      }),
    onSuccess: (status) => {
      queryClient.setQueryData([QUEUE_STATUS_KEY, sessionId], status);
    },
  });

  // Mutation for cancelling the queue
  const cancelMutation = useMutation({
    mutationFn: () => queueApi.cancel(sessionId!),
    onSuccess: (status) => {
      queryClient.setQueryData([QUEUE_STATUS_KEY, sessionId], status);
    },
  });

  const queueMessage = useCallback(
    async (message: string, executorConfig: ExecutorConfig) => {
      if (!sessionId) return;
      await queueMutation.mutateAsync({
        message,
        executorConfig,
      });
    },
    [sessionId, queueMutation]
  );

  const cancelQueue = useCallback(async () => {
    if (!sessionId) return;
    await cancelMutation.mutateAsync();
  }, [sessionId, cancelMutation]);

  const refreshQueueStatus = useCallback(async () => {
    if (!sessionId) return;
    await refetch();
  }, [sessionId, refetch]);

  return {
    isQueued,
    queuedMessage,
    queuedConfig,
    isQueueLoading: queueMutation.isPending || cancelMutation.isPending,
    queueMessage,
    cancelQueue,
    refreshQueueStatus,
  };
}
