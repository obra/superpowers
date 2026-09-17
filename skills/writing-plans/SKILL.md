---
name: writing-plans
description: Use when you have a spec or requirements for a multi-step task, before touching code
---

# Writing Plans

## Overview

Write comprehensive implementation plans assuming the engineer has zero context for our codebase and questionable taste. Document everything they need to know: which files to touch for each task, code, testing, docs they might need to check, how to test it. Give them the whole plan as meaningful, independently verifiable tasks. DRY. YAGNI. TDD.

Assume they are a skilled developer, but know almost nothing about our toolset or problem domain. Assume they don't know good test design very well.

Plan for direct implementation, not agent orchestration: the plan should read cleanly whether it's executed in the current session or picked up fresh in a separate one, by the primary agent working directly. Nothing in the plan should assume a reviewer agent, a fixer agent, or a subagent handoff between tasks.

**Announce at start:** "I'm using the writing-plans skill to create the implementation plan."

**Context:** Plans execute in the current working tree by default. Isolation via `superpowers:using-git-worktrees` is an optional technique for when it genuinely helps (e.g. running two plans side by side) — it is not a default requirement of planning or execution.

**Save plans to:** determined by `superpowers:durable-storage` — defaults to `docs/superpowers/plans/<filename>.md` when no custom provider is configured
- (User preferences for plan location override this default)

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

A task is a meaningful implementation unit — not a reviewer-agent gate, a commit boundary, or a subagent handoff point. When drawing task boundaries, a task should be:

- independently understandable
- independently testable where practical
- small enough to reason about
- large enough to represent meaningful progress
- ordered according to its dependencies on other tasks

Fold setup, configuration, scaffolding, and documentation steps into the task whose deliverable needs them. Do not split work artificially just to create more checkpoints or handoffs — split only where it produces genuinely separable, independently testable deliverables. Each task ends with an independently testable deliverable.

## Implementation Step Granularity

Steps should be concrete actions that tell the implementing agent exactly what to do and how to verify it.

Good steps:

* identify the exact file and symbol to change
* describe the implementation change
* provide relevant code or pseudocode where it materially reduces ambiguity
* specify the exact test or verification to run
* state the expected result

Do not split steps merely to create more checkpoints or smaller units of work. Keep related implementation actions together when splitting them would add unnecessary ceremony.

A task should end with a verified, working deliverable. Git staging and commits are outside the plan.

## Plan Document Header

**Every plan MUST start with this header:**

```markdown
# [Feature Name] Implementation Plan

> **Execution:** Use `superpowers:subagent-driven-development` to execute this plan directly in the current session, or `superpowers:executing-plans` to execute it in a separate or resumable session. Both execute tasks directly; subagents are optional in either and never required. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** [One sentence describing what this builds]

**Architecture:** [2-3 sentences about approach]

**Tech Stack:** [Key technologies/libraries]

**Spec:** [path to the spec/design doc this plan implements — the plan
argues from the spec, so the spec travels with it; executors read both]

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
````

## No Placeholders

Every task must contain enough concrete information for another engineer or a fresh Claude session to execute it without rediscovering the design.

Do not write vague placeholders such as:

* "TBD"
* "TODO"
* "implement later"
* "fill in details"
* "add appropriate error handling"
* "add validation"
* "handle edge cases"

When a requirement involves non-trivial logic, provide the relevant implementation details, interfaces, examples, pseudocode, or code necessary to make the intended behaviour unambiguous.

Do not require full source-code listings for every step. Include code where it materially improves clarity.

Tests must specify what behaviour is being verified and how to run the relevant verification. Include concrete test code when the exact test structure is important to the implementation; otherwise provide the exact test target and expected result.

Do not refer vaguely to another task when the information is necessary to execute the current task. Repeat the relevant interface or contract instead.

## Git

Reading Git is useful while planning — checking existing history, understanding the current branch, or inspecting relevant prior changes can surface context a spec doesn't state explicitly. Use read-only inspection (`git log`, `git show`, `git diff`, `git branch --show-current`) freely for this.

The plan itself must not instruct automatic staging, commits, pushes, merges, rebases, or branch/worktree creation or deletion. A task's completion boundary is a verified, working deliverable — never a commit. Staging and committing are the user's decision, made after execution, not a step inside it.

## Self-Review

After writing the complete plan, look at the spec with fresh eyes and check the plan against it. This is a checklist you run yourself — not a subagent dispatch.

**1. Spec coverage:** Skim each section/requirement in the spec. Can you point to a task that implements it? List any gaps.

**2. Placeholder scan:** Search your plan for red flags — any of the patterns from the "No Placeholders" section above. Fix them.

**3. Type consistency:** Do the types, method signatures, and property names you used in later tasks match what you defined in earlier tasks? A function called `clearLayers()` in Task 3 but `clearFullLayers()` in Task 7 is a bug.

If you find issues, fix them inline. No need to re-review — just fix and move on. If you find a spec requirement with no task, add the task.

## Execution Handoff

After saving the plan, explain that it can be executed either in the current session or in a separate/resumable session:

**Current session:** Use `superpowers:subagent-driven-development` to execute the plan directly in the primary session.

**Separate or resumable session:** Use `superpowers:executing-plans` to execute the plan directly in a new or resumable session.

Both workflows implement tasks directly in the primary agent. Subagents are optional in either workflow and are used only when they provide concrete value.

The plan is the durable record of implementation intent. No separate execution ledger or progress file is needed.
