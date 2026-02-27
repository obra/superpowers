import { FieldProps } from '@rjsf/utils';
import { PlusIcon, XIcon } from '@phosphor-icons/react';
import { useState, useCallback, useMemo } from 'react';
import { cn } from '@/shared/lib/utils';

type KeyValueData = Record<string, string>;

interface EnvFormContext {
  onEnvChange?: (envData: KeyValueData | undefined) => void;
}

// KeyValueField - Key-value pairs editor matching settings dialog styling
export function KeyValueField({
  formData,
  disabled,
  readonly,
  registry,
}: FieldProps<KeyValueData>) {
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');

  const formContext = registry.formContext as EnvFormContext | undefined;

  const data: KeyValueData = useMemo(() => formData ?? {}, [formData]);
  const entries = useMemo(() => Object.entries(data), [data]);

  const updateValue = useCallback(
    (newData: KeyValueData | undefined) => {
      formContext?.onEnvChange?.(newData);
    },
    [formContext]
  );

  const handleAdd = useCallback(() => {
    const trimmedKey = newKey.trim();
    if (trimmedKey) {
      updateValue({
        ...data,
        [trimmedKey]: newValue,
      });
      setNewKey('');
      setNewValue('');
    }
  }, [data, newKey, newValue, updateValue]);

  const handleRemove = useCallback(
    (key: string) => {
      const updated = { ...data };
      delete updated[key];
      updateValue(Object.keys(updated).length > 0 ? updated : undefined);
    },
    [data, updateValue]
  );

  const handleValueChange = useCallback(
    (key: string, value: string) => {
      updateValue({ ...data, [key]: value });
    },
    [data, updateValue]
  );

  const isDisabled = disabled || readonly;

  const inputClassName = cn(
    'min-w-[50px] flex-1 bg-secondary border border-border rounded-sm px-base py-half text-base text-high font-mono text-sm',
    'placeholder:text-low placeholder:opacity-80 focus:outline-none focus:ring-1 focus:ring-brand',
    isDisabled && 'opacity-50 cursor-not-allowed'
  );

  return (
    <div className="space-y-3">
      {entries.map(([key, value]) => (
        <div key={key} className="flex gap-2 items-center">
          <input
            value={key}
            disabled
            className={cn(inputClassName, 'opacity-70')}
            aria-label="Environment variable key"
          />
          <input
            value={value ?? ''}
            onChange={(e) => handleValueChange(key, e.target.value)}
            disabled={isDisabled}
            className={inputClassName}
            placeholder="Value"
            aria-label={`Value for ${key}`}
          />
          <button
            type="button"
            onClick={() => handleRemove(key)}
            disabled={isDisabled}
            className={cn(
              'h-8 w-8 p-0 flex items-center justify-center shrink-0 rounded-sm',
              'text-low hover:text-error hover:bg-error/10',
              'focus:outline-none focus:ring-1 focus:ring-brand',
              'disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
            )}
            aria-label={`Remove ${key}`}
          >
            <XIcon className="size-icon-xs" weight="bold" />
          </button>
        </div>
      ))}

      {/* Add new entry row */}
      <div className="flex gap-2 items-center">
        <input
          value={newKey}
          onChange={(e) => setNewKey(e.target.value)}
          disabled={isDisabled}
          placeholder="KEY"
          className={inputClassName}
          aria-label="New environment variable key"
        />
        <input
          value={newValue}
          onChange={(e) => setNewValue(e.target.value)}
          disabled={isDisabled}
          placeholder="value"
          className={inputClassName}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleAdd();
            }
          }}
          aria-label="New environment variable value"
        />
        <button
          type="button"
          onClick={handleAdd}
          disabled={isDisabled || !newKey.trim()}
          className={cn(
            'h-8 w-8 p-0 flex items-center justify-center shrink-0 rounded-sm',
            'bg-secondary border border-border text-normal hover:bg-secondary/80',
            'focus:outline-none focus:ring-1 focus:ring-brand',
            'disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
          )}
          aria-label="Add environment variable"
        >
          <PlusIcon className="size-icon-xs" weight="bold" />
        </button>
      </div>
    </div>
  );
}
