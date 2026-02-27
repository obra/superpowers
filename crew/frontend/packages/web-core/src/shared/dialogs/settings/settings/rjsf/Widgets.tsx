import { WidgetProps } from '@rjsf/utils';
import { cn } from '@/shared/lib/utils';
import { useTranslation } from 'react-i18next';
import { useMemo } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuTriggerButton,
} from '@vibe/ui/components/Dropdown';

// TextWidget - Text input matching settings dialog styling
export const TextWidget = (props: WidgetProps) => {
  const {
    id,
    value,
    disabled,
    readonly,
    onChange,
    onBlur,
    onFocus,
    placeholder,
    options,
  } = props;

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value;
    onChange(newValue === '' ? options.emptyValue : newValue);
  };

  const handleBlur = (event: React.FocusEvent<HTMLInputElement>) => {
    if (onBlur) {
      onBlur(id, event.target.value);
    }
  };

  const handleFocus = (event: React.FocusEvent<HTMLInputElement>) => {
    if (onFocus) {
      onFocus(id, event.target.value);
    }
  };

  return (
    <input
      id={id}
      type="text"
      value={value ?? ''}
      placeholder={placeholder || ''}
      disabled={disabled || readonly}
      onChange={handleChange}
      onBlur={handleBlur}
      onFocus={handleFocus}
      className={cn(
        'w-full bg-secondary border border-border rounded-sm px-base py-half text-base text-high',
        'placeholder:text-low placeholder:opacity-80 focus:outline-none focus:ring-1 focus:ring-brand',
        (disabled || readonly) && 'opacity-50 cursor-not-allowed'
      )}
    />
  );
};

// SelectWidget - Dropdown select matching settings dialog styling
export const SelectWidget = (props: WidgetProps) => {
  const {
    id,
    value,
    disabled,
    readonly,
    onChange,
    options,
    schema,
    placeholder,
  } = props;

  const { t } = useTranslation('common');
  const { enumOptions } = options;

  const handleChange = (newValue: string) => {
    const finalValue = newValue === '__null__' ? options.emptyValue : newValue;
    onChange(finalValue);
  };

  // Handle nullable types
  const isNullable = Array.isArray(schema.type) && schema.type.includes('null');
  const allOptions = useMemo(() => {
    const selectOptions = enumOptions || [];
    if (isNullable) {
      return [
        { value: '__null__', label: t('form.notSpecified') },
        ...selectOptions.filter((opt) => opt.value !== null),
      ];
    }
    return selectOptions;
  }, [isNullable, enumOptions, t]);

  const currentValue = value === null ? '__null__' : (value ?? '');
  const selectedOption = allOptions.find(
    (opt) => String(opt.value) === String(currentValue)
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <DropdownMenuTriggerButton
          id={id}
          label={selectedOption?.label || placeholder || t('form.selectOption')}
          className="w-full justify-between"
          disabled={disabled || readonly}
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-[var(--radix-dropdown-menu-trigger-width)]">
        {allOptions.map((option) => (
          <DropdownMenuItem
            key={String(option.value)}
            onClick={() => handleChange(String(option.value))}
          >
            {option.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

// CheckboxWidget - Checkbox matching settings dialog styling
// Note: Label is shown in the FieldTemplate's left column, not here
export const CheckboxWidget = (props: WidgetProps) => {
  const { id, value, disabled, readonly, onChange } = props;

  const handleChange = (checked: boolean) => {
    onChange(checked);
  };

  const checked = Boolean(value);

  return (
    <input
      type="checkbox"
      id={id}
      checked={checked}
      onChange={(e) => handleChange(e.target.checked)}
      disabled={disabled || readonly}
      className={cn(
        'h-4 w-4 rounded border-border bg-secondary text-brand focus:ring-brand focus:ring-offset-0',
        (disabled || readonly) && 'opacity-50 cursor-not-allowed'
      )}
    />
  );
};

// TextareaWidget - Textarea matching settings dialog styling
export const TextareaWidget = (props: WidgetProps) => {
  const {
    id,
    value,
    disabled,
    readonly,
    onChange,
    onBlur,
    onFocus,
    placeholder,
    options,
  } = props;

  const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = event.target.value;
    onChange(newValue === '' ? options.emptyValue : newValue);
  };

  const handleBlur = (event: React.FocusEvent<HTMLTextAreaElement>) => {
    if (onBlur) {
      onBlur(id, event.target.value);
    }
  };

  const handleFocus = (event: React.FocusEvent<HTMLTextAreaElement>) => {
    if (onFocus) {
      onFocus(id, event.target.value);
    }
  };

  return (
    <textarea
      id={id}
      value={value ?? ''}
      placeholder={placeholder || ''}
      disabled={disabled || readonly}
      onChange={handleChange}
      onBlur={handleBlur}
      onFocus={handleFocus}
      rows={4}
      className={cn(
        'w-full bg-secondary border border-border rounded-sm px-base py-half text-base text-high',
        'placeholder:text-low placeholder:opacity-80 focus:outline-none focus:ring-1 focus:ring-brand',
        'resize-y',
        (disabled || readonly) && 'opacity-50 cursor-not-allowed'
      )}
    />
  );
};
