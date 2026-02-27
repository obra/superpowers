import { useMemo, useCallback, type ReactNode } from 'react';
import { useShape } from '@/shared/integrations/electric/hooks';
import {
  PROJECT_ISSUES_SHAPE,
  PROJECT_PROJECT_STATUSES_SHAPE,
  PROJECT_TAGS_SHAPE,
  PROJECT_ISSUE_ASSIGNEES_SHAPE,
  PROJECT_ISSUE_FOLLOWERS_SHAPE,
  PROJECT_ISSUE_TAGS_SHAPE,
  PROJECT_ISSUE_RELATIONSHIPS_SHAPE,
  PROJECT_PULL_REQUESTS_SHAPE,
  PROJECT_WORKSPACES_SHAPE,
  ISSUE_MUTATION,
  PROJECT_STATUS_MUTATION,
  TAG_MUTATION,
  ISSUE_ASSIGNEE_MUTATION,
  ISSUE_FOLLOWER_MUTATION,
  ISSUE_TAG_MUTATION,
  ISSUE_RELATIONSHIP_MUTATION,
  type Issue,
  type ProjectStatus,
  type Tag,
} from 'shared/remote-types';
import {
  ProjectContext,
  type ProjectContextValue,
} from '@/shared/hooks/useProjectContext';

interface ProjectProviderProps {
  projectId: string;
  children: ReactNode;
}

export function ProjectProvider({ projectId, children }: ProjectProviderProps) {
  const params = useMemo(() => ({ project_id: projectId }), [projectId]);
  const enabled = Boolean(projectId);

  // Shape subscriptions (with mutations where needed)
  const issuesResult = useShape(PROJECT_ISSUES_SHAPE, params, {
    enabled,
    mutation: ISSUE_MUTATION,
  });
  const statusesResult = useShape(PROJECT_PROJECT_STATUSES_SHAPE, params, {
    enabled,
    mutation: PROJECT_STATUS_MUTATION,
  });
  const tagsResult = useShape(PROJECT_TAGS_SHAPE, params, {
    enabled,
    mutation: TAG_MUTATION,
  });
  const issueAssigneesResult = useShape(PROJECT_ISSUE_ASSIGNEES_SHAPE, params, {
    enabled,
    mutation: ISSUE_ASSIGNEE_MUTATION,
  });
  const issueFollowersResult = useShape(PROJECT_ISSUE_FOLLOWERS_SHAPE, params, {
    enabled,
    mutation: ISSUE_FOLLOWER_MUTATION,
  });
  const issueTagsResult = useShape(PROJECT_ISSUE_TAGS_SHAPE, params, {
    enabled,
    mutation: ISSUE_TAG_MUTATION,
  });
  const issueRelationshipsResult = useShape(
    PROJECT_ISSUE_RELATIONSHIPS_SHAPE,
    params,
    { enabled, mutation: ISSUE_RELATIONSHIP_MUTATION }
  );
  const pullRequestsResult = useShape(PROJECT_PULL_REQUESTS_SHAPE, params, {
    enabled,
  });
  const workspacesResult = useShape(PROJECT_WORKSPACES_SHAPE, params, {
    enabled,
  });

  // Board readiness depends on core kanban data only.
  // Other project-scoped shapes hydrate opportunistically after render.
  const isLoading = issuesResult.isLoading || statusesResult.isLoading;

  // First error found
  const error =
    issuesResult.error ||
    statusesResult.error ||
    tagsResult.error ||
    issueAssigneesResult.error ||
    issueFollowersResult.error ||
    issueTagsResult.error ||
    issueRelationshipsResult.error ||
    pullRequestsResult.error ||
    workspacesResult.error ||
    null;

  // Combined retry
  const retry = useCallback(() => {
    issuesResult.retry();
    statusesResult.retry();
    tagsResult.retry();
    issueAssigneesResult.retry();
    issueFollowersResult.retry();
    issueTagsResult.retry();
    issueRelationshipsResult.retry();
    pullRequestsResult.retry();
    workspacesResult.retry();
  }, [
    issuesResult,
    statusesResult,
    tagsResult,
    issueAssigneesResult,
    issueFollowersResult,
    issueTagsResult,
    issueRelationshipsResult,
    pullRequestsResult,
    workspacesResult,
  ]);

  // Computed Maps for O(1) lookup
  const issuesById = useMemo(() => {
    const map = new Map<string, Issue>();
    for (const issue of issuesResult.data) {
      map.set(issue.id, issue);
    }
    return map;
  }, [issuesResult.data]);

  const statusesById = useMemo(() => {
    const map = new Map<string, ProjectStatus>();
    for (const status of statusesResult.data) {
      map.set(status.id, status);
    }
    return map;
  }, [statusesResult.data]);

  const tagsById = useMemo(() => {
    const map = new Map<string, Tag>();
    for (const tag of tagsResult.data) {
      map.set(tag.id, tag);
    }
    return map;
  }, [tagsResult.data]);

  // Lookup helpers
  const getIssue = useCallback(
    (issueId: string) => issuesById.get(issueId),
    [issuesById]
  );

  const getIssuesForStatus = useCallback(
    (statusId: string) =>
      issuesResult.data.filter((i) => i.status_id === statusId),
    [issuesResult.data]
  );

  const getAssigneesForIssue = useCallback(
    (issueId: string) =>
      issueAssigneesResult.data.filter((a) => a.issue_id === issueId),
    [issueAssigneesResult.data]
  );

  const getFollowersForIssue = useCallback(
    (issueId: string) =>
      issueFollowersResult.data.filter((f) => f.issue_id === issueId),
    [issueFollowersResult.data]
  );

  const getTagsForIssue = useCallback(
    (issueId: string) =>
      issueTagsResult.data.filter((t) => t.issue_id === issueId),
    [issueTagsResult.data]
  );

  const getTagObjectsForIssue = useCallback(
    (issueId: string) => {
      const issueTags = issueTagsResult.data.filter(
        (t) => t.issue_id === issueId
      );
      return issueTags
        .map((it) => tagsById.get(it.tag_id))
        .filter((t): t is Tag => t !== undefined);
    },
    [issueTagsResult.data, tagsById]
  );

  const getRelationshipsForIssue = useCallback(
    (issueId: string) =>
      issueRelationshipsResult.data.filter(
        (r) => r.issue_id === issueId || r.related_issue_id === issueId
      ),
    [issueRelationshipsResult.data]
  );

  const getStatus = useCallback(
    (statusId: string) => statusesById.get(statusId),
    [statusesById]
  );

  const getTag = useCallback(
    (tagId: string) => tagsById.get(tagId),
    [tagsById]
  );

  const getPullRequestsForIssue = useCallback(
    (issueId: string) =>
      pullRequestsResult.data.filter((pr) => pr.issue_id === issueId),
    [pullRequestsResult.data]
  );

  const getWorkspacesForIssue = useCallback(
    (issueId: string) =>
      workspacesResult.data.filter((w) => w.issue_id === issueId),
    [workspacesResult.data]
  );

  const value = useMemo<ProjectContextValue>(
    () => ({
      projectId,

      // Data
      issues: issuesResult.data,
      statuses: statusesResult.data,
      tags: tagsResult.data,
      issueAssignees: issueAssigneesResult.data,
      issueFollowers: issueFollowersResult.data,
      issueTags: issueTagsResult.data,
      issueRelationships: issueRelationshipsResult.data,
      pullRequests: pullRequestsResult.data,
      workspaces: workspacesResult.data,

      // Loading/error
      isLoading,
      error,
      retry,

      // Issue mutations
      insertIssue: issuesResult.insert,
      updateIssue: issuesResult.update,
      removeIssue: issuesResult.remove,

      // Status mutations
      insertStatus: statusesResult.insert,
      updateStatus: statusesResult.update,
      removeStatus: statusesResult.remove,

      // Tag mutations
      insertTag: tagsResult.insert,
      updateTag: tagsResult.update,
      removeTag: tagsResult.remove,

      // IssueAssignee mutations
      insertIssueAssignee: issueAssigneesResult.insert,
      removeIssueAssignee: issueAssigneesResult.remove,

      // IssueFollower mutations
      insertIssueFollower: issueFollowersResult.insert,
      removeIssueFollower: issueFollowersResult.remove,

      // IssueTag mutations
      insertIssueTag: issueTagsResult.insert,
      removeIssueTag: issueTagsResult.remove,

      // IssueRelationship mutations
      insertIssueRelationship: issueRelationshipsResult.insert,
      removeIssueRelationship: issueRelationshipsResult.remove,

      // Lookup helpers
      getIssue,
      getIssuesForStatus,
      getAssigneesForIssue,
      getFollowersForIssue,
      getTagsForIssue,
      getTagObjectsForIssue,
      getRelationshipsForIssue,
      getStatus,
      getTag,
      getPullRequestsForIssue,
      getWorkspacesForIssue,

      // Computed aggregations
      issuesById,
      statusesById,
      tagsById,
    }),
    [
      projectId,
      issuesResult,
      statusesResult,
      tagsResult,
      issueAssigneesResult,
      issueFollowersResult,
      issueTagsResult,
      issueRelationshipsResult,
      pullRequestsResult,
      workspacesResult,
      isLoading,
      error,
      retry,
      getIssue,
      getIssuesForStatus,
      getAssigneesForIssue,
      getFollowersForIssue,
      getTagsForIssue,
      getTagObjectsForIssue,
      getRelationshipsForIssue,
      getStatus,
      getTag,
      getPullRequestsForIssue,
      getWorkspacesForIssue,
      issuesById,
      statusesById,
      tagsById,
    ]
  );

  return (
    <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>
  );
}
