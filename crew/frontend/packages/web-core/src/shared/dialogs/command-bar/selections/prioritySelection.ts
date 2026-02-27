import type { IssuePriority } from 'shared/remote-types';
import type { PriorityItem } from '@/shared/types/selectionItems';
import type { SelectionPage } from '../SelectionDialog';

export interface PrioritySelectionResult {
  priority: IssuePriority | null;
}

const PRIORITY_ITEMS: PriorityItem[] = [
  { id: null, name: 'No priority' },
  { id: 'urgent', name: 'Urgent' },
  { id: 'high', name: 'High' },
  { id: 'medium', name: 'Medium' },
  { id: 'low', name: 'Low' },
];

export function buildPrioritySelectionPages(): Record<
  string,
  SelectionPage<PrioritySelectionResult>
> {
  return {
    selectPriority: {
      id: 'selectPriority',
      title: 'Select Priority',
      buildGroups: () => [
        {
          label: 'Priority',
          items: PRIORITY_ITEMS.map((p) => ({
            type: 'priority' as const,
            priority: p,
          })),
        },
      ],
      onSelect: (item) => {
        if (item.type === 'priority') {
          return {
            type: 'complete',
            data: { priority: item.priority.id },
          };
        }
        return { type: 'complete', data: undefined as never };
      },
    },
  };
}
