import { useContext } from 'react';
import { createHmrContext } from '@/shared/lib/hmrContext';

export interface AuthContextValue {
  isSignedIn: boolean;
  isLoaded: boolean;
  userId: string | null;
}

export const AuthContext = createHmrContext<AuthContextValue | undefined>(
  'AuthContext',
  undefined
);

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
