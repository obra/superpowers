import { attemptsApi } from '@/shared/lib/api';
import type { Workspace } from 'shared/remote-types';

export interface WorkspaceDefaults {
  preferredRepos: Array<{ repo_id: string; target_branch: string | null }>;
}

/**
 * Fetches workspace creation defaults from the most recent locally-existing workspace.
 * Returns null if no suitable workspace is found or if fetching fails.
 */
export async function getWorkspaceDefaults(
  remoteWorkspaces: Workspace[],
  localWorkspaceIds: Set<string>
): Promise<WorkspaceDefaults | null> {
  // Find most recent workspace that exists locally
  const mostRecent = remoteWorkspaces
    .filter(
      (w) =>
        w.local_workspace_id !== null &&
        localWorkspaceIds.has(w.local_workspace_id)
    )
    .sort(
      (a, b) =>
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    )[0];

  if (!mostRecent?.local_workspace_id) {
    return null;
  }

  try {
    const [repos] = await Promise.all([
      attemptsApi.getRepos(mostRecent.local_workspace_id),
      attemptsApi.get(mostRecent.local_workspace_id),
    ]);

    return {
      preferredRepos: repos.map((r) => ({
        repo_id: r.id,
        target_branch: r.target_branch,
      })),
    };
  } catch (err) {
    console.warn('Failed to fetch workspace defaults:', err);
    return null;
  }
}
