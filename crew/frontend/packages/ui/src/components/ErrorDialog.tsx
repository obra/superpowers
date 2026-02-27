import NiceModal, { useModal } from '@ebay/nice-modal-react';
import { WarningIcon } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './Dialog';
import { Button } from './Button';
import { defineModal } from '../lib/modals';

export interface ErrorDialogProps {
  title: string;
  message: string;
  buttonText?: string;
}

const ErrorDialogImpl = NiceModal.create<ErrorDialogProps>((props) => {
  const { t } = useTranslation('common');
  const modal = useModal();
  const { title, message, buttonText = t('ok') } = props;

  const handleDismiss = () => {
    modal.resolve();
    modal.hide();
  };

  return (
    <Dialog
      open={modal.visible}
      onOpenChange={(open) => !open && handleDismiss()}
    >
      <DialogContent
        className="sm:max-w-[425px] p-double"
        style={{ zIndex: 10001 }}
      >
        <DialogHeader>
          <div className="flex items-center gap-3">
            <WarningIcon className="h-6 w-6 text-destructive" />
            <DialogTitle>{title}</DialogTitle>
          </div>
          <DialogDescription className="text-left pt-2">
            {message}
          </DialogDescription>
        </DialogHeader>

        <div className="flex w-full justify-end">
          <Button onClick={handleDismiss}>{buttonText}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
});

export const ErrorDialog = defineModal<ErrorDialogProps, void>(ErrorDialogImpl);
