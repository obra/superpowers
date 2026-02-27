import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ListChecksIcon } from '@phosphor-icons/react';
import { Circle, Check, CircleDot } from 'lucide-react';
import { cn } from '../lib/cn';
import { Popover, PopoverTrigger, PopoverContent } from './Popover';
import { Tooltip } from './Tooltip';

export interface TodoProgressItem {
  content: string;
  status?: string | null;
}

interface TodoProgressPopupProps {
  todos: TodoProgressItem[];
  className?: string;
}

function getStatusIcon(status?: string | null) {
  const s = (status || '').toLowerCase();
  if (s === 'completed')
    return <Check aria-hidden className="size-icon-sm text-success" />;
  if (s === 'in_progress' || s === 'in-progress')
    return <CircleDot aria-hidden className="size-icon-sm text-blue-500" />;
  if (s === 'cancelled')
    return <Circle aria-hidden className="size-icon-sm text-gray-400" />;
  return <Circle aria-hidden className="size-icon-sm text-muted-foreground" />;
}

export function TodoProgressPopup({
  todos,
  className,
}: TodoProgressPopupProps) {
  const { t } = useTranslation('tasks');

  const isEmpty = todos.length === 0;

  const { completed, total, percentage } = useMemo(() => {
    const total = todos.length;
    const completed = todos.filter(
      (todo) => todo.status?.toLowerCase() === 'completed'
    ).length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { completed, total, percentage };
  }, [todos]);

  const tooltipText = isEmpty
    ? t('todoPopup.noTasks')
    : t('todoPopup.progress', { completed, total });

  // When empty, render just a disabled icon without popover
  if (isEmpty) {
    return (
      <Tooltip content={tooltipText} side="bottom">
        <span className="inline-flex">
          <button
            disabled
            className={cn(
              'flex items-center justify-center text-lowest opacity-40 cursor-not-allowed',
              className
            )}
            aria-label={t('todoPopup.title')}
          >
            <ListChecksIcon className="size-icon-base" />
          </button>
        </span>
      </Tooltip>
    );
  }

  return (
    <Popover>
      <Tooltip content={tooltipText} side="bottom">
        <span className="inline-flex">
          <PopoverTrigger asChild>
            <button
              className={cn(
                'flex items-center justify-center text-low hover:text-normal transition-colors',
                'focus:outline-none focus-visible:ring-1 focus-visible:ring-brand',
                className
              )}
              aria-label={t('todoPopup.title')}
            >
              <div className="relative">
                <ListChecksIcon className="size-icon-base" />
                {/* Progress indicator dot - only shown when there are todos */}
                {percentage < 100 && (
                  <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-blue-500" />
                )}
                {percentage === 100 && (
                  <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-success" />
                )}
              </div>
            </button>
          </PopoverTrigger>
        </span>
      </Tooltip>
      <PopoverContent
        align="end"
        className="w-80 max-h-[min(75vh,var(--radix-popover-content-available-height))] flex flex-col"
      >
        <div className="flex flex-col gap-base min-h-0">
          {/* Header with progress */}
          <div className="flex items-center justify-between shrink-0">
            <h4 className="text-sm font-medium text-normal">
              {t('todoPopup.title')}
            </h4>
            <span className="text-xs text-low">
              {t('todoPopup.progress', { completed, total })}
            </span>
          </div>

          {/* Progress bar */}
          <div className="h-1.5 w-full bg-border rounded-full overflow-hidden shrink-0">
            <div
              className={cn(
                'h-full transition-all duration-300 rounded-full',
                percentage === 100 ? 'bg-success' : 'bg-blue-500'
              )}
              style={{ width: `${percentage}%` }}
            />
          </div>

          {/* Todo list */}
          <ul className="space-y-1 overflow-y-auto min-h-0">
            {todos.map((todo, index) => (
              <li
                key={`${todo.content}-${index}`}
                className="flex items-start gap-2 py-half"
              >
                <span className="mt-0.5 size-icon-sm flex items-center justify-center shrink-0">
                  {getStatusIcon(todo.status)}
                </span>
                <span className="text-sm leading-5 break-words text-normal">
                  {todo.status?.toLowerCase() === 'cancelled' ? (
                    <s className="text-gray-400">{todo.content}</s>
                  ) : (
                    todo.content
                  )}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </PopoverContent>
    </Popover>
  );
}
