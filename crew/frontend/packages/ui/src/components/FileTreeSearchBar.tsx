import { ArrowsInSimpleIcon, ArrowsOutSimpleIcon } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import { InputField } from './InputField';

interface FileTreeSearchBarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  isAllExpanded: boolean;
  onToggleExpandAll: () => void;
  className?: string;
}

export function FileTreeSearchBar({
  searchQuery,
  onSearchChange,
  isAllExpanded,
  onToggleExpandAll,
  className,
}: FileTreeSearchBarProps) {
  const { t } = useTranslation(['tasks', 'common']);
  const ExpandIcon = isAllExpanded ? ArrowsInSimpleIcon : ArrowsOutSimpleIcon;

  return (
    <InputField
      value={searchQuery}
      onChange={onSearchChange}
      placeholder={t('common:fileTree.searchPlaceholder')}
      variant="search"
      actionIcon={ExpandIcon}
      onAction={onToggleExpandAll}
      className={className}
    />
  );
}
