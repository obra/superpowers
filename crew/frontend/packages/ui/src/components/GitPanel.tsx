import { GitBranchIcon } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import { cn } from '../lib/cn';
import { RepoCard, type RepoAction } from './RepoCard';
import { InputField } from './InputField';
import { ErrorAlert } from './ErrorAlert';

export interface RepoInfo {
  id: string;
  name: string;
  targetBranch: string;
  commitsAhead: number;
  commitsBehind: number;
  remoteCommitsAhead?: number;
  prNumber?: number;
  prUrl?: string;
  prStatus?: 'open' | 'merged' | 'closed' | 'unknown';
  showPushButton?: boolean;
  isPushPending?: boolean;
  isPushSuccess?: boolean;
  isPushError?: boolean;
  isTargetRemote?: boolean;
}

interface GitPanelProps {
  repos: RepoInfo[];
  repoSelectedActions?: Record<string, RepoAction>;
  workingBranchName: string;
  onWorkingBranchNameChange: (name: string) => void;
  onActionsClick?: (repoId: string, action: RepoAction) => void;
  onRepoActionChange?: (repoId: string, action: RepoAction) => void;
  onPushClick?: (repoId: string) => void;
  onMoreClick?: (repoId: string) => void;
  onAddRepo?: () => void;
  className?: string;
  error?: string | null;
}

export function GitPanel({
  repos,
  repoSelectedActions,
  workingBranchName,
  onWorkingBranchNameChange,
  onActionsClick,
  onRepoActionChange,
  onPushClick,
  onMoreClick,
  className,
  error,
}: GitPanelProps) {
  const { t } = useTranslation(['tasks', 'common']);

  return (
    <div
      className={cn(
        'flex flex-col flex-1 w-full bg-secondary text-low overflow-y-auto',
        className
      )}
    >
      {error && <ErrorAlert message={error} />}
      <div className="gap-base px-base">
        {repos.map((repo) => (
          <RepoCard
            key={repo.id}
            repoId={repo.id}
            name={repo.name}
            targetBranch={repo.targetBranch}
            commitsAhead={repo.commitsAhead}
            commitsBehind={repo.commitsBehind}
            prNumber={repo.prNumber}
            prUrl={repo.prUrl}
            prStatus={repo.prStatus}
            showPushButton={repo.showPushButton}
            isPushPending={repo.isPushPending}
            isPushSuccess={repo.isPushSuccess}
            isPushError={repo.isPushError}
            isTargetRemote={repo.isTargetRemote}
            selectedAction={repoSelectedActions?.[repo.id] ?? 'pull-request'}
            onSelectedActionChange={(action) =>
              onRepoActionChange?.(repo.id, action)
            }
            onChangeTarget={() => onActionsClick?.(repo.id, 'change-target')}
            onRebase={() => onActionsClick?.(repo.id, 'rebase')}
            onActionsClick={(action) => onActionsClick?.(repo.id, action)}
            onPushClick={() => onPushClick?.(repo.id)}
            onMoreClick={() => onMoreClick?.(repo.id)}
          />
        ))}
        <div className="bg-primary flex flex-col gap-base w-full p-base rounded-sm my-base">
          <div className="flex gap-base items-center">
            <GitBranchIcon className="size-icon-md text-base" weight="fill" />
            <p className="font-medium truncate">
              {t('common:sections.workingBranch')}
            </p>
          </div>
          <InputField
            variant="editable"
            value={workingBranchName}
            onChange={onWorkingBranchNameChange}
            placeholder={t('gitPanel.advanced.placeholder')}
          />
        </div>
      </div>
    </div>
  );
}
