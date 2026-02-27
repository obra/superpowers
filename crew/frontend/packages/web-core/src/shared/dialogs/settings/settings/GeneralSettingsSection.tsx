import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { cloneDeep, isEqual, merge } from 'lodash';
import {
  FolderSimpleIcon,
  SpeakerHighIcon,
  SpinnerIcon,
} from '@phosphor-icons/react';
import { FolderPickerDialog } from '@/shared/dialogs/shared/FolderPickerDialog';
import {
  type BaseCodingAgent,
  DEFAULT_COMMIT_REMINDER_PROMPT,
  DEFAULT_PR_DESCRIPTION_PROMPT,
  EditorType,
  type ExecutorProfileId,
  type SendMessageShortcut,
  SoundFile,
  ThemeMode,
  UiLanguage,
} from 'shared/types';
import { getModifierKey } from '@/shared/lib/platform';
import { getLanguageOptions } from '@/i18n/languages';
import { toPrettyCase } from '@/shared/lib/string';
import {
  getExecutorVariantKeys,
  getSortedExecutorVariantKeys,
} from '@/shared/lib/executor';
import { useTheme } from '@/shared/hooks/useTheme';
import { useUserSystem } from '@/shared/hooks/useUserSystem';
import { TagManager } from '@/shared/components/TagManager';
import { cn } from '@/shared/lib/utils';
import { PrimaryButton } from '@vibe/ui/components/PrimaryButton';
import { IconButton } from '@vibe/ui/components/IconButton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuTriggerButton,
} from '@vibe/ui/components/Dropdown';
import {
  SettingsCard,
  SettingsCheckbox,
  SettingsField,
  SettingsInput,
  SettingsSaveBar,
  SettingsSelect,
  SettingsTextarea,
} from './SettingsComponents';
import { useSettingsDirty } from './SettingsDirtyContext';

export function GeneralSettingsSection() {
  const { t } = useTranslation(['settings', 'common']);
  const { setDirty: setContextDirty } = useSettingsDirty();

  const languageOptions = getLanguageOptions(
    t('language.browserDefault', {
      ns: 'common',
      defaultValue: 'Browser Default',
    })
  );
  const { config, loading, updateAndSaveConfig, profiles } = useUserSystem();

  const [draft, setDraft] = useState(() => (config ? cloneDeep(config) : null));
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [branchPrefixError, setBranchPrefixError] = useState<string | null>(
    null
  );
  const { setTheme } = useTheme();

  // Executor options for the default coding agent dropdown
  const executorOptions = profiles
    ? Object.keys(profiles)
        .sort()
        .map((key) => ({ value: key, label: toPrettyCase(key) }))
    : [];

  const selectedAgentProfile =
    profiles?.[draft?.executor_profile?.executor || ''];
  const variantOptions = selectedAgentProfile
    ? getSortedExecutorVariantKeys(selectedAgentProfile)
    : [];
  const hasVariants = variantOptions.length > 0;

  const validateBranchPrefix = useCallback(
    (prefix: string): string | null => {
      if (!prefix) return null;
      if (prefix.includes('/'))
        return t('settings.general.git.branchPrefix.errors.slash');
      if (prefix.startsWith('.'))
        return t('settings.general.git.branchPrefix.errors.startsWithDot');
      if (prefix.endsWith('.') || prefix.endsWith('.lock'))
        return t('settings.general.git.branchPrefix.errors.endsWithDot');
      if (prefix.includes('..') || prefix.includes('@{'))
        return t('settings.general.git.branchPrefix.errors.invalidSequence');
      if (/[ \t~^:?*[\\]/.test(prefix))
        return t('settings.general.git.branchPrefix.errors.invalidChars');
      for (let i = 0; i < prefix.length; i++) {
        const code = prefix.charCodeAt(i);
        if (code < 0x20 || code === 0x7f)
          return t('settings.general.git.branchPrefix.errors.controlChars');
      }
      return null;
    },
    [t]
  );

  const handleBrowseWorkspaceDir = async () => {
    const result = await FolderPickerDialog.show({
      value: draft?.workspace_dir ?? '',
      title: t('settings.general.git.workspaceDir.dialogTitle'),
      description: t('settings.general.git.workspaceDir.dialogDescription'),
    });
    if (result) {
      updateDraft({ workspace_dir: result });
    }
  };

  useEffect(() => {
    if (!config) return;
    if (!dirty) {
      setDraft(cloneDeep(config));
    }
  }, [config, dirty]);

  const hasUnsavedChanges = useMemo(() => {
    if (!draft || !config) return false;
    return !isEqual(draft, config);
  }, [draft, config]);

  // Sync dirty state to context for unsaved changes confirmation
  useEffect(() => {
    setContextDirty('general', hasUnsavedChanges);
    return () => setContextDirty('general', false);
  }, [hasUnsavedChanges, setContextDirty]);

  const updateDraft = useCallback(
    (patch: Partial<typeof config>) => {
      setDraft((prev: typeof config) => {
        if (!prev) return prev;
        const next = merge({}, prev, patch);
        if (!isEqual(next, config)) {
          setDirty(true);
        }
        return next;
      });
    },
    [config]
  );

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [hasUnsavedChanges]);

  const playSound = async (soundFile: SoundFile) => {
    const audio = new Audio(`/api/sounds/${soundFile}`);
    try {
      await audio.play();
    } catch (err) {
      console.error('Failed to play sound:', err);
    }
  };

  const handleSave = async () => {
    if (!draft) return;

    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      await updateAndSaveConfig(draft);
      setTheme(draft.theme);
      setDirty(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(t('settings.general.save.error'));
      console.error('Error saving config:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDiscard = () => {
    if (!config) return;
    setDraft(cloneDeep(config));
    setDirty(false);
  };

  const resetOnboarding = async () => {
    if (!config) return;
    updateAndSaveConfig({
      onboarding_acknowledged: false,
      remote_onboarding_acknowledged: false,
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8 gap-2">
        <SpinnerIcon
          className="size-icon-lg animate-spin text-brand"
          weight="bold"
        />
        <span className="text-normal">{t('settings.general.loading')}</span>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="py-8">
        <div className="bg-error/10 border border-error/50 rounded-sm p-4 text-error">
          {t('settings.general.loadError')}
        </div>
      </div>
    );
  }

  const themeOptions = Object.values(ThemeMode).map((theme) => ({
    value: theme,
    label: toPrettyCase(theme),
  }));

  const editorOptions = Object.values(EditorType).map((editor) => ({
    value: editor,
    label: toPrettyCase(editor),
  }));

  const soundOptions = Object.values(SoundFile).map((sound) => ({
    value: sound,
    label: toPrettyCase(sound),
  }));

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
          {t('settings.general.save.success')}
        </div>
      )}

      {/* Appearance */}
      <SettingsCard
        title={t('settings.general.appearance.title')}
        description={t('settings.general.appearance.description')}
      >
        <SettingsField
          label={t('settings.general.appearance.theme.label')}
          description={t('settings.general.appearance.theme.helper')}
        >
          <SettingsSelect
            value={draft?.theme}
            options={themeOptions}
            onChange={(value) => updateDraft({ theme: value })}
            placeholder={t('settings.general.appearance.theme.placeholder')}
          />
        </SettingsField>

        <SettingsField
          label={t('settings.general.appearance.language.label')}
          description={t('settings.general.appearance.language.helper')}
        >
          <SettingsSelect
            value={draft?.language}
            options={languageOptions}
            onChange={(value: UiLanguage) => updateDraft({ language: value })}
            placeholder={t('settings.general.appearance.language.placeholder')}
          />
        </SettingsField>
      </SettingsCard>

      {/* Editor */}
      <SettingsCard
        title={t('settings.general.editor.title')}
        description={t('settings.general.editor.description')}
      >
        <SettingsField
          label={t('settings.general.editor.type.label')}
          description={t('settings.general.editor.type.helper')}
        >
          <SettingsSelect
            value={draft?.editor.editor_type}
            options={editorOptions}
            onChange={(value: EditorType) =>
              updateDraft({
                editor: { ...draft!.editor, editor_type: value },
              })
            }
            placeholder={t('settings.general.editor.type.placeholder')}
          />
        </SettingsField>

        {draft?.editor.editor_type === EditorType.CUSTOM && (
          <SettingsField
            label={t('settings.general.editor.customCommand.label')}
            description={t('settings.general.editor.customCommand.helper')}
          >
            <SettingsInput
              value={draft?.editor.custom_command || ''}
              onChange={(value) =>
                updateDraft({
                  editor: {
                    ...draft!.editor,
                    custom_command: value || null,
                  },
                })
              }
              placeholder={t(
                'settings.general.editor.customCommand.placeholder'
              )}
            />
          </SettingsField>
        )}

        {(draft?.editor.editor_type === EditorType.VS_CODE ||
          draft?.editor.editor_type === EditorType.CURSOR ||
          draft?.editor.editor_type === EditorType.WINDSURF ||
          draft?.editor.editor_type === EditorType.GOOGLE_ANTIGRAVITY ||
          draft?.editor.editor_type === EditorType.ZED) && (
          <>
            <SettingsField
              label={t('settings.general.editor.remoteSsh.host.label')}
              description={t('settings.general.editor.remoteSsh.host.helper')}
            >
              <SettingsInput
                value={draft?.editor.remote_ssh_host || ''}
                onChange={(value) =>
                  updateDraft({
                    editor: {
                      ...draft!.editor,
                      remote_ssh_host: value || null,
                    },
                  })
                }
                placeholder={t(
                  'settings.general.editor.remoteSsh.host.placeholder'
                )}
              />
            </SettingsField>

            {draft?.editor.remote_ssh_host && (
              <SettingsField
                label={t('settings.general.editor.remoteSsh.user.label')}
                description={t('settings.general.editor.remoteSsh.user.helper')}
              >
                <SettingsInput
                  value={draft?.editor.remote_ssh_user || ''}
                  onChange={(value) =>
                    updateDraft({
                      editor: {
                        ...draft!.editor,
                        remote_ssh_user: value || null,
                      },
                    })
                  }
                  placeholder={t(
                    'settings.general.editor.remoteSsh.user.placeholder'
                  )}
                />
              </SettingsField>
            )}
          </>
        )}

        {(draft?.editor.editor_type === EditorType.VS_CODE ||
          draft?.editor.editor_type === EditorType.VS_CODE_INSIDERS ||
          draft?.editor.editor_type === EditorType.CURSOR) && (
          <SettingsCheckbox
            id="auto-install-extension"
            label={t('settings.general.editor.autoInstallExtension.label')}
            description={t(
              'settings.general.editor.autoInstallExtension.helper'
            )}
            checked={draft?.editor.auto_install_extension ?? true}
            onChange={(checked) =>
              updateDraft({
                editor: {
                  ...draft!.editor,
                  auto_install_extension: checked,
                },
              })
            }
          />
        )}
      </SettingsCard>

      {/* Default Coding Agent */}
      <SettingsCard
        title={t('settings.general.taskExecution.title')}
        description={t('settings.general.taskExecution.description')}
      >
        <SettingsField
          label={t('settings.general.taskExecution.executor.label')}
          description={t('settings.general.taskExecution.executor.helper')}
        >
          <div className="grid grid-cols-2 gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <DropdownMenuTriggerButton
                  label={
                    draft?.executor_profile?.executor
                      ? toPrettyCase(draft.executor_profile.executor)
                      : t('settings.agents.selectAgent')
                  }
                  className="w-full justify-between"
                  disabled={!profiles}
                />
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-[var(--radix-dropdown-menu-trigger-width)]">
                {executorOptions.map((option) => (
                  <DropdownMenuItem
                    key={option.value}
                    onClick={() => {
                      const variants = profiles?.[option.value];
                      const variantKeys = variants
                        ? getExecutorVariantKeys(variants)
                        : [];
                      const keepCurrentVariant =
                        variantKeys.length > 0 &&
                        draft?.executor_profile?.variant &&
                        variantKeys.includes(draft.executor_profile.variant);

                      const newProfile: ExecutorProfileId = {
                        executor: option.value as BaseCodingAgent,
                        variant: keepCurrentVariant
                          ? draft!.executor_profile!.variant
                          : null,
                      };
                      updateDraft({ executor_profile: newProfile });
                    }}
                  >
                    {option.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {hasVariants ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <DropdownMenuTriggerButton
                    label={
                      draft?.executor_profile?.variant
                        ? toPrettyCase(draft.executor_profile.variant)
                        : t('settings.general.taskExecution.defaultLabel')
                    }
                    className="w-full justify-between"
                  />
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-[var(--radix-dropdown-menu-trigger-width)]">
                  {variantOptions.map((variantLabel) => (
                    <DropdownMenuItem
                      key={variantLabel}
                      onClick={() => {
                        const newProfile: ExecutorProfileId = {
                          executor: draft!.executor_profile!.executor,
                          variant: variantLabel,
                        };
                        updateDraft({ executor_profile: newProfile });
                      }}
                    >
                      {toPrettyCase(variantLabel)}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : selectedAgentProfile ? (
              <button
                disabled
                className={cn(
                  'flex items-center justify-between w-full px-base py-half rounded-sm border border-border bg-secondary',
                  'text-base text-low opacity-50 cursor-not-allowed'
                )}
              >
                <span className="truncate">
                  {t('settings.general.taskExecution.defaultLabel')}
                </span>
              </button>
            ) : null}
          </div>
        </SettingsField>
      </SettingsCard>

      {/* Git */}
      <SettingsCard
        title={t('settings.general.git.title')}
        description={t('settings.general.git.description')}
      >
        <SettingsField
          label={t('settings.general.git.branchPrefix.label')}
          error={branchPrefixError}
          description={
            <>
              {t('settings.general.git.branchPrefix.helper')}{' '}
              {draft?.git_branch_prefix ? (
                <>
                  {t('settings.general.git.branchPrefix.preview')}{' '}
                  <code className="text-xs bg-secondary px-1 py-0.5 rounded">
                    {t('settings.general.git.branchPrefix.previewWithPrefix', {
                      prefix: draft.git_branch_prefix,
                    })}
                  </code>
                </>
              ) : (
                <>
                  {t('settings.general.git.branchPrefix.preview')}{' '}
                  <code className="text-xs bg-secondary px-1 py-0.5 rounded">
                    {t('settings.general.git.branchPrefix.previewNoPrefix')}
                  </code>
                </>
              )}
            </>
          }
        >
          <SettingsInput
            value={draft?.git_branch_prefix ?? ''}
            onChange={(value) => {
              const trimmed = value.trim();
              updateDraft({ git_branch_prefix: trimmed });
              setBranchPrefixError(validateBranchPrefix(trimmed));
            }}
            placeholder={t('settings.general.git.branchPrefix.placeholder')}
            error={!!branchPrefixError}
          />
        </SettingsField>

        <SettingsField
          label={t('settings.general.git.workspaceDir.label')}
          description={t('settings.general.git.workspaceDir.helper')}
        >
          <div className="flex gap-2">
            <div className="flex-1">
              <SettingsInput
                value={draft?.workspace_dir ?? ''}
                onChange={(value) =>
                  updateDraft({ workspace_dir: value || null })
                }
                placeholder={t('settings.general.git.workspaceDir.placeholder')}
              />
            </div>
            <PrimaryButton
              variant="tertiary"
              onClick={handleBrowseWorkspaceDir}
            >
              <FolderSimpleIcon className="size-icon-sm" weight="bold" />
              {t('settings.general.git.workspaceDir.browse')}
            </PrimaryButton>
          </div>
        </SettingsField>
      </SettingsCard>

      {/* Pull Requests */}
      <SettingsCard
        title={t('settings.general.pullRequests.title')}
        description={t('settings.general.pullRequests.description')}
      >
        <SettingsCheckbox
          id="pr-auto-description"
          label={t('settings.general.pullRequests.autoDescription.label')}
          description={t(
            'settings.general.pullRequests.autoDescription.helper'
          )}
          checked={draft?.pr_auto_description_enabled ?? false}
          onChange={(checked) =>
            updateDraft({ pr_auto_description_enabled: checked })
          }
        />

        <SettingsCheckbox
          id="use-custom-prompt"
          label={t('settings.general.pullRequests.customPrompt.useCustom')}
          checked={draft?.pr_auto_description_prompt != null}
          onChange={(checked) => {
            if (checked) {
              updateDraft({
                pr_auto_description_prompt: DEFAULT_PR_DESCRIPTION_PROMPT,
              });
            } else {
              updateDraft({ pr_auto_description_prompt: null });
            }
          }}
        />

        <SettingsField
          label=""
          description={t('settings.general.pullRequests.customPrompt.helper')}
        >
          <SettingsTextarea
            value={
              draft?.pr_auto_description_prompt ?? DEFAULT_PR_DESCRIPTION_PROMPT
            }
            onChange={(value) =>
              updateDraft({ pr_auto_description_prompt: value })
            }
            disabled={draft?.pr_auto_description_prompt == null}
          />
        </SettingsField>
      </SettingsCard>

      {/* Commits */}
      <SettingsCard
        title={t('settings.general.commits.title')}
        description={t('settings.general.commits.description')}
      >
        <SettingsCheckbox
          id="commit-reminder"
          label={t('settings.general.commits.reminder.label')}
          description={t('settings.general.commits.reminder.helper')}
          checked={draft?.commit_reminder_enabled ?? true}
          onChange={(checked) =>
            updateDraft({ commit_reminder_enabled: checked })
          }
        />

        {draft?.commit_reminder_enabled && (
          <>
            <SettingsCheckbox
              id="use-custom-commit-prompt"
              label={t('settings.general.commits.customPrompt.useCustom')}
              checked={draft?.commit_reminder_prompt != null}
              onChange={(checked) => {
                if (checked) {
                  updateDraft({
                    commit_reminder_prompt: DEFAULT_COMMIT_REMINDER_PROMPT,
                  });
                } else {
                  updateDraft({ commit_reminder_prompt: null });
                }
              }}
            />

            <SettingsField
              label=""
              description={t('settings.general.commits.customPrompt.helper')}
            >
              <SettingsTextarea
                value={
                  draft?.commit_reminder_prompt ??
                  DEFAULT_COMMIT_REMINDER_PROMPT
                }
                onChange={(value) =>
                  updateDraft({ commit_reminder_prompt: value })
                }
                disabled={draft?.commit_reminder_prompt == null}
              />
            </SettingsField>
          </>
        )}
      </SettingsCard>

      {/* Notifications */}
      <SettingsCard
        title={t('settings.general.notifications.title')}
        description={t('settings.general.notifications.description')}
      >
        <SettingsCheckbox
          id="sound-enabled"
          label={t('settings.general.notifications.sound.label')}
          description={t('settings.general.notifications.sound.helper')}
          checked={draft?.notifications.sound_enabled ?? false}
          onChange={(checked) =>
            updateDraft({
              notifications: {
                ...draft!.notifications,
                sound_enabled: checked,
              },
            })
          }
        />

        {draft?.notifications.sound_enabled && (
          <div className="ml-7 space-y-2">
            <label className="text-sm font-medium text-normal">
              {t('settings.general.notifications.sound.fileLabel')}
            </label>
            <div className="flex gap-2">
              <div className="flex-1">
                <SettingsSelect
                  value={draft.notifications.sound_file}
                  options={soundOptions}
                  onChange={(value: SoundFile) =>
                    updateDraft({
                      notifications: {
                        ...draft.notifications,
                        sound_file: value,
                      },
                    })
                  }
                  placeholder={t(
                    'settings.general.notifications.sound.filePlaceholder'
                  )}
                />
              </div>
              <IconButton
                icon={SpeakerHighIcon}
                onClick={() => playSound(draft.notifications.sound_file)}
                aria-label="Preview sound"
                title="Preview sound"
              />
            </div>
            <p className="text-sm text-low">
              {t('settings.general.notifications.sound.fileHelper')}
            </p>
          </div>
        )}

        <SettingsCheckbox
          id="push-notifications"
          label={t('settings.general.notifications.push.label')}
          description={t('settings.general.notifications.push.helper')}
          checked={draft?.notifications.push_enabled ?? false}
          onChange={(checked) =>
            updateDraft({
              notifications: {
                ...draft!.notifications,
                push_enabled: checked,
              },
            })
          }
        />
      </SettingsCard>

      {/* Message Input */}
      <SettingsCard
        title={t('settings.general.messageInput.title')}
        description={t('settings.general.messageInput.description')}
      >
        <SettingsField
          label={t('settings.general.messageInput.shortcut.label')}
          description={t('settings.general.messageInput.shortcut.helper')}
        >
          <SettingsSelect
            value={draft?.send_message_shortcut ?? 'ModifierEnter'}
            options={[
              {
                value: 'ModifierEnter' as SendMessageShortcut,
                label: `${getModifierKey()}+Enter`,
              },
              {
                value: 'Enter' as SendMessageShortcut,
                label: t('settings.general.messageInput.shortcut.enterLabel'),
              },
            ]}
            onChange={(value: SendMessageShortcut) =>
              updateDraft({ send_message_shortcut: value })
            }
          />
        </SettingsField>
      </SettingsCard>

      {/* Privacy */}
      <SettingsCard
        title={t('settings.general.privacy.title')}
        description={t('settings.general.privacy.description')}
      >
        <SettingsCheckbox
          id="analytics-enabled"
          label={t('settings.general.privacy.telemetry.label')}
          description={t('settings.general.privacy.telemetry.helper')}
          checked={draft?.analytics_enabled ?? false}
          onChange={(checked) => updateDraft({ analytics_enabled: checked })}
        />
      </SettingsCard>

      {/* Task Templates */}
      <SettingsCard
        title={t('settings.general.taskTemplates.title')}
        description={t('settings.general.taskTemplates.description')}
      >
        <TagManager />
      </SettingsCard>

      {/* Safety */}
      <SettingsCard
        title={t('settings.general.safety.title')}
        description={t('settings.general.safety.description')}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-normal">
              {t('settings.general.safety.onboarding.title')}
            </p>
            <p className="text-sm text-low">
              {t('settings.general.safety.onboarding.description')}
            </p>
          </div>
          <PrimaryButton
            variant="tertiary"
            value={t('settings.general.safety.onboarding.button')}
            onClick={resetOnboarding}
          />
        </div>
      </SettingsCard>

      <SettingsSaveBar
        show={hasUnsavedChanges}
        saving={saving}
        saveDisabled={!!branchPrefixError}
        onSave={handleSave}
        onDiscard={handleDiscard}
      />
    </>
  );
}

// Alias for backwards compatibility
export { GeneralSettingsSection as GeneralSettingsSectionContent };
