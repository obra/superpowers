import { useQuery } from '@tanstack/react-query';
import { attemptsApi } from '@/shared/lib/api';

export function useAttemptBranch(attemptId?: string) {
  const query = useQuery({
    queryKey: ['attemptBranch', attemptId],
    queryFn: async () => {
      const attempt = await attemptsApi.get(attemptId!);
      return attempt.branch ?? null;
    },
    enabled: !!attemptId,
  });

  return {
    branch: query.data ?? null,
    isLoading: query.isLoading,
    refetch: query.refetch,
  } as const;
}
