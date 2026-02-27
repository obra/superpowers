import type { ReactNode, RefObject } from 'react';
import { useTranslation } from 'react-i18next';

export interface WorkspacesMainWorkspace {
  id: string;
}

interface WorkspacesMainProps {
  workspaceWithSession: WorkspacesMainWorkspace | undefined;
  isLoading: boolean;
  containerRef: RefObject<HTMLElement>;
  conversationContent?: ReactNode;
  chatBoxContent: ReactNode;
  contextBarContent?: ReactNode;
}

export function WorkspacesMain({
  workspaceWithSession,
  isLoading,
  containerRef,
  conversationContent,
  chatBoxContent,
  contextBarContent,
}: WorkspacesMainProps) {
  const { t } = useTranslation(['tasks', 'common']);

  // Always render the main structure to prevent chat box flash during workspace transitions
  return (
    <main
      ref={containerRef}
      className="relative flex flex-1 flex-col bg-primary h-full"
    >
      {/* Conversation content - conditional based on loading/workspace state */}
      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-low">{t('common:workspaces.loading')}</p>
        </div>
      ) : !workspaceWithSession ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-low">{t('common:workspaces.selectToStart')}</p>
        </div>
      ) : (
        conversationContent
      )}
      {/* Chat box - always rendered to prevent flash during workspace switch */}
      <div className="flex justify-center @container pl-px">
        {chatBoxContent}
      </div>
      {/* Context Bar - floating toolbar */}
      {workspaceWithSession ? contextBarContent : null}
    </main>
  );
}
