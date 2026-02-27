import { useCallback, useMemo, useState } from 'react';
import {
  ClockCounterClockwiseIcon,
  GitBranchIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  SpinnerIcon,
  XIcon,
} from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import type { Repo } from 'shared/types';
import type { BranchItem, RepoItem } from '@/shared/types/selectionItems';
import { repoApi } from '@/shared/lib/api';
import { cn } from '@/shared/lib/utils';
import { useCreateMode } from '@/shared/hooks/useCreateMode';
import { FolderPickerDialog } from '@/shared/dialogs/shared/FolderPickerDialog';
import { PrimaryButton } from '@vibe/ui/components/PrimaryButton';
import { CreateRepoDialog } from '@vibe/ui/components/CreateRepoDialog';
import {
  SelectionDialog,
  type SelectionPage,
} from '@/shared/dialogs/command-bar/SelectionDialog';
import {
  buildRepoSelectionPages,
  type RepoSelectionResult,
} from '@/shared/dialogs/command-bar/selections/repoSelection';
import {
  buildBranchSelectionPages,
  type BranchSelectionResult,
} from '@/shared/dialogs/command-bar/selections/branchSelection';

function toRepoItem(repo: Repo): RepoItem {
  return {
    id: repo.id,
    display_name: repo.display_name || repo.name,
  };
}

function toBranchItem(branch: {
  name: string;
  is_current: boolean;
}): BranchItem {
  return {
    name: branch.name,
    isCurrent: branch.is_current,
  };
}

function getRepoDisplayName(repo: Repo): string {
  return repo.display_name || repo.name;
}

type PendingAction = 'choose' | 'browse' | 'create' | 'branch' | null;

const inlineControlButtonClassName =
  'inline-flex items-center gap-half rounded-sm px-half py-half text-sm text-normal ' +
  'hover:text-high disabled:cursor-not-allowed disabled:opacity-50';

const recentInlineControlButtonClassName =
  'inline-flex items-center gap-half rounded-sm px-half py-half text-sm ' +
  'disabled:cursor-not-allowed disabled:opacity-50';

const repoRowButtonClassName =
  'inline-flex items-center gap-half text-sm text-low hover:text-high ' +
  'disabled:cursor-not-allowed disabled:opacity-50';

interface CreateModeRepoPickerBarProps {
  onContinueToPrompt: () => void;
}

export function CreateModeRepoPickerBar({
  onContinueToPrompt,
}: CreateModeRepoPickerBarProps) {
  const { t } = useTranslation('common');
  const { repos, targetBranches, addRepo, removeRepo, setTargetBranch } =
    useCreateMode();
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [branchRepoId, setBranchRepoId] = useState<string | null>(null);
  const [pickerError, setPickerError] = useState<string | null>(null);
  const isBusy = pendingAction !== null;

  const selectedRepoIds = useMemo(
    () => new Set(repos.map((repo) => repo.id)),
    [repos]
  );

  const pickBranchForRepo = useCallback(async (repo: Repo) => {
    const branches = await repoApi.getBranches(repo.id);
    const branchItems = branches.map(toBranchItem);
    const branchResult = (await SelectionDialog.show({
      initialPageId: 'selectBranch',
      pages: buildBranchSelectionPages(
        branchItems,
        getRepoDisplayName(repo)
      ) as Record<string, SelectionPage>,
    })) as BranchSelectionResult | undefined;

    return branchResult?.branch ?? null;
  }, []);

  const runPickerAction = useCallback(
    async (
      action: Exclude<PendingAction, null>,
      run: () => Promise<void>,
      fallbackError: string
    ) => {
      setPickerError(null);
      setPendingAction(action);

      try {
        await run();
      } catch (error) {
        setPickerError(error instanceof Error ? error.message : fallbackError);
      } finally {
        setPendingAction(null);
        if (action === 'branch') {
          setBranchRepoId(null);
        }
      }
    },
    []
  );

  const addRepoWithBranchSelection = useCallback(
    async (repo: Repo) => {
      if (selectedRepoIds.has(repo.id)) {
        setPickerError('Repository is already selected');
        return false;
      }

      const selectedBranch = await pickBranchForRepo(repo);
      if (!selectedBranch) return false;

      addRepo(repo);
      setTargetBranch(repo.id, selectedBranch);
      return true;
    },
    [addRepo, pickBranchForRepo, selectedRepoIds, setTargetBranch]
  );

  const handleChooseRepo = useCallback(async () => {
    await runPickerAction(
      'choose',
      async () => {
        const allRepos = await repoApi.listRecent();
        const availableRepos = allRepos.filter(
          (repo) => !selectedRepoIds.has(repo.id)
        );

        if (availableRepos.length === 0) {
          setPickerError(
            'No recently used repositories found, please browse repositories instead'
          );
          return;
        }

        const repoResult = (await SelectionDialog.show({
          initialPageId: 'selectRepo',
          pages: buildRepoSelectionPages(
            availableRepos.map(toRepoItem)
          ) as Record<string, SelectionPage>,
        })) as RepoSelectionResult | undefined;

        if (!repoResult?.repoId) return;

        const selectedRepo = availableRepos.find(
          (repo) => repo.id === repoResult.repoId
        );
        if (!selectedRepo) return;

        await addRepoWithBranchSelection(selectedRepo);
      },
      'Failed to load repositories or branches'
    );
  }, [addRepoWithBranchSelection, runPickerAction, selectedRepoIds]);

  const handleBrowseRepo = useCallback(async () => {
    await runPickerAction(
      'browse',
      async () => {
        const selectedPath = await FolderPickerDialog.show({
          title: t('dialogs.selectGitRepository'),
          description: t('dialogs.chooseExistingRepo'),
        });
        if (!selectedPath) return;

        const repo = await repoApi.register({ path: selectedPath });
        await addRepoWithBranchSelection(repo);
      },
      'Failed to register repository'
    );
  }, [addRepoWithBranchSelection, runPickerAction, t]);

  const handleCreateRepo = useCallback(async () => {
    await runPickerAction(
      'create',
      async () => {
        await CreateRepoDialog.show({
          onBrowseForPath: async (currentPath) =>
            FolderPickerDialog.show({
              title: t('git.createRepo.browseDialog.title'),
              description: t('git.createRepo.browseDialog.description'),
              value: currentPath,
            }),
          onCreateRepo: async ({ parentPath, folderName }) => {
            const repo = await repoApi.init({
              parent_path: parentPath,
              folder_name: folderName,
            });
            await addRepoWithBranchSelection(repo);
          },
        });
      },
      'Failed to create repository'
    );
  }, [addRepoWithBranchSelection, runPickerAction, t]);

  const handleChangeBranch = useCallback(
    async (repo: Repo) => {
      setBranchRepoId(repo.id);
      await runPickerAction(
        'branch',
        async () => {
          const selectedBranch = await pickBranchForRepo(repo);
          if (!selectedBranch) return;
          setTargetBranch(repo.id, selectedBranch);
        },
        'Failed to load branches'
      );
    },
    [pickBranchForRepo, runPickerAction, setTargetBranch]
  );

  return (
    <div className="w-chat max-w-full">
      <div className="px-plusfifty py-base">
        {repos.length > 0 && (
          <div>
            <div className="rounded-sm border border-border/60">
              {repos.map((repo, index) => {
                const branch = targetBranches[repo.id] ?? 'Select branch';
                const repoDisplayName = getRepoDisplayName(repo);
                const isChangingBranch =
                  pendingAction === 'branch' && branchRepoId === repo.id;

                return (
                  <div
                    key={repo.id}
                    className={cn(
                      'flex min-w-0 items-center gap-half px-base py-half',
                      index > 0 && 'border-t border-border/60'
                    )}
                  >
                    <span className="min-w-0 flex-1 truncate text-sm text-normal">
                      {repoDisplayName}
                    </span>
                    <span className="h-3 w-px shrink-0 bg-border/70" />
                    <button
                      type="button"
                      onClick={() => handleChangeBranch(repo)}
                      disabled={isBusy}
                      className={repoRowButtonClassName}
                      title="Change branch"
                    >
                      {isChangingBranch ? (
                        <SpinnerIcon className="size-icon-xs animate-spin" />
                      ) : (
                        <GitBranchIcon className="size-icon-xs" weight="bold" />
                      )}
                      <span className="max-w-[200px] truncate">{branch}</span>
                    </button>
                    <span className="h-3 w-px shrink-0 bg-border/70" />
                    <button
                      type="button"
                      onClick={() => removeRepo(repo.id)}
                      disabled={isBusy}
                      aria-label={`Remove ${repoDisplayName}`}
                      title={`Remove ${repoDisplayName}`}
                      className={cn(repoRowButtonClassName, 'hover:text-error')}
                    >
                      <XIcon className="size-icon-xs" weight="bold" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="mt-base flex flex-wrap items-center gap-half">
          <button
            type="button"
            onClick={handleChooseRepo}
            disabled={isBusy}
            className={cn(
              recentInlineControlButtonClassName,
              repos.length > 0
                ? 'text-normal hover:text-high'
                : 'text-brand hover:text-brand-hover'
            )}
          >
            {pendingAction === 'choose' ? (
              <SpinnerIcon className="size-icon-xs animate-spin" />
            ) : (
              <ClockCounterClockwiseIcon
                className="size-icon-xs"
                weight="bold"
              />
            )}
            <span>{t('createMode.repoPicker.actions.recent')}</span>
          </button>
          <button
            type="button"
            onClick={handleBrowseRepo}
            disabled={isBusy}
            className={inlineControlButtonClassName}
          >
            {pendingAction === 'browse' ? (
              <SpinnerIcon className="size-icon-xs animate-spin" />
            ) : (
              <MagnifyingGlassIcon className="size-icon-xs" weight="bold" />
            )}
            <span>{t('createMode.repoPicker.actions.browse')}</span>
          </button>
          <button
            type="button"
            onClick={handleCreateRepo}
            disabled={isBusy}
            className={inlineControlButtonClassName}
          >
            {pendingAction === 'create' ? (
              <SpinnerIcon className="size-icon-xs animate-spin" />
            ) : (
              <PlusIcon className="size-icon-xs" weight="bold" />
            )}
            <span>{t('createMode.repoPicker.actions.create')}</span>
          </button>

          <div className="ml-auto">
            <PrimaryButton
              variant="default"
              value="Continue"
              onClick={onContinueToPrompt}
              disabled={isBusy || repos.length === 0}
            />
          </div>
        </div>
      </div>
      {pickerError && (
        <div className="mt-half rounded-sm border border-error/30 bg-error/10 px-base py-half">
          <p className="text-xs text-error">{pickerError}</p>
        </div>
      )}
    </div>
  );
}
