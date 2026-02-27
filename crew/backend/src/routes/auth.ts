import { Hono } from 'hono'
import { sign, verify } from 'hono/jwt'
import type { UserRegistry } from '../registry/types'

const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID!
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET!
const JWT_SECRET = process.env.JWT_SECRET!
const FRONTEND_URL = process.env.FRONTEND_URL ?? 'http://localhost:5173'

export function createAuthRouter(registry: UserRegistry) {
  const app = new Hono()

  // 跳转 GitHub OAuth
  app.get('/github', (c) => {
    const params = new URLSearchParams({
      client_id: GITHUB_CLIENT_ID,
      scope: 'read:user repo',
      redirect_uri: `${new URL(c.req.url).origin}/auth/callback`,
    })
    return c.redirect(`https://github.com/login/oauth/authorize?${params}`)
  })

  // GitHub 回调
  app.get('/callback', async (c) => {
    const code = c.req.query('code')
    if (!code) return c.redirect(`${FRONTEND_URL}/login?error=no_code`)

    // 用 code 换 access_token
    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({ client_id: GITHUB_CLIENT_ID, client_secret: GITHUB_CLIENT_SECRET, code }),
    })
    const { access_token, error } = await tokenRes.json() as any
    if (error || !access_token) return c.redirect(`${FRONTEND_URL}/login?error=token_failed`)

    // 拉取 GitHub 用户信息
    const userRes = await fetch('https://api.github.com/user', {
      headers: { Authorization: `Bearer ${access_token}`, 'User-Agent': 'crew' },
    })
    const ghUser = await userRes.json() as any

    // 保存/更新用户
    const existing = await registry.findUser(ghUser.id)
    const user = {
      github_id: ghUser.id,
      login: ghUser.login,
      name: ghUser.name ?? ghUser.login,
      avatar_url: ghUser.avatar_url,
      created_at: existing?.created_at ?? new Date().toISOString(),
      projects: existing?.projects ?? [],
    }
    await registry.saveUser(user)

    // 签发 JWT（30天过期）
    const token = await sign(
      {
        github_id: ghUser.id,
        login: ghUser.login,
        access_token,
        exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30,
      },
      JWT_SECRET
    )

    return c.redirect(`${FRONTEND_URL}/auth/callback?token=${token}`)
  })

  // 获取当前用户信息
  app.get('/me', async (c) => {
    const authHeader = c.req.header('Authorization')
    if (!authHeader?.startsWith('Bearer ')) return c.json({ error: 'Unauthorized' }, 401)
    try {
      const payload = await verify(authHeader.slice(7), JWT_SECRET) as any
      const user = await registry.findUser(payload.github_id)
      if (!user) return c.json({ error: 'User not found' }, 404)
      // Never expose access_token in response
      const { projects, ...userInfo } = user
      return c.json({ ...userInfo, projects })
    } catch {
      return c.json({ error: 'Invalid token' }, 401)
    }
  })

  return app
}
