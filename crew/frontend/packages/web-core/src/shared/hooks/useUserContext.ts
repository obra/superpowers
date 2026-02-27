import { useContext } from 'react';
import { createHmrContext } from '@/shared/lib/hmrContext';
import type { Workspace } from 'shared/remote-types';
import type { SyncError } from '@/shared/lib/electric/types';

/**
 * UserContext provides user-scoped data.
 *
 * Shapes synced at user scope:
 * - Workspaces (data only, scoped by owner_user_id)
 */
export interface UserContextValue {
  // Data
  workspaces: Workspace[];

  // Loading/error state
  isLoading: boolean;
  error: SyncError | null;
  retry: () => void;

  // Lookup helpers
  getWorkspacesForIssue: (issueId: string) => Workspace[];
}

export const UserContext = createHmrContext<UserContextValue | null>(
  'UserContext',
  null
);

/**
 * Hook to access user context.
 * Must be used within a UserProvider.
 */
export function useUserContext(): UserContextValue {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUserContext must be used within a UserProvider');
  }
  return context;
}
