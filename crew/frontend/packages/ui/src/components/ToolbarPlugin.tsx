import { useCallback, useEffect, useState, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $getSelection,
  $isRangeSelection,
  FORMAT_TEXT_COMMAND,
  SELECTION_CHANGE_COMMAND,
  COMMAND_PRIORITY_CRITICAL,
} from 'lexical';
import { Bold, Italic, Underline, Strikethrough, Code } from 'lucide-react';
import { cn } from '../lib/cn';

const TOOLBAR_HEIGHT = 36;
const GAP = 8;
const VIEWPORT_PADDING = 10;

function ToolbarButton({
  active,
  onClick,
  children,
  title,
}: {
  active?: boolean;
  onClick: (e: React.MouseEvent) => void;
  children: React.ReactNode;
  title: string;
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => {
        // Prevent losing selection when clicking toolbar
        e.preventDefault();
        onClick(e);
      }}
      title={title}
      aria-label={title}
      className={cn(
        'p-1.5 rounded hover:bg-accent transition-colors bg-secondary/40',
        active && 'bg-accent'
      )}
    >
      {children}
    </button>
  );
}

export function ToolbarPlugin() {
  const [editor] = useLexicalComposerContext();

  // Visibility and position state
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState<{
    top: number;
    left: number;
  } | null>(null);

  // Text format state
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [isStrikethrough, setIsStrikethrough] = useState(false);
  const [isCode, setIsCode] = useState(false);

  const updateToolbar = useCallback(() => {
    const selection = $getSelection();

    if (!$isRangeSelection(selection) || selection.isCollapsed()) {
      setIsVisible(false);
      setPosition(null);
      return;
    }

    // Update text format state
    setIsBold(selection.hasFormat('bold'));
    setIsItalic(selection.hasFormat('italic'));
    setIsUnderline(selection.hasFormat('underline'));
    setIsStrikethrough(selection.hasFormat('strikethrough'));
    setIsCode(selection.hasFormat('code'));

    // Check if selection has actual text content
    const text = selection.getTextContent();
    if (!text || text.trim().length === 0) {
      setIsVisible(false);
      setPosition(null);
      return;
    }

    setIsVisible(true);
  }, []);

  const updatePosition = useCallback(() => {
    const domSelection = window.getSelection();
    if (
      !domSelection ||
      domSelection.rangeCount === 0 ||
      domSelection.isCollapsed
    ) {
      return;
    }

    const range = domSelection.getRangeAt(0);
    const rect = range.getBoundingClientRect();

    // Skip if rect is empty (happens during certain selection states)
    if (rect.width === 0 && rect.height === 0) {
      return;
    }

    // Calculate toolbar width (approximate)
    const toolbarWidth = 180;

    // Position above selection, centered
    let top = rect.top - TOOLBAR_HEIGHT - GAP + window.scrollY;
    let left = rect.left + rect.width / 2 - toolbarWidth / 2 + window.scrollX;

    // Flip below if not enough space above
    if (rect.top < TOOLBAR_HEIGHT + GAP + VIEWPORT_PADDING) {
      top = rect.bottom + GAP + window.scrollY;
    }

    // Keep within viewport horizontally
    left = Math.max(
      VIEWPORT_PADDING,
      Math.min(left, window.innerWidth - toolbarWidth - VIEWPORT_PADDING)
    );

    setPosition({ top, left });
  }, []);

  // Update toolbar state on selection change
  useEffect(() => {
    return editor.registerCommand(
      SELECTION_CHANGE_COMMAND,
      () => {
        updateToolbar();
        return false;
      },
      COMMAND_PRIORITY_CRITICAL
    );
  }, [editor, updateToolbar]);

  // Update toolbar state on editor updates
  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        updateToolbar();
      });
    });
  }, [editor, updateToolbar]);

  // Update position when visible
  useLayoutEffect(() => {
    if (!isVisible) return;

    updatePosition();

    // Update position on scroll and resize
    const handleUpdate = () => {
      requestAnimationFrame(updatePosition);
    };

    window.addEventListener('scroll', handleUpdate, true);
    window.addEventListener('resize', handleUpdate);

    return () => {
      window.removeEventListener('scroll', handleUpdate, true);
      window.removeEventListener('resize', handleUpdate);
    };
  }, [isVisible, updatePosition]);

  // Hide toolbar when editor loses focus
  useEffect(() => {
    const rootElement = editor.getRootElement();
    if (!rootElement) return;

    const handleFocusOut = (e: FocusEvent) => {
      // Don't hide if focus is moving to the toolbar itself
      const relatedTarget = e.relatedTarget as HTMLElement | null;
      if (relatedTarget?.closest('[data-floating-toolbar]')) {
        return;
      }
      setIsVisible(false);
      setPosition(null);
    };

    rootElement.addEventListener('focusout', handleFocusOut);
    return () => {
      rootElement.removeEventListener('focusout', handleFocusOut);
    };
  }, [editor]);

  const iconSize = 16;

  // Don't render until we have both visibility and position
  if (!isVisible || !position) {
    return null;
  }

  return createPortal(
    <div
      data-floating-toolbar
      className="fixed z-[10000] flex items-center gap-0.5 px-1.5 py-1 bg-popover bg-panel/20 backdrop-blur-sm  text-popover-foreground border border-border rounded-lg shadow-lg animate-in fade-in-0 duration-100"
      style={{
        top: position.top,
        left: position.left,
      }}
    >
      <ToolbarButton
        active={isBold}
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold')}
        title="Bold (Cmd+B)"
      >
        <Bold size={iconSize} />
      </ToolbarButton>
      <ToolbarButton
        active={isItalic}
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic')}
        title="Italic (Cmd+I)"
      >
        <Italic size={iconSize} />
      </ToolbarButton>
      <ToolbarButton
        active={isUnderline}
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'underline')}
        title="Underline (Cmd+U)"
      >
        <Underline size={iconSize} />
      </ToolbarButton>
      <ToolbarButton
        active={isStrikethrough}
        onClick={() =>
          editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'strikethrough')
        }
        title="Strikethrough"
      >
        <Strikethrough size={iconSize} />
      </ToolbarButton>
      <ToolbarButton
        active={isCode}
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'code')}
        title="Inline Code (Cmd+E)"
      >
        <Code size={iconSize} />
      </ToolbarButton>
    </div>,
    document.body
  );
}
