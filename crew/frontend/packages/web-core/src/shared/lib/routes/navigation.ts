export type ProjectKanbanSearch = {
  statusId?: string;
  priority?: string;
  assignees?: string;
  parentIssueId?: string;
  mode?: string;
  orgId?: string;
};

export function toRoot() {
  return { to: '/' } as const;
}

export function toOnboarding() {
  return { to: '/onboarding' } as const;
}

export function toOnboardingSignIn() {
  return { to: '/onboarding/sign-in' } as const;
}

export function toMigrate() {
  return { to: '/migrate' } as const;
}

export function toWorkspaces() {
  return { to: '/workspaces' } as const;
}

export function toWorkspacesCreate() {
  return { to: '/workspaces/create' } as const;
}

export function toWorkspace(workspaceId: string) {
  return {
    to: '/workspaces/$workspaceId',
    params: { workspaceId },
  } as const;
}

export function toWorkspaceVsCode(workspaceId: string) {
  return {
    to: '/workspaces/$workspaceId/vscode',
    params: { workspaceId },
  } as const;
}

export function toProject(projectId: string, search?: ProjectKanbanSearch) {
  return {
    to: '/projects/$projectId',
    params: { projectId },
    ...(search ? { search } : {}),
  } as const;
}

export function toProjectIssueCreate(
  projectId: string,
  search?: ProjectKanbanSearch
) {
  return {
    to: '/projects/$projectId/issues/new',
    params: { projectId },
    ...(search ? { search } : {}),
  } as const;
}

export function toProjectIssue(
  projectId: string,
  issueId: string,
  search?: ProjectKanbanSearch
) {
  return {
    to: '/projects/$projectId/issues/$issueId',
    params: { projectId, issueId },
    ...(search ? { search } : {}),
  } as const;
}

export function toProjectIssueWorkspace(
  projectId: string,
  issueId: string,
  workspaceId: string,
  search?: ProjectKanbanSearch
) {
  return {
    to: '/projects/$projectId/issues/$issueId/workspaces/$workspaceId',
    params: { projectId, issueId, workspaceId },
    ...(search ? { search } : {}),
  } as const;
}

export function toProjectIssueWorkspaceCreate(
  projectId: string,
  issueId: string,
  draftId: string,
  search?: ProjectKanbanSearch
) {
  return {
    to: '/projects/$projectId/issues/$issueId/workspaces/create/$draftId',
    params: { projectId, issueId, draftId },
    ...(search ? { search } : {}),
  } as const;
}

export function toProjectWorkspaceCreate(
  projectId: string,
  draftId: string,
  search?: ProjectKanbanSearch
) {
  return {
    to: '/projects/$projectId/workspaces/create/$draftId',
    params: { projectId, draftId },
    ...(search ? { search } : {}),
  } as const;
}

export function pruneUndefinedSearch(search: ProjectKanbanSearch) {
  return Object.fromEntries(
    Object.entries(search).filter(([, value]) => value !== undefined)
  ) as ProjectKanbanSearch;
}

export function searchParamsToKanbanSearch(
  params: URLSearchParams
): ProjectKanbanSearch {
  return pruneUndefinedSearch({
    statusId: params.get('statusId') ?? undefined,
    priority: params.get('priority') ?? undefined,
    assignees: params.get('assignees') ?? undefined,
    parentIssueId: params.get('parentIssueId') ?? undefined,
    mode: params.get('mode') ?? undefined,
    orgId: params.get('orgId') ?? undefined,
  });
}
