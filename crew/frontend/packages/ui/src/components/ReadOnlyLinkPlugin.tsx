import { useEffect } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { LinkNode } from '@lexical/link';

/**
 * Sanitize href to block dangerous protocols.
 * Returns undefined if the href is blocked.
 */
function sanitizeHref(href?: string): string | undefined {
  if (typeof href !== 'string') return undefined;
  const trimmed = href.trim();
  // Block dangerous protocols
  if (/^(javascript|vbscript|data):/i.test(trimmed)) return undefined;
  // Allow anchors and common relative forms (but they'll be disabled)
  if (
    trimmed.startsWith('#') ||
    trimmed.startsWith('./') ||
    trimmed.startsWith('../') ||
    trimmed.startsWith('/')
  )
    return trimmed;
  // Allow only https
  if (/^https:\/\//i.test(trimmed)) return trimmed;
  // Block everything else by default
  return undefined;
}

/**
 * Check if href is an external HTTPS link.
 */
function isExternalHref(href?: string): boolean {
  if (!href) return false;
  return /^https:\/\//i.test(href);
}

/**
 * Plugin that handles link sanitization and security attributes in read-only mode.
 * - Blocks dangerous protocols (javascript:, vbscript:, data:)
 * - External HTTPS links: clickable with target="_blank" and rel="noopener noreferrer"
 * - Internal/relative links: rendered but not clickable
 */
export function ReadOnlyLinkPlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    // Register a mutation listener to modify link DOM elements
    const unregister = editor.registerMutationListener(
      LinkNode,
      (mutations) => {
        for (const [nodeKey, mutation] of mutations) {
          if (mutation === 'destroyed') continue;

          const dom = editor.getElementByKey(nodeKey);
          if (!dom || !(dom instanceof HTMLAnchorElement)) continue;

          const href = dom.getAttribute('href');
          const safeHref = sanitizeHref(href ?? undefined);

          if (!safeHref) {
            // Dangerous protocol - remove href entirely
            dom.removeAttribute('href');
            dom.style.cursor = 'not-allowed';
            dom.style.pointerEvents = 'none';
            continue;
          }

          const isExternal = isExternalHref(safeHref);

          if (isExternal) {
            // External HTTPS link - add security attributes
            dom.setAttribute('target', '_blank');
            dom.setAttribute('rel', 'noopener noreferrer');
            dom.onclick = (e) => e.stopPropagation();
          } else {
            // Internal/relative link - disable clicking
            dom.removeAttribute('href');
            dom.style.cursor = 'not-allowed';
            dom.style.pointerEvents = 'none';
            dom.setAttribute('role', 'link');
            dom.setAttribute('aria-disabled', 'true');
            dom.title = href ?? '';
          }
        }
      }
    );

    // Also handle existing links on mount by triggering a read
    editor.getEditorState().read(() => {
      const root = editor.getRootElement();
      if (!root) return;

      const links = root.querySelectorAll('a');
      links.forEach((link) => {
        const href = link.getAttribute('href');
        const safeHref = sanitizeHref(href ?? undefined);

        if (!safeHref) {
          link.removeAttribute('href');
          link.style.cursor = 'not-allowed';
          link.style.pointerEvents = 'none';
          return;
        }

        const isExternal = isExternalHref(safeHref);

        if (isExternal) {
          link.setAttribute('target', '_blank');
          link.setAttribute('rel', 'noopener noreferrer');
          link.onclick = (e) => e.stopPropagation();
        } else {
          link.removeAttribute('href');
          link.style.cursor = 'not-allowed';
          link.style.pointerEvents = 'none';
          link.setAttribute('role', 'link');
          link.setAttribute('aria-disabled', 'true');
          link.title = href ?? '';
        }
      });
    });

    return unregister;
  }, [editor]);

  return null;
}
