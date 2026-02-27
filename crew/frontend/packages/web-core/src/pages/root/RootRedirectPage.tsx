import { useEffect, useState } from 'react';
import { Navigate } from '@tanstack/react-router';
import { useUserSystem } from '@/shared/hooks/useUserSystem';
import { getFirstProjectDestination } from '@/shared/lib/firstProjectDestination';
import { useOrganizationStore } from '@/shared/stores/useOrganizationStore';
import { resolveAppPath } from '@/shared/lib/routes/pathResolution';
import {
  toOnboarding,
  toWorkspacesCreate,
} from '@/shared/lib/routes/navigation';

const DEFAULT_DESTINATION = '/workspaces/create';

export function RootRedirectPage() {
  const { config, loading, loginStatus } = useUserSystem();
  const setSelectedOrgId = useOrganizationStore((s) => s.setSelectedOrgId);
  const [destination, setDestination] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const resolveDestination = async () => {
      if (loading || !config) {
        return;
      }

      if (!config.remote_onboarding_acknowledged) {
        setDestination('/onboarding');
        return;
      }

      if (loginStatus?.status !== 'loggedin') {
        setDestination(DEFAULT_DESTINATION);
        return;
      }

      const firstProjectDestination =
        await getFirstProjectDestination(setSelectedOrgId);
      if (!cancelled) {
        const resolvedDestination =
          firstProjectDestination ?? DEFAULT_DESTINATION;
        setDestination(resolvedDestination);
      }
    };

    void resolveDestination();

    return () => {
      cancelled = true;
    };
  }, [config, loading, loginStatus?.status, setSelectedOrgId]);

  if (loading || !config || !destination) {
    return (
      <div className="h-screen bg-primary flex items-center justify-center">
        <p className="text-low">Loading...</p>
      </div>
    );
  }

  const resolvedDestination =
    resolveAppPath(destination) ??
    (destination === '/onboarding' ? toOnboarding() : toWorkspacesCreate());

  return <Navigate {...resolvedDestination} replace />;
}
