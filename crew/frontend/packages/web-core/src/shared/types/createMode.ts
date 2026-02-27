export interface LinkedIssue {
  issueId: string;
  simpleId?: string;
  title?: string;
  remoteProjectId: string;
}

export interface CreateModeInitialState {
  initialPrompt?: string | null;
  preferredRepos?: Array<{
    repo_id: string;
    target_branch: string | null;
  }> | null;
  project_id?: string | null;
  linkedIssue?: LinkedIssue | null;
}
