---
name: writing-plans
description: Use when you have a spec or requirements for a multi-step task, before touching code
---

# Writing Plans

Write an implementation plan that fresh implementers execute one task at a time, often many in parallel and on cheaper models. Each implementer can read the codebase, but sees only the plan's shared sections and its own task: not the spec, the other tasks, or this conversation. So the plan does the hard thinking. It settles feature shape, exports and public names, signatures, error and status codes, data shapes, and which files change, and it bounds each task. The implementer decides only how the code is written inside that contract.

Save to `docs/toolbelt/plans/YYYY-MM-DD-<feature-name>.md`, or your human partner's location when they name one.

If the spec covers independent subsystems, propose one plan each; every plan produces working, testable software on its own.

## Explore first

Know the code before you plan it. Read the nearest instructions for the target files, the files you will change, their tests, and the existing pattern each task should copy. Keep searching until you can name exact paths, signatures, and precedents.

Dispatch through toolbelt:agent-routing's `explorer` role when a question is wide — every call site of a changed contract, or several unfamiliar subsystems — and you need only the conclusion; most plans need one explorer or none. Ask for checkable answers: paths, line ranges, signatures, a reference implementation to copy. End every brief with: **"What would a competent implementer, working only from a written plan, get wrong here?"**

### Traps to look for

- **Assertions that can never pass.** An absence check must exclude its own evidence: `grep -r oldName` finds `oldName` in the test that runs it.
- **Checks that can't fail.** A guard test whose setup never reaches the guarded branch, or a precondition read from output the gated command itself produces. Make the check a separate command that runs first.
- **Coverage that leaves with the code.** When deleting code and its tests, list the assertions that protect code you are keeping, move them somewhere that stays, see them pass, then delete.
- **Tooling traps.** Inverted exit codes (`git grep` exits 0 on a match, a failure for an absence check); tools missing on CI.
- **Order.** Codegen, migrations, or fixtures the tests need first.
- **Shared contracts.** Other consumers of a changed signature, table, or event.
- **Environment drift.** Where local and CI disagree.

Every trap you find ends up either handled in the plan — the code, exclusion, or ordering that deals with it — or named with an instruction to escalate.

## Shape the work

**Files.** Map the files the work creates or modifies, each with one responsibility, following the codebase's patterns. Files that change together live together: split by responsibility, not by layer.

**Tasks.** A task is one coherent change a reviewer can judge in one pass, ending in something independently verifiable. Fold setup, configuration, and documentation into the task that needs them.

- Size: up to roughly 15 files or 800 changed lines; past about 8 files, the task's Decisions name the build order. Go larger for a mechanical sweep — one uniform, behavior-neutral change with one verification command; mark it `Mechanical sweep:` and name the command.
- Split when two parts could run in parallel on disjoint files, or when a reviewer could reject one part and approve the other. Don't split for size alone below the guideline.
- A task's **Files:** block lists every file it creates or modifies. "Plus every caller" is not a list.
- The task that changes a migration, shared schema, shared type, or shared contract also updates the code that keeps it correct.
- Every task picks a **Verify** mode:
  - `test-first` — business rules, calculations, state changes, bug fixes: the implementer writes the tests for the task's Proves list first and sees each fail.
  - `test-with` — wiring, UI composition, refactors under existing coverage: tests are written alongside the code and must pass.
  - `checks-only` — configuration, documentation, generated code, mechanical sweeps: the named commands are the evidence, and Proves may be `none`.

  A guard (a permission check, a tenant filter, a rejection path) is marked `(guard)` in the Proves list and must be seen failing without the guard, whatever the task's mode.

**PR boundaries.** Group tasks into pull requests, each one independently verifiable outcome a reviewer can judge on its own. Every task number appears in exactly one boundary, and each boundary's verification passes without later boundaries. A boundary's `Depends on` names at most one predecessor whose PR may still be open when the boundary starts; every other dependency merges first. Two boundaries that don't depend on each other must not edit the same files: make them one PR or chain them. For shared substrate, ship the core plus one representative consumer first; later consumers share a PR only when they repeat the same reviewer judgment. Novel lifecycle, export, or rollout work stays separate.

**Execution tracks.** Design for parallel work: put shared contracts in an early task, then give independent tasks disjoint files so they can run at the same time. For any boundary with more than three tasks, look for tracks, and declare `## Execution Tracks` after `## PR Boundaries` when two or more can run concurrently; read [execution-tracks.md](execution-tracks.md) first. Without the section, tasks run in order.

## Level of detail

| Artifact | The plan writes |
|---|---|
| Data model — schema, migrations, shared types | Complete code, once, in `## Data Model`; tasks derive from it |
| Constants, config, fixtures | Exact values |
| Functions and services | Signature stubs: name, parameters, return type, error behavior. Exact lines only when a requirement depends on them |
| Endpoints | Method, path, request/response shape, status codes, capability |
| Tests | The task's Proves list: every behavior the plan decided — defaults, edge cases, error paths and their codes, limits — and every guard, one line each: setup — observable result. Leave out happy paths and what follows directly from the contract; the implementer tests those anyway. Full test code only where the harness is a trap with no in-repo precedent |
| UI components | Name, props contract, states, primitives to compose |
| Anything with in-repo precedent | The decision plus the reference to copy: `path:line` |

A task is specified enough when two capable implementers working from it would write behaviorally interchangeable code.

A placeholder is an undecided decision, not unwritten code. These fail review:

- "TBD", "TODO", "implement later", "fill in details"
- "Add error handling", "add validation", "handle edge cases" — name the exact behavior
- "Handle edge cases" or "write tests for the above" — name each decided behavior in Proves
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
naming and copy rules, platform requirements — one line each, exact values
copied verbatim.]

## Known Gotchas

[Cross-cutting traps, one line each, with the decision that handles each.
Task-specific traps go on the task.]

## Data Model

[Only when the work adds or changes schema, migrations, shared types, or
contracts: the complete code, once. Tasks reference it.]

## Agent Routing

[Optional, in plain words: routing for the implementer, task reviewer, or
final reviewer that overrides the project's routing text for this plan;
see toolbelt:agent-routing.]

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

**Gotchas:** [traps in this task, each with the decision that handles it,
or the constraint and an instruction to escalate; omit if none]
````

## Review

Check the plan against the spec yourself first: every requirement has a task, no task defers a decision, names and types agree across tasks, every trap is handled or flagged. Fix what you find.

Then save the plan and have a different harness review it. Route a `reviewer` with specialty `plan` through toolbelt:agent-routing, on a different harness than yours; if the routing names none, stop and tell your human partner rather than choosing a reviewer yourself. Give it the plan and spec paths and ask it to judge:

- spec coverage, with nothing extra
- whether each task is bounded tightly enough that an implementer on a cheaper model makes no product or contract decision
- task size and order, and parallel work the plan missed
- interface consistency across tasks, and placeholders
- Verify modes: business rules, calculations, state changes, or bug fixes marked anything but `test-first` are defects, as are unmarked guards; each Proves list covers its task's requirements
- what the plan fails to anticipate: failure paths, existing data, cleanup and other lifecycle, consumers of a changed contract, unflagged traps
- Global Constraints and PR boundaries

It may dispatch its own explorers.

Small technical gaps: fix them and proceed. A rework large enough to change the approach: bring it to your human partner. Unsure: ask.

## Handoff

Unless your human partner or the session's instructions say to proceed without approval, give them the plan path, the reviewer's harness, and a short summary, then wait for approval. Once approved, invoke toolbelt:delivery with the plan path. Do NOT invoke any other skill.
