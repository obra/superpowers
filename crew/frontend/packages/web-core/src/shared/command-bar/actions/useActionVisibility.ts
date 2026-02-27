import type { ActionVisibilityContext } from '@/shared/types/actions';
import type { CommandBarPage } from '@/shared/types/commandBar';

/**
 * Helper to check if a page is visible given the current context.
 * If the page has no isVisible condition, it's always visible.
 */
export function isPageVisible(
  page: CommandBarPage,
  ctx: ActionVisibilityContext
): boolean {
  return page.isVisible ? page.isVisible(ctx) : true;
}
