import { useTranslation } from 'react-i18next';
import { FunnelIcon } from '@phosphor-icons/react';
import {
  MultiSelectDropdown,
  type MultiSelectDropdownOption,
} from './MultiSelectDropdown';
import { PriorityIcon } from './PriorityIcon';

export type PriorityFilterValue = 'urgent' | 'high' | 'medium' | 'low';

const PRIORITIES: PriorityFilterValue[] = ['urgent', 'high', 'medium', 'low'];

const priorityLabels: Record<PriorityFilterValue, string> = {
  urgent: 'Urgent',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
};

export interface PriorityFilterDropdownProps {
  values: PriorityFilterValue[];
  onChange: (values: PriorityFilterValue[]) => void;
}

export function PriorityFilterDropdown({
  values,
  onChange,
}: PriorityFilterDropdownProps) {
  const { t } = useTranslation('common');

  const options: MultiSelectDropdownOption<PriorityFilterValue>[] =
    PRIORITIES.map((p) => ({
      value: p,
      label: priorityLabels[p],
      renderOption: () => (
        <div className="flex items-center gap-base">
          <PriorityIcon priority={p} />
          {priorityLabels[p]}
        </div>
      ),
    }));

  return (
    <MultiSelectDropdown
      values={values}
      options={options}
      onChange={onChange}
      icon={FunnelIcon}
      label={t('kanban.priority', 'Priority')}
      menuLabel={t('kanban.filterByPriority', 'Filter by priority')}
    />
  );
}
