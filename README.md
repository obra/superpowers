# HorsPowers!

> **中文支持** | 本项目提供完整的中文支持，所有技能均支持中文触发。

---

## 🇨🇳 中文介绍

**HorsPowers** 是基于 [Superpowers](https://github.com/obra/superpowers) 的自定义版本，专为个人开发者优化。

### 主要特点

- ✅ **完整的中文支持** - 所有技能支持中文触发，在中文语境下正常工作
- ✅ **个人/团队模式** - 可选择轻量化的个人开发模式或完整的团队协作模式
- ✅ **文档驱动集成** - 集成 document-driven-ai-workflow，自动维护项目上下文

### 个人模式 vs 团队模式

| 特性 | 个人模式 | 团队模式 |
|------|---------|---------|
| 分支策略 | 普通分支 | Git Worktree |
| 测试策略 | 先写代码后测试 | 严格 TDD |
| 完成策略 | 本地合并 | 创建 PR |
| 适用场景 | 单人快速开发 | 多人协作项目 |

在 `.superpowers-config.yaml` 中配置：

```yaml
development_mode: personal  # 或 team
branch_strategy: simple     # 或 worktree
testing_strategy: test-after # 或 tdd
completion_strategy: merge  # 或 pr
```

### 中文触发示例

所有技能都支持中文触发，例如：
- "帮我想想这个功能的实现方案" → 触发 `brainstorming`
- "帮我写个实施计划" → 触发 `writing-plans`
- "开始写这个功能" → 触发 `test-driven-development`
- "这里有个bug" → 触发 `systematic-debugging`

更多示例请查看各技能的 description。

---

## 🇺🇸 English

Just kidding :p

A custom version based on Superpowers, just a rookie stand on the shoulders of giants.

## What's different

I'm a single developer, sometimes, off the work, e.g.

So, as a lazy dog(Chinese slang), TDD? worktree? nuh, I dont need thoes heavy machine gun.

I just add a "Personal/Single Mode" for the superpower skills, origin for team work, new mode for me.
- change the strategy in ./.superpowers-config.yaml
    - braches strategy support regular branch strategy
    - test strategy support test-after, code first
    - push-merge strategy support pr or local merge

## Use With My Document-Driven Skill

This version includes integration with [document-driven-ai-workflow](https://github.com/LouisHors/document-driven-ai-workflow) - a documentation system that enables AI to maintain project context across sessions.

### Quick Links

**English:**
- **[📖 Integration Guide](docs/document-driven-integration-guide-en.md)** - Complete integration documentation
- **[🚀 Quick Start](docs/document-driven-quickstart-en.md)** - Get started in 5 minutes
- **[🔧 Bridge Skill](skills/document-driven-bridge/SKILL.md)** - Core integration skill

**中文:**
- **[📖 集成指南](docs/document-driven-integration-guide.md)** - 完整的集成文档
- **[🚀 快速开始](docs/document-driven-quickstart.md)** - 5 分钟上手指南

### What It Does

Automatically creates and updates documentation at key workflow points:

- **brainstorming** → Records technical decisions
- **writing-plans** → Creates task tracking documents
- **test-driven-development** → Logs bugs and fixes
- **finishing-a-development-branch** → Archives completed work

### Setup

1. Clone the workflow: `git clone https://github.com/LouisHors/document-driven-ai-workflow.git`
2. Copy config template: `cp .superpowers-config.template.yaml .superpowers-config.yaml`
3. Set `documentation.enabled: true` and configure `cli_path`
4. Initialize: `node /path/to/document-driven-ai-workflow/cli.js init`

See [Quick Start](docs/document-driven-quickstart.md) for detailed instructions.

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
- **using-superpowers** - Introduction to the skills system

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
