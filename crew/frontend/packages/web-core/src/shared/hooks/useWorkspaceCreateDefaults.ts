import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { ExecutorConfig, RepoWithTargetBranch } from 'shared/types';
import { attemptsApi } from '@/shared/lib/api';
import { useExecutionProcesses } from '@/shared/hooks/useExecutionProcesses';
import { getLatestConfigFromProcesses } from '@/shared/lib/executor';

interface UseWorkspaceCreateDefaultsOptions {
  sourceWorkspaceId: string | null;
  enabled: boolean;
}

interface WorkspaceCreateDefaultsData {
  repos: RepoWithTargetBranch[];
  sourceSessionId: string | undefined;
  sourceSessionExecutor: ExecutorConfig['executor'] | null;
}

interface UseWorkspaceCreateDefaultsResult {
  preferredRepos: RepoWithTargetBranch[];
  preferredExecutorConfig: ExecutorConfig | null;
  hasResolvedPreferredRepos: boolean;
}

export function useWorkspaceCreateDefaults({
  sourceWorkspaceId,
  enabled,
}: UseWorkspaceCreateDefaultsOptions): UseWorkspaceCreateDefaultsResult {
  const queryEnabled = enabled && !!sourceWorkspaceId;

  const { data, status } = useQuery<WorkspaceCreateDefaultsData>({
    queryKey: ['workspaceCreateDefaults', sourceWorkspaceId],
    enabled: queryEnabled,
    staleTime: 0,
    refetchOnMount: 'always',
    queryFn: async () => {
      const [repos, workspaceWithSession] = await Promise.all([
        attemptsApi.getRepos(sourceWorkspaceId!),
        attemptsApi.getWithSession(sourceWorkspaceId!),
      ]);

      const result = {
        repos,
        sourceSessionId: workspaceWithSession.session?.id ?? undefined,
        sourceSessionExecutor:
          (workspaceWithSession.session
            ?.executor as ExecutorConfig['executor']) ?? null,
      };
      return result;
    },
  });

  const { executionProcesses } = useExecutionProcesses(data?.sourceSessionId);

  const preferredExecutorConfig = useMemo(() => {
    const fromProcesses = getLatestConfigFromProcesses(executionProcesses);
    if (fromProcesses) return fromProcesses;
    if (data?.sourceSessionExecutor) {
      return { executor: data.sourceSessionExecutor };
    }
    return null;
  }, [executionProcesses, data?.sourceSessionExecutor]);

  return {
    preferredRepos: data?.repos ?? [],
    preferredExecutorConfig,
    hasResolvedPreferredRepos: !queryEnabled || status !== 'pending',
  };
}
