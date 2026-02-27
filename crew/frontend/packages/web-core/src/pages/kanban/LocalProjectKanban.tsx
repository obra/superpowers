import { useEffect, useRef } from 'react';
import { ProjectsGuideDialog } from '@vibe/ui/components/ProjectsGuideDialog';
import { useAuth } from '@/shared/hooks/auth/useAuth';
import { useUserSystem } from '@/shared/hooks/useUserSystem';
import { ProjectKanban } from '@/pages/kanban/ProjectKanban';

const PROJECTS_GUIDE_ID = 'projects-guide';

export function LocalProjectKanban() {
  const { config, updateAndSaveConfig, loading } = useUserSystem();
  const { isLoaded, isSignedIn } = useAuth();
  const hasAutoShownProjectsGuide = useRef(false);

  useEffect(() => {
    if (hasAutoShownProjectsGuide.current) return;
    if (!isLoaded || !isSignedIn || loading || !config) return;

    const seenFeatures = config.showcases?.seen_features ?? [];
    if (seenFeatures.includes(PROJECTS_GUIDE_ID)) return;

    hasAutoShownProjectsGuide.current = true;

    void updateAndSaveConfig({
      showcases: { seen_features: [...seenFeatures, PROJECTS_GUIDE_ID] },
    });
    ProjectsGuideDialog.show().finally(() => ProjectsGuideDialog.hide());
  }, [config, isLoaded, isSignedIn, loading, updateAndSaveConfig]);

  return <ProjectKanban />;
}
