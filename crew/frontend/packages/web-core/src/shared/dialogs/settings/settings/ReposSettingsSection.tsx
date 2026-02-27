import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { isEqual } from 'lodash';
import { GitBranchIcon, SpinnerIcon } from '@phosphor-icons/react';
import { useRepoBranches } from '@/shared/hooks/useRepoBranches';
import { useScriptPlaceholders } from '@/shared/hooks/useScriptPlaceholders';
import { repoApi } from '@/shared/lib/api';
import type { Repo, UpdateRepo } from 'shared/types';
import { SearchableDropdownContainer } from '@/shared/components/ui-new/containers/SearchableDropdownContainer';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuTriggerButton,
} from '@vibe/ui/components/Dropdown';
import {
  SettingsCard,
  SettingsField,
  SettingsInput,
  SettingsTextarea,
  SettingsCheckbox,
  SettingsSaveBar,
} from './SettingsComponents';

interface RepoScriptsFormState {
  display_name: string;
  default_working_dir: string;
  default_target_branch: string;
  setup_script: string;
  parallel_setup_script: boolean;
  cleanup_script: string;
  archive_script: string;
  copy_files: string;
  dev_server_script: string;
}

function repoToFormState(repo: Repo): RepoScriptsFormState {
  return {
    display_name: repo.display_name,
    default_working_dir: repo.default_working_dir ?? '',
    default_target_branch: repo.default_target_branch ?? '',
    setup_script: repo.setup_script ?? '',
    parallel_setup_script: repo.parallel_setup_script,
    cleanup_script: repo.cleanup_script ?? '',
    archive_script: repo.archive_script ?? '',
    copy_files: repo.copy_files ?? '',
    dev_server_script: repo.dev_server_script ?? '',
  };
}

interface ReposSettingsSectionProps {
  initialState?: { repoId?: string };
}

export function ReposSettingsSection({
  initialState,
}: ReposSettingsSectionProps) {
  const { t } = useTranslation('settings');
  const queryClient = useQueryClient();

  // Fetch all repos
  const {
    data: repos,
    isLoading: reposLoading,
    error: reposError,
  } = useQuery({
    queryKey: ['repos'],
    queryFn: () => repoApi.list(),
  });

  // Selected repo state - initialize from props if provided
  const [selectedRepoId, setSelectedRepoId] = useState<string>(
    initialState?.repoId ?? ''
  );

  // Fetch branches for the selected repo
  const { data: branches = [], isLoading: branchesLoading } = useRepoBranches(
    selectedRepoId || null,
    { enabled: !!selectedRepoId }
  );

  // Add "Use current branch" option at the top of branches list
  const branchItems = useMemo(() => {
    const clearOption = {
      name: '',
      is_current: false,
      is_remote: false,
      last_commit_date: new Date(),
    };
    return [clearOption, ...branches];
  }, [branches]);

  const [selectedRepo, setSelectedRepo] = useState<Repo | null>(null);

  // Form state
  const [draft, setDraft] = useState<RepoScriptsFormState | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Get OS-appropriate script placeholders
  const placeholders = useScriptPlaceholders();

  // Check for unsaved changes
  const hasUnsavedChanges = useMemo(() => {
    if (!draft || !selectedRepo) return false;
    return !isEqual(draft, repoToFormState(selectedRepo));
  }, [draft, selectedRepo]);

  // Handle repo selection
  const handleRepoSelect = useCallback(
    (id: string) => {
      if (id === selectedRepoId) return;

      if (hasUnsavedChanges) {
        const confirmed = window.confirm(
          t('settings.repos.save.confirmSwitch')
        );
        if (!confirmed) return;
        setDraft(null);
        setSelectedRepo(null);
        setSuccess(false);
        setError(null);
      }

      setSelectedRepoId(id);
    },
    [hasUnsavedChanges, selectedRepoId, t]
  );

  // Populate draft from server data
  useEffect(() => {
    if (!repos) return;

    const nextRepo = selectedRepoId
      ? repos.find((r) => r.id === selectedRepoId)
      : null;

    setSelectedRepo((prev) =>
      prev?.id === nextRepo?.id ? prev : (nextRepo ?? null)
    );

    if (!nextRepo) {
      if (!hasUnsavedChanges) setDraft(null);
      return;
    }

    if (hasUnsavedChanges) return;

    setDraft(repoToFormState(nextRepo));
  }, [repos, selectedRepoId, hasUnsavedChanges]);

  const handleSave = async () => {
    if (!draft || !selectedRepo) return;

    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const updateData: UpdateRepo = {
        display_name: draft.display_name.trim() || null,
        default_working_dir: draft.default_working_dir.trim() || null,
        default_target_branch: draft.default_target_branch.trim() || null,
        setup_script: draft.setup_script.trim() || null,
        cleanup_script: draft.cleanup_script.trim() || null,
        archive_script: draft.archive_script.trim() || null,
        copy_files: draft.copy_files.trim() || null,
        parallel_setup_script: draft.parallel_setup_script,
        dev_server_script: draft.dev_server_script.trim() || null,
      };

      const updatedRepo = await repoApi.update(selectedRepo.id, updateData);
      setSelectedRepo(updatedRepo);
      setDraft(repoToFormState(updatedRepo));
      queryClient.setQueryData(['repos'], (old: Repo[] | undefined) =>
        old?.map((r) => (r.id === updatedRepo.id ? updatedRepo : r))
      );
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : t('settings.repos.save.error')
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDiscard = () => {
    if (!selectedRepo) return;
    setDraft(repoToFormState(selectedRepo));
  };

  const updateDraft = (updates: Partial<RepoScriptsFormState>) => {
    setDraft((prev) => {
      if (!prev) return prev;
      return { ...prev, ...updates };
    });
  };

  if (reposLoading) {
    return (
      <div className="flex items-center justify-center py-8 gap-2">
        <SpinnerIcon
          className="size-icon-lg animate-spin text-brand"
          weight="bold"
        />
        <span className="text-normal">{t('settings.repos.loading')}</span>
      </div>
    );
  }

  if (reposError) {
    return (
      <div className="py-8">
        <div className="bg-error/10 border border-error/50 rounded-sm p-4 text-error">
          {reposError instanceof Error
            ? reposError.message
            : t('settings.repos.loadError')}
        </div>
      </div>
    );
  }

  const repoOptions =
    repos?.map((r) => ({ value: r.id, label: r.display_name })) ?? [];

  return (
    <>
      {/* Status messages */}
      {error && (
        <div className="bg-error/10 border border-error/50 rounded-sm p-4 text-error">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-success/10 border border-success/50 rounded-sm p-4 text-success font-medium">
          {t('settings.repos.save.success')}
        </div>
      )}

      {/* Repo selector */}
      <SettingsCard
        title={t('settings.repos.title')}
        description={t('settings.repos.description')}
      >
        <SettingsField
          label={t('settings.repos.selector.label')}
          description={t('settings.repos.selector.helper')}
        >
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <DropdownMenuTriggerButton
                label={
                  repoOptions.find((r) => r.value === selectedRepoId)?.label ||
                  t('settings.repos.selector.placeholder')
                }
                className="w-full justify-between"
              />
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-[var(--radix-dropdown-menu-trigger-width)]">
              {repoOptions.length > 0 ? (
                repoOptions.map((option) => (
                  <DropdownMenuItem
                    key={option.value}
                    onClick={() => handleRepoSelect(option.value)}
                  >
                    {option.label}
                  </DropdownMenuItem>
                ))
              ) : (
                <DropdownMenuItem disabled>
                  {t('settings.repos.selector.noRepos')}
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </SettingsField>
      </SettingsCard>

      {selectedRepo && draft && (
        <>
          {/* General settings */}
          <SettingsCard
            title={t('settings.repos.general.title')}
            description={t('settings.repos.general.description')}
          >
            <SettingsField
              label={t('settings.repos.general.displayName.label')}
              description={t('settings.repos.general.displayName.helper')}
            >
              <SettingsInput
                value={draft.display_name}
                onChange={(value) => updateDraft({ display_name: value })}
                placeholder={t(
                  'settings.repos.general.displayName.placeholder'
                )}
              />
            </SettingsField>

            <SettingsField
              label={t('settings.repos.general.path.label')}
              description=""
            >
              <div className="text-sm text-low font-mono bg-secondary px-base py-half rounded-sm">
                {selectedRepo.path}
              </div>
            </SettingsField>

            <SettingsField
              label={t('settings.repos.general.defaultWorkingDir.label')}
              description={t('settings.repos.general.defaultWorkingDir.helper')}
            >
              <SettingsInput
                value={draft.default_working_dir}
                onChange={(value) =>
                  updateDraft({ default_working_dir: value })
                }
                placeholder={t(
                  'settings.repos.general.defaultWorkingDir.placeholder'
                )}
              />
            </SettingsField>

            <SettingsField
              label={t('settings.repos.general.defaultTargetBranch.label')}
              description={t(
                'settings.repos.general.defaultTargetBranch.helper'
              )}
            >
              <SearchableDropdownContainer
                items={branchItems}
                selectedValue={draft.default_target_branch || null}
                getItemKey={(b) => b.name || '__clear__'}
                getItemLabel={(b) =>
                  b.name ||
                  t('settings.repos.general.defaultTargetBranch.useCurrent')
                }
                filterItem={(b, query) =>
                  b.name === '' ||
                  b.name.toLowerCase().includes(query.toLowerCase())
                }
                getItemBadge={(b) => (b.is_current ? 'Current' : undefined)}
                getItemIcon={null}
                onSelect={(b) => updateDraft({ default_target_branch: b.name })}
                placeholder={t(
                  'settings.repos.general.defaultTargetBranch.search'
                )}
                emptyMessage={t(
                  'settings.repos.general.defaultTargetBranch.noBranches'
                )}
                contentClassName="w-[var(--radix-dropdown-menu-trigger-width)]"
                trigger={
                  <DropdownMenuTriggerButton
                    icon={GitBranchIcon}
                    label={
                      branchesLoading
                        ? t(
                            'settings.repos.general.defaultTargetBranch.loading'
                          )
                        : draft.default_target_branch ||
                          t(
                            'settings.repos.general.defaultTargetBranch.placeholder'
                          )
                    }
                    className="w-full justify-between"
                    disabled={branchesLoading}
                  />
                }
              />
            </SettingsField>
          </SettingsCard>

          {/* Scripts settings */}
          <SettingsCard
            title={t('settings.repos.scripts.title')}
            description={t('settings.repos.scripts.description')}
          >
            <SettingsField
              label={t('settings.repos.scripts.devServer.label')}
              description={t('settings.repos.scripts.devServer.helper')}
            >
              <SettingsTextarea
                value={draft.dev_server_script}
                onChange={(value) => updateDraft({ dev_server_script: value })}
                placeholder={placeholders.dev}
                monospace
              />
            </SettingsField>

            <SettingsField
              label={t('settings.repos.scripts.setup.label')}
              description={t('settings.repos.scripts.setup.helper')}
            >
              <SettingsTextarea
                value={draft.setup_script}
                onChange={(value) => updateDraft({ setup_script: value })}
                placeholder={placeholders.setup}
                monospace
              />
            </SettingsField>

            <SettingsCheckbox
              id="parallel-setup-script"
              label={t('settings.repos.scripts.setup.parallelLabel')}
              description={t('settings.repos.scripts.setup.parallelHelper')}
              checked={draft.parallel_setup_script}
              onChange={(checked) =>
                updateDraft({ parallel_setup_script: checked })
              }
              disabled={!draft.setup_script.trim()}
            />

            <SettingsField
              label={t('settings.repos.scripts.cleanup.label')}
              description={t('settings.repos.scripts.cleanup.helper')}
            >
              <SettingsTextarea
                value={draft.cleanup_script}
                onChange={(value) => updateDraft({ cleanup_script: value })}
                placeholder={placeholders.cleanup}
                monospace
              />
            </SettingsField>

            <SettingsField
              label={t('settings.repos.scripts.archive.label')}
              description={t('settings.repos.scripts.archive.helper')}
            >
              <SettingsTextarea
                value={draft.archive_script}
                onChange={(value) => updateDraft({ archive_script: value })}
                placeholder={placeholders.archive}
                monospace
              />
            </SettingsField>

            <SettingsField
              label={t('settings.repos.scripts.copyFiles.label')}
              description={t('settings.repos.scripts.copyFiles.helper')}
            >
              <SettingsTextarea
                value={draft.copy_files}
                onChange={(value) => updateDraft({ copy_files: value })}
                placeholder={t('settings.repos.scripts.copyFiles.placeholder')}
                rows={3}
              />
            </SettingsField>
          </SettingsCard>

          <SettingsSaveBar
            show={hasUnsavedChanges}
            saving={saving}
            onSave={handleSave}
            onDiscard={handleDiscard}
          />
        </>
      )}
    </>
  );
}

// Alias for backwards compatibility
export { ReposSettingsSection as ReposSettingsSectionContent };
