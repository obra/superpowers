import type { ButtonHTMLAttributes, ReactNode } from 'react';
import type { Icon } from '@phosphor-icons/react';
import { cn } from '../lib/cn';
import { Tooltip } from './Tooltip';
import {
  SyncErrorIndicator,
  type SyncErrorIndicatorError,
} from './SyncErrorIndicator';

/**
 * Action item rendered in the navbar.
 */
export interface NavbarActionItem {
  type?: 'action';
  id: string;
  icon: Icon;
  isActive?: boolean;
  tooltip?: string;
  shortcut?: string;
  disabled?: boolean;
  onClick?: () => void;
}

/**
 * Divider item rendered in the navbar.
 */
export interface NavbarDividerItem {
  type: 'divider';
}

export type NavbarSectionItem = NavbarActionItem | NavbarDividerItem;

function isDivider(item: NavbarSectionItem): item is NavbarDividerItem {
  return item.type === 'divider';
}

// NavbarIconButton - inlined from primitives
interface NavbarIconButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: Icon;
  isActive?: boolean;
  tooltip?: string;
  shortcut?: string;
}

function NavbarIconButton({
  icon: IconComponent,
  isActive = false,
  tooltip,
  shortcut,
  className,
  ...props
}: NavbarIconButtonProps) {
  const button = (
    <button
      type="button"
      className={cn(
        'flex items-center justify-center rounded-sm',
        'text-low hover:text-normal',
        isActive && 'text-normal',
        className
      )}
      {...props}
    >
      <IconComponent
        className="size-icon-base"
        weight={isActive ? 'fill' : 'regular'}
      />
    </button>
  );

  return tooltip ? (
    <Tooltip content={tooltip} shortcut={shortcut}>
      {button}
    </Tooltip>
  ) : (
    button
  );
}

export interface NavbarProps {
  workspaceTitle?: string;
  // Items for left side of navbar
  leftItems?: NavbarSectionItem[];
  // Items for right side of navbar (with dividers inline)
  rightItems?: NavbarSectionItem[];
  // Optional additional content for left side (after leftItems)
  leftSlot?: ReactNode;
  // Sync errors shown in the right section
  syncErrors?: readonly SyncErrorIndicatorError[] | null;
  className?: string;
}

export function Navbar({
  workspaceTitle = 'Workspace Title',
  leftItems = [],
  rightItems = [],
  leftSlot,
  syncErrors,
  className,
}: NavbarProps) {
  const renderItem = (item: NavbarSectionItem, key: string) => {
    // Render divider
    if (isDivider(item)) {
      return <div key={key} className="h-4 w-px bg-border" />;
    }

    const isDisabled = !!item.disabled;

    return (
      <NavbarIconButton
        key={key}
        icon={item.icon}
        isActive={item.isActive}
        onClick={item.onClick}
        aria-label={item.tooltip}
        tooltip={item.tooltip}
        shortcut={item.shortcut}
        disabled={isDisabled}
        className={isDisabled ? 'opacity-40 cursor-not-allowed' : ''}
      />
    );
  };

  return (
    <nav
      className={cn(
        'flex items-center justify-between px-base py-half bg-secondary border-b shrink-0',
        className
      )}
    >
      {/* Left - Archive & Old UI Link + optional slot */}
      <div className="flex-1 flex items-center gap-base">
        {leftItems.map((item, index) =>
          renderItem(
            item,
            `left-${isDivider(item) ? 'divider' : item.id}-${index}`
          )
        )}
        {leftSlot}
      </div>

      {/* Center - Workspace Title */}
      <div className="flex-1 flex items-center justify-center">
        <p className="text-base text-low truncate">{workspaceTitle}</p>
      </div>

      {/* Right - Sync Error Indicator + Diff Controls + Panel Toggles (dividers inline) */}
      <div className="flex-1 flex items-center justify-end gap-base">
        <SyncErrorIndicator errors={syncErrors} />
        {rightItems.map((item, index) =>
          renderItem(
            item,
            `right-${isDivider(item) ? 'divider' : item.id}-${index}`
          )
        )}
      </div>
    </nav>
  );
}
