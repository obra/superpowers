---
name: "superpowers"
displayName: "Superpowers"
description: "Complete software development workflow with composable skills: TDD, systematic debugging, brainstorming, planning, code review, and subagent-driven development"
keywords: ["tdd", "test driven development", "debug", "brainstorm", "plan", "code review", "workflow", "skills", "subagent", "refactor", "git worktree", "implementation", "testing", "verification"]
author: "Jesse Vincent"
---

# Superpowers

Superpowers is a complete software development workflow built on composable skills.

## Onboarding

When this power is first activated, install the global steering file so the workflow loads automatically in every future conversation.

### 1. Check if already installed

```bash
ls ~/.kiro/steering/superpowers.md 2>/dev/null
```

If it exists, onboarding is done — skip to the Available Skills table.

### 2. Locate the superpowers repo

```bash
ls ~/.kiro/powers/repos/*/skills/using-superpowers/SKILL.md 2>/dev/null
ls ~/superpowers/skills/using-superpowers/SKILL.md 2>/dev/null
```

The directory containing `skills/using-superpowers/SKILL.md` is the repo root (`SUPERPOWERS_REPO`).

### 3. Install global steering file

```bash
mkdir -p ~/.kiro/steering
cp "$SUPERPOWERS_REPO/.kiro-power/steering/superpowers.md" ~/.kiro/steering/superpowers.md
```

This ensures the Superpowers bootstrap runs in every conversation, independent of Power keyword activation.

### 4. Verify

```bash
cat ~/.kiro/steering/superpowers.md
```

Tell the user: "Superpowers is installed. The workflow will load automatically in all future conversations."

## Available Skills

Read any skill with `executeBash cat` or `readFile` from `$SUPERPOWERS_REPO/skills/<name>/SKILL.md`:

| Skill | When to use |
|-------|-------------|
| `brainstorming` | Before any creative work — features, components, design |
| `writing-plans` | When you have a spec and need an implementation plan |
| `executing-plans` | When you have a plan to execute task-by-task |
| `subagent-driven-development` | Execute plans with independent tasks using subagents |
| `test-driven-development` | When implementing any feature or bugfix |
| `systematic-debugging` | When encountering bugs, test failures, unexpected behavior |
| `requesting-code-review` | Before merging, to verify work meets requirements |
| `receiving-code-review` | When handling code review feedback |
| `verification-before-completion` | Before claiming work is done |
| `using-git-worktrees` | When starting feature work that needs isolation |
| `finishing-a-development-branch` | When implementation is complete, deciding merge/PR/cleanup |
| `dispatching-parallel-agents` | When facing 2+ independent tasks |
| `writing-skills` | When creating or editing skills |
