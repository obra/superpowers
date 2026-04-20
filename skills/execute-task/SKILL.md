---
name: execute-task
description: Use when tasks are already captured in tasks.json and you want to select one task and run the full implementation lifecycle from planning through verified completion
---

# Execute Task

Run a task-centered workflow from `tasks.json`: select a task, gather missing context, create a plan, execute it, and verify results.

**Announce at start:** "I'm using the execute-task skill to run the selected task lifecycle."

## Scope

- **Source of truth:** `tasks.json` in the current project
- **Task lifecycle:** brainstorm -> plan -> execute -> verify
- **Out of scope:** git branch management, merges, PRs, or any git control actions

## Task Schema (minimum)

Each task entry should include:
- `id`
- `title`
- `status` (for example: `PENDING`, `IN_PROGRESS`, `DONE`, `BLOCKED`)

If task metadata is incomplete, ask targeted clarification questions before planning.

## The Process

1. **Load and Validate Tasks**
   - Open `tasks.json`.
   - If file missing, invalid, or empty: stop and ask user how to proceed.
   - Filter selectable tasks (default: `PENDING` and `BLOCKED`).

2. **Display and Select Task**
   - Show a numbered list: `id`, `title`, `priority` (if present), `status`.
   - Ask user to select by number or id.
   - Confirm the selected task before proceeding.

3. **Set Active Status**
   - Mark selected task as `IN_PROGRESS` in `tasks.json`.
   - Record `startedAt` timestamp if absent.

4. **Run Brainstorming**
   - **REQUIRED SUB-SKILL:** Use `spectral:brainstorming`.
   - Provide selected task details and user constraints.
   - Ensure user approves the written spec before planning.

5. **Write Implementation Plan**
   - **REQUIRED SUB-SKILL:** Use `spectral:writing-plans`.
   - Keep plan focused only on the selected task scope.

6. **Execute Plan**
   - Ask execution mode:
     1. `spectral:subagent-driven-development` (recommended)
     2. `spectral:executing-plans`
   - Execute all plan steps and required verifications.

7. **Verify Completion**
   - Confirm required tests/checks pass.
   - Confirm user-imposed constraints were followed.
   - Summarize results and remaining risks.

8. **Persist Outcome**
   - If complete: set task `status` to `DONE`, add `completedAt`.
   - If blocked: set `status` to `BLOCKED`, add `blocker` notes.
   - Save artifact references when available (`specPath`, `planPath`).

## Failure Handling

Stop and ask for guidance when:
- `tasks.json` cannot be parsed
- Selected task lacks enough detail after clarifications
- A required verification fails repeatedly
- The plan conflicts with explicit user constraints

Do not guess through blockers.

## Hard Rules

- Never modify unrelated tasks while executing one task.
- Never infer hidden requirements; ask.
- Never perform git control actions (branch creation, merge, PR, cleanup) as part of this skill.
- Keep all lifecycle decisions and output scoped to the selected task.
