import { createFileRoute } from '@tanstack/react-router'
import { useBoard } from '@app/hooks/useBoard'
import type { Person, Task } from '@app/types'

function PeoplePage() {
  const { people, tasks } = useBoard()

  return (
    <div className="rb-page" style={{ height: '100%', overflowY: 'auto', padding: '28px 32px' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <h1 className="rb-display" style={{
          fontSize: 20, fontWeight: 700,
          color: 'hsl(var(--text-high))',
          marginBottom: 24,
        }}>
          Team
        </h1>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
          gap: 12,
        }}>
          {people.map(person => (
            <PersonCard key={person.username} person={person} tasks={tasks} />
          ))}
          {people.length === 0 && (
            <p style={{ fontSize: 13, color: 'hsl(var(--text-low))', gridColumn: '1 / -1', fontFamily: 'Instrument Sans, sans-serif' }}>
              No people found. Add .md files to .team/people/
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

function PersonCard({ person, tasks }: { person: Person; tasks: Task[] }) {
  const currentTask = tasks.find(t => t.id === person.current_task)
  const initial = person.name.charAt(0).toUpperCase()

  return (
    <div
      className="rb-card rb-glass rb-card-hover"
      style={{
        background: 'hsl(var(--_bg-secondary-default))',
        padding: '16px',
        display: 'flex', flexDirection: 'column', gap: 12,
      }}
    >
      {/* Avatar + name */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
        <div style={{
          width: 38, height: 38, borderRadius: '50%',
          background: 'var(--rb-accent-dim)',
          border: '1.5px solid var(--rb-glow)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 15, fontWeight: 700,
          color: 'var(--rb-accent)',
          flexShrink: 0,
          fontFamily: 'Syne, sans-serif',
          boxShadow: '0 0 14px var(--rb-glow)',
        }}>
          {initial}
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{
            fontSize: 14, fontWeight: 600,
            color: 'hsl(var(--text-high))',
            fontFamily: 'Instrument Sans, sans-serif',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {person.name}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 1 }}>
            <span className="rb-mono" style={{ fontSize: 10.5, color: 'hsl(var(--text-low))' }}>
              @{person.username}
            </span>
            {person.team && (
              <>
                <span style={{ color: 'hsl(var(--text-low))', fontSize: 10 }}>·</span>
                <span style={{ fontSize: 11, color: 'hsl(var(--text-low))', fontFamily: 'Instrument Sans, sans-serif' }}>
                  {person.team}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Blocked */}
      {person.blocked_by && (
        <div style={{
          display: 'flex', alignItems: 'flex-start', gap: 7,
          padding: '7px 10px',
          borderRadius: 8,
          background: 'rgba(239,68,68,0.08)',
          border: '1px solid rgba(239,68,68,0.2)',
        }}>
          <span style={{ fontSize: 10, color: '#ef4444', fontWeight: 700, marginTop: 1 }}>⊘</span>
          <span style={{ fontSize: 12, color: '#ef4444', lineHeight: 1.4, fontFamily: 'Instrument Sans, sans-serif' }}>
            {person.blocked_by}
          </span>
        </div>
      )}

      {/* Current task */}
      {currentTask && (
        <div style={{
          padding: '8px 10px',
          borderRadius: 8,
          background: 'hsl(var(--_muted))',
          border: '1px solid hsl(var(--_border))',
        }}>
          <div className="rb-label" style={{ marginBottom: 4 }}>Working on</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 7 }}>
            <span className="rb-mono" style={{ color: 'var(--rb-accent)', fontSize: 10.5 }}>
              {currentTask.id}
            </span>
            <span style={{
              fontSize: 12.5, color: 'hsl(var(--text-normal))',
              fontFamily: 'Instrument Sans, sans-serif',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {currentTask.title}
            </span>
          </div>
        </div>
      )}

      {/* Completed today */}
      {person.completed_today.length > 0 && (
        <div>
          <div className="rb-label" style={{ marginBottom: 6 }}>Today</div>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 5 }}>
            {person.completed_today.map((item, i) => (
              <li key={i} style={{
                display: 'flex', alignItems: 'flex-start', gap: 7,
                fontSize: 12, color: 'hsl(var(--text-normal))',
                fontFamily: 'Instrument Sans, sans-serif',
                lineHeight: 1.4,
              }}>
                <span className="rb-dot rb-dot-done" style={{ marginTop: 4 }} />
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

export const Route = createFileRoute('/people')({ component: PeoplePage })
