import { useMemo, useCallback } from 'react';
import { usePrComments } from '@/shared/hooks/usePrComments';
import {
  usePersistedExpanded,
  PERSIST_KEYS,
} from '@/shared/stores/useUiPreferencesStore';
import type { UnifiedPrComment } from 'shared/types';
import { DiffSide } from '@/shared/types/diff';

import type { NormalizedGitHubComment } from '@/shared/hooks/useWorkspaceContext';

interface UseGitHubCommentsOptions {
  workspaceId?: string;
  repoId?: string;
  enabled?: boolean;
}

interface UseGitHubCommentsResult {
  gitHubComments: UnifiedPrComment[];
  isGitHubCommentsLoading: boolean;
  showGitHubComments: boolean;
  setShowGitHubComments: (show: boolean) => void;
  getGitHubCommentsForFile: (filePath: string) => NormalizedGitHubComment[];
  getGitHubCommentCountForFile: (filePath: string) => number;
  getFilesWithGitHubComments: () => string[];
  getFirstCommentLineForFile: (filePath: string) => number | null;
}

export function useGitHubComments({
  workspaceId,
  repoId,
  enabled = true,
}: UseGitHubCommentsOptions): UseGitHubCommentsResult {
  // GitHub comments toggle state (persisted)
  const [showGitHubComments, setShowGitHubComments] = usePersistedExpanded(
    PERSIST_KEYS.showGitHubComments,
    true // Default to shown
  );

  // Fetch PR comments for the current workspace
  const { data: prCommentsData, isLoading: isGitHubCommentsLoading } =
    usePrComments(workspaceId, repoId, {
      enabled: enabled && !!repoId,
    });

  const gitHubComments = useMemo(
    () => prCommentsData?.comments ?? [],
    [prCommentsData?.comments]
  );

  // Normalize GitHub review comments for file matching
  const normalizedComments = useMemo(() => {
    const normalized: NormalizedGitHubComment[] = [];
    for (const comment of gitHubComments) {
      if (comment.comment_type !== 'review') continue;
      if (comment.line === null) continue; // Skip file-level comments

      normalized.push({
        id: String(comment.id),
        author: comment.author,
        body: comment.body,
        createdAt: comment.created_at,
        url: comment.url,
        filePath: comment.path,
        lineNumber: Number(comment.line),
        // Use side from API: "LEFT" = old/deleted side, "RIGHT" = new/added side (default)
        side: comment.side === 'LEFT' ? DiffSide.Old : DiffSide.New,
        diffHunk: comment.diff_hunk,
      });
    }
    return normalized;
  }, [gitHubComments]);

  // Helper to match paths - handles repo prefix in diff paths
  // GitHub paths: "packages/web-core/src/file.ts"
  // Diff paths: "vibe-kanban/packages/web-core/src/file.ts" (repo name prefixed)
  const pathMatches = useCallback(
    (diffPath: string, githubPath: string): boolean => {
      return diffPath === githubPath || diffPath.endsWith('/' + githubPath);
    },
    []
  );

  // Get comments for a specific file (handles prefixed paths)
  const getGitHubCommentsForFile = useCallback(
    (filePath: string): NormalizedGitHubComment[] => {
      return normalizedComments.filter((c) =>
        pathMatches(filePath, c.filePath)
      );
    },
    [normalizedComments, pathMatches]
  );

  // Get comment count for a specific file (handles prefixed paths)
  const getGitHubCommentCountForFile = useCallback(
    (filePath: string): number => {
      return normalizedComments.filter((c) => pathMatches(filePath, c.filePath))
        .length;
    },
    [normalizedComments, pathMatches]
  );

  // Get list of unique file paths that have GitHub comments
  const getFilesWithGitHubComments = useCallback((): string[] => {
    const filesSet = new Set<string>();
    for (const comment of normalizedComments) {
      filesSet.add(comment.filePath);
    }
    return Array.from(filesSet);
  }, [normalizedComments]);

  // Get the first (lowest line number) comment's line for a file
  const getFirstCommentLineForFile = useCallback(
    (filePath: string): number | null => {
      const comments = normalizedComments.filter((c) =>
        pathMatches(filePath, c.filePath)
      );
      if (comments.length === 0) return null;
      return Math.min(...comments.map((c) => c.lineNumber));
    },
    [normalizedComments, pathMatches]
  );

  return {
    gitHubComments,
    isGitHubCommentsLoading,
    showGitHubComments,
    setShowGitHubComments,
    getGitHubCommentsForFile,
    getGitHubCommentCountForFile,
    getFilesWithGitHubComments,
    getFirstCommentLineForFile,
  };
}
