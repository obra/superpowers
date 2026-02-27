import { useContext } from 'react';
import { createHmrContext } from '@/shared/lib/hmrContext';

export type RetryUiContextType = {
  activeRetryProcessId: string | null;
  setActiveRetryProcessId: (processId: string | null) => void;
  processOrder: Record<string, number>;
  isProcessGreyed: (processId?: string) => boolean;
};

export const RetryUiContext = createHmrContext<RetryUiContextType | null>(
  'RetryUiContext',
  null
);

export function useRetryUi() {
  const ctx = useContext(RetryUiContext);
  if (!ctx)
    return {
      activeRetryProcessId: null,
      setActiveRetryProcessId: () => {},
      processOrder: {},
      isProcessGreyed: () => false,
    } as RetryUiContextType;
  return ctx;
}
