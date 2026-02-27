'use client';

import { Card } from './Card';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './RadixTooltip';
import { cn } from '../lib/cn';
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
  type DraggableProvided,
  type DraggableStateSnapshot,
  type DroppableProvided,
} from '@hello-pangea/dnd';
import {
  type KeyboardEvent,
  type MutableRefObject,
  type ReactNode,
  type Ref,
} from 'react';
import { useTranslation } from 'react-i18next';
import { PlusIcon } from '@phosphor-icons/react';
import { Button } from './Button';

export type { DropResult } from '@hello-pangea/dnd';

export type Status = {
  id: string;
  name: string;
  color: string;
};

export type Feature = {
  id: string;
  name: string;
  startAt: Date;
  endAt: Date;
  status: Status;
};

// =============================================================================
// Kanban Board (Droppable Column)
// =============================================================================

export type KanbanBoardProps = {
  children: ReactNode;
  className?: string;
};

export const KanbanBoard = ({ children, className }: KanbanBoardProps) => {
  return (
    <div className={cn('flex flex-col min-h-40', className)}>{children}</div>
  );
};

// =============================================================================
// Kanban Card (Draggable)
// =============================================================================

export type KanbanCardProps = Pick<Feature, 'id' | 'name'> & {
  index: number;
  children?: ReactNode;
  className?: string;
  onClick?: () => void;
  tabIndex?: number;
  forwardedRef?: Ref<HTMLDivElement>;
  onKeyDown?: (e: KeyboardEvent) => void;
  isOpen?: boolean;
  dragDisabled?: boolean;
};

export const KanbanCard = ({
  id,
  name,
  index,
  children,
  className,
  onClick,
  tabIndex,
  forwardedRef,
  onKeyDown,
  isOpen,
  dragDisabled = false,
}: KanbanCardProps) => {
  return (
    <Draggable draggableId={id} index={index} isDragDisabled={dragDisabled}>
      {(provided: DraggableProvided, snapshot: DraggableStateSnapshot) => {
        // Combine DnD ref and forwarded ref
        const setRefs = (node: HTMLDivElement | null) => {
          provided.innerRef(node);
          if (typeof forwardedRef === 'function') {
            forwardedRef(node);
          } else if (forwardedRef && typeof forwardedRef === 'object') {
            (forwardedRef as MutableRefObject<HTMLDivElement | null>).current =
              node;
          }
        };

        return (
          <Card
            className={cn(
              'p-base outline-none flex-col border -mt-[1px] -mx-[1px] bg-primary',
              snapshot.isDragging && 'cursor-grabbing shadow-lg',
              isOpen && 'ring-2 ring-secondary-foreground ring-inset',
              className
            )}
            ref={setRefs}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            tabIndex={tabIndex}
            onClick={onClick}
            onKeyDown={onKeyDown}
          >
            {children ?? <p className="m-0 font-medium text-sm">{name}</p>}
          </Card>
        );
      }}
    </Draggable>
  );
};

// =============================================================================
// Kanban Cards Container
// =============================================================================

export type KanbanCardsProps = {
  id: string;
  children: ReactNode;
  className?: string;
};

export const KanbanCards = ({ id, children, className }: KanbanCardsProps) => (
  <Droppable droppableId={id}>
    {(provided: DroppableProvided) => (
      <div
        className={cn('flex flex-1 flex-col', className)}
        ref={provided.innerRef}
        {...provided.droppableProps}
      >
        {children}
        {provided.placeholder}
      </div>
    )}
  </Droppable>
);

// =============================================================================
// Kanban Header
// =============================================================================

export type KanbanHeaderProps =
  | {
      children: ReactNode;
    }
  | {
      name: Status['name'];
      color: Status['color'];
      className?: string;
      onAddTask?: () => void;
    };

export const KanbanHeader = (props: KanbanHeaderProps) => {
  const { t } = useTranslation('tasks');

  if ('children' in props) {
    return props.children;
  }

  return (
    <Card
      className={cn(
        'sticky top-0 z-20 flex shrink-0 items-center gap-base p-base flex gap-base',
        'bg-background',
        props.className
      )}
      style={{
        backgroundImage: `linear-gradient(hsl(var(${props.color}) / 0.03), hsl(var(${props.color}) / 0.03))`,
      }}
    >
      <span className="flex-1 flex items-center gap-base">
        <div
          className="h-2 w-2 rounded-full"
          style={{ backgroundColor: `hsl(var(${props.color}))` }}
        />

        <p className="m-0 text-sm">{props.name}</p>
      </span>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              className="m-0 p-0 h-0 text-foreground/50 hover:text-foreground"
              onClick={props.onAddTask}
              aria-label={t('actions.addTask')}
            >
              <PlusIcon className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top">{t('actions.addTask')}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </Card>
  );
};

// =============================================================================
// Kanban Provider (DragDropContext)
// =============================================================================

export type KanbanProviderProps = {
  children: ReactNode;
  onDragEnd: (result: DropResult) => void;
  className?: string;
};

export const KanbanProvider = ({
  children,
  onDragEnd,
  className,
}: KanbanProviderProps) => {
  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div
        className={cn(
          'inline-grid grid-flow-col auto-cols-[minmax(200px,400px)] divide-x border-x items-stretch min-h-full',
          className
        )}
      >
        {children}
      </div>
    </DragDropContext>
  );
};
