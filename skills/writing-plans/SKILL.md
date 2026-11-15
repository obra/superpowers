---
name: writing-plans
description: Use when you have a spec or requirements for a multi-step task, before touching code
---

# Writing Plans

## Overview

Write implementation plans for an engineer who has not seen this codebase or this spec. Assume they write idiomatic code in the project's language once they know the exact interface and the exact behavior, and that they will make a reasonable choice wherever the plan leaves one open. What they cannot know is what you decided: which files, which names and signatures, which values from the spec, how each feature behavior is verified, and which behaviors are locked. Document those. Give them the whole plan as feature-sized tasks. DRY. YAGNI. Spec-driven (superpowers:spec-driven-development), no TDD. Frequent commits.

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

## Feature Specs

Before writing tasks, list the features this plan creates or changes and,
for each, the behaviors (F1, F2, ...) it adds or changes in
`docs/features/<feature>.md`. Copy exact values from the design. Mark a
behavior `[locked]` when it is sensitive (money, auth, permissions, data
integrity, public contracts, values your human partner insists on) and
must survive later edits exactly; mark it in the plan so your human partner
can veto the lock when reviewing. Locked behaviors and recurring known
issues are the ONLY behaviors that get tests.

## Task Right-Sizing

A task delivers one feature slice: a set of spec behaviors a user or
caller can observe working, worth a fresh reviewer's gate. Fold setup,
configuration, scaffolding, and documentation into the task whose
deliverable needs them; split only where a reviewer could meaningfully
reject one task while approving its neighbor. Each task ends with
behavior that can be verified by running it.

## Step Granularity

**Each step is one action with a checkable result:**
- "Update the feature spec" - step
- "Implement X" - step
- "Run it and check the behavior" - step
- "Add the guard test for the locked behavior, prove it can fail" - step (locked behaviors only)
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

## Features

[One line per feature: `docs/features/<feature>.md` — behaviors added or
changed (IDs), and which are `[locked]` with a one-line reason each.]

## Review Focus

[The five input classes or failure modes the spec implies that are most
likely to bite a person using this software — one line each, naming the
input or condition and the behavior a reasonable person would expect,
most likely first. The spec is a vision document: its silence on an
input is not permission for that input to break the program. For each
line, add a verification step to the owning task (run it with that input
and check the result). Only a line that touches a locked behavior gets a
guard test.]

---
```

## Task Structure

````markdown
### Task N: [Component Name]

**Feature:** `docs/features/<feature>.md` — behaviors F1, F2 (F3 [locked])

**Files:**
- Create: `exact/path/to/file.py`
- Modify: `exact/path/to/existing.py:123-145`
- Guard (locked behaviors only): `tests/exact/path/to/test.py`

**Interfaces:**
- Consumes: [what this task uses from earlier tasks — exact signatures]
- Produces: [what later tasks rely on — exact function names, parameter
  and return types. A task's implementer sees only their own task; this
  block is how they learn the names and types neighboring tasks use.]

- [ ] **Step 1: Update the feature spec**

Add or change behaviors F1–F3 in `docs/features/<feature>.md` with the
exact values below.

- [ ] **Step 2: Implement `function(input: InputType) -> ResultType` in `exact/path/to/file.py`**

One line on the approach when the signature and the spec leave a choice
(which library call, which data structure); a code block only for an
algorithm they do not determine.

- [ ] **Step 3: Verify F1, F2 by running it**

Run: `python -m app do-thing --input foo`
Expected: prints `bar` and writes `out/foo.json`

- [ ] **Step 4: Guard F3 [locked]** (only for locked behaviors or recurring issues)

```python
def test_f3_total_rounds_half_up():
    assert total([Decimal("0.005")]) == Decimal("0.01")
```

Run: `pytest tests/path/test.py::test_f3_total_rounds_half_up -v`
Expected: PASS; then break the rounding on purpose → FAIL; restore → PASS

- [ ] **Step 5: Commit**

```bash
git add docs/features/<feature>.md src/path/file.py tests/path/test.py
git commit -m "feat: add specific feature"
```
````

## What a Step Contains

A step is done when the implementer can write exactly one reasonable thing
from it. That is the whole requirement: unambiguous, not complete. Each kind
of step carries what makes it unambiguous and nothing more:

- **A spec step:** the behavior IDs and their exact values.
- **A guard step** (locked behaviors and recurring issues only): the
  test's name and its assertions, as code, with the spec's exact values
  in them, and how to break the code to prove it fails.
- **A code step:** the exact signature (name, parameters, return type), the
  file it lives in, and the specific values the spec pins. The implementer
  writes the body. A body appears only for an algorithm the signature and
  spec do not determine, or for exact copy the spec fixes.
- **A verification step:** the command to run and the output that means it
  passed.
- **A reference to another task:** that task's Interfaces block says what
  to use; the plan does not repeat that task's code.

A plan is the set of decisions the implementer cannot make alone. A plan
longer than the code it describes has written the code instead. Lines that
decide nothing ("TBD", "handle edge cases", "add appropriate validation",
"write tests for the above", "verify it works", a type or function no task defines) are the
opposite failure, and the self-review catches both.

## Self-Review

After writing the complete plan, look at the spec with fresh eyes and check the plan against it. This is a checklist you run yourself — not a subagent dispatch.

**1. Spec coverage:** Skim each section/requirement in the spec. Can you point to a task that implements it? List any gaps.

**2. Step scan:** Every step must let the implementer write exactly one reasonable thing, and no step may carry more than that: a line that decides nothing is a gap, a function body the signature and spec already determine is a transcript. Fix both.

**3. Type consistency:** Do the types, method signatures, and property names you used in later tasks match what you defined in earlier tasks? A function called `clearLayers()` in Task 3 but `clearFullLayers()` in Task 7 is a bug.

**4. Review Focus:** For each input class or failure mode the spec implies, is there a task whose verification exercises it? The five uncovered ones most likely to bite a person go in the Review Focus section, and each line there gets a verification step in the owning task. An empty section means you checked and found none, not that you skipped the check.

**5. Test budget:** Every test in the plan guards a `[locked]` behavior or a recurring issue. Delete any other test step and replace it with a run-it verification step.

**6. Proportion:** Compare the plan's length to the spec's. A plan several times longer than the spec it implements is a transcript of the program, not a plan. If code blocks are most of the document, replace bodies with signatures and expected behavior, and check that each step is still unambiguous.

If you find issues, fix them inline. No need to re-review — just fix and move on. If you find a spec requirement with no task, add the task.

## Execution Handoff

After saving and self-reviewing the plan, link it for your human partner
to read. If they have already explicitly supplied an execution method, ask
them to review the plan and confirm it captures what they want; wait for that
review before implementation, then use the preserved method. Otherwise, ask
them to review the plan and choose an execution method before implementation.

**When no execution method has already been supplied:**

**"Plan complete and saved to `docs/superpowers/plans/<filename>.md`. Please review the plan. Which execution approach would you prefer?**

- **Subagent-driven** - A fresh subagent implements each task and a fresh reviewer checks it before the next one starts, then a whole-branch review at the end. Most thorough; costs a fresh context per task and per review.
- **Native** - I implement every task myself in this session, the way this harness runs work, then one fresh reviewer on the most capable model checks the whole branch. Cheapest and fastest; no independent review until the end. Runs well with a mid-tier session model, since the plan carries the design.

**For this plan I recommend <one of the two>, because <one sentence from the plan: how much the tasks depend on each other's interfaces, how many there are, what a shipped mistake would cost>. Does the plan capture what you want, and which approach should we use?"**

**When an execution method has already been supplied:**

**"Plan complete and saved to `docs/superpowers/plans/<filename>.md`. Please review the plan. Does it capture what you want?"**

**If Subagent-driven chosen:**
- **REQUIRED SUB-SKILL:** Use superpowers:subagent-driven-development

**If Native chosen:**
- **REQUIRED SUB-SKILL:** Use superpowers:executing-plans
