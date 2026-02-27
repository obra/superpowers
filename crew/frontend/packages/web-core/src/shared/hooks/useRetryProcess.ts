import { useMutation } from '@tanstack/react-query';
import { sessionsApi } from '@/shared/lib/api';
import {
  RestoreLogsDialog,
  type RestoreLogsDialogResult,
} from '@/shared/dialogs/tasks/RestoreLogsDialog';
import type {
  RepoBranchStatus,
  ExecutionProcess,
  BaseCodingAgent,
} from 'shared/types';

export interface RetryProcessParams {
  message: string;
  executor: BaseCodingAgent;
  variant: string | null;
  executionProcessId: string;
  branchStatus: RepoBranchStatus[] | undefined;
  processes: ExecutionProcess[] | undefined;
}

class RetryDialogCancelledError extends Error {
  constructor() {
    super('Retry dialog was cancelled');
    this.name = 'RetryDialogCancelledError';
  }
}

export function useRetryProcess(
  sessionId: string,
  onSuccess?: () => void,
  onError?: (err: unknown) => void
) {
  return useMutation({
    mutationFn: async ({
      message,
      executor,
      variant,
      executionProcessId,
      branchStatus,
      processes,
    }: RetryProcessParams) => {
      // Ask user for confirmation - dialog fetches its own preflight data
      let modalResult: RestoreLogsDialogResult | undefined;
      try {
        modalResult = await RestoreLogsDialog.show({
          executionProcessId,
          branchStatus,
          processes,
        });
      } catch {
        throw new RetryDialogCancelledError();
      }
      if (!modalResult || modalResult.action !== 'confirmed') {
        throw new RetryDialogCancelledError();
      }

      // Send the retry request
      await sessionsApi.followUp(sessionId, {
        prompt: message,
        executor_config: { executor, variant },
        retry_process_id: executionProcessId,
        force_when_dirty: modalResult.forceWhenDirty ?? false,
        perform_git_reset: modalResult.performGitReset ?? true,
      });
    },
    onSuccess: () => {
      onSuccess?.();
    },
    onError: (err) => {
      // Don't report cancellation as an error
      if (err instanceof RetryDialogCancelledError) {
        return;
      }
      console.error('Failed to send retry:', err);
      onError?.(err);
    },
  });
}

export { RetryDialogCancelledError };
