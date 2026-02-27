import { memo, useRef, useEffect, useCallback, useState, useMemo } from 'react';
import {
  ChangesPanel,
  type ChangesPanelHandle,
  type RenderDiffItemProps,
} from '@vibe/ui/components/ChangesPanel';
import { sortDiffs } from '@/shared/lib/fileTreeUtils';
import { useChangesView } from '@/shared/hooks/useChangesView';
import { useWorkspaceContext } from '@/shared/hooks/useWorkspaceContext';
import { useScrollSyncStateMachine } from '@/shared/hooks/useScrollSyncStateMachine';
import { usePersistedExpanded } from '@/shared/stores/useUiPreferencesStore';
import { PierreDiffCard } from './PierreDiffCard';
import type { Diff, DiffChangeKind } from 'shared/types';

// Auto-collapse defaults based on change type (matches DiffsPanel behavior)
const COLLAPSE_BY_CHANGE_TYPE: Record<DiffChangeKind, boolean> = {
  added: false, // Expand added files
  deleted: true, // Collapse deleted files
  modified: false, // Expand modified files
  renamed: true, // Collapse renamed files
  copied: true, // Collapse copied files
  permissionChange: true, // Collapse permission changes
};

// Collapse large diffs (over 200 lines)
const COLLAPSE_MAX_LINES = 200;

function shouldAutoCollapse(diff: Diff): boolean {
  const totalLines = (diff.additions ?? 0) + (diff.deletions ?? 0);

  // For renamed files, only collapse if there are no content changes
  // OR if the diff is large
  if (diff.change === 'renamed') {
    return totalLines === 0 || totalLines > COLLAPSE_MAX_LINES;
  }

  // Collapse based on change type for other types
  if (COLLAPSE_BY_CHANGE_TYPE[diff.change]) {
    return true;
  }

  // Collapse large diffs
  if (totalLines > COLLAPSE_MAX_LINES) {
    return true;
  }

  return false;
}

interface ChangesPanelContainerProps {
  className: string;
  /** Attempt ID for opening files in IDE */
  attemptId: string;
}

const PersistedDiffItem = memo(function PersistedDiffItem({
  diff,
  initialExpanded,
  attemptId,
}: {
  diff: Diff;
  initialExpanded: boolean;
  attemptId: string;
}) {
  const path = diff.newPath || diff.oldPath || '';
  const [expanded, toggle] = usePersistedExpanded(
    `diff:${path}`,
    initialExpanded
  );

  return (
    <PierreDiffCard
      diff={diff}
      expanded={expanded}
      onToggle={toggle}
      attemptId={attemptId}
      className=""
    />
  );
});

export function ChangesPanelContainer({
  className,
  attemptId,
}: ChangesPanelContainerProps) {
  const { diffs } = useWorkspaceContext();
  const {
    selectedFilePath,
    selectedLineNumber,
    setFileInView,
    registerScrollToFile,
  } = useChangesView();
  const diffRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const changesPanelRef = useRef<ChangesPanelHandle>(null);
  const scrollContainerRef = useRef<HTMLElement | null>(null);
  const visibleRangeRef = useRef<{ startIndex: number; endIndex: number }>({
    startIndex: 0,
    endIndex: 0,
  });
  const [processedPaths] = useState(() => new Set<string>());

  const diffItems = useMemo(() => {
    return sortDiffs(diffs).map((diff) => {
      const path = diff.newPath || diff.oldPath || '';

      let initialExpanded = true;
      if (!processedPaths.has(path)) {
        processedPaths.add(path);
        initialExpanded = !shouldAutoCollapse(diff);
      }

      return { diff, initialExpanded };
    });
  }, [diffs, processedPaths]);

  const pathToIndex = useMemo(() => {
    const map = new Map<string, number>();
    diffItems.forEach(({ diff }, index) => {
      const path = diff.newPath || diff.oldPath || '';
      map.set(path, index);
    });
    return map;
  }, [diffItems]);

  const indexToPath = useCallback(
    (index: number): string | null => {
      const item = diffItems[index];
      if (!item) return null;
      return item.diff.newPath || item.diff.oldPath || null;
    },
    [diffItems]
  );

  const getTopFilePath = useCallback(
    (range: { startIndex: number; endIndex: number }): string | null => {
      const container = scrollContainerRef.current;
      if (!container) {
        return indexToPath(range.startIndex);
      }

      const containerTop = container.getBoundingClientRect().top;

      let bestPath: string | null = null;
      let bestTop = -Infinity;

      for (let i = range.startIndex; i <= range.endIndex; i++) {
        const path = indexToPath(i);
        if (!path) continue;

        const el = diffRefs.current.get(path);
        if (!el) continue;

        const rect = el.getBoundingClientRect();
        const relativeTop = rect.top - containerTop;
        const relativeBottom = rect.bottom - containerTop;

        const spansContainerTop = relativeTop <= 0 && relativeBottom > 0;

        if (spansContainerTop && relativeTop > bestTop) {
          bestTop = relativeTop;
          bestPath = path;
        }
      }

      return bestPath ?? indexToPath(range.startIndex);
    },
    [indexToPath]
  );

  const {
    state: syncState,
    fileInView: stateMachineFileInView,
    scrollToFile: stateMachineScrollToFile,
    onRangeChanged,
    onScrollComplete,
  } = useScrollSyncStateMachine({
    pathToIndex,
    indexToPath,
    getTopFilePath,
  });

  // Keep a ref to syncState for the scroll listener (avoids stale closure)
  const syncStateRef = useRef(syncState);
  syncStateRef.current = syncState;

  useEffect(() => {
    if (stateMachineFileInView !== null) {
      setFileInView(stateMachineFileInView);
    }
  }, [stateMachineFileInView, setFileInView]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const currentState = syncStateRef.current;
      if (
        currentState === 'programmatic-scroll' ||
        currentState === 'sync-cooldown'
      ) {
        return;
      }

      const range = visibleRangeRef.current;
      const topPath = getTopFilePath(range);
      if (topPath !== null) {
        setFileInView(topPath);
      }
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      container.removeEventListener('scroll', handleScroll);
    };
  }, [getTopFilePath, setFileInView]);

  const handleRangeChanged = useCallback(
    (range: { startIndex: number; endIndex: number }) => {
      visibleRangeRef.current = range;
      onRangeChanged(range);
    },
    [onRangeChanged]
  );

  const handleScrollToFile = useCallback(
    (path: string, lineNumber?: number) => {
      const index = stateMachineScrollToFile(path, lineNumber);
      if (index === null) return;

      changesPanelRef.current?.scrollToIndex(index, { align: 'start' });

      requestAnimationFrame(() => {
        setTimeout(() => {
          if (lineNumber) {
            const fileEl = diffRefs.current.get(path);
            if (fileEl) {
              const selector = `[data-line="${lineNumber}"]`;
              const commentEl = fileEl.querySelector(selector);
              commentEl?.scrollIntoView({
                behavior: 'instant',
                block: 'center',
              });
            }
          }
          onScrollComplete();
        }, 100);
      });
    },
    [stateMachineScrollToFile, onScrollComplete]
  );

  useEffect(() => {
    registerScrollToFile(handleScrollToFile);
    return () => registerScrollToFile(null);
  }, [registerScrollToFile, handleScrollToFile]);

  useEffect(() => {
    if (!selectedFilePath) return;

    const index = pathToIndex.get(selectedFilePath);
    if (index === undefined) return;

    const timeoutId = setTimeout(() => {
      changesPanelRef.current?.scrollToIndex(index, { align: 'start' });

      if (selectedLineNumber) {
        setTimeout(() => {
          const fileEl = diffRefs.current.get(selectedFilePath);
          if (fileEl) {
            const selector = `[data-line="${selectedLineNumber}"]`;
            const commentEl = fileEl.querySelector(selector);
            commentEl?.scrollIntoView({ behavior: 'instant', block: 'center' });
          }
        }, 100);
      }
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [selectedFilePath, selectedLineNumber, pathToIndex]);

  const handleDiffRef = useCallback(
    (path: string, el: HTMLDivElement | null) => {
      if (el) {
        diffRefs.current.set(path, el);
      } else {
        diffRefs.current.delete(path);
      }
    },
    []
  );

  const handleScrollerRef = useCallback((el: HTMLElement | Window | null) => {
    scrollContainerRef.current = el instanceof HTMLElement ? el : null;
  }, []);

  const renderDiffItem = useCallback(
    ({ diff, initialExpanded, attemptId }: RenderDiffItemProps<Diff>) => (
      <PersistedDiffItem
        diff={diff}
        initialExpanded={initialExpanded ?? true}
        attemptId={attemptId}
      />
    ),
    []
  );

  return (
    <ChangesPanel
      ref={changesPanelRef}
      className={className}
      diffItems={diffItems}
      onDiffRef={handleDiffRef}
      onScrollerRef={handleScrollerRef}
      onRangeChanged={handleRangeChanged}
      renderDiffItem={renderDiffItem}
      attemptId={attemptId}
    />
  );
}
