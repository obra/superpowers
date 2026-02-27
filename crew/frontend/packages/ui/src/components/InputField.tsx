import * as React from 'react';
import {
  ArrowCounterClockwiseIcon,
  CheckIcon,
  type Icon,
  PencilSimpleLineIcon,
} from '@phosphor-icons/react';
import { cn } from '../lib/cn';

interface InputFieldProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  variant?: 'editable' | 'search';
  actionIcon?: Icon;
  onAction?: () => void;
  disabled?: boolean;
  onFocusChange?: (focused: boolean) => void;
}

export function InputField({
  value,
  onChange,
  placeholder,
  className,
  variant = 'editable',
  actionIcon: ActionIcon,
  onAction,
  disabled,
  onFocusChange,
}: InputFieldProps) {
  const [isEditing, setIsEditing] = React.useState(false);
  const [editValue, setEditValue] = React.useState(value);
  const [justSaved, setJustSaved] = React.useState(false);
  const [isFocused, setIsFocused] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Sync editValue when value prop changes (and not editing)
  React.useEffect(() => {
    if (!isEditing) {
      setEditValue(value);
    }
  }, [value, isEditing]);

  // Focus input when entering edit mode (editable variant only)
  React.useEffect(() => {
    if (variant === 'editable' && isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [variant, isEditing]);

  // Clear justSaved after 2 seconds
  React.useEffect(() => {
    if (justSaved) {
      const timer = setTimeout(() => {
        setJustSaved(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [justSaved]);

  const handleSave = () => {
    setIsEditing(false);
    if (editValue !== value) {
      onChange(editValue);
      setJustSaved(true);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditValue(value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (variant === 'editable') {
      if (e.key === 'Enter') {
        handleSave();
      } else if (e.key === 'Escape') {
        handleCancel();
      }
    }
  };

  // Determine border color based on state
  const getBorderClass = () => {
    if (variant === 'editable') {
      if (justSaved) return 'border-success';
      if (isEditing) return 'border-brand';
    }
    if (variant === 'search' && isFocused) return 'border-brand';
    return 'border-border';
  };

  // For search variant: always show input
  // For editable variant: show input only when editing
  const showInput = variant === 'search' || isEditing;

  return (
    <div
      className={cn(
        'bg-secondary border rounded-sm px-base py-half flex items-center gap-base transition-colors',
        getBorderClass(),
        className
      )}
    >
      {showInput ? (
        <input
          ref={inputRef}
          type="text"
          value={variant === 'editable' ? editValue : value}
          onChange={(e) =>
            variant === 'editable'
              ? setEditValue(e.target.value)
              : onChange(e.target.value)
          }
          onKeyDown={handleKeyDown}
          onFocus={() => {
            setIsFocused(true);
            onFocusChange?.(true);
          }}
          onBlur={() => {
            setIsFocused(false);
            onFocusChange?.(false);
          }}
          placeholder={placeholder}
          disabled={disabled}
          className="flex-1 text-sm text-high bg-transparent placeholder:text-low placeholder:opacity-80 focus:outline-none min-w-0"
        />
      ) : (
        <span className="flex-1 text-sm text-normal truncate min-w-0">
          {value || <span className="text-low opacity-80">{placeholder}</span>}
        </span>
      )}

      {/* Editable variant icons */}
      {variant === 'editable' && justSaved && (
        <CheckIcon
          className="size-icon-sm text-success shrink-0"
          weight="bold"
        />
      )}
      {variant === 'editable' && isEditing && !justSaved && (
        <>
          <ArrowCounterClockwiseIcon
            className="size-icon-sm text-low shrink-0 cursor-pointer hover:text-normal"
            weight="bold"
            onMouseDown={(e) => {
              e.preventDefault();
              handleCancel();
            }}
          />
          <CheckIcon
            className="size-icon-sm text-low shrink-0 cursor-pointer hover:text-normal"
            weight="bold"
            onMouseDown={(e) => {
              e.preventDefault();
              handleSave();
            }}
          />
        </>
      )}
      {variant === 'editable' && !isEditing && !justSaved && (
        <PencilSimpleLineIcon
          className="size-icon-sm text-low shrink-0 cursor-pointer hover:text-normal"
          weight="regular"
          onClick={() => setIsEditing(true)}
        />
      )}

      {/* Search variant action button */}
      {variant === 'search' && ActionIcon && (
        <button
          type="button"
          onClick={onAction}
          disabled={disabled}
          className="size-icon-sm text-low shrink-0 cursor-pointer hover:text-normal flex items-center justify-center"
        >
          <ActionIcon className="size-icon-sm" weight="bold" />
        </button>
      )}
    </div>
  );
}
