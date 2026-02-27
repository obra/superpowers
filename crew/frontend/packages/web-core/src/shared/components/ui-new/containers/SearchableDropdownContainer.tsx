import type { ReactNode } from 'react';
import { useState, useMemo, useCallback, useRef } from 'react';
import { VirtuosoHandle } from 'react-virtuoso';
import { SearchableDropdown } from '@vibe/ui/components/SearchableDropdown';

interface SearchableDropdownContainerProps<T> {
  /** Array of items to display */
  items: T[];
  /** Currently selected value (matched against getItemKey) */
  selectedValue: string | null;

  /** Extract unique key from item */
  getItemKey: (item: T) => string;
  /** Extract display label from item */
  getItemLabel: (item: T) => string;
  /** Custom filter function (null = default label.includes(query)) */
  filterItem: ((item: T, query: string) => boolean) | null;

  /** Called when an item is selected */
  onSelect: (item: T) => void;

  /** Trigger element (uses asChild pattern) */
  trigger: React.ReactNode;

  /** Class name for dropdown content */
  contentClassName: string;
  /** Placeholder text for search input */
  placeholder: string;
  /** Message shown when no items match */
  emptyMessage: string;

  /** Badge text for each item (null = no badges) */
  getItemBadge: ((item: T) => string | undefined) | null;

  /** Icon/avatar to render before each item's label (null = no icons) */
  getItemIcon: ((item: T) => ReactNode) | null;
}

export function SearchableDropdownContainer<T>({
  items,
  selectedValue,
  getItemKey,
  getItemLabel,
  filterItem,
  onSelect,
  trigger,
  contentClassName,
  placeholder,
  emptyMessage,
  getItemBadge,
  getItemIcon,
}: SearchableDropdownContainerProps<T>) {
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState<number | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const virtuosoRef = useRef<VirtuosoHandle>(null);

  const filteredItems = useMemo(() => {
    if (!searchTerm.trim()) return items;
    const query = searchTerm.toLowerCase();
    if (filterItem !== null) {
      return items.filter((item) => filterItem(item, query));
    }
    return items.filter((item) =>
      getItemLabel(item).toLowerCase().includes(query)
    );
  }, [items, searchTerm, filterItem, getItemLabel]);

  // Derive safe highlight index (clamp to valid range)
  const safeHighlightedIndex = useMemo(() => {
    if (highlightedIndex === null) return null;
    if (highlightedIndex >= filteredItems.length) return null;
    return highlightedIndex;
  }, [highlightedIndex, filteredItems.length]);

  const handleSearchTermChange = useCallback((value: string) => {
    setSearchTerm(value);
    setHighlightedIndex(null);
  }, []);

  const moveHighlight = useCallback(
    (delta: 1 | -1) => {
      if (filteredItems.length === 0) return;
      const start = safeHighlightedIndex ?? -1;
      const next =
        (start + delta + filteredItems.length) % filteredItems.length;
      setHighlightedIndex(next);
      virtuosoRef.current?.scrollIntoView({ index: next, behavior: 'auto' });
    },
    [filteredItems, safeHighlightedIndex]
  );

  const attemptSelect = useCallback(() => {
    if (safeHighlightedIndex == null) return;
    const item = filteredItems[safeHighlightedIndex];
    if (!item) return;
    onSelect(item);
    setDropdownOpen(false);
  }, [safeHighlightedIndex, filteredItems, onSelect]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          e.stopPropagation();
          moveHighlight(1);
          return;
        case 'ArrowUp':
          e.preventDefault();
          e.stopPropagation();
          moveHighlight(-1);
          return;
        case 'Enter':
          e.preventDefault();
          e.stopPropagation();
          attemptSelect();
          return;
        case 'Escape':
          e.preventDefault();
          e.stopPropagation();
          setDropdownOpen(false);
          return;
        case 'Tab':
          return;
        default:
          e.stopPropagation(); // Prevents Radix typeahead from stealing focus
      }
    },
    [moveHighlight, attemptSelect]
  );

  const handleOpenChange = useCallback((next: boolean) => {
    setDropdownOpen(next);
    if (!next) {
      setSearchTerm('');
      setHighlightedIndex(null);
    }
  }, []);

  const handleSelect = useCallback(
    (item: T) => {
      onSelect(item);
      setDropdownOpen(false);
    },
    [onSelect]
  );

  return (
    <SearchableDropdown
      filteredItems={filteredItems}
      selectedValue={selectedValue}
      getItemKey={getItemKey}
      getItemLabel={getItemLabel}
      onSelect={handleSelect}
      trigger={trigger}
      searchTerm={searchTerm}
      onSearchTermChange={handleSearchTermChange}
      highlightedIndex={safeHighlightedIndex}
      onHighlightedIndexChange={setHighlightedIndex}
      open={dropdownOpen}
      onOpenChange={handleOpenChange}
      onKeyDown={handleKeyDown}
      virtuosoRef={virtuosoRef}
      contentClassName={contentClassName}
      placeholder={placeholder}
      emptyMessage={emptyMessage}
      getItemBadge={getItemBadge ?? undefined}
      getItemIcon={getItemIcon ?? undefined}
    />
  );
}
