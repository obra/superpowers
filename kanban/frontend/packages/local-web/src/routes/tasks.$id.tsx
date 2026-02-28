import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { XIcon, PencilSimpleIcon, CheckIcon } from '@phosphor-icons/react'
import { useBoard } from '@app/hooks/useBoard'
import { useUpdateTask, useUpdateTaskStatus } from '@app/hooks/useMutations'
import type { TaskStatus, TaskPriority } from '@app/types'

const STATUS_OPTIONS: TaskStatus[] = ['backlog', 'todo', 'in-progress', 'in-review', 'done']
const PRIORITY_OPTIONS: TaskPriority[] = ['P0', 'P1', 'P2', 'P3']

function getStatusKey(status: TaskStatus): string {
  if (status === 'in-progress') return 'progress'
  if (status === 'in-review') return 'review'
  return status
}

const PRIORITY_CLASS: Record<TaskPriority, string> = {
  P0: 'rb-p0', P1: 'rb-p1', P2: 'rb-p2', P3: 'rb-p3',
}

function TaskDetailPage() {
  const { id } = Route.useParams()
  const navigate = useNavigate()
  const { tasks } = useBoard()
  const updateTask = useUpdateTask()
  const updateStatus = useUpdateTaskStatus()

  const task = tasks.find(t => t.id === id)
  const [editingTitle, setEditingTitle] = useState(false)
  const [titleDraft, setTitleDraft] = useState('')

  if (!task) {
    return (
      <div style={{
        display: 'flex', height: '100%',
        alignItems: 'center', justifyContent: 'center',
        color: 'hsl(var(--text-low))', fontSize: 13,
        fontFamily: 'Instrument Sans, sans-serif',
      }}>
        Task {id} not found
      </div>
    )
  }

  const sk = getStatusKey(task.status)

  return (
    <div className="rb-page" style={{ height: '100%', overflowY: 'auto', background: 'hsl(var(--_background))' }}>
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '28px 32px 48px' }}>

        {/* ── Header ── */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 14, marginBottom: 28 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <span className="rb-mono" style={{ color: 'hsl(var(--text-low))', fontSize: 10.5, display: 'block', marginBottom: 6 }}>
              {task.id}
            </span>

            {editingTitle ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <input
                  autoFocus
                  className="rb-display"
                  style={{
                    fontSize: 22, fontWeight: 700,
                    background: 'transparent',
                    border: 'none',
                    borderBottom: '2px solid var(--rb-accent)',
                    outline: 'none',
                    flex: 1,
                    color: 'hsl(var(--text-high))',
                    padding: '2px 0',
                  }}
                  value={titleDraft}
                  onChange={e => setTitleDraft(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      updateTask.mutate({ id: task.id, patch: { title: titleDraft } })
                      setEditingTitle(false)
                    }
                    if (e.key === 'Escape') setEditingTitle(false)
                  }}
                />
                <button
                  className="rb-btn-icon"
                  onClick={() => {
                    updateTask.mutate({ id: task.id, patch: { title: titleDraft } })
                    setEditingTitle(false)
                  }}
                  style={{ color: 'var(--rb-accent)' }}
                >
                  <CheckIcon size={16} weight="bold" />
                </button>
              </div>
            ) : (
              <h1
                className="rb-display"
                style={{
                  fontSize: 22, fontWeight: 700,
                  color: 'hsl(var(--text-high))',
                  cursor: 'pointer',
                  margin: 0, lineHeight: 1.3,
                  transition: 'color 0.15s',
                }}
                onClick={() => { setTitleDraft(task.title); setEditingTitle(true) }}
                title="Click to edit"
              >
                {task.title}
              </h1>
            )}
          </div>

          <button
            className="rb-btn-icon"
            onClick={() => void navigate({ to: '/' })}
            style={{ marginTop: 2, flexShrink: 0 }}
          >
            <XIcon size={16} />
          </button>
        </div>

        {/* ── Properties grid ── */}
        <div
          className="rb-card rb-glass"
          style={{
            background: 'hsl(var(--_bg-secondary-default))',
            display: 'grid', gridTemplateColumns: '1fr 1fr',
            gap: '0px',
            marginBottom: 28,
          }}
        >
          {/* Status */}
          <PropCell label="Status">
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <span className={`rb-dot rb-dot-${sk}`} />
              <select
                value={task.status}
                onChange={e => updateStatus.mutate({ id: task.id, status: e.target.value as TaskStatus })}
                className="rb-select"
                style={{ color: 'hsl(var(--text-normal))' }}
              >
                {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </PropCell>

          {/* Priority */}
          <PropCell label="Priority">
            <select
              value={task.priority}
              onChange={e => updateTask.mutate({ id: task.id, patch: { priority: e.target.value as TaskPriority } })}
              className={`rb-select ${PRIORITY_CLASS[task.priority]}`}
              style={{ fontWeight: 600 }}
            >
              {PRIORITY_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </PropCell>

          {/* Assignee */}
          <PropCell label="Assignee">
            <span style={{ fontSize: 13, color: 'hsl(var(--text-normal))', fontFamily: 'Instrument Sans, sans-serif' }}>
              {task.assignee ?? '—'}
            </span>
          </PropCell>

          {/* Sprint */}
          <PropCell label="Sprint">
            <span style={{ fontSize: 13, color: 'hsl(var(--text-normal))', fontFamily: 'Instrument Sans, sans-serif' }}>
              {task.sprint != null ? `Sprint ${task.sprint}` : '—'}
            </span>
          </PropCell>

          {/* Tags */}
          {task.tags.length > 0 && (
            <PropCell label="Tags" full>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                {task.tags.map(t => (
                  <span key={t} className="rb-tag">{t}</span>
                ))}
              </div>
            </PropCell>
          )}

          {/* PR */}
          {task.pr_url && (
            <PropCell label="PR" full>
              <a
                href={task.pr_url}
                target="_blank"
                rel="noreferrer"
                style={{ fontSize: 12.5, color: 'var(--rb-accent)', wordBreak: 'break-all', fontFamily: 'Instrument Sans, sans-serif' }}
              >
                {task.pr_url}
              </a>
            </PropCell>
          )}

          {/* Blocked by */}
          {task.blocked_by.length > 0 && (
            <PropCell label="Blocked by" full>
              <span className="rb-mono" style={{ fontSize: 12, color: '#ef4444' }}>
                {task.blocked_by.join(', ')}
              </span>
            </PropCell>
          )}

          {/* Blocks */}
          {task.blocks.length > 0 && (
            <PropCell label="Blocks" full>
              <span className="rb-mono" style={{ fontSize: 12, color: 'hsl(var(--text-normal))' }}>
                {task.blocks.join(', ')}
              </span>
            </PropCell>
          )}
        </div>

        {/* ── Description ── */}
        <div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 7,
            marginBottom: 10,
          }}>
            <span style={{
              fontSize: 12, fontWeight: 600,
              color: 'hsl(var(--text-normal))',
              fontFamily: 'Instrument Sans, sans-serif',
            }}>
              Description
            </span>
            <PencilSimpleIcon size={12} style={{ color: 'hsl(var(--text-low))' }} />
          </div>
          <BodyEditor
            body={task.body}
            onSave={body => updateTask.mutate({ id: task.id, patch: { body } })}
          />
        </div>

      </div>
    </div>
  )
}

// ─── PropCell ────────────────────────────────────────────────────────────────

function PropCell({
  label,
  children,
  full,
}: {
  label: string
  children: React.ReactNode
  full?: boolean
}) {
  return (
    <div
      style={{
        gridColumn: full ? '1 / -1' : undefined,
        padding: '11px 14px',
        borderBottom: '1px solid hsl(var(--_border))',
        borderRight: full ? 'none' : '1px solid hsl(var(--_border))',
      }}
    >
      <div className="rb-label" style={{ marginBottom: 5 }}>{label}</div>
      {children}
    </div>
  )
}

// ─── BodyEditor ──────────────────────────────────────────────────────────────

function BodyEditor({ body, onSave }: { body: string; onSave: (body: string) => void }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(body)

  if (!editing) {
    return (
      <div
        className="rb-card"
        style={{
          minHeight: 96,
          padding: '10px 12px',
          cursor: 'text',
          fontSize: 13,
          color: body ? 'hsl(var(--text-low))' : 'hsl(var(--text-low))',
          whiteSpace: 'pre-wrap',
          lineHeight: 1.7,
          background: 'hsl(var(--_bg-secondary-default))',
          transition: 'border-color 0.15s',
        }}
        onClick={() => { setDraft(body); setEditing(true) }}
      >
        {body || <span style={{ fontStyle: 'italic', opacity: 0.6 }}>Click to add description…</span>}
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <textarea
        autoFocus
        className="rb-textarea"
        value={draft}
        onChange={e => setDraft(e.target.value)}
      />
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          className="rb-btn-primary"
          onClick={() => { onSave(draft); setEditing(false) }}
        >
          Save
        </button>
        <button
          className="rb-btn-ghost"
          onClick={() => setEditing(false)}
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

export const Route = createFileRoute('/tasks/$id')({ component: TaskDetailPage })
