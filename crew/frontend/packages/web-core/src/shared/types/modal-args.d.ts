import { TaskWithAttemptStatus, Workspace } from 'shared/types';

// Extend nice-modal-react to provide type safety for modal arguments
declare module '@ebay/nice-modal-react' {
  interface ModalArgs {
    'create-pr': {
      attempt: Workspace;
      task: TaskWithAttemptStatus;
      projectId: string;
    };
  }
}

export {};
