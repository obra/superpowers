import { useQuery } from '@tanstack/react-query';
import { attemptsApi, sessionsApi } from '@/shared/lib/api';
import type { Workspace } from 'shared/types';
import type { WorkspaceWithSession } from '@/shared/types/attempt';
import { createWorkspaceWithSession } from '@/shared/types/attempt';

export const taskAttemptKeys = {
  all: ['taskAttempts'] as const,
  byTask: (taskId: string | undefined) => ['taskAttempts', taskId] as const,
  byTaskWithSessions: (taskId: string | undefined) =>
    ['taskAttemptsWithSessions', taskId] as const,
};

type Options = {
  enabled?: boolean;
  refetchInterval?: number | false;
};

export function useTaskAttempts(taskId?: string, opts?: Options) {
  const enabled = (opts?.enabled ?? true) && !!taskId;
  const refetchInterval = opts?.refetchInterval ?? 5000;

  return useQuery<Workspace[]>({
    queryKey: taskAttemptKeys.byTask(taskId),
    queryFn: () => attemptsApi.getAll(taskId!),
    enabled,
    refetchInterval,
  });
}

/**
 * Hook for components that need session data for all attempts.
 * Fetches all attempts and their sessions in parallel.
 */
export function useTaskAttemptsWithSessions(taskId?: string, opts?: Options) {
  const enabled = (opts?.enabled ?? true) && !!taskId;
  const refetchInterval = opts?.refetchInterval ?? 5000;

  return useQuery<WorkspaceWithSession[]>({
    queryKey: taskAttemptKeys.byTaskWithSessions(taskId),
    queryFn: async () => {
      const attempts = await attemptsApi.getAll(taskId!);
      // Fetch sessions for all attempts in parallel
      const sessionsResults = await Promise.all(
        attempts.map((attempt) => sessionsApi.getByWorkspace(attempt.id))
      );
      return attempts.map((attempt, i) => {
        const session = sessionsResults[i][0];
        return createWorkspaceWithSession(attempt, session);
      });
    },
    enabled,
    refetchInterval,
  });
}
