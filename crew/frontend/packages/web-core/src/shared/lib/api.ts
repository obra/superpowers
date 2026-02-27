// Import all necessary types from shared types

import {
  ApprovalStatus,
  ApiResponse,
  Config,
  CreateFollowUpAttempt,
  ResetProcessRequest,
  EditorType,
  CreatePrApiRequest,
  CreateTag,
  DirectoryListResponse,
  DirectoryEntry,
  ExecutionProcess,
  ExecutionProcessRepoState,
  GitBranch,
  Repo,
  RepoWithTargetBranch,
  UpdateRepo,
  SearchMode,
  SearchResult,
  Tag,
  TagSearchParams,
  UpdateTag,
  UserSystemInfo,
  McpServerQuery,
  UpdateMcpServersBody,
  GetMcpServerResponse,
  ImageResponse,
  GitOperationError,
  ApprovalResponse,
  RebaseTaskAttemptRequest,
  ChangeTargetBranchRequest,
  ChangeTargetBranchResponse,
  RenameBranchRequest,
  RenameBranchResponse,
  CheckEditorAvailabilityResponse,
  AvailabilityInfo,
  BaseCodingAgent,
  ExecutorConfig,
  DraftFollowUpData,
  AgentPresetOptionsQuery,
  RunAgentSetupRequest,
  RunAgentSetupResponse,
  GhCliSetupError,
  RunScriptError,
  StatusResponse,
  ListOrganizationsResponse,
  OrganizationMemberWithProfile,
  ListMembersResponse,
  CreateOrganizationRequest,
  CreateOrganizationResponse,
  CreateInvitationRequest,
  CreateInvitationResponse,
  RevokeInvitationRequest,
  UpdateMemberRoleRequest,
  UpdateMemberRoleResponse,
  Invitation,
  ListInvitationsResponse,
  OpenEditorResponse,
  OpenEditorRequest,
  PrError,
  Scratch,
  ScratchType,
  CreateScratch,
  UpdateScratch,
  PushError,
  TokenResponse,
  CurrentUserResponse,
  QueueStatus,
  PrCommentsResponse,
  MergeTaskAttemptRequest,
  PushTaskAttemptRequest,
  RepoBranchStatus,
  AbortConflictsRequest,
  ContinueRebaseRequest,
  Session,
  Workspace,
  StartReviewRequest,
  ReviewError,
  OpenPrInfo,
  GitRemote,
  ListPrsError,
  AttachExistingPrRequest,
  AttachPrResponse,
  CreateWorkspaceFromPrBody,
  CreateWorkspaceFromPrResponse,
  CreateFromPrError,
  MigrationRequest,
  MigrationResponse,
  Project,
  CreateAndStartWorkspaceRequest,
  CreateAndStartWorkspaceResponse,
  RelayPairedClient,
  ListRelayPairedClientsResponse,
  RemoveRelayPairedClientResponse,
} from 'shared/types';
import type { Project as RemoteProject } from 'shared/remote-types';
import type { WorkspaceWithSession } from '@/shared/types/attempt';
import { createWorkspaceWithSession } from '@/shared/types/attempt';
import { makeRequest as makeRemoteRequest } from '@/shared/lib/remoteApi';
import { makeLocalApiRequest } from '@/shared/lib/localApiTransport';

export class ApiError<E = unknown> extends Error {
  public status?: number;
  public error_data?: E;

  constructor(
    message: string,
    public statusCode?: number,
    public response?: Response,
    error_data?: E
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = statusCode;
    this.error_data = error_data;
  }
}

const makeRequest = async (url: string, options: RequestInit = {}) => {
  const headers = new Headers(options.headers ?? {});
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  return makeLocalApiRequest(url, {
    ...options,
    headers,
  });
};

export type Ok<T> = { success: true; data: T };
export type Err<E> = { success: false; error: E | undefined; message?: string };

// Result type for endpoints that need typed errors
export type Result<T, E> = Ok<T> | Err<E>;

type ListRemoteProjectsResponse = {
  projects: RemoteProject[];
};

export type OrganizationBillingStatus =
  | 'free'
  | 'active'
  | 'past_due'
  | 'cancelled'
  | 'requires_subscription';

export interface OrganizationBillingStatusResponse {
  status: OrganizationBillingStatus;
  billing_enabled: boolean;
  seat_info: {
    current_members: number;
    free_seats: number;
    requires_subscription: boolean;
    subscription: {
      status: string;
      current_period_end: string;
      cancel_at_period_end: boolean;
      quantity: number;
      unit_amount: number;
    } | null;
  } | null;
}

// Special handler for Result-returning endpoints
const handleApiResponseAsResult = async <T, E>(
  response: Response
): Promise<Result<T, E>> => {
  if (!response.ok) {
    // HTTP error - no structured error data
    let errorMessage = `Request failed with status ${response.status}`;

    try {
      const errorData = await response.json();
      if (errorData.message) {
        errorMessage = errorData.message;
      }
    } catch {
      errorMessage = response.statusText || errorMessage;
    }

    return {
      success: false,
      error: undefined,
      message: errorMessage,
    };
  }

  const result: ApiResponse<T, E> = await response.json();

  if (!result.success) {
    return {
      success: false,
      error: result.error_data || undefined,
      message: result.message || undefined,
    };
  }

  return { success: true, data: result.data as T };
};

export const handleApiResponse = async <T, E = T>(
  response: Response
): Promise<T> => {
  if (!response.ok) {
    let errorMessage = `Request failed with status ${response.status}`;

    try {
      const errorData = await response.json();
      if (errorData.message) {
        errorMessage = errorData.message;
      }
    } catch {
      // Fallback to status text if JSON parsing fails
      errorMessage = response.statusText || errorMessage;
    }

    console.error('[API Error]', {
      message: errorMessage,
      status: response.status,
      response,
      endpoint: response.url,
      timestamp: new Date().toISOString(),
    });
    throw new ApiError<E>(errorMessage, response.status, response);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const result: ApiResponse<T, E> = await response.json();

  if (!result.success) {
    // Check for error_data first (structured errors), then fall back to message
    if (result.error_data) {
      console.error('[API Error with data]', {
        error_data: result.error_data,
        message: result.message,
        status: response.status,
        response,
        endpoint: response.url,
        timestamp: new Date().toISOString(),
      });
      // Throw a properly typed error with the error data
      throw new ApiError<E>(
        result.message || 'API request failed',
        response.status,
        response,
        result.error_data
      );
    }

    console.error('[API Error]', {
      message: result.message || 'API request failed',
      status: response.status,
      response,
      endpoint: response.url,
      timestamp: new Date().toISOString(),
    });
    throw new ApiError<E>(
      result.message || 'API request failed',
      response.status,
      response
    );
  }

  return result.data as T;
};

// Sessions API
export const sessionsApi = {
  getByWorkspace: async (workspaceId: string): Promise<Session[]> => {
    const response = await makeRequest(
      `/api/sessions?workspace_id=${workspaceId}`
    );
    return handleApiResponse<Session[]>(response);
  },

  getById: async (sessionId: string): Promise<Session> => {
    const response = await makeRequest(`/api/sessions/${sessionId}`);
    return handleApiResponse<Session>(response);
  },

  create: async (data: {
    workspace_id: string;
    executor?: string;
  }): Promise<Session> => {
    const response = await makeRequest('/api/sessions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return handleApiResponse<Session>(response);
  },

  followUp: async (
    sessionId: string,
    data: CreateFollowUpAttempt
  ): Promise<ExecutionProcess> => {
    const response = await makeRequest(`/api/sessions/${sessionId}/follow-up`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return handleApiResponse<ExecutionProcess>(response);
  },

  startReview: async (
    sessionId: string,
    data: StartReviewRequest
  ): Promise<ExecutionProcess> => {
    const response = await makeRequest(`/api/sessions/${sessionId}/review`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return handleApiResponse<ExecutionProcess, ReviewError>(response);
  },

  reset: async (
    sessionId: string,
    data: ResetProcessRequest
  ): Promise<void> => {
    const response = await makeRequest(`/api/sessions/${sessionId}/reset`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return handleApiResponse<void>(response);
  },
};

// Task Attempts APIs
export const attemptsApi = {
  createAndStart: async (
    data: CreateAndStartWorkspaceRequest
  ): Promise<CreateAndStartWorkspaceResponse> => {
    const response = await makeRequest(`/api/task-attempts/create-and-start`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return handleApiResponse<CreateAndStartWorkspaceResponse>(response);
  },

  getAll: async (taskId: string): Promise<Workspace[]> => {
    const response = await makeRequest(`/api/task-attempts?task_id=${taskId}`);
    return handleApiResponse<Workspace[]>(response);
  },

  /** Get all workspaces across all tasks (newest first) */
  getAllWorkspaces: async (): Promise<Workspace[]> => {
    const response = await makeRequest('/api/task-attempts');
    return handleApiResponse<Workspace[]>(response);
  },

  get: async (attemptId: string): Promise<Workspace> => {
    const response = await makeRequest(`/api/task-attempts/${attemptId}`);
    return handleApiResponse<Workspace>(response);
  },

  update: async (
    attemptId: string,
    data: { archived?: boolean; pinned?: boolean; name?: string }
  ): Promise<Workspace> => {
    const response = await makeRequest(`/api/task-attempts/${attemptId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return handleApiResponse<Workspace>(response);
  },

  /** Get workspace with latest session */
  getWithSession: async (attemptId: string): Promise<WorkspaceWithSession> => {
    const [workspace, sessions] = await Promise.all([
      attemptsApi.get(attemptId),
      sessionsApi.getByWorkspace(attemptId),
    ]);
    return createWorkspaceWithSession(workspace, sessions[0]);
  },

  stop: async (attemptId: string): Promise<void> => {
    const response = await makeRequest(`/api/task-attempts/${attemptId}/stop`, {
      method: 'POST',
    });
    return handleApiResponse<void>(response);
  },

  delete: async (
    attemptId: string,
    deleteBranches?: boolean
  ): Promise<void> => {
    const params = new URLSearchParams();
    if (deleteBranches) {
      params.set('delete_branches', 'true');
    }
    const queryString = params.toString();
    const url = `/api/task-attempts/${attemptId}${queryString ? `?${queryString}` : ''}`;
    const response = await makeRequest(url, {
      method: 'DELETE',
    });
    return handleApiResponse<void>(response);
  },

  linkToIssue: async (
    workspaceId: string,
    projectId: string,
    issueId: string
  ): Promise<void> => {
    const response = await makeRequest(
      `/api/task-attempts/${workspaceId}/link`,
      {
        method: 'POST',
        body: JSON.stringify({ project_id: projectId, issue_id: issueId }),
      }
    );
    return handleApiResponse<void>(response);
  },

  unlinkFromIssue: async (workspaceId: string): Promise<void> => {
    const response = await makeRequest(
      `/api/task-attempts/${workspaceId}/unlink`,
      { method: 'POST' }
    );
    return handleApiResponse<void>(response);
  },

  runAgentSetup: async (
    attemptId: string,
    data: RunAgentSetupRequest
  ): Promise<RunAgentSetupResponse> => {
    const response = await makeRequest(
      `/api/task-attempts/${attemptId}/run-agent-setup`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
    return handleApiResponse<RunAgentSetupResponse>(response);
  },

  openEditor: async (
    attemptId: string,
    data: OpenEditorRequest
  ): Promise<OpenEditorResponse> => {
    const response = await makeRequest(
      `/api/task-attempts/${attemptId}/open-editor`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
    return handleApiResponse<OpenEditorResponse>(response);
  },

  getBranchStatus: async (attemptId: string): Promise<RepoBranchStatus[]> => {
    const response = await makeRequest(
      `/api/task-attempts/${attemptId}/branch-status`
    );
    return handleApiResponse<RepoBranchStatus[]>(response);
  },

  getRepos: async (attemptId: string): Promise<RepoWithTargetBranch[]> => {
    const response = await makeRequest(`/api/task-attempts/${attemptId}/repos`);
    return handleApiResponse<RepoWithTargetBranch[]>(response);
  },

  getFirstUserMessage: async (attemptId: string): Promise<string | null> => {
    const response = await makeRequest(
      `/api/task-attempts/${attemptId}/first-message`
    );
    return handleApiResponse<string | null>(response);
  },

  merge: async (
    attemptId: string,
    data: MergeTaskAttemptRequest
  ): Promise<void> => {
    const response = await makeRequest(
      `/api/task-attempts/${attemptId}/merge`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
    return handleApiResponse<void>(response);
  },

  push: async (
    attemptId: string,
    data: PushTaskAttemptRequest
  ): Promise<Result<void, PushError>> => {
    const response = await makeRequest(`/api/task-attempts/${attemptId}/push`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return handleApiResponseAsResult<void, PushError>(response);
  },

  forcePush: async (
    attemptId: string,
    data: PushTaskAttemptRequest
  ): Promise<Result<void, PushError>> => {
    const response = await makeRequest(
      `/api/task-attempts/${attemptId}/push/force`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
    return handleApiResponseAsResult<void, PushError>(response);
  },

  rebase: async (
    attemptId: string,
    data: RebaseTaskAttemptRequest
  ): Promise<Result<void, GitOperationError>> => {
    const response = await makeRequest(
      `/api/task-attempts/${attemptId}/rebase`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
    return handleApiResponseAsResult<void, GitOperationError>(response);
  },

  change_target_branch: async (
    attemptId: string,
    data: ChangeTargetBranchRequest
  ): Promise<ChangeTargetBranchResponse> => {
    const response = await makeRequest(
      `/api/task-attempts/${attemptId}/change-target-branch`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
    return handleApiResponse<ChangeTargetBranchResponse>(response);
  },

  renameBranch: async (
    attemptId: string,
    newBranchName: string
  ): Promise<RenameBranchResponse> => {
    const payload: RenameBranchRequest = {
      new_branch_name: newBranchName,
    };
    const response = await makeRequest(
      `/api/task-attempts/${attemptId}/rename-branch`,
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    );
    return handleApiResponse<RenameBranchResponse>(response);
  },

  abortConflicts: async (
    attemptId: string,
    data: AbortConflictsRequest
  ): Promise<void> => {
    const response = await makeRequest(
      `/api/task-attempts/${attemptId}/conflicts/abort`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
    return handleApiResponse<void>(response);
  },

  continueRebase: async (
    attemptId: string,
    data: ContinueRebaseRequest
  ): Promise<void> => {
    const response = await makeRequest(
      `/api/task-attempts/${attemptId}/rebase/continue`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
    return handleApiResponse<void>(response);
  },

  createPR: async (
    attemptId: string,
    data: CreatePrApiRequest
  ): Promise<Result<string, PrError>> => {
    const response = await makeRequest(`/api/task-attempts/${attemptId}/pr`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return handleApiResponseAsResult<string, PrError>(response);
  },

  /** Try to auto-attach a PR by matching the workspace branch */
  attachPr: async (
    attemptId: string,
    data: AttachExistingPrRequest
  ): Promise<Result<AttachPrResponse, PrError>> => {
    const response = await makeRequest(
      `/api/task-attempts/${attemptId}/pr/attach`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
    return handleApiResponseAsResult<AttachPrResponse, PrError>(response);
  },

  startDevServer: async (attemptId: string): Promise<ExecutionProcess[]> => {
    const response = await makeRequest(
      `/api/task-attempts/${attemptId}/start-dev-server`,
      {
        method: 'POST',
      }
    );
    return handleApiResponse<ExecutionProcess[]>(response);
  },

  setupGhCli: async (attemptId: string): Promise<ExecutionProcess> => {
    const response = await makeRequest(
      `/api/task-attempts/${attemptId}/gh-cli-setup`,
      {
        method: 'POST',
      }
    );
    return handleApiResponse<ExecutionProcess, GhCliSetupError>(response);
  },

  runSetupScript: async (
    attemptId: string
  ): Promise<Result<ExecutionProcess, RunScriptError>> => {
    const response = await makeRequest(
      `/api/task-attempts/${attemptId}/run-setup-script`,
      {
        method: 'POST',
      }
    );
    return handleApiResponseAsResult<ExecutionProcess, RunScriptError>(
      response
    );
  },

  runCleanupScript: async (
    attemptId: string
  ): Promise<Result<ExecutionProcess, RunScriptError>> => {
    const response = await makeRequest(
      `/api/task-attempts/${attemptId}/run-cleanup-script`,
      {
        method: 'POST',
      }
    );
    return handleApiResponseAsResult<ExecutionProcess, RunScriptError>(
      response
    );
  },

  runArchiveScript: async (
    attemptId: string
  ): Promise<Result<ExecutionProcess, RunScriptError>> => {
    const response = await makeRequest(
      `/api/task-attempts/${attemptId}/run-archive-script`,
      {
        method: 'POST',
      }
    );
    return handleApiResponseAsResult<ExecutionProcess, RunScriptError>(
      response
    );
  },

  getPrComments: async (
    attemptId: string,
    repoId: string
  ): Promise<PrCommentsResponse> => {
    const response = await makeRequest(
      `/api/task-attempts/${attemptId}/pr/comments?repo_id=${encodeURIComponent(repoId)}`
    );
    return handleApiResponse<PrCommentsResponse>(response);
  },

  /** Mark all coding agent turns for a workspace as seen */
  markSeen: async (attemptId: string): Promise<void> => {
    const response = await makeRequest(
      `/api/task-attempts/${attemptId}/mark-seen`,
      {
        method: 'PUT',
      }
    );
    return handleApiResponse<void>(response);
  },

  /** Create a workspace directly from a pull request */
  createFromPr: async (
    data: CreateWorkspaceFromPrBody
  ): Promise<Result<CreateWorkspaceFromPrResponse, CreateFromPrError>> => {
    const response = await makeRequest('/api/task-attempts/from-pr', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return handleApiResponseAsResult<
      CreateWorkspaceFromPrResponse,
      CreateFromPrError
    >(response);
  },
};

// Execution Process APIs
export const executionProcessesApi = {
  getDetails: async (processId: string): Promise<ExecutionProcess> => {
    const response = await makeRequest(`/api/execution-processes/${processId}`);
    return handleApiResponse<ExecutionProcess>(response);
  },

  getRepoStates: async (
    processId: string
  ): Promise<ExecutionProcessRepoState[]> => {
    const response = await makeRequest(
      `/api/execution-processes/${processId}/repo-states`
    );
    return handleApiResponse<ExecutionProcessRepoState[]>(response);
  },

  stopExecutionProcess: async (processId: string): Promise<void> => {
    const response = await makeRequest(
      `/api/execution-processes/${processId}/stop`,
      {
        method: 'POST',
      }
    );
    return handleApiResponse<void>(response);
  },
};

// File System APIs
export const fileSystemApi = {
  list: async (path?: string): Promise<DirectoryListResponse> => {
    const queryParam = path ? `?path=${encodeURIComponent(path)}` : '';
    const response = await makeRequest(
      `/api/filesystem/directory${queryParam}`
    );
    return handleApiResponse<DirectoryListResponse>(response);
  },

  listGitRepos: async (path?: string): Promise<DirectoryEntry[]> => {
    const queryParam = path ? `?path=${encodeURIComponent(path)}` : '';
    const response = await makeRequest(
      `/api/filesystem/git-repos${queryParam}`
    );
    return handleApiResponse<DirectoryEntry[]>(response);
  },
};

// Repo APIs
export const repoApi = {
  list: async (): Promise<Repo[]> => {
    const response = await makeRequest('/api/repos');
    return handleApiResponse<Repo[]>(response);
  },

  listRecent: async (): Promise<Repo[]> => {
    const response = await makeRequest('/api/repos/recent');
    return handleApiResponse<Repo[]>(response);
  },

  getById: async (repoId: string): Promise<Repo> => {
    const response = await makeRequest(`/api/repos/${repoId}`);
    return handleApiResponse<Repo>(response);
  },

  update: async (repoId: string, data: UpdateRepo): Promise<Repo> => {
    const response = await makeRequest(`/api/repos/${repoId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return handleApiResponse<Repo>(response);
  },

  register: async (data: {
    path: string;
    display_name?: string;
  }): Promise<Repo> => {
    const response = await makeRequest('/api/repos', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return handleApiResponse<Repo>(response);
  },

  getBranches: async (repoId: string): Promise<GitBranch[]> => {
    const response = await makeRequest(`/api/repos/${repoId}/branches`);
    return handleApiResponse<GitBranch[]>(response);
  },

  init: async (data: {
    parent_path: string;
    folder_name: string;
  }): Promise<Repo> => {
    const response = await makeRequest('/api/repos/init', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return handleApiResponse<Repo>(response);
  },

  getBatch: async (ids: string[]): Promise<Repo[]> => {
    const response = await makeRequest('/api/repos/batch', {
      method: 'POST',
      body: JSON.stringify({ ids }),
    });
    return handleApiResponse<Repo[]>(response);
  },

  openEditor: async (
    repoId: string,
    data: OpenEditorRequest
  ): Promise<OpenEditorResponse> => {
    const response = await makeRequest(`/api/repos/${repoId}/open-editor`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return handleApiResponse<OpenEditorResponse>(response);
  },

  searchFiles: async (
    repoId: string,
    query: string,
    mode?: SearchMode,
    options?: RequestInit
  ): Promise<SearchResult[]> => {
    const modeParam = mode ? `&mode=${encodeURIComponent(mode)}` : '';
    const response = await makeRequest(
      `/api/repos/${repoId}/search?q=${encodeURIComponent(query)}${modeParam}`,
      options
    );
    return handleApiResponse<SearchResult[]>(response);
  },

  listOpenPrs: async (
    repoId: string,
    remoteName?: string
  ): Promise<Result<OpenPrInfo[], ListPrsError>> => {
    const params = remoteName
      ? `?remote=${encodeURIComponent(remoteName)}`
      : '';
    const response = await makeRequest(`/api/repos/${repoId}/prs${params}`);
    return handleApiResponseAsResult<OpenPrInfo[], ListPrsError>(response);
  },

  listRemotes: async (repoId: string): Promise<GitRemote[]> => {
    const response = await makeRequest(`/api/repos/${repoId}/remotes`);
    return handleApiResponse<GitRemote[]>(response);
  },
};

// Config APIs (backwards compatible)
export const configApi = {
  getConfig: async (): Promise<UserSystemInfo> => {
    const response = await makeRequest('/api/info', { cache: 'no-store' });
    return handleApiResponse<UserSystemInfo>(response);
  },
  saveConfig: async (config: Config): Promise<Config> => {
    const response = await makeRequest('/api/config', {
      method: 'PUT',
      body: JSON.stringify(config),
    });
    return handleApiResponse<Config>(response);
  },
  checkEditorAvailability: async (
    editorType: EditorType
  ): Promise<CheckEditorAvailabilityResponse> => {
    const response = await makeRequest(
      `/api/editors/check-availability?editor_type=${encodeURIComponent(editorType)}`
    );
    return handleApiResponse<CheckEditorAvailabilityResponse>(response);
  },
  checkAgentAvailability: async (
    agent: BaseCodingAgent
  ): Promise<AvailabilityInfo> => {
    const response = await makeRequest(
      `/api/agents/check-availability?executor=${encodeURIComponent(agent)}`
    );
    return handleApiResponse<AvailabilityInfo>(response);
  },
};

// Task Tags APIs (all tags are global)
export const tagsApi = {
  list: async (params?: TagSearchParams): Promise<Tag[]> => {
    const queryParam = params?.search
      ? `?search=${encodeURIComponent(params.search)}`
      : '';
    const response = await makeRequest(`/api/tags${queryParam}`);
    return handleApiResponse<Tag[]>(response);
  },

  create: async (data: CreateTag): Promise<Tag> => {
    const response = await makeRequest('/api/tags', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return handleApiResponse<Tag>(response);
  },

  update: async (tagId: string, data: UpdateTag): Promise<Tag> => {
    const response = await makeRequest(`/api/tags/${tagId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return handleApiResponse<Tag>(response);
  },

  delete: async (tagId: string): Promise<void> => {
    const response = await makeRequest(`/api/tags/${tagId}`, {
      method: 'DELETE',
    });
    return handleApiResponse<void>(response);
  },
};

// MCP Servers APIs
export const mcpServersApi = {
  load: async (query: McpServerQuery): Promise<GetMcpServerResponse> => {
    const params = new URLSearchParams(query);
    const response = await makeRequest(`/api/mcp-config?${params.toString()}`);
    return handleApiResponse<GetMcpServerResponse>(response);
  },
  save: async (
    query: McpServerQuery,
    data: UpdateMcpServersBody
  ): Promise<void> => {
    const params = new URLSearchParams(query);
    // params.set('profile', profile);
    const response = await makeRequest(`/api/mcp-config?${params.toString()}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const errorData = await response.json();
      console.error('[API Error] Failed to save MCP servers', {
        message: errorData.message,
        status: response.status,
        response,
        timestamp: new Date().toISOString(),
      });
      throw new ApiError(
        errorData.message || 'Failed to save MCP servers',
        response.status,
        response
      );
    }
  },
};

// Profiles API
export const profilesApi = {
  load: async (): Promise<{ content: string; path: string }> => {
    const response = await makeRequest('/api/profiles');
    return handleApiResponse<{ content: string; path: string }>(response);
  },
  save: async (content: string): Promise<string> => {
    const response = await makeRequest('/api/profiles', {
      method: 'PUT',
      body: content,
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return handleApiResponse<string>(response);
  },
};

// Images API
export const imagesApi = {
  upload: async (file: File): Promise<ImageResponse> => {
    const formData = new FormData();
    formData.append('image', file);

    const response = await makeLocalApiRequest('/api/images/upload', {
      method: 'POST',
      body: formData,
      credentials: 'include',
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new ApiError(
        `Failed to upload image: ${errorText}`,
        response.status,
        response
      );
    }

    return handleApiResponse<ImageResponse>(response);
  },

  uploadForTask: async (taskId: string, file: File): Promise<ImageResponse> => {
    const formData = new FormData();
    formData.append('image', file);

    const response = await makeLocalApiRequest(
      `/api/images/task/${taskId}/upload`,
      {
        method: 'POST',
        body: formData,
        credentials: 'include',
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new ApiError(
        `Failed to upload image: ${errorText}`,
        response.status,
        response
      );
    }

    return handleApiResponse<ImageResponse>(response);
  },

  /**
   * Upload an image for a task attempt and immediately copy it to the container.
   * Returns the image with a file_path that can be used in markdown.
   */
  uploadForAttempt: async (
    attemptId: string,
    file: File
  ): Promise<ImageResponse> => {
    const formData = new FormData();
    formData.append('image', file);

    const response = await makeLocalApiRequest(
      `/api/task-attempts/${attemptId}/images/upload`,
      {
        method: 'POST',
        body: formData,
        credentials: 'include',
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new ApiError(
        `Failed to upload image: ${errorText}`,
        response.status,
        response
      );
    }

    return handleApiResponse<ImageResponse>(response);
  },

  delete: async (imageId: string): Promise<void> => {
    const response = await makeRequest(`/api/images/${imageId}`, {
      method: 'DELETE',
    });
    return handleApiResponse<void>(response);
  },

  getTaskImages: async (taskId: string): Promise<ImageResponse[]> => {
    const response = await makeRequest(`/api/images/task/${taskId}`);
    return handleApiResponse<ImageResponse[]>(response);
  },

  getImageUrl: (imageId: string): string => {
    return `/api/images/${imageId}/file`;
  },
};

// Approval API
export const approvalsApi = {
  respond: async (
    approvalId: string,
    payload: ApprovalResponse,
    signal?: AbortSignal
  ): Promise<ApprovalStatus> => {
    const res = await makeRequest(`/api/approvals/${approvalId}/respond`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal,
    });

    return handleApiResponse<ApprovalStatus>(res);
  },
};

// OAuth API
export const oauthApi = {
  handoffInit: async (
    provider: string,
    returnTo: string
  ): Promise<{ handoff_id: string; authorize_url: string }> => {
    const response = await makeRequest('/api/auth/handoff/init', {
      method: 'POST',
      body: JSON.stringify({ provider, return_to: returnTo }),
    });
    return handleApiResponse<{ handoff_id: string; authorize_url: string }>(
      response
    );
  },

  status: async (): Promise<StatusResponse> => {
    const response = await makeRequest('/api/auth/status', {
      cache: 'no-store',
    });
    return handleApiResponse<StatusResponse>(response);
  },

  logout: async (): Promise<void> => {
    const response = await makeRequest('/api/auth/logout', {
      method: 'POST',
    });
    if (!response.ok) {
      throw new ApiError(
        `Logout failed with status ${response.status}`,
        response.status,
        response
      );
    }
  },

  /** Returns the current access token for the remote server (auto-refreshes if needed) */
  getToken: async (): Promise<TokenResponse | null> => {
    const response = await makeRequest('/api/auth/token');
    if (response.status === 401) {
      throw new ApiError('Unauthorized', 401, response);
    }
    if (!response.ok) return null;
    return handleApiResponse<TokenResponse>(response);
  },

  /** Returns the user ID of the currently authenticated user */
  getCurrentUser: async (): Promise<CurrentUserResponse> => {
    const response = await makeRequest('/api/auth/user');
    return handleApiResponse<CurrentUserResponse>(response);
  },
};

/**
 * @deprecated Use `tokenManager.getToken()` from
 * `@/shared/lib/auth/tokenManager` instead.
 * This function does not handle 401 responses or token refresh coordination.
 */
export async function getCachedToken(): Promise<string | null> {
  const { tokenManager } = await import('@/shared/lib/auth/tokenManager');
  return tokenManager.getToken();
}

const handleRemoteResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    let errorMessage = `Request failed with status ${response.status}`;

    try {
      const body = (await response.json()) as {
        error?: string;
        message?: string;
      };
      errorMessage = body.error || body.message || errorMessage;
    } catch {
      errorMessage = response.statusText || errorMessage;
    }

    throw new ApiError(errorMessage, response.status, response);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
};

// Organizations API
export const organizationsApi = {
  getMembers: async (
    orgId: string
  ): Promise<OrganizationMemberWithProfile[]> => {
    const response = await makeRemoteRequest(
      `/v1/organizations/${orgId}/members`
    );
    const result = await handleRemoteResponse<ListMembersResponse>(response);
    return result.members;
  },

  getUserOrganizations: async (): Promise<ListOrganizationsResponse> => {
    const response = await makeRemoteRequest('/v1/organizations');
    return handleRemoteResponse<ListOrganizationsResponse>(response);
  },

  createOrganization: async (
    data: CreateOrganizationRequest
  ): Promise<CreateOrganizationResponse> => {
    const response = await makeRemoteRequest('/v1/organizations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleRemoteResponse<CreateOrganizationResponse>(response);
  },

  createInvitation: async (
    orgId: string,
    data: CreateInvitationRequest
  ): Promise<CreateInvitationResponse> => {
    const response = await makeRemoteRequest(
      `/v1/organizations/${orgId}/invitations`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }
    );
    return handleRemoteResponse<CreateInvitationResponse>(response);
  },

  removeMember: async (orgId: string, userId: string): Promise<void> => {
    const response = await makeRemoteRequest(
      `/v1/organizations/${orgId}/members/${userId}`,
      {
        method: 'DELETE',
      }
    );
    return handleRemoteResponse<void>(response);
  },

  updateMemberRole: async (
    orgId: string,
    userId: string,
    data: UpdateMemberRoleRequest
  ): Promise<UpdateMemberRoleResponse> => {
    const response = await makeRemoteRequest(
      `/v1/organizations/${orgId}/members/${userId}/role`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }
    );
    return handleRemoteResponse<UpdateMemberRoleResponse>(response);
  },

  listInvitations: async (orgId: string): Promise<Invitation[]> => {
    const response = await makeRemoteRequest(
      `/v1/organizations/${orgId}/invitations`
    );
    const result =
      await handleRemoteResponse<ListInvitationsResponse>(response);
    return result.invitations;
  },

  revokeInvitation: async (
    orgId: string,
    invitationId: string
  ): Promise<void> => {
    const body: RevokeInvitationRequest = { invitation_id: invitationId };
    const response = await makeRemoteRequest(
      `/v1/organizations/${orgId}/invitations/revoke`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }
    );
    return handleRemoteResponse<void>(response);
  },

  getBillingStatus: async (
    orgId: string
  ): Promise<OrganizationBillingStatusResponse> => {
    const response = await makeRemoteRequest(
      `/v1/organizations/${orgId}/billing`
    );
    return handleRemoteResponse<OrganizationBillingStatusResponse>(response);
  },

  createCheckoutSession: async (
    orgId: string,
    successUrl: string,
    cancelUrl: string
  ): Promise<{ url: string }> => {
    const response = await makeRemoteRequest(
      `/v1/organizations/${orgId}/billing/checkout`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success_url: successUrl,
          cancel_url: cancelUrl,
        }),
      }
    );
    return handleRemoteResponse<{ url: string }>(response);
  },

  createPortalSession: async (
    orgId: string,
    returnUrl: string
  ): Promise<{ url: string }> => {
    const response = await makeRemoteRequest(
      `/v1/organizations/${orgId}/billing/portal`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          return_url: returnUrl,
        }),
      }
    );
    return handleRemoteResponse<{ url: string }>(response);
  },

  deleteOrganization: async (orgId: string): Promise<void> => {
    const response = await makeRemoteRequest(`/v1/organizations/${orgId}`, {
      method: 'DELETE',
    });
    return handleRemoteResponse<void>(response);
  },
};

export const remoteProjectsApi = {
  listByOrganization: async (
    organizationId: string
  ): Promise<RemoteProject[]> => {
    const response = await makeRequest(
      `/api/remote/projects?organization_id=${encodeURIComponent(organizationId)}`
    );
    const result =
      await handleApiResponse<ListRemoteProjectsResponse>(response);
    return result.projects;
  },
};

// Scratch API
export const scratchApi = {
  create: async (
    scratchType: ScratchType,
    id: string,
    data: CreateScratch
  ): Promise<Scratch> => {
    const response = await makeRequest(`/api/scratch/${scratchType}/${id}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return handleApiResponse<Scratch>(response);
  },

  get: async (scratchType: ScratchType, id: string): Promise<Scratch> => {
    const response = await makeRequest(`/api/scratch/${scratchType}/${id}`);
    return handleApiResponse<Scratch>(response);
  },

  update: async (
    scratchType: ScratchType,
    id: string,
    data: UpdateScratch
  ): Promise<void> => {
    const response = await makeRequest(`/api/scratch/${scratchType}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return handleApiResponse<void>(response);
  },

  delete: async (scratchType: ScratchType, id: string): Promise<void> => {
    const response = await makeRequest(`/api/scratch/${scratchType}/${id}`, {
      method: 'DELETE',
    });
    return handleApiResponse<void>(response);
  },

  getStreamUrl: (scratchType: ScratchType, id: string): string =>
    `/api/scratch/${scratchType}/${id}/stream/ws`,
};

// Agents API
export const agentsApi = {
  getDiscoveredOptionsStreamUrl: (
    agent: BaseCodingAgent,
    opts?: { workspaceId?: string; repoId?: string }
  ): string => {
    const params = new URLSearchParams();
    params.set('executor', agent);
    if (opts?.workspaceId) params.set('workspace_id', opts.workspaceId);
    if (opts?.repoId) params.set('repo_id', opts.repoId);

    return `/api/agents/discovered-options/ws?${params.toString()}`;
  },

  getPresetOptions: async (
    query: AgentPresetOptionsQuery
  ): Promise<ExecutorConfig> => {
    const params = new URLSearchParams();
    params.set('executor', query.executor);
    if (query.variant) params.set('variant', query.variant);
    const response = await makeRequest(
      `/api/agents/preset-options?${params.toString()}`
    );
    return handleApiResponse<ExecutorConfig>(response);
  },
};

// Queue API for session follow-up messages
export const queueApi = {
  /**
   * Queue a follow-up message to be executed when current execution finishes
   */
  queue: async (
    sessionId: string,
    data: DraftFollowUpData
  ): Promise<QueueStatus> => {
    const response = await makeRequest(`/api/sessions/${sessionId}/queue`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return handleApiResponse<QueueStatus>(response);
  },

  /**
   * Cancel a queued follow-up message
   */
  cancel: async (sessionId: string): Promise<QueueStatus> => {
    const response = await makeRequest(`/api/sessions/${sessionId}/queue`, {
      method: 'DELETE',
    });
    return handleApiResponse<QueueStatus>(response);
  },

  /**
   * Get the current queue status for a session
   */
  getStatus: async (sessionId: string): Promise<QueueStatus> => {
    const response = await makeRequest(`/api/sessions/${sessionId}/queue`);
    return handleApiResponse<QueueStatus>(response);
  },
};

// Migration API
export const migrationApi = {
  listProjects: async (): Promise<Project[]> => {
    const response = await makeRequest('/api/migration/projects');
    return handleApiResponse<Project[]>(response);
  },

  start: async (data: MigrationRequest): Promise<MigrationResponse> => {
    const response = await makeRequest('/api/migration/start', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return handleApiResponse<MigrationResponse>(response);
  },
};

// Relay API
export const relayApi = {
  getEnrollmentCode: async (): Promise<{ enrollment_code: string }> => {
    const response = await makeRequest('/api/relay-auth/enrollment-code', {
      method: 'POST',
    });
    return handleApiResponse<{ enrollment_code: string }>(response);
  },

  listPairedClients: async (): Promise<RelayPairedClient[]> => {
    const response = await makeRequest('/api/relay-auth/clients');
    const body =
      await handleApiResponse<ListRelayPairedClientsResponse>(response);
    return body.clients;
  },

  removePairedClient: async (
    clientId: string
  ): Promise<RemoveRelayPairedClientResponse> => {
    const response = await makeRequest(
      `/api/relay-auth/clients/${encodeURIComponent(clientId)}`,
      {
        method: 'DELETE',
      }
    );
    return handleApiResponse<RemoveRelayPairedClientResponse>(response);
  },
};

// Search API (multi-repo file search)
export const searchApi = {
  searchFiles: async (
    repoIds: string[],
    query: string,
    mode?: SearchMode,
    options?: RequestInit
  ): Promise<SearchResult[]> => {
    const repoIdsParam = repoIds.join(',');
    const modeParam = mode ? `&mode=${encodeURIComponent(mode)}` : '';
    const response = await makeRequest(
      `/api/search?q=${encodeURIComponent(query)}&repo_ids=${encodeURIComponent(repoIdsParam)}${modeParam}`,
      options
    );
    return handleApiResponse<SearchResult[]>(response);
  },
};
