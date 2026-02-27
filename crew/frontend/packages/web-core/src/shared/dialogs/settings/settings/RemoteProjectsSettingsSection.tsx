import { useEffect, useState, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
  type DraggableProvided,
  type DraggableStateSnapshot,
  type DroppableProvided,
  type DraggableRubric,
} from '@hello-pangea/dnd';
import {
  SpinnerIcon,
  PlusIcon,
  TrashIcon,
  DotsThreeIcon,
  SignInIcon,
  XIcon,
  DotsSixVerticalIcon,
  PencilSimpleLineIcon,
} from '@phosphor-icons/react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@vibe/ui/components/Dropdown';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@vibe/ui/components/Popover';
import { PrimaryButton } from '@vibe/ui/components/PrimaryButton';
import { Switch } from '@vibe/ui/components/Switch';
import { useUserOrganizations } from '@/shared/hooks/useUserOrganizations';
import { useAuth } from '@/shared/hooks/auth/useAuth';
import { OAuthDialog } from '@/shared/dialogs/global/OAuthDialog';
import { CreateRemoteProjectDialog } from '@/shared/dialogs/org/CreateRemoteProjectDialog';
import { DeleteRemoteProjectDialog } from '@/shared/dialogs/org/DeleteRemoteProjectDialog';
import { useShape } from '@/shared/integrations/electric/hooks';
import { bulkUpdateProjectStatuses } from '@/shared/lib/remoteApi';

import {
  PROJECTS_SHAPE,
  PROJECT_MUTATION,
  PROJECT_PROJECT_STATUSES_SHAPE,
  PROJECT_STATUS_MUTATION,
  PROJECT_ISSUES_SHAPE,
  type Project,
} from 'shared/remote-types';
import { getRandomPresetColor, PRESET_COLORS } from '@/shared/lib/colors';
import { InlineColorPicker } from '@vibe/ui/components/ColorPicker';
import { cn } from '@/shared/lib/utils';
import {
  SettingsCard,
  SettingsField,
  SettingsInput,
  SettingsSaveBar,
  TwoColumnPicker,
  TwoColumnPickerColumn,
  TwoColumnPickerItem,
  TwoColumnPickerBadge,
  TwoColumnPickerEmpty,
} from './SettingsComponents';
import { useSettingsDirty } from './SettingsDirtyContext';

interface FormState {
  name: string;
  color: string;
}

interface RemoteProjectsSettingsSectionProps {
  initialState?: { organizationId?: string; projectId?: string };
}

interface StatusItem {
  id: string;
  name: string;
  color: string;
  hidden: boolean;
  sort_order: number;
  isNew: boolean;
}

interface StatusRowCloneProps {
  status: StatusItem;
  provided: DraggableProvided;
}

function StatusRowClone({ status, provided }: StatusRowCloneProps) {
  return createPortal(
    <div
      ref={provided.innerRef}
      {...provided.draggableProps}
      {...provided.dragHandleProps}
      className={cn(
        'flex items-center gap-base px-base py-half rounded-sm shadow-lg',
        status.isNew ? 'bg-panel' : 'bg-secondary',
        status.hidden && 'opacity-50'
      )}
      style={{
        ...provided.draggableProps.style,
        zIndex: 10001,
      }}
    >
      <div className="flex items-center justify-center size-icon-sm cursor-grabbing">
        <DotsSixVerticalIcon className="size-icon-xs text-low" weight="bold" />
      </div>
      <div
        className="size-dot rounded-full shrink-0"
        style={{ backgroundColor: `hsl(${status.color})` }}
      />
      <span className="text-sm text-high">{status.name}</span>
    </div>,
    document.body
  );
}

interface StatusRowProps {
  status: StatusItem;
  index: number;
  issueCount: number;
  visibleCount: number;
  editingId: string | null;
  editingColorId: string | null;
  onToggleHidden: (id: string, hidden: boolean) => void;
  onNameChange: (id: string, name: string) => void;
  onColorChange: (id: string, color: string) => void;
  onDelete: (id: string) => void;
  onStartEditing: (id: string) => void;
  onStartEditingColor: (id: string | null) => void;
  onStopEditing: () => void;
}

function StatusRow({
  status,
  index,
  issueCount,
  visibleCount,
  editingId,
  editingColorId,
  onToggleHidden,
  onNameChange,
  onColorChange,
  onDelete,
  onStartEditing,
  onStartEditingColor,
  onStopEditing,
}: StatusRowProps) {
  const { t } = useTranslation('common');
  const [localName, setLocalName] = useState(status.name);
  const isEditing = editingId === status.id;
  const isEditingColor = editingColorId === status.id;
  const isLastVisible = !status.hidden && visibleCount === 1;
  const canDelete = issueCount === 0;

  useEffect(() => {
    setLocalName(status.name);
  }, [status.name]);

  const handleNameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (localName.trim()) {
        onNameChange(status.id, localName.trim());
      } else {
        setLocalName(status.name);
      }
      onStopEditing();
    } else if (e.key === 'Escape') {
      setLocalName(status.name);
      onStopEditing();
    }
  };

  const handleNameBlur = () => {
    if (localName.trim() && localName !== status.name) {
      onNameChange(status.id, localName.trim());
    } else {
      setLocalName(status.name);
    }
    onStopEditing();
  };

  return (
    <Draggable draggableId={status.id} index={index}>
      {(provided: DraggableProvided, snapshot: DraggableStateSnapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          className={cn(
            'flex items-center justify-between px-base py-half rounded-sm',
            status.isNew ? 'bg-panel' : 'bg-secondary',
            status.hidden && 'opacity-50',
            snapshot.isDragging && 'shadow-lg opacity-80'
          )}
          style={{
            ...provided.draggableProps.style,
            zIndex: snapshot.isDragging ? 10 : undefined,
          }}
        >
          <div className="flex items-center gap-base">
            <div
              {...provided.dragHandleProps}
              className="flex items-center justify-center size-icon-sm cursor-grab"
            >
              <DotsSixVerticalIcon
                className="size-icon-xs text-low"
                weight="bold"
              />
            </div>

            <Popover
              open={isEditingColor}
              onOpenChange={(open) =>
                onStartEditingColor(open ? status.id : null)
              }
            >
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="flex items-center justify-center size-icon-sm"
                  title={t('kanban.changeColor', 'Change color')}
                >
                  <div
                    className="size-dot rounded-full shrink-0"
                    style={{ backgroundColor: `hsl(${status.color})` }}
                  />
                </button>
              </PopoverTrigger>
              <PopoverContent
                align="start"
                className="w-auto p-base"
                onInteractOutside={(e) => {
                  e.preventDefault();
                  onStartEditingColor(null);
                }}
              >
                <InlineColorPicker
                  value={status.color}
                  onChange={(color) => onColorChange(status.id, color)}
                  colors={PRESET_COLORS}
                />
              </PopoverContent>
            </Popover>

            {isEditing ? (
              <input
                type="text"
                value={localName}
                onChange={(e) => setLocalName(e.target.value)}
                onKeyDown={handleNameKeyDown}
                onBlur={handleNameBlur}
                autoFocus
                className="bg-transparent text-sm text-high outline-none border-b border-brand w-24"
              />
            ) : (
              <span
                className="text-sm text-high cursor-pointer"
                onClick={() => onStartEditing(status.id)}
              >
                {status.name}
              </span>
            )}
          </div>

          <div className="flex items-center gap-base">
            <button
              type="button"
              onClick={() => onStartEditing(status.id)}
              className="flex items-center justify-center size-icon-sm text-low hover:text-normal"
              title={t('kanban.editName', 'Edit name')}
            >
              <PencilSimpleLineIcon className="size-icon-xs" weight="bold" />
            </button>
            <button
              type="button"
              onClick={() => canDelete && onDelete(status.id)}
              className={cn(
                'flex items-center justify-center size-icon-sm',
                canDelete
                  ? 'text-low hover:text-normal'
                  : 'text-low opacity-50 cursor-not-allowed'
              )}
              title={
                canDelete
                  ? t('kanban.deleteStatus', 'Delete status')
                  : t('kanban.cannotDeleteWithIssues', 'Move issues first')
              }
              disabled={!canDelete}
            >
              <XIcon className="size-icon-xs" weight="bold" />
            </button>
            <Switch
              checked={!status.hidden}
              onCheckedChange={(checked) => onToggleHidden(status.id, !checked)}
              disabled={isLastVisible && !status.hidden}
              title={
                isLastVisible
                  ? t(
                      'kanban.lastVisibleStatus',
                      'At least one status must be visible'
                    )
                  : status.hidden
                    ? t('kanban.showStatus', 'Show status')
                    : t('kanban.hideStatus', 'Hide status')
              }
            />
          </div>
        </div>
      )}
    </Draggable>
  );
}

export function RemoteProjectsSettingsSection({
  initialState,
}: RemoteProjectsSettingsSectionProps) {
  const { t } = useTranslation(['settings', 'common', 'projects']);
  const { setDirty: setContextDirty } = useSettingsDirty();
  const { isSignedIn, isLoaded } = useAuth();

  // Selection state - initialize with provided values
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(
    initialState?.organizationId ?? null
  );
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    initialState?.projectId ?? null
  );

  // Form state for editing
  const [formState, setFormState] = useState<FormState | null>(null);

  // UI state
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch organizations
  const {
    data: orgsResponse,
    isLoading: orgsLoading,
    error: orgsError,
  } = useUserOrganizations();

  const organizations = useMemo(
    () => orgsResponse?.organizations ?? [],
    [orgsResponse?.organizations]
  );

  // Auto-select first org when loaded (only if no initial org was provided)
  useEffect(() => {
    if (
      !initialState?.organizationId &&
      organizations.length > 0 &&
      !selectedOrgId
    ) {
      setSelectedOrgId(organizations[0].id);
    }
  }, [organizations, selectedOrgId, initialState?.organizationId]);

  // Fetch projects for selected org
  const params = useMemo(
    () => ({ organization_id: selectedOrgId || '' }),
    [selectedOrgId]
  );

  const {
    data: projects,
    isLoading: projectsLoading,
    update,
    remove,
  } = useShape(PROJECTS_SHAPE, params, {
    enabled: !!selectedOrgId,
    mutation: PROJECT_MUTATION,
  });

  // Initialize form state when project is pre-selected and projects are loaded
  useEffect(() => {
    if (initialState?.projectId && projects.length > 0 && !formState) {
      const project = projects.find((p) => p.id === initialState.projectId);
      if (project) {
        setFormState({ name: project.name, color: project.color });
      }
    }
  }, [initialState?.projectId, projects, formState]);

  // Find selected project
  const selectedProject = useMemo(
    () => projects.find((p) => p.id === selectedProjectId) ?? null,
    [projects, selectedProjectId]
  );

  // Fetch statuses and issues for selected project (for status settings)
  const projectParams = useMemo(
    () => ({ project_id: selectedProjectId ?? '' }),
    [selectedProjectId]
  );

  const {
    data: projectStatuses,
    insert: insertProjectStatus,
    update: updateProjectStatus,
    remove: removeProjectStatus,
  } = useShape(PROJECT_PROJECT_STATUSES_SHAPE, projectParams, {
    enabled: !!selectedProjectId,
    mutation: PROJECT_STATUS_MUTATION,
  });

  const { data: projectIssues } = useShape(
    PROJECT_ISSUES_SHAPE,
    projectParams,
    {
      enabled: !!selectedProjectId,
    }
  );

  const issueCountByStatus = useMemo(() => {
    const counts: Record<string, number> = {};

    for (const status of projectStatuses) {
      counts[status.id] = 0;
    }

    for (const issue of projectIssues) {
      counts[issue.status_id] = (counts[issue.status_id] ?? 0) + 1;
    }

    return counts;
  }, [projectStatuses, projectIssues]);

  const sortedProjectStatuses = useMemo(
    () => [...projectStatuses].sort((a, b) => a.sort_order - b.sort_order),
    [projectStatuses]
  );

  const [localStatuses, setLocalStatuses] = useState<StatusItem[]>([]);
  const [editingStatusId, setEditingStatusId] = useState<string | null>(null);
  const [editingStatusColorId, setEditingStatusColorId] = useState<
    string | null
  >(null);
  const [hasStatusChanges, setHasStatusChanges] = useState(false);

  useEffect(() => {
    if (!selectedProjectId) {
      setLocalStatuses([]);
      setHasStatusChanges(false);
      return;
    }

    if (!hasStatusChanges) {
      setLocalStatuses(
        sortedProjectStatuses.map((status) => ({
          id: status.id,
          name: status.name,
          color: status.color,
          hidden: status.hidden,
          sort_order: status.sort_order,
          isNew: false,
        }))
      );
    }
  }, [selectedProjectId, sortedProjectStatuses, hasStatusChanges]);

  const visibleStatusCount = useMemo(
    () => localStatuses.filter((status) => !status.hidden).length,
    [localStatuses]
  );

  const isProjectDirty = useMemo(() => {
    if (!selectedProject || !formState) return false;
    return (
      formState.name !== selectedProject.name ||
      formState.color !== selectedProject.color
    );
  }, [selectedProject, formState]);

  const isDirty = isProjectDirty || hasStatusChanges;

  // Sync dirty state to context for unsaved changes confirmation
  useEffect(() => {
    setContextDirty('remote-projects', isDirty);
    return () => setContextDirty('remote-projects', false);
  }, [isDirty, setContextDirty]);

  const handleStatusToggleHidden = useCallback(
    (id: string, hidden: boolean) => {
      setLocalStatuses((prev) =>
        prev.map((status) =>
          status.id === id ? { ...status, hidden } : status
        )
      );
      setHasStatusChanges(true);
    },
    []
  );

  const handleStatusNameChange = useCallback((id: string, name: string) => {
    setLocalStatuses((prev) =>
      prev.map((status) => (status.id === id ? { ...status, name } : status))
    );
    setHasStatusChanges(true);
  }, []);

  const handleStatusColorChange = useCallback((id: string, color: string) => {
    setLocalStatuses((prev) =>
      prev.map((status) => (status.id === id ? { ...status, color } : status))
    );
    setHasStatusChanges(true);
  }, []);

  const handleStatusDelete = useCallback((id: string) => {
    setLocalStatuses((prev) => prev.filter((status) => status.id !== id));
    setHasStatusChanges(true);
  }, []);

  const handleStatusAdd = useCallback(() => {
    const newId = crypto.randomUUID();
    const maxSortOrder = localStatuses.reduce(
      (max, status) => Math.max(max, status.sort_order),
      0
    );

    setLocalStatuses((prev) => [
      ...prev,
      {
        id: newId,
        name: t('kanban.newStatus', 'New Status'),
        color: getRandomPresetColor(),
        hidden: false,
        sort_order: maxSortOrder + 1000,
        isNew: true,
      },
    ]);
    setEditingStatusId(newId);
    setHasStatusChanges(true);
  }, [localStatuses, t]);

  const handleStatusDragEnd = useCallback((result: DropResult) => {
    const { source, destination } = result;
    if (!destination || source.index === destination.index) return;

    setLocalStatuses((prev) => {
      const reordered = [...prev];
      const [moved] = reordered.splice(source.index, 1);
      reordered.splice(destination.index, 0, moved);
      return reordered.map((status, index) => ({
        ...status,
        sort_order: index,
      }));
    });
    setHasStatusChanges(true);
  }, []);

  const persistStatusChanges = useCallback(async () => {
    const originalById = new Map(
      projectStatuses.map((status) => [status.id, status])
    );
    const mutationPromises: Promise<unknown>[] = [];
    const localIds = new Set(localStatuses.map((status) => status.id));

    for (const original of projectStatuses) {
      if (!localIds.has(original.id)) {
        const result = removeProjectStatus(original.id);
        mutationPromises.push(result.persisted);
      }
    }

    const bulkUpdates: {
      id: string;
      changes: Partial<{
        name: string;
        color: string;
        sort_order: number;
        hidden: boolean;
      }>;
    }[] = [];

    for (const local of localStatuses) {
      const original = originalById.get(local.id);

      if (!original) {
        const result = insertProjectStatus({
          id: local.id,
          project_id: selectedProjectId ?? '',
          name: local.name,
          color: local.color,
          sort_order: local.sort_order,
          hidden: local.hidden,
        });
        mutationPromises.push(result.persisted);
        continue;
      }

      const changes: Partial<{
        name: string;
        color: string;
        sort_order: number;
        hidden: boolean;
      }> = {
        sort_order: local.sort_order,
      };

      if (local.name !== original.name) changes.name = local.name;
      if (local.color !== original.color) changes.color = local.color;
      if (local.hidden !== original.hidden) changes.hidden = local.hidden;

      bulkUpdates.push({ id: local.id, changes });
    }

    if (bulkUpdates.length > 1) {
      await bulkUpdateProjectStatuses(bulkUpdates);
    } else if (bulkUpdates.length === 1) {
      const result = updateProjectStatus(
        bulkUpdates[0].id,
        bulkUpdates[0].changes
      );
      mutationPromises.push(result.persisted);
    }

    await Promise.all(mutationPromises);
  }, [
    projectStatuses,
    localStatuses,
    selectedProjectId,
    removeProjectStatus,
    insertProjectStatus,
    updateProjectStatus,
  ]);

  // Handlers
  const handleOrgSelect = (orgId: string) => {
    if (isDirty) {
      const confirmed = window.confirm(
        t('settings.common.discardChangesConfirm', 'Discard unsaved changes?')
      );
      if (!confirmed) return;
    }
    setSelectedOrgId(orgId);
    setSelectedProjectId(null);
    setFormState(null);
    setLocalStatuses([]);
    setHasStatusChanges(false);
    setEditingStatusId(null);
    setEditingStatusColorId(null);
    setError(null);
    setSuccess(null);
  };

  const handleProjectSelect = (projectId: string) => {
    if (isDirty) {
      const confirmed = window.confirm(
        t('settings.common.discardChangesConfirm', 'Discard unsaved changes?')
      );
      if (!confirmed) return;
    }
    const project = projects.find((p) => p.id === projectId);
    setSelectedProjectId(projectId);
    setFormState(project ? { name: project.name, color: project.color } : null);
    setHasStatusChanges(false);
    setEditingStatusId(null);
    setEditingStatusColorId(null);
    setError(null);
    setSuccess(null);
  };

  const handleCreateProject = async () => {
    if (!selectedOrgId) return;

    try {
      const result = await CreateRemoteProjectDialog.show({
        organizationId: selectedOrgId,
      });

      if (result.action === 'created' && result.project) {
        setSelectedProjectId(result.project.id);
        setFormState({
          name: result.project.name,
          color: result.project.color,
        });
        setSuccess(
          t(
            'settings.remoteProjects.createSuccess',
            'Project created successfully'
          )
        );
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch {
      // Dialog cancelled
    }
  };

  const handleDeleteProject = async (project: Project) => {
    try {
      const result = await DeleteRemoteProjectDialog.show({
        projectName: project.name,
      });

      if (result === 'deleted') {
        remove(project.id);
        if (selectedProjectId === project.id) {
          setSelectedProjectId(null);
          setFormState(null);
        }
        setSuccess(
          t(
            'settings.remoteProjects.deleteSuccess',
            'Project deleted successfully'
          )
        );
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch {
      // Dialog cancelled
    }
  };

  const handleSave = async () => {
    if (!selectedProjectId || !formState) return;

    const trimmedName = formState.name.trim();
    if (!trimmedName) {
      setError(
        t('settings.remoteProjects.nameRequired', 'Project name is required')
      );
      return;
    }

    setError(null);
    setIsSaving(true);

    try {
      if (isProjectDirty) {
        const result = update(selectedProjectId, {
          name: trimmedName,
          color: formState.color,
        });
        await result.persisted;
      }

      if (hasStatusChanges) {
        await persistStatusChanges();
        setLocalStatuses((prev) =>
          prev.map((status) => ({ ...status, isNew: false }))
        );
        setHasStatusChanges(false);
      }

      setSuccess(
        t('settings.remoteProjects.saveSuccess', 'Project updated successfully')
      );
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : t('settings.remoteProjects.saveError', 'Failed to update project')
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDiscard = () => {
    if (selectedProject) {
      setFormState({
        name: selectedProject.name,
        color: selectedProject.color,
      });
    }
    setLocalStatuses(
      sortedProjectStatuses.map((status) => ({
        id: status.id,
        name: status.name,
        color: status.color,
        hidden: status.hidden,
        sort_order: status.sort_order,
        isNew: false,
      }))
    );
    setHasStatusChanges(false);
    setEditingStatusId(null);
    setEditingStatusColorId(null);
  };

  // Loading state
  if (!isLoaded || orgsLoading) {
    return (
      <div className="flex items-center justify-center py-8 gap-2">
        <SpinnerIcon
          className="size-icon-lg animate-spin text-brand"
          weight="bold"
        />
        <span className="text-normal">
          {t('settings.remoteProjects.loading', 'Loading remote projects...')}
        </span>
      </div>
    );
  }

  // Auth check - show sign-in prompt if not signed in
  if (!isSignedIn) {
    return (
      <div className="space-y-4">
        <div>
          <h3 className="text-base font-medium text-high">
            {t(
              'settings.remoteProjects.loginRequired.title',
              'Sign in required'
            )}
          </h3>
          <p className="text-sm text-low mt-1">
            {t(
              'settings.remoteProjects.loginRequired.description',
              'Sign in to manage your remote projects.'
            )}
          </p>
        </div>
        <PrimaryButton
          variant="secondary"
          value={t('settings.remoteProjects.loginRequired.action', 'Sign in')}
          onClick={() => void OAuthDialog.show({})}
        >
          <SignInIcon className="size-icon-xs mr-1" weight="bold" />
        </PrimaryButton>
      </div>
    );
  }

  // Error state
  if (orgsError) {
    return (
      <div className="py-8">
        <div className="bg-error/10 border border-error/50 rounded-sm p-4 text-error">
          {orgsError instanceof Error
            ? orgsError.message
            : t(
                'settings.remoteProjects.loadError',
                'Failed to load organizations'
              )}
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Status messages */}
      {error && (
        <div className="bg-error/10 border border-error/50 rounded-sm p-4 text-error mb-4">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-success/10 border border-success/50 rounded-sm p-4 text-success font-medium mb-4">
          {success}
        </div>
      )}

      <SettingsCard
        title={t('settings.remoteProjects.title', 'Remote Projects')}
        description={t(
          'settings.remoteProjects.description',
          'Manage cloud-synced projects across organizations.'
        )}
      >
        {/* Two-column picker */}
        <TwoColumnPicker>
          {/* Organizations column */}
          <TwoColumnPickerColumn
            label={t(
              'settings.remoteProjects.columns.organizations',
              'Organizations'
            )}
            isFirst
          >
            {organizations.map((org) => (
              <TwoColumnPickerItem
                key={org.id}
                selected={selectedOrgId === org.id}
                onClick={() => handleOrgSelect(org.id)}
                trailing={
                  org.is_personal && (
                    <TwoColumnPickerBadge>
                      {t('common:personal', 'Personal')}
                    </TwoColumnPickerBadge>
                  )
                }
              >
                {org.name}
              </TwoColumnPickerItem>
            ))}
          </TwoColumnPickerColumn>

          {/* Projects column */}
          <TwoColumnPickerColumn
            label={t('settings.remoteProjects.columns.projects', 'Projects')}
            headerAction={
              selectedOrgId && (
                <button
                  className="p-half rounded-sm hover:bg-secondary text-low hover:text-normal"
                  onClick={handleCreateProject}
                  disabled={isSaving}
                  title={t(
                    'settings.remoteProjects.actions.addProject',
                    'Add Project'
                  )}
                >
                  <PlusIcon className="size-icon-2xs" weight="bold" />
                </button>
              )
            }
          >
            {projectsLoading ? (
              <div className="flex items-center justify-center py-double gap-base">
                <SpinnerIcon className="size-icon-sm animate-spin" />
              </div>
            ) : selectedOrgId && projects.length > 0 ? (
              projects.map((project) => (
                <TwoColumnPickerItem
                  key={project.id}
                  selected={selectedProjectId === project.id}
                  onClick={() => handleProjectSelect(project.id)}
                  leading={
                    <span
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: `hsl(${project.color})` }}
                    />
                  }
                  trailing={
                    <ProjectActionsDropdown
                      project={project}
                      onDelete={handleDeleteProject}
                    />
                  }
                >
                  {project.name}
                </TwoColumnPickerItem>
              ))
            ) : selectedOrgId ? (
              <TwoColumnPickerEmpty>
                {t(
                  'settings.remoteProjects.noProjects',
                  'No projects yet. Create one to get started.'
                )}
              </TwoColumnPickerEmpty>
            ) : (
              <TwoColumnPickerEmpty>
                {t(
                  'settings.remoteProjects.selectOrg',
                  'Select an organization'
                )}
              </TwoColumnPickerEmpty>
            )}
          </TwoColumnPickerColumn>
        </TwoColumnPicker>

        {/* Edit form (when project selected) */}
        {selectedProjectId && formState && (
          <div className="bg-secondary/50 border border-border rounded-sm p-4 space-y-4">
            <SettingsField
              label={t(
                'settings.remoteProjects.form.name.label',
                'Project Name'
              )}
            >
              <SettingsInput
                value={formState.name}
                onChange={(name) =>
                  setFormState((s) => (s ? { ...s, name } : null))
                }
                placeholder={t(
                  'settings.remoteProjects.form.name.placeholder',
                  'Enter project name'
                )}
                disabled={isSaving}
              />
            </SettingsField>

            <SettingsField
              label={t(
                'settings.remoteProjects.form.color.label',
                'Project Color'
              )}
            >
              <InlineColorPicker
                value={formState.color}
                onChange={(color) =>
                  setFormState((s) => (s ? { ...s, color } : null))
                }
                colors={PRESET_COLORS}
                disabled={isSaving}
              />
            </SettingsField>
          </div>
        )}

        {/* Project status settings (kanban columns) */}
        {selectedProjectId && (
          <div
            className={cn(
              'bg-secondary/50 border border-border rounded-sm p-4 space-y-base',
              isSaving && 'opacity-60 pointer-events-none'
            )}
          >
            <div>
              <div>
                <p className="text-sm font-medium text-normal">
                  {t(
                    'settings.remoteProjects.form.statuses.label',
                    'Project Statuses'
                  )}
                </p>
                <p className="text-sm text-low mt-1">
                  {t(
                    'settings.remoteProjects.form.statuses.description',
                    'Manage kanban columns for this project.'
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between text-normal">
              <span className="text-sm font-semibold">
                {t('kanban.visibleColumns', 'Visible Columns')}
              </span>
              <span className="text-xs text-low">
                {t('kanban.dragToRearrange', 'Drag to re-arrange')}
              </span>
            </div>

            <DragDropContext onDragEnd={handleStatusDragEnd}>
              <Droppable
                droppableId="status-list"
                renderClone={(
                  provided: DraggableProvided,
                  _snapshot: DraggableStateSnapshot,
                  rubric: DraggableRubric
                ) => (
                  <StatusRowClone
                    provided={provided}
                    status={localStatuses[rubric.source.index]}
                  />
                )}
              >
                {(provided: DroppableProvided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="flex flex-col gap-[2px]"
                  >
                    {localStatuses.map((status, index) => (
                      <StatusRow
                        key={status.id}
                        status={status}
                        index={index}
                        issueCount={issueCountByStatus[status.id] ?? 0}
                        visibleCount={visibleStatusCount}
                        editingId={editingStatusId}
                        editingColorId={editingStatusColorId}
                        onToggleHidden={handleStatusToggleHidden}
                        onNameChange={handleStatusNameChange}
                        onColorChange={handleStatusColorChange}
                        onDelete={handleStatusDelete}
                        onStartEditing={setEditingStatusId}
                        onStartEditingColor={setEditingStatusColorId}
                        onStopEditing={() => setEditingStatusId(null)}
                      />
                    ))}
                    {provided.placeholder}

                    <button
                      type="button"
                      onClick={handleStatusAdd}
                      className="flex items-center gap-half px-base py-half text-high hover:bg-secondary rounded-sm transition-colors"
                    >
                      <div className="flex items-center justify-center size-icon-sm">
                        <PlusIcon className="size-icon-xs" weight="bold" />
                      </div>
                      <span className="text-xs font-light">
                        {t('kanban.addColumn', 'Add column')}
                      </span>
                    </button>
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          </div>
        )}
      </SettingsCard>

      <SettingsSaveBar
        show={isDirty}
        saving={isSaving}
        onSave={handleSave}
        onDiscard={handleDiscard}
      />
    </>
  );
}

// Helper component for project actions dropdown
function ProjectActionsDropdown({
  project,
  onDelete,
}: {
  project: Project;
  onDelete: (project: Project) => void;
}) {
  const { t } = useTranslation(['common']);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            'p-half rounded-sm hover:bg-panel text-low hover:text-normal',
            'opacity-0 group-hover:opacity-100 transition-opacity'
          )}
          onClick={(e) => e.stopPropagation()}
        >
          <DotsThreeIcon className="size-icon-xs" weight="bold" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={(e) => {
            e.stopPropagation();
            onDelete(project);
          }}
          className="text-error focus:text-error"
        >
          <div className="flex items-center gap-half w-full">
            <TrashIcon className="size-icon-xs mr-base" />
            {t('common:buttons.delete', 'Delete')}
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Alias for backwards compatibility
export { RemoteProjectsSettingsSection as RemoteProjectsSettingsSectionContent };
