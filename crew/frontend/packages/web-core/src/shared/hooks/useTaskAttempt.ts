import { useQuery } from '@tanstack/react-query';
import { attemptsApi } from '@/shared/lib/api';
import type { WorkspaceWithSession } from '@/shared/types/attempt';

export function useTaskAttempt(attemptId?: string) {
  return useQuery({
    queryKey: ['taskAttempt', attemptId],
    queryFn: () => attemptsApi.get(attemptId!),
    enabled: !!attemptId,
  });
}

/**
 * Hook for components that need executor field (e.g., for capability checks).
 * Fetches workspace with executor from latest session.
 */
export function useTaskAttemptWithSession(attemptId?: string) {
  return useQuery<WorkspaceWithSession>({
    queryKey: ['taskAttemptWithSession', attemptId],
    queryFn: () => attemptsApi.getWithSession(attemptId!),
    enabled: !!attemptId,
  });
}
