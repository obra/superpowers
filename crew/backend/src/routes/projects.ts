import { Hono } from 'hono'
import { verify } from 'hono/jwt'
import type { UserRegistry } from '../registry/types'

const JWT_SECRET = process.env.JWT_SECRET!

async function getPayload(authHeader: string | undefined) {
  if (!authHeader?.startsWith('Bearer ')) throw new Error('Unauthorized')
  return verify(authHeader.slice(7), JWT_SECRET) as any
}

export function createProjectsRouter(registry: UserRegistry) {
  const app = new Hono()

  // 列出用户项目
  app.get('/', async (c) => {
    try {
      const payload = await getPayload(c.req.header('Authorization'))
      const projects = await registry.listProjects(payload.github_id)
      return c.json(projects)
    } catch { return c.json({ error: 'Unauthorized' }, 401) }
  })

  // 绑定新项目
  app.post('/', async (c) => {
    try {
      const payload = await getPayload(c.req.header('Authorization'))
      const { repo_full_name, repo_url } = await c.req.json()
      const project = await registry.addProject(payload.github_id, { repo_full_name, repo_url })
      return c.json(project, 201)
    } catch (e: any) {
      const status = e.message === 'Unauthorized' ? 401 : 400
      return c.json({ error: e.message }, status)
    }
  })

  // 解绑项目
  app.delete('/:id', async (c) => {
    try {
      const payload = await getPayload(c.req.header('Authorization'))
      await registry.removeProject(payload.github_id, c.req.param('id'))
      return c.json({ ok: true })
    } catch { return c.json({ error: 'Unauthorized' }, 401) }
  })

  // 拉取用户的 GitHub repo 列表
  app.get('/github/repos', async (c) => {
    try {
      const payload = await getPayload(c.req.header('Authorization'))
      const res = await fetch(
        'https://api.github.com/user/repos?sort=updated&per_page=100&affiliation=owner,collaborator,organization_member',
        { headers: { Authorization: `Bearer ${payload.access_token}`, 'User-Agent': 'jingxia-kanban' } }
      )
      const repos = await res.json()
      return c.json(repos)
    } catch { return c.json({ error: 'Unauthorized' }, 401) }
  })

  // 检查 repo 是否已有 .team/ 目录
  app.get('/github/repos/:owner/:repo/init-status', async (c) => {
    try {
      const payload = await getPayload(c.req.header('Authorization'))
      const { owner, repo } = c.req.param()
      const res = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/contents/.team`,
        { headers: { Authorization: `Bearer ${payload.access_token}`, 'User-Agent': 'jingxia-kanban' } }
      )
      return c.json({ initialized: res.ok })
    } catch { return c.json({ error: 'Unauthorized' }, 401) }
  })

  // 初始化 .team/ 目录
  app.post('/github/repos/:owner/:repo/init', async (c) => {
    try {
      const payload = await getPayload(c.req.header('Authorization'))
      const { owner, repo } = c.req.param()
      const headers = {
        Authorization: `Bearer ${payload.access_token}`,
        'User-Agent': 'jingxia-kanban',
        'Content-Type': 'application/json',
      }
      const base = `https://api.github.com/repos/${owner}/${repo}/contents`
      const readme = btoa(`# .team\n\nThis directory stores project data for Jingxia Kanban.\n\nFiles here are managed automatically. Do not edit manually.\n`)

      const initRes = await fetch(`${base}/.team/README.md`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ message: 'chore: initialize .team directory', content: readme }),
      })

      if (!initRes.ok) {
        const err = await initRes.json() as any
        throw new Error(err.message ?? 'GitHub API error')
      }

      return c.json({ ok: true })
    } catch (e: any) {
      return c.json({ error: e.message ?? 'Failed to initialize' }, 500)
    }
  })

  return app
}
