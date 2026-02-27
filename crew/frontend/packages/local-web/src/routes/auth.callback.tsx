import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'
import { setToken } from '@vibe/app-core'

export const Route = createFileRoute('/auth/callback')({
  component: AuthCallback,
})

function AuthCallback() {
  const navigate = useNavigate()

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const token = params.get('token')
    const error = params.get('error')

    if (token) {
      setToken(token)
      navigate({ to: '/' })
    } else {
      navigate({ to: '/login', search: { error: error ?? 'unknown' } as any })
    }
  }, [])

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'hsl(var(--_background))',
    }}>
      <div style={{ color: 'hsl(var(--text-low))', fontSize: 14 }}>正在登录...</div>
    </div>
  )
}
