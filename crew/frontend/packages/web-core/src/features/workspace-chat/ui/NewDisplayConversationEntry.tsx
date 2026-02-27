import { useMemo, useCallback, useLayoutEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import {
  ActionType,
  BaseAgentCapability,
  NormalizedEntry,
  ToolStatus,
  ToolResult,
  TodoItem,
  type RepoWithTargetBranch,
} from 'shared/types';
import type { WorkspaceWithSession } from '@/shared/types/attempt';
import { parseDiffStats } from '@/shared/lib/diffStatsParser';
import {
  usePersistedExpanded,
  type PersistKey,
} from '@/shared/stores/useUiPreferencesStore';
import { getActualTheme } from '@/shared/lib/theme';
import { getFileIcon } from '@/shared/lib/fileTypeIcon';
import { useUserSystem } from '@/shared/hooks/useUserSystem';
import { useTheme } from '@/shared/hooks/useTheme';
import WYSIWYGEditor from '@/shared/components/WYSIWYGEditor';
import DisplayConversationEntry from '@/shared/components/NormalizedConversation/DisplayConversationEntry';
import { useMessageEditContext } from '../model/contexts/MessageEditContext';
import type { UseResetProcessResult } from '../model/hooks/useResetProcess';
import { useChangesView } from '@/shared/hooks/useChangesView';
import { useLogsPanel } from '@/shared/hooks/useLogsPanel';
import { useWorkspaceContext } from '@/shared/hooks/useWorkspaceContext';
import { cn } from '@/shared/lib/utils';
import {
  ScriptFixerDialog,
  type ScriptType,
} from '@/shared/dialogs/scripts/ScriptFixerDialog';
import { ChatToolSummary } from '@vibe/ui/components/ChatToolSummary';
import { ChatTodoList } from '@vibe/ui/components/ChatTodoList';
import {
  ChatFileEntry,
  type ChatFileEntryDiffInput,
} from '@vibe/ui/components/ChatFileEntry';
import { ChatApprovalCard } from '@vibe/ui/components/ChatApprovalCard';
import { ChatUserMessage } from '@vibe/ui/components/ChatUserMessage';
import { ChatAssistantMessage } from '@vibe/ui/components/ChatAssistantMessage';
import { ChatSystemMessage } from '@vibe/ui/components/ChatSystemMessage';
import { ChatThinkingMessage } from '@vibe/ui/components/ChatThinkingMessage';
import { ChatErrorMessage } from '@vibe/ui/components/ChatErrorMessage';
import { ChatScriptEntry } from '@vibe/ui/components/ChatScriptEntry';
import { ChatSubagentEntry } from '@vibe/ui/components/ChatSubagentEntry';
import { ChatAggregatedToolEntries } from '@vibe/ui/components/ChatAggregatedToolEntries';
import { ChatAggregatedDiffEntries } from '@vibe/ui/components/ChatAggregatedDiffEntries';
import { ChatCollapsedThinking } from '@vibe/ui/components/ChatCollapsedThinking';
import { ChatMarkdown } from '@vibe/ui/components/ChatMarkdown';
import {
  DiffViewBody,
  useDiffData,
} from '@vibe/ui/components/PierreConversationDiff';
import { inIframe, openFileInVSCode } from '@/integrations/vscode/bridge';
import { useDiffViewMode } from '@/shared/stores/useDiffViewStore';
import type {
  AggregatedPatchGroup,
  AggregatedDiffGroup,
  AggregatedThinkingGroup,
} from '@/shared/hooks/useConversationHistory/types';
import {
  FileTextIcon,
  ListMagnifyingGlassIcon,
  GlobeIcon,
  PencilSimpleIcon,
} from '@phosphor-icons/react';

type Props = {
  expansionKey: string;
  executionProcessId: string;
  taskAttempt: WorkspaceWithSession;
  resetAction: UseResetProcessResult;
  entry: NormalizedEntry | null;
  aggregatedGroup: AggregatedPatchGroup | null;
  aggregatedDiffGroup: AggregatedDiffGroup | null;
  aggregatedThinkingGroup: AggregatedThinkingGroup | null;
};

type FileEditAction = Extract<ActionType, { action: 'file_edit' }>;

/**
 * Generate tool summary text from action type
 */
function getToolSummary(
  entryType: Extract<NormalizedEntry['entry_type'], { type: 'tool_use' }>,
  t: TFunction<'common'>
): string {
  const { action_type, tool_name } = entryType;

  switch (action_type.action) {
    case 'file_read':
      return t('conversation.toolSummary.read', { path: action_type.path });
    case 'search':
      return t('conversation.toolSummary.searched', {
        query: action_type.query,
      });
    case 'web_fetch':
      return t('conversation.toolSummary.fetched', { url: action_type.url });
    case 'command_run':
      return action_type.command || t('conversation.toolSummary.ranCommand');
    case 'task_create':
      return t('conversation.toolSummary.createdTask', {
        description: action_type.description,
      });
    case 'todo_management':
      return t('conversation.toolSummary.todoOperation', {
        operation: action_type.operation,
      });
    case 'tool':
      return tool_name || t('conversation.tool');
    default:
      return tool_name || t('conversation.tool');
  }
}

/**
 * Extract the actual tool output from action_type.result
 * The output location depends on the action type:
 * - command_run: result.output
 * - tool: result.value (JSON stringified if object)
 * - others: fall back to entry.content
 */
function getToolOutput(
  entryType: Extract<NormalizedEntry['entry_type'], { type: 'tool_use' }>,
  entryContent: string
): string {
  const { action_type } = entryType;

  switch (action_type.action) {
    case 'command_run':
      return action_type.result?.output ?? entryContent;
    case 'tool':
      if (action_type.result?.value != null) {
        return typeof action_type.result.value === 'string'
          ? action_type.result.value
          : JSON.stringify(action_type.result.value, null, 2);
      }
      return entryContent;
    default:
      return entryContent;
  }
}

/**
 * Extract the command from action_type for command_run actions
 */
function getToolCommand(
  entryType: Extract<NormalizedEntry['entry_type'], { type: 'tool_use' }>
): string | undefined {
  const { action_type } = entryType;

  if (action_type.action === 'command_run') {
    return action_type.command;
  }
  return undefined;
}

/**
 * Render tool_use entry types with appropriate components
 */
function renderToolUseEntry(
  entryType: Extract<NormalizedEntry['entry_type'], { type: 'tool_use' }>,
  entry: NormalizedEntry,
  props: Props,
  t: TFunction<'common'>
): React.ReactNode {
  const { expansionKey, executionProcessId, taskAttempt } = props;
  const { action_type, status } = entryType;

  // File edit - use ChatFileEntry
  if (action_type.action === 'file_edit') {
    const fileEditAction = action_type as FileEditAction;
    return (
      <>
        {fileEditAction.changes.map((change, idx) => (
          <FileEditEntry
            key={idx}
            path={fileEditAction.path}
            change={change}
            expansionKey={`edit:${expansionKey}:${idx}`}
            status={status}
          />
        ))}
      </>
    );
  }

  // Plan presentation - use ChatApprovalCard
  if (action_type.action === 'plan_presentation') {
    return (
      <PlanEntry
        plan={action_type.plan}
        expansionKey={expansionKey}
        workspaceId={taskAttempt?.id}
        status={status}
      />
    );
  }

  // Todo management - use ChatTodoList
  if (action_type.action === 'todo_management') {
    return (
      <TodoManagementEntry
        todos={action_type.todos}
        expansionKey={expansionKey}
      />
    );
  }

  // Task/Subagent - use ChatSubagentEntry
  if (action_type.action === 'task_create') {
    return (
      <SubagentEntry
        description={action_type.description}
        subagentType={action_type.subagent_type}
        result={action_type.result}
        expansionKey={expansionKey}
        status={status}
        workspaceId={taskAttempt?.id}
      />
    );
  }

  // Script entries (Setup Script, Cleanup Script, Archive Script, Tool Install Script)
  const scriptToolNames = [
    'Setup Script',
    'Cleanup Script',
    'Archive Script',
    'Tool Install Script',
  ];
  if (
    action_type.action === 'command_run' &&
    scriptToolNames.includes(entryType.tool_name)
  ) {
    const exitCode =
      action_type.result?.exit_status?.type === 'exit_code'
        ? action_type.result.exit_status.code
        : null;

    return (
      <ScriptEntryWithFix
        title={entryType.tool_name}
        processId={executionProcessId ?? ''}
        exitCode={exitCode}
        status={status}
        workspaceId={taskAttempt?.id}
        sessionId={taskAttempt?.session?.id}
      />
    );
  }

  // Generic tool pending approval - use plan-style card
  if (status.status === 'pending_approval') {
    return (
      <GenericToolApprovalEntry
        toolName={entryType.tool_name}
        content={entry.content}
        expansionKey={expansionKey}
        workspaceId={taskAttempt?.id}
        status={status}
      />
    );
  }

  // Other tool uses - use ChatToolSummary
  return (
    <ToolSummaryEntry
      summary={getToolSummary(entryType, t)}
      expansionKey={expansionKey}
      status={status}
      content={getToolOutput(entryType, entry.content)}
      toolName={entryType.tool_name}
      command={getToolCommand(entryType)}
      actionType={action_type.action}
    />
  );
}

function NewDisplayConversationEntry(props: Props) {
  const { t } = useTranslation('common');
  const { capabilities } = useUserSystem();
  const {
    entry,
    aggregatedGroup,
    aggregatedDiffGroup,
    aggregatedThinkingGroup,
    expansionKey,
    executionProcessId,
    taskAttempt,
    resetAction,
  } = props;
  const executorCanFork = !!(
    taskAttempt?.session?.executor &&
    capabilities?.[taskAttempt.session.executor]?.includes(
      BaseAgentCapability.SESSION_FORK
    )
  );

  // Handle aggregated groups (consecutive file_read or search entries)
  if (aggregatedGroup) {
    return <AggregatedGroupEntry group={aggregatedGroup} />;
  }

  // Handle aggregated diff groups (consecutive file_edit entries for same file)
  if (aggregatedDiffGroup) {
    return <AggregatedDiffGroupEntry group={aggregatedDiffGroup} />;
  }

  // Handle aggregated thinking groups (thinking entries in previous turns)
  if (aggregatedThinkingGroup) {
    return (
      <AggregatedThinkingGroupEntry
        group={aggregatedThinkingGroup}
        taskAttemptId={taskAttempt?.id}
      />
    );
  }

  // If no entry, return null (shouldn't happen in normal usage)
  if (!entry) {
    return null;
  }

  const entryType = entry.entry_type;

  switch (entryType.type) {
    case 'tool_use':
      return renderToolUseEntry(entryType, entry, props, t);

    case 'user_message':
      return (
        <UserMessageEntry
          content={entry.content}
          expansionKey={expansionKey}
          workspaceId={taskAttempt?.id}
          executionProcessId={executionProcessId}
          executorCanFork={executorCanFork}
          resetAction={resetAction}
        />
      );

    case 'assistant_message':
      return (
        <AssistantMessageEntry
          content={entry.content}
          workspaceId={taskAttempt?.id}
        />
      );

    case 'system_message':
      return (
        <SystemMessageEntry
          content={entry.content}
          expansionKey={expansionKey}
        />
      );

    case 'thinking':
      return (
        <ChatThinkingMessage
          content={entry.content}
          taskAttemptId={taskAttempt?.id}
          renderMarkdown={({ content, workspaceId, className }) => (
            <AppChatMarkdown
              content={content}
              workspaceId={workspaceId}
              className={className}
              maxWidth={undefined}
            />
          )}
        />
      );

    case 'error_message':
      return (
        <ErrorMessageEntry
          content={entry.content}
          expansionKey={expansionKey}
        />
      );

    case 'next_action':
      // The new design doesn't need the next action bar
      return null;

    case 'token_usage_info':
      // Displayed in the chat header as the context-usage gauge
      return null;

    case 'user_feedback':
    case 'user_answered_questions':
    case 'loading':
      // Fallback to legacy component for these entry types
      return (
        <DisplayConversationEntry
          entry={entry}
          expansionKey={expansionKey}
          executionProcessId={executionProcessId}
          taskAttempt={taskAttempt}
        />
      );

    default: {
      // Exhaustive check - TypeScript will error if a case is missing
      const _exhaustiveCheck: never = entryType;
      return _exhaustiveCheck;
    }
  }
}

/**
 * File edit entry with expandable diff
 */
function FileEntryDiffBody({
  diffContent,
}: {
  diffContent: ChatFileEntryDiffInput;
}) {
  const { theme } = useTheme();
  const actualTheme = getActualTheme(theme);
  const diffMode = useDiffViewMode();
  const diffData = useDiffData(diffContent);

  if (!diffData.isValid) {
    return null;
  }

  return (
    <DiffViewBody
      fileDiffMetadata={diffData.fileDiffMetadata}
      unifiedDiff={diffData.unifiedDiff}
      isValid={diffData.isValid}
      hideLineNumbers={diffData.hideLineNumbers}
      theme={actualTheme}
      diffMode={diffMode}
    />
  );
}

function AppChatMarkdown({
  content,
  workspaceId,
  className,
  maxWidth,
}: {
  content: string;
  workspaceId: string | undefined;
  className: string | undefined;
  maxWidth: string | undefined;
}) {
  const { viewFileInChanges, findMatchingDiffPath } = useChangesView();

  return (
    <ChatMarkdown
      content={content}
      workspaceId={workspaceId}
      className={className}
      maxWidth={maxWidth}
      renderContent={({ content, className, workspaceId }) => (
        <WYSIWYGEditor
          value={content}
          disabled
          className={className}
          taskAttemptId={workspaceId}
          findMatchingDiffPath={findMatchingDiffPath}
          onCodeClick={viewFileInChanges}
        />
      )}
    />
  );
}

function FileEditEntry({
  path,
  change,
  expansionKey,
  status,
}: {
  path: string;
  change: FileEditAction['changes'][number];
  expansionKey: string;
  status: ToolStatus;
}) {
  // Auto-expand when pending approval
  const pendingApproval = status.status === 'pending_approval';
  const [expanded, toggle] = usePersistedExpanded(
    expansionKey as PersistKey,
    pendingApproval
  );
  const { theme } = useTheme();
  const actualTheme = getActualTheme(theme);
  const { viewFileInChanges, diffPaths } = useChangesView();
  const FileIcon = useMemo(
    () => getFileIcon(path, actualTheme),
    [path, actualTheme]
  );
  const isVSCode = inIframe();

  // Calculate diff stats for edit changes
  const { additions, deletions } = useMemo(() => {
    if (change.action === 'edit' && change.unified_diff) {
      return parseDiffStats(change.unified_diff);
    }
    return { additions: undefined, deletions: undefined };
  }, [change]);

  // For write actions, count as all additions
  const writeAdditions =
    change.action === 'write' ? change.content.split('\n').length : undefined;

  // Build diff content for rendering when expanded
  const diffContent: ChatFileEntryDiffInput | undefined = useMemo(() => {
    if (change.action === 'edit' && change.unified_diff) {
      return {
        type: 'unified',
        path,
        unifiedDiff: change.unified_diff,
        hasLineNumbers: change.has_line_numbers ?? true,
      };
    }
    // For write actions, use content-based diff (empty old, new content)
    if (change.action === 'write' && change.content) {
      return {
        type: 'content',
        oldContent: '',
        newContent: change.content,
        newPath: path,
      };
    }
    return undefined;
  }, [change, path]);
  const diffPreviewData = useDiffData(
    diffContent ?? { type: 'unified', path, unifiedDiff: '' }
  );
  const hasDiffContent = Boolean(diffContent && diffPreviewData.isValid);

  // Only show "open in changes" button if the file exists in current diffs
  const handleOpenInChanges = useCallback(() => {
    viewFileInChanges(path);
  }, [viewFileInChanges, path]);
  const handleOpenInVSCode = useCallback((filename: string) => {
    openFileInVSCode(filename, { openAsDiff: false });
  }, []);

  const canOpenInChanges = diffPaths.has(path);

  return (
    <ChatFileEntry
      filename={path}
      additions={additions ?? writeAdditions}
      deletions={deletions}
      expanded={expanded}
      onToggle={toggle}
      status={status}
      fileIcon={FileIcon}
      isVSCode={isVSCode}
      onOpenInVSCode={handleOpenInVSCode}
      diffContent={hasDiffContent ? diffContent : undefined}
      renderDiffBody={
        hasDiffContent
          ? (entryDiffContent) => (
              <FileEntryDiffBody diffContent={entryDiffContent} />
            )
          : undefined
      }
      onOpenInChanges={canOpenInChanges ? handleOpenInChanges : undefined}
    />
  );
}

/**
 * Plan entry with expandable content
 */
function PlanEntry({
  plan,
  expansionKey,
  workspaceId,
  status,
}: {
  plan: string;
  expansionKey: string;
  workspaceId: string | undefined;
  status: ToolStatus;
}) {
  const { t } = useTranslation('common');
  // Expand plans by default when pending approval
  const pendingApproval = status.status === 'pending_approval';
  const [expanded, toggle] = usePersistedExpanded(
    `plan:${expansionKey}`,
    pendingApproval
  );

  // Extract title from plan content (first line or default)
  const title = useMemo(() => {
    const firstLine = plan.split('\n')[0];
    // Remove markdown heading markers
    const cleanTitle = firstLine.replace(/^#+\s*/, '').trim();
    return cleanTitle || t('conversation.plan');
  }, [plan, t]);

  return (
    <ChatApprovalCard
      title={title}
      content={plan}
      expanded={expanded}
      onToggle={toggle}
      workspaceId={workspaceId}
      status={status}
      renderMarkdown={({ content, workspaceId }) => (
        <AppChatMarkdown
          content={content}
          workspaceId={workspaceId}
          className={undefined}
          maxWidth={undefined}
        />
      )}
    />
  );
}

/**
 * Generic tool approval entry - renders with plan-style card when pending approval
 */
function GenericToolApprovalEntry({
  toolName,
  content,
  expansionKey,
  workspaceId,
  status,
}: {
  toolName: string;
  content: string;
  expansionKey: string;
  workspaceId: string | undefined;
  status: ToolStatus;
}) {
  const [expanded, toggle] = usePersistedExpanded(
    `tool:${expansionKey}`,
    true // auto-expand for pending approval
  );

  return (
    <ChatApprovalCard
      title={toolName}
      content={content}
      expanded={expanded}
      onToggle={toggle}
      workspaceId={workspaceId}
      status={status}
      renderMarkdown={({ content, workspaceId }) => (
        <AppChatMarkdown
          content={content}
          workspaceId={workspaceId}
          className={undefined}
          maxWidth={undefined}
        />
      )}
    />
  );
}

/**
 * User message entry with expandable content
 */
function UserMessageEntry({
  content,
  expansionKey,
  workspaceId,
  executionProcessId,
  executorCanFork,
  resetAction,
}: {
  content: string;
  expansionKey: string;
  workspaceId: string | undefined;
  executionProcessId: string | undefined;
  executorCanFork: boolean;
  resetAction: UseResetProcessResult;
}) {
  const [expanded, toggle] = usePersistedExpanded(`user:${expansionKey}`, true);
  const { startEdit, isEntryGreyed, isInEditMode } = useMessageEditContext();
  const { resetProcess, canResetProcess, isResetPending } = resetAction;

  const isGreyed = isEntryGreyed(expansionKey);

  const handleEdit = () => {
    if (executionProcessId) {
      startEdit(expansionKey, executionProcessId, content);
    }
  };

  const handleReset = () => {
    if (executionProcessId) {
      resetProcess(executionProcessId);
    }
  };

  // Only show actions when we have a process ID and not already in edit mode
  const canShowActions =
    !!executionProcessId && !isInEditMode && !isResetPending;
  // Edit/retry/reset is not supported when the executor doesn't have the fork capability
  const canEdit = canShowActions && executorCanFork;
  // Only show reset if we have a process ID, not in edit mode, not pending, and not first process
  const canReset = canEdit && canResetProcess(executionProcessId);

  return (
    <ChatUserMessage
      content={content}
      expanded={expanded}
      onToggle={toggle}
      workspaceId={workspaceId}
      onEdit={canEdit ? handleEdit : undefined}
      onReset={canReset ? handleReset : undefined}
      isGreyed={isGreyed}
      renderMarkdown={({ content, workspaceId }) => (
        <AppChatMarkdown
          content={content}
          workspaceId={workspaceId}
          className={undefined}
          maxWidth={undefined}
        />
      )}
    />
  );
}

/**
 * Assistant message entry with expandable content
 */
function AssistantMessageEntry({
  content,
  workspaceId,
}: {
  content: string;
  workspaceId: string | undefined;
}) {
  return (
    <ChatAssistantMessage
      content={content}
      workspaceId={workspaceId}
      renderMarkdown={({ content, workspaceId }) => (
        <AppChatMarkdown
          content={content}
          workspaceId={workspaceId}
          className={undefined}
          maxWidth={undefined}
        />
      )}
    />
  );
}

/**
 * Tool summary entry with collapsible content for multi-line summaries
 */
function ToolSummaryEntry({
  summary,
  expansionKey,
  status,
  content,
  toolName,
  command,
  actionType,
}: {
  summary: string;
  expansionKey: string;
  status: ToolStatus;
  content: string;
  toolName: string;
  command: string | undefined;
  actionType: string;
}) {
  const [expanded, toggle] = usePersistedExpanded(
    `tool:${expansionKey}`,
    false
  );
  const { viewToolContentInPanel } = useLogsPanel();
  const textRef = useRef<HTMLSpanElement>(null);
  const [isTruncated, setIsTruncated] = useState(false);

  useLayoutEffect(() => {
    const el = textRef.current;
    if (el && !expanded) {
      setIsTruncated(el.scrollWidth > el.clientWidth);
    }
  }, [summary, expanded]);

  // Any tool with output can open the logs panel
  const hasOutput = content && content.trim().length > 0;

  const handleViewContent = useCallback(() => {
    viewToolContentInPanel(toolName, content, command);
  }, [viewToolContentInPanel, toolName, content, command]);

  return (
    <ChatToolSummary
      ref={textRef}
      summary={summary}
      expanded={expanded}
      onToggle={toggle}
      status={status}
      onViewContent={hasOutput ? handleViewContent : undefined}
      toolName={toolName}
      isTruncated={isTruncated}
      actionType={actionType}
    />
  );
}

/**
 * Todo management entry with expandable list of todos
 */
function TodoManagementEntry({
  todos,
  expansionKey,
}: {
  todos: TodoItem[];
  expansionKey: string;
}) {
  const [expanded, toggle] = usePersistedExpanded(
    `todo:${expansionKey}`,
    false
  );

  return <ChatTodoList todos={todos} expanded={expanded} onToggle={toggle} />;
}

/**
 * Subagent/Task entry with expandable output
 */
function SubagentEntry({
  description,
  subagentType,
  result,
  expansionKey,
  status,
  workspaceId,
}: {
  description: string;
  subagentType: string | null | undefined;
  result: ToolResult | null | undefined;
  expansionKey: string;
  status: ToolStatus;
  workspaceId: string | undefined;
}) {
  // Only auto-expand if there's a result to show
  const hasResult = Boolean(result?.value);
  const [expanded, toggle] = usePersistedExpanded(
    `subagent:${expansionKey}`,
    false
  );

  return (
    <ChatSubagentEntry
      description={description}
      subagentType={subagentType}
      result={result}
      expanded={expanded}
      onToggle={hasResult ? toggle : undefined}
      status={status}
      workspaceId={workspaceId}
      renderMarkdown={({ content, workspaceId }) => (
        <AppChatMarkdown
          content={content}
          workspaceId={workspaceId}
          className={undefined}
          maxWidth={undefined}
        />
      )}
    />
  );
}

/**
 * System message entry with expandable content
 */
function SystemMessageEntry({
  content,
  expansionKey,
}: {
  content: string;
  expansionKey: string;
}) {
  const [expanded, toggle] = usePersistedExpanded(
    `system:${expansionKey}`,
    false
  );

  return (
    <ChatSystemMessage
      content={content}
      expanded={expanded}
      onToggle={toggle}
    />
  );
}

/**
 * Script entry with fix button for failed scripts
 */
function ScriptEntryWithFix({
  title,
  processId,
  exitCode,
  status,
  workspaceId,
  sessionId,
}: {
  title: string;
  processId: string;
  exitCode: number | null;
  status: ToolStatus;
  workspaceId: string | undefined;
  sessionId: string | undefined;
}) {
  const { viewProcessInPanel } = useLogsPanel();
  // Try to get repos from workspace context - may not be available in all contexts
  let repos: RepoWithTargetBranch[] = [];
  try {
    const workspaceContext = useWorkspaceContext();
    repos = workspaceContext.repos;
  } catch {
    // Context not available, fix button won't be shown
  }

  // Use ref to access current repos without causing callback recreation
  const reposRef = useRef(repos);
  reposRef.current = repos;

  const handleFix = useCallback(() => {
    const currentRepos = reposRef.current;
    if (!workspaceId || currentRepos.length === 0) return;

    // Determine script type based on title
    const scriptType: ScriptType =
      title === 'Setup Script'
        ? 'setup'
        : title === 'Cleanup Script'
          ? 'cleanup'
          : title === 'Archive Script'
            ? 'archive'
            : 'dev_server';

    ScriptFixerDialog.show({
      scriptType,
      repos: currentRepos,
      workspaceId,
      sessionId,
      initialRepoId: currentRepos.length === 1 ? currentRepos[0].id : undefined,
    });
  }, [title, workspaceId, sessionId]);

  // Only show fix button if we have the necessary context
  const canFix = workspaceId && repos.length > 0;

  return (
    <ChatScriptEntry
      title={title}
      processId={processId}
      exitCode={exitCode}
      status={status}
      onViewProcess={viewProcessInPanel}
      onFix={canFix ? handleFix : undefined}
    />
  );
}

/**
 * Error message entry with expandable content
 */
function ErrorMessageEntry({
  content,
  expansionKey,
}: {
  content: string;
  expansionKey: string;
}) {
  const [expanded, toggle] = usePersistedExpanded(
    `error:${expansionKey}`,
    false
  );

  return (
    <ChatErrorMessage content={content} expanded={expanded} onToggle={toggle} />
  );
}

/**
 * Aggregated group entry for consecutive file_read, search, or web_fetch entries
 */
function AggregatedGroupEntry({ group }: { group: AggregatedPatchGroup }) {
  const { viewToolContentInPanel } = useLogsPanel();
  const [expanded, setExpanded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Extract summary and status from each entry in the group
  const aggregatedEntries = useMemo(() => {
    return group.entries.map((patchEntry) => {
      if (patchEntry.type !== 'NORMALIZED_ENTRY') {
        return {
          summary: '',
          status: undefined,
          expansionKey: patchEntry.patchKey,
          content: '',
          toolName: '',
        };
      }

      const entryType = patchEntry.content.entry_type;
      if (entryType.type !== 'tool_use') {
        return {
          summary: '',
          status: undefined,
          expansionKey: patchEntry.patchKey,
          content: '',
          toolName: '',
        };
      }

      const { action_type, status, tool_name } = entryType;
      let summary = '';
      let content = patchEntry.content.content;
      let command: string | undefined;
      if (action_type.action === 'file_read') {
        summary = action_type.path;
      } else if (action_type.action === 'search') {
        summary = action_type.query;
      } else if (action_type.action === 'web_fetch') {
        summary = action_type.url;
      } else if (action_type.action === 'command_run') {
        summary = action_type.command;
        command = action_type.command;
        content = action_type.result?.output ?? '';
      }

      return {
        summary,
        status,
        expansionKey: patchEntry.patchKey,
        content,
        toolName: tool_name,
        command,
      };
    });
  }, [group.entries]);

  const handleViewContent = useCallback(
    (index: number) => {
      const entry = aggregatedEntries[index];
      if (entry && entry.content) {
        viewToolContentInPanel(entry.toolName, entry.content, entry.command);
      }
    },
    [aggregatedEntries, viewToolContentInPanel]
  );

  const handleToggle = useCallback(() => {
    setExpanded((prev) => !prev);
  }, []);

  const handleHoverChange = useCallback((hovered: boolean) => {
    setIsHovered(hovered);
  }, []);

  // Get the label, icon, and unit based on aggregation type
  const getDisplayProps = () => {
    switch (group.aggregationType) {
      case 'file_read':
        return { label: 'Read', icon: FileTextIcon, unit: 'file' };
      case 'search':
        return { label: 'Search', icon: ListMagnifyingGlassIcon, unit: 'file' };
      case 'web_fetch':
        return { label: 'Fetched', icon: GlobeIcon, unit: 'URL' };
      case 'command_run_read':
        return { label: 'Read', icon: FileTextIcon, unit: 'command' };
      case 'command_run_search':
        return {
          label: 'Search',
          icon: ListMagnifyingGlassIcon,
          unit: 'command',
        };
      case 'command_run_edit':
        return { label: 'Edit', icon: PencilSimpleIcon, unit: 'command' };
      case 'command_run_fetch':
        return { label: 'Fetch', icon: GlobeIcon, unit: 'command' };
    }
  };
  const { label, icon, unit } = getDisplayProps();

  return (
    <ChatAggregatedToolEntries
      entries={aggregatedEntries}
      expanded={expanded}
      isHovered={isHovered}
      onToggle={handleToggle}
      onHoverChange={handleHoverChange}
      onViewContent={handleViewContent}
      label={label}
      icon={icon}
      unit={unit}
    />
  );
}

/**
 * Aggregated thinking group entry for thinking entries in previous turns
 */
function AggregatedThinkingGroupEntry({
  group,
  taskAttemptId,
}: {
  group: AggregatedThinkingGroup;
  taskAttemptId: string | undefined;
}) {
  const [expanded, setExpanded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Extract thinking entries from the group
  const thinkingEntries = useMemo(() => {
    return group.entries
      .filter((entry) => entry.type === 'NORMALIZED_ENTRY')
      .map((entry) => ({
        content: entry.type === 'NORMALIZED_ENTRY' ? entry.content.content : '',
        expansionKey: entry.patchKey,
      }));
  }, [group.entries]);

  const handleToggle = useCallback(() => {
    setExpanded((prev) => !prev);
  }, []);

  const handleHoverChange = useCallback((hovered: boolean) => {
    setIsHovered(hovered);
  }, []);

  return (
    <ChatCollapsedThinking
      entries={thinkingEntries}
      expanded={expanded}
      isHovered={isHovered}
      onToggle={handleToggle}
      onHoverChange={handleHoverChange}
      taskAttemptId={taskAttemptId}
      renderMarkdown={({ content, workspaceId, className }) => (
        <AppChatMarkdown
          content={content}
          workspaceId={workspaceId}
          className={className}
          maxWidth={undefined}
        />
      )}
    />
  );
}

/**
 * Aggregated diff group entry for consecutive file_edit entries on the same file
 */
function AggregatedDiffGroupEntry({ group }: { group: AggregatedDiffGroup }) {
  const { theme } = useTheme();
  const actualTheme = getActualTheme(theme);
  const { viewFileInChanges, diffPaths } = useChangesView();
  const [expanded, setExpanded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const FileIcon = useMemo(
    () => getFileIcon(group.filePath, actualTheme),
    [group.filePath, actualTheme]
  );
  const isVSCode = inIframe();

  // Extract change data and status from each entry
  const aggregatedDiffEntries = useMemo(() => {
    return group.entries.flatMap((patchEntry, entryIdx) => {
      if (patchEntry.type !== 'NORMALIZED_ENTRY') {
        return [];
      }

      const entryType = patchEntry.content.entry_type;
      if (entryType.type !== 'tool_use') {
        return [];
      }

      const { action_type, status } = entryType;
      if (action_type.action !== 'file_edit') {
        return [];
      }

      // Each file_edit entry can have multiple changes
      return action_type.changes.map((change, changeIdx) => ({
        change,
        status,
        expansionKey: `${patchEntry.patchKey}:${entryIdx}:${changeIdx}`,
      }));
    });
  }, [group.entries]);

  const handleToggle = useCallback(() => {
    setExpanded((prev) => !prev);
  }, []);

  const handleHoverChange = useCallback((hovered: boolean) => {
    setIsHovered(hovered);
  }, []);

  const handleOpenInChanges = useCallback(() => {
    viewFileInChanges(group.filePath);
  }, [viewFileInChanges, group.filePath]);
  const handleOpenInVSCode = useCallback((filePath: string) => {
    openFileInVSCode(filePath, { openAsDiff: false });
  }, []);

  const canOpenInChanges = diffPaths.has(group.filePath);

  return (
    <ChatAggregatedDiffEntries
      filePath={group.filePath}
      entries={aggregatedDiffEntries}
      expanded={expanded}
      isHovered={isHovered}
      onToggle={handleToggle}
      onHoverChange={handleHoverChange}
      onOpenInChanges={canOpenInChanges ? handleOpenInChanges : null}
      fileIcon={FileIcon}
      isVSCode={isVSCode}
      onOpenInVSCode={handleOpenInVSCode}
      renderDiffBody={({ diffContent }) =>
        diffContent ? <FileEntryDiffBody diffContent={diffContent} /> : null
      }
    />
  );
}

const NewDisplayConversationEntrySpaced = (props: Props) => {
  const { isEntryGreyed } = useMessageEditContext();
  const isGreyed = isEntryGreyed(props.expansionKey);

  return (
    <div
      className={cn(
        'py-base px-double',
        isGreyed && 'opacity-50 pointer-events-none'
      )}
    >
      <NewDisplayConversationEntry {...props} />
    </div>
  );
};

export default NewDisplayConversationEntrySpaced;
