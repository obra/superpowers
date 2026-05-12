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

---
```

## Task Structure

**Task metadata block.** Each task starts with three metadata fields, used by the controller to compute parallel execution order:

- `id`: short kebab-case identifier, unique within the plan. Required when any task in the plan declares `depends_on`.
- `depends_on`: list of task ids this task waits on. Empty (`[]`) means it can start immediately. Omit if no other task uses `depends_on`.
- `parallel_safe`: `true` (default) or `false`. Set `false` only for genuinely global state (env files, DB migrations, config singletons). Most apparent conflicts should be resolved by adding a dependency instead.

When omitted entirely across every task, the plan runs in sequential back-compat mode.

````markdown
### Task N: [Component Name]

**id**: example-task
**depends_on**: []
**parallel_safe**: true

**Files:**
- Create: `exact/path/to/file.py`
- Modify: `exact/path/to/existing.py:123-145`
- Test: `tests/exact/path/to/test.py`

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

## Plan Design Heuristic

When drafting a plan, organize tasks for maximum parallel execution with clean merges.

1. **Decompose by file/module boundary first.** Tasks touching disjoint files are parallel-safe by construction.
2. **Identify shared edits early.** If multiple tasks need the same file, restructure: extract the shared edit as an upstream task; the others depend on it.
3. **Push integration to leaves.** Wiring and glue tasks live late in the DAG and depend on the units they integrate. Unit work stays parallel; only integration serializes.
4. **Maximize ready-set width.** The goal is the fattest possible parallel layer at each round. If the DAG looks like a chain, reconsider whether tasks can split.
5. **Predict merge cleanliness per task.** For each task, list the files it will touch. If any file appears in a sibling task, those tasks are not actually parallel — add a dependency or merge them.
6. **`parallel_safe: false` is a last resort.** Only for genuinely global state (env, DB migrations, config singletons).

Every plan ends with a **Parallelism analysis** section listing:

- Ready-set width per layer of the DAG
- Sequential bottlenecks and why they exist
- Justification for any `parallel_safe: false` task

## No Placeholders

Every step must contain the actual content an engineer needs. These are **plan failures** — never write them:
- "TBD", "TODO", "implement later", "fill in details"
- "Add appropriate error handling" / "add validation" / "handle edge cases"
- "Write tests for the above" (without actual test code)
- "Similar to Task N" (repeat the code — the engineer may be reading tasks out of order)
- Steps that describe what to do without showing how (code blocks required for code steps)
- References to types, functions, or methods not defined in any task

## Remember
- Exact file paths always
- Complete code in every step — if a step changes code, show the code
- Exact commands with expected output
- DRY, YAGNI, TDD, frequent commits

## Self-Review

After writing the complete plan, look at the spec with fresh eyes and check the plan against it. This is a checklist you run yourself — not a subagent dispatch.

**1. Spec coverage:** Skim each section/requirement in the spec. Can you point to a task that implements it? List any gaps.

**2. Placeholder scan:** Search your plan for red flags — any of the patterns from the "No Placeholders" section above. Fix them.

**3. Type consistency:** Do the types, method signatures, and property names you used in later tasks match what you defined in earlier tasks? A function called `clearLayers()` in Task 3 but `clearFullLayers()` in Task 7 is a bug.

If you find issues, fix them inline. No need to re-review — just fix and move on. If you find a spec requirement with no task, add the task.

## Push to Draft PR and Get User Approval

After self-review, before offering execution choice:

1. Commit the plan document to git.
2. Push the branch to the remote.
3. Open a GitHub **draft** pull request titled `Plan: <feature-name>` containing the plan (or push the plan as an additional commit on the existing spec PR if one is already open for this feature).
4. Share the PR URL with the user:

   > "Plan written and pushed as draft PR: `<PR URL>` (file: `docs/superpowers/plans/<filename>.md`). Please review it on your phone or laptop and approve before I start execution."

5. Wait for the user's explicit approval. Silence is not approval. If they request changes, make them, push the update so the PR reflects the latest plan, and re-run self-review.

Only proceed to the execution handoff once the user has approved the plan on the PR.

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
