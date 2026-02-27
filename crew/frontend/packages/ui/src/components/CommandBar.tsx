import {
  ArrowDownIcon,
  ArrowFatLineUpIcon,
  ArrowUpIcon,
  CaretLeftIcon,
  CopyIcon,
  FolderIcon,
  GitBranchIcon,
  MinusIcon,
  PlusIcon,
} from '@phosphor-icons/react';
import type { Icon } from '@phosphor-icons/react';
import type { ReactNode } from 'react';
import { useDeferredValue, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from './Command';

type PriorityId = 'urgent' | 'high' | 'medium' | 'low';

export interface CommandBarAction {
  id: string;
  icon: Icon | string;
  shortcut?: string;
  variant?: 'default' | 'destructive' | string;
  keywords?: string[];
}

export interface CommandBarGroup<
  TAction extends CommandBarAction,
  TPageId extends string = string,
> {
  label: string;
  items: CommandBarGroupItem<TAction, TPageId>[];
}

export interface CommandBarPage<
  TAction extends CommandBarAction,
  TPageId extends string = string,
> {
  id: string;
  title?: string;
  groups: CommandBarGroup<TAction, TPageId>[];
}

export interface CommandBarStatusItem {
  id: string;
  name: string;
  color: string;
}

interface PageItem<TPageId extends string = string> {
  type: 'page';
  pageId: TPageId;
  label: string;
  icon: Icon;
}

interface RepoItem {
  type: 'repo';
  repo: {
    id: string;
    display_name: string;
  };
}

interface BranchItem {
  type: 'branch';
  branch: {
    name: string;
    isCurrent: boolean;
  };
}

interface StatusItem {
  type: 'status';
  status: CommandBarStatusItem;
}

interface PriorityItem {
  type: 'priority';
  priority: {
    id: string | null;
    name: string;
  };
}

interface CreateSubIssueItem {
  type: 'createSubIssue';
}

interface IssueItem {
  type: 'issue';
  issue: {
    id: string;
    simple_id: string;
    title: string;
    status_id: string;
    priority?: string | null;
  };
}

interface ActionItem<TAction extends CommandBarAction> {
  type: 'action';
  action: TAction;
}

export type CommandBarGroupItem<
  TAction extends CommandBarAction,
  TPageId extends string = string,
> =
  | PageItem<TPageId>
  | RepoItem
  | BranchItem
  | StatusItem
  | PriorityItem
  | CreateSubIssueItem
  | IssueItem
  | ActionItem<TAction>;

interface CommandBarProps<
  TAction extends CommandBarAction,
  TPageId extends string = string,
> {
  page: CommandBarPage<TAction, TPageId>;
  canGoBack: boolean;
  onGoBack: () => void;
  onSelect: (item: CommandBarGroupItem<TAction, TPageId>) => void;
  getLabel: (action: TAction) => string;
  search: string;
  onSearchChange: (search: string) => void;
  statuses?: CommandBarStatusItem[];
  renderSpecialActionIcon?: (iconName: string) => ReactNode;
}

const BRANCH_SEARCH_RESULT_LIMIT = 300;

const PRIORITY_CONFIG: Record<PriorityId, { icon: Icon; colorClass: string }> =
  {
    urgent: { icon: ArrowFatLineUpIcon, colorClass: 'text-error' },
    high: { icon: ArrowUpIcon, colorClass: 'text-brand' },
    medium: { icon: MinusIcon, colorClass: 'text-low' },
    low: { icon: ArrowDownIcon, colorClass: 'text-success' },
  };

function getPriorityConfig(priorityId: string | null | undefined) {
  if (!priorityId) return null;
  if (priorityId in PRIORITY_CONFIG) {
    return PRIORITY_CONFIG[priorityId as PriorityId];
  }
  return null;
}

function ActionItemIcon({
  icon,
  renderSpecialActionIcon,
}: {
  icon: Icon | string;
  renderSpecialActionIcon?: (iconName: string) => ReactNode;
}) {
  if (typeof icon === 'string') {
    if (icon === 'copy-icon') {
      return <CopyIcon className="h-4 w-4" weight="regular" />;
    }
    const customIcon = renderSpecialActionIcon?.(icon);
    return customIcon ? <>{customIcon}</> : null;
  }

  const IconComponent = icon;
  return <IconComponent className="h-4 w-4" weight="regular" />;
}

export function CommandBar<
  TAction extends CommandBarAction,
  TPageId extends string = string,
>({
  page,
  canGoBack,
  onGoBack,
  onSelect,
  getLabel,
  search,
  onSearchChange,
  statuses = [],
  renderSpecialActionIcon,
}: CommandBarProps<TAction, TPageId>) {
  const { t } = useTranslation('common');
  const deferredSearch = useDeferredValue(search);
  const normalizedSearch = deferredSearch.trim().toLowerCase();
  const isSearching = normalizedSearch.length > 0;

  const filteredGroups = useMemo(() => {
    if (!isSearching) {
      return page.groups;
    }

    const isBranchSelectionPage = page.id === 'selectBranch';
    const groups: CommandBarGroup<TAction, TPageId>[] = [];
    let remainingBranchResults = BRANCH_SEARCH_RESULT_LIMIT;

    for (const group of page.groups) {
      const matchedItems: CommandBarGroupItem<TAction, TPageId>[] = [];

      for (const item of group.items) {
        const label = getItemSearchLabel(item, getLabel);
        if (!label) continue;
        if (!label.toLowerCase().includes(normalizedSearch)) continue;

        if (isBranchSelectionPage && item.type === 'branch') {
          if (remainingBranchResults <= 0) {
            continue;
          }
          remainingBranchResults -= 1;
        }

        matchedItems.push(item);
      }

      if (matchedItems.length > 0) {
        groups.push({
          label: group.label,
          items: matchedItems,
        });
      }

      if (isBranchSelectionPage && remainingBranchResults <= 0) {
        break;
      }
    }

    return groups;
  }, [getLabel, isSearching, normalizedSearch, page.groups, page.id]);

  return (
    <Command
      className="rounded-sm border border-border [&_[cmdk-group-heading]]:px-base [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-low [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-group]]:px-half [&_[cmdk-input-wrapper]_svg]:h-4 [&_[cmdk-input-wrapper]_svg]:w-4 [&_[cmdk-input]]:h-12 [&_[cmdk-item]]:px-base [&_[cmdk-item]]:py-half"
      shouldFilter={false}
      loop
    >
      <div className="flex items-center border-b border-border">
        <CommandInput
          placeholder={page.title || t('commandBar.defaultPlaceholder')}
          value={search}
          onValueChange={onSearchChange}
        />
      </div>
      <CommandList>
        <CommandEmpty>{t('commandBar.noResults')}</CommandEmpty>
        {canGoBack && !search && (
          <CommandGroup>
            <CommandItem value="__back__" onSelect={onGoBack}>
              <CaretLeftIcon className="h-4 w-4" weight="bold" />
              <span>{t('commandBar.back')}</span>
            </CommandItem>
          </CommandGroup>
        )}
        {filteredGroups.map((group) => (
          <CommandGroup key={group.label} heading={group.label}>
            {group.items.map((item) => {
              if (item.type === 'page') {
                const IconComponent = item.icon;
                return (
                  <CommandItem
                    key={item.pageId}
                    value={item.pageId}
                    onSelect={() => onSelect(item)}
                  >
                    <IconComponent className="h-4 w-4" weight="regular" />
                    <span>{item.label}</span>
                  </CommandItem>
                );
              }

              if (item.type === 'repo') {
                return (
                  <CommandItem
                    key={item.repo.id}
                    value={`${item.repo.id} ${item.repo.display_name}`}
                    onSelect={() => onSelect(item)}
                  >
                    <FolderIcon className="h-4 w-4" weight="regular" />
                    <span>{item.repo.display_name}</span>
                  </CommandItem>
                );
              }

              if (item.type === 'branch') {
                return (
                  <CommandItem
                    key={item.branch.name}
                    value={item.branch.name}
                    onSelect={() => onSelect(item)}
                  >
                    <GitBranchIcon className="h-4 w-4" weight="regular" />
                    <span>{item.branch.name}</span>
                    {item.branch.isCurrent && (
                      <span className="ml-auto text-xs capitalize text-low">
                        {t('branchSelector.badges.current')}
                      </span>
                    )}
                  </CommandItem>
                );
              }

              if (item.type === 'status') {
                return (
                  <CommandItem
                    key={item.status.id}
                    value={`${item.status.id} ${item.status.name}`}
                    onSelect={() => onSelect(item)}
                  >
                    <div
                      className="h-4 w-4 rounded-full shrink-0"
                      style={{ backgroundColor: `hsl(${item.status.color})` }}
                    />
                    <span>{item.status.name}</span>
                  </CommandItem>
                );
              }

              if (item.type === 'priority') {
                const config = getPriorityConfig(item.priority.id);
                const IconComponent = config?.icon;
                return (
                  <CommandItem
                    key={item.priority.id ?? 'no-priority'}
                    value={`${item.priority.id ?? 'none'} ${item.priority.name}`}
                    onSelect={() => onSelect(item)}
                  >
                    {IconComponent && (
                      <IconComponent
                        className={`h-4 w-4 ${config?.colorClass}`}
                        weight="bold"
                      />
                    )}
                    <span>{item.priority.name}</span>
                  </CommandItem>
                );
              }

              if (item.type === 'createSubIssue') {
                return (
                  <CommandItem
                    key="create-sub-issue"
                    value="create new issue"
                    onSelect={() => onSelect(item)}
                  >
                    <PlusIcon
                      className="h-4 w-4 shrink-0 text-brand"
                      weight="bold"
                    />
                    <span>{t('kanban.createNewIssue')}</span>
                  </CommandItem>
                );
              }

              if (item.type === 'issue') {
                const config = getPriorityConfig(item.issue.priority ?? null);
                const PriorityIconComponent = config?.icon;
                const statusColor =
                  statuses.find((status) => status.id === item.issue.status_id)
                    ?.color ?? '0 0% 50%';
                return (
                  <CommandItem
                    key={item.issue.id}
                    value={`${item.issue.id} ${item.issue.simple_id} ${item.issue.title}`}
                    onSelect={() => onSelect(item)}
                  >
                    {PriorityIconComponent && (
                      <PriorityIconComponent
                        className={`h-4 w-4 shrink-0 ${config?.colorClass}`}
                        weight="bold"
                      />
                    )}
                    <span className="font-mono text-low shrink-0">
                      {item.issue.simple_id}
                    </span>
                    <div
                      className="h-2 w-2 rounded-full shrink-0"
                      style={{ backgroundColor: `hsl(${statusColor})` }}
                    />
                    <span className="truncate">{item.issue.title}</span>
                  </CommandItem>
                );
              }

              const label = getLabel(item.action);
              return (
                <CommandItem
                  key={item.action.id}
                  value={`${item.action.id} ${label}`}
                  onSelect={() => onSelect(item)}
                  className={
                    item.action.variant === 'destructive'
                      ? 'text-error'
                      : undefined
                  }
                >
                  <ActionItemIcon
                    icon={item.action.icon}
                    renderSpecialActionIcon={renderSpecialActionIcon}
                  />
                  <span>{label}</span>
                  {item.action.shortcut && (
                    <CommandShortcut>{item.action.shortcut}</CommandShortcut>
                  )}
                </CommandItem>
              );
            })}
          </CommandGroup>
        ))}
      </CommandList>
    </Command>
  );
}

function getItemSearchLabel<
  TAction extends CommandBarAction,
  TPageId extends string,
>(
  item: CommandBarGroupItem<TAction, TPageId>,
  getLabel: (action: TAction) => string
) {
  if (item.type === 'page') {
    return `${item.pageId} ${item.label}`;
  }
  if (item.type === 'repo') {
    return `${item.repo.id} ${item.repo.display_name}`;
  }
  if (item.type === 'branch') {
    return item.branch.name;
  }
  if (item.type === 'status') {
    return `${item.status.id} ${item.status.name}`;
  }
  if (item.type === 'priority') {
    return `${item.priority.id ?? 'none'} ${item.priority.name}`;
  }
  if (item.type === 'issue') {
    return `${item.issue.id} ${item.issue.simple_id} ${item.issue.title}`;
  }
  if (item.type === 'createSubIssue') {
    return 'create new issue';
  }
  const keywords = item.action.keywords?.join(' ') ?? '';
  return `${item.action.id} ${getLabel(item.action)} ${keywords}`.trim();
}
