# pi-superpowers

> Superpowers 工作流技能库的 Pi 平台移植版，含中文触发支持

**pi-superpowers** 将 [obra/superpowers](https://github.com/obra/superpowers) 的 14 个专业工作流技能移植到 [Pi](https://github.com/badlogic/pi) 编程助手平台，并添加了：

- 🇨🇳 **中文触发词**：每个技能均支持中英双语触发，中文提问自动匹配对应技能
- 🔌 **Bootstrap 扩展**：每次会话启动时自动将技能使用规则注入上下文
- 🔧 **工具映射**：自动将原 Claude Code 工具（`Skill`、`TodoWrite`、`Task`）映射到 Pi 等价操作
- 🤖 **`dispatch_agent` 工具**：模拟 Claude Code 的 `Task` 子代理，通过 `pi --no-session --print` 子进程实现上下文隔离
- ⚡ **提示模板**：3个斜杠命令（`/brainstorm`等）

---

## 目录

- [技能一览](#技能一览)
- [典型工作流](#典型工作流)
- [提示模板命令](#提示模板命令)
- [工具映射参考](#工具映射参考)
- [dispatch_agent 工具](#dispatch_agent-工具)
- [Bootstrap 注入机制](#bootstrap-注入机制)
- [已知限制](#已知限制)
- [安装](#安装)

---

## 技能一览

安装后共提供 **14 个技能**，技能描述涵盖中英文关键词，Pi 在收到匹配请求时自动加载对应技能。

也可通过 `/skill:<name>` 命令强制加载任意技能。

### 开发流程类

| 技能 | 触发场景 | 中文关键词示例 |
|------|---------|--------------|
| `brainstorming` | 实现新功能/组件前的需求分析与方案设计 | 头脑风暴、做一个新功能、从哪里开始、需求分析 |
| `writing-plans` | 将需求拆解为细粒度实现步骤 | 写计划、制定开发计划、拆分任务、做规划 |
| `subagent-driven-development` | 按实现计划执行多个独立任务 | 执行计划、开始实现、逐任务执行 |
| `executing-plans` | 批次执行已有书面计划 | 按计划实现、批次执行任务 |
| `test-driven-development` | 实现任何功能或修复 bug 前 | TDD、测试驱动开发、先写测试、测试优先 |
| `using-git-worktrees` | 需要与当前工作区隔离时 | git worktree、隔离开发、新分支开发 |
| `dispatching-parallel-agents` | 面临 2+ 个可并行的独立任务 | 并行处理、多任务并发、同时修复多个问题 |
| `verification-before-completion` | 即将声明任务完成前 | 验证完成、声明完成前、提交前验证 |

### 质量保障类

| 技能 | 触发场景 | 中文关键词示例 |
|------|---------|--------------|
| `systematic-debugging` | 遇到 bug、测试失败或意外行为 | 调试、找 bug、修复问题、测试失败、根本原因分析 |
| `requesting-code-review` | 完成任务或合并前的代码审查 | 代码审查、code review、审查代码、提交前审查 |
| `receiving-code-review` | 收到审查意见后的处理流程 | 处理审查意见、回应评审、技术反驳 |
| `finishing-a-development-branch` | 实现完成、测试通过，准备集成 | 完成分支、提 PR、合并代码、结束开发 |

### 元技能类

| 技能 | 触发场景 | 中文关键词示例 |
|------|---------|--------------|
| `using-superpowers` | 每次对话开始（由 Bootstrap 扩展自动注入） | 自动触发，无需手动 |
| `writing-skills` | 创建或修改技能文件 | 写 skill、创建新技能、设计工作流技能 |

---

## 典型工作流

### 1. 完整功能开发流程

```
你：帮我做一个用户权限管理模块
 └→ AI 自动加载 brainstorming 技能，开始需求分析
    ↓ 探索需求、提出多种方案、获得确认
你：好，按这个方案来
 └→ AI 自动加载 writing-plans 技能，拆解实现步骤
    ↓ 生成每步 2-5 分钟颗粒度的计划
你：开始实现
 └→ AI 自动加载 subagent-driven-development / executing-plans 技能
    ↓ 按 TDD 循环逐任务实现（先写测试，再实现，审查通过后继续）
你：全部完成了
 └→ AI 自动加载 verification-before-completion 技能，运行验证命令
    ↓ 确认通过后加载 finishing-a-development-branch，决定合并方式
```

### 2. Bug 调试流程

```
你：测试报错了，TypeError: Cannot read property 'id' of undefined
 └→ AI 自动加载 systematic-debugging 技能
    ↓ 系统性根因分析：确认症状 → 隔离范围 → 找最小复现 → 修复
    ↓ 修复前必须先写能复现 bug 的失败测试（TDD）
```

### 3. 强制使用斜杠命令

当自动触发不可靠时，直接用 `/skill:` 命令强制加载：

```
/skill:brainstorming          # 强制启动需求分析
/skill:test-driven-development  # 强制进入 TDD 模式
/skill:systematic-debugging     # 强制系统性调试
/skill:verification-before-completion  # 强制验证完成
```

### 4. 中文对话示例

| 你说的话 | 自动触发技能 |
|---------|-----------|
| "帮我做一个登录功能" | `brainstorming`（功能开发前分析） |
| "这个测试一直失败，帮我看看" | `systematic-debugging` |
| "用测试驱动开发这个接口" | `test-driven-development` |
| "代码写完了，帮我 review 一下" | `requesting-code-review` |
| "我要提交 PR 了" | `verification-before-completion` → `finishing-a-development-branch` |
| "有三个不相关的 bug 要修" | `dispatching-parallel-agents` |

---

## 提示模板命令

提示模板用 `/` 前缀触发，强制执行对应技能的完整流程：

| 命令 | 说明 |
|------|-----|
| `/brainstorm` | 启动需求分析和方案设计流程，禁止 AI 在确认前写代码 |
| `/write-plan` | 将已确认的方案拆解为精细实现步骤 |
| `/execute-plan` | 批次执行已有计划，每批次后汇报并等待反馈 |

**用法示例：**
```
/brainstorm 我想做一个实时聊天室
/write-plan
/execute-plan
```

---

## 工具映射参考

Pi 的工具名称与原 Claude Code 存在差异，Bootstrap 扩展会将以下映射注入系统提示，AI 会自动换用 Pi 等价工具：

| 原 Claude Code 工具 | Pi 中的替代方案 |
|--------------------|--------------|
| `Skill` tool | `read` 工具读取 `skills/<name>/SKILL.md`，或使用 `/skill:<name>` 命令 |
| `TodoWrite` | `write`/`edit` 工具操作项目根目录的 `TODO.md`（Markdown 复选框格式） |
| `Task`（子代理派发）| **方案 A（降级）顺序执行模式**：在当前对话中逐任务实现，每任务后切换角色审查；**方案 B（推荐）`dispatch_agent` 工具**：通过 `pi --no-session --print` 子进程实现真正的上下文隔离（见下方说明） |
| `Read` | `read`（同名，直接使用）|
| `Write` | `write`（同名，直接使用）|
| `Edit` | `edit`（同名，直接使用）|
| `Bash` | `bash`（同名，直接使用）|

### 子代理执行模式

原 superpowers 的 `subagent-driven-development` 技能依赖 `Task` 工具派发独立子代理。pi-superpowers 提供两种替代方案：

#### 方案 A：顺序执行降级模式（无需额外工具）

在当前对话中按顺序逐任务执行，通过角色切换模拟多视角：

```
1. 实现角色（Implementer）：实现任务 → 写测试 → 自我审查 → 提交
2. Spec 审查角色（Spec Reviewer）：用 read 工具独立验证，不信任实现报告
3. 质量审查角色（Code Quality Reviewer）：审查代码质量（仅 Spec 通过后）
4. 修复问题 → 重新审查 → 通过后处理下一任务
```

任务状态用 `TODO.md` 文件追踪：
```markdown
- [x] Task 1: 实现用户模型
- [ ] Task 2: 实现认证中间件
- [ ] Task 3: 实现登录接口
```

---

## dispatch_agent 工具

#### 方案 B：`dispatch_agent` 工具（推荐，需要 `pi` 在 PATH 中）

`dispatch_agent` 是 pi-superpowers 注册的自定义工具（`extensions/subagent.ts`），通过启动 `pi --no-session --print` 子进程实现真正的上下文隔离，与 Claude Code 的 `Task` 工具行为一致。

**LLM 调用示例：**
```
dispatch_agent({
  task: "实现用户认证中间件，要求：1) 验证 JWT 2) 处理过期 3) 写单元测试",
  role: "implementer"
})
```

**支持的角色（`role` 参数）：**

| 角色 | 说明 |
|------|------|
| `implementer` | 实现任务、编写测试、自我审查 |
| `spec-reviewer` | 独立验证实现是否符合规格（批判性视角） |
| `code-quality-reviewer` | 审查代码质量，仅在 Spec 审查通过后运行 |
| _(省略)_ | 无角色限制的通用子代理 |

**底层实现：**
```bash
# role = "implementer" 时等价于：
pi --no-session --print \
   --append-system-prompt "You are a implementer." \
   "实现用户认证中间件，要求：..."
```

**先决条件**：`pi` 二进制需在 `$PATH` 中可访问。若未找到，工具返回清晰的错误信息而不会崩溃。

---

## Bootstrap 注入机制

**问题**：原 superpowers 通过 Claude Code 的 `SessionStart` Hook 在每次会话开始时自动注入 `using-superpowers` 内容，Pi 没有此 Hook。

**解决方案**：pi-superpowers 提供两个 Pi 扩展：

| 扩展文件 | 作用 |
|---------|------|
| `extensions/bootstrap.ts` | 每次会话第一条消息前，将 `using-superpowers` 规则注入系统提示 |
| `extensions/subagent.ts` | 注册 `dispatch_agent` 工具，替代 Claude Code 的 `Task` 子代理 |

`bootstrap.ts` 的注入流程：

```
用户发送第一条消息
      ↓
before_agent_start 触发
      ↓
检测是否为本 session 的第一个用户 turn？
  是 → 读取 using-superpowers/SKILL.md
      → 组装 <EXTREMELY_IMPORTANT> 注入块
      → 追加到 systemPrompt
      → 标记本 session 已注入（避免后续 turn 重复注入）
  否 → 不注入
      ↓
AI 在本次响应中遵循 using-superpowers 规则
```

注入内容包含：
- `using-superpowers` 技能全文（技能使用规则、优先级、红旗清单）
- Pi 平台工具映射表（替代 Skill/TodoWrite/Task 的方法）

---

## 已知限制

| 限制 | 影响 | 缓解措施 |
|------|------|---------|
| 无内置子代理（`Task` 工具不可用） | `subagent-driven-development` 无法真正并行执行 | **已通过 `dispatch_agent` 工具解决**：`extensions/subagent.ts` 通过 `pi --no-session --print` 子进程实现上下文隔离；降级方案：顺序执行模式 |
| 无 `TodoWrite` 工具 | 任务进度无法用原生 UI 显示 | 用 `TODO.md` 文件追踪，功能等价 |
| `before_agent_start` 每次都触发 | 需要检测是否已注入 | Bootstrap 扩展用 session ID + turn 计数双重检测 |
| `using-superpowers` 中的流程图依赖 Graphviz | Dot 语法代码块无法在 Pi TUI 中渲染 | 图表仍可作为文字逻辑参考，不影响功能 |

---

## 安装

### 方式一：npm 安装（推荐）

```bash
# 全局安装（所有项目可用）
pi install npm:@weiping/pi-superpowers

# 项目级安装（仅当前项目，可提交给团队共享）
pi install -l npm:@weiping/pi-superpowers
```

安装后**重启 Pi** 使更改生效。

---

### 方式二：Git 安装

```bash
# 从 GitHub 安装最新版
pi install https://github.com/weiping/pi-superpowers

# 锁定到指定版本（pi update 不会自动升级）
pi install https://github.com/weiping/pi-superpowers@v1.0.0
```

---

### 方式三：提示词自动安装

在 Pi 会话中粘贴以下提示词，Pi 将自动完成安装：

```
Run: pi install npm:@weiping/pi-superpowers, then tell me the install is complete and I need to restart Pi.
```

---

### 方式四：本地路径安装

```bash
# 全局安装
pi install /path/to/pi-superpowers

# 项目级安装
pi install -l /path/to/pi-superpowers
```

详见 [INSTALL.md](INSTALL.md)。

---

### OpenClaw 安装

如果你使用 [OpenClaw](https://openclaw.ai)：

```bash
openclaw plugins install @weiping/openclaw-superpowers
```

---

## 许可证

MIT。  
原始 superpowers 项目由 [Jesse Vincent](https://github.com/obra) 创作，同样采用 MIT 许可证。
