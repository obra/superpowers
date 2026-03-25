# Implement Skill: Task-Driven Phase Enforcement

## Problem

The implement skill defines 8 phases (0-7) that must run in order, but the orchestrator can skip phases or jump to the completion report because enforcement is purely prose-based. Observed failures:

1. **No guard against pre-existing plans**: A plan file without a spec causes the orchestrator to skip brainstorming
2. **No phase-gating enforcement**: The orchestrator rationalized skipping phases ("I have enough context")
3. **Phases 6-7 easily dropped**: Tasks for verification and e2e tests were never created because task creation happened incrementally
4. **Completion report triggers too early**: Report was output after Phase 5, skipping verification and tests

## Solution

Replace the current prose instruction ("You MUST create a task for each phase step and complete in order") with a **mandatory task scaffold** — a concrete task definition table that the orchestrator must create at startup using `TaskCreate`, with `blockedBy` dependencies enforcing execution order.

## Design

### Task Scaffold

The orchestrator creates ALL 9 tasks at startup, before any phase work begins. Each task has explicit completion criteria embedded in its description. The `blockedBy` field enforces ordering.

| # | Subject | Description (completion criteria) | Blocked By |
|---|---------|----------------------------------|------------|
| 1 | Phase 0: Context Scout | Dispatch context-scout subagent. **Done when:** context summary is returned and stored in orchestrator state. | — |
| 2 | Phase 1: Brainstorm and Produce Spec | Dispatch autonomous-brainstormer. Resolve any `NEEDS_DECISION` tags via expert panels. **Done when:** spec file exists at `docs/superpowers/specs/YYYY-MM-DD-<slug>-design.md` with no remaining `NEEDS_DECISION` tags. Spec is committed to git. | 1 |
| 3 | Phase 2: Refine Spec | Run spec-simulator/spec-fixer loop. **Done when:** spec contains `Refinement: CONVERGED round {N}` in its `## Refinement Status` section. Refined spec is committed. | 2 |
| 4 | Phase 3: Write Plan | Construct plan-writer prompt, dispatch subagent, run plan-document-reviewer. **Done when:** plan file exists at `docs/superpowers/plans/YYYY-MM-DD-<slug>.md` and passes plan-document-reviewer. | 3 |
| 5 | Phase 4: Refine Plan | Run plan-simulator/plan-fixer loop. **Done when:** plan contains `Refinement: CONVERGED round {N}` in its `## Refinement Status` section. | 4 |
| 6 | Phase 5: Execute All Plan Tasks | Dispatch fresh implementer per task, run spec-reviewer and code-quality-reviewer per task. Commit after each task. **Done when:** every task in the plan is implemented, reviewed, and committed. | 5 |
| 7 | Phase 6: Spec Verification | Dispatch scenario-generator, run application (or test suite for libraries), execute scenarios. Fix failures. **Done when:** all scenarios executed, fixes committed, verification report produced. | 6 |
| 8 | Phase 7: E2E Tests | Write e2e tests for confirmed scenarios, run them. **Done when:** tests written, passing, and committed. | 7 |
| 9 | Output Completion Report | Compile and output the Implementation Complete report, then invoke finishing-a-development-branch. **Done when:** Phases 6 and 7 tasks are marked complete AND the report is output. | 8 |

### Placement in SKILL.md

Replace the current line:

```
You MUST create a task for each phase step and complete in order.
```

With a new `## Task Scaffold` section placed immediately after the process heading and before the flow diagram. This section contains:

1. The task table above
2. The startup instruction: "Create ALL 9 tasks at startup using TaskCreate, with blockedBy dependencies as shown. Do NOT begin Phase 0 work until all 9 tasks exist."
3. The anti-skip rule (see below)

### Anti-Skip Rule

Add as a `HARD-GATE` within the Task Scaffold section:

> A task can only be marked complete when its completion criteria are met. "Having enough context" is not a completion criterion. Every phase runs. No exceptions.

### Plan-Is-Not-Spec Guard

Add to the Resume Detection section, after the existing artifact checks:

> **Plan without spec:** If a plan file exists but no spec file exists, do NOT resume at Phase 3 or later. Resume at Phase 1. A plan is not a spec — the spec is the source of truth for verification phases.

### Completion Report Gate

Prepend the following bold instruction as a new paragraph immediately before the existing trigger line ("When all phases complete, output:") in the Completion Report section: [inferred]

> **Do NOT output this report until Task 9's blockedBy chain is fully satisfied** — meaning Tasks 7 (Phase 6) and 8 (Phase 7) are marked complete. If they are not complete, go back and complete them.

### Resume Detection Update

The new task-based resume logic **replaces** the existing artifact-to-phase mapping table (lines 95-100 of current SKILL.md). The old table is deleted, not supplemented. [inferred]

When resuming from existing artifacts, the orchestrator:
1. Creates all 9 tasks as normal
2. Runs the plan-without-spec guard: if a plan file exists but no spec file exists, do NOT mark Task 4 (Write Plan) as complete — this forces resume at Task 2 (Brainstorm), even if a plan file is present on disk [inferred]
3. Checks which completion criteria are already satisfied by existing artifacts on disk
4. Marks those tasks as complete (preserving the blockedBy chain)
5. Begins work at the first incomplete task

This means resume detection works naturally through the task system rather than as a separate code path.

## Changes Summary

Edit order: apply changes in this sequence to avoid line-number drift. [inferred]

| Order | Target (by content, not line number) | Change |
|-------|--------------------------------------|--------|
| 1 | Resume Detection section: after the "All tasks in plan completed → resume at Phase 6" line | Add "Plan without spec" guard. Delete the old artifact-to-phase mapping table and replace with the task-based resume logic. |
| 2 | The line `You MUST create a task for each phase step and complete in order.` | Replace with `## Task Scaffold` section containing the task table, startup instruction, and anti-skip HARD-GATE. Preserve the `## The Process` heading and the flow diagram that follows. [inferred] |
| 3 | Completion Report section: the line `When all phases complete, output:` | Prepend the completion gate as a new bold paragraph before that line |

## Refinement Status

Refinement: CONVERGED round 2

## Out of Scope

- No changes to subagent prompts or dispatch patterns
- No changes to expert panel design
- No changes to git policy
- No changes to phase-internal logic (refinement loops, convergence checks, etc.)
