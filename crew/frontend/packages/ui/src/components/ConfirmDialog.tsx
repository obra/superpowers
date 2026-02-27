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
import NiceModal, { useModal } from '@ebay/nice-modal-react';
import {
  WarningIcon,
  InfoIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@phosphor-icons/react';
import { defineModal, type ConfirmResult } from '../lib/modals';

export interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'destructive' | 'info' | 'success';
  icon?: boolean;
  showCancelButton?: boolean;
}

const ConfirmDialogImpl = NiceModal.create<ConfirmDialogProps>((props) => {
  const { t } = useTranslation(['tasks', 'common']);
  const modal = useModal();
  const {
    title,
    message,
    confirmText = t('common:confirm.defaultConfirm'),
    cancelText = t('common:confirm.defaultCancel'),
    variant = 'default',
    icon = true,
    showCancelButton = true,
  } = props;

  const handleConfirm = () => {
    modal.resolve('confirmed' as ConfirmResult);
    modal.hide();
  };

  const handleCancel = () => {
    modal.resolve('canceled' as ConfirmResult);
    modal.hide();
  };

  const getIcon = () => {
    if (!icon) return null;

    const iconClass = 'h-6 w-6';

    switch (variant) {
      case 'destructive':
        return <WarningIcon className={`${iconClass} text-destructive`} />;
      case 'info':
        return <InfoIcon className={`${iconClass} text-blue-500`} />;
      case 'success':
        return <CheckCircleIcon className={`${iconClass} text-green-500`} />;
      default:
        return <XCircleIcon className={`${iconClass} text-muted-foreground`} />;
    }
  };

  const getConfirmButtonVariant = () => {
    return variant === 'destructive' ? 'destructive' : 'default';
  };

  return (
    <Dialog open={modal.visible} onOpenChange={handleCancel}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            {getIcon()}
            <DialogTitle>{title}</DialogTitle>
          </div>
          <DialogDescription className="text-left pt-2">
            {message}
          </DialogDescription>
        </DialogHeader>
        {showCancelButton ? (
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={handleCancel}>
              {cancelText}
            </Button>
            <Button variant={getConfirmButtonVariant()} onClick={handleConfirm}>
              {confirmText}
            </Button>
          </DialogFooter>
        ) : (
          <div className="flex w-full">
            <Button
              className="ml-auto"
              variant={getConfirmButtonVariant()}
              onClick={handleConfirm}
            >
              {confirmText}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
});

export const ConfirmDialog = defineModal<ConfirmDialogProps, ConfirmResult>(
  ConfirmDialogImpl
);
