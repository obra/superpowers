import type { CSSProperties, MouseEvent, ReactNode } from 'react';
import type { Icon } from '@phosphor-icons/react';
import { cn } from '../lib/cn';
import { Tooltip } from './Tooltip';

interface ContextBarButtonProps {
  icon: Icon;
  label: string;
  iconClassName?: string;
  onClick?: () => void;
  disabled?: boolean;
}

function ContextBarButton({
  icon: IconComponent,
  label,
  iconClassName,
  onClick,
  disabled,
}: ContextBarButtonProps) {
  return (
    <button
      type="button"
      className={cn(
        'flex items-center justify-center transition-colors',
        'drop-shadow-[2px_2px_4px_rgba(121,121,121,0.25)]',
        'text-low group-hover:text-normal',
        disabled && 'opacity-40'
      )}
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
    >
      <IconComponent
        className={cn('size-icon-base', iconClassName)}
        weight="bold"
      />
    </button>
  );
}

function DragHandle({
  onMouseDown,
  isDragging,
}: {
  onMouseDown: (e: MouseEvent) => void;
  isDragging: boolean;
}) {
  return (
    <div
      className={cn(
        'flex justify-center py-half border-b',
        isDragging ? 'cursor-grabbing' : 'cursor-grab'
      )}
      onMouseDown={onMouseDown}
    >
      <div className="flex gap-[2px] py-half">
        <span className="size-dot rounded-full bg-panel group-hover:bg-low transition" />
        <span className="size-dot rounded-full bg-panel group-hover:bg-low transition" />
        <span className="size-dot rounded-full bg-panel group-hover:bg-low transition" />
      </div>
    </div>
  );
}

export interface ContextBarActionItem {
  type: 'action';
  key: string;
  label: string;
  tooltip?: string;
  shortcut?: string;
  icon?: Icon;
  iconClassName?: string;
  disabled?: boolean;
  onClick?: () => void;
  customContent?: ReactNode;
}

export interface ContextBarDividerItem {
  type: 'divider';
  key: string;
}

export type ContextBarRenderItem = ContextBarActionItem | ContextBarDividerItem;

export interface ContextBarProps {
  style: CSSProperties;
  isDragging: boolean;
  onDragHandleMouseDown: (e: MouseEvent) => void;
  primaryItems?: ContextBarRenderItem[];
  secondaryItems?: ContextBarRenderItem[];
}

function renderContextBarItem(item: ContextBarRenderItem) {
  if (item.type === 'divider') {
    return <div key={item.key} className="h-px bg-border" />;
  }

  if (item.customContent) {
    return <div key={item.key}>{item.customContent}</div>;
  }

  if (!item.icon) {
    return null;
  }

  const button = (
    <ContextBarButton
      icon={item.icon}
      label={item.label}
      iconClassName={item.iconClassName}
      onClick={item.onClick}
      disabled={item.disabled}
    />
  );

  return (
    <div key={item.key}>
      {item.tooltip ? (
        <Tooltip content={item.tooltip} shortcut={item.shortcut} side="left">
          {button}
        </Tooltip>
      ) : (
        button
      )}
    </div>
  );
}

export function ContextBar({
  style,
  isDragging,
  onDragHandleMouseDown,
  primaryItems = [],
  secondaryItems = [],
}: ContextBarProps) {
  return (
    <div
      className={cn(
        'absolute z-50',
        !isDragging && 'transition-all duration-300 ease-out'
      )}
      style={style}
    >
      <div className="group bg-secondary/50 backdrop-blur-sm border border-secondary rounded shadow-[inset_2px_2px_5px_rgba(255,255,255,0.03),_0_0_10px_rgba(0,0,0,0.2)] hover:shadow-[inset_2px_2px_5px_rgba(255,255,255,0.06),_0_0_10px_rgba(0,0,0,0.4)] transition-shadow px-base">
        <DragHandle
          onMouseDown={onDragHandleMouseDown}
          isDragging={isDragging}
        />

        <div className="flex flex-col py-base">
          {primaryItems.length > 0 && (
            <div className="flex flex-col gap-base">
              {primaryItems.map(renderContextBarItem)}
            </div>
          )}

          {primaryItems.length > 0 && secondaryItems.length > 0 && (
            <div className="h-px bg-border my-base" />
          )}

          {secondaryItems.length > 0 && (
            <div className="flex flex-col gap-base">
              {secondaryItems.map(renderContextBarItem)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
