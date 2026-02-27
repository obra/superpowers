import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { attemptsApi } from '@/shared/lib/api';

export function useAttemptConflicts(attemptId?: string, repoId?: string) {
  const queryClient = useQueryClient();

  const abortConflicts = useCallback(async () => {
    if (!attemptId || !repoId) return;
    await attemptsApi.abortConflicts(attemptId, { repo_id: repoId });
    await queryClient.invalidateQueries({
      queryKey: ['branchStatus', attemptId],
    });
  }, [attemptId, repoId, queryClient]);

  return { abortConflicts } as const;
}
