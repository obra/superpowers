# pi-superpowers

[中文版](README_CN.md)

> A Pi platform port of the Superpowers workflow skill library, with Chinese trigger support

**pi-superpowers** ports 14 professional workflow skills from [obra/superpowers](https://github.com/obra/superpowers) to the [Pi](https://github.com/badlogic/pi) programming assistant platform, adding:

- 🇨🇳 **Chinese trigger words**: Every skill supports bilingual (Chinese/English) triggers — Chinese queries automatically match the corresponding skill
- 🔌 **Bootstrap extension**: Skill usage rules are automatically injected into context at the start of every session
- 🔧 **Tool mapping**: Automatically maps original Claude Code tools (`Skill`, `TodoWrite`, `Task`) to Pi equivalents
- 🤖 **`dispatch_agent` tool**: Simulates Claude Code's `Task` sub-agent with context isolation via `pi --no-session --print` subprocess
- ⚡ **Prompt templates**: 3 slash commands (`/brainstorm`, etc.)

---

## Table of Contents

- [Skill Overview](#skill-overview)
- [Typical Workflows](#typical-workflows)
- [Prompt Template Commands](#prompt-template-commands)
- [Tool Mapping Reference](#tool-mapping-reference)
- [dispatch_agent Tool](#dispatch_agent-tool)
- [Bootstrap Injection Mechanism](#bootstrap-injection-mechanism)
- [Known Limitations](#known-limitations)
- [Installation](#installation)

---

## Skill Overview

After installation, **14 skills** are available. Skill descriptions include both Chinese and English keywords — Pi automatically loads the matching skill when a relevant request is received.

You can also force-load any skill with the `/skill:<name>` command.

### Development Workflow Skills

| Skill | Trigger Scenario | Chinese Keyword Examples |
|-------|-----------------|--------------------------|
| `brainstorming` | Requirements analysis and design before implementing a new feature/component | 头脑风暴、做一个新功能、从哪里开始、需求分析 |
| `writing-plans` | Breaking down requirements into fine-grained implementation steps | 写计划、制定开发计划、拆分任务、做规划 |
| `subagent-driven-development` | Executing multiple independent tasks according to an implementation plan | 执行计划、开始实现、逐任务执行 |
| `executing-plans` | Batch-executing an existing written plan | 按计划实现、批次执行任务 |
| `test-driven-development` | Before implementing any feature or fixing a bug | TDD、测试驱动开发、先写测试、测试优先 |
| `using-git-worktrees` | When isolation from the current workspace is needed | git worktree、隔离开发、新分支开发 |
| `dispatching-parallel-agents` | Facing 2+ independent tasks that can run in parallel | 并行处理、多任务并发、同时修复多个问题 |
| `verification-before-completion` | Just before declaring a task complete | 验证完成、声明完成前、提交前验证 |

### Quality Assurance Skills

| Skill | Trigger Scenario | Chinese Keyword Examples |
|-------|-----------------|--------------------------|
| `systematic-debugging` | Encountering a bug, test failure, or unexpected behavior | 调试、找 bug、修复问题、测试失败、根本原因分析 |
| `requesting-code-review` | Code review before completing a task or merging | 代码审查、code review、审查代码、提交前审查 |
| `receiving-code-review` | Handling review feedback after receiving it | 处理审查意见、回应评审、技术反驳 |
| `finishing-a-development-branch` | Implementation complete, tests passing, ready to integrate | 完成分支、提 PR、合并代码、结束开发 |

### Meta Skills

| Skill | Trigger Scenario | Chinese Keyword Examples |
|-------|-----------------|--------------------------|
| `using-superpowers` | At the start of every conversation (auto-injected by the Bootstrap extension) | Auto-triggered, no manual action needed |
| `writing-skills` | Creating or modifying skill files | 写 skill、创建新技能、设计工作流技能 |

---

## Typical Workflows

### 1. Full Feature Development Flow

```
You:  Help me build a user permissions management module
       └→ AI auto-loads brainstorming skill, begins requirements analysis
          ↓ Explores requirements, proposes multiple approaches, awaits confirmation
You:  OK, let's go with that approach
       └→ AI auto-loads writing-plans skill, breaks down implementation steps
          ↓ Generates a plan with 2–5 minute granularity per step
You:  Start implementing
       └→ AI auto-loads subagent-driven-development / executing-plans skill
          ↓ Implements task by task in TDD cycles (tests first, then implement, review, then continue)
You:  Everything is done
       └→ AI auto-loads verification-before-completion skill, runs verification commands
          ↓ After confirmation, loads finishing-a-development-branch to decide merge strategy
```

### 2. Bug Debugging Flow

```
You:  Tests are failing — TypeError: Cannot read property 'id' of undefined
       └→ AI auto-loads systematic-debugging skill
          ↓ Systematic root-cause analysis: confirm symptoms → isolate scope → find minimal repro → fix
          ↓ Must write a failing test that reproduces the bug before applying the fix (TDD)
```

### 3. Force-Loading with Slash Commands

When auto-triggering is unreliable, use `/skill:` commands to force-load a skill:

```
/skill:brainstorming               # Force requirements analysis
/skill:test-driven-development     # Force TDD mode
/skill:systematic-debugging        # Force systematic debugging
/skill:verification-before-completion  # Force completion verification
```

### 4. Chinese Conversation Examples

| What you say | Skill auto-triggered |
|-------------|---------------------|
| "帮我做一个登录功能" | `brainstorming` (pre-feature analysis) |
| "这个测试一直失败，帮我看看" | `systematic-debugging` |
| "用测试驱动开发这个接口" | `test-driven-development` |
| "代码写完了，帮我 review 一下" | `requesting-code-review` |
| "我要提交 PR 了" | `verification-before-completion` → `finishing-a-development-branch` |
| "有三个不相关的 bug 要修" | `dispatching-parallel-agents` |

---

## Prompt Template Commands

Prompt templates are triggered with a `/` prefix and enforce the full workflow of the corresponding skill:

| Command | Description |
|---------|-------------|
| `/brainstorm` | Start requirements analysis and design; AI is blocked from writing code before confirmation |
| `/write-plan` | Break a confirmed approach into fine-grained implementation steps |
| `/execute-plan` | Batch-execute an existing plan, reporting after each batch and waiting for feedback |

**Usage example:**
```
/brainstorm I want to build a real-time chat room
/write-plan
/execute-plan
```

---

## Tool Mapping Reference

Pi tool names differ from Claude Code's originals. The Bootstrap extension injects the following mapping into the system prompt, and the AI will automatically use Pi-equivalent tools:

| Original Claude Code Tool | Pi Equivalent |
|--------------------------|---------------|
| `Skill` tool | Use `read` to load `skills/<name>/SKILL.md`, or use the `/skill:<name>` command |
| `TodoWrite` | Use `write`/`edit` to manage `TODO.md` at the project root (Markdown checkbox format) |
| `Task` (sub-agent dispatch) | **Option A (fallback) Sequential mode**: implement tasks one by one in the current conversation with role-switching for review; **Option B (recommended) `dispatch_agent` tool**: true context isolation via `pi --no-session --print` subprocess (see below) |
| `Read` | `read` (same name, use directly) |
| `Write` | `write` (same name, use directly) |
| `Edit` | `edit` (same name, use directly) |
| `Bash` | `bash` (same name, use directly) |

### Sub-agent Execution Modes

The original superpowers `subagent-driven-development` skill relies on the `Task` tool to dispatch independent sub-agents. pi-superpowers provides two alternatives:

#### Option A: Sequential Fallback Mode (no extra tooling required)

Execute tasks sequentially in the current conversation, simulating multiple perspectives through role-switching:

```
1. Implementer role:       Implement task → write tests → self-review → commit
2. Spec Reviewer role:     Independently verify with read tool, do not trust implementer's report
3. Code Quality Reviewer:  Review code quality (only after Spec review passes)
4. Fix issues → re-review → proceed to next task after passing
```

Task status is tracked in a `TODO.md` file:
```markdown
- [x] Task 1: Implement user model
- [ ] Task 2: Implement auth middleware
- [ ] Task 3: Implement login endpoint
```

---

## dispatch_agent Tool

#### Option B: `dispatch_agent` Tool (recommended, requires `pi` in PATH)

`dispatch_agent` is a custom tool registered by pi-superpowers (`extensions/subagent.ts`). It achieves true context isolation by launching a `pi --no-session --print` subprocess, matching the behavior of Claude Code's `Task` tool.

**LLM call example:**
```
dispatch_agent({
  task: "Implement user auth middleware: 1) validate JWT 2) handle expiration 3) write unit tests",
  role: "implementer"
})
```

**Supported roles (`role` parameter):**

| Role | Description |
|------|-------------|
| `implementer` | Implements the task, writes tests, self-reviews |
| `spec-reviewer` | Independently verifies the implementation against the spec (critical perspective) |
| `code-quality-reviewer` | Reviews code quality; runs only after Spec review passes |
| _(omitted)_ | General-purpose sub-agent with no role restriction |

**Underlying implementation:**
```bash
# When role = "implementer", equivalent to:
pi --no-session --print \
   --append-system-prompt "You are a implementer." \
   "Implement user auth middleware: ..."
```

**Prerequisite**: The `pi` binary must be accessible in `$PATH`. If not found, the tool returns a clear error message rather than crashing.

---

## Bootstrap Injection Mechanism

**Problem**: The original superpowers uses Claude Code's `SessionStart` hook to auto-inject `using-superpowers` content at the beginning of every session. Pi does not have this hook.

**Solution**: pi-superpowers provides two Pi extensions:

| Extension File | Purpose |
|---------------|---------|
| `extensions/bootstrap.ts` | Injects `using-superpowers` rules into the system prompt before the first message of each session |
| `extensions/subagent.ts` | Registers the `dispatch_agent` tool as a replacement for Claude Code's `Task` sub-agent |

`bootstrap.ts` injection flow:

```
User sends first message
      ↓
before_agent_start fires
      ↓
Is this the first user turn of this session?
  YES → Read using-superpowers/SKILL.md
      → Assemble <EXTREMELY_IMPORTANT> injection block
      → Append to systemPrompt
      → Mark session as injected (prevents re-injection on subsequent turns)
  NO  → Skip injection
      ↓
AI follows using-superpowers rules in this response
```

Injected content includes:
- Full `using-superpowers` skill text (skill usage rules, priority, red flags checklist)
- Pi platform tool mapping table (alternatives for Skill/TodoWrite/Task)

---

## Known Limitations

| Limitation | Impact | Mitigation |
|-----------|--------|-----------|
| No built-in sub-agents (`Task` tool unavailable) | `subagent-driven-development` cannot truly run in parallel | **Resolved via `dispatch_agent` tool**: `extensions/subagent.ts` achieves context isolation through `pi --no-session --print` subprocess; fallback: sequential execution mode |
| No `TodoWrite` tool | Task progress cannot be shown in native UI | Track with `TODO.md` file — functionally equivalent |
| `before_agent_start` fires on every turn | Need to detect whether injection has already occurred | Bootstrap extension uses session ID + turn count for double detection |
| Flowcharts in `using-superpowers` require Graphviz | Dot syntax code blocks cannot render in Pi TUI | Diagrams still serve as text-based logic references; no functional impact |

---

## Installation

### Option 1: npm Install (Recommended)

```bash
# Global install (available to all projects)
pi install npm:@weiping/pi-superpowers

# Project-level install (current project only, can be committed and shared with the team)
pi install -l npm:@weiping/pi-superpowers
```

**Restart Pi** after installation for changes to take effect.

---

### Option 2: Git Install

```bash
# Install latest version from GitHub
pi install https://github.com/weiping/pi-superpowers

# Pin to a specific version (pi update won't auto-upgrade)
pi install https://github.com/weiping/pi-superpowers@v1.0.0
```

---

### Option 3: Prompt-based Auto Install

Paste the following prompt in a Pi session and Pi will complete the installation automatically:

```
Run: pi install npm:@weiping/pi-superpowers, then tell me the install is complete and I need to restart Pi.
```

---

### Option 4: Local Path Install

```bash
# Global install
pi install /path/to/pi-superpowers

# Project-level install
pi install -l /path/to/pi-superpowers
```

See [INSTALL.md](INSTALL.md) for details.

---

### OpenClaw Installation

If you use [OpenClaw](https://openclaw.ai):

```bash
openclaw plugins install @weiping/openclaw-superpowers
```

---

## License

MIT.  
Original superpowers project by [Jesse Vincent](https://github.com/obra), also licensed under MIT.
