import {
  forwardRef,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  BookOpenIcon,
  BirdIcon,
  CheckIcon,
  CowIcon,
  DeviceMobileIcon,
  GithubLogoIcon,
  MusicNoteIcon,
  MusicNotesIcon,
  SpeakerHighIcon,
  SpeakerXIcon,
  WarningIcon,
  WaveformIcon,
  type Icon,
} from '@phosphor-icons/react';
import type { IconProps } from '@phosphor-icons/react';
import { Navigate, useNavigate } from '@tanstack/react-router';
import { usePostHog } from 'posthog-js/react';
import { siDiscord } from 'simple-icons';
import {
  BaseCodingAgent,
  EditorType,
  SoundFile,
  ThemeMode,
  type EditorConfig,
} from 'shared/types';
import { useUserSystem } from '@/shared/hooks/useUserSystem';
import { useTheme } from '@/shared/hooks/useTheme';
import { AgentIcon, getAgentName } from '@/shared/components/AgentIcon';
import { IdeIcon } from '@/shared/components/IdeIcon';
import { getIdeName } from '@/shared/lib/ideName';
import { cn } from '@/shared/lib/utils';
import { PrimaryButton } from '@vibe/ui/components/PrimaryButton';

type SoundOption = {
  value: SoundFile;
  label: string;
  icon: Icon;
};

const SOUND_OPTIONS: SoundOption[] = [
  {
    value: SoundFile.ABSTRACT_SOUND1,
    label: 'Abstract Sound 1',
    icon: WaveformIcon,
  },
  {
    value: SoundFile.ABSTRACT_SOUND2,
    label: 'Abstract Sound 2',
    icon: MusicNoteIcon,
  },
  {
    value: SoundFile.ABSTRACT_SOUND3,
    label: 'Abstract Sound 3',
    icon: MusicNotesIcon,
  },
  {
    value: SoundFile.ABSTRACT_SOUND4,
    label: 'Abstract Sound 4',
    icon: SpeakerHighIcon,
  },
  {
    value: SoundFile.COW_MOOING,
    label: 'Cow Mooing',
    icon: CowIcon,
  },
  {
    value: SoundFile.PHONE_VIBRATION,
    label: 'Phone Vibration',
    icon: DeviceMobileIcon,
  },
  {
    value: SoundFile.ROOSTER,
    label: 'Rooster',
    icon: BirdIcon,
  },
];

const AGENT_PRIORITY: BaseCodingAgent[] = [
  BaseCodingAgent.CLAUDE_CODE,
  BaseCodingAgent.CODEX,
  BaseCodingAgent.OPENCODE,
  BaseCodingAgent.GEMINI,
];

const DiscordIcon: Icon = forwardRef<SVGSVGElement, IconProps>(
  ({ className, color = 'currentColor' }, ref) => (
    <svg
      ref={ref}
      className={className}
      viewBox="0 0 24 24"
      fill={color}
      aria-hidden="true"
    >
      <path d={siDiscord.path} />
    </svg>
  )
);
DiscordIcon.displayName = 'DiscordIcon';

const SOCIAL_LINKS = [
  {
    label: 'Discord',
    href: 'https://discord.gg/AC4nwVtJM3',
    icon: DiscordIcon,
  },
  {
    label: 'GitHub',
    href: 'https://github.com/BloopAI/vibe-kanban',
    icon: GithubLogoIcon,
  },
  {
    label: 'Docs',
    href: 'https://www.vibekanban.com/docs',
    icon: BookOpenIcon,
  },
];

const REMOTE_ONBOARDING_EVENTS = {
  STAGE_VIEWED: 'remote_onboarding_ui_stage_viewed',
  STAGE_SUBMITTED: 'remote_onboarding_ui_stage_submitted',
  STAGE_COMPLETED: 'remote_onboarding_ui_stage_completed',
  STAGE_FAILED: 'remote_onboarding_ui_stage_failed',
} as const;

function randomDefaultSoundFile(): SoundFile {
  const randomIndex = Math.floor(Math.random() * SOUND_OPTIONS.length);
  return SOUND_OPTIONS[randomIndex]?.value ?? SoundFile.COW_MOOING;
}

function resolveTheme(theme: ThemeMode): 'light' | 'dark' {
  if (theme === ThemeMode.SYSTEM) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  }
  return theme === ThemeMode.DARK ? 'dark' : 'light';
}

export function LandingPage() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { config, profiles, updateAndSaveConfig, loading } = useUserSystem();
  const posthog = usePostHog();

  const [initialized, setInitialized] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<BaseCodingAgent>(
    BaseCodingAgent.CLAUDE_CODE
  );
  const [editorType, setEditorType] = useState<EditorType>(EditorType.VS_CODE);
  const [customCommand, setCustomCommand] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [soundFile, setSoundFile] = useState<SoundFile>(randomDefaultSoundFile);
  const hasTrackedStageViewRef = useRef(false);

  const trackRemoteOnboardingEvent = useCallback(
    (eventName: string, properties: Record<string, unknown> = {}) => {
      posthog?.capture(eventName, {
        ...properties,
        flow: 'remote_onboarding_ui',
        source: 'frontend',
      });
    },
    [posthog]
  );

  const logoSrc =
    resolveTheme(theme) === 'dark'
      ? '/vibe-kanban-logo-dark.svg'
      : '/vibe-kanban-logo.svg';

  useEffect(() => {
    if (!config || initialized) return;

    setSelectedAgent(config.executor_profile.executor);
    setEditorType(config.editor.editor_type);
    setCustomCommand(config.editor.custom_command || '');
    setInitialized(true);
  }, [config, initialized]);

  useEffect(() => {
    if (!config || !initialized || hasTrackedStageViewRef.current) return;

    trackRemoteOnboardingEvent(REMOTE_ONBOARDING_EVENTS.STAGE_VIEWED, {
      stage: 'landing',
    });
    hasTrackedStageViewRef.current = true;
  }, [config, initialized, trackRemoteOnboardingEvent]);

  const executorOptions = useMemo(() => {
    const compareAgents = (a: BaseCodingAgent, b: BaseCodingAgent) => {
      const priorityA = AGENT_PRIORITY.indexOf(a);
      const priorityB = AGENT_PRIORITY.indexOf(b);
      const hasPriorityA = priorityA !== -1;
      const hasPriorityB = priorityB !== -1;

      if (hasPriorityA && hasPriorityB) {
        return priorityA - priorityB;
      }
      if (hasPriorityA) return -1;
      if (hasPriorityB) return 1;

      return getAgentName(a).localeCompare(getAgentName(b));
    };

    if (profiles) {
      return (Object.keys(profiles) as BaseCodingAgent[]).sort(compareAgents);
    }
    return [...Object.values(BaseCodingAgent)].sort(compareAgents);
  }, [profiles]);

  const editorOptions = useMemo(() => Object.values(EditorType), []);

  const playSound = async (value: SoundFile) => {
    const audio = new Audio(`/api/sounds/${value}`);
    try {
      await audio.play();
    } catch (err) {
      console.error('Failed to play sound:', err);
    }
  };

  const openExternalLink = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleSoundSelect = (value: SoundFile) => {
    setSoundEnabled(true);
    setSoundFile(value);
    void playSound(value);
  };

  const isCustomEditorValid =
    editorType !== EditorType.CUSTOM || customCommand.trim() !== '';
  const canContinue = !saving && isCustomEditorValid;

  const handleContinue = async () => {
    if (!config || !canContinue) return;

    const editorConfig: EditorConfig = {
      editor_type: editorType,
      custom_command:
        editorType === EditorType.CUSTOM ? customCommand.trim() : null,
      remote_ssh_host: null,
      remote_ssh_user: null,
      auto_install_extension: true,
    };

    trackRemoteOnboardingEvent(REMOTE_ONBOARDING_EVENTS.STAGE_SUBMITTED, {
      stage: 'landing',
      method: 'continue',
      selected_agent: selectedAgent,
      editor_type: editorType,
      custom_editor_command_set:
        editorType === EditorType.CUSTOM && customCommand.trim() !== '',
      sound_enabled: soundEnabled,
      sound_file: soundEnabled ? soundFile : null,
    });

    setSaving(true);
    const success = await updateAndSaveConfig({
      onboarding_acknowledged: true,
      disclaimer_acknowledged: true,
      executor_profile: {
        executor: selectedAgent,
        variant: null,
      },
      editor: editorConfig,
      notifications: {
        ...config.notifications,
        sound_enabled: soundEnabled,
        sound_file: soundFile,
      },
    });
    setSaving(false);

    if (success) {
      trackRemoteOnboardingEvent(REMOTE_ONBOARDING_EVENTS.STAGE_COMPLETED, {
        stage: 'landing',
        destination: '/onboarding/sign-in',
      });
      navigate({ to: '/onboarding/sign-in', replace: true });
      return;
    }

    trackRemoteOnboardingEvent(REMOTE_ONBOARDING_EVENTS.STAGE_FAILED, {
      stage: 'landing',
      reason: 'config_save_failed',
    });
  };

  if (loading || !config || !initialized) {
    return (
      <div className="h-screen bg-primary flex items-center justify-center">
        <p className="text-low">Loading...</p>
      </div>
    );
  }

  if (config.remote_onboarding_acknowledged) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="h-screen overflow-auto bg-primary">
      <div className="mx-auto flex min-h-full w-full max-w-3xl flex-col justify-center px-base py-double">
        <div className="rounded-sm border border-border bg-secondary p-double space-y-double">
          <header className="space-y-double">
            <div className="flex justify-center">
              <img
                src={logoSrc}
                alt="Vibe Kanban"
                className="h-8 w-auto logo"
              />
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {SOCIAL_LINKS.map((link) => (
                <PrimaryButton
                  key={link.label}
                  value={link.label}
                  variant="tertiary"
                  actionIcon={link.icon}
                  onClick={() => openExternalLink(link.href)}
                />
              ))}
            </div>
            <div className="rounded-sm border border-brand bg-brand/20 p-base">
              <div className="flex items-start gap-base">
                <WarningIcon
                  className="size-icon-sm text-brand shrink-0 mt-[2px]"
                  weight="fill"
                />
                <div className="space-y-half text-sm text-normal">
                  <p>
                    Vibe Kanban runs AI coding agents with{' '}
                    <code>--dangerously-skip-permissions</code> /{' '}
                    <code>--yolo</code> by default.
                  </p>
                  <p>
                    Always review what agents are doing and keep backups of
                    important work. Learn more at{' '}
                    <a
                      href="https://www.vibekanban.com/docs/getting-started#safety-notice"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-brand hover:underline"
                    >
                      the safety notice
                    </a>
                    .
                  </p>
                </div>
              </div>
            </div>
          </header>

          <section className="space-y-half">
            <h2 className="text-base font-medium text-high">
              Choose Your Coding Agent
            </h2>
            <p className="text-sm text-low">
              Select the default coding agent configuration.
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {executorOptions.map((agent) => {
                const selected = selectedAgent === agent;

                return (
                  <button
                    key={agent}
                    type="button"
                    onClick={() => setSelectedAgent(agent)}
                    className={cn(
                      'flex items-center gap-base rounded-sm border px-base py-half text-left',
                      selected
                        ? 'border-brand bg-brand/10'
                        : 'border-border bg-panel hover:bg-primary'
                    )}
                  >
                    <AgentIcon
                      agent={agent}
                      className="size-icon-xl shrink-0"
                    />
                    <span className="text-sm text-normal flex-1">
                      {getAgentName(agent)}
                    </span>
                    {selected && (
                      <CheckIcon
                        className="size-icon-xs text-brand"
                        weight="bold"
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </section>

          <section className="space-y-half">
            <h2 className="text-base font-medium text-high">
              Choose Your Code Editor
            </h2>
            <p className="text-sm text-low">
              This editor will be used when opening attempts and files.
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {editorOptions.map((editor) => {
                const selected = editorType === editor;

                return (
                  <button
                    key={editor}
                    type="button"
                    onClick={() => setEditorType(editor)}
                    className={cn(
                      'flex items-center gap-base rounded-sm border px-base py-half text-left',
                      selected
                        ? 'border-brand bg-brand/10'
                        : 'border-border bg-panel hover:bg-primary'
                    )}
                  >
                    <IdeIcon
                      editorType={editor}
                      className="size-icon-sm shrink-0"
                    />
                    <span className="text-sm text-normal flex-1">
                      {getIdeName(editor)}
                    </span>
                    {selected && (
                      <CheckIcon
                        className="size-icon-xs text-brand"
                        weight="bold"
                      />
                    )}
                  </button>
                );
              })}
            </div>

            {editorType === EditorType.CUSTOM && (
              <div className="space-y-half">
                <label className="text-sm font-medium text-normal">
                  Custom Command
                </label>
                <input
                  type="text"
                  value={customCommand}
                  onChange={(e) => setCustomCommand(e.target.value)}
                  placeholder="e.g. code --wait"
                  className={cn(
                    'w-full bg-panel border rounded-sm px-base py-half text-sm text-high',
                    'placeholder:text-low placeholder:opacity-80 focus:outline-none',
                    'focus:ring-1 focus:ring-brand',
                    customCommand.trim() === ''
                      ? 'border-warning/60'
                      : 'border-border'
                  )}
                />
              </div>
            )}
          </section>

          <section className="space-y-half">
            <h2 className="text-base font-medium text-high">
              Notification Sound
            </h2>
            <p className="text-sm text-low">
              Pick a sound for notifications, or disable sound.
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {SOUND_OPTIONS.map((option) => {
                const Icon = option.icon;
                const selected = soundEnabled && soundFile === option.value;

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleSoundSelect(option.value)}
                    className={cn(
                      'flex items-center gap-base rounded-sm border px-base py-half text-left',
                      selected
                        ? 'border-brand bg-brand/10'
                        : 'border-border bg-panel hover:bg-primary'
                    )}
                  >
                    <Icon
                      className={cn(
                        'size-icon-sm shrink-0',
                        selected ? 'text-brand' : 'text-normal'
                      )}
                      weight={selected ? 'fill' : 'bold'}
                    />
                    <span className="text-sm text-normal flex-1">
                      {option.label}
                    </span>
                    {selected && (
                      <CheckIcon
                        className="size-icon-xs text-brand"
                        weight="bold"
                      />
                    )}
                  </button>
                );
              })}
              <button
                type="button"
                onClick={() => setSoundEnabled(false)}
                className={cn(
                  'flex items-center gap-base rounded-sm border px-base py-half text-left',
                  !soundEnabled
                    ? 'border-brand bg-brand/10'
                    : 'border-border bg-panel hover:bg-primary'
                )}
              >
                <SpeakerXIcon
                  className={cn(
                    'size-icon-sm shrink-0',
                    !soundEnabled ? 'text-brand' : 'text-normal'
                  )}
                  weight={!soundEnabled ? 'fill' : 'bold'}
                />
                <span className="text-sm text-normal flex-1">No sound</span>
                {!soundEnabled && (
                  <CheckIcon
                    className="size-icon-xs text-brand"
                    weight="bold"
                  />
                )}
              </button>
            </div>
          </section>

          <div className="pt-base border-t border-border flex items-center justify-between gap-base">
            <p className="text-xs text-low">
              By continuing you agree to the{' '}
              <a
                href="https://www.vibekanban.com/terms"
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand hover:underline"
              >
                terms and conditions
              </a>{' '}
              and{' '}
              <a
                href="https://www.vibekanban.com/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand hover:underline"
              >
                privacy policy
              </a>
              .
            </p>
            <PrimaryButton
              value={saving ? 'Saving...' : 'Continue'}
              onClick={handleContinue}
              disabled={!canContinue}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
