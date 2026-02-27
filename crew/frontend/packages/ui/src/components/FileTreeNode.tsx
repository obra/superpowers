import { forwardRef, type ReactNode } from 'react';
import {
  CaretDownIcon,
  CaretRightIcon,
  FolderSimpleIcon,
  GithubLogoIcon,
} from '@phosphor-icons/react';
import { cn } from '../lib/cn';

export type FileTreeNodeType = 'file' | 'folder';
export type FileTreeNodeChangeKind =
  | 'added'
  | 'deleted'
  | 'modified'
  | 'renamed'
  | 'copied'
  | 'permissionChange';

export interface FileTreeNodeItem {
  id: string;
  name: string;
  path: string;
  type: FileTreeNodeType;
  diff?: {
    oldPath?: string | null;
  } | null;
  changeKind?: FileTreeNodeChangeKind;
  additions?: number | null;
  deletions?: number | null;
}

interface FileTreeNodeProps {
  node: FileTreeNodeItem;
  depth: number;
  isExpanded?: boolean;
  isSelected?: boolean;
  onToggle?: () => void;
  onSelect?: () => void;
  renderFileIcon?: (fileName: string) => ReactNode;
  /** GitHub comment count for this file */
  commentCount?: number;
  /** Whether to show the comment badge */
  showCommentBadge?: boolean;
}

export const FileTreeNode = forwardRef<HTMLDivElement, FileTreeNodeProps>(
  function FileTreeNode(
    {
      node,
      depth,
      isExpanded = false,
      isSelected = false,
      onToggle,
      onSelect,
      renderFileIcon,
      commentCount,
      showCommentBadge,
    },
    ref
  ) {
    const isFolder = node.type === 'folder';
    const isDeleted = node.changeKind === 'deleted';
    const isAdded = node.changeKind === 'added';
    const isRenamed = node.changeKind === 'renamed';
    const isCopied = node.changeKind === 'copied';
    const fileIcon = isFolder ? null : renderFileIcon?.(node.name);

    // Extract filename from path for renamed/copied display
    const getFileName = (path: string) => path.split('/').pop() || path;

    const handleClick = () => {
      if (isFolder && onToggle) {
        onToggle();
      } else if (!isFolder && onSelect) {
        onSelect();
      }
    };

    return (
      <div
        ref={ref}
        className={cn(
          'flex items-center h-[26px] cursor-pointer text-low hover:bg-panel rounded',
          'relative select-none',
          isSelected && 'bg-panel text-normal'
        )}
        onClick={handleClick}
      >
        {/* Indentation guides */}
        {depth > 0 && (
          <div className="absolute left-0 top-0 bottom-0 flex">
            {Array.from({ length: depth }).map((_, i) => (
              <div
                key={i}
                className="h-full w-3 flex justify-center"
                style={{ marginLeft: i === 0 ? '6px' : '0' }}
              >
                <div className="h-full border-l border-border" />
              </div>
            ))}
          </div>
        )}

        {/* Content with padding based on depth */}
        <div
          className="flex items-center gap-half flex-1 pr-base whitespace-nowrap"
          style={{ paddingLeft: `${depth * 12 + 6}px` }}
        >
          {/* Expand/collapse caret for folders */}
          <span className="w-3 flex items-center justify-center shrink-0">
            {isFolder &&
              (isExpanded ? (
                <CaretDownIcon className="size-icon-xs" weight="fill" />
              ) : (
                <CaretRightIcon className="size-icon-xs" weight="fill" />
              ))}
          </span>

          {/* Icon */}
          <span className="shrink-0">
            {isFolder ? (
              <FolderSimpleIcon className="size-icon-sm" weight="fill" />
            ) : null}
            {fileIcon}
          </span>

          {/* File/folder name - color based on change kind */}
          <span
            className={cn(
              'text-sm',
              isDeleted && 'text-error line-through',
              isAdded && 'text-success'
            )}
          >
            {node.name}
          </span>

          {/* Show old filename for renamed/copied files */}
          {(isRenamed || isCopied) && node.diff?.oldPath && (
            <span className="text-low text-sm shrink-0">
              ← {getFileName(node.diff.oldPath)}
            </span>
          )}

          {/* Stats for files */}
          {node.type === 'file' && (node.additions || node.deletions) && (
            <span className="text-sm shrink-0 ml-base">
              {node.additions != null && node.additions > 0 && (
                <span className="text-success">+{node.additions}</span>
              )}
              {node.additions != null &&
                node.additions > 0 &&
                node.deletions != null &&
                node.deletions > 0 &&
                ' '}
              {node.deletions != null && node.deletions > 0 && (
                <span className="text-error">-{node.deletions}</span>
              )}
            </span>
          )}

          {/* GitHub comment badge */}
          {showCommentBadge &&
            node.type === 'file' &&
            commentCount != null &&
            commentCount > 0 && (
              <span className="inline-flex items-center gap-0.5 text-xs text-low shrink-0 ml-half">
                <GithubLogoIcon className="size-icon-xs" weight="fill" />
                {commentCount}
              </span>
            )}
        </div>
      </div>
    );
  }
);
