import {
  ArrowRightIcon,
  UsersIcon,
  TagIcon,
  ChatCircleIcon,
  TreeStructureIcon,
  GitPullRequestIcon,
  CloudIcon,
  SignInIcon,
} from '@phosphor-icons/react';
import { PrimaryButton } from './PrimaryButton';

interface MigrateIntroductionProps {
  isSignedIn: boolean;
  onAction: () => void;
}

const features = [
  {
    icon: CloudIcon,
    title: 'Cloud Storage',
    description: (
      <>
        Access your projects from anywhere.{' '}
        <a
          href="https://www.vibekanban.com/docs/self-hosting/local-development"
          target="_blank"
          rel="noopener noreferrer"
          className="text-brand hover:underline"
        >
          Self-host
        </a>{' '}
        if you prefer.
      </>
    ),
  },
  {
    icon: UsersIcon,
    title: 'Team Collaboration',
    description: 'Invite teammates and assign work',
  },
  {
    icon: ChatCircleIcon,
    title: 'Comments',
    description: 'Comment on issues to keep discussions in context',
  },
  {
    icon: TreeStructureIcon,
    title: 'Sub-issues',
    description: 'Break down complex work into smaller pieces',
  },
  {
    icon: GitPullRequestIcon,
    title: 'GitHub Integration',
    description: 'Link pull requests directly to issues',
  },
  {
    icon: TagIcon,
    title: 'Tags & Priorities',
    description: 'Add tags and priorities to organize work',
  },
];

export function MigrateIntroduction({
  isSignedIn,
  onAction,
}: MigrateIntroductionProps) {
  return (
    <div className="max-w-2xl mx-auto py-double px-base">
      {/* Header section */}
      <div className="mb-double">
        <h1 className="text-xl font-semibold text-high mb-base">
          Move Your Projects to the Cloud
        </h1>
        <p className="text-base text-normal">
          Your local projects are moving to secure cloud storage. This unlocks
          team collaboration, real-time sync, and access from any device.
        </p>
      </div>

      {/* Features grid */}
      <div className="mb-double">
        <h2 className="text-lg font-medium text-high mb-base">
          What you get with cloud projects
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-base">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className="p-base bg-secondary rounded border"
              >
                <div className="flex items-start gap-base">
                  <div className="p-half bg-panel rounded">
                    <Icon
                      className="size-icon-sm text-brand"
                      weight="duotone"
                    />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-high mb-half">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-low">{feature.description}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* CTA */}
      <div className="pt-base border-t">
        <p className="text-sm text-normal mb-base">
          {isSignedIn
            ? 'Continue to select projects to migrate.'
            : 'Sign in to migrate your local projects.'}
        </p>
        <PrimaryButton
          onClick={onAction}
          actionIcon={isSignedIn ? ArrowRightIcon : SignInIcon}
        >
          {isSignedIn ? 'Continue' : 'Sign In'}
        </PrimaryButton>
      </div>
    </div>
  );
}
