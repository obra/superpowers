import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './KeyboardDialog';
import { Button } from './Button';
import { Input } from './Input';
import NiceModal, { useModal } from '@ebay/nice-modal-react';
import { defineModal } from '../lib/modals';

export interface RenameWorkspaceDialogProps {
  currentName: string;
  onRename: (newName: string) => Promise<void>;
}

export type RenameWorkspaceDialogResult = {
  action: 'confirmed' | 'canceled';
  name?: string;
};

const RenameWorkspaceDialogImpl = NiceModal.create<RenameWorkspaceDialogProps>(
  ({ currentName, onRename }) => {
    const modal = useModal();
    const { t } = useTranslation(['common']);
    const [name, setName] = useState<string>(currentName);
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
      setName(currentName);
      setError(null);
    }, [currentName]);

    const handleConfirm = async () => {
      const trimmedName = name.trim();

      if (trimmedName === currentName) {
        modal.resolve({ action: 'canceled' } as RenameWorkspaceDialogResult);
        modal.hide();
        return;
      }

      setIsSubmitting(true);
      setError(null);
      try {
        await onRename(trimmedName);
        modal.resolve({
          action: 'confirmed',
          name: trimmedName,
        } as RenameWorkspaceDialogResult);
        modal.hide();
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to rename workspace'
        );
      } finally {
        setIsSubmitting(false);
      }
    };

    const handleCancel = () => {
      modal.resolve({ action: 'canceled' } as RenameWorkspaceDialogResult);
      modal.hide();
    };

    const handleOpenChange = (open: boolean) => {
      if (!open) {
        handleCancel();
      }
    };

    return (
      <Dialog open={modal.visible} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('workspaces.rename.title')}</DialogTitle>
            <DialogDescription>
              {t('workspaces.rename.description')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="workspace-name" className="text-sm font-medium">
                {t('workspaces.rename.nameLabel')}
              </label>
              <Input
                id="workspace-name"
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setError(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !isSubmitting) {
                    void handleConfirm();
                  }
                }}
                placeholder={t('workspaces.rename.placeholder')}
                disabled={isSubmitting}
                autoFocus
              />
              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={isSubmitting}
            >
              {t('buttons.cancel')}
            </Button>
            <Button
              onClick={() => void handleConfirm()}
              disabled={isSubmitting}
            >
              {isSubmitting
                ? t('workspaces.rename.renaming')
                : t('workspaces.rename.action')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }
);

export const RenameWorkspaceDialog = defineModal<
  RenameWorkspaceDialogProps,
  RenameWorkspaceDialogResult
>(RenameWorkspaceDialogImpl);
