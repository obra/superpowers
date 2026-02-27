import { useMemo } from 'react';
import {
  StackIcon,
  SlidersIcon,
  SquaresFourIcon,
  GitBranchIcon,
  KanbanIcon,
} from '@phosphor-icons/react';
import type { Workspace } from 'shared/types';
import { Pages } from '@/shared/command-bar/actions/pages';
import type {
  PageId,
  StaticPageId,
  CommandBarGroupItem,
  ResolvedGroup,
  ResolvedGroupItem,
} from '@/shared/types/commandBar';
import {
  isActionVisible,
  type ActionVisibilityContext,
} from '@/shared/types/actions';
import { isPageVisible } from '@/shared/command-bar/actions/useActionVisibility';
import { injectSearchMatches } from './injectSearchMatches';

export interface ResolvedCommandBarPage {
  id: string;
  title?: string;
  groups: ResolvedGroup[];
}

const PAGE_ICONS = {
  root: SquaresFourIcon,
  workspaceActions: StackIcon,
  diffOptions: SlidersIcon,
  viewOptions: SquaresFourIcon,
  repoActions: GitBranchIcon,
  issueActions: KanbanIcon,
} as const satisfies Record<StaticPageId, typeof StackIcon>;

function expandGroupItems(
  items: CommandBarGroupItem[],
  ctx: ActionVisibilityContext
): ResolvedGroupItem[] {
  return items.flatMap((item) => {
    if (item.type === 'childPages') {
      const page = Pages[item.id as StaticPageId];
      if (!isPageVisible(page, ctx)) return [];
      return [
        {
          type: 'page' as const,
          pageId: item.id,
          label: page.title ?? item.id,
          icon: PAGE_ICONS[item.id as StaticPageId],
        },
      ];
    }
    if (item.type === 'action') {
      if (!isActionVisible(item.action, ctx)) return [];
    }
    return [item];
  });
}

function buildPageGroups(
  pageId: StaticPageId,
  ctx: ActionVisibilityContext
): ResolvedGroup[] {
  return Pages[pageId].items
    .map((group) => {
      const items = expandGroupItems(group.items, ctx);
      return items.length ? { label: group.label, items } : null;
    })
    .filter((g): g is ResolvedGroup => g !== null);
}

export function useResolvedPage(
  pageId: PageId,
  search: string,
  ctx: ActionVisibilityContext,
  workspace: Workspace | undefined
): ResolvedCommandBarPage {
  return useMemo(() => {
    const groups = buildPageGroups(pageId, ctx);
    if (pageId === 'root' && search.trim()) {
      groups.push(...injectSearchMatches(search, ctx, workspace));
    }

    return {
      id: Pages[pageId].id,
      title: Pages[pageId].title,
      groups,
    };
  }, [pageId, search, ctx, workspace]);
}
