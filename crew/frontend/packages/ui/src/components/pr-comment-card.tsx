import { MessageSquare, Code, ExternalLink } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '../lib/cn';

export interface PrCommentCardProps {
  author: string;
  body: string;
  createdAt: string;
  url?: string | null;
  // Optional review-specific fields
  commentType?: 'general' | 'review';
  path?: string;
  line?: number | null;
  diffHunk?: string | null;
  /** Display variant: 'compact' for inline chip, 'full' for inline card, 'list' for block card */
  variant: 'compact' | 'full' | 'list';
  onClick?: (e: React.MouseEvent) => void;
  onDoubleClick?: (e: React.MouseEvent) => void;
  className?: string;
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleString();
  } catch {
    return dateStr;
  }
}

function truncateBody(body: string, maxLength: number): string {
  if (body.length <= maxLength) return body;
  return body.slice(0, maxLength - 3) + '...';
}

/**
 * Renders a diff hunk with syntax highlighting for added/removed lines
 */
function DiffHunk({ diffHunk }: { diffHunk: string }) {
  const lines = diffHunk.split('\n');

  return (
    <pre className="mt-2 p-2 bg-secondary rounded text-xs font-mono overflow-x-auto max-h-32 overflow-y-auto">
      {lines.map((line, i) => {
        let lineClass = 'block';
        if (line.startsWith('+') && !line.startsWith('+++')) {
          lineClass =
            'block bg-green-500/20 text-green-700 dark:text-green-400';
        } else if (line.startsWith('-') && !line.startsWith('---')) {
          lineClass = 'block bg-red-500/20 text-red-700 dark:text-red-400';
        } else if (line.startsWith('@@')) {
          lineClass = 'block text-muted-foreground';
        }
        return (
          <code key={i} className={lineClass}>
            {line}
          </code>
        );
      })}
    </pre>
  );
}

/**
 * Compact variant - inline chip for WYSIWYG editor
 */
function CompactCard({
  author,
  body,
  commentType,
  path,
  onClick,
  onDoubleClick,
  className,
}: PrCommentCardProps) {
  const { t } = useTranslation('tasks');
  const isReview = commentType === 'review';
  const Icon = isReview ? Code : MessageSquare;
  const displayText = isReview && path ? `${path}: ${body}` : body;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 py-0.5 bg-muted rounded border align-middle cursor-pointer border-border hover:border-muted-foreground max-w-[300px]',
        className
      )}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      role="button"
      tabIndex={0}
      title={`@${author}: ${body}\n\n${t('prComments.card.tooltip')}`}
    >
      <Icon className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
      <span className="text-xs font-medium flex-shrink-0">@{author}</span>
      <span className="text-xs text-muted-foreground truncate">
        {truncateBody(displayText, 50)}
      </span>
    </span>
  );
}

/**
 * Full variant - card for dialog selection
 */
function FullCard({
  author,
  body,
  createdAt,
  url,
  commentType,
  path,
  line,
  diffHunk,
  onClick,
  variant,
  className,
}: PrCommentCardProps) {
  const { t } = useTranslation('tasks');
  const isReview = commentType === 'review';
  const Icon = isReview ? Code : MessageSquare;

  return (
    <div
      className={cn(
        'p-3 bg-muted/50 rounded-md border border-border cursor-pointer hover:border-muted-foreground transition-colors overflow-hidden',
        variant === 'full' && 'inline-block align-bottom max-w-md',
        className
      )}
      onClick={onClick}
      role="button"
      tabIndex={0}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <Icon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          <span className="font-medium text-sm">@{author}</span>
          {isReview && (
            <span className="text-xs text-muted-foreground bg-secondary px-1.5 py-0.5 rounded">
              {t('prComments.card.review')}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0">
          <span>{formatDate(createdAt)}</span>
          {url && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                window.open(url, '_blank', 'noopener,noreferrer');
              }}
              className="hover:text-foreground transition-colors"
              aria-label="Open in browser"
            >
              <ExternalLink className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* File path for review comments */}
      {isReview && path && (
        <div className="text-xs font-mono text-primary/70 mb-1">
          {path}
          {line ? `:${line}` : ''}
        </div>
      )}

      {/* Diff hunk for review comments */}
      {isReview && diffHunk && <DiffHunk diffHunk={diffHunk} />}

      {/* Comment body */}
      <p className="text-sm text-muted-foreground whitespace-pre-wrap break-words mt-2">
        {body}
      </p>
    </div>
  );
}

/**
 * PrCommentCard - Shared presentational component for PR comments
 *
 * @param variant - 'compact' for inline chip, 'full' for inline card, 'list' for block card
 */
export function PrCommentCard(props: PrCommentCardProps) {
  if (props.variant === 'compact') {
    return <CompactCard {...props} />;
  }
  // Both 'full' and 'list' use FullCard, just with different styling
  return <FullCard {...props} />;
}
