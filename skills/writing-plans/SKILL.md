---
name: writing-plans
description: Use when you have an approved design and need an implementation plan before touching code
---

# Writing Plans

## Overview

Write implementation plans that specify **what to build, where to put it, and why** — agents decide how. Provide enough context that a specialist who has never seen the codebase can implement correctly without guessing.

**Not "complete code in plan"** — specify the interface, the file locations, the test expectations, and the acceptance criteria. Agents write the actual implementation.

**Announce at start:** "I'm using the writing-plans skill to create the implementation plan."

<HARD-GATE>
Do NOT use `EnterPlanMode` or `ExitPlanMode` during plan writing. These tools trap the session in plan mode where Write/Edit tools are restricted, preventing the writing-plans skill from saving the plan document.
</HARD-GATE>

## Verification Gate

Before starting, check `.superpowers/state.yml`:

```
REQUIRED:
  design.approved == true       # user has signed off on design
  worktree.main.path accessible # isolated workspace exists

IF team plan:
  team.roster exists            # composing-teams has run

IF any check fails:
  Stop. Report which precondition is missing.
  Do not write a plan until prerequisites are met.
```

## Save Location

Use directory-based plan structure:

```
docs/plans/<project>/
├── design.md          # already exists (brainstorming output — do not touch)
├── plan.md            # write this (overview + task list)
└── tasks/             # write one file per task (optional, for 4+ task plans)
    ├── 01-<slug>.md
    ├── 02-<slug>.md
    └── ...
```

`<project>` is the kebab-case name from the design doc (e.g., `user-auth`, `payment-refactor`).

**Do NOT use date-prefixed filenames** (`docs/plans/YYYY-MM-DD-feature.md`). The directory name carries enough context and state.yml stores the path for cross-session discovery.

**Worktree context:** The plan executes in the worktree at `worktree.main.path` (from state.yml). Include this path context in the plan header so executors know where to work.

## After Writing

Write to state.yml:

```yaml
plan:
  path: docs/plans/<project>/plan.md
  status: pending
  executor: ""           # filled in when user picks execution approach
  total_tasks: N
phase: planning
```

**Plan frontmatter status:** The plan.md template includes `status: pending` in its YAML frontmatter. Executors update this to `status: executed` on completion. This allows tools and agents to check plan status directly from the document without consulting state.yml.

## Bite-Sized Task Granularity

**Each task covers one coherent piece of work (not one line of code):**
- "Add Zod schema for user preferences" — one task
- "Create DB migration and table" — one task
- "Implement API route with validation" — one task

Within each task, the implementer follows TDD: write failing test, verify it fails, implement, verify it passes, commit. The plan specifies *what* the test should cover and what failure to expect — not the exact test code.

## Plan Document Structure

### plan.md

```markdown
---
status: pending
---

# [Feature Name] Implementation Plan

> See [design](design.md) for context and rationale.
> **For Claude:** Use [execution-skill] to execute this plan.

**Goal:** [One sentence]

**Architecture:** [2-3 sentences about approach]

**Tech Stack:** [Key technologies]

---

## Tasks

1. Task 1: [Title]
2. Task 2: [Title]
3. Task 3: [Title]

[Wave analysis if team plan — see below]

## Test Expectations Summary

| Task | What to test | Expected red failure |
|------|-------------|----------------------|
| 1 | [behavior] | [specific error message or missing symbol] |
| 2 | [behavior] | [specific error message or missing symbol] |
```

**Write the header last.** Why: the header includes the execution approach recommendation (serial vs. team), which you cannot know until you have:
1. Drafted all tasks and their dependencies
2. Run the Team Fitness Check (see below) to determine whether parallel execution is warranted
3. Decided the execution approach — only then write the header with the correct `> **For Claude:** Use [execution-skill]` line

### tasks/<NN>-<slug>.md (one per task, for 4+ task plans)

```markdown
# Task N: [Title]

**Specialist:** [role] *(team plans only)*
**Depends on:** Task X (for [specific output]) *(or None)*
**Produces:** [what later tasks consume]

## Goal

One sentence.

## Acceptance Criteria

- [ ] [Specific, verifiable criterion]
- [ ] [Specific, verifiable criterion]

## Test Expectations

- **Test:** [what behavior to test — e.g., "rejects empty email with 400"]
- **Expected red failure:** [specific error — e.g., "TypeError: submitForm is not a function"]
- **Expected green:** [what the passing assertion looks like]

## Files

- Create: `exact/path/to/file.py`
- Modify: `exact/path/to/existing.py` (section: lines ~123-145)
- Test: `tests/exact/path/to/test_feature.py`

## Implementation Notes

[Context the implementer needs that isn't in design.md]
[Interfaces they must match]
[Patterns from existing code to follow]
[What NOT to build — YAGNI notes]

## Commit

`feat: [description]`
```

**For plans with fewer than 4 tasks:** Embed the full task content in `plan.md` directly (no `tasks/` directory needed).

## Plan-Level Test Expectations

Every task MUST include test expectations. This is not optional.

**What to specify:**
- The behavior being tested (not the test code)
- The specific error or failure that proves the test runs before the implementation exists
- What passing looks like

**Why this matters:** Test expectations in the plan make tests impossible to "forget." The QA agent (pipelined TDD) or the implementer (solo TDD) uses these to write the failing test before touching production code.

**Good test expectations:**
```
- Test: POST /api/users rejects missing email field
- Expected red failure: AssertionError: expected 400, got 500 (route doesn't validate yet)
- Expected green: response.status === 400, body.error === "email required"
```

**Too vague:**
```
- Test: validate user input
```

## Team Fitness Check

After drafting all tasks and their dependencies, evaluate whether this plan benefits from team execution.

**Use team execution when ALL of these are true:**
- At least 2 waves have 2+ tasks each (real parallel work exists)
- At least 2 distinct specialist roles are needed
- 4+ tasks total (team overhead pays for itself)

**Use standard serial format when ANY of these are true:**
- Every wave has only 1 task (purely serial chain)
- Fewer than 4 tasks total
- Only 1 specialist role needed
- Tasks are tightly coupled with pervasive shared state

If serial is the better fit, announce: *"After analyzing dependencies, this plan is essentially serial — [reason]. Using standard serial format."*

## Wave Analysis (Team Plans Only)

Include immediately after the header when Team Fitness Check passes.

```markdown
## Wave Analysis

### Specialists

| Role | Expertise | Tasks |
|------|-----------|-------|
| [role-name] | [technologies, domain] | Tasks N, M |

### Waves

**Wave 1: [Theme]**
- Task N ([role-name]) — [one-line summary]

  *Parallel-safe because:* [different directories, no import relationship]

**Wave 2: [Theme]** — needs Wave 1 [what specifically]
- Task X ([role-name]) — [one-line summary]

  *Depends on Wave 1:* [specific outputs — file paths, types, tables]

### Dependency Graph

```
Task 1 ──→ Task 3 ──→ Task 5
Task 2 ──→ Task 4 ──↗
```
```

**Wave grouping rules:**
- Tasks in the same wave MUST NOT touch the same files
- Tasks in the same wave MUST NOT have an import relationship
- Max 3 tasks per wave (max 3 simultaneous implementers)
- When unsure → serialize

## Plan Review

Before handing off for execution, consider a plan review:
- Re-read every task against the design doc acceptance criteria
- Check that test expectations are specific enough for a QA agent to write tests without clarification
- Verify no task assumes output from a same-wave task (would cause conflicts)
- Confirm file paths exist or are clearly new

For critical or complex plans, a separate review pass (treating yourself as a new reader with no context) catches gaps that are obvious once implementation starts.

## Remember

- Exact file paths always
- Specify what/where/why — not complete code
- Every task needs test expectations (behavior + red failure + green)
- Reference relevant skills by name: `superpowers:skill-name`
- DRY, YAGNI, TDD, frequent commits
- For team plans: every task must have Specialist, Depends on, Produces fields
- For team plans: Wave Analysis must justify why same-wave tasks are parallel-safe
- For team plans: dependency graph must be acyclic, max 3 tasks per wave

## Execution Handoff

After saving the plan and writing state.yml, offer execution choice:

**"Plan saved to `docs/plans/<project>/plan.md`. Three execution options:**

**1. Agent Team-Driven (this session)** — Parallel specialist agents, wave-based execution, two-stage review after each task. Best for 4+ tasks with parallelism.

**2. Subagent-Driven (this session)** — Fresh subagent per task, review between tasks. Best for serial plans or fewer tasks.

**3. Parallel Session (separate)** — Open new session with executing-plans, batch execution with checkpoints. Best for human-in-loop between batches.

**Which approach?"**

After user chooses, update state.yml `plan.executor` field, then invoke the chosen execution skill.
