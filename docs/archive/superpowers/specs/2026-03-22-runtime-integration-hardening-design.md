# Runtime Integration Hardening

**Workflow State:** CEO Approved
**Spec Revision:** 1
**Last Reviewed By:** plan-ceo-review

## Summary

Harden Superpowers so the newer runtime-backed contracts are authoritative end to end instead of being enforced only in deeper helpers or newer skills.

Superpowers already has the right building blocks:

- session entry
- workflow routing
- repo safety
- plan-contract validation
- task-packet generation
- execution-state tracking
- QA and release-readiness workflow expectations

The remaining gap is integration. Route-time workflow resolution, public inspection surfaces, engineering approval, execution-state provenance, and late-stage review and finish gates do not yet share one exact contract. That allows the system to report a workflow as ready even when deeper helpers would still reject it.

This project closes those seams without changing Superpowers' authority model, workflow philosophy, or read-only public CLI posture.

## Problem

### Primary correctness gap

`superpowers-workflow-status` can still resolve a workflow to `implementation_ready` using a thinner approved-plan contract than the plan-writing, plan-contract, and execution layers require.

That creates three concrete failures:

- route-time can bless a plan that execution-time would reject
- public workflow inspection can overstate readiness
- any manual fallback logic can make weaker decisions than helper-backed routing

### Secondary integration gaps

The repo now has strong plan-contract and task-packet machinery, but that machinery is not yet fully authoritative at:

- route-time readiness
- engineering approval law
- execution handoff
- execution-state provenance
- final review gating
- branch-finish gating
- supported public CLI inspection

### Late-stage enforcement gap

Skills already describe fail-closed review and finish behavior, but helper-owned gate commands do not yet fully own:

- execution preflight
- review readiness
- finish readiness

That means late-stage enforcement still depends too heavily on prose instructions instead of helper law.

## Why This Matters

Superpowers is strongest when repo-visible markdown remains authoritative and helpers derive strict, fail-closed behavior from that repo truth. The current seams weaken that model at the exact moment a plan is handed off into execution and later reviewed for completion. If `implementation_ready`, review readiness, and finish readiness do not mean the same thing everywhere, the system becomes easier to misread and harder to trust.

## Goals

- Unify `implementation_ready` semantics across workflow routing, public workflow inspection, engineering review handoff, and execution preflight.
- Make plan-contract analysis authoritative for implementation handoff.
- Strengthen execution evidence so review and finish gates can prove freshness and reopen correctness instead of mostly inferring it.
- Move preflight, review-readiness, and finish-readiness enforcement into explicit read-only helper commands.
- Expand the supported public CLI into the real read-only operator surface for phase inspection, diagnostics, handoff, preflight, review gate, and finish gate.

## Not In Scope

- Moving authority out of repo-visible markdown artifacts
- Replacing markdown artifacts with a database or service
- Removing the manifest or runtime state model
- Eliminating step-serial execution
- Making browser QA universal
- Making `document-release` the approval authority
- Adding a mutating public CLI
- Adding accelerator-packet history or retention inspection to the public workflow CLI in this project; that remains a separate deferred TODO until the accelerated-review surfaces need it
- Changing the purpose of the project

## Required Invariants

The following must remain true after implementation:

1. Repo-visible markdown remains the authority for approved specs and plans.
2. Local helper state remains derived and rebuildable.
3. `implementation_ready` remains a terminal routing state, not a skill.
4. Execution remains step-serial.
5. Browser QA remains conditional.
6. `document-release` remains required for workflow-routed implementation before branch completion.
7. The supported public CLI remains read-only.
8. Bash and PowerShell behavior remain aligned.

## Affected Surfaces

This project directly affects these runtime, skill, and docs surfaces:

- `bin/superpowers-workflow-status`
- `bin/superpowers-workflow-status.ps1`
- `bin/superpowers-plan-contract`
- `bin/superpowers-plan-contract.ps1`
- `bin/superpowers-plan-execution`
- `bin/superpowers-plan-execution.ps1`
- `bin/superpowers-workflow`
- `bin/superpowers-workflow.ps1`
- `bin/superpowers-plan-structure-common` or adjacent shared parsing code
- `skills/plan-eng-review/SKILL.md.tmpl` and generated `SKILL.md`
- `skills/executing-plans/SKILL.md.tmpl` and generated `SKILL.md`
- `skills/subagent-driven-development/SKILL.md.tmpl` and generated `SKILL.md`
- `skills/requesting-code-review/SKILL.md.tmpl` and generated `SKILL.md`
- `skills/finishing-a-development-branch/SKILL.md.tmpl` and generated `SKILL.md`
- `skills/qa-only/SKILL.md.tmpl` and generated `SKILL.md`
- `skills/document-release/SKILL.md.tmpl` and generated `SKILL.md`
- `skills/using-superpowers/SKILL.md.tmpl` and generated `SKILL.md`
- `commands/brainstorm.md`
- `commands/write-plan.md`
- `commands/execute-plan.md`
- `README.md`
- workflow and skill contract tests under `tests/codex-runtime/`

## Existing Capabilities To Reuse

This is an integration-hardening project, not a greenfield runtime.

- `superpowers-workflow-status` already owns workflow-state resolution, artifact expectations, and manifest sync.
- `superpowers-plan-contract` already parses approved specs and plans, lints requirement coverage, and builds task packets.
- `superpowers-plan-execution` already owns execution-state truth and execution recommendations.
- `superpowers-workflow` already exists as the supported read-only public wrapper.
- `superpowers-session-entry` already exists as a runtime-owned entry helper.
- `superpowers-repo-safety` already protects repo-writing workflow stages.
- `bin/superpowers-runtime-common.sh`, `bin/superpowers-plan-structure-common`, and the PowerShell parity helpers already centralize normalization and parsing primitives.
- The skill-template plus generated-doc pipeline already exists and should continue to be the source of skill-doc updates.

The design should therefore extend existing helpers and shared parsing instead of introducing duplicate authorities.

## Current-System Findings

### Strengths worth preserving

- Helper-backed workflow routing is already conservative by default.
- Approved markdown artifacts already function as the authoritative workflow contract.
- Plan-contract parsing and task-packet generation already exist and can become more authoritative instead of being replaced.
- Execution tracking already has a strong notion of structured progress and evidence.
- Repo safety and session-entry helpers already establish the pattern for runtime-owned gate law.

### Concrete seams to close

- route-time still accepts a thinner approved-plan contract than deeper helpers
- workflow inspection and execution helpers can disagree about readiness
- engineering approval does not yet fully depend on packet buildability
- execution evidence does not yet carry enough provenance to fail closed on stale or missed-reopen cases
- review and finish helper gates are incomplete
- public read-only CLI coverage stops short of the newer late-stage gates
- `using-superpowers` still carries more fallback responsibility than it should
- deprecated command docs still strand users instead of bridging them into the supported flow

### Audit findings that shape this review

- Branch history shows this repo has recently landed separate specs and implementations for workflow-status hardening, supported workflow CLI, session-entry bypass, and task fidelity; the recurring smell is not missing helpers, it is law split across helpers, wrappers, and skill prose.
- `TODOS.md` currently has one nearby open item for accelerated-review packet inspection. This spec should not absorb that TODO silently while expanding the public CLI.
- There are no repo-local instruction files such as `AGENTS.md` or Copilot instruction files in this repo tree that change the review posture.
- There are no active stashes, and the only current worktree changes are this draft spec and its paired draft plan.

## Dream State Delta

```text
CURRENT STATE
- route-time readiness is weaker than deeper helpers
- public CLI stops at early workflow inspection
- review/finish law is partly helper-owned and partly prose-owned
- execution evidence can be truthful yet still too weak to prove freshness

THIS SPEC
- unifies route-time, handoff, review, and finish semantics around one effective contract
- extends existing helpers instead of building a parallel state machine
- upgrades late-stage artifacts and evidence so freshness is machine-checkable
- expands the public read-only CLI into a true operator view over the full workflow

12-MONTH IDEAL
- every workflow stage is explainable through one read-only operator surface
- every helper consumes the same canonical contract data
- stale or ambiguous state always fails closed with actionable diagnostics
- new workflow features plug into shared contract, gate, and provenance surfaces instead of inventing bespoke law
```

The 12-month ideal is not "more helpers." It is fewer conflicting interpretations.

## Architecture Boundary

Authority remains in repo-visible markdown:

- approved specs own product and workflow intent
- approved plans own execution decomposition
- execution evidence and late-stage artifacts own auditable proof of work state

Helpers remain derived enforcers:

- they parse authoritative markdown
- they emit structured diagnostics and provenance
- they fail closed on malformed, stale, ambiguous, or incomplete state
- they do not become a second approval authority

The public workflow CLI remains read-only. This project strengthens inspection and gating semantics; it does not move authority or approval into a helper or wrapper.

## Architecture Overview

### Current seam

```text
approved spec
    |
    v
approved plan --------------------------+
    |                                   |
    v                                   v
workflow-status thin readiness     plan-contract / execution deeper checks
    |                                   |
    +--> implementation_ready           +--> may still reject the same plan
```

The problem is not missing capability. The problem is split authority over what "ready" means.

### Target contract

```text
approved spec -------------------------------+
    |                                        |
    v                                        v
shared plan contract / analyze-plan <--- approved plan
    |             |               |
    |             |               +--> plan-eng-review gate
    |             +--> workflow-status route-time gate
    | 
    +--> task packets ----> plan-execution ----> execution evidence v2
                                 |                      |
                                 |                      +--> gate-review
                                 |                      +--> gate-finish
                                 |
                                 +--> workflow CLI phase / doctor / handoff
```

Every consumer reads the same effective contract instead of maintaining its own weaker interpretation.

### Late-stage gate pipeline

```text
approved plan
    |
    v
plan-execution preflight
    |
    v
active execution state + packet provenance + evidence v2
    |
    v
gate-review
    |
    +--> blocks on stale evidence / missed reopen / unresolved work
    |
    v
QA artifact + release-readiness artifact freshness
    |
    v
gate-finish
    |
    +--> blocks branch completion when late-stage proof is stale or missing
```

### Public operator view

```text
session-entry
workflow-status
plan-contract
plan-execution gates
QA / release artifacts
manifest identity
        |
        v
superpowers-workflow phase / doctor / handoff / gate ...
```

The public CLI becomes the supported read-only operator view over the full workflow rather than a thin wrapper over early routing only.

### Workflow phase state machine

```text
needs_user_choice
      |
      v
needs_brainstorming -> spec_review -> plan_writing -> plan_review -> implementation_handoff
                                                                  |
                                                                  v
                                                         execution_preflight -> executing
                                                                                  |
                                                                                  v
                                                                            review_blocked
                                                                                  |
                                                                                  v
                                                                         qa_pending / document_release_pending
                                                                                  |
                                                                                  v
                                                                         ready_for_branch_completion

Invalid transitions:
- `needs_user_choice` -> any normal stage without session-entry resolution
- `plan_review` -> `implementation_handoff` without contract-valid approved plan
- `executing` -> `ready_for_branch_completion` without review, QA, and release gates
- any later stage -> earlier approved stage by silent helper disagreement
```

Invalid transitions must be prevented by helper-owned gates, not by user memory or skill narration.

## Proposed Design

### Workstream A: Route-Time Contract Hardening

Objective: make `superpowers-workflow-status` consume the same effective approved-plan contract as planning and execution.

Required behavior:

- A plan cannot resolve to execution-ready unless all of these headers parse and validate:
  - `Workflow State`
  - `Plan Revision`
  - `Execution Mode`
  - `Source Spec`
  - `Source Spec Revision`
  - `Last Reviewed By`
- Allowed values must match the rest of the workflow:
  - `Workflow State`: `Draft` or `Engineering Approved`
  - `Execution Mode`: `none`, `superpowers:executing-plans`, `superpowers:subagent-driven-development`
  - `Last Reviewed By`: `writing-plans`, `plan-eng-review`
- `implementation_ready` must be impossible unless:
  - the latest approved spec is resolved
  - the latest plan is uniquely resolved
  - plan headers validate
  - `Source Spec` matches the approved spec path
  - `Source Spec Revision` matches the approved spec revision
  - plan-contract analysis passes for execution-bound plans
- Backward routing must stay conservative:
  - invalid header or contract -> `plan_draft` with `next_skill=superpowers:plan-eng-review`
  - stale plan relative to approved spec -> `stale_plan` with `next_skill=superpowers:writing-plans`
  - ambiguous artifact resolution -> route backward and expose ambiguity in diagnostics
- JSON output must gain schema-versioned structured fields:
  - `schema_version`
  - `contract_state`
  - `reason_codes`
  - `diagnostics`
  - `scan_truncated`
  - `spec_candidate_count`
  - `plan_candidate_count`
- Compatibility requirement:
  - keep the legacy string `reason` for one release cycle
  - make new callers consume `reason_codes` and `diagnostics`

Preferred implementation shape:

- centralize approved-plan header parsing and canonical validation in shared code adjacent to existing plan-structure parsing
- let both `superpowers-workflow-status` and execution-bound helpers call that shared logic
- calling `superpowers-plan-contract analyze-plan --format json` is an acceptable fallback, but there must not be two authoritative interpretations of approved-plan validity

### Workstream B: Plan-Contract As Workflow Prerequisite

Objective: promote `superpowers-plan-contract` from a review helper into a first-class workflow prerequisite.

Required behavior:

- Add an authoritative JSON analysis surface:

```bash
superpowers-plan-contract analyze-plan \
  --spec <approved-spec-path> \
  --plan <plan-path> \
  --format json
```

- The analysis output must expose at least:
  - `contract_state`
  - `spec_path`
  - `spec_revision`
  - `spec_fingerprint`
  - `plan_path`
  - `plan_revision`
  - `plan_fingerprint`
  - `task_count`
  - `packet_buildable_tasks`
  - `coverage_complete`
  - `open_questions_resolved`
  - `task_structure_valid`
  - `files_blocks_valid`
  - `overlapping_write_scopes`
  - `reason_codes`
  - `diagnostics`
- Engineering approval law must tighten:
  - `plan-eng-review` cannot approve unless `contract_state == valid`
  - `plan-eng-review` cannot approve unless `packet_buildable_tasks == task_count`
- Execution handoff must block unless all task packets for the approved plan revision are buildable.
- Task-packet provenance must be standardized:
  - `plan_path`
  - `plan_revision`
  - `plan_fingerprint`
  - `source_spec_path`
  - `source_spec_revision`
  - `source_spec_fingerprint`
  - `task_number`
  - `task_title`
  - `packet_fingerprint`
  - `generated_at`

This workstream makes buildability and traceability part of readiness, not a later optional check.

### Workstream C: Execution-State Gate Expansion

Objective: turn `superpowers-plan-execution` into a strong late-stage gatekeeper in addition to being a tracker and mutator.

Required read-only commands:

```bash
superpowers-plan-execution preflight --plan <approved-plan-path>
superpowers-plan-execution gate-review --plan <approved-plan-path>
superpowers-plan-execution gate-finish --plan <approved-plan-path>
```

`preflight` must validate:

- approved plan parse success
- execution mode presence and validity
- evidence artifact parse success
- no blocked execution state
- no detached HEAD
- no merge, rebase, or cherry-pick in progress
- repo-safety applicability can be evaluated

Expected output shape:

```json
{
  "allowed": false,
  "failure_class": "workspace_not_safe",
  "reason_codes": ["detached_head"],
  "diagnostics": []
}
```

`gate-review` must fail closed when any of the following is true:

- an active step is still in progress
- blocked state exists
- interrupted or parked work remains unresolved
- a checked step lacks valid evidence
- packet provenance no longer matches the approved plan or spec
- stale evidence is detected
- a reopen should have occurred but did not

`gate-finish` must include all `gate-review` checks and also fail closed when:

- a required QA artifact is missing
- a QA artifact is stale
- a release-readiness artifact is missing
- a release-readiness artifact is stale
- the current branch or head SHA no longer matches the validated late-stage artifacts

Execution evidence v2 must add explicit provenance:

- `Plan Path`
- `Plan Revision`
- `Plan Fingerprint`
- `Source Spec Path`
- `Source Spec Revision`
- `Source Spec Fingerprint`
- `Task Number`
- `Step Number`
- `Packet Fingerprint`
- `Head SHA`
- `Base SHA` when known
- `Files Proven`
- per-file digests or a deterministic aggregate digest
- `Verification Summary`
- `Invalidation Reason` when reopened

Packet identity binding rules:

- `begin` records packet fingerprint
- `transfer` preserves task and packet provenance
- `complete` requires matching packet fingerprint unless an explicit reopen and rebuild occurred
- `status` exposes packet provenance

Compatibility rules:

- legacy evidence remains readable for one release cycle
- new mutations rewrite to v2
- `status`, `gate-review`, and `gate-finish` emit `legacy_evidence_format` warnings when legacy state is encountered

### Workstream D: Structured QA And Release Artifacts

Objective: formalize QA and release-readiness as structured late-stage artifacts that helpers and public CLI surfaces can inspect.

Required artifact upgrades:

- `plan-eng-review` test-plan artifact must include required metadata:

```md
# Test Plan
**Source Plan:** `docs/superpowers/plans/...`
**Source Plan Revision:** 3
**Branch:** feature/foo
**Repo:** superpowers
**Browser QA Required:** yes
**Generated By:** superpowers:plan-eng-review
**Generated At:** 2026-03-22T14:30:00Z
```

- `qa-only` must write a structured QA result artifact:

```md
# QA Result
**Source Plan:** `docs/superpowers/plans/...`
**Source Plan Revision:** 3
**Source Test Plan:** `~/.superpowers/projects/.../test-plan.md`
**Branch:** feature/foo
**Repo:** superpowers
**Head SHA:** abc1234
**Result:** pass
**Generated By:** superpowers:qa-only
**Generated At:** 2026-03-22T15:05:00Z
```

Allowed `Result` values:

- `pass`
- `fail`
- `blocked`

- `document-release` must write a structured release-readiness artifact:

```md
# Release Readiness Result
**Source Plan:** `docs/superpowers/plans/...`
**Source Plan Revision:** 3
**Branch:** feature/foo
**Repo:** superpowers
**Base Branch:** main
**Head SHA:** abc1234
**Result:** pass
**Generated By:** superpowers:document-release
**Generated At:** 2026-03-22T15:20:00Z
```

Allowed `Result` values:

- `pass`
- `needs-user-input`
- `blocked`

Freshness rules:

- `Source Plan` must match the current approved plan
- `Source Plan Revision` must match the current approved revision
- `Branch` must match the current branch
- `Head SHA` must match the current head unless a helper-owned narrow doc-only exception explicitly applies
- artifact parsing must succeed

If freshness fails, `gate-finish` must block.

### Workstream E: Public CLI Expansion

Objective: turn `superpowers-workflow` into the supported read-only operator view across the full workflow.

Required commands:

```bash
superpowers-workflow phase
superpowers-workflow doctor
superpowers-workflow handoff
superpowers-workflow preflight --plan <approved-plan-path>
superpowers-workflow gate review --plan <approved-plan-path>
superpowers-workflow gate finish --plan <approved-plan-path>
```

`phase` must return one of:

- `needs_user_choice`
- `needs_brainstorming`
- `spec_review`
- `plan_writing`
- `plan_review`
- `implementation_handoff`
- `execution_preflight`
- `executing`
- `review_blocked`
- `qa_pending`
- `document_release_pending`
- `ready_for_branch_completion`

`phase` must compose:

- session-entry state
- workflow-status state
- plan-contract state
- execution-state gates
- QA and release artifact freshness

`doctor` must aggregate:

- workflow resolution details
- route-time contract details
- plan-contract analysis summary
- execution-state summary
- late-stage artifact state
- bounded-scan information
- manifest identity and debug details

`handoff` must return:

- approved spec path
- approved plan path
- route status
- contract validity
- recommended execution skill
- recommendation rationale
- whether execution for the plan revision has already started

Output behavior:

- public CLI remains read-only
- every new surface must support human-readable output by default
- every new surface must support JSON for automation

### Workstream F: Session-Entry Gate And Manual Fallback Reduction In `using-superpowers`

Objective: make the runtime-owned session-entry step explicit at the top of `using-superpowers` and shrink the remaining fallback to the smallest conservative surface.

Required behavior:

- Supported entry paths must start by resolving:

```bash
superpowers-session-entry resolve --message-file <path>
```

- Branching on the result is strict:
  - `needs_user_choice` -> ask only the bypass question and stop
  - `enabled` -> continue into the normal Superpowers stack
  - `bypassed` -> bypass the rest of `using-superpowers` unless the user explicitly re-enters
  - `runtime_failure` -> surface the failure and stop
- No `_SESSIONS` computation, artifact inspection, workflow inspection, or normal-stack behavior may happen before session-entry resolves to `enabled`.
- If helpers are available, trust helper output.
- If helpers are unavailable, fallback stays minimal and conservative:
  - no relevant spec artifact -> brainstorming
  - draft or malformed spec -> CEO review
  - no plan -> writing-plans
  - malformed, incomplete, or stale plan -> writing-plans or plan-eng-review
  - only fully valid approved artifacts -> implementation handoff
- Manual fallback must not infer readiness from the legacy thin header subset.

### Workstream G: Deprecated Command Compatibility Shims

Objective: replace dead-end deprecation stubs with temporary compatibility shims for one release cycle.

Required behavior:

- `commands/brainstorm.md`
  - explain current phase
  - route users to brainstorming when appropriate
- `commands/write-plan.md`
  - explain current phase
  - route users to plan writing only when appropriate
- `commands/execute-plan.md`
  - behave like a public handoff surface
  - point to the exact approved plan and recommended execution path

After one release cycle:

- either keep these as thin aliases
- or remove them entirely

Do not keep dead-end deprecation-only command docs.

## Error And Rescue Registry

This spec introduces new or tightened failure surfaces. None may fail silently.

```text
CODEPATH / COMMAND                      | WHAT CAN GO WRONG                          | FAILURE CLASS                     | RESCUED? | RESCUE ACTION / USER IMPACT
---------------------------------------|--------------------------------------------|-----------------------------------|----------|----------------------------------------------
workflow-status route resolution       | plan header missing / malformed             | MalformedApprovedPlan             | Y        | route to `plan_draft`, emit structured diagnostics
workflow-status route resolution       | spec/plan resolution ambiguous              | AmbiguousArtifactResolution       | Y        | route backward conservatively, emit candidate counts
workflow-status route resolution       | approved plan stale vs approved spec        | StaleApprovedPlan                 | Y        | route to `stale_plan`, surface remediation
plan-contract analyze-plan             | contract parse fails                        | InvalidPlanContract               | Y        | return `contract_state=invalid` with reason codes
plan-contract analyze-plan             | packets not buildable for all tasks         | PacketBuildabilityFailure         | Y        | block approval / handoff with diagnostics
plan-execution preflight               | detached head / merge / rebase / cherry-pick| WorkspaceNotSafe                  | Y        | return `allowed=false`, name exact blocker
plan-execution gate-review             | stale evidence / packet mismatch            | StaleExecutionEvidence            | Y        | block review, require reopen or rebuild
plan-execution gate-review             | completion should have reopened but did not | MissedReopenRequired              | Y        | block review, require explicit reopen
plan-execution gate-finish             | QA artifact missing or stale                | QaArtifactNotFresh                | Y        | block finish, point to QA handoff
plan-execution gate-finish             | release artifact missing or stale           | ReleaseArtifactNotFresh           | Y        | block finish, point to `document-release`
workflow public CLI                    | helper returns diagnostics or failure       | WrappedHelperFailure              | Y        | render human-readable explanation and JSON details
using-superpowers session-entry gate   | session-entry unresolved or runtime failure | SessionEntryUnresolved            | Y        | ask only bypass question or surface runtime failure
```

Rescue policy:

- "rescued" here means fail-closed with explicit diagnostics, not "swallowed"
- every gate failure must identify the blocking artifact or workspace condition
- every helper failure exposed through the public CLI must preserve the underlying failure class

## Failure Modes Registry

```text
CODEPATH                              | FAILURE MODE                               | RESCUED? | TEST? | USER SEES?                         | LOGGED?
--------------------------------------|---------------------------------------------|----------|-------|------------------------------------|--------
workflow-status                       | missing `Plan Revision`                     | Y        | Y     | `plan_draft` + diagnostic          | Y
workflow-status                       | invalid `Execution Mode`                    | Y        | Y     | `plan_draft` + diagnostic          | Y
workflow-status                       | ambiguous spec/plan candidate set           | Y        | Y     | conservative fallback explanation  | Y
plan-contract analyze-plan            | malformed task structure                    | Y        | Y     | `contract_state=invalid`           | Y
plan-contract analyze-plan            | packet buildability incomplete              | Y        | Y     | approval / handoff blocked         | Y
plan-execution preflight              | detached HEAD                               | Y        | Y     | `allowed=false`                    | Y
plan-execution gate-review            | stale evidence after code drift             | Y        | Y     | review blocked                     | Y
plan-execution gate-review            | missed reopen after post-completion edits   | Y        | Y     | review blocked                     | Y
plan-execution gate-finish            | missing QA artifact when required           | Y        | Y     | finish blocked                     | Y
plan-execution gate-finish            | stale release-readiness artifact            | Y        | Y     | finish blocked                     | Y
workflow CLI                          | wrapper/helper schema mismatch              | Y        | Y     | human explanation + debug details  | Y
using-superpowers fallback            | helper unavailable during entry routing     | Y        | Y     | conservative earlier-stage route   | Y
```

This design intentionally avoids any `RESCUED=N / TEST=N / USER SEES=Silent` rows. Silent disagreement between helpers is the core defect being removed.

## Security And Threat Model

This project is mostly internal workflow infrastructure, but it still widens the inspection and artifact-interpretation surface.

```text
THREAT                                   | LIKELIHOOD | IMPACT | MITIGATION
-----------------------------------------|------------|--------|------------------------------------------------------------
Path traversal or unsafe repo path input | M          | H      | keep repo-relative path normalization in shared helpers and reject invalid paths loudly
False-positive readiness from malformed state | M      | H      | unify contract parsing, fail closed, and surface exact diagnostics instead of guessing
Public CLI accidentally mutates local state | L        | H      | keep wrapper read-only and route through side-effect-free helper paths only
Manifest or artifact mismatch across branches/checkouts | M | M | preserve manifest identity diagnostics, branch checks, and repo-root mismatch handling
Stale or forged local evidence accepted as current | M   | H      | require plan/spec fingerprints, packet identity, head SHA, and freshness checks
Wrapper/platform drift weakens one runtime surface | M   | H      | require Bash/PowerShell parity tests for every new command and schema
Over-broad accelerator-packet inspection sneaks into CLI scope | L | M | keep accelerator packet inspection explicitly out of scope in this project
```

Security posture for this design:

- all new public surfaces remain read-only
- authorization does not broaden because the helpers only inspect local repo and derived local state
- the highest-risk class is silent trust in malformed or stale local state, so the primary mitigation is stronger provenance and fail-closed gating

## Data Flow And Interaction Edge Cases

### Data-flow shadow paths

```text
approved spec + approved plan
        |
        v
analyze-plan ------------------> task packets -----------------> execution state
    |                                |                               |
    |                                |                               +--> gate-review / gate-finish
    |                                |
    +--> workflow-status / workflow CLI

Shadow paths:
- missing spec / missing plan -> conservative earlier stage
- malformed headers / malformed tasks -> invalid contract, not ready
- ambiguous candidates -> bounded diagnostic output, not guesswork
- stale packet / stale evidence / stale QA artifact -> fail-closed gate
- wrapper-readable failure -> human explanation plus JSON/debug path
```

### Interaction edge cases

```text
INTERACTION                           | EDGE CASE                                 | HANDLED? | HOW?
--------------------------------------|-------------------------------------------|----------|--------------------------------------------------------------
`superpowers-workflow phase`          | helper returns ambiguity                  | Y        | show earlier safe phase with structured why
`superpowers-workflow handoff`        | approved plan exists but packets not buildable | Y   | block handoff and surface contract diagnostics
`superpowers-plan-execution preflight`| user starts from detached HEAD            | Y        | return `allowed=false` with workspace blocker
`gate-review`                         | files changed after completion            | Y        | detect stale evidence / missed reopen and block
`gate-finish`                         | QA required but only stale QA artifact exists | Y   | block finish on freshness failure
`using-superpowers` entry            | helper unavailable or unresolved state     | Y        | ask only bypass question or route conservatively
compatibility shim commands           | user invokes old entrypoint mid-workflow  | Y        | route to current supported phase instead of dead-ending
```

### Four-path rule for new flows

Every new helper surface in this project must explicitly define:

- happy path
- missing-input path
- malformed-input path
- stale-state path

If any one of those is unspecified, the implementation is underdesigned.

## Performance And Scaling Characteristics

- `workflow-status` and `workflow` must keep bounded scanning visible and deterministic; expanding diagnostics must not turn discovery into an unbounded repo crawl.
- The public wrapper should compose helper output rather than reparsing repo state repeatedly; duplicated parsing in both wrapper and helper is a maintenance and latency smell.
- `analyze-plan` and packet buildability checks should parse once and reuse normalized structures for coverage, packet counts, and diagnostics instead of re-walking the plan separately for each answer.
- Evidence freshness and artifact freshness checks must avoid quadratic file hashing behavior across repeated gate calls; deterministic aggregate digests are acceptable when they preserve freshness guarantees.
- At 10x workflow artifact volume, the first likely failure is ambiguous candidate resolution or repeated parsing cost, not storage volume. The mitigation is bounded scans, candidate counts, and shared parsed structures.
- At 100x volume, the wrapper must still stay read-only and explain truncation rather than silently hiding candidates or timing out into guesswork.

## Failure And Edge-Case Behavior

- Ambiguous spec or plan resolution must never produce a false-positive ready state. Route backward and surface structured ambiguity diagnostics.
- A plan with missing `Plan Revision`, missing `Execution Mode`, or malformed canonical task structure must never reach `implementation_ready`.
- If the approved spec changes after an approved plan exists, route to `stale_plan` until the plan is updated.
- If helper-backed routing is unavailable inside `using-superpowers`, fallback must remain conservative and must not act like a second weaker state machine.
- Detached HEAD, active merge state, active rebase state, or active cherry-pick state must fail `preflight`.
- If execution evidence no longer matches the approved plan revision, approved spec revision, packet fingerprint, or current proven files, review and finish gates must fail closed.
- If implementation changed after a completed step and no reopen occurred, `gate-review` must detect the missed reopen and block review.
- If browser QA is required and the QA result is missing or stale, `gate-finish` must block.
- If release-readiness output is missing or stale, `gate-finish` must block.
- Legacy evidence and legacy diagnostic shapes may remain readable for one release cycle, but every consumer must expose a warning when legacy compatibility paths are being used.
- Bash and PowerShell may not drift on command surface, output schema, or fail-closed semantics; parity failures must be test-detectable before release.

## Observability Expectations

- Route-time, plan-contract, preflight, review gate, and finish gate failures must emit stable `reason_codes` and structured `diagnostics`.
- Diagnostics should identify:
  - failure code
  - severity
  - affected artifact
  - human-readable message
  - remediation guidance when a deterministic next action exists
- Route-time output must surface bounded-scan truncation and artifact candidate counts.
- Execution-state inspection must surface packet provenance and legacy-format warnings.
- Public CLI `doctor` must aggregate helper diagnostics without becoming a second source of truth.
- Manifest identity and recovery details should be inspectable in `doctor` or equivalent debug output so operators can distinguish stale state from artifact problems.

## Rollout And Rollback

### Recommended implementation order

1. Workstream A: route-time contract hardening
2. Workstream B: plan-contract as workflow prerequisite
3. Workstream C: execution-state gate expansion
4. Workstream D: structured QA and release artifacts
5. Workstream E: public CLI expansion
6. Workstream F: session-entry gate and fallback reduction
7. Workstream G: deprecated command compatibility shims

### Compatibility rollout rules

- keep legacy `reason` output for one release cycle
- keep legacy evidence readable for one release cycle
- keep command compatibility shims for one release cycle
- migrate new mutations and new consumers to the stronger structured surfaces immediately

### Deployment sequence

```text
1. Land red fixtures and contract tests
2. Harden route-time and analyze-plan semantics
3. Land execution gates and evidence v2
4. Land QA / release artifact freshness checks
5. Expand public workflow CLI over the stabilized helper surfaces
6. Reduce `using-superpowers` fallback and add compatibility shims
7. Update docs and run the full verification matrix
```

### Rollback flow

```text
new helper / wrapper / skill contract lands
            |
            v
unexpected breakage?
      | yes
      v
revert helper + wrapper + skill + test slice together
      |
      v
legacy compatibility surfaces continue for one release cycle
      |
      v
approved repo markdown remains authoritative and untouched
```

### Rollback strategy

- revert helper, wrapper, skill, command-doc, and test changes together
- stop routing through the stronger plan-contract and late-stage gate surfaces
- leave approved markdown artifacts and historical evidence artifacts untouched
- because helper state is derived, rollback does not require data migration

## Stale Diagram Audit

Existing diagrams that this project must keep consistent with implementation and docs changes:

- [2026-03-18-supported-workflow-cli-design.md](/Users/dmulcahey/development/skills/superpowers/docs/superpowers/specs/2026-03-18-supported-workflow-cli-design.md): public inspection surface and current CLI boundary diagrams
- [2026-03-21-using-superpowers-bypass-design.md](/Users/dmulcahey/development/skills/superpowers/docs/superpowers/specs/2026-03-21-using-superpowers-bypass-design.md): entry bootstrap and bypass flow diagram
- [2026-03-21-task-fidelity-improvement-design.md](/Users/dmulcahey/development/skills/superpowers/docs/superpowers/specs/2026-03-21-task-fidelity-improvement-design.md): plan-contract and packet-flow dependency graphs
- [2026-03-22-runtime-integration-hardening-design.md](/Users/dmulcahey/development/skills/superpowers/docs/superpowers/specs/2026-03-22-runtime-integration-hardening-design.md): architecture, phase state machine, deployment sequence, and rollback flow diagrams added here

Current review judgment:

- the older diagrams remain directionally accurate for their individual projects
- this spec must not ship implementation that invalidates those diagrams without updating them in the same change
- if helper composition changes the workflow boundary again, diagram drift should be treated as a release-blocking docs defect rather than cleanup

## Risks And Mitigations

### Risk 1: breaking existing automation that still parses string `reason`

Mitigation:

- keep the legacy `reason`
- add schema versioning
- document the transition

### Risk 2: increased helper complexity

Mitigation:

- centralize shared parsing
- keep public CLI read-only
- keep gate commands read-only

### Risk 3: skill and runtime drift continues

Mitigation:

- prefer helper-owned law over prose-only law
- reduce manual fallback
- make wrappers and skills consume structured helper output

### Risk 4: evidence v2 migration pain

Mitigation:

- keep read compatibility for one release cycle
- rewrite into v2 on new mutations
- expose clear legacy warnings

## Testing Strategy

### Unit and focused helper coverage

Add or extend coverage for:

- missing `Plan Revision`
- invalid `Execution Mode`
- malformed canonical task blocks
- ambiguous plan or spec resolution
- bounded-scan truncation visibility
- contract analysis validity and invalidity
- packet buildability failure
- execution `preflight` failures
- stale evidence detection
- missed reopen detection
- stale QA artifact detection
- stale release artifact detection

### Fixture coverage

Add or extend fixtures for:

- thin-header approved plan
- full-header invalid plan
- valid plan with invalid task structure
- valid plan with incomplete requirement coverage
- legacy evidence v1
- evidence v2
- stale packet due to plan revision change
- QA artifact with head mismatch
- release artifact with plan revision mismatch

### End-to-end coverage

Required E2E scenarios:

1. valid approved spec plus invalid plan headers -> `plan_draft`
2. valid approved spec plus invalid task structure -> `plan_draft`
3. fully valid spec and plan -> `implementation_ready`
4. handoff builds valid task packets
5. review gate passes on valid clean execution
6. code changes after completion without reopen -> review gate blocks
7. QA required but missing -> finish gate blocks
8. release artifact missing -> finish gate blocks
9. release artifact stale -> finish gate blocks

### Cross-platform parity

Every new CLI behavior must have:

- Bash coverage
- PowerShell parity coverage

## Acceptance Criteria

This project is complete when all of the following are true:

1. `implementation_ready` cannot be reached with a thin or malformed approved plan.
2. Engineering approval depends on valid plan-contract analysis and fully buildable task packets.
3. Review readiness is helper-owned and fail-closed.
4. Finish readiness is helper-owned and fail-closed.
5. Execution evidence carries enough provenance to detect stale completion reliably.
6. QA and release-readiness artifacts are structured and freshness-checkable.
7. `superpowers-workflow` can report phase, handoff, preflight, review gate, and finish gate.
8. Manual fallback no longer acts as a weaker parallel state machine.
9. Deprecated command entry points no longer dead-end users.
10. Bash and PowerShell behavior remain aligned.

## Requirement Index

- [REQ-001][behavior] `superpowers-workflow-status` must validate the full approved-plan header contract, including `Workflow State`, `Plan Revision`, `Execution Mode`, `Source Spec`, `Source Spec Revision`, and `Last Reviewed By`, using the same allowed values as planning and execution surfaces.
- [REQ-002][behavior] `implementation_ready` must only be reachable when the latest approved spec and a unique latest plan resolve, the plan headers validate, the source spec path and revision match the approved spec, and plan-contract analysis passes for execution-bound plans.
- [REQ-003][behavior] Invalid or ambiguous plan state must route conservatively backward: invalid header or contract state routes to `plan_draft`, stale spec-plan linkage routes to `stale_plan`, and ambiguous artifact resolution emits structured diagnostics instead of guessing.
- [REQ-004][behavior] `superpowers-workflow-status` must emit schema-versioned structured diagnostics including `contract_state`, `reason_codes`, `diagnostics`, `scan_truncated`, and candidate counts while preserving the legacy string `reason` for one release cycle.
- [REQ-005][behavior] `superpowers-plan-contract analyze-plan --format json` must become the authoritative plan-contract analysis surface and must expose contract validity, fingerprints, buildability counts, structural validity, overlapping write scopes, reason codes, and diagnostics.
- [REQ-006][behavior] `plan-eng-review` may approve a plan only when `contract_state == valid` and `packet_buildable_tasks == task_count`, and execution handoff must block unless every task packet for the approved plan revision is buildable.
- [REQ-007][behavior] Task-packet output must include standardized provenance for plan path, plan revision, plan fingerprint, source spec path, source spec revision, source spec fingerprint, task number, task title, packet fingerprint, and generation timestamp.
- [REQ-008][behavior] `superpowers-plan-execution` must expose read-only `preflight`, `gate-review`, and `gate-finish` commands with fail-closed JSON diagnostics.
- [REQ-009][behavior] `preflight` must validate approved plan parsing, execution-mode validity, evidence parsing, blocked-state absence, safe workspace state, and repo-safety applicability before execution continues.
- [REQ-010][behavior] `gate-review` must fail closed on in-progress or blocked work, unresolved interrupted work, missing or invalid evidence, packet provenance mismatch, stale evidence, and missed-reopen conditions.
- [REQ-011][behavior] `gate-finish` must include all review-gate checks and must additionally fail closed on missing or stale QA artifacts, missing or stale release-readiness artifacts, and branch or head SHA mismatches against validated late-stage artifacts.
- [REQ-012][behavior] Execution evidence v2 must record plan, spec, task, step, packet, branch, and file-proof provenance strongly enough to detect stale completion, while legacy evidence remains readable for one release cycle with explicit warnings.
- [REQ-013][behavior] Execution actions must bind to packet identity so that `begin` records packet provenance, `transfer` preserves it, `complete` requires a matching packet fingerprint unless an explicit reopen and rebuild occurred, and `status` exposes packet provenance.
- [REQ-014][behavior] `plan-eng-review`, `qa-only`, and `document-release` must write structured test-plan, QA-result, and release-readiness artifacts with required headers and helper-inspectable result values.
- [REQ-015][behavior] QA and release-readiness artifacts are fresh only when source plan path, source plan revision, branch, head SHA, and artifact parsing all match current approved state except for helper-owned explicit narrow exceptions; stale artifacts must block finish.
- [REQ-016][behavior] `superpowers-workflow` must expand into the supported read-only operator surface with `phase`, `doctor`, `handoff`, `preflight`, `gate review`, and `gate finish` commands, each supporting human-readable and JSON output.
- [REQ-017][behavior] `phase` and `doctor` must compose session-entry state, workflow-status state, plan-contract state, execution-state gates, QA and release-artifact freshness, bounded-scan data, and manifest identity diagnostics into consistent operator output.
- [REQ-018][behavior] `using-superpowers` must begin with runtime-owned session-entry resolution before any `_SESSIONS` computation, artifact inspection, or normal-stack routing, and its helper-unavailable fallback must remain minimal and conservative.
- [REQ-019][behavior] Deprecated command docs for brainstorming, plan writing, and plan execution must act as temporary compatibility shims that explain current phase and route users to the correct supported workflow surface instead of dead-ending.
- [REQ-020][constraint] Repo-visible markdown remains authoritative, helper and manifest state remains derived and rebuildable, the public CLI remains read-only, execution remains step-serial, browser QA remains conditional, `document-release` remains required before workflow-routed branch completion, and Bash and PowerShell behavior remain aligned.
- [REQ-021][decision] Shared plan-header and plan-contract parsing must become the single effective source of truth for approved-plan validity; calling `analyze-plan` from route-time is acceptable, but dual authoritative interpretations are not.
- [REQ-022][decision] Manual fallback after helper failure is allowed only as a minimal conservative recovery path and must not function as a weaker parallel workflow state machine.
- [NONGOAL-001][non-goal] Do not move approval authority out of repo-visible markdown or replace markdown artifacts with a database, service, or hidden authoritative local store.
- [NONGOAL-002][non-goal] Do not add a mutating public CLI, universal browser QA, or a new approval authority outside the existing markdown-plus-helper model.
- [NONGOAL-003][non-goal] Do not remove the manifest or runtime-state model, eliminate step-serial execution, or make `document-release` the authority for execution approval.
- [VERIFY-001][verification] Regression coverage must cover route-time contract failures, plan-contract validity and packet buildability, execution preflight and gate behavior, evidence v1 to v2 compatibility, QA and release-artifact freshness, public CLI inspection, compatibility shims, bounded-scan diagnostics, and Bash to PowerShell parity.
