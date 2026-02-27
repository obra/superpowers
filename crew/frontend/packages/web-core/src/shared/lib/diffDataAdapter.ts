import {
  parseDiffFromFile,
  type FileContents,
  type FileDiffMetadata,
  type ChangeTypes,
  type DiffLineAnnotation,
  type AnnotationSide,
} from '@pierre/diffs';
import type { Diff, DiffChangeKind } from 'shared/types';
import type { ReviewComment } from '@/shared/hooks/useReview';
import type { NormalizedGitHubComment } from '@/shared/hooks/useWorkspaceContext';
import { DiffSide } from '@/shared/types/diff';

/**
 * Discriminated union type for comment annotations.
 * Allows the diff viewer to distinguish between user review comments
 * and GitHub PR comments.
 */
export type CommentAnnotation =
  | { type: 'review'; comment: ReviewComment }
  | { type: 'github'; comment: NormalizedGitHubComment };

/**
 * Maps vibe-kanban's DiffChangeKind to pierre/diffs ChangeTypes.
 *
 * Mapping:
 * - 'added' → 'new'
 * - 'deleted' → 'deleted'
 * - 'modified' → 'change'
 * - 'renamed' → 'rename-pure' or 'rename-changed' (based on content diff)
 * - 'copied' → 'change'
 * - 'permissionChange' → 'change'
 */
function mapChangeKindToChangeType(
  kind: DiffChangeKind,
  oldContent: string | null,
  newContent: string | null
): ChangeTypes {
  switch (kind) {
    case 'added':
      return 'new';
    case 'deleted':
      return 'deleted';
    case 'modified':
      return 'change';
    case 'renamed':
      // Check if content differs for renamed files
      return oldContent === newContent ? 'rename-pure' : 'rename-changed';
    case 'copied':
      return 'change';
    case 'permissionChange':
      return 'change';
    default:
      return 'change';
  }
}

/**
 * Maps DiffSide (0 = old, 1 = new) to pierre/diffs AnnotationSide.
 */
function mapSideToAnnotationSide(side: DiffSide): AnnotationSide {
  return side === DiffSide.Old ? 'deletions' : 'additions';
}

/**
 * Extracts the file path from a Diff, preferring newPath for most cases.
 */
function getFilePath(diff: Diff): string {
  return diff.newPath ?? diff.oldPath ?? 'unknown';
}

/**
 * Transforms a vibe-kanban Diff to pierre/diffs FileDiffMetadata.
 *
 * Uses parseDiffFromFile from @pierre/diffs to generate the diff metadata
 * from old and new file contents.
 *
 * @param diff - The vibe-kanban Diff object
 * @returns FileDiffMetadata for use with pierre/diffs components
 */
export function transformDiffToFileDiffMetadata(
  diff: Diff,
  options?: { ignoreWhitespace?: boolean }
): FileDiffMetadata {
  const filePath = getFilePath(diff);

  // Handle contentOmitted case - create placeholder metadata
  if (diff.contentOmitted) {
    const changeType = mapChangeKindToChangeType(
      diff.change,
      diff.oldContent,
      diff.newContent
    );

    return {
      name: filePath,
      prevName:
        diff.oldPath !== diff.newPath ? (diff.oldPath ?? undefined) : undefined,
      type: changeType,
      hunks: [],
      splitLineCount: 0,
      unifiedLineCount: 0,
    };
  }

  // Prepare file contents for parseDiffFromFile
  const oldFile: FileContents = {
    name: diff.oldPath ?? filePath,
    contents: diff.oldContent ?? '',
  };

  const newFile: FileContents = {
    name: filePath,
    contents: diff.newContent ?? '',
  };

  // Use pierre/diffs parser to generate diff metadata
  const metadata = parseDiffFromFile(
    oldFile,
    newFile,
    options?.ignoreWhitespace ? { ignoreWhitespace: true } : undefined
  );

  // Override the type based on our DiffChangeKind mapping
  // parseDiffFromFile may not correctly detect renames/copies
  const changeType = mapChangeKindToChangeType(
    diff.change,
    diff.oldContent,
    diff.newContent
  );

  return {
    ...metadata,
    type: changeType,
    prevName:
      diff.oldPath !== diff.newPath ? (diff.oldPath ?? undefined) : undefined,
  };
}

/**
 * Creates a unique key for a comment based on file path, line number, and side.
 * Used for deduplication.
 */
function createCommentKey(
  filePath: string,
  lineNumber: number,
  side: DiffSide
): string {
  return `${filePath}:${lineNumber}:${side}`;
}

/**
 * Transforms review comments and GitHub comments into pierre/diffs annotations.
 *
 * Implements deduplication: if both a user review comment and a GitHub comment
 * exist on the same line/side, only the user review comment is included.
 *
 * @param comments - User review comments from ReviewProvider
 * @param githubComments - Normalized GitHub PR comments
 * @param filePath - The file path to filter comments for
 * @returns Array of DiffLineAnnotation with CommentAnnotation metadata
 */
export function transformCommentsToAnnotations(
  comments: ReviewComment[],
  githubComments: NormalizedGitHubComment[],
  filePath: string
): DiffLineAnnotation<CommentAnnotation>[] {
  const annotations: DiffLineAnnotation<CommentAnnotation>[] = [];
  const occupiedKeys = new Set<string>();

  // First, add all user review comments (they take priority)
  for (const comment of comments) {
    if (comment.filePath !== filePath) continue;

    const key = createCommentKey(
      comment.filePath,
      comment.lineNumber,
      comment.side
    );
    occupiedKeys.add(key);

    annotations.push({
      side: mapSideToAnnotationSide(comment.side),
      lineNumber: comment.lineNumber,
      metadata: {
        type: 'review',
        comment,
      },
    });
  }

  // Then, add GitHub comments only if no user comment exists on that line/side
  for (const ghComment of githubComments) {
    // Handle path matching - GitHub paths may not have repo prefix
    const pathMatches =
      ghComment.filePath === filePath ||
      filePath.endsWith('/' + ghComment.filePath);

    if (!pathMatches) continue;

    const key = createCommentKey(
      ghComment.filePath,
      ghComment.lineNumber,
      ghComment.side
    );

    // Skip if user already has a comment on this line/side
    if (occupiedKeys.has(key)) continue;

    annotations.push({
      side: mapSideToAnnotationSide(ghComment.side),
      lineNumber: ghComment.lineNumber,
      metadata: {
        type: 'github',
        comment: ghComment,
      },
    });
  }

  return annotations;
}
