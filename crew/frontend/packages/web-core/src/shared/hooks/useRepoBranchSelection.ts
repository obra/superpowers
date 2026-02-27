import { useState, useMemo, useCallback } from 'react';
import { useQueries } from '@tanstack/react-query';
import { repoApi } from '@/shared/lib/api';
import { repoBranchKeys } from '@/shared/hooks/useRepoBranches';
import type { GitBranch, Repo } from 'shared/types';

export type RepoBranchConfig = {
  repoId: string;
  repoDisplayName: string;
  targetBranch: string | null;
  branches: GitBranch[];
};

type UseRepoBranchSelectionOptions = {
  repos: Repo[];
  initialBranch?: string | null;
  enabled?: boolean;
};

type UseRepoBranchSelectionReturn = {
  configs: RepoBranchConfig[];
  isLoading: boolean;
  setRepoBranch: (repoId: string, branch: string) => void;
  getWorkspaceRepoInputs: () => Array<{
    repo_id: string;
    target_branch: string;
  }>;
  reset: () => void;
};

export function useRepoBranchSelection({
  repos,
  initialBranch,
  enabled = true,
}: UseRepoBranchSelectionOptions): UseRepoBranchSelectionReturn {
  const [userOverrides, setUserOverrides] = useState<
    Record<string, string | null>
  >({});

  const queries = useQueries({
    queries: repos.map((repo) => ({
      queryKey: repoBranchKeys.byRepo(repo.id),
      queryFn: () => repoApi.getBranches(repo.id),
      enabled,
      staleTime: 60_000,
    })),
  });

  const isLoadingBranches = queries.some((q) => q.isLoading);

  const configs = useMemo((): RepoBranchConfig[] => {
    return repos.map((repo, i) => {
      const branches = queries[i]?.data ?? [];

      let targetBranch: string | null = userOverrides[repo.id] ?? null;

      if (targetBranch === null) {
        if (initialBranch && branches.some((b) => b.name === initialBranch)) {
          targetBranch = initialBranch;
        } else if (
          repo.default_target_branch &&
          branches.some((b) => b.name === repo.default_target_branch)
        ) {
          targetBranch = repo.default_target_branch;
        } else {
          const currentBranch = branches.find((b) => b.is_current);
          targetBranch = currentBranch?.name ?? branches[0]?.name ?? null;
        }
      }

      return {
        repoId: repo.id,
        repoDisplayName: repo.display_name,
        targetBranch,
        branches,
      };
    });
  }, [repos, queries, userOverrides, initialBranch]);

  const setRepoBranch = useCallback((repoId: string, branch: string) => {
    setUserOverrides((prev) => ({
      ...prev,
      [repoId]: branch,
    }));
  }, []);

  const reset = useCallback(() => {
    setUserOverrides({});
  }, []);

  const getWorkspaceRepoInputs = useCallback(() => {
    return configs
      .filter((config) => config.targetBranch !== null)
      .map((config) => ({
        repo_id: config.repoId,
        target_branch: config.targetBranch!,
      }));
  }, [configs]);

  return {
    configs,
    isLoading: isLoadingBranches,
    setRepoBranch,
    getWorkspaceRepoInputs,
    reset,
  };
}
