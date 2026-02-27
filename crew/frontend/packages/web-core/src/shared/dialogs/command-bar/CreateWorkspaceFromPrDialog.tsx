import { useState, useEffect, useContext, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowSquareOut } from '@phosphor-icons/react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@vibe/ui/components/KeyboardDialog';
import { Button } from '@vibe/ui/components/Button';
import { Checkbox } from '@vibe/ui/components/Checkbox';
import { Label } from '@vibe/ui/components/Label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@vibe/ui/components/Select';
import { useNavigate } from '@tanstack/react-router';
import { create, useModal } from '@ebay/nice-modal-react';
import { defineModal } from '@/shared/lib/modals';
import { attemptsApi, repoApi } from '@/shared/lib/api';
import { WorkspaceContext } from '@/shared/hooks/useWorkspaceContext';
import { SearchableDropdownContainer } from '@/shared/components/ui-new/containers/SearchableDropdownContainer';
import type { OpenPrInfo, GitRemote } from 'shared/types';
import { toWorkspace } from '@/shared/lib/routes/navigation';

export interface CreateWorkspaceFromPrDialogProps {}

const CreateWorkspaceFromPrDialogImpl =
  create<CreateWorkspaceFromPrDialogProps>(() => {
    const modal = useModal();
    const navigate = useNavigate();
    const { t } = useTranslation('tasks');
    const queryClient = useQueryClient();

    const workspaceContext = useContext(WorkspaceContext);
    const currentWorkspaceRepoId = workspaceContext?.repos[0]?.id ?? null;

    const [selectedRepoId, setSelectedRepoId] = useState<string | null>(null);
    const [selectedRemote, setSelectedRemote] = useState<string | null>(null);
    const [selectedPrNumber, setSelectedPrNumber] = useState<number | null>(
      null
    );
    const [runSetup, setRunSetup] = useState(true);

    const { data: repos = [], isLoading: isLoadingRepos } = useQuery({
      queryKey: ['repos'],
      queryFn: () => repoApi.list(),
      enabled: modal.visible,
    });

    useEffect(() => {
      if (selectedRepoId) return;
      if (
        currentWorkspaceRepoId &&
        repos.some((r) => r.id === currentWorkspaceRepoId)
      ) {
        setSelectedRepoId(currentWorkspaceRepoId);
      } else if (repos.length === 1) {
        setSelectedRepoId(repos[0].id);
      }
    }, [repos, selectedRepoId, currentWorkspaceRepoId]);

    const { data: remotes = [], isLoading: isLoadingRemotes } = useQuery({
      queryKey: ['repo-remotes', selectedRepoId],
      queryFn: async () => {
        if (!selectedRepoId) return [];
        return repoApi.listRemotes(selectedRepoId);
      },
      enabled: modal.visible && !!selectedRepoId,
    });

    useEffect(() => {
      if (remotes.length > 0 && !selectedRemote) {
        setSelectedRemote(remotes[0].name);
      }
    }, [remotes, selectedRemote]);

    const {
      data: prsResult,
      isLoading: isLoadingPrs,
      error: prsError,
    } = useQuery({
      queryKey: ['open-prs', selectedRepoId, selectedRemote],
      queryFn: async () => {
        if (!selectedRepoId || !selectedRemote) return null;
        return repoApi.listOpenPrs(selectedRepoId, selectedRemote);
      },
      enabled: modal.visible && !!selectedRepoId && !!selectedRemote,
    });

    const openPrs = useMemo<OpenPrInfo[]>(
      () => (prsResult?.success === true ? prsResult.data : []),
      [prsResult]
    );

    const selectedPr = useMemo(
      () =>
        openPrs.find((pr) => Number(pr.number) === selectedPrNumber) ?? null,
      [openPrs, selectedPrNumber]
    );

    let prsErrorMessage: string | null = null;
    if (prsResult?.success === false) {
      switch (prsResult.error?.type) {
        case 'cli_not_installed':
          prsErrorMessage = t('createWorkspaceFromPr.errors.cliNotInstalled', {
            provider: prsResult.error.provider,
          });
          break;
        case 'auth_failed':
          prsErrorMessage = prsResult.error.message;
          break;
        case 'unsupported_provider':
          prsErrorMessage = t(
            'createWorkspaceFromPr.errors.unsupportedProvider'
          );
          break;
        default:
          prsErrorMessage =
            prsResult.message ||
            t('createWorkspaceFromPr.errors.failedToLoadPrs');
      }
    } else if (prsError) {
      prsErrorMessage = t('createWorkspaceFromPr.errors.failedToLoadPrs');
    }

    const createMutation = useMutation({
      mutationFn: async () => {
        if (
          !selectedRepoId ||
          !selectedPrNumber ||
          !selectedRemote ||
          !selectedPr
        ) {
          throw new Error('Missing required fields');
        }
        const result = await attemptsApi.createFromPr({
          repo_id: selectedRepoId,
          pr_number: selectedPrNumber as unknown as bigint,
          pr_title: selectedPr.title,
          pr_url: selectedPr.url,
          head_branch: selectedPr.head_branch,
          base_branch: selectedPr.base_branch,
          run_setup: runSetup,
          remote_name: selectedRemote,
        });
        if (!result.success) {
          switch (result.error?.type) {
            case 'branch_fetch_failed':
              throw new Error(result.error.message);
            case 'auth_failed':
              throw new Error(result.error.message);
            case 'cli_not_installed':
              throw new Error(
                t('createWorkspaceFromPr.errors.cliNotInstalled', {
                  provider: result.error.provider,
                })
              );
            case 'pr_not_found':
              throw new Error(t('createWorkspaceFromPr.errors.prNotFound'));
            case 'unsupported_provider':
              throw new Error(
                t('createWorkspaceFromPr.errors.unsupportedProvider')
              );
            default:
              throw new Error(
                result.message ||
                  t('createWorkspaceFromPr.errors.failedToCreateWorkspace')
              );
          }
        }
        return result.data;
      },
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: ['tasks'] });
        queryClient.invalidateQueries({ queryKey: ['workspaces'] });
        modal.hide();
        navigate(toWorkspace(data.workspace.id));
      },
    });

    useEffect(() => {
      if (!modal.visible) {
        setSelectedRepoId(null);
        setSelectedRemote(null);
        setSelectedPrNumber(null);
        setRunSetup(true);
      }
    }, [modal.visible]);

    const handleOpenChange = (open: boolean) => {
      if (!open) modal.hide();
    };

    const canCreate =
      selectedRepoId &&
      selectedRemote &&
      selectedPrNumber &&
      !createMutation.isPending &&
      !isLoadingPrs;

    const handleCreate = () => {
      if (canCreate) {
        createMutation.mutate();
      }
    };

    return (
      <Dialog open={modal.visible} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{t('createWorkspaceFromPr.title')}</DialogTitle>
            <DialogDescription>
              {t('createWorkspaceFromPr.description')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{t('createWorkspaceFromPr.repositoryLabel')}</Label>
              {isLoadingRepos ? (
                <div className="text-sm text-muted-foreground">
                  {t('createWorkspaceFromPr.loadingRepositories')}
                </div>
              ) : repos.length === 0 ? (
                <div className="text-sm text-muted-foreground">
                  {t('createWorkspaceFromPr.noRepositoriesFound')}
                </div>
              ) : (
                <Select
                  value={selectedRepoId ?? undefined}
                  onValueChange={(value) => {
                    setSelectedRepoId(value);
                    setSelectedRemote(null);
                    setSelectedPrNumber(null);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={t('createWorkspaceFromPr.selectRepository')}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {repos.map((repo) => (
                      <SelectItem key={repo.id} value={repo.id}>
                        {repo.display_name || repo.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {selectedRepoId && remotes.length > 1 && (
              <div className="space-y-2">
                <Label>{t('createWorkspaceFromPr.remoteLabel')}</Label>
                {isLoadingRemotes ? (
                  <div className="text-sm text-muted-foreground">
                    {t('createWorkspaceFromPr.loadingRemotes')}
                  </div>
                ) : (
                  <Select
                    value={selectedRemote ?? undefined}
                    onValueChange={(value) => {
                      setSelectedRemote(value);
                      setSelectedPrNumber(null);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={t('createWorkspaceFromPr.selectRemote')}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {remotes.map((remote: GitRemote, index: number) => (
                        <SelectItem key={remote.name} value={remote.name}>
                          {remote.name}
                          {index === 0 &&
                            ` (${t('createWorkspaceFromPr.default')})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label>{t('createWorkspaceFromPr.pullRequestLabel')}</Label>
              {isLoadingPrs || isLoadingRemotes ? (
                <div className="text-sm text-muted-foreground">
                  {t('createWorkspaceFromPr.loadingPullRequests')}
                </div>
              ) : prsErrorMessage ? (
                <div className="text-sm text-destructive">
                  {prsErrorMessage}
                </div>
              ) : !selectedRepoId ? (
                <div className="text-sm text-muted-foreground">
                  {t('createWorkspaceFromPr.selectRepositoryFirst')}
                </div>
              ) : openPrs.length === 0 ? (
                <div className="text-sm text-muted-foreground">
                  {t('createWorkspaceFromPr.noPullRequestsFound')}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <SearchableDropdownContainer
                    items={openPrs}
                    selectedValue={selectedPrNumber?.toString() ?? null}
                    getItemKey={(pr) => String(pr.number)}
                    getItemLabel={(pr) => `#${pr.number}: ${pr.title}`}
                    filterItem={(pr, query) =>
                      String(pr.number).includes(query) ||
                      pr.title.toLowerCase().includes(query)
                    }
                    onSelect={(pr) => setSelectedPrNumber(Number(pr.number))}
                    trigger={
                      <Button
                        variant="outline"
                        className="flex-1 justify-start font-normal min-w-0"
                      >
                        <span className="truncate">
                          {selectedPr
                            ? `#${selectedPr.number}: ${selectedPr.title}`
                            : t('createWorkspaceFromPr.selectPullRequest')}
                        </span>
                      </Button>
                    }
                    contentClassName="w-[400px]"
                    placeholder={t(
                      'createWorkspaceFromPr.searchPrsPlaceholder'
                    )}
                    emptyMessage={t('createWorkspaceFromPr.noMatchingPrs')}
                    getItemBadge={null}
                    getItemIcon={null}
                  />
                  {selectedPr && (
                    <a
                      href={selectedPr.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-shrink-0 p-2 text-muted-foreground hover:text-foreground transition-colors"
                      title={t('createWorkspaceFromPr.openPrInBrowser')}
                    >
                      <ArrowSquareOut className="size-4" />
                    </a>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="run-setup"
                checked={runSetup}
                onCheckedChange={(checked) => setRunSetup(checked === true)}
              />
              <Label htmlFor="run-setup">
                {t('createWorkspaceFromPr.runSetupScript')}
              </Label>
            </div>

            {createMutation.error && (
              <div className="text-sm text-destructive">
                {createMutation.error.message}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => modal.hide()}
              disabled={createMutation.isPending}
            >
              {t('common:buttons.cancel')}
            </Button>
            <Button onClick={handleCreate} disabled={!canCreate}>
              {createMutation.isPending
                ? t('createWorkspaceFromPr.creating')
                : t('createWorkspaceFromPr.createWorkspace')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  });

export const CreateWorkspaceFromPrDialog = defineModal<
  CreateWorkspaceFromPrDialogProps,
  void
>(CreateWorkspaceFromPrDialogImpl);
