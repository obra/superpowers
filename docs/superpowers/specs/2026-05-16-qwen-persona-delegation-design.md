# Qwen Persona Delegation Across the Development Workflow

**Date:** 2026-05-16
**Author:** Kyle Diedrick (with Claude)
**Status:** Approved, ready for implementation

## Problem

The `subagent-driven-development` skill already delegates the *implementer* role to
a local Qwen instance via `mcp__qwen-mcp__delegate_to_qwen`, at zero marginal cost.
But the rest of the development workflow — drafting the design spec, writing the
implementation plan, authoring tests, updating documentation — still consumes paid
Claude tokens for what is largely *production* work: turning decisions Claude has
already made into a concrete artifact.

Claude should remain the "smart manager": it does the judgment work (deciding what
to build, resolving ambiguity, locking in decisions) and hands a precise brief to a
task-specialized Qwen agent that produces the artifact.

## Goals

- Add four Qwen personas alongside the existing implementer: **feature designer**,
  **planner**, **test author**, **documenter**.
- Each persona lives in its natural home skill and is triggered at that skill's
  produce-artifact step.
- Claude composes a complete brief before every delegation; Qwen never has to make
  the judgment calls Claude already made.
- Reuse the delegation discipline (`stop_reason` handling, right-sizing, context
  prep) already tuned in `subagent-driven-development` rather than re-deriving it.

## Non-goals

- No new skill. Personas are added to existing skills (per project decision).
- No persona/system-prompt parameter on the MCP tool — it accepts only
  `task` / `working_dir` / `context_hints`. Persona identity is baked into the
  `task` string.
- No Qwen involvement in code review. Spec-compliance and code-quality review stay
  Claude subagents, as they do today.
- No tiered model selection (Qwen vs. Claude per task complexity).

## Personas

| Persona | Home skill | Trigger point | Judgment latitude |
|---|---|---|---|
| Feature designer | `brainstorming` | Step 6 — "Write design doc" | Highest: latitude on doc structure and prose |
| Planner | `writing-plans` | After File Structure + task outline | Moderate: expands tasks, writes code blocks |
| Test author | `subagent-driven-development` | Per task, before implementer | Low: writes test code from named behaviors |
| Documenter | `finishing-a-development-branch` | New step after test verification | None: pure scribe |

**Division of labor.** Claude always makes the judgment calls and writes the brief.
Qwen produces the artifact. The personas sit at different points on a judgment
spectrum:

- **Documenter** — pure scribe. Claude names every doc to touch and the substance
  of each change; Qwen only phrases it.
- **Test author** — mostly mechanical. Claude names the behaviors and edge cases to
  cover; Qwen writes idiomatic, failing test code.
- **Planner** — moderate. Claude locks the decomposition (File Structure map and the
  task list); Qwen expands each task into bite-sized steps and writes the code
  blocks.
- **Feature designer** — most latitude. Claude supplies all substance and every
  resolved decision; Qwen has latitude on how to structure the document and word it.

## Architecture

No new skill. Each persona gets one prompt file alongside its home skill's
`SKILL.md`, mirroring the existing `implementer-prompt.md` pattern:

- `skills/brainstorming/feature-designer-prompt.md`
- `skills/writing-plans/planner-prompt.md`
- `skills/subagent-driven-development/test-author-prompt.md`
- `skills/finishing-a-development-branch/documenter-prompt.md`

Each prompt file contains three parts:

1. **Persona preamble** — the role identity and judgment latitude, written to be
   prepended verbatim into the `task` string Claude sends to Qwen.
2. **Brief Preparation checklist** — what Claude must nail down *before* delegating
   (the "important details" the manager lays out). This is the persona-specific
   counterpart to `implementer-prompt.md`'s "Context Preparation" section.
3. **Delegation-call template** — the `delegate_to_qwen` call shape with `task`,
   `working_dir`, `context_hints`.

### Shared delegation discipline (no duplication)

`subagent-driven-development/SKILL.md` and `implementer-prompt.md` already hold the
tuned delegation discipline: `stop_reason` mapping, budget-hit decomposition,
right-sizing checks, and fix-loop context discipline. The three new persona files do
**not** restate this. Each one cross-references
`subagent-driven-development/implementer-prompt.md` for the shared `stop_reason`
mechanics and states only what is persona-specific. Single source of truth, no new
skill.

## Per-Skill Integration

### brainstorming → feature designer

Checklist step 6 ("Write design doc") currently has Claude write the spec directly.
Change: after the design is approved with the user (step 5), Claude composes the
brief — every design section, every resolved decision and tradeoff, the exact spec
file path — and delegates the *writing* of the spec file to the Qwen feature
designer via `feature-designer-prompt.md`.

- Step 7 (spec self-review) is unchanged in intent but now reviews Qwen's draft:
  Claude runs the existing placeholder / consistency / scope / ambiguity checks. If
  issues are found, Claude re-delegates a focused fix or fixes inline.
- Step 8 (user reviews the written spec) is unchanged.
- The terminal state is still invoking `writing-plans`.

Edit surface: `brainstorming/SKILL.md` step 6 wording + a pointer to the new prompt
file. The tuned behavior-shaping prose (Red Flags, anti-patterns, process diagram)
is not touched.

### writing-plans → planner

Claude still does the judgment-heavy parts itself: the **Scope Check**, the **File
Structure** map, and the **task-list outline** (which tasks exist, in what order) —
"this is where decomposition decisions get locked in." Claude then delegates the
*expansion* of that outline into the full plan body — each task rendered in the
bite-sized step structure with real code blocks — to the Qwen planner via
`planner-prompt.md`.

- The **Self-Review** section runs unchanged: Claude reviews the produced plan
  against the spec (spec coverage, placeholder scan, type consistency, implementer
  fit) and fixes or re-delegates.
- The **Execution Handoff** section is unchanged.

Edit surface: `writing-plans/SKILL.md` — a delegation step between "Task Structure"
and "Self-Review", plus a pointer to the new prompt file.

### subagent-driven-development → test author

The per-task loop gains one delegation. The right-sizing section already advises
splitting "write the failing test" from "implement"; this formalizes it:

1. Claude prepares the brief: the behaviors and edge cases the task's tests must
   cover.
2. **Test author** delegation (`test-author-prompt.md`) — Qwen writes the failing
   test(s) only, no implementation.
3. Claude runs the tests and confirms they fail for the right reason. If they pass,
   compile-error, or fail wrongly, Claude re-delegates a focused fix.
4. **Implementer** delegation (existing `implementer-prompt.md`) — Qwen makes the
   tests pass.
5. The existing two-stage Claude reviewer subagents (spec compliance, then code
   quality) run unchanged on the combined result.

Edit surface: `subagent-driven-development/SKILL.md` — the per-task process diagram
and prose gain the test-author step before the implementer step; a new
`test-author-prompt.md` file; `implementer-prompt.md` is unchanged.

### finishing-a-development-branch → documenter

A new step is inserted after Step 1 (Verify Tests) and before Step 2 (Detect
Environment): **Documentation Sweep**.

- Claude identifies what user-facing documentation and changelog entries the
  completed feature touched (reading the branch diff).
- Claude composes the brief — each doc file to update and the substance of each
  change — and delegates to the Qwen documenter via `documenter-prompt.md`.
- Claude reviews the documentation diff, then commits it on the feature branch so
  the docs land before merge/PR.
- If no docs need updating, the step is a no-op and the skill proceeds.

Edit surface: `finishing-a-development-branch/SKILL.md` — one new step inserted into
The Process; a pointer to the new prompt file. The merge/PR/cleanup logic is
untouched.

## Review of Produced Artifacts

- **Code artifacts** (test author, implementer): reviewed by the existing two-stage
  Claude reviewer subagents in `subagent-driven-development`.
- **Prose artifacts** (feature designer, planner, documenter): reviewed by Claude
  directly, using the self-review checklists that already exist in those skills.
  No reviewer subagent is dispatched for prose — consistent with how brainstorming's
  spec self-review and writing-plans' self-review are already defined ("a checklist
  you run yourself, not a subagent dispatch").

## stop_reason Handling

Identical to the existing implementer flow. All four personas cross-reference the
`stop_reason` mapping in `subagent-driven-development/implementer-prompt.md` and
`SKILL.md`:

| `stop_reason` | Action |
|---|---|
| `complete` | Proceed to Claude review of the artifact |
| `error` | Treat as BLOCKED — assess failure, retry once if transient, else escalate |
| `max_steps` / `timeout` / `token_limit` | Decompose if a clear remaining piece exists; otherwise escalate with `transcript_path` |

For prose personas, budget-hit decomposition means delegating the document
section-by-section rather than escalating immediately.

## Testing

No automated tests for skill files. Validation is manual:

- Run `brainstorming` to the design-doc step and confirm the spec file is produced
  via `delegate_to_qwen` with the feature-designer preamble.
- Run `writing-plans` and confirm Claude produces the File Structure and task
  outline itself, then delegates plan-body expansion to Qwen.
- Run a `subagent-driven-development` task and confirm two delegations occur
  (test author, then implementer) with a Claude test-fails-correctly check between.
- Run `finishing-a-development-branch` and confirm the documentation sweep delegates
  to the Qwen documenter and commits the result before the options menu.
- Confirm each new persona file cross-references the shared `stop_reason` mechanics
  rather than restating them.

## Risks

- **Modifying tuned core skills.** `brainstorming` and `writing-plans` are
  carefully tuned behavior-shaping skills. Edits are kept surgical — new delegation
  steps and prompt-file pointers only; Red Flags tables, anti-pattern sections, and
  process diagrams are not reworded. This is a fork-local customization, not an
  upstream contribution.
- **Extra delegation latency.** Each prose artifact and each test add a Qwen
  round-trip. Acceptable: the cost is local compute, and Claude's context and paid
  tokens are preserved for the judgment work.
