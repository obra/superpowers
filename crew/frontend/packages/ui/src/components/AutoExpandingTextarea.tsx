import * as React from 'react';
import { cn } from '../lib/cn';

interface AutoExpandingTextareaProps extends React.ComponentProps<'textarea'> {
  maxRows?: number;
  disableInternalScroll?: boolean;
}

const AutoExpandingTextarea = React.forwardRef<
  HTMLTextAreaElement,
  AutoExpandingTextareaProps
>(
  (
    { className, maxRows = 10, disableInternalScroll = false, ...props },
    ref
  ) => {
    const internalRef = React.useRef<HTMLTextAreaElement>(null);

    // Get the actual ref to use
    const textareaRef = ref || internalRef;

    const adjustHeight = React.useCallback(() => {
      const textarea = (textareaRef as React.RefObject<HTMLTextAreaElement>)
        .current;
      if (!textarea) return;

      // Reset height to auto to get the natural height
      textarea.style.height = 'auto';

      if (disableInternalScroll) {
        // When parent handles scroll, expand to full content height
        textarea.style.height = `${textarea.scrollHeight}px`;
      } else {
        // Calculate line height
        const style = window.getComputedStyle(textarea);
        const lineHeight = parseInt(style.lineHeight) || 20;
        const paddingTop = parseInt(style.paddingTop) || 0;
        const paddingBottom = parseInt(style.paddingBottom) || 0;

        // Calculate max height based on maxRows
        const maxHeight = lineHeight * maxRows + paddingTop + paddingBottom;

        // Set the height to scrollHeight, but cap at maxHeight
        const newHeight = Math.min(textarea.scrollHeight, maxHeight);
        textarea.style.height = `${newHeight}px`;
      }
    }, [maxRows, disableInternalScroll, textareaRef]);

    // Adjust height on mount and when content changes
    React.useEffect(() => {
      adjustHeight();
    }, [adjustHeight, props.value]);

    // Adjust height on input
    const { onInput } = props;
    const handleInput = React.useCallback(
      (e: React.FormEvent<HTMLTextAreaElement>) => {
        adjustHeight();
        if (onInput) {
          onInput(e);
        }
      },
      [adjustHeight, onInput]
    );

    return (
      <textarea
        className={cn(
          'bg-muted p-0 min-h-[80px] w-full text-sm outline-none disabled:cursor-not-allowed disabled:opacity-50 resize-none overflow-x-hidden whitespace-pre-wrap break-words',
          disableInternalScroll ? 'overflow-hidden' : 'overflow-y-auto',
          className
        )}
        ref={textareaRef}
        onInput={handleInput}
        {...props}
      />
    );
  }
);

AutoExpandingTextarea.displayName = 'AutoExpandingTextarea';

export { AutoExpandingTextarea };
