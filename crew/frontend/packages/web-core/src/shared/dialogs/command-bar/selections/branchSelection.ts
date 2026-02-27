import i18n from '@/i18n';
import type { BranchItem } from '@/shared/types/selectionItems';
import type { SelectionPage } from '../SelectionDialog';

export interface BranchSelectionResult {
  branch: string;
}

export function buildBranchSelectionPages(
  branches: BranchItem[],
  repoDisplayName?: string
): Record<string, SelectionPage<BranchSelectionResult>> {
  return {
    selectBranch: {
      id: 'selectBranch',
      title: repoDisplayName
        ? i18n.t('commandBar.selectBranchFor', { repoName: repoDisplayName })
        : i18n.t('commandBar.selectBranch'),
      buildGroups: () => [
        {
          label: 'Branches',
          items: branches.map((b) => ({
            type: 'branch' as const,
            branch: b,
          })),
        },
      ],
      onSelect: (item) => {
        if (item.type === 'branch') {
          return { type: 'complete', data: { branch: item.branch.name } };
        }
        return { type: 'complete', data: undefined as never };
      },
    },
  };
}
