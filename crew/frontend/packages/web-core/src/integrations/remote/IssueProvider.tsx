import { useMemo, useCallback, type ReactNode } from 'react';
import { useShape } from '@/shared/integrations/electric/hooks';
import {
  ISSUE_COMMENTS_SHAPE,
  ISSUE_REACTIONS_SHAPE,
  ISSUE_COMMENT_MUTATION,
  ISSUE_COMMENT_REACTION_MUTATION,
  type IssueComment,
  type IssueCommentReaction,
} from 'shared/remote-types';
import {
  IssueContext,
  type IssueContextValue,
} from '@/shared/hooks/useIssueContext';

interface IssueProviderProps {
  issueId: string;
  children: ReactNode;
}

export function IssueProvider({ issueId, children }: IssueProviderProps) {
  const params = useMemo(() => ({ issue_id: issueId }), [issueId]);
  const enabled = Boolean(issueId);

  // Shape subscriptions
  const commentsResult = useShape(ISSUE_COMMENTS_SHAPE, params, {
    enabled,
    mutation: ISSUE_COMMENT_MUTATION,
  });
  const reactionsResult = useShape(ISSUE_REACTIONS_SHAPE, params, {
    enabled,
    mutation: ISSUE_COMMENT_REACTION_MUTATION,
  });

  // Combined loading state
  const isLoading = commentsResult.isLoading || reactionsResult.isLoading;

  // First error found
  const error = commentsResult.error || reactionsResult.error || null;

  // Combined retry
  const retry = useCallback(() => {
    commentsResult.retry();
    reactionsResult.retry();
  }, [commentsResult, reactionsResult]);

  // Computed Maps for O(1) lookup
  const commentsById = useMemo(() => {
    const map = new Map<string, IssueComment>();
    for (const comment of commentsResult.data) {
      map.set(comment.id, comment);
    }
    return map;
  }, [commentsResult.data]);

  const reactionsByComment = useMemo(() => {
    const map = new Map<string, IssueCommentReaction[]>();
    for (const reaction of reactionsResult.data) {
      const existing = map.get(reaction.comment_id) ?? [];
      existing.push(reaction);
      map.set(reaction.comment_id, existing);
    }
    return map;
  }, [reactionsResult.data]);

  // Lookup helpers
  const getComment = useCallback(
    (commentId: string) => commentsById.get(commentId),
    [commentsById]
  );

  const getReactionsForComment = useCallback(
    (commentId: string) => reactionsByComment.get(commentId) ?? [],
    [reactionsByComment]
  );

  const getReactionCountForComment = useCallback(
    (commentId: string) => (reactionsByComment.get(commentId) ?? []).length,
    [reactionsByComment]
  );

  const hasUserReactedToComment = useCallback(
    (commentId: string, userId: string, emoji: string) => {
      const reactions = reactionsByComment.get(commentId) ?? [];
      return reactions.some((r) => r.user_id === userId && r.emoji === emoji);
    },
    [reactionsByComment]
  );

  const value = useMemo<IssueContextValue>(
    () => ({
      issueId,

      // Data
      comments: commentsResult.data,
      reactions: reactionsResult.data,

      // Loading/error
      isLoading,
      error,
      retry,

      // Comment mutations
      insertComment: commentsResult.insert,
      updateComment: commentsResult.update,
      removeComment: commentsResult.remove,

      // Reaction mutations
      insertReaction: reactionsResult.insert,
      removeReaction: reactionsResult.remove,

      // Lookup helpers
      getComment,
      getReactionsForComment,
      getReactionCountForComment,
      hasUserReactedToComment,

      // Computed aggregations
      commentsById,
      reactionsByComment,
    }),
    [
      issueId,
      commentsResult,
      reactionsResult,
      isLoading,
      error,
      retry,
      getComment,
      getReactionsForComment,
      getReactionCountForComment,
      hasUserReactedToComment,
      commentsById,
      reactionsByComment,
    ]
  );

  return (
    <IssueContext.Provider value={value}>{children}</IssueContext.Provider>
  );
}
