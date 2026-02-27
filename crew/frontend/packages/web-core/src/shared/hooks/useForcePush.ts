import { useMutation, useQueryClient } from '@tanstack/react-query';
import { attemptsApi } from '@/shared/lib/api';
import type { PushError, PushTaskAttemptRequest } from 'shared/types';

class ForcePushErrorWithData extends Error {
  constructor(
    message: string,
    public errorData?: PushError
  ) {
    super(message);
    this.name = 'ForcePushErrorWithData';
  }
}

export function useForcePush(
  attemptId?: string,
  onSuccess?: () => void,
  onError?: (err: unknown, errorData?: PushError) => void
) {
  const queryClient = useQueryClient();

  return useMutation<void, unknown, PushTaskAttemptRequest>({
    mutationFn: async (params: PushTaskAttemptRequest) => {
      if (!attemptId) return;
      const result = await attemptsApi.forcePush(attemptId, params);
      if (!result.success) {
        throw new ForcePushErrorWithData(
          result.message || 'Force push failed',
          result.error
        );
      }
    },
    onSuccess: () => {
      // A force push affects remote status; invalidate the same branchStatus
      queryClient.invalidateQueries({ queryKey: ['branchStatus', attemptId] });
      onSuccess?.();
    },
    onError: (err) => {
      console.error('Failed to force push:', err);
      const errorData =
        err instanceof ForcePushErrorWithData ? err.errorData : undefined;
      onError?.(err, errorData);
    },
  });
}
