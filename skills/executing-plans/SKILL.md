---
name: cortx:executing-plans
description: "Execute implementation plans using cortx orchestration cycle. Claims tasks from the board, executes with proxy_exec, validates gates, and releases. Use when executing a plan in an inline session (not subagent-driven)."
---

# Executing Plans

## Overview

Inline execution of a plan with cortx board tracking. Each task follows the
**claim -> context -> execute -> gate -> release** cycle. All commands run
through `proxy_exec`; all progress is tracked on the board.

For subagent-driven execution, use `cortx:subagent-driven-development` instead.

**Announce at start:** "I'm using the executing-plans skill to implement this plan."

## Prerequisites

Before starting execution, ensure:

1. **Plan file exists** — a written plan produced by `cortx:writing-plans`
2. **Tasks on the board** — created via `planning_decompose` during planning
3. **Worktree ready** — isolated workspace set up via `cortx:using-git-worktrees`

## Per-Task Execution Loop

For each task on the board (use `planning_next_task` to pick the next one):

### 1. CLAIM

Call `planning_claim_task` with the task ID. This marks the task as in-progress
and prevents other agents from picking it up.

### 2. CONTEXT

Call `memory_recall` with relevant queries — the task's error patterns, file
paths, and domain terms. Use the returned context to inform your approach.

### 3. EXECUTE

Follow the task steps from the plan. Every shell command must go through
`proxy_exec` — never use Bash directly. Work through each step sequentially.

### 4. GATE

Call `planning_validate_gates` to run the quality checks:
- `cargo clippy --workspace -- -D warnings`
- `cargo test --workspace`
- `cargo build --workspace`

All gates must pass before releasing the task.

### 5. RELEASE

Call `planning_release_task` with the task ID and status:
- **done** — all gates passed
- **failed** — gates did not pass after retries (see failure handling below)

## On Failure

When a step or gate fails:

1. **Retry with context** — call `memory_recall` with the error message and
   relevant file paths. Use the enriched context to fix the issue.
2. **Up to 3 retries** — attempt the fix, then re-run the failing gate.
3. **After 3 retries** — call `planning_escalate` with:
   - Number of attempts made
   - Error messages from each attempt
   - Suggested next step or workaround
4. **Release as failed** — `planning_release_task` with status `failed`.
5. **Move on** — pick the next available task via `planning_next_task`.

## On Task Completion

After each successful task release:

1. **Store patterns** — call `memory_store` with any patterns, gotchas, or
   solutions discovered during implementation.
2. **Next task** — continue the loop with `planning_next_task`.

## After All Tasks

When no tasks remain on the board:

- Invoke `cortx:finishing-a-development-branch` to verify the full build,
  present options to the user, and complete the branch.

## Integration

**Required cortx skills:**
- `cortx:using-git-worktrees` — isolated workspace before starting
- `cortx:writing-plans` — produces the plan and board tasks this skill executes
- `cortx:finishing-a-development-branch` — completes development after all tasks
- `cortx:subagent-driven-development` — alternative when subagents are available

## Red Flags

- **Never skip gates** — every task must pass clippy, test, and build
- **Never use Bash directly** — all commands go through `proxy_exec`
- **Always claim before working** — unclaimed tasks may be picked up by others
- **Never force through blockers** — escalate after 3 retries, don't guess
- **Never start on main/master** — ensure you are in an isolated worktree
