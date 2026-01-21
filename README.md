# HorsPowers!

> **中文支持** | 本项目提供完整的中文支持，所有技能均支持中文触发。

---

## 🇨🇳 中文介绍

**HorsPowers** 是基于 [Superpowers](https://github.com/obra/superpowers) 的自定义版本，专为个人开发者优化。

### 主要特点

- ✅ **完整的中文支持** - 所有技能支持中文触发，在中文语境下正常工作
- ✅ **个人/团队模式** - 可选择轻量化的个人开发模式或完整的团队协作模式
- ✅ **统一文档系统** - 文档功能已内置到插件中，实现知识传承和上下文传递
- ✅ **TDD 工作流** - 测试驱动开发，确保代码质量

### 个人模式 vs 团队模式

| 特性 | 个人模式 | 团队模式 |
|------|---------|---------|
| 分支策略 | 普通分支 | Git Worktree |
| 测试策略 | 先写代码后测试 | 严格 TDD |
| 完成策略 | 本地合并 | 创建 PR |
| 适用场景 | 单人快速开发 | 多人协作项目 |

在 `.horspowers-config.yaml` 中配置：

```yaml
development_mode: personal  # 或 team
branch_strategy: simple     # 或 worktree
testing_strategy: test-after # 或 tdd
completion_strategy: merge  # 或 pr
```

### 统一文档系统 (v4.2.2+)

文档系统完全内置，无需外部依赖，自动在工作流关键节点创建和更新文档。

**文档类型**：

| 类型 | 命名格式 | 存储位置 | 生命周期 |
|-----|---------|---------|---------|
| design | `YYYY-MM-DD-design-<topic>.md` | `docs/plans/` | 长期保留 |
| plan | `YYYY-MM-DD-<feature>.md` | `docs/plans/` | 长期保留 |
| task | `YYYY-MM-DD-task-<title>.md` | `docs/active/` → `docs/archive/` | 完成后归档 |
| bug | `YYYY-MM-DD-bug-<desc>.md` | `docs/active/` | 修复后删除 |
| context | `YYYY-MM-DD-context-<topic>.md` | `docs/context/` | 长期保留 |

**核心原则**：每个需求最多 3 个核心文档 (1 design + 1 plan + 1 task)，避免文档膨胀。

**启用方式**：

```yaml
# .horspowers-config.yaml
documentation:
  enabled: true
```

**文档迁移**（旧格式 → 新格式）：

```bash
# 预览迁移
node scripts/migrate-docs.js --dry-run

# 执行迁移
node scripts/migrate-docs.js
```

### 中文触发示例

所有技能都支持中文触发，例如：
- "帮我想想这个功能的实现方案" → 触发 `brainstorming`
- "帮我写个实施计划" → 触发 `writing-plans`
- "开始写这个功能" → 触发 `test-driven-development`
- "这里有个bug" → 触发 `systematic-debugging`
- "搜索文档" → 触发 `document-management`

更多示例请查看各技能的 description。

---

## 🇺🇸 English

Just kidding :p

A custom version based on Superpowers, just a rookie stand on the shoulders of giants.

## What's different

I'm a single developer, sometimes, off the work, e.g.

So, as a lazy dog(Chinese slang), TDD? worktree? nuh, I dont need thoes heavy machine gun.

I just add a "Personal/Single Mode" for the superpower skills, origin for team work, new mode for me.
- change the strategy in ./.horspowers-config.yaml
    - braches strategy support regular branch strategy
    - test strategy support test-after, code first
    - push-merge strategy support pr or local merge

## Built-in Documentation System (4.2.2+)

The documentation system is now built directly into the plugin, with no external dependencies required.

### What It Does

Automatically creates and updates documentation at key workflow points:

- **brainstorming** → Records technical decisions (design 文档)
- **writing-plans** → Creates task tracking documents (plan + task 文档)
- **test-driven-development** → Logs bugs and fixes (bug 文档)
- **finishing-a-development-branch** → Archives completed work (归档 task，删除 bug)

### Document Types

| 类型 | 命名格式 | 存储位置 | 生命周期 |
|-----|---------|---------|---------|
| design | `YYYY-MM-DD-design-<topic>.md` | `docs/plans/` | 长期保留 |
| plan | `YYYY-MM-DD-<feature>.md` | `docs/plans/` | 长期保留 |
| task | `YYYY-MM-DD-task-<title>.md` | `docs/active/` → `docs/archive/` | 完成后归档 |
| bug | `YYYY-MM-DD-bug-<desc>.md` | `docs/active/` | 修复后删除 |
| context | `YYYY-MM-DD-context-<topic>.md` | `docs/context/` | 长期保留 |

**核心原则**: 每个需求最多 3 个核心文档 (1 design + 1 plan + 1 task)，避免文档膨胀。

### Setup

Simply enable documentation in your `.horspowers-config.yaml`:

```yaml
documentation:
  enabled: true
```

The system will automatically:
- Create a `docs/` directory structure
- Track active tasks and bugs in `docs/active/`
- Archive completed work in `docs/archive/`
- Maintain session metadata across conversations

### Documentation Workflow

```
用户需求
    ↓
[brainstorming]
输入：项目上下文（搜索现有 context、design）
输出：design 文档（重要方案选择时）
    ↓
[writing-plans]
输入：design 文档路径
输出：plan 文档 + task 文档 + 环境变量 ($TASK_DOC)
    ↓
[subagent-driven-development] / [executing-plans]
输入：plan、task 文档路径
输出：更新 task 进度
    ↓
[test-driven-development]
输入：task 文档路径
输出：bug 文档（意外失败时）或 更新 task 进度
    ↓
[requesting-code-review]
输入：task、design、plan 文档
输出：更新 task 状态
    ↓
[finishing-a-development-branch]
输入：task、bug 文档
输出：task → archive, bug → 删除
```

### Migration Guide

If you have documents from older versions, use the migration script:

```bash
# Preview migration
node scripts/migrate-docs.js --dry-run

# Execute migration
node scripts/migrate-docs.js
```

See [docs/migration-guide.md](docs/migration-guide.md) for details.

---

# Superpowers

Superpowers is a complete software development workflow for your coding agents, built on top of a set of composable "skills" and some initial instructions that make sure your agent uses them.

## How it works

It starts from the moment you fire up your coding agent. As soon as it sees that you're building something, it *doesn't* just jump into trying to write code. Instead, it steps back and asks you what you're really trying to do.

Once it's teased a spec out of the conversation, it shows it to you in chunks short enough to actually read and digest.

After you've signed off on the design, your agent puts together an implementation plan that's clear enough for an enthusiastic junior engineer with poor taste, no judgement, no project context, and an aversion to testing to follow. It emphasizes true red/green TDD, YAGNI (You Aren't Gonna Need It), and DRY.

Next up, once you say "go", it launches a *subagent-driven-development* process, having agents work through each engineering task, inspecting and reviewing their work, and continuing forward. It's not uncommon for Claude to be able to work autonomously for a couple hours at a time without deviating from the plan you put together.

There's a bunch more to it, but that's the core of the system. And because the skills trigger automatically, you don't need to do anything special. Your coding agent just has Superpowers.


## Sponsorship

If Superpowers has helped you do stuff that makes money and you are so inclined, I'd greatly appreciate it if you'd consider [sponsoring my opensource work](https://github.com/sponsors/obra).

Thanks!

- Jesse


## Installation

**Note:** Installation differs by platform. Claude Code has a built-in plugin system. Codex and OpenCode require manual setup.

### Claude Code (via Plugin Marketplace)

In Claude Code, register the marketplace first:

```bash
/plugin marketplace add LouisHors/horspowers-marketplace
```

Then install the plugin from this marketplace:

```bash
/plugin install horspowers@horspowers-marketplace
```

### Verify Installation

Check that commands appear:

```bash
/help
```

```
# Should see:
# /horspowers:brainstorm - Interactive design refinement
# /horspowers:write-plan - Create implementation plan
# /horspowers:execute-plan - Execute plan in batches
```

### Codex

Tell Codex:

```
Fetch and follow instructions from https://raw.githubusercontent.com/LouisHors/horspowers/refs/heads/main/.codex/INSTALL.md
```

**Detailed docs:** [docs/README.codex.md](docs/README.codex.md)

### OpenCode

Tell OpenCode:

```
Fetch and follow instructions from https://raw.githubusercontent.com/LouisHors/horspowers/refs/heads/main/.opencode/INSTALL.md
```

**Detailed docs:** [docs/README.opencode.md](docs/README.opencode.md)

## The Basic Workflow

1. **brainstorming** - Activates before writing code. Refines rough ideas through questions, explores alternatives, presents design in sections for validation. Saves design document.

2. **using-git-worktrees** - Activates after design approval. Creates isolated workspace on new branch, runs project setup, verifies clean test baseline.

3. **writing-plans** - Activates with approved design. Breaks work into bite-sized tasks (2-5 minutes each). Every task has exact file paths, complete code, verification steps.

4. **subagent-driven-development** or **executing-plans** - Activates with plan. Dispatches fresh subagent per task with two-stage review (spec compliance, then code quality), or executes in batches with human checkpoints.

5. **test-driven-development** - Activates during implementation. Enforces RED-GREEN-REFACTOR: write failing test, watch it fail, write minimal code, watch it pass, commit. Deletes code written before tests.

6. **requesting-code-review** - Activates between tasks. Reviews against plan, reports issues by severity. Critical issues block progress.

7. **finishing-a-development-branch** - Activates when tasks complete. Verifies tests, presents options (merge/PR/keep/discard), cleans up worktree.

**The agent checks for relevant skills before any task.** Mandatory workflows, not suggestions.

## What's Inside

### Skills Library

**Testing**
- **test-driven-development** - RED-GREEN-REFACTOR cycle (includes testing anti-patterns reference)

**Debugging**
- **systematic-debugging** - 4-phase root cause process (includes root-cause-tracing, defense-in-depth, condition-based-waiting techniques)
- **verification-before-completion** - Ensure it's actually fixed

**Collaboration**
- **brainstorming** - Socratic design refinement
- **writing-plans** - Detailed implementation plans
- **executing-plans** - Batch execution with checkpoints
- **dispatching-parallel-agents** - Concurrent subagent workflows
- **requesting-code-review** - Pre-review checklist
- **receiving-code-review** - Responding to feedback
- **using-git-worktrees** - Parallel development branches
- **finishing-a-development-branch** - Merge/PR decision workflow
- **subagent-driven-development** - Fast iteration with two-stage review (spec compliance, then code quality)

**Meta**
- **writing-skills** - Create new skills following best practices (includes testing methodology)
- **using-horspowers** - Introduction to the skills system (originally `using-superpowers` in upstream)

**Documentation**
- **document-management** - Document system management, search, and migration tools

## Philosophy

- **Test-Driven Development** - Write tests first, always
- **Systematic over ad-hoc** - Process over guessing
- **Complexity reduction** - Simplicity as primary goal
- **Evidence over claims** - Verify before declaring success

Read more: [Superpowers for Claude Code](https://blog.fsck.com/2025/10/09/superpowers/)

## Contributing

Skills live directly in this repository. To contribute:

1. Fork the repository
2. Create a branch for your skill
3. Follow the `writing-skills` skill for creating and testing new skills
4. Submit a PR

See `skills/writing-skills/SKILL.md` for the complete guide.

## Updating

Skills update automatically when you update the plugin:

```bash
/plugin update horspowers
```

## License

MIT License - see LICENSE file for details

## Support

- **Issues**: https://github.com/LouisHors/horspowers/issues
- **Upstream**: https://github.com/obra/superpowers (Original project)

## Documentation

- [统一文档系统用户指南](docs/tasks/unified-document-system.md) - 完整的文档系统使用说明
- [文档格式迁移指南](docs/migration-guide.md) - 旧格式文档迁移步骤
- [文档系统统一项目总结](docs/active/2026-01-21-doc-system-unification-summary.md) - v4.2.2 更新详情

## Changelog

### v4.2.2 (2026-01-21)

**文档系统统一**
- ✅ 统一命名规范：前缀式 `YYYY-MM-DD-<type>-<slug>.md`
- ✅ 统一模板格式：合并 design + decision，采用 DDAW 结构
- ✅ 文档复杂度控制：每个需求最多 3 个核心文档
- ✅ 技能文档上下文传递：所有技能支持文档输入输出
- ✅ 迁移工具：自动迁移脚本 `scripts/migrate-docs.js`

**新增功能**
- `deleteBugDocument()` - Bug 文档删除（支持状态验证）
- `countCoreDocs()` - 核心文档计数（超过 3 个警告）
- 优化 `extractDocType()` - 支持带路径检测，严格前缀匹配

**技能更新**
- brainstorming: 搜索现有文档，询问是否创建 design
- writing-plans: 文档输入上下文，创建 task + 环境变量
- subagent-driven-development: 文档上下文加载
- executing-plans: 检查点保存机制
- systematic-debugging: 更新 bug 文档
- requesting-code-review: 审查后更新 task
- finishing-a-development-branch: 归档 task，删除 bug
- dispatching-parallel-agents: 文档上下文汇总

**测试**
- 集成测试：`tests/integration/test-docs-phase1-5.sh`
- TDD 流程：RED → GREEN → REFACTOR 完整周期
