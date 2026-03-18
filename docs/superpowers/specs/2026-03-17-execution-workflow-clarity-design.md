# Execution Workflow Clarity

**Workflow State:** CEO Approved
**Spec Revision:** 1
**Last Reviewed By:** plan-ceo-review

## Summary

Add a small execution-stage runtime helper that keeps approved plan markdown truthful during implementation and makes execution handoffs opinionated instead of passive. The plan file becomes the authoritative record of execution progress, interrupted work, and resume state; the new helper enforces that contract and recommends either `superpowers:subagent-driven-development` or `superpowers:executing-plans` at handoff time.

This spec deliberately absorbs these active TODOs into one workflow project:

- `Enforce Plan Checklist State During Execution`
- `Execution Handoff Recommendation Flow`

## Problem

The current execution workflow has two related clarity failures:

1. Approved plans are written as executable checklists, but execution skills track progress in a separate task tracker and often leave the plan's `- [ ]` steps stale.
2. Execution handoff exposes both `superpowers:subagent-driven-development` and `superpowers:executing-plans`, but the user still has to infer which one fits the plan, session, and workspace constraints.

Those failures compound each other:

- if work is interrupted, the repo does not clearly show where execution stopped
- if a later agent resumes the work, it must reconstruct progress from commits, test output, or chat history
- if the handoff is vague, different agents can pick different execution paths for the same plan

The result is avoidable ambiguity at the exact point where Superpowers should be most operationally clear.

## Goals

- Make the approved plan markdown the single authoritative execution-state record.
- Add an explicit plan revision identifier so execution evidence can be tied to one approved plan revision.
- Enforce truthful checklist state during execution, not only at the very end.
- Preserve a simple binary checklist contract: `- [ ]` pending, `- [x]` complete.
- Make interrupted or blocked work explicit in the plan file without introducing a second progress ledger.
- Add an opinionated execution recommendation that still allows override.
- Require explicit semantic evidence before checked-off steps can pass final review or branch completion.
- Keep the execution-state contract machine-parseable and easy to test.
- Preserve the existing workflow split:
  - `superpowers-workflow-status` owns routing up to `implementation_ready`
  - execution skills own implementation
  - `plan-eng-review` owns the execution handoff

## Not In Scope

- Replacing approved plans with manifest-authoritative execution state.
- Reworking the spec/plan approval workflow before `implementation_ready`.
- Introducing a full execution event log or local runtime progress database.
- Changing plan authoring away from markdown checklist steps.
- Automatically choosing an execution skill with no user-visible override.

## Existing Workflow Issues

Current behavior creates three concrete failure modes:

- A step is functionally done, but the plan still shows it unchecked.
- A step is partly done, but the plan gives no visible resume point.
- The handoff recommends both execution paths informally, so the real routing decision is deferred to later judgment instead of being expressed at handoff time.

These are workflow clarity issues, not architecture issues. The fix should harden the execution contract without introducing hidden local truth.

## Decisions

The design locks these decisions:

- One combined follow-up covers checklist enforcement and execution-handoff recommendation together.
- Enforcement is strict: execution state must remain accurate during execution, not only before final branch completion.
- The plan markdown is authoritative for execution state.
- The execution handoff is opinionated: recommend one path first, but still show the other valid option as an override.
- In-progress or blocked work does not get a third checkbox state.
- A started-but-incomplete step stays unchecked and is represented by one adjacent execution note.
- Execution is serial at the plan-step level, but cross-step invalidation may temporarily park one interrupted step while a reopened repair step becomes current.
- V1 uses a bounded two-slot execution model: one current-work slot and one parked interrupted slot.
- The helper must track explicit step start so the serial active-step rule is machine-enforceable.
- The helper should be a dedicated execution helper, not an overload of `superpowers-workflow-status`.
- Semantic review of checked-off steps should use a separate evidence artifact, but that artifact must not become the authoritative progress record.

## Proposed Architecture

Add a new helper:

1. `bin/superpowers-plan-execution`
2. `bin/superpowers-plan-execution.ps1` for wrapper parity if this helper becomes a supported runtime surface

Responsibility split:

- `superpowers-workflow-status`
  - decides whether the workflow may proceed to execution
  - ends at `implementation_ready`
- `superpowers-plan-execution`
  - reads the exact approved plan path
  - validates execution-state syntax in the plan markdown
  - tracks the single current active step
  - mutates plan checklist and execution-note state
  - recommends the default execution path

This keeps execution-state enforcement and execution recommendation in one place without creating another source of truth.

Execution helper flow:

```text
superpowers-workflow-status
          |
          v
  implementation_ready
          |
          v
plan-eng-review handoff
          |
          v
superpowers-plan-execution recommend
          |
          v
+-------------------------------+
| chosen execution skill        |
| - subagent-driven-development |
| - executing-plans             |
+-------------------------------+
          |
          v
superpowers-plan-execution status
          |
          v
+-------------------------------+
| plan + evidence both parse?   |
| execution fingerprint current?|
+-------------------------------+
      | yes              | no
      v                  v
 step mutations       fail closed
 complete/note/reopen
      |
      v
review + branch completion gates
```

## Plan File Contract

Approved plan markdown remains the execution record.

Checklist rules:

- `- [ ]` means the step is not complete
- `- [x]` means the step is complete
- no third checklist state is introduced

If work starts on a step, the step stays unchecked and the helper must represent that live execution state with one adjacent execution note directly under that step:

```markdown
- [ ] **Step 3: Run the full helper regression suite**

  **Execution Note:** Active - Running the full helper regression suite
```

Rules for execution notes:

- allowed note states in v1: `Active`, `Interrupted`, and `Blocked`
- all execution notes must use one canonical single-line form: `<State> - <summary>`
- notes are only valid on unchecked steps
- checked steps must not retain execution notes
- each unchecked step may have at most one execution note
- v1 must keep parked-step transfer deterministic: at most one unchecked step may carry a current-work note (`Active` or `Blocked`), and at most one additional unchecked step may carry a parked `Interrupted` note
- v1 execution is serial at the step level: subagents may assist, but they must coordinate around one current plan step until it is completed or explicitly noted
- notes must be adjacent to the step they describe
- `begin` writes or replaces the live note for that step in canonical `Active - <summary>` form
- in v1, `begin` must synthesize `<summary>` from the target step title in a helper-owned canonical way rather than taking free-form caller input
- the helper must whitespace-normalize the target step title before using it as the active summary
- `begin` active-note summaries may be capped at 120 characters and truncated with helper-added ellipsis when needed
- `complete` removes the adjacent execution note for that step
- `note --state interrupted|blocked` transitions the current live `Active` note to `Interrupted - <summary>` or `Blocked - <summary>`
- when a parked interrupted step already exists during cross-step repair, the current repair step must not transition to `Interrupted`; it may only `complete` or transition to `Blocked`
- when the current interrupted step is ready to resume, `begin` on that same step replaces the live `Interrupted - <summary>` note with `Active - <summary>`
- when the current blocked step is genuinely unblocked, `begin` on that same step replaces the live `Blocked - <summary>` note with `Active - <summary>`
- a step reopened back to unchecked state must also have an adjacent execution note unless a fresh `complete` happens in the same work sequence
- `reopen` writes `Interrupted` by default; callers that discover the reopened step is truly blocked must follow with `note --state blocked`
- a reopened step's execution note must mirror a helper-bounded one-line summary of the reopen reason in canonical form: `Interrupted - Reopened: <reason summary>`
- all execution-note summaries must be whitespace-normalized
- ordinary `note` summaries must fit within 120 characters after normalization or the mutation fails
- `reopen` note summaries may be capped at 120 characters and truncated with helper-added ellipsis because the full reopen reason remains in the evidence artifact
- ordinary `note` mutations must fail if the normalized summary would exceed 120 characters; v1 must not silently truncate the only authoritative resume detail for interrupted or blocked work
- the full caller-supplied reopen reason must remain in the evidence artifact even when the plan note uses a shortened summary
- when a reopened step later receives `note --state blocked`, that live blocked note replaces the prior reopened `Interrupted` note; reopen history remains in the evidence artifact
- orphan notes, duplicate notes, more than one current-work note, more than one parked interrupted note, or malformed note prefixes are invalid execution state

Execution structure freeze:

- execution is considered started at the first successful `begin`, `complete`, or `note` mutation
- after execution starts, task and step structure is frozen
- allowed edits after execution starts:
  - checkbox mutations through the helper
  - execution-note mutations through the helper
  - non-semantic wording fixes that do not add, remove, renumber, or reorder tasks or steps
- if execution requires task/step add, remove, reorder, or renumber changes, stop and route back to `superpowers:plan-eng-review`

Blocked-step execution rule:

- a `Blocked` execution note halts forward execution
- later unchecked steps must not proceed while a blocked step remains unresolved
- when a repair step is the current blocked step during cross-step repair, that blocked repair step retains the current-work slot and must resolve before the parked interrupted step may resume
- if the blockage requires a real sequencing or scope change, stop and route back to `superpowers:plan-eng-review`

Cross-step invalidation repair rule:

- if work on the current step invalidates a previously completed step, execution may explicitly park the current step as `Interrupted`, reopen the invalidated step, repair it as the new current step, and then resume the parked step afterward
- if the repair step becomes `Blocked`, the parked interrupted step must remain parked; v1 must not allow the parked step to resume until that blocked repair step is unblocked, completed, or escalated back to review
- after the repair step completes, v1 must not auto-resume the parked step; the parked interrupted step remains the single resume target until the caller explicitly invokes `begin` on that same parked step
- this parked-step transfer must remain deterministic and repo-visible; v1 must not allow an unbounded number of parked interrupted steps
- if cross-step invalidation would require parking a second interrupted step while the parked slot is already occupied, fail closed with an explicit overflow error and route back to review

This gives a readable and parseable resume contract while keeping the visible plan simple.

## Plan Revision Contract

Execution-facing plans need an explicit revision identifier.

Required header addition:

```markdown
**Plan Revision:** <integer>
**Execution Mode:** none | superpowers:executing-plans | superpowers:subagent-driven-development
```

Rules:

- `**Plan Revision:**` starts at `1` when the plan is first written
- `**Execution Mode:**` starts at `none` for a fresh execution-clean plan revision
- it becomes part of the approved execution-plan contract alongside:
  - `**Workflow State:** Engineering Approved`
  - `**Source Spec:**`
  - `**Source Spec Revision:**`
  - `**Last Reviewed By:**`
- once execution begins for a plan revision, the approved plan must persist exactly one chosen execution path in `**Execution Mode:**`
- `**Execution Mode:**` may be only:
  - `none`
  - `superpowers:executing-plans`
  - `superpowers:subagent-driven-development`
- later agents must be able to determine the already-chosen execution path from the approved plan alone rather than inferring it from chat or session memory
- missing, malformed, or out-of-range `**Execution Mode:**` values make the approved plan header contract invalid for execution and must fail closed as `PlanNotExecutionReady`
- derived `execution_started` is `yes` if any durable execution artifact exists for the current revision:
  - `**Execution Mode:**` is not `none`
  - any step is checked complete
  - any live `Active`, `Interrupted`, or `Blocked` execution note exists
  - any parked interrupted slot exists
  - any step evidence attempt history exists for the current revision
- persisted `**Execution Mode:**` with a concrete non-`none` value is by itself sufficient to keep `execution_started` at `yes`, even if no other durable execution artifacts remain for that revision
- if persisted `**Execution Mode:**` contradicts the revision's derived execution state, fail closed as `MalformedExecutionState` instead of silently trusting either side
- current-revision step evidence attempt history with persisted `**Execution Mode:** none` is always `MalformedExecutionState`, even when no checked steps or live notes remain
- evidence-attempt `**Execution Source:**` is sufficient persisted source-bearing evidence for diagnosing that malformed-state contradiction; checked steps, live notes, parked state, branch context, or chat/session memory are not authoritative enough
- multiple distinct persisted `**Execution Source:**` values within one plan revision are impossible state and must fail closed as `MalformedExecutionState`
- persisted execution-mode contradictions and mixed persisted execution-source corruption are dirty-state malformed cases in v1: route them back through `superpowers:plan-eng-review` and produce a new approved revision that starts execution-clean with no carried-forward checked steps, live notes, parked state, `**Execution Mode:**`, or evidence history
- if an approved plan is materially changed and re-approved, `**Plan Revision:**` must increment
- a newly approved plan revision must start execution-clean for that revision:
  - all execution checkboxes must reset to unchecked
  - `**Execution Mode:**` must reset to `none`
  - no `Active`, `Interrupted`, or `Blocked` execution notes may carry forward
  - no parked interrupted slot may carry forward
  - no prior current-work state may carry forward
- if a newly approved plan revision still carries forward checked steps, live execution notes, or a parked slot anyway, the execution helper must fail closed until that revision is corrected
- correcting a newly approved dirty revision is itself a further material approved change and must increment `**Plan Revision:**` again rather than rewriting the bad approved revision in place
- non-semantic wording fixes made after execution starts must not increment `**Plan Revision:**`
- evidence artifacts and execution helper validation must key off the exact approved plan path plus `**Plan Revision:**`
- legacy approved plans that do not satisfy the required `**Plan Revision:**` / `**Execution Mode:**` header contract must be normalized through `superpowers:plan-eng-review` before they can execute under this helper contract
- the exact migration mechanics for legacy plans are rollout concerns, not part of the helper's runtime contract

## Helper Contract

Suggested interface:

```text
superpowers-plan-execution status --plan <approved-plan-path>
superpowers-plan-execution recommend --plan <approved-plan-path> [--isolated-agents available|unavailable] [--session-intent stay|separate|unknown] [--workspace-prepared yes|no|unknown]
superpowers-plan-execution begin --plan <approved-plan-path> --task <n> --step <n> [--execution-mode <skill-id>] --expect-execution-fingerprint <value>
superpowers-plan-execution transfer --plan <approved-plan-path> --repair-task <n> --repair-step <n> --source <execution-source-id> --reason <text> --expect-execution-fingerprint <value>
superpowers-plan-execution complete --plan <approved-plan-path> --task <n> --step <n> --source <execution-source-id> --claim <text> [--file <repo-path>]... [--verify-command <text>] [--verify-result <text>] [--manual-verify-summary <text>] --expect-execution-fingerprint <value>
superpowers-plan-execution note --plan <approved-plan-path> --task <n> --step <n> --state interrupted|blocked --message <text> --expect-execution-fingerprint <value>
superpowers-plan-execution reopen --plan <approved-plan-path> --task <n> --step <n> --source <execution-source-id> --reason <text> --expect-execution-fingerprint <value>
```

Behavior:

- all structured contract payloads must be emitted on `stdout`
- this includes:
  - successful `status`, `recommend`, `begin`, `transfer`, `complete`, `note`, and `reopen` JSON payloads
  - bounded JSON error payloads for helper failures on nonzero exit
- `stderr` is reserved only for optional non-contract diagnostics and must not be required for correct caller behavior
- callers and tests must treat `stdout` as the only authoritative contract stream in v1
- all command failures must return a stable machine-readable JSON object on nonzero exit rather than implementation-defined stderr text
- required failure output schema:
  - `error_class`
    - required
    - exact failure class name from the Error & Rescue Registry
  - `message`
    - required
    - short human-readable explanation of the failure
- no additional failure output fields should be required in v1
- `status`
  - parses the approved plan
  - validates checklist and execution-note state
  - returns a stable machine-readable JSON object rather than implementation-defined text
  - when no evidence artifact exists yet, must still return a stable combined execution fingerprint instead of treating missing evidence as an error
  - a valid empty/header-only evidence stub must yield that same combined execution fingerprint rather than a distinct stub-specific value
  - must fail closed if a newly approved plan revision still carries forward checked steps, live execution notes, or a parked slot from prior execution activity
  - must derive `execution_started` conservatively from durable revision artifacts rather than caller intent or session memory
  - must fail closed if persisted `execution_mode` contradicts the plan revision's derived execution state
  - required output schema:
    - `plan_revision`
      - required
      - integer value from `**Plan Revision:**`
    - `execution_mode`
      - required
      - exact value from `**Execution Mode:**`
      - must be one of `none`, `superpowers:executing-plans`, or `superpowers:subagent-driven-development`
    - `execution_fingerprint`
      - required
      - opaque concurrency token covering the current approved plan contents plus the current evidence state for this exact plan revision
    - `evidence_path`
      - required
      - normalized repo-relative path where the evidence artifact for this exact plan revision belongs, even if the file does not yet exist
    - `execution_started`
      - required
      - `yes | no`
      - `yes` when any durable execution artifact exists for the current revision:
        - persisted `execution_mode` is not `none`
        - any checked step exists
        - any live execution note exists
        - any parked interrupted slot exists
        - any step evidence attempt history exists for the current revision
      - a concrete persisted `execution_mode` remains sufficient on its own even when no other durable execution artifacts remain
    - `active_task`
      - required
      - integer task number for the currently active step, or `null` when no step is currently active
    - `active_step`
      - required
      - integer step number for the currently active step, or `null` when no step is currently active
    - `blocking_task`
      - required
      - integer task number for the currently blocking step, or `null` when no blocked step is present
    - `blocking_step`
      - required
      - integer step number for the currently blocking step, or `null` when no blocked step is present
    - `resume_task`
      - required
      - integer task number for the single parked interrupted step, or `null` when no parked interrupted step is present
    - `resume_step`
      - required
      - integer step number for the single parked interrupted step, or `null` when no parked interrupted step is present
  - no additional output fields should be required in v1
- `recommend`
  - analyzes the plan and current session/workspace context
  - must validate the same execution-readiness contract that `status` uses before returning any recommendation payload
  - must fail closed with the relevant execution-readiness failure class instead of returning routing guidance when the target plan is not execution-ready
  - is valid only before execution has started on the current plan revision
  - must fail closed instead of returning routing guidance when `execution_started` is already `yes` for the current plan revision
  - returns the recommended execution skill, rationale, and bounded decision flags
  - derives only repo-observable facts itself
  - accepts ambiguous context inputs explicitly from the calling skill or agent
  - must not use any caller-supplied or helper-derived recommendation input that is not fully represented in the returned `decision_flags`
  - callers should rerun `recommend` whenever they need fresh handoff guidance; v1 does not define recommendation-result reuse or caching semantics
- `begin`
  - is the explicit execution-time mutation for marking one unchecked step as the current active step before implementation work begins
  - when `**Execution Mode:**` is `none`, requires `--execution-mode` with exactly one of:
    - `superpowers:executing-plans`
    - `superpowers:subagent-driven-development`
  - the first successful `begin` for a plan revision must atomically persist that chosen `**Execution Mode:**` alongside the live `Active - <summary>` note
  - once `**Execution Mode:**` is set for a plan revision, `begin` must not change it
  - may succeed as an idempotent no-op when the requested step is already the current active step
  - must fail closed if a different step is already active
  - must reject attempts to begin a completed step or a step with malformed execution state
  - when an interrupted step exists, may resume only that same interrupted step by replacing its live `Interrupted - <summary>` note with canonical `Active - <summary>` form
  - must reject attempts to begin any other step while an interrupted step remains unresolved
  - when a blocked step exists, may resume only that same blocked step by replacing its live `Blocked - <summary>` note with canonical `Active - <summary>` form
  - when that blocked step is a repair step and a parked interrupted step also exists, the blocked repair step still owns resumption; `begin` must reject attempts to resume the parked step first
  - must reject attempts to begin any other step while a blocked step remains unresolved
  - must make the active-step state machine-visible through `status` and visible in the authoritative plan record by writing the adjacent execution note for that step in canonical `Active - <summary>` form
  - must synthesize that active-note summary from the target step title in a helper-owned canonical way rather than accepting free-form caller text
  - must whitespace-normalize the target step title before using it as the active-note summary
  - may cap the active-note summary at 120 characters with helper-added ellipsis when needed
  - when `**Execution Mode:**` is already set, `begin` may omit `--execution-mode`; if the flag is supplied, it must exactly match the persisted mode
  - on success, returns the same bounded `status` JSON schema
- `transfer`
  - is the explicit atomic cross-step invalidation-repair mutation
  - atomically:
    - parks the current active step as `Interrupted`
    - reopens the specified previously completed repair step with the supplied `--reason`
    - makes that repaired step the new current active step by writing its live `Active - <summary>` note
  - when parking the current step, must write a helper-synthesized canonical parked note in the form `Interrupted - Parked for repair of Task <repair-task> Step <repair-step>`
  - when making the repaired step current, must write that step's live `Active - <summary>` note using the same helper-owned step-title normalization and 120-character cap rules as `begin`
  - must fail closed unless a current active step exists
  - must fail closed if the parked interrupted slot is already occupied
  - must fail closed if the specified repair step is not currently completed and eligible for reopen
  - must persist the reopen-side evidence invalidation as part of the same atomic mutation and therefore requires `--source` plus `--reason`
  - `--source` must exactly match the persisted `**Execution Mode:**` for the current plan revision
  - when the repaired step later completes successfully, the helper must leave no current active step and must preserve the parked interrupted step as the single explicit resume target; resumption still requires a separate `begin` on that parked step
  - on success, returns the same bounded `status` JSON schema
- `complete`
  - changes the exact step from `- [ ]` to `- [x]`
  - may target only the current active step
  - removes any adjacent execution note for that step
  - when completing a repair step that became current through `transfer`, must leave no current active step and keep the parked interrupted step in the resume slot rather than auto-resuming it
  - appends a new completion attempt inside the corresponding step's semantic evidence record as part of the same helper-owned completion operation
  - on success, returns the same bounded `status` JSON schema
  - must reject direct "refresh" completion of an already checked step; callers must use `reopen` first when prior completion evidence is no longer trustworthy
  - must fail closed if it cannot persist both the plan mutation and the evidence mutation
  - requires explicit caller-supplied evidence fields rather than inferring proof heuristically
  - accepts exactly one canonical verification payload per attempt in v1; callers must summarize multiple checks into that one verification entry
  - must accept exactly one verification mode in v1:
    - command mode requires both `--verify-command` and `--verify-result`
    - manual mode requires `--manual-verify-summary`
    - mixed or partial verification inputs are invalid
  - may synthesize canonical sentinel entries when optional evidence inputs are omitted, instead of requiring callers to pass sentinel text explicitly
  - when `--verify-command` is omitted, the caller must still provide `--manual-verify-summary <text>` and the helper must wrap it as the canonical `Manual inspection only: <summary>` entry
  - writes `**Recorded At:**` itself at mutation time and records the caller-supplied normalized `--source` as `**Execution Source:**`
  - `--source` must exactly match the persisted `**Execution Mode:**` for the current plan revision
  - when `--file` inputs are provided, each path must normalize to a repo-relative path inside the current repo root
  - a normalized `--file` path may point to:
    - a file that exists at mutation time, or
    - a repo-relative path represented in the current change set, including deletions and renames
  - when a rename-backed path resolves to a current destination, the helper must canonicalize the stored `**Files:**` entry to the current repo-relative destination path
  - pure deletions must keep the deleted repo-relative path because no current destination exists
  - `complete` must reject absolute paths, traversal, normalized paths outside the repo root, and absent paths that are not represented in the current change set
  - for v1, the current change set is the union of:
    - tracked staged changes
    - tracked unstaged changes
    - untracked repo files
  - rename and delete detection should come from git diff metadata where available; v1 should not require files to be staged before they can be cited as evidence
- `note`
  - leaves the step unchecked
  - creates or updates exactly one adjacent execution note in canonical `<State> - <summary>` form
  - in normal mid-step interruption flow, may target only the current active step and transitions its live `Active` note to `Interrupted` or `Blocked`
  - when a parked interrupted step already exists during cross-step repair, `note --state interrupted` on the current repair step must fail closed rather than creating a second parked interrupted step; `note --state blocked` remains valid
  - after `reopen`, may also replace the default reopened `Interrupted` note with `Blocked`
  - on success, returns the same bounded `status` JSON schema
  - must reject overlong normalized summaries instead of truncating them
- `reopen`
  - is the explicit execution-time mutation for clearing a previously checked-off step whose active completion evidence is no longer trustworthy after later work
  - changes the exact step from `- [x]` back to `- [ ]`
  - on success, returns the same bounded `status` JSON schema
  - adds or updates the adjacent execution note for that step in whitespace-normalized canonical `Interrupted - Reopened: <reason summary>` form, capped at 120 characters with helper-added ellipsis when needed, unless a fresh `complete` happens in the same work sequence
  - preserves the corresponding semantic evidence entry in place but marks it invalidated as part of the same helper-owned mutation
  - records the caller-supplied reopen reason directly in that invalidated evidence entry
  - writes `**Recorded At:**` itself at mutation time and records the caller-supplied normalized `--source` as `**Execution Source:**`
  - `--source` must exactly match the persisted `**Execution Mode:**` for the current plan revision
  - must fail closed if it cannot persist both the reopened plan state and the evidence invalidation together

Plan path boundary:

- `--plan` must be a normalized repo-relative path under `docs/superpowers/plans/`
- reject absolute paths, `..` traversal, and any normalized path outside that subtree
- before any recommendation or mutation, the target file must parse as the exact approved execution plan:
  - `**Workflow State:** Engineering Approved`
  - valid `**Plan Revision:**`
  - valid `**Source Spec:**`
  - valid `**Source Spec Revision:**`
- if the target file fails that contract, fail closed with `PlanNotExecutionReady`

Mutation safety:

- every mutation must verify the current combined execution fingerprint matches the caller's `--expect-execution-fingerprint` before writing
- if the approved plan or evidence state changed since the last successful `status`, the helper must fail closed with `StaleMutation` and require a fresh `status` before retry
- only `begin` may be retried idempotently against the already-active same task/step
- after any ambiguous `transfer`, `complete`, `note`, or `reopen` outcome, callers must run a fresh `status` and reconcile current plan/evidence state before issuing another mutation
- v1 should not attempt line-level merge, force-overwrite, or silent reconciliation of concurrent plan mutations
- `begin` must treat active-step marking as a plan mutation with the same stale-write protection as other plan-only mutations
- `transfer` must treat parking the current step, reopening the repair step, invalidating prior evidence, and writing the new active note as one logical mutation; if any part fails, the helper must preserve the pre-transfer state and surface an explicit recovery error
- `complete` must treat plan-step completion plus evidence-entry update as one logical mutation; if either write fails, the step remains unchecked and the helper must surface an explicit recovery error
- `reopen` must treat plan-step reopening plus evidence invalidation as one logical mutation; if either write fails, the step must remain checked and the helper must surface an explicit recovery error
- the first successful `complete` call must be able to create the evidence artifact atomically from the stable empty-evidence execution fingerprint

The helper must never persist execution progress outside the plan file.

## Semantic Evidence Artifact

Checked-off steps require traceable semantic evidence before they can pass final review or branch completion.

Rules:

- the approved plan markdown remains the only authoritative execution-state record
- the semantic evidence artifact is proof for reviewers and completion gates, not a second progress ledger
- the semantic evidence artifact must be repo-visible and checked in with the branch, not hidden in local runtime state
- the artifact must map checked-off plan steps to the implementation evidence that justified checking them off
- only steps with completion or reopen history should appear in the artifact
- once a step first appears in the artifact, it must keep one stable section with append-only attempt history inside that section
- review and branch-completion gates must reject checked-off steps that lack corresponding evidence entries
- each approved plan revision must have its own evidence artifact scope
- when the approved plan changes through review, prior evidence must not satisfy future review or branch-completion gates for the new revision
- when a new approved plan revision is created after execution had already started, the new revision must be treated as a fresh execution surface rather than a continuation of the prior revision's live execution state
- previously checked-off steps from a prior revision must not remain checked in the new revision; if that work still matters, it must be re-completed and re-evidenced under the new revision
- before the first completed step, no evidence artifact is required to exist
- any execution-clean revision may start with either no evidence file at all or an empty/header-only evidence stub before its first successful `complete`
- in v1, an empty/header-only stub means the evidence file contains only the revision-owned metadata plus an empty `## Step Evidence` section with no step subsections or attempts
- for execution-state purposes, a valid empty/header-only stub is semantically equivalent to no evidence file at all
- if a corrected revision's revision-specific evidence artifact already contains step evidence before any completion under that corrected revision, the helper must fail closed with `PlanNotExecutionReady`
- if an ordinary execution-clean revision's revision-specific evidence artifact already contains step evidence before any completion under that revision, the helper must fail closed with `PlanNotExecutionReady`
- that ordinary execution-clean case may be corrected only by a manual in-place repo edit that deletes the evidence file or reduces it to a valid empty/header-only stub; no new `Plan Revision` is required
- after that manual cleanup, the caller must rerun `status` and use the newly returned execution state and fingerprint before attempting any execution mutation
- the helper should treat missing evidence as a deterministic empty state, not as an implicit writeable blank file on disk
- if later work changes any file cited in the active attempt, or changes behavior the active claim says was completed, that step must be reopened unless the same change immediately re-completes it with fresh evidence before execution proceeds
- even when the same work sequence both invalidates and re-satisfies a step, the agent must record an explicit `reopen` followed by a fresh `complete`; v1 must not collapse that into one refresh-style completion
- once the conservative reopen trigger fires, the prior completion claim must no longer count as satisfied and its evidence entry must remain visible but invalidated until fresh completion evidence is recorded
- the execution agent that makes or discovers the material later change owns calling `reopen` promptly instead of leaving the stale checked state in place
- `requesting-code-review` and `finishing-a-development-branch` act as the backstop: if execution misses a required reopen, those gates must fail closed and require the step to be reopened before review or branch completion can proceed
- fresh completion after a reopen must append a new attempt under the same task/step section rather than overwriting the invalidated prior attempt
- the newest non-invalidated successful attempt is the only attempt that may satisfy review or branch-completion gates

Suggested v1 location:

- `docs/superpowers/execution-evidence/YYYY-MM-DD-<plan-topic>-r<plan-revision>-evidence.md`
- the artifact must reference the exact approved plan path and `**Plan Revision:**` it justifies

Strict v1 markdown template:

```markdown
# Execution Evidence: <plan-topic>

**Plan Path:** docs/superpowers/plans/<plan-file>.md
**Plan Revision:** <integer>

## Step Evidence

### Task <task-number> Step <step-number>
#### Attempt <attempt-number>
**Status:** Completed | Invalidated
**Recorded At:** <UTC RFC 3339 timestamp>
**Execution Source:** <skill-or-caller>
**Claim:** <one-line completion claim>
**Files:**
- <repo-relative-path>
**Verification:**
- `<command>` -> <result summary>
**Invalidation Reason:** <text or N/A>

#### Attempt <attempt-number>
...
```

Template rules:

- the helper owns this structure and must preserve it exactly
- the file must contain exactly one `# Execution Evidence:` title
- the file must contain exactly one `**Plan Path:**` line and one `**Plan Revision:**` line
- the file must contain exactly one `## Step Evidence` section
- before the first completed step for a revision, that `## Step Evidence` section may be empty and contain no `### Task <n> Step <n>` subsections
- each step that has attempt history must use exactly one `### Task <n> Step <n>` section
- step sections must be ordered canonically by task number, then step number, matching the approved plan
- attempt records must use `#### Attempt <n>` headings with strictly increasing contiguous numbering starting at `1`
- each attempt must contain exactly these fields in this order:
  - `**Status:**`
  - `**Recorded At:**`
  - `**Execution Source:**`
  - `**Claim:**`
  - `**Files:**`
  - `**Verification:**`
  - `**Invalidation Reason:**`
- `**Status:**` may be only `Completed` or `Invalidated`
- `**Recorded At:**` must be present and non-empty for every attempt
- `**Execution Source:**` must be present and non-empty for every attempt
- `**Recorded At:**` is helper-owned and must be written in canonical UTC RFC 3339 format, for example `2026-03-17T14:22:31Z`
- `**Execution Source:**` is caller-supplied but must be one helper-validated canonical identifier from the bounded v1 allowlist
- `**Invalidation Reason:**` must be `N/A` for completed attempts and non-empty for invalidated attempts
- `**Files:**` must contain at least one bullet item for every attempt
- `**Files:**` entries must be normalized to unique repo-relative paths in stable sorted order before the helper writes them
- each `**Files:**` entry must resolve to a normalized repo-relative path inside the current repo root
- a `**Files:**` entry may refer to either:
  - a file that exists at mutation time, or
  - a repo-relative path represented in the current change set, including deletions and renames
- when a renamed path has a current destination, the helper must canonicalize the stored `**Files:**` entry to that current repo-relative destination path
- pure deletions must keep the deleted repo-relative path because no current destination exists
- `**Files:**` entries that normalize outside the repo root, use absolute paths, escape via traversal, or refer to absent paths not represented in the current change set are invalid
- `**Verification:**` must contain exactly one bullet item for every attempt
- when no repo file changed, the helper must write the canonical sentinel `- None (no repo file changed)`
- when no command-driven verification exists, the helper must write the canonical sentinel `- Manual inspection only: <summary>` using the caller-supplied manual verification summary
- a reopened step may keep historical attempts, but only the newest non-invalidated successful attempt may satisfy review or branch-completion gates
- no additional headings, ad hoc fields, or free-form prose may appear inside a step section
- the helper may rewrite whitespace and list formatting as needed to preserve canonical structure

Evidence input rules:

- the execution agent or calling skill must supply the evidence payload explicitly when calling `complete`
- the caller must supply one allowed execution source identifier when calling `complete` or `reopen`
- v1 execution source allowlist:
  - `superpowers:subagent-driven-development`
  - `superpowers:executing-plans`
- v1 should not guess evidence from git diff, shell history, or prior logs
- placeholder or empty evidence entries are invalid for a checked-off step
- completed attempts may not omit `**Files:**` or `**Verification:**`; they must provide real entries or the canonical sentinel values above
- completed attempts may not emit multiple verification bullets in v1; callers must collapse multi-check verification into one canonical entry
- omitting all `--file` inputs means the helper must synthesize `- None (no repo file changed)`
- repeated `--file` inputs must be deduplicated and emitted in stable sorted order
- `--file` inputs must normalize to repo-relative paths inside the repo root and are valid only when they either exist at mutation time or are represented in the current change set, including deleted or renamed paths
- for v1, the current change set means the union of tracked staged changes, tracked unstaged changes, and untracked repo files, with rename/delete detection taken from git diff metadata where available
- rename-backed `--file` inputs may be accepted from the current change set, but the helper must persist the current destination path whenever one exists
- omitting `--verify-command` means the caller must still provide `--manual-verify-summary`; the helper synthesizes the canonical manual-inspection verification entry rather than requiring sentinel text literally
- command verification requires both `--verify-command` and `--verify-result`; partial command payloads are invalid
- `--manual-verify-summary` may not be combined with command verification inputs in v1

The artifact should be branch-specific and tied to the exact approved plan path so later review can tell which plan it justifies.

## Error & Rescue Registry

The helper must name its major failure modes explicitly and fail closed.

```text
METHOD/CODEPATH                 | WHAT CAN GO WRONG                              | FAILURE CLASS
--------------------------------|------------------------------------------------|------------------------------
status --plan                   | plan path escapes expected repo location       | InvalidCommandInput
                                | plan file missing                              | InvalidCommandInput
                                | plan headers are draft, malformed, or stale    | PlanNotExecutionReady
                                | `**Execution Mode:**` header is missing, malformed, or out of allowed range | PlanNotExecutionReady
                                | ordinary execution-clean revision starts with pre-populated step evidence | PlanNotExecutionReady
                                | newly approved revision carries forward prior execution state | PlanNotExecutionReady
                                | corrected revision starts with pre-populated step evidence | PlanNotExecutionReady
                                | persisted execution mode contradicts derived execution state | MalformedExecutionState
                                | current revision contains multiple distinct persisted `**Execution Source:**` values | MalformedExecutionState
                                | checklist / execution-note syntax malformed    | MalformedExecutionState
                                | evidence artifact structure malformed          | MalformedExecutionState
recommend --plan                | plan is not execution-ready                    | PlanNotExecutionReady
                                | execution has already started for this plan revision | RecommendAfterExecutionStart
                                | persisted execution mode contradicts derived execution state | MalformedExecutionState
                                | current revision contains multiple distinct persisted `**Execution Source:**` values | MalformedExecutionState
                                | execution-state syntax malformed               | MalformedExecutionState
                                | evidence artifact structure malformed          | MalformedExecutionState
begin --plan                    | task or step not found                         | InvalidStepTransition
                                | a different step is already active             | InvalidStepTransition
                                | required initial `--execution-mode` is missing, invalid, or conflicts with persisted mode | InvalidExecutionMode
                                | target step is complete, invalid, or interrupted/blocked state is being bypassed | InvalidStepTransition
                                | parked interrupted slot already occupied during cross-step repair | InvalidStepTransition
                                | execution state changed since last parsed fingerprint | StaleMutation
                                | execution-state syntax malformed               | MalformedExecutionState
transfer --plan                 | no current active step exists                  | InvalidStepTransition
                                | repair task or step not found                  | InvalidStepTransition
                                | source is not in the allowed source list       | InvalidExecutionMode
                                | source does not match persisted execution mode | InvalidExecutionMode
                                | parked interrupted slot already occupied       | InvalidStepTransition
                                | repair step is not currently completed/repairable | InvalidStepTransition
                                | execution state changed since last parsed fingerprint | StaleMutation
                                | execution-state syntax malformed               | MalformedExecutionState
                                | evidence entry cannot be invalidated consistently | EvidenceWriteFailed
complete --plan                 | task or step not found                         | InvalidStepTransition
                                | source is not in the allowed source list       | InvalidExecutionMode
                                | source does not match persisted execution mode | InvalidExecutionMode
                                | verification payload is missing or malformed   | InvalidCommandInput
                                | execution state changed since last parsed fingerprint | StaleMutation
                                | target step is not the current active step, already complete, or otherwise invalid | InvalidStepTransition
                                | evidence artifact structure malformed          | MalformedExecutionState
                                | evidence entry cannot be written consistently  | EvidenceWriteFailed
note --plan                     | invalid note state                             | InvalidCommandInput
                                | normalized note summary exceeds 120 characters | InvalidCommandInput
                                | current repair step cannot become interrupted while parked slot is occupied | InvalidStepTransition
                                | target step is not the current active step, except reopened-step blocked follow-up | InvalidStepTransition
                                | duplicate/orphan note, multiple active notes, or note on checked step | MalformedExecutionState
                                | evidence artifact structure malformed          | MalformedExecutionState
                                | execution state changed since last parsed fingerprint | StaleMutation
reopen --plan                   | task or step not found                         | InvalidStepTransition
                                | source is not in the allowed source list       | InvalidExecutionMode
                                | source does not match persisted execution mode | InvalidExecutionMode
                                | execution state changed since last parsed fingerprint | StaleMutation
                                | target step is not currently complete          | InvalidStepTransition
                                | evidence artifact structure malformed          | MalformedExecutionState
                                | evidence entry cannot be invalidated consistently | EvidenceWriteFailed
requesting-code-review gate     | plan still has invalid or incomplete state     | PlanNotExecutionReady
finishing-a-development-branch  | plan still has invalid or incomplete state     | PlanNotExecutionReady
```

```text
FAILURE CLASS                   | RESCUED? | RESCUE ACTION                                      | USER SEES
--------------------------------|----------|----------------------------------------------------|------------------------------------------------------------
InvalidCommandInput             | Y        | reject input, do not write                         | explicit invalid command-input error
PlanNotExecutionReady           | Y        | stop and route back to approval workflow, except ordinary pre-populated starting evidence may be cleaned up manually in place followed by fresh status | plan is not approved/current for execution
MalformedExecutionState         | Y        | stop all execution/review/finish until normalized; persisted execution-mode contradictions and mixed execution-source corruption route back through `plan-eng-review` and require a corrected execution-clean revision | explicit malformed execution-state error
RecommendAfterExecutionStart    | Y        | reject the recommend call and continue with the current execution path; only a later fresh approved revision may receive a new handoff recommendation | recommendation is only available before execution starts
StaleMutation                   | Y        | reject write, require fresh status/retry           | stale mutation error; rerun status before retry
InvalidExecutionMode            | Y        | reject the mutation, require the caller to initialize or match the persisted execution mode exactly | explicit invalid execution-mode error
InvalidStepTransition           | Y        | reject impossible mutation                         | step cannot be completed/noted from current state
EvidenceWriteFailed            | Y        | reject completion, preserve unchecked step state   | completion blocked until evidence write succeeds
```

Rules:

- persisted execution-mode contradictions are `MalformedExecutionState`; v1 does not define in-place repair of them, and correction must route back through `plan-eng-review`.
- multiple distinct persisted `**Execution Source:**` values within one plan revision are also `MalformedExecutionState` and must route correction back through `plan-eng-review`; manual evidence deletion, invalidation, or in-place source cleanup is not a valid v1 recovery path
- `RecommendAfterExecutionStart` should be `no`; the remedy is to continue the current execution flow, not to retry `recommend` against the same in-progress plan revision.
- `InvalidExecutionMode` should be `yes`; the immediate fix is to supply the required initial execution mode or to retry with the mode that exactly matches the persisted one.
- newly approved dirty revisions must be loud and blocking under `PlanNotExecutionReady`; v1 must not auto-normalize carried-forward checked steps, live notes, parked state, or pre-populated corrected-revision evidence in place.
- those dirty newly approved revision cases must route correction back through `plan-eng-review`; execution-time cleanup is not a valid recovery path.
- `MalformedExecutionState` must be loud and blocking; do not silently normalize during execution.
- malformed evidence structure is part of `MalformedExecutionState`, not a softer review-only warning
- `StaleMutation` must never auto-merge or overwrite another actor's plan or evidence change.
- active-step conflicts are invalid transitions in v1; the helper must never auto-resolve them by implicitly clearing or moving the current active step.
- an idempotent retry of `begin` against the already-active same task/step with a valid execution fingerprint remains valid and should succeed as a no-op with fresh status rather than failing as `InvalidStepTransition`.
- attempts to exceed the single parked interrupted slot are invalid transitions; v1 must never auto-resolve them by silently dropping or overwriting the existing parked step.
- `PlanNotExecutionReady` should direct the workflow back to `plan-eng-review` or `writing-plans` based on the underlying approval mismatch.
- the one v1 exception is ordinary execution-clean revisions that start with pre-populated step evidence: that subcase may be corrected only by a manual in-place repo edit that deletes the evidence file or reduces it to a valid empty/header-only stub, then rerunning `status` before any mutation.
- Gate failures are workflow failures, not warnings. Final review and branch completion must stop until the plan and evidence artifact are truthful and parseable.
- review and branch-completion skills are verification gates only; they must not mutate the plan or evidence artifact on behalf of execution

## Enforcement Model

Execution is fail-closed once it begins.

Rules:

- execution preflight must validate the plan through `status`
- malformed execution state stops execution immediately
- malformed evidence structure stops execution immediately under the same blocking contract
- execution is serial at the plan-step level; agents must not advance multiple plan steps concurrently
- before implementation work begins on a step, the execution skill must call `begin`
- while an active step exists, no other step may begin until the active step resolves through `complete` or `note`
- retrying `begin` against the already-active same task/step is allowed as an idempotent no-op
- outside explicit parked-step transfer for cross-step invalidation repair, interrupted execution resumes only by calling `begin` on that same interrupted step
- after a parked-step repair completes, the parked interrupted step remains the sole resume target and may resume only through an explicit `begin` on that same parked step
- while a blocked step exists, execution may resume only by calling `begin` on that same blocked step after the blocker is genuinely cleared
- while a blocked repair step exists and a parked interrupted step is present, the blocked repair step still owns resumption; the parked step must not resume first
- cross-step invalidation repair must use the explicit atomic `transfer` mutation rather than a best-effort sequence of standalone `note`, `reopen`, and `begin` calls
- `complete` may target only the current active step
- ordinary `note` may target only the current active step
- after a step finishes, the execution skill must call `complete`
- if work is interrupted or blocked mid-step, the execution skill must call `note`
- the authoritative plan must show active execution through the live adjacent `Active - <summary>` note written by `begin`
- every execution-state mutation must pass optimistic concurrency validation against the last parsed combined execution fingerprint
- any evidence of completed work not reflected in the plan is a workflow defect
- any checked step with an execution note is invalid
- reopened unchecked steps may not remain note-less unless they are immediately re-completed in the same work sequence
- checked-off steps whose cited files or claimed behavior were changed later must not remain closed without fresh evidence
- the execution agent must explicitly reopen any such checked-off step through the helper as soon as it knows the prior completion is no longer truthful
- direct re-completion of an already checked step is invalid; the truthful sequence is always `reopen` then `complete`
- review and branch-completion gates are responsible for catching missed reopen events before they pass
- any unresolved malformed execution state blocks further execution, review, and branch completion
- cross-step invalidation repair may temporarily park one interrupted step, but v1 must keep that parked state bounded and deterministic via the explicit atomic `transfer` mutation
- if another cross-step invalidation would require a second parked interrupted step, fail closed with `InvalidStepTransition` and route back to review or plan adjustment

Why strict enforcement:

- if a step fails midstream, the plan must still show the true resume point
- later agents should not have to reconstruct progress from commits or memory
- a strict rule is easier to enforce and test than “best effort” hygiene

Execution step-state machine:

```text
              begin writes
           Active execution note               complete
Unchecked ------------------------> Active -----------------> Checked
                                      |                         |
                                      | note(interrupted/blocked) | reopen(material change)
                                      v                         v
                        Unchecked + Execution Note -------> Reopened/Unchecked
                                      |                         |
                                      | begin resumes work      | begin, then complete
                                      | and restores Active     |
                                      +----------- begin -------+

Additional rules:
- at most one `Active` step may exist at a time
- Checked + Execution Note = invalid
- Blocked step halts forward execution
- Checked step without active evidence = invalid
- Invalidated prior evidence may remain in history, but only the newest
  non-invalidated successful attempt can satisfy review/finish gates
```

## Recommendation Model

The execution recommendation is opinionated, not mandatory.

The helper should consider:

- whether tasks are mostly independent
- whether same-session execution is viable
- whether isolated-agent workflows are available in the current platform/session
- whether the workspace is already intentionally prepared for in-place execution

Recommendation input rules:

- the helper may infer repo-observable facts directly from the approved plan and current repo state
- the calling skill or agent should pass ambiguous session-context inputs explicitly
- the user should only be asked when one of those ambiguous inputs is genuinely unknown and would materially change the recommendation
- v1 should prefer deterministic recommendation inputs over opaque heuristics
- any caller-supplied or helper-derived fact that can affect `recommended_skill` must be fully represented in the returned `decision_flags`; hidden recommendation-affecting inputs are out of scope for v1
- `recommend` must not emit a partial or fallback recommendation payload for a non-execution-ready plan; it should return the same relevant failure class family that `status` would surface for that plan state
- `recommend` is a pre-execution handoff primitive, not a mid-execution replanning interface; once `execution_started` is `yes` for the current plan revision, v1 must reject `recommend` rather than returning a fresh routing recommendation
- once execution has started, later agents should read the persisted `execution_mode` from the approved plan or `status` instead of asking `recommend` again

Default policy:

- recommend `superpowers:subagent-driven-development` when tasks are mostly independent and same-session isolated execution is viable
- recommend `superpowers:executing-plans` when work is tightly coupled, better coordinated by one agent, or intentionally being handed to a separate session
- when the stable decision flags do not positively justify `superpowers:subagent-driven-development`, default conservatively to `superpowers:executing-plans`

Required output schema:

- `recommended_skill`
  - required
  - must be exactly one of:
    - `superpowers:subagent-driven-development`
    - `superpowers:executing-plans`
- `reason`
  - required
  - short human-readable explanation of the recommendation
- `decision_flags`
  - required
  - must exhaustively represent every caller-supplied or helper-derived fact that can affect `recommended_skill` in v1
  - must contain exactly these stable fields:
    - `tasks_independent`: `yes | no | unknown`
    - `isolated_agents_available`: `yes | no | unknown`
    - `session_intent`: `stay | separate | unknown`
    - `workspace_prepared`: `yes | no | unknown`
    - `same_session_viable`: `yes | no | unknown`

No additional output fields should be required in v1.

The handoff should present one recommended path first, then show the alternate valid option as an override.

## Skill Integration

### `plan-eng-review`

- calls `superpowers-plan-execution recommend --plan <approved-plan-path>` during execution handoff
- is responsible for treating `**Plan Revision:**` as part of the approved plan contract
- is also responsible for treating `**Execution Mode:**` as part of the approved plan contract
- when approving a new plan revision after execution had already started, must produce an execution-clean approved revision rather than carrying forward live `Active`, `Interrupted`, or `Blocked` state
- when approving a new plan revision after execution had already started, must also reset prior checked-off steps to unchecked in that new revision
- is the required correction path for newly approved dirty revisions that fail `PlanNotExecutionReady`; execution skills must not normalize an already-approved dirty revision in place
- is also the required correction path for persisted execution-mode contradictions and mixed persisted execution-source corruption; those malformed-state corrections must likewise produce a new execution-clean approved revision
- when correcting a newly approved dirty revision, must increment `**Plan Revision:**` again rather than rewriting the bad approved revision in place
- presents:
  - exact approved plan path
  - recommended skill
  - alternate valid skill
  - short rationale

### `subagent-driven-development`

- calls `status --plan ...` during preflight
- may use subagents for implementation help, but must coordinate around one current plan step at a time
- calls `begin` before starting work on a plan step
- must supply `--execution-mode superpowers:subagent-driven-development` on the first `begin` for a plan revision when `**Execution Mode:**` is still `none`
- calls `complete` after each completed step
- calls `note` when work is interrupted or blocked
- must start execution under `**Execution Mode:** superpowers:subagent-driven-development` and must not switch away from that mode mid-plan-revision
- must not treat an external task tracker as the authoritative execution-state record

### `executing-plans`

- adopts the same execution-state helper contract as `subagent-driven-development`
- differs only in session style, not in execution-state semantics
- must also keep execution serial at the plan-step level rather than advancing multiple steps concurrently
- calls `begin` before starting work on a plan step
- must supply `--execution-mode superpowers:executing-plans` on the first `begin` for a plan revision when `**Execution Mode:**` is still `none`
- must start execution under `**Execution Mode:** superpowers:executing-plans` and must not switch away from that mode mid-plan-revision

### `requesting-code-review`

- rejects final review if the plan has invalid execution state or required unfinished work not truthfully represented
- must also verify that checked-off plan steps are semantically satisfied by the implementation, not merely syntactically marked complete
- consumes the semantic evidence artifact and rejects checked-off steps that lack explicit proof
- must fail closed when it detects a missed reopen or stale evidence, but must not call `reopen` itself

### `finishing-a-development-branch`

- rejects branch-completion handoff if the approved plan is execution-dirty or malformed
- must not allow branch completion while any checked-off plan step still lacks semantic implementation evidence
- consumes the same semantic evidence artifact used by final review
- must fail closed when it detects a missed reopen or stale evidence, but must not call `reopen` itself

### `writing-plans`

- keeps writing plans as checkbox-based execution documents
- adds `**Plan Revision:** 1` to new plans by default
- adds `**Execution Mode:** none` to new plans by default
- documents helper-compatible checklist structure and execution-note syntax

### `using-superpowers`

- continues routing to execution at the workflow level
- does not take over the execution-skill recommendation logic

## Testing

Add a dedicated helper suite, likely:

- `tests/codex-runtime/test-superpowers-plan-execution.sh`

Required coverage:

- valid approved plan with untouched unchecked steps
- `status` returns the exact bounded JSON schema with the required plan, evidence, and execution fields
- `status` returns `execution_mode` as `none` before execution starts and as the persisted chosen skill after execution starts
- `status` derives `execution_started` as `yes` whenever any durable execution artifact exists for the current revision, including checked steps, live notes, parked state, non-`none` execution mode, or step evidence attempt history
- a concrete persisted `execution_mode` remains enough on its own to keep `execution_started: yes`, even if no checked steps, live notes, parked state, or evidence history remain
- `status` rejects missing, malformed, or out-of-range `**Execution Mode:**` header values as `PlanNotExecutionReady`
- legacy approved plans that do not satisfy the required `**Plan Revision:**` / `**Execution Mode:**` header contract must route back through `plan-eng-review` before they can execute under this helper contract
- `status` rejects contradictory persisted `execution_mode` and derived execution state as `MalformedExecutionState`
- persisted `execution_mode` contradictions are not repaired in place in v1; they must route back through `plan-eng-review` and produce a new execution-clean revision
- `status` rejects multiple distinct persisted `**Execution Source:**` values within one plan revision as `MalformedExecutionState`
- mixed persisted `**Execution Source:**` history within one plan revision may be corrected only through `plan-eng-review`, not by manual in-place evidence cleanup
- correcting mixed persisted `**Execution Source:**` history through `plan-eng-review` produces a new execution-clean revision with no carried-forward checklist state, live notes, parked state, `execution_mode`, or evidence history
- `status` treats current-revision step evidence attempt history plus persisted `execution_mode: none` as `MalformedExecutionState`, not `PlanNotExecutionReady`
- the first successful `begin` on a revision with `**Execution Mode:** none` requires `--execution-mode` and persists that exact value atomically with execution start
- later `begin` calls on the same plan revision must not switch `execution_mode`
- `begin` rejects missing, invalid, or mismatched execution-mode initialization with `InvalidExecutionMode`
- `status` returns a stable combined execution fingerprint before any evidence artifact exists
- `status` returns that same combined execution fingerprint for a valid empty/header-only evidence stub
- any execution-clean revision may start with either no evidence file or a valid empty/header-only evidence stub before its first successful `complete`
- `status` reports `active_task` and `active_step` correctly when a step has been started, and `null` / `null` otherwise
- `status` reports `blocking_task` and `blocking_step` correctly when a blocked note is present, and `null` / `null` otherwise
- `status` reports `resume_task` and `resume_step` as the single parked interrupted slot during cross-step repair, and `null` / `null` otherwise
- `status` rejects a newly approved revision that still carries checked steps, live notes, or a parked slot as `PlanNotExecutionReady` instead of auto-normalizing or classifying it as generic malformed state
- that dirty newly approved revision case is recoverable only through `plan-eng-review`, not through execution-time cleanup
- correcting such a dirty newly approved revision produces a later `Plan Revision` rather than silently rewriting the bad approved revision in place
- a newly approved later plan revision resets `execution_mode` back to `none`
- an ordinary execution-clean revision that starts with pre-populated step evidence is rejected as `PlanNotExecutionReady`
- that ordinary execution-clean case becomes execution-ready again only after a manual in-place cleanup to no evidence file or a valid empty/header-only stub, without requiring a new `Plan Revision`
- after that manual cleanup, execution may proceed only after a fresh `status` returns the corrected combined execution fingerprint
- v1 does not define recommendation-result reuse; callers rerun `recommend` when they need fresh handoff guidance after cleanup or context changes
- `recommend` rejects non-execution-ready plans with the same relevant failure classes that `status` would return instead of emitting routing guidance on top of invalid execution state
- `recommend` rejects post-start calls on a plan revision whose `execution_started` state is already `yes` with `RecommendAfterExecutionStart`, not `PlanNotExecutionReady` or `MalformedExecutionState`
- `recommend` rejects contradictory persisted `execution_mode` and derived execution state as `MalformedExecutionState`
- later agents can read the already-chosen execution path deterministically from persisted `execution_mode` instead of inferring it from session context
- `complete`, `transfer`, and `reopen` reject `--source` values that do not exactly match the persisted `execution_mode`
- `complete`, `transfer`, and `reopen` classify both invalid `--source` values and persisted-mode mismatches as `InvalidExecutionMode`
- a corrected revision created to resolve a dirty newly approved revision rejects pre-populated step evidence before any completion under that revision with `PlanNotExecutionReady`
- a corrected revision created to resolve a dirty newly approved revision accepts either no evidence file or an empty/header-only evidence stub before its first successful `complete`
- `status` rejects plans with more than one active note-bearing step as `MalformedExecutionState` instead of picking an arbitrary resume target
- `status` rejects plans that imply more than one parked interrupted step as `MalformedExecutionState`
- callers determine possible next actions from the concrete `status` state fields and the mutation contracts; v1 does not require a separate advisory `allowed_next_mutations` field
- when a new approved plan revision is created after prior execution activity, `status` treats that new revision as execution-clean with no carried-forward live notes or parked slot
- when a new approved plan revision is created after prior execution activity, `status` also reflects that all steps in the new revision start unchecked
- if a newly approved plan revision still carries forward checked steps, live notes, or a parked slot anyway, `status` fails closed instead of auto-normalizing them
- successful `begin` calls return the same bounded `status` schema
- `begin` marks only the requested step active
- `begin` writes the visible adjacent `Active - <summary>` note into the plan for that step
- `begin` derives the active-note summary from the target step title rather than caller-supplied text
- `begin` whitespace-normalizes and caps long step-title-derived active summaries at 120 characters with helper-added ellipsis
- `begin` succeeds as an idempotent no-op when retried against the already-active same step
- `begin` rejects attempts to start a different step while another step is active
- `begin` may resume the currently interrupted step by replacing its `Interrupted - <summary>` note with `Active - <summary>`
- `begin` rejects attempts to bypass an interrupted step by starting a different step
- `begin` may resume the currently blocked step by replacing its `Blocked - <summary>` note with `Active - <summary>`
- `begin` rejects attempts to bypass a blocked step by starting a different step
- when a blocked repair step exists and a parked interrupted step is present, `begin` rejects attempts to resume the parked step before the blocked repair step resolves
- successful `transfer` calls return the same bounded `status` schema
- `transfer` atomically parks the current step, reopens the invalidated completed repair step, and makes that repair step current
- `transfer` writes the parked step's note in canonical helper-synthesized `Interrupted - Parked for repair of Task <n> Step <n>` form using the repair target
- `transfer` writes the repaired step's active note using the same step-title-derived helper synthesis and 120-character cap rules as `begin`
- `transfer` is not idempotent; after any ambiguous transfer outcome, the caller must rerun `status` and reconcile before issuing another mutation
- `transfer` rejects attempts when no current active step exists
- `transfer` rejects attempts when the parked interrupted slot is already occupied
- cross-step repair fails closed with `InvalidStepTransition` if a second parked interrupted step would be required
- completing the repair step after `transfer` leaves no current active step and preserves the parked interrupted step as the sole resume target until an explicit `begin`
- after repair completion, `status` reports `active_task=null` and `active_step=null` while the parked interrupted step remains in `resume_task` and `resume_step`
- while the repair step is `Blocked`, `status` keeps that repair step in `blocking_task` and `blocking_step`, and the parked step remains in the resume fields without becoming resumable yet
- successful `complete`, `note`, and `reopen` calls return the same bounded `status` schema
- `complete` rejects attempts to mutate any step other than the current active step
- ordinary `note` rejects attempts to mutate any step other than the current active step
- while a parked interrupted step exists, `note --state interrupted` on the current repair step fails closed with `InvalidStepTransition`; `note --state blocked` remains valid
- all helper failures return the bounded JSON error schema with correct `error_class` and `message` fields
- all contract JSON, including nonzero-exit failures, is emitted on `stdout`; `stderr` is non-authoritative and optional
- `complete` toggles only the requested step
- `complete` rejects mixed or partial verification inputs; it must receive exactly one verification mode
- `complete` normalizes repeated `--file` inputs into unique repo-relative paths in stable sorted order
- `complete` rejects `--file` paths that normalize outside the repo root or that do not exist and are not represented in the current change set
- `complete` still accepts `--file` evidence for deleted or renamed repo paths when those paths are represented in the current change set
- `complete` accepts untracked repo files as valid `--file` evidence when they normalize inside the repo root
- `complete` canonicalizes rename-backed `--file` evidence to the current destination path in `**Files:**`; only pure deletions keep the deleted path
- `note` writes or updates the adjacent execution note for the requested unchecked step in canonical `<State> - <summary>` form
- `note` transitions the live `Active` note to canonical `Interrupted - <summary>` or `Blocked - <summary>` form
- `note` rejects normalized summaries longer than 120 characters instead of truncating them
- `reopen` clears only the requested checked-off step and invalidates only the matching evidence entry
- `reopen` leaves a visible adjacent execution note on reopened unchecked steps unless a fresh `complete` happens in the same work sequence
- `reopen` writes `Interrupted` by default, and blocked reopened steps require a follow-up `note --state blocked`
- `reopen` mirrors a whitespace-normalized summary of the reopen reason into the plan note in canonical `Interrupted - Reopened: <reason summary>` form, capped at 120 characters with helper-added ellipsis, while preserving the full reason in the evidence artifact
- a follow-up `note --state blocked` on a reopened step replaces the live plan note with canonical `Blocked - <summary>` form instead of preserving old reopen context there
- an invalidated checked step that is re-satisfied in the same work sequence still records two mutations: `reopen` then fresh `complete`
- checked steps reject execution notes
- duplicate notes, orphan notes, and multiple simultaneous active note-bearing steps fail validation
- malformed note state fails validation
- skill and helper contract coverage should keep the serial active-step rule explicit so execution guidance does not drift toward parallel live step execution
- strict preflight failure on malformed execution state
- recommendation cases for mostly independent work vs tightly coupled work
- handoff-facing skill docs include the recommendation contract
- execution skills call the helper in preflight and on step transitions
- checked-off steps without evidence artifact entries are rejected at review and branch completion
- structurally valid but semantically unsupported checked-off steps are rejected even when the plan looks clean
- later changes to cited files or claimed behavior force reopen unless the step is immediately re-completed with fresh evidence
- missed reopen scenarios are caught at review and branch completion even if the execution agent failed to reopen the step during implementation

Add skill/doc contract assertions so the execution skills and handoff skills stay aligned with the helper contract.

Review-gate coverage must include:

- structurally valid but semantically false checked-off steps are rejected
- final review fails when implementation does not actually satisfy a checked-off step
- branch completion fails when checked-off steps are not substantively complete

## Rollout

- Ship as an internal helper/runtime contract first.
- Do not introduce a separate execution manifest.
- Existing approved plans remain valid as authored only when they already satisfy the required `**Plan Revision:**` and `**Execution Mode:**` header contract.
- Legacy approved plans missing `**Plan Revision:**` or `**Execution Mode:**` must be re-reviewed before they can use the new execution helper contract.
- Execution notes appear only when execution has actually started and been interrupted or blocked.
- Update docs, tests, and release notes to describe:
  - plan markdown as the authoritative execution-state record
  - required execution notes for interrupted or blocked unchecked steps
  - opinionated execution-handoff recommendation

## TODOs Pulled Into Scope

This spec absorbs and should eventually resolve these active TODOs in `TODOS.md`:

- `Enforce Plan Checklist State During Execution`
- `Execution Handoff Recommendation Flow`

The separate `Supported User-Facing Workflow CLI` TODO remains out of scope.

## Success Criteria

This work is successful when:

- an interrupted execution always leaves a clear resume point in the approved plan
- execution skills cannot silently drift from plan checklist truth
- the handoff presents one recommended execution path plus one explicit override
- later agents can determine real execution state from the plan file alone
- no local runtime execution ledger is required to understand what is complete
- checked-off steps cannot pass review or branch completion unless the implementation truly satisfies them and that proof is captured in the evidence artifact
- later code changes cannot silently invalidate previously checked-off steps; such steps must be reopened and re-evidenced
