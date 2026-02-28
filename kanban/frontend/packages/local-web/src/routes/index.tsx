import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useCallback, useEffect, useMemo, useState } from 'react'
import type { DropResult } from '@hello-pangea/dnd'
import {
  KanbanProvider,
  KanbanCards,
  KanbanCard,
} from '@vibe/ui/components/KanbanBoard'
import { PlusIcon } from '@phosphor-icons/react'
import { useBoard } from '@app/hooks/useBoard'
import { useUpdateTaskStatus } from '@app/hooks/useMutations'
import type { Task, TaskPriority, TaskStatus } from '@app/types'

// ─── Column config ──────────────────────────────────────────────────────────

const STATUS_COLUMNS: { id: TaskStatus; name: string }[] = [
  { id: 'backlog',     name: 'Backlog'     },
  { id: 'todo',        name: 'To Do'       },
  { id: 'in-progress', name: 'In Progress' },
  { id: 'in-review',   name: 'In Review'   },
  { id: 'done',        name: 'Done'        },
]

function getStatusKey(status: TaskStatus): string {
  if (status === 'in-progress') return 'progress'
  if (status === 'in-review') return 'review'
  return status
}

const PRI_CLASS: Record<TaskPriority, string> = {
  P0: 'rb-p0', P1: 'rb-p1', P2: 'rb-p2', P3: 'rb-p3',
}

// ─── Board ──────────────────────────────────────────────────────────────────

function BoardPage() {
  const { tasks, activeSprint, isLoading } = useBoard()
  const updateStatus = useUpdateTaskStatus()
  const navigate = useNavigate()

  const [columns, setColumns] = useState<Record<string, string[]>>({})

  useEffect(() => {
    const grouped: Record<string, string[]> = {}
    for (const col of STATUS_COLUMNS) grouped[col.id] = []
    for (const task of tasks) {
      if (grouped[task.status]) grouped[task.status].push(task.id)
    }
    setColumns(grouped)
  }, [tasks])

  const taskMap = useMemo(() => {
    const m: Record<string, Task> = {}
    for (const t of tasks) m[t.id] = t
    return m
  }, [tasks])

  const handleDragEnd = useCallback(
    (result: DropResult) => {
      const { source, destination } = result
      if (!destination) return
      if (
        source.droppableId === destination.droppableId &&
        source.index === destination.index
      ) return

      const srcId = source.droppableId as TaskStatus
      const dstId = destination.droppableId as TaskStatus

      setColumns(prev => {
        const srcItems = [...(prev[srcId] ?? [])]
        const [moved] = srcItems.splice(source.index, 1)
        if (srcId === dstId) {
          srcItems.splice(destination.index, 0, moved)
          return { ...prev, [srcId]: srcItems }
        }
        const dstItems = [...(prev[dstId] ?? [])]
        dstItems.splice(destination.index, 0, moved)
        return { ...prev, [srcId]: srcItems, [dstId]: dstItems }
      })

      if (srcId !== dstId) {
        updateStatus.mutate({ id: result.draggableId, status: dstId })
      }
    },
    [updateStatus],
  )

  if (isLoading) {
    return (
      <div style={{
        display: 'flex', height: '100%',
        alignItems: 'center', justifyContent: 'center',
        color: 'hsl(var(--text-low))',
        fontFamily: 'Instrument Sans, sans-serif', fontSize: 13,
      }}>
        Loading…
      </div>
    )
  }

  return (
    <div className="rb-page" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>

      {/* ── Sprint header ── */}
      {activeSprint && (
        <div style={{
          padding: '13px 22px 11px',
          borderBottom: '1px solid hsl(var(--_border))',
          flexShrink: 0,
          background: 'hsl(var(--_background))',
        }}>
          <div className="rb-label" style={{ marginBottom: 3 }}>Active Sprint</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
            <h1 className="rb-display" style={{
              fontSize: 15, fontWeight: 700,
              color: 'hsl(var(--text-high))',
              margin: 0,
            }}>
              {activeSprint.name}
            </h1>
            {activeSprint.goal && (
              <span style={{ fontSize: 12.5, color: 'hsl(var(--text-low))' }}>
                {activeSprint.goal}
              </span>
            )}
          </div>
        </div>
      )}

      {/* ── Kanban board ── */}
      <div style={{ flex: 1, overflowX: 'auto', overflowY: 'hidden', padding: '16px 18px' }}>
        <KanbanProvider onDragEnd={handleDragEnd}>
          <div style={{ display: 'flex', gap: 10, height: '100%', alignItems: 'flex-start' }}>
            {STATUS_COLUMNS.map(col => (
              <Column
                key={col.id}
                col={col}
                taskIds={columns[col.id] ?? []}
                taskMap={taskMap}
                onCardClick={id => void navigate({ to: '/tasks/$id', params: { id } })}
                onAdd={() => void navigate({ to: '/' })}
              />
            ))}
          </div>
        </KanbanProvider>
      </div>
    </div>
  )
}

// ─── Column ─────────────────────────────────────────────────────────────────

function Column({
  col,
  taskIds,
  taskMap,
  onCardClick,
  onAdd,
}: {
  col: (typeof STATUS_COLUMNS)[number]
  taskIds: string[]
  taskMap: Record<string, Task>
  onCardClick: (id: string) => void
  onAdd: () => void
}) {
  const sk = getStatusKey(col.id)

  return (
    <div style={{ width: 264, flexShrink: 0 }}>
      {/* Header */}
      <div
        className={`rb-col-${sk}`}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '9px 11px',
          background: 'hsl(var(--_bg-secondary-default))',
          border: '1px solid hsl(var(--_border))',
          borderBottom: 'none',
          borderRadius: '10px 10px 0 0',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <span className={`rb-dot rb-dot-${sk}`} />
          <span style={{
            fontSize: 12.5, fontWeight: 600,
            color: 'hsl(var(--text-high))',
            fontFamily: 'Instrument Sans, sans-serif',
          }}>
            {col.name}
          </span>
          <span className="rb-mono" style={{ fontSize: 10, color: 'hsl(var(--text-low))' }}>
            {taskIds.length}
          </span>
        </div>
        <button
          className="rb-btn-icon"
          style={{ width: 24, height: 24 }}
          onClick={onAdd}
          title={`Add to ${col.name}`}
        >
          <PlusIcon size={12} weight="bold" />
        </button>
      </div>

      {/* Droppable area */}
      <div style={{
        background: 'hsl(var(--_bg-secondary-default))',
        border: '1px solid hsl(var(--_border))',
        borderTop: 'none',
        borderRadius: '0 0 10px 10px',
        minHeight: 120,
      }}>
        <KanbanCards id={col.id}>
          <div style={{ padding: 7 }}>
            {taskIds.map((taskId, index) => {
              const task = taskMap[taskId]
              if (!task) return null
              return (
                <KanbanCard
                  key={task.id}
                  id={task.id}
                  name={task.title}
                  index={index}
                  onClick={() => onCardClick(task.id)}
                >
                  <TaskCard task={task} statusKey={sk} />
                </KanbanCard>
              )
            })}
          </div>
        </KanbanCards>
      </div>
    </div>
  )
}

// ─── Task card visual ───────────────────────────────────────────────────────

function TaskCard({ task, statusKey }: { task: Task; statusKey: string }) {
  return (
    <div
      className={`rb-card rb-lift rb-shine rb-glass rb-bar-${statusKey}`}
      style={{
        background: 'hsl(var(--_bg-primary-default))',
        padding: '9px 11px',
        marginBottom: 6,
        cursor: 'pointer',
      }}
    >
      {/* ID + priority row */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: 5,
      }}>
        <span className="rb-mono" style={{ color: 'hsl(var(--text-low))', fontSize: 9.5 }}>
          {task.id}
        </span>
        {task.priority && (
          <span className={`rb-mono ${PRI_CLASS[task.priority]}`} style={{ fontSize: 9.5 }}>
            {task.priority}
          </span>
        )}
      </div>

      {/* Title */}
      <p style={{
        fontSize: 12.5, fontWeight: 500,
        color: 'hsl(var(--text-high))',
        lineHeight: 1.45,
        margin: 0,
        fontFamily: 'Instrument Sans, sans-serif',
      }}>
        {task.title}
      </p>

      {/* Tags */}
      {task.tags.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 7 }}>
          {task.tags.slice(0, 3).map(t => (
            <span key={t} className="rb-tag">{t}</span>
          ))}
        </div>
      )}

      {/* Assignee */}
      {task.assignee && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 5,
          marginTop: 8, paddingTop: 8,
          borderTop: '1px solid hsl(var(--_border))',
        }}>
          <div style={{
            width: 16, height: 16, borderRadius: '50%',
            background: 'var(--rb-accent-dim)',
            border: '1px solid var(--rb-glow)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 8, fontWeight: 700,
            color: 'var(--rb-accent)',
            flexShrink: 0,
          }}>
            {task.assignee.charAt(0).toUpperCase()}
          </div>
          <span style={{ fontSize: 10.5, color: 'hsl(var(--text-low))', fontFamily: 'Instrument Sans, sans-serif' }}>
            {task.assignee}
          </span>
        </div>
      )}
    </div>
  )
}

export const Route = createFileRoute('/')({ component: BoardPage })
