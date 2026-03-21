# Skill-Layer Delivery Governance

**Workflow State:** CEO Approved
**Spec Revision:** 1
**Last Reviewed By:** plan-ceo-review

## Summary

Incorporate the highest-value parts of the delivery SOP into Superpowers without changing the current runtime authority model.

This change is intentionally narrow:

1. keep spec, plan, and execution truth exactly where they already live
2. raise the quality bar through stronger skill guidance and approval-blocking review criteria
3. update docs, tests, and dedicated reference surfaces so the new standard is visible and durable

The approved direction for this project is:

- skill-layer only, not helper-backed workflow expansion
- approval-blocking review criteria, not advisory-only guidance
- preserve historical approved and executed artifacts; use dedicated reference surfaces instead

## Problem

Superpowers already has strong workflow governance for routing, approvals, stale-plan detection, and execution evidence, but it is uneven in one important way: the quality bar for what a good spec or plan must contain is not yet consistently enforced.

Today:

- the runtime enforces exact approval headers and conservative stage routing
- execution truth is strict and fail-closed
- many checked-in specs and plans are already high quality
- but the workflow does not consistently require explicit treatment of interfaces, failure behavior, observability, rollout, rollback, risks, and acceptance criteria
- the repo does not yet express those expectations as a durable contributor standard across the relevant skills, docs, and examples

That gap matters because Superpowers is strongest when repo truth is simple and fail-closed while human review is rigorous. Missing delivery-content expectations weaken the written artifacts without any runtime failure ever surfacing it.

## Goals

- Preserve the current Superpowers runtime boundary and authority model.
- Raise the minimum quality bar for written specs before CEO approval.
- Raise the minimum quality bar for written plans before engineering approval.
- Make richer delivery content approval-blocking at review time without making authored markdown parser-fragile.
- Translate the strongest parts of the SOP's Gate A, Gate B, and Gate F checklists into existing Superpowers review stages.
- Add lightweight domain overlays that sharpen review and QA expectations by change type.
- Strengthen release-readiness expectations through existing skills rather than new authoritative artifact classes.
- Update docs, tests, and dedicated reference surfaces so the new standard is discoverable in-repo without rewriting workflow history.

## Not In Scope

- Extending `superpowers-workflow-status` beyond its current product-workflow boundary.
- Extending `superpowers-plan-execution` into review, QA, release, or closeout state ownership.
- Adding new authoritative artifact classes such as `reviews/`, `releases/`, or `retros/`.
- Adopting the SOP's intake record, release artifact, or retrospective artifact as new required repo truth.
- Replacing the current exact-header markdown contract with YAML-frontmatter approval state.
- Adopting the SOP's recommended PR template as an authoritative workflow artifact.
- Broad historical backfill of all existing checked-in specs and plans.
- Retrofitting already implemented approved plans or specs just to make them look like examples.
- Changing the current execution handoff boundary at `implementation_ready`.

## Architecture Boundary

This change preserves the current Superpowers authority model:

- spec approval truth remains the exact spec headers in repo docs
- plan approval truth remains the exact plan headers in repo docs
- execution truth remains the approved plan checklist plus execution evidence
- branch-scoped manifests remain rebuildable local indexes, not approval authorities

No runtime helper becomes responsible for broader delivery lifecycle state. In particular:

- `superpowers-workflow-status` continues to reason only about bootstrap, spec, plan, and implementation handoff state
- `superpowers-plan-execution` continues to own only execution-state truth after an approved plan handoff
- `implementation_ready` remains the terminal routing state before execution handoff

The delivery SOP is incorporated through skill behavior, review expectations, documentation, and examples rather than through expanded helper-owned state.

## Existing Context

The existing Superpowers workflow already provides the right substrate for this work:

- `brainstorming` writes draft specs and hands off to CEO review
- `plan-ceo-review` owns written-spec approval
- `writing-plans` writes draft implementation plans from CEO-approved specs
- `plan-eng-review` owns plan approval and execution handoff
- `document-release` audits documentation and release-history changes after implementation
- `finishing-a-development-branch` already enforces review and execution-state gates before completion

This means the right abstraction is to improve what those stages require from human-authored artifacts, not to invent parallel workflow state.

## Proposed Changes

### 1. Stronger Spec Expectations

Update `brainstorming` so its design output guidance explicitly expects the written spec to cover:

- problem statement, desired outcome, and why the work matters
- scope and out-of-scope
- affected users, systems, and interfaces
- current versus desired behavior when relevant
- constraints and dependencies when they shape the solution
- impacted data, state, or contracts when relevant
- failure and edge-case behavior
- observability expectations
- rollout and rollback expectations
- risks and mitigations
- testable acceptance criteria

These expectations are content requirements for the written artifact, not new approval headers. They are the flexible Superpowers translation of the SOP's spec template plus Gate A checklist, not a new parser contract.

### 2. CEO Review As the Approval Gate for Delivery Content

Update `plan-ceo-review` so approval is blocked when a written spec materially lacks:

- a clear problem statement and desired outcome
- clear scope boundaries
- key constraints, dependencies, or impacted interfaces when they matter
- explicit failure-mode thinking
- observability expectations when new behavior or operations are introduced
- rollout and rollback expectations
- credible risks
- testable acceptance criteria

The written spec may vary in section naming or exact prose shape as long as the content is present and reviewable. In practice, `plan-ceo-review` should treat the SOP's Gate A checklist as the review floor while preserving the current Superpowers approval headers.

### 3. Stronger Plan Expectations

Update `writing-plans` so implementation plans explicitly cover:

- change surface
- preconditions
- execution strategy
- ordered implementation steps
- evidence expectations
- validation strategy
- documentation updates
- rollout plan
- rollback plan
- risks and mitigations

The existing exact plan header contract stays unchanged. This is the flexible Superpowers translation of the SOP's implementation-plan template and Gate B checklist, not a new structured metadata contract.

### 4. ENG Review As the Approval Gate for Plan Readiness

Update `plan-eng-review` so engineering approval is blocked when a plan materially lacks:

- a clear change surface
- explicit preconditions where execution depends on setup, environment, or migration state
- ordered implementation steps that are detailed enough to execute without invention
- meaningful validation strategy
- documentation update expectations
- rollout and rollback thinking
- evidence expectations for meaningful work slices
- explicit risks where the planned change introduces operational, architectural, or delivery risk

This enforcement remains review-based, not parser-based. Missing content blocks approval; alternate heading names do not. In practice, `plan-eng-review` should treat the SOP's Gate B checklist as the review floor while preserving the current Superpowers approval headers and execution handoff model.

### 5. Domain Overlays As Review Guidance

Add lightweight domain overlays to sharpen review and QA expectations by change type.

Initial overlays:

- web/UI
- API/service/backend
- data/ETL
- infrastructure/IaC
- library/SDK

Each overlay should carry concrete review prompts lifted from the SOP rather than just a label:

- web/UI:
  user flow, navigation impact, empty/loading/error states, accessibility impact, responsive behavior, browser and flow validation
- API/service/backend:
  request/response contracts, backward compatibility, error semantics, timeouts/retries/rate limits, contract tests, compatibility checks
- data/ETL:
  schema evolution, source/sink compatibility, data quality expectations, backfill or reprocessing needs, downstream compatibility
- infrastructure/IaC:
  blast radius, environment impact, security or policy impact, drift implications, rollback practicality, preview or post-change verification
- library/SDK:
  public API changes, semantic-versioning impact, consumer migration impact, breaking changes, compatibility and packaging validation

These overlays do not become standalone workflow stages or standalone artifact classes. They are review lenses that help:

- `plan-eng-review` ask better domain-specific questions
- `qa-only` receive more useful handoff guidance
- contributors understand what domain-specific completeness looks like

For QA policy, Superpowers should translate the SOP's Gate E principle narrowly:

- require `qa-only` when the approved plan, branch-specific test-plan artifact, or change surface clearly indicates browser-facing behavior or browser interaction
- keep QA guidance strong but non-mandatory for non-browser workflow-routed work
- do not turn `qa-only` into a universal workflow gate for all change types

### 6. Release-Readiness Through Existing Skills

Strengthen `document-release` with an explicit release-readiness pass that checks for:

- refreshed docs where behavior changed
- release notes or equivalent release-history updates where appropriate
- rollout notes when the change meaningfully affects release or operations
- rollback notes when rollback is non-trivial
- known risks or operator-facing caveats when they matter
- monitoring or verification expectations when the change introduces operational risk

For workflow-routed implementation work, require a `document-release` pass before branch completion. This is a skill-layer gate, not a new helper-owned workflow state.

Strengthen `finishing-a-development-branch` so it treats a completed `document-release` pass as part of the normal pre-completion flow for workflow-routed work, while still leaving release-readiness truth in repo docs and human review rather than in runtime helper state.

At branch completion time, `finishing-a-development-branch` should enforce a short Gate F-style confirmation rather than a mere “did the skill run?” check. The confirmation should verify, at a concise level, that:

- documentation has been refreshed
- release notes or equivalent release-history updates are ready
- rollout and rollback are addressed
- known risks are documented
- monitoring or verification expectations are addressed when relevant

Neither change introduces a new authoritative release artifact. In practice, this is the Superpowers translation of the SOP's Gate F release-readiness checklist into existing post-implementation skills.

## Skill-by-Skill Ownership

### `brainstorming`

- owns producing richer draft specs
- does not own approving them
- does not change runtime helper behavior

### `plan-ceo-review`

- owns approval of the richer written spec
- blocks approval when required delivery content is materially missing
- does not change the exact approval header contract

### `writing-plans`

- owns producing richer implementation plans from approved specs
- keeps the current exact plan header contract
- does not create new workflow state or artifact types

### `plan-eng-review`

- owns approval of the richer written plan
- applies domain overlays as review lenses
- writes better QA handoff artifacts where applicable
- does not change execution-state ownership

### `document-release`

- owns the stronger release-readiness documentation pass
- becomes a required pre-completion handoff for workflow-routed implementation work
- remains conservative and diff-driven
- does not become an approval authority

### `finishing-a-development-branch`

- reinforces that the required `document-release` pass happened before completion for workflow-routed work
- performs a short Gate F-style release-readiness confirmation before completion instead of merely checking that the handoff occurred
- requires the existing QA handoff when the change type or test-plan artifact clearly warrants browser QA
- remains downstream of review/execution truth
- does not become a new delivery-state router

## Review Model

The enforcement model for this project is:

- approval-blocking review criteria
- flexible authored markdown structure
- unchanged parser-critical headers

This means:

- reviewers must fail closed when key delivery content is absent
- contributors may express that content with different section names when the material is still explicit and reviewable
- runtime helpers do not parse new freeform content areas

That balance preserves Superpowers' strongest current property: simple, exact machine-readable workflow truth with richer human review discipline layered on top.

The corresponding boundary is explicit:

- adopt Gate A, Gate B, and Gate F as review logic
- adopt Gate E as conditional QA logic based on change type, not as a universal gate
- do not adopt Gate C, Gate D, Gate E, or Gate G as new helper-owned workflow stages
- do not introduce new authoritative artifact classes for review, release, or closeout state

## Docs, Tests, and Reference Surfaces

### Tests

Update workflow-contract tests so they assert that the relevant skills now require richer delivery content.

Primary test surfaces:

- `tests/codex-runtime/test-workflow-sequencing.sh`
- `tests/codex-runtime/test-runtime-instructions.sh`

The tests should verify skill-contract presence and doc-surface alignment, not exact user-authored markdown section names inside arbitrary specs or plans.

In particular, the tests should make it hard for the repo to drift on:

- Gate A-derived spec expectations
- Gate B-derived plan expectations
- Gate F-derived release-readiness expectations
- domain overlay presence inside the relevant review skills

No new helper-state regression matrix is required because helper behavior is intentionally unchanged.

### Docs

Update contributor-facing docs, including `README.md`, so the repo explains:

- the runtime authority model is unchanged
- the workflow now expects richer spec and plan content
- review approval blocks on missing delivery-critical content

### Reference Surfaces

Make the new standard visible through dedicated reference surfaces rather than through retroactive edits to already implemented approved artifacts.

The reference-surface policy for this change is:

- preserve historical approved and executed specs/plans as historical records
- prefer checklist surfaces and contributor-facing docs when modeling the new standard
- avoid broad historical cleanup

The expected first pass is:

- one review-facing checklist surface as the primary modeled governance artifact
- contributor-facing docs that explain the new standard

PR-template-style guidance may be added later, but it is not required for this first pass.

## Failure Modes

| Failure mode | Handling |
| --- | --- |
| A spec has correct approval headers but omits rollout, rollback, or acceptance criteria | `plan-ceo-review` must keep it in `Draft` until fixed |
| A plan has correct headers but weak validation or missing rollout/rollback thinking | `plan-eng-review` must keep it in `Draft` until fixed |
| A spec or plan uses different headings but still contains the required material | approval may proceed |
| Contributors assume runtime helpers will enforce the new content | docs and skill text must state clearly that enforcement is review-based |
| The review skills mention overlays only as names, so they do not materially raise review quality | copy concrete overlay checks from the SOP into the review guidance |
| QA policy becomes either too weak or too universal | require `qa-only` only when browser-facing behavior or explicit test-plan context warrants it |
| Historical approved artifacts get rewritten to act as examples | preserve them as historical records and add dedicated reference surfaces instead |
| Domain overlays grow into parallel workflow stages | reject; overlays remain guidance inside existing review skills |
| This work accidentally expands runtime ownership | reject; helpers and routing boundaries remain unchanged |

## Rollout

Roll this out in one focused workflow change:

1. update the relevant skills and generated skill docs
2. update the contributor-facing docs
3. update workflow contract tests
4. add or update dedicated reference surfaces that model the new standard without rewriting historical approved artifacts

There is no runtime-state migration, manifest migration, or execution migration required.

## Rollback

Rollback is straightforward because this project does not change helper-owned state:

- revert the skill/doc/test/reference-surface changes
- keep existing runtime helpers unchanged
- no delivery-state repair is required

## Risks

| Risk | Likelihood | Impact | Mitigation |
| --- | --- | --- | --- |
| The new expectations become vague prompt bloat instead of a real review gate | Medium | High | Make the criteria explicit in `plan-ceo-review` and `plan-eng-review`, and back them with workflow tests |
| The repo drifts into parser-enforced prose structure accidentally | Medium | Medium | Preserve the current exact-header contract and state clearly that new sections are review-enforced, not parser-enforced |
| Contributors do not see the new standard clearly enough in-repo | Medium | Medium | Update the checklist surface, contributor-facing docs, and skill contracts so the standard is visible where contributors actually work |
| The work expands into runtime-state redesign | Low | High | Keep helper binaries and state-machine boundaries explicitly out of scope |

## Acceptance Criteria

1. Superpowers skills for brainstorming, CEO review, plan writing, ENG review, and release documentation explicitly require the new delivery-content areas appropriate to their stage.
2. CEO and ENG approval guidance fails closed on materially missing delivery-critical content while preserving the current exact approval-header contracts.
3. The runtime helpers and workflow-state machine remain unchanged in scope and authority.
4. Contributor-facing docs explain the richer workflow expectations without implying new helper-owned state.
5. Workflow-contract tests are updated to enforce the new skill/doc expectations.
6. Dedicated reference surfaces are added or updated so the new standard is visible in-repo without rewriting historical approved artifacts.

## Open Questions


## Decision Log

### Revision 1

- Preserve the current runtime boundary at `implementation_ready`
- Implement the SOP incorporation at the skill layer only
- Make the new delivery-content requirements approval-blocking review criteria
- Preserve historical approved and executed artifacts; use dedicated reference surfaces instead
