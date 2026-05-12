# Parallel-First Subagent Workflows

**Date:** 2026-05-11
**Status:** Draft
**Skills affected:** `writing-plans`, `subagent-driven-development`, `executing-plans`, `dispatching-parallel-agents`

## Problem

Current skills treat parallel subagent dispatch as an exception case. `subagent-driven-development` explicitly says "Never dispatch multiple implementation subagents in parallel (conflicts)." `dispatching-parallel-agents` exists but is shallow and framed as opt-in for the rare case of "multiple unrelated failures."

This serializes work that could run concurrently. Tasks that touch disjoint files have no real reason to wait on each other. Sequential dispatch wastes wall-clock time and forces the controller to hold context for tasks that could be fully isolated.

## Goal

Make parallel execution the default path when task structure allows it, using git worktrees for isolation and backgrounded agents for concurrency. Sequential remains the fallback for coupled tasks. The choice falls out of plan structure automatically — author writes dependencies, controller computes parallelism.

## Non-Goals

- Cross-task communication (agents cannot talk to each other)
- Mid-task replanning
- Distributed execution across machines
- Auto-resolving merge conflicts (always escalated to human via PR)

## Architecture

Controller session orchestrates a DAG of tasks. Each ready task dispatches a background subagent into its own git worktree. Controller is notified on completion, attempts auto-merge into the work branch. Conflicts push the worktree branch and open a draft PR for the human to resolve on GitHub. Per-task review pipeline runs fully autonomously inside each worktree before the task reports DONE.

Components:

- **Plan format** — tasks declare `id`, `depends_on`, optional `parallel_safe`
- **Controller loop** — ready-set computation, dispatch, merge, repeat
- **Per-task pipeline** — implementer → spec reviewer → code-quality reviewer, all background, all inside the worktree
- **Worktree lifecycle** — created per task via `Agent(isolation: "worktree")`, agent commits there, controller merges, worktree auto-cleaned
- **Conflict path** — abort merge, push branch, `gh pr create --draft`, surface URL, mark task BLOCKED-on-human, continue other ready tasks

## Plan Format Change (`writing-plans`)

Each task gets a small metadata block:

```markdown
### Task 3: Add retry logic to fetcher

**id**: retry-fetcher
**depends_on**: [extract-fetcher-module]
**parallel_safe**: true   # default true, omit unless false

[task body unchanged]
```

Rules:

- `id` required if any task in the plan uses `depends_on`
- Omitted `depends_on` → empty deps (root task, eligible immediately)
- Omitted `parallel_safe` → true
- Plans with zero `depends_on` declarations across all tasks → controller falls back to sequential mode (back-compat with existing plans)

## Plan Design Heuristic (in `writing-plans`)

When drafting a plan, the author (or planning agent) actively organizes for parallelism with clean merges:

1. **Decompose by file/module boundary first.** Tasks touching disjoint files are parallel-safe by construction.
2. **Identify shared edits early.** If multiple tasks need the same file, restructure: extract the shared edit as an upstream task; the others depend on it.
3. **Push integration to leaves.** Wiring and glue tasks live late in the DAG and depend on the units they integrate. Unit work stays parallel; only integration serializes.
4. **Maximize ready-set width.** The goal is the fattest possible parallel layer at each round. If the DAG looks like a chain, reconsider whether tasks can split.
5. **Predict merge cleanliness per task.** For each task, list the files it will touch. If any file appears in a sibling task, those tasks are not actually parallel — add a dependency or merge them.
6. **`parallel_safe: false` is a last resort.** Only for genuinely global state (env, DB migrations, config singletons). Most apparent conflicts resolve through dependencies instead.

Each plan includes a brief **Parallelism analysis** section: ready-set width per layer, sequential bottlenecks, justification for any `parallel_safe: false` task.

## Controller Loop (`subagent-driven-development`)

```
build DAG from plan
done = {}
blocked = {}
while done | blocked != all_tasks:
    ready = {t for t in tasks
             if t not in done and t not in blocked
             and all(d in done for d in t.depends_on)}
    if not ready and pending_background == 0:
        ERROR (cycle, all blocked, or stuck)

    parallel_batch = [t for t in ready if t.parallel_safe]
    sequential     = [t for t in ready if not t.parallel_safe]

    # Parallel: dispatch all backgrounded with worktree isolation
    for t in parallel_batch:
        Agent(isolation="worktree",
              run_in_background=true,
              prompt=per_task_pipeline_prompt(t))

    # Sequential: foreground, no worktree (faster path)
    for t in sequential:
        Agent(prompt=per_task_pipeline_prompt(t))  # blocks
        merge_result(t)

    # Collect parallel as they finish (notification-driven, no polling)
    on each background completion:
        merge_result(t)  # see Merge Logic
```

The implementer prompt wraps the entire per-task pipeline (implement → spec review → quality review → fix loops) inside the one worktree subagent. Controller dispatches one background agent per task; that agent internally runs the review chain and only returns DONE / BLOCKED. Controller stays simple.

## Merge Logic

Per returned worktree:

1. `git fetch <worktree-branch>`
2. `git merge --no-ff <worktree-branch>` into the work branch
3. Clean merge → run tests → if pass, mark DONE; if tests fail, dispatch a fix subagent (in a fresh worktree off the merged state)
4. Conflict → `git merge --abort`, `git push -u origin <worktree-branch>`, `gh pr create --draft --title "Task: <id>"` → surface PR URL to human, mark task BLOCKED-on-human

The pipeline does not halt on a conflict. Other ready tasks continue. The human resolves on GitHub at their own pace and tells the controller "merged X" to resume.

## Per-Task Review Pipeline

Per-task review is preserved but runs fully background, with no user prompts. Inside each worktree, the per-task agent runs serially:

1. **Implementer** — implements + tests + commits + self-reviews
2. **Spec reviewer** (background subagent) — if issues, dispatch fix subagent → re-review until ✅
3. **Code-quality reviewer** (background subagent) — if issues, dispatch fix subagent → re-review until ✅
4. Worktree returns to controller as DONE

Reviewer subagents are explicitly instructed: do not escalate to the human; if uncertain, approve with noted concerns in the summary. The final code-quality review on the merged branch acts as a backstop for anything reviewers waved through.

Hard stop: reviewer fix loop exceeds N iterations (default 3) → mark BLOCKED with full transcript, surface to human, controller continues other ready tasks.

After all tasks reach DONE (including any human-merged conflict PRs), controller dispatches one final code-quality reviewer subagent on the full diff vs. main.

## Skill Modifications

| Skill | Change |
|---|---|
| `writing-plans` | Add task `id` / `depends_on` / `parallel_safe` format. Add **Plan Design Heuristic** section. Require **Parallelism analysis** section in output. |
| `subagent-driven-development` | Replace top-level flow with the parallel DAG loop. Move existing two-stage sequential review note to a **Sequential mode** subsection (used when plan has no `depends_on`). Final review on merged branch is added. Remove "Never dispatch multiple implementation subagents in parallel." |
| `executing-plans` | Same DAG loop, but tasks dispatch as parallel sessions (handoff format) instead of in-session subagents. Worktree+branch handoff per task. |
| `dispatching-parallel-agents` | Promote to canonical "how to dispatch": worktree + background pattern documented in detail. Becomes the reference all other skills link to. Remove "Don't use when shared state" framing — replace with "use `parallel_safe: false` instead." |

## Edge Cases

- **Cycle in DAG** — controller errors before any dispatch, surfaces to human
- **Worktree creation fails** — fall back to sequential execution for that task
- **Background agent never returns** — timeout (default 30 min, configurable) → mark BLOCKED, surface
- **Test suite flaky after merge** — re-run once; if still failing, BLOCKED
- **All ready tasks are `parallel_safe: false`** — degrades gracefully to sequential
- **Plan with no DAG declared** — full back-compat sequential mode
- **Reviewer loop exceeds N iterations** — BLOCKED with transcript, controller continues

## Open Questions

None at this time.
