import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useEffect } from 'react';
import { $createCodeNode } from '@lexical/code';
import {
  $getSelection,
  $isRangeSelection,
  $isTextNode,
  $isParagraphNode,
  $createTextNode,
  ElementNode,
} from 'lexical';

const CODE_START_REGEX = /^```([\w-]*)$/;
const CODE_END_REGEX = /^```$/;

/**
 * Plugin that detects when user types closing ``` and converts the
 * paragraphs between opening and closing backticks into a code block.
 *
 * This handles the typing case - paste/import is handled by CODE_BLOCK_TRANSFORMER.
 */
export function CodeBlockShortcutPlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return editor.registerUpdateListener(({ dirtyLeaves }) => {
      // Only process if there are dirty leaves (actual changes)
      if (dirtyLeaves.size === 0) return;

      editor.update(() => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection) || !selection.isCollapsed()) return;

        const anchorNode = selection.anchor.getNode();
        if (!$isTextNode(anchorNode)) return;

        const currentParagraph = anchorNode.getParent();
        if (!$isParagraphNode(currentParagraph)) return;

        const currentText = currentParagraph.getTextContent();

        // Check if current line is closing ```
        if (!CODE_END_REGEX.test(currentText)) return;

        // Scan backward to find opening ```
        let openingParagraph: ElementNode | null = null;
        let language: string | undefined;
        const contentParagraphs: ElementNode[] = [];

        let sibling = currentParagraph.getPreviousSibling();
        while (sibling) {
          if ($isParagraphNode(sibling)) {
            const text = sibling.getTextContent();
            const startMatch = text.match(CODE_START_REGEX);
            if (startMatch) {
              openingParagraph = sibling;
              language = startMatch[1] || undefined;
              break;
            }
            contentParagraphs.unshift(sibling);
          }
          sibling = sibling.getPreviousSibling();
        }

        if (!openingParagraph) return;

        // Collect content from paragraphs between opening and closing
        const codeLines = contentParagraphs.map((p) => p.getTextContent());
        const code = codeLines.join('\n');

        // Create code node
        const codeNode = $createCodeNode(language);
        if (code) {
          codeNode.append($createTextNode(code));
        }

        // Replace opening paragraph with code node
        openingParagraph.replace(codeNode);

        // Remove content paragraphs and closing paragraph
        contentParagraphs.forEach((p) => p.remove());
        currentParagraph.remove();

        // Position cursor at end of code block
        codeNode.selectEnd();
      });
    });
  }, [editor]);

  return null;
}
