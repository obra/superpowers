import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@vibe/ui/components/Button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@vibe/ui/components/KeyboardDialog';
import { Alert, AlertDescription } from '@vibe/ui/components/Alert';
import { Loader2 } from 'lucide-react';
import { create, useModal } from '@ebay/nice-modal-react';
import { defineModal } from '@/shared/lib/modals';

export interface DeleteConfigurationDialogProps {
  configName: string;
  executorType: string;
}

export type DeleteConfigurationResult = 'deleted' | 'canceled';

const DeleteConfigurationDialogImpl = create<DeleteConfigurationDialogProps>(
  ({ configName, executorType }) => {
    const { t } = useTranslation(['settings', 'common']);
    const modal = useModal();
    const [isDeleting, setIsDeleting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleDelete = async () => {
      setIsDeleting(true);
      setError(null);

      try {
        // Resolve with 'deleted' to let parent handle the deletion
        modal.resolve('deleted' as DeleteConfigurationResult);
        modal.hide();
      } catch {
        setError('Failed to delete configuration. Please try again.');
      } finally {
        setIsDeleting(false);
      }
    };

    const handleCancel = () => {
      modal.resolve('canceled' as DeleteConfigurationResult);
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
            <DialogTitle>
              {t('settings:settings.agents.deleteConfigDialog.title')}
            </DialogTitle>
            <DialogDescription>
              {t('settings:settings.agents.deleteConfigDialog.description', {
                configName,
                executorType,
              })}
            </DialogDescription>
          </DialogHeader>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={isDeleting}
            >
              {t('common:buttons.cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('common:buttons.delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }
);

export const DeleteConfigurationDialog = defineModal<
  DeleteConfigurationDialogProps,
  DeleteConfigurationResult
>(DeleteConfigurationDialogImpl);
