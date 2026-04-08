# Superpowers → Pi 平台移植方案

**文档日期**：2026-02-27  
**目标版本**：Superpowers v4.3.1 → Pi Package `pi-superpowers`

---

## 0. 执行摘要

Superpowers 是基于 Claude Code / Cursor / Codex / OpenCode 的 Skills 工作流库，Pi 是遵循同一 [Agent Skills 标准](https://agentskills.io/specification) 的终端编程助手。两者在 Skills 格式上高度兼容，但在 **Bootstrap 注入机制**、**工具名映射** 和 **子代理支持** 上存在差异。

本方案采用分三阶段的渐进式移植策略：

| 阶段 | 内容 | 工作量 | 收益 |
|------|------|--------|------|
| **Phase 1** | Skills 直通 + Bootstrap Extension | 1-2 天 | 核心 Skills 可用 |
| **Phase 2** | 中文触发 + 提示模板 | 1 天 | 中文用户完整体验 |
| **Phase 3** | Pi Package 发布 + 顺序子代理 | 2-3 天 | 完整功能 + 可分发 |

---

## 1. 平台差异深度对比

### 1.1 兼容性矩阵

| 能力 | Superpowers（Claude Code） | Pi | 兼容状态 |
|------|--------------------------|-----|---------|
| SKILL.md 格式 | ✅ Agent Skills 标准 | ✅ Agent Skills 标准 | **完全兼容** |
| `~/.agents/skills/` 目录 | ✅（Codex 模式） | ✅ 自动扫描 | **完全兼容** |
| Session 启动注入 | SessionStart Hook（JSON） | `before_agent_start` 扩展事件 | **需要扩展适配** |
| `Skill` 工具（LLM 调用） | ✅ 原生 | 用 `read` 工具读 SKILL.md | **需要映射** |
| `TodoWrite` 工具 | ✅ 原生 | ❌ 无对应工具 | **需要替代方案** |
| `Task` 工具（子代理） | ✅ 原生 | ❌ 无内置子代理 | **功能降级/重实现** |
| `Read/Write/Edit/Bash` | ✅ | ✅ 同名工具 | **完全兼容** |
| Slash Commands | `/plugin` 系统 | `/skill:name` + 提示模板 | **需要映射** |
| Agents（角色定义） | `agents/` 目录 | ❌ 无此概念 | **转为 Skill 或 Prompt** |
| 计划模式（Plan Mode） | `EnterPlanMode` 拦截 | ❌ Pi 无计划模式 | **可忽略** |
| 扩展/插件系统 | Claude Code Plugin | TypeScript Extension | **需要重写扩展** |

### 1.2 Bootstrap 注入机制对比

```
Superpowers (Claude Code):                  Pi (移植后):
─────────────────────────────               ──────────────────────────────
SessionStart Hook 触发                        before_agent_start 事件触发
    │                                              │
    ▼                                              ▼
run-hook.cmd → session-start (bash)          bootstrap.ts Extension
    │                                              │
    ▼                                              ▼
输出 JSON additionalContext                   返回 { systemPrompt: ... }
    │                                              │
    ▼                                              ▼
LLM 在第一条消息前看到 using-superpowers       LLM 每次 prompt 前看到 using-superpowers
```

**关键差异**：Pi 的 `before_agent_start` 每次用户发送 prompt 都会触发（非仅 session 启动），需要避免重复注入。解决方案：仅在第一次 turn（`ctx.sessionManager.getBranch().length <= 1`）时注入，或通过自定义消息类型检测是否已注入。

### 1.3 工具名映射表

| Superpowers 工具 | Pi 平台替代方案 | Skill 中需要的文字修改 |
|-----------------|--------------|----------------------|
| `Skill` tool | `read` 工具读取 SKILL.md 文件路径，或用 `/skill:name` 命令 | 在 using-superpowers 中添加 Pi 工具映射说明 |
| `TodoWrite` | `write`/`edit` 工具操作 `TODO.md` 文件 | 提供 Pi 专用替代说明 |
| `Task`（子代理） | 方案 A：顺序执行（Phase 1）<br>方案 B：`bash` 工具启动 `pi --print` 子进程（Phase 3）| subagent-driven-development Skill 添加 Pi 适配注释 |
| `Read` | `read`（同名） | ✓ 无需修改 |
| `Write` | `write`（同名） | ✓ 无需修改 |
| `Edit` | `edit`（同名） | ✓ 无需修改 |
| `Bash` | `bash`（同名） | ✓ 无需修改 |

---

## 2. Phase 1：核心移植（1-2 天）

### 2.1 包目录结构

```
pi-superpowers/                    ← Pi Package 根目录
├── package.json                   ← Pi 包清单
├── README.md
├── extensions/
│   └── bootstrap.ts               ← Bootstrap 注入扩展（替代 SessionStart Hook）
├── skills/                        ← 复制自 superpowers/skills（含中文 description 改写）
│   ├── using-superpowers/
│   │   └── SKILL.md               ← 添加 Pi 工具映射 + 中文触发
│   ├── brainstorming/
│   │   └── SKILL.md               ← 添加中文 description
│   ├── writing-plans/
│   │   └── SKILL.md
│   ├── subagent-driven-development/
│   │   ├── SKILL.md               ← 添加 Pi 顺序执行模式说明
│   │   ├── implementer-prompt.md
│   │   ├── spec-reviewer-prompt.md
│   │   └── code-quality-reviewer-prompt.md
│   ├── executing-plans/
│   │   └── SKILL.md
│   ├── test-driven-development/
│   │   ├── SKILL.md
│   │   └── testing-anti-patterns.md
│   ├── systematic-debugging/
│   │   ├── SKILL.md
│   │   ├── root-cause-tracing.md
│   │   ├── defense-in-depth.md
│   │   └── condition-based-waiting.md
│   ├── requesting-code-review/
│   │   ├── SKILL.md
│   │   └── code-reviewer.md
│   ├── finishing-a-development-branch/
│   │   └── SKILL.md
│   ├── using-git-worktrees/
│   │   └── SKILL.md
│   ├── dispatching-parallel-agents/
│   │   └── SKILL.md
│   ├── verification-before-completion/
│   │   └── SKILL.md
│   ├── writing-skills/
│   │   ├── SKILL.md
│   │   └── ...（其余辅助文件）
│   └── receiving-code-review/
│       └── SKILL.md
└── prompts/                       ← 替代 superpowers/commands/
    ├── brainstorm.md              ← /brainstorm 触发头脑风暴
    ├── 头脑风暴.md                 ← /头脑风暴 中文别名
    ├── write-plan.md
    ├── 写计划.md
    ├── execute-plan.md
    └── 执行计划.md
```

### 2.2 `package.json` 规范

```json
{
  "name": "pi-superpowers",
  "version": "1.0.0",
  "description": "Superpowers skills library for Pi: TDD, debugging, collaboration workflows with Chinese trigger support",
  "keywords": ["pi-package", "skills", "tdd", "debugging", "workflow", "chinese"],
  "author": "Ported from obra/superpowers by Jesse Vincent",
  "license": "MIT",
  "repository": "https://github.com/your-org/pi-superpowers",
  "pi": {
    "extensions": ["./extensions"],
    "skills": ["./skills"],
    "prompts": ["./prompts"]
  },
  "peerDependencies": {
    "@mariozechner/pi-coding-agent": "*"
  }
}
```

### 2.3 Bootstrap 扩展实现（`extensions/bootstrap.ts`）

Bootstrap 扩展负责在每次对话开始时将 `using-superpowers` 内容注入 LLM 系统提示，替代原有的 SessionStart Hook 机制。

```typescript
/**
 * pi-superpowers bootstrap extension
 *
 * Injects using-superpowers skill content into the system prompt at the start
 * of each conversation (equivalent to Superpowers' SessionStart hook for Claude Code).
 *
 * Injection strategy:
 * - Uses before_agent_start event (fires before each LLM call)
 * - Detects first user turn via branch length to avoid re-injection on follow-ups
 * - Returns { systemPrompt } to append to the existing system prompt
 */

import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Track whether bootstrap was injected this session
let bootstrapInjectedSessionId: string | undefined;

/**
 * Strip YAML frontmatter from SKILL.md content
 */
function stripFrontmatter(content: string): string {
  return content.replace(/^---[\s\S]*?---\n+/, "").trim();
}

/**
 * Build the Pi-specific tool mapping note to append to using-superpowers content.
 * Informs LLM about Pi's tool name differences from Claude Code.
 */
function buildPiToolMapping(skillsDir: string): string {
  return `
---

## Pi 平台工具映射（Pi Platform Tool Mapping）

当 skills 提到以下工具时，在 Pi 中使用对应替代：

| Skills 中的工具 | Pi 中的替代方案 |
|---------------|--------------|
| \`Skill\` 工具 | 使用 \`read\` 工具读取技能文件（路径：\`${skillsDir}/<skill-name>/SKILL.md\`），或在编辑器输入 \`/skill:<name>\` 命令加载技能 |
| \`TodoWrite\` | 使用 \`write\`/\`edit\` 工具操作项目根目录的 \`TODO.md\` 文件，用 Markdown 复选框格式记录任务 |
| \`Task\`（子代理派发）| Pi 暂无内置子代理。使用 **顺序执行模式**：在当前对话中逐任务实现，每任务完成后进行审查再继续。详见 \`subagent-driven-development\` skill 的 Pi 适配章节 |
| \`Read\` | \`read\` 工具（同名，直接使用）|
| \`Write\` | \`write\` 工具（同名，直接使用）|
| \`Edit\` | \`edit\` 工具（同名，直接使用）|
| \`Bash\` | \`bash\` 工具（同名，直接使用）|

**Skills 位置**：本次会话中 superpowers skills 已加载，可直接用 \`/skill:<name>\` 调用。
`;
}

export default function (pi: ExtensionAPI) {
  pi.on("before_agent_start", async (event, ctx) => {
    // Detect session identity to avoid re-injecting on every turn
    const sessionFile = ctx.sessionManager.getSessionFile() ?? "ephemeral";
    if (bootstrapInjectedSessionId === sessionFile) {
      return {}; // Already injected for this session
    }

    // Only inject on the very first user turn of a session
    // (branch length = 0 means no prior messages exist)
    const branchEntries = ctx.sessionManager.getBranch();
    const existingUserMessages = branchEntries.filter(
      (e) => e.type === "message" && (e.message as any)?.role === "user"
    );
    if (existingUserMessages.length > 0) {
      return {}; // Not the first turn
    }

    // Locate using-superpowers SKILL.md (relative to this extension)
    const skillPath = path.resolve(__dirname, "../skills/using-superpowers/SKILL.md");

    if (!fs.existsSync(skillPath)) {
      ctx.ui.notify("pi-superpowers: using-superpowers skill not found", "warning");
      return {};
    }

    try {
      const rawContent = fs.readFileSync(skillPath, "utf8");
      const skillBody = stripFrontmatter(rawContent);
      const skillsDir = path.resolve(__dirname, "../skills");
      const toolMapping = buildPiToolMapping(skillsDir);

      const bootstrapContent = `<EXTREMELY_IMPORTANT>
你拥有超级能力（You have superpowers）。

以下是你的 'superpowers:using-superpowers' 技能的完整内容。它已经加载，你正在遵循它。
**不要** 再次用 \`read\` 工具加载 using-superpowers，那会重复。

${skillBody}

${toolMapping}
</EXTREMELY_IMPORTANT>`;

      // Mark this session as injected
      bootstrapInjectedSessionId = sessionFile;

      return {
        systemPrompt: event.systemPrompt + "\n\n" + bootstrapContent,
      };
    } catch (err) {
      ctx.ui.notify(`pi-superpowers: bootstrap error: ${err}`, "error");
      return {};
    }
  });

  // Notify on load in interactive mode
  pi.on("session_start", async (_event, ctx) => {
    // Reset injection tracking for new sessions
    bootstrapInjectedSessionId = undefined;
    ctx.ui.notify("pi-superpowers loaded ✓ (superpowers skills available)", "info");
  });
}
```

---

## 3. Phase 2：中文触发支持（1 天）

### 3.1 中文触发关键词设计原则

Pi 的 Skills 发现机制：系统提示中列出所有 skill 的 `description`，由 LLM 判断是否加载。因此，在 `description` 字段中加入中文关键词，LLM 在收到中文请求时就能识别并自动加载对应 skill。

**约束**：`description` 字段总长不超过 1024 字符，且根据 superpowers `writing-skills/SKILL.md` 的 CSO 设计原则，**description 只写触发条件，不写流程**。

### 3.2 各 Skill 双语 Description 改写方案

以下为完整的中英双语 `description` 改写方案，保持原有英文触发不变，在末尾追加中文触发词：

#### `using-superpowers`
```yaml
description: >
  Use when starting any conversation - establishes how to find and use skills,
  requiring Skill tool invocation before ANY response including clarifying questions.
  开始任何对话时使用 - 建立如何查找和使用技能的规则。
```

#### `brainstorming`
```yaml
description: >
  You MUST use this before any creative work - creating features, building components,
  adding functionality, or modifying behavior. Explores user intent, requirements and
  design before implementation.
  在任何创意工作前必须使用 - 创建功能、构建组件、添加功能或修改行为前。
  用于：需求分析、功能设计、方案制定、头脑风暴、做一个新功能、想做什么、从哪里开始。
```

#### `writing-plans`
```yaml
description: >
  Use when you have a spec or requirements for a multi-step task, before touching code.
  当你有规格或要求需要执行多步骤任务时使用，在编写代码之前。
  用于：写实现计划、制定计划、做规划、拆分任务。
```

#### `subagent-driven-development`
```yaml
description: >
  Use when executing implementation plans with independent tasks in the current session.
  在当前会话中执行有独立任务的实现计划时使用。
  用于：执行计划、子代理开发、自动实现、开始实现计划。
```

#### `executing-plans`
```yaml
description: >
  Use when you have a written implementation plan to execute in a separate session
  with review checkpoints.
  有书面实现计划需要批次执行时使用。
  用于：执行已有计划、按计划实现、批次执行任务。
```

#### `test-driven-development`
```yaml
description: >
  Use when implementing any feature or bugfix, before writing implementation code.
  实现任何功能或修复错误时使用，在编写实现代码之前。
  用于：TDD、测试驱动开发、先写测试、测试优先、写单元测试、红绿重构。
```

#### `systematic-debugging`
```yaml
description: >
  Use when encountering any bug, test failure, or unexpected behavior,
  before proposing fixes.
  遇到任何错误、测试失败或意外行为时使用，在提出修复方案之前。
  用于：调试、找 bug、修复问题、测试失败、排查错误、系统性调试、根本原因分析。
```

#### `requesting-code-review`
```yaml
description: >
  Use when completing tasks, implementing major features, or before merging
  to verify work meets requirements.
  完成任务、实现主要功能或合并前验证工作是否满足要求时使用。
  用于：代码审查、code review、审查代码、检查代码质量、提交前审查。
```

#### `finishing-a-development-branch`
```yaml
description: >
  Use when implementation is complete, all tests pass, and you need to decide
  how to integrate the work.
  实现完成、所有测试通过，需要决定如何集成工作时使用。
  用于：完成分支、合并分支、结束开发、提 PR、合并代码、完成功能。
```

#### `using-git-worktrees`
```yaml
description: >
  Use when starting feature work that needs isolation from current workspace or
  before executing implementation plans.
  开始需要与当前工作区隔离的功能工作时，或执行实现计划前使用。
  用于：git worktree、创建隔离工作区、新分支开发、隔离开发环境。
```

#### `dispatching-parallel-agents`
```yaml
description: >
  Use when facing 2+ independent tasks that can be worked on without shared state
  or sequential dependencies.
  面临 2 个以上可并行处理的独立任务时使用。
  用于：并行处理、多任务并发、独立任务分发、并行修复多个问题。
```

#### `verification-before-completion`
```yaml
description: >
  Use when about to claim work is complete, fixed, or passing, before committing
  or creating PRs - requires running verification commands.
  即将声明工作完成、修复或通过时使用，提交或创建 PR 之前。
  用于：验证完成、确认完成、声明完成前、检查结果、提交前验证。
```

#### `writing-skills`
```yaml
description: >
  Use when creating new skills, editing existing skills, or verifying skills
  work before deployment.
  创建新技能、编辑现有技能或在部署前验证技能时使用。
  用于：写 skill、创建技能、添加新技能、设计工作流技能。
```

### 3.3 中文提示模板（`prompts/` 目录）

替代 superpowers 的 `commands/` 目录，在 Pi 中以 `/template-name` 方式触发：

**`prompts/头脑风暴.md`**
```markdown
---
description: 在开始创建功能或编写代码之前，进行需求分析和方案设计
---
使用 superpowers:brainstorming 技能，完整执行头脑风暴流程：探索需求、分析方案、获得用户确认后再开始实现。
```

**`prompts/写计划.md`**
```markdown
---
description: 根据已确认的设计，制定详细的实现步骤计划
---
使用 superpowers:writing-plans 技能，为当前任务创建包含精细步骤的实现计划。
```

**`prompts/执行计划.md`**
```markdown
---
description: 按批次执行已有的实现计划，每批次完成后汇报
---
使用 superpowers:executing-plans 技能，批量执行计划中的任务并在每批后汇报进度。
```

**`prompts/brainstorm.md`**（英文版）
```markdown
---
description: Explore requirements and design before writing any code
---
Invoke superpowers:brainstorming skill and follow it exactly.
```

---

## 4. Phase 3：Pi Native 功能适配（2-3 天）

### 4.1 子代理问题的两种解决方案

**背景**：`subagent-driven-development` skill 依赖 `Task` 工具派发独立子代理，Pi 无此内置能力。

#### 方案 A（推荐，Phase 1 即实施）：顺序执行降级模式

在 `skills/subagent-driven-development/SKILL.md` 开头增加 Pi 平台专用说明节：

```markdown
## Pi 平台适配说明（Pi Platform Adaptation）

**Pi 暂不支持内置子代理（`Task` 工具不可用）。在 Pi 中使用以下顺序执行模式替代：**

### 顺序执行模式

子代理派发 → 在当前对话中按顺序逐任务执行：

1. **实现任务**：你作为 Implementer，实现任务内容、编写测试、自我审查、提交代码
2. **Spec 审查**：你作为 Spec Reviewer，独立审查实现是否符合规格（使用 \`read\` 工具读取代码，不信任自己的实现报告）
3. **质量审查**：你作为 Code Quality Reviewer，审查代码质量（仅在 Spec 通过后）
4. 重复直到所有任务完成

**用 `TODO.md` 替代 `TodoWrite`**：
\`\`\`bash
# 记录任务状态
cat > TODO.md << 'EOF'
- [ ] Task 1: xxx
- [ ] Task 2: xxx
EOF
# 完成后更新
sed -i 's/- \[ \] Task 1/- [x] Task 1/' TODO.md
\`\`\`

> 📌 **角色切换提示**：进行 Spec 审查时，明确告知自己"我现在切换到 Spec Reviewer 角色"，强制以批判性视角审查代码而非信任实现报告。
```

#### 方案 B（Phase 3，可选增强）：子进程 Pi 实例

通过 `bash` 工具启动 `pi --print` 子进程实现真正的上下文隔离，模拟子代理行为：

```bash
# 派发子代理示例（在 bash 工具中执行）
pi --no-session --print \
  --append-system-prompt "You are implementing Task N: [task text]" \
  "Implement the following task and report results: [full task text]"
```

此方案需要在 Pi 安装路径可用，且 `pi --print` 模式支持工具调用。适合需要真实上下文隔离的场景。

**实现一个 `dispatch_agent` 自定义工具**（`extensions/subagent.ts`）：

```typescript
import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { Type } from "@sinclair/typebox";

export default function (pi: ExtensionAPI) {
  pi.registerTool({
    name: "dispatch_agent",
    label: "Dispatch Subagent",
    description: "Dispatch a subagent to handle an isolated task. Returns the agent's response.",
    parameters: Type.Object({
      task: Type.String({ description: "Full task description and context for the subagent" }),
      role: Type.Optional(Type.String({ description: "Role for the subagent (implementer/spec-reviewer/code-quality-reviewer)" })),
    }),

    async execute(toolCallId, params, signal, onUpdate, ctx) {
      const rolePrompt = params.role
        ? `You are a ${params.role}. `
        : "";
      const prompt = `${rolePrompt}${params.task}`;

      onUpdate?.({ content: [{ type: "text", text: `Dispatching ${params.role ?? "agent"}...` }] });

      try {
        const result = await pi.exec("pi", [
          "--no-session",
          "--print",
          "--append-system-prompt", rolePrompt.trim(),
          prompt
        ], { signal, timeout: 300_000 }); // 5 min timeout

        return {
          content: [{ type: "text", text: result.stdout || "(no output)" }],
          details: { exitCode: result.code, stderr: result.stderr },
        };
      } catch (err: any) {
        return {
          content: [{ type: "text", text: `Subagent failed: ${err.message}` }],
          details: { error: err.message },
          isError: true,
        };
      }
    },
  });
}
```

### 4.2 `TodoWrite` 替代方案

在 Pi 平台，用 `write`/`edit`/`bash` 工具操作 `TODO.md` 文件替代 `TodoWrite`。在 `using-superpowers` 的 Pi 工具映射说明中已覆盖此点。

在 Bootstrap 注入的工具映射表中统一说明，无需修改每个 skill 文件。

### 4.3 `code-reviewer` Agent 迁移

原文件 `agents/code-reviewer.md` 在 Claude Code 中定义了一个具有特定角色的 Agent。在 Pi 中：

- **迁移为 Skill**：创建 `skills/code-reviewer/SKILL.md`，包含相同的审查角色和流程
- **迁移为 Prompt Template**：创建 `prompts/code-review.md`，在需要时 `/code-review` 触发

推荐同时保留两者：

**`skills/code-reviewer/SKILL.md`**（节选）：
```markdown
---
name: code-reviewer
description: >
  Use when reviewing code against a plan or after completing a task. 
  代码审查时使用 - 按计划检查实现是否符合规格和质量标准。
---

# Code Reviewer

You are a Senior Code Reviewer. Review completed implementation against:
1. Plan compliance (spec reviewer)
2. Code quality (quality reviewer)

[原 agents/code-reviewer.md 正文内容...]
```

---

## 5. 安装与使用指南

### 5.1 从 Git 安装

```bash
# 全局安装（所有项目可用）
pi install git:github.com/your-org/pi-superpowers

# 项目本地安装
pi install -l git:github.com/your-org/pi-superpowers
```

### 5.2 从本地目录安装（开发阶段）

```bash
# 克隆 superpowers 并构建 Pi 包
git clone https://github.com/obra/superpowers.git ~/.local/pi-superpowers
# 按本方案创建 pi-superpowers 目录结构

# 本地安装
pi install /path/to/pi-superpowers
# 或临时测试
pi -e /path/to/pi-superpowers/extensions/bootstrap.ts \
   --skill /path/to/pi-superpowers/skills
```

### 5.3 验证安装

启动 Pi，应看到：
1. 启动头部列出 `superpowers:brainstorming`、`superpowers:systematic-debugging` 等 skills
2. `session_start` 通知："pi-superpowers loaded ✓"
3. 发送任意消息后，系统提示中包含 `<EXTREMELY_IMPORTANT>` 块

**验证中文触发**：
```
用户：帮我实现一个新功能，用户登录模块
期望：LLM 自动加载 brainstorming skill，开始需求分析流程，而非直接写代码
```

---

## 6. 关键风险与缓解措施

| 风险 | 可能性 | 影响 | 缓解措施 |
|------|--------|------|---------|
| `before_agent_start` 重复注入 | 中 | 系统提示膨胀 | 通过 session ID + turn 计数双重检测避免重复 |
| `Skill` 工具不存在导致 LLM 困惑 | 高 | Skills 无法按需加载 | Bootstrap 注入中明确说明"使用 `read` 工具 + 路径"替代 `Skill` 工具 |
| 子代理 `Task` 工具调用失败 | 高（Task 未注册）| subagent-driven-development 失效 | Phase 1 使用顺序执行降级模式；Phase 3 提供 `dispatch_agent` 工具 |
| 中文 description 超过 1024 字符 | 低 | Skills 不被加载 | 严格控制字符数，用 `wc -c` 验证每个 description |
| Skills 触发顺序问题（多 skill 匹配） | 低 | 错误 skill 被加载 | 遵循 Pi Skills 优先级：项目级 > 全局级；名称冲突时取第一个找到的 |

---

## 7. 实施路线图

### Week 1（Phase 1 + Phase 2）

```
Day 1:
  □ 创建 pi-superpowers/ 目录结构
  □ 复制 superpowers/skills/ 所有文件到 pi-superpowers/skills/
  □ 实现 extensions/bootstrap.ts（核心注入逻辑）
  □ 本地测试 bootstrap 注入是否生效

Day 2:
  □ 改写所有 13 个 skill 的 description（添加中文触发词）
  □ 更新 using-superpowers SKILL.md（添加 Pi 工具映射章节）
  □ 更新 subagent-driven-development SKILL.md（添加 Pi 顺序执行说明）
  □ 创建 prompts/ 目录（中英文提示模板）
  □ 完整集成测试

Day 3:
  □ 测试中文触发词触发对应 skill（至少测试 5 个关键 skill）
  □ 测试完整工作流：头脑风暴 → 写计划 → 执行计划 → TDD → 代码审查 → 完成分支
  □ 撰写 README.md
```

### Week 2（Phase 3，可选）

```
Day 4-5:
  □ 实现 extensions/subagent.ts（dispatch_agent 工具，方案 B）
  □ 发布 npm 包或 GitHub 仓库
  □ 验证 pi install git:... 安装流程
```

---

## 8. 参考资料

| 资源 | 路径/链接 |
|------|---------|
| Superpowers 原始仓库 | `https://github.com/obra/superpowers` |
| 本次架构分析报告 | `./superpowers-architecture-analysis.md` |
| Pi 平台 Skills 文档 | `~/.nvm/.../pi-coding-agent/docs/skills.md` |
| Pi 平台 Extensions 文档 | `~/.nvm/.../pi-coding-agent/docs/extensions.md` |
| Pi 平台 Packages 文档 | `~/.nvm/.../pi-coding-agent/docs/packages.md` |
| Agent Skills 标准规范 | `https://agentskills.io/specification` |
| Pi Extensions 示例 | `~/.nvm/.../pi-coding-agent/examples/extensions/` |
