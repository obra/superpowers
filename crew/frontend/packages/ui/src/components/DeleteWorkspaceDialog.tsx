import { useState } from 'react';
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
import { Checkbox } from './Checkbox';
import NiceModal, { useModal } from '@ebay/nice-modal-react';
import {
  WarningIcon,
  GitBranchIcon,
  LinkBreakIcon,
} from '@phosphor-icons/react';
import { defineModal } from '../lib/modals';

export interface DeleteWorkspaceDialogProps {
  branchName: string;
  hasOpenPR?: boolean;
  isLinkedToIssue?: boolean;
  linkedIssueSimpleId?: string;
}

export type DeleteWorkspaceDialogResult = {
  action: 'confirmed' | 'canceled';
  deleteBranches?: boolean;
  unlinkFromIssue?: boolean;
};

const DeleteWorkspaceDialogImpl = NiceModal.create<DeleteWorkspaceDialogProps>(
  ({
    branchName,
    hasOpenPR = false,
    isLinkedToIssue = false,
    linkedIssueSimpleId,
  }) => {
    const modal = useModal();
    const { t } = useTranslation();
    const [deleteBranches, setDeleteBranches] = useState(false);
    const [unlinkFromIssue, setUnlinkFromIssue] = useState(true);

    const canDeleteBranches = !hasOpenPR;

    const handleConfirm = () => {
      modal.resolve({
        action: 'confirmed',
        deleteBranches: canDeleteBranches && deleteBranches,
        unlinkFromIssue: isLinkedToIssue && unlinkFromIssue,
      } as DeleteWorkspaceDialogResult);
      modal.hide();
    };

    const handleCancel = () => {
      modal.resolve({ action: 'canceled' } as DeleteWorkspaceDialogResult);
      modal.hide();
    };

    return (
      <Dialog open={modal.visible} onOpenChange={handleCancel}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <WarningIcon className="h-6 w-6 text-destructive" />
              <DialogTitle>
                {t('workspaces.deleteDialog.title', 'Delete Workspace')}
              </DialogTitle>
            </div>
            <DialogDescription className="text-left pt-2">
              {t(
                'workspaces.deleteDialog.description',
                'Are you sure you want to delete this workspace? This action cannot be undone.'
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            <div className="flex flex-col gap-1">
              <div
                className={`flex items-center gap-3 text-sm font-medium select-none ${
                  canDeleteBranches
                    ? 'cursor-pointer'
                    : 'text-muted-foreground cursor-not-allowed'
                }`}
                onClick={() => {
                  if (canDeleteBranches) setDeleteBranches((v) => !v);
                }}
              >
                <Checkbox
                  checked={deleteBranches}
                  disabled={!canDeleteBranches}
                />
                <span className="flex items-center gap-2">
                  <GitBranchIcon className="h-4 w-4" />
                  {t(
                    'workspaces.deleteDialog.deleteBranchLabel',
                    'Delete branch'
                  )}{' '}
                  <code className="rounded bg-muted px-1 py-0.5 text-xs font-mono">
                    {branchName}
                  </code>
                </span>
              </div>
              {hasOpenPR && (
                <p className="text-xs text-muted-foreground pl-7">
                  {t(
                    'workspaces.deleteDialog.cannotDeleteOpenPr',
                    'Cannot delete branch while PR is open'
                  )}
                </p>
              )}
            </div>
            {isLinkedToIssue && (
              <div
                className="flex items-center gap-3 text-sm font-medium cursor-pointer select-none"
                onClick={() => setUnlinkFromIssue((v) => !v)}
              >
                <Checkbox checked={unlinkFromIssue} />
                <span className="flex items-center gap-2">
                  <LinkBreakIcon className="h-4 w-4" />
                  {t(
                    'workspaces.deleteDialog.unlinkFromIssueLabel',
                    'Also unlink from issue'
                  )}
                  {linkedIssueSimpleId && (
                    <>
                      {' '}
                      <code className="rounded bg-muted px-1 py-0.5 text-xs font-mono">
                        {linkedIssueSimpleId}
                      </code>
                    </>
                  )}
                </span>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={handleCancel}>
              {t('buttons.cancel')}
            </Button>
            <Button variant="destructive" onClick={handleConfirm}>
              {t('buttons.delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }
);

export const DeleteWorkspaceDialog = defineModal<
  DeleteWorkspaceDialogProps,
  DeleteWorkspaceDialogResult
>(DeleteWorkspaceDialogImpl);
