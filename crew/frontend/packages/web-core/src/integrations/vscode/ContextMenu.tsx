import React, { useEffect, useRef, useState } from 'react';
import { readClipboardViaBridge } from '@/integrations/vscode/bridge';
import { writeClipboardViaBridge } from '@/shared/lib/clipboard';

type Point = { x: number; y: number };

function inIframe(): boolean {
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
}

function isEditable(
  target: EventTarget | null
): target is
  | HTMLInputElement
  | HTMLTextAreaElement
  | (HTMLElement & { isContentEditable: boolean }) {
  const el = target as HTMLElement | null;
  if (!el) return false;
  const tag = el.tagName?.toLowerCase();
  if (tag === 'input' || tag === 'textarea') return true;
  return !!el.isContentEditable;
}

async function readClipboardText(): Promise<string> {
  return await readClipboardViaBridge();
}
async function writeClipboardText(text: string): Promise<boolean> {
  return await writeClipboardViaBridge(text);
}

function getSelectedText(): string {
  const sel = window.getSelection();
  return sel ? sel.toString() : '';
}

function cutFromInput(el: HTMLInputElement | HTMLTextAreaElement) {
  const start = el.selectionStart ?? 0;
  const end = el.selectionEnd ?? 0;
  if (end > start) {
    const selected = el.value.slice(start, end);
    void writeClipboardText(selected);
    const before = el.value.slice(0, start);
    const after = el.value.slice(end);
    el.value = before + after;
    el.setSelectionRange(start, start);
    el.dispatchEvent(new Event('input', { bubbles: true }));
  }
}

function pasteIntoInput(
  el: HTMLInputElement | HTMLTextAreaElement,
  text: string
) {
  const start = el.selectionStart ?? 0;
  const end = el.selectionEnd ?? 0;
  const before = el.value.slice(0, start);
  const after = el.value.slice(end);
  el.value = before + text + after;
  const caret = start + text.length;
  el.setSelectionRange(caret, caret);
  el.dispatchEvent(new Event('input', { bubbles: true }));
}

export const WebviewContextMenu: React.FC = () => {
  const [visible, setVisible] = useState(false);
  const [pos, setPos] = useState<Point>({ x: 0, y: 0 });
  const [adjustedPos, setAdjustedPos] = useState<Point | null>(null);
  const [canCut, setCanCut] = useState<boolean>(false);
  const [canPaste, setCanPaste] = useState<boolean>(false);
  const targetRef = useRef<EventTarget | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!inIframe()) return;
    const onContext = (e: MouseEvent) => {
      e.preventDefault();
      targetRef.current = e.target;
      setPos({ x: e.clientX, y: e.clientY });
      // Decide whether Cut should be shown: only for editable targets with a selection
      const tgt = e.target as HTMLElement | null;
      let cut = false;
      let paste = false;
      if (tgt && (tgt as HTMLInputElement).selectionStart !== undefined) {
        const el = tgt as HTMLInputElement | HTMLTextAreaElement;
        const start = el.selectionStart ?? 0;
        const end = el.selectionEnd ?? 0;
        cut = end > start && !el.readOnly && !el.disabled;
        paste = !el.readOnly && !el.disabled;
      } else if (isEditable(tgt)) {
        const sel = window.getSelection();
        cut = !!sel && sel.toString().length > 0;
        paste = true;
      } else {
        cut = false;
        paste = false;
      }
      setCanCut(cut);
      setCanPaste(paste);
      setVisible(true);
    };
    const onClick = () => setVisible(false);
    document.addEventListener('contextmenu', onContext);
    document.addEventListener('click', onClick);
    window.addEventListener('blur', onClick);
    return () => {
      document.removeEventListener('contextmenu', onContext);
      document.removeEventListener('click', onClick);
      window.removeEventListener('blur', onClick);
    };
  }, []);

  // When menu becomes visible, adjust position to stay within viewport
  useEffect(() => {
    if (!visible) {
      setAdjustedPos(null);
      return;
    }
    const el = menuRef.current;
    if (!el) return;
    // Use a microtask to ensure layout is ready
    const id = requestAnimationFrame(() => {
      const menuW = el.offsetWidth;
      const menuH = el.offsetHeight;
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const margin = 4;
      let x = pos.x;
      let y = pos.y;
      if (x + menuW + margin > vw) x = Math.max(margin, vw - menuW - margin);
      if (y + menuH + margin > vh) y = Math.max(margin, vh - menuH - margin);
      setAdjustedPos({ x, y });
    });
    return () => cancelAnimationFrame(id);
  }, [visible, pos]);

  const close = () => setVisible(false);

  const onCopy = async () => {
    const tgt = targetRef.current as HTMLElement | null;
    let copied = false;
    if (tgt && (tgt as HTMLInputElement).selectionStart !== undefined) {
      const el = tgt as HTMLInputElement | HTMLTextAreaElement;
      const start = el.selectionStart ?? 0;
      const end = el.selectionEnd ?? 0;
      if (end > start) {
        const selected = el.value.slice(start, end);
        copied = await writeClipboardText(selected);
      }
    }
    if (!copied) {
      const sel = getSelectedText();
      if (sel) copied = await writeClipboardText(sel);
    }
    if (!copied) {
      try {
        document.execCommand('copy');
      } catch {
        /* empty */
      }
    }
    close();
  };

  const onCut = async () => {
    const tgt = targetRef.current as HTMLElement | null;
    if (
      tgt &&
      (tgt as HTMLInputElement).selectionStart !== undefined &&
      !(tgt as HTMLInputElement).readOnly &&
      !(tgt as HTMLInputElement).disabled
    ) {
      cutFromInput(tgt as HTMLInputElement | HTMLTextAreaElement);
    } else if (isEditable(tgt)) {
      // contentEditable: emulate cut by copying selection, then deleting via execCommand
      const sel = getSelectedText();
      if (sel) {
        await writeClipboardText(sel);
        try {
          document.execCommand('delete');
        } catch {
          /* empty */
        }
      }
    } else {
      // Read-only content: treat Cut as Copy for usability
      const sel = getSelectedText();
      if (sel) await writeClipboardText(sel);
    }
    close();
  };

  const onPaste = async () => {
    const text = await readClipboardText();
    const tgt = targetRef.current as HTMLElement | null;
    if (tgt && (tgt as HTMLInputElement).selectionStart !== undefined) {
      (tgt as HTMLElement).focus();
      pasteIntoInput(tgt as HTMLInputElement | HTMLTextAreaElement, text);
    } else if (isEditable(tgt)) {
      (tgt as HTMLElement).focus();
      document.execCommand('insertText', false, text);
    }
    close();
  };

  const onUndo = () => {
    try {
      document.execCommand('undo');
    } catch {
      /* empty */
    }
    close();
  };
  const onRedo = () => {
    try {
      document.execCommand('redo');
    } catch {
      /* empty */
    }
    close();
  };
  const onSelectAll = () => {
    try {
      document.execCommand('selectAll');
    } catch {
      /* empty */
    }
    close();
  };

  if (!visible) return null;

  return (
    <div
      ref={menuRef}
      style={{
        position: 'fixed',
        left: (adjustedPos ?? pos).x,
        top: (adjustedPos ?? pos).y,
        zIndex: 99999,
      }}
      className="min-w-[160px] rounded-md border border-gray-300 bg-white text-gray-900 shadow-lg dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
      onContextMenu={(e) => e.preventDefault()}
    >
      <MenuItem label="Copy" onClick={onCopy} />
      {canCut && <MenuItem label="Cut" onClick={onCut} />}
      {canPaste && <MenuItem label="Paste" onClick={onPaste} />}
      <Divider />
      <MenuItem label="Undo" onClick={onUndo} />
      <MenuItem label="Redo" onClick={onRedo} />
      <Divider />
      <MenuItem label="Select All" onClick={onSelectAll} />
    </div>
  );
};

const MenuItem: React.FC<{ label: string; onClick: () => void }> = ({
  label,
  onClick,
}) => (
  <button
    className="block w-full px-3 py-1.5 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
    onClick={onClick}
    type="button"
  >
    {label}
  </button>
);

const Divider: React.FC = () => (
  <div className="my-1 h-px bg-gray-200 dark:bg-gray-700" />
);
