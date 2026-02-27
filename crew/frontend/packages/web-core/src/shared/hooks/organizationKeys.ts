export const organizationKeys = {
  all: ['organizations'] as const,
  userList: () => ['organizations', 'user-list'] as const,
  byId: (orgId: string) => ['organizations', orgId] as const,
  projects: (orgId: string) => ['organizations', orgId, 'projects'] as const,
  members: (orgId: string) => ['organizations', orgId, 'members'] as const,
  invitations: (orgId: string) =>
    ['organizations', orgId, 'invitations'] as const,
};
