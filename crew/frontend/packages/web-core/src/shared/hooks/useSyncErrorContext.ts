import { useContext } from 'react';
import { createHmrContext } from '@/shared/lib/hmrContext';
import type { SyncError } from '@/shared/lib/electric/types';

export interface StreamError {
  streamId: string;
  tableName: string;
  error: SyncError;
  retry: () => void;
}

export interface SyncErrorContextValue {
  errors: StreamError[];
  hasErrors: boolean;
  registerError: (
    streamId: string,
    tableName: string,
    error: SyncError,
    retry: () => void
  ) => void;
  clearError: (streamId: string) => void;
  retryAll: () => void;
}

export const SyncErrorContext = createHmrContext<SyncErrorContextValue | null>(
  'SyncErrorContext',
  null
);

export function useSyncErrorContext(): SyncErrorContextValue | null {
  return useContext(SyncErrorContext);
}

export function useSyncErrorContextRequired(): SyncErrorContextValue {
  const context = useContext(SyncErrorContext);
  if (!context) {
    throw new Error(
      'useSyncErrorContextRequired must be used within a SyncErrorProvider'
    );
  }
  return context;
}
