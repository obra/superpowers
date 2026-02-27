import type { RefObject } from 'react';
import { Virtuoso, VirtuosoHandle } from 'react-virtuoso';
import { cn } from '../lib/cn';
import { useTranslation } from 'react-i18next';
import { PlusIcon, CheckIcon } from '@phosphor-icons/react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuSearchInput,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './Dropdown';
import { InlineColorPicker, PRESET_COLORS } from './ColorPicker';

// Re-export for backwards compatibility
export const TAG_COLORS = PRESET_COLORS;

export interface SearchableTag {
  id: string;
  name: string;
  color: string;
}

interface SearchableTagDropdownProps {
  filteredTags: SearchableTag[];
  selectedTagIds: string[];
  onTagToggle: (tagId: string) => void;
  trigger: React.ReactNode;

  // Search state
  searchTerm: string;
  onSearchTermChange: (value: string) => void;

  // Highlight state
  highlightedIndex: number | null;
  onHighlightedIndexChange: (index: number | null) => void;

  // Open state
  open: boolean;
  onOpenChange: (open: boolean) => void;

  // Keyboard handler
  onKeyDown: (e: React.KeyboardEvent) => void;

  // Virtuoso ref
  virtuosoRef: RefObject<VirtuosoHandle | null>;

  // Create flow
  showCreateOption: boolean;
  createOptionHighlighted: boolean;
  isCreating: boolean;
  colorIndex: number;
  onColorIndexChange: (index: number) => void;
  onStartCreate: () => void;
  onConfirmCreate: () => void;
  onCancelCreate: () => void;

  // Ref for color picker container (for focus management)
  colorPickerRef: RefObject<HTMLDivElement>;

  contentClassName?: string;
  disabled?: boolean;
}

export function SearchableTagDropdown({
  filteredTags,
  selectedTagIds,
  onTagToggle,
  trigger,
  searchTerm,
  onSearchTermChange,
  highlightedIndex,
  onHighlightedIndexChange,
  open,
  onOpenChange,
  onKeyDown,
  virtuosoRef,
  showCreateOption,
  createOptionHighlighted,
  isCreating,
  colorIndex,
  onColorIndexChange,
  onStartCreate,
  onConfirmCreate,
  onCancelCreate,
  colorPickerRef,
  contentClassName,
  disabled,
}: SearchableTagDropdownProps) {
  const { t } = useTranslation('common');

  return (
    <DropdownMenu open={open} onOpenChange={onOpenChange}>
      <DropdownMenuTrigger asChild disabled={disabled}>
        {trigger}
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className={cn('min-w-[220px]', contentClassName)}
      >
        {isCreating ? (
          // Color picker step
          <div
            ref={colorPickerRef}
            className="p-base space-y-base outline-none"
            tabIndex={-1}
            onKeyDown={onKeyDown}
          >
            <div className="text-sm text-normal">
              {t('kanban.selectColorFor')}{' '}
              <span className="font-medium">{searchTerm}</span>
            </div>
            <InlineColorPicker
              value={TAG_COLORS[colorIndex]}
              onChange={(color) => {
                const idx = (TAG_COLORS as readonly string[]).indexOf(color);
                if (idx !== -1) onColorIndexChange(idx);
              }}
              colors={TAG_COLORS}
            />
            <div className="flex items-center justify-end gap-half pt-half">
              <button
                type="button"
                onClick={onCancelCreate}
                className="px-base py-half text-sm text-low hover:text-normal hover:bg-panel rounded-sm transition-colors"
              >
                {t('buttons.cancel')}
              </button>
              <button
                type="button"
                onClick={onConfirmCreate}
                className="px-base py-half text-sm text-high bg-brand hover:bg-brand/90 rounded-sm transition-colors"
              >
                {t('buttons.create')}
              </button>
            </div>
          </div>
        ) : (
          // Search and tag list
          <>
            <DropdownMenuSearchInput
              placeholder={t('kanban.searchTags')}
              value={searchTerm}
              onValueChange={onSearchTermChange}
              onKeyDown={onKeyDown}
            />
            <DropdownMenuSeparator />
            {filteredTags.length === 0 && !showCreateOption ? (
              <div className="px-base py-half text-sm text-low text-center">
                {t('kanban.noTagsAvailable')}
              </div>
            ) : (
              <>
                {filteredTags.length > 0 && (
                  <Virtuoso
                    ref={virtuosoRef as React.RefObject<VirtuosoHandle>}
                    style={{ height: Math.min(filteredTags.length * 36, 200) }}
                    totalCount={filteredTags.length}
                    computeItemKey={(idx) =>
                      filteredTags[idx]?.id ?? String(idx)
                    }
                    itemContent={(idx) => {
                      const tag = filteredTags[idx];
                      const isSelected = selectedTagIds.includes(tag.id);
                      const isHighlighted = idx === highlightedIndex;
                      return (
                        <button
                          type="button"
                          onClick={() => onTagToggle(tag.id)}
                          onMouseEnter={() => onHighlightedIndexChange(idx)}
                          className={cn(
                            'flex items-center gap-base w-full px-base py-half text-sm text-left transition-colors',
                            isHighlighted && 'bg-secondary',
                            isSelected && 'text-normal'
                          )}
                        >
                          <span
                            className="w-3 h-3 rounded-full shrink-0"
                            style={{ backgroundColor: `hsl(${tag.color})` }}
                          />
                          <span className="flex-1 truncate">{tag.name}</span>
                          {isSelected && (
                            <CheckIcon
                              className="size-icon-sm text-brand shrink-0"
                              weight="bold"
                            />
                          )}
                        </button>
                      );
                    }}
                  />
                )}
                {showCreateOption && (
                  <>
                    {filteredTags.length > 0 && <DropdownMenuSeparator />}
                    <button
                      type="button"
                      onClick={onStartCreate}
                      className={cn(
                        'flex items-center gap-base w-full px-base py-half text-sm text-brand hover:bg-secondary transition-colors',
                        createOptionHighlighted && 'bg-secondary'
                      )}
                    >
                      <PlusIcon className="size-icon-sm" weight="bold" />
                      <span>
                        {t('kanban.createTag')} &quot;{searchTerm}&quot;
                      </span>
                    </button>
                  </>
                )}
              </>
            )}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
