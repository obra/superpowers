# Review Accelerator

**Workflow State:** CEO Approved
**Spec Revision:** 1
**Last Reviewed By:** plan-ceo-review

## Summary

Add an opt-in accelerated review mode for:

- `superpowers:plan-ceo-review`
- `superpowers:plan-eng-review`

The accelerator uses a reviewer subagent to pressure-test one review section at a time, draft a structured section packet, and prepare a staged patch for the current spec or plan. The human remains the only approval authority:

- only the user can enable acceleration mode
- only the user can approve a section
- only the user can approve the final review outcome

Acceleration mode is not a new workflow stage. It is a faster path inside the existing CEO and ENG review stages.

## Problem

The current CEO and ENG review skills are deliberately rigorous, but the review loop can become slow and repetitive when many issues are straightforward once a strong reviewer has pressure-tested the artifact.

Today:

- review sections are designed around direct human interaction
- many routine issues still require serial question-by-question handling
- the repo has strong review and fail-closed contracts, but no first-class fast path for trusted users who want help drafting section outcomes
- a naive "YOLO" mode would be dangerous because it would weaken the approval gates that make the workflow trustworthy

The leverage point is not replacing human approval. It is compressing the routine parts of review while preserving the written artifact as the source of truth and keeping human approval at the section and final-review boundaries.

## Goals

- Add an explicit-user-only accelerated mode to both CEO review and ENG review.
- Keep the normal review path as the default.
- Use a reviewer subagent with the correct persona for the active review stage.
- Produce a section packet for each accelerated review section.
- Persist section packets as review artifacts under `~/.superpowers/projects/<slug>/...`.
- Apply a staged section patch only after the user approves that section.
- Break high-judgment issues out into direct human questions before section approval.
- Keep the written spec or plan current as the review progresses by applying approved section patches immediately.
- Preserve all existing approval and handoff invariants.
- Update `README.md` and its Mermaid workflow diagrams to document the accelerated review path accurately.

## Not In Scope

- A new public workflow stage or router status for acceleration mode.
- Automatic or heuristic activation of accelerated review.
- Sticky acceleration defaults that carry across sessions or reviews without fresh user approval.
- Automatic CEO or Engineering approval.
- Letting persisted accelerator artifacts override the written spec or plan.
- Replacing the normal question-by-question review path.
- Extending acceleration mode to execution, QA, code review, or branch-finishing flows in v1.

## Existing Context

- `plan-ceo-review` and `plan-eng-review` already own the review loops and the handoffs into the next stages.
- `superpowers-workflow-status` already keeps product-work routing conservative and fail-closed.
- The execution workflow already uses subagent review loops and treats reviewer findings as blocking until resolved.
- The repo already stores cross-session artifacts under `~/.superpowers/projects/<slug>/...`.
- The root `README.md` already documents the product workflow and its Mermaid diagrams as the supported mental model for the system.

## Decisions Captured During Brainstorming

The design locks these product decisions:

- activation is explicit and per review
- acceleration lives inside the existing `plan-ceo-review` and `plan-eng-review` skills
- the implementation shape uses shared subagent prompt/reference assets instead of a new top-level workflow skill
- high-judgment issues break out into direct human questions inside an otherwise accelerated section
- approved section patches apply immediately
- section packets persist as review artifacts
- only the user may initiate acceleration mode

## User Experience

### Activation Model

Acceleration mode must be activated explicitly by the user in the current review request.

The request must include either:

- the word `accelerated`
- the word `accelerator`
- a dedicated review command or flag that explicitly enables accelerated review for that invocation

Valid activation examples:

- "run CEO review in accelerated mode"
- "use accelerated ENG review"
- an equivalent request that explicitly includes `accelerated`, `accelerator`, or a dedicated accelerator flag for that review

Invalid activation sources:

- agent suggestion alone
- repo state
- branch name
- remembered session preference
- prior use of acceleration mode in another review
- heuristics based on artifact size or issue count
- vague speed-oriented phrasing such as "make this fast" without an explicit accelerator marker

The user may request acceleration for CEO review, ENG review, or both, but each review invocation must be explicitly enabled by the user.

### Section Boundary Contract

Accelerated review must reuse the existing section boundaries of the owning review skill. It must not invent dynamic section boundaries based on artifact size, issue count, or reviewer preference.

Upfront gates remain direct human-driven review steps and are not accelerated:

- CEO review still begins with the normal Step 0 mode-selection flow before any accelerated section packet is generated
- ENG review still begins with the normal Step 0 scope choice and approval gate before any accelerated section packet is generated

Canonical accelerated sections are:

- CEO review:
  - Architecture Review
  - Error & Rescue Map
  - Security & Threat Model
  - Data Flow & Interaction Edge Cases
  - Code Quality Review
  - Test Review
  - Performance Review
  - Observability & Debuggability Review
  - Deployment & Rollout Review
  - Long-Term Trajectory Review
- ENG review:
  - Architecture review
  - Code quality review
  - Test review
  - Performance review

Boundary rules:

- each section packet maps 1:1 to one canonical section from the owning review skill
- persisted section artifacts and resume pointers must use canonical section names
- the runtime must not merge, split, reorder, or invent new sections inside accelerated mode
- if ENG review runs in `SMALL CHANGE` mode, the accelerator may render the review more compactly, but all findings and approvals must still map back to the same four canonical ENG sections

### ENG `SMALL CHANGE` Contract

Accelerated ENG review must preserve the user's `SMALL CHANGE` choice rather than silently normalizing into `BIG CHANGE`.

Rules for accelerated `SMALL CHANGE`:

- the reviewer subagent should limit itself to the single most important issue for each canonical ENG section, or explicitly say that the section has no meaningful issue
- each canonical ENG section still produces its own section packet
- each canonical ENG section still gets its own human approval checkpoint
- the accelerator must not collapse all four ENG sections into one bundled approval round
- `SMALL CHANGE` remains compressed by review depth, not by changing approval authority or section identity

### Preserved Review Outputs And Handoffs

Acceleration mode changes the pacing of section review. It does not reduce the deliverables, required outputs, or terminal handoff behavior of the owning review skill.

Accelerated CEO review must still produce the normal CEO review outputs:

- `NOT in scope`
- `What already exists`
- `Dream state delta`
- `Error & Rescue Registry`
- `Failure Modes Registry`
- `TODOS.md` update questions
- `Delight Opportunities` in `SCOPE EXPANSION` mode
- required ASCII diagrams
- stale diagram audit
- completion summary
- unresolved decisions

Accelerated ENG review must still produce the normal ENG review outputs:

- `NOT in scope`
- `What already exists`
- `TODOS.md` update questions
- required ASCII diagrams
- failure modes review output
- completion summary
- unresolved decisions
- the QA handoff test plan artifact used by downstream QA review
- the normal execution handoff after the written plan is explicitly approved

Output rules:

- section packets do not replace required end-of-review artifacts
- TODO proposals remain one interactive human question per item
- CEO `Delight Opportunities` remain one interactive human question per item
- ENG test review still owns the QA handoff artifact generation even when the section itself is accelerated
- final approval and next-skill routing remain owned by the base CEO or ENG review skill after all required outputs are complete

### Section Packet UX

Each accelerated section produces:

1. a terminal-facing section packet
2. a persisted section artifact

The terminal packet should include:

- review kind (`CEO` or `ENG`)
- section name
- reviewer persona used
- routine issues included in the proposed patch
- high-judgment issues escalated to the human
- proposed artifact changes
- residual risks
- unresolved decisions
- the section approval question

### Section Packet Schema

The reviewer subagent must return a structured section packet with explicit required fields. V1 does not need a public runtime schema or helper-owned subsystem, but it does need a concrete validation contract between the reviewer subagent and the main review agent.

Required packet fields:

- review kind
- source artifact path
- source artifact fingerprint
- section name
- reviewer persona
- routine issues proposed for bundled handling
- escalated high-judgment issues
- exact staged patch content
- staged patch summary
- residual risks
- unresolved decisions
- section approval question

Validation rules:

- every required field must be present and parseable
- `review kind`, `source artifact path`, and `section name` must match the active review context
- `source artifact fingerprint` must match the current written artifact fingerprint used for packet generation
- the exact staged patch content must be non-empty when routine bundled changes are proposed
- escalated issues must be explicit and individually addressable
- the section approval question must be renderable as a direct human decision point

If any required field is missing, inconsistent, or malformed, the packet is invalid and the section must fall back to normal manual review handling.

The user decisions for a section are:

- approve section
- reopen one escalated issue
- fall back to manual review for this section
- stop review

### High-Judgment Mixed Mode

Acceleration mode is mixed-mode within a section:

- routine issues stay in the section packet
- high-judgment issues are broken out into direct human questions before section approval
- each escalated high-judgment issue must remain one issue per direct human question

This keeps the fast path fast without burying material product or architecture choices inside a single bundled section approval.

### High-Judgment Escalation Triggers

An issue must be escalated into a direct human question if it touches any of these categories:

- scope expansion or scope reduction that changes what ships
- approval-state changes or anything that could advance or block the workflow stage
- new TODO or deferral decisions
- security or trust-boundary changes
- rollout, migration, rollback, or operational-risk decisions
- cases where a plausible "do nothing" option still exists and the reviewer is choosing among meaningful tradeoffs rather than applying an obvious fix

Issues outside those categories may stay inside the routine section packet when the fix is straightforward and does not alter approval authority or shipped scope.

## Architecture

### Ownership Model

The main agent still owns the review. The reviewer subagent does not own approval and does not mutate approval state directly.

Write authority is main-agent-only:

- the reviewer subagent may return structured analysis, proposed patch text, and proposed packet content
- the reviewer subagent must not write the source spec or plan directly
- the reviewer subagent must not persist section artifacts, QA handoff artifacts, or approval-state artifacts directly
- only the main review agent may apply approved section patches, write persisted accelerator artifacts, write downstream handoff artifacts, or update review-state headers

Responsibilities:

- main agent:
  - detects explicit user opt-in
  - dispatches the reviewer subagent
  - renders the section packet
  - asks any escalated direct human questions
  - applies approved section patches
  - runs the normal artifact sync flow
  - controls final approval and handoff behavior
- reviewer subagent:
  - pressure-tests the current review section
  - proposes routine resolutions
  - flags high-judgment issues
  - drafts the staged patch
  - returns a structured section packet

### Reviewer Personas

Reviewer persona depends on the active review stage:

- CEO review:
  - founder/product/principal-strategy reviewer
- ENG review:
  - principal engineer reviewer

These personas are shared prompt/reference assets used by the existing review skills when accelerated mode is active.

### Control Flow

```text
user explicitly enables accelerated review
   |
   v
existing review skill owns the session
   |
   v
run review section
   |
   v
dispatch reviewer subagent for that section
   |
   v
section packet + staged patch + escalations
   |
   +--> high-judgment issue? --> direct human question(s)
   |
   v
human approves section?
   |                |
   | yes            | no
   v                v
apply section patch  fall back / reopen / stop
sync artifact
move to next section
```

### Internal Section State

Acceleration mode uses internal session state only. It does not add a public workflow stage.

Section states:

- `draft_packet`
- `awaiting_human_issue_decision`
- `awaiting_section_approval`
- `section_approved`
- `section_fallback_manual`
- `review_stopped`

```text
                        +----------------------+
                        |     draft_packet     |
                        +----------+-----------+
                                   |
                                   v
                  +----------------+----------------+
                  | escalated human issue present?  |
                  +----------------+----------------+
                                   |
                     +-------------+-------------+
                     |                           |
                    yes                          no
                     |                           |
                     v                           v
      +--------------+--------------+   +--------+---------+
      | awaiting_human_issue_decision|  |awaiting_section_ |
      +--------------+--------------+   |    approval      |
                     |                  +--------+---------+
                     | resolved                        |
                     +---------------+----------------+
                                     |
                                     v
                       +-------------+-------------+
                       | awaiting_section_approval |
                       +------+------+-------------+
                              |      |
                    approve   |      | reopen / manual fallback
                              |      |
                              v      v
                   +----------+--+  +----------------------+
                   |section_approved| |section_fallback_   |
                   +----------+--+  |manual               |
                              |      +----------+---------+
                              |                 |
                              +--------+--------+
                                       |
                                       v
                               +-------+-------+
                               | review_stopped |
                               +---------------+
```

## Artifact Model

### Authority Split

Authority remains unchanged:

- written spec and plan headers are the only approval truth
- accelerated review artifacts are diagnostic aids plus bounded section-boundary resume aids only
- only the main review agent may write authoritative review artifacts or mutate the written spec or plan

```text
                +-------------------+
                |       User        |
                | chooses mode,     |
                | answers escalated |
                | issues, approves  |
                +---------+---------+
                          |
                          v
                +---------+---------+
                |  Main Review Agent|
                | owns workflow,    |
                | validates packet, |
                | applies writes    |
                +----+----------+---+
                     |          |
      structured     |          | authoritative writes
      proposal only  |          |
                     v          v
          +----------+--+   +---+-------------------+
          | Reviewer    |   | Written Spec / Plan   |
          | Subagent    |   | source of approval    |
          | analyzes +  |   | truth                 |
          | drafts only |   +---+-------------------+
          +-------------+       |
                                | sync / approved patch
                                |
                                v
                     +----------+-------------------+
                     | Persisted Accelerator        |
                     | Section Artifacts            |
                     | diagnostic + resume aids     |
                     +------------------------------+
```

Accelerator artifacts must never:

- mark a spec as `CEO Approved`
- mark a plan as `Engineering Approved`
- override the written artifact contents
- override workflow helper routing

### Persisted Section Artifacts

Persist section packets under `~/.superpowers/projects/<slug>/...`.

Recommended v1 naming shape:

```text
~/.superpowers/projects/<slug>/{user}-{safe-branch}-{review-kind}-accelerator-{datetime}-{section-slug}.md
```

V1 does not require a separate accelerator review run ID. Packet grouping is based on repo slug, branch, review kind, canonical section name, timestamps, and source artifact fingerprint.

Each artifact should record:

- repo slug
- repo root
- branch
- review kind
- source artifact path
- source artifact workflow state
- source artifact revision
- source artifact fingerprint
- section name
- reviewer persona
- whether acceleration was explicitly user-initiated
- routine findings
- escalated issues
- exact staged patch content
- staged patch summary
- human decision for the section
- timestamp

### Retention Policy

Accelerator artifacts must use a bounded retention policy.

Retention rules:

- keep enough recent artifacts to support auditability and bounded section-boundary resume for active or recently interrupted accelerated reviews
- allow older accelerator artifacts to be pruned automatically or by a documented cleanup rule
- never let accelerator artifacts grow as an unbounded local archive by default
- never prune artifacts that are still required to resume or explain the current active accelerated review on the same repo and branch

The exact pruning mechanism is an implementation detail for v1, but the shipped behavior and documentation must make the retention boundary clear.

### Resume Contract

V1 supports bounded resume only at section boundaries.

Resume rules:

- resume is available only when the user explicitly asks to resume an accelerated review
- Superpowers may resume only from the last section that was both:
  - explicitly approved by the user
  - successfully applied to the written spec or plan
- resume must use the most recent internally consistent packet set for the same repo, branch, and review kind rather than inferring continuity across unrelated historical packets
- unapproved section packets must never be replayed as if they were approved
- stale packets must be treated as diagnostic only and regenerated if the current written artifact fingerprint differs from the packet's recorded source artifact fingerprint
- pending escalations or mid-section packet state must not be restored as active approval state

Operationally, resume may reuse persisted artifacts to explain what already happened and to skip redoing already-applied approved sections, but it must regenerate the next active section packet from the current written artifact.

### Immediate Section Application

When a section is approved:

1. apply the staged patch immediately to the draft spec or plan
2. run the normal sync flow for that artifact
3. continue with the next section using the updated written artifact

This keeps the draft current throughout review and matches the existing review model of updating the artifact before continuing.

## Safety Boundaries

The accelerator must preserve the existing review invariants:

- acceleration mode never changes workflow routing
- acceleration mode never changes approval authority
- only the user can initiate acceleration mode
- only the user can approve a section
- only the user can approve the final review outcome
- the written spec or plan remains in `Draft` until the review is fully resolved
- the normal execution handoff only happens after final explicit approval

## Failure Handling

Acceleration mode must fail closed back to manual review behavior.

Every accelerator failure must map to a named failure class with an explicit rescue action, explicit user-visible outcome, and required test coverage. The implementation may use different language-specific exception types internally, but its behavior must map back to these review-level failure classes.

### Error/Rescue Map

| Failure Class | Trigger | Rescue Action | User-Visible Outcome | Required Test |
| --- | --- | --- | --- | --- |
| `ReviewerInvocationFailure` | reviewer subagent cannot be started, times out, or exits without a usable response | stop accelerated handling for the section, keep the written artifact authoritative, and continue in normal manual review for that section | a direct message that accelerated review could not start for the section and manual review is continuing | accelerated section falls back cleanly when the reviewer subagent cannot produce output |
| `PacketValidationFailure` | reviewer output is malformed, missing required fields, or fails packet-schema validation | discard the invalid packet, do not apply any staged edits, and continue in normal manual review for that section | a direct message that the accelerated packet was invalid and has been discarded | malformed or incomplete packets fail closed before any patch is applied |
| `PatchApplyFailure` | the approved staged patch cannot be applied cleanly to the current written artifact | keep the artifact in `Draft`, show the apply failure, and continue in normal manual review for that section from the current written artifact | a direct message that the approved accelerated patch could not be applied and manual review must finish the section | patch conflicts or apply failures never partially advance approval state |
| `PacketPersistenceFailure` | the section packet or decision artifact cannot be written to disk after it is generated or approved | keep the written artifact authoritative, surface the persistence failure, and stop accelerated handling for the current section until the user re-runs or continues manually | a direct message that accelerator artifacts could not be saved and the section is falling back to manual review | persistence write failures are visible and do not leave hidden in-memory-only approval state |
| `ResumeFingerprintMismatch` | the recorded source artifact fingerprint does not match the current written artifact fingerprint | mark the saved packet stale, refuse to resume from it, and regenerate from the current written artifact or continue manually | a direct message that saved accelerator state is stale because the artifact changed | stale detection uses fingerprint mismatch rather than timestamps alone |
| `ResumeProofFailure` | Superpowers cannot prove that the last approved section patch was already applied to the written artifact | refuse to skip ahead, keep the artifact authoritative, and continue from the next unresolved section in normal manual review | a direct message that resume safety could not be proven and the review is resuming conservatively | explicit resume cannot skip ahead when apply proof is missing or ambiguous |
| `UnexpectedAcceleratorFailure` | any other accelerator-path failure that is not safely mappable to a more specific class | keep the artifact in `Draft`, record the failure in the section artifact when possible, and continue in normal manual review for that section | a direct message that acceleration failed unexpectedly and the review is falling back to the normal path | unknown accelerator failures fail closed without changing approval authority |

These invariants apply to every failure class:

- the written artifact remains authoritative
- the artifact stays in `Draft`
- no approval headers are changed
- no unapproved staged patch is applied
- the user sees a concrete failure reason and the fallback action taken

For resume specifically:

- if the persisted accelerator state disagrees with the written artifact, the written artifact wins
- if Superpowers cannot prove that the last approved section patch was already applied, it must not skip ahead
- if the recorded source artifact fingerprint does not match the current written artifact fingerprint, the packet is stale and must be regenerated
- if resume safety is ambiguous, Superpowers must continue from normal manual review for the next unresolved section

No silent defaults are allowed.

## README And Mermaid Updates

This change must update the root `README.md` so the documented workflow matches the shipped behavior.

Documentation updates must include:

- text describing accelerated review as an opt-in path inside CEO and ENG review
- a clear statement that only the user can initiate acceleration mode
- activation examples that use explicit `accelerated` or `accelerator` wording or a dedicated flag
- a clear statement that acceleration mode does not change approval authority
- Mermaid diagram updates showing accelerated review as a branch inside `plan-ceo-review` and `plan-eng-review`, not as a separate workflow stage

Documentation must not imply:

- a parallel review workflow
- automatic approval
- agent-triggered acceleration

## Testing

### Required Coverage

- normal CEO review remains unchanged when acceleration mode is not explicitly requested
- normal ENG review remains unchanged when acceleration mode is not explicitly requested
- acceleration mode requires an explicit activation marker in the current review request or a dedicated enabling flag
- acceleration mode cannot be entered by heuristic, remembered state, or agent suggestion alone
- accelerated review reuses the canonical section boundaries of the owning CEO or ENG review skill
- CEO Step 0 and ENG Step 0 plus approval gate remain non-accelerated before section packets begin
- accelerated ENG `SMALL CHANGE` preserves one-primary-issue-per-section compression but still uses per-section packets and approvals
- accelerated CEO review still produces the full CEO required-output set, including TODO and delight-question flows
- accelerated ENG review still produces the full ENG required-output set, including the QA handoff test plan artifact and normal execution handoff
- reviewer subagents cannot write the source artifact, persisted accelerator packet artifacts, or QA handoff artifacts directly
- section packets persist under `~/.superpowers/projects/<slug>/...` with repo and branch identity
- persisted section packets record a source artifact fingerprint
- approved section patches apply immediately
- rejected or reopened sections do not silently mutate approval state
- high-judgment issues become direct human questions before section approval
- high-judgment classification follows an explicit trigger list, not reviewer intuition alone
- escalated high-judgment issues remain one issue per direct human question
- reviewer subagent failure falls back to manual review for that section
- malformed or incomplete section packets fall back to manual review for that section
- patch-apply failure falls back to manual review for that section
- packet persistence write failure is visible and falls back without hidden approval state
- explicit resume works only from the last approved-and-applied section boundary
- stale detection uses source artifact fingerprint mismatch, not timestamp inference alone
- resume proof failure prevents skip-ahead and resumes conservatively
- unexpected accelerator-path failures fail closed to manual review
- stale or unapproved packets are treated as diagnostic and regenerated
- fallback cases surface a clear user-facing reason before continuing manually
- TODO proposals and CEO delight opportunities remain individual direct human questions, not batched into section packets
- final approval headers still require explicit human approval
- README text and Mermaid diagrams stay aligned with the implementation

### Review/Test Diagram

```text
accelerated review request
   |
   +--> explicit user opt-in? -- no --> normal review path
   |                              |
   |                              yes
   v
dispatch reviewer subagent
   |
   +--> valid packet?
   |       |
   |       no --> manual review fallback
   |       |
   |       yes
   v
high-judgment issue present?
   |                |
   | yes            | no
   v                v
direct human issue  section approval
question(s)         |
   |                |
   +-------> section approved?
                    |
           +--------+--------+
           |                 |
           yes               no
           |                 |
           v                 v
apply patch + sync      reopen/fallback/stop
```

## Rollout

V1 ships support for both CEO and ENG review acceleration from day one, but remains explicitly opt-in.

Rollout posture:

- normal review remains the default and the source of behavioral compatibility
- accelerated review is documented as an accelerator, not a replacement workflow
- no workflow migration is required
- if acceleration mode proves noisy or brittle, users can fall back to the normal path immediately

## Dream State Delta

```text
CURRENT STATE                      THIS SPEC                               12-MONTH IDEAL
question-by-question review        opt-in accelerated section review       trusted fast review path with
with strong human control          with preserved human approval           clear section-boundary resume
                                   and fail-closed fallback               and documentation for every stage
```
