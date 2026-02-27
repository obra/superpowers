import {
  useState,
  useMemo,
  useCallback,
  useEffect,
  useReducer,
  useRef,
} from 'react';
import { useDropzone } from 'react-dropzone';
import { useTranslation } from 'react-i18next';
import type { OrganizationMemberWithProfile } from 'shared/types';
import type { IssuePriority } from 'shared/remote-types';
import { useDebouncedCallback } from '@/shared/hooks/useDebouncedCallback';
import { useProjectContext } from '@/shared/hooks/useProjectContext';
import { useOrgContext } from '@/shared/hooks/useOrgContext';
import { useKanbanNavigation } from '@/shared/hooks/useKanbanNavigation';
import { useProjectWorkspaceCreateDraft } from '@/shared/hooks/useProjectWorkspaceCreateDraft';
import WYSIWYGEditor from '@/shared/components/WYSIWYGEditor';
import { SearchableTagDropdownContainer } from '@/shared/components/SearchableTagDropdownContainer';
import { IssueCommentsSectionContainer } from './IssueCommentsSectionContainer';
import { IssueSubIssuesSectionContainer } from './IssueSubIssuesSectionContainer';
import { IssueRelationshipsSectionContainer } from './IssueRelationshipsSectionContainer';
import { IssueWorkspacesSectionContainer } from './IssueWorkspacesSectionContainer';
import {
  KanbanIssuePanel,
  type IssueFormData,
} from '@vibe/ui/components/KanbanIssuePanel';
import { useActions } from '@/shared/hooks/useActions';
import { useUserContext } from '@/shared/hooks/useUserContext';
import { useWorkspaceContext } from '@/shared/hooks/useWorkspaceContext';
import { CommandBarDialog } from '@/shared/dialogs/command-bar/CommandBarDialog';
import { getWorkspaceDefaults } from '@/shared/lib/workspaceDefaults';
import {
  buildLinkedIssueCreateState,
  buildWorkspaceCreateInitialState,
  buildWorkspaceCreatePrompt,
} from '@/shared/lib/workspaceCreateState';
import { ScratchType, type DraftIssueData } from 'shared/types';
import { useScratch } from '@/shared/hooks/useScratch';
import {
  createBlankCreateFormData,
  createInitialKanbanIssuePanelFormState,
  kanbanIssuePanelFormReducer,
  selectDisplayData,
  selectIsCreateDraftDirty,
} from './kanban-issue-panel-state';
import { useAzureAttachments } from '@/shared/hooks/useAzureAttachments';
import {
  commitIssueAttachments,
  deleteAttachment,
} from '@/shared/lib/remoteApi';
import { extractAttachmentIds } from '@/shared/lib/attachmentUtils';

const DRAFT_ISSUE_ID = '00000000-0000-0000-0000-000000000002';

interface KanbanIssuePanelContainerProps {
  issueResolution: 'resolving' | 'ready' | 'missing' | null;
  onExpectIssueOpen: (issueId: string) => void;
}

/**
 * KanbanIssuePanelContainer manages the issue detail/create panel.
 * Uses ProjectContext and OrgContext for data and mutations.
 * Must be rendered within both OrgProvider and ProjectProvider.
 */
export function KanbanIssuePanelContainer({
  issueResolution,
  onExpectIssueOpen,
}: KanbanIssuePanelContainerProps) {
  const { t } = useTranslation('common');
  // Navigation hook - URL is single source of truth
  const {
    issueId: selectedKanbanIssueId,
    isCreateMode: kanbanCreateMode,
    createDefaultStatusId: kanbanCreateDefaultStatusId,
    createDefaultPriority: kanbanCreateDefaultPriority,
    createDefaultAssigneeIds: kanbanCreateDefaultAssigneeIds,
    createDefaultParentIssueId: kanbanCreateDefaultParentIssueId,
    openIssue,
    closePanel,
    updateCreateDefaults,
  } = useKanbanNavigation();

  const { openWorkspaceCreateFromState } = useProjectWorkspaceCreateDraft();
  const { workspaces } = useUserContext();
  const { activeWorkspaces, archivedWorkspaces } = useWorkspaceContext();

  // Build set of local workspace IDs that exist on this machine
  const localWorkspaceIds = useMemo(
    () =>
      new Set([
        ...activeWorkspaces.map((w) => w.id),
        ...archivedWorkspaces.map((w) => w.id),
      ]),
    [activeWorkspaces, archivedWorkspaces]
  );

  // Get data from contexts
  const {
    projectId,
    issues,
    statuses,
    tags,
    issueAssignees,
    issueTags,
    insertIssue,
    updateIssue,
    insertIssueAssignee,
    insertIssueTag,
    removeIssueTag,
    insertTag,
    getTagsForIssue,
    getPullRequestsForIssue,
    isLoading: projectLoading,
  } = useProjectContext();

  const { isLoading: orgLoading, membersWithProfilesById } = useOrgContext();

  // Get action methods from actions context
  const { openStatusSelection, openPrioritySelection, openAssigneeSelection } =
    useActions();

  // Close panel by navigating to project URL (URL is single source of truth)
  const closeKanbanIssuePanel = closePanel;

  // Find selected issue if in edit mode
  const selectedIssue = useMemo(() => {
    if (kanbanCreateMode || !selectedKanbanIssueId) return null;
    return issues.find((i) => i.id === selectedKanbanIssueId) ?? null;
  }, [issues, selectedKanbanIssueId, kanbanCreateMode]);

  const creatorUserId = selectedIssue?.creator_user_id ?? null;
  const issueCreator = useMemo(() => {
    if (!creatorUserId) return null;
    return membersWithProfilesById.get(creatorUserId) ?? null;
  }, [membersWithProfilesById, creatorUserId]);

  // Find parent issue if current issue has one
  const parentIssue = useMemo(() => {
    if (!selectedIssue?.parent_issue_id) return null;
    const parent = issues.find((i) => i.id === selectedIssue.parent_issue_id);
    if (!parent) return null;
    return { id: parent.id, simpleId: parent.simple_id };
  }, [issues, selectedIssue]);

  // Handler for clicking on parent issue - navigate to that issue
  const handleParentIssueClick = useCallback(() => {
    if (parentIssue) {
      openIssue(parentIssue.id);
    }
  }, [parentIssue, openIssue]);

  const handleRemoveParentIssue = useCallback(() => {
    if (!selectedKanbanIssueId || !selectedIssue?.parent_issue_id) return;
    updateIssue(selectedKanbanIssueId, {
      parent_issue_id: null,
      parent_issue_sort_order: null,
    });
  }, [selectedKanbanIssueId, selectedIssue?.parent_issue_id, updateIssue]);

  // Get all current assignees from issue_assignees
  const currentAssigneeIds = useMemo(() => {
    if (!selectedKanbanIssueId) return [];
    return issueAssignees
      .filter((a) => a.issue_id === selectedKanbanIssueId)
      .map((a) => a.user_id);
  }, [issueAssignees, selectedKanbanIssueId]);

  // Get current tag IDs from issue_tags junction table
  const currentTagIds = useMemo(() => {
    if (!selectedKanbanIssueId) return [];
    const tagLinks = getTagsForIssue(selectedKanbanIssueId);
    return tagLinks.map((it) => it.tag_id);
  }, [getTagsForIssue, selectedKanbanIssueId]);

  // Get linked PRs for the issue
  const linkedPrs = useMemo(() => {
    if (!selectedKanbanIssueId) return [];
    return getPullRequestsForIssue(selectedKanbanIssueId).map((pr) => ({
      id: pr.id,
      number: pr.number,
      url: pr.url,
      status: pr.status,
    }));
  }, [getPullRequestsForIssue, selectedKanbanIssueId]);

  // Determine mode (only edit when an issue is selected)
  const mode = kanbanCreateMode || !selectedKanbanIssueId ? 'create' : 'edit';

  // Sort statuses by sort_order
  const sortedStatuses = useMemo(
    () => [...statuses].sort((a, b) => a.sort_order - b.sort_order),
    [statuses]
  );

  // Default status: use kanbanCreateDefaultStatusId if set, otherwise first by sort order
  const defaultStatusId =
    kanbanCreateDefaultStatusId ?? sortedStatuses[0]?.id ?? '';

  // Default create form values for the current URL defaults + project context
  const createModeDefaults = useMemo<IssueFormData>(
    () => ({
      title: '',
      description: null,
      statusId: defaultStatusId,
      priority: kanbanCreateDefaultPriority ?? null,
      assigneeIds: [...(kanbanCreateDefaultAssigneeIds ?? [])],
      tagIds: [],
      createDraftWorkspace: false,
    }),
    [
      defaultStatusId,
      kanbanCreateDefaultPriority,
      kanbanCreateDefaultAssigneeIds,
    ]
  );

  // Track previous issue ID to detect actual issue switches (not just data updates)
  const prevIssueIdRef = useRef<string | null>(null);
  const titleInputRef = useRef<HTMLTextAreaElement>(null);

  const [formState, dispatchFormState] = useReducer(
    kanbanIssuePanelFormReducer,
    undefined,
    createInitialKanbanIssuePanelFormState
  );
  const createFormData = formState.createFormData;
  const isDraftAutosavePaused = formState.isDraftAutosavePaused;

  useEffect(() => {
    if (mode !== 'create') return;

    const titleInput = titleInputRef.current;
    if (!titleInput || document.activeElement === titleInput) return;

    const frameId = requestAnimationFrame(() => {
      const node = titleInputRef.current;
      if (!node || document.activeElement === node) return;

      node.focus();
      const caretIndex = node.value.length;
      node.setSelectionRange(caretIndex, caretIndex);
    });

    return () => cancelAnimationFrame(frameId);
  }, [mode, selectedKanbanIssueId, createFormData?.title]);

  // Display ID: use real simple_id in edit mode, placeholder for create mode
  const displayId = useMemo(() => {
    if (mode === 'edit' && selectedIssue) {
      return selectedIssue.simple_id;
    }
    return t('kanban.newIssue');
  }, [mode, selectedIssue, t]);

  // Compute display values based on mode
  // - Create mode: createFormData is the single source of truth.
  // - Edit mode: text fields come from explicit local edit state, dropdown fields from server.
  const displayData = useMemo((): IssueFormData => {
    return selectDisplayData({
      state: formState,
      mode,
      createModeDefaults,
      selectedIssue,
      currentAssigneeIds,
      currentTagIds,
    });
  }, [
    formState,
    mode,
    createModeDefaults,
    selectedIssue,
    currentAssigneeIds,
    currentTagIds,
  ]);

  const isCreateDraftDirty = useMemo(() => {
    return selectIsCreateDraftDirty({
      state: formState,
      mode,
      createModeDefaults,
    });
  }, [formState, mode, createModeDefaults]);

  // Resolve assignee IDs to full profiles for avatar display
  const displayAssigneeUsers = useMemo(() => {
    return displayData.assigneeIds
      .map((id) => membersWithProfilesById.get(id))
      .filter((m): m is OrganizationMemberWithProfile => m != null);
  }, [displayData.assigneeIds, membersWithProfilesById]);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Save status for description (shown in WYSIWYG toolbar)
  const [descriptionSaveStatus, setDescriptionSaveStatus] = useState<
    'idle' | 'saved'
  >('idle');

  // Debounced save for title changes
  const { debounced: debouncedSaveTitle, cancel: cancelDebouncedTitle } =
    useDebouncedCallback((title: string) => {
      if (selectedKanbanIssueId && !kanbanCreateMode) {
        updateIssue(selectedKanbanIssueId, { title });
      }
    }, 500);

  // Debounced save for description changes
  const {
    debounced: debouncedSaveDescription,
    cancel: cancelDebouncedDescription,
  } = useDebouncedCallback((description: string | null) => {
    if (selectedKanbanIssueId && !kanbanCreateMode) {
      updateIssue(selectedKanbanIssueId, { description });
      setDescriptionSaveStatus('saved');
      setTimeout(() => setDescriptionSaveStatus('idle'), 1500);
    }
  }, 500);

  // Draft issue scratch persistence
  const {
    scratch: draftIssueScratch,
    updateScratch: updateDraftIssueScratch,
    deleteScratch: deleteDraftIssueScratch,
    isLoading: draftIssueLoading,
  } = useScratch(ScratchType.DRAFT_ISSUE, DRAFT_ISSUE_ID);

  const hasDraftIssueScratch = useMemo(() => {
    const scratchData =
      draftIssueScratch?.payload?.type === 'DRAFT_ISSUE'
        ? draftIssueScratch.payload.data
        : undefined;
    return Boolean(scratchData && scratchData.project_id === projectId);
  }, [draftIssueScratch, projectId]);

  const {
    debounced: debouncedSaveDraftIssue,
    cancel: cancelDebouncedDraftIssue,
  } = useDebouncedCallback(async (data: DraftIssueData) => {
    try {
      await updateDraftIssueScratch({
        payload: { type: 'DRAFT_ISSUE', data },
      });
    } catch (e) {
      console.error('Failed to save draft issue:', e);
    }
  }, 500);

  // Reset save status only when switching to a different issue or mode
  useEffect(() => {
    setDescriptionSaveStatus('idle');
  }, [selectedKanbanIssueId, kanbanCreateMode]);

  // Helper to build form data from a draft issue scratch
  const restoreFromScratch = useCallback(
    (scratchData: DraftIssueData): IssueFormData => {
      const statusExists = statuses.some((s) => s.id === scratchData.status_id);
      return {
        title: scratchData.title,
        description: scratchData.description ?? null,
        statusId: statusExists ? scratchData.status_id : defaultStatusId,
        priority: (scratchData.priority as IssueFormData['priority']) ?? null,
        assigneeIds: scratchData.assignee_ids,
        tagIds: scratchData.tag_ids,
        createDraftWorkspace: scratchData.create_draft_workspace,
      };
    },
    [statuses, defaultStatusId]
  );

  const createFormFallback = useMemo(
    () => createBlankCreateFormData(defaultStatusId),
    [defaultStatusId]
  );

  // --- Image attachment upload integration ---

  // Callback to insert markdown into the description field
  const handleDescriptionInsert = useCallback(
    (markdown: string) => {
      const currentDesc = displayData.description ?? '';
      const separator = currentDesc.length > 0 ? '\n' : '';
      const newDesc = currentDesc + separator + markdown;

      if (kanbanCreateMode || !selectedKanbanIssueId) {
        // Create mode: update form data
        dispatchFormState({
          type: 'patchCreateFormData',
          patch: { description: newDesc },
          fallback: createFormFallback,
        });
      } else {
        // Edit mode: update local state + debounced save
        dispatchFormState({
          type: 'setEditDescription',
          description: newDesc,
        });
        debouncedSaveDescription(newDesc);
      }
    },
    [
      kanbanCreateMode,
      selectedKanbanIssueId,
      displayData.description,
      createFormFallback,
      debouncedSaveDescription,
    ]
  );

  // Azure attachment upload hook
  const {
    uploadFiles,
    getAttachmentIds,
    clearAttachments,
    isUploading,
    uploadError,
    clearUploadError,
  } = useAzureAttachments({
    projectId,
    issueId: kanbanCreateMode
      ? undefined
      : (selectedKanbanIssueId ?? undefined),
    onMarkdownInsert: handleDescriptionInsert,
    onError: (msg) => console.error('[attachment]', msg),
  });

  // Dropzone for drag-drop image upload on description area
  const {
    getRootProps,
    getInputProps,
    isDragActive,
    open: openFilePicker,
  } = useDropzone({
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) uploadFiles(acceptedFiles);
    },
    noClick: true,
    noKeyboard: true,
  });

  // Paste handler for images
  const onPasteFiles = useCallback(
    (files: File[]) => {
      if (files.length > 0) uploadFiles(files);
    },
    [uploadFiles]
  );

  // Reset local state when switching issues or modes.
  useEffect(() => {
    const currentIssueId = selectedKanbanIssueId;
    const isNewIssue = currentIssueId !== prevIssueIdRef.current;

    if (!isNewIssue) {
      // Same issue - no reset needed
      // (dropdown fields derive from server state, text fields preserve local edits)
      return;
    }

    // Track the new issue ID
    prevIssueIdRef.current = currentIssueId;

    // Cancel any pending debounced saves when switching issues
    cancelDebouncedTitle();
    cancelDebouncedDescription();
    cancelDebouncedDraftIssue();

    let nextCreateFormData: IssueFormData | null = null;
    let hasRestoredFromScratch = false;

    // Initialize create form data if in create mode
    if (mode === 'create') {
      // Gate on scratch loading — don't initialize until we know the scratch state
      if (draftIssueLoading) {
        nextCreateFormData = null;
      } else {
        // Priority 1: Restore from scratch if available for this project
        const scratchData =
          draftIssueScratch?.payload?.type === 'DRAFT_ISSUE'
            ? draftIssueScratch.payload.data
            : undefined;

        if (scratchData && scratchData.project_id === projectId) {
          hasRestoredFromScratch = true;
          nextCreateFormData = restoreFromScratch(scratchData);
        } else {
          // Priority 2: Seed from URL defaults (read once), then empty form
          nextCreateFormData = createModeDefaults;
        }
      }
    }

    dispatchFormState({
      type: 'resetForIssueChange',
      mode,
      createFormData: nextCreateFormData,
      hasRestoredFromScratch,
    });
  }, [
    mode,
    selectedKanbanIssueId,
    cancelDebouncedTitle,
    cancelDebouncedDescription,
    cancelDebouncedDraftIssue,
    draftIssueScratch,
    draftIssueLoading,
    projectId,
    restoreFromScratch,
    createModeDefaults,
  ]);

  // Handle late scratch loading: if scratch arrives after initial create mode render
  useEffect(() => {
    if (mode !== 'create') {
      if (formState.hasRestoredFromScratch) {
        dispatchFormState({
          type: 'setHasRestoredFromScratch',
          hasRestoredFromScratch: false,
        });
      }
      return;
    }
    if (formState.hasRestoredFromScratch) return;
    if (draftIssueLoading) return;

    const scratchData =
      draftIssueScratch?.payload?.type === 'DRAFT_ISSUE'
        ? draftIssueScratch.payload.data
        : undefined;

    if (scratchData && scratchData.project_id === projectId) {
      dispatchFormState({
        type: 'setCreateFormData',
        createFormData: restoreFromScratch(scratchData),
      });
      dispatchFormState({
        type: 'setHasRestoredFromScratch',
        hasRestoredFromScratch: true,
      });
    } else if (createFormData === null) {
      // Scratch loaded but no data — seed from URL defaults
      dispatchFormState({
        type: 'setCreateFormData',
        createFormData: createModeDefaults,
      });
    }
  }, [
    mode,
    formState.hasRestoredFromScratch,
    draftIssueScratch,
    draftIssueLoading,
    projectId,
    restoreFromScratch,
    createFormData,
    createModeDefaults,
  ]);

  // Auto-save draft issue to scratch when form data changes in create mode
  useEffect(() => {
    if (
      mode !== 'create' ||
      !createFormData ||
      !projectId ||
      isDraftAutosavePaused
    ) {
      return;
    }

    if (!isCreateDraftDirty) {
      cancelDebouncedDraftIssue();
      if (hasDraftIssueScratch) {
        deleteDraftIssueScratch().catch((error) => {
          console.error('Failed to delete draft issue:', error);
        });
      }
      return;
    }

    debouncedSaveDraftIssue({
      title: createFormData.title,
      description: createFormData.description ?? undefined,
      status_id: createFormData.statusId,
      priority: createFormData.priority ?? undefined,
      assignee_ids: createFormData.assigneeIds,
      tag_ids: createFormData.tagIds,
      create_draft_workspace: createFormData.createDraftWorkspace,
      project_id: projectId,
      parent_issue_id: kanbanCreateDefaultParentIssueId ?? undefined,
    } as DraftIssueData);
  }, [
    mode,
    createFormData,
    projectId,
    kanbanCreateDefaultParentIssueId,
    debouncedSaveDraftIssue,
    isDraftAutosavePaused,
    isCreateDraftDirty,
    hasDraftIssueScratch,
    cancelDebouncedDraftIssue,
    deleteDraftIssueScratch,
  ]);

  // Form change handler - persists changes immediately in edit mode
  const handlePropertyChange = useCallback(
    async <K extends keyof IssueFormData>(
      field: K,
      value: IssueFormData[K]
    ) => {
      // Create mode: update createFormData for all fields
      if (kanbanCreateMode || !selectedKanbanIssueId) {
        if (isDraftAutosavePaused) {
          dispatchFormState({
            type: 'setDraftAutosavePaused',
            isPaused: false,
          });
        }

        // For statusId, open the status selection dialog with callback
        if (field === 'statusId') {
          const { ProjectSelectionDialog } = await import(
            '@/shared/dialogs/command-bar/selections/ProjectSelectionDialog'
          );
          const result = await ProjectSelectionDialog.show({
            projectId,
            selection: { type: 'status', issueIds: [], isCreateMode: true },
          });
          if (result && typeof result === 'object' && 'statusId' in result) {
            const statusId = result.statusId as string;
            updateCreateDefaults({ statusId });
            dispatchFormState({
              type: 'patchCreateFormData',
              patch: { statusId },
              fallback: createFormFallback,
            });
          }
          return;
        }

        // For priority, open the priority selection dialog with callback
        if (field === 'priority') {
          const { ProjectSelectionDialog } = await import(
            '@/shared/dialogs/command-bar/selections/ProjectSelectionDialog'
          );
          const result = await ProjectSelectionDialog.show({
            projectId,
            selection: { type: 'priority', issueIds: [], isCreateMode: true },
          });
          if (result && typeof result === 'object' && 'priority' in result) {
            const priority = (result as { priority: IssuePriority | null })
              .priority;
            updateCreateDefaults({
              priority,
            });
            dispatchFormState({
              type: 'patchCreateFormData',
              patch: { priority },
              fallback: createFormFallback,
            });
          }
          return;
        }

        // For assigneeIds, open the assignee selection dialog with callback
        if (field === 'assigneeIds') {
          const { AssigneeSelectionDialog } = await import(
            '@/shared/dialogs/kanban/AssigneeSelectionDialog'
          );
          await AssigneeSelectionDialog.show({
            projectId,
            issueIds: [],
            isCreateMode: true,
            createModeAssigneeIds: createFormData?.assigneeIds ?? [],
            onCreateModeAssigneesChange: (assigneeIds: string[]) => {
              dispatchFormState({
                type: 'setCreateAssigneeIds',
                assigneeIds,
              });
            },
          });
          return;
        }

        // For other fields, just update the form data
        dispatchFormState({
          type: 'patchCreateFormData',
          patch: { [field]: value } as Partial<IssueFormData>,
          fallback: createFormFallback,
        });
        return;
      }

      // Edit mode: handle text fields vs dropdown fields differently
      if (field === 'title') {
        // Text field: update local state, then debounced save
        dispatchFormState({
          type: 'setEditTitle',
          title: value as string,
        });
        debouncedSaveTitle(value as string);
      } else if (field === 'description') {
        // Text field: update local state, then debounced save
        dispatchFormState({
          type: 'setEditDescription',
          description: value as string | null,
        });
        debouncedSaveDescription(value as string | null);
      } else if (field === 'statusId') {
        // Status changes go through the command bar status selection
        openStatusSelection(projectId, [selectedKanbanIssueId]);
      } else if (field === 'priority') {
        // Priority changes go through the command bar priority selection
        openPrioritySelection(projectId, [selectedKanbanIssueId]);
      } else if (field === 'assigneeIds') {
        // Assignee changes go through the assignee selection dialog
        openAssigneeSelection(projectId, [selectedKanbanIssueId], false);
      } else if (field === 'tagIds') {
        // Handle tag changes via junction table
        const newTagIds = value as string[];
        const currentIssueTags = issueTags.filter(
          (it) => it.issue_id === selectedKanbanIssueId
        );
        const currentTagIdSet = new Set(
          currentIssueTags.map((it) => it.tag_id)
        );
        const newTagIdSet = new Set(newTagIds);

        // Remove tags that are no longer selected
        for (const issueTag of currentIssueTags) {
          if (!newTagIdSet.has(issueTag.tag_id)) {
            removeIssueTag(issueTag.id);
          }
        }

        // Add newly selected tags
        for (const tagId of newTagIds) {
          if (!currentTagIdSet.has(tagId)) {
            insertIssueTag({
              issue_id: selectedKanbanIssueId,
              tag_id: tagId,
            });
          }
        }
      }
    },
    [
      kanbanCreateMode,
      selectedKanbanIssueId,
      projectId,
      createFormFallback,
      createFormData,
      debouncedSaveTitle,
      debouncedSaveDescription,
      openStatusSelection,
      openPrioritySelection,
      openAssigneeSelection,
      updateCreateDefaults,
      issueTags,
      insertIssueTag,
      removeIssueTag,
      isDraftAutosavePaused,
    ]
  );

  // Submit handler
  const handleSubmit = useCallback(async () => {
    if (!displayData.title.trim()) return;

    setIsSubmitting(true);
    try {
      if (mode === 'create') {
        // Create new issue at the top of the column
        const statusIssues = issues.filter(
          (i) => i.status_id === displayData.statusId
        );
        const minSortOrder =
          statusIssues.length > 0
            ? Math.min(...statusIssues.map((i) => i.sort_order))
            : 0;

        const { persisted } = insertIssue({
          project_id: projectId,
          status_id: displayData.statusId,
          title: displayData.title,
          description: displayData.description,
          priority: displayData.priority,
          sort_order: minSortOrder - 1,
          start_date: null,
          target_date: null,
          completed_at: null,
          parent_issue_id: kanbanCreateDefaultParentIssueId,
          parent_issue_sort_order: null,
          extension_metadata: null,
        });

        // Wait for the issue to be confirmed by the backend and get the synced entity
        const syncedIssue = await persisted;

        // Commit only attachments still referenced in the description
        const allUploadedIds = getAttachmentIds();
        if (allUploadedIds.length > 0) {
          const referencedIds = extractAttachmentIds(
            displayData.description ?? ''
          );
          const idsToCommit = allUploadedIds.filter((id) =>
            referencedIds.has(id)
          );
          const idsToDelete = allUploadedIds.filter(
            (id) => !referencedIds.has(id)
          );

          if (idsToCommit.length > 0) {
            await commitIssueAttachments(syncedIssue.id, {
              attachment_ids: idsToCommit,
            });
          }
          for (const id of idsToDelete) {
            deleteAttachment(id).catch((err) =>
              console.error('Failed to delete abandoned attachment:', err)
            );
          }
          clearAttachments();
        }

        // Create assignee records for all selected assignees
        displayData.assigneeIds.forEach((userId) => {
          insertIssueAssignee({
            issue_id: syncedIssue.id,
            user_id: userId,
          });
        });

        // Create tag records if tags were selected
        for (const tagId of displayData.tagIds) {
          insertIssueTag({
            issue_id: syncedIssue.id,
            tag_id: tagId,
          });
        }

        // Navigate to workspace creation if requested
        if (displayData.createDraftWorkspace) {
          const initialPrompt = buildWorkspaceCreatePrompt(
            displayData.title,
            displayData.description
          );

          // Get defaults from most recent workspace
          const defaults = await getWorkspaceDefaults(
            workspaces,
            localWorkspaceIds
          );

          // Clean up draft scratch after successful creation
          cancelDebouncedDraftIssue();
          deleteDraftIssueScratch().catch(console.error);

          const createState = buildWorkspaceCreateInitialState({
            prompt: initialPrompt,
            defaults,
            linkedIssue: buildLinkedIssueCreateState(syncedIssue, projectId),
          });
          const draftId = await openWorkspaceCreateFromState(createState, {
            issueId: syncedIssue.id,
          });
          if (!draftId) {
            onExpectIssueOpen?.(syncedIssue.id);
            openIssue(syncedIssue.id);
          }
          return; // Don't open issue panel since we're navigating away
        }

        // Clean up draft scratch after successful creation
        cancelDebouncedDraftIssue();
        deleteDraftIssueScratch().catch(console.error);

        // Open the newly created issue
        onExpectIssueOpen?.(syncedIssue.id);
        openIssue(syncedIssue.id);
      } else {
        // Update existing issue - would use update mutation
        // For now, just close the panel
        closeKanbanIssuePanel();
      }
    } catch (error) {
      console.error('Failed to save issue:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [
    mode,
    displayData,
    projectId,
    issues,
    insertIssue,
    insertIssueAssignee,
    insertIssueTag,
    openIssue,
    kanbanCreateDefaultParentIssueId,
    openWorkspaceCreateFromState,
    workspaces,
    localWorkspaceIds,
    closeKanbanIssuePanel,
    cancelDebouncedDraftIssue,
    deleteDraftIssueScratch,
    getAttachmentIds,
    clearAttachments,
    onExpectIssueOpen,
  ]);

  const handleCmdEnterSubmit = useCallback(() => {
    if (mode !== 'create') return;
    void handleSubmit();
  }, [mode, handleSubmit]);

  const handleDeleteDraft = useCallback(() => {
    cancelDebouncedDraftIssue();
    dispatchFormState({
      type: 'setDraftAutosavePaused',
      isPaused: true,
    });
    dispatchFormState({
      type: 'setCreateFormData',
      createFormData: createModeDefaults,
    });
    deleteDraftIssueScratch().catch((error) => {
      console.error('Failed to delete draft issue:', error);
    });
  }, [cancelDebouncedDraftIssue, deleteDraftIssueScratch, createModeDefaults]);

  // Tag create callback - returns the new tag ID so it can be auto-selected
  const handleCreateTag = useCallback(
    (data: { name: string; color: string }): string => {
      const { data: newTag } = insertTag({
        project_id: projectId,
        name: data.name,
        color: data.color,
      });
      return newTag.id;
    },
    [insertTag, projectId]
  );

  // Copy link callback - copies issue URL to clipboard
  const handleCopyLink = useCallback(() => {
    if (!selectedKanbanIssueId || !projectId) return;
    const url = `${window.location.origin}/projects/${projectId}/issues/${selectedKanbanIssueId}`;
    navigator.clipboard.writeText(url);
  }, [projectId, selectedKanbanIssueId]);

  // More actions callback - opens command bar with issue actions
  const handleMoreActions = useCallback(async () => {
    if (!selectedKanbanIssueId || !projectId) return;
    await CommandBarDialog.show({
      page: 'issueActions',
      projectId,
      issueIds: [selectedKanbanIssueId],
    });
  }, [selectedKanbanIssueId, projectId]);

  // Loading state
  const isLoading = projectLoading || orgLoading;
  const isResolvingExpectedIssue =
    mode === 'edit' &&
    selectedKanbanIssueId !== null &&
    issueResolution === 'resolving';
  const hasMissingIssueDataInEditMode =
    mode === 'edit' && selectedKanbanIssueId !== null && selectedIssue === null;

  if (isLoading || isResolvingExpectedIssue || hasMissingIssueDataInEditMode) {
    return (
      <div className="flex items-center justify-center h-full bg-secondary">
        <p className="text-low">{t('states.loading')}</p>
      </div>
    );
  }

  return (
    <KanbanIssuePanel
      mode={mode}
      displayId={displayId}
      formData={displayData}
      assigneeUsers={displayAssigneeUsers}
      onFormChange={handlePropertyChange}
      statuses={sortedStatuses}
      tags={tags}
      issueId={selectedKanbanIssueId}
      creatorUser={issueCreator}
      parentIssue={parentIssue}
      onParentIssueClick={handleParentIssueClick}
      onRemoveParentIssue={handleRemoveParentIssue}
      linkedPrs={linkedPrs}
      onClose={closeKanbanIssuePanel}
      onSubmit={handleSubmit}
      onCmdEnterSubmit={handleCmdEnterSubmit}
      onCreateTag={handleCreateTag}
      renderAddTagControl={({
        tags,
        selectedTagIds,
        onTagToggle,
        onCreateTag,
        disabled,
        trigger,
      }) => (
        <SearchableTagDropdownContainer
          tags={tags}
          selectedTagIds={selectedTagIds}
          onTagToggle={onTagToggle}
          onCreateTag={onCreateTag}
          disabled={disabled}
          contentClassName=""
          trigger={trigger}
        />
      )}
      renderDescriptionEditor={(props) => <WYSIWYGEditor {...props} />}
      isSubmitting={isSubmitting}
      descriptionSaveStatus={
        mode === 'edit' ? descriptionSaveStatus : undefined
      }
      titleInputRef={titleInputRef}
      onDeleteDraft={
        mode === 'create' && isCreateDraftDirty ? handleDeleteDraft : undefined
      }
      onCopyLink={mode === 'edit' ? handleCopyLink : undefined}
      onMoreActions={mode === 'edit' ? handleMoreActions : undefined}
      onPasteFiles={onPasteFiles}
      dropzoneProps={{ getRootProps, getInputProps, isDragActive }}
      onBrowseAttachment={openFilePicker}
      isUploading={isUploading}
      attachmentError={uploadError}
      onDismissAttachmentError={clearUploadError}
      renderWorkspacesSection={(issueId) => (
        <IssueWorkspacesSectionContainer issueId={issueId} />
      )}
      renderRelationshipsSection={(issueId) => (
        <IssueRelationshipsSectionContainer issueId={issueId} />
      )}
      renderSubIssuesSection={(issueId) => (
        <IssueSubIssuesSectionContainer issueId={issueId} />
      )}
      renderCommentsSection={(issueId) => (
        <IssueCommentsSectionContainer issueId={issueId} />
      )}
    />
  );
}
