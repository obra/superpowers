import { useMutation, useQueryClient } from '@tanstack/react-query';
import { attemptsApi } from '@/shared/lib/api';
import { repoBranchKeys } from '@/shared/hooks/useRepoBranches';

type MergeParams = {
  repoId: string;
};

export function useMerge(
  attemptId?: string,
  onSuccess?: () => void,
  onError?: (err: unknown) => void
) {
  const queryClient = useQueryClient();

  return useMutation<void, unknown, MergeParams>({
    mutationFn: (params: MergeParams) => {
      if (!attemptId) return Promise.resolve();
      return attemptsApi.merge(attemptId, {
        repo_id: params.repoId,
      });
    },
    onSuccess: () => {
      // Refresh attempt-specific branch information
      queryClient.invalidateQueries({ queryKey: ['branchStatus', attemptId] });

      // Invalidate all repo branches queries
      queryClient.invalidateQueries({ queryKey: repoBranchKeys.all });

      onSuccess?.();
    },
    onError: (err) => {
      console.error('Failed to merge:', err);
      onError?.(err);
    },
  });
}
