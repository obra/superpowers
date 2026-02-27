import type { ConflictOp } from 'shared/types';

export function displayConflictOpLabel(op?: ConflictOp | null): string {
  switch (op) {
    case 'merge':
      return 'Merge';
    case 'cherry_pick':
      return 'Cherry-pick';
    case 'revert':
      return 'Revert';
    case 'rebase':
    default:
      return 'Rebase';
  }
}

function formatConflictHeader(
  op: ConflictOp | null | undefined,
  sourceBranch: string,
  baseBranch?: string,
  repoName?: string
): string {
  const repoContext = repoName ? ` in repository '${repoName}'` : '';
  switch (op) {
    case 'merge':
      return `Merge conflicts while merging into '${sourceBranch}'${repoContext}.`;
    case 'cherry_pick':
      return `Cherry-pick conflicts on '${sourceBranch}'${repoContext}.`;
    case 'revert':
      return `Revert conflicts on '${sourceBranch}'${repoContext}.`;
    case 'rebase':
    default:
      return `Rebase conflicts while rebasing '${sourceBranch}' onto '${baseBranch ?? 'base branch'}'${repoContext}.`;
  }
}

export function buildResolveConflictsInstructions(
  sourceBranch: string | null,
  baseBranch: string | undefined,
  conflictedFiles: string[],
  op?: ConflictOp | null,
  repoName?: string
): string {
  const source = sourceBranch || 'current attempt branch';
  const base = baseBranch ?? 'base branch';
  const filesList = conflictedFiles.slice(0, 12);
  const filesBlock = filesList.length
    ? `\n\nFiles with conflicts:\n${filesList.map((f) => `- ${f}`).join('\n')}`
    : '';

  const opTitle = displayConflictOpLabel(op);
  const header = formatConflictHeader(op, source, base, repoName);

  return (
    `${header}` +
    filesBlock +
    `\n\nPlease resolve each file carefully. When continuing, ensure the ${opTitle.toLowerCase()} does not hang (set \`GIT_EDITOR=true\` or use a non-interactive editor).`
  );
}
