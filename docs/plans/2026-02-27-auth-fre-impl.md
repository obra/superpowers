# Auth + FRE + GitHub 连接 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 为 kanban 服务添加 GitHub OAuth 登录、首次运行体验（FRE）和 repo 绑定能力。

**Architecture:** 后端新增 auth 路由（GitHub OAuth + JWT）和 UserRegistry 抽象层（Phase 1 写 data/users.json），前端新增登录页、FRE 向导（选 repo + 初始化 .team/）和 AuthProvider。

**Tech Stack:** Bun + Hono，@hono/jwt，React + TanStack Router，GitHub REST API

---

## 前置准备

在 GitHub 创建 OAuth App：
- 打开 https://github.com/settings/developers → New OAuth App
- Homepage URL: `http://localhost:5173`
- Authorization callback URL: `http://localhost:3001/auth/callback`
- 记录 Client ID 和 Client Secret

---

## Task 1：后端安装依赖 + 环境变量

**Files:**
- Modify: `kanban/backend/package.json`
- Create: `kanban/backend/.env.example`
- Create: `kanban/backend/.env`（本地用，不提交）

**Step 1: 安装依赖**

```bash
cd kanban/backend
bun add @hono/jwt jose
```

**Step 2: 确认安装成功**

```bash
bun run src/index.ts
# 应正常启动，无报错
```

**Step 3: 创建 `.env.example`**

```bash
# kanban/backend/.env.example
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
JWT_SECRET=your_random_32_char_secret
FRONTEND_URL=http://localhost:5173
PORT=3001
TEAM_DIR=../../.team
```

**Step 4: 创建本地 `.env`（填入真实值）**

```bash
# kanban/backend/.env
GITHUB_CLIENT_ID=<从 GitHub OAuth App 复制>
GITHUB_CLIENT_SECRET=<从 GitHub OAuth App 复制>
JWT_SECRET=<运行 openssl rand -hex 32 生成>
FRONTEND_URL=http://localhost:5173
PORT=3001
TEAM_DIR=../../.team
```

**Step 5: 确认 `.env` 在 `.gitignore` 中**

```bash
echo ".env" >> kanban/backend/.gitignore
```

**Step 6: Commit**

```bash
git add kanban/backend/package.json kanban/backend/.env.example kanban/backend/.gitignore
git commit -m "feat: add jwt dependencies and env config for auth"
```

---

## Task 2：UserRegistry 抽象层 + FileRegistry 实现

**Files:**
- Create: `kanban/backend/src/registry/types.ts`
- Create: `kanban/backend/src/registry/file-registry.ts`
- Create: `kanban/backend/data/users.json`（初始空文件）

**Step 1: 写 registry 类型定义**

```typescript
// kanban/backend/src/registry/types.ts
export interface Project {
  id: string
  repo_full_name: string
  repo_url: string
  added_at: string
  last_visited: string
}

export interface User {
  github_id: number
  login: string
  name: string
  avatar_url: string
  created_at: string
  projects: Project[]
}

export interface UserRegistry {
  findUser(githubId: number): Promise<User | null>
  saveUser(user: User): Promise<void>
  addProject(githubId: number, project: Omit<Project, 'id' | 'added_at' | 'last_visited'>): Promise<Project>
  removeProject(githubId: number, projectId: string): Promise<void>
  listProjects(githubId: number): Promise<Project[]>
  touchProject(githubId: number, projectId: string): Promise<void>
}
```

**Step 2: 写 FileRegistry 实现**

```typescript
// kanban/backend/src/registry/file-registry.ts
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import type { User, Project, UserRegistry } from './types'

export class FileRegistry implements UserRegistry {
  private filePath: string
  private data: { users: User[] }

  constructor(filePath: string) {
    this.filePath = filePath
    const dir = dirname(filePath)
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
    if (!existsSync(filePath)) {
      writeFileSync(filePath, JSON.stringify({ users: [] }, null, 2))
    }
    this.data = JSON.parse(readFileSync(filePath, 'utf-8'))
  }

  private save() {
    writeFileSync(this.filePath, JSON.stringify(this.data, null, 2))
  }

  async findUser(githubId: number): Promise<User | null> {
    return this.data.users.find(u => u.github_id === githubId) ?? null
  }

  async saveUser(user: User): Promise<void> {
    const idx = this.data.users.findIndex(u => u.github_id === user.github_id)
    if (idx >= 0) {
      this.data.users[idx] = { ...this.data.users[idx], ...user }
    } else {
      this.data.users.push(user)
    }
    this.save()
  }

  async addProject(githubId: number, info: Omit<Project, 'id' | 'added_at' | 'last_visited'>): Promise<Project> {
    const user = await this.findUser(githubId)
    if (!user) throw new Error('User not found')
    const project: Project = {
      ...info,
      id: `proj_${Date.now()}`,
      added_at: new Date().toISOString(),
      last_visited: new Date().toISOString(),
    }
    user.projects.push(project)
    this.save()
    return project
  }

  async removeProject(githubId: number, projectId: string): Promise<void> {
    const user = await this.findUser(githubId)
    if (!user) throw new Error('User not found')
    user.projects = user.projects.filter(p => p.id !== projectId)
    this.save()
  }

  async listProjects(githubId: number): Promise<Project[]> {
    const user = await this.findUser(githubId)
    return user?.projects ?? []
  }

  async touchProject(githubId: number, projectId: string): Promise<void> {
    const user = await this.findUser(githubId)
    if (!user) return
    const proj = user.projects.find(p => p.id === projectId)
    if (proj) {
      proj.last_visited = new Date().toISOString()
      this.save()
    }
  }
}
```

**Step 3: 创建初始 users.json**

```bash
mkdir -p kanban/backend/data
echo '{"users":[]}' > kanban/backend/data/users.json
echo "data/users.json" >> kanban/backend/.gitignore
```

**Step 4: Commit**

```bash
git add kanban/backend/src/registry/ kanban/backend/data/
git commit -m "feat: add UserRegistry abstraction and FileRegistry implementation"
```

---

## Task 3：后端 Auth 路由（GitHub OAuth + JWT 签发）

**Files:**
- Create: `kanban/backend/src/routes/auth.ts`
- Modify: `kanban/backend/src/index.ts`

**Step 1: 写 auth 路由**

```typescript
// kanban/backend/src/routes/auth.ts
import { Hono } from 'hono'
import { sign, verify } from 'hono/jwt'
import type { UserRegistry } from '../registry/types'

const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID!
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET!
const JWT_SECRET = process.env.JWT_SECRET!
const FRONTEND_URL = process.env.FRONTEND_URL ?? 'http://localhost:5173'

export function createAuthRouter(registry: UserRegistry) {
  const app = new Hono()

  // Step 1: 跳转 GitHub OAuth
  app.get('/github', (c) => {
    const params = new URLSearchParams({
      client_id: GITHUB_CLIENT_ID,
      scope: 'read:user repo',
      redirect_uri: `${c.req.url.split('/auth')[0]}/auth/callback`,
    })
    return c.redirect(`https://github.com/login/oauth/authorize?${params}`)
  })

  // Step 2: GitHub 回调
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
      headers: { Authorization: `Bearer ${access_token}`, 'User-Agent': 'jingxia-kanban' },
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
      { github_id: ghUser.id, login: ghUser.login, access_token, exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30 },
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
      return c.json({ ...user, access_token: undefined })
    } catch {
      return c.json({ error: 'Invalid token' }, 401)
    }
  })

  return app
}
```

**Step 2: 在 index.ts 中注册 auth 路由**

在 `kanban/backend/src/index.ts` 的 import 区添加：

```typescript
import { FileRegistry } from './registry/file-registry'
import { createAuthRouter } from './routes/auth'
import { join } from 'path'
```

在 `app.route('/api/tasks', tasksRouter)` 之前添加：

```typescript
const registry = new FileRegistry(join(import.meta.dir, '../../data/users.json'))
app.route('/auth', createAuthRouter(registry))
```

**Step 3: 手动测试 OAuth 流程**

```bash
cd kanban/backend && bun run src/index.ts
# 浏览器打开 http://localhost:3001/auth/github
# 应跳转到 GitHub 授权页
# 授权后应回调到 http://localhost:5173/auth/callback?token=xxx
```

**Step 4: Commit**

```bash
git add kanban/backend/src/routes/auth.ts kanban/backend/src/index.ts
git commit -m "feat: add GitHub OAuth login and JWT issuance"
```

---

## Task 4：后端 Projects API + GitHub Repos 代理

**Files:**
- Create: `kanban/backend/src/routes/projects.ts`
- Modify: `kanban/backend/src/index.ts`

**Step 1: 写 projects 路由**

```typescript
// kanban/backend/src/routes/projects.ts
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
    } catch (e: any) { return c.json({ error: e.message }, 401) }
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
      const headers = { Authorization: `Bearer ${payload.access_token}`, 'User-Agent': 'jingxia-kanban', 'Content-Type': 'application/json' }
      const base = `https://api.github.com/repos/${owner}/${repo}/contents`
      const readme = btoa(`# .team\n\nThis directory stores project data for Jingxia Kanban.\n\nFiles here are managed automatically. Do not edit manually.\n`)

      // 创建 .team/README.md
      await fetch(`${base}/.team/README.md`, {
        method: 'PUT', headers,
        body: JSON.stringify({ message: 'chore: initialize .team directory', content: readme }),
      })

      return c.json({ ok: true })
    } catch { return c.json({ error: 'Failed to initialize' }, 500) }
  })

  return app
}
```

**Step 2: 在 index.ts 注册**

在 `app.route('/auth', ...)` 后面添加：

```typescript
app.route('/api/projects', createProjectsRouter(registry))
```

**Step 3: Commit**

```bash
git add kanban/backend/src/routes/projects.ts kanban/backend/src/index.ts
git commit -m "feat: add projects API and GitHub repos proxy"
```

---

## Task 5：前端 AuthProvider + useAuth hook

**Files:**
- Create: `kanban/frontend/packages/app-core/src/auth.ts`
- Create: `kanban/frontend/packages/app-core/src/hooks/useAuth.ts`
- Modify: `kanban/frontend/packages/app-core/src/index.ts`（导出新增内容）

**Step 1: 写 auth 工具函数**

```typescript
// kanban/frontend/packages/app-core/src/auth.ts
const TOKEN_KEY = 'kanban_jwt'

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY)
}

export function isAuthenticated(): boolean {
  const token = getToken()
  if (!token) return false
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return payload.exp > Date.now() / 1000
  } catch { return false }
}

export function authHeaders(): Record<string, string> {
  const token = getToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}
```

**Step 2: 写 useAuth hook**

```typescript
// kanban/frontend/packages/app-core/src/hooks/useAuth.ts
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getToken, clearToken, isAuthenticated, authHeaders } from '../auth'

const API = '/api'

async function fetchMe() {
  const res = await fetch(`${API}/auth/me`, { headers: authHeaders() })
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
```

**Step 3: 在 app-core index.ts 导出**

在 `kanban/frontend/packages/app-core/src/index.ts` 末尾追加：

```typescript
export * from './auth'
export * from './hooks/useAuth'
```

**Step 4: Commit**

```bash
git add kanban/frontend/packages/app-core/src/auth.ts \
        kanban/frontend/packages/app-core/src/hooks/useAuth.ts \
        kanban/frontend/packages/app-core/src/index.ts
git commit -m "feat: add auth utilities and useAuth hook"
```

---

## Task 6：前端路由 — 登录页 + auth/callback 页

**Files:**
- Create: `kanban/frontend/packages/local-web/src/routes/login.tsx`
- Create: `kanban/frontend/packages/local-web/src/routes/auth.callback.tsx`
- Modify: `kanban/frontend/packages/local-web/src/routes/__root.tsx`

**Step 1: 写登录页**

```tsx
// kanban/frontend/packages/local-web/src/routes/login.tsx
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/login')({
  component: LoginPage,
})

function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950">
      <div className="text-center space-y-6">
        <div className="text-4xl font-bold text-white">Jingxia Kanban</div>
        <p className="text-gray-400">多人 · 多 Agent · Git-native 协作看板</p>
        <a
          href="/auth/github"
          className="inline-flex items-center gap-2 px-6 py-3 bg-white text-gray-900 rounded-lg font-medium hover:bg-gray-100 transition-colors"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
          </svg>
          使用 GitHub 登录
        </a>
      </div>
    </div>
  )
}
```

**Step 2: 写 auth callback 页（接收 token）**

```tsx
// kanban/frontend/packages/local-web/src/routes/auth.callback.tsx
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
      navigate({ to: '/login', search: { error: error ?? 'unknown' } })
    }
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950">
      <div className="text-gray-400">正在登录...</div>
    </div>
  )
}
```

**Step 3: 在 `__root.tsx` 加路由守卫**

在根组件中，检测未登录用户跳转到 `/login`：

```tsx
// 在 __root.tsx 的 RootComponent 函数中添加，在 return 之前：
import { isAuthenticated } from '@vibe/app-core'
import { useNavigate, useLocation } from '@tanstack/react-router'

// 在 RootComponent 内：
const navigate = useNavigate()
const location = useLocation()

useEffect(() => {
  const publicPaths = ['/login', '/auth/callback']
  if (!isAuthenticated() && !publicPaths.includes(location.pathname)) {
    navigate({ to: '/login' })
  }
}, [location.pathname])
```

**Step 4: 验证**

```bash
cd kanban/frontend && pnpm run local-web:dev
# 打开 http://localhost:5173
# 应跳转到 /login 页面
# 点击 "使用 GitHub 登录" 应跳转到 GitHub 授权页
```

**Step 5: Commit**

```bash
git add kanban/frontend/packages/local-web/src/routes/login.tsx \
        kanban/frontend/packages/local-web/src/routes/auth.callback.tsx \
        kanban/frontend/packages/local-web/src/routes/__root.tsx
git commit -m "feat: add login page, auth callback, and route guard"
```

---

## Task 7：前端 FRE — Repo 选择 + 初始化向导

**Files:**
- Create: `kanban/frontend/packages/local-web/src/routes/welcome.tsx`
- Modify: `kanban/frontend/packages/local-web/src/routes/__root.tsx`（检测是否需要 FRE）

**Step 1: 写 welcome（FRE）页**

```tsx
// kanban/frontend/packages/local-web/src/routes/welcome.tsx
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { authHeaders } from '@vibe/app-core'

export const Route = createFileRoute('/welcome')({
  component: WelcomePage,
})

type Step = 'welcome' | 'select-repo' | 'initializing' | 'done'

interface GithubRepo {
  id: number
  full_name: string
  html_url: string
  description: string | null
  updated_at: string
  private: boolean
}

function WelcomePage() {
  const navigate = useNavigate()
  const [step, setStep] = useState<Step>('welcome')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<GithubRepo | null>(null)

  const { data: repos, isLoading: loadingRepos } = useQuery<GithubRepo[]>({
    queryKey: ['github-repos'],
    queryFn: async () => {
      const res = await fetch('/api/projects/github/repos', { headers: authHeaders() })
      return res.json()
    },
    enabled: step === 'select-repo',
  })

  const bindMutation = useMutation({
    mutationFn: async (repo: GithubRepo) => {
      // 检查是否已初始化
      const statusRes = await fetch(
        `/api/projects/github/repos/${repo.full_name.replace('/', '/')}/init-status`,
        { headers: authHeaders() }
      )
      const { initialized } = await statusRes.json()

      if (!initialized) {
        // 初始化 .team/ 目录
        await fetch(
          `/api/projects/github/repos/${repo.full_name.split('/')[0]}/${repo.full_name.split('/')[1]}/init`,
          { method: 'POST', headers: authHeaders() }
        )
      }

      // 绑定项目
      await fetch('/api/projects', {
        method: 'POST',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ repo_full_name: repo.full_name, repo_url: repo.html_url }),
      })
    },
    onSuccess: () => navigate({ to: '/' }),
  })

  const filtered = repos?.filter(r =>
    r.full_name.toLowerCase().includes(search.toLowerCase())
  ) ?? []

  if (step === 'welcome') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="text-center space-y-6 max-w-md">
          <div className="text-3xl font-bold text-white">欢迎使用 Jingxia Kanban</div>
          <p className="text-gray-400">连接你的第一个 GitHub 项目，开始协作</p>
          <button
            onClick={() => setStep('select-repo')}
            className="px-6 py-3 bg-violet-600 text-white rounded-lg font-medium hover:bg-violet-500 transition-colors"
          >
            连接项目
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 p-4">
      <div className="w-full max-w-lg space-y-4">
        <div className="text-xl font-semibold text-white">选择 GitHub Repo</div>
        <input
          type="text"
          placeholder="搜索 repo..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full px-4 py-2 bg-gray-800 text-white rounded-lg border border-gray-700 focus:outline-none focus:border-violet-500"
        />
        {loadingRepos ? (
          <div className="text-gray-400 text-center py-8">加载中...</div>
        ) : (
          <div className="max-h-96 overflow-y-auto space-y-2">
            {filtered.map(repo => (
              <button
                key={repo.id}
                onClick={() => setSelected(repo)}
                className={`w-full text-left p-3 rounded-lg border transition-colors ${
                  selected?.id === repo.id
                    ? 'border-violet-500 bg-violet-500/10'
                    : 'border-gray-700 bg-gray-800 hover:border-gray-600'
                }`}
              >
                <div className="text-white font-medium">{repo.full_name}</div>
                {repo.description && (
                  <div className="text-gray-400 text-sm mt-1">{repo.description}</div>
                )}
              </button>
            ))}
          </div>
        )}
        <button
          onClick={() => selected && bindMutation.mutate(selected)}
          disabled={!selected || bindMutation.isPending}
          className="w-full py-3 bg-violet-600 text-white rounded-lg font-medium disabled:opacity-50 hover:bg-violet-500 transition-colors"
        >
          {bindMutation.isPending ? '正在初始化...' : '绑定这个项目'}
        </button>
      </div>
    </div>
  )
}
```

**Step 2: 在 `__root.tsx` 加 FRE 检测**

在路由守卫逻辑后追加：

```typescript
// 已登录但没有项目 → FRE
const { data: projects } = useQuery({
  queryKey: ['projects'],
  queryFn: async () => {
    const res = await fetch('/api/projects', { headers: authHeaders() })
    return res.json()
  },
  enabled: isAuthenticated() && !publicPaths.includes(location.pathname),
})

useEffect(() => {
  const frePaths = ['/login', '/auth/callback', '/welcome']
  if (isAuthenticated() && projects?.length === 0 && !frePaths.includes(location.pathname)) {
    navigate({ to: '/welcome' })
  }
}, [projects, location.pathname])
```

**Step 3: 验证完整流程**

```
1. 打开 http://localhost:5173 → 跳转 /login
2. 点击 GitHub 登录 → GitHub 授权 → 回调 → 跳转 /welcome
3. 点击"连接项目" → 看到 repo 列表
4. 选择一个 repo → 点击"绑定" → 初始化 .team/ → 跳转 /
5. 重新访问 → 直接进入看板（不再显示 FRE）
```

**Step 4: Commit**

```bash
git add kanban/frontend/packages/local-web/src/routes/welcome.tsx \
        kanban/frontend/packages/local-web/src/routes/__root.tsx
git commit -m "feat: add FRE welcome page with repo selection and .team/ init"
```

---

## Task 8：Vite 代理配置（把 /auth 和 /api/projects 代理到后端）

**Files:**
- Modify: `kanban/frontend/packages/local-web/vite.config.ts`

**Step 1: 读取当前 vite.config.ts，确认代理配置位置**

**Step 2: 确认 `/auth` 路径已被代理**

现有代理应已覆盖 `/api`，但需要确认 `/auth` 也被代理：

```typescript
// 在 vite.config.ts 的 server.proxy 中确认或添加：
proxy: {
  '/api': { target: 'http://localhost:3001', changeOrigin: true },
  '/auth': { target: 'http://localhost:3001', changeOrigin: true },
}
```

**Step 3: 验证代理**

```bash
curl http://localhost:5173/auth/github
# 应该重定向到 GitHub，不是 404
```

**Step 4: Commit**

```bash
git add kanban/frontend/packages/local-web/vite.config.ts
git commit -m "feat: proxy /auth routes to backend in vite dev server"
```
