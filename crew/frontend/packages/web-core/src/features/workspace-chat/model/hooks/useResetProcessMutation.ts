import { useMutation } from '@tanstack/react-query';
import { sessionsApi } from '@/shared/lib/api';
import {
  RestoreLogsDialog,
  type RestoreLogsDialogResult,
} from '@/shared/dialogs/tasks/RestoreLogsDialog';
import type { RepoBranchStatus, ExecutionProcess } from 'shared/types';

export interface ResetProcessParams {
  executionProcessId: string;
  branchStatus: RepoBranchStatus[] | undefined;
  processes: ExecutionProcess[] | undefined;
}

class ResetDialogCancelledError extends Error {
  constructor() {
    super('Reset dialog was cancelled');
    this.name = 'ResetDialogCancelledError';
  }
}

export function useResetProcessMutation(
  sessionId: string,
  onSuccess?: () => void,
  onError?: (err: unknown) => void
) {
  return useMutation({
    mutationKey: ['reset-process', sessionId],
    mutationFn: async ({
      executionProcessId,
      branchStatus,
      processes,
    }: ResetProcessParams) => {
      let modalResult: RestoreLogsDialogResult | undefined;
      try {
        modalResult = await RestoreLogsDialog.show({
          executionProcessId,
          branchStatus,
          processes,
          mode: 'reset',
        });
      } catch {
        throw new ResetDialogCancelledError();
      }
      if (!modalResult || modalResult.action !== 'confirmed') {
        throw new ResetDialogCancelledError();
      }

      await sessionsApi.reset(sessionId, {
        process_id: executionProcessId,
        force_when_dirty: modalResult.forceWhenDirty ?? false,
        perform_git_reset: modalResult.performGitReset ?? true,
      });
    },
    onSuccess: () => {
      onSuccess?.();
    },
    onError: (err) => {
      if (err instanceof ResetDialogCancelledError) {
        return;
      }
      console.error('Failed to reset process:', err);
      onError?.(err);
    },
  });
}

export { ResetDialogCancelledError };
