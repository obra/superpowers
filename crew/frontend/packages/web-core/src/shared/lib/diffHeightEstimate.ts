import type { Diff } from 'shared/types';

// Constants for height calculation
const HEADER_HEIGHT = 48; // px - collapsed state
const LINE_HEIGHT = 20; // px - approximate line height in diff view
const PADDING = 16; // px - top/bottom padding
const SPACING = 8; // px - space between items (pb-base = 0.5rem)

/**
 * Estimate the height of a diff item based on its content.
 * Used by virtuoso for better scroll position estimation.
 */
export function estimateDiffHeight(diff: Diff, isExpanded: boolean): number {
  if (!isExpanded) {
    return HEADER_HEIGHT + SPACING;
  }

  // For expanded diffs, estimate based on line count
  const lineCount = (diff.additions ?? 0) + (diff.deletions ?? 0);
  // Add some buffer for hunk headers, context lines, etc.
  const estimatedLines = Math.max(lineCount * 1.2, 10);

  return HEADER_HEIGHT + estimatedLines * LINE_HEIGHT + PADDING + SPACING;
}

/**
 * Calculate a reasonable default height for the virtuoso list.
 * Uses median of estimated heights for better accuracy.
 */
export function calculateDefaultHeight(diffs: Diff[]): number {
  if (diffs.length === 0) return 200;

  // Assume most diffs start expanded for modified files
  const heights = diffs.map((diff) => estimateDiffHeight(diff, true));
  heights.sort((a, b) => a - b);

  // Return median
  const mid = Math.floor(heights.length / 2);
  return heights.length % 2 === 0
    ? (heights[mid - 1] + heights[mid]) / 2
    : heights[mid];
}
