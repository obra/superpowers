import type { Ref, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '../lib/cn';
import {
  DotsThreeIcon,
  SmileyIcon,
  ArrowUpIcon,
  PencilSimpleIcon,
  TrashIcon,
  ArrowBendUpLeftIcon,
  PaperclipIcon,
} from '@phosphor-icons/react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './RadixTooltip';
import { ErrorAlert } from './ErrorAlert';
import { UserAvatar, type UserAvatarUser } from './UserAvatar';
import { CollapsibleSectionHeader } from './CollapsibleSectionHeader';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from './Dropdown';
import { EmojiPicker } from './EmojiPicker';

export interface IssueCommentData {
  id: string;
  authorId: string | null;
  authorName: string;
  message: string;
  createdAt: string;
  author?: UserAvatarUser | null;
  canModify: boolean;
}

export interface ReactionGroup {
  emoji: string;
  count: number;
  hasReacted: boolean;
  reactionId: string | undefined;
  userNames: string[];
}

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays > 0) return `${diffDays}d`;
  if (diffHours > 0) return `${diffHours}h`;
  if (diffMinutes > 0) return `${diffMinutes}m`;
  return 'now';
}

interface DropzoneProps {
  getRootProps: () => Record<string, unknown>;
  getInputProps: () => Record<string, unknown>;
  isDragActive: boolean;
}

export interface IssueCommentsEditorProps {
  value: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  autoFocus?: boolean;
  onCmdEnter?: () => void;
  onPasteFiles?: (files: File[]) => void;
  editorRef?: Ref<unknown>;
}

interface IssueCommentsSectionProps {
  comments: IssueCommentData[];
  commentInput: string;
  onCommentInputChange: (value: string) => void;
  onSubmitComment: () => void;
  editingCommentId: string | null;
  editingValue: string;
  onEditingValueChange: (value: string) => void;
  onStartEdit: (commentId: string) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onDeleteComment: (id: string) => void;
  reactionsByCommentId: Map<string, ReactionGroup[]>;
  onToggleReaction: (commentId: string, emoji: string) => void;
  onReply: (authorName: string, message: string) => void;
  isLoading?: boolean;
  commentEditorRef?: Ref<unknown>;
  onPasteFiles?: (files: File[]) => void;
  dropzoneProps?: DropzoneProps;
  onBrowseAttachment?: () => void;
  isUploading?: boolean;
  attachmentError?: string | null;
  onDismissAttachmentError?: () => void;
  renderEditor: (props: IssueCommentsEditorProps) => ReactNode;
}

export function IssueCommentsSection({
  comments,
  commentInput,
  onCommentInputChange,
  onSubmitComment,
  editingCommentId,
  editingValue,
  onEditingValueChange,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onDeleteComment,
  reactionsByCommentId,
  onToggleReaction,
  onReply,
  isLoading,
  commentEditorRef,
  onPasteFiles,
  dropzoneProps,
  onBrowseAttachment,
  isUploading,
  attachmentError,
  onDismissAttachmentError,
  renderEditor,
}: IssueCommentsSectionProps) {
  const { t } = useTranslation('common');

  return (
    <CollapsibleSectionHeader
      title={t('kanban.comments')}
      persistKey="kanban-issue-comments"
      defaultExpanded={true}
      actions={[]}
    >
      <div className="p-base flex flex-col gap-base border-t">
        {/* Comments list */}
        {isLoading ? (
          <div className="flex flex-col gap-double animate-pulse">
            <div className="h-4 bg-secondary rounded w-3/4" />
            <div className="h-4 bg-secondary rounded w-1/2" />
          </div>
        ) : comments.length === 0 ? (
          <p className="text-low">{t('kanban.noCommentsYet')}</p>
        ) : (
          comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              isEditing={editingCommentId === comment.id}
              editValue={editingCommentId === comment.id ? editingValue : ''}
              onEditValueChange={onEditingValueChange}
              onStartEdit={() => onStartEdit(comment.id)}
              onSaveEdit={onSaveEdit}
              onCancelEdit={onCancelEdit}
              onDelete={() => onDeleteComment(comment.id)}
              reactions={reactionsByCommentId.get(comment.id) ?? []}
              onToggleReaction={(emoji) => onToggleReaction(comment.id, emoji)}
              onReply={() => onReply(comment.authorName, comment.message)}
              renderEditor={renderEditor}
            />
          ))
        )}

        {/* Comment Input with WYSIWYG + dropzone */}
        <div
          {...dropzoneProps?.getRootProps()}
          className="relative flex flex-col gap-double bg-secondary border border-border rounded-sm p-double"
        >
          <input {...dropzoneProps?.getInputProps()} />
          {renderEditor({
            value: commentInput,
            onChange: onCommentInputChange,
            placeholder: t('kanban.enterCommentPlaceholder'),
            className: 'min-h-[20px]',
            onCmdEnter: onSubmitComment,
            onPasteFiles,
            autoFocus: false,
            editorRef: commentEditorRef,
          })}
          {attachmentError && (
            <div className="mb-half">
              <ErrorAlert
                message={attachmentError}
                onDismiss={onDismissAttachmentError}
                dismissLabel={t('buttons.close')}
              />
            </div>
          )}
          <div className="flex items-center justify-end gap-half">
            {onBrowseAttachment && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={onBrowseAttachment}
                      title={t('kanban.attachFile')}
                      className={cn(
                        'size-[22px] rounded-full bg-panel border border-border',
                        'flex items-center justify-center',
                        'text-low hover:text-normal transition-colors'
                      )}
                      aria-label={t('kanban.attachFile')}
                    >
                      <PaperclipIcon size={12} />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>{t('kanban.attachFileHint')}</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            <button
              type="button"
              onClick={onSubmitComment}
              disabled={!commentInput.trim() || isUploading}
              className={cn(
                'size-[22px] rounded-full bg-panel border border-border',
                'flex items-center justify-center',
                'text-high hover:bg-secondary transition-colors',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
            >
              <ArrowUpIcon size={12} weight="bold" />
            </button>
          </div>
          {dropzoneProps?.isDragActive && (
            <div className="absolute inset-0 z-50 bg-primary/80 backdrop-blur-sm border-2 border-dashed border-brand rounded flex items-center justify-center">
              <p className="text-sm font-medium text-high">
                {t('kanban.dropFilesHere')}
              </p>
            </div>
          )}
        </div>
      </div>
    </CollapsibleSectionHeader>
  );
}

interface CommentItemProps {
  comment: IssueCommentData;
  isEditing: boolean;
  editValue: string;
  onEditValueChange: (value: string) => void;
  onStartEdit: () => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onDelete: () => void;
  reactions: ReactionGroup[];
  onToggleReaction: (emoji: string) => void;
  onReply: () => void;
  renderEditor: (props: IssueCommentsEditorProps) => ReactNode;
}

function CommentItem({
  comment,
  isEditing,
  editValue,
  onEditValueChange,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onDelete,
  reactions,
  onToggleReaction,
  onReply,
  renderEditor,
}: CommentItemProps) {
  const { t } = useTranslation('common');
  const timeAgo = formatRelativeTime(comment.createdAt);

  return (
    <div className="flex flex-col gap-base">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-base">
          {comment.author ? (
            <UserAvatar user={comment.author} className="size-4" />
          ) : (
            <div className="size-4 rounded-full bg-secondary border border-border flex items-center justify-center text-[10px] text-low">
              {comment.authorName.charAt(0).toUpperCase()}
            </div>
          )}
          <span className="font-medium text-low">{comment.authorName}</span>
          <span className="font-medium text-low">·</span>
          <span className="font-light text-low">{timeAgo}</span>
        </div>
        {/* Menu dropdown - only shown if user can modify */}
        {comment.canModify && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="size-5 flex items-center justify-center text-low hover:text-normal">
                <DotsThreeIcon size={16} weight="bold" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem icon={PencilSimpleIcon} onSelect={onStartEdit}>
                {t('buttons.edit')}
              </DropdownMenuItem>
              <DropdownMenuItem
                icon={TrashIcon}
                variant="destructive"
                onSelect={onDelete}
              >
                {t('buttons.delete')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Message - editable or read-only */}
      {isEditing ? (
        <div className="flex flex-col gap-half bg-primary border border-border rounded-sm p-double">
          {renderEditor({
            value: editValue,
            onChange: onEditValueChange,
            autoFocus: true,
            onCmdEnter: onSaveEdit,
            className: 'min-h-[40px]',
          })}
          <div className="flex gap-half justify-end">
            <button
              type="button"
              onClick={onCancelEdit}
              className="px-base py-half text-low hover:text-normal"
            >
              {t('buttons.cancel')}
            </button>
            <button
              type="button"
              onClick={onSaveEdit}
              disabled={!editValue.trim()}
              className={cn(
                'px-base py-half bg-brand text-on-brand rounded-sm',
                'hover:bg-brand-hover disabled:opacity-50'
              )}
            >
              {t('buttons.save')}
            </button>
          </div>
        </div>
      ) : (
        renderEditor({
          value: comment.message,
          disabled: true,
          className: 'text-normal',
        })
      )}

      {/* Reactions row */}
      <div className="flex items-center gap-base flex-wrap">
        {/* Existing reactions */}
        <TooltipProvider>
          {reactions.map((reaction) => (
            <Tooltip key={reaction.emoji}>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => onToggleReaction(reaction.emoji)}
                  className={cn(
                    'flex items-center gap-half px-base py-half rounded-sm',
                    'border transition-colors',
                    reaction.hasReacted
                      ? 'bg-brand/10 border-brand text-brand'
                      : 'bg-secondary border-border text-low hover:text-normal'
                  )}
                >
                  <span className="color-emoji">{reaction.emoji}</span>
                  <span className="text-xs">{reaction.count}</span>
                </button>
              </TooltipTrigger>
              <TooltipContent className="bg-panel border border-border">
                {reaction.userNames.join(', ')}
              </TooltipContent>
            </Tooltip>
          ))}
        </TooltipProvider>

        {/* Add reaction button */}
        <EmojiPicker onSelect={onToggleReaction}>
          <button
            type="button"
            className="size-6 flex items-center justify-center text-low hover:text-normal rounded-sm hover:bg-secondary transition-colors"
          >
            <SmileyIcon size={16} />
          </button>
        </EmojiPicker>

        {/* Reply button */}
        <button
          type="button"
          onClick={onReply}
          className="flex items-center gap-half text-low hover:text-normal transition-colors"
        >
          <ArrowBendUpLeftIcon size={16} />
          <span className="font-light">{t('buttons.reply')}</span>
        </button>
      </div>
    </div>
  );
}
