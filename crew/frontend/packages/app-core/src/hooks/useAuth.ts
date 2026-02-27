import { useQuery, useQueryClient } from '@tanstack/react-query'
import { clearToken, isAuthenticated, authHeaders } from '../auth.js'

async function fetchMe() {
  const res = await fetch('/auth/me', { headers: authHeaders() })
  if (!res.ok) throw new Error('Not authenticated')
  return res.json()
}

export function useAuth() {
  const queryClient = useQueryClient()

  const { data: user, isLoading } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: fetchMe,
    enabled: isAuthenticated(),
    retry: false,
  })

  function logout() {
    clearToken()
    queryClient.clear()
    window.location.href = '/login'
  }

  return { user, isLoading, isAuthenticated: !!user, logout }
}
