---
name: dispatching-parallel-agents
description: Canonical reference for worktree-isolated, backgrounded parallel subagent dispatch. Linked from subagent-driven-development and executing-plans.
---

# Dispatching Parallel Agents

## Overview

This is the reference implementation for dispatching multiple subagents concurrently with full isolation. Other skills (`subagent-driven-development`, `executing-plans`) link here for the mechanics.

**Core mechanism:** each task runs in its own git worktree, dispatched as a backgrounded `Agent` call. Worktree isolation removes file conflicts during execution; the controller merges results sequentially after each agent reports DONE.

## When to Use

Use this pattern whenever the controller has 2+ ready tasks that:
- Touch disjoint state (or are isolated by worktree), AND
- Have no sequential dependency between them

Single ready task → just dispatch foreground (no worktree overhead).
Tasks marked `parallel_safe: false` → foreground sequential.

## Dispatch Call

```typescript
Agent({
  description: "<task id>",
  prompt: <full task prompt including context>,
  isolation: "worktree",
  run_in_background: true,
})
```

The `isolation: "worktree"` flag creates a fresh worktree on a new branch derived from the current work branch. The agent commits there. When it returns, the controller is notified — do not poll.

## Controller Responsibilities

1. **Dispatch:** fire one background `Agent` call per ready task in a single message.
2. **Wait by notification:** the runtime tells you when each agent completes. Do not sleep, do not poll.
3. **Merge:** for each completed agent's worktree branch:
   - `git fetch <branch>`
   - `git merge --no-ff <branch>` into the work branch
   - Clean → run tests; pass → mark DONE
   - Conflict → `git merge --abort`, push the branch, open a draft PR with `gh pr create --draft`, surface the URL, mark task BLOCKED-on-human, continue with other ready tasks
4. **Recompute ready set** and dispatch the next layer.

## Per-Task Prompt Requirements

Each backgrounded subagent must receive:

- The full task text from the plan (do not make it read the plan file)
- Scene-setting context: where this task fits in the larger work
- Explicit constraints: which files it owns, which it must not touch
- The instruction to commit its own work in the worktree before returning
- Expected return format: `DONE` / `DONE_WITH_CONCERNS` / `NEEDS_CONTEXT` / `BLOCKED`

## Common Mistakes

- **Dispatching foreground when background was needed** — wall-clock cost balloons; use `run_in_background: true`
- **Polling for completion** — the runtime sends notifications; polling burns context
- **Skipping worktree isolation** — two agents on the same branch will stomp each other's commits
- **Asking the controller to resolve conflicts** — push the branch, open the PR, let the human resolve on GitHub
- **Forgetting `parallel_safe: false`** — env files, migrations, and config singletons must not run in parallel even with worktree isolation, because the merge will inevitably conflict
- **Halting the pipeline on the first BLOCKED task** — other ready tasks should keep running

## When NOT to Use

- All remaining tasks are tightly coupled (chain DAG of length N) — sequential is faster than worktree overhead
- Plan declares no `depends_on` anywhere — falls back to sequential mode by design
- Task explicitly marked `parallel_safe: false`
