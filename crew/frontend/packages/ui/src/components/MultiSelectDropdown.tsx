import type { ReactNode } from 'react';
import { cn } from '../lib/cn';
import { CaretDownIcon, type Icon } from '@phosphor-icons/react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from './Dropdown';
import { Badge } from './Badge';

export interface MultiSelectDropdownOption<T extends string = string> {
  value: T;
  label: string;
  renderOption?: () => ReactNode;
}

export interface MultiSelectDropdownProps<T extends string = string> {
  values: T[];
  options: MultiSelectDropdownOption<T>[];
  onChange: (values: T[]) => void;
  icon: Icon;
  label: string;
  menuLabel?: string;
  disabled?: boolean;
  renderBadge?: (values: T[]) => ReactNode;
  /** Show only icon (+ badge) without label or caret */
  iconOnly?: boolean;
}

export function MultiSelectDropdown<T extends string = string>({
  values,
  options,
  onChange,
  icon: IconComponent,
  label,
  menuLabel,
  disabled,
  renderBadge,
  iconOnly,
}: MultiSelectDropdownProps<T>) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild disabled={disabled}>
        <button
          type="button"
          className={cn(
            'flex items-center gap-half bg-panel rounded-sm',
            'text-sm text-normal hover:bg-secondary transition-colors',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'py-half',
            'px-base'
          )}
        >
          <IconComponent className="size-icon-xs" weight="bold" />
          {!iconOnly && <span>{label}</span>}
          {values.length > 0 &&
            (renderBadge ? (
              renderBadge(values)
            ) : (
              <Badge
                variant="secondary"
                className="px-1.5 py-0 text-xs h-5 min-w-5 justify-center bg-brand border-none"
              >
                {values.length}
              </Badge>
            ))}
          {!iconOnly && (
            <CaretDownIcon className="size-icon-2xs text-low" weight="bold" />
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        {menuLabel && (
          <>
            <DropdownMenuLabel>{menuLabel}</DropdownMenuLabel>
            <DropdownMenuSeparator />
          </>
        )}
        {options.map((option) => (
          <DropdownMenuCheckboxItem
            key={option.value}
            checked={values.includes(option.value)}
            onCheckedChange={() => {
              const newValues = values.includes(option.value)
                ? values.filter((v) => v !== option.value)
                : [...values, option.value];
              onChange(newValues);
            }}
          >
            {option.renderOption?.() ?? option.label}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
