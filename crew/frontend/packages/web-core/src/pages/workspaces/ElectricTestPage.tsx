import { useState } from 'react';
import { useAuth } from '@/shared/hooks/auth/useAuth';
import { useUserOrganizations } from '@/shared/hooks/useUserOrganizations';
import { useCurrentUser } from '@/shared/hooks/auth/useCurrentUser';
import { useShape } from '@/shared/integrations/electric/hooks';
import type { SyncError } from '@/shared/lib/electric/types';
import {
  PROJECTS_SHAPE,
  PROJECT_TAGS_SHAPE,
  ISSUE_COMMENTS_SHAPE,
  PROJECT_MUTATION,
  TAG_MUTATION,
  ISSUE_COMMENT_MUTATION,
  NOTIFICATIONS_SHAPE,
  PROJECT_ISSUES_SHAPE,
  PROJECT_WORKSPACES_SHAPE,
  PROJECT_PROJECT_STATUSES_SHAPE,
  PROJECT_ISSUE_ASSIGNEES_SHAPE,
  PROJECT_ISSUE_FOLLOWERS_SHAPE,
  PROJECT_ISSUE_TAGS_SHAPE,
  PROJECT_ISSUE_RELATIONSHIPS_SHAPE,
  ISSUE_REACTIONS_SHAPE,
  type Project,
  type Issue,
} from 'shared/remote-types';

// ============================================================================
// Types
// ============================================================================

type OrgCollectionType = 'projects' | 'notifications';
type ProjectCollectionType =
  | 'issues'
  | 'workspaces'
  | 'statuses'
  | 'tags'
  | 'assignees'
  | 'followers'
  | 'issueTags'
  | 'dependencies';
type IssueCollectionType = 'comments' | 'reactions';

// ============================================================================
// Helper Components
// ============================================================================

function CollectionTabs<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-base mb-base">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`px-base py-half text-sm rounded-sm ${
            value === opt.value
              ? 'bg-brand text-on-brand'
              : 'bg-secondary text-normal hover:bg-panel'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function LoadingState({ message }: { message: string }) {
  return (
    <div className="p-base bg-secondary border rounded-sm text-low">
      {message}
    </div>
  );
}

function ErrorState({
  syncError,
  title,
  onRetry,
}: {
  syncError: SyncError | null;
  title: string;
  onRetry?: () => void;
}) {
  if (!syncError) return null;
  return (
    <div className="p-base bg-error/10 border border-error rounded-sm text-error">
      <p className="font-medium">
        {title}
        {syncError.status ? ` (${syncError.status})` : ''}:
      </p>
      <pre className="mt-base text-sm overflow-auto">{syncError.message}</pre>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-base px-base py-half bg-error text-on-brand rounded-sm"
        >
          Retry
        </button>
      )}
    </div>
  );
}

function DataTable<T extends Record<string, unknown>>({
  data,
  columns,
  onRowClick,
  selectedId,
  getRowId,
}: {
  data: T[];
  columns: {
    key: string;
    label: string;
    render?: (item: T) => React.ReactNode;
  }[];
  onRowClick?: (item: T) => void;
  selectedId?: string;
  getRowId: (item: T) => string;
}) {
  if (data.length === 0) {
    return (
      <div className="p-base bg-secondary border rounded-sm text-low">
        No data found.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border rounded-sm text-sm">
        <thead className="bg-secondary">
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className="px-base py-half text-left font-medium text-normal border-b"
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((item) => {
            const rowId = getRowId(item);
            const isSelected = selectedId === rowId;
            return (
              <tr
                key={rowId}
                onClick={() => onRowClick?.(item)}
                className={`${onRowClick ? 'cursor-pointer' : ''} ${
                  isSelected ? 'bg-brand/10' : 'hover:bg-secondary'
                }`}
              >
                {columns.map((col) => (
                  <td key={col.key} className="px-base py-half border-b">
                    {col.render
                      ? col.render(item)
                      : String(item[col.key] ?? '')}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function MutationPanel({
  onCreate,
  onUpdate,
  onDelete,
  selectedId,
  disabled,
  children,
}: {
  onCreate?: () => void;
  onUpdate?: () => void;
  onDelete?: () => void;
  selectedId?: string | null;
  disabled?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div className="mt-base p-base bg-secondary rounded-sm space-y-base">
      <h4 className="text-sm font-medium text-normal">
        Mutations (Optimistic)
      </h4>
      {children}
      <div className="flex gap-base flex-wrap">
        {onCreate && (
          <button
            onClick={onCreate}
            disabled={disabled}
            className="px-base py-half text-sm bg-success text-white rounded-sm hover:bg-success/80 disabled:bg-panel disabled:text-low disabled:cursor-not-allowed"
          >
            Create
          </button>
        )}
        {onUpdate && (
          <button
            onClick={onUpdate}
            disabled={disabled || !selectedId}
            className="px-base py-half text-sm bg-brand text-on-brand rounded-sm hover:bg-brand-hover disabled:bg-panel disabled:text-low disabled:cursor-not-allowed"
          >
            Update Selected
          </button>
        )}
        {onDelete && (
          <button
            onClick={onDelete}
            disabled={disabled || !selectedId}
            className="px-base py-half text-sm bg-error text-white rounded-sm hover:bg-error/80 disabled:bg-panel disabled:text-low disabled:cursor-not-allowed"
          >
            Delete Selected
          </button>
        )}
      </div>
      {selectedId && (
        <p className="text-xs text-low">Selected: {truncateId(selectedId)}</p>
      )}
    </div>
  );
}

// ============================================================================
// Collection List Components (using generic hook)
// ============================================================================

function ProjectsList({
  organizationId,
  onSelectProject,
  selectedProjectId,
}: {
  organizationId: string;
  onSelectProject: (project: Project | null) => void;
  selectedProjectId: string | null;
}) {
  const { data, isLoading, error, retry, insert, update, remove } = useShape(
    PROJECTS_SHAPE,
    { organization_id: organizationId },
    { mutation: PROJECT_MUTATION }
  );

  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectColor, setNewProjectColor] = useState('#3b82f6');

  const handleCreate = () => {
    if (!newProjectName.trim()) return;
    insert({
      organization_id: organizationId,
      name: newProjectName.trim(),
      color: newProjectColor,
    });
    setNewProjectName('');
  };

  const handleUpdate = () => {
    if (!selectedProjectId || !newProjectName.trim()) return;
    update(selectedProjectId, {
      name: newProjectName.trim(),
      color: newProjectColor,
    });
  };

  const handleDelete = () => {
    if (!selectedProjectId) return;
    remove(selectedProjectId);
    onSelectProject(null);
  };

  const handleRowClick = (project: Project) => {
    onSelectProject(project);
    setNewProjectName(project.name);
    setNewProjectColor(project.color);
  };

  if (error)
    return <ErrorState syncError={error} title="Sync Error" onRetry={retry} />;
  if (isLoading) return <LoadingState message="Loading projects..." />;

  return (
    <div>
      <p className="text-sm text-low mb-base">{data.length} synced</p>
      <DataTable
        data={data}
        getRowId={(p) => p.id}
        selectedId={selectedProjectId ?? undefined}
        onRowClick={handleRowClick}
        columns={[
          {
            key: 'name',
            label: 'Name',
            render: (p) => (
              <div className="flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: p.color }}
                />
                <span className="font-medium">{p.name}</span>
              </div>
            ),
          },
          { key: 'id', label: 'ID', render: (p) => truncateId(p.id) },
          {
            key: 'updated_at',
            label: 'Updated',
            render: (p) => formatDate(p.updated_at),
          },
        ]}
      />

      <MutationPanel
        onCreate={handleCreate}
        onUpdate={handleUpdate}
        onDelete={handleDelete}
        selectedId={selectedProjectId}
        disabled={isLoading}
      >
        <div className="flex gap-base items-end flex-wrap">
          <div>
            <label className="block text-xs text-low mb-half">Name</label>
            <input
              type="text"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              placeholder="Project name"
              className="px-base py-half text-sm border rounded-sm bg-primary text-normal focus:outline-none focus:ring-1 focus:ring-brand"
            />
          </div>
          <div>
            <label className="block text-xs text-low mb-half">Color</label>
            <input
              type="color"
              value={newProjectColor}
              onChange={(e) => setNewProjectColor(e.target.value)}
              className="w-10 h-8 border rounded-sm cursor-pointer"
            />
          </div>
        </div>
      </MutationPanel>
    </div>
  );
}

function NotificationsList({
  organizationId,
  userId,
}: {
  organizationId: string;
  userId: string;
}) {
  const { data, isLoading, error, retry } = useShape(NOTIFICATIONS_SHAPE, {
    organization_id: organizationId,
    user_id: userId,
  });

  if (error)
    return <ErrorState syncError={error} title="Sync Error" onRetry={retry} />;
  if (isLoading) return <LoadingState message="Loading notifications..." />;

  return (
    <div>
      <p className="text-sm text-low mb-base">{data.length} synced</p>
      <DataTable
        data={data}
        getRowId={(n) => n.id}
        columns={[
          { key: 'notification_type', label: 'Type' },
          {
            key: 'seen',
            label: 'Seen',
            render: (n) => (n.seen ? 'Yes' : 'No'),
          },
          { key: 'id', label: 'ID', render: (n) => truncateId(n.id) },
          {
            key: 'created_at',
            label: 'Created',
            render: (n) => formatDate(n.created_at),
          },
        ]}
      />
    </div>
  );
}

function IssuesList({
  projectId,
  onSelectIssue,
  selectedIssueId,
}: {
  projectId: string;
  onSelectIssue: (issue: Issue) => void;
  selectedIssueId: string | null;
}) {
  const { data, isLoading, error, retry } = useShape(PROJECT_ISSUES_SHAPE, {
    project_id: projectId,
  });

  if (error)
    return <ErrorState syncError={error} title="Sync Error" onRetry={retry} />;
  if (isLoading) return <LoadingState message="Loading issues..." />;

  return (
    <div>
      <p className="text-sm text-low mb-base">{data.length} synced</p>
      <DataTable
        data={data}
        getRowId={(i) => i.id}
        selectedId={selectedIssueId ?? undefined}
        onRowClick={onSelectIssue}
        columns={[
          { key: 'title', label: 'Title' },
          { key: 'priority', label: 'Priority' },
          { key: 'id', label: 'ID', render: (i) => truncateId(i.id) },
          {
            key: 'updated_at',
            label: 'Updated',
            render: (i) => formatDate(i.updated_at),
          },
        ]}
      />
    </div>
  );
}

function WorkspacesList({ projectId }: { projectId: string }) {
  const { data, isLoading, error, retry } = useShape(PROJECT_WORKSPACES_SHAPE, {
    project_id: projectId,
  });

  if (error)
    return <ErrorState syncError={error} title="Sync Error" onRetry={retry} />;
  if (isLoading) return <LoadingState message="Loading workspaces..." />;

  return (
    <div>
      <p className="text-sm text-low mb-base">{data.length} synced</p>
      <DataTable
        data={data}
        getRowId={(w) => w.id}
        columns={[
          { key: 'id', label: 'ID', render: (w) => truncateId(w.id) },
          {
            key: 'archived',
            label: 'Archived',
            render: (w) => (w.archived ? 'Yes' : 'No'),
          },
          { key: 'files_changed', label: 'Files Changed' },
          {
            key: 'created_at',
            label: 'Created',
            render: (w) => formatDate(w.created_at),
          },
        ]}
      />
    </div>
  );
}

function StatusesList({ projectId }: { projectId: string }) {
  const { data, isLoading, error, retry } = useShape(
    PROJECT_PROJECT_STATUSES_SHAPE,
    { project_id: projectId }
  );

  if (error)
    return <ErrorState syncError={error} title="Sync Error" onRetry={retry} />;
  if (isLoading) return <LoadingState message="Loading statuses..." />;

  return (
    <div>
      <p className="text-sm text-low mb-base">{data.length} synced</p>
      <DataTable
        data={data}
        getRowId={(s) => s.id}
        columns={[
          {
            key: 'name',
            label: 'Name',
            render: (s) => (
              <div className="flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: s.color }}
                />
                <span>{s.name}</span>
              </div>
            ),
          },
          { key: 'sort_order', label: 'Order' },
          { key: 'id', label: 'ID', render: (s) => truncateId(s.id) },
        ]}
      />
    </div>
  );
}

function TagsList({ projectId }: { projectId: string }) {
  const { data, isLoading, error, retry, insert, update, remove } = useShape(
    PROJECT_TAGS_SHAPE,
    { project_id: projectId },
    { mutation: TAG_MUTATION }
  );

  const [selectedTagId, setSelectedTagId] = useState<string | null>(null);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('#3b82f6');

  const handleCreate = () => {
    if (!newTagName.trim()) return;
    insert({
      project_id: projectId,
      name: newTagName.trim(),
      color: newTagColor,
    });
    setNewTagName('');
  };

  const handleUpdate = () => {
    if (!selectedTagId || !newTagName.trim()) return;
    update(selectedTagId, { name: newTagName.trim() });
  };

  const handleDelete = () => {
    if (!selectedTagId) return;
    remove(selectedTagId);
    setSelectedTagId(null);
  };

  const handleRowClick = (tag: { id: string; name: string; color: string }) => {
    setSelectedTagId(tag.id);
    setNewTagName(tag.name);
    setNewTagColor(tag.color);
  };

  if (error)
    return <ErrorState syncError={error} title="Sync Error" onRetry={retry} />;
  if (isLoading) return <LoadingState message="Loading tags..." />;

  return (
    <div>
      <p className="text-sm text-low mb-base">{data.length} synced</p>
      <DataTable
        data={data}
        getRowId={(t) => t.id}
        selectedId={selectedTagId ?? undefined}
        onRowClick={handleRowClick}
        columns={[
          {
            key: 'name',
            label: 'Name',
            render: (t) => (
              <div className="flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: t.color }}
                />
                <span>{t.name}</span>
              </div>
            ),
          },
          { key: 'id', label: 'ID', render: (t) => truncateId(t.id) },
        ]}
      />

      <MutationPanel
        onCreate={handleCreate}
        onUpdate={handleUpdate}
        onDelete={handleDelete}
        selectedId={selectedTagId}
        disabled={isLoading}
      >
        <div className="flex gap-base items-end flex-wrap">
          <div>
            <label className="block text-xs text-low mb-half">Name</label>
            <input
              type="text"
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              placeholder="Tag name"
              className="px-base py-half text-sm border rounded-sm bg-primary text-normal focus:outline-none focus:ring-1 focus:ring-brand"
            />
          </div>
          <div>
            <label className="block text-xs text-low mb-half">Color</label>
            <input
              type="color"
              value={newTagColor}
              onChange={(e) => setNewTagColor(e.target.value)}
              className="w-10 h-8 border rounded-sm cursor-pointer"
            />
          </div>
        </div>
      </MutationPanel>
    </div>
  );
}

function AssigneesList({ projectId }: { projectId: string }) {
  const { data, isLoading, error, retry } = useShape(
    PROJECT_ISSUE_ASSIGNEES_SHAPE,
    { project_id: projectId }
  );

  if (error)
    return <ErrorState syncError={error} title="Sync Error" onRetry={retry} />;
  if (isLoading) return <LoadingState message="Loading assignees..." />;

  return (
    <div>
      <p className="text-sm text-low mb-base">{data.length} synced</p>
      <DataTable
        data={data}
        getRowId={(a) => `${a.issue_id}-${a.user_id}`}
        columns={[
          {
            key: 'issue_id',
            label: 'Issue ID',
            render: (a) => truncateId(a.issue_id),
          },
          {
            key: 'user_id',
            label: 'User ID',
            render: (a) => truncateId(a.user_id),
          },
          {
            key: 'assigned_at',
            label: 'Assigned',
            render: (a) => formatDate(a.assigned_at),
          },
        ]}
      />
    </div>
  );
}

function FollowersList({ projectId }: { projectId: string }) {
  const { data, isLoading, error, retry } = useShape(
    PROJECT_ISSUE_FOLLOWERS_SHAPE,
    { project_id: projectId }
  );

  if (error)
    return <ErrorState syncError={error} title="Sync Error" onRetry={retry} />;
  if (isLoading) return <LoadingState message="Loading followers..." />;

  return (
    <div>
      <p className="text-sm text-low mb-base">{data.length} synced</p>
      <DataTable
        data={data}
        getRowId={(f) => `${f.issue_id}-${f.user_id}`}
        columns={[
          {
            key: 'issue_id',
            label: 'Issue ID',
            render: (f) => truncateId(f.issue_id),
          },
          {
            key: 'user_id',
            label: 'User ID',
            render: (f) => truncateId(f.user_id),
          },
        ]}
      />
    </div>
  );
}

function IssueTagsList({ projectId }: { projectId: string }) {
  const { data, isLoading, error, retry } = useShape(PROJECT_ISSUE_TAGS_SHAPE, {
    project_id: projectId,
  });

  if (error)
    return <ErrorState syncError={error} title="Sync Error" onRetry={retry} />;
  if (isLoading) return <LoadingState message="Loading issue tags..." />;

  return (
    <div>
      <p className="text-sm text-low mb-base">{data.length} synced</p>
      <DataTable
        data={data}
        getRowId={(t) => `${t.issue_id}-${t.tag_id}`}
        columns={[
          {
            key: 'issue_id',
            label: 'Issue ID',
            render: (t) => truncateId(t.issue_id),
          },
          {
            key: 'tag_id',
            label: 'Tag ID',
            render: (t) => truncateId(t.tag_id),
          },
        ]}
      />
    </div>
  );
}

function DependenciesList({ projectId }: { projectId: string }) {
  const { data, isLoading, error, retry } = useShape(
    PROJECT_ISSUE_RELATIONSHIPS_SHAPE,
    { project_id: projectId }
  );

  if (error)
    return <ErrorState syncError={error} title="Sync Error" onRetry={retry} />;
  if (isLoading) return <LoadingState message="Loading dependencies..." />;

  return (
    <div>
      <p className="text-sm text-low mb-base">{data.length} synced</p>
      <DataTable
        data={data}
        getRowId={(d) => `${d.issue_id}-${d.related_issue_id}`}
        columns={[
          {
            key: 'issue_id',
            label: 'Issue',
            render: (d) => truncateId(d.issue_id),
          },
          {
            key: 'related_issue_id',
            label: 'Related Issue',
            render: (d) => truncateId(d.related_issue_id),
          },
          {
            key: 'created_at',
            label: 'Created',
            render: (d) => formatDate(d.created_at),
          },
        ]}
      />
    </div>
  );
}

function CommentsList({ issueId }: { issueId: string }) {
  const { data, isLoading, error, retry, insert, update, remove } = useShape(
    ISSUE_COMMENTS_SHAPE,
    { issue_id: issueId },
    { mutation: ISSUE_COMMENT_MUTATION }
  );

  const [selectedCommentId, setSelectedCommentId] = useState<string | null>(
    null
  );
  const [newMessage, setNewMessage] = useState('');

  const handleCreate = () => {
    if (!newMessage.trim()) return;
    insert({ issue_id: issueId, message: newMessage.trim(), parent_id: null });
    setNewMessage('');
  };

  const handleUpdate = () => {
    if (!selectedCommentId || !newMessage.trim()) return;
    update(selectedCommentId, { message: newMessage.trim() });
  };

  const handleDelete = () => {
    if (!selectedCommentId) return;
    remove(selectedCommentId);
    setSelectedCommentId(null);
    setNewMessage('');
  };

  const handleRowClick = (comment: { id: string; message: string }) => {
    setSelectedCommentId(comment.id);
    setNewMessage(comment.message);
  };

  if (error)
    return <ErrorState syncError={error} title="Sync Error" onRetry={retry} />;
  if (isLoading) return <LoadingState message="Loading comments..." />;

  return (
    <div>
      <p className="text-sm text-low mb-base">{data.length} synced</p>
      <DataTable
        data={data}
        getRowId={(c) => c.id}
        selectedId={selectedCommentId ?? undefined}
        onRowClick={handleRowClick}
        columns={[
          {
            key: 'message',
            label: 'Message',
            render: (c) =>
              c.message.length > 50
                ? c.message.slice(0, 50) + '...'
                : c.message,
          },
          {
            key: 'author_id',
            label: 'Author',
            render: (c) => (c.author_id ? truncateId(c.author_id) : '-'),
          },
          { key: 'id', label: 'ID', render: (c) => truncateId(c.id) },
          {
            key: 'created_at',
            label: 'Created',
            render: (c) => formatDate(c.created_at),
          },
        ]}
      />

      <MutationPanel
        onCreate={handleCreate}
        onUpdate={handleUpdate}
        onDelete={handleDelete}
        selectedId={selectedCommentId}
        disabled={isLoading}
      >
        <div>
          <label className="block text-xs text-low mb-half">Message</label>
          <textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Enter comment message..."
            rows={2}
            className="w-full px-base py-half text-sm border rounded-sm bg-primary text-normal focus:outline-none focus:ring-1 focus:ring-brand resize-none"
          />
        </div>
      </MutationPanel>
    </div>
  );
}

function ReactionsList({ issueId }: { issueId: string }) {
  const { data, isLoading, error, retry } = useShape(ISSUE_REACTIONS_SHAPE, {
    issue_id: issueId,
  });

  if (error)
    return <ErrorState syncError={error} title="Sync Error" onRetry={retry} />;
  if (isLoading) return <LoadingState message="Loading reactions..." />;

  return (
    <div>
      <p className="text-sm text-low mb-base">{data.length} synced</p>
      <DataTable
        data={data}
        getRowId={(r) => r.id}
        columns={[
          { key: 'emoji', label: 'Emoji' },
          {
            key: 'comment_id',
            label: 'Comment',
            render: (r) => truncateId(r.comment_id),
          },
          {
            key: 'user_id',
            label: 'User',
            render: (r) => truncateId(r.user_id),
          },
          { key: 'id', label: 'ID', render: (r) => truncateId(r.id) },
        ]}
      />
    </div>
  );
}

// ============================================================================
// Utility functions
// ============================================================================

function truncateId(id: string): string {
  return id.length > 8 ? id.slice(0, 8) + '...' : id;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString();
}

// ============================================================================
// Main Component
// ============================================================================

export function ElectricTestPage() {
  const { isSignedIn, isLoaded } = useAuth();
  const { data: orgsData } = useUserOrganizations();
  const { data: currentUser } = useCurrentUser();

  const [selectedOrgId, setSelectedOrgId] = useState<string>('');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    null
  );
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const [activeOrgCollection, setActiveOrgCollection] =
    useState<OrgCollectionType>('projects');
  const [activeProjectCollection, setActiveProjectCollection] =
    useState<ProjectCollectionType>('issues');
  const [activeIssueCollection, setActiveIssueCollection] =
    useState<IssueCollectionType>('comments');

  const organizations = orgsData?.organizations ?? [];
  const userId = currentUser?.user_id;

  const handleDisconnect = () => {
    setIsConnected(false);
    setSelectedProjectId(null);
    setSelectedProject(null);
    setSelectedIssueId(null);
    setSelectedIssue(null);
  };

  const handleSelectProject = (project: Project | null) => {
    setSelectedProjectId(project?.id ?? null);
    setSelectedProject(project);
    setSelectedIssueId(null);
    setSelectedIssue(null);
  };

  const handleSelectIssue = (issue: Issue) => {
    setSelectedIssueId(issue.id);
    setSelectedIssue(issue);
  };

  if (!isLoaded) {
    return (
      <div className="p-double">
        <p className="text-low">Loading...</p>
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="p-double">
        <h2 className="text-xl font-medium text-high mb-base">
          Electric SDK Test
        </h2>
        <p className="text-low">Please sign in to test Electric sync.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-auto p-double space-y-double max-w-6xl bg-background">
      <h2 className="text-xl font-medium text-high">Electric SDK Test</h2>

      {/* Configuration */}
      <div className="bg-primary border rounded-sm p-base space-y-base">
        <h3 className="text-lg font-medium text-normal">Configuration</h3>

        <div className="grid grid-cols-2 gap-base">
          <div>
            <label className="block text-sm font-medium text-normal mb-half">
              Organization
            </label>
            <select
              value={selectedOrgId}
              onChange={(e) => {
                setSelectedOrgId(e.target.value);
                setSelectedProjectId(null);
                setSelectedProject(null);
                setSelectedIssueId(null);
                setSelectedIssue(null);
              }}
              disabled={isConnected}
              className="w-full px-base py-half border rounded-sm bg-primary text-normal focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand disabled:bg-secondary disabled:text-low"
            >
              <option value="">Select an organization...</option>
              {organizations.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end gap-base">
            {!isConnected ? (
              <button
                onClick={() => setIsConnected(true)}
                disabled={!selectedOrgId}
                className="px-base py-half bg-brand text-on-brand rounded-sm hover:bg-brand-hover focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 disabled:bg-panel disabled:text-low disabled:cursor-not-allowed"
              >
                Connect
              </button>
            ) : (
              <button
                onClick={handleDisconnect}
                className="px-base py-half bg-error text-on-brand rounded-sm focus:outline-none focus:ring-2 focus:ring-error focus:ring-offset-2"
              >
                Disconnect
              </button>
            )}
            <span
              className={`text-sm ${isConnected ? 'text-success' : 'text-low'}`}
            >
              {isConnected ? 'Connected' : 'Not connected'}
            </span>
          </div>
        </div>

        {selectedOrgId && (
          <div className="text-xs text-low font-ibm-plex-mono">
            Organization ID: {selectedOrgId}
            {userId && <span className="ml-base">User ID: {userId}</span>}
          </div>
        )}
      </div>

      {/* Organization-scoped collections */}
      {isConnected && selectedOrgId && (
        <div className="bg-primary border rounded-sm p-base">
          <h3 className="text-lg font-medium text-normal mb-base">
            Organization Collections
          </h3>

          <CollectionTabs
            value={activeOrgCollection}
            onChange={setActiveOrgCollection}
            options={[
              { value: 'projects', label: 'Projects' },
              { value: 'notifications', label: 'Notifications' },
            ]}
          />

          {activeOrgCollection === 'projects' && (
            <ProjectsList
              organizationId={selectedOrgId}
              onSelectProject={handleSelectProject}
              selectedProjectId={selectedProjectId}
            />
          )}
          {activeOrgCollection === 'notifications' && userId && (
            <NotificationsList organizationId={selectedOrgId} userId={userId} />
          )}
          {activeOrgCollection === 'notifications' && !userId && (
            <LoadingState message="Loading user info..." />
          )}

          {selectedProject && (
            <p className="mt-base text-sm text-brand">
              Selected project: <strong>{selectedProject.name}</strong> (click a
              row to select)
            </p>
          )}
        </div>
      )}

      {/* Project-scoped collections */}
      {isConnected && selectedProjectId && (
        <div className="bg-primary border rounded-sm p-base">
          <h3 className="text-lg font-medium text-normal mb-base">
            Project Collections
            <span className="text-sm font-normal text-low ml-base">
              ({selectedProject?.name})
            </span>
          </h3>

          <CollectionTabs
            value={activeProjectCollection}
            onChange={setActiveProjectCollection}
            options={[
              { value: 'issues', label: 'Issues' },
              { value: 'workspaces', label: 'Workspaces' },
              { value: 'statuses', label: 'Statuses' },
              { value: 'tags', label: 'Tags' },
              { value: 'assignees', label: 'Assignees' },
              { value: 'followers', label: 'Followers' },
              { value: 'issueTags', label: 'Issue Tags' },
              { value: 'dependencies', label: 'Dependencies' },
            ]}
          />

          {activeProjectCollection === 'issues' && (
            <IssuesList
              projectId={selectedProjectId}
              onSelectIssue={handleSelectIssue}
              selectedIssueId={selectedIssueId}
            />
          )}
          {activeProjectCollection === 'workspaces' && (
            <WorkspacesList projectId={selectedProjectId} />
          )}
          {activeProjectCollection === 'statuses' && (
            <StatusesList projectId={selectedProjectId} />
          )}
          {activeProjectCollection === 'tags' && (
            <TagsList projectId={selectedProjectId} />
          )}
          {activeProjectCollection === 'assignees' && (
            <AssigneesList projectId={selectedProjectId} />
          )}
          {activeProjectCollection === 'followers' && (
            <FollowersList projectId={selectedProjectId} />
          )}
          {activeProjectCollection === 'issueTags' && (
            <IssueTagsList projectId={selectedProjectId} />
          )}
          {activeProjectCollection === 'dependencies' && (
            <DependenciesList projectId={selectedProjectId} />
          )}

          {selectedIssue && (
            <p className="mt-base text-sm text-brand">
              Selected issue: <strong>{selectedIssue.title}</strong>
            </p>
          )}
        </div>
      )}

      {/* Issue-scoped collections */}
      {isConnected && selectedIssueId && (
        <div className="bg-primary border rounded-sm p-base">
          <h3 className="text-lg font-medium text-normal mb-base">
            Issue Collections
            <span className="text-sm font-normal text-low ml-base">
              ({selectedIssue?.title})
            </span>
          </h3>

          <CollectionTabs
            value={activeIssueCollection}
            onChange={setActiveIssueCollection}
            options={[
              { value: 'comments', label: 'Comments' },
              { value: 'reactions', label: 'Reactions' },
            ]}
          />

          {activeIssueCollection === 'comments' && (
            <CommentsList issueId={selectedIssueId} />
          )}
          {activeIssueCollection === 'reactions' && (
            <ReactionsList issueId={selectedIssueId} />
          )}
        </div>
      )}
    </div>
  );
}
