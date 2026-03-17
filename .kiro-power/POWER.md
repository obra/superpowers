---
name: "superpowers"
displayName: "Superpowers"
description: "Complete software development workflow with composable skills: TDD, systematic debugging, brainstorming, planning, code review, and subagent-driven development"
keywords: ["tdd", "test driven development", "debug", "brainstorm", "plan", "code review", "workflow", "skills", "subagent", "refactor", "git worktree", "verification"]
---

# Superpowers

Superpowers is a complete software development workflow built on composable skills. Skills trigger automatically based on what you're doing, or on demand when you ask.

## Bootstrap

On activation, use `discloseContext` to load the core guidance file from this repository:

```
~/.kiro/powers/repos/superpowers/skills/using-superpowers/SKILL.md
```

This file establishes the rule: **check for a relevant skill before every response or action**.

## Available Skills

Load any skill on demand with `discloseContext`:

```
~/.kiro/powers/repos/superpowers/skills/<skill-name>/SKILL.md
```

| Skill | When to use |
|-------|-------------|
| `brainstorming` | Before any creative work — features, components, design |
| `dispatching-parallel-agents` | When facing 2+ independent tasks that can run in parallel |
| `executing-plans` | When you have a written plan to execute task-by-task |
| `finishing-a-development-branch` | When implementation is complete — merge, PR, or cleanup |
| `receiving-code-review` | When handling code review feedback |
| `requesting-code-review` | Before merging or completing major features |
| `subagent-driven-development` | When executing plans with independent tasks using subagents |
| `systematic-debugging` | When encountering bugs, test failures, or unexpected behavior |
| `test-driven-development` | Before writing any implementation code |
| `using-git-worktrees` | When starting feature work that needs isolation |
| `using-superpowers` | Bootstrap — establishes how to find and use all skills |
| `verification-before-completion` | Before claiming work is complete or tests are passing |
| `writing-plans` | When you have a spec and need a detailed implementation plan |
| `writing-skills` | When creating or editing skills |

## Tool Mapping

Skills use Claude Code tool names. In Kiro, substitute these equivalents:

| Skill references | Kiro equivalent |
|-----------------|-----------------|
| `Skill` tool | `discloseContext` — load `skills/<name>/SKILL.md` |
| `TodoWrite` | Markdown checklist — use `- [ ] item` format in responses |
| `Task` (subagent) | `invokeSubAgent` |
| `Read` | `readFile` / `readCode` (`readCode` preferred for source files) |
| `Write` | `fsWrite` / `fsAppend` (`fsAppend` for large files) |
| `Edit` | `editCode` / `strReplace` (`editCode` preferred for AST-aware edits) |
| `Bash` | `executeBash` |
| `WebFetch` | `webFetch` |
| `WebSearch` | `remote_web_search` |
