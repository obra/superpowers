import { useCallback, useMemo } from 'react';
import { useExecutionProcessesContext } from '@/shared/hooks/useExecutionProcessesContext';
import { useWorkspaceContext } from '@/shared/hooks/useWorkspaceContext';
import { useBranchStatus } from '@/shared/hooks/useBranchStatus';
import { isCodingAgent } from '@/shared/constants/processes';
import { useResetProcessMutation } from './useResetProcessMutation';

export interface UseResetProcessResult {
  resetProcess: (executionProcessId: string) => void;
  canResetProcess: (executionProcessId: string) => boolean;
  isResetPending: boolean;
}

export function useResetProcess(): UseResetProcessResult {
  const { workspaceId, selectedSessionId } = useWorkspaceContext();
  const { data: branchStatus } = useBranchStatus(workspaceId);
  const { executionProcessesAll: processes } = useExecutionProcessesContext();

  const resetMutation = useResetProcessMutation(selectedSessionId ?? '');
  const isResetPending = resetMutation.isPending;

  const firstCodingProcessId = useMemo(
    () =>
      processes.find(
        (process) => !process.dropped && isCodingAgent(process.run_reason)
      )?.id,
    [processes]
  );

  const canResetProcess = useCallback(
    (executionProcessId: string) =>
      !!firstCodingProcessId && executionProcessId !== firstCodingProcessId,
    [firstCodingProcessId]
  );

  const resetProcess = useCallback(
    (executionProcessId: string) => {
      if (!selectedSessionId) return;
      resetMutation.mutate({
        executionProcessId,
        branchStatus,
        processes,
      });
    },
    [branchStatus, processes, resetMutation, selectedSessionId]
  );

  return useMemo(
    () => ({
      resetProcess,
      canResetProcess,
      isResetPending,
    }),
    [resetProcess, canResetProcess, isResetPending]
  );
}
