---
name: team-driven-development
description: Use when the user explicitly requests a Codex team workflow, subagents, delegated workers, or parallel agent work.
---

# Team-Driven Development In Codex

## Core Idea

Codex does not provide a persistent team runtime. Team-driven development in Codex is an orchestration protocol run by the main Codex session using subagents.

The main session coordinates. Clean-context worker subagents implement. Separate reviewer subagents inspect the actual diff or patch and worker verification evidence. If review returns `Verdict: REJECT`, the main session sends revision instructions back through the rework loop.

## Activation Gate

Use this skill only when the user explicitly requests one of these:

- team-driven development
- team workflow
- a named team-driven workflow
- subagents
- delegated workers
- parallel agent work
- a reviewer agent workflow

Do not spawn agents just because the task is complex. Do not treat a plan recommendation as authorization. If the current user request did not explicitly authorize delegation, do not invoke this skill's delegated protocol or create agents.

### Pre-Authorization Signal For Callers

For broad, risky, or multi-owner work, the caller should pause and ask the user to confirm explicit team-mode authorization before invoking this skill.

High-risk work includes:

- Shared behavior that affects multiple features, commands, skills, or workflows.
- Security-sensitive changes or changes that could cause data loss.
- Data migrations, storage format changes, or irreversible operations.
- Public API contracts, CLI contracts, file formats, schemas, or protocol changes.
- Multi-module, multi-package, or multi-owner implementation plans.
- Broad refactors or mechanical rewrites across ownership boundaries.
- Parallel-safe independent tasks that would naturally be split across workers if team-mode were authorized.

This pre-authorization signal does not authorize delegation by itself. It is caller guidance for deciding when to ask the user. Once this skill is active, the main session must remain orchestration-only and must not edit directly.

## Non-Negotiable Rules

1. The main session MUST NOT edit files directly, write code directly, or modify production files directly while this skill is active.
2. The main session is responsible for orchestration, task boundaries, review routing, final verification, and user communication.
3. Each implementation task goes to a clean-context worker created with `spawn_agent`.
4. Each worker result must be reviewed by a separate reviewer created with `spawn_agent`; this per-worker review is not replaceable by a shared final audit.
5. Reviewer handoff MUST include the actual diff or patch, or require the reviewer to directly inspect the actual diff, plus the worker's verification evidence and command output.
6. Reviewers MUST NOT `APPROVE` from the worker summary, changed file list, or self-report alone.
7. A task is not complete until reviewer output ends with `Verdict: APPROVE`, the reviewer has checked the actual diff or patch and verification evidence, and the main session has inspected the result.
8. `Verdict: REJECT` triggers rework: the main session sends the reviewer findings back to the worker with `send_input`, waits for a revision, and sends the revised result to review again.
9. If a worker is closed before rework, try `resume_agent`; if that is unavailable or unsuitable, spawn a replacement worker with the prior diff, reviewer findings, exact ownership boundaries, and rework instructions.

## Roles

### Main Orchestrator

The current Codex session.

Responsibilities:

- Read the plan and split it into bounded tasks.
- Assign disjoint file ownership where possible.
- Use `update_plan` to track task state.
- Create workers and reviewers with `spawn_agent`.
- Give every subagent concrete instructions and file boundaries.
- Use `send_input` to route reviewer findings or follow-up instructions.
- Use `resume_agent` when a closed worker needs rework, or create a replacement worker with the previous context when resume is unavailable or unsuitable.
- Use `wait_agent` only when blocked on worker or reviewer output.
- Inspect diffs, test evidence, and reviewer findings before marking work complete.
- Give reviewers the actual diff or patch, or require them to inspect it directly, and include worker verification evidence or output.
- Run final verification before reporting success.

Restrictions:

- Do not perform implementation edits directly.
- Do not bypass reviewer validation.
- Do not mark a task complete based only on a worker's self-report.
- Do not accept reviewer approval unless it is based on the actual diff or patch and verification evidence.
- Do not let subagents work on overlapping files unless the overlap is intentional and coordinated.

### Worker Subagent

A worker is a clean-context implementation agent created for one bounded task.

Worker prompt must include:

- The exact task objective.
- The files or modules the worker owns.
- The verification command or expected evidence.
- A reminder that other agents may be working in the codebase.
- An instruction not to revert or overwrite changes made by others.
- An instruction to report changed files, verification commands run, verification output or evidence, and any blockers.

Workers implement the task and report results. They do not approve their own work.

### Reviewer Subagent

A reviewer is a separate clean-context validation agent created after worker output is available.

Reviewer prompt must include:

- The original task objective.
- The worker's summary and changed file list.
- The actual diff or patch, or an instruction to directly inspect the actual diff before deciding.
- The worker's verification commands and evidence or output.
- The review criteria.
- A required final line of exactly `Verdict: APPROVE` or `Verdict: REJECT`.

Review criteria:

- Plan compliance.
- Scope control and file ownership.
- Correctness of behavior.
- Test or verification evidence.
- Alignment between the actual diff or patch and the worker's stated result.
- Integration risk with nearby code.
- Missing edge cases or documentation needed for the task.

Reviewers must not approve based on worker summary, changed file list, or self-report alone. `Verdict: APPROVE` is allowed only after checking the actual diff or patch and the verification evidence.

Reviewer output must include:

- Findings: concrete issues, if any.
- Required revisions: specific changes needed when rejected.
- Verification notes: commands reviewed or still required.
- A final line exactly `Verdict: APPROVE` or `Verdict: REJECT`.

## Orchestration Loop

For each task:

1. Mark the task `in_progress` with `update_plan`.
2. Spawn a worker with `spawn_agent`.
3. Continue only non-editing local orchestration work, such as planning, routing, and status checks, that does not overlap with the worker.
4. Use `wait_agent` when the next step is blocked on the worker result.
5. Review the worker's changed files, summary, actual diff or patch, and verification evidence.
6. Spawn a separate reviewer with `spawn_agent`, providing the actual diff or patch or requiring direct diff inspection, plus the worker's verification evidence.
7. Use `wait_agent` when blocked on reviewer output.
8. If the reviewer final line is `Verdict: APPROVE`, confirm approval is based on actual diff or patch review and verification evidence, inspect the diff, and mark the task complete.
9. If the reviewer final line is `Verdict: REJECT`, send the findings to the worker with `send_input` for revision. If the worker is closed, try `resume_agent`; if resume is unavailable or unsuitable, spawn a replacement worker with the prior diff, reviewer findings, exact ownership boundaries, and rework instructions.
10. Repeat review until the task is approved or a blocker requires user input.

## Rework Loop Limits

If the same task receives two consecutive `Verdict: REJECT` verdicts:

1. Stop assigning more implementation work for that task.
2. Summarize the repeated findings.
3. Re-check the task boundaries and plan assumptions.
4. Decide whether to clarify with the user, split the task, or spawn a new worker with narrower instructions.

Do not keep cycling vague rejection feedback. Make the next instruction more specific or revisit the design.

## Parallel Execution

Parallel worker subagents are allowed only when tasks are independent.

Before spawning parallel workers, confirm:

- File ownership is disjoint or conflicts are explicitly coordinated.
- Each task can be verified independently.
- The main session can review and integrate the outputs.
- Each worker result gets a separate reviewer; do not substitute a shared final audit for per-worker review.

If tasks are tightly coupled, run the same worker/reviewer loop sequentially.

## Final Integration Gate

After all tasks are approved:

1. Re-read the original plan or user request.
2. Inspect the full diff locally.
3. Run the relevant test or compatibility commands.
4. Route any remaining review findings to the appropriate worker with `send_input`; the main session must not fix them directly.
5. Send the revised result to a separate reviewer subagent for re-review before accepting it.
6. Escalate unresolved issues to the user as blockers instead of bypassing review or editing directly.
7. Use `verification-before-completion` before claiming completion.

Worker approval and reviewer approval are necessary, but not sufficient. The main session still owns final integration quality.
