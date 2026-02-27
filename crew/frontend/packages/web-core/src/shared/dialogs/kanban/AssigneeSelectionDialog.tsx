import { useCallback, useMemo, useRef, useEffect, useState } from 'react';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { create, useModal } from '@ebay/nice-modal-react';
import { useTranslation } from 'react-i18next';
import type { Project } from 'shared/remote-types';
import type { OrganizationMemberWithProfile } from 'shared/types';
import { defineModal } from '@/shared/lib/modals';
import { CommandDialog } from '@vibe/ui/components/Command';
import {
  MultiSelectCommandBar,
  type MultiSelectOption,
} from '@vibe/ui/components/MultiSelectCommandBar';
import { UserAvatar } from '@vibe/ui/components/UserAvatar';
import { OrgProvider } from '@/shared/providers/remote/OrgProvider';
import { useOrgContext } from '@/shared/hooks/useOrgContext';
import { ProjectProvider } from '@/shared/providers/remote/ProjectProvider';
import { useProjectContext } from '@/shared/hooks/useProjectContext';
import { useOrganizationStore } from '@/shared/stores/useOrganizationStore';
import { useOrganizationProjects } from '@/shared/hooks/useOrganizationProjects';

import type { ProjectSearch } from '@/project-routes/project-search';
export interface AssigneeSelectionDialogProps {
  projectId: string;
  issueIds: string[];
  isCreateMode?: boolean;
  /** Initial assignee IDs for create mode (used instead of URL params when provided) */
  createModeAssigneeIds?: string[];
  /** Callback for create-mode assignee changes (bypasses URL params when provided) */
  onCreateModeAssigneesChange?: (assigneeIds: string[]) => void;
  /** Optional additional options for create-mode selection (e.g. "Me", "Unassigned"). */
  additionalOptions?: MultiSelectOption<string>[];
}

const getUserDisplayName = (user: OrganizationMemberWithProfile): string => {
  return (
    [user.first_name, user.last_name].filter(Boolean).join(' ') ||
    user.username ||
    'User'
  );
};

/** Inner component that uses contexts to render the selection UI */
function AssigneeSelectionContent({
  issueIds,
  isCreateMode,
  createModeAssigneeIds,
  onCreateModeAssigneesChange,
  additionalOptions,
}: {
  issueIds: string[];
  isCreateMode: boolean;
  createModeAssigneeIds?: string[];
  onCreateModeAssigneesChange?: (assigneeIds: string[]) => void;
  additionalOptions?: MultiSelectOption<string>[];
}) {
  const { t } = useTranslation('common');
  const modal = useModal();
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const hasCreateCallback = onCreateModeAssigneesChange != null;
  const navigate = useNavigate();
  const routeSearch = useSearch({ strict: false });

  // Get users from OrgContext - use membersWithProfilesById for OrganizationMemberWithProfile
  const { membersWithProfilesById } = useOrgContext();
  const users = useMemo(
    () => [...membersWithProfilesById.values()],
    [membersWithProfilesById]
  );

  // Get issue assignees and mutation functions from ProjectContext
  const { issueAssignees, insertIssueAssignee, removeIssueAssignee } =
    useProjectContext();

  // Local state for create mode when using callback pattern
  const [localCreateAssignees, setLocalCreateAssignees] = useState<string[]>(
    createModeAssigneeIds ?? []
  );

  // Keep local create-mode state aligned with incoming source-of-truth values.
  // This avoids stale selections when the draft is reset outside the dialog.
  useEffect(() => {
    if (!hasCreateCallback) return;
    setLocalCreateAssignees(createModeAssigneeIds ?? []);
  }, [hasCreateCallback, createModeAssigneeIds, modal.visible]);

  // Fallback: Get/set create mode defaults from URL (for callers without callback)
  const kanbanCreateDefaultAssigneeIds = useMemo(() => {
    const assigneesParam = routeSearch.assignees;
    return assigneesParam ? assigneesParam.split(',').filter(Boolean) : [];
  }, [routeSearch.assignees]);

  const setKanbanCreateDefaultAssigneeIds = useCallback(
    (assigneeIds: string[]) => {
      navigate({
        to: '.',
        search: (prev: ProjectSearch) => ({
          ...prev,
          assignees: assigneeIds.length > 0 ? assigneeIds.join(',') : undefined,
        }),
        replace: true,
      });
    },
    [navigate]
  );

  // Derive selected assignee IDs based on mode and callback availability
  const selectedIds = useMemo(() => {
    if (isCreateMode) {
      return hasCreateCallback
        ? localCreateAssignees
        : kanbanCreateDefaultAssigneeIds;
    }
    return issueAssignees
      .filter((a) => issueIds.includes(a.issue_id))
      .map((a) => a.user_id);
  }, [
    isCreateMode,
    issueIds,
    issueAssignees,
    hasCreateCallback,
    localCreateAssignees,
    kanbanCreateDefaultAssigneeIds,
  ]);

  const [search, setSearch] = useState('');

  // Capture focus when dialog opens and reset search
  useEffect(() => {
    if (modal.visible) {
      previousFocusRef.current = document.activeElement as HTMLElement;
      setSearch('');
    }
  }, [modal.visible]);

  const options: MultiSelectOption<string>[] = useMemo(() => {
    const userOptions = users.map((user) => ({
      value: user.user_id,
      label: getUserDisplayName(user),
      searchValue: `${user.user_id} ${getUserDisplayName(user)} ${user.email ?? ''}`,
      renderOption: () => (
        <div className="flex items-center gap-base">
          <UserAvatar user={user} className="h-5 w-5 text-[10px]" />
          <span>{getUserDisplayName(user)}</span>
        </div>
      ),
    }));

    if (!isCreateMode || !additionalOptions || additionalOptions.length === 0) {
      return userOptions;
    }

    return [...additionalOptions, ...userOptions];
  }, [users, isCreateMode, additionalOptions]);

  const handleToggle = useCallback(
    (userId: string) => {
      const isSelected = selectedIds.includes(userId);

      if (isCreateMode) {
        const newIds = isSelected
          ? selectedIds.filter((id: string) => id !== userId)
          : [...selectedIds, userId];
        if (onCreateModeAssigneesChange) {
          setLocalCreateAssignees(newIds);
          onCreateModeAssigneesChange(newIds);
        } else {
          setKanbanCreateDefaultAssigneeIds(newIds);
        }
      } else {
        // Edit mode: apply mutation immediately for each issue
        for (const issueId of issueIds) {
          if (isSelected) {
            // Remove the assignee
            const record = issueAssignees.find(
              (a) => a.issue_id === issueId && a.user_id === userId
            );
            if (record) {
              removeIssueAssignee(record.id);
            }
          } else {
            // Add the assignee
            insertIssueAssignee({ issue_id: issueId, user_id: userId });
          }
        }
      }
    },
    [
      isCreateMode,
      selectedIds,
      issueIds,
      issueAssignees,
      onCreateModeAssigneesChange,
      setKanbanCreateDefaultAssigneeIds,
      insertIssueAssignee,
      removeIssueAssignee,
    ]
  );

  const handleClose = useCallback(() => {
    modal.hide();
  }, [modal]);

  // Restore focus when dialog closes
  const handleCloseAutoFocus = useCallback((event: Event) => {
    event.preventDefault();
    previousFocusRef.current?.focus();
  }, []);

  return (
    <CommandDialog
      open={modal.visible}
      onOpenChange={(open) => !open && modal.hide()}
      onCloseAutoFocus={handleCloseAutoFocus}
    >
      <MultiSelectCommandBar
        title={t('kanban.selectAssignees', 'Select assignees...')}
        options={options}
        selectedValues={selectedIds}
        onToggle={handleToggle}
        onClose={handleClose}
        search={search}
        onSearchChange={setSearch}
      />
    </CommandDialog>
  );
}

/** Wrapper that provides OrgContext and ProjectContext */
function AssigneeSelectionWithContext({
  projectId,
  issueIds,
  isCreateMode = false,
  createModeAssigneeIds,
  onCreateModeAssigneesChange,
  additionalOptions,
}: AssigneeSelectionDialogProps) {
  // Get organization ID from store (set when navigating to project)
  const selectedOrgId = useOrganizationStore((s) => s.selectedOrgId);

  // Fallback: try to find org from projects if not in store
  const { data: projects = [] } = useOrganizationProjects(selectedOrgId);
  const project = projects.find((p: Project) => p.id === projectId);
  const organizationId = project?.organization_id ?? selectedOrgId;

  // If we don't have the required IDs, render nothing
  if (!organizationId || !projectId) {
    return null;
  }

  return (
    <OrgProvider organizationId={organizationId}>
      <ProjectProvider projectId={projectId}>
        <AssigneeSelectionContent
          issueIds={issueIds}
          isCreateMode={isCreateMode}
          createModeAssigneeIds={createModeAssigneeIds}
          onCreateModeAssigneesChange={onCreateModeAssigneesChange}
          additionalOptions={additionalOptions}
        />
      </ProjectProvider>
    </OrgProvider>
  );
}

const AssigneeSelectionDialogImpl = create<AssigneeSelectionDialogProps>(
  ({
    projectId,
    issueIds,
    isCreateMode,
    createModeAssigneeIds,
    onCreateModeAssigneesChange,
    additionalOptions,
  }) => {
    return (
      <AssigneeSelectionWithContext
        projectId={projectId}
        issueIds={issueIds}
        isCreateMode={isCreateMode}
        createModeAssigneeIds={createModeAssigneeIds}
        onCreateModeAssigneesChange={onCreateModeAssigneesChange}
        additionalOptions={additionalOptions}
      />
    );
  }
);

export const AssigneeSelectionDialog = defineModal<
  AssigneeSelectionDialogProps,
  void
>(AssigneeSelectionDialogImpl);
