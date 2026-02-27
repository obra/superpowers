import type { IssuePriority } from 'shared/remote-types';

export type ProjectSidebarRouteState =
  | {
      type: 'closed';
      projectId: string;
    }
  | {
      type: 'issue-create';
      projectId: string;
    }
  | {
      type: 'issue';
      projectId: string;
      issueId: string;
    }
  | {
      type: 'issue-workspace';
      projectId: string;
      issueId: string;
      workspaceId: string;
    }
  | {
      type: 'workspace-create';
      projectId: string;
      draftId: string;
      issueId: string | null;
    };

export interface IssueCreateRouteOptions {
  statusId?: string;
  priority?: IssuePriority;
  assigneeIds?: string[];
  parentIssueId?: string;
}

export function buildProjectRootPath(projectId: string) {
  return {
    to: '/projects/$projectId',
    params: { projectId },
  } as const;
}

export function buildIssuePath(projectId: string, issueId: string) {
  return {
    to: '/projects/$projectId/issues/$issueId',
    params: { projectId, issueId },
  } as const;
}

export function buildIssueWorkspacePath(
  projectId: string,
  issueId: string,
  workspaceId: string
) {
  return {
    to: '/projects/$projectId/issues/$issueId/workspaces/$workspaceId',
    params: { projectId, issueId, workspaceId },
  } as const;
}

export function buildWorkspaceCreatePath(
  projectId: string,
  draftId: string,
  issueId?: string | null
) {
  if (issueId) {
    return {
      to: '/projects/$projectId/issues/$issueId/workspaces/create/$draftId',
      params: { projectId, issueId, draftId },
    } as const;
  }

  return {
    to: '/projects/$projectId/workspaces/create/$draftId',
    params: { projectId, draftId },
  } as const;
}

export function buildIssueCreatePath(
  projectId: string,
  options?: IssueCreateRouteOptions
) {
  return {
    to: '/projects/$projectId/issues/new',
    params: { projectId },
    search: {
      statusId: options?.statusId,
      priority: options?.priority,
      assignees: options?.assigneeIds?.length
        ? options.assigneeIds.join(',')
        : undefined,
      parentIssueId: options?.parentIssueId,
    },
  } as const;
}

function decodeSegment(segment: string): string {
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
}

export function parseProjectSidebarRoute(
  pathname: string
): ProjectSidebarRouteState | null {
  const segments = pathname
    .split('/')
    .map((segment) => segment.trim())
    .filter(Boolean)
    .map(decodeSegment);

  if (segments[0] !== 'projects' || !segments[1]) {
    return null;
  }

  const projectId = segments[1];

  if (segments.length === 2) {
    return {
      type: 'closed',
      projectId,
    };
  }

  if (segments[2] === 'issues' && segments[3] === 'new') {
    return {
      type: 'issue-create',
      projectId,
    };
  }

  if (
    segments[2] === 'issues' &&
    segments[3] &&
    segments[4] === 'workspaces' &&
    segments[5] === 'create' &&
    segments[6]
  ) {
    return {
      type: 'workspace-create',
      projectId,
      issueId: segments[3],
      draftId: segments[6],
    };
  }

  if (
    segments[2] === 'issues' &&
    segments[3] &&
    segments[4] === 'workspaces' &&
    segments[5]
  ) {
    return {
      type: 'issue-workspace',
      projectId,
      issueId: segments[3],
      workspaceId: segments[5],
    };
  }

  if (segments[2] === 'issues' && segments[3]) {
    return {
      type: 'issue',
      projectId,
      issueId: segments[3],
    };
  }

  if (segments[2] === 'workspaces' && segments[3] === 'create' && segments[4]) {
    return {
      type: 'workspace-create',
      projectId,
      issueId: null,
      draftId: segments[4],
    };
  }

  return null;
}
