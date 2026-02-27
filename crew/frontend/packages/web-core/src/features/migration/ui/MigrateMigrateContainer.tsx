import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { usePostHog } from 'posthog-js/react';
import { migrationApi } from '@/shared/lib/api';
import { useUserOrganizations } from '@/shared/hooks/useUserOrganizations';
import { MigrateMigrate } from '@vibe/ui/components/MigrateMigrate';
import type { MigrationReport } from 'shared/types';

const REMOTE_ONBOARDING_EVENTS = {
  STAGE_SUBMITTED: 'remote_onboarding_ui_stage_submitted',
  STAGE_COMPLETED: 'remote_onboarding_ui_stage_completed',
  STAGE_FAILED: 'remote_onboarding_ui_stage_failed',
} as const;

type MigrationStartMethod = 'initial' | 'retry';

interface MigrateMigrateContainerProps {
  orgId: string;
  projectIds: string[];
  onContinue: () => void;
}

export function MigrateMigrateContainer({
  orgId,
  projectIds,
  onContinue,
}: MigrateMigrateContainerProps) {
  const posthog = usePostHog();
  const { data: orgsData } = useUserOrganizations();
  const organizations = useMemo(
    () => orgsData?.organizations ?? [],
    [orgsData?.organizations]
  );

  const [isMigrating, setIsMigrating] = useState(true);
  const [report, setReport] = useState<MigrationReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const hasStartedRef = useRef(false);

  const orgName =
    organizations.find((org) => org.id === orgId)?.name ?? 'Unknown';

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

  const startMigration = useCallback(
    async (method: MigrationStartMethod) => {
      trackRemoteOnboardingEvent(REMOTE_ONBOARDING_EVENTS.STAGE_SUBMITTED, {
        stage: 'migrate',
        method,
        organization_id: orgId,
        project_count: projectIds.length,
      });

      setIsMigrating(true);
      setError(null);
      setReport(null);

      try {
        const response = await migrationApi.start({
          organization_id: orgId,
          project_ids: projectIds,
        });
        setReport(response.report);

        trackRemoteOnboardingEvent(REMOTE_ONBOARDING_EVENTS.STAGE_COMPLETED, {
          stage: 'migrate',
          method,
          organization_id: orgId,
          project_count: projectIds.length,
          migrated_projects: response.report.projects.migrated,
          skipped_projects: response.report.projects.skipped,
          warnings_count: response.report.warnings.length,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Migration failed');

        trackRemoteOnboardingEvent(REMOTE_ONBOARDING_EVENTS.STAGE_FAILED, {
          stage: 'migrate',
          method,
          organization_id: orgId,
          project_count: projectIds.length,
          reason: 'migration_start_failed',
        });
      } finally {
        setIsMigrating(false);
      }
    },
    [orgId, projectIds, trackRemoteOnboardingEvent]
  );

  // Start migration on mount (only once)
  useEffect(() => {
    if (hasStartedRef.current) {
      return;
    }
    hasStartedRef.current = true;
    void startMigration('initial');
  }, [startMigration]);

  const handleRetry = () => {
    void startMigration('retry');
  };

  return (
    <MigrateMigrate
      orgName={orgName}
      projectCount={projectIds.length}
      isMigrating={isMigrating}
      report={report}
      error={error}
      onRetry={handleRetry}
      onContinue={onContinue}
    />
  );
}
