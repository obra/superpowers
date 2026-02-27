import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@vibe/ui/components/KeyboardDialog';
import { Button } from '@vibe/ui/components/Button';
import { create, useModal } from '@ebay/nice-modal-react';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { defineModal } from '@/shared/lib/modals';
import { useForcePush } from '@/shared/hooks/useForcePush';
import { useState } from 'react';
import { Alert, AlertDescription } from '@vibe/ui/components/Alert';
import { useTranslation } from 'react-i18next';

export interface ForcePushDialogProps {
  attemptId: string;
  repoId: string;
  branchName?: string;
}

const ForcePushDialogImpl = create<ForcePushDialogProps>((props) => {
  const modal = useModal();
  const { attemptId, repoId, branchName } = props;
  const [error, setError] = useState<string | null>(null);
  const { t } = useTranslation(['tasks', 'common']);
  const branchLabel = branchName ? ` "${branchName}"` : '';

  const forcePush = useForcePush(
    attemptId,
    () => {
      // Success - close dialog
      modal.resolve('success');
      modal.hide();
    },
    (err: unknown) => {
      // Error - show in dialog and keep open
      const message =
        err && typeof err === 'object' && 'message' in err
          ? String(err.message)
          : t('tasks:git.forcePushDialog.error');
      setError(message);
    }
  );

  const handleConfirm = async () => {
    setError(null);
    try {
      await forcePush.mutateAsync({ repo_id: repoId });
    } catch {
      // Error already handled by onError callback
    }
  };

  const handleCancel = () => {
    modal.resolve('canceled');
    modal.hide();
  };

  const isProcessing = forcePush.isPending;

  return (
    <Dialog open={modal.visible} onOpenChange={handleCancel}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-6 w-6 text-destructive" />
            <DialogTitle>{t('tasks:git.forcePushDialog.title')}</DialogTitle>
          </div>
          <DialogDescription className="text-left pt-2 space-y-2">
            <p>{t('tasks:git.forcePushDialog.description', { branchLabel })}</p>
            <p className="font-medium">
              {t('tasks:git.forcePushDialog.warning')}
            </p>
            <p className="text-sm text-muted-foreground">
              {t('tasks:git.forcePushDialog.note')}
            </p>
          </DialogDescription>
        </DialogHeader>
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isProcessing}
          >
            {t('common:buttons.cancel')}
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={isProcessing}
          >
            {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isProcessing
              ? t('tasks:git.states.forcePushing')
              : t('tasks:git.states.forcePush')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});

export const ForcePushDialog = defineModal<ForcePushDialogProps, string>(
  ForcePushDialogImpl
);
