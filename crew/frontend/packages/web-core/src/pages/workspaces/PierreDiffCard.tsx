import { useMemo, useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  CaretDownIcon,
  ChatCircleIcon,
  GithubLogoIcon,
  PlusIcon,
} from '@phosphor-icons/react';
import { FileDiff } from '@pierre/diffs/react';
import type {
  DiffLineAnnotation,
  AnnotationSide,
  ChangeContent,
} from '@pierre/diffs';
import { cn } from '@/shared/lib/utils';
import { DiffSide } from '@/shared/types/diff';
import {
  transformDiffToFileDiffMetadata,
  transformCommentsToAnnotations,
  type CommentAnnotation,
} from '@/shared/lib/diffDataAdapter';
import { useTheme } from '@/shared/hooks/useTheme';
import { getActualTheme } from '@/shared/lib/theme';
import {
  useDiffViewMode,
  useWrapTextDiff,
  useIgnoreWhitespaceDiff,
} from '@/shared/stores/useDiffViewStore';
import { useReview, type ReviewDraft } from '@/shared/hooks/useReview';
import { useWorkspaceContext } from '@/shared/hooks/useWorkspaceContext';
import { getFileIcon } from '@/shared/lib/fileTypeIcon';
import { OpenInIdeButton } from '@/shared/components/OpenInIdeButton';
import { useOpenInEditor } from '@/shared/hooks/useOpenInEditor';
import { ReviewCommentRenderer } from './ReviewCommentRenderer';
import { GitHubCommentRenderer } from './GitHubCommentRenderer';
import { CommentWidgetLine } from './CommentWidgetLine';
import { DisplayTruncatedPath } from '@/shared/lib/TruncatePath';
import { stripLineEnding, splitLines } from '@/shared/lib/string';
import type { Diff } from 'shared/types';

/**
 * Extracts a specific line from file content.
 * @param content - The full file content as a string
 * @param lineNumber - The 1-indexed line number to extract
 * @returns The line content, or undefined if the line doesn't exist
 */
function getLineContent(
  content: string | null,
  lineNumber: number
): string | undefined {
  if (!content) return undefined;
  const lines = splitLines(content);
  const index = lineNumber - 1; // Convert 1-indexed to 0-indexed
  if (index < 0 || index >= lines.length) return undefined;
  return stripLineEnding(lines[index]);
}

/**
 * Gets the appropriate line content based on whether the comment is on
 * the old (deletions) or new (additions) side of the diff.
 * @param diff - The Diff object containing oldContent and newContent
 * @param lineNumber - The 1-indexed line number
 * @param side - The side of the diff (Old for deletions, New for additions)
 * @returns The line content, or undefined if not available
 */
function getCodeLineForComment(
  diff: Diff,
  lineNumber: number,
  side: DiffSide
): string | undefined {
  const content = side === DiffSide.Old ? diff.oldContent : diff.newContent;
  return getLineContent(content, lineNumber);
}

/**
 * CSS overrides for @pierre/diffs to match our app's theme.
 * Injected via unsafeCSS which applies at @layer unsafe (highest priority).
 */
const PIERRE_DIFFS_THEME_CSS = `
  [data-separator="line-info"][data-separator-first] {
    margin-top: 4px;
  }
  [data-separator="line-info"][data-separator-last] {
    margin-bottom: 4px;
  }

  /* Add space for hover comment button between line numbers and code */
  [data-indicators='classic'] [data-column-content] {
    position: relative !important;
    padding-inline-start: 34px !important;
  }

  /* Move +/- indicator right to make room for hover button */
  [data-indicators='classic'] [data-line-type='change-addition'] [data-column-content]::before,
  [data-indicators='classic'] [data-line-type='change-deletion'] [data-column-content]::before {
    left: 22px !important;
  }

  /* Position hover utility dynamically based on line number column width */
  [data-hover-slot] {
    right: auto !important;
    left: calc(var(--diffs-column-number-width, 3ch) - 25px) !important;
    width: 22px !important;
  }

  /* Keep annotations full-row without inheriting long-line scroll width */
  [data-annotation-content] {
    grid-column: 1 / -1 !important;
    left: 0 !important;
    width: var(--diffs-column-width, 100%) !important;
    max-width: 100% !important;
  }
  
  [data-line-annotation] {
    grid-column: 1 / -1 !important;
  }

  /* Show scrollbar only on hover */
  [data-code] {
    padding-bottom: 0 !important;
  }
  [data-code]::-webkit-scrollbar {
    height: 8px !important;
    background: transparent !important;
  }
  [data-code]::-webkit-scrollbar-track {
    background: transparent !important;
  }
  [data-code]::-webkit-scrollbar-thumb {
    background-color: transparent !important;
    border-radius: 4px !important;
  }
  [data-code]:hover::-webkit-scrollbar-thumb {
    background-color: hsl(var(--text-low) / 0.3) !important;
  }

  /* Light theme overrides */
  [data-diffs][data-theme-type='light'] {
    --diffs-gap-style: none !important;
    
    /* Background colors - use standard CSS variables */
    --diffs-light-bg: hsl(var(--bg-primary)) !important;
    --diffs-bg-context-override: hsl(var(--bg-primary)) !important;
    --diffs-bg-separator-override: hsl(var(--bg-primary)) !important;
    
    /* Addition colors - soft green matching old design */
    --diffs-light-addition-color: hsl(160, 77%, 35%) !important;
    --diffs-bg-addition-override: hsl(160, 77%, 88%) !important;
    --diffs-bg-addition-number-override: hsl(160, 77%, 85%) !important;
    --diffs-bg-addition-hover-override: hsl(160, 77%, 82%) !important;
    
    /* Deletion colors - soft red matching old design */
    --diffs-light-deletion-color: hsl(10, 100%, 40%) !important;
    --diffs-bg-deletion-override: hsl(10, 100%, 90%) !important;
    --diffs-bg-deletion-number-override: hsl(10, 100%, 87%) !important;
    --diffs-bg-deletion-hover-override: hsl(10, 100%, 84%) !important;
    
    /* Line numbers */
    --diffs-fg-number-override: hsl(var(--text-low)) !important;
  }

  /* Dark theme overrides */
  [data-diffs][data-theme-type='dark'] {
    --diffs-gap-style: none !important;
    
    /* Background colors - use standard CSS variables */
    --diffs-dark-bg: hsl(var(--bg-panel)) !important;
    --diffs-bg-context-override: hsl(var(--bg-panel)) !important;
    --diffs-bg-separator-override: hsl(var(--bg-panel)) !important;
    --diffs-bg-hover-override: hsl(0, 0%, 22%) !important;
    
    /* Addition colors - dark green */
    --diffs-dark-addition-color: hsl(130, 50%, 50%) !important;
    --diffs-bg-addition-override: hsl(130, 30%, 20%) !important;
    --diffs-bg-addition-number-override: hsl(130, 30%, 18%) !important;
    --diffs-bg-addition-hover-override: hsl(130, 30%, 25%) !important;
    
    /* Deletion colors - dark red */
    --diffs-dark-deletion-color: hsl(12, 50%, 55%) !important;
    --diffs-bg-deletion-override: hsl(12, 30%, 18%) !important;
    --diffs-bg-deletion-number-override: hsl(12, 30%, 16%) !important;
    --diffs-bg-deletion-hover-override: hsl(12, 30%, 23%) !important;
    
    /* Line numbers */
    --diffs-fg-number-override: hsl(var(--text-low)) !important;
  }
`;

interface PierreDiffCardProps {
  diff: Diff;
  expanded: boolean;
  onToggle: () => void;
  attemptId: string;
  className: string;
}

type ExtendedCommentAnnotation =
  | CommentAnnotation
  | { type: 'draft'; draft: ReviewDraft; widgetKey: string };

function mapSideToAnnotationSide(side: DiffSide): AnnotationSide {
  return side === DiffSide.Old ? 'deletions' : 'additions';
}

function mapAnnotationSideToSplitSide(side: AnnotationSide): DiffSide {
  return side === 'deletions' ? DiffSide.Old : DiffSide.New;
}

export function PierreDiffCard({
  diff,
  expanded,
  onToggle,
  attemptId,
  className = '',
}: PierreDiffCardProps) {
  const { t } = useTranslation('tasks');
  const { theme } = useTheme();
  const actualTheme = getActualTheme(theme);
  const globalMode = useDiffViewMode();
  const wrapText = useWrapTextDiff();
  const ignoreWhitespace = useIgnoreWhitespaceDiff();

  const { comments, drafts, setDraft, addComment } = useReview();
  const { showGitHubComments, getGitHubCommentsForFile } =
    useWorkspaceContext();

  // File path logic
  const filePath = diff.newPath || diff.oldPath || 'unknown';
  const oldPath = diff.oldPath;
  const changeKind = diff.change;

  const openInEditor = useOpenInEditor(attemptId);
  const handleOpenInIde = useCallback(() => {
    openInEditor({ filePath });
  }, [openInEditor, filePath]);

  // Transform diff to pierre/diffs metadata
  const fileDiffMetadata = useMemo(
    () => transformDiffToFileDiffMetadata(diff, { ignoreWhitespace }),
    [diff, ignoreWhitespace]
  );

  const additions = useMemo(() => {
    return fileDiffMetadata.hunks.reduce((acc, hunk) => {
      return (
        acc +
        hunk.hunkContent.reduce((count, content) => {
          if (content.type === 'change') {
            return count + (content as ChangeContent).additions.length;
          }
          return count;
        }, 0)
      );
    }, 0);
  }, [fileDiffMetadata]);

  const deletions = useMemo(() => {
    return fileDiffMetadata.hunks.reduce((acc, hunk) => {
      return (
        acc +
        hunk.hunkContent.reduce((count, content) => {
          if (content.type === 'change') {
            return count + (content as ChangeContent).deletions.length;
          }
          return count;
        }, 0)
      );
    }, 0);
  }, [fileDiffMetadata]);

  const hasStats = additions > 0 || deletions > 0;

  const FileIcon = getFileIcon(filePath, actualTheme);

  // Change Label
  const getChangeLabel = (kind?: string): string | null => {
    switch (kind) {
      case 'added':
        return 'Added';
      case 'deleted':
        return 'Deleted';
      case 'renamed':
        return 'Renamed';
      case 'copied':
        return 'Copied';
      case 'permissionChange':
        return 'Perm';
      default:
        return null;
    }
  };
  const changeLabel = getChangeLabel(changeKind);

  const commentsForFile = useMemo(
    () => comments.filter((c) => c.filePath === filePath),
    [comments, filePath]
  );

  const githubCommentsForFile = useMemo(() => {
    if (!showGitHubComments) return [];
    return getGitHubCommentsForFile(filePath);
  }, [showGitHubComments, getGitHubCommentsForFile, filePath]);

  const totalCommentCount =
    commentsForFile.length + githubCommentsForFile.length;

  const annotations = useMemo(() => {
    // 1. Get standard comments
    const baseAnnotations = transformCommentsToAnnotations(
      commentsForFile,
      githubCommentsForFile,
      filePath
    ) as DiffLineAnnotation<ExtendedCommentAnnotation>[];

    // 2. Add drafts
    const draftAnnotations: DiffLineAnnotation<ExtendedCommentAnnotation>[] =
      [];
    Object.entries(drafts).forEach(([key, draft]) => {
      if (!draft || draft.filePath !== filePath) return;

      draftAnnotations.push({
        side: mapSideToAnnotationSide(draft.side),
        lineNumber: draft.lineNumber,
        metadata: {
          type: 'draft',
          draft,
          widgetKey: key,
        },
      });
    });

    return [...baseAnnotations, ...draftAnnotations];
  }, [commentsForFile, githubCommentsForFile, filePath, drafts]);

  const renderAnnotation = useCallback(
    (annotation: DiffLineAnnotation<ExtendedCommentAnnotation>) => {
      const { metadata } = annotation;

      if (metadata.type === 'draft') {
        return (
          <CommentWidgetLine
            draft={metadata.draft}
            widgetKey={metadata.widgetKey}
            onSave={() => {}}
            onCancel={() => {}}
          />
        );
      }

      if (metadata.type === 'github') {
        const githubComment = metadata.comment;
        const handleCopyToUserComment = () => {
          const codeLine = getCodeLineForComment(
            diff,
            githubComment.lineNumber,
            githubComment.side
          );
          addComment({
            filePath,
            lineNumber: githubComment.lineNumber,
            side: githubComment.side,
            text: githubComment.body,
            ...(codeLine !== undefined ? { codeLine } : {}),
          });
        };
        return (
          <GitHubCommentRenderer
            comment={githubComment}
            onCopyToUserComment={handleCopyToUserComment}
          />
        );
      }

      return <ReviewCommentRenderer comment={metadata.comment} />;
    },
    [filePath, addComment, diff]
  );

  // Handle line click to add comment
  const handleLineClick = useCallback(
    (props: { lineNumber: number; annotationSide: AnnotationSide }) => {
      const { lineNumber, annotationSide } = props;
      const splitSide = mapAnnotationSideToSplitSide(annotationSide);
      const widgetKey = `${filePath}-${splitSide}-${lineNumber}`;

      // Don't create a new draft if one already exists
      if (drafts[widgetKey]) return;

      const codeLine = getCodeLineForComment(diff, lineNumber, splitSide);

      setDraft(widgetKey, {
        filePath,
        side: splitSide,
        lineNumber,
        text: '',
        ...(codeLine !== undefined ? { codeLine } : {}),
      });
    },
    [filePath, drafts, setDraft, diff]
  );

  const renderHoverUtility = useCallback(
    (
      getHoveredLine: () =>
        | { lineNumber: number; side: AnnotationSide }
        | undefined
    ) => {
      return (
        <button
          className="flex items-center justify-center size-icon-base rounded text-brand bg-brand/20 transition-transform hover:scale-110"
          onClick={() => {
            const line = getHoveredLine();
            if (!line) return;

            const { side, lineNumber } = line;
            const splitSide = mapAnnotationSideToSplitSide(side);
            const widgetKey = `${filePath}-${splitSide}-${lineNumber}`;

            if (drafts[widgetKey]) return;

            const codeLine = getCodeLineForComment(diff, lineNumber, splitSide);

            setDraft(widgetKey, {
              filePath,
              side: splitSide,
              lineNumber,
              text: '',
              ...(codeLine !== undefined ? { codeLine } : {}),
            });
          }}
          title={t('common:comments.addReviewComment')}
        >
          <PlusIcon className="size-3.5" weight="bold" />
        </button>
      );
    },
    [filePath, drafts, setDraft, t, diff]
  );

  const fileDiffOptions = useMemo(
    () => ({
      diffStyle:
        globalMode === 'split' ? ('split' as const) : ('unified' as const),
      diffIndicators: 'classic' as const,
      themeType: actualTheme,
      overflow: wrapText ? ('wrap' as const) : ('scroll' as const),
      hunkSeparators: 'line-info' as const,
      disableFileHeader: true,
      enableHoverUtility: true,
      onLineClick: handleLineClick,
      theme: { dark: 'github-dark', light: 'github-light' } as const,
      unsafeCSS: PIERRE_DIFFS_THEME_CSS,
    }),
    [globalMode, actualTheme, wrapText, handleLineClick]
  );

  // Large diff placeholder logic
  const LARGE_DIFF_THRESHOLD = 2000;
  const [forceExpanded, setForceExpanded] = useState(false);
  const totalLines = additions + deletions;
  const isLargeDiff = totalLines > LARGE_DIFF_THRESHOLD;
  const shouldShowPlaceholder = expanded && isLargeDiff && !forceExpanded;

  return (
    <div className={cn('pb-base rounded-sm', className)}>
      <div
        className={cn(
          'w-full flex items-center bg-primary px-base gap-base sticky top-0 z-10 border-b border-transparent',
          'cursor-pointer',
          expanded && 'rounded-t-sm'
        )}
        onClick={onToggle}
      >
        <span className="relative shrink-0">
          <FileIcon className="size-icon-base" />
        </span>
        {changeLabel && (
          <span
            className={cn(
              'text-sm shrink-0 bg-primary rounded-sm px-half',
              changeKind === 'deleted' && 'text-error border border-error/20',
              changeKind === 'added' && 'text-success border border-success/20'
            )}
          >
            {changeLabel}
          </span>
        )}
        <div
          className={cn(
            'text-sm flex-1 min-w-0',
            changeKind === 'deleted' && 'text-error line-through'
          )}
        >
          <DisplayTruncatedPath path={filePath} />
        </div>
        {(changeKind === 'renamed' || changeKind === 'copied') && oldPath && (
          <span className="text-low text-sm shrink-0">
            ← {oldPath.split('/').pop()}
          </span>
        )}
        {hasStats && (
          <span className="text-sm shrink-0">
            {additions > 0 && (
              <span className="text-success">+{additions}</span>
            )}
            {additions > 0 && deletions > 0 && ' '}
            {deletions > 0 && <span className="text-error">-{deletions}</span>}
          </span>
        )}
        {totalCommentCount > 0 && (
          <span className="inline-flex items-center gap-half px-base py-0.5 text-xs rounded shrink-0">
            {commentsForFile.length > 0 && (
              <span className="inline-flex items-center gap-0.5 text-accent">
                <ChatCircleIcon className="size-icon-xs" weight="fill" />
                {commentsForFile.length}
              </span>
            )}
            {githubCommentsForFile.length > 0 && (
              <span className="inline-flex items-center gap-0.5 text-low">
                <GithubLogoIcon className="size-icon-xs" weight="fill" />
                {githubCommentsForFile.length}
              </span>
            )}
          </span>
        )}
        <div className="flex items-center gap-half shrink-0">
          <span onClick={(e) => e.stopPropagation()}>
            <OpenInIdeButton
              onClick={handleOpenInIde}
              className="size-icon-xs p-0"
            />
          </span>
          <CaretDownIcon
            className={cn(
              'size-icon-xs text-low transition-transform',
              !expanded && '-rotate-90'
            )}
          />
        </div>
      </div>

      {expanded && (
        <div className="bg-primary rounded-b-sm overflow-hidden">
          {shouldShowPlaceholder ? (
            <div className="p-base bg-warning/5 border-t border-warning/20">
              <div className="flex items-center justify-between gap-base">
                <div className="text-sm text-low">
                  <span className="font-medium text-warning">
                    {t('diff.largeDiff.title')}
                  </span>
                  <span className="ml-base">
                    {t('diff.largeDiff.linesChanged', { count: totalLines })}
                    <span className="text-success ml-base">
                      +{additions.toLocaleString()}
                    </span>
                    <span className="text-error ml-half">
                      -{deletions.toLocaleString()}
                    </span>
                  </span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setForceExpanded(true);
                  }}
                  className="text-sm text-brand hover:text-brand-hover transition-colors"
                >
                  {t('diff.largeDiff.loadAnyway')}
                </button>
              </div>
              <p className="text-xs text-low mt-half">
                {t('diff.largeDiff.warning')}
              </p>
            </div>
          ) : (
            <FileDiff
              fileDiff={fileDiffMetadata}
              options={fileDiffOptions}
              lineAnnotations={annotations}
              renderAnnotation={renderAnnotation}
              renderHoverUtility={renderHoverUtility}
            />
          )}
        </div>
      )}
    </div>
  );
}
