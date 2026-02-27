import { useState, useCallback } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@vibe/ui/components/Dropdown';
import { InlineColorPicker } from '@vibe/ui/components/ColorPicker';

export interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  colors: readonly string[];
  children: React.ReactNode;
  disabled: boolean;
  align: 'start' | 'center' | 'end';
  side: 'top' | 'bottom' | 'left' | 'right';
}

export function ColorPicker({
  value,
  onChange,
  colors,
  children,
  disabled,
  align,
  side,
}: ColorPickerProps) {
  const [open, setOpen] = useState(false);

  const handleColorChange = (color: string) => {
    onChange(color);
    setOpen(false);
  };

  // Use ref callback to focus when the element mounts
  // This fires when the portal content is actually in the DOM
  const handlePickerRef = useCallback((node: HTMLDivElement | null) => {
    if (node) {
      node.focus();
    }
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const currentIndex = (colors as readonly string[]).indexOf(value);

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
    },
    [colors, value, onChange]
  );

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild disabled={disabled}>
        {children}
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} side={side}>
        <div
          ref={handlePickerRef}
          className="p-base outline-none"
          tabIndex={-1}
          onKeyDown={handleKeyDown}
        >
          <InlineColorPicker
            value={value}
            onChange={handleColorChange}
            colors={colors}
            disabled={disabled}
          />
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
