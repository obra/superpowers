import {
  BookOpenIcon,
  FolderIcon,
  CloudArrowUpIcon,
  CheckCircleIcon,
} from '@phosphor-icons/react';
import { cn } from '../lib/cn';

export type MigrationStep =
  | 'introduction'
  | 'choose-projects'
  | 'migrate'
  | 'finish';

interface MigrateSidebarProps {
  currentStep: MigrationStep;
  onStepChange: (step: MigrationStep) => void;
}

const steps: Array<{
  id: MigrationStep;
  label: string;
  icon: typeof BookOpenIcon;
}> = [
  { id: 'introduction', label: 'Introduction', icon: BookOpenIcon },
  { id: 'choose-projects', label: 'Choose projects', icon: FolderIcon },
  { id: 'migrate', label: 'Migrate', icon: CloudArrowUpIcon },
  { id: 'finish', label: 'Finish', icon: CheckCircleIcon },
];

export function MigrateSidebar({
  currentStep,
  onStepChange,
}: MigrateSidebarProps) {
  const currentIndex = steps.findIndex((s) => s.id === currentStep);

  return (
    <nav className="grid gap-half sm:grid-cols-2 lg:grid-cols-4">
      {steps.map((step, index) => {
        const Icon = step.icon;
        const isActive = currentStep === step.id;
        const isPast = currentIndex > index;
        const isDisabled = !isActive && !isPast;

        return (
          <button
            key={step.id}
            onClick={() => !isDisabled && onStepChange(step.id)}
            disabled={isDisabled}
            className={cn(
              'w-full flex items-center gap-half rounded-sm border px-base py-half text-sm text-left transition-colors',
              isActive
                ? 'border-brand bg-brand/10 text-high'
                : isPast
                  ? 'border-border bg-secondary text-normal hover:bg-primary hover:text-high cursor-pointer'
                  : 'border-border bg-secondary text-low cursor-not-allowed opacity-50'
            )}
          >
            <Icon
              className={cn(
                'size-icon-sm shrink-0',
                isActive ? 'text-brand' : isPast ? 'text-success' : 'text-low'
              )}
              weight={isActive ? 'fill' : 'regular'}
            />
            <span className="truncate">{step.label}</span>
            {isPast && (
              <CheckCircleIcon
                className="ml-auto size-icon-xs text-success"
                weight="fill"
              />
            )}
          </button>
        );
      })}
    </nav>
  );
}
