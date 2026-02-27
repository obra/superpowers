import { type ReactNode, useState } from 'react';
import { cn } from '../lib/cn';
import { Popover, PopoverContent, PopoverTrigger } from './Popover';

// Common reaction emojis
const REACTION_EMOJIS = [
  '👍',
  '👎',
  '❤️',
  '😄',
  '😢',
  '🎉',
  '🚀',
  '👀',
  '🔥',
  '💯',
  '✅',
  '❌',
  '🤔',
  '👏',
  '💪',
  '🙌',
];

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
  children: ReactNode;
}

export function EmojiPicker({ onSelect, children }: EmojiPickerProps) {
  const [open, setOpen] = useState(false);

  const handleSelect = (emoji: string) => {
    onSelect(emoji);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent
        sideOffset={4}
        className={cn(
          'w-auto bg-panel border border-border rounded-sm p-base shadow-md',
          'data-[state=open]:animate-in',
          'data-[state=open]:fade-in-0',
          'data-[state=open]:zoom-in-95',
          'data-[side=bottom]:slide-in-from-top-2',
          'data-[side=top]:slide-in-from-bottom-2',
          'origin-[--radix-popover-content-transform-origin]'
        )}
      >
        <div className="grid grid-cols-8 gap-half">
          {REACTION_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => handleSelect(emoji)}
              className={cn(
                'size-7 flex items-center justify-center rounded-sm',
                'hover:bg-secondary transition-colors',
                'text-base color-emoji'
              )}
            >
              {emoji}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
