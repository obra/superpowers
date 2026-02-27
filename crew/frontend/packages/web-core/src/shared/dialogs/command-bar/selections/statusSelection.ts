import type { StatusItem } from '@/shared/types/selectionItems';
import type { SelectionPage } from '../SelectionDialog';

export interface StatusSelectionResult {
  statusId: string;
}

export function buildStatusSelectionPages(
  statuses: StatusItem[]
): Record<string, SelectionPage<StatusSelectionResult>> {
  return {
    selectStatus: {
      id: 'selectStatus',
      title: 'Select Status',
      buildGroups: () => [
        {
          label: 'Statuses',
          items: statuses.map((s) => ({ type: 'status' as const, status: s })),
        },
      ],
      onSelect: (item) => {
        if (item.type === 'status') {
          return {
            type: 'complete',
            data: { statusId: item.status.id },
          };
        }
        return { type: 'complete', data: undefined as never };
      },
    },
  };
}
