import { forwardRef } from 'react';
import { cn } from '../lib/cn';

export const PRESET_COLORS = [
  '0 84% 60%',
  '24 95% 53%',
  '45 93% 58%',
  '158 64% 52%',
  '200 98% 39%',
  '271 81% 56%',
  '330 81% 60%',
  '183 74% 44%',
  '262 52% 47%',
  '142 71% 45%',
  '17 88% 40%',
  '231 48% 48%',
] as const;

export interface InlineColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  colors?: readonly string[];
  onKeyDown?: (e: React.KeyboardEvent) => void;
  disabled?: boolean;
  className?: string;
}

export const InlineColorPicker = forwardRef<
  HTMLDivElement,
  InlineColorPickerProps
>(
  (
    { value, onChange, colors = PRESET_COLORS, onKeyDown, disabled, className },
    ref
  ) => {
    const currentIndex = colors.indexOf(value);

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (disabled) return;

      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        e.stopPropagation();
        const newIndex =
          currentIndex <= 0 ? colors.length - 1 : currentIndex - 1;
        onChange(colors[newIndex]);
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        e.stopPropagation();
        const newIndex =
          currentIndex >= colors.length - 1 ? 0 : currentIndex + 1;
        onChange(colors[newIndex]);
      }

      onKeyDown?.(e);
    };

    return (
      <div
        ref={ref}
        role="radiogroup"
        aria-label="Select a color"
        tabIndex={disabled ? -1 : 0}
        onKeyDown={handleKeyDown}
        className={cn('flex flex-wrap gap-half outline-none', className)}
      >
        {colors.map((color) => (
          <button
            key={color}
            type="button"
            role="radio"
            aria-checked={color === value}
            disabled={disabled}
            onClick={() => onChange(color)}
            className={cn(
              'w-6 h-6 rounded-full transition-all',
              color === value
                ? 'ring-2 ring-brand ring-offset-1'
                : 'hover:scale-110',
              disabled && 'opacity-50 cursor-not-allowed hover:scale-100'
            )}
            style={{ backgroundColor: `hsl(${color})` }}
          />
        ))}
      </div>
    );
  }
);

InlineColorPicker.displayName = 'InlineColorPicker';
