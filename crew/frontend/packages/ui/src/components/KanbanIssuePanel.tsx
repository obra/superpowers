import type { ReactNode, RefObject } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '../lib/cn';
import {
  XIcon,
  LinkIcon,
  DotsThreeIcon,
  TrashIcon,
  PaperclipIcon,
  ImageIcon,
} from '@phosphor-icons/react';
import {
  IssueTagsRow,
  type IssueTagBase,
  type IssueTagsRowAddTagControlProps,
  type LinkedPullRequest as IssueTagsLinkedPullRequest,
} from './IssueTagsRow';
import { PrimaryButton } from './PrimaryButton';
import { Toggle } from './Toggle';
import {
  IssuePropertyRow,
  type IssuePropertyRowProps,
} from './IssuePropertyRow';
import { IconButton } from './IconButton';
import { AutoResizeTextarea } from './AutoResizeTextarea';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './RadixTooltip';
import { ErrorAlert } from './ErrorAlert';

export type IssuePanelMode = 'create' | 'edit';
type IssuePriority = IssuePropertyRowProps['priority'];
type IssueStatus = IssuePropertyRowProps['statuses'][number];
type IssueAssignee = NonNullable<
  IssuePropertyRowProps['assigneeUsers']
>[number];
type IssueCreator = Exclude<IssuePropertyRowProps['creatorUser'], undefined>;
export interface KanbanIssueTag extends IssueTagBase {
  project_id: string;
}

export interface IssueFormData {
  title: string;
  description: string | null;
  statusId: string;
  priority: IssuePriority | null;
  assigneeIds: string[];
  tagIds: string[];
  createDraftWorkspace: boolean;
}

export interface LinkedPullRequest extends IssueTagsLinkedPullRequest {}

export interface KanbanIssueDescriptionEditorProps {
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  onCmdEnter?: () => void;
  onPasteFiles?: (files: File[]) => void;
  disabled?: boolean;
  autoFocus?: boolean;
  className?: string;
  showStaticToolbar?: boolean;
  saveStatus?: 'idle' | 'saved';
  staticToolbarActions?: ReactNode;
}

export interface KanbanIssuePanelProps {
  mode: IssuePanelMode;
  displayId: string;

  // Form data
  formData: IssueFormData;
  onFormChange: <K extends keyof IssueFormData>(
    field: K,
    value: IssueFormData[K]
  ) => void;

  // Options for dropdowns
  statuses: IssueStatus[];
  tags: KanbanIssueTag[];

  // Resolved assignee profiles for avatar display
  assigneeUsers?: IssueAssignee[];

  // Edit mode data
  issueId?: string | null;
  creatorUser?: IssueCreator;
  parentIssue?: { id: string; simpleId: string } | null;
  onParentIssueClick?: () => void;
  onRemoveParentIssue?: () => void;
  linkedPrs?: LinkedPullRequest[];

  // Actions
  onClose: () => void;
  onSubmit: () => void;
  onCmdEnterSubmit?: () => void;
  onDeleteDraft?: () => void;

  // Tag create callback - returns the new tag ID
  onCreateTag?: (data: { name: string; color: string }) => string;
  renderAddTagControl?: (
    props: IssueTagsRowAddTagControlProps<KanbanIssueTag>
  ) => ReactNode;
  renderDescriptionEditor: (
    props: KanbanIssueDescriptionEditorProps
  ) => ReactNode;

  // Loading states
  isSubmitting?: boolean;

  // Save status for description field
  descriptionSaveStatus?: 'idle' | 'saved';

  // Ref for title input (created in container)
  titleInputRef: RefObject<HTMLTextAreaElement>;

  // Copy link callback (edit mode only)
  onCopyLink?: () => void;

  // More actions callback (edit mode only) - opens command bar with issue actions
  onMoreActions?: () => void;

  // Image attachment upload
  onPasteFiles?: (files: File[]) => void;
  dropzoneProps?: {
    getRootProps: () => Record<string, unknown>;
    getInputProps: () => Record<string, unknown>;
    isDragActive: boolean;
  };
  onBrowseAttachment?: () => void;
  isUploading?: boolean;
  attachmentError?: string | null;
  onDismissAttachmentError?: () => void;

  // Edit-mode section renderers
  renderWorkspacesSection?: (issueId: string) => ReactNode;
  renderRelationshipsSection?: (issueId: string) => ReactNode;
  renderSubIssuesSection?: (issueId: string) => ReactNode;
  renderCommentsSection?: (issueId: string) => ReactNode;
}

export function KanbanIssuePanel({
  mode,
  displayId,
  formData,
  onFormChange,
  statuses,
  tags,
  assigneeUsers,
  issueId,
  creatorUser,
  parentIssue,
  onParentIssueClick,
  onRemoveParentIssue,
  linkedPrs = [],
  onClose,
  onSubmit,
  onCmdEnterSubmit,
  onDeleteDraft,
  onCreateTag,
  renderAddTagControl,
  renderDescriptionEditor,
  isSubmitting,
  descriptionSaveStatus,
  titleInputRef,
  onCopyLink,
  onMoreActions,
  onPasteFiles,
  dropzoneProps,
  onBrowseAttachment,
  isUploading,
  attachmentError,
  onDismissAttachmentError,
  renderWorkspacesSection,
  renderRelationshipsSection,
  renderSubIssuesSection,
  renderCommentsSection,
}: KanbanIssuePanelProps) {
  const { t } = useTranslation('common');
  const isCreateMode = mode === 'create';
  const breadcrumbTextClass =
    'min-w-0 text-sm text-normal truncate rounded-sm px-1 py-0.5 hover:bg-panel hover:text-high transition-colors';
  const creatorName =
    creatorUser?.first_name?.trim() || creatorUser?.username?.trim() || null;
  const showCreator = !isCreateMode && Boolean(creatorName);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      const target = e.target as HTMLElement;
      const isEditable =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable;
      if (isEditable) {
        target.blur();
        (e.currentTarget as HTMLElement).focus();
        e.stopPropagation();
      } else {
        onClose();
      }
    }
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      onCmdEnterSubmit?.();
    }
  };

  return (
    <div
      className="flex flex-col h-full overflow-hidden outline-none"
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-base py-half border-b shrink-0">
        <div className="flex items-center gap-half min-w-0 font-ibm-plex-mono">
          <span className={`${breadcrumbTextClass} shrink-0`}>{displayId}</span>
          {!isCreateMode && onCopyLink && (
            <button
              type="button"
              onClick={onCopyLink}
              className="p-half rounded-sm text-low hover:text-normal hover:bg-panel transition-colors"
              aria-label={t('kanban.copyLink')}
            >
              <LinkIcon className="size-icon-sm" weight="bold" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-half">
          {!isCreateMode && onMoreActions && (
            <button
              type="button"
              onClick={onMoreActions}
              className="p-half rounded-sm text-low hover:text-normal hover:bg-panel transition-colors"
              aria-label={t('kanban.moreActions')}
            >
              <DotsThreeIcon className="size-icon-sm" weight="bold" />
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="p-half rounded-sm text-low hover:text-normal hover:bg-panel transition-colors"
            aria-label={t('kanban.closePanel')}
          >
            <XIcon className="size-icon-sm" weight="bold" />
          </button>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Property Row */}
        <div className="px-base py-base border-b">
          <IssuePropertyRow
            statusId={formData.statusId}
            priority={formData.priority}
            assigneeIds={formData.assigneeIds}
            assigneeUsers={assigneeUsers}
            statuses={statuses}
            creatorUser={showCreator ? creatorUser : undefined}
            parentIssue={parentIssue}
            onParentIssueClick={onParentIssueClick}
            onRemoveParentIssue={onRemoveParentIssue}
            onStatusClick={() => onFormChange('statusId', formData.statusId)}
            onPriorityClick={() => onFormChange('priority', formData.priority)}
            onAssigneeClick={() =>
              onFormChange('assigneeIds', formData.assigneeIds)
            }
            disabled={isSubmitting}
          />
        </div>

        {/* Tags Row */}
        <div className="px-base py-base border-b">
          <IssueTagsRow
            selectedTagIds={formData.tagIds}
            availableTags={tags}
            linkedPrs={isCreateMode ? [] : linkedPrs}
            onTagsChange={(tagIds) => onFormChange('tagIds', tagIds)}
            onCreateTag={onCreateTag}
            renderAddTagControl={renderAddTagControl}
            disabled={isSubmitting}
          />
        </div>

        {/* Title and Description */}
        <div className="rounded-sm">
          {/* Title Input */}
          <div className="w-full mt-base">
            <AutoResizeTextarea
              ref={titleInputRef}
              value={formData.title}
              onChange={(value) => onFormChange('title', value)}
              onKeyDown={handleTitleKeyDown}
              placeholder="Issue Title..."
              autoFocus={isCreateMode}
              aria-label="Issue title"
              disabled={isSubmitting}
              className={cn(
                'px-base text-lg font-medium text-high',
                'placeholder:text-high/50',
                isSubmitting && 'opacity-50 pointer-events-none'
              )}
            />

            <div
              className={cn(
                'pointer-events-none absolute inset-0 px-base',
                'text-high/50 font-medium text-lg',
                'hidden',
                "[[data-empty='true']_+_&]:block" // show placeholder when previous sibling data-empty=true
              )}
            >
              {t('kanban.issueTitlePlaceholder')}
            </div>
          </div>

          {/* Description WYSIWYG Editor with image dropzone */}
          <div {...dropzoneProps?.getRootProps()} className="relative mt-base">
            <input
              {...(dropzoneProps?.getInputProps() as React.InputHTMLAttributes<HTMLInputElement>)}
              data-dropzone-input
            />
            {renderDescriptionEditor({
              placeholder: t('kanban.issueDescriptionPlaceholder'),
              value: formData.description ?? '',
              onChange: (value) => onFormChange('description', value || null),
              onCmdEnter: onCmdEnterSubmit,
              onPasteFiles,
              disabled: isSubmitting,
              autoFocus: false,
              className: 'min-h-[100px] px-base',
              showStaticToolbar: true,
              saveStatus: descriptionSaveStatus,
              staticToolbarActions: onBrowseAttachment ? (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          if (!isSubmitting && !isUploading) {
                            onBrowseAttachment();
                          }
                        }}
                        disabled={isSubmitting || isUploading}
                        className={cn(
                          'p-half rounded-sm transition-colors',
                          'text-low hover:text-normal hover:bg-panel/50',
                          'disabled:opacity-50 disabled:cursor-not-allowed'
                        )}
                        title={t('kanban.attachFile')}
                        aria-label={t('kanban.attachFile')}
                      >
                        <PaperclipIcon className="size-icon-sm" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {t('kanban.attachFileHint')}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ) : null,
            })}
            {attachmentError && (
              <div className="px-base">
                <ErrorAlert
                  message={attachmentError}
                  className="mt-half mb-half"
                  onDismiss={onDismissAttachmentError}
                  dismissLabel={t('buttons.close')}
                />
              </div>
            )}
            {dropzoneProps?.isDragActive && (
              <div className="absolute inset-0 z-50 bg-primary/80 backdrop-blur-sm border-2 border-dashed border-brand rounded flex items-center justify-center pointer-events-none animate-in fade-in-0 duration-150">
                <div className="text-center">
                  <div className="mx-auto mb-2 w-10 h-10 rounded-full bg-brand/10 flex items-center justify-center">
                    <ImageIcon className="h-5 w-5 text-brand" />
                  </div>
                  <p className="text-sm font-medium text-high">
                    {t('kanban.dropFilesHere')}
                  </p>
                  <p className="text-xs text-low mt-0.5">
                    {t('kanban.fileDropHint')}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Create Draft Workspace Toggle (Create mode only) */}
        {isCreateMode && (
          <div className="p-base border-t">
            <Toggle
              checked={formData.createDraftWorkspace}
              onCheckedChange={(checked) =>
                onFormChange('createDraftWorkspace', checked)
              }
              label={t('kanban.createDraftWorkspaceImmediately')}
              description={t('kanban.createDraftWorkspaceDescription')}
              disabled={isSubmitting}
            />
          </div>
        )}

        {/* Create Issue Button (Create mode only) */}
        {isCreateMode && (
          <div className="px-base pb-base flex items-center gap-half">
            <PrimaryButton
              value={t('kanban.createIssue')}
              onClick={onSubmit}
              disabled={isSubmitting || !formData.title.trim()}
              actionIcon={isSubmitting ? 'spinner' : undefined}
              variant="default"
            />
            {onDeleteDraft && (
              <IconButton
                icon={TrashIcon}
                onClick={onDeleteDraft}
                disabled={isSubmitting}
                aria-label="Delete draft"
                title="Delete draft"
                className="hover:text-error hover:bg-error/10"
              />
            )}
          </div>
        )}

        {/* Workspaces Section (Edit mode only) */}
        {!isCreateMode && issueId && renderWorkspacesSection && (
          <div className="border-t">{renderWorkspacesSection(issueId)}</div>
        )}

        {/* Relationships Section (Edit mode only) */}
        {!isCreateMode && issueId && renderRelationshipsSection && (
          <div className="border-t">{renderRelationshipsSection(issueId)}</div>
        )}

        {/* Sub-Issues Section (Edit mode only) */}
        {!isCreateMode && issueId && renderSubIssuesSection && (
          <div className="border-t">{renderSubIssuesSection(issueId)}</div>
        )}

        {/* Comments Section (Edit mode only) */}
        {!isCreateMode && issueId && renderCommentsSection && (
          <div className="border-t">{renderCommentsSection(issueId)}</div>
        )}
      </div>
    </div>
  );
}
