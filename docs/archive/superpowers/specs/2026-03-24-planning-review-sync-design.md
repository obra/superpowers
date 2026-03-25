# Planning Review Sync

**Workflow State:** CEO Approved
**Spec Revision:** 1
**Last Reviewed By:** plan-ceo-review

## Summary

Sync the five planning-review deltas in `/Users/dmulcahey/development/skills/task/` into Superpowers as one skill-layer-first PR.

This sync is deliberately source-driven:

- pull the included review semantics directly from `garrytan/gstack`
- pin the upstream source to commit `3501f5dd0388c8c065ade8364c3b7c909be035a6` on `main`
- adapt only the parts that conflict with Superpowers' authority model, artifact paths, and helper contracts
- do not reinvent already-good upstream wording or section structure when a direct carry-forward fits

The resulting PR should upgrade `plan-ceo-review` and `plan-eng-review`, add two outside-voice prompt files, make small additive updates to `writing-plans` and `qa-only`, regenerate generated skill docs, and add regression coverage that proves the Rust workflow/runtime remains compatible.

## Problem

Superpowers already has the right workflow backbone:

- repo-visible specs and plans are authoritative
- approval truth lives in exact artifact headers plus `superpowers plan contract analyze-plan`
- protected-branch write gates are first-class
- `plan-eng-review` already emits a branch-scoped test-plan artifact
- `qa-only` already consumes that artifact as the structured QA handoff

What Superpowers does not yet have is the stronger planning-review semantics that upstream `gstack` now carries:

1. durable review summaries inside the authoritative artifact
2. a middle-ground CEO mode between full expansion and strict hold-scope
3. a planning-time UI design-intent pass
4. a more executable ENG coverage model and richer QA handoff
5. an optional outside voice that challenges blind spots without becoming approval truth

The core problem is not missing ideas. The problem is importing the right upstream ideas without importing the wrong upstream state model.

## Goals

- Import the five included deltas from upstream `gstack` using direct source material where it fits.
- Keep Superpowers' existing workflow ownership and approval law unchanged.
- Persist review outcomes inside the authoritative repo artifacts rather than in local review logs.
- Preserve current branch-scoped test-plan and QA-result contracts.
- Avoid Rust/runtime churn unless a regression test proves a real parser or gate incompatibility.

## Not In Scope

- Importing `gstack` JSONL review logs.
- Importing the Review Readiness Dashboard as workflow truth.
- Importing `~/.gstack/projects/.../ceo-plans/`.
- Importing `docs/designs/` promotion.
- Adding a new workflow stage.
- Changing `superpowers workflow status` routing logic.
- Changing `superpowers plan execution` gate semantics.
- Making outside voice a gate or approval authority.
- Claiming same-model fallbacks are cross-model review.

## Landscape Snapshot

### Layer 1

Existing Superpowers already provides the durable workflow primitives this sync should strengthen rather than replace:

- exact spec and plan header contracts
- helper-owned workflow routing
- helper-owned plan-contract approval law
- branch-scoped test-plan and QA artifacts
- generated skill-doc pipelines and doc-contract tests

### Layer 2

Upstream source was pulled directly from:

- `https://github.com/garrytan/gstack/blob/3501f5dd0388c8c065ade8364c3b7c909be035a6/plan-ceo-review/SKILL.md`
- `https://github.com/garrytan/gstack/blob/3501f5dd0388c8c065ade8364c3b7c909be035a6/plan-eng-review/SKILL.md`

The exact upstream headings to reuse are:

- `plan-ceo-review`: `### 0D. Mode-Specific Analysis`, `### 0F. Mode Selection`, `### Section 11: Design & UX Review`, `## Outside Voice — Independent Plan Challenge`, and the `## GSTACK REVIEW REPORT` replacement mechanics
- `plan-eng-review`: the coverage-graph test review, `### Test Plan Artifact`, `## Outside Voice — Independent Plan Challenge`, and the `## GSTACK REVIEW REPORT` replacement mechanics

### Layer 3

Superpowers should reuse those upstream blocks directly where they are already good, but must remap them onto Superpowers' artifact and helper contracts:

- spec/plan markdown stays authoritative
- local helper state stays rebuildable and non-authoritative
- existing execution gates must keep reading only the artifact headers they already trust

### Decision impact

The implementation should copy the relevant upstream sections as directly as possible into Superpowers' skill templates, then apply only these adaptations:

- rename local-state artifacts to authoritative spec/plan summary sections
- remove references to dashboard, `ceo-plans`, `docs/designs/`, and separate design-review skills
- preserve Superpowers header contracts, branch-scoped QA artifacts, and helper-owned approval law

## Architecture Boundary

This sync belongs primarily in the skill layer, not the Rust runtime.

```text
upstream gstack source blocks
        |
        v
Superpowers SKILL.md.tmpl edits
        |
        +--> plan-ceo-review
        +--> plan-eng-review
        +--> writing-plans (additive read only)
        +--> qa-only (additive read only)
        |
        v
repo-visible spec / plan / test-plan artifacts
        |
        +--> existing workflow helpers read current headers
        +--> existing execution gates read current artifact headers
        |
        v
Rust workflow and execution state machine unchanged
```

The design rule is:

- behavior changes live in skill instructions
- contract compatibility is proven by tests
- helper/runtime code changes happen only if a test demonstrates a concrete incompatibility

## Review Flow

The sync must preserve the current user-visible planning chain while deepening the review semantics inside the owning stages.

```text
brainstorming
   |
   v
plan-ceo-review
   |
   +--> Step 0 modes now include SELECTIVE EXPANSION
   +--> UI-scope work may trigger Section 11 design-intent review
   +--> optional outside voice may challenge the review
   +--> trailing `## CEO Review Summary` persisted in the spec
   |
   v
writing-plans
   |
   +--> may read CEO review summary as additive context only
   |
   v
plan-eng-review
   |
   +--> coverage-graph review replaces the looser test review
   +--> richer test-plan artifact emitted with backward-compatible headers
   +--> optional outside voice may challenge the review
   +--> trailing `## Engineering Review Summary` persisted in the plan
   |
   v
qa-only / execution gates
   |
   +--> may read richer handoff context additively
   +--> still trust the existing artifact headers and finish-gate contracts
```

## Upstream Source Map

### Spec 01: Artifact-native planning review summaries

Source upstream from the `## GSTACK REVIEW REPORT` write/replace mechanics in both:

- `plan-ceo-review/SKILL.md`
- `plan-eng-review/SKILL.md`

Carry forward directly:

- search for the generated review section anywhere in the artifact
- replace from the generated heading through the next `## ` heading or EOF
- append if absent
- always move the section to the end

Adapt for Superpowers:

- `## CEO Review Summary` in the spec
- `## Engineering Review Summary` in the plan
- no dashboard
- no `gstack-review-read`
- no local review-log truth

### Spec 02: CEO selective expansion mode

Source upstream from `plan-ceo-review/SKILL.md`:

- frontmatter description with four modes
- philosophy block
- `### 0D. Mode-Specific Analysis`
- `### 0E. Temporal Interrogation`
- `### 0F. Mode Selection`
- architecture / observability / deployment / future-section additions
- delight-opportunity handling
- mode quick reference table

Carry forward directly:

- HOLD-first selective expansion semantics
- one candidate, one decision
- neutral recommendation posture
- accepted candidates become normal plan scope for later sections

Adapt for Superpowers:

- apply the mode to the spec review, not to a separate CEO-plan artifact
- accepted changes must patch the authoritative spec body
- deferred items go to `TODOS.md`
- rejected items go to explicit `NOT in scope`

### Spec 03: CEO UI design intent pass

Source upstream from `plan-ceo-review/SKILL.md`:

- UI-scope detection
- `### Section 11: Design & UX Review (skip if no UI scope detected)`

Carry forward directly:

- information architecture check
- interaction-state map
- user-journey coherence
- anti-slop specificity
- responsive intent
- accessibility basics
- required ASCII user-flow/state diagram

Adapt for Superpowers:

- keep it inside `plan-ceo-review`
- do not reference `/plan-design-review` or `/design-review`
- unresolved UI ambiguity keeps the spec in `Draft`
- summary field becomes `**UI Design Intent Required:** yes|no`

### Spec 04: ENG coverage graph and rich QA handoff

Source upstream from `plan-eng-review/SKILL.md`:

- the branch-by-branch coverage graph test review
- required browser-facing prompts
- regression rule
- E2E / eval decision matrix
- `### Test Plan Artifact`

Carry forward directly:

- trace every codepath and user flow
- classify each path as automated, manual QA, or explicitly not required
- treat regression gaps as mandatory
- use a coverage graph rather than a loose branch list

Adapt for Superpowers:

- preserve current required test-plan headers
- preserve current four core sections
- preserve the current Superpowers artifact naming shape under `$_SP_STATE_DIR/projects/$SLUG/{user}-{safe-branch}-test-plan-{datetime}.md`
- add richer sections only additively
- keep `qa-only` backward compatible
- keep browser QA conditional, not universal

### Spec 05: Planning outside voice

Source upstream from both review skills:

- `## Outside Voice — Independent Plan Challenge (optional, recommended)`

Carry forward directly:

- offer once after normal review sections complete
- use `codex exec` when available
- fall back to an independent fresh-context reviewer when not
- surface cross-model tension explicitly
- keep all errors non-blocking

Adapt for Superpowers:

- only the main review agent may adopt findings, patch artifacts, or gate approval
- persist the compact outcome inside the new review-summary section
- for v1, supported truthful source labels are `cross-model` and `fresh-context-subagent`; reserve `alternate-reviewer` for a future transport that actually exists in Superpowers
- do not import upstream review-log writes or dashboard rows

## Proposed Changes

### 1. Add generated review summaries to authoritative artifacts

Modify `skills/plan-ceo-review/SKILL.md.tmpl` and `skills/plan-eng-review/SKILL.md.tmpl` so each review writes a single generated summary section at the end of the authoritative artifact.

Required summary behavior:

- exact generated anchors are `## CEO Review Summary` and `## Engineering Review Summary`
- generated section is always the last section
- replacement matches from the generated heading through the next `## ` heading or EOF
- reruns replace the existing generated section instead of duplicating it
- if the section was found mid-file, the regenerated version is moved to the end
- if the write races with another file change, re-read the artifact and retry once
- summary is descriptive, not approval law
- protected-branch `repo-file-write` rules apply before writing the summary
- if approval headers are also changing, the existing `approval-header-write` flow still applies separately

Required CEO summary fields:

- `Review Status`
- `Reviewed At`
- `Review Mode`
- `Reviewed Spec Revision`
- `Critical Gaps`
- `UI Design Intent Required`
- `Outside Voice`
- accepted changes / deferred items / required diagrams / unresolved decisions

Required ENG summary fields:

- `Review Status`
- `Reviewed At`
- `Review Mode`
- `Reviewed Plan Revision`
- `Critical Gaps`
- `Browser QA Required`
- `Test Plan Artifact`
- `Outside Voice`
- key findings / deferred items / required diagrams / execution preflight notes / unresolved decisions

### 2. Upgrade CEO review with direct upstream selective-expansion and UI-review content

Modify `skills/plan-ceo-review/SKILL.md.tmpl` by pulling directly from upstream and adapting in place:

- four-mode description and philosophy
- selective-expansion Step 0 analysis and mode selection
- section-specific selective-expansion additions
- UI scope detection before Step 0
- Section 11 design review after current Section 10
- completion summary row for Section 11
- four-column mode table

Behavior requirements:

- accepted selective-expansion candidates must patch the spec body before approval
- if accepted changes materially alter an approved spec, increment `Spec Revision` and return to `Draft`
- UI gaps that are straightforward should be patched directly
- unresolved design tradeoffs should stay human-owned

### 3. Upgrade ENG review with the direct upstream coverage graph and richer test-plan artifact

Modify `skills/plan-eng-review/SKILL.md.tmpl` by pulling directly from upstream and adapting in place:

- replace the current test-review section with the coverage-graph flow
- replace the current test-plan artifact block with the richer upstream version, but keep Superpowers' required headers and existing core sections intact

Behavior requirements:

- all meaningful branches and user-visible states need automated coverage, manual QA, or explicit written justification
- browser-facing work explicitly checks repeat actions, navigate-away, stale state, slow path, visible error states, and scale edges
- non-browser work explicitly checks contracts, retries, replay, compatibility, and rollback-safe verification
- the richer artifact sections remain optional and additive

### 4. Add outside-voice prompt files and integrate the flow in both review skills

Add:

- `skills/plan-ceo-review/outside-voice-prompt.md`
- `skills/plan-eng-review/outside-voice-prompt.md`

Then insert the outside-voice section in both review skills after the normal review sections and before the final approval / execution handoff.

Behavior requirements:

- offer once per review run unless the user explicitly reruns it
- truthful source labels only
- main review agent decides adopt / defer / skip
- outside-voice outcome persists only as additive summary content

### 5. Keep downstream readers additive-only

Make minimal additive changes in:

- `skills/writing-plans/SKILL.md.tmpl`
- `skills/qa-only/SKILL.md.tmpl`

Rules:

- `writing-plans` may read `## CEO Review Summary` as additive context only
- `qa-only` may read richer test-plan sections and `## Engineering Review Summary` as additive context only
- neither skill may treat those additions as approval or finish-gate truth

### 6. Regenerate docs and update public documentation

After the template changes:

- regenerate `SKILL.md` files with `node scripts/gen-skill-docs.mjs`
- update `README.md`, `docs/README.codex.md`, and `docs/README.copilot.md` only where capability/discoverability text must match the new review behavior

## Security And Trust Boundaries

This sync changes prompt instructions and review flows, so its primary security surface is trust-boundary discipline rather than data-path authorization.

Required trust rules:

- upstream `gstack` content is source material, not executable truth; every carried-forward block must be reviewed for pathing, command, and workflow-stage references before it lands in Superpowers
- no imported block may introduce writes to local non-authoritative review state, alternate approval records, or hidden workflow memory
- outside-voice transport may only receive the current spec or plan content plus the bounded reviewer prompt; it must not receive unrelated repo context, secrets, local state paths, or hidden workflow approvals
- when the prompt payload is truncated for size, the skill must say so explicitly rather than pretending a full independent review happened
- truthful source labeling is mandatory; same-context or same-model fallbacks must not be presented as independent cross-model review
- `qa-only`, `writing-plans`, and downstream execution helpers must continue treating summaries and richer handoff sections as advisory-only context, not authorization to skip the authoritative gates

Security review checks for implementation:

- imported commands use canonical Superpowers helpers or existing repo-native commands only
- no leftover `~/.gstack`, `gstack-review-read`, dashboard, or `docs/designs` references survive regeneration
- outside-voice prompt files remain terse and bounded; they do not ask the reviewer to mutate artifacts directly

## Failure And Edge-Case Behavior

- If the pinned upstream `gstack` sections are no longer present at the cited commit/path, stop and revalidate the source selection before implementing. Do not silently paraphrase from memory and still call it a direct sync.
- If a directly carried-forward upstream block still contains `gstack`-specific commands, paths, artifact names, or workflow-stage references after adaptation, treat that as a review-blocking defect. Generated skill docs and contract tests should fail closed until those references are removed or remapped.
- If a review-summary write races with another spec or plan edit, re-read the artifact, rebuild the generated summary from the post-edit state, and retry once. If the second attempt still fails, keep the artifact in `Draft` and surface the failure instead of claiming the summary is current.
- If a review run ends with open issues, the summary section must still be written with `Review Status: issues_open`; approval headers must not flip.
- If outside voice is unavailable, times out, returns empty output, or fails authentication, record `Outside Voice: unavailable`, state the failure plainly, and continue the main review flow without blocking approval on that transport.
- If richer ENG test-plan sections are absent, `qa-only` must continue operating from the existing required headers and four core sections.
- If parser or execution-gate regression tests disprove the current compatibility assumption, the implementation must expand scope just enough to land the smallest Rust fix required to preserve the documented artifact contract before merge.

### Error / Rescue Map

```text
SURFACE / STEP                                | FAILURE MODE                                  | EXPECTED CLASS / STATUS              | RESCUE / RESPONSE
----------------------------------------------|-----------------------------------------------|-------------------------------------|-----------------------------------------------
Upstream source lookup                        | pinned heading/path missing or changed        | review-blocking manual source drift | stop, revalidate source, update spec before impl
Generated skill-doc regeneration              | adapted text still contains gstack-only refs  | doc/test failure                    | fail closed, patch templates, regenerate again
Spec / plan parsing with summaries            | trailing summary breaks parser assumptions    | InstructionParseFailed              | add regression, then smallest Rust fix if needed
Plan-contract analysis after summary writes   | trailing summary breaks task/coverage parsing | invalid contract / InstructionParseFailed | repair parser/fixtures before merge
Review-summary artifact write                 | protected branch or malformed approval scope  | blocked / ApprovalScopeMismatch / MalformedApprovalRecord | route through repo-safety approval or branch change
Review-summary artifact write                 | stale concurrent file mutation                | StaleMutation or retry exhaustion   | re-read once, retry once, keep Draft if still stale
ENG richer test-plan artifact                 | finish gate no longer recognizes artifact     | QaArtifactNotFresh                  | restore header contract or smallest gate-compatible fix
Outside voice transport                       | auth / timeout / empty / missing transport    | non-blocking unavailable            | record unavailable, continue main review
Workflow routing after spec review            | summary prose confuses route derivation       | should not occur                    | treat as runtime regression and add targeted coverage
```

Rescue rules:

- Approval authority remains the exact existing headers and helper contracts even when any additive surface fails.
- Non-authoritative additions may fail closed for freshness or presence, but they must not silently escalate into new approval law.
- Any helper/runtime fix triggered by this project must preserve the current failure classes and fail-closed posture rather than inventing a parallel status model.

## Operational Visibility

This project is mostly skill-layer behavior, so the operational signals are test and artifact driven rather than helper-telemetry driven.

Required visibility signals:

- regenerated `SKILL.md` diffs clearly show the imported upstream review sections and their Superpowers-specific adaptations
- `tests/runtime_instruction_contracts.rs` and `tests/codex-runtime/skill-doc-contracts.test.mjs` fail closed when generated docs or public workflow wording drift from the approved contract
- `tests/contracts_spec_plan.rs` proves trailing CEO/ENG review summaries do not break artifact parsing
- `tests/plan_execution.rs` proves richer additive test-plan sections do not break finish-gate artifact validation
- the generated `## CEO Review Summary` and `## Engineering Review Summary` sections themselves provide durable human-readable review state inside the authoritative artifacts

## Rust Runtime Impact

No Rust state-machine change is required for the intended v1 sync.

### Why no workflow/status change is needed

`src/workflow/status.rs` routes on current spec and plan headers, not on review-summary sections. The new summaries are additive trailing sections and do not alter the approved-header contract.

### Why no spec-parser change is needed

`src/contracts/spec.rs` parses:

- `Workflow State`
- `Spec Revision`
- `Last Reviewed By`
- the `## Requirement Index`

It stops requirement parsing at the next `## ` heading, so a trailing `## CEO Review Summary` section is compatible.

### Why no plan-contract/state-machine change is needed

`src/contracts/plan.rs` parses:

- plan headers
- the `## Requirement Coverage Matrix`
- canonical `## Task N:` blocks

The new `## Engineering Review Summary` section is trailing and additive. Current parsing should tolerate it because task parsing keys off task headings and required task fields, not a terminal document schema.

### Why no execution gate change is needed

`src/execution/state.rs` finish gating validates the current branch test-plan and QA-result artifact headers:

- title
- `Source Plan`
- `Source Plan Revision`
- `Branch`
- `Repo`
- `Browser QA Required`
- `Source Test Plan`
- `Result`

It does not parse the optional body sections of the test-plan artifact. That means richer QA handoff sections are already compatible with the current gate.

### Required regression proof

Even though no Rust change is expected, the PR must prove compatibility with tests:

1. spec parsing succeeds with a trailing `## CEO Review Summary`
2. plan parsing and `analyze-plan` succeed with a trailing `## Engineering Review Summary`
3. execution finish gating still succeeds when the test-plan artifact contains the richer optional sections

### Contingency rule

If a regression test disproves the compatibility assumption, make the smallest possible Rust fix to preserve the current authority model. Do not expand the runtime surface unless tests force it.

## Files To Change

- `skills/plan-ceo-review/SKILL.md.tmpl`
- `skills/plan-eng-review/SKILL.md.tmpl`
- `skills/plan-ceo-review/outside-voice-prompt.md`
- `skills/plan-eng-review/outside-voice-prompt.md`
- `skills/writing-plans/SKILL.md.tmpl`
- `skills/qa-only/SKILL.md.tmpl`
- regenerated `skills/plan-ceo-review/SKILL.md`
- regenerated `skills/plan-eng-review/SKILL.md`
- regenerated `skills/writing-plans/SKILL.md`
- regenerated `skills/qa-only/SKILL.md`
- `README.md`
- `docs/README.codex.md`
- `docs/README.copilot.md`
- `tests/runtime_instruction_contracts.rs`
- `tests/codex-runtime/skill-doc-contracts.test.mjs`
- `tests/contracts_spec_plan.rs`
- `tests/plan_execution.rs`

## Validation Strategy

The implementation should leave fresh evidence across four layers:

### 1. Template / generated-doc integrity

- regenerate skill docs with `node scripts/gen-skill-docs.mjs`
- verify generated docs are current with `node scripts/gen-skill-docs.mjs --check`

### 2. Public workflow / doc-contract integrity

- run the Rust and JS doc-contract suites that assert workflow wording, generated-skill structure, and protected-branch write-gate language remain coherent:
  - `cargo test --test runtime_instruction_contracts`
  - `node --test tests/codex-runtime/skill-doc-contracts.test.mjs`

### 3. Artifact-parser and contract compatibility

- extend and run parser/contract coverage so trailing review summaries do not break the existing artifact contracts:
  - `cargo test --test contracts_spec_plan`

Required assertions:

- specs with a trailing `## CEO Review Summary` still parse
- plans with a trailing `## Engineering Review Summary` still parse
- `analyze-plan` still reports valid coverage and task structure for compatible plans

### 4. Finish-gate artifact compatibility

- extend and run execution-gate coverage so richer additive ENG test-plan sections do not break finish readiness:
  - `cargo test --test plan_execution`

Required assertions:

- the existing required test-plan headers still drive the finish gate
- richer additive sections do not cause `QaArtifactNotFresh`
- `qa-only` compatibility remains additive rather than mandatory

## Risks And Mitigations

### Risk: accidental reinvention instead of direct sync

Mitigation:

- pin the upstream commit in the implementation notes
- copy included upstream sections directly, then adapt only the pathing, authority, and workflow-stage references

### Risk: summary sections start acting like approval truth

Mitigation:

- repeat in both review skills and downstream readers that summaries are descriptive only
- leave approval law anchored to existing headers and `analyze-plan`

### Risk: parser edge case in the last plan task

Mitigation:

- add regression tests before assuming compatibility
- only change Rust if the tests demonstrate an actual parsing problem

### Risk: outside voice availability is inconsistent across environments

Mitigation:

- keep it optional and non-blocking
- label source truthfully
- fall back cleanly to a fresh-context reviewer or `unavailable`

## Rollout And Rollback

### Rollout

- land as one sync-style PR on `dm/sync-features`
- regenerate skill docs in the same PR
- require contract and artifact-compatibility tests to pass before merge
- no runtime migration or state rewrite is required

### Rollback

- revert the PR
- no database, state-file, or helper migration rollback is needed
- branch-scoped test-plan and QA artifacts remain compatible because core headers stay unchanged

## Acceptance Criteria

1. CEO and ENG reviews write durable summary sections into the authoritative spec/plan artifact.
2. `plan-ceo-review` exposes `SELECTIVE EXPANSION` with upstream HOLD-first cherry-pick semantics.
3. `plan-ceo-review` runs a UI-scope-gated design-intent section without introducing separate design-review workflow stages.
4. `plan-eng-review` uses a coverage graph and emits richer additive QA handoff sections without changing the required artifact headers.
5. Both review skills can offer an optional outside voice with truthful source labeling and non-blocking failure behavior.
6. `writing-plans` and `qa-only` consume the new material only as additive context.
7. No Rust workflow/status or execution-gate changes are needed unless a regression test proves a concrete incompatibility.
8. The PR sources the included semantics directly from upstream `gstack` commit `3501f5dd0388c8c065ade8364c3b7c909be035a6` rather than rephrasing them from memory.

## Requirement Index

- [REQ-001][behavior] `plan-ceo-review` must write a single trailing `## CEO Review Summary` section into the authoritative spec using replace-not-append semantics on rerun.
- [REQ-002][behavior] `plan-eng-review` must write a single trailing `## Engineering Review Summary` section into the authoritative plan using replace-not-append semantics on rerun.
- [REQ-003][behavior] `plan-ceo-review` must import upstream `SELECTIVE EXPANSION` behavior directly, including HOLD-first review discipline and one-candidate-per-decision cherry-pick flow.
- [REQ-004][behavior] `plan-ceo-review` must import the upstream UI design-intent review directly, gated by detected UI scope and without adding a separate design-review stage.
- [REQ-005][behavior] `plan-eng-review` must import the upstream coverage-graph review and richer test-plan artifact directly while preserving Superpowers' current required test-plan headers and core sections.
- [REQ-006][behavior] Both planning review skills must support an optional outside voice that is informative by default, truthfully labeled, and only becomes gating when the main review explicitly adopts a finding.
- [REQ-007][behavior] `writing-plans` and `qa-only` must treat new summary and rich-handoff material as additive context only.
- [DEC-001][decision] Included planning-review semantics are pulled directly from `garrytan/gstack` commit `3501f5dd0388c8c065ade8364c3b7c909be035a6` and adapted only where Superpowers' authority model, artifact paths, or helper contracts differ.
- [DEC-002][decision] Superpowers' Rust workflow/status, plan-contract, and execution-gate state machine remain unchanged unless regression tests prove an incompatibility.
- [NONGOAL-001][non-goal] Do not import JSONL review logs, the Review Readiness Dashboard, `ceo-plans`, `docs/designs` promotion, or a new workflow stage.
- [VERIFY-001][verification] Regression coverage must prove spec parsing, plan parsing, analyze-plan behavior, and finish-gate artifact checks still pass with trailing review summaries and richer additive test-plan sections.

## CEO Review Summary

**Review Status:** clear
**Reviewed At:** 2026-03-24T13:42:28Z
**Review Mode:** hold_scope
**Reviewed Spec Revision:** 1
**Critical Gaps:** 0
**UI Design Intent Required:** no
**Outside Voice:** skipped

### Accepted changes

- Pinned the sync to direct upstream `garrytan/gstack` source blocks and documented the exact carry-forward sections.
- Specified generated summary write behavior, including trailing-section placement, replace-not-append semantics, and a single retry on stale writes.
- Clarified ENG artifact compatibility boundaries, including preserved test-plan naming and truthful outside-voice source labels for v1.
- Added explicit security, edge-case, error-rescue, and validation sections so the sync can land as one PR without implicit runtime drift.

### Deferred to TODOS

- none

### Required diagrams

- Architecture Boundary
- Review Flow

### Unresolved decisions

- none
