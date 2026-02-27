import type { Issue } from 'shared/remote-types';
import type { SelectionPage } from '../SelectionDialog';

export interface RelationshipSelectionResult {
  issueId: string;
}

export function buildRelationshipSelectionPages(
  issues: Issue[]
): Record<string, SelectionPage<RelationshipSelectionResult>> {
  return {
    selectRelationshipIssue: {
      id: 'selectRelationshipIssue',
      title: 'Select Issue',
      buildGroups: () => [
        {
          label: 'Issues',
          items: issues.map((issue) => ({ type: 'issue' as const, issue })),
        },
      ],
      onSelect: (item) => {
        if (item.type === 'issue') {
          return {
            type: 'complete',
            data: { issueId: item.issue.id },
          };
        }
        return { type: 'complete', data: undefined as never };
      },
    },
  };
}
