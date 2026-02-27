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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './Select';
import NiceModal, { useModal } from '@ebay/nice-modal-react';
import { defineModal } from '../lib/modals';

export interface ChangeTargetBranchOption {
  name: string;
  isCurrent: boolean;
}

export interface ChangeTargetDialogProps {
  branches: ChangeTargetBranchOption[];
  onChangeTargetBranch: (newTargetBranch: string) => Promise<void>;
}

const ChangeTargetDialogImpl = NiceModal.create<ChangeTargetDialogProps>(
  ({ branches, onChangeTargetBranch }) => {
    const modal = useModal();
    const { t } = useTranslation(['tasks', 'common']);
    const [selectedBranch, setSelectedBranch] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
      if (!modal.visible) return;
      setSelectedBranch(branches[0]?.name ?? '');
      setError(null);
      setIsSubmitting(false);
    }, [branches, modal.visible]);

    const handleConfirm = async () => {
      if (!selectedBranch) return;

      setIsSubmitting(true);
      setError(null);
      try {
        await onChangeTargetBranch(selectedBranch);
        modal.hide();
      } catch (err) {
        const message =
          err && typeof err === 'object' && 'message' in err
            ? String(err.message)
            : 'Failed to change target branch';
        setError(message);
      } finally {
        setIsSubmitting(false);
      }
    };

    const handleCancel = () => {
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
            <DialogTitle>{t('branches.changeTarget.dialog.title')}</DialogTitle>
            <DialogDescription>
              {t('branches.changeTarget.dialog.description')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="base-branch" className="text-sm font-medium">
                {t('rebase.dialog.targetLabel')}
              </label>
              <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                <SelectTrigger id="base-branch">
                  <SelectValue
                    placeholder={t('branches.changeTarget.dialog.placeholder')}
                  />
                </SelectTrigger>
                <SelectContent>
                  {branches.map((branch) => (
                    <SelectItem key={branch.name} value={branch.name}>
                      {branch.name}
                      {branch.isCurrent
                        ? ` (${t('branchSelector.badges.current')})`
                        : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={isSubmitting}
            >
              {t('common:buttons.cancel')}
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={isSubmitting || !selectedBranch}
            >
              {isSubmitting
                ? t('branches.changeTarget.dialog.inProgress')
                : t('branches.changeTarget.dialog.action')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }
);

export const ChangeTargetDialog = defineModal<ChangeTargetDialogProps, void>(
  ChangeTargetDialogImpl
);
