// src/format.ts — fixes a typo in a docstring. No behavioral change.

/**
 * Format a name as "Last, First" for display in the directory listing.
 * Trims surrounding whitespace; leaves internal whitespace alone.
 */
export function formatName(first: string, last: string): string {
    return `${last.trim()}, ${first.trim()}`;
}
