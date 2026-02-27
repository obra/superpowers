import { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  LexicalTypeaheadMenuPlugin,
  MenuOption,
} from '@lexical/react/LexicalTypeaheadMenuPlugin';
import { $createTextNode, KEY_ESCAPE_COMMAND } from 'lexical';
import { TerminalIcon } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import { useTypeaheadOpen } from './TypeaheadOpenContext';
import { TypeaheadMenu } from './TypeaheadMenu';

export type SlashCommandDescriptionLike = {
  name: string;
  description?: string | null;
};

class SlashCommandOption extends MenuOption {
  command: SlashCommandDescriptionLike;

  constructor(command: SlashCommandDescriptionLike) {
    super(`slash-command-${command.name}`);
    this.command = command;
  }
}

function filterSlashCommands(
  all: SlashCommandDescriptionLike[],
  query: string
): SlashCommandDescriptionLike[] {
  const q = query.trim().toLowerCase();
  if (!q) return all;

  const startsWith = all.filter((c) => c.name.toLowerCase().startsWith(q));
  const includes = all.filter(
    (c) => !startsWith.includes(c) && c.name.toLowerCase().includes(q)
  );
  return [...startsWith, ...includes];
}

export function SlashCommandTypeaheadPlugin({
  enabled,
  commands,
  isInitialized,
  isDiscovering,
}: {
  enabled: boolean;
  commands: SlashCommandDescriptionLike[];
  isInitialized: boolean;
  isDiscovering: boolean;
}) {
  const [editor] = useLexicalComposerContext();
  const { t } = useTranslation('common');
  const { setIsOpen } = useTypeaheadOpen();
  const [options, setOptions] = useState<SlashCommandOption[]>([]);
  const [activeQuery, setActiveQuery] = useState<string | null>(null);
  const closeTypeahead = useCallback(() => {
    editor.dispatchCommand(KEY_ESCAPE_COMMAND, new KeyboardEvent('keydown'));
  }, [editor]);

  const isLoading = !isInitialized && enabled;

  const updateOptions = useCallback(
    (query: string | null) => {
      setActiveQuery(query);

      if (!enabled || query === null) {
        setOptions([]);
        return;
      }

      const filtered = filterSlashCommands(commands, query).slice(0, 20);
      setOptions(filtered.map((c) => new SlashCommandOption(c)));
    },
    [enabled, commands]
  );

  const hasVisibleResults = useMemo(() => {
    if (!enabled || activeQuery === null) return false;
    if (isLoading || isDiscovering) return true;
    if (!activeQuery.trim()) return true;
    return options.length > 0;
  }, [enabled, activeQuery, isDiscovering, isLoading, options.length]);

  // If command list loads while menu is open, refresh options.
  useEffect(() => {
    if (activeQuery === null) return;
    updateOptions(activeQuery);
  }, [activeQuery, updateOptions]);

  return (
    <LexicalTypeaheadMenuPlugin<SlashCommandOption>
      triggerFn={(text) => {
        const match = /^(\s*)\/([^\s/]*)$/.exec(text);
        if (!match) return null;

        const slashOffset = match[1].length;
        return {
          leadOffset: slashOffset,
          matchingString: match[2],
          replaceableString: match[0].slice(slashOffset),
        };
      }}
      options={options}
      onQueryChange={updateOptions}
      onOpen={() => setIsOpen(true)}
      onClose={() => setIsOpen(false)}
      onSelectOption={(option, nodeToReplace, closeMenu) => {
        editor.update(() => {
          if (!nodeToReplace) return;

          const textToInsert = `/${option.command.name}`;
          const commandNode = $createTextNode(textToInsert);
          nodeToReplace.replace(commandNode);

          const spaceNode = $createTextNode(' ');
          commandNode.insertAfter(spaceNode);
          spaceNode.select(1, 1);
        });

        closeMenu();
      }}
      menuRenderFn={(
        anchorRef,
        { selectedIndex, selectOptionAndCleanUp, setHighlightedIndex }
      ) => {
        if (!anchorRef.current) return null;
        if (!enabled) return null;
        if (!hasVisibleResults) return null;

        const isEmpty = !isLoading && !isDiscovering && commands.length === 0;
        const showLoadingRow = isLoading || isDiscovering;
        const loadingText = isLoading
          ? 'Loading commands…'
          : 'Discovering commands…';

        return createPortal(
          <TypeaheadMenu
            anchorEl={anchorRef.current}
            editorEl={editor.getRootElement()}
            onClickOutside={closeTypeahead}
          >
            <TypeaheadMenu.Header>
              <TerminalIcon className="size-icon-xs" weight="bold" />
              {t('typeahead.commands')}
            </TypeaheadMenu.Header>

            {isEmpty ? (
              <TypeaheadMenu.Empty>
                {t('typeahead.noCommands')}
              </TypeaheadMenu.Empty>
            ) : options.length === 0 && !showLoadingRow ? null : (
              <TypeaheadMenu.ScrollArea>
                {showLoadingRow && (
                  <div className="px-base py-half text-sm text-low select-none">
                    {loadingText}
                  </div>
                )}
                {options.map((option, index) => {
                  const details = option.command.description ?? null;

                  return (
                    <TypeaheadMenu.Item
                      key={option.key}
                      isSelected={index === selectedIndex}
                      index={index}
                      setHighlightedIndex={setHighlightedIndex}
                      onClick={() => selectOptionAndCleanUp(option)}
                    >
                      <div className="flex items-center gap-half font-medium">
                        <span className="font-mono">
                          /{option.command.name}
                        </span>
                      </div>
                      {details && (
                        <div className="text-xs text-low truncate">
                          {details}
                        </div>
                      )}
                    </TypeaheadMenu.Item>
                  );
                })}
              </TypeaheadMenu.ScrollArea>
            )}
          </TypeaheadMenu>,
          document.body
        );
      }}
    />
  );
}
