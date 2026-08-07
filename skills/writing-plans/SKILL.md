---
name: writing-plans
description: Use when you have a spec or requirements for a multi-step task, before touching code
---

# Writing Plans

## Overview

Write comprehensive implementation plans assuming the engineer has zero context for our codebase and questionable taste. Document everything they need to know: which files to touch for each task, code, testing, docs they might need to check, how to test it. Give them the whole plan as bite-sized tasks. DRY. YAGNI. TDD. Frequent commits.

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

This structure informs the task decomposition. Each task should produce self-contained changes that make sense independently.

## Hierarchical Plan Mode

**Trigger:** After writing out the File Structure section (where all files and responsibilities are listed), if you can identify **8 or more distinct tasks**, switch to Hierarchical Plan Mode. Below 8 tasks, use the standard single-file layout.

**Why:** Very large single-file plans cause two failure modes: (1) a single Write call with an oversized `content` payload fails with a parameter error, and (2) generating a massive file exhausts the agent's context window mid-write. Hierarchical mode writes one small file per task, making each unit independently generatable and verifiable.

### Folder Layout

```
docs/superpowers/plans/
  YYYY-MM-DD-<feature-name>/
    README.md              ← index: header + task directory table only
    task-01-<name>.md      ← one task per file
    task-02-<name>.md
    task-NN-<name>.md
```

Task files: `task-NN-<kebab-case-component-name>.md` (two-digit zero-padded: `task-01`, `task-02`, … `task-12`).

### README.md Contents

The README contains **only**:
1. The standard plan header (Goal, Architecture, Tech Stack, Global Constraints)
2. Task directory table with links and status column
3. Execution Handoff section

```markdown
## Task Directory

| # | Task | File | Status |
|---|------|------|--------|
| 1 | Component A | [task-01-component-a.md](task-01-component-a.md) | pending |
| 2 | Component B | [task-02-component-b.md](task-02-component-b.md) | pending |
```

No task steps, no code — those live only in the task files.

### Per-Task File Contents

Each task file contains exactly one task using the standard Task Structure (Files, Interfaces, Steps). No prose preamble. No cross-references in the Steps — all necessary context must be self-contained within the task file. Cross-task dependencies belong only in the Interfaces block.

Task files use `# Task N:` (H1) because each is a standalone document — this differs from the H3 used in inline single-file plans.

```markdown
# Task N: [Component Name]

**Files:**
...

**Interfaces:**
- Consumes: ...
- Produces: ...

- [ ] Step 1: ...
...
- [ ] Commit
```

### Write Order

1. Write `README.md` first
2. Write each task file in sequence: `task-01-…`, `task-02-…`, …
3. **One Write call per file** — never batch multiple tasks into one call

### Fallback on Write Failure

If a Write call fails:
1. Do NOT retry the same payload
2. If the file does not yet exist, use Write with a reduced payload (header only), then use Edit to append remaining sections in chunks
3. If the file was partially written, use Edit to append from the last complete section
4. Continue with remaining task files after recovery

### Execution Handoff in Hierarchical Mode

When offering the execution choice, reference the README path instead of a single file:

> "Plan complete and saved to `docs/superpowers/plans/YYYY-MM-DD-<feature-name>/README.md`. Two execution options: ..."

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

## Plan Document Header

**Every plan MUST start with this header:**

```markdown
# [Feature Name] Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

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
- "Similar to Task N" (repeat the code — the engineer may be reading tasks out of order)
- Steps that describe what to do without showing how (code blocks required for code steps)
- References to types, functions, or methods not defined in any task

## Self-Review

After writing the complete plan, look at the spec with fresh eyes and check the plan against it. This is a checklist you run yourself — not a subagent dispatch.

**1. Spec coverage:** Skim each section/requirement in the spec. Can you point to a task that implements it? List any gaps.

**2. Placeholder scan:** Search your plan for red flags — any of the patterns from the "No Placeholders" section above. Fix them.

**3. Type consistency:** Do the types, method signatures, and property names you used in later tasks match what you defined in earlier tasks? A function called `clearLayers()` in Task 3 but `clearFullLayers()` in Task 7 is a bug.

If you find issues, fix them inline. No need to re-review — just fix and move on. If you find a spec requirement with no task, add the task.

## Execution Handoff

After saving the plan, offer execution choice:

**"Plan complete and saved to `docs/superpowers/plans/<filename>.md`. Two execution options:**

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?"**

**If Subagent-Driven chosen:**
- **REQUIRED SUB-SKILL:** Use superpowers:subagent-driven-development
- Fresh subagent per task + two-stage review

**If Inline Execution chosen:**
- **REQUIRED SUB-SKILL:** Use superpowers:executing-plans
- Batch execution with checkpoints for review
