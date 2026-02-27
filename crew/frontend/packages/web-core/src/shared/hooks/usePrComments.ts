import { useQuery } from '@tanstack/react-query';
import { attemptsApi } from '@/shared/lib/api';
import type { PrCommentsResponse } from 'shared/types';

export const prCommentsKeys = {
  all: ['prComments'] as const,
  byAttempt: (attemptId: string | undefined, repoId: string | undefined) =>
    ['prComments', attemptId, repoId] as const,
};

type Options = {
  enabled?: boolean;
};

export function usePrComments(
  attemptId?: string,
  repoId?: string,
  opts?: Options
) {
  const enabled = (opts?.enabled ?? true) && !!attemptId && !!repoId;

  return useQuery<PrCommentsResponse>({
    queryKey: prCommentsKeys.byAttempt(attemptId, repoId),
    queryFn: () => attemptsApi.getPrComments(attemptId!, repoId!),
    enabled,
    staleTime: 30_000, // Cache for 30s - comments don't change frequently
    retry: 2,
  });
}
