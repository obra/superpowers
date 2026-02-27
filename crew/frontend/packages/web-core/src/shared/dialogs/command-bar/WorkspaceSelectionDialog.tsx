import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { create, useModal } from '@ebay/nice-modal-react';
import { useTranslation } from 'react-i18next';
import { GitBranchIcon, PlusIcon } from '@phosphor-icons/react';
import { defineModal } from '@/shared/lib/modals';
import { ApiError, attemptsApi } from '@/shared/lib/api';
import { getWorkspaceDefaults } from '@/shared/lib/workspaceDefaults';
import { ErrorDialog } from '@vibe/ui/components/ErrorDialog';
import { useProjectWorkspaceCreateDraft } from '@/shared/hooks/useProjectWorkspaceCreateDraft';
import {
  buildLinkedIssueCreateState,
  buildLocalWorkspaceIdSet,
  buildWorkspaceCreateInitialState,
  buildWorkspaceCreatePrompt,
} from '@/shared/lib/workspaceCreateState';
import {
  Command,
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from '@vibe/ui/components/Command';
import { useWorkspaceContext } from '@/shared/hooks/useWorkspaceContext';
import { ProjectProvider } from '@/shared/providers/remote/ProjectProvider';
import { useProjectContext } from '@/shared/hooks/useProjectContext';
import { UserProvider } from '@/shared/providers/remote/UserProvider';
import { useUserContext } from '@/shared/hooks/useUserContext';

export interface WorkspaceSelectionDialogProps {
  projectId: string;
  issueId: string;
}

const PAGE_SIZE = 50;

function getLinkWorkspaceErrorMessage(error: unknown): string | null {
  if (error instanceof ApiError && error.status === 409) {
    return 'This workspace is already linked to an issue.';
  }

  if (error instanceof Error) {
    const normalizedMessage = error.message.toLowerCase();
    if (
      normalizedMessage.includes('already exists') ||
      normalizedMessage.includes('already linked')
    ) {
      return 'This workspace is already linked to an issue.';
    }
    return error.message;
  }

  return null;
}

/** Inner component that uses contexts to render the selection UI */
function WorkspaceSelectionContent({
  projectId,
  issueId,
}: {
  projectId: string;
  issueId: string;
}) {
  const { t } = useTranslation('common');
  const modal = useModal();
  const navigate = useNavigate();
  const { openWorkspaceCreateFromState } = useProjectWorkspaceCreateDraft();
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Get local workspaces from WorkspaceContext (both active and archived)
  const { activeWorkspaces, archivedWorkspaces } = useWorkspaceContext();

  // Get already-linked workspaces from UserContext (workspaces are user-scoped)
  const { getWorkspacesForIssue, workspaces } = useUserContext();

  // Get issue data from ProjectContext (issues are project-scoped)
  const { getIssue } = useProjectContext();

  const [search, setSearch] = useState('');
  const [isLinking, setIsLinking] = useState(false);

  // Capture focus when dialog opens and reset state
  useEffect(() => {
    if (modal.visible) {
      previousFocusRef.current = document.activeElement as HTMLElement;
      setSearch('');
      setIsLinking(false);
    }
  }, [modal.visible]);

  // Get IDs of workspaces already linked to this issue
  const linkedLocalWorkspaceIds = useMemo(() => {
    const remoteWorkspaces = getWorkspacesForIssue(issueId);
    return new Set(
      remoteWorkspaces
        .map((w) => w.local_workspace_id)
        .filter((id): id is string => id !== null)
    );
  }, [getWorkspacesForIssue, issueId]);

  // Combine active and archived workspaces with archived flag
  const allWorkspaces = useMemo(() => {
    const active = activeWorkspaces.map((ws) => ({ ...ws, isArchived: false }));
    const archived = archivedWorkspaces.map((ws) => ({
      ...ws,
      isArchived: true,
    }));
    return [...active, ...archived];
  }, [activeWorkspaces, archivedWorkspaces]);

  // Filter and paginate workspaces
  const searchLower = search.toLowerCase();
  const isSearching = search.length > 0;

  const filteredWorkspaces = useMemo(() => {
    return allWorkspaces.filter((ws) => {
      // Exclude already-linked workspaces
      if (linkedLocalWorkspaceIds.has(ws.id)) return false;
      // Filter by search if searching
      if (isSearching) {
        return (
          ws.name.toLowerCase().includes(searchLower) ||
          ws.branch.toLowerCase().includes(searchLower)
        );
      }
      return true;
    });
  }, [allWorkspaces, linkedLocalWorkspaceIds, isSearching, searchLower]);

  // Apply pagination when not searching
  const displayedWorkspaces = useMemo(() => {
    return isSearching
      ? filteredWorkspaces
      : filteredWorkspaces.slice(0, PAGE_SIZE);
  }, [filteredWorkspaces, isSearching]);

  const handleLinkWorkspace = useCallback(
    async (workspaceId: string) => {
      if (isLinking) return;

      setIsLinking(true);
      try {
        await attemptsApi.linkToIssue(workspaceId, projectId, issueId);
        // Success - close dialog. UI will auto-update via Electric sync.
        modal.hide();
      } catch (err) {
        const errorMessage =
          getLinkWorkspaceErrorMessage(err) ??
          t('workspaces.linkError', 'Failed to link workspace');

        await ErrorDialog.show({
          title: t('common:error'),
          message: errorMessage,
          buttonText: t('common:ok'),
        });
      } finally {
        setIsLinking(false);
      }
    },
    [projectId, issueId, isLinking, modal, t]
  );

  const handleCreateNewWorkspace = useCallback(async () => {
    if (isLinking) return;
    setIsLinking(true);

    try {
      // Get issue details for initial prompt
      const issue = getIssue(issueId);
      const initialPrompt = buildWorkspaceCreatePrompt(
        issue?.title ?? null,
        issue?.description ?? null
      );

      // Build set of local workspace IDs that exist on this machine
      const localWorkspaceIds = buildLocalWorkspaceIdSet(
        activeWorkspaces,
        archivedWorkspaces
      );

      // Get defaults from most recent workspace
      const defaults = await getWorkspaceDefaults(
        workspaces,
        localWorkspaceIds
      );

      // Navigate and close dialog
      const createState = buildWorkspaceCreateInitialState({
        prompt: initialPrompt,
        defaults,
        linkedIssue: buildLinkedIssueCreateState(issue, projectId),
      });

      modal.hide();
      const draftId = await openWorkspaceCreateFromState(createState, {
        issueId,
      });
      if (!draftId) {
        navigate({
          to: '/workspaces/create',
          state: (prev) => ({
            ...prev,
            ...createState,
          }),
        });
      }
    } finally {
      setIsLinking(false);
    }
  }, [
    modal,
    navigate,
    openWorkspaceCreateFromState,
    getIssue,
    issueId,
    projectId,
    workspaces,
    isLinking,
    activeWorkspaces,
    archivedWorkspaces,
  ]);

  // Restore focus when dialog closes
  const handleCloseAutoFocus = useCallback((event: Event) => {
    event.preventDefault();
    previousFocusRef.current?.focus();
  }, []);

  // Prevent Radix from managing focus on open - let cmdk handle it
  const handleOpenAutoFocus = useCallback((event: Event) => {
    event.preventDefault();
  }, []);

  return (
    <CommandDialog
      open={modal.visible}
      onOpenChange={(open) => !open && modal.hide()}
      onCloseAutoFocus={handleCloseAutoFocus}
      onOpenAutoFocus={handleOpenAutoFocus}
    >
      <Command
        className="rounded-sm border border-border [&_[cmdk-group-heading]]:px-base [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-low [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-group]]:px-half [&_[cmdk-input-wrapper]_svg]:h-4 [&_[cmdk-input-wrapper]_svg]:w-4 [&_[cmdk-input]]:h-12 [&_[cmdk-item]]:px-base [&_[cmdk-item]]:py-half"
        loop
        filter={(value, search) => {
          if (value.toLowerCase().includes(search.toLowerCase())) return 1;
          return 0;
        }}
      >
        <div className="flex items-center border-b border-border">
          <CommandInput
            placeholder={t('kanban.linkWorkspace', 'Link workspace...')}
            value={search}
            onValueChange={setSearch}
          />
        </div>
        <CommandList className="min-h-[200px]">
          <CommandEmpty>
            {t('commandBar.noResults', 'No results found')}
          </CommandEmpty>

          {/* Create new workspace option - stubbed */}
          <CommandGroup>
            <CommandItem
              value="__create_new__"
              onSelect={handleCreateNewWorkspace}
              disabled={isLinking}
            >
              <PlusIcon className="h-4 w-4" weight="bold" />
              <span>
                {t('kanban.createNewWorkspace', 'Create new workspace')}
              </span>
            </CommandItem>
          </CommandGroup>

          {/* Available workspaces */}
          {displayedWorkspaces.length > 0 && (
            <CommandGroup heading={t('kanban.workspaces', 'Workspaces')}>
              {displayedWorkspaces.map((workspace) => (
                <CommandItem
                  key={workspace.id}
                  value={`${workspace.id} ${workspace.name} ${workspace.branch}${workspace.isArchived ? ' archived' : ''}`}
                  onSelect={() => handleLinkWorkspace(workspace.id)}
                  disabled={isLinking}
                >
                  <GitBranchIcon
                    className={`h-4 w-4 shrink-0 ${workspace.isArchived ? 'text-low' : ''}`}
                    weight="regular"
                  />
                  <span
                    className={`truncate ${workspace.isArchived ? 'text-low' : ''}`}
                  >
                    {workspace.name}
                  </span>
                  {workspace.isArchived && (
                    <span className="text-xs text-low">
                      ({t('workspaces.archived').toLowerCase()})
                    </span>
                  )}
                  <span className="ml-auto text-xs text-low truncate max-w-[120px]">
                    {workspace.branch}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {/* Show count when paginated */}
          {!isSearching && filteredWorkspaces.length > PAGE_SIZE && (
            <div className="px-base py-half text-xs text-low text-center">
              {t('kanban.showingWorkspaces', 'Showing {{count}} of {{total}}', {
                count: PAGE_SIZE,
                total: filteredWorkspaces.length,
              })}
            </div>
          )}
        </CommandList>
      </Command>
    </CommandDialog>
  );
}

/** Wrapper that provides UserContext and ProjectContext */
function WorkspaceSelectionWithContext({
  projectId,
  issueId,
}: WorkspaceSelectionDialogProps) {
  if (!projectId) {
    return null;
  }

  return (
    <UserProvider>
      <ProjectProvider projectId={projectId}>
        <WorkspaceSelectionContent projectId={projectId} issueId={issueId} />
      </ProjectProvider>
    </UserProvider>
  );
}

const WorkspaceSelectionDialogImpl = create<WorkspaceSelectionDialogProps>(
  ({ projectId, issueId }) => {
    return (
      <WorkspaceSelectionWithContext projectId={projectId} issueId={issueId} />
    );
  }
);

export const WorkspaceSelectionDialog = defineModal<
  WorkspaceSelectionDialogProps,
  void
>(WorkspaceSelectionDialogImpl);
