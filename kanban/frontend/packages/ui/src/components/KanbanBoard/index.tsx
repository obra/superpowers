import React from 'react'
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
  type DroppableProvided,
  type DraggableProvided,
} from '@hello-pangea/dnd'

// ─── KanbanProvider ─────────────────────────────────────────────────────────
// Wraps the board with DragDropContext for drag-and-drop functionality

interface KanbanProviderProps {
  children: React.ReactNode
  onDragEnd: (result: DropResult) => void
}

export function KanbanProvider({ children, onDragEnd }: KanbanProviderProps) {
  return <DragDropContext onDragEnd={onDragEnd}>{children}</DragDropContext>
}

// ─── KanbanCards ────────────────────────────────────────────────────────────
// A droppable column that can receive draggable cards

interface KanbanCardsProps {
  id: string
  children: React.ReactNode
}

export function KanbanCards({ id, children }: KanbanCardsProps) {
  return (
    <Droppable droppableId={id}>
      {(provided: DroppableProvided) => (
        <div
          ref={provided.innerRef}
          {...provided.droppableProps}
          style={{ minHeight: 60 }}
        >
          {children}
          {provided.placeholder}
        </div>
      )}
    </Droppable>
  )
}

// ─── KanbanCard ─────────────────────────────────────────────────────────────
// A draggable card within a column

interface KanbanCardProps {
  id: string
  name: string
  index: number
  onClick?: () => void
  children: React.ReactNode
}

export function KanbanCard({
  id,
  name,
  index,
  onClick,
  children,
}: KanbanCardProps) {
  return (
    <Draggable draggableId={id} index={index}>
      {(provided: DraggableProvided) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={onClick}
          aria-label={name}
        >
          {children}
        </div>
      )}
    </Draggable>
  )
}
