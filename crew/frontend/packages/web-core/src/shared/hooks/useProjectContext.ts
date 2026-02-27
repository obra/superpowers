import { useContext } from 'react';
import { createHmrContext } from '@/shared/lib/hmrContext';
import type { InsertResult, MutationResult } from '@/shared/lib/electric/types';
import type { SyncError } from '@/shared/lib/electric/types';
import type {
  Issue,
  ProjectStatus,
  Tag,
  IssueAssignee,
  IssueFollower,
  IssueTag,
  IssueRelationship,
  PullRequest,
  Workspace,
  CreateIssueRequest,
  UpdateIssueRequest,
  CreateProjectStatusRequest,
  UpdateProjectStatusRequest,
  CreateTagRequest,
  UpdateTagRequest,
  CreateIssueAssigneeRequest,
  CreateIssueFollowerRequest,
  CreateIssueTagRequest,
  CreateIssueRelationshipRequest,
} from 'shared/remote-types';

/**
 * ProjectContext provides project-scoped data and mutations.
 *
 * Entities synced at project scope:
 * - Issues (data + mutations)
 * - ProjectStatuses (data + mutations)
 * - Tags (data + mutations)
 * - IssueAssignees (data + mutations)
 * - IssueFollowers (data + mutations)
 * - IssueTags (data + mutations)
 * - IssueRelationships (data + mutations)
 * - PullRequests (data only)
 * - Workspaces (data only)
 */
export interface ProjectContextValue {
  projectId: string;

  // Normalized data arrays
  issues: Issue[];
  statuses: ProjectStatus[];
  tags: Tag[];
  issueAssignees: IssueAssignee[];
  issueFollowers: IssueFollower[];
  issueTags: IssueTag[];
  issueRelationships: IssueRelationship[];
  pullRequests: PullRequest[];
  workspaces: Workspace[];

  // Loading/error state
  isLoading: boolean;
  error: SyncError | null;
  retry: () => void;

  // Issue mutations
  insertIssue: (data: CreateIssueRequest) => InsertResult<Issue>;
  updateIssue: (
    id: string,
    changes: Partial<UpdateIssueRequest>
  ) => MutationResult;
  removeIssue: (id: string) => MutationResult;

  // Status mutations
  insertStatus: (
    data: CreateProjectStatusRequest
  ) => InsertResult<ProjectStatus>;
  updateStatus: (
    id: string,
    changes: Partial<UpdateProjectStatusRequest>
  ) => MutationResult;
  removeStatus: (id: string) => MutationResult;

  // Tag mutations
  insertTag: (data: CreateTagRequest) => InsertResult<Tag>;
  updateTag: (id: string, changes: Partial<UpdateTagRequest>) => MutationResult;
  removeTag: (id: string) => MutationResult;

  // IssueAssignee mutations
  insertIssueAssignee: (
    data: CreateIssueAssigneeRequest
  ) => InsertResult<IssueAssignee>;
  removeIssueAssignee: (id: string) => MutationResult;

  // IssueFollower mutations
  insertIssueFollower: (
    data: CreateIssueFollowerRequest
  ) => InsertResult<IssueFollower>;
  removeIssueFollower: (id: string) => MutationResult;

  // IssueTag mutations
  insertIssueTag: (data: CreateIssueTagRequest) => InsertResult<IssueTag>;
  removeIssueTag: (id: string) => MutationResult;

  // IssueRelationship mutations
  insertIssueRelationship: (
    data: CreateIssueRelationshipRequest
  ) => InsertResult<IssueRelationship>;
  removeIssueRelationship: (id: string) => MutationResult;

  // Lookup helpers
  getIssue: (issueId: string) => Issue | undefined;
  getIssuesForStatus: (statusId: string) => Issue[];
  getAssigneesForIssue: (issueId: string) => IssueAssignee[];
  getFollowersForIssue: (issueId: string) => IssueFollower[];
  getTagsForIssue: (issueId: string) => IssueTag[];
  getTagObjectsForIssue: (issueId: string) => Tag[];
  getRelationshipsForIssue: (issueId: string) => IssueRelationship[];
  getStatus: (statusId: string) => ProjectStatus | undefined;
  getTag: (tagId: string) => Tag | undefined;
  getPullRequestsForIssue: (issueId: string) => PullRequest[];
  getWorkspacesForIssue: (issueId: string) => Workspace[];

  // Computed aggregations (Maps for O(1) lookup)
  issuesById: Map<string, Issue>;
  statusesById: Map<string, ProjectStatus>;
  tagsById: Map<string, Tag>;
}

export const ProjectContext = createHmrContext<ProjectContextValue | null>(
  'RemoteProjectContext',
  null
);

export function useProjectContext(): ProjectContextValue {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProjectContext must be used within a ProjectProvider');
  }
  return context;
}
