# Task-Fidelity Improvement

**Workflow State:** CEO Approved
**Spec Revision:** 1
**Last Reviewed By:** plan-ceo-review

## Summary

Improve Superpowers by extending its existing markdown-authoritative, helper-enforced model from workflow state and execution structure into semantic task fidelity.

Superpowers already has the right operational shape:

- repo-visible artifacts are authoritative
- helpers fail closed instead of guessing
- execution is routed through an explicit workflow state machine
- approved plans are meant to be executable, not vague project notes

The missing layer is a strict semantic bridge from approved spec to approved plan to execution handoff to review. Today the system can prove that the right artifact exists and that execution state is structurally truthful, but it cannot yet prove that every approved requirement survived intact across planning, dispatch, implementation, and review.

The v1 direction for this project is:

- keep spec and plan markdown authoritative
- add a derived helper that parses, validates, and compiles those artifacts
- require execution-bound specs to expose stable requirement IDs
- require plans to prove exact requirement coverage and task-level traceability
- dispatch canonical task packets instead of controller-written summary context
- make new and revised planning and review flows fail closed immediately
- leave legacy approved artifacts historical unless they are revised or re-enter execution

## Problem

The current workflow loses semantic fidelity at four points.

### 1. Specs are rich prose but not execution-addressable

Specs describe intent, goals, decisions, constraints, and non-goals well, but they do not expose a required structured list of stable requirement IDs that later workflow stages can map against. That leaves plan authors and reviewers relying on qualitative judgment rather than a machine-checkable coverage contract.

### 2. Plans are detailed but not provably traceable back to the spec

The current planning workflow already pushes writers toward exact files, commands, tests, and small executable steps. That is good, but it does not require:

- per-task mapping to exact spec requirements
- verbatim preservation of approved constraints, decisions, and non-goals
- exhaustive proof that every normative requirement is covered by one or more tasks
- proof that tasks do not reopen questions the approved spec already settled

### 3. Execution dispatch still allows semantic compression

Current execution handoff relies on the controller extracting task text and adding surrounding context. Even when the task text is copied faithfully, the semantic boundary still depends on controller-written narration. That creates room for drift, omission, and accidental reinterpretation.

### 4. Review does not consistently compare code against the original approved contract

Task review and final review are stronger than ad hoc review, but they still operate primarily on task wording and controller-provided context. They are not guaranteed to compare the implementation against:

- the exact approved task block
- the exact covered spec requirements
- the exact decisions, non-goals, and constraints that the task must preserve

## Why This Matters

Superpowers is strongest when repo truth is simple and local helper behavior is derived, strict, and fail closed. That philosophy already works for workflow routing and execution-state truth. Without the same discipline for semantic fidelity, approved specs can be weakened during planning, tasks can drift during execution, and reviewers can approve work that is reasonable but not actually authorized.

The goal is not to replace human judgment. The goal is to make human judgment operate on an exact approved contract instead of on summarized context.

## Goals

- Make approved requirements execution-addressable without replacing human-readable markdown.
- Make planning fail closed when any approved requirement lacks implementation coverage.
- Make planning fail closed when a task weakens, widens, or ambiguously restates an approved requirement.
- Make execution handoff deterministic and lossless with respect to approved spec and plan artifacts.
- Make task review compare code against exact approved contract inputs instead of controller narration.
- Make final review able to detect implementation drift outside approved plan scope.
- Preserve the current Superpowers authority model: markdown in the repo stays authoritative, helpers remain derived enforcers.

## Not In Scope

- Replacing repo markdown with database-backed or hidden local workflow authority.
- Auto-planning around unresolved product or architecture questions.
- Auto-approving ambiguous plans by heuristic confidence.
- Turning semantic review into full theorem proving.
- Reworking unrelated workflow stages outside the spec to plan to execution to review path.
- Requiring proactive historical backfill of legacy approved specs or plans that are not being revised or re-entering execution.

## Affected Surfaces

This project affects the following Superpowers surfaces directly:

- `docs/superpowers/specs/*.md` for execution-bound spec structure
- `docs/superpowers/plans/*.md` for canonical traceability structure
- `skills/writing-plans/SKILL.md`
- `skills/plan-eng-review/SKILL.md`
- `skills/executing-plans/SKILL.md`
- `skills/subagent-driven-development/SKILL.md`
- `skills/subagent-driven-development/implementer-prompt.md`
- `skills/subagent-driven-development/spec-reviewer-prompt.md`
- `skills/subagent-driven-development/code-quality-reviewer-prompt.md`
- `skills/requesting-code-review/SKILL.md`
- `skills/requesting-code-review/code-reviewer.md`
- `bin/superpowers-plan-execution`
- `README.md`, `docs/README.codex.md`, `docs/README.copilot.md`, `docs/testing.md`, and `RELEASE-NOTES.md`
- new derived helper surfaces for plan-contract validation and packet generation
- tests and fixtures under `tests/codex-runtime/`, especially the workflow-sequencing, workflow-enhancement, runtime-instruction, PowerShell-wrapper, and workflow-artifact fixture surfaces

## Architecture Boundary

This design keeps the existing authority split and makes it more explicit.

Authority remains in repo-visible markdown:

- approved spec markdown is authoritative for product and workflow intent
- approved plan markdown is authoritative for execution decomposition
- approved execution evidence markdown is authoritative for semantic proof of completed work

Helpers and CLI surfaces remain derived enforcement layers:

- they parse and validate authoritative markdown
- they fail closed on malformed or ambiguous state
- they compile deterministic execution and review inputs from approved artifacts
- they do not become a second approval authority

The supported public workflow inspection CLI remains read-only and non-authoritative. This project strengthens enforcement, not authority ownership.

## Current-System Findings

### Strengths worth preserving

- `superpowers-workflow-status` already enforces conservative routing from repo-visible approval state.
- `superpowers-plan-execution` already enforces structural truth for execution progress and evidence.
- `superpowers-repo-safety` already enforces protected-branch repo-write guarantees for repo-writing workflow stages.
- `bin/superpowers-runtime-common.sh` and `bin/superpowers-pwsh-common.ps1` already centralize shared path, whitespace, and identifier normalization for Bash and PowerShell helpers.
- the workflow already treats approved plans as executable contracts, not as brainstorming notes
- the repo already documents that local helper state is derived and rebuildable

### Concrete issues to fix

- no required requirement-ID surface exists for execution-bound specs
- no required coverage proof exists from approved spec to approved plan
- no canonical task packet exists to replace controller-curated summary context
- review prompts do not consistently receive exact approved task contract inputs
- planning docs and runtime parsing can drift on structural details such as task heading syntax

## What Already Exists

This project should extend existing Superpowers workflow surfaces rather than rebuild them.

- `superpowers-workflow-status` already derives workflow stage from repo-visible approval artifacts and fails closed on malformed or stale state.
- `superpowers-plan-execution` already owns execution-state truth for approved plans and paired evidence artifacts.
- `superpowers-repo-safety` already protects repo-writing workflow stages on protected branches and must remain in force when this project edits planning and execution skills.
- `writing-plans` already treats plans as executable task contracts with exact files, commands, and ordered steps.
- `plan-eng-review` already owns the engineering-approval gate and execution handoff.
- `executing-plans`, `subagent-driven-development`, and `requesting-code-review` already provide the correct execution and review touchpoints for consuming packet-backed context.
- `bin/superpowers-runtime-common.sh` and `bin/superpowers-pwsh-common.ps1` already provide reusable normalization primitives that the new helper should call instead of re-implementing.
- `superpowers-workflow` already exists as the supported public read-only workflow inspection CLI and should not be replaced or widened into an approval authority.

The project therefore reuses:

- existing markdown approval truth
- existing workflow and execution helpers
- existing shared runtime/common normalization helpers
- existing protected-branch repo-safety guarantees
- existing execution and review skill boundaries

The project adds one new derived helper because no existing helper owns semantic traceability across spec, plan, execution handoff, and review.

## Architecture Overview

### Current Dependency Graph

```text
approved spec markdown
        |
        v
  writing-plans
        |
        v
approved plan markdown ----> superpowers-plan-execution
        |                          |
        |                          v
        |                    execution evidence
        |
        +--> controller extracts task text + context
                  |
                  +--> implementer
                  +--> spec reviewer
                  +--> final review
```

Current weakness: the plan and spec remain authoritative, but semantic execution context is still hand-carried through controller narration.

### Proposed Dependency Graph

```text
approved spec markdown -------------------------------+
        |                                             |
        |                                             v
        +--> superpowers-plan-contract lint <--- approved plan markdown
        |                     |                         |
        |                     |                         +--> superpowers-plan-execution
        |                     |                                   |
        |                     |                                   v
        |                     |                             execution evidence
        |                     |
        |                     +--> build-task-packet --+
        |                                              |
        v                                              v
  writing-plans                                   execution skills
                                                   reviewers
                                                   final review
```

This keeps authority in markdown while shifting semantic enforcement into a derived helper instead of controller-written context.

### Full System Architecture

```text
                    +----------------------------------+
                    | approved spec markdown           |
                    | - prose authority                |
                    | - Requirement Index             |
                    +----------------+-----------------+
                                     |
                                     v
                    +----------------------------------+
                    | writing-plans                    |
                    | emits approved-plan candidate    |
                    +----------------+-----------------+
                                     |
                                     v
                    +----------------------------------+
                    | approved plan markdown           |
                    | - Coverage Matrix                |
                    | - canonical tasks                |
                    | - Files / steps                  |
                    +---+--------------------------+---+
                        |                          |
                        |                          v
                        |          +----------------------------------+
                        |          | superpowers-plan-execution       |
                        |          | execution-state truth only       |
                        |          +----------------+-----------------+
                        |                           |
                        v                           v
        +----------------------------------+   +----------------------+
        | superpowers-plan-contract        |   | execution evidence   |
        | - lint                           |   | semantic proof       |
        | - packet build                   |   +----------------------+
        +---------+---------------+--------+
                  |               |
                  |               v
                  |      +-----------------------------+
                  |      | plan-eng-review             |
                  |      | fail-closed approval gate   |
                  |      +-----------------------------+
                  |
                  +-------------------+-------------------+
                                      |                   |
                                      v                   v
                       +-------------------------+   +-------------------------+
                       | executing-plans         |   | subagent-driven-dev     |
                       | same-session executor   |   | isolated executor       |
                       +------------+------------+   +------------+------------+
                                    |                             |
                                    +-------------+---------------+
                                                  |
                                                  v
                                +--------------------------------------+
                                | packet-backed implementation/review  |
                                | implementer + spec review + final    |
                                +--------------------------------------+
```

### Primary Data Flow: Requirement Coverage Validation

```text
spec path + plan path
    |
    v
parse spec Requirement Index
    |
    +--> missing path? -----------------> fail closed: MissingRequirementIndex
    |
    +--> empty index? ------------------> fail closed: MalformedRequirementIndex
    |
    +--> malformed entry? --------------> fail closed: MalformedRequirementIndex
    |
    v
parse plan Coverage Matrix + task blocks
    |
    +--> missing matrix? ---------------> fail closed: CoverageMatrixMismatch
    |
    +--> unknown ID? -------------------> fail closed: UnknownRequirementId
    |
    +--> uncovered requirement? --------> fail closed: MissingRequirementCoverage
    |
    v
emit lint result
```

### Primary Data Flow: Task Packet Generation

```text
approved plan path + task number
    |
    v
load approved plan + linked approved spec
    |
    +--> plan missing? ------------------> fail closed: PlanContractInvalid
    |
    +--> task missing? ------------------> fail closed: TaskNotFound
    |
    +--> source spec unavailable? -------> fail closed: SourceSpecUnavailable
    |
    v
extract exact task block + exact covered requirements
    |
    +--> malformed task structure? ------> fail closed: TaskPacketBuildFailed
    |
    +--> stale persisted packet? --------> regenerate or fail closed
    |
    v
emit canonical packet
```

### Task Packet Lifecycle State Machine

```text
not_built
   |
   v
built_in_memory
   |
   +--> persist requested --> persisted_valid
   |                           |
   |                           +--> plan/spec revision or fingerprint change --> persisted_stale
   |                                                                      |
   |                                                                      v
   +-------------------------------------------------------------- regenerate_packet
                                                                              |
                                                                              v
                                                                        persisted_valid
```

Invalid states:

- persisted packet whose plan revision does not match the current approved plan revision
- persisted packet whose source spec revision does not match the linked approved spec revision
- packet content synthesized from controller narration rather than exact approved artifacts

### Single Points Of Failure And Recovery

- `superpowers-plan-contract` becomes the single semantic compiler for this workflow slice.
  Recovery: keep its scope narrow, keep outputs machine-readable, and fail closed back into review instead of letting skills invent fallback semantics.
- canonical task syntax becomes a shared dependency across authoring, execution, and review.
  Recovery: enforce one syntax in tests, fixtures, generated docs, and both helpers.
- persisted task packets may become stale if revisions change.
  Recovery: include revision plus fingerprint checks and require regeneration on mismatch.

### Production Failure Scenarios

- Reviewer runs final review against a stale task packet after the plan revision changed.
  Expected behavior: packet is rejected as stale and must be regenerated before review continues.
- Engineer writes a plan that structurally parses but weakens a `must` requirement to `should`.
  Expected behavior: lint fails before engineering approval and keeps the plan in `Draft`.
- Controller attempts to answer an implementer ambiguity question from memory instead of from the packet.
  Expected behavior: skill contract treats unanswered packet gaps as escalation back to review, not local reinterpretation.
- Windows wrapper lags behind the Bash helper contract.
  Expected behavior: tests fail on contract mismatch before release so one platform cannot silently accept a weaker plan contract.

## Proposed Design

## 1. Add A Structured Requirement Index To Every Execution-Bound Spec

Every spec that can flow into `writing-plans` must include a required `Requirement Index` near the end of the document.

Example:

```markdown
## Requirement Index

- [REQ-001][behavior] When `superpowers-session-entry resolve` finds no valid session decision for the current turn, ask one interactive question before any normal Superpowers work happens.
- [REQ-002][behavior] Persist the session decision file at `~/.superpowers/session-flags/using-superpowers/$PPID`.
- [REQ-003][constraint] Valid persisted values are exactly `enabled` and `bypassed`.
- [DEC-001][decision] The first-turn session-entry bootstrap is runtime-owned and resolves before the normal `using-superpowers` stack.
- [NONGOAL-001][non-goal] Do not make `using-superpowers` itself the approval authority for missing or malformed session-entry state.
- [VERIFY-001][verification] Regression coverage must cover first-trigger ask, bypass persistence, explicit re-entry, malformed-state fail-closed behavior, and the runtime-owned bootstrap boundary.
```

Rules:

- the prose spec remains authoritative
- the Requirement Index is a structured index of normative statements from that same spec, not a separate design artifact
- every entry must include a stable ID, a type, and an exact normative statement
- unchanged requirements retain their IDs across spec revisions
- materially changed requirements receive new IDs
- planning cannot begin if the Requirement Index is missing or malformed

This makes the spec execution-addressable without replacing prose with metadata.

## 2. Add A Mandatory Traceability Block To Every Plan Task

Every plan task must use a canonical structure.

```markdown
## Task N: [Task Title]

**Spec Coverage:** REQ-002, REQ-003, DEC-001, NONGOAL-001, VERIFY-001
**Task Outcome:** [One sentence describing what is true when this task is done]
**Plan Constraints:**
- [Constraint inherited from decomposition or approved design choices]
- [Constraint inherited from source spec or engineering review]
**Open Questions:** none

**Files:**
- Create: `exact/path/to/file`
- Modify: `exact/path/to/existing.file`
- Test: `tests/exact/path/to/test.file`

- [ ] **Step 1: ...**
- [ ] **Step 2: ...**
```

Rules:

- `## Task N:` is canonical; `### Task N:` is invalid
- every task must include `Spec Coverage`
- every listed ID must exist in the source spec Requirement Index
- every task must cover at least one requirement ID
- every task must include `Task Outcome`
- every task must include `Plan Constraints`
- every task must include `Open Questions`
- engineering-approved plans require `Open Questions: none` for every task
- every task must include a parseable `Files:` block

This makes each task a traceable execution contract rather than only a detailed prose chunk.

## 3. Add A Plan-Level Requirement Coverage Matrix

Every plan must include a derived `Requirement Coverage Matrix` before the task list.

```markdown
## Requirement Coverage Matrix

- REQ-001 -> Task 1
- REQ-002 -> Task 2
- REQ-003 -> Task 2
- DEC-001 -> Task 2
- NONGOAL-001 -> Task 2
- VERIFY-001 -> Task 1, Task 2, Task 4
```

Rules:

- every requirement ID from the source spec must appear in the matrix
- every requirement must map to one or more tasks
- if a task references an ID that is missing from the matrix, the plan is invalid
- silent omission is invalid; if implementation is intentionally deferred, the spec or plan must state that explicitly

This gives engineering review one hard fail-closed coverage gate.

## 4. Add A Derived Plan-Contract Helper

Introduce a new helper surface:

- `bin/superpowers-plan-contract`
- `bin/superpowers-plan-contract.ps1`

This helper is a validator and packet builder. It is not the approval authority.
It should reuse the shared normalization primitives already shipped in `bin/superpowers-runtime-common.sh` and `bin/superpowers-pwsh-common.ps1` instead of introducing parallel helper-specific path, whitespace, or identifier normalization.

It owns:

- spec Requirement Index parsing
- plan traceability parsing
- coverage validation
- ambiguity linting
- requirement weakening and widening detection
- canonical task-packet generation

### Helper Commands

Lint:

```text
superpowers-plan-contract lint --spec <spec-path> --plan <plan-path>
```

Build packet:

```text
superpowers-plan-contract build-task-packet --plan <plan-path> --task <N> [--format markdown|json] [--persist yes|no]
```

### Minimum Lint Failure Classes

- `MissingRequirementIndex`
- `MalformedRequirementIndex`
- `UnknownRequirementId`
- `MissingRequirementCoverage`
- `TaskMissingSpecCoverage`
- `TaskOpenQuestionsNotResolved`
- `AmbiguousTaskWording`
- `RequirementWeakeningDetected`
- `MalformedTaskStructure`
- `MalformedFilesBlock`
- `CoverageMatrixMismatch`
- `UnexpectedPlanContractFailure`

### Minimum Packet Build Failure Classes

- `TaskNotFound`
- `TaskPacketBuildFailed`
- `PlanContractInvalid`
- `SourceSpecUnavailable`
- `UnsupportedPlanRevision`
- `TaskPacketStale`

## 5. Make Ambiguity And Weakening Fail Closed

The helper must lint for two specific semantic failure classes.

### Unresolved ambiguity

Plans must fail when a task includes vague or optional phrasing for a question the approved spec already resolved.

Examples that should fail unless explicitly justified:

- `if needed`
- `as appropriate`
- `handle edge cases`
- `clean up related code`
- `support similar behavior`
- `or equivalent`
- `use a reasonable default`
- `consider adding`
- `if useful`
- `etc.`

### Semantic weakening or widening

Plans must fail when task wording changes requirement force or scope.

Examples:

- spec says `must`; task says `should`
- spec says exact file, path, or command; task says `something like`
- spec forbids a new helper; task leaves helper creation open
- spec defines exact valid values; task says `a couple of possible values`

The first pass does not need perfect NLP. Conservative detection is enough if it fails closed and pushes ambiguous cases back into review instead of silently allowing drift.

## 6. Generate Canonical Task Packets For Execution And Review

Execution and review should consume canonical task packets built from approved artifacts, not controller-written context summaries.

A task packet must include:

- plan path
- plan revision
- plan fingerprint
- source spec path
- source spec revision
- source spec fingerprint
- task number
- task title
- exact task block from the approved plan
- exact step list from the approved plan
- exact file scope from the approved plan
- covered requirement IDs
- exact requirement statements from the source spec
- exact covered decisions, non-goals, and constraints
- task-level `Open Questions` value
- required verification commands or assertions
- packet timestamp

Task packets are derived artifacts only. Authority remains with:

- source spec markdown
- approved plan markdown
- execution evidence markdown

When persisted, packets should live under:

```text
~/.superpowers/projects/<slug>/<user>-<safe-branch>-task-packets/
```

Default persistence policy:

- workflow-owned execution and review flows persist packets by default
- ad hoc manual helper invocations default to `--persist no`
- callers may opt out of persistence for workflow-owned flows only when they regenerate the packet immediately before use and do not rely on packet reuse

Persistence must use bounded retention and must treat spec or plan revision mismatch as stale packet state that requires regeneration.

## 7. Tighten Writing-Plans

`writing-plans` must require:

- a parseable Requirement Index before planning begins
- canonical `## Task N:` headings
- a required `Requirement Coverage Matrix`
- required `Spec Coverage`, `Task Outcome`, `Plan Constraints`, `Open Questions`, and `Files` blocks on every task
- a self-check by running `superpowers-plan-contract lint --spec ... --plan ...` before handoff to `plan-eng-review`
- preservation of the existing `superpowers-repo-safety` protected-branch `plan-artifact-write` preflight when the template is updated

New authoring rule:

- the plan writer may not summarize away spec detail; if a task touches a requirement, that ID must appear in `Spec Coverage`

New rejection rule:

- if a task cannot be written without reopening a design question, the plan is not ready for engineering approval

## 8. Tighten Plan-Eng-Review

Before `Workflow State` may change to `Engineering Approved`, `plan-eng-review` must run:

```bash
"$_SUPERPOWERS_ROOT/bin/superpowers-plan-contract" lint \
  --spec <source-spec-path> \
  --plan <plan-path>
```

Engineering approval must fail closed when lint reports:

- missing or malformed Requirement Index
- missing or malformed Requirement Coverage Matrix
- unknown requirement IDs
- uncovered requirement IDs
- tasks without `Spec Coverage`
- tasks with `Open Questions` not equal to `none`
- ambiguous wording
- requirement weakening or widening
- invalid task heading structure
- invalid `Files:` block structure

When `plan-eng-review` is updated for this contract, it must keep the existing `superpowers-repo-safety` protected-branch `approval-header-write` preflight and fail-closed behavior intact.

Human review still matters. Engineering review must also answer:

- Does every task preserve the exact approved decisions and non-goals it touches?
- Does any task grant the implementer discretion the plan or spec already resolved?
- Does any task allow work outside declared file scope without plan revision?
- Does the plan introduce behavior not represented in the source spec Requirement Index?

An engineering-approved plan is declaring that no unresolved design questions remain inside any approved task.

## 9. Tighten Executing-Plans And Subagent-Driven-Development

Both execution modes must switch from controller-curated context to packet-backed execution.

### Executing-Plans

Before starting each task, `executing-plans` must:

- build the canonical task packet
- read it in full
- treat it as the exact task contract for that execution segment
- preserve the existing `superpowers-repo-safety` protected-branch `execution-task-slice` preflight while adopting packet-backed execution

### Subagent-Driven-Development

Replace `task text + context` dispatch with verbatim task-packet dispatch:

- read the approved plan
- build the task packet for the selected task
- pass the packet verbatim to implementer and reviewers
- allow controller-added narrative only for transient logistics such as working directory, branch, or base commit
- preserve the existing `superpowers-repo-safety` protected-branch `execution-task-slice` preflight while changing dispatch inputs

If a subagent asks a question that the packet already answers, the controller must answer from the packet. If the packet does not answer it, the task is ambiguous and execution must stop or route back to review.

## 10. Tighten Implementer And Reviewer Prompts

### Implementer Prompt

The implementer prompt must contain:

- `## Task Packet` with the packet body verbatim
- `## Working Directory`
- `## Base Commit`
- `## Current Branch`

The implementer must be told:

- the packet is the authoritative task contract for that execution slice
- do not reinterpret or weaken requirement statements
- do not implement outside the packet's covered requirements, file scope, or plan constraints
- if the packet says `Open Questions: none` and ambiguity remains, stop and escalate
- do not add nice-to-have work

### Spec-Compliance Reviewer Prompt

The spec reviewer must receive:

- the exact task packet
- the actual diff or changed files
- the implementer report

The reviewer must answer:

- Did the implementation satisfy every exact requirement statement in the packet?
- Did it violate any exact decision, non-goal, or constraint in the packet?
- Did it touch files outside the allowed file scope?
- Did it add behavior not covered by the listed requirement IDs?
- Did it make an interpretation choice that the packet did not authorize?
- Does the code narrow or widen any approved behavior compared with the packet text?

The reviewer output must support:

- `SPEC_COMPLIANT`
- `SPEC_GAPS_FOUND`
- `PLAN_DEVIATION_FOUND`
- `AMBIGUITY_ESCALATION_REQUIRED`

`PLAN_DEVIATION_FOUND` must be used when the implementation is reasonable but outside the approved packet.

### Code-Quality Reviewer Prompt

Code-quality review remains focused on engineering quality, but it must also flag:

- work outside planned file decomposition
- new files or abstractions outside packet scope
- unrelated restructuring without plan authorization

## 11. Tighten Final Review In Requesting-Code-Review

For plan-routed work, `requesting-code-review` must:

- load helper-reported execution state as it already does
- run `superpowers-plan-contract lint --spec ... --plan ...`
- fail closed if the approved artifacts are structurally or semantically invalid
- pass the approved plan path, execution evidence path, lint result, coverage matrix, and completed task-packet context into final review

Final review should explicitly flag:

- behavior present in the diff but not covered by any completed task packet
- touched files not listed in any completed task `Files:` block
- code-quality-clean changes that still violate plan or spec scope
- missing tests for `VERIFY-*` requirements

## 12. Keep Superpowers-Plan-Execution Focused But Align It

`superpowers-plan-execution` should stay focused on execution-state truth, not semantic requirement mapping.

Required interoperability changes:

- reuse the same canonical task-heading and `Files:` parsing assumptions as `superpowers-plan-contract`
- reject plans whose structure cannot be parsed under the canonical task contract
- surface enough task metadata for execution skills and final review to correlate completed steps with task packets

Important non-change:

- do not move semantic requirement mapping into `superpowers-plan-execution`

## 13. Fix Canonical Structural Contracts Immediately

This project should enforce these low-level contracts in the same change:

- `writing-plans` must use `## Task N:` not `### Task N:`
- generated docs, examples, fixtures, and tests must use the same task heading level
- duplicate step numbers inside a task must fail before engineering approval, not only later during execution parsing
- every task must contain a parseable `Files:` block
- every plan must be lint-clean before engineering approval

## Error And Rescue Map

The new contract introduces a small number of critical codepaths. Each one must fail visibly and predictably.

```text
CODEPATH                                  | WHAT CAN GO WRONG                          | FAILURE CLASS
------------------------------------------|--------------------------------------------|-----------------------------
superpowers-plan-contract lint            | spec has no Requirement Index              | MissingRequirementIndex
superpowers-plan-contract lint            | Requirement Index is malformed             | MalformedRequirementIndex
superpowers-plan-contract lint            | plan references unknown ID                 | UnknownRequirementId
superpowers-plan-contract lint            | requirement has no task coverage           | MissingRequirementCoverage
superpowers-plan-contract lint            | task uses ambiguous language               | AmbiguousTaskWording
superpowers-plan-contract lint            | task weakens or widens requirement         | RequirementWeakeningDetected
superpowers-plan-contract build-task-packet | requested task does not exist            | TaskNotFound
superpowers-plan-contract build-task-packet | source spec cannot be loaded             | SourceSpecUnavailable
superpowers-plan-contract build-task-packet | plan structure cannot build packet       | TaskPacketBuildFailed
task-packet persistence/load              | stored packet fingerprint or revision stale| TaskPacketStale
writing-plans pre-handoff self-check      | lint exits invalid                         | PlanContractInvalid
plan-eng-review approval gate             | helper cannot validate exact plan contract | PlanContractInvalid
executing-plans pre-task packet build     | packet cannot be built for selected task   | PlanContractInvalid
subagent packet dispatch                  | packet lacks answer to real ambiguity      | PlanContractInvalid
requesting-code-review preflight          | approved artifacts no longer lint clean    | PlanContractInvalid
```

```text
FAILURE CLASS               | RESCUED? | RESCUE ACTION                                      | USER OR REVIEWER SEES
----------------------------|----------|----------------------------------------------------|-----------------------------------------------
MissingRequirementIndex     | N        | keep spec/plan flow blocked                        | explicit lint failure; planning cannot proceed
MalformedRequirementIndex   | N        | keep spec/plan flow blocked                        | explicit lint failure naming malformed index
UnknownRequirementId        | N        | keep plan in Draft                                 | explicit lint failure naming unknown IDs
MissingRequirementCoverage  | N        | keep plan in Draft                                 | explicit coverage failure
AmbiguousTaskWording        | N        | keep plan in Draft; send back to review            | explicit ambiguity failure
RequirementWeakeningDetected| N        | keep plan in Draft; send back to review            | explicit weakening failure
TaskNotFound                | N        | stop execution for that task                       | explicit packet-build failure
SourceSpecUnavailable       | N        | stop execution or review; route back to review     | explicit missing-source failure
TaskPacketBuildFailed       | N        | stop execution or review; fix artifact structure   | explicit packet-build failure
TaskPacketStale             | Y        | regenerate packet from current approved artifacts  | transparent regeneration or explicit stale notice
PlanContractInvalid         | N        | fail closed to earlier safe stage                  | explicit message; no controller fallback summary
```

Rules:

- no codepath may silently fall back to controller-authored semantic context
- stale packet regeneration is the only automatic rescue in v1
- when a rescue occurs, the regenerated packet must still be derived from current approved markdown, never from cached narration
- helper invocation failures must be surfaced as explicit review or execution blockers, not swallowed and retried indefinitely

## Security And Threat Model

This project does not introduce a network service, but it does expand the local trusted-computation surface. The security model must be explicit.

```text
THREAT                                      | LIKELIHOOD | IMPACT | MITIGATION
--------------------------------------------|------------|--------|---------------------------------------------------------------
malicious markdown attempts prompt injection| medium     | high   | treat spec/plan text as data; helpers extract exact fields only
repo-relative path traversal in packet data | medium     | high   | normalize and reject absolute paths, `..`, and malformed suffixes
stale or tampered persisted packet reuse    | medium     | high   | fingerprint + revision checks; regenerate on mismatch
packet persistence leaks sensitive local info| low       | medium | persist only approved-artifact-derived contract data; bounded retention
controller reintroduces unsafe freeform context | high    | medium | skill contracts forbid semantic fallback outside packet
Windows/Bash contract skew weakens enforcement | medium   | high   | parity tests for both helper surfaces before release
```

Security rules:

- packet builders must accept only normalized repo-relative artifact paths
- helper output must never be evaluated as shell code
- packet contents are data for execution and review prompts, not executable instructions to the runtime itself
- packet persistence must not capture arbitrary session history, secrets, or local environment state
- file-scope entries must be treated as declarative scope only; they do not authorize shell execution
- helper wrappers on both Bash and PowerShell must enforce the same validation and failure behavior

Prompt-injection-specific rule:

- Requirement statements, task text, and plan constraints may contain arbitrary prose. The helper and skills must treat that prose as authoritative contract text to be quoted and compared, not as trusted procedural instructions for the helper process itself.

Auditability rule:

- task-packet lineage must be reconstructable from plan path, plan revision, source spec path, source spec revision, and fingerprints so reviewers can prove which approved artifact pair produced the packet.

## Data Flow And Interaction Edge Cases

### Data Flow: Review Against Completed Task Packets

```text
completed tasks + approved plan + source spec
    |
    v
load lint result + task packets + execution evidence
    |
    +--> missing packet? -----------------> fail closed into review blocker
    |
    +--> stale packet? -------------------> regenerate before review
    |
    +--> missing evidence? ---------------> fail closed into execution
    |
    v
compare diff against covered requirements + file scope
    |
    +--> extra behavior? -----------------> PLAN_DEVIATION_FOUND
    |
    +--> missing verification? -----------> SPEC_GAPS_FOUND
    |
    v
emit final review result
```

### Interaction Edge Cases

```text
INTERACTION                              | EDGE CASE                                 | HANDLED? | HOW
-----------------------------------------|-------------------------------------------|----------|------------------------------------------------------
plan authoring                           | spec lacks Requirement Index              | yes      | planning blocked before plan handoff
engineering review                       | reviewer sees stale plan after spec rev   | yes      | stale linkage fails closed; plan must be revised
task execution                           | task packet missing for selected task     | yes      | execution stops before work begins
task execution                           | implementer encounters ambiguity          | yes      | packet-backed answer or escalation back to review
same-session execution                   | plan changed mid-session                  | yes      | packet regeneration and stale-state rejection
subagent execution                       | controller tries to add extra scope       | yes      | packet contract forbids semantic expansion
final review                             | diff touches undeclared file              | yes      | explicit out-of-scope finding
final review                             | completed task lacks VERIFY coverage      | yes      | review flags missing verification
```

This feature has no end-user browser UX, so its interaction surface is reviewer, planner, and implementer workflow behavior. The edge cases above are the ones that matter.

## Failure And Edge-Case Behavior

The new contract must fail closed in all of the following situations:

- missing or malformed Requirement Index
- unknown requirement IDs in the plan
- uncovered requirements in the coverage matrix
- unresolved open questions in an engineering-approval candidate
- packet build attempted against an invalid plan
- task packet stale because plan revision or source-spec revision changed
- implementer ambiguity not answered by the task packet
- review context built from a task whose file scope cannot be parsed

The system must choose the earlier safe stage rather than allowing ambiguous execution.

## Failure Modes Registry

```text
CODEPATH                           | FAILURE MODE                                | RESCUED? | TEST? | USER SEES?            | LOGGED?
-----------------------------------|---------------------------------------------|----------|-------|-----------------------|--------
plan-contract lint                 | requirement uncovered                        | N        | Y     | explicit lint failure | Y
plan-contract lint                 | ambiguous wording detected                   | N        | Y     | explicit lint failure | Y
plan-contract lint                 | weakening detected                           | N        | Y     | explicit lint failure | Y
build-task-packet                  | task missing                                 | N        | Y     | explicit build failure| Y
build-task-packet                  | source spec unavailable                      | N        | Y     | explicit build failure| Y
load persisted packet              | revision or fingerprint mismatch             | Y        | Y     | stale/regenerated     | Y
executing-plans pre-task contract  | packet cannot be built                       | N        | Y     | execution blocked     | Y
subagent dispatch                  | packet does not resolve real ambiguity       | N        | Y     | escalation required   | Y
final review preflight             | approved artifacts no longer lint clean      | N        | Y     | review blocked        | Y
```

There must be no row in this registry where `RESCUED=N`, `TEST=N`, and `USER SEES=Silent`.

## Observability Expectations

The new helper must provide machine-readable diagnostics suitable for workflow skills and tests.

Minimum lint JSON shape:

```json
{
  "status": "ok | invalid",
  "errors": [
    {
      "code": "MissingRequirementCoverage",
      "message": "REQ-003 is not covered by any task"
    }
  ],
  "warnings": [],
  "spec_requirement_count": 12,
  "plan_task_count": 5,
  "coverage": {
    "REQ-001": [1],
    "REQ-002": [2]
  }
}
```

Observability expectations:

- error classes remain stable enough for regression tests
- packet fingerprints allow stale-packet detection
- review-stage tooling can correlate packet outputs with completed tasks and evidence
- helper output is explicit enough that skills can explain failure without inventing their own diagnosis
- helper stderr or summary output must name the blocking artifact path and failure class when a workflow gate stops

## Performance Expectations

This feature is not throughput-heavy, but it does add repeated parsing over repo artifacts. The performance posture should stay simple and bounded.

- lint and packet generation operate over one approved spec and one approved plan at a time
- helper behavior must remain linear in artifact size for normal repository-scale specs and plans
- persisted packets are a latency optimization for workflow-owned review and execution flows, not a correctness dependency
- bounded retention prevents unbounded local-state growth
- no network calls are required for linting or packet generation

What breaks first under scale:

- very large specs or plans make repeated parsing slower
- excessive persisted packets without retention create local-state noise
- wrapper-parity drift creates operational overhead, not throughput saturation

The mitigation is to keep the helper scope narrow, parser contracts explicit, and retention bounded.

## Rollout And Rollback

### Rollout

This project uses immediate enforcement for new and revised planning and review flows.

That means:

- any newly written or materially revised execution-bound spec must include a valid Requirement Index
- any newly written or materially revised plan must satisfy the full contract before engineering approval
- plan-routed execution and review must use canonical task packets once the helper ships

Legacy approved specs and plans remain historical artifacts. They do not need proactive backfill. If they are revised or re-enter strict execution under the new model, they must first be normalized through the updated planning and review flow.

This feature should land as one coordinated helper, skill, prompt, doc, and test change. Partial rollout that updates prompts without the helper, or helper behavior without the corresponding skill guidance, is out of policy because it would create conflicting sources of truth.

Deployment sequence:

```text
1. ship helper + wrapper + tests
2. ship skill and prompt updates that call the helper
3. ship fixture and doc updates that enforce canonical task structure
4. verify new planning/review flows fail closed on invalid contracts
5. allow new and revised work to use the stricter path
```

### Rollback

Rollback is straightforward because authority remains in markdown artifacts:

- revert the helper and workflow-skill changes
- stop calling the helper from planning, review, and execution skills
- preserve existing specs, plans, and evidence as normal repo history

No hidden local authority should need migration or repair during rollback.

Rollback flow:

```text
bad release detected
    |
    v
revert helper + skill integration change
    |
    +--> packet files remain local derived artifacts only
    |
    v
workflow returns to prior markdown-authoritative behavior
    |
    v
legacy specs/plans/evidence remain valid repo history
```

## Risks And Mitigations

### Risk: the helper becomes a shadow authority

Mitigation:

- keep prose spec and approved plan markdown authoritative
- keep helper outputs derived and disposable
- require exact reproduction of source statements inside packets rather than helper-generated paraphrases

### Risk: the contract becomes too rigid for normal authoring

Mitigation:

- keep the structured surfaces narrow and purpose-built
- validate only what must be exact for execution safety
- allow flexible prose everywhere else in the spec and plan

### Risk: false positives from ambiguity or weakening detection block good plans

Mitigation:

- use conservative first-pass linting
- require human review to adjudicate flagged edge cases
- fail closed into review rather than silently accept uncertainty

### Risk: packet generation creates stale cached context

Mitigation:

- include plan and spec revisions plus fingerprints in packets
- regenerate packets when approval artifacts change
- treat revision mismatch as invalid packet state

### Risk: inconsistent structural contracts across docs, examples, and runtime parsers

Mitigation:

- enforce canonical task syntax in tests
- update all fixtures and generated docs in the same change
- make engineering approval depend on lint-clean structure

### Risk: default packet persistence creates local-state clutter or reviewer confusion

Mitigation:

- persist by default only for workflow-owned execution and review flows
- keep ad hoc manual helper usage ephemeral unless the caller opts in
- bound retention and require stale detection on reuse

## Testing Strategy

Add regression coverage for helper behavior, workflow integration, and bad-fixture cases.

### Contract helper tests

- parse valid Requirement Index
- reject malformed Requirement Index
- reject uncovered requirements
- reject unknown IDs in task coverage
- reject task with `Open Questions` not equal to `none`
- reject `### Task N` headings
- reject malformed or missing `Files:` blocks
- reject banned ambiguity phrases
- flag `must` to `should` downgrade
- build packet with exact requirement statements preserved verbatim

### Workflow integration tests

- `writing-plans` requires the new sections and canonical task heading
- `plan-eng-review` approval path fails when lint fails
- `subagent-driven-development` dispatches packets, not freeform context
- spec-reviewer prompt includes exact task packet
- final review path consumes lint and task-packet data for plan-routed work
- workflow-enhancement and runtime-instruction suites pin the revised review-prompt, skill-doc, and runtime-doc wording
- workflow-owned flows persist packets by default while manual helper calls remain ephemeral by default

### Fixture tests

- missing Requirement Index
- missing Requirement Coverage Matrix
- ambiguous task wording
- unresolved open questions
- file-scope drift
- extra behavior in implementation review
- stale packet after plan revision increment

## Recommended File-Level Implementation Surface

### New files

- `bin/superpowers-plan-contract`
- `bin/superpowers-plan-structure-common`
- `bin/superpowers-plan-contract.ps1`
- `tests/codex-runtime/test-superpowers-plan-contract.sh`
- helper fixtures for valid and invalid spec and plan pairs

### Files to modify

- `skills/writing-plans/SKILL.md`
- `skills/plan-eng-review/SKILL.md`
- `skills/executing-plans/SKILL.md`
- `skills/subagent-driven-development/SKILL.md`
- `skills/subagent-driven-development/implementer-prompt.md`
- `skills/subagent-driven-development/spec-reviewer-prompt.md`
- `skills/subagent-driven-development/code-quality-reviewer-prompt.md`
- `skills/requesting-code-review/SKILL.md`
- `skills/requesting-code-review/code-reviewer.md`
- `bin/superpowers-plan-execution`
- `README.md`
- `docs/README.codex.md`
- `docs/README.copilot.md`
- `docs/testing.md`
- `RELEASE-NOTES.md`
- `tests/codex-runtime/test-superpowers-plan-execution.sh`
- `tests/codex-runtime/test-workflow-sequencing.sh`
- `tests/codex-runtime/test-workflow-enhancements.sh`
- `tests/codex-runtime/test-runtime-instructions.sh`
- `tests/codex-runtime/test-powershell-wrapper-bash-resolution.sh`
- `tests/codex-runtime/fixtures/workflow-artifacts/README.md`
- doc-generation or fixture tests that validate task heading structure

## Dream State Delta

```text
CURRENT STATE
- markdown is authoritative for workflow state and execution structure
- semantic task fidelity still depends on controller narration and qualitative review

THIS SPEC
- adds derived semantic compilation from approved markdown into lint results and task packets
- keeps helpers strict and non-authoritative
- removes controller-written summary context from the critical execution and review path

12-MONTH IDEAL
- approved specs and plans compile cleanly into deterministic execution and review contracts
- reviewers can prove whether code is in or out of scope without reconstructing chat context
- helper-backed workflow enforcement stays simple, local, and fail closed
```

## Long-Term Trajectory

- This design is reversible because authority remains in markdown and helper outputs are disposable.
- It reduces knowledge concentration by making spec-to-task intent explicit in repo artifacts instead of buried in coordinator judgment.
- It creates a cleaner foundation for future read-only inspection surfaces without requiring them now.
- It does not try to become a general semantic reasoning engine; the long-term path stays narrow and operational.

## Acceptance Criteria

This project is complete when all of the following are true:

1. A spec cannot enter planning without a parseable Requirement Index.
2. A plan cannot become `Engineering Approved` unless every requirement ID is covered by one or more tasks.
3. A task cannot become execution input unless a task packet can be built from it.
4. Implementers receive exact task packets, not controller-written context summaries.
5. Task review can explicitly report plan deviation.
6. Final review can detect behavior or file changes that were not authorized by the approved plan.
7. The repo has regression coverage for the full contract.
8. Docs, examples, fixtures, prompts, and tests agree on canonical task syntax.

## Requirement Index

- [REQ-001][behavior] Execution-bound specs must include a parseable `Requirement Index` that maps stable IDs to exact normative statements from the authoritative prose spec.
- [REQ-002][behavior] Implementation plans must include a parseable `Requirement Coverage Matrix` mapping every indexed requirement ID to one or more tasks.
- [REQ-003][behavior] Every plan task must use canonical `## Task N:` headings and include `Spec Coverage`, `Task Outcome`, `Plan Constraints`, `Open Questions`, and a parseable `Files:` block.
- [REQ-004][behavior] Superpowers must provide a derived `superpowers-plan-contract` helper that lints spec and plan traceability and builds canonical task packets.
- [REQ-005][behavior] The helper must fail closed on missing coverage, malformed structure, ambiguous wording, and requirement weakening or widening.
- [REQ-006][behavior] Execution modes must build and consume canonical task packets instead of relying on controller-written task context.
- [REQ-007][behavior] Task reviewers must compare implementation against the exact task packet, including covered requirements, constraints, decisions, and non-goals.
- [REQ-008][behavior] Final review for plan-routed work must use plan-contract lint data and completed task-packet context to detect out-of-scope behavior and file drift.
- [REQ-009][constraint] Approved spec markdown, approved plan markdown, and execution evidence markdown remain the only authoritative workflow artifacts for this contract.
- [REQ-010][constraint] The public workflow inspection CLI must remain read-only and non-authoritative.
- [REQ-011][constraint] `superpowers-plan-execution` must remain focused on execution-state truth and must not become the owner of semantic requirement mapping.
- [REQ-012][constraint] New and materially revised planning and review flows must enforce this contract immediately rather than through a soft warning phase.
- [REQ-013][decision] Legacy approved specs and plans remain historical artifacts unless they are revised or re-enter strict execution under the new contract.
- [REQ-014][decision] Canonical task packets are derived artifacts that compile authoritative markdown into deterministic execution and review inputs.
- [NONGOAL-001][non-goal] Do not replace markdown authority with hidden local state, database-backed workflow state, or new authoritative artifact classes.
- [NONGOAL-002][non-goal] Do not auto-resolve ambiguous design questions during planning or execution.
- [NONGOAL-003][non-goal] Do not turn semantic review into full theorem proving.
- [VERIFY-001][verification] Regression coverage must validate helper parsing, lint failures, packet generation, workflow integration, and canonical task-structure enforcement.
