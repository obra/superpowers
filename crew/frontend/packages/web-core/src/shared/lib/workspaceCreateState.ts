import type { CreateModeInitialState } from '@/shared/types/createMode';

interface WorkspaceDefaultsLike {
  preferredRepos?: CreateModeInitialState['preferredRepos'];
  project_id?: string | null;
}

interface LocalWorkspaceLike {
  id: string;
}

interface LinkedIssueSource {
  id: string;
  simple_id: string;
  title: string;
}

export function buildWorkspaceCreatePrompt(
  title: string | null | undefined,
  description: string | null | undefined
): string | null {
  const trimmedTitle = title?.trim();
  if (!trimmedTitle) return null;

  const trimmedDescription = description?.trim();
  return trimmedDescription
    ? `${trimmedTitle}\n\n${trimmedDescription}`
    : trimmedTitle;
}

export function buildLinkedIssueCreateState(
  issue: LinkedIssueSource | null | undefined,
  projectId: string
): NonNullable<CreateModeInitialState['linkedIssue']> | null {
  if (!issue) return null;
  return {
    issueId: issue.id,
    simpleId: issue.simple_id,
    title: issue.title,
    remoteProjectId: projectId,
  };
}

export function buildWorkspaceCreateInitialState(args: {
  prompt: string | null;
  defaults?: WorkspaceDefaultsLike | null;
  linkedIssue?: CreateModeInitialState['linkedIssue'];
}): CreateModeInitialState {
  return {
    initialPrompt: args.prompt,
    preferredRepos: args.defaults?.preferredRepos ?? null,
    project_id: args.defaults?.project_id ?? null,
    linkedIssue: args.linkedIssue ?? null,
  };
}

export function buildLocalWorkspaceIdSet(
  activeWorkspaces: LocalWorkspaceLike[],
  archivedWorkspaces: LocalWorkspaceLike[]
): Set<string> {
  return new Set([
    ...activeWorkspaces.map((workspace) => workspace.id),
    ...archivedWorkspaces.map((workspace) => workspace.id),
  ]);
}
