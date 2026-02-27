import { create, useModal } from '@ebay/nice-modal-react';
import { defineModal } from '@/shared/lib/modals';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@vibe/ui/components/KeyboardDialog';
import ProcessesTab from '@/shared/components/tasks/TaskDetails/ProcessesTab';
import { ProcessSelectionProvider } from '@/shared/hooks/ProcessSelectionContext';

export interface ViewProcessesDialogProps {
  sessionId: string | undefined;
  initialProcessId?: string | null;
}

const ViewProcessesDialogImpl = create<ViewProcessesDialogProps>(
  ({ sessionId, initialProcessId }) => {
    const { t } = useTranslation('tasks');
    const modal = useModal();

    const handleOpenChange = (open: boolean) => {
      if (!open) {
        modal.hide();
      }
    };

    return (
      <Dialog
        open={modal.visible}
        onOpenChange={handleOpenChange}
        className="max-w-5xl w-[92vw] p-0 overflow-x-hidden"
      >
        <DialogContent
          className="p-0 min-w-0"
          onKeyDownCapture={(e) => {
            if (e.key === 'Escape') {
              e.stopPropagation();
              modal.hide();
            }
          }}
        >
          <DialogHeader className="px-4 py-3 border-b">
            <DialogTitle>{t('viewProcessesDialog.title')}</DialogTitle>
          </DialogHeader>
          <div className="h-[75vh] flex flex-col min-h-0 min-w-0">
            <ProcessSelectionProvider initialProcessId={initialProcessId}>
              <ProcessesTab sessionId={sessionId} />
            </ProcessSelectionProvider>
          </div>
        </DialogContent>
      </Dialog>
    );
  }
);

export const ViewProcessesDialog = defineModal<ViewProcessesDialogProps, void>(
  ViewProcessesDialogImpl
);
