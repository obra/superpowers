import type { Issue } from 'shared/remote-types';
import type { SelectionPage } from '../SelectionDialog';

export type SubIssueSelectionResult =
  | { type: 'selected'; issueId: string }
  | { type: 'createNew' };

export function buildSubIssueSelectionPages(
  issues: Issue[],
  mode: 'addChild' | 'setParent'
): Record<string, SelectionPage<SubIssueSelectionResult>> {
  const title = mode === 'setParent' ? 'Make Sub-issue of' : 'Add Sub-issue';
  return {
    selectSubIssue: {
      id: 'selectSubIssue',
      title,
      buildGroups: () => [
        {
          label: 'Issues',
          items: [
            ...(mode === 'addChild'
              ? [{ type: 'createSubIssue' as const }]
              : []),
            ...issues.map((issue) => ({ type: 'issue' as const, issue })),
          ],
        },
      ],
      onSelect: (item) => {
        if (item.type === 'issue') {
          return {
            type: 'complete',
            data: { type: 'selected', issueId: item.issue.id },
          };
        }
        if (item.type === 'createSubIssue') {
          return {
            type: 'complete',
            data: { type: 'createNew' },
          };
        }
        return { type: 'complete', data: undefined as never };
      },
    },
  };
}
