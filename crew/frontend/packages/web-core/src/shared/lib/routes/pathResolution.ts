import {
  toMigrate,
  toOnboarding,
  toOnboardingSignIn,
  toProject,
  toProjectIssue,
  toProjectIssueCreate,
  toProjectIssueWorkspace,
  toProjectIssueWorkspaceCreate,
  toProjectWorkspaceCreate,
  toRoot,
  toWorkspace,
  toWorkspaceVsCode,
  toWorkspaces,
  toWorkspacesCreate,
  type ProjectKanbanSearch,
  pruneUndefinedSearch,
  searchParamsToKanbanSearch,
} from '@/shared/lib/routes/navigation';

type RouteTarget = ReturnType<
  | typeof toRoot
  | typeof toOnboarding
  | typeof toOnboardingSignIn
  | typeof toMigrate
  | typeof toWorkspaces
  | typeof toWorkspacesCreate
  | typeof toWorkspace
  | typeof toWorkspaceVsCode
  | typeof toProject
  | typeof toProjectIssueCreate
  | typeof toProjectIssue
  | typeof toProjectIssueWorkspace
  | typeof toProjectIssueWorkspaceCreate
  | typeof toProjectWorkspaceCreate
>;

function hasSearch(search: ProjectKanbanSearch): boolean {
  return Object.keys(search).length > 0;
}

export function resolveAppPath(path: string): RouteTarget | null {
  const url = new URL(path, 'http://localhost');
  const pathname = url.pathname;
  const segments = pathname.split('/').filter(Boolean);

  if (pathname === '/') return toRoot();
  if (pathname === '/onboarding') return toOnboarding();
  if (pathname === '/onboarding/sign-in') return toOnboardingSignIn();
  if (pathname === '/migrate') return toMigrate();
  if (pathname === '/workspaces') return toWorkspaces();
  if (pathname === '/workspaces/create') return toWorkspacesCreate();

  if (
    segments.length === 3 &&
    segments[0] === 'workspaces' &&
    segments[2] === 'vscode'
  ) {
    return toWorkspaceVsCode(segments[1]);
  }

  if (segments.length === 2 && segments[0] === 'workspaces') {
    return toWorkspace(segments[1]);
  }

  const kanbanSearch = pruneUndefinedSearch(
    searchParamsToKanbanSearch(url.searchParams)
  );
  const projectSearch = hasSearch(kanbanSearch) ? kanbanSearch : undefined;

  if (segments[0] === 'projects' && segments[1]) {
    const projectId = segments[1];

    if (segments.length === 2) {
      return toProject(projectId, projectSearch);
    }

    if (segments[2] === 'issues' && segments[3] === 'new') {
      return toProjectIssueCreate(projectId, projectSearch);
    }

    if (
      segments[2] === 'issues' &&
      segments[3] &&
      segments[4] === 'workspaces' &&
      segments[5] === 'create' &&
      segments[6]
    ) {
      return toProjectIssueWorkspaceCreate(
        projectId,
        segments[3],
        segments[6],
        projectSearch
      );
    }

    if (
      segments[2] === 'issues' &&
      segments[3] &&
      segments[4] === 'workspaces' &&
      segments[5]
    ) {
      return toProjectIssueWorkspace(
        projectId,
        segments[3],
        segments[5],
        projectSearch
      );
    }

    if (segments[2] === 'issues' && segments[3]) {
      return toProjectIssue(projectId, segments[3], projectSearch);
    }

    if (
      segments[2] === 'workspaces' &&
      segments[3] === 'create' &&
      segments[4]
    ) {
      return toProjectWorkspaceCreate(projectId, segments[4], projectSearch);
    }
  }

  return null;
}
