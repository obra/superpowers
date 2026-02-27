import React, { useCallback, useMemo, useState } from 'react';
import { useExecutionProcessesContext } from '@/shared/hooks/useExecutionProcessesContext';
import {
  RetryUiContext,
  type RetryUiContextType,
} from '@/shared/hooks/useRetryUi';

export function RetryUiProvider({
  children,
}: {
  attemptId?: string;
  children: React.ReactNode;
}) {
  const { executionProcessesAll: executionProcesses } =
    useExecutionProcessesContext();

  const [activeRetryProcessId, setActiveRetryProcessId] = useState<
    string | null
  >(null);

  const processOrder = useMemo(() => {
    const order: Record<string, number> = {};
    executionProcesses.forEach((p, idx) => {
      order[p.id] = idx;
    });
    return order;
  }, [executionProcesses]);

  const isProcessGreyed = useCallback(
    (processId?: string) => {
      if (!activeRetryProcessId || !processId) return false;
      const activeOrder = processOrder[activeRetryProcessId];
      const thisOrder = processOrder[processId];
      // Grey out processes that come AFTER the retry target
      return thisOrder > activeOrder;
    },
    [activeRetryProcessId, processOrder]
  );

  const value: RetryUiContextType = {
    activeRetryProcessId,
    setActiveRetryProcessId,
    processOrder,
    isProcessGreyed,
  };

  return (
    <RetryUiContext.Provider value={value}>{children}</RetryUiContext.Provider>
  );
}
