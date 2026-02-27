import { useMutation, useQueryClient } from '@tanstack/react-query';
import { attemptsApi } from '@/shared/lib/api';
import type { Workspace } from 'shared/types';

interface RenameBranchContext {
  previousWorkspace: Workspace | undefined;
}

export function useRenameBranch(
  attemptId?: string,
  onSuccess?: (newBranchName: string) => void,
  onError?: (err: unknown) => void
) {
  const queryClient = useQueryClient();

  return useMutation<{ branch: string }, unknown, string, RenameBranchContext>({
    mutationFn: async (newBranchName) => {
      if (!attemptId) throw new Error('Attempt id is not set');
      return attemptsApi.renameBranch(attemptId, newBranchName);
    },
    onMutate: async (newBranchName) => {
      if (!attemptId) return { previousWorkspace: undefined };

      // Cancel any outgoing refetches (use 'attempt' key to match useAttempt hook)
      await queryClient.cancelQueries({ queryKey: ['attempt', attemptId] });

      // Snapshot the previous value
      const previousWorkspace = queryClient.getQueryData<Workspace>([
        'attempt',
        attemptId,
      ]);

      // Optimistically update the cache
      queryClient.setQueryData<Workspace>(['attempt', attemptId], (old) => {
        if (!old) return old;
        return { ...old, branch: newBranchName };
      });

      // Return context with the previous value
      return { previousWorkspace };
    },
    onSuccess: (data) => {
      if (attemptId) {
        queryClient.invalidateQueries({ queryKey: ['taskAttempt', attemptId] });
        queryClient.invalidateQueries({ queryKey: ['attempt', attemptId] });
        queryClient.invalidateQueries({
          queryKey: ['attemptBranch', attemptId],
        });
        queryClient.invalidateQueries({
          queryKey: ['branchStatus', attemptId],
        });
        queryClient.invalidateQueries({ queryKey: ['taskAttempts'] });
      }
      onSuccess?.(data.branch);
    },
    onError: (err, _newBranchName, context) => {
      console.error('Failed to rename branch:', err);
      // Rollback to the previous value on error
      if (attemptId && context?.previousWorkspace) {
        queryClient.setQueryData(
          ['attempt', attemptId],
          context.previousWorkspace
        );
      }
      if (attemptId) {
        queryClient.invalidateQueries({
          queryKey: ['branchStatus', attemptId],
        });
      }
      onError?.(err);
    },
  });
}
