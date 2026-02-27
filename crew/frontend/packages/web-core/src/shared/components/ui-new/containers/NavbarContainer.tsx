import { useMemo, useCallback } from 'react';
import { useLocation } from '@tanstack/react-router';
import { useWorkspaceContext } from '@/shared/hooks/useWorkspaceContext';
import { useUserContext } from '@/shared/hooks/useUserContext';
import { useActions } from '@/shared/hooks/useActions';
import { useSyncErrorContext } from '@/shared/hooks/useSyncErrorContext';
import { useUserOrganizations } from '@/shared/hooks/useUserOrganizations';
import { useOrganizationStore } from '@/shared/stores/useOrganizationStore';
import { Navbar, type NavbarSectionItem } from '@vibe/ui/components/Navbar';
import { RemoteIssueLink } from './RemoteIssueLink';
import { NavbarActionGroups } from '@/shared/actions';
import {
  NavbarDivider,
  type ActionDefinition,
  type NavbarItem as ActionNavbarItem,
  type ActionVisibilityContext,
  isSpecialIcon,
  getActionIcon,
  getActionTooltip,
  isActionActive,
  isActionEnabled,
  isActionVisible,
} from '@/shared/types/actions';
import { useActionVisibilityContext } from '@/shared/hooks/useActionVisibilityContext';

/**
 * Check if a NavbarItem is a divider
 */
function isDivider(item: ActionNavbarItem): item is typeof NavbarDivider {
  return 'type' in item && item.type === 'divider';
}

/**
 * Filter navbar items by visibility, keeping dividers but removing them
 * if they would appear at the start, end, or consecutively.
 */
function filterNavbarItems(
  items: readonly ActionNavbarItem[],
  ctx: ActionVisibilityContext
): ActionNavbarItem[] {
  // Filter actions by visibility, keep dividers
  const filtered = items.filter((item) => {
    if (isDivider(item)) return true;
    if (!isActionVisible(item, ctx)) return false;
    return !isSpecialIcon(getActionIcon(item, ctx));
  });

  // Remove leading/trailing dividers and consecutive dividers
  const result: ActionNavbarItem[] = [];
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

function toNavbarSectionItems(
  items: readonly ActionNavbarItem[],
  ctx: ActionVisibilityContext,
  onExecuteAction: (action: ActionDefinition) => void
): NavbarSectionItem[] {
  return items.reduce<NavbarSectionItem[]>((result, item) => {
    if (isDivider(item)) {
      result.push({ type: 'divider' });
      return result;
    }

    const icon = getActionIcon(item, ctx);
    if (isSpecialIcon(icon)) {
      return result;
    }

    result.push({
      type: 'action',
      id: item.id,
      icon,
      isActive: isActionActive(item, ctx),
      tooltip: getActionTooltip(item, ctx),
      shortcut: item.shortcut,
      disabled: !isActionEnabled(item, ctx),
      onClick: () => onExecuteAction(item),
    });
    return result;
  }, []);
}

export function NavbarContainer() {
  const { executeAction } = useActions();
  const { workspace: selectedWorkspace, isCreateMode } = useWorkspaceContext();
  const { workspaces } = useUserContext();
  const syncErrorContext = useSyncErrorContext();
  const location = useLocation();
  const isOnProjectPage = location.pathname.startsWith('/projects/');

  // Find remote workspace linked to current local workspace
  const linkedRemoteWorkspace = useMemo(() => {
    if (!selectedWorkspace?.id) return null;
    return (
      workspaces.find((w) => w.local_workspace_id === selectedWorkspace.id) ??
      null
    );
  }, [workspaces, selectedWorkspace?.id]);

  const { data: orgsData } = useUserOrganizations();
  const selectedOrgId = useOrganizationStore((s) => s.selectedOrgId);
  const orgName =
    orgsData?.organizations.find((o) => o.id === selectedOrgId)?.name ?? '';

  // Get action visibility context (includes all state for visibility/active/enabled)
  const actionCtx = useActionVisibilityContext();

  // Action handler - all actions go through the standard executeAction
  const handleExecuteAction = useCallback(
    (action: ActionDefinition) => {
      if (action.requiresTarget && selectedWorkspace?.id) {
        executeAction(action, selectedWorkspace.id);
      } else {
        executeAction(action);
      }
    },
    [executeAction, selectedWorkspace?.id]
  );

  const isMigratePage = actionCtx.layoutMode === 'migrate';

  // Filter visible actions for each section (empty on migrate page)
  const leftItems = useMemo(
    () =>
      isMigratePage
        ? []
        : toNavbarSectionItems(
            filterNavbarItems(NavbarActionGroups.left, actionCtx),
            actionCtx,
            handleExecuteAction
          ),
    [actionCtx, handleExecuteAction, isMigratePage]
  );

  const rightItems = useMemo(
    () =>
      isMigratePage
        ? []
        : toNavbarSectionItems(
            filterNavbarItems(NavbarActionGroups.right, actionCtx),
            actionCtx,
            handleExecuteAction
          ),
    [actionCtx, handleExecuteAction, isMigratePage]
  );

  const navbarTitle = isCreateMode
    ? 'Create Workspace'
    : isMigratePage
      ? 'Migrate'
      : isOnProjectPage
        ? orgName
        : selectedWorkspace?.branch;

  return (
    <Navbar
      workspaceTitle={navbarTitle}
      leftItems={leftItems}
      rightItems={rightItems}
      syncErrors={syncErrorContext?.errors}
      leftSlot={
        linkedRemoteWorkspace?.issue_id ? (
          <RemoteIssueLink
            projectId={linkedRemoteWorkspace.project_id}
            issueId={linkedRemoteWorkspace.issue_id}
          />
        ) : null
      }
    />
  );
}
