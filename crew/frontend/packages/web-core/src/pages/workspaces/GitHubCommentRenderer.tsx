import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  GithubLogoIcon,
  ArrowSquareOutIcon,
  ChatsCircleIcon,
} from '@phosphor-icons/react';
import { CommentCard } from '@vibe/ui/components/CommentCard';
import { formatRelativeTime } from '@/shared/lib/date';
import type { NormalizedGitHubComment } from '@/shared/hooks/useWorkspaceContext';

interface GitHubCommentRendererProps {
  comment: NormalizedGitHubComment;
  onCopyToUserComment: () => void;
}

export const GitHubCommentRenderer = memo(function GitHubCommentRenderer({
  comment,
  onCopyToUserComment,
}: GitHubCommentRendererProps) {
  const { t } = useTranslation('common');

  const header = (
    <div className="flex items-center gap-half text-sm">
      <GithubLogoIcon className="size-icon-sm text-low" weight="fill" />
      <span className="font-medium text-normal">@{comment.author}</span>
      <span className="text-low">{formatRelativeTime(comment.createdAt)}</span>
      <div className="flex items-center gap-half ml-auto">
        <button
          className="text-low hover:text-normal"
          onClick={(e) => {
            e.stopPropagation();
            onCopyToUserComment();
          }}
          title={t('comments.copyToReview')}
        >
          <ChatsCircleIcon className="size-icon-xs" />
        </button>
        {comment.url && (
          <a
            href={comment.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-low hover:text-normal"
            onClick={(e) => e.stopPropagation()}
          >
            <ArrowSquareOutIcon className="size-icon-xs" />
          </a>
        )}
      </div>
    </div>
  );

  return (
    <CommentCard variant="github" header={header}>
      <div className="text-sm text-normal whitespace-pre-wrap break-words">
        {comment.body}
      </div>
    </CommentCard>
  );
});
