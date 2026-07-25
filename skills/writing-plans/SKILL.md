---
name: writing-plans
description: Use when you have a spec or requirements for a multi-step task, before touching code
---

# Writing Plans

This is the heavy-tier path, reached via brainstorming's tier triage; small,
single-subsystem changes route to executing-specs instead.

## Overview

Write comprehensive implementation plans assuming the engineer has zero context for our codebase and questionable taste. Document everything they need to know: which files to touch for each task, exact interfaces, testing, docs they might need to check, how to test it. Give them the whole plan as bite-sized tasks. DRY. YAGNI. TDD. Frequent commits.

Assume they are a skilled developer, but know almost nothing about our toolset or problem domain. Assume they don't know good test design very well.

**Announce at start:** "I'm using the writing-plans skill to create the implementation plan."

**Save plans to:** `docs/plans/YYYY-MM-DD-<feature-name>.md`
- (User preferences for plan location override this default)
- Do NOT commit the plan (or the spec). Both are committed in a single
  docs commit when subagent-driven-development starts executing.

## Scope Check

If the spec covers multiple independent subsystems, it should have been broken into sub-project specs during brainstorming. If it wasn't, suggest breaking this into separate plans — one per subsystem. Each plan should produce working, testable software on its own.

## File Structure

Before defining tasks, map out which files will be created or modified and what each one is responsible for. This is where decomposition decisions get locked in.

- Design units with clear boundaries and well-defined interfaces. Each file should have one clear responsibility.
- You reason best about code you can hold in context at once, and your edits are more reliable when files are focused. Prefer smaller, focused files over large ones that do too much.
- Files that change together should live together. Split by responsibility, not by technical layer.
- In existing codebases, follow established patterns. If the codebase uses large files, don't unilaterally restructure - but if a file you're modifying has grown unwieldy, including a split in the plan is reasonable.

This structure informs the task decomposition. Each task should produce self-contained changes that make sense independently.

## Task Right-Sizing

A task is the smallest unit that carries its own test cycle and is worth a
fresh reviewer's gate. When drawing task boundaries: fold setup,
configuration, scaffolding, and documentation steps into the task whose
deliverable needs them; split only where a reviewer could meaningfully
reject one task while approving its neighbor. Each task ends with an
independently testable deliverable.

## Bite-Sized Task Granularity

**Each step is one action (2-5 minutes):**
- "Write the failing test" - step
- "Run it to make sure it fails" - step
- "Implement the minimal code to make the test pass" - step
- "Run the tests and make sure they pass" - step
- "Commit" - step

## Requirements, Not Transcription

The implementer is a capable model with fresh context — the plan's job is to
remove AMBIGUITY, not to pre-write their code. Plan-time code is written blind
(nothing has been run yet); mandating full code in every step just ships your
untested guesses as requirements, and implementers then waste time debugging
the plan itself. In practice, plan-authored test fixtures with hardcoded seeds
and expected values are the most common defect this causes.

What each task MUST pin down exactly:
- **Exact file paths** and which are created vs modified
- **Exact interfaces**: function/class names, parameter and return types,
  config keys and their default values, error types, journal/record shapes
- **Test intent**: what each test proves, the specific behaviors and edge
  cases it covers, and what a correct failure looks like in the red phase
- **Binding constraints**: exact thresholds, formats, and invariants copied
  verbatim from the spec

Include literal code only where it is load-bearing: a non-obvious
algorithm the implementer must not improvise (a hash-chain rule, a statistical
formula, a tricky shell invocation), or an API contract other tasks compile
against. When you do include code, mark it as binding. Everything else —
test bodies, glue, fixtures — is described by intent and left to the
implementer, who will run it.

## Plan Document Header

**Every plan MUST start with this header:**

```markdown
# [Feature Name] Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use minipowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** [One sentence describing what this builds]

**Architecture:** [2-3 sentences about approach]

**Tech Stack:** [Key technologies/libraries]

## Global Constraints

[The spec's project-wide requirements — version floors, dependency limits,
naming and copy rules, platform requirements — one line each, with exact
values copied verbatim from the spec. Every task's requirements implicitly
include this section.]

---
```

## Task Structure

````markdown
### Task N: [Component Name]

**Files:**
- Create: `exact/path/to/file.py`
- Modify: `exact/path/to/existing.py:123-145`
- Test: `tests/exact/path/to/test.py`

**Interfaces:**
- Consumes: [what this task uses from earlier tasks — exact signatures]
- Produces: [what later tasks rely on — exact function names, parameter
  and return types. A task's implementer sees only their own task; this
  block is how they learn the names and types neighboring tasks use.]

- [ ] **Step 1: Write failing tests** — [for each test: name, the behavior
  it proves, inputs/edge cases it must cover, and the expected failure mode
  in the red phase]

- [ ] **Step 2: Run tests to verify they fail for the right reason**

Run: `pytest tests/path/test.py -v`
Expected: FAIL with [the specific reason — missing symbol, wrong value]

- [ ] **Step 3: Implement** — [requirements + the Interfaces block above;
  literal code only if load-bearing, marked as binding]

- [ ] **Step 4: Run tests to verify they pass; full suite + lint stay green**

- [ ] **Step 5: Commit** — `git commit -m "feat: add specific feature"`
````

## No Placeholders

Every step must contain the actual requirements an engineer needs. These are **plan failures** — never write them:
- "TBD", "TODO", "implement later", "fill in details"
- "Add appropriate error handling" / "add validation" / "handle edge cases" (name the errors and cases)
- "Write tests for the above" (without naming each test's intent and coverage)
- "Similar to Task N" (repeat the requirements — the engineer may be reading tasks out of order)
- References to types, functions, or methods not defined in any task's Interfaces block

## Remember
- Exact file paths always
- Exact interfaces and constraints; code only where load-bearing
- Exact commands with expected output
- DRY, YAGNI, TDD, frequent commits

## Self-Review

After writing the complete plan, look at the spec with fresh eyes and check the plan against it. This is a checklist you run yourself — not a subagent dispatch.

**1. Spec coverage:** Skim each section/requirement in the spec. Can you point to a task that implements it? List any gaps.

**2. Placeholder scan:** Search your plan for red flags — any of the patterns from the "No Placeholders" section above. Fix them.

**3. Type consistency:** Do the types, method signatures, and property names you used in later tasks match what you defined in earlier tasks? A function called `clearLayers()` in Task 3 but `clearFullLayers()` in Task 7 is a bug.

If you find issues, fix them inline. No need to re-review — just fix and move on. If you find a spec requirement with no task, add the task.

## Execution Handoff

After the self-review passes, proceed DIRECTLY to execution — do not ask the
human for a general plan review or approval. The plan is a machine-facing
artifact (routinely 1000+ lines); the human already gated the spec, and
execution's pre-flight review plus per-task reviewers are the net for plan
defects. (Subagent-driven-development's pre-flight step may still surface
SPECIFIC plan conflicts to the human as one batched question — that is
scoped conflict resolution, not a plan review.)

- **REQUIRED SUB-SKILL:** Invoke minipowers:subagent-driven-development now
- Announce: "Plan saved to `docs/plans/<filename>.md`. Executing with
  subagent-driven development."

