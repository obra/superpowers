import { createFileRoute } from '@tanstack/react-router'
import { LightningIcon } from '@phosphor-icons/react'

export const Route = createFileRoute('/login')({
  component: LoginPage,
})

function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'hsl(var(--_background))' }}>
      <div className="text-center" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24, maxWidth: 360 }}>
        {/* Logo */}
        <div style={{
          width: 56, height: 56, borderRadius: 16,
          background: 'linear-gradient(135deg, var(--rb-accent) 0%, var(--rb-accent2) 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 24px var(--rb-glow)',
        }}>
          <LightningIcon size={24} weight="fill" color="#000" />
        </div>

        {/* Title */}
        <div>
          <div style={{ fontSize: 24, fontWeight: 700, color: 'hsl(var(--text-high))', marginBottom: 8 }}>
            Crew Kanban
          </div>
          <p style={{ color: 'hsl(var(--text-low))', fontSize: 14, lineHeight: 1.5 }}>
            多人 · 多 Agent · Git-native 协作看板
          </p>
        </div>

        {/* GitHub Login Button */}
        <a
          href="/auth/github"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 10,
            padding: '12px 24px',
            background: 'hsl(var(--text-high))', color: 'hsl(var(--_background))',
            borderRadius: 10, fontWeight: 500, fontSize: 15,
            textDecoration: 'none', transition: 'opacity 0.15s',
          }}
          onMouseEnter={e => ((e.currentTarget as HTMLElement).style.opacity = '0.85')}
          onMouseLeave={e => ((e.currentTarget as HTMLElement).style.opacity = '1')}
        >
          <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
          </svg>
          使用 GitHub 登录
        </a>
      </div>
    </div>
  )
}
