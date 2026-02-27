import {
  useState,
  useCallback,
  useMemo,
  useEffect,
  type ReactNode,
} from 'react';
import type { SyncError } from '@/shared/lib/electric/types';
import {
  SyncErrorContext,
  type StreamError,
  type SyncErrorContextValue,
} from '@/shared/hooks/useSyncErrorContext';

interface SyncErrorProviderProps {
  children: ReactNode;
}

export function SyncErrorProvider({ children }: SyncErrorProviderProps) {
  const [errorsMap, setErrorsMap] = useState<Map<string, StreamError>>(
    () => new Map()
  );

  const registerError = useCallback(
    (
      streamId: string,
      tableName: string,
      error: SyncError,
      retry: () => void
    ) => {
      setErrorsMap((prev) => {
        const next = new Map(prev);
        next.set(streamId, { streamId, tableName, error, retry });
        return next;
      });
    },
    []
  );

  const clearError = useCallback((streamId: string) => {
    setErrorsMap((prev) => {
      if (!prev.has(streamId)) return prev;
      const next = new Map(prev);
      next.delete(streamId);
      return next;
    });
  }, []);

  const errors = useMemo(() => Array.from(errorsMap.values()), [errorsMap]);

  const hasErrors = errors.length > 0;

  const retryAll = useCallback(() => {
    for (const streamError of errors) {
      streamError.retry();
    }
  }, [errors]);

  // Auto-retry all failed streams when tab becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && errorsMap.size > 0) {
        for (const streamError of errorsMap.values()) {
          streamError.retry();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [errorsMap]);

  const value = useMemo<SyncErrorContextValue>(
    () => ({
      errors,
      hasErrors,
      registerError,
      clearError,
      retryAll,
    }),
    [errors, hasErrors, registerError, clearError, retryAll]
  );

  return (
    <SyncErrorContext.Provider value={value}>
      {children}
    </SyncErrorContext.Provider>
  );
}
