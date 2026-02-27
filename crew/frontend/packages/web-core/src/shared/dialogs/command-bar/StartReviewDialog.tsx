import { useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@vibe/ui/components/KeyboardDialog';
import { Button } from '@vibe/ui/components/Button';
import { Textarea } from '@vibe/ui/components/Textarea';
import { Label } from '@vibe/ui/components/Label';
import { Switch } from '@vibe/ui/components/Switch';
import { Checkbox } from '@vibe/ui/components/Checkbox';
import { AgentSelector } from '@/shared/components/tasks/AgentSelector';
import { ConfigSelector } from '@/shared/components/tasks/ConfigSelector';
import { useUserSystem } from '@/shared/hooks/useUserSystem';
import { useWorkspaceContext } from '@/shared/hooks/useWorkspaceContext';
import { sessionsApi } from '@/shared/lib/api';
import { useQueryClient } from '@tanstack/react-query';
import { create, useModal } from '@ebay/nice-modal-react';
import { defineModal } from '@/shared/lib/modals';
import type { BaseCodingAgent, ExecutorProfileId } from 'shared/types';

export interface StartReviewDialogProps {
  sessionId?: string;
  workspaceId: string;
  reviewMarkdown?: string;
  defaultProfile?: ExecutorProfileId | null;
  onSuccess?: (newSessionId?: string) => void;
}

const StartReviewDialogImpl = create<StartReviewDialogProps>(
  ({ sessionId, workspaceId, reviewMarkdown, defaultProfile, onSuccess }) => {
    const modal = useModal();
    const queryClient = useQueryClient();
    const { profiles, config } = useUserSystem();
    const { sessions, selectedSession, selectedSessionId, selectSession } =
      useWorkspaceContext();
    const { t } = useTranslation(['tasks', 'common']);

    const resolvedSessionId = sessionId ?? selectedSessionId;
    const resolvedSession = useMemo(() => {
      if (!resolvedSessionId) return selectedSession ?? null;
      return (
        sessions.find((session) => session.id === resolvedSessionId) ??
        selectedSession ??
        null
      );
    }, [sessions, resolvedSessionId, selectedSession]);
    const sessionExecutor = resolvedSession?.executor as BaseCodingAgent | null;

    const resolvedDefaultProfile = useMemo(() => {
      if (defaultProfile) return defaultProfile;
      if (sessionExecutor) {
        const variant =
          config?.executor_profile?.executor === sessionExecutor
            ? config.executor_profile.variant
            : null;
        return { executor: sessionExecutor, variant };
      }
      return config?.executor_profile ?? null;
    }, [defaultProfile, sessionExecutor, config?.executor_profile]);

    const [userSelectedProfile, setUserSelectedProfile] =
      useState<ExecutorProfileId | null>(null);
    const [additionalPrompt, setAdditionalPrompt] = useState('');
    const [createNewSession, setCreateNewSession] = useState(
      () => !resolvedSessionId
    );
    const [includeGitContext, setIncludeGitContext] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const effectiveProfile = userSelectedProfile ?? resolvedDefaultProfile;

    const canSubmit = Boolean(effectiveProfile && !isSubmitting);

    const handleSubmit = useCallback(async () => {
      if (!effectiveProfile) return;

      setIsSubmitting(true);
      setError(null);

      try {
        let targetSessionId = resolvedSessionId;

        if (createNewSession || !resolvedSessionId) {
          const session = await sessionsApi.create({
            workspace_id: workspaceId,
            executor: effectiveProfile.executor,
          });
          targetSessionId = session.id;

          queryClient.invalidateQueries({
            queryKey: ['workspaceSessions', workspaceId],
          });
        }

        if (!targetSessionId) {
          setError('Failed to create session');
          setIsSubmitting(false);
          return;
        }

        const promptParts = [reviewMarkdown, additionalPrompt].filter(Boolean);
        const combinedPrompt = promptParts.join('\n\n');

        await sessionsApi.startReview(targetSessionId, {
          executor_config: {
            executor: effectiveProfile.executor,
            variant: effectiveProfile.variant,
          },
          additional_prompt: combinedPrompt || null,
          use_all_workspace_commits: includeGitContext,
        });

        queryClient.invalidateQueries({
          queryKey: ['processes', workspaceId],
        });
        queryClient.invalidateQueries({
          queryKey: ['branchStatus', workspaceId],
        });

        const createdNewSession = targetSessionId !== resolvedSessionId;
        if (createdNewSession && targetSessionId) {
          selectSession(targetSessionId);
        }
        onSuccess?.(createdNewSession ? targetSessionId : undefined);
        modal.hide();
      } catch (err) {
        console.error('Failed to start review:', err);
        setError('Failed to start review. Please try again.');
      } finally {
        setIsSubmitting(false);
      }
    }, [
      effectiveProfile,
      resolvedSessionId,
      workspaceId,
      createNewSession,
      includeGitContext,
      reviewMarkdown,
      additionalPrompt,
      queryClient,
      selectSession,
      onSuccess,
      modal,
    ]);

    const handleOpenChange = (open: boolean) => {
      if (!open) modal.hide();
    };

    const handleNewSessionChange = (checked: boolean) => {
      setCreateNewSession(checked);
      if (!checked && resolvedDefaultProfile) {
        setUserSelectedProfile(resolvedDefaultProfile);
      }
    };

    const hasReviewComments = Boolean(reviewMarkdown);

    return (
      <Dialog open={modal.visible} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{t('startReviewDialog.title')}</DialogTitle>
            <DialogDescription>
              {t('startReviewDialog.description')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label
                htmlFor="additional-prompt"
                className="text-sm font-medium"
              >
                {t('startReviewDialog.additionalInstructions')}
              </Label>
              <Textarea
                id="additional-prompt"
                value={additionalPrompt}
                onChange={(e) => setAdditionalPrompt(e.target.value)}
                placeholder="Add any specific instructions for the review..."
                className="min-h-[80px] resize-none"
              />
            </div>

            {hasReviewComments && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  {t('startReviewDialog.reviewComments', {
                    count:
                      reviewMarkdown
                        ?.split('\n')
                        .filter((l) => l.startsWith('-')).length ?? 0,
                  })}
                </Label>
                <div className="text-sm text-muted-foreground bg-muted/50 rounded-md p-3 max-h-32 overflow-y-auto">
                  <pre className="whitespace-pre-wrap font-sans text-xs">
                    {reviewMarkdown}
                  </pre>
                </div>
              </div>
            )}

            {error && <div className="text-sm text-destructive">{error}</div>}

            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="include-git-context"
                  checked={includeGitContext}
                  onCheckedChange={(checked) =>
                    setIncludeGitContext(checked === true)
                  }
                />
                <Label
                  htmlFor="include-git-context"
                  className="cursor-pointer text-sm"
                >
                  {t('startReviewDialog.includeGitContext')}
                </Label>
              </div>
              <p className="text-xs text-muted-foreground ml-6">
                {t('startReviewDialog.includeGitContextDescription')}
              </p>
            </div>

            {profiles && (
              <div className="flex gap-3 flex-col sm:flex-row">
                <AgentSelector
                  profiles={profiles}
                  selectedExecutorProfile={effectiveProfile}
                  onChange={setUserSelectedProfile}
                  disabled={!createNewSession}
                  showLabel={false}
                />
                <ConfigSelector
                  profiles={profiles}
                  selectedExecutorProfile={effectiveProfile}
                  onChange={setUserSelectedProfile}
                  showLabel={false}
                />
              </div>
            )}
          </div>

          <DialogFooter className="sm:!justify-between">
            <Button
              variant="outline"
              onClick={() => modal.hide()}
              disabled={isSubmitting}
            >
              {t('common:buttons.cancel')}
            </Button>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Switch
                  id="new-session-switch"
                  checked={createNewSession}
                  onCheckedChange={handleNewSessionChange}
                  disabled={!resolvedSessionId}
                  aria-label={t('startReviewDialog.newSession')}
                />
                <Label
                  htmlFor="new-session-switch"
                  className="text-sm cursor-pointer"
                >
                  {t('startReviewDialog.newSession')}
                </Label>
              </div>
              <Button onClick={handleSubmit} disabled={!canSubmit}>
                {isSubmitting
                  ? t('actionsMenu.startingReview')
                  : t('actionsMenu.startReview')}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }
);

export const StartReviewDialog = defineModal<StartReviewDialogProps, void>(
  StartReviewDialogImpl
);
