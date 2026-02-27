/** Ask the extension to copy text to the OS clipboard (fallback path). */
export function parentClipboardWrite(text: string) {
  try {
    window.parent.postMessage(
      { type: 'vscode-iframe-clipboard-copy', text },
      '*'
    );
  } catch (_err) {
    void 0;
  }
}

/** Copy helper that prefers navigator.clipboard and falls back to the bridge. */
export async function writeClipboardViaBridge(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    parentClipboardWrite(text);
    return false;
  }
}
