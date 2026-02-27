import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@vibe/ui/components/KeyboardDialog';
import { Button } from '@vibe/ui/components/Button';
import BranchSelector from '@/shared/components/tasks/BranchSelector';
import type { GitBranch } from 'shared/types';
import { create, useModal } from '@ebay/nice-modal-react';
import { defineModal } from '@/shared/lib/modals';

export interface ChangeTargetBranchDialogProps {
  branches: GitBranch[];
  isChangingTargetBranch?: boolean;
}

export type ChangeTargetBranchDialogResult = {
  action: 'confirmed' | 'canceled';
  branchName?: string;
};

const ChangeTargetBranchDialogImpl = create<ChangeTargetBranchDialogProps>(
  ({ branches, isChangingTargetBranch: isChangingTargetBranch = false }) => {
    const modal = useModal();
    const { t } = useTranslation(['tasks', 'common']);
    const [selectedBranch, setSelectedBranch] = useState<string>('');

    const handleConfirm = () => {
      if (selectedBranch) {
        modal.resolve({
          action: 'confirmed',
          branchName: selectedBranch,
        } as ChangeTargetBranchDialogResult);
        modal.hide();
      }
    };

    const handleCancel = () => {
      modal.resolve({ action: 'canceled' } as ChangeTargetBranchDialogResult);
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
              <BranchSelector
                branches={branches}
                selectedBranch={selectedBranch}
                onBranchSelect={setSelectedBranch}
                placeholder={t('branches.changeTarget.dialog.placeholder')}
                excludeCurrentBranch={false}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={isChangingTargetBranch}
            >
              {t('common:buttons.cancel')}
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={isChangingTargetBranch || !selectedBranch}
            >
              {isChangingTargetBranch
                ? t('branches.changeTarget.dialog.inProgress')
                : t('branches.changeTarget.dialog.action')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }
);

export const ChangeTargetBranchDialog = defineModal<
  ChangeTargetBranchDialogProps,
  ChangeTargetBranchDialogResult
>(ChangeTargetBranchDialogImpl);
