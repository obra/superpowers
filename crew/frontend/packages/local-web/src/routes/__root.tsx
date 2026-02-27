import { Outlet, createRootRoute, Link, useRouterState, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  SquaresFourIcon, UsersIcon, BookOpenIcon,
  LightbulbIcon, LightningIcon, SunIcon, MoonIcon,
} from '@phosphor-icons/react'
import Magnet from '@web/components/Magnet'
import { isAuthenticated, authHeaders } from '@vibe/app-core'

const NAV = [
  { to: '/',           icon: SquaresFourIcon, label: 'Board',     exact: true  },
  { to: '/people',     icon: UsersIcon,       label: 'People',    exact: false },
  { to: '/knowledge',  icon: BookOpenIcon,    label: 'Knowledge', exact: false },
  { to: '/decisions',  icon: LightbulbIcon,   label: 'Decisions', exact: false },
] as const

const PUBLIC_PATHS = ['/login', '/auth/callback', '/welcome']

function RootLayout() {
  const [dark, setDark] = useState(() =>
    typeof window !== 'undefined'
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
      : true
  )

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    localStorage.setItem('crew-theme', dark ? 'dark' : 'light')
  }, [dark])

  // Restore from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('crew-theme')
    if (saved) setDark(saved === 'dark')
  }, [])

  const pathname = useRouterState({ select: s => s.location.pathname })
  const navigate = useNavigate()

  // Route guard: redirect to /login if not authenticated on protected routes
  useEffect(() => {
    if (!PUBLIC_PATHS.includes(pathname) && !isAuthenticated()) {
      navigate({ to: '/login' })
    }
  }, [pathname])

  // FRE detection: if authenticated but no projects, go to /welcome
  const { data: projects } = useQuery<any[]>({
    queryKey: ['projects'],
    queryFn: async () => {
      const res = await fetch('/api/projects', { headers: authHeaders() })
      if (!res.ok) return []
      return res.json()
    },
    enabled: isAuthenticated() && !PUBLIC_PATHS.includes(pathname),
  })

  useEffect(() => {
    const frePaths = [...PUBLIC_PATHS]
    if (isAuthenticated() && Array.isArray(projects) && projects.length === 0 && !frePaths.includes(pathname)) {
      navigate({ to: '/welcome' })
    }
  }, [projects, pathname])

  // Show full-page layout (no sidebar) for public routes
  if (PUBLIC_PATHS.includes(pathname)) {
    return <Outlet />
  }

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'hsl(var(--_background))' }}>
      {/* ── Sidebar ── */}
      <nav style={{
        width: 56, display: 'flex', flexDirection: 'column', alignItems: 'center',
        gap: 4, padding: '14px 0', flexShrink: 0, position: 'relative', zIndex: 10,
        borderRight: '1px solid hsl(var(--_border))',
        background: 'hsl(var(--_bg-secondary-default))',
      }}>
        {/* Logo */}
        <div style={{ marginBottom: 14 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 10,
            background: 'linear-gradient(135deg, var(--rb-accent) 0%, var(--rb-accent2) 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 2px 12px var(--rb-glow)',
          }}>
            <LightningIcon size={16} weight="fill" color={dark ? '#000' : '#fff'} />
          </div>
        </div>

        {/* Nav */}
        {NAV.map(({ to, icon: Icon, label, exact }) => {
          const active = exact ? pathname === to : pathname.startsWith(to)
          return (
            <Magnet key={to} magnetStrength={3} padding={48}>
              <Link to={to} title={label}
                className={active ? 'rb-nav-active' : ''}
                style={{
                  width: 38, height: 38, borderRadius: 10,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: active ? 'var(--rb-accent)' : 'hsl(var(--text-low))',
                  textDecoration: 'none',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => {
                  if (!active) {
                    (e.currentTarget as HTMLElement).style.background = 'hsl(var(--_muted))'
                    ;(e.currentTarget as HTMLElement).style.color = 'hsl(var(--text-high))'
                  }
                }}
                onMouseLeave={e => {
                  if (!active) {
                    (e.currentTarget as HTMLElement).style.background = ''
                    ;(e.currentTarget as HTMLElement).style.color = 'hsl(var(--text-low))'
                  }
                }}
              >
                <Icon size={18} weight={active ? 'fill' : 'regular'} />
              </Link>
            </Magnet>
          )
        })}

        <div style={{ flex: 1 }} />

        {/* Theme toggle */}
        <button
          onClick={() => setDark(d => !d)}
          title={dark ? 'Light mode' : 'Dark mode'}
          className="rb-btn-icon"
          style={{ marginBottom: 4 }}
        >
          {dark
            ? <SunIcon size={15} weight="regular" />
            : <MoonIcon size={15} weight="regular" />
          }
        </button>
      </nav>

      {/* ── Main ── */}
      <main style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
        <Outlet />
      </main>
    </div>
  )
}

export const Route = createRootRoute({ component: RootLayout })
