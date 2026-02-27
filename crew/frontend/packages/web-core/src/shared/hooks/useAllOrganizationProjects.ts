import { useState, useEffect, useMemo } from 'react';
import { createShapeCollection } from '@/shared/lib/electric/collections';
import { PROJECTS_SHAPE, type Project } from 'shared/remote-types';
import { useAuth } from '@/shared/hooks/auth/useAuth';
import { useUserOrganizations } from '@/shared/hooks/useUserOrganizations';

/**
 * Hook that fetches remote projects across ALL user organizations.
 * Uses the raw collection API (createShapeCollection + subscribeChanges)
 * to avoid calling useShape in a loop (which would violate React hooks rules).
 *
 * Collections are cached by createShapeCollection (5-min GC),
 * so no duplicate syncs if the same org's projects are subscribed elsewhere.
 */
export function useAllOrganizationProjects() {
  const { isSignedIn } = useAuth();
  const { data: orgsData } = useUserOrganizations();

  // Stable org IDs list — only recompute when orgsData changes
  const orgIds = useMemo(
    () => (orgsData?.organizations ?? []).map((o) => o.id),
    [orgsData?.organizations]
  );

  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isSignedIn || orgIds.length === 0) {
      setProjects([]);
      setIsLoading(false);
      return;
    }

    const subscriptions: { unsubscribe: () => void }[] = [];
    const projectsByOrg = new Map<string, Project[]>();

    const updateAggregated = () => {
      setProjects(Array.from(projectsByOrg.values()).flat());
    };

    for (const orgId of orgIds) {
      const collection = createShapeCollection(PROJECTS_SHAPE, {
        organization_id: orgId,
      });

      // Read initial data if already synced
      if (collection.isReady()) {
        projectsByOrg.set(orgId, collection.toArray as unknown as Project[]);
      }

      // Subscribe to live changes
      const sub = collection.subscribeChanges(
        () => {
          projectsByOrg.set(orgId, collection.toArray as unknown as Project[]);
          updateAggregated();
          setIsLoading(false);
        },
        { includeInitialState: true }
      );
      subscriptions.push(sub);
    }

    // Initial aggregation from any already-ready collections
    updateAggregated();

    // Check if all collections are already ready
    const allReady = orgIds.every((id) => {
      const col = createShapeCollection(PROJECTS_SHAPE, {
        organization_id: id,
      });
      return col.isReady();
    });
    if (allReady) {
      setIsLoading(false);
    }

    return () => {
      subscriptions.forEach((s) => s.unsubscribe());
    };
  }, [isSignedIn, orgIds]);

  return { data: projects, isLoading };
}
