# Skeleton-First Plans

The alternative plan shape from writing-plans' Two Plan Shapes router.
Each section below replaces the same-named section of
[SKILL.md](SKILL.md); everything SKILL.md says that is not named here
still binds — Scope Check, File Structure, Task Right-Sizing, the plan
header, Self-Review, and the Execution Handoff.

## Overview

Write a plan that carries the decisions, not the keystrokes:
decomposition, file structure, interfaces, constraints, and a precise
contract per task. Assume the engineer is skilled and designs their own
code and tests from a precise contract, but knows nothing about our
codebase, toolset, or problem domain — every name, path, constraint, and
behavior they must match is stated explicitly. DRY. YAGNI. TDD.
Frequent commits.

## When This Shape Fits

Use it when the spec composes more than one subsystem and a running
end-to-end slice early is worth a longer total build: the value arrives
as soon as real input reaches real output, and every later task widens
something that already runs.

Do not use it for a change to one subsystem, or when the whole point is
to land the finished thing as fast as possible. This shape spends its
first task on a slice that does almost nothing, and it spends planning
effort on contracts and interfaces the task-by-task shape gets for free
by writing the code out.

## Plan Document Header

The header is SKILL.md's, plus one line directly under the **Goal:**
line, which is how executors know which shape they are running:

```markdown
**Plan shape:** skeleton-first
```

## Walking Skeleton First

Task 1 builds the thinnest end-to-end slice through every subsystem the
spec composes — real input to real output — before any task deepens a
single layer; later tasks widen the skeleton.

The test of a skeleton is that it runs. A first task that builds the
data loader, the schema, or the config layer is a foundation, not a
skeleton: nothing runs until something above it exists. A skeleton
reaches the output — thinly, with one real case — through every
subsystem the spec names.

## Task Contracts, Not Task Scripts

A task states WHAT must exist when it is done, precisely enough that a
skilled engineer can build it without asking you anything, without
prescribing HOW:

- **Goal:** one short paragraph naming the deliverable and its role in
  the feature.
- **Success criteria:** concrete, checkable behaviors — exact commands
  to run and what they must show, the cases tests must cover (including
  failure cases), constraints that bind the implementation.
- **Notes:** what the engineer needs and cannot discover alone — spec
  sections to read, files worth reading first, known pitfalls.

The Interfaces block carries the exact names, signatures, and types;
the success criteria carry the behaviors; the engineer supplies the
code and the test design. TDD and frequent commits remain required.

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

**Goal:** [one paragraph — the deliverable and its role in the feature]

**Success criteria:**
- Run: `pytest tests/exact/path/to/test.py -v` — all tests pass; tests
  cover [the specific behaviors and failure cases, named concretely]
- [observable behavior the deliverable must exhibit, with the exact
  command or input/output that demonstrates it]
- [constraint that binds the implementation, copied from the spec]

**Notes:** [spec sections to read; files to read first; known pitfalls]

**Tier:** mechanical | judgment. Mechanical = the deliverable is fully
specified by Files + Interfaces + success criteria above (most tasks in
a well-specified plan are mechanical); judgment = multi-file
coordination, debugging, or real design latitude remains. The
implementer's model follows this field — mark it deliberately.

**Commit:** one commit ending the task; message named here.
````

## No Vague Contracts

Every contract must be checkable by someone who did not write it. These
are **plan failures** — never write them:
- "TBD", "TODO", "implement later", "fill in details"
- Goals naming activity instead of a deliverable ("improve error handling")
- Success criteria with no observable check ("works correctly", "handles edge cases")
- Interfaces blocks omitting a name, signature, or type another task consumes
- "Similar to Task N" (state this task's own contract in full — the engineer may be reading tasks out of order)
- References to types, functions, or methods not defined in any task's Interfaces block

## Self-Review

Run SKILL.md's Self-Review checklist, reading step 2 against "No Vague
Contracts" above rather than "No Placeholders".

## Red Flags

| Thought | Reality |
|---------|---------|
| "Task 1 is the data loader — that's the foundation" | A foundation is a layer. The skeleton runs real input to real output through every subsystem the spec names, thinly. |
| "The skeleton can return a hardcoded value for now" | It may be thin, but the path must be real: real input, real wiring, real output. A hardcoded response tests nothing end to end. |
| "A contract without the code is vague" | Vague is an uncheckable success criterion. Exact names, exact commands, exact expected output — no code. |
| "I'll write the test code into the task to be safe" | The success criteria name the cases; the implementer designs the tests. Written-out tests are the task-by-task shape. |
| "Skeleton-first is the better shape, so I'll use it here" | It costs total wall clock. Without more than one subsystem and a reason to want an early running slice, plan task-by-task. |
