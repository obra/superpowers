import { useMemo, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { XIcon, GearIcon } from '@phosphor-icons/react';
import { create, useModal } from '@ebay/nice-modal-react';
import { defineModal, type NoProps } from '@/shared/lib/modals';

import { useUserSystem } from '@/shared/hooks/useUserSystem';
import { cn } from '@/shared/lib/utils';
import {
  sequentialBindings,
  formatSequentialKeys,
  Scope,
} from '@/shared/keyboard/registry';
import { isMac, getModifierKey } from '@/shared/lib/platform';
import { Tooltip } from '@vibe/ui/components/Tooltip';

interface ShortcutItem {
  keys: string | string[];
  description: string;
  hasScope?: boolean;
  useHintKey?: boolean;
}

interface ShortcutGroup {
  name: string;
  shortcuts: ShortcutItem[];
}

function useShortcutGroups(): ShortcutGroup[] {
  const { config } = useUserSystem();
  const { t } = useTranslation('common');
  const sendShortcut = config?.send_message_shortcut ?? 'ModifierEnter';

  return useMemo(() => {
    const mod = getModifierKey();
    const enterKey = isMac() ? '↩' : 'Enter';

    // Quick Actions - single key shortcuts
    const quickActions: ShortcutGroup = {
      name: t('shortcuts.groups.quickActions'),
      shortcuts: [
        { keys: '?', description: t('shortcuts.actions.showHelp') },
        { keys: 'Esc', description: t('shortcuts.actions.closeCancel') },
        { keys: 'C', description: t('shortcuts.actions.createNewTask') },
        { keys: 'D', description: t('shortcuts.actions.deleteSelected') },
        { keys: '/', description: t('shortcuts.actions.focusSearch') },
      ],
    };

    // Navigation - Vim-style
    const navigation: ShortcutGroup = {
      name: t('shortcuts.groups.navigation'),
      shortcuts: [
        { keys: 'J', description: t('shortcuts.actions.moveDown') },
        { keys: 'K', description: t('shortcuts.actions.moveUp') },
        { keys: 'H', description: t('shortcuts.actions.moveLeft') },
        { keys: 'L', description: t('shortcuts.actions.moveRight') },
      ],
    };

    const modifiers: ShortcutGroup = {
      name: t('shortcuts.groups.modifiers'),
      shortcuts: [
        {
          keys: [mod, 'K'],
          description: t('shortcuts.actions.openCommandBar'),
        },
        {
          keys: [mod, 'E'],
          description: t('shortcuts.actions.formatInlineCode'),
        },
        sendShortcut === 'Enter'
          ? {
              keys: enterKey,
              description: t('shortcuts.actions.sendMessage'),
              useHintKey: true,
            }
          : {
              keys: [mod, enterKey],
              description: t('shortcuts.actions.sendMessage'),
              useHintKey: true,
            },
      ],
    };

    // Group sequential bindings by their first key
    const sequentialByFirstKey = new Map<string, ShortcutItem[]>();
    for (const binding of sequentialBindings) {
      const firstKey = binding.keys[0];
      if (!sequentialByFirstKey.has(firstKey)) {
        sequentialByFirstKey.set(firstKey, []);
      }
      const hasWorkspaceScope =
        binding.scopes?.includes(Scope.WORKSPACE) ?? false;

      sequentialByFirstKey.get(firstKey)!.push({
        keys: formatSequentialKeys(binding.keys),
        description: t(
          `shortcuts.actions.${binding.actionId}`,
          binding.description
        ),
        hasScope: hasWorkspaceScope,
      });
    }

    // Create named groups for sequential shortcuts
    const sequentialGroups: ShortcutGroup[] = [
      {
        name: t('shortcuts.groups.goTo'),
        shortcuts: sequentialByFirstKey.get('g') || [],
      },
      {
        name: t('shortcuts.groups.workspace'),
        shortcuts: sequentialByFirstKey.get('w') || [],
      },
      {
        name: t('shortcuts.groups.view'),
        shortcuts: sequentialByFirstKey.get('v') || [],
      },
      {
        name: t('shortcuts.groups.issues'),
        shortcuts: sequentialByFirstKey.get('i') || [],
      },
      {
        name: t('shortcuts.groups.git'),
        shortcuts: sequentialByFirstKey.get('x') || [],
      },
      {
        name: t('shortcuts.groups.yank'),
        shortcuts: sequentialByFirstKey.get('y') || [],
      },
      {
        name: t('shortcuts.groups.toggle'),
        shortcuts: sequentialByFirstKey.get('t') || [],
      },
      {
        name: t('shortcuts.groups.run'),
        shortcuts: sequentialByFirstKey.get('r') || [],
      },
    ].filter((g) => g.shortcuts.length > 0);

    return [quickActions, navigation, modifiers, ...sequentialGroups];
  }, [sendShortcut, t]);
}

function ShortcutRow({ item }: { item: ShortcutItem }) {
  const { t } = useTranslation('common');
  const keysArray = Array.isArray(item.keys) ? item.keys : [item.keys];

  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-normal text-sm flex items-center gap-1">
        {item.description}
        {item.hasScope && (
          <span className="text-low text-xs">{t('shortcuts.inWorkspace')}</span>
        )}
        {item.useHintKey && (
          <Tooltip content={t('shortcuts.configurableHint')} side="top">
            <GearIcon className="size-icon-xs text-low cursor-help" />
          </Tooltip>
        )}
      </span>
      <div className="flex items-center gap-1">
        {keysArray.map((key, i) => (
          <kbd
            key={i}
            className={cn(
              'inline-flex items-center justify-center',
              'min-w-[24px] h-6 px-1.5',
              'rounded-sm border border-border bg-secondary',
              'font-ibm-plex-mono text-xs text-high'
            )}
          >
            {key}
          </kbd>
        ))}
      </div>
    </div>
  );
}

function ShortcutSection({ group }: { group: ShortcutGroup }) {
  return (
    <div className="mb-6">
      <h3 className="text-sm font-medium text-high mb-2 border-b border-border pb-1">
        {group.name}
      </h3>
      <div className="space-y-1">
        {group.shortcuts.map((shortcut, i) => (
          <ShortcutRow key={i} item={shortcut} />
        ))}
      </div>
    </div>
  );
}

const KeyboardShortcutsDialogImpl = create<NoProps>(() => {
  const { t } = useTranslation('common');
  const modal = useModal();
  const groups = useShortcutGroups();

  const handleClose = useCallback(() => {
    modal.hide();
    modal.resolve();
    modal.remove();
  }, [modal]);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleClose]);

  return createPortal(
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-[9998] bg-black/50 animate-in fade-in-0 duration-200"
        onClick={handleClose}
      />
      {/* Dialog wrapper - handles positioning */}
      <div className="fixed z-[9999] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        {/* Dialog content - handles animation */}
        <div
          className={cn(
            'w-[700px] max-h-[80vh]',
            'bg-panel/95 backdrop-blur-sm rounded-sm border border-border/50 shadow-lg',
            'animate-in fade-in-0 slide-in-from-bottom-4 duration-200',
            'flex flex-col overflow-hidden'
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h2 className="text-lg font-semibold text-high">
              {t('shortcuts.title')}
            </h2>
            <button
              onClick={handleClose}
              className="p-1 rounded-sm hover:bg-secondary text-low hover:text-normal"
            >
              <XIcon className="size-icon-sm" weight="bold" />
            </button>
          </div>
          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
              {groups.map((group, i) => (
                <ShortcutSection key={i} group={group} />
              ))}
            </div>
            {/* Footer hint */}
            <div className="mt-4 pt-4 border-t border-border text-center">
              <p className="text-xs text-low">
                {t('shortcuts.sequentialHint')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
});

export const KeyboardShortcutsDialog = defineModal<void, void>(
  KeyboardShortcutsDialogImpl
);
