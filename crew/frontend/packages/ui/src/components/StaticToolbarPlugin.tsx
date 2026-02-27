import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $getSelection,
  $isRangeSelection,
  FORMAT_TEXT_COMMAND,
  SELECTION_CHANGE_COMMAND,
  COMMAND_PRIORITY_CRITICAL,
  UNDO_COMMAND,
} from 'lexical';
import {
  INSERT_UNORDERED_LIST_COMMAND,
  INSERT_ORDERED_LIST_COMMAND,
  REMOVE_LIST_COMMAND,
  $isListNode,
} from '@lexical/list';
import {
  TextB,
  TextItalic,
  TextUnderline,
  TextStrikethrough,
  Code,
  ListBullets,
  ListNumbers,
  ArrowCounterClockwise,
  type Icon,
  CheckIcon,
} from '@phosphor-icons/react';
import { cn } from '../lib/cn';

interface ToolbarButtonProps {
  active?: boolean;
  onClick: () => void;
  icon: Icon;
  label: string;
}

function ToolbarButton({
  active,
  onClick,
  icon: Icon,
  label,
}: ToolbarButtonProps) {
  return (
    <button
      type="button"
      onMouseDown={(e) => {
        // Prevent losing selection when clicking toolbar
        e.preventDefault();
        onClick();
      }}
      aria-label={label}
      title={label}
      className={cn(
        'p-half rounded-sm transition-colors',
        active
          ? 'text-normal bg-panel'
          : 'text-low hover:text-normal hover:bg-panel/50'
      )}
    >
      <Icon className="size-icon-sm" weight="bold" />
    </button>
  );
}

interface StaticToolbarPluginProps {
  saveStatus?: 'idle' | 'saved';
  extraActions?: ReactNode;
}

export function StaticToolbarPlugin({
  saveStatus,
  extraActions,
}: StaticToolbarPluginProps) {
  const [editor] = useLexicalComposerContext();

  // Text format state
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [isStrikethrough, setIsStrikethrough] = useState(false);
  const [isCode, setIsCode] = useState(false);

  // List state
  const [isBulletList, setIsBulletList] = useState(false);
  const [isNumberedList, setIsNumberedList] = useState(false);

  const updateToolbarState = useCallback(() => {
    const selection = $getSelection();
    if ($isRangeSelection(selection)) {
      // Text formats
      setIsBold(selection.hasFormat('bold'));
      setIsItalic(selection.hasFormat('italic'));
      setIsUnderline(selection.hasFormat('underline'));
      setIsStrikethrough(selection.hasFormat('strikethrough'));
      setIsCode(selection.hasFormat('code'));

      // List detection - traverse up to find parent list
      let node = selection.anchor.getNode();
      let foundBullet = false;
      let foundNumber = false;

      // Walk up the tree to find a list node
      while (node !== null) {
        const parent = node.getParent();
        if (parent && $isListNode(parent)) {
          const listType = parent.getListType();
          if (listType === 'bullet') {
            foundBullet = true;
          } else if (listType === 'number') {
            foundNumber = true;
          }
          break;
        }
        node = parent as typeof node;
      }

      setIsBulletList(foundBullet);
      setIsNumberedList(foundNumber);
    }
  }, []);

  // Update toolbar state on selection change
  useEffect(() => {
    return editor.registerCommand(
      SELECTION_CHANGE_COMMAND,
      () => {
        updateToolbarState();
        return false;
      },
      COMMAND_PRIORITY_CRITICAL
    );
  }, [editor, updateToolbarState]);

  // Also update on editor state changes
  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        updateToolbarState();
      });
    });
  }, [editor, updateToolbarState]);

  return (
    <div className="flex items-center gap-half mt-base p-base border-t border-border/50">
      {/* Undo button */}
      <ToolbarButton
        onClick={() => editor.dispatchCommand(UNDO_COMMAND, undefined)}
        icon={ArrowCounterClockwise}
        label="Undo"
      />

      {/* Separator */}
      <div className="w-px h-4 bg-border mx-half" />

      {/* Text formatting buttons */}
      <ToolbarButton
        active={isBold}
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold')}
        icon={TextB}
        label="Bold"
      />
      <ToolbarButton
        active={isItalic}
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic')}
        icon={TextItalic}
        label="Italic"
      />
      <ToolbarButton
        active={isUnderline}
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'underline')}
        icon={TextUnderline}
        label="Underline"
      />
      <ToolbarButton
        active={isStrikethrough}
        onClick={() =>
          editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'strikethrough')
        }
        icon={TextStrikethrough}
        label="Strikethrough"
      />
      <ToolbarButton
        active={isCode}
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'code')}
        icon={Code}
        label="Inline Code"
      />

      {/* Separator */}
      <div className="w-px h-4 bg-border mx-half" />

      {/* List buttons */}
      <ToolbarButton
        active={isBulletList}
        onClick={() => {
          if (isBulletList) {
            editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
          } else {
            editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
          }
        }}
        icon={ListBullets}
        label="Bullet List"
      />
      <ToolbarButton
        active={isNumberedList}
        onClick={() => {
          if (isNumberedList) {
            editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
          } else {
            editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
          }
        }}
        icon={ListNumbers}
        label="Numbered List"
      />

      {extraActions && (
        <>
          <div className="w-px h-4 bg-border mx-half" />
          <div className="flex items-center gap-half">{extraActions}</div>
        </>
      )}

      {/* Save Status Indicator */}
      {saveStatus && (
        <div
          className={cn(
            'ml-auto mr-base flex items-center transition-opacity duration-300',
            saveStatus === 'idle' ? 'opacity-0' : 'opacity-100'
          )}
        >
          <CheckIcon className="size-icon-sm text-success" weight="bold" />
        </div>
      )}
    </div>
  );
}
