import { useEffect, useState } from 'react';
import { ChevronRight } from 'lucide-react';
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

export interface BranchRebaseDialogProps {
  branches: GitBranch[];
  isRebasing?: boolean;
  initialTargetBranch?: string;
  initialUpstreamBranch?: string;
}

export type BranchRebaseDialogResult = {
  action: 'confirmed' | 'canceled';
  branchName?: string;
  upstreamBranch?: string;
};

const BranchRebaseDialogImpl = create<BranchRebaseDialogProps>(
  ({
    branches,
    isRebasing = false,
    initialTargetBranch,
    initialUpstreamBranch,
  }) => {
    const modal = useModal();
    const { t } = useTranslation(['tasks', 'common']);
    const [selectedBranch, setSelectedBranch] = useState<string>(
      initialTargetBranch ?? ''
    );
    const [selectedUpstream, setSelectedUpstream] = useState<string>(
      initialUpstreamBranch ?? ''
    );

    useEffect(() => {
      if (initialTargetBranch) {
        setSelectedBranch(initialTargetBranch);
      }
    }, [initialTargetBranch]);

    useEffect(() => {
      if (initialUpstreamBranch) {
        setSelectedUpstream(initialUpstreamBranch);
      }
    }, [initialUpstreamBranch]);

    const [showAdvanced, setShowAdvanced] = useState(false);

    const handleConfirm = () => {
      if (selectedBranch) {
        modal.resolve({
          action: 'confirmed',
          branchName: selectedBranch,
          upstreamBranch: selectedUpstream,
        } as BranchRebaseDialogResult);
        modal.hide();
      }
    };

    const handleCancel = () => {
      modal.resolve({ action: 'canceled' } as BranchRebaseDialogResult);
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
            <DialogTitle>{t('rebase.dialog.title')}</DialogTitle>
            <DialogDescription>
              {t('rebase.dialog.description')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="target-branch" className="text-sm font-medium">
                {t('rebase.dialog.targetLabel')}
              </label>
              <BranchSelector
                branches={branches}
                selectedBranch={selectedBranch}
                onBranchSelect={setSelectedBranch}
                placeholder={t('rebase.dialog.targetPlaceholder')}
                excludeCurrentBranch={false}
              />
            </div>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => setShowAdvanced((prev) => !prev)}
                className="flex w-full items-center gap-2 text-left text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                <ChevronRight
                  className={`h-3 w-3 transition-transform ${showAdvanced ? 'rotate-90' : ''}`}
                />
                <span>{t('rebase.dialog.advanced')}</span>
              </button>
              {showAdvanced && (
                <div className="space-y-2">
                  <label
                    htmlFor="upstream-branch"
                    className="text-sm font-medium"
                  >
                    {t('rebase.dialog.upstreamLabel')}
                  </label>
                  <BranchSelector
                    branches={branches}
                    selectedBranch={selectedUpstream}
                    onBranchSelect={setSelectedUpstream}
                    placeholder={t('rebase.dialog.upstreamPlaceholder')}
                    excludeCurrentBranch={false}
                  />
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={isRebasing}
            >
              {t('common:buttons.cancel')}
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={isRebasing || !selectedBranch}
            >
              {isRebasing
                ? t('rebase.common.inProgress')
                : t('rebase.common.action')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }
);

export const BranchRebaseDialog = defineModal<
  BranchRebaseDialogProps,
  BranchRebaseDialogResult
>(BranchRebaseDialogImpl);
