import * as React from 'react';
import { cn } from '../lib/cn';

function normalizeSingleLineValue(value: string): string {
  return value.replace(/\r\n|\r|\n/g, ' ');
}

export interface AutoResizeTextareaProps
  extends Omit<
    React.ComponentPropsWithoutRef<'textarea'>,
    'onChange' | 'value'
  > {
  value: string;
  onChange: (value: string) => void;
  preventNewlines?: boolean;
}

export const AutoResizeTextarea = React.forwardRef<
  HTMLTextAreaElement,
  AutoResizeTextareaProps
>(function AutoResizeTextarea(
  {
    value,
    onChange,
    preventNewlines = true,
    rows = 1,
    className,
    onInput,
    onKeyDown,
    onPaste,
    ...props
  },
  ref
) {
  const internalRef = React.useRef<HTMLTextAreaElement | null>(null);

  const setTextareaRef = React.useCallback(
    (node: HTMLTextAreaElement | null) => {
      internalRef.current = node;

      if (!ref) return;
      if (typeof ref === 'function') {
        ref(node);
        return;
      }

      ref.current = node;
    },
    [ref]
  );

  const resizeToContent = React.useCallback(() => {
    const textarea = internalRef.current;
    if (!textarea) return;
    if (textarea.clientWidth <= 1) return;

    textarea.style.height = 'auto';
    textarea.style.height = `${textarea.scrollHeight}px`;
  }, []);

  const normalizedValue = preventNewlines
    ? normalizeSingleLineValue(value)
    : value;

  React.useLayoutEffect(() => {
    resizeToContent();
  }, [normalizedValue, resizeToContent]);

  React.useLayoutEffect(() => {
    const textarea = internalRef.current;
    if (!textarea) return;

    if (typeof ResizeObserver === 'undefined') return;

    const observer = new ResizeObserver(() => {
      resizeToContent();
    });

    observer.observe(textarea);

    return () => observer.disconnect();
  }, [resizeToContent]);

  const handleInput = React.useCallback(
    (event: React.FormEvent<HTMLTextAreaElement>) => {
      resizeToContent();
      onInput?.(event);
    },
    [resizeToContent, onInput]
  );

  const handleChange = React.useCallback(
    (event: React.ChangeEvent<HTMLTextAreaElement>) => {
      const nextValue = preventNewlines
        ? normalizeSingleLineValue(event.target.value)
        : event.target.value;
      onChange(nextValue);
    },
    [onChange, preventNewlines]
  );

  const handleKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (preventNewlines && event.key === 'Enter') {
        event.preventDefault();
      }
      onKeyDown?.(event);
    },
    [preventNewlines, onKeyDown]
  );

  const handlePaste = React.useCallback(
    (event: React.ClipboardEvent<HTMLTextAreaElement>) => {
      if (!preventNewlines) {
        onPaste?.(event);
        return;
      }

      const pastedText = event.clipboardData.getData('text');
      if (!/[\r\n]/.test(pastedText)) {
        onPaste?.(event);
        return;
      }

      event.preventDefault();

      const textarea = event.currentTarget;
      const start = textarea.selectionStart ?? textarea.value.length;
      const end = textarea.selectionEnd ?? textarea.value.length;
      const sanitizedText = normalizeSingleLineValue(pastedText);
      const nextValue =
        textarea.value.slice(0, start) +
        sanitizedText +
        textarea.value.slice(end);

      onChange(nextValue);

      requestAnimationFrame(() => {
        const node = internalRef.current;
        if (!node) return;

        const nextCaret = start + sanitizedText.length;
        node.setSelectionRange(nextCaret, nextCaret);
      });

      onPaste?.(event);
    },
    [onChange, onPaste, preventNewlines]
  );

  return (
    <textarea
      {...props}
      ref={setTextareaRef}
      rows={rows}
      value={normalizedValue}
      onInput={handleInput}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      onPaste={handlePaste}
      className={cn(
        'w-full resize-none overflow-hidden bg-transparent focus:outline-none',
        className
      )}
    />
  );
});
