# Auth + FRE + GitHub 连接 Design

**Date:** 2026-02-27
**Status:** Approved

---

## Goal

为 kanban 服务添加用户登录、首次运行体验（FRE）和 GitHub repo 绑定能力。这是后续所有多用户、多项目功能的基础层。

---

## 范围

本设计仅覆盖：
1. GitHub OAuth 登录
2. FRE（首次运行体验）
3. 用户 + GitHub repo 绑定的存储

**不在本设计范围内：** kanban 操作、Agent Auth、实时同步。

---

## 第一节：用户登录（GitHub OAuth）

### 流程

```
用户点击 "Login with GitHub"
  → 跳转 github.com/login/oauth/authorize
     （scope: read:user, repo）
  → 用户授权
  → GitHub 回调 /auth/callback?code=xxx
  → 服务端用 code 换 access_token
  → 读取用户信息（github_id, login, avatar_url, name）
  → 签发 JWT
  → 前端存 JWT → 进入 FRE 或主界面
```

### JWT Payload

```json
{
  "github_id": 12345678,
  "login": "iamtouchskyer",
  "access_token": "gho_xxx",
  "iat": 1234567890,
  "exp": 1234567890
}
```

- 过期时间：30 天
- 存储：前端 `localStorage`
- 续签：过期前 7 天内自动续签

### 后端环境变量

```
GITHUB_CLIENT_ID=xxx
GITHUB_CLIENT_SECRET=xxx
JWT_SECRET=xxx
FRONTEND_URL=http://localhost:5173
```

---

## 第二节：FRE（首次运行体验）

### 路由逻辑

```
登录成功
  ↓
检查用户是否有绑定项目
  ├── 有 → /projects（项目列表页）
  └── 无 → /welcome（FRE 三步引导）
```

### FRE 三步

**Step 1 — 欢迎**
- 展示用户 GitHub 头像 + 名字
- 一个 CTA 按钮："连接你的第一个项目"

**Step 2 — 选择 Repo**
- 调用 GitHub API 拉取用户所有 repo（个人 + org）
- 展示可搜索列表（按最近更新排序）
- 用户选择一个 repo，点击"绑定"

**Step 3 — 初始化**
- 检查 repo 是否已有 `.team/` 目录
  - 有 → 提示"已检测到现有项目数据" → 直接进入看板
  - 无 → 提示"将在此 repo 初始化 `.team/` 目录" → 确认后创建 → 进入看板

### Repo 拉取 API

```
GET https://api.github.com/user/repos
  ?sort=updated&per_page=100&affiliation=owner,collaborator,organization_member

如果用户有 org：
GET https://api.github.com/orgs/{org}/repos?per_page=100
```

### `.team/` 初始化内容

```
.team/
  tasks/        （空目录，放 .gitkeep）
  sprints/      （空目录）
  people/       （空目录）
  README.md     （说明这个目录的作用）
```

---

## 第三节：存储（Phase 1 → Supabase）

### Phase 1：`data/users.json`

```json
{
  "users": [
    {
      "github_id": 12345678,
      "login": "iamtouchskyer",
      "name": "Jingxia Xing",
      "avatar_url": "https://avatars.githubusercontent.com/u/12345678",
      "created_at": "2026-02-27T07:00:00Z",
      "projects": [
        {
          "id": "proj_abc123",
          "repo_full_name": "iamtouchskyer/my-project",
          "repo_url": "https://github.com/iamtouchskyer/my-project",
          "added_at": "2026-02-27T07:00:00Z",
          "last_visited": "2026-02-27T08:00:00Z"
        }
      ]
    }
  ]
}
```

### 抽象层

```typescript
interface UserRegistry {
  findUser(githubId: number): Promise<User | null>
  saveUser(user: User): Promise<void>
  addProject(githubId: number, project: Project): Promise<void>
  removeProject(githubId: number, projectId: string): Promise<void>
  listProjects(githubId: number): Promise<Project[]>
}

class FileRegistry implements UserRegistry { /* 读写 data/users.json */ }
class SupabaseRegistry implements UserRegistry { /* Phase 2 */ }
```

### Phase 2 迁移

- Supabase 建两张表：`users` + `projects`
- 一键脚本从 `users.json` 导入
- 只换 `FileRegistry` → `SupabaseRegistry`，其余代码不动

---

## API 端点

```
GET  /auth/github           → 跳转 GitHub OAuth
GET  /auth/callback         → 处理回调，返回 JWT
GET  /auth/me               → 当前用户信息（需要 JWT）
POST /auth/logout           → 清除 session

GET  /api/projects          → 用户的项目列表
POST /api/projects          → 绑定新项目
DELETE /api/projects/:id    → 解绑项目

GET  /api/github/repos      → 拉取用户 GitHub repo 列表（代理）
GET  /api/github/repos/:owner/:repo/init-status → 检查 .team/ 是否存在
POST /api/github/repos/:owner/:repo/init        → 初始化 .team/ 目录
```

---

## 技术决策

| 决策 | 选择 | 原因 |
|------|------|------|
| Auth 方式 | GitHub OAuth | 天然对齐 repo 权限 |
| Session | JWT（30天）| 无服务端状态 |
| 存储 Phase 1 | `data/users.json` | 零依赖，与项目哲学一致 |
| 存储 Phase 2 | Supabase | 抽象层已隔离，随时可切换 |
| JWT 存储 | localStorage | 简单，kanban 无跨域需求 |
