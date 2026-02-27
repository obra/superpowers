import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@vibe/ui/components/Button';
import { Input } from '@vibe/ui/components/Input';
import { Label } from '@vibe/ui/components/Label';
import { Textarea } from '@vibe/ui/components/Textarea';
import { Alert } from '@vibe/ui/components/Alert';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@vibe/ui/components/KeyboardDialog';
import { Loader2 } from 'lucide-react';
import { tagsApi } from '@/shared/lib/api';
import type { Tag, CreateTag, UpdateTag } from 'shared/types';
import { create, useModal } from '@ebay/nice-modal-react';
import { defineModal, getErrorMessage } from '@/shared/lib/modals';

export interface TagEditDialogProps {
  tag?: Tag | null; // null for create mode
}

export type TagEditResult = 'saved' | 'canceled';

const TagEditDialogImpl = create<TagEditDialogProps>(({ tag }) => {
  const modal = useModal();
  const { t } = useTranslation('settings');
  const [formData, setFormData] = useState({
    tag_name: '',
    content: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tagNameError, setTagNameError] = useState<string | null>(null);

  const isEditMode = Boolean(tag);

  useEffect(() => {
    if (tag) {
      setFormData({
        tag_name: tag.tag_name,
        content: tag.content,
      });
    } else {
      setFormData({
        tag_name: '',
        content: '',
      });
    }
    setError(null);
    setTagNameError(null);
  }, [tag]);

  const handleSave = async () => {
    if (!formData.tag_name.trim()) {
      setError(t('settings.general.tags.dialog.errors.nameRequired'));
      return;
    }

    setSaving(true);
    setError(null);

    try {
      if (isEditMode && tag) {
        const updateData: UpdateTag = {
          tag_name: formData.tag_name,
          content: formData.content || null, // null means "don't update"
        };
        await tagsApi.update(tag.id, updateData);
      } else {
        const createData: CreateTag = {
          tag_name: formData.tag_name,
          content: formData.content,
        };
        await tagsApi.create(createData);
      }

      modal.resolve('saved' as TagEditResult);
      modal.hide();
    } catch (err: unknown) {
      setError(
        getErrorMessage(err) ||
          t('settings.general.tags.dialog.errors.saveFailed')
      );
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    modal.resolve('canceled' as TagEditResult);
    modal.hide();
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      // Reset form data when dialog closes
      setFormData({
        tag_name: '',
        content: '',
      });
      setError(null);
      handleCancel();
    }
  };

  return (
    <Dialog open={modal.visible} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEditMode
              ? t('settings.general.tags.dialog.editTitle')
              : t('settings.general.tags.dialog.createTitle')}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="tag-name">
              {t('settings.general.tags.dialog.tagName.label')}{' '}
              <span className="text-destructive">
                {t('settings.general.tags.dialog.tagName.required')}
              </span>
            </Label>
            <p className="text-xs text-muted-foreground mb-1.5">
              {t('settings.general.tags.dialog.tagName.hint', {
                tagName: formData.tag_name || 'tag_name',
              })}
            </p>
            <Input
              id="tag-name"
              value={formData.tag_name}
              onChange={(e) => {
                const value = e.target.value;
                setFormData({ ...formData, tag_name: value });

                // Validate in real-time for spaces
                if (value.includes(' ')) {
                  setTagNameError(
                    t('settings.general.tags.dialog.tagName.error')
                  );
                } else {
                  setTagNameError(null);
                }
              }}
              placeholder={t(
                'settings.general.tags.dialog.tagName.placeholder'
              )}
              disabled={saving}
              autoFocus
              aria-invalid={!!tagNameError}
              className={tagNameError ? 'border-destructive' : undefined}
            />
            {tagNameError && (
              <p className="text-sm text-destructive">{tagNameError}</p>
            )}
          </div>
          <div>
            <Label htmlFor="tag-content">
              {t('settings.general.tags.dialog.content.label')}{' '}
              <span className="text-destructive">
                {t('settings.general.tags.dialog.content.required')}
              </span>
            </Label>
            <p className="text-xs text-muted-foreground mb-1.5">
              {t('settings.general.tags.dialog.content.hint', {
                tagName: formData.tag_name || 'tag_name',
              })}
            </p>
            <Textarea
              id="tag-content"
              value={formData.content}
              onChange={(e) => {
                const value = e.target.value;
                setFormData({ ...formData, content: value });
              }}
              placeholder={t(
                'settings.general.tags.dialog.content.placeholder'
              )}
              rows={6}
              disabled={saving}
            />
          </div>
          {error && <Alert variant="destructive">{error}</Alert>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleCancel} disabled={saving}>
            {t('settings.general.tags.dialog.buttons.cancel')}
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || !!tagNameError || !formData.content.trim()}
          >
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditMode
              ? t('settings.general.tags.dialog.buttons.update')
              : t('settings.general.tags.dialog.buttons.create')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});

export const TagEditDialog = defineModal<TagEditDialogProps, TagEditResult>(
  TagEditDialogImpl
);
