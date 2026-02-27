import { useState, useCallback, useRef, useEffect } from 'react';
import { create, useModal } from '@ebay/nice-modal-react';
import { defineModal } from '@/shared/lib/modals';
import { CommandDialog } from '@vibe/ui/components/Command';
import {
  CommandBar,
  type CommandBarGroupItem,
} from '@vibe/ui/components/CommandBar';
import type {
  PageId,
  ResolvedGroup,
  ResolvedGroupItem,
} from '@/shared/types/commandBar';
import type { StatusItem } from '@/shared/types/selectionItems';
import { resolveLabel, type ActionDefinition } from '@/shared/types/actions';

export interface SelectionPage<TResult = unknown> {
  id: string;
  title: string;
  buildGroups: () => ResolvedGroup[];
  onSelect: (
    item: ResolvedGroupItem
  ) =>
    | { type: 'complete'; data: TResult }
    | { type: 'navigate'; pageId: string };
}

export interface SelectionDialogProps {
  initialPageId: string;
  pages: Record<string, SelectionPage>;
  statuses?: StatusItem[];
}

const SelectionDialogImpl = create<SelectionDialogProps>(
  ({ initialPageId, pages, statuses = [] }) => {
    const modal = useModal();
    const previousFocusRef = useRef<HTMLElement | null>(null);
    const [search, setSearch] = useState('');
    const [currentPageId, setCurrentPageId] = useState(initialPageId);
    const [pageStack, setPageStack] = useState<string[]>([]);

    // Reset transient state and capture focus each time dialog opens.
    useEffect(() => {
      if (!modal.visible) return;
      previousFocusRef.current = document.activeElement as HTMLElement;
      setSearch('');
      setPageStack([]);
      setCurrentPageId(initialPageId);
    }, [modal.visible, initialPageId]);

    // Ensure cmdk search input is focused when dialog opens or page changes.
    useEffect(() => {
      if (!modal.visible) return;
      const rafId = requestAnimationFrame(() => {
        const activeDialog = document.querySelector(
          '[role="dialog"][data-state="open"]'
        );
        const input =
          activeDialog?.querySelector<HTMLInputElement>('[cmdk-input]');
        input?.focus();
      });

      return () => cancelAnimationFrame(rafId);
    }, [modal.visible, currentPageId]);

    // Guard against stale page IDs when opening with different page sets.
    useEffect(() => {
      if (pages[currentPageId]) return;
      if (pages[initialPageId]) {
        setCurrentPageId(initialPageId);
        return;
      }
      const fallbackPageId = Object.keys(pages)[0];
      if (fallbackPageId) {
        setCurrentPageId(fallbackPageId);
      }
    }, [currentPageId, initialPageId, pages]);

    const currentPage =
      pages[currentPageId] ??
      pages[initialPageId] ??
      pages[Object.keys(pages)[0] ?? ''];

    if (!currentPage) {
      return null;
    }

    const resolvedPage = {
      id: currentPage.id,
      title: currentPage.title,
      groups: currentPage.buildGroups(),
    };

    const handleSelect = useCallback(
      (item: CommandBarGroupItem<ActionDefinition, PageId>) => {
        const result = currentPage.onSelect(item as ResolvedGroupItem);
        if (result.type === 'complete') {
          modal.resolve(result.data);
          modal.hide();
        } else if (result.type === 'navigate') {
          if (!pages[result.pageId]) return;
          setPageStack((prev) => [...prev, currentPageId]);
          setCurrentPageId(result.pageId);
          setSearch('');
        }
      },
      [currentPage, currentPageId, modal, pages]
    );

    const handleGoBack = useCallback(() => {
      const prevPage = pageStack[pageStack.length - 1];
      if (prevPage) {
        setPageStack((prev) => prev.slice(0, -1));
        setCurrentPageId(prevPage);
        setSearch('');
      }
    }, [pageStack]);

    const handleClose = useCallback(() => {
      modal.resolve(undefined);
      modal.hide();
    }, [modal]);

    const handleCloseAutoFocus = useCallback((event: Event) => {
      event.preventDefault();
      const activeElement = document.activeElement;
      const isInDialog = activeElement?.closest('[role="dialog"]');
      if (!isInDialog) {
        previousFocusRef.current?.focus();
      }
    }, []);

    return (
      <CommandDialog
        open={modal.visible}
        onOpenChange={(open) => !open && handleClose()}
        onCloseAutoFocus={handleCloseAutoFocus}
      >
        <CommandBar
          page={resolvedPage}
          canGoBack={pageStack.length > 0}
          onGoBack={handleGoBack}
          onSelect={handleSelect}
          getLabel={(action) => resolveLabel(action)}
          search={search}
          onSearchChange={setSearch}
          statuses={statuses}
        />
      </CommandDialog>
    );
  }
);

export const SelectionDialog = defineModal<
  SelectionDialogProps,
  unknown | undefined
>(SelectionDialogImpl);
