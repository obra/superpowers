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
import { AlertTriangle, Info, CheckCircle, XCircle } from 'lucide-react';
import { defineModal, type ConfirmResult } from '@/shared/lib/modals';

export interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'destructive' | 'info' | 'success';
  icon?: boolean;
}

const ConfirmDialogImpl = create<ConfirmDialogProps>((props) => {
  const modal = useModal();
  const {
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    variant = 'default',
    icon = true,
  } = props;

  const handleConfirm = () => {
    modal.resolve('confirmed' as ConfirmResult);
  };

  const handleCancel = () => {
    modal.resolve('canceled' as ConfirmResult);
  };

  const getIcon = () => {
    if (!icon) return null;

    switch (variant) {
      case 'destructive':
        return <AlertTriangle className="h-6 w-6 text-destructive" />;
      case 'info':
        return <Info className="h-6 w-6 text-blue-500" />;
      case 'success':
        return <CheckCircle className="h-6 w-6 text-green-500" />;
      default:
        return <XCircle className="h-6 w-6 text-muted-foreground" />;
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
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleCancel}>
            {cancelText}
          </Button>
          <Button variant={getConfirmButtonVariant()} onClick={handleConfirm}>
            {confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});

export const ConfirmDialog = defineModal<ConfirmDialogProps, ConfirmResult>(
  ConfirmDialogImpl
);
