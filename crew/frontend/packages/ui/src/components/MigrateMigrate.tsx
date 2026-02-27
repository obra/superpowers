import {
  SpinnerIcon,
  CheckCircleIcon,
  WarningIcon,
  ArrowRightIcon,
  ArrowCounterClockwiseIcon,
} from '@phosphor-icons/react';
import { PrimaryButton } from './PrimaryButton';

interface MigrationEntityReport {
  total: number;
  migrated: number;
  skipped: number;
}

interface MigrateMigrationReport {
  projects: MigrationEntityReport;
  tasks: MigrationEntityReport;
  pr_merges: MigrationEntityReport;
  warnings: string[];
}

interface MigrateMigrateProps {
  orgName: string;
  projectCount: number;
  isMigrating: boolean;
  report: MigrateMigrationReport | null;
  error: string | null;
  onRetry: () => void;
  onContinue: () => void;
}

function formatEntityReport(report: MigrationEntityReport): string {
  let text = `${report.migrated}/${report.total} migrated`;
  if (report.skipped > 0) {
    text += `, ${report.skipped} skipped`;
  }
  return text;
}

export function MigrateMigrate({
  orgName,
  projectCount,
  isMigrating,
  report,
  error,
  onRetry,
  onContinue,
}: MigrateMigrateProps) {
  // Loading state
  if (isMigrating) {
    return (
      <div className="max-w-2xl mx-auto py-double px-base">
        <div className="mb-double">
          <h1 className="text-xl font-semibold text-high mb-base">
            Migrating Your Projects
          </h1>
        </div>

        <div className="flex flex-col items-center justify-center py-double">
          <SpinnerIcon
            className="size-12 text-brand animate-spin mb-base"
            weight="bold"
          />
          <p className="text-base text-normal text-center mb-half">
            Migrating {projectCount} project
            {projectCount === 1 ? '' : 's'} to "{orgName}"...
          </p>
          <p className="text-sm text-low text-center">
            This may take a moment.
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="max-w-2xl mx-auto py-double px-base">
        <div className="mb-double">
          <h1 className="text-xl font-semibold text-high mb-base">
            Migration Failed
          </h1>
        </div>

        <div className="p-base bg-error/10 border border-error/20 rounded mb-double">
          <div className="flex items-start gap-base">
            <WarningIcon
              className="size-icon-sm text-error shrink-0 mt-half"
              weight="fill"
            />
            <div>
              <p className="text-sm text-error font-medium mb-half">
                An error occurred during migration
              </p>
              <p className="text-sm text-normal">{error}</p>
            </div>
          </div>
        </div>

        <div className="pt-base border-t flex justify-end">
          <PrimaryButton
            onClick={onRetry}
            actionIcon={ArrowCounterClockwiseIcon}
          >
            Retry Migration
          </PrimaryButton>
        </div>
      </div>
    );
  }

  // Success state
  if (report) {
    return (
      <div className="max-w-2xl mx-auto py-double px-base">
        <div className="mb-double">
          <h1 className="text-xl font-semibold text-high mb-base">
            Migration Complete
          </h1>
          <p className="text-base text-normal">
            Your projects have been successfully migrated to the cloud.
          </p>
        </div>

        <div className="p-base bg-secondary border rounded mb-double">
          <div className="space-y-half">
            <div className="flex items-center gap-half">
              <CheckCircleIcon
                className="size-icon-xs text-success"
                weight="fill"
              />
              <span className="text-sm text-high">
                Projects: {formatEntityReport(report.projects)}
              </span>
            </div>
            <div className="flex items-center gap-half">
              <CheckCircleIcon
                className="size-icon-xs text-success"
                weight="fill"
              />
              <span className="text-sm text-high">
                Tasks: {formatEntityReport(report.tasks)}
              </span>
            </div>
            <div className="flex items-center gap-half">
              <CheckCircleIcon
                className="size-icon-xs text-success"
                weight="fill"
              />
              <span className="text-sm text-high">
                PR Merges: {formatEntityReport(report.pr_merges)}
              </span>
            </div>
          </div>

          {report.warnings.length > 0 && (
            <div className="mt-base pt-base border-t">
              <p className="text-sm font-medium text-normal mb-half">
                Warnings:
              </p>
              <ul className="list-disc list-inside text-sm text-low">
                {report.warnings.map((warning, index) => (
                  <li key={index}>{warning}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="pt-base border-t flex justify-end">
          <PrimaryButton onClick={onContinue} actionIcon={ArrowRightIcon}>
            Continue
          </PrimaryButton>
        </div>
      </div>
    );
  }

  // Should not reach here, but just in case
  return null;
}
