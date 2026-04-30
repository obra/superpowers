---
name: dispatching-parallel-agents
description: Use when 2+ independent tasks can be worked on concurrently without shared state, overlapping files, or sequential dependencies.
---

# Dispatching Parallel Agents In Codex

## Core Idea

Parallel agents are useful only when the work can be split into independent domains. In Codex, parallel delegation is gated by explicit user authorization.

Use `spawn_agent` only when the user asks for subagents, delegated workers, parallel agent work, a team workflow, or a reviewer workflow. Otherwise, do the work inline and use `update_plan` for local tracking.

## When To Use

Use this skill when all are true:

- There are at least two independent problems, tasks, or implementation slices.
- Each slice has a disjoint write set or can be assigned read-only investigation.
- Each slice can be verified independently.
- The main Codex session can integrate and review the results.
- The user explicitly authorized delegation or parallel agent work.

Do not parallelize when:

- One fix may change the requirements or result of another.
- Tasks need shared local state, shared generated files, or sequential migrations.
- File ownership overlaps and the overlap is not explicitly coordinated.
- You only need one focused investigation.
- The user did not authorize subagents or delegation.

## Split The Work

For each worker, define:

- Objective: one clear problem domain or task.
- Owned write paths: exact files or directories the worker may edit.
- Forbidden paths: files that belong to other workers or are out of scope.
- Verification: commands or evidence the worker must report.
- Handoff: changed files, summary, verification output, blockers, and any assumptions.

Prefer smaller worker scopes over broad ones. Workers should not have to infer boundaries from a long plan.

## Parallel Dispatch Protocol

1. Confirm the delegation gate is open from the user's request.
2. Group tasks by independent domain and disjoint write ownership.
3. Record the split with `update_plan`.
4. Create one worker per independent slice with `spawn_agent`.
5. Continue only orchestration work in the main session while workers run.
6. Use `wait_agent` when blocked on a worker result.
7. Inspect each worker's reported files and local diff before accepting the result.
8. Run the worker's verification or a combined verification command after integrating results.

Worker prompts must say that other agents may be editing the codebase and that the worker must not revert, overwrite, stage, commit, or format unrelated changes.

## Review And Integration

Every implementation worker result needs review before it is considered done.

Reviewer handoff should include:

- Original task objective and ownership boundaries.
- Worker summary and changed files.
- Actual `git diff` output or file patch text whenever practical.
- Verification commands and exact output or evidence from the worker.
- A required final verdict line: `Verdict: APPROVE` or `Verdict: REJECT`.

Reviewers must inspect the actual diff or patch and verification evidence. A worker summary alone is not enough.

If review rejects the work, send the findings back with `send_input`. If the worker is no longer available, use `resume_agent` when possible; otherwise spawn a replacement worker with the previous diff, reviewer findings, exact ownership boundaries, and rework instructions.

## Common Mistakes

- Dispatching workers for related failures before understanding whether one root cause explains them.
- Giving two workers the same write paths.
- Letting workers edit generated files, package locks, or shared docs without explicit ownership.
- Accepting "tests passed" without the command and output.
- Asking a reviewer to judge from a summary instead of the actual diff or patch.

## Completion Gate

Before reporting success:

1. Check the final diff for scope control.
2. Confirm no worker edited outside its owned paths.
3. Run the relevant verification in the current session.
4. Report unresolved blockers instead of silently fixing another worker's ownership area.
