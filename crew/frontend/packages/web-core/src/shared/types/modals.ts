import type { ConfirmDialogProps } from '@/shared/dialogs/shared/ConfirmDialog';
import type { EditorSelectionDialogProps } from '@/shared/dialogs/command-bar/EditorSelectionDialog';

// Type definitions for nice-modal-react modal arguments
// Note: 'create-pr' is declared in modal-args.d.ts
declare module '@ebay/nice-modal-react' {
  interface ModalArgs {
    // Generic modals
    confirm: ConfirmDialogProps;

    // App flow modals
    'release-notes': void;

    'editor-selection': EditorSelectionDialogProps;
  }
}

export {};
