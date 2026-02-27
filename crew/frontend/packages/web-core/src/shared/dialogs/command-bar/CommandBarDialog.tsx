import { useRef, useEffect, useCallback, useMemo } from 'react';
import { useParams } from '@tanstack/react-router';
import { create, useModal } from '@ebay/nice-modal-react';
import { useQueryClient } from '@tanstack/react-query';
import type { Workspace } from 'shared/types';
import { defineModal } from '@/shared/lib/modals';
import { CommandDialog } from '@vibe/ui/components/Command';
import {
  CommandBar,
  type CommandBarGroupItem,
} from '@vibe/ui/components/CommandBar';
import { useActions } from '@/shared/hooks/useActions';
import { useWorkspaceContext } from '@/shared/hooks/useWorkspaceContext';
import { attemptKeys } from '@/shared/hooks/useAttempt';
import { IdeIcon } from '@/shared/components/IdeIcon';
import type { PageId, ResolvedGroupItem } from '@/shared/types/commandBar';
import {
  ActionTargetType,
  type ActionDefinition,
} from '@/shared/types/actions';
import { useActionVisibilityContext } from '@/shared/hooks/useActionVisibilityContext';
import type { SelectionPage } from './SelectionDialog';
import type { RepoSelectionResult } from './selections/repoSelection';
import { useCommandBarState } from './commandBar/useCommandBarState';
import { useResolvedPage } from './commandBar/useResolvedPage';

export interface CommandBarDialogProps {
  page?: PageId;
  workspaceId?: string;
  repoId?: string;
  /** Issue context for kanban mode - projectId */
  projectId?: string;
  /** Issue context for kanban mode - selected issue IDs */
  issueIds?: string[];
}

function CommandBarContent({
  page,
  workspaceId,
  initialRepoId,
  propProjectId,
  propIssueIds,
}: {
  page: PageId;
  workspaceId?: string;
  initialRepoId?: string;
  propProjectId?: string;
  propIssueIds?: string[];
}) {
  const modal = useModal();
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const queryClient = useQueryClient();
  const { executeAction, getLabel } = useActions();
  const { workspaceId: contextWorkspaceId, repos } = useWorkspaceContext();

  // Get issue context from props or route params (URL is single source of truth)
  const { projectId: routeProjectId, issueId: routeIssueId } = useParams({
    strict: false,
  });

  // Effective issue context
  const effectiveProjectId = propProjectId ?? routeProjectId;
  const effectiveIssueIds = useMemo(
    () => propIssueIds ?? (routeIssueId ? [routeIssueId] : []),
    [propIssueIds, routeIssueId]
  );
  const visibilityContext = useActionVisibilityContext({
    projectId: effectiveProjectId,
    issueIds: effectiveIssueIds,
  });

  const effectiveWorkspaceId = workspaceId ?? contextWorkspaceId;
  const workspace = effectiveWorkspaceId
    ? queryClient.getQueryData<Workspace>(
        attemptKeys.byId(effectiveWorkspaceId)
      )
    : undefined;

  // State machine
  const { state, currentPage, canGoBack, dispatch } = useCommandBarState(page);

  // Reset state and capture focus when dialog opens
  useEffect(() => {
    if (modal.visible) {
      dispatch({ type: 'RESET', page });
      previousFocusRef.current = document.activeElement as HTMLElement;
    }
  }, [modal.visible, page, dispatch]);

  // Resolve current page to renderable data
  const resolvedPage = useResolvedPage(
    currentPage,
    state.search,
    visibilityContext,
    workspace
  );

  // Handle item selection with side effects
  const handleSelect = useCallback(
    async (item: CommandBarGroupItem<ActionDefinition, PageId>) => {
      const effect = dispatch({
        type: 'SELECT_ITEM',
        item: item as ResolvedGroupItem,
      });
      if (effect.type !== 'execute') return;

      modal.hide();

      if (effect.action.requiresTarget === ActionTargetType.ISSUE) {
        executeAction(
          effect.action,
          undefined,
          effectiveProjectId,
          effectiveIssueIds
        );
      } else if (effect.action.requiresTarget === ActionTargetType.GIT) {
        // Resolve repoId: use initialRepoId, single repo, or show selection dialog
        let repoId: string | undefined = initialRepoId;
        if (!repoId && repos.length === 1) {
          repoId = repos[0].id;
        } else if (!repoId && repos.length > 1) {
          const { SelectionDialog } = await import('./SelectionDialog');
          const { buildRepoSelectionPages } = await import(
            './selections/repoSelection'
          );
          const result = await SelectionDialog.show({
            initialPageId: 'selectRepo',
            pages: buildRepoSelectionPages(repos) as Record<
              string,
              SelectionPage
            >,
          });
          if (result && typeof result === 'object' && 'repoId' in result) {
            repoId = (result as RepoSelectionResult).repoId;
          }
        }
        if (repoId) {
          executeAction(effect.action, effectiveWorkspaceId, repoId);
        }
      } else {
        executeAction(effect.action, effectiveWorkspaceId);
      }
    },
    [
      dispatch,
      modal,
      executeAction,
      effectiveWorkspaceId,
      effectiveProjectId,
      effectiveIssueIds,
      repos,
      initialRepoId,
    ]
  );

  // Restore focus when dialog closes (unless another dialog has taken focus)
  const handleCloseAutoFocus = useCallback((event: Event) => {
    event.preventDefault();
    // Don't restore focus if another dialog has taken over (e.g., action opened a new dialog)
    const activeElement = document.activeElement;
    const isInDialog = activeElement?.closest('[role="dialog"]');
    if (!isInDialog) {
      previousFocusRef.current?.focus();
    }
  }, []);

  return (
    <CommandDialog
      open={modal.visible}
      onOpenChange={(open) => !open && modal.hide()}
      onCloseAutoFocus={handleCloseAutoFocus}
    >
      <CommandBar
        page={resolvedPage}
        canGoBack={canGoBack}
        onGoBack={() => dispatch({ type: 'GO_BACK' })}
        onSelect={handleSelect}
        getLabel={(action) => getLabel(action, workspace, visibilityContext)}
        search={state.search}
        onSearchChange={(query) => dispatch({ type: 'SEARCH_CHANGE', query })}
        renderSpecialActionIcon={(iconName) =>
          iconName === 'ide-icon' ? (
            <IdeIcon
              editorType={visibilityContext.editorType}
              className="h-4 w-4"
            />
          ) : null
        }
      />
    </CommandDialog>
  );
}

const CommandBarDialogImpl = create<CommandBarDialogProps>(
  ({
    page = 'root',
    workspaceId,
    repoId: initialRepoId,
    projectId: propProjectId,
    issueIds: propIssueIds,
  }) => (
    <CommandBarContent
      page={page}
      workspaceId={workspaceId}
      initialRepoId={initialRepoId}
      propProjectId={propProjectId}
      propIssueIds={propIssueIds}
    />
  )
);

export const CommandBarDialog = defineModal<CommandBarDialogProps | void, void>(
  CommandBarDialogImpl
);
