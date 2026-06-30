---
name: executing-plans
description: Use when you have a written implementation plan to execute in a separate session with review checkpoints
---

# Executing Plans

## Overview

Load plan, review critically, execute all tasks, report when complete.

**Announce at start:** "I'm using the executing-plans skill to implement this plan."

**Note:** Tell your human partner that Superpowers works much better with access to subagents. The quality of its work will be significantly higher if run on a platform with subagent support (Claude Code, Codex CLI, Codex App, and Copilot CLI all qualify; see the per-platform tool refs in `../using-superpowers/references/`). If subagents are available, use superpowers:subagent-driven-development instead of this skill.

## Task Graph (optional)

A plan may be accompanied by a **task graph** — a small JSON file that tracks task status and dependencies as a directed acyclic graph. It is committed alongside the plan (not git-ignored scratch) and exists for one reason: when a session is interrupted and resumed, the resumed agent recovers "where am I" by reading this one small file instead of re-reading the whole plan and re-deriving progress from git history.

This is **entirely optional**. If the plan has no accompanying task graph, ignore this section and follow The Process below as-is. Nothing else in this skill changes when a graph is absent.

**When a graph exists** (`<feature>.tasks.json` next to the plan, or wherever the plan's front matter points), it looks like this (see `scripts/example-tasks.json` for a full example):

```json
{
  "version": 1,
  "metadata": {
    "featureId": "export-to-csv",
    "title": "Export query results to CSV",
    "planPath": "docs/superpowers/plans/2026-06-29-export-to-csv.md",
    "createdAt": "2026-06-29",
    "updatedAt": "2026-06-29"
  },
  "tasks": [
    { "id": "T1", "title": "Add CSV serializer + failing tests", "status": "done",   "dependencies": [] },
    { "id": "T2", "title": "Wire serializer into query service", "status": "done",   "dependencies": ["T1"] },
    { "id": "T3", "title": "Expose GET /export.csv endpoint",     "status": "in_progress", "dependencies": ["T2"] }
  ]
}
```

- `status` is one of `pending` | `in_progress` | `done` | `blocked` | `cancelled`. `done` and `cancelled` both satisfy a dependency.
- `dependencies` lists ids that must be `done`/`cancelled` before this task can start. An empty array means the task is independent. Task ids are arbitrary strings but **must not contain a comma** (commas separate dependency ids internally).
- An optional `parentId` may group tasks into subtasks (e.g. id `3.1` under parent `3`); it is validated to reference a known id.
- The graph is the **single source of truth for status**. Do not track progress only in chat or only in todos — edit the graph's `status` (and bump `metadata.updatedAt`) whenever a task starts or finishes.

**Validate before trusting a graph** (catches cycles, dangling refs, bad status values):

```
scripts/task-graph validate <path-to-graph.json>
```

**Find tasks ready to start** — only `pending` tasks whose dependencies are all `done`/`cancelled`:

```
scripts/task-graph ready <path-to-graph.json>
```

Run both from this skill's directory. They require `jq` (`brew install jq` / `apt install jq`).

Note: `ready` does **not** list tasks already `in_progress` — to find the task you were mid-way through, scan the graph for `status: "in_progress"` directly.

**Relationship to subagent-driven-development:** SDD keeps its own progress ledger (`.superpowers/sdd/progress.md`) for the subagent path. This task graph serves the *non-subagent* path used here. They do not interact; do not mix them for the same plan.

## The Process

### Step 1: Load and Review Plan
1. Read plan file
2. Review critically - identify any questions or concerns about the plan
3. If concerns: Raise them with your human partner before starting
4. If no concerns: Create todos for the plan items and proceed

### Step 2: Execute Tasks

For each task:
1. Mark as in_progress
2. Follow each step exactly (plan has bite-sized steps)
3. Run verifications as specified
4. Mark as completed

**If a task graph accompanies the plan**, mirror these transitions in the graph: set `status` to `in_progress` when you start a task, and to `done` (or `blocked` / `cancelled`) when it finishes, bumping `metadata.updatedAt` each time. Use `scripts/task-graph ready` to pick the next task whose dependencies are satisfied rather than guessing from the plan prose.

### Step 3: Complete Development

After all tasks complete and verified:
- Announce: "I'm using the finishing-a-development-branch skill to complete this work."
- **REQUIRED SUB-SKILL:** Use superpowers:finishing-a-development-branch
- Follow that skill to verify tests, present options, execute choice

## Resuming After Interruption

When you resume a plan that was interrupted mid-execution (new session, context compaction, etc.):

1. **If a task graph exists**, read it first. It tells you everything you need about status in one pass:
   - Any task with `status: "in_progress"` is where work stopped — resume it directly (no graph write is needed; it is already `in_progress`).
   - Run `scripts/task-graph ready <graph.json>` to list the `pending` tasks whose dependencies are now satisfied and may be picked up.
   - `done` and `cancelled` tasks are finished — never redo them.
   Do not re-derive progress from the plan or git history; the graph is the source of truth.
2. **If no task graph exists**, read the plan, then reconcile against `git log` to reconstruct what was completed. This is the slower path; a task graph exists precisely to avoid it.

In either case, never mark a task `done` without running its verifications.

## When to Stop and Ask for Help

**STOP executing immediately when:**
- Hit a blocker (missing dependency, test fails, instruction unclear)
- Plan has critical gaps preventing starting
- You don't understand an instruction
- Verification fails repeatedly

**Ask for clarification rather than guessing.**

## When to Revisit Earlier Steps

**Return to Review (Step 1) when:**
- Partner updates the plan based on your feedback
- Fundamental approach needs rethinking

**Don't force through blockers** - stop and ask.

## Remember
- Review plan critically first
- Follow plan steps exactly
- Don't skip verifications
- Reference skills when plan says to
- Stop when blocked, don't guess
- Never start implementation on main/master branch without explicit user consent

## Integration

**Required workflow skills:**
- **superpowers:using-git-worktrees** - Ensures isolated workspace (creates one or verifies existing)
- **superpowers:writing-plans** - Creates the plan this skill executes
- **superpowers:finishing-a-development-branch** - Complete development after all tasks
