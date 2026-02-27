import { type ReactNode, useRef } from 'react';
import { CheckIcon, PaperclipIcon, XIcon } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import { Checkbox } from './Checkbox';
import { ChatBoxBase, VisualVariant, type DropzoneProps } from './ChatBoxBase';
import { DropdownMenuItem, DropdownMenuLabel } from './Dropdown';
import { PrimaryButton } from './PrimaryButton';
import type { LocalImageMetadata } from './TaskAttemptContext';
import { ToolbarDropdown, ToolbarIconButton } from './Toolbar';

export interface EditorProps {
  value: string;
  onChange: (value: string) => void;
}

export interface ModelSelectorProps<TExecutorConfig = unknown> {
  onAdvancedSettings: () => void;
  presets: string[];
  selectedPreset: string | null;
  onPresetSelect: (presetId: string | null) => void;
  onOverrideChange: (partial: Partial<TExecutorConfig>) => void;
  executorConfig: TExecutorConfig | null;
  presetOptions: TExecutorConfig | null | undefined;
}

export interface ExecutorProps<TExecutor extends string = string> {
  selected: TExecutor | null;
  options: TExecutor[];
  onChange: (executor: TExecutor) => void;
}

export interface SaveAsDefaultProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  visible: boolean;
}

export interface LinkedIssueBadgeProps {
  simpleId: string;
  title: string;
  onRemove: () => void;
}

export interface CreateChatBoxEditorRenderProps<
  TExecutor extends string = string,
> {
  value: string;
  onChange: (value: string) => void;
  onCmdEnter: () => void;
  disabled: boolean;
  repoIds?: string[];
  repoId?: string;
  executor: TExecutor | null;
  onPasteFiles?: (files: File[]) => void;
  localImages?: LocalImageMetadata[];
}

interface CreateChatBoxProps<TExecutor extends string = string> {
  editor: EditorProps;
  renderEditor: (props: CreateChatBoxEditorRenderProps<TExecutor>) => ReactNode;
  agentIcon?: ReactNode;
  onSend: () => void;
  isSending: boolean;
  disabled?: boolean;
  executor: ExecutorProps<TExecutor>;
  formatExecutorLabel?: (executor: TExecutor) => string;
  emptyExecutorLabel?: string;
  saveAsDefault?: SaveAsDefaultProps;
  error?: string | null;
  repoIds?: string[];
  repoId?: string;
  modelSelector?: ReactNode;
  onPasteFiles?: (files: File[]) => void;
  localImages?: LocalImageMetadata[];
  dropzone?: DropzoneProps;
  onEditRepos: () => void;
  repoSummaryLabel: string;
  repoSummaryTitle: string;
  linkedIssue?: LinkedIssueBadgeProps | null;
}

/**
 * Lightweight chat box for create mode.
 * Supports sending and attachments - no queue, stop, or feedback functionality.
 */
function defaultExecutorLabel(executor: string) {
  return executor
    .replace(/[_-]+/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function CreateChatBox<TExecutor extends string = string>({
  editor,
  renderEditor,
  agentIcon,
  onSend,
  isSending,
  disabled = false,
  executor,
  formatExecutorLabel = defaultExecutorLabel,
  emptyExecutorLabel = 'Select Executor',
  saveAsDefault,
  error,
  repoIds,
  repoId,
  modelSelector,
  onPasteFiles,
  localImages,
  dropzone,
  onEditRepos,
  repoSummaryLabel,
  repoSummaryTitle,
  linkedIssue,
}: CreateChatBoxProps<TExecutor>) {
  const { t } = useTranslation(['common', 'tasks']);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isDisabled = disabled || isSending;
  const canSend = editor.value.trim().length > 0 && !isDisabled;

  const handleCmdEnter = () => {
    if (canSend) {
      onSend();
    }
  };

  const handleAttachClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).filter((f) =>
      f.type.startsWith('image/')
    );
    if (files.length > 0 && onPasteFiles) {
      onPasteFiles(files);
    }
    e.target.value = '';
  };

  const executorLabel = executor.selected
    ? formatExecutorLabel(executor.selected)
    : emptyExecutorLabel;

  return (
    <ChatBoxBase
      editor={renderEditor({
        value: editor.value,
        onChange: editor.onChange,
        onCmdEnter: handleCmdEnter,
        disabled: isDisabled,
        repoIds,
        repoId,
        executor: executor.selected ?? null,
        onPasteFiles,
        localImages,
      })}
      error={error}
      visualVariant={VisualVariant.NORMAL}
      dropzone={dropzone}
      modelSelector={modelSelector}
      headerLeft={
        <>
          {agentIcon}
          <ToolbarDropdown label={executorLabel} disabled={isDisabled}>
            <DropdownMenuLabel>
              {t('tasks:conversation.executors')}
            </DropdownMenuLabel>
            {executor.options.map((exec) => (
              <DropdownMenuItem
                key={exec}
                icon={executor.selected === exec ? CheckIcon : undefined}
                onClick={() => executor.onChange(exec)}
              >
                {formatExecutorLabel(exec)}
              </DropdownMenuItem>
            ))}
          </ToolbarDropdown>
          {saveAsDefault?.visible && (
            <label className="flex items-center gap-1.5 text-sm text-low cursor-pointer ml-2">
              <Checkbox
                checked={saveAsDefault.checked}
                onCheckedChange={saveAsDefault.onChange}
                className="h-3.5 w-3.5"
                disabled={isDisabled}
              />
              <span>{t('tasks:conversation.saveAsDefault')}</span>
            </label>
          )}
        </>
      }
      footerLeft={
        <>
          <ToolbarIconButton
            icon={PaperclipIcon}
            aria-label={t('tasks:taskFormDialog.attachImage')}
            title={t('tasks:taskFormDialog.attachImage')}
            onClick={handleAttachClick}
            disabled={isDisabled}
          />
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleFileInputChange}
          />
          <button
            type="button"
            onClick={onEditRepos}
            title={repoSummaryTitle}
            disabled={isDisabled}
            className="max-w-[320px] truncate text-sm text-normal hover:text-high disabled:cursor-not-allowed disabled:opacity-50"
          >
            {repoSummaryLabel}
          </button>
          {linkedIssue && (
            <>
              <div
                className="inline-flex items-center gap-half whitespace-nowrap text-sm text-low"
                title={linkedIssue.title}
              >
                <span className="font-mono text-xs text-normal">
                  {linkedIssue.simpleId}
                </span>
                <button
                  type="button"
                  onClick={linkedIssue.onRemove}
                  disabled={isDisabled}
                  className="inline-flex items-center text-low hover:text-error transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                  aria-label={`Remove link to ${linkedIssue.simpleId}`}
                >
                  <XIcon className="size-icon-xs" weight="bold" />
                </button>
              </div>
            </>
          )}
        </>
      }
      footerRight={
        <PrimaryButton
          onClick={onSend}
          disabled={!canSend}
          actionIcon={isSending ? 'spinner' : undefined}
          value={
            isSending
              ? t('tasks:conversation.workspace.creating')
              : t('tasks:conversation.workspace.create')
          }
        />
      }
    />
  );
}
