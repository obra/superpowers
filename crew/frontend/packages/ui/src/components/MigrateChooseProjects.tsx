import { useTranslation } from 'react-i18next';
import {
  ArrowSquareOutIcon,
  ArrowRightIcon,
  BuildingsIcon,
  CaretDownIcon,
  CloudArrowUpIcon,
} from '@phosphor-icons/react';
import { PrimaryButton } from './PrimaryButton';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from './Dropdown';
import { Checkbox } from './Checkbox';

export interface MigrateChooseProjectsProject {
  id: string;
  name: string;
  remote_project_id: string | null;
}

export interface MigrateChooseProjectsOrganization {
  id: string;
  name: string;
}

interface MigrateChooseProjectsProps {
  projects: MigrateChooseProjectsProject[];
  organizations: MigrateChooseProjectsOrganization[];
  selectedOrgId: string | null;
  selectedProjectIds: Set<string>;
  isLoading: boolean;
  onOrgChange: (orgId: string) => void;
  onToggleProject: (projectId: string) => void;
  onSelectAll: () => void;
  onContinue: () => void;
  onSkip?: () => void;
  onGoToCreateWorkspace?: () => void;
  onViewMigratedProject?: (projectId: string) => void;
}

export function MigrateChooseProjects({
  projects,
  organizations,
  selectedOrgId,
  selectedProjectIds,
  isLoading,
  onOrgChange,
  onToggleProject,
  onSelectAll,
  onContinue,
  onSkip,
  onGoToCreateWorkspace,
  onViewMigratedProject,
}: MigrateChooseProjectsProps) {
  const { t } = useTranslation('common');
  const selectedOrg = organizations.find((org) => org.id === selectedOrgId);

  const migrateableProjects = projects.filter((p) => !p.remote_project_id);
  const migratedProjects = projects.filter((p) => p.remote_project_id);

  const buttonText =
    selectedProjectIds.size === 0
      ? 'Select projects to migrate'
      : `Migrate ${selectedProjectIds.size} project${selectedProjectIds.size === 1 ? '' : 's'}`;

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto py-double px-base">
        <p className="text-normal">Loading...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-double px-base">
      {/* Header section */}
      <div className="mb-double">
        <h1 className="text-xl font-semibold text-high mb-base">
          Choose Projects to Migrate
        </h1>
        <p className="text-base text-normal">
          Select which local projects to move to the cloud. A new cloud project
          will be created in your chosen organization for each one.
        </p>
      </div>

      {/* Organization selector */}
      <div className="mb-double">
        <label className="block text-sm font-medium text-high mb-half">
          Destination Organization
        </label>
        {organizations.length === 0 ? (
          <p className="text-sm text-low">
            No organizations available. Please create an organization first.
          </p>
        ) : (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-base bg-secondary border rounded px-base py-half w-full max-w-xs text-left">
                <BuildingsIcon
                  className="size-icon-sm text-normal"
                  weight="duotone"
                />
                <span className="flex-1 text-sm text-high truncate">
                  {selectedOrg?.name ?? 'Select organization'}
                </span>
                <CaretDownIcon
                  className="size-icon-xs text-normal"
                  weight="bold"
                />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-64">
              {organizations.map((org) => (
                <DropdownMenuItem
                  key={org.id}
                  onClick={() => onOrgChange(org.id)}
                >
                  {org.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Project list */}
      <div className="mb-double">
        <label className="block text-sm font-medium text-high mb-half">
          Local Projects
        </label>
        {projects.length === 0 ? (
          <div className="space-y-base">
            <p className="text-sm text-low">No local projects found.</p>
            {onGoToCreateWorkspace ? (
              <button
                type="button"
                onClick={onGoToCreateWorkspace}
                className="inline-flex items-center gap-half text-sm text-brand hover:underline"
              >
                Skip to create a workspace
                <ArrowSquareOutIcon className="size-icon-xs" weight="bold" />
              </button>
            ) : null}
          </div>
        ) : (
          <div className="bg-secondary border rounded">
            {/* Select all - only for migrateable projects */}
            {migrateableProjects.length > 0 && (
              <div className="flex items-center gap-base px-base py-half border-b">
                <Checkbox
                  id="select-all"
                  checked={
                    selectedProjectIds.size === migrateableProjects.length &&
                    migrateableProjects.length > 0
                  }
                  onCheckedChange={onSelectAll}
                />
                <label
                  htmlFor="select-all"
                  className="text-sm text-normal cursor-pointer"
                >
                  Select all ({migrateableProjects.length} project
                  {migrateableProjects.length === 1 ? '' : 's'})
                </label>
              </div>
            )}

            {/* Project list */}
            <div className="max-h-64 overflow-y-auto divide-y divide-border">
              {/* Migrateable projects first */}
              {migrateableProjects.map((project) => (
                <div
                  key={project.id}
                  className="flex items-center gap-base px-base py-half hover:bg-panel/50"
                >
                  <Checkbox
                    id={`project-${project.id}`}
                    checked={selectedProjectIds.has(project.id)}
                    onCheckedChange={() => onToggleProject(project.id)}
                  />
                  <label
                    htmlFor={`project-${project.id}`}
                    className="flex-1 text-sm text-high cursor-pointer truncate"
                  >
                    {project.name}
                  </label>
                </div>
              ))}

              {/* Already migrated projects */}
              {migratedProjects.map((project) => (
                <div
                  key={project.id}
                  className="flex items-center gap-base px-base py-half bg-panel/30"
                >
                  <span className="text-xs text-low whitespace-nowrap">
                    Already migrated
                  </span>
                  <span className="flex-1 text-sm text-low truncate">
                    {project.name}
                  </span>
                  {project.remote_project_id && onViewMigratedProject ? (
                    <button
                      type="button"
                      onClick={() =>
                        onViewMigratedProject(project.remote_project_id!)
                      }
                      className="flex items-center gap-half text-sm text-brand hover:underline whitespace-nowrap"
                    >
                      View
                      <ArrowSquareOutIcon
                        className="size-icon-xs"
                        weight="bold"
                      />
                    </button>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Info box */}
      <div className="mb-double p-base bg-secondary border rounded">
        <ul className="text-sm text-normal list-disc pl-double space-y-half">
          <li>
            Information about tasks, such as titles and descriptions, will be
            migrated to equivalent projects in the cloud
          </li>
          <li>
            Your code and agent logs will not be migrated to the cloud and will
            continue to live entirely locally
          </li>
        </ul>
      </div>

      {/* CTA */}
      <div className="pt-base border-t flex justify-end">
        {migrateableProjects.length === 0 && migratedProjects.length > 0 ? (
          <div className="flex items-center gap-base w-full">
            <p className="text-sm text-normal flex-1">
              {t('migration.allProjectsMigrated')}
            </p>
            <PrimaryButton onClick={onSkip} actionIcon={ArrowRightIcon}>
              {t('migration.continueToProjects')}
            </PrimaryButton>
          </div>
        ) : (
          <PrimaryButton
            onClick={onContinue}
            disabled={selectedProjectIds.size === 0 || !selectedOrgId}
            actionIcon={CloudArrowUpIcon}
          >
            {buttonText}
          </PrimaryButton>
        )}
      </div>
    </div>
  );
}
