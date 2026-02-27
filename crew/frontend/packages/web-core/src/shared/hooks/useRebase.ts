import { useMutation, useQueryClient } from '@tanstack/react-query';
import { attemptsApi, Result } from '@/shared/lib/api';
import type { RebaseTaskAttemptRequest } from 'shared/types';
import type { GitOperationError } from 'shared/types';
import { repoBranchKeys } from '@/shared/hooks/useRepoBranches';

export function useRebase(
  attemptId: string | undefined,
  repoId: string | undefined,
  onSuccess?: () => void,
  onError?: (err: Result<void, GitOperationError>) => void
) {
  const queryClient = useQueryClient();

  type RebaseMutationArgs = {
    repoId: string;
    newBaseBranch?: string;
    oldBaseBranch?: string;
  };

  return useMutation<void, Result<void, GitOperationError>, RebaseMutationArgs>(
    {
      mutationFn: (args) => {
        if (!attemptId) return Promise.resolve();
        const { repoId, newBaseBranch, oldBaseBranch } = args ?? {};

        const data: RebaseTaskAttemptRequest = {
          repo_id: repoId,
          old_base_branch: oldBaseBranch ?? null,
          new_base_branch: newBaseBranch ?? null,
        };

        return attemptsApi.rebase(attemptId, data).then((res) => {
          if (!res.success) {
            // Propagate typed failure Result for caller to handle (no manual ApiError construction)
            return Promise.reject(res);
          }
        });
      },
      onSuccess: () => {
        // Refresh branch status immediately
        queryClient.invalidateQueries({
          queryKey: ['branchStatus', attemptId],
        });

        // Invalidate taskAttempt query to refresh attempt.target_branch
        queryClient.invalidateQueries({
          queryKey: ['taskAttempt', attemptId],
        });

        // Refresh repos to update target_branch in RepoCard
        queryClient.invalidateQueries({
          queryKey: ['attemptRepo', attemptId],
        });

        // Refresh branch list
        if (repoId) {
          queryClient.invalidateQueries({
            queryKey: repoBranchKeys.byRepo(repoId),
          });
        }

        onSuccess?.();
      },
      onError: (err: Result<void, GitOperationError>) => {
        console.error('Failed to rebase:', err);
        // Even on failure (likely conflicts), re-fetch branch status immediately to show rebase-in-progress
        queryClient.invalidateQueries({
          queryKey: ['branchStatus', attemptId],
        });
        onError?.(err);
      },
    }
  );
}
