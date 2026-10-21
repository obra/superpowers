---
name: executing-plans
description: Execute implementation plans sequentially within the active session through ledger-tracked test-driven verification and branch-level code review when the human partner selects inline execution or when operating in a single-agent harness environment.
---

# Executing Plans

## Activation Conditions

- Activate inline plan execution when an implementation plan from `superpowers:writing-plans` is handed off for in-session execution, when the execution harness operates as a single-agent environment (referenced in `../using-superpowers/references/`), or when individual tasks maintain independent execution scopes.
- Route execution to `superpowers:subagent-driven-development` when the human partner requests per-task review gates or when the task count exceeds single-session context capacity prior to compaction.
- Notify the human partner at session initialization that inline task transcription and test execution run on the active session model while the final branch review dispatches to the highest-capacity reasoning model.

## Operational Authority & Governance

- Execute each task from `PLAN_FILE` sequentially within the active session, limiting inter-tool narration to a single status line per tool invocation.
- Proceed directly from each completed task to the next pending task in `PLAN_FILE`, pausing for human partner confirmation exclusively prior to executing irreversible or destructive operations, performing security-sensitive actions, triggering side effects outside the isolated git worktree (branch merges, shared branch pushes, package publishing), or encountering structural defects in `PLAN_FILE` that prevent deterministic resolution via `SPEC_FILE` and codebase inspection.
- Resolve conflicts between project artifacts according to the descending authority hierarchy: `SPEC_FILE > PLAN_FILE > LEDGER_FILE (Ruling entries) > Implementation Code`.
- Resolve state-tracking discrepancies after context compaction according to the descending persistence hierarchy: `LEDGER_FILE (<workspace>/progress.md) + git log > Session Todo List`.
- Record every conflict resolution, ambiguity settlement, or plan adjustment in `<workspace>/progress.md` using the schema `Ruling: <what you decided> — <why> — <what it costs if wrong>` prior to continuing task execution:
  + `Requirement or Interface Conflict` ➔ `SPEC_FILE Authority`
  + `Unspecified Implementation Detail` ➔ `Ledgered Implementer Ruling`
  + `Post-Compaction Progress State` ➔ `<workspace>/progress.md + git log`

## Environment & Ledger Initialization

- Provision or verify an isolated git worktree via `superpowers:using-git-worktrees` prior to modifying repository files, requesting explicit human partner consent before executing on a `main` or `master` branch.
- Execute `../subagent-driven-development/scripts/sdd-workspace PLAN_FILE` at session start to resolve the plan-scoped workspace directory `<repo-root>/.superpowers/sdd/<plan-basename>/`, restricting workspace file operations to that directory.
- Resume execution at the first task index `N` outside the recorded `Task <N>: complete` entries when `<workspace>/progress.md` begins with the current `PLAN_FILE` header.
- Initialize a new `<workspace>/progress.md` file with the first line `# SDD ledger — plan: <plan file path>` when starting in an empty workspace or when an existing ledger header references a different plan path.
- Reconstruct completed task entries in `<workspace>/progress.md` from `git log` commit ranges when `git clean -fdx` removes the git-ignored workspace directory.
- Read `PLAN_FILE`, extract `Global Constraints`, initialize one session todo item per task, and read the referenced `SPEC_FILE` (appending a provisional-ruling note to `<workspace>/progress.md` when `PLAN_FILE` omits a `SPEC_FILE` reference).
- Load `superpowers:test-driven-development` prior to Task 1 to govern every implementation and verification step.
- Scan `Interfaces` blocks across tasks in `PLAN_FILE` prior to Task 1, recording one row in `<workspace>/progress.md` per producer-consumer task pair to reconcile shared signatures against `SPEC_FILE` (or recording the single line `Pre-flight: no shared interfaces` when tasks share zero interfaces).

## Per-Task Execution Protocol

### Task Acquisition

- Execute `scripts/task-start PLAN_FILE N` to retrieve the task brief path and the `BASE` commit hash defining the task diff boundary.
- Read the task brief file from disk for Task `N` to extract parameter values, function signatures, and test cases, then set the corresponding session todo item to `in_progress`.
- Batch ledger append operations into the same turn as commit or verification tool calls to conserve context capacity.

### Step Execution & Verification

- Execute each step in the task brief sequentially under `superpowers:test-driven-development`, writing and running each failing test (`RED`) prior to writing the implementation code that transitions the test to passing (`GREEN`).
- Redirect verbose test command output to a log file inside `<repo-root>/.superpowers/sdd/<plan-basename>/` and read the output tail.
- Compare the actual command output of each verification step against the brief's `Expected:` specification and execute the matching resolution branch:
- Advance to the next step in the task brief when the command output matches the `Expected:` specification.
- Invoke `superpowers:systematic-debugging` to isolate and repair the root cause in the implementation code when the command output diverges due to a code defect.
- Apply the minimal adjustment satisfying `SPEC_FILE` and append `Task <N>: Ruling: <finding> — <what you decided and why>` to `<workspace>/progress.md` when the command output diverges due to a plan defect or cross-task interface mismatch:
  + `install_hook` (Consumer Brief Identifier) ➔ `installHook` (Upstream Task `Produces` Export)
- Create git commits at each commit step specified in the task brief, preserving `BASE` from `scripts/task-start` as the task diff boundary across single-commit and multi-commit tasks.

### Completion Contract & Recording

- Verify task completion readiness under `superpowers:verification-before-completion` by confirming inside the active session that every test named in the brief exists and ran with its output inspected, every `Expected:` specification matched actual output, every deviation from the brief has a corresponding `Ruling:` entry in `<workspace>/progress.md`, and the task verification command passes.
- Execute `scripts/task-done PLAN_FILE N BASE -- <test command>` using the brief's task test command to run the task test suite, store untruncated output in the workspace, print the output tail, and append the completion entry upon test passage:
  `Task <N>: complete (commits <base7>..<head7>, tests: <command> → <result>)`
- Mark the session todo item for Task `N` as `complete` once `scripts/task-done` records the completion entry in `<workspace>/progress.md`, then advance to Task `N+1`.

## Branch Review & Remediation

- Execute `../subagent-driven-development/scripts/review-package PLAN_FILE MERGE_BASE HEAD` (resolving `MERGE_BASE` via `git merge-base main HEAD`) after the final task completion entry to generate the branch review package.
- Dispatch `superpowers:requesting-code-review` using `[code-reviewer.md](../requesting-code-review/code-reviewer.md)` on the highest-capacity reasoning model (explicitly specified in the dispatch parameters) when a subagent tool is available, passing the review package path, `PLAN_FILE` path, `SPEC_FILE` path, the verbatim `Review Focus` section from `PLAN_FILE`, and the `Ruling:` entries from `<workspace>/progress.md`.
- Execute the `[code-reviewer.md](../requesting-code-review/code-reviewer.md)` review checklist directly against the review package in a dedicated post-task pass when operating in a single-agent harness, append `Final review: self-review (no subagent tool)` to `<workspace>/progress.md`, and report the self-review mode in the final response for human partner merge evaluation.
- Evaluate each item in the reviewer's `"Declined to judge"` list and append a ruling to `<workspace>/progress.md` using the schema:
  `Final: Ruling: <behavior the reviewer set aside> — <what a reasonable person using this software gets, and why that stands or why it is now a finding> — <cost if wrong>`
- Re-classify each reviewer finding based on runtime effect delivered to the end user prior to remediation (`Runtime Effect on End-User > Reviewer Severity Label`):
  + `Hardcoded progress reporting interval` (Runtime Configuration Defect) ➔ `Important` (Single-Pass TDD Remediation)
  + `Missing README usage example` (Documentation Polish) ➔ `Minor` (Deferred Ledger Entry)
  + `Single-file verify/repair module layout` (Structural Style Preference) ➔ `Minor` (Deferred Ledger Entry)
- Remediate every `Critical` and `Important` finding selected for repair within a single fix pass by writing a failing reproduction test (`RED`), implementing the fix to pass the test (`GREEN`), executing the project test suite, and appending `Final: fixed <finding> — <test name> RED→GREEN, suite <N>/<N>` to `<workspace>/progress.md`.
- Record every `Critical` or `Important` finding retained as-is by appending `Final: Ruling: <finding> — <why the code stands> — <cost if wrong>` to `<workspace>/progress.md`.
- Record every `Minor` finding as a deferred entry by appending `Final: minor (deferred): <one-liner>` to `<workspace>/progress.md`.

## Branch Finalization & Reporting

- Compile every `Ruling:` entry from `<workspace>/progress.md` in chronological order (including the associated cost if wrong) under the heading `"Rulings I made"` and every `minor (deferred)` entry under the heading `"Deferred minors"` in the final response to the human partner.
- Remove the plan workspace directory `<repo-root>/.superpowers/sdd/<plan-basename>/` once the remediation commits are recorded and the project test suite passes, preserving sibling plan directories.
- Invoke `superpowers:finishing-a-development-branch` to complete branch handoff.
