---
name: writing-plans
description: Use when you have a spec or requirements for a multi-step task, before touching code
---

# Writing Plans

## Overview

Write comprehensive implementation plans assuming the engineer has zero
context for our codebase and questionable taste. Group work into bounded
phases of 2-3 closely related, independently testable and committable
milestones. DRY. YAGNI. TDD. Frequent commits.

Assume they are a skilled developer, but know almost nothing about our toolset or problem domain. Assume they don't know good test design very well.

**Announce at start:** "I'm using the writing-plans skill to create the implementation plan."

**Context:** If working in an isolated worktree, it should have been created via the `superpowers:using-git-worktrees` skill at execution time.

**Save plans to:** `docs/superpowers/plans/YYYY-MM-DD-<feature-name>.md`
- (User preferences for plan location override this default)

## Scope Check

If the spec covers multiple independent subsystems, it should have been broken into sub-project specs during brainstorming. If it wasn't, suggest breaking this into separate plans — one per subsystem. Each plan should produce working, testable software on its own.

## File Structure

Before defining tasks, map out which files will be created or modified and what each one is responsible for. This is where decomposition decisions get locked in.

- Design units with clear boundaries and well-defined interfaces. Each file should have one clear responsibility.
- You reason best about code you can hold in context at once, and your edits are more reliable when files are focused. Prefer smaller, focused files over large ones that do too much.
- Files that change together should live together. Split by responsibility, not by technical layer.
- In existing codebases, follow established patterns. If the codebase uses large files, don't unilaterally restructure - but if a file you're modifying has grown unwieldy, including a split in the plan is reasonable.

This structure informs milestone decomposition. Each milestone should produce
self-contained changes that make sense independently.

## Phase and Milestone Right-Sizing

Each phase contains at most 2-3 closely related milestones. A phase is the
largest unit a human approves for delegated execution. Approval of one phase
never authorizes the next.

A milestone is the smallest unit that carries its own test cycle, commit, and
review gate. Fold setup, configuration, scaffolding, and documentation into the
milestone whose deliverable needs them. Each milestone ends with an
independently testable and committable deliverable.

## Bite-Sized Step Granularity

**Each step is one action (2-5 minutes):**
- "Write the failing test" - step
- "Run it to make sure it fails" - step
- "Implement the minimal code to make the test pass" - step
- "Run the tests and make sure they pass" - step
- "Commit" - step

## Plan Document Header

**Every plan MUST start with this header:**

```markdown
# [Feature Name] Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development for an explicitly approved bounded phase, or superpowers:executing-plans for direct execution. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** [One sentence describing what this builds]

**Architecture:** [2-3 sentences about approach]

**Tech Stack:** [Key technologies/libraries]

**Spec:** [path to the spec/design doc this plan implements — the plan
argues from the spec, so the spec travels with it; executors read both]

## Global Constraints

[The spec's project-wide requirements — version floors, dependency limits,
naming and copy rules, platform requirements — one line each, with exact
values copied verbatim from the spec. Every milestone's requirements implicitly
include this section.]

---
```

## Phase Structure

````markdown
## Phase N: [Closely Related Outcome]

**Phase boundary:** At most 2-3 milestones. Stop after this phase and obtain
new approval before continuing.

### Milestone N.1: [Component Name]

**Files:**
- Create: `exact/path/to/file.py`
- Modify: `exact/path/to/existing.py:123-145`
- Test: `tests/exact/path/to/test.py`

**Interfaces:**
- Consumes: [what this milestone uses from earlier milestones — exact signatures]
- Produces: [what later tasks rely on — exact function names, parameter
  and return types. A milestone's implementer sees only the current milestone;
  this block defines what neighboring milestones rely on.]

- [ ] **Step 1: Write the failing test**

```python
def test_specific_behavior():
    result = function(input)
    assert result == expected
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pytest tests/path/test.py::test_name -v`
Expected: FAIL with "function not defined"

- [ ] **Step 3: Write minimal implementation**

```python
def function(input):
    return expected
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pytest tests/path/test.py::test_name -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add tests/path/test.py src/path/file.py
git commit -m "feat: add specific feature"
```
````

## No Placeholders

Every step must contain the actual content an engineer needs. These are **plan failures** — never write them:
- "TBD", "TODO", "implement later", "fill in details"
- "Add appropriate error handling" / "add validation" / "handle edge cases"
- "Write tests for the above" (without actual test code)
- "Similar to Milestone N" (repeat the code — the engineer may be reading milestones out of order)
- Steps that describe what to do without showing how (code blocks required for code steps)
- References to types, functions, or methods not defined in any milestone

## Self-Review

After writing the complete plan, look at the spec with fresh eyes and check the plan against it. This is a checklist you run yourself — not a subagent dispatch.

**1. Spec coverage:** Skim each section/requirement in the spec. Can you point
to a milestone that implements it? List any gaps.

**2. Placeholder scan:** Search your plan for red flags — any of the patterns from the "No Placeholders" section above. Fix them.

**3. Type consistency:** Do the types, method signatures, and property names
used in later milestones match earlier milestones? A function called
`clearLayers()` in Milestone 1.2 but `clearFullLayers()` in Milestone 2.1 is a
bug.

If you find issues, fix them inline. No need to re-review — just fix and move
on. If a spec requirement has no milestone, add one in the appropriate phase.

## Execution Handoff

After saving the plan, propose only the first phase. Before delegated
execution, disclose:

- one persistent implementer and one persistent independent read-only reviewer;
- exact model/provider for each;
- reasoning effort and context tier for each;
- the phase's 2-3 milestones, scope, acceptance criteria, and validation;
- sequential execution with at most one active delegated agent;
- maximum dispatches and at most three review passes per milestone;
- the stop boundary after the phase.

Then offer:

**1. Bounded Subagent-Driven** - Execute the disclosed phase with one
persistent implementer/reviewer pair

**2. Inline Execution** - Execute the disclosed phase directly in this session

**If Bounded Subagent-Driven is approved:**
- **REQUIRED SUB-SKILL:** Use superpowers:subagent-driven-development
- Use only the disclosed persistent pair and stop after the approved phase

**If Inline Execution chosen:**
- **REQUIRED SUB-SKILL:** Use superpowers:executing-plans
- Execute only the disclosed phase and stop at its boundary
