import { useState, useCallback, memo } from 'react';
import { useTranslation } from 'react-i18next';
import { PrimaryButton } from '@vibe/ui/components/PrimaryButton';
import { CommentCard } from '@vibe/ui/components/CommentCard';
import WYSIWYGEditor from '@/shared/components/WYSIWYGEditor';
import { useReview, type ReviewDraft } from '@/shared/hooks/useReview';

interface CommentWidgetLineProps {
  draft: ReviewDraft;
  widgetKey: string;
  onSave: () => void;
  onCancel: () => void;
}

export const CommentWidgetLine = memo(function CommentWidgetLine({
  draft,
  widgetKey,
  onSave,
  onCancel,
}: CommentWidgetLineProps) {
  const { t } = useTranslation('common');
  const { setDraft, addComment } = useReview();
  const [value, setValue] = useState(draft.text);

  const handleCancel = useCallback(() => {
    setDraft(widgetKey, null);
    onCancel();
  }, [setDraft, widgetKey, onCancel]);

  const handleSave = useCallback(() => {
    if (value.trim()) {
      addComment({
        filePath: draft.filePath,
        side: draft.side,
        lineNumber: draft.lineNumber,
        text: value.trim(),
        codeLine: draft.codeLine,
      });
    }
    setDraft(widgetKey, null);
    onSave();
  }, [value, draft, setDraft, widgetKey, onSave, addComment]);

  return (
    <CommentCard
      variant="input"
      actions={
        <>
          <PrimaryButton
            variant="default"
            onClick={handleSave}
            disabled={!value.trim()}
          >
            {t('comments.addReviewComment')}
          </PrimaryButton>
          <PrimaryButton variant="secondary" onClick={handleCancel}>
            {t('actions.cancel')}
          </PrimaryButton>
        </>
      }
    >
      <WYSIWYGEditor
        value={value}
        onChange={setValue}
        placeholder={t('comments.addPlaceholder')}
        className="w-full text-normal min-h-[60px]"
        onCmdEnter={handleSave}
        autoFocus
      />
    </CommentCard>
  );
});
