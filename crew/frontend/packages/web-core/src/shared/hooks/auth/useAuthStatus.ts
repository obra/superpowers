import { useQuery } from '@tanstack/react-query';
import { oauthApi } from '@/shared/lib/api';
import { useEffect } from 'react';
import { useAuth } from '@/shared/hooks/auth/useAuth';

interface UseAuthStatusOptions {
  enabled: boolean;
}

export function useAuthStatus(options: UseAuthStatusOptions) {
  const query = useQuery({
    queryKey: ['auth', 'status'],
    queryFn: () => oauthApi.status(),
    enabled: options.enabled,
    refetchInterval: options.enabled ? 1000 : false,
    retry: 3,
    staleTime: 0, // Always fetch fresh data when enabled
  });

  const { isSignedIn } = useAuth();
  useEffect(() => {
    if (query) {
      query.refetch();
    }
  }, [isSignedIn, query]);

  return query;
}
