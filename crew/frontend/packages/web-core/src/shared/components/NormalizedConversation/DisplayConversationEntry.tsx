import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import WYSIWYGEditor from '@/shared/components/WYSIWYGEditor';
import {
  ActionType,
  NormalizedEntry,
  ToolStatus,
  type NormalizedEntryType,
  type JsonValue,
} from 'shared/types.ts';
import type { WorkspaceWithSession } from '@/shared/types/attempt';
import type { ProcessStartPayload } from '@/shared/types/logs';
import FileChangeRenderer from './FileChangeRenderer';
import { useExpandable } from '@/shared/stores/useExpandableStore';
import {
  AlertCircle,
  Bot,
  Brain,
  CheckSquare,
  ChevronDown,
  Hammer,
  Edit,
  Eye,
  Globe,
  Plus,
  Search,
  Settings,
  Terminal,
  User,
  Wrench,
} from 'lucide-react';
import RawLogText from '@/shared/components/RawLogText';
import UserMessage from './UserMessage';
import PendingApprovalEntry from './PendingApprovalEntry';
import { cn } from '@/shared/lib/utils';
import { useRetryUi } from '@/shared/hooks/useRetryUi';
import { Button } from '@vibe/ui/components/Button';
import {
  ScriptFixerDialog,
  type ScriptType,
} from '@/shared/dialogs/scripts/ScriptFixerDialog';
import { useAttemptRepo } from '@/shared/hooks/useAttemptRepo';

type Props = {
  entry: NormalizedEntry | ProcessStartPayload;
  expansionKey: string;
  diffDeletable?: boolean;
  executionProcessId?: string;
  taskAttempt?: WorkspaceWithSession;
};

type FileEditAction = Extract<ActionType, { action: 'file_edit' }>;

const renderJson = (v: JsonValue) => (
  <pre className="whitespace-pre-wrap">{JSON.stringify(v, null, 2)}</pre>
);

const getEntryIcon = (entryType: NormalizedEntryType) => {
  const iconSize = 'h-3 w-3';
  if (entryType.type === 'user_message' || entryType.type === 'user_feedback') {
    return <User className={iconSize} />;
  }
  if (entryType.type === 'assistant_message') {
    return <Bot className={iconSize} />;
  }
  if (entryType.type === 'system_message') {
    return <Settings className={iconSize} />;
  }
  if (entryType.type === 'thinking') {
    return <Brain className={iconSize} />;
  }
  if (entryType.type === 'error_message') {
    return <AlertCircle className={iconSize} />;
  }
  if (entryType.type === 'tool_use') {
    const { action_type, tool_name } = entryType;

    // Special handling for TODO tools
    if (
      action_type.action === 'todo_management' ||
      (tool_name &&
        (tool_name.toLowerCase() === 'todowrite' ||
          tool_name.toLowerCase() === 'todoread' ||
          tool_name.toLowerCase() === 'todo_write' ||
          tool_name.toLowerCase() === 'todo_read' ||
          tool_name.toLowerCase() === 'todo'))
    ) {
      return <CheckSquare className={iconSize} />;
    }

    if (action_type.action === 'file_read') {
      return <Eye className={iconSize} />;
    } else if (action_type.action === 'file_edit') {
      return <Edit className={iconSize} />;
    } else if (action_type.action === 'command_run') {
      return <Terminal className={iconSize} />;
    } else if (action_type.action === 'search') {
      return <Search className={iconSize} />;
    } else if (action_type.action === 'web_fetch') {
      return <Globe className={iconSize} />;
    } else if (action_type.action === 'task_create') {
      return <Plus className={iconSize} />;
    } else if (action_type.action === 'plan_presentation') {
      return <CheckSquare className={iconSize} />;
    } else if (action_type.action === 'tool') {
      return <Hammer className={iconSize} />;
    }
    return <Settings className={iconSize} />;
  }
  return <Settings className={iconSize} />;
};

type ExitStatusVisualisation = 'success' | 'error' | 'pending';

const getStatusIndicator = (entryType: NormalizedEntryType) => {
  let status_visualisation: ExitStatusVisualisation | null = null;
  if (
    entryType.type === 'tool_use' &&
    entryType.action_type.action === 'command_run'
  ) {
    status_visualisation = 'pending';
    if (entryType.action_type.result?.exit_status?.type === 'success') {
      if (entryType.action_type.result?.exit_status?.success) {
        status_visualisation = 'success';
      } else {
        status_visualisation = 'error';
      }
    } else if (
      entryType.action_type.result?.exit_status?.type === 'exit_code'
    ) {
      if (entryType.action_type.result?.exit_status?.code === 0) {
        status_visualisation = 'success';
      } else {
        status_visualisation = 'error';
      }
    }
  }

  // If pending, should be a pulsing primary-foreground
  const colorMap: Record<ExitStatusVisualisation, string> = {
    success: 'bg-green-300',
    error: 'bg-red-300',
    pending: 'bg-primary-foreground/50',
  };

  if (!status_visualisation) return null;

  return (
    <div className="relative">
      <div
        className={`${colorMap[status_visualisation]} h-1.5 w-1.5 rounded-full absolute -left-1 -bottom-4`}
      />
      {status_visualisation === 'pending' && (
        <div
          className={`${colorMap[status_visualisation]} h-1.5 w-1.5 rounded-full absolute -left-1 -bottom-4 animate-ping`}
        />
      )}
    </div>
  );
};

/**********************
 * Helper definitions *
 **********************/

const shouldRenderMarkdown = (entryType: NormalizedEntryType) =>
  entryType.type === 'assistant_message' ||
  entryType.type === 'system_message' ||
  entryType.type === 'thinking' ||
  entryType.type === 'tool_use';

const getContentClassName = (entryType: NormalizedEntryType) => {
  const base = ' whitespace-pre-wrap break-words';
  if (
    entryType.type === 'tool_use' &&
    entryType.action_type.action === 'command_run'
  )
    return `${base} font-mono`;

  // Keep content-only styling — no bg/padding/rounded here.
  if (entryType.type === 'error_message')
    return `${base} font-mono text-destructive`;

  if (entryType.type === 'thinking') return `${base} opacity-60`;

  if (
    entryType.type === 'tool_use' &&
    (entryType.action_type.action === 'todo_management' ||
      (entryType.tool_name &&
        ['todowrite', 'todoread', 'todo_write', 'todo_read', 'todo'].includes(
          entryType.tool_name.toLowerCase()
        )))
  )
    return `${base} font-mono text-zinc-800 dark:text-zinc-200`;

  if (
    entryType.type === 'tool_use' &&
    entryType.action_type.action === 'plan_presentation'
  )
    return `${base} text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/20 px-3 py-2 border-l-4 border-blue-400`;

  return base;
};

/*********************
 * Unified card      *
 *********************/

type CardVariant = 'system' | 'error';

const MessageCard: React.FC<{
  children: React.ReactNode;
  variant: CardVariant;
  expanded?: boolean;
  onToggle?: () => void;
}> = ({ children, variant, expanded, onToggle }) => {
  const frameBase =
    'border px-3 py-2 w-full cursor-pointer  bg-[hsl(var(--card))] border-[hsl(var(--border))]';
  const systemTheme = 'border-400/40 text-zinc-500';
  const errorTheme =
    'border-red-400/40 bg-red-50 dark:bg-[hsl(var(--card))] text-[hsl(var(--foreground))]';

  return (
    <div
      className={`${frameBase} ${
        variant === 'system' ? systemTheme : errorTheme
      }`}
      onClick={onToggle}
    >
      <div className="flex items-center gap-1.5">
        <div className="min-w-0 flex-1">{children}</div>
        {onToggle && (
          <ExpandChevron
            expanded={!!expanded}
            onClick={onToggle}
            variant={variant}
          />
        )}
      </div>
    </div>
  );
};

/************************
 * Collapsible container *
 ************************/

type CollapsibleVariant = 'system' | 'error';

const ExpandChevron: React.FC<{
  expanded: boolean;
  onClick: () => void;
  variant: CollapsibleVariant;
}> = ({ expanded, onClick, variant }) => {
  const color =
    variant === 'system'
      ? 'text-700 dark:text-300'
      : 'text-red-700 dark:text-red-300';

  return (
    <ChevronDown
      onClick={onClick}
      className={`h-4 w-4 cursor-pointer transition-transform ${color} ${
        expanded ? '' : '-rotate-90'
      }`}
    />
  );
};

const CollapsibleEntry: React.FC<{
  content: string;
  markdown: boolean;
  expansionKey: string;
  variant: CollapsibleVariant;
  contentClassName: string;
  taskAttemptId?: string;
}> = ({
  content,
  markdown,
  expansionKey,
  variant,
  contentClassName,
  taskAttemptId,
}) => {
  const multiline = content.includes('\n');
  const [expanded, toggle] = useExpandable(`entry:${expansionKey}`, false);

  const Inner = (
    <div className={contentClassName}>
      {markdown ? (
        <WYSIWYGEditor
          value={content}
          disabled
          className="whitespace-pre-wrap break-words"
          taskAttemptId={taskAttemptId}
        />
      ) : (
        content
      )}
    </div>
  );

  const firstLine = content.split('\n')[0];
  const PreviewInner = (
    <div className={contentClassName}>
      {markdown ? (
        <WYSIWYGEditor
          value={firstLine}
          disabled
          className="whitespace-pre-wrap break-words"
          taskAttemptId={taskAttemptId}
        />
      ) : (
        firstLine
      )}
    </div>
  );

  if (!multiline) {
    return <MessageCard variant={variant}>{Inner}</MessageCard>;
  }

  return expanded ? (
    <MessageCard variant={variant} expanded={expanded} onToggle={toggle}>
      {Inner}
    </MessageCard>
  ) : (
    <MessageCard variant={variant} expanded={expanded} onToggle={toggle}>
      {PreviewInner}
    </MessageCard>
  );
};

type ToolStatusAppearance = 'default' | 'denied' | 'timed_out';

const PLAN_APPEARANCE: Record<
  ToolStatusAppearance,
  {
    border: string;
    headerBg: string;
    headerText: string;
    contentBg: string;
    contentText: string;
  }
> = {
  default: {
    border: 'border-blue-400/40',
    headerBg: 'bg-blue-50 dark:bg-blue-950/20',
    headerText: 'text-blue-700 dark:text-blue-300',
    contentBg: 'bg-blue-50 dark:bg-blue-950/20',
    contentText: 'text-blue-700 dark:text-blue-300',
  },
  denied: {
    border: 'border-red-400/40',
    headerBg: 'bg-red-50 dark:bg-red-950/20',
    headerText: 'text-red-700 dark:text-red-300',
    contentBg: 'bg-red-50 dark:bg-red-950/10',
    contentText: 'text-red-700 dark:text-red-300',
  },
  timed_out: {
    border: 'border-amber-400/40',
    headerBg: 'bg-amber-50 dark:bg-amber-950/20',
    headerText: 'text-amber-700 dark:text-amber-200',
    contentBg: 'bg-amber-50 dark:bg-amber-950/10',
    contentText: 'text-amber-700 dark:text-amber-200',
  },
};

const PlanPresentationCard: React.FC<{
  plan: string;
  expansionKey: string;
  defaultExpanded?: boolean;
  statusAppearance?: ToolStatusAppearance;
  taskAttemptId?: string;
}> = ({
  plan,
  expansionKey,
  defaultExpanded = false,
  statusAppearance = 'default',
  taskAttemptId,
}) => {
  const { t } = useTranslation('common');
  const [expanded, toggle] = useExpandable(
    `plan-entry:${expansionKey}`,
    defaultExpanded
  );
  const tone = PLAN_APPEARANCE[statusAppearance];

  return (
    <div className="inline-block w-full">
      <div
        className={cn('border w-full overflow-hidden rounded-sm', tone.border)}
      >
        <button
          onClick={(e: React.MouseEvent) => {
            e.preventDefault();
            toggle();
          }}
          title={
            expanded
              ? t('conversation.planToggle.hide')
              : t('conversation.planToggle.show')
          }
          className={cn(
            'w-full px-2 py-1.5 flex items-center gap-1.5 text-left border-b',
            tone.headerBg,
            tone.headerText,
            tone.border
          )}
        >
          <span className=" min-w-0 truncate">
            <span className="font-semibold">{t('conversation.plan')}</span>
          </span>
          <div className="ml-auto flex items-center gap-2">
            <ExpandChevron
              expanded={expanded}
              onClick={toggle}
              variant={statusAppearance === 'denied' ? 'error' : 'system'}
            />
          </div>
        </button>

        {expanded && (
          <div className={cn('px-3 py-2', tone.contentBg)}>
            <div className={cn('text-sm', tone.contentText)}>
              <WYSIWYGEditor
                value={plan}
                disabled
                className="whitespace-pre-wrap break-words"
                taskAttemptId={taskAttemptId}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const ToolCallCard: React.FC<{
  entry: NormalizedEntry | ProcessStartPayload;
  expansionKey: string;
  forceExpanded?: boolean;
  taskAttemptId?: string;
}> = ({ entry, expansionKey, forceExpanded = false, taskAttemptId }) => {
  const { t } = useTranslation('common');

  // Determine if this is a NormalizedEntry with tool_use
  const isNormalizedEntry = 'entry_type' in entry;
  const entryType =
    isNormalizedEntry && entry.entry_type.type === 'tool_use'
      ? entry.entry_type
      : undefined;

  // Compute defaults from entry
  const linkifyUrls = entryType?.tool_name === 'Tool Install Script';
  const defaultExpanded = linkifyUrls;

  const [expanded, toggle] = useExpandable(
    `tool-entry:${expansionKey}`,
    defaultExpanded
  );
  const effectiveExpanded = forceExpanded || expanded;

  // Extract action details
  const actionType = entryType?.action_type;
  const isCommand = actionType?.action === 'command_run';
  const isTool = actionType?.action === 'tool';

  // Label and content
  const label = isCommand ? 'Ran' : entryType?.tool_name || 'Tool';

  const inlineText = isNormalizedEntry ? entry.content.trim() : '';
  const isSingleLine = inlineText !== '' && !/\r?\n/.test(inlineText);
  const showInlineSummary = isSingleLine;

  // Command details
  const commandResult = isCommand ? actionType.result : null;
  const output = commandResult?.output ?? null;
  let argsText: string | null = null;
  if (isCommand) {
    const fromArgs =
      typeof actionType.command === 'string' ? actionType.command : '';
    const fallback = inlineText;
    argsText = (fromArgs || fallback).trim();
  }

  // Tool details
  const hasArgs = isTool && !!actionType.arguments;
  const hasResult = isTool && !!actionType.result;

  const hasExpandableDetails = isCommand
    ? Boolean(argsText) || Boolean(output)
    : hasArgs || hasResult;

  const HeaderWrapper: React.ElementType = hasExpandableDetails
    ? 'button'
    : 'div';
  const headerProps = hasExpandableDetails
    ? {
        onClick: (e: React.MouseEvent) => {
          e.preventDefault();
          toggle();
        },
        title: effectiveExpanded
          ? t('conversation.toolDetailsToggle.hide')
          : t('conversation.toolDetailsToggle.show'),
      }
    : {};

  const headerClassName = cn(
    'w-full flex items-center gap-1.5 text-left text-secondary-foreground'
  );

  return (
    <div className="inline-block w-full flex flex-col gap-4">
      <HeaderWrapper {...headerProps} className={headerClassName}>
        <span className=" min-w-0 flex items-center gap-1.5">
          <span>
            {entryType && getStatusIndicator(entryType)}
            {entryType && getEntryIcon(entryType)}
          </span>
          {showInlineSummary ? (
            <span className="text-sm font-mono">{inlineText}</span>
          ) : (
            <span className="text-sm font-mono">{label}</span>
          )}
        </span>
      </HeaderWrapper>

      {effectiveExpanded && (
        <div className="max-h-[200px] overflow-y-auto border">
          {isCommand ? (
            <>
              {argsText && (
                <>
                  <div className="font-normal uppercase bg-background border-b border-dashed px-2 py-1">
                    {t('conversation.args')}
                  </div>
                  <div className="px-2 py-1">{argsText}</div>
                </>
              )}

              {output && (
                <>
                  <div className="font-normal uppercase bg-background border-y border-dashed px-2 py-1">
                    {t('conversation.output')}
                  </div>
                  <div className="px-2 py-1">
                    <RawLogText content={output} linkifyUrls={linkifyUrls} />
                  </div>
                </>
              )}
            </>
          ) : (
            <>
              {isTool && actionType && (
                <>
                  <div className="font-normal uppercase bg-background border-b border-dashed px-2 py-1">
                    {t('conversation.args')}
                  </div>
                  <div className="px-2 py-1">
                    {renderJson(actionType.arguments)}
                  </div>
                  <div className="font-normal uppercase bg-background border-y border-dashed px-2 py-1">
                    {t('conversation.result')}
                  </div>
                  <div className="px-2 py-1">
                    {actionType.result?.type.type === 'markdown' &&
                      actionType.result.value && (
                        <WYSIWYGEditor
                          value={actionType.result.value?.toString()}
                          disabled
                          taskAttemptId={taskAttemptId}
                        />
                      )}
                    {actionType.result?.type.type === 'json' &&
                      renderJson(actionType.result.value)}
                  </div>
                </>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

// Script tool names that can be fixed
const SCRIPT_TOOL_NAMES = [
  'Setup Script',
  'Cleanup Script',
  'Archive Script',
  'Tool Install Script',
];

const getScriptType = (toolName: string): ScriptType => {
  if (toolName === 'Setup Script') return 'setup';
  if (toolName === 'Cleanup Script') return 'cleanup';
  if (toolName === 'Archive Script') return 'archive';
  return 'dev_server'; // Tool Install Script
};

const ScriptToolCallCard: React.FC<{
  entry: NormalizedEntry | ProcessStartPayload;
  expansionKey: string;
  taskAttemptId?: string;
  sessionId?: string;
  isFailed: boolean;
  toolName: string;
  forceExpanded?: boolean;
}> = ({
  entry,
  expansionKey,
  taskAttemptId,
  sessionId,
  isFailed,
  toolName,
  forceExpanded = false,
}) => {
  const { t } = useTranslation('common');
  const { repos } = useAttemptRepo(taskAttemptId);

  const handleFix = useCallback(() => {
    if (!taskAttemptId || repos.length === 0) return;

    const scriptType = getScriptType(toolName);

    ScriptFixerDialog.show({
      scriptType,
      repos,
      workspaceId: taskAttemptId,
      sessionId,
      initialRepoId: repos.length === 1 ? repos[0].id : undefined,
    });
  }, [toolName, taskAttemptId, sessionId, repos]);

  const canFix = taskAttemptId && repos.length > 0 && isFailed;

  return (
    <div className="flex items-start gap-2">
      <div className="flex-1">
        <ToolCallCard
          entry={entry}
          expansionKey={expansionKey}
          forceExpanded={forceExpanded}
          taskAttemptId={taskAttemptId}
        />
      </div>
      {canFix && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleFix}
          className="shrink-0 gap-1"
        >
          <Wrench className="h-3 w-3" />
          {t('conversation.fixScript')}
        </Button>
      )}
    </div>
  );
};

const LoadingCard = () => {
  return (
    <div className="flex animate-pulse space-x-2 items-center">
      <div className="size-3 bg-foreground/10"></div>
      <div className="flex-1 h-3 bg-foreground/10"></div>
      <div className="flex-1 h-3"></div>
      <div className="flex-1 h-3"></div>
    </div>
  );
};

const isPendingApprovalStatus = (
  status: ToolStatus
): status is Extract<ToolStatus, { status: 'pending_approval' }> =>
  status.status === 'pending_approval';

const getToolStatusAppearance = (status: ToolStatus): ToolStatusAppearance => {
  if (status.status === 'denied') return 'denied';
  if (status.status === 'timed_out') return 'timed_out';
  return 'default';
};

/*******************
 * Main component  *
 *******************/

export const DisplayConversationEntryMaxWidth = (props: Props) => {
  return <DisplayConversationEntry {...props} />;
};

function DisplayConversationEntry({
  entry,
  expansionKey,
  executionProcessId,
  taskAttempt,
}: Props) {
  const { t } = useTranslation('common');
  const isNormalizedEntry = (
    entry: NormalizedEntry | ProcessStartPayload
  ): entry is NormalizedEntry => 'entry_type' in entry;

  const isProcessStart = (
    entry: NormalizedEntry | ProcessStartPayload
  ): entry is ProcessStartPayload => 'processId' in entry;

  const { isProcessGreyed } = useRetryUi();
  const greyed = isProcessGreyed(executionProcessId);
  const [qaExpanded, qaToggle] = useExpandable(`entry:${expansionKey}`, false);

  if (isProcessStart(entry)) {
    return (
      <div className={greyed ? 'opacity-50 pointer-events-none' : undefined}>
        <ToolCallCard
          entry={entry}
          expansionKey={expansionKey}
          taskAttemptId={taskAttempt?.id}
        />
      </div>
    );
  }

  // Handle NormalizedEntry
  const entryType = entry.entry_type;
  const isSystem = entryType.type === 'system_message';
  const isError = entryType.type === 'error_message';
  const isToolUse = entryType.type === 'tool_use';
  const isUserMessage = entryType.type === 'user_message';
  const isUserFeedback = entryType.type === 'user_feedback';
  const isLoading = entryType.type === 'loading';
  const isTokenUsage = entryType.type === 'token_usage_info';
  const isFileEdit = (a: ActionType): a is FileEditAction =>
    a.action === 'file_edit';

  if (isTokenUsage) {
    return null;
  }

  if (isUserMessage) {
    return (
      <UserMessage
        content={entry.content}
        executionProcessId={executionProcessId}
        taskAttempt={taskAttempt}
      />
    );
  }

  if (isUserFeedback) {
    const feedbackEntry = entryType as Extract<
      NormalizedEntryType,
      { type: 'user_feedback' }
    >;
    return (
      <div className="py-2">
        <div className="bg-background px-4 py-2 text-sm border-y border-dashed">
          <div
            className="text-xs mb-1 opacity-70"
            style={{ color: 'hsl(var(--destructive))' }}
          >
            {t('conversation.deniedByUser', {
              toolName: feedbackEntry.denied_tool,
            })}
          </div>
          <WYSIWYGEditor
            value={entry.content}
            disabled
            className="whitespace-pre-wrap break-words flex flex-col gap-1 font-light py-3"
            taskAttemptId={taskAttempt?.id}
          />
        </div>
      </div>
    );
  }

  if (entryType.type === 'user_answered_questions') {
    const qaEntry = entryType as Extract<
      NormalizedEntryType,
      { type: 'user_answered_questions' }
    >;
    return (
      <div className="py-2">
        <div className="bg-background px-4 py-2 text-sm border-y border-dashed">
          <button
            onClick={() => qaToggle()}
            className="flex items-center gap-1 text-xs opacity-70 w-full cursor-pointer"
          >
            <ChevronDown
              className={cn(
                'size-3 transition-transform',
                !qaExpanded && '-rotate-90'
              )}
            />
            <span>
              {t('askQuestion.answeredCount', {
                count: qaEntry.answers.length,
              })}
            </span>
          </button>
          {qaExpanded &&
            qaEntry.answers.map((qa, i) => (
              <div key={i} className="mt-2">
                <div className="font-semibold text-sm">{qa.question}</div>
                <div className="text-sm font-light">{qa.answer.join(', ')}</div>
              </div>
            ))}
        </div>
      </div>
    );
  }

  const renderToolUse = () => {
    if (!isNormalizedEntry(entry)) return null;
    if (entryType.type !== 'tool_use') return null;
    const toolEntry = entryType;

    const status = toolEntry.status;
    const statusAppearance = getToolStatusAppearance(status);
    const isPlanPresentation =
      toolEntry.action_type.action === 'plan_presentation';
    const isPendingApproval = status.status === 'pending_approval';
    const defaultExpanded = isPendingApproval || isPlanPresentation;

    const body = (() => {
      if (isFileEdit(toolEntry.action_type)) {
        const fileEditAction = toolEntry.action_type as FileEditAction;
        return (
          <div className="space-y-3">
            {fileEditAction.changes.map((change, idx) => (
              <FileChangeRenderer
                key={idx}
                path={fileEditAction.path}
                change={change}
                expansionKey={`edit:${expansionKey}:${idx}`}
                defaultExpanded={defaultExpanded}
                statusAppearance={statusAppearance}
                forceExpanded={isPendingApproval}
              />
            ))}
          </div>
        );
      }

      if (toolEntry.action_type.action === 'plan_presentation') {
        return (
          <PlanPresentationCard
            plan={toolEntry.action_type.plan}
            expansionKey={expansionKey}
            defaultExpanded={defaultExpanded}
            statusAppearance={statusAppearance}
            taskAttemptId={taskAttempt?.id}
          />
        );
      }

      // Script entries (Setup Script, Cleanup Script, Tool Install Script)
      if (
        toolEntry.action_type.action === 'command_run' &&
        SCRIPT_TOOL_NAMES.includes(toolEntry.tool_name)
      ) {
        const actionType = toolEntry.action_type;
        const exitCode =
          actionType.result?.exit_status?.type === 'exit_code'
            ? actionType.result.exit_status.code
            : null;
        const isFailed = exitCode !== null && exitCode !== 0;

        return (
          <ScriptToolCallCard
            entry={entry}
            expansionKey={expansionKey}
            taskAttemptId={taskAttempt?.id}
            sessionId={taskAttempt?.session?.id}
            isFailed={isFailed}
            toolName={toolEntry.tool_name}
            forceExpanded={isPendingApproval}
          />
        );
      }

      return (
        <ToolCallCard
          entry={entry}
          expansionKey={expansionKey}
          forceExpanded={isPendingApproval}
          taskAttemptId={taskAttempt?.id}
        />
      );
    })();

    const content = (
      <div
        className={`px-4 py-2 text-sm space-y-3 ${greyed ? 'opacity-50 pointer-events-none' : ''}`}
      >
        {body}
      </div>
    );

    if (isPendingApprovalStatus(status)) {
      if (toolEntry.action_type.action === 'ask_user_question') {
        return content;
      }
      return (
        <PendingApprovalEntry
          pendingStatus={status}
          executionProcessId={executionProcessId}
        >
          {content}
        </PendingApprovalEntry>
      );
    }

    return content;
  };

  if (isToolUse) {
    return renderToolUse();
  }

  if (isSystem || isError) {
    return (
      <div
        className={`px-4 py-2 text-sm ${greyed ? 'opacity-50 pointer-events-none' : ''}`}
      >
        <CollapsibleEntry
          content={isNormalizedEntry(entry) ? entry.content : ''}
          markdown={shouldRenderMarkdown(entryType)}
          expansionKey={expansionKey}
          variant={isSystem ? 'system' : 'error'}
          contentClassName={getContentClassName(entryType)}
          taskAttemptId={taskAttempt?.id}
        />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="px-4 py-2 text-sm">
        <LoadingCard />
      </div>
    );
  }

  return (
    <div className="px-4 py-2 text-sm">
      <div className={getContentClassName(entryType)}>
        {shouldRenderMarkdown(entryType) ? (
          <WYSIWYGEditor
            value={isNormalizedEntry(entry) ? entry.content : ''}
            disabled
            className="whitespace-pre-wrap break-words flex flex-col gap-1 font-light"
            taskAttemptId={taskAttempt?.id}
          />
        ) : isNormalizedEntry(entry) ? (
          entry.content
        ) : (
          ''
        )}
      </div>
    </div>
  );
}

export default DisplayConversationEntryMaxWidth;
