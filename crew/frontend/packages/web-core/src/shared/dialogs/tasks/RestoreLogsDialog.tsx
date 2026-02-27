import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@vibe/ui/components/KeyboardDialog';
import { Button } from '@vibe/ui/components/Button';
import { AlertTriangle, GitCommit, Loader2 } from 'lucide-react';
import { create, useModal } from '@ebay/nice-modal-react';
import { defineModal } from '@/shared/lib/modals';
import { useKeySubmitTask } from '@/shared/keyboard/hooks';
import { Scope } from '@/shared/keyboard/registry';
import { executionProcessesApi } from '@/shared/lib/api';
import {
  isCodingAgent,
  PROCESS_RUN_REASONS,
  shouldShowInLogs,
} from '@/shared/constants/processes';
import type {
  ExecutionProcess,
  ExecutionProcessRepoState,
  RepoBranchStatus,
} from 'shared/types';

export interface RestoreLogsDialogProps {
  executionProcessId: string;
  branchStatus: RepoBranchStatus[] | undefined;
  processes: ExecutionProcess[] | undefined;
  initialWorktreeResetOn?: boolean;
  initialForceReset?: boolean;
  mode?: 'retry' | 'reset';
}

export type RestoreLogsDialogResult = {
  action: 'confirmed' | 'canceled';
  performGitReset?: boolean;
  forceWhenDirty?: boolean;
};

const RestoreLogsDialogImpl = create<RestoreLogsDialogProps>(
  ({
    executionProcessId,
    branchStatus,
    processes,
    initialWorktreeResetOn = false,
    initialForceReset = false,
    mode = 'retry',
  }) => {
    const modal = useModal();
    const { t } = useTranslation(['tasks', 'common']);
    const [isLoading, setIsLoading] = useState(true);
    const [worktreeResetOn, setWorktreeResetOn] = useState(
      initialWorktreeResetOn
    );
    const [forceReset, setForceReset] = useState(initialForceReset);
    const [acknowledgeUncommitted, setAcknowledgeUncommitted] = useState(false);

    // Fetched data - stores all repo states for multi-repo support
    const [repoStates, setRepoStates] = useState<ExecutionProcessRepoState[]>(
      []
    );

    // Fetch execution process repo states
    useEffect(() => {
      let cancelled = false;
      setIsLoading(true);

      (async () => {
        try {
          // Fetch repo states for the execution process (supports multi-repo)
          const states =
            await executionProcessesApi.getRepoStates(executionProcessId);
          if (cancelled) return;
          setRepoStates(states);
        } finally {
          if (!cancelled) setIsLoading(false);
        }
      })();

      return () => {
        cancelled = true;
      };
    }, [executionProcessId]);

    // Compute processes to be deleted
    // For retry mode: only processes AFTER target (target itself will be retried)
    // For reset mode: target process AND all processes after it
    const { deletedCount, deletedCoding, deletedSetup, deletedCleanup } =
      useMemo(() => {
        const procs = (processes || []).filter(
          (p) => !p.dropped && shouldShowInLogs(p.run_reason)
        );
        const idx = procs.findIndex((p) => p.id === executionProcessId);
        // For reset mode, include the target process; for retry, only later processes
        const startIdx = mode === 'reset' ? idx : idx + 1;
        const toDelete = idx >= 0 ? procs.slice(startIdx) : [];
        return {
          deletedCount: toDelete.length,
          deletedCoding: toDelete.filter((p) => isCodingAgent(p.run_reason))
            .length,
          deletedSetup: toDelete.filter(
            (p) => p.run_reason === PROCESS_RUN_REASONS.SETUP_SCRIPT
          ).length,
          deletedCleanup: toDelete.filter(
            (p) => p.run_reason === PROCESS_RUN_REASONS.CLEANUP_SCRIPT
          ).length,
        };
      }, [processes, executionProcessId, mode]);

    // Join repo states with branch status to get repo names and compute aggregated values
    const repoInfo = useMemo(() => {
      return repoStates.map((state) => {
        const bs = branchStatus?.find((b) => b.repo_id === state.repo_id);
        return {
          repoId: state.repo_id,
          repoName: bs?.repo_name ?? state.repo_id,
          targetSha: state.before_head_commit,
          headOid: bs?.head_oid ?? null,
          hasUncommitted: bs?.has_uncommitted_changes ?? false,
          uncommittedCount: bs?.uncommitted_count ?? 0,
          untrackedCount: bs?.untracked_count ?? 0,
        };
      });
    }, [repoStates, branchStatus]);

    // Aggregate values across all repos
    const anyDirty = repoInfo.some(
      (r) => r.hasUncommitted || r.untrackedCount > 0
    );

    const totalUncommitted = repoInfo.reduce(
      (sum, r) => sum + r.uncommittedCount,
      0
    );
    const totalUntracked = repoInfo.reduce(
      (sum, r) => sum + r.untrackedCount,
      0
    );
    const anyNeedsReset = repoInfo.some(
      (r) =>
        r.targetSha &&
        (r.targetSha !== r.headOid || r.hasUncommitted || r.untrackedCount > 0)
    );
    const needGitReset = anyNeedsReset;
    const canGitReset = needGitReset && !anyDirty;
    const hasRisk = anyDirty;

    const hasProcessesToDelete = deletedCount > 0;
    const repoCount = repoInfo.length;

    const isConfirmDisabled =
      isLoading ||
      (anyDirty && !acknowledgeUncommitted) ||
      (hasRisk && worktreeResetOn && needGitReset && !forceReset);

    const handleConfirm = () => {
      modal.resolve({
        action: 'confirmed',
        performGitReset: worktreeResetOn,
        forceWhenDirty: forceReset,
      } as RestoreLogsDialogResult);
      modal.hide();
    };

    const handleCancel = () => {
      modal.resolve({ action: 'canceled' } as RestoreLogsDialogResult);
      modal.hide();
    };

    const handleOpenChange = (open: boolean) => {
      if (!open) {
        handleCancel();
      }
    };

    // CMD+Enter to confirm
    useKeySubmitTask(handleConfirm, {
      scope: Scope.DIALOG,
      when: modal.visible && !isConfirmDisabled,
    });

    return (
      <Dialog open={modal.visible} onOpenChange={handleOpenChange}>
        <DialogContent
          className="max-h-[92vh] sm:max-h-[88vh] overflow-y-auto overflow-x-hidden"
          onKeyDownCapture={(e) => {
            if (e.key === 'Escape') {
              e.stopPropagation();
              handleCancel();
            }
          }}
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 mb-3 md:mb-4">
              <AlertTriangle className="h-4 w-4 text-destructive" />{' '}
              {mode === 'reset'
                ? t('restoreLogsDialog.titleReset')
                : t('restoreLogsDialog.title')}
            </DialogTitle>
            <div className="mt-6 break-words text-sm text-muted-foreground">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="space-y-3">
                  {hasProcessesToDelete && (
                    <div className="flex items-start gap-3 rounded-md border border-destructive/30 bg-destructive/10 p-3">
                      <AlertTriangle className="h-4 w-4 text-destructive mt-0.5" />
                      <div className="text-sm min-w-0 w-full break-words">
                        <p className="font-medium text-destructive mb-2">
                          {t('restoreLogsDialog.historyChange.title')}
                        </p>
                        <>
                          <p className="mt-0.5">
                            {mode === 'reset' ? (
                              t(
                                'restoreLogsDialog.historyChange.willDeleteProcesses',
                                {
                                  count: deletedCount,
                                }
                              )
                            ) : (
                              <>
                                {t(
                                  'restoreLogsDialog.historyChange.willDelete'
                                )}
                                {deletedCount > 0 && (
                                  <>
                                    {' '}
                                    {t(
                                      'restoreLogsDialog.historyChange.andLaterProcesses',
                                      { count: deletedCount }
                                    )}
                                  </>
                                )}
                              </>
                            )}{' '}
                            {t('restoreLogsDialog.historyChange.fromHistory')}
                          </p>
                          <ul className="mt-1 text-xs text-muted-foreground list-disc pl-5">
                            {deletedCoding > 0 && (
                              <li>
                                {t(
                                  'restoreLogsDialog.historyChange.codingAgentRuns',
                                  { count: deletedCoding }
                                )}
                              </li>
                            )}
                            {deletedSetup + deletedCleanup > 0 && (
                              <li>
                                {t(
                                  'restoreLogsDialog.historyChange.scriptProcesses',
                                  { count: deletedSetup + deletedCleanup }
                                )}
                                {deletedSetup > 0 && deletedCleanup > 0 && (
                                  <>
                                    {' '}
                                    {t(
                                      'restoreLogsDialog.historyChange.setupCleanupBreakdown',
                                      {
                                        setup: deletedSetup,
                                        cleanup: deletedCleanup,
                                      }
                                    )}
                                  </>
                                )}
                              </li>
                            )}
                          </ul>
                        </>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {t(
                            'restoreLogsDialog.historyChange.permanentWarning'
                          )}
                        </p>
                      </div>
                    </div>
                  )}

                  {anyDirty && (
                    <div className="flex items-start gap-3 rounded-md border border-amber-300/60 bg-amber-50/70 dark:border-amber-400/30 dark:bg-amber-900/20 p-3">
                      <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5" />
                      <div className="text-sm min-w-0 w-full break-words">
                        <p className="font-medium text-amber-700 dark:text-amber-300">
                          {t('restoreLogsDialog.uncommittedChanges.title')}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {t(
                            'restoreLogsDialog.uncommittedChanges.description',
                            {
                              count: totalUncommitted,
                            }
                          )}
                          {totalUntracked > 0 &&
                            t(
                              'restoreLogsDialog.uncommittedChanges.andUntracked',
                              {
                                count: totalUntracked,
                              }
                            )}
                          .
                        </p>
                        <div
                          className="mt-2 w-full flex items-center cursor-pointer select-none"
                          role="switch"
                          aria-checked={acknowledgeUncommitted}
                          onClick={() => setAcknowledgeUncommitted((v) => !v)}
                        >
                          <div className="text-xs text-muted-foreground flex-1 min-w-0 break-words">
                            {t(
                              'restoreLogsDialog.uncommittedChanges.acknowledgeLabel'
                            )}
                          </div>
                          <div className="ml-auto relative inline-flex h-5 w-9 items-center rounded-full">
                            <span
                              className={
                                (acknowledgeUncommitted
                                  ? 'bg-amber-500'
                                  : 'bg-panel') +
                                ' absolute inset-0 rounded-full transition-colors'
                              }
                            />
                            <span
                              className={
                                (acknowledgeUncommitted
                                  ? 'translate-x-5'
                                  : 'translate-x-1') +
                                ' pointer-events-none relative inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform'
                              }
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {needGitReset && canGitReset && (
                    <div
                      className={
                        !worktreeResetOn
                          ? 'flex items-start gap-3 rounded-md border p-3'
                          : hasRisk
                            ? 'flex items-start gap-3 rounded-md border border-destructive/30 bg-destructive/10 p-3'
                            : 'flex items-start gap-3 rounded-md border p-3 border-amber-300/60 bg-amber-50/70 dark:border-amber-400/30 dark:bg-amber-900/20'
                      }
                    >
                      <AlertTriangle
                        className={
                          !worktreeResetOn
                            ? 'h-4 w-4 text-muted-foreground mt-0.5'
                            : hasRisk
                              ? 'h-4 w-4 text-destructive mt-0.5'
                              : 'h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5'
                        }
                      />
                      <div className="text-sm min-w-0 w-full break-words">
                        <p className="font-medium mb-2">
                          {t('restoreLogsDialog.resetWorktree.title')}
                          {repoCount > 1 && ` (${repoCount} repos)`}
                        </p>
                        <div
                          className="mt-2 w-full flex items-center cursor-pointer select-none"
                          role="switch"
                          aria-checked={worktreeResetOn}
                          onClick={() => setWorktreeResetOn((v) => !v)}
                        >
                          <div className="text-xs text-muted-foreground flex-1 min-w-0 break-words">
                            {worktreeResetOn
                              ? t('restoreLogsDialog.resetWorktree.enabled')
                              : t('restoreLogsDialog.resetWorktree.disabled')}
                          </div>
                          <div className="ml-auto relative inline-flex h-5 w-9 items-center rounded-full">
                            <span
                              className={
                                (worktreeResetOn
                                  ? 'bg-emerald-500'
                                  : 'bg-panel') +
                                ' absolute inset-0 rounded-full transition-colors'
                              }
                            />
                            <span
                              className={
                                (worktreeResetOn
                                  ? 'translate-x-5'
                                  : 'translate-x-1') +
                                ' pointer-events-none relative inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform'
                              }
                            />
                          </div>
                        </div>
                        {worktreeResetOn && (
                          <>
                            <p className="mt-2 text-xs text-muted-foreground">
                              {t(
                                'restoreLogsDialog.resetWorktree.restoreDescription'
                              )}
                            </p>
                            <div className="mt-1 space-y-1">
                              {repoInfo.map((repo) => (
                                <div
                                  key={repo.repoId}
                                  className="flex flex-wrap items-center gap-2 min-w-0"
                                >
                                  <GitCommit className="h-3.5 w-3.5 text-muted-foreground" />
                                  {repoCount > 1 && (
                                    <span className="text-xs text-muted-foreground">
                                      {repo.repoName}:
                                    </span>
                                  )}
                                  {repo.targetSha && (
                                    <span className="font-mono text-xs px-2 py-0.5 rounded bg-muted">
                                      {repo.targetSha.slice(0, 7)}
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                            {(totalUncommitted > 0 || totalUntracked > 0) && (
                              <ul className="mt-2 space-y-1 text-xs text-muted-foreground list-disc pl-5">
                                {totalUncommitted > 0 && (
                                  <li>
                                    {t(
                                      'restoreLogsDialog.resetWorktree.discardChanges',
                                      { count: totalUncommitted }
                                    )}
                                  </li>
                                )}
                                {totalUntracked > 0 && (
                                  <li>
                                    {t(
                                      'restoreLogsDialog.resetWorktree.untrackedPresent',
                                      { count: totalUntracked }
                                    )}
                                  </li>
                                )}
                              </ul>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  {needGitReset && !canGitReset && (
                    <div
                      className={
                        forceReset && worktreeResetOn
                          ? 'flex items-start gap-3 rounded-md border border-destructive/30 bg-destructive/10 p-3'
                          : 'flex items-start gap-3 rounded-md border p-3'
                      }
                    >
                      <AlertTriangle className="h-4 w-4 text-destructive mt-0.5" />
                      <div className="text-sm min-w-0 w-full break-words">
                        <p className="font-medium text-destructive">
                          {t('restoreLogsDialog.resetWorktree.title')}
                          {repoCount > 1 && ` (${repoCount} repos)`}
                        </p>
                        <div
                          className={`mt-2 w-full flex items-center select-none cursor-pointer`}
                          role="switch"
                          onClick={() => {
                            setWorktreeResetOn((on) => {
                              if (forceReset) return !on; // free toggle when forced
                              // Without force, only allow explicitly disabling reset
                              return false;
                            });
                          }}
                        >
                          <div className="text-xs text-muted-foreground flex-1 min-w-0 break-words">
                            {forceReset
                              ? worktreeResetOn
                                ? t('restoreLogsDialog.resetWorktree.enabled')
                                : t('restoreLogsDialog.resetWorktree.disabled')
                              : t(
                                  'restoreLogsDialog.resetWorktree.disabledUncommitted'
                                )}
                          </div>
                          <div className="ml-auto relative inline-flex h-5 w-9 items-center rounded-full">
                            <span
                              className={
                                (worktreeResetOn && forceReset
                                  ? 'bg-emerald-500'
                                  : 'bg-panel') +
                                ' absolute inset-0 rounded-full transition-colors'
                              }
                            />
                            <span
                              className={
                                (worktreeResetOn && forceReset
                                  ? 'translate-x-5'
                                  : 'translate-x-1') +
                                ' pointer-events-none relative inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform'
                              }
                            />
                          </div>
                        </div>
                        <div
                          className="mt-2 w-full flex items-center cursor-pointer select-none"
                          role="switch"
                          onClick={() => {
                            setForceReset((v) => {
                              const next = !v;
                              if (next) setWorktreeResetOn(true);
                              return next;
                            });
                          }}
                        >
                          <div className="text-xs font-medium text-destructive flex-1 min-w-0 break-words">
                            {t('restoreLogsDialog.resetWorktree.forceReset')}
                          </div>
                          <div className="ml-auto relative inline-flex h-5 w-9 items-center rounded-full">
                            <span
                              className={
                                (forceReset ? 'bg-destructive' : 'bg-panel') +
                                ' absolute inset-0 rounded-full transition-colors'
                              }
                            />
                            <span
                              className={
                                (forceReset
                                  ? 'translate-x-5'
                                  : 'translate-x-1') +
                                ' pointer-events-none relative inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform'
                              }
                            />
                          </div>
                        </div>
                        <p className="mt-2 text-xs text-muted-foreground">
                          {forceReset
                            ? t(
                                'restoreLogsDialog.resetWorktree.uncommittedWillDiscard'
                              )
                            : t(
                                'restoreLogsDialog.resetWorktree.uncommittedPresentHint'
                              )}
                        </p>
                        {repoInfo.length > 0 && (
                          <>
                            <p className="mt-2 text-xs text-muted-foreground">
                              {t(
                                'restoreLogsDialog.resetWorktree.restoreDescription'
                              )}
                            </p>
                            <div className="mt-1 space-y-1">
                              {repoInfo.map((repo) => (
                                <div
                                  key={repo.repoId}
                                  className="flex flex-wrap items-center gap-2 min-w-0"
                                >
                                  <GitCommit className="h-3.5 w-3.5 text-muted-foreground" />
                                  {repoCount > 1 && (
                                    <span className="text-xs text-muted-foreground">
                                      {repo.repoName}:
                                    </span>
                                  )}
                                  {repo.targetSha && (
                                    <span className="font-mono text-xs px-2 py-0.5 rounded bg-muted">
                                      {repo.targetSha.slice(0, 7)}
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={handleCancel}>
              {t('common:buttons.cancel')}
            </Button>
            <Button
              variant="destructive"
              disabled={isConfirmDisabled}
              onClick={handleConfirm}
            >
              {mode === 'reset'
                ? t('restoreLogsDialog.buttons.reset')
                : t('restoreLogsDialog.buttons.retry')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }
);

export const RestoreLogsDialog = defineModal<
  RestoreLogsDialogProps,
  RestoreLogsDialogResult
>(RestoreLogsDialogImpl);
