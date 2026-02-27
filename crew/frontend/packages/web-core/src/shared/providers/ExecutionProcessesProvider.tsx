import React, { useMemo } from 'react';
import { useExecutionProcesses } from '@/shared/hooks/useExecutionProcesses';
import type { ExecutionProcess } from 'shared/types';
import {
  ExecutionProcessesContext,
  type ExecutionProcessesContextType,
} from '@/shared/hooks/useExecutionProcessesContext';

export const ExecutionProcessesProvider: React.FC<{
  sessionId?: string | undefined;
  children: React.ReactNode;
}> = ({ sessionId, children }) => {
  const {
    executionProcesses,
    executionProcessesById,
    isAttemptRunning,
    isLoading,
    isConnected,
    error,
  } = useExecutionProcesses(sessionId, { showSoftDeleted: true });

  // Filter out dropped processes (server already filters by session)
  const visible = useMemo(() => {
    return executionProcesses.filter((p) => !p.dropped);
  }, [executionProcesses]);

  const executionProcessesByIdVisible = useMemo(() => {
    const m: Record<string, ExecutionProcess> = {};
    for (const p of visible) m[p.id] = p;
    return m;
  }, [visible]);

  const isAttemptRunningVisible = useMemo(
    () =>
      visible.some(
        (process) =>
          (process.run_reason === 'codingagent' ||
            process.run_reason === 'setupscript' ||
            process.run_reason === 'cleanupscript' ||
            process.run_reason === 'archivescript') &&
          process.status === 'running'
      ),
    [visible]
  );

  const value = useMemo<ExecutionProcessesContextType>(
    () => ({
      executionProcessesAll: executionProcesses,
      executionProcessesByIdAll: executionProcessesById,
      isAttemptRunningAll: isAttemptRunning,
      executionProcessesVisible: visible,
      executionProcessesByIdVisible,
      isAttemptRunningVisible,
      isLoading,
      isConnected,
      error,
    }),
    [
      executionProcesses,
      executionProcessesById,
      isAttemptRunning,
      visible,
      executionProcessesByIdVisible,
      isAttemptRunningVisible,
      isLoading,
      isConnected,
      error,
    ]
  );

  return (
    <ExecutionProcessesContext.Provider value={value}>
      {children}
    </ExecutionProcessesContext.Provider>
  );
};
