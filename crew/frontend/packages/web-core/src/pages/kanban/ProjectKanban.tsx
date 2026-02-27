import { useEffect, useMemo, useRef, type ReactNode } from 'react';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { Group, Layout, Panel, Separator } from 'react-resizable-panels';
import { OrgProvider } from '@/shared/providers/remote/OrgProvider';
import { useOrgContext } from '@/shared/hooks/useOrgContext';
import { ProjectProvider } from '@/shared/providers/remote/ProjectProvider';
import { useProjectContext } from '@/shared/hooks/useProjectContext';
import { useActions } from '@/shared/hooks/useActions';
import { usePageTitle } from '@/shared/hooks/usePageTitle';
import { KanbanContainer } from '@/features/kanban/ui/KanbanContainer';
import { ProjectRightSidebarContainer } from './ProjectRightSidebarContainer';
import { LoginRequiredPrompt } from '@/shared/dialogs/shared/LoginRequiredPrompt';
import {
  PERSIST_KEYS,
  usePaneSize,
} from '@/shared/stores/useUiPreferencesStore';
import { useUserOrganizations } from '@/shared/hooks/useUserOrganizations';
import { useOrganizationProjects } from '@/shared/hooks/useOrganizationProjects';
import { useOrganizationStore } from '@/shared/stores/useOrganizationStore';
import { useKanbanNavigation } from '@/shared/hooks/useKanbanNavigation';
import { useAuth } from '@/shared/hooks/auth/useAuth';
import {
  buildIssueCreatePath,
  buildProjectRootPath,
} from '@/shared/lib/routes/projectSidebarRoutes';

import type { ProjectSearch } from '@/project-routes/project-search';
/**
 * Component that registers project mutations with ActionsContext.
 * Must be rendered inside both ActionsProvider and ProjectProvider.
 */
function ProjectMutationsRegistration({ children }: { children: ReactNode }) {
  const { registerProjectMutations } = useActions();
  const { removeIssue, insertIssue, getIssue, getAssigneesForIssue, issues } =
    useProjectContext();

  // Use ref to always access latest issues (avoid stale closure)
  const issuesRef = useRef(issues);
  useEffect(() => {
    issuesRef.current = issues;
  }, [issues]);

  useEffect(() => {
    registerProjectMutations({
      removeIssue: (id) => {
        removeIssue(id);
      },
      duplicateIssue: (issueId) => {
        const issue = getIssue(issueId);
        if (!issue) return;

        // Use ref to get current issues (not stale closure)
        const currentIssues = issuesRef.current;
        const statusIssues = currentIssues.filter(
          (i) => i.status_id === issue.status_id
        );
        const minSortOrder =
          statusIssues.length > 0
            ? Math.min(...statusIssues.map((i) => i.sort_order))
            : 0;

        insertIssue({
          project_id: issue.project_id,
          status_id: issue.status_id,
          title: `${issue.title} (Copy)`,
          description: issue.description,
          priority: issue.priority,
          sort_order: minSortOrder - 1,
          start_date: issue.start_date,
          target_date: issue.target_date,
          completed_at: null,
          parent_issue_id: issue.parent_issue_id,
          parent_issue_sort_order: issue.parent_issue_sort_order,
          extension_metadata: issue.extension_metadata,
        });
      },
      getIssue,
      getAssigneesForIssue,
    });

    return () => {
      registerProjectMutations(null);
    };
  }, [
    registerProjectMutations,
    removeIssue,
    insertIssue,
    getIssue,
    getAssigneesForIssue,
  ]);

  return <>{children}</>;
}

function ProjectKanbanLayout({ projectName }: { projectName: string }) {
  const { issueId, isPanelOpen } = useKanbanNavigation();
  const { getIssue } = useProjectContext();
  const issue = issueId ? getIssue(issueId) : undefined;
  usePageTitle(issue?.title, projectName);
  const [kanbanLeftPanelSize, setKanbanLeftPanelSize] = usePaneSize(
    PERSIST_KEYS.kanbanLeftPanel,
    75
  );

  const isRightPanelOpen = isPanelOpen;

  const kanbanDefaultLayout: Layout =
    typeof kanbanLeftPanelSize === 'number'
      ? {
          'kanban-left': kanbanLeftPanelSize,
          'kanban-right': 100 - kanbanLeftPanelSize,
        }
      : { 'kanban-left': 75, 'kanban-right': 25 };

  const onKanbanLayoutChange = (layout: Layout) => {
    if (isRightPanelOpen) {
      setKanbanLeftPanelSize(layout['kanban-left']);
    }
  };

  return (
    <Group
      orientation="horizontal"
      className="flex-1 min-w-0 h-full"
      defaultLayout={kanbanDefaultLayout}
      onLayoutChange={onKanbanLayoutChange}
    >
      <Panel
        id="kanban-left"
        minSize="20%"
        className="min-w-0 h-full overflow-hidden bg-primary"
      >
        <KanbanContainer />
      </Panel>

      {isRightPanelOpen && (
        <Separator
          id="kanban-separator"
          className="w-1 bg-panel outline-none hover:bg-brand/50 transition-colors cursor-col-resize"
        />
      )}

      {isRightPanelOpen && (
        <Panel
          id="kanban-right"
          minSize="400px"
          maxSize="800px"
          className="min-w-0 h-full overflow-hidden bg-secondary"
        >
          <ProjectRightSidebarContainer />
        </Panel>
      )}
    </Group>
  );
}

/**
 * Inner component that renders the Kanban board once we have the org context
 */
function ProjectKanbanInner({ projectId }: { projectId: string }) {
  const { t } = useTranslation('common');
  const { projects, isLoading } = useOrgContext();

  const project = projects.find((p) => p.id === projectId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full w-full">
        <p className="text-low">{t('states.loading')}</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex items-center justify-center h-full w-full">
        <p className="text-low">{t('kanban.noProjectFound')}</p>
      </div>
    );
  }

  return (
    <ProjectProvider projectId={projectId}>
      <ProjectMutationsRegistration>
        <ProjectKanbanLayout projectName={project.name} />
      </ProjectMutationsRegistration>
    </ProjectProvider>
  );
}

/**
 * Hook to find a project by ID, using orgId from Zustand store
 */
function useFindProjectById(projectId: string | undefined) {
  const { isLoaded: authLoaded } = useAuth();
  const { data: orgsData, isLoading: orgsLoading } = useUserOrganizations();
  const selectedOrgId = useOrganizationStore((s) => s.selectedOrgId);
  const organizations = orgsData?.organizations ?? [];

  // Use stored org ID, or fall back to first org
  const orgIdToUse = selectedOrgId ?? organizations[0]?.id ?? null;

  const { data: projects = [], isLoading: projectsLoading } =
    useOrganizationProjects(orgIdToUse);

  const project = useMemo(() => {
    if (!projectId) return undefined;
    return projects.find((p) => p.id === projectId);
  }, [projectId, projects]);

  return {
    project,
    organizationId: project?.organization_id ?? selectedOrgId,
    // Include auth loading state - we can't determine project access until auth loads
    isLoading: !authLoaded || orgsLoading || projectsLoading,
  };
}

/**
 * ProjectKanban page - displays the Kanban board for a specific project
 *
 * URL patterns:
 * - /projects/:projectId - Kanban board with no issue selected
 * - /projects/:projectId/issues/:issueId - Kanban with issue panel open
 * - /projects/:projectId/issues/:issueId/workspaces/:workspaceId - Kanban with workspace session panel open
 * - /projects/:projectId/issues/new - Kanban with create issue panel
 * - /projects/:projectId/issues/:issueId/workspaces/create/:draftId - Kanban with workspace create panel
 *
 * Note: This component is rendered inside SharedAppLayout which provides
 * NavbarContainer, AppBar, and SyncErrorProvider.
 */
export function ProjectKanban() {
  const { projectId, hasInvalidWorkspaceCreateDraftId } = useKanbanNavigation();
  const search = useSearch({ strict: false });
  const navigate = useNavigate();
  const { t } = useTranslation('common');
  const setSelectedOrgId = useOrganizationStore((s) => s.setSelectedOrgId);
  const { isSignedIn, isLoaded: authLoaded } = useAuth();

  // One-time URL migrations:
  // - /projects/:projectId?mode=create -> /projects/:projectId/issues/new
  // - strip orgId after storing it
  useEffect(() => {
    if (!projectId) return;

    if (hasInvalidWorkspaceCreateDraftId) {
      navigate({
        ...buildProjectRootPath(projectId),
        replace: true,
      });
      return;
    }

    const orgIdFromUrl = search.orgId;
    if (orgIdFromUrl) {
      setSelectedOrgId(orgIdFromUrl);
    }

    const isLegacyCreateMode = search.mode === 'create';
    if (isLegacyCreateMode) {
      const nextSearch = {
        ...search,
        mode: undefined,
        orgId: undefined,
      };
      navigate({
        ...buildIssueCreatePath(projectId),
        search: nextSearch,
        replace: true,
      });
      return;
    }

    if (orgIdFromUrl) {
      navigate({
        to: '.',
        search: (prev: ProjectSearch) => ({
          ...prev,
          orgId: undefined,
        }),
        replace: true,
      });
    }
  }, [
    search,
    projectId,
    hasInvalidWorkspaceCreateDraftId,
    setSelectedOrgId,
    navigate,
  ]);

  // Find the project and get its organization
  const { organizationId, isLoading } = useFindProjectById(
    projectId ?? undefined
  );

  // Show loading while auth state is being determined
  if (!authLoaded || isLoading) {
    return (
      <div className="flex items-center justify-center h-full w-full">
        <p className="text-low">{t('states.loading')}</p>
      </div>
    );
  }

  // If not signed in, prompt user to log in
  if (!isSignedIn) {
    return (
      <div className="flex items-center justify-center h-full w-full p-base">
        <LoginRequiredPrompt
          className="max-w-md"
          title={t('kanban.loginRequired.title')}
          description={t('kanban.loginRequired.description')}
          actionLabel={t('kanban.loginRequired.action')}
        />
      </div>
    );
  }

  if (!projectId || !organizationId) {
    return (
      <div className="flex items-center justify-center h-full w-full">
        <p className="text-low">{t('kanban.noProjectFound')}</p>
      </div>
    );
  }

  return (
    <OrgProvider organizationId={organizationId}>
      <ProjectKanbanInner projectId={projectId} />
    </OrgProvider>
  );
}
