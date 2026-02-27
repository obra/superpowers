import { useQuery } from '@tanstack/react-query';
import { attemptsApi } from '@/shared/lib/api';

export function useBranchStatus(attemptId?: string) {
  return useQuery({
    queryKey: ['branchStatus', attemptId],
    queryFn: () => attemptsApi.getBranchStatus(attemptId!),
    enabled: !!attemptId,
    refetchInterval: 5000,
  });
}
