import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { fetchKnowledge } from '@app/api'
import type { KnowledgeEntry } from '@app/types'

function KnowledgePage() {
  const { data: entries = [], isLoading } = useQuery({
    queryKey: ['knowledge'],
    queryFn: fetchKnowledge,
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
          Knowledge Base
        </h1>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {entries.map(entry => <KnowledgeCard key={entry.slug} entry={entry} />)}
          {entries.length === 0 && (
            <p style={{ fontSize: 13, color: 'hsl(var(--text-low))', fontFamily: 'Instrument Sans, sans-serif' }}>
              No entries yet. Add .md files to .team/knowledge/
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

function KnowledgeCard({ entry }: { entry: KnowledgeEntry }) {
  return (
    <div
      className="rb-card rb-glass rb-card-hover"
      style={{
        background: 'hsl(var(--_bg-secondary-default))',
        padding: '16px 20px',
      }}
    >
      {/* Header row */}
      <div style={{
        display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
        gap: 12, marginBottom: 10,
      }}>
        <h2 style={{
          fontSize: 14, fontWeight: 600,
          color: 'hsl(var(--text-high))',
          margin: 0,
          fontFamily: 'Instrument Sans, sans-serif',
          lineHeight: 1.3,
        }}>
          {entry.title}
        </h2>
        <span className="rb-mono" style={{ fontSize: 10, color: 'hsl(var(--text-low))', flexShrink: 0 }}>
          {entry.date}
        </span>
      </div>

      {/* Tags */}
      {entry.tags.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 10 }}>
          {entry.tags.map(t => (
            <span key={t} className="rb-tag">{t}</span>
          ))}
        </div>
      )}

      {/* Body excerpt */}
      <p style={{
        fontSize: 12.5, color: 'hsl(var(--text-low))',
        lineHeight: 1.65, margin: 0,
        fontFamily: 'Instrument Sans, sans-serif',
        display: '-webkit-box',
        WebkitLineClamp: 3,
        WebkitBoxOrient: 'vertical' as const,
        overflow: 'hidden',
      }}>
        {entry.body.slice(0, 400)}{entry.body.length > 400 && '…'}
      </p>
    </div>
  )
}

export const Route = createFileRoute('/knowledge')({ component: KnowledgePage })
