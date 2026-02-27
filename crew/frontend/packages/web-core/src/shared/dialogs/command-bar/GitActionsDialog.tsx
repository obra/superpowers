import { useTranslation } from 'react-i18next';
import { ExternalLink, GitPullRequest } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@vibe/ui/components/KeyboardDialog';
import { Loader } from '@vibe/ui/components/Loader';
import GitOperations from '@/shared/components/tasks/Toolbar/GitOperations';
import { useTaskAttemptWithSession } from '@/shared/hooks/useTaskAttempt';
import { useBranchStatus } from '@/shared/hooks/useBranchStatus';
import { useAttemptExecution } from '@/shared/hooks/useAttemptExecution';
import { useAttemptRepo } from '@/shared/hooks/useAttemptRepo';
import { ExecutionProcessesProvider } from '@/shared/providers/ExecutionProcessesProvider';
import {
  GitOperationsProvider,
  useGitOperationsError,
} from '@/shared/hooks/GitOperationsContext';
import type { Merge } from 'shared/types';
import type { WorkspaceWithSession } from '@/shared/types/attempt';
import { create, useModal } from '@ebay/nice-modal-react';
import { defineModal } from '@/shared/lib/modals';

export interface GitActionsDialogProps {
  attemptId: string;
}

interface GitActionsDialogContentProps {
  attempt: WorkspaceWithSession;
}

function GitActionsDialogContent({ attempt }: GitActionsDialogContentProps) {
  const { t } = useTranslation('tasks');
  const { data: branchStatus, error: branchStatusError } = useBranchStatus(
    attempt.id
  );
  const { isAttemptRunning } = useAttemptExecution(attempt.id);
  const { error: gitError } = useGitOperationsError();
  const { repos, selectedRepoId } = useAttemptRepo(attempt.id);

  const getSelectedRepoStatus = () => {
    const repoId = selectedRepoId ?? repos[0]?.id;
    return branchStatus?.find((r) => r.repo_id === repoId);
  };

  const mergedPR = getSelectedRepoStatus()?.merges?.find(
    (m: Merge) => m.type === 'pr' && m.pr_info?.status === 'merged'
  );

  return (
    <div className="space-y-4">
      {mergedPR && mergedPR.type === 'pr' && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>
            {t('git.actions.prMerged', {
              number: mergedPR.pr_info.number || '',
            })}
          </span>
          {mergedPR.pr_info.url && (
            <a
              href={mergedPR.pr_info.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-primary hover:underline"
            >
              <GitPullRequest className="h-3.5 w-3.5" />
              {t('git.pr.number', {
                number: Number(mergedPR.pr_info.number),
              })}
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
        </div>
      )}
      {gitError && (
        <div className="p-3 border border-destructive rounded text-destructive text-sm">
          {gitError}
        </div>
      )}
      <GitOperations
        selectedAttempt={attempt}
        branchStatus={branchStatus ?? null}
        branchStatusError={branchStatusError}
        isAttemptRunning={isAttemptRunning}
        selectedBranch={getSelectedRepoStatus()?.target_branch_name ?? null}
        layout="vertical"
      />
    </div>
  );
}

const GitActionsDialogImpl = create<GitActionsDialogProps>(({ attemptId }) => {
  const modal = useModal();
  const { t } = useTranslation('tasks');

  const { data: attempt } = useTaskAttemptWithSession(attemptId);

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      modal.hide();
    }
  };

  const isLoading = !attempt;

  return (
    <Dialog open={modal.visible} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t('git.actions.title')}</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="py-8">
            <Loader size={24} />
          </div>
        ) : (
          <GitOperationsProvider attemptId={attempt.id}>
            <ExecutionProcessesProvider
              key={attempt.id}
              sessionId={attempt.session?.id}
            >
              <GitActionsDialogContent attempt={attempt} />
            </ExecutionProcessesProvider>
          </GitOperationsProvider>
        )}
      </DialogContent>
    </Dialog>
  );
});

export const GitActionsDialog = defineModal<GitActionsDialogProps, void>(
  GitActionsDialogImpl
);
