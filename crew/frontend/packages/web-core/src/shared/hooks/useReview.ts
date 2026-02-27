import { useContext } from 'react';
import { createHmrContext } from '@/shared/lib/hmrContext';
import { DiffSide } from '@/shared/types/diff';

export interface ReviewComment {
  id: string;
  filePath: string;
  lineNumber: number;
  side: DiffSide;
  text: string;
  codeLine?: string;
}

export interface ReviewDraft {
  filePath: string;
  side: DiffSide;
  lineNumber: number;
  text: string;
  codeLine?: string;
}

interface ReviewContextType {
  comments: ReviewComment[];
  drafts: Record<string, ReviewDraft>;
  addComment: (comment: Omit<ReviewComment, 'id'>) => void;
  updateComment: (id: string, text: string) => void;
  deleteComment: (id: string) => void;
  clearComments: () => void;
  setDraft: (key: string, draft: ReviewDraft | null) => void;
  generateReviewMarkdown: () => string;
}

export const ReviewContext = createHmrContext<ReviewContextType | null>(
  'ReviewContext',
  null
);

export function useReview() {
  const context = useContext(ReviewContext);
  if (!context) {
    throw new Error('useReview must be used within a ReviewProvider');
  }
  return context;
}

export function useReviewOptional() {
  return useContext(ReviewContext);
}
