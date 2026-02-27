import { useMemo } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { attemptsApi, executionProcessesApi } from '@/shared/lib/api';
import { useAttemptExecution } from '@/shared/hooks/useAttemptExecution';
import {
  filterRunningDevServers,
  filterDevServerProcesses,
  deduplicateDevServersByWorkingDir,
} from '@/shared/lib/devServerUtils';
import { workspaceSummaryKeys } from '@/shared/hooks/workspaceSummaryKeys';

interface UsePreviewDevServerOptions {
  onStartSuccess?: () => void;
  onStartError?: (err: unknown) => void;
  onStopSuccess?: () => void;
  onStopError?: (err: unknown) => void;
}

export function usePreviewDevServer(
  attemptId: string | undefined,
  options?: UsePreviewDevServerOptions
) {
  const queryClient = useQueryClient();
  const { attemptData } = useAttemptExecution(attemptId);

  const runningDevServers = useMemo(
    () => filterRunningDevServers(attemptData.processes),
    [attemptData.processes]
  );

  const devServerProcesses = useMemo(
    () =>
      deduplicateDevServersByWorkingDir(
        filterDevServerProcesses(attemptData.processes)
      ),
    [attemptData.processes]
  );

  const startMutation = useMutation({
    mutationKey: ['startDevServer', attemptId],
    mutationFn: async () => {
      if (!attemptId) return;
      await attemptsApi.startDevServer(attemptId);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['executionProcesses', attemptId],
      });
      queryClient.invalidateQueries({ queryKey: workspaceSummaryKeys.all });
      options?.onStartSuccess?.();
    },
    onError: (err) => {
      console.error('Failed to start dev server:', err);
      options?.onStartError?.(err);
    },
  });

  const stopMutation = useMutation({
    mutationKey: ['stopDevServer', attemptId],
    mutationFn: async () => {
      if (runningDevServers.length === 0) return;
      await Promise.all(
        runningDevServers.map((ds) =>
          executionProcessesApi.stopExecutionProcess(ds.id)
        )
      );
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['executionProcesses', attemptId],
      });
      for (const ds of runningDevServers) {
        queryClient.invalidateQueries({
          queryKey: ['processDetails', ds.id],
        });
      }
      queryClient.invalidateQueries({ queryKey: workspaceSummaryKeys.all });
      options?.onStopSuccess?.();
    },
    onError: (err) => {
      console.error('Failed to stop dev server:', err);
      options?.onStopError?.(err);
    },
  });

  return {
    start: startMutation.mutate,
    stop: stopMutation.mutate,
    isStarting: startMutation.isPending,
    isStopping: stopMutation.isPending,
    runningDevServers,
    devServerProcesses,
  };
}
