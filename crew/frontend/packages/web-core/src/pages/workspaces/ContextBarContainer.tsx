import { useMemo, useCallback, type RefObject } from 'react';
import { CopyIcon } from '@phosphor-icons/react';
import {
  ContextBar,
  type ContextBarRenderItem,
} from '@vibe/ui/components/ContextBar';
import { Tooltip } from '@vibe/ui/components/Tooltip';
import { useActions } from '@/shared/hooks/useActions';
import { useUserSystem } from '@/shared/hooks/useUserSystem';
import { IdeIcon } from '@/shared/components/IdeIcon';
import { useContextBarPosition } from '@/shared/hooks/useContextBarPosition';
import { ContextBarActionGroups } from '@/shared/actions';
import {
  type ActionDefinition,
  type ActionVisibilityContext,
  type ContextBarItem,
  type SpecialIconType,
  ActionTargetType,
  isSpecialIcon,
  isActionVisible,
  isActionEnabled,
  getActionIcon,
  getActionTooltip,
} from '@/shared/types/actions';
import type { EditorType } from 'shared/types';
import { useActionVisibilityContext } from '@/shared/hooks/useActionVisibilityContext';
import { CopyButton } from '@/shared/components/CopyButton';

/**
 * Check if a ContextBarItem is a divider
 */
function isDivider(item: ContextBarItem): item is { readonly type: 'divider' } {
  return 'type' in item && item.type === 'divider';
}

/**
 * Filter context bar items by visibility, keeping dividers but removing them
 * if they would appear at the start, end, or consecutively.
 */
function filterContextBarItems(
  items: readonly ContextBarItem[],
  ctx: ActionVisibilityContext
): ContextBarItem[] {
  // Filter actions by visibility, keep dividers
  const filtered = items.filter((item) => {
    if (isDivider(item)) return true;
    return isActionVisible(item, ctx);
  });

  // Remove leading/trailing dividers and consecutive dividers
  const result: ContextBarItem[] = [];
  for (const item of filtered) {
    if (isDivider(item)) {
      // Only add divider if we have items before it and last item wasn't a divider
      if (result.length > 0 && !isDivider(result[result.length - 1])) {
        result.push(item);
      }
    } else {
      result.push(item);
    }
  }

  // Remove trailing divider
  if (result.length > 0 && isDivider(result[result.length - 1])) {
    result.pop();
  }

  return result;
}

/**
 * Get the icon class name based on action state and type.
 */
function getIconClassName(
  action: ActionDefinition,
  actionContext: ActionVisibilityContext,
  isDisabled: boolean
): string | undefined {
  // Handle dev server running state (for ToggleDevServer action)
  if (action.id === 'toggle-dev-server') {
    const { devServerState } = actionContext;
    if (devServerState === 'starting' || devServerState === 'stopping') {
      return 'animate-spin';
    }
    if (devServerState === 'running') {
      return 'text-error hover:text-error group-hover:text-error';
    }
  }

  if (isDisabled) {
    return 'opacity-40';
  }

  return undefined;
}

function buildSpecialItem(
  iconType: SpecialIconType,
  key: string,
  tooltip: string,
  shortcut: string | undefined,
  enabled: boolean,
  editorType: EditorType | null,
  onExecuteAction: () => void
): ContextBarRenderItem {
  if (iconType === 'ide-icon') {
    return {
      type: 'action',
      key,
      label: tooltip,
      customContent: (
        <Tooltip content={tooltip} shortcut={shortcut} side="left">
          <button
            type="button"
            className="flex items-center justify-center transition-colors drop-shadow-[2px_2px_4px_rgba(121,121,121,0.25)]"
            aria-label={tooltip}
            onClick={onExecuteAction}
            disabled={!enabled}
          >
            <IdeIcon
              editorType={editorType}
              className="size-icon-xs opacity-50 group-hover:opacity-80 transition-opacity"
            />
          </button>
        </Tooltip>
      ),
    };
  }

  return {
    type: 'action',
    key,
    label: tooltip,
    customContent: (
      <CopyButton
        onCopy={onExecuteAction}
        disabled={!enabled}
        iconSize="size-icon-base"
        icon={CopyIcon}
      />
    ),
  };
}

export interface ContextBarContainerProps {
  containerRef: RefObject<HTMLElement | null>;
}

export function ContextBarContainer({
  containerRef,
}: ContextBarContainerProps) {
  const { executorContext } = useActions();
  const { config } = useUserSystem();
  const editorType =
    (config?.editor?.editor_type as EditorType | undefined) ?? null;

  // Get visibility context (now includes dev server state)
  const actionCtx = useActionVisibilityContext();

  // Action handler - use executor context directly from provider
  const handleExecuteAction = useCallback(
    async (action: ActionDefinition) => {
      if (action.requiresTarget === ActionTargetType.NONE) {
        await action.execute(executorContext);
      }
    },
    [executorContext]
  );

  const { style, isDragging, dragHandlers } =
    useContextBarPosition(containerRef);

  const toRenderItems = useCallback(
    (items: ContextBarItem[], prefix: string): ContextBarRenderItem[] => {
      return items.flatMap((item, index) => {
        if (isDivider(item)) {
          return [{ type: 'divider', key: `${prefix}-divider-${index}` }];
        }

        const action = item;
        const enabled = isActionEnabled(action, actionCtx);
        const tooltip = getActionTooltip(action, actionCtx);
        const shortcut = action.shortcut;
        const iconClassName = getIconClassName(action, actionCtx, !enabled);
        const key = `${prefix}-${action.id}-${index}`;
        const execute = () => {
          void handleExecuteAction(action);
        };

        const iconType = action.icon;
        if (isSpecialIcon(iconType)) {
          return [
            buildSpecialItem(
              iconType,
              key,
              tooltip,
              shortcut,
              enabled,
              editorType,
              execute
            ),
          ];
        }

        const icon = getActionIcon(action, actionCtx);
        if (isSpecialIcon(icon)) {
          return [];
        }

        return [
          {
            type: 'action',
            key,
            label: tooltip,
            tooltip,
            shortcut,
            icon,
            iconClassName,
            disabled: !enabled,
            onClick: execute,
          },
        ];
      });
    },
    [actionCtx, editorType, handleExecuteAction]
  );

  // Filter visible actions and map to render items
  const primaryItems = useMemo(() => {
    const filtered = filterContextBarItems(
      ContextBarActionGroups.primary,
      actionCtx
    );
    return toRenderItems(filtered, 'primary');
  }, [actionCtx, toRenderItems]);

  const secondaryItems = useMemo(() => {
    const filtered = filterContextBarItems(
      ContextBarActionGroups.secondary,
      actionCtx
    );
    return toRenderItems(filtered, 'secondary');
  }, [actionCtx, toRenderItems]);

  return (
    <ContextBar
      style={style}
      isDragging={isDragging}
      onDragHandleMouseDown={dragHandlers.onMouseDown}
      primaryItems={primaryItems}
      secondaryItems={secondaryItems}
    />
  );
}
