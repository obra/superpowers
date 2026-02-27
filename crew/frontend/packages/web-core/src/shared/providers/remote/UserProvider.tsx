import { useMemo, useCallback, type ReactNode } from 'react';
import { useShape } from '@/shared/integrations/electric/hooks';
import { USER_WORKSPACES_SHAPE } from 'shared/remote-types';
import { useAuth } from '@/shared/hooks/auth/useAuth';
import {
  UserContext,
  type UserContextValue,
} from '@/shared/hooks/useUserContext';

interface UserProviderProps {
  children: ReactNode;
}

export function UserProvider({ children }: UserProviderProps) {
  const { isSignedIn } = useAuth();

  // No params needed - backend gets user from auth context
  const params = useMemo(() => ({}), []);
  const enabled = isSignedIn;

  // Shape subscriptions
  const workspacesResult = useShape(USER_WORKSPACES_SHAPE, params, { enabled });

  // Lookup helpers
  const getWorkspacesForIssue = useCallback(
    (issueId: string) => {
      return workspacesResult.data.filter((w) => w.issue_id === issueId);
    },
    [workspacesResult.data]
  );

  const value = useMemo<UserContextValue>(
    () => ({
      // Data
      workspaces: workspacesResult.data,

      // Loading/error
      isLoading: workspacesResult.isLoading,
      error: workspacesResult.error,
      retry: workspacesResult.retry,

      // Lookup helpers
      getWorkspacesForIssue,
    }),
    [workspacesResult, getWorkspacesForIssue]
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}
