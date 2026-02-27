/**
 * Parse unified diff to extract addition/deletion counts.
 * Does not depend on any diff library.
 */
export function parseDiffStats(unifiedDiff: string): {
  additions: number;
  deletions: number;
} {
  let additions = 0;
  let deletions = 0;
  const lines = unifiedDiff.split('\n');
  for (const line of lines) {
    if (line.startsWith('+') && !line.startsWith('+++')) additions++;
    else if (line.startsWith('-') && !line.startsWith('---')) deletions++;
  }
  return { additions, deletions };
}
