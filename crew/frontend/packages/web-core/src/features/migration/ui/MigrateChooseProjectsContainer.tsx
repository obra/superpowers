import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useProjects } from '../model/hooks/useProjects';
import { useUserOrganizations } from '@/shared/hooks/useUserOrganizations';
import { MigrateChooseProjects } from '@vibe/ui/components/MigrateChooseProjects';

interface MigrateChooseProjectsContainerProps {
  onContinue: (orgId: string, projectIds: string[]) => void;
  onSkip: () => void;
}

export function MigrateChooseProjectsContainer({
  onContinue,
  onSkip,
}: MigrateChooseProjectsContainerProps) {
  const navigate = useNavigate();
  const { projects, isLoading: projectsLoading } = useProjects();
  const { data: orgsData, isLoading: orgsLoading } = useUserOrganizations();
  const organizations = useMemo(
    () => orgsData?.organizations ?? [],
    [orgsData?.organizations]
  );

  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
  const [selectedProjectIds, setSelectedProjectIds] = useState<Set<string>>(
    new Set()
  );
  const hasInitializedSelectionRef = useRef(false);

  // Filter out already-migrated projects for selection purposes
  const migrateableProjects = useMemo(
    () => projects.filter((p) => !p.remote_project_id),
    [projects]
  );

  // Pre-select first organization when data loads
  useEffect(() => {
    if (organizations.length > 0 && !selectedOrgId) {
      setSelectedOrgId(organizations[0].id);
    }
  }, [organizations, selectedOrgId]);

  // Default to all migratable projects selected on first data load.
  useEffect(() => {
    if (projectsLoading || hasInitializedSelectionRef.current) {
      return;
    }

    setSelectedProjectIds(new Set(migrateableProjects.map((p) => p.id)));
    hasInitializedSelectionRef.current = true;
  }, [projectsLoading, migrateableProjects]);

  const handleOrgChange = (orgId: string) => {
    setSelectedOrgId(orgId);
  };

  const handleToggleProject = (projectId: string) => {
    // Only allow toggling non-migrated projects
    const project = projects.find((p) => p.id === projectId);
    if (project?.remote_project_id) return;

    setSelectedProjectIds((prev) => {
      const next = new Set(prev);
      if (next.has(projectId)) {
        next.delete(projectId);
      } else {
        next.add(projectId);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedProjectIds.size === migrateableProjects.length) {
      setSelectedProjectIds(new Set());
    } else {
      setSelectedProjectIds(new Set(migrateableProjects.map((p) => p.id)));
    }
  };

  const handleContinue = () => {
    if (selectedOrgId && selectedProjectIds.size > 0) {
      onContinue(selectedOrgId, Array.from(selectedProjectIds));
    }
  };

  const handleGoToCreateWorkspace = () => {
    navigate({ to: '/workspaces/create' });
  };

  const handleViewMigratedProject = (projectId: string) => {
    navigate({
      to: '/projects/$projectId',
      params: { projectId },
      ...(selectedOrgId ? { search: { orgId: selectedOrgId } } : {}),
    });
  };

  const migratedProjects = useMemo(
    () => projects.filter((p) => p.remote_project_id),
    [projects]
  );

  const handleSkip = () => {
    if (migratedProjects.length > 0 && migratedProjects[0].remote_project_id) {
      navigate({
        to: '/projects/$projectId',
        params: { projectId: migratedProjects[0].remote_project_id },
        replace: true,
      });
    } else {
      onSkip();
    }
  };

  const isLoading = projectsLoading || orgsLoading;

  return (
    <MigrateChooseProjects
      projects={projects}
      organizations={organizations}
      selectedOrgId={selectedOrgId}
      selectedProjectIds={selectedProjectIds}
      isLoading={isLoading}
      onOrgChange={handleOrgChange}
      onToggleProject={handleToggleProject}
      onSelectAll={handleSelectAll}
      onContinue={handleContinue}
      onSkip={handleSkip}
      onGoToCreateWorkspace={handleGoToCreateWorkspace}
      onViewMigratedProject={handleViewMigratedProject}
    />
  );
}
