// VS Code Webview iframe keyboard bridge
//
// Purpose
// - Make typing, paste/cut/undo/redo inside the iframe feel like a regular browser
//   input/textarea/contentEditable.
// - Still allow VS Code to handle global/editor shortcuts by forwarding non-text
//   editing keys to the parent webview.
// - Bridge clipboard reads/writes when navigator.clipboard is restricted.

/** Returns true when running inside an iframe (vs top-level window). */
export function inIframe(): boolean {
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
}

/** Minimal serializable keyboard event shape used across the bridge. */
type KeyPayload = {
  key: string;
  code: string;
  altKey: boolean;
  ctrlKey: boolean;
  shiftKey: boolean;
  metaKey: boolean;
  repeat: boolean;
  isComposing: boolean;
  location: number;
};

/** Convert a KeyboardEvent to a serializable payload for postMessage. */
function serializeKeyEvent(e: KeyboardEvent): KeyPayload {
  return {
    key: e.key,
    code: e.code,
    altKey: e.altKey,
    ctrlKey: e.ctrlKey,
    shiftKey: e.shiftKey,
    metaKey: e.metaKey,
    repeat: e.repeat,
    isComposing: e.isComposing,
    location: e.location ?? 0,
  };
}

/** Platform check used for shortcut detection. */
const isMac = () => navigator.platform.toUpperCase().includes('MAC');

/** True for Cmd/Ctrl+C (no Shift/Alt). */
const isCopy = (e: KeyboardEvent) =>
  (isMac() ? e.metaKey : e.ctrlKey) &&
  !e.shiftKey &&
  !e.altKey &&
  e.key.toLowerCase() === 'c';
/** True for Cmd/Ctrl+X (no Shift/Alt). */
const isCut = (e: KeyboardEvent) =>
  (isMac() ? e.metaKey : e.ctrlKey) &&
  !e.shiftKey &&
  !e.altKey &&
  e.key.toLowerCase() === 'x';
/** True for Cmd/Ctrl+V (no Shift/Alt). */
const isPaste = (e: KeyboardEvent) =>
  (isMac() ? e.metaKey : e.ctrlKey) &&
  !e.shiftKey &&
  !e.altKey &&
  e.key.toLowerCase() === 'v';
/** True for Cmd/Ctrl+Z. */
const isUndo = (e: KeyboardEvent) =>
  (isMac() ? e.metaKey : e.ctrlKey) &&
  !e.shiftKey &&
  !e.altKey &&
  e.key.toLowerCase() === 'z';
/** True for redo (Cmd+Shift+Z on macOS, Ctrl+Y elsewhere). */
const isRedo = (e: KeyboardEvent) =>
  (isMac() ? e.metaKey : e.ctrlKey) &&
  !e.altKey &&
  ((isMac() && e.shiftKey && e.key.toLowerCase() === 'z') ||
    (!isMac() && !e.shiftKey && e.key.toLowerCase() === 'y'));

/**
 * Returns the currently focused editable element (input/textarea/contentEditable)
 * or null when focus is not within an editable.
 */
function activeEditable():
  | HTMLInputElement
  | HTMLTextAreaElement
  | (HTMLElement & { isContentEditable: boolean })
  | null {
  const el = document.activeElement as HTMLElement | null;
  if (!el) return null;
  const tag = el.tagName?.toLowerCase();
  if (tag === 'input' || tag === 'textarea')
    return el as HTMLInputElement | HTMLTextAreaElement;
  if (el.isContentEditable)
    return el as HTMLElement & { isContentEditable: boolean };
  return null;
}

/** Attempt to write to the OS clipboard. Returns true on success. */
async function writeClipboardText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      return document.execCommand('copy');
    } catch {
      return false;
    }
  }
}

/** Attempt to read from the OS clipboard. Returns empty string on failure. */
async function readClipboardText(): Promise<string> {
  try {
    return await navigator.clipboard.readText();
  } catch {
    return '';
  }
}

/** Best-effort selection extractor for inputs, textareas, and contentEditable. */
function getSelectedText(): string {
  const el = activeEditable() as
    | HTMLInputElement
    | HTMLTextAreaElement
    | (HTMLElement & { isContentEditable: boolean })
    | null;
  if (el && (el as HTMLInputElement).selectionStart !== undefined) {
    const input = el as HTMLInputElement | HTMLTextAreaElement;
    const start = input.selectionStart ?? 0;
    const end = input.selectionEnd ?? 0;
    return start < end ? input.value.slice(start, end) : '';
  }
  const sel = window.getSelection();
  return sel ? sel.toString() : '';
}

/** Perform a browser-like cut on an input/textarea and emit input/change events. */
function cutFromInput(el: HTMLInputElement | HTMLTextAreaElement) {
  const start = el.selectionStart ?? 0;
  const end = el.selectionEnd ?? 0;
  if (end > start) {
    const selected = el.value.slice(start, end);
    void writeClipboardText(selected);
    if (typeof el.setRangeText === 'function') {
      el.setRangeText('', start, end, 'end');
    } else {
      const before = el.value.slice(0, start);
      const after = el.value.slice(end);
      el.value = before + after;
      el.setSelectionRange(start, start);
    }
    const ie: Event =
      typeof InputEvent === 'function'
        ? new InputEvent('input', {
            bubbles: true,
            composed: true,
            inputType: 'deleteByCut',
          })
        : new Event('input', { bubbles: true });
    el.dispatchEvent(ie);
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }
}

/** Paste text at the current caret position in an input/textarea and emit events. */
function pasteIntoInput(
  el: HTMLInputElement | HTMLTextAreaElement,
  text: string
) {
  const start = el.selectionStart ?? el.value.length;
  const end = el.selectionEnd ?? el.value.length;
  if (typeof el.setRangeText === 'function') {
    el.setRangeText(text, start, end, 'end');
  } else {
    const before = el.value.slice(0, start);
    const after = el.value.slice(end);
    el.value = before + text + after;
    const caret = start + text.length;
    el.setSelectionRange(caret, caret);
  }
  el.focus();
  const ie: Event =
    typeof InputEvent === 'function'
      ? new InputEvent('input', {
          bubbles: true,
          composed: true,
          inputType: 'insertFromPaste',
          data: text,
        })
      : new Event('input', { bubbles: true });
  el.dispatchEvent(ie);
  el.dispatchEvent(new Event('change', { bubbles: true }));
}

/**
 * Insert text at the caret for the currently active editable.
 * Uses native mechanisms (setRangeText/execCommand) and emits input events so
 * controlled frameworks (like React) update state predictably.
 */
function insertTextAtCaretGeneric(text: string) {
  const el =
    (activeEditable() as
      | HTMLInputElement
      | HTMLTextAreaElement
      | (HTMLElement & { isContentEditable: boolean })
      | null) ||
    (document.querySelector(
      'textarea, input:not([type=checkbox]):not([type=radio])'
    ) as HTMLTextAreaElement | HTMLInputElement | null);
  if (!el) return;
  if ((el as HTMLInputElement).selectionStart !== undefined) {
    pasteIntoInput(el as HTMLInputElement | HTMLTextAreaElement, text);
  } else {
    try {
      document.execCommand('insertText', false, text);
      el.dispatchEvent(new Event('input', { bubbles: true }));
    } catch {
      (el as HTMLElement).innerText += text;
    }
  }
}

// Lightweight retry for cases where add-to arrives before an editable exists
/** CSS selector for a reasonable first editable fallback. */
const EDITABLE_SELECTOR =
  'textarea, input:not([type=checkbox]):not([type=radio])';
/** Interval (ms) between retries while we wait for an editable to appear. */
const RETRY_INTERVAL_MS = 100;
/** Maximum number of retry attempts before giving up. */
const MAX_RETRY_ATTEMPTS = 15;
let insertRetryTimer: number | null = null;
const insertQueue: string[] = [];
function enqueueInsert(text: string) {
  insertQueue.push(text);
  if (insertRetryTimer != null) return;
  let attempts = 0;
  const run = () => {
    attempts++;
    const el =
      activeEditable() ||
      (document.querySelector(EDITABLE_SELECTOR) as
        | HTMLTextAreaElement
        | HTMLInputElement
        | null);
    if (el) {
      // drain queue
      while (insertQueue.length > 0) {
        insertTextAtCaretGeneric(insertQueue.shift() as string);
      }
      if (insertRetryTimer != null) {
        window.clearInterval(insertRetryTimer);
        insertRetryTimer = null;
      }
      return;
    }
    if (attempts >= MAX_RETRY_ATTEMPTS && insertRetryTimer != null) {
      window.clearInterval(insertRetryTimer);
      insertRetryTimer = null;
    }
  };
  insertRetryTimer = window.setInterval(run, RETRY_INTERVAL_MS);
}

/** Request map to resolve clipboard paste requests from the extension. */
const pasteResolvers: Record<string, (text: string) => void> = {};

import { parentClipboardWrite } from '@/shared/lib/clipboard';

/** Ask the extension to read text from the OS clipboard (fallback path). */
export function parentClipboardRead(): Promise<string> {
  return new Promise((resolve) => {
    const requestId = Math.random().toString(36).slice(2);
    pasteResolvers[requestId] = (text: string) => resolve(text);
    try {
      window.parent.postMessage(
        { type: 'vscode-iframe-clipboard-paste-request', requestId },
        '*'
      );
    } catch {
      resolve('');
    }
  });
}

/** Ask the extension to open a file in VS Code at an optional line. */
export function openFileInVSCode(
  filePath: string,
  options?: { lineNumber?: number; openAsDiff?: boolean }
) {
  if (!inIframe()) return;
  try {
    window.parent.postMessage(
      {
        type: 'VIBE_OPEN_FILE',
        filePath,
        lineNumber: options?.lineNumber,
        openAsDiff: options?.openAsDiff ?? true,
      },
      '*'
    );
  } catch (_err) {
    void 0;
  }
}

/** Message union used for iframe <-> extension communications. */
type IframeMessage = {
  type: string;
  event?: KeyPayload;
  text?: string;
  requestId?: string;
};

// Handle messages from the parent webview (clipboard, add-to input)
window.addEventListener('message', (e: MessageEvent) => {
  const data: unknown = e?.data;
  if (!data || typeof data !== 'object') return;
  const msg = data as IframeMessage;
  if (msg.type === 'vscode-iframe-clipboard-paste-result' && msg.requestId) {
    const fn = pasteResolvers[msg.requestId];
    if (fn) {
      fn(msg.text || '');
      delete pasteResolvers[msg.requestId];
    }
  }
  if (msg.type === 'VIBE_ADD_TO_INPUT' && typeof msg.text === 'string') {
    const el =
      activeEditable() ||
      (document.querySelector(EDITABLE_SELECTOR) as
        | HTMLTextAreaElement
        | HTMLInputElement
        | null);
    if (el) insertTextAtCaretGeneric(msg.text);
    else enqueueInsert(msg.text);
  }
});

/** Install keyboard + clipboard handlers when running inside an iframe. */
export function installVSCodeIframeKeyboardBridge() {
  if (!inIframe()) return;

  const forward = (type: string, e: KeyboardEvent) => {
    try {
      window.parent.postMessage({ type, event: serializeKeyEvent(e) }, '*');
    } catch (_err) {
      void 0;
    }
  };

  const onKeyDown = async (e: KeyboardEvent) => {
    // Handle clipboard combos locally so OS shortcuts work inside the iframe
    if (isCopy(e)) {
      const text = getSelectedText();
      if (text) {
        e.preventDefault();
        e.stopPropagation();
        const ok = await writeClipboardText(text);
        if (!ok) parentClipboardWrite(text);
        return;
      }
    } else if (isCut(e)) {
      const el = activeEditable() as
        | HTMLInputElement
        | HTMLTextAreaElement
        | null;
      if (el) {
        e.preventDefault();
        e.stopPropagation();
        cutFromInput(el);
        return;
      }
    } else if (isUndo(e)) {
      e.preventDefault();
      e.stopPropagation();
      try {
        document.execCommand('undo');
      } catch {
        /* empty */
      }
      return;
    } else if (isRedo(e)) {
      e.preventDefault();
      e.stopPropagation();
      try {
        document.execCommand('redo');
      } catch {
        /* empty */
      }
      return;
    } else if (isPaste(e)) {
      const el = activeEditable() as
        | HTMLInputElement
        | HTMLTextAreaElement
        | (HTMLElement & { isContentEditable: boolean })
        | null;
      if (el) {
        e.preventDefault();
        e.stopPropagation();
        let text = await readClipboardText();
        if (!text) text = await parentClipboardRead();
        insertTextAtCaretGeneric(text);
        return;
      }
    }
    // Forward everything else so VS Code can handle global shortcuts
    forward('vscode-iframe-keydown', e);
  };

  const onKeyUp = (e: KeyboardEvent) => forward('vscode-iframe-keyup', e);
  const onKeyPress = (e: KeyboardEvent) => forward('vscode-iframe-keypress', e);

  // Capture phase to run before app handlers
  window.addEventListener('keydown', onKeyDown, true);
  window.addEventListener('keyup', onKeyUp, true);
  window.addEventListener('keypress', onKeyPress, true);
  document.addEventListener('keydown', onKeyDown, true);
  document.addEventListener('keyup', onKeyUp, true);
  document.addEventListener('keypress', onKeyPress, true);
}

/** Paste helper that prefers navigator.clipboard and falls back to the bridge. */
export async function readClipboardViaBridge(): Promise<string> {
  try {
    return await navigator.clipboard.readText();
  } catch {
    return await parentClipboardRead();
  }
}

// Auto-install on import to make it robust
installVSCodeIframeKeyboardBridge();
