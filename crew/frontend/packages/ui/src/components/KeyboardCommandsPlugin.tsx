import { useEffect } from 'react';
import { flushSync } from 'react-dom';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $getSelection,
  $isRangeSelection,
  INDENT_CONTENT_COMMAND,
  KEY_TAB_COMMAND,
  KEY_MODIFIER_COMMAND,
  KEY_ENTER_COMMAND,
  FORMAT_TEXT_COMMAND,
  OUTDENT_CONTENT_COMMAND,
  COMMAND_PRIORITY_NORMAL,
  COMMAND_PRIORITY_HIGH,
  type LexicalNode,
} from 'lexical';
import { $convertToMarkdownString, type Transformer } from '@lexical/markdown';
import { $isListItemNode } from '@lexical/list';
import { useTypeaheadOpen } from './TypeaheadOpenContext';

type SendMessageShortcut = 'ModifierEnter' | 'Enter';

type Props = {
  onCmdEnter?: () => void;
  onShiftCmdEnter?: () => void;
  onChange?: (markdown: string) => void;
  transformers?: Transformer[];
  sendShortcut?: SendMessageShortcut;
};

export function KeyboardCommandsPlugin({
  onCmdEnter,
  onShiftCmdEnter,
  onChange,
  transformers,
  sendShortcut = 'ModifierEnter',
}: Props) {
  const [editor] = useLexicalComposerContext();
  const { isOpen: isTypeaheadOpen } = useTypeaheadOpen();

  useEffect(() => {
    const isNodeInsideListItem = (node: LexicalNode): boolean => {
      if ($isListItemNode(node)) {
        return true;
      }
      return node.getParents().some($isListItemNode);
    };

    const isSelectionInsideListItem = (): boolean => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) {
        return false;
      }

      return (
        isNodeInsideListItem(selection.anchor.getNode()) ||
        isNodeInsideListItem(selection.focus.getNode())
      );
    };

    const getSelectedListItem = (): LexicalNode | null => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) {
        return null;
      }

      // On empty list items Lexical can include adjacent nodes in getNodes().
      // Prefer the last node so Tab applies to the cursor list item.
      const nodes = selection.getNodes();
      for (let i = nodes.length - 1; i >= 0; i--) {
        const node = nodes[i];
        if ($isListItemNode(node)) {
          return node;
        }
        const parentListItem = node.getParents().find($isListItemNode);
        if (parentListItem) {
          return parentListItem;
        }
      }

      const anchorNode = selection.anchor.getNode();
      if ($isListItemNode(anchorNode)) {
        return anchorNode;
      }
      return anchorNode.getParents().find($isListItemNode) ?? null;
    };

    const unregisterTab = editor.registerCommand(
      KEY_TAB_COMMAND,
      (event: KeyboardEvent) => {
        // Let typeahead use Tab for option selection.
        if (isTypeaheadOpen) {
          return false;
        }

        if (!isSelectionInsideListItem()) {
          return false;
        }

        event.preventDefault();
        const selection = $getSelection();
        if (!$isRangeSelection(selection)) {
          return false;
        }

        if (!selection.isCollapsed()) {
          return editor.dispatchCommand(
            event.shiftKey ? OUTDENT_CONTENT_COMMAND : INDENT_CONTENT_COMMAND,
            undefined
          );
        }

        const listItem = getSelectedListItem();
        if (!$isListItemNode(listItem)) {
          return false;
        }

        if (event.shiftKey) {
          const indent = listItem.getIndent();
          if (indent > 0) {
            listItem.setIndent(indent - 1);
          }
          return true;
        }

        // Match Google Docs behavior: first sibling cannot be indented further.
        if (!$isListItemNode(listItem.getPreviousSibling())) {
          return true;
        }

        listItem.setIndent(listItem.getIndent() + 1);
        return true;
      },
      COMMAND_PRIORITY_NORMAL
    );

    if (!onCmdEnter && !onShiftCmdEnter) {
      return unregisterTab;
    }

    const flushAndSubmit = () => {
      if (onChange && transformers) {
        const markdown = editor
          .getEditorState()
          .read(() => $convertToMarkdownString(transformers));
        flushSync(() => {
          onChange(markdown);
        });
      }
      onCmdEnter?.();
    };

    const unregisterModifier = editor.registerCommand(
      KEY_MODIFIER_COMMAND,
      (event: KeyboardEvent) => {
        if (!(event.metaKey || event.ctrlKey) || event.key !== 'Enter') {
          return false;
        }

        event.preventDefault();
        event.stopPropagation();

        if (event.shiftKey && onShiftCmdEnter) {
          onShiftCmdEnter();
          return true;
        }

        if (!event.shiftKey && onCmdEnter && sendShortcut === 'ModifierEnter') {
          flushAndSubmit();
          return true;
        }

        return false;
      },
      COMMAND_PRIORITY_NORMAL
    );

    const unregisterInlineCode = editor.registerCommand(
      KEY_MODIFIER_COMMAND,
      (event: KeyboardEvent) => {
        if (!(event.metaKey || event.ctrlKey)) {
          return false;
        }

        if (event.key.toLowerCase() !== 'e') {
          return false;
        }

        // Avoid overriding browser/system shortcuts while IME is composing.
        if (event.isComposing) {
          return false;
        }

        event.preventDefault();
        event.stopPropagation();
        editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'code');
        return true;
      },
      COMMAND_PRIORITY_NORMAL
    );

    const unregisterEnter = editor.registerCommand(
      KEY_ENTER_COMMAND,
      (event: KeyboardEvent | null) => {
        if (!event) return false;

        // If typeahead is open, let it handle Enter
        if (isTypeaheadOpen) {
          return false;
        }

        if (sendShortcut === 'Enter') {
          if (event.shiftKey || event.metaKey || event.ctrlKey) {
            return false;
          }
          event.preventDefault();
          flushAndSubmit();
          return true;
        }

        if (event.metaKey || event.ctrlKey) {
          return true;
        }

        return false;
      },
      COMMAND_PRIORITY_HIGH
    );

    return () => {
      unregisterTab();
      unregisterModifier();
      unregisterEnter();
      unregisterInlineCode();
    };
  }, [
    editor,
    onCmdEnter,
    onShiftCmdEnter,
    onChange,
    transformers,
    sendShortcut,
    isTypeaheadOpen,
  ]);

  return null;
}
