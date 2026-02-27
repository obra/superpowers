import { useContext } from 'react';
import { createHmrContext } from '@/shared/lib/hmrContext';
import type { InsertResult, MutationResult } from '@/shared/lib/electric/types';
import type { SyncError } from '@/shared/lib/electric/types';
import type {
  Project,
  Notification,
  CreateProjectRequest,
  UpdateProjectRequest,
  UpdateNotificationRequest,
} from 'shared/remote-types';
import type { OrganizationMemberWithProfile } from 'shared/types';

export interface OrgContextValue {
  organizationId: string;

  // Data
  projects: Project[];
  notifications: Notification[];

  // Loading/error state
  isLoading: boolean;
  error: SyncError | null;
  retry: () => void;

  // Project mutations
  insertProject: (data: CreateProjectRequest) => InsertResult<Project>;
  updateProject: (
    id: string,
    changes: Partial<UpdateProjectRequest>
  ) => MutationResult;
  removeProject: (id: string) => MutationResult;

  // Notification mutations
  updateNotification: (
    id: string,
    changes: Partial<UpdateNotificationRequest>
  ) => MutationResult;

  // Lookup helpers
  getProject: (projectId: string) => Project | undefined;
  getUnseenNotifications: () => Notification[];

  // Computed aggregations
  projectsById: Map<string, Project>;
  membersWithProfilesById: Map<string, OrganizationMemberWithProfile>;
}

export const OrgContext = createHmrContext<OrgContextValue | null>(
  'OrgContext',
  null
);

export function useOrgContext(): OrgContextValue {
  const context = useContext(OrgContext);
  if (!context) {
    throw new Error('useOrgContext must be used within an OrgProvider');
  }
  return context;
}
