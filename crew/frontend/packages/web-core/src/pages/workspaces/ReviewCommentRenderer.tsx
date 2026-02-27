import { useState, memo } from 'react';
import { useTranslation } from 'react-i18next';
import { PrimaryButton } from '@vibe/ui/components/PrimaryButton';
import { CommentCard } from '@vibe/ui/components/CommentCard';
import WYSIWYGEditor from '@/shared/components/WYSIWYGEditor';
import { useReview, type ReviewComment } from '@/shared/hooks/useReview';

interface ReviewCommentRendererProps {
  comment: ReviewComment;
}

export const ReviewCommentRenderer = memo(function ReviewCommentRenderer({
  comment,
}: ReviewCommentRendererProps) {
  const { t } = useTranslation('common');
  const { deleteComment, updateComment } = useReview();
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(comment.text);

  const handleDelete = () => {
    deleteComment(comment.id);
  };

  const handleEdit = () => {
    setEditText(comment.text);
    setIsEditing(true);
  };

  const handleSave = () => {
    if (editText.trim()) {
      updateComment(comment.id, editText.trim());
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditText(comment.text);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <CommentCard
        variant="user"
        actions={
          <>
            <PrimaryButton
              variant="default"
              onClick={handleSave}
              disabled={!editText.trim()}
            >
              {t('actions.saveChanges')}
            </PrimaryButton>
            <PrimaryButton variant="tertiary" onClick={handleCancel}>
              {t('actions.cancel')}
            </PrimaryButton>
          </>
        }
      >
        <WYSIWYGEditor
          value={editText}
          onChange={setEditText}
          placeholder={t('comments.editPlaceholder')}
          className="w-full text-sm text-normal min-h-[60px]"
          onCmdEnter={handleSave}
          autoFocus
        />
      </CommentCard>
    );
  }

  return (
    <CommentCard variant="user">
      <WYSIWYGEditor
        value={comment.text}
        disabled={true}
        className="text-sm"
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </CommentCard>
  );
});
