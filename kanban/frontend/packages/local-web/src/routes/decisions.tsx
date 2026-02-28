import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { fetchDecisions } from '@app/api'
import type { Decision } from '@app/types'

function DecisionsPage() {
  const { data: decisions = [], isLoading } = useQuery({
    queryKey: ['decisions'],
    queryFn: fetchDecisions,
  })

  if (isLoading) {
    return (
      <div style={{
        display: 'flex', height: '100%',
        alignItems: 'center', justifyContent: 'center',
        color: 'hsl(var(--text-low))', fontSize: 13,
        fontFamily: 'Instrument Sans, sans-serif',
      }}>
        Loading…
      </div>
    )
  }

  return (
    <div className="rb-page" style={{ height: '100%', overflowY: 'auto', padding: '28px 32px' }}>
      <div style={{ maxWidth: 760, margin: '0 auto' }}>
        <h1 className="rb-display" style={{
          fontSize: 20, fontWeight: 700,
          color: 'hsl(var(--text-high))',
          marginBottom: 24,
        }}>
          Architecture Decisions
        </h1>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {decisions.map(d => <DecisionCard key={d.id} decision={d} />)}
          {decisions.length === 0 && (
            <p style={{ fontSize: 13, color: 'hsl(var(--text-low))', fontFamily: 'Instrument Sans, sans-serif' }}>
              No ADRs yet. Add .md files to .team/decisions/
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

function DecisionCard({ decision }: { decision: Decision }) {
  return (
    <div
      className="rb-card rb-glass rb-card-hover"
      style={{
        background: 'hsl(var(--_bg-secondary-default))',
        padding: '16px 20px',
      }}
    >
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
        gap: 12, marginBottom: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          <span className="rb-mono" style={{ fontSize: 10, color: 'hsl(var(--text-low))', flexShrink: 0 }}>
            {decision.id}
          </span>
          <h2 style={{
            fontSize: 14, fontWeight: 600,
            color: 'hsl(var(--text-high))',
            margin: 0, lineHeight: 1.3,
            fontFamily: 'Instrument Sans, sans-serif',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {decision.title}
          </h2>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 9, flexShrink: 0 }}>
          <span className={`rb-badge rb-badge-${decision.status}`}>
            {decision.status}
          </span>
          <span className="rb-mono" style={{ fontSize: 10, color: 'hsl(var(--text-low))' }}>
            {decision.date}
          </span>
        </div>
      </div>

      {/* Body excerpt */}
      <p style={{
        fontSize: 12.5, color: 'hsl(var(--text-low))',
        lineHeight: 1.65, margin: 0,
        fontFamily: 'Instrument Sans, sans-serif',
        display: '-webkit-box',
        WebkitLineClamp: 4,
        WebkitBoxOrient: 'vertical' as const,
        overflow: 'hidden',
      }}>
        {decision.body.slice(0, 500)}{decision.body.length > 500 && '…'}
      </p>
    </div>
  )
}

export const Route = createFileRoute('/decisions')({ component: DecisionsPage })
