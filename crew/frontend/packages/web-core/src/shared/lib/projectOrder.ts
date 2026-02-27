import type { Project } from 'shared/remote-types';

export function compareProjectsByOrder(a: Project, b: Project): number {
  const bySortOrder = a.sort_order - b.sort_order;
  if (bySortOrder !== 0) {
    return bySortOrder;
  }

  const byCreatedAt =
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  if (byCreatedAt !== 0) {
    return byCreatedAt;
  }

  return a.id.localeCompare(b.id);
}

export function sortProjectsByOrder(projects: Project[]): Project[] {
  return [...projects].sort(compareProjectsByOrder);
}

export function getFirstProjectByOrder(projects: Project[]): Project | null {
  if (projects.length === 0) {
    return null;
  }

  return sortProjectsByOrder(projects)[0];
}
