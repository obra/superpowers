import { useState } from 'react';
import WYSIWYGEditor from '@/shared/components/WYSIWYGEditor';
import { BaseAgentCapability } from 'shared/types';
import type { WorkspaceWithSession } from '@/shared/types/attempt';
import { useUserSystem } from '@/shared/hooks/useUserSystem';
import { useRetryUi } from '@/shared/hooks/useRetryUi';
import { useAttemptExecution } from '@/shared/hooks/useAttemptExecution';
import { RetryEditorInline } from './RetryEditorInline';

const UserMessage = ({
  content,
  executionProcessId,
  taskAttempt,
}: {
  content: string;
  executionProcessId?: string;
  taskAttempt?: WorkspaceWithSession;
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const { capabilities } = useUserSystem();
  const { activeRetryProcessId, setActiveRetryProcessId, isProcessGreyed } =
    useRetryUi();
  const { isAttemptRunning } = useAttemptExecution(taskAttempt?.id);

  const canFork = !!(
    taskAttempt?.session?.executor &&
    capabilities?.[taskAttempt.session.executor]?.includes(
      BaseAgentCapability.SESSION_FORK
    )
  );

  const startRetry = () => {
    if (!executionProcessId || !taskAttempt) return;
    setIsEditing(true);
    setActiveRetryProcessId(executionProcessId);
  };

  const onCancelled = () => {
    setIsEditing(false);
    setActiveRetryProcessId(null);
  };

  const showRetryEditor =
    !!executionProcessId &&
    isEditing &&
    activeRetryProcessId === executionProcessId;
  const greyed =
    !!executionProcessId &&
    isProcessGreyed(executionProcessId) &&
    !showRetryEditor;

  // Only show retry button when allowed (has process, can fork, not running)
  const canRetry = executionProcessId && canFork && !isAttemptRunning;

  return (
    <div className={`py-2 ${greyed ? 'opacity-50 pointer-events-none' : ''}`}>
      <div className="bg-background px-4 py-2 text-sm">
        <div className="py-3">
          {showRetryEditor && taskAttempt ? (
            <RetryEditorInline
              attempt={taskAttempt}
              executionProcessId={executionProcessId}
              initialContent={content}
              onCancelled={onCancelled}
            />
          ) : (
            <WYSIWYGEditor
              value={content}
              disabled
              className="whitespace-pre-wrap break-words flex flex-col gap-1 font-light"
              taskAttemptId={taskAttempt?.id}
              onEdit={canRetry ? startRetry : undefined}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default UserMessage;
