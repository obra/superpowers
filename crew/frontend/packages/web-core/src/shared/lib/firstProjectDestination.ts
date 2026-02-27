import { PROJECTS_SHAPE, type Project } from 'shared/remote-types';
import { type OrganizationWithRole } from 'shared/types';
import { organizationsApi } from '@/shared/lib/api';
import { createShapeCollection } from '@/shared/lib/electric/collections';
import { getFirstProjectByOrder } from '@/shared/lib/projectOrder';

const FIRST_PROJECT_LOOKUP_TIMEOUT_MS = 3000;

function getFirstOrganization(
  organizations: OrganizationWithRole[]
): OrganizationWithRole | null {
  if (organizations.length === 0) {
    return null;
  }

  return organizations[0];
}

async function getFirstProjectInOrganization(
  organizationId: string
): Promise<Project | null> {
  const collection = createShapeCollection(PROJECTS_SHAPE, {
    organization_id: organizationId,
  });

  const getCollectionProjects = () =>
    collection.toArray as unknown as Project[];

  if (collection.isReady()) {
    const projects = getCollectionProjects();
    return getFirstProjectByOrder(projects);
  }

  return new Promise<Project | null>((resolve) => {
    let settled = false;
    let timeoutId: number | undefined;
    let subscription: { unsubscribe: () => void } | undefined;

    const settle = (project: Project | null) => {
      if (settled) return;
      settled = true;

      if (timeoutId !== undefined) {
        window.clearTimeout(timeoutId);
        timeoutId = undefined;
      }
      if (subscription) {
        subscription.unsubscribe();
        subscription = undefined;
      }

      resolve(project);
    };

    const tryResolve = () => {
      if (!collection.isReady()) {
        return;
      }

      const projects = getCollectionProjects();
      settle(getFirstProjectByOrder(projects));
    };

    subscription = collection.subscribeChanges(tryResolve, {
      includeInitialState: true,
    });

    timeoutId = window.setTimeout(() => {
      settle(null);
    }, FIRST_PROJECT_LOOKUP_TIMEOUT_MS);

    tryResolve();
  });
}

export async function getFirstProjectDestination(
  setSelectedOrgId: (orgId: string | null) => void
): Promise<string | null> {
  try {
    const organizationsResponse = await organizationsApi.getUserOrganizations();
    const firstOrganization = getFirstOrganization(
      organizationsResponse.organizations ?? []
    );

    if (!firstOrganization) {
      return null;
    }

    setSelectedOrgId(firstOrganization.id);

    const firstProject = await getFirstProjectInOrganization(
      firstOrganization.id
    );
    if (!firstProject) {
      return null;
    }

    return `/projects/${firstProject.id}`;
  } catch (error) {
    console.error('Failed to resolve first project destination:', error);
    return null;
  }
}
