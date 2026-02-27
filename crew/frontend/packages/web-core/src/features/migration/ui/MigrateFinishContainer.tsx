import { useMemo } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useProjects } from '../model/hooks/useProjects';
import {
  MigrateFinish,
  type MigrateFinishProject,
} from '@vibe/ui/components/MigrateFinish';

interface MigrateFinishContainerProps {
  orgId: string;
  projectIds: string[];
  onMigrateMore: () => void;
}

export function MigrateFinishContainer({
  orgId,
  projectIds,
  onMigrateMore,
}: MigrateFinishContainerProps) {
  const navigate = useNavigate();
  const { projects } = useProjects();

  const migratedProjects = useMemo(() => {
    return projectIds
      .map((id) => projects.find((p) => p.id === id))
      .filter((p) => p !== undefined)
      .map((p) => ({
        localId: p.id,
        localName: p.name,
        remoteId: p.remote_project_id,
      }));
  }, [projectIds, projects]);

  const handleViewProject = (project: MigrateFinishProject) => {
    if (project.remoteId) {
      navigate({
        to: '/projects/$projectId',
        params: { projectId: project.remoteId },
        search: { orgId },
      });
      return;
    }

    navigate({ to: '/workspaces' });
  };

  return (
    <MigrateFinish
      migratedProjects={migratedProjects}
      onMigrateMore={onMigrateMore}
      onViewProject={handleViewProject}
    />
  );
}
