import type { ReactNode } from 'react';
import { CheckIcon } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from './Command';
import { PrimaryButton } from './PrimaryButton';

export interface MultiSelectOption<T extends string = string> {
  value: T;
  label: string;
  searchValue?: string;
  renderOption?: () => ReactNode;
}

interface MultiSelectCommandBarProps<T extends string = string> {
  title: string;
  options: MultiSelectOption<T>[];
  selectedValues: T[];
  onToggle: (value: T) => void;
  onClose: () => void;
  search: string;
  onSearchChange: (search: string) => void;
}

export function MultiSelectCommandBar<T extends string = string>({
  title,
  options,
  selectedValues,
  onToggle,
  onClose,
  search,
  onSearchChange,
}: MultiSelectCommandBarProps<T>) {
  const { t } = useTranslation('common');

  return (
    <Command
      className="rounded-sm border border-border [&_[cmdk-group-heading]]:px-base [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-low [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-group]]:px-half [&_[cmdk-input-wrapper]_svg]:h-4 [&_[cmdk-input-wrapper]_svg]:w-4 [&_[cmdk-input]]:h-12 [&_[cmdk-item]]:px-base [&_[cmdk-item]]:py-half"
      loop
      filter={(value, search) => {
        if (value.toLowerCase().includes(search.toLowerCase())) return 1;
        return 0;
      }}
      onKeyDown={(e) => {
        if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
          e.preventDefault();
          onClose();
        }
      }}
    >
      <div className="flex items-center border-b border-border">
        <CommandInput
          placeholder={title}
          value={search}
          onValueChange={onSearchChange}
        />
      </div>
      <CommandList className="min-h-[200px]">
        <CommandEmpty>
          {t('commandBar.noResults', 'No results found')}
        </CommandEmpty>
        <CommandGroup>
          {options.map((option) => {
            const isSelected = selectedValues.includes(option.value);
            return (
              <CommandItem
                key={option.value}
                value={option.searchValue ?? `${option.value} ${option.label}`}
                onSelect={() => onToggle(option.value)}
              >
                <div className="flex items-center gap-base flex-1">
                  {option.renderOption?.() ?? <span>{option.label}</span>}
                </div>
                {isSelected && (
                  <CheckIcon className="h-4 w-4 text-brand" weight="bold" />
                )}
              </CommandItem>
            );
          })}
        </CommandGroup>
      </CommandList>
      <div className="border-t border-border p-base">
        <PrimaryButton onClick={onClose} className="w-full justify-center">
          {t('buttons.close')}
        </PrimaryButton>
      </div>
    </Command>
  );
}
