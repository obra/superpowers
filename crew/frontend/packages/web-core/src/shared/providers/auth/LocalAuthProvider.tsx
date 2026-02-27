import { useMemo, type ReactNode } from 'react';
import {
  AuthContext,
  type AuthContextValue,
} from '@/shared/hooks/auth/useAuth';
import { useUserSystem } from '@/shared/hooks/useUserSystem';

interface LocalAuthProviderProps {
  children: ReactNode;
}

export function LocalAuthProvider({ children }: LocalAuthProviderProps) {
  const { loginStatus } = useUserSystem();

  const value = useMemo<AuthContextValue>(
    () => ({
      isSignedIn: loginStatus?.status === 'loggedin',
      isLoaded: loginStatus !== null,
      userId:
        loginStatus?.status === 'loggedin' ? loginStatus.profile.user_id : null,
    }),
    [loginStatus]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
