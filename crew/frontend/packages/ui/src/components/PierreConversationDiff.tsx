import { type ElementType, type ReactNode, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  CaretDownIcon,
  FileIcon as DefaultFileIcon,
} from '@phosphor-icons/react';
import { FileDiff, PatchDiff } from '@pierre/diffs/react';
import {
  parseDiffFromFile,
  type FileContents,
  type FileDiffMetadata,
  type ChangeContent,
} from '@pierre/diffs';
import { cn } from '../lib/cn';
import { ToolStatusDot, type ToolStatusLike } from './ToolStatusDot';
import '../styles/diff-style-overrides.css';

/**
 * CSS overrides for @pierre/diffs to match our app's theme.
 * Injected via unsafeCSS which applies at @layer unsafe (highest priority).
 */
const PIERRE_DIFFS_THEME_CSS = `
  [data-separator="line-info"][data-separator-first] {
    padding-top: 4px;
  }
  [data-separator="line-info"][data-separator-last] {
    padding-bottom: 4px;
  }

  [data-disable-line-numbers][data-indicators='classic'] [data-column-content] {
    padding-inline-start: calc(2ch + 1ch);
  }
  [data-disable-line-numbers][data-indicators='classic'] [data-line-type='change-addition'] [data-column-content]::before,
  [data-disable-line-numbers][data-indicators='classic'] [data-line-type='change-deletion'] [data-column-content]::before {
    left: 1ch;
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

// Discriminated union for input format flexibility
export type DiffInput =
  | {
      type: 'content';
      oldContent: string;
      newContent: string;
      oldPath?: string;
      newPath: string;
    }
  | {
      type: 'unified';
      path: string;
      unifiedDiff: string;
      hasLineNumbers?: boolean;
    };

export type DiffViewTheme = 'light' | 'dark';
export type DiffViewMode = 'unified' | 'split';

interface DiffViewCardProps {
  input: DiffInput;
  expanded?: boolean;
  onToggle?: () => void;
  status?: ToolStatusLike;
  className?: string;
  fileIcon?: ElementType;
  theme: DiffViewTheme;
  diffMode?: DiffViewMode;
  wrapText?: boolean;
  ignoreWhitespace?: boolean;
}

interface DiffData {
  fileDiffMetadata: FileDiffMetadata | null;
  unifiedDiff: string | null;
  additions: number;
  deletions: number;
  filePath: string;
  isValid: boolean;
  hideLineNumbers: boolean;
}

function parseDiffStats(unifiedDiff: string): {
  additions: number;
  deletions: number;
} {
  let additions = 0;
  let deletions = 0;
  const lines = unifiedDiff.split('\n');
  for (const line of lines) {
    if (line.startsWith('+') && !line.startsWith('+++')) additions++;
    else if (line.startsWith('-') && !line.startsWith('---')) deletions++;
  }
  return { additions, deletions };
}

/**
 * Process input to get diff data and statistics
 */
export function useDiffData(
  input: DiffInput,
  options?: { ignoreWhitespace?: boolean }
): DiffData {
  return useMemo(() => {
    if (input.type === 'content') {
      const filePath = input.newPath || input.oldPath || 'unknown';
      const oldContent = input.oldContent || '';
      const newContent = input.newContent || '';

      if (oldContent === newContent) {
        return {
          fileDiffMetadata: null,
          unifiedDiff: null,
          additions: 0,
          deletions: 0,
          filePath,
          isValid: false,
          hideLineNumbers: false,
        };
      }

      try {
        const oldFile: FileContents = {
          name: input.oldPath || filePath,
          contents: oldContent,
        };
        const newFile: FileContents = {
          name: filePath,
          contents: newContent,
        };
        const metadata = parseDiffFromFile(
          oldFile,
          newFile,
          options?.ignoreWhitespace ? { ignoreWhitespace: true } : undefined
        );

        // Calculate additions/deletions from hunks
        let additions = 0;
        let deletions = 0;
        for (const hunk of metadata.hunks) {
          for (const content of hunk.hunkContent) {
            if (content.type === 'change') {
              const change = content as ChangeContent;
              additions += change.additions.length;
              deletions += change.deletions.length;
            }
          }
        }

        return {
          fileDiffMetadata: metadata,
          unifiedDiff: null,
          additions,
          deletions,
          filePath,
          isValid: true,
          hideLineNumbers: false,
        };
      } catch (e) {
        console.error('Failed to generate diff:', e);
        return {
          fileDiffMetadata: null,
          unifiedDiff: null,
          additions: 0,
          deletions: 0,
          filePath,
          isValid: false,
          hideLineNumbers: false,
        };
      }
    } else {
      // Handle unified diff string
      const { path, unifiedDiff, hasLineNumbers = true } = input;
      const { additions, deletions } = parseDiffStats(unifiedDiff);
      const isValid = unifiedDiff.trim().length > 0;

      return {
        fileDiffMetadata: null,
        unifiedDiff,
        additions,
        deletions,
        filePath: path,
        isValid,
        hideLineNumbers: !hasLineNumbers,
      };
    }
  }, [input, options?.ignoreWhitespace]);
}

export function DiffViewCard({
  input,
  expanded = false,
  onToggle,
  status,
  className,
  fileIcon,
  theme,
  diffMode = 'unified',
  wrapText = false,
  ignoreWhitespace = false,
}: DiffViewCardProps) {
  const {
    fileDiffMetadata,
    unifiedDiff,
    additions,
    deletions,
    filePath,
    isValid,
    hideLineNumbers,
  } = useDiffData(input, { ignoreWhitespace });

  const FileIcon = fileIcon ?? DefaultFileIcon;
  const hasStats = additions > 0 || deletions > 0;

  return (
    <div className={cn('rounded-sm border overflow-hidden', className)}>
      {/* Header */}
      <div
        className={cn(
          'flex items-center bg-panel p-base w-full',
          onToggle && 'cursor-pointer'
        )}
        onClick={onToggle}
      >
        <div className="flex-1 flex items-center gap-base min-w-0">
          <span className="relative shrink-0">
            <FileIcon className="size-icon-base" />
            {status && (
              <ToolStatusDot
                status={status}
                className="absolute -bottom-0.5 -right-0.5"
              />
            )}
          </span>
          <span className="text-sm text-normal truncate font-ibm-plex-mono">
            {filePath}
          </span>
          {hasStats && (
            <span className="text-sm shrink-0">
              {additions > 0 && (
                <span className="text-success">+{additions}</span>
              )}
              {additions > 0 && deletions > 0 && ' '}
              {deletions > 0 && (
                <span className="text-error">-{deletions}</span>
              )}
            </span>
          )}
        </div>
        {onToggle && (
          <CaretDownIcon
            className={cn(
              'size-icon-xs shrink-0 text-low transition-transform',
              !expanded && '-rotate-90'
            )}
          />
        )}
      </div>

      {/* Diff body - shown when expanded */}
      {expanded && (
        <DiffViewBody
          fileDiffMetadata={fileDiffMetadata}
          unifiedDiff={unifiedDiff}
          isValid={isValid}
          hideLineNumbers={hideLineNumbers}
          theme={theme}
          diffMode={diffMode}
          wrapText={wrapText}
        />
      )}
    </div>
  );
}

/**
 * Diff body component that renders the actual diff content
 */
export function DiffViewBody({
  fileDiffMetadata,
  unifiedDiff,
  isValid,
  hideLineNumbers,
  theme,
  diffMode = 'unified',
  wrapText,
  invalidMessage,
}: {
  fileDiffMetadata: FileDiffMetadata | null;
  unifiedDiff: string | null;
  isValid: boolean;
  hideLineNumbers?: boolean;
  theme: DiffViewTheme;
  diffMode?: DiffViewMode;
  wrapText?: boolean;
  invalidMessage?: ReactNode;
}) {
  const { t } = useTranslation('tasks');

  const options = useMemo(
    () => ({
      diffStyle:
        diffMode === 'split' ? ('split' as const) : ('unified' as const),
      diffIndicators: 'classic' as const,
      themeType: theme,
      overflow: wrapText ? ('wrap' as const) : ('scroll' as const),
      hunkSeparators: () => document.createDocumentFragment(),
      disableFileHeader: true,
      disableLineNumbers: hideLineNumbers,
      theme: { dark: 'github-dark', light: 'github-light' } as const,
      unsafeCSS: PIERRE_DIFFS_THEME_CSS,
    }),
    [diffMode, theme, wrapText, hideLineNumbers]
  );

  if (!isValid) {
    return (
      <div className="px-base pb-base text-xs font-ibm-plex-mono text-low">
        {invalidMessage ?? t('conversation.unableToRenderDiff')}
      </div>
    );
  }

  // For content-based diff
  if (fileDiffMetadata) {
    return <FileDiff fileDiff={fileDiffMetadata} options={options} />;
  }

  // For unified diff string
  if (unifiedDiff) {
    return <PatchDiff patch={unifiedDiff} options={options} />;
  }

  return null;
}
