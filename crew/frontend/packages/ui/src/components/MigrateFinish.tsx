import {
  FolderIcon,
  ArrowSquareOutIcon,
  ArrowCounterClockwiseIcon,
} from '@phosphor-icons/react';
import { PrimaryButton } from './PrimaryButton';

export interface MigrateFinishProject {
  localId: string;
  localName: string;
  remoteId: string | null;
}

interface MigrateFinishProps {
  migratedProjects: MigrateFinishProject[];
  onMigrateMore: () => void;
  onViewProject: (project: MigrateFinishProject) => void;
}

export function MigrateFinish({
  migratedProjects,
  onMigrateMore,
  onViewProject,
}: MigrateFinishProps) {
  return (
    <div className="max-w-2xl mx-auto py-double px-base">
      {/* Header */}
      <div className="mb-double">
        <h1 className="text-xl font-semibold text-high mb-base">
          Migration Complete!
        </h1>
        <p className="text-base text-normal">
          Your projects have been migrated to the cloud. Click a project below
          to view it.
        </p>
      </div>

      {/* Project list */}
      <div className="mb-double">
        <div className="bg-secondary border rounded divide-y divide-border">
          {migratedProjects.map((project) => (
            <div
              key={project.localId}
              className="flex items-center gap-base px-base py-half hover:bg-panel/50"
            >
              <FolderIcon
                className="size-icon-sm text-brand shrink-0"
                weight="duotone"
              />
              <span className="flex-1 text-sm text-high truncate">
                {project.localName}
              </span>
              <button
                type="button"
                onClick={() => onViewProject(project)}
                className="rounded-sm px-base py-half text-cta h-cta flex gap-half items-center bg-brand hover:bg-brand-hover text-on-brand"
              >
                View
                <ArrowSquareOutIcon className="size-icon-xs" weight="bold" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="pt-base border-t">
        <PrimaryButton
          variant="tertiary"
          onClick={onMigrateMore}
          actionIcon={ArrowCounterClockwiseIcon}
        >
          Migrate More Projects
        </PrimaryButton>
      </div>
    </div>
  );
}
