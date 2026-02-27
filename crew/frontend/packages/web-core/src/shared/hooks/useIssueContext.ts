import { useContext } from 'react';
import { createHmrContext } from '@/shared/lib/hmrContext';
import type { InsertResult, MutationResult } from '@/shared/lib/electric/types';
import type {
  IssueComment,
  IssueCommentReaction,
  CreateIssueCommentRequest,
  UpdateIssueCommentRequest,
  CreateIssueCommentReactionRequest,
} from 'shared/remote-types';
import type { SyncError } from '@/shared/lib/electric/types';

export interface IssueContextValue {
  issueId: string;

  // Normalized data arrays (Electric syncs only this issue's data)
  comments: IssueComment[];
  reactions: IssueCommentReaction[];

  // Loading/error state
  isLoading: boolean;
  error: SyncError | null;
  retry: () => void;

  // Comment mutations
  insertComment: (
    data: CreateIssueCommentRequest
  ) => InsertResult<IssueComment>;
  updateComment: (
    id: string,
    changes: Partial<UpdateIssueCommentRequest>
  ) => MutationResult;
  removeComment: (id: string) => MutationResult;

  // Reaction mutations
  insertReaction: (
    data: CreateIssueCommentReactionRequest
  ) => InsertResult<IssueCommentReaction>;
  removeReaction: (id: string) => MutationResult;

  // Lookup helpers (within this issue's data)
  getComment: (commentId: string) => IssueComment | undefined;
  getReactionsForComment: (commentId: string) => IssueCommentReaction[];
  getReactionCountForComment: (commentId: string) => number;
  hasUserReactedToComment: (
    commentId: string,
    userId: string,
    emoji: string
  ) => boolean;

  // Computed aggregations
  commentsById: Map<string, IssueComment>;
  reactionsByComment: Map<string, IssueCommentReaction[]>;
}

export const IssueContext = createHmrContext<IssueContextValue | null>(
  'IssueContext',
  null
);

export function useIssueContext(): IssueContextValue {
  const context = useContext(IssueContext);
  if (!context) {
    throw new Error('useIssueContext must be used within an IssueProvider');
  }
  return context;
}

export function useIssueContextOptional(): IssueContextValue | null {
  return useContext(IssueContext);
}
