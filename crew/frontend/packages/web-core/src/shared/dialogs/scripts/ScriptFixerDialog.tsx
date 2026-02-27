import { useState, useEffect, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { create, useModal } from '@ebay/nice-modal-react';
import { useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@vibe/ui/components/KeyboardDialog';
import { Button } from '@vibe/ui/components/Button';
import { Label } from '@vibe/ui/components/Label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@vibe/ui/components/Select';
import { AutoExpandingTextarea } from '@vibe/ui/components/AutoExpandingTextarea';
import { VirtualizedProcessLogs } from '@/shared/components/VirtualizedProcessLogs';
import { RunningDots } from '@vibe/ui/components/RunningDots';
import { defineModal } from '@/shared/lib/modals';
import { repoApi, attemptsApi } from '@/shared/lib/api';
import { useLogStream } from '@/shared/hooks/useLogStream';
import { useExecutionProcesses } from '@/shared/hooks/useExecutionProcesses';
import type { RepoWithTargetBranch, PatchType, UpdateRepo } from 'shared/types';

export type ScriptType = 'setup' | 'cleanup' | 'dev_server' | 'archive';

export interface ScriptFixerDialogProps {
  scriptType: ScriptType;
  repos: RepoWithTargetBranch[];
  workspaceId: string;
  sessionId?: string;
  initialRepoId?: string;
}

export type ScriptFixerDialogResult = {
  action: 'saved' | 'saved_and_tested' | 'canceled';
};

type LogEntry = Extract<PatchType, { type: 'STDOUT' } | { type: 'STDERR' }>;

const ScriptFixerDialogImpl = create<ScriptFixerDialogProps>(
  ({ scriptType, repos, workspaceId, sessionId, initialRepoId }) => {
    const modal = useModal();
    const { t } = useTranslation(['tasks', 'common']);
    const queryClient = useQueryClient();

    // State
    const [selectedRepoId, setSelectedRepoId] = useState<string>(
      initialRepoId || repos[0]?.id || ''
    );
    const [script, setScript] = useState('');
    const [originalScript, setOriginalScript] = useState('');
    const [isLoadingRepo, setIsLoadingRepo] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isTesting, setIsTesting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    // Track session ID locally so we can update it after starting a script
    const [activeSessionId, setActiveSessionId] = useState<string | undefined>(
      sessionId
    );

    // Get execution processes for the session to find latest script process
    const { executionProcesses } = useExecutionProcesses(activeSessionId);

    // Find the latest process for this script type
    const latestProcess = useMemo(() => {
      const runReason =
        scriptType === 'setup'
          ? 'setupscript'
          : scriptType === 'cleanup'
            ? 'cleanupscript'
            : scriptType === 'archive'
              ? 'archivescript'
              : 'devserver';
      const filtered = executionProcesses.filter(
        (p) => p.run_reason === runReason && !p.dropped
      );
      // Sort by created_at descending and return the first one
      return filtered.sort(
        (a, b) =>
          new Date(b.created_at as unknown as string).getTime() -
          new Date(a.created_at as unknown as string).getTime()
      )[0];
    }, [executionProcesses, scriptType]);

    // Stream logs for the latest process
    const { logs: rawLogs, error: logsError } = useLogStream(
      latestProcess?.id ?? ''
    );
    const logs: LogEntry[] = rawLogs.filter(
      (l): l is LogEntry => l.type === 'STDOUT' || l.type === 'STDERR'
    );

    // Compute status for the latest process
    const isProcessRunning = latestProcess?.status === 'running';
    const isProcessCompleted = latestProcess?.status === 'completed';
    const isProcessKilled = latestProcess?.status === 'killed';
    const isProcessFailed = latestProcess?.status === 'failed';
    // exit_code can be null, number, or BigInt - convert to Number for comparison
    const exitCode = latestProcess?.exit_code;
    const isExitCodeZero = exitCode == null || Number(exitCode) === 0;
    const isProcessSuccessful = isProcessCompleted && isExitCodeZero;
    const hasProcessError =
      isProcessFailed || (isProcessCompleted && !isExitCodeZero);

    // Reset selectedRepoId on dialog re-open
    useEffect(() => {
      if (!initialRepoId) return;
      setSelectedRepoId(initialRepoId);
    }, [initialRepoId]);

    // Fetch the selected repo's script
    useEffect(() => {
      if (!selectedRepoId) return;

      let cancelled = false;
      setIsLoadingRepo(true);
      setError(null);

      (async () => {
        try {
          const repo = await repoApi.getById(selectedRepoId);
          if (cancelled) return;

          const scriptContent =
            scriptType === 'setup'
              ? (repo.setup_script ?? '')
              : scriptType === 'cleanup'
                ? (repo.cleanup_script ?? '')
                : scriptType === 'archive'
                  ? (repo.archive_script ?? '')
                  : (repo.dev_server_script ?? '');

          setScript(scriptContent);
          setOriginalScript(scriptContent);
        } catch (err) {
          if (cancelled) return;
          setError(
            err instanceof Error ? err.message : t('common:errors.generic')
          );
        } finally {
          if (!cancelled) setIsLoadingRepo(false);
        }
      })();

      return () => {
        cancelled = true;
      };
    }, [selectedRepoId, scriptType, t]);

    const hasChanges = script !== originalScript;

    const handleClose = useCallback(() => {
      modal.resolve({ action: 'canceled' } as ScriptFixerDialogResult);
      modal.hide();
    }, [modal]);

    const handleOpenChange = (open: boolean) => {
      if (!open) {
        handleClose();
      }
    };

    const handleSave = useCallback(async () => {
      if (!selectedRepoId) return;

      setIsSaving(true);
      setError(null);

      try {
        // Only send the field being edited - other fields will be preserved by the backend
        const scriptValue = script.trim() || null;
        const updateData: Partial<UpdateRepo> =
          scriptType === 'setup'
            ? { setup_script: scriptValue }
            : scriptType === 'cleanup'
              ? { cleanup_script: scriptValue }
              : scriptType === 'archive'
                ? { archive_script: scriptValue }
                : { dev_server_script: scriptValue };

        await repoApi.update(selectedRepoId, updateData as UpdateRepo);

        // Invalidate repos cache
        queryClient.invalidateQueries({ queryKey: ['repos'] });

        setOriginalScript(script);
        modal.resolve({ action: 'saved' } as ScriptFixerDialogResult);
        modal.hide();
      } catch (err) {
        setError(
          err instanceof Error ? err.message : t('common:errors.generic')
        );
      } finally {
        setIsSaving(false);
      }
    }, [selectedRepoId, script, scriptType, queryClient, modal, t]);

    const handleSaveAndTest = useCallback(async () => {
      if (!selectedRepoId) return;

      setIsTesting(true);
      setError(null);

      try {
        // Only send the field being edited - other fields will be preserved by the backend
        const scriptValue = script.trim() || null;
        const updateData: Partial<UpdateRepo> =
          scriptType === 'setup'
            ? { setup_script: scriptValue }
            : scriptType === 'cleanup'
              ? { cleanup_script: scriptValue }
              : scriptType === 'archive'
                ? { archive_script: scriptValue }
                : { dev_server_script: scriptValue };

        await repoApi.update(selectedRepoId, updateData as UpdateRepo);

        // Invalidate repos cache
        queryClient.invalidateQueries({ queryKey: ['repos'] });

        setOriginalScript(script);

        // Then run the script and capture the session ID from the returned process
        if (scriptType === 'setup') {
          const result = await attemptsApi.runSetupScript(workspaceId);
          if (result.success) {
            setActiveSessionId(result.data.session_id);
          }
        } else if (scriptType === 'cleanup') {
          const result = await attemptsApi.runCleanupScript(workspaceId);
          if (result.success) {
            setActiveSessionId(result.data.session_id);
          }
        } else if (scriptType === 'archive') {
          const result = await attemptsApi.runArchiveScript(workspaceId);
          if (result.success) {
            setActiveSessionId(result.data.session_id);
          }
        } else {
          // Start the dev server
          const processes = await attemptsApi.startDevServer(workspaceId);
          if (processes.length > 0) {
            setActiveSessionId(processes[0].session_id);
          }
        }

        // Keep dialog open so user can see the new execution logs
        // The logs will update automatically via useLogStream/useExecutionProcesses
      } catch (err) {
        setError(
          err instanceof Error ? err.message : t('common:errors.generic')
        );
      } finally {
        setIsTesting(false);
      }
    }, [selectedRepoId, script, scriptType, workspaceId, queryClient, t]);

    const dialogTitle =
      scriptType === 'setup'
        ? t('scriptFixer.setupScriptTitle')
        : scriptType === 'cleanup'
          ? t('scriptFixer.cleanupScriptTitle')
          : scriptType === 'archive'
            ? t('scriptFixer.archiveScriptTitle')
            : t('scriptFixer.devServerTitle');

    return (
      <Dialog
        open={modal.visible}
        onOpenChange={handleOpenChange}
        className="max-w-4xl w-[90vw]"
      >
        <DialogContent className="max-h-[80vh] flex flex-col overflow-hidden">
          <DialogHeader>
            <DialogTitle>{dialogTitle}</DialogTitle>
          </DialogHeader>

          <div className="flex-1 flex flex-col gap-4 min-h-0 min-w-0 overflow-hidden">
            {/* Repo selector (only show if multiple repos) */}
            {repos.length > 1 && (
              <div className="flex items-center gap-2">
                <Label htmlFor="repo-select" className="shrink-0">
                  {t('scriptFixer.selectRepo')}
                </Label>
                <Select
                  value={selectedRepoId}
                  onValueChange={setSelectedRepoId}
                >
                  <SelectTrigger id="repo-select" className="flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {repos.map((repo) => (
                      <SelectItem key={repo.id} value={repo.id}>
                        {repo.display_name || repo.path}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Script editor */}
            <div className="flex flex-col gap-2 flex-1 min-h-0 min-w-0">
              <Label>{t('scriptFixer.scriptLabel')}</Label>
              <div className="bg-panel flex-1 min-h-[150px] max-h-[300px] overflow-auto border rounded-md min-w-0">
                {isLoadingRepo ? (
                  <div className="h-full flex items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : (
                  <AutoExpandingTextarea
                    value={script}
                    onChange={(e) => setScript(e.target.value)}
                    className="font-mono text-sm p-3 border-0 min-h-full bg-panel"
                    placeholder={
                      scriptType === 'setup'
                        ? 'npm install'
                        : scriptType === 'cleanup'
                          ? 'npm run lint'
                          : 'npm run dev'
                    }
                    disableInternalScroll
                  />
                )}
              </div>
            </div>

            {/* Logs section */}
            <div
              className="flex flex-col gap-2 min-h-0 min-w-0"
              style={{ height: '200px' }}
            >
              <div className="flex items-center justify-between gap-2">
                <Label>{t('scriptFixer.logsLabel')}</Label>
                {/* Status indicator */}
                {latestProcess && (
                  <div className="flex items-center gap-2 text-sm">
                    {isProcessRunning ? (
                      <>
                        <RunningDots />
                        <span className="text-muted-foreground">
                          {t('scriptFixer.statusRunning')}
                        </span>
                      </>
                    ) : isProcessSuccessful ? (
                      <>
                        <span className="size-2 rounded-full bg-success" />
                        <span className="text-success">
                          {t('scriptFixer.statusSuccess')}
                        </span>
                      </>
                    ) : hasProcessError ? (
                      <>
                        <span className="size-2 rounded-full bg-destructive bg-error" />
                        <span className="text-destructive text-error">
                          {t('scriptFixer.statusFailed', {
                            exitCode: Number(latestProcess.exit_code ?? 0),
                          })}
                        </span>
                      </>
                    ) : isProcessKilled ? (
                      <>
                        <span className="size-2 rounded-full bg-low" />
                        <span className="text-muted-foreground">
                          {t('scriptFixer.statusKilled')}
                        </span>
                      </>
                    ) : null}
                  </div>
                )}
              </div>
              <div className="bg-secondary py-base flex-1 border rounded-md bg-muted overflow-hidden min-w-0">
                {latestProcess ? (
                  <VirtualizedProcessLogs
                    logs={logs}
                    error={logsError}
                    searchQuery=""
                    matchIndices={[]}
                    currentMatchIndex={-1}
                  />
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                    {t('scriptFixer.noLogs')}
                  </div>
                )}
              </div>
            </div>

            {/* Error display */}
            {error && <div className="text-destructive text-sm">{error}</div>}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={handleClose}>
              {t('common:buttons.close')}
            </Button>
            <Button
              variant="outline"
              onClick={handleSave}
              disabled={!hasChanges || isSaving || isTesting}
            >
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('scriptFixer.saveButton')}
            </Button>
            <Button
              onClick={handleSaveAndTest}
              disabled={isSaving || isTesting}
            >
              {isTesting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('scriptFixer.saveAndTestButton')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }
);

export const ScriptFixerDialog = defineModal<
  ScriptFixerDialogProps,
  ScriptFixerDialogResult
>(ScriptFixerDialogImpl);
