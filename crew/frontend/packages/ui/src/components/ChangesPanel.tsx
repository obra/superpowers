import type { ForwardedRef, ReactNode, RefAttributes } from 'react';
import { forwardRef, useImperativeHandle, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Virtuoso, VirtuosoHandle, ListRange } from 'react-virtuoso';
import { cn } from '../lib/cn';

export interface ChangesPanelHandle {
  scrollToIndex: (
    index: number,
    options?: { align?: 'start' | 'center' | 'end' }
  ) => void;
}

export interface ChangesPanelDiff {
  newPath?: string | null;
  oldPath?: string | null;
  additions?: number | null;
  deletions?: number | null;
}

export interface DiffItemData<
  TDiff extends ChangesPanelDiff = ChangesPanelDiff,
> {
  diff: TDiff;
  initialExpanded?: boolean;
}

export interface RenderDiffItemProps<
  TDiff extends ChangesPanelDiff = ChangesPanelDiff,
> {
  diff: TDiff;
  initialExpanded?: boolean;
  attemptId: string;
}

export interface ChangesPanelProps<
  TDiff extends ChangesPanelDiff = ChangesPanelDiff,
> {
  className?: string;
  diffItems: DiffItemData<TDiff>[];
  renderDiffItem: (props: RenderDiffItemProps<TDiff>) => ReactNode;
  onDiffRef?: (path: string, el: HTMLDivElement | null) => void;
  /** Callback for Virtuoso's scroll container ref */
  onScrollerRef?: (ref: HTMLElement | Window | null) => void;
  /** Callback when visible range changes (for scroll sync) */
  onRangeChanged?: (range: { startIndex: number; endIndex: number }) => void;
  /** Attempt ID for opening files in IDE */
  attemptId: string;
}

const HEADER_HEIGHT = 48;
const LINE_HEIGHT = 20;
const PADDING = 16;
const SPACING = 8;

function getDiffPath(diff: ChangesPanelDiff): string {
  return diff.newPath || diff.oldPath || '';
}

function estimateDiffHeight(
  diff: ChangesPanelDiff,
  isExpanded: boolean
): number {
  if (!isExpanded) {
    return HEADER_HEIGHT + SPACING;
  }

  const lineCount = (diff.additions ?? 0) + (diff.deletions ?? 0);
  const estimatedLines = Math.max(lineCount * 1.2, 10);

  return HEADER_HEIGHT + estimatedLines * LINE_HEIGHT + PADDING + SPACING;
}

function calculateDefaultHeight(diffs: ChangesPanelDiff[]): number {
  if (diffs.length === 0) return 200;

  const heights = diffs.map((diff) => estimateDiffHeight(diff, true));
  heights.sort((a, b) => a - b);

  const mid = Math.floor(heights.length / 2);
  return heights.length % 2 === 0
    ? (heights[mid - 1] + heights[mid]) / 2
    : heights[mid];
}

const ChangesPanelInner = <TDiff extends ChangesPanelDiff>(
  {
    className,
    diffItems,
    renderDiffItem,
    onDiffRef,
    onScrollerRef,
    onRangeChanged,
    attemptId,
  }: ChangesPanelProps<TDiff>,
  ref: ForwardedRef<ChangesPanelHandle>
) => {
  const { t } = useTranslation(['tasks', 'common']);
  const virtuosoRef = useRef<VirtuosoHandle>(null);

  useImperativeHandle(ref, () => ({
    scrollToIndex: (
      index: number,
      options?: { align?: 'start' | 'center' | 'end' }
    ) => {
      virtuosoRef.current?.scrollToIndex({
        index,
        align: options?.align ?? 'start',
        behavior: 'auto',
      });
    },
  }));

  const handleRangeChanged = (range: ListRange) => {
    onRangeChanged?.({
      startIndex: range.startIndex,
      endIndex: range.endIndex,
    });
  };

  const defaultItemHeight = useMemo(
    () => calculateDefaultHeight(diffItems.map((item) => item.diff)),
    [diffItems]
  );

  if (diffItems.length === 0) {
    return (
      <div
        className={cn(
          'w-full h-full bg-secondary flex flex-col px-base',
          className
        )}
      >
        <div className="flex-1 flex items-center justify-center text-low">
          <p className="text-sm">{t('common:empty.noChanges')}</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'w-full h-full bg-secondary flex flex-col px-base',
        className
      )}
    >
      <Virtuoso
        ref={virtuosoRef}
        scrollerRef={onScrollerRef}
        data={diffItems}
        defaultItemHeight={defaultItemHeight}
        components={{
          Header: () => <div className="h-base" />,
        }}
        itemContent={(_index, { diff, initialExpanded }) => {
          const path = getDiffPath(diff);
          return (
            <div ref={(el) => onDiffRef?.(path, el)}>
              {renderDiffItem({ diff, initialExpanded, attemptId })}
            </div>
          );
        }}
        computeItemKey={(index, { diff }) => getDiffPath(diff) || String(index)}
        rangeChanged={handleRangeChanged}
        increaseViewportBy={{ top: 500, bottom: 300 }}
      />
    </div>
  );
};

type ChangesPanelComponent = <
  TDiff extends ChangesPanelDiff = ChangesPanelDiff,
>(
  props: ChangesPanelProps<TDiff> & RefAttributes<ChangesPanelHandle>
) => JSX.Element;

export const ChangesPanel = forwardRef(
  ChangesPanelInner
) as ChangesPanelComponent;
