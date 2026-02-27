import { useCallback, useEffect, useRef } from 'react';
import { usePostHog } from 'posthog-js/react';
import { ThemeMode } from 'shared/types';
import { useTheme } from '@/shared/hooks/useTheme';
import { MigrateLayout } from '@/features/migration/ui/MigrateLayout';

const REMOTE_ONBOARDING_EVENTS = {
  STAGE_VIEWED: 'remote_onboarding_ui_stage_viewed',
} as const;

function resolveTheme(theme: ThemeMode): 'light' | 'dark' {
  if (theme === ThemeMode.SYSTEM) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  }
  return theme === ThemeMode.DARK ? 'dark' : 'light';
}

export function MigratePage() {
  const { theme } = useTheme();
  const posthog = usePostHog();
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

  useEffect(() => {
    if (hasTrackedStageViewRef.current) {
      return;
    }

    trackRemoteOnboardingEvent(REMOTE_ONBOARDING_EVENTS.STAGE_VIEWED, {
      stage: 'migrate',
    });
    hasTrackedStageViewRef.current = true;
  }, [trackRemoteOnboardingEvent]);

  const logoSrc =
    resolveTheme(theme) === 'dark'
      ? '/vibe-kanban-logo-dark.svg'
      : '/vibe-kanban-logo.svg';

  return (
    <div className="h-full overflow-auto bg-primary">
      <div className="mx-auto flex min-h-full w-full max-w-3xl flex-col justify-center px-base py-double">
        <div className="rounded-sm border border-border bg-secondary p-double space-y-double">
          <header className="space-y-double text-center">
            <div className="flex justify-center">
              <img
                src={logoSrc}
                alt="Vibe Kanban"
                className="h-8 w-auto logo"
              />
            </div>
            <p className="text-sm text-low">
              Migrate your local projects to cloud projects.
            </p>
          </header>
          <MigrateLayout />
        </div>
      </div>
    </div>
  );
}
