import { useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import NiceModal, { useModal } from '@ebay/nice-modal-react';
import { defineModal, type NoProps } from '../lib/modals';
import { GuideDialogShell, type GuideDialogTopic } from './GuideDialogShell';

const ProjectsGuideDialogImpl = NiceModal.create<NoProps>(() => {
  const modal = useModal();
  const { t } = useTranslation('common');
  const container = typeof document !== 'undefined' ? document.body : null;

  const handleClose = useCallback(() => {
    modal.hide();
    modal.resolve();
    modal.remove();
  }, [modal]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleClose]);

  if (!container) return null;

  const topics: GuideDialogTopic[] = [
    {
      id: 'intro',
      title: t('kanban.projectsGuide.intro.title', 'Welcome'),
      content: t(
        'kanban.projectsGuide.intro.content',
        'Welcome to Vibe Kanban. Use the help sections in this panel to learn how things work, then create your first issue. You can re-open this help dialog or give feedback anytime from the navbar.'
      ),
      imageSrc: '/guide-images/welcome.png',
    },
    {
      id: 'welcome',
      title: t('kanban.projectsGuide.welcome.title', 'Projects'),
      content: t(
        'kanban.projectsGuide.welcome.content',
        'The project page is where you manage issues. You can view your issues as a kanban board, or as a list, and filter by status, tag, assignee and more.'
      ),
      imageSrc: '/guide-images/projects-kanban.png',
    },
    {
      id: 'issues',
      title: t('kanban.projectsGuide.issues.title', 'Issues'),
      content: t(
        'kanban.projectsGuide.issues.content',
        'Each issue represents a feature or problem to solve. Issues have statuses, priorities, assignees, tags, relationships, comments, sub-issues and more.'
      ),
      imageSrc: '/guide-images/projects-issue.png',
    },
    {
      id: 'workspaces',
      title: t('kanban.projectsGuide.workspaces.title', 'Workspaces'),
      content: t(
        'kanban.projectsGuide.workspaces.content',
        'To start working on an issue, create a workspace. A single issue can have multiple workspaces. Issues describe the work to be done, workspaces are where the work happens.'
      ),
      imageSrc: '/guide-images/projects-workspaces.png',
    },
    {
      id: 'organizations',
      title: t('kanban.projectsGuide.organizations.title', 'Invite your team'),
      content: t(
        'kanban.projectsGuide.organizations.content',
        "We've automatically created a personal organization, and initial project so you can easily get started with Vibe Kanban. You can also create new organizations and invite your team to collaborate."
      ),
      imageSrc: '/guide-images/projects-org-settings.png',
    },
  ];

  return createPortal(
    <GuideDialogShell
      topics={topics}
      closeLabel={t('buttons.close')}
      onClose={handleClose}
    />,
    container
  );
});

export const ProjectsGuideDialog = defineModal<void, void>(
  ProjectsGuideDialogImpl
);
