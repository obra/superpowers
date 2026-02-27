import { useCallback, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import WYSIWYGEditor from '@/shared/components/WYSIWYGEditor';
import { cn } from '@/shared/lib/utils';
import { VariantSelector } from '@/shared/components/VariantSelector';
import { Button } from '@vibe/ui/components/Button';
import { Alert, AlertDescription } from '@vibe/ui/components/Alert';
import { AlertCircle, Loader2, Paperclip, Send, X } from 'lucide-react';
import { imagesApi } from '@/shared/lib/api';
import type { WorkspaceWithSession } from '@/shared/types/attempt';
import { useAttemptExecution } from '@/shared/hooks/useAttemptExecution';
import { useUserSystem } from '@/shared/hooks/useUserSystem';
import { useBranchStatus } from '@/shared/hooks/useBranchStatus';
import { useVariant } from '@/shared/hooks/useVariant';
import { useRetryProcess } from '@/shared/hooks/useRetryProcess';
import { executorConfigFromAction } from '@/shared/lib/executor';

export function RetryEditorInline({
  attempt,
  executionProcessId,
  initialContent,
  onCancelled,
}: {
  attempt: WorkspaceWithSession;
  executionProcessId: string;
  initialContent: string;
  onCancelled?: () => void;
}) {
  const { t } = useTranslation(['common']);
  const attemptId = attempt.id;
  const { isAttemptRunning, attemptData } = useAttemptExecution(attemptId);
  const { data: branchStatus } = useBranchStatus(attemptId);
  const { profiles } = useUserSystem();

  const [message, setMessage] = useState(initialContent);
  const [sendError, setSendError] = useState<string | null>(null);

  // Get sessionId from attempt's session
  const sessionId = attempt.session?.id;

  // Extract executor and variant from the process being retried
  const processProfile = useMemo(() => {
    const process = attemptData.processes?.find(
      (p) => p.id === executionProcessId
    );
    if (!process?.executor_action) return null;
    return executorConfigFromAction(process.executor_action);
  }, [attemptData.processes, executionProcessId]);

  const { selectedVariant, setSelectedVariant } = useVariant({
    processVariant: processProfile?.variant ?? null,
    scratchVariant: undefined,
  });

  const retryMutation = useRetryProcess(
    sessionId ?? '',
    () => onCancelled?.(),
    (err) => setSendError((err as Error)?.message || 'Failed to send retry')
  );

  const isSending = retryMutation.isPending;
  const canSend =
    !isAttemptRunning && !!message.trim() && !!sessionId && !!processProfile;

  const onCancel = () => {
    onCancelled?.();
  };

  const onSend = useCallback(() => {
    if (!canSend || !processProfile) return;
    setSendError(null);
    retryMutation.mutate({
      message,
      executor: processProfile.executor,
      variant: selectedVariant,
      executionProcessId,
      branchStatus,
      processes: attemptData.processes,
    });
  }, [
    canSend,
    retryMutation,
    message,
    processProfile,
    selectedVariant,
    executionProcessId,
    branchStatus,
    attemptData.processes,
  ]);

  const handleCmdEnter = useCallback(() => {
    if (canSend && !isSending) {
      onSend();
    }
  }, [canSend, isSending, onSend]);

  // Handle image paste - upload to container and insert markdown
  const handlePasteFiles = useCallback(
    async (files: File[]) => {
      for (const file of files) {
        try {
          const response = await imagesApi.uploadForAttempt(attemptId, file);
          const imageMarkdown = `![${response.original_name}](${response.file_path})`;
          setMessage((prev) =>
            prev ? `${prev}\n\n${imageMarkdown}` : imageMarkdown
          );
        } catch (error) {
          console.error('Failed to upload image:', error);
        }
      }
    },
    [attemptId]
  );

  // Attachment button handlers
  const fileInputRef = useRef<HTMLInputElement>(null);
  const handleAttachClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);
  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []).filter((f) =>
        f.type.startsWith('image/')
      );
      if (files.length > 0) {
        handlePasteFiles(files);
      }
      e.target.value = '';
    },
    [handlePasteFiles]
  );

  return (
    <div className="space-y-2">
      <div className="relative">
        <WYSIWYGEditor
          placeholder="Edit and resend your message..."
          value={message}
          onChange={setMessage}
          disabled={isSending}
          onCmdEnter={handleCmdEnter}
          onPasteFiles={handlePasteFiles}
          className={cn('min-h-[40px]', 'bg-background')}
          taskAttemptId={attemptId}
        />
        {isSending && (
          <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center bg-background/60">
            <Loader2 className="h-4 w-4 animate-spin" />
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        <VariantSelector
          selectedVariant={selectedVariant}
          onChange={setSelectedVariant}
          currentProfile={profiles?.[attempt.session?.executor ?? ''] ?? null}
        />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleFileInputChange}
        />
        <div className="ml-auto flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleAttachClick}
            disabled={isSending}
            title="Attach image"
            aria-label="Attach image"
          >
            <Paperclip className="h-3 w-3" />
          </Button>
          <Button variant="outline" onClick={onCancel} disabled={isSending}>
            <X className="h-3 w-3 mr-1" />{' '}
            {t('buttons.cancel', { ns: 'common' })}
          </Button>
          <Button onClick={onSend} disabled={!canSend || isSending}>
            <Send className="h-3 w-3 mr-1" />{' '}
            {t('buttons.send', { ns: 'common', defaultValue: 'Send' })}
          </Button>
        </div>
      </div>

      {sendError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{sendError}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
