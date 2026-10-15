---
name: writing-plans
description: Use when you have a spec or requirements for a multi-step task, before touching code
---

# Writing Plans

Write an implementation plan that implementers execute task by task, often in parallel and on cheaper models. Each implementer can read the codebase, but sees only the plan's shared sections and its own tasks: not the spec, the rest of the plan, or this conversation. The plan decides contracts, risks, and scope, never the implementation code, which the implementer writes.

Save to `docs/toolbelt/plans/YYYY-MM-DD-<feature-name>.md`, or your human partner's location when they name one.

If the spec covers independent subsystems, propose one plan each; every plan produces working, testable software on its own. Plan a large effort in full up front so delivery can run unattended; when it is tracked, file one tracker project with a ticket per boundary or group.

## Explore first

Read the nearest instructions for the target files, the files you will change, their tests, and the existing pattern each task should copy. Keep searching until you can name exact paths, signatures, and precedents.

Dispatch through toolbelt:agent-routing's `explorer` role when a question is wide — every call site of a changed contract, or several unfamiliar subsystems — and you need only the conclusion; most plans need one explorer or none. Ask for checkable answers: paths, line ranges, signatures, a reference implementation to copy. End every brief with: **"What would a competent implementer, working only from a written plan, get wrong here?"**

### Traps to look for

- **Assertions that can never pass.** An absence check must exclude its own evidence: `grep -r oldName` finds `oldName` in the test that runs it.
- **Checks that can't fail.** A guard test whose setup never reaches the guarded branch, or a precondition read from output the gated command itself produces. Make the check a separate command that runs first.
- **Coverage that leaves with the code.** When deleting code and its tests, list the assertions that protect code you are keeping, move them somewhere that stays, see them pass, then delete.
- **Tooling traps.** Inverted exit codes (`git grep` exits 0 on a match, a failure for an absence check); tools missing on CI.
- **Order.** Codegen, migrations, or fixtures the tests need first.
- **Shared contracts.** Other consumers of a changed signature, table, or event.
- **Environment drift.** Where local and CI disagree.

Every trap you find is either handled in the plan — the decision, exclusion, or ordering that deals with it — or named with an instruction to escalate.

## Shape the work

**Files.** Map the files the work creates or modifies, each with one responsibility, following the codebase's patterns. Files that change together live together: split by responsibility, not by layer.

**Tasks.** A task is one coherent change a reviewer can judge in one pass, ending in something independently verifiable. Fold setup, configuration, and documentation into the task that needs them.

- Size: past about 15 files, the task's Decisions name the build order; past roughly 40 files or 2,500 changed lines, split it. Go larger for a mechanical sweep — one uniform, behavior-neutral change with one verification command; mark it `Mechanical sweep:` and name the command.
- Split when two parts could run in parallel on disjoint files, or when a reviewer could reject one part and approve the other. Don't split for size alone below the tripwire.
- A task's **Files:** block lists every file it creates or modifies. "Plus every caller" is not a list.
- The task that changes a migration, shared schema, shared type, or shared contract also updates the code that keeps it correct.
- Every task picks a **Verify** mode:
  - `test-first` — business rules, calculations, state changes, bug fixes: the implementer writes the tests for the task's Proves list first.
  - `test-with` — wiring, UI composition, refactors under existing coverage: tests are written alongside the code and must pass.
  - `checks-only` — configuration, documentation, generated code, mechanical sweeps: the named commands are the evidence, and Proves may be `none`.

  A guard (a permission check, a tenant filter, a rejection path) is marked `(guard)` in the Proves list and is test-first whatever the task's mode.
- A task that touches money, auth or permissions, tenant scoping, migrations, or a shared contract carries `**Review:** per-task`; the rest are reviewed in the boundary's final review.

**PR boundaries.** Group tasks into pull requests, each one independently verifiable outcome a reviewer can judge on its own. Every task number appears in exactly one boundary, and each boundary's verification passes without later boundaries. A boundary's `Depends on` names at most one predecessor whose PR may still be open when the boundary starts; it stacks on that PR, and any other dependency sits lower in that chain or has merged. Two boundaries that don't depend on each other must not edit the same files: make them one PR or chain them. A sweep across many files lands before other boundaries branch or runs inside each PR on the paths it touches; it never blocks other merges. For shared substrate, ship the core plus one representative consumer first; later consumers share a PR only when they repeat the same reviewer judgment. Novel lifecycle, export, or rollout work stays separate.

**Execution tracks.** Design for parallel work: put shared contracts in an early task, then give independent tasks disjoint files so they can run at the same time. For any boundary with more than three tasks, look for tracks, and declare `## Execution Tracks` after `## PR Boundaries` when two or more can run concurrently; read [execution-tracks.md](execution-tracks.md) first. Without the section, tasks run in order.

## Level of detail

| Artifact | The plan writes |
|---|---|
| Data model — schema, migrations, shared types | Every field, type, constraint, and index, once, in `## Data Model`; tasks derive from it |
| Constants, config, fixtures | Exact values |
| Functions and services | Signature stubs: name, parameters, return type, error behavior |
| Endpoints | Method, path, request/response shape, status codes, capability |
| Tests | The task's Proves list: every behavior the plan decided — defaults, edge cases, error paths and their codes, limits — and every guard, one line each: setup — observable result. Leave out happy paths and what follows directly from the contract |
| UI components | Name, props contract, states, primitives to compose |
| Anything with in-repo precedent | The decision plus the reference to copy: `path:line` |

A task is specified enough when two capable implementers working from it would write behaviorally interchangeable code.

A placeholder is an undecided decision, not unwritten code. These fail review:

- "TBD", "TODO", "implement later", "fill in details"
- "Add error handling", "add validation", "handle edge cases", "write tests for the above" — name each decided behavior, in Proves when tested
- "Similar to Task N" — the implementer cannot see Task N; restate the contract
- A type, function, or method no task defines

## Plan document

`scripts/task-brief` copies `## Global Constraints`, `## Known Gotchas`, and `## Data Model` into every task's brief, so keep those headings exactly as written.

````markdown
# [Feature Name] Implementation Plan

> Execute with toolbelt:delivery.

**Goal:** [one sentence]

**Architecture:** [2–3 sentences]

**Tech Stack:** [key technologies and libraries]

## Global Constraints

[The spec's project-wide requirements — version floors, dependency limits,
naming and copy rules — one line each, exact values copied verbatim.]

## Known Gotchas

[Cross-cutting traps, one line each, with the decision that handles each.
Task-specific traps go on the task.]

## Data Model

[Only when the work adds or changes schema, migrations, shared types, or
contracts: the exact shapes, once. Tasks reference it.]

## PR Boundaries

| PR | Outcome | Tasks | Depends on | Independent verification |
|---|---|---|---|---|
| 1 | [one reviewable outcome] | [task numbers] | [boundary numbers or none] | [command or observable result] |

### Task 1: [Component Name]

**Files:**
- Modify: `src/definitions/service.py:40-72`
- Modify: `src/definitions/errors.py` (map `DuplicateKeyError` to 409)
- Test: `tests/definitions/test_service.py`
- Test: `tests/definitions/test_routes.py`

**Interfaces:**
- Consumes: [exact signatures this task uses from earlier tasks]
- Produces: [exact names, parameter and return types later tasks rely on,
  or `Produces: none`]

**Contract:**

```python
def create_definition(org_id: str, input: CreateDefinitionInput) -> Definition:
    """Raises DuplicateKeyError (-> 409 DUPLICATE_KEY) when org already has input.key."""
```

**Decisions:** [what the contract can't carry, one line each: take the
definition locks before the entity row; copy the tenancy filter from
`definitions/service.py:88`]

**Proves:**
- input omits `type` — created row has `type == "TEXT"`
- (guard) org already has key `size` — `create_definition` raises `DuplicateKeyError`; the API returns 409 `DUPLICATE_KEY`

**Verify:** test-first — `pytest tests/definitions -q`

**Review:** per-task

**Gotchas:** [traps in this task, each with the decision that handles it,
or the constraint and an instruction to escalate; omit if none]
````

## Review

Check the plan against the spec yourself first: every requirement has a task, no task defers a decision, names and types agree across tasks, every trap is handled or flagged. Fix what you find.

Then save the plan and route a `reviewer` with specialty `plan` through toolbelt:agent-routing, on a different harness than yours; if the routing names none, stop and tell your human partner rather than choosing a reviewer yourself. Give it the plan and spec paths and ask it to judge:

- spec coverage, with nothing extra
- whether each task is bounded tightly enough that an implementer on a cheaper model makes no product or contract decision
- task size and order, and parallel work the plan missed
- interface consistency across tasks, placeholders, and implementation code where a contract would do
- Verify modes: business rules, calculations, state changes, or bug fixes marked anything but `test-first` are defects, as are unmarked guards; each Proves list covers its task's requirements
- `Review: per-task` marks against the risk list in Shape the work
- what the plan fails to anticipate: failure paths, existing data, cleanup and other lifecycle, consumers of a changed contract, unflagged traps
- Global Constraints and PR boundaries

It may dispatch its own explorers.

Small technical gaps: fix them and proceed. A rework large enough to change the approach: bring it to your human partner. Unsure: ask.

## Handoff

Unless your human partner or the session's instructions say to proceed without approval, give them the plan path, the reviewer's harness, and a short summary, then wait for approval. Once approved, invoke toolbelt:delivery with the plan path. Do NOT invoke any other skill.
