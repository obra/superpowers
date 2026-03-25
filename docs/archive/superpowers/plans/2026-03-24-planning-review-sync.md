# Planning Review Sync Implementation Plan

> **For Codex and GitHub Copilot workers:** REQUIRED: Use `superpowers:subagent-driven-development` when isolated-agent workflows are available in the current platform/session; otherwise use `superpowers:executing-plans`. Steps use checkbox (`- [ ]`) syntax for tracking.

**Workflow State:** Engineering Approved
**Plan Revision:** 1
**Execution Mode:** superpowers:executing-plans
**Source Spec:** `docs/superpowers/specs/2026-03-24-planning-review-sync-design.md`
**Source Spec Revision:** 1
**Last Reviewed By:** plan-eng-review

**Goal:** Sync the five approved planning-review deltas from pinned upstream `garrytan/gstack` into Superpowers as one repo-visible, skill-layer-first PR without changing Rust workflow authority unless targeted compatibility tests force a minimal fix.

**Architecture:** Update the planning-review skill templates first, because the approved design keeps review behavior and artifact-writing semantics in the skill layer. Preserve the current spec/plan/test-plan header contracts, regenerate the published skill docs from the templates, and prove compatibility through parser, execution-gate, and doc-contract tests before considering any runtime change.

**Tech Stack:** Markdown skill templates, generated `SKILL.md` docs, Node doc-generation scripts, Rust contract tests, Rust execution-gate tests, JS skill-doc contract tests

---

## What Already Exists

- `skills/plan-ceo-review/SKILL.md.tmpl` already has the normal Step 0 mode system, sectioned CEO review flow, acceleration hooks, summary tables, and failure-mode discipline that the upstream selective-expansion and UI-review content must extend rather than replace.
- `skills/plan-eng-review/SKILL.md.tmpl` already has the engineering review flow, QA handoff artifact generation, failure-mode output, and execution handoff that the coverage-graph upgrade must preserve.
- `skills/writing-plans/SKILL.md.tmpl` already enforces approved-spec gating, plan structure, requirement coverage, and plan handoff into `superpowers:plan-eng-review`.
- `skills/qa-only/SKILL.md.tmpl` already consumes the branch-scoped test-plan artifact and routes finish-gate QA around existing required headers.
- `scripts/gen-skill-docs.mjs` is already the canonical generator for `skills/*/SKILL.md`.
- `tests/runtime_instruction_contracts.rs` and `tests/codex-runtime/skill-doc-contracts.test.mjs` already fail closed when workflow wording or generated skill docs drift.
- `tests/contracts_spec_plan.rs` already exercises spec and plan contract parsing.
- `tests/plan_execution.rs` already exercises finish-gate behavior against the current test-plan and QA artifact contracts.

## Existing Capabilities / Built-ins To Reuse

- Reuse the current `SKILL.md.tmpl` -> `SKILL.md` generation flow instead of editing generated files by hand.
- Reuse the existing `accelerated-reviewer-prompt.md` file layout in both planning-review skills as the model for the new `outside-voice-prompt.md` files.
- Reuse the current Superpowers artifact paths and headers rather than inventing a new review-state store.
- Reuse the existing parser and finish-gate tests as the proof point that no Rust state-machine change is required.

## Known Footguns / Constraints

- Copy the relevant review sections directly from the approved upstream source map in the spec; do not paraphrase upstream behavior from memory and still call it a sync.
- The new review-summary sections are additive only. Approval truth remains the current artifact headers and helper-owned plan-contract analysis.
- `qa-only` must keep treating richer test-plan sections as optional context. The required headers and current four core sections remain the finish-gate contract.
- Same-context or same-model fallbacks must not be labeled as cross-model review.
- No template, prompt, generated doc, or public doc may retain `~/.gstack`, dashboard, `ceo-plans`, or `docs/designs` workflow references after the sync.

## Planned File Structure

- `skills/plan-ceo-review/SKILL.md.tmpl`: direct upstream CEO-review sync point for selective expansion, UI design-intent review, summary writing, and outside-voice flow.
- `skills/plan-ceo-review/outside-voice-prompt.md`: bounded reviewer prompt for CEO outside-voice runs.
- `skills/plan-eng-review/SKILL.md.tmpl`: direct upstream ENG-review sync point for coverage-graph review, richer test-plan artifact guidance, summary writing, and outside-voice flow.
- `skills/plan-eng-review/outside-voice-prompt.md`: bounded reviewer prompt for ENG outside-voice runs.
- `skills/writing-plans/SKILL.md.tmpl`: additive-reader update so plan authors may consult `## CEO Review Summary` without treating it as approval truth.
- `skills/qa-only/SKILL.md.tmpl`: additive-reader update so QA may consume richer test-plan sections and `## Engineering Review Summary` without changing finish-gate authority.
- `skills/plan-ceo-review/SKILL.md`: generated artifact for CEO review instructions.
- `skills/plan-eng-review/SKILL.md`: generated artifact for ENG review instructions.
- `skills/writing-plans/SKILL.md`: generated artifact for writing-plans instructions.
- `skills/qa-only/SKILL.md`: generated artifact for QA instructions.
- `README.md`: public capability summary update if the planning-review workflow description changes materially.
- `docs/README.codex.md`: Codex-facing discoverability update for the new planning-review capabilities.
- `docs/README.copilot.md`: Copilot-facing discoverability update for the new planning-review capabilities.
- `tests/runtime_instruction_contracts.rs`: runtime doc/fixture assertions for new generated workflow wording.
- `tests/codex-runtime/skill-doc-contracts.test.mjs`: generated skill-doc assertions for new CEO/ENG/downstream wording.
- `tests/contracts_spec_plan.rs`: contract parser coverage for trailing review-summary sections.
- `tests/plan_execution.rs`: finish-gate compatibility coverage for richer additive test-plan sections.
- `src/contracts/spec.rs`: contingency-only parser touch if trailing CEO summaries break current parsing.
- `src/contracts/plan.rs`: contingency-only parser touch if trailing ENG summaries break current parsing or coverage analysis.
- `src/execution/state.rs`: contingency-only finish-gate touch if richer additive test-plan sections break readiness checks.

## Preconditions

- The approved spec at `docs/superpowers/specs/2026-03-24-planning-review-sync-design.md` stays at `**Workflow State:** CEO Approved`, `**Spec Revision:** 1`, and includes the current `## Requirement Index`.
- The implementation uses the pinned upstream source map from the approved spec:
  - `https://github.com/garrytan/gstack/blob/3501f5dd0388c8c065ade8364c3b7c909be035a6/plan-ceo-review/SKILL.md`
  - `https://github.com/garrytan/gstack/blob/3501f5dd0388c8c065ade8364c3b7c909be035a6/plan-eng-review/SKILL.md`
- Use `superpowers:test-driven-development` while applying the plan so new contract assertions land before behavior changes.
- Use `superpowers:writing-skills` while editing the planning-review skill templates and prompt files.
- Use `superpowers:verification-before-completion` before claiming the sync is complete.

## Not In Scope

- Any import of JSONL review logs, dashboard truth, `ceo-plans`, or `docs/designs` promotion.
- Any new workflow stage or alternate approval ledger.
- Any Rust/runtime change that is not directly forced by a failing compatibility test introduced in this plan.
- Any expansion of outside voice into a blocking transport or artifact-mutating authority.

## Execution Strategy

- Start with red contract coverage for the approved additive artifact behavior and generated doc wording.
- Implement CEO and ENG review changes in separate task slices so each upstream carry-forward is auditable.
- Keep downstream-reader changes small and explicit so they cannot accidentally become new gate logic.
- Regenerate docs after each template slice that materially changes generated instructions.
- End with the smallest possible verification surface that still proves the sync is safe: generator freshness, doc contracts, parser contracts, and finish-gate compatibility.

```text
Task 1 contract tests
    |
    v
Task 2 CEO review sync -------------------+
    |                                     |
    v                                     |
authoritative spec + CEO summary          |
                                          |
Task 3 ENG review sync ----------------+  |
    |                                 |  |
    v                                 |  |
authoritative plan + ENG summary      |  |
    |                                 |  |
    v                                 v  v
branch test-plan artifact      Task 4 downstream readers + docs
    |                                 |
    +-----------------------+---------+
                            |
                            v
                     Task 5 verification
                            |
                            v
               conditional minimal Rust fix only if forced
```

## Evidence Expectations

- Preserve the pinned upstream source references in commit messages or implementation notes when copying sections into the templates.
- Capture command output for every targeted verification suite in the execution log or PR notes.
- If any runtime file changes become necessary, record the exact failing test that forced the change before patching Rust.

## Validation Strategy

- `node scripts/gen-skill-docs.mjs`
- `node scripts/gen-skill-docs.mjs --check`
- `cargo test --test runtime_instruction_contracts`
- `node --test tests/codex-runtime/skill-doc-contracts.test.mjs`
- `cargo test --test contracts_spec_plan`
- `cargo test --test plan_execution`

## Failure Modes

- CEO review summary write can replace the wrong range or lose a concurrent artifact edit.
  Test coverage: Task 1 adds parser/contract fixtures for trailing summaries and rerun-safe summary behavior.
  Error handling: yes, the approved design requires re-read + single retry, then leaves the artifact in `Draft` if freshness cannot be re-established.
  User impact: clear error, not silent.
- ENG richer test-plan artifact can break finish-gate compatibility when additive sections are present.
  Test coverage: Task 1 adds `tests/plan_execution.rs` coverage with richer additive test-plan sections, and Task 5 reruns the finish-gate suite.
  Error handling: yes, the plan routes any real compatibility failure into Task 6 for the smallest scoped fix.
  User impact: clear gate failure, not silent.
- Outside-voice review can fail due to missing transport, timeout, empty output, or auth failure and accidentally be mislabeled as independent review.
  Test coverage: Task 1 plus Tasks 2 and 3 extend doc-contract checks around truthful labels and required fallback wording.
  Error handling: yes, the review flow must record `Outside Voice: unavailable` and continue without blocking approval.
  User impact: clear degraded-review signal, not silent.
- Generated skill docs can drift from the edited templates and leave operators following stale planning-review instructions.
  Test coverage: Task 5 runs `node scripts/gen-skill-docs.mjs --check` and `node --test tests/codex-runtime/skill-doc-contracts.test.mjs`.
  Error handling: yes, verification fails closed before merge.
  User impact: clear verification failure, not silent.

**Critical gaps:** 0

## Documentation Update Expectations

- Update public docs only where the new review capabilities or additive-reader behavior materially affect discoverability.
- Keep README wording aligned with the generated skill docs; if public docs would need explanation that the generated skill docs do not support, fix the skill docs first.

## Rollout Plan

- Land one sync-style PR on `dm/sync-features`.
- Keep the PR centered on the approved skill-layer design and supporting tests.
- Request code review only after all targeted suites above pass and any generated docs are current.

## Rollback Plan

- Revert the sync PR.
- Do not perform any state migration or cleanup beyond reverting generated docs and tests because the design keeps all authoritative state repo-visible and rebuildable.

## Risks And Mitigations

- Risk: direct-sync drift from upstream.
  Mitigation: use the approved spec’s pinned source map and verify the exact sections copied into the templates.
- Risk: summaries become de facto approval truth.
  Mitigation: repeat additive-only language in both review skills and both downstream readers, then enforce it with contract tests.
- Risk: richer ENG QA artifact sections break finish gating.
  Mitigation: add `tests/plan_execution.rs` coverage before touching runtime code and only patch runtime if the new test proves a real incompatibility.
- Risk: public docs and generated skill docs diverge.
  Mitigation: regenerate docs in the same change set and require `node scripts/gen-skill-docs.mjs --check` plus JS doc-contract tests to pass.

## Requirement Coverage Matrix

- REQ-001 -> Task 1, Task 2
- REQ-002 -> Task 1, Task 3
- REQ-003 -> Task 2
- REQ-004 -> Task 2
- REQ-005 -> Task 1, Task 3
- REQ-006 -> Task 2, Task 3
- REQ-007 -> Task 1, Task 4
- DEC-001 -> Task 2, Task 3, Task 4
- DEC-002 -> Task 1, Task 5, Task 6
- NONGOAL-001 -> Task 2, Task 3, Task 4
- VERIFY-001 -> Task 1, Task 5, Task 6

## Task 1: Add Red Coverage For Additive Artifact Compatibility And Review-Wording Contracts

**Spec Coverage:** REQ-001, REQ-002, REQ-005, REQ-007, DEC-002, VERIFY-001
**Task Outcome:** The repo has failing-or-proving tests that define the additive summary and richer QA artifact contract before the skill-template sync lands.
**Plan Constraints:**
- Prefer proving existing runtime compatibility over assuming it.
- Do not patch Rust in this task even if a new assertion exposes a parser or finish-gate failure; capture the failure first and defer any runtime fix to Task 5.
**Open Questions:** none

**Files:**
- Modify: `tests/contracts_spec_plan.rs`
- Modify: `tests/plan_execution.rs`
- Modify: `tests/runtime_instruction_contracts.rs`
- Modify: `tests/codex-runtime/skill-doc-contracts.test.mjs`
- Test: `cargo test --test contracts_spec_plan`
- Test: `cargo test --test plan_execution`
- Test: `cargo test --test runtime_instruction_contracts`
- Test: `node --test tests/codex-runtime/skill-doc-contracts.test.mjs`

- [x] **Step 1: Add a trailing CEO summary spec fixture to the parser contract suite**
```markdown
## CEO Review Summary

**Review Status:** clear
**Reviewed At:** 2026-03-24T13:42:28Z
**Review Mode:** hold_scope
**Reviewed Spec Revision:** 1
**Critical Gaps:** 0
**UI Design Intent Required:** no
**Outside Voice:** skipped
```

- [x] **Step 2: Add a trailing ENG summary plan fixture to the parser and analyze-plan coverage**
```markdown
## Engineering Review Summary

**Review Status:** clear
**Reviewed At:** 2026-03-24T16:02:11Z
**Review Mode:** big_change
**Reviewed Plan Revision:** 1
**Critical Gaps:** 0
**Browser QA Required:** yes
**Test Plan Artifact:** `~/.superpowers/projects/example/example-branch-test-plan-20260324T160211Z.md`
**Outside Voice:** fresh-context-subagent
```

- [x] **Step 3: Extend `tests/plan_execution.rs` with a richer additive test-plan fixture**
```markdown
# Test Plan
**Source Plan:** `docs/superpowers/plans/2026-03-24-planning-review-sync.md`
**Source Plan Revision:** 1
**Branch:** dm/sync-features
**Repo:** dmulcahey/superpowers
**Browser QA Required:** yes
**Generated By:** superpowers:plan-eng-review
**Generated At:** 2026-03-24T16:08:00Z

## Affected Pages / Routes
- none

## Coverage Graph
- plan-ceo-review summary write -> automated contract tests
- plan-eng-review additive QA artifact -> manual QA not required

## Browser Matrix
- none

## Engineering Review Summary
- Review outcome captured separately in the source plan.
```

- [x] **Step 4: Extend the doc-contract suites to look for the new review behaviors**
```text
Add assertions for:
- SELECTIVE EXPANSION
- Section 11: Design & UX Review
- ## CEO Review Summary
- coverage graph
- ## Engineering Review Summary
- additive context only
```

- [x] **Step 5: Run the targeted suites and record which failures are template/doc drift versus real runtime incompatibility**
Run: `cargo test --test contracts_spec_plan`
Expected: PASS immediately if the current parsers already tolerate trailing sections; FAIL only if a real parser incompatibility exists

Run: `cargo test --test plan_execution`
Expected: PASS immediately if finish gating already ignores additive sections; FAIL only if richer QA artifact bodies break gating

Run: `cargo test --test runtime_instruction_contracts`
Expected: FAIL because the runtime instruction fixtures will not yet mention the new review behaviors

Run: `node --test tests/codex-runtime/skill-doc-contracts.test.mjs`
Expected: FAIL because the generated skill docs will not yet contain the new wording

- [x] **Step 6: Commit the contract-first test slice**
```bash
git add tests/contracts_spec_plan.rs tests/plan_execution.rs tests/runtime_instruction_contracts.rs tests/codex-runtime/skill-doc-contracts.test.mjs
git commit -m "test: add planning review sync contract coverage"
```

## Task 2: Sync CEO Review With Upstream Selective Expansion, UI Design Intent, Summary Writing, And Outside Voice

**Spec Coverage:** REQ-001, REQ-003, REQ-004, REQ-006, DEC-001, NONGOAL-001
**Task Outcome:** `plan-ceo-review` carries the approved upstream CEO-review behavior, adapted to Superpowers’ artifact authority and branch-safety rules.
**Plan Constraints:**
- Pull the included review semantics directly from the pinned upstream CEO review source, then adapt only pathing, artifact names, and workflow ownership.
- Accepted selective-expansion candidates must patch the authoritative spec body before approval; the new summary is descriptive only.
- Outside voice must use `codex exec` when available, otherwise a fresh-context subagent or reviewer path, otherwise record `unavailable`; do not introduce a new helper, transport abstraction, or hidden state for this PR.
**Open Questions:** none

**Files:**
- Modify: `skills/plan-ceo-review/SKILL.md.tmpl`
- Create: `skills/plan-ceo-review/outside-voice-prompt.md`
- Modify: `skills/plan-ceo-review/SKILL.md`
- Test: `node scripts/gen-skill-docs.mjs`
- Test: `rg -n "SELECTIVE EXPANSION|Section 11: Design & UX Review|## CEO Review Summary|Outside Voice" skills/plan-ceo-review/SKILL.md.tmpl skills/plan-ceo-review/SKILL.md`

- [x] **Step 1: Import the upstream Step 0 selective-expansion mode material into the CEO template**
```text
Carry forward:
- four-mode description
- HOLD-first selective expansion philosophy
- one-candidate-per-decision review discipline
- mode selection guidance
- mode table updates
```

- [x] **Step 2: Insert UI-scope detection and the Section 11 design-intent review**
```text
Require the Section 11 pass to cover:
- information architecture
- interaction-state map
- responsive intent
- accessibility basics
- required ASCII user-flow/state diagram
```

- [x] **Step 3: Add the authoritative spec summary-write mechanics**
```markdown
## CEO Review Summary

**Review Status:** clear | issues_open
**Reviewed At:** <ISO-8601 UTC>
**Review Mode:** hold_scope | selective_expansion | expansion | scope_reduction
**Reviewed Spec Revision:** <integer>
**Critical Gaps:** <integer>
**UI Design Intent Required:** yes | no
**Outside Voice:** skipped | unavailable | cross-model | fresh-context-subagent
```

- [x] **Step 4: Create the bounded CEO outside-voice prompt and wire the optional flow into the template**
```text
Prompt requirements:
- review only the supplied spec content
- do not mutate files
- surface blind spots and tensions
- identify the review source truthfully
- try `codex exec` first, then fall back to a fresh-context reviewer path, then record `Outside Voice: unavailable` if neither path is usable
```

- [x] **Step 5: Keep branch-safety and stale-write handling explicit in the template**
```text
Document:
- repo-file-write gate before summary writes
- separate approval-header-write gate when headers flip
- replace-through-next-## or EOF semantics
- move-summary-to-end semantics
- re-read and retry once on stale writes
```

- [x] **Step 6: Regenerate the skill docs and inspect the generated CEO output**
Run: `node scripts/gen-skill-docs.mjs`
Expected: PASS with regenerated `skills/plan-ceo-review/SKILL.md`

Run: `rg -n "SELECTIVE EXPANSION|Section 11: Design & UX Review|## CEO Review Summary|Outside Voice" skills/plan-ceo-review/SKILL.md.tmpl skills/plan-ceo-review/SKILL.md`
Expected: PASS with at least one match for each required CEO-review addition

- [x] **Step 7: Commit the CEO review sync slice**
```bash
git add skills/plan-ceo-review/SKILL.md.tmpl skills/plan-ceo-review/outside-voice-prompt.md skills/plan-ceo-review/SKILL.md
git commit -m "feat: sync ceo planning review behavior"
```

## Task 3: Sync ENG Review With Coverage Graph, Rich QA Handoff, Summary Writing, And Outside Voice

**Spec Coverage:** REQ-002, REQ-005, REQ-006, DEC-001, NONGOAL-001
**Task Outcome:** `plan-eng-review` adopts the approved upstream ENG-review semantics while preserving the current Superpowers test-plan authority contract and finish-gate compatibility.
**Plan Constraints:**
- Preserve the current test-plan artifact headers and naming shape under `$_SP_STATE_DIR/projects/$SLUG/{user}-{safe-branch}-test-plan-{datetime}.md`.
- Richer test-plan sections remain additive; `qa-only` and finish gating must still work from the existing required headers.
- Outside voice must use `codex exec` when available, otherwise a fresh-context subagent or reviewer path, otherwise record `unavailable`; do not introduce a new helper, transport abstraction, or hidden state for this PR.
**Open Questions:** none

**Files:**
- Modify: `skills/plan-eng-review/SKILL.md.tmpl`
- Create: `skills/plan-eng-review/outside-voice-prompt.md`
- Modify: `skills/plan-eng-review/SKILL.md`
- Test: `node scripts/gen-skill-docs.mjs`
- Test: `rg -n "coverage graph|Test Plan Artifact|## Engineering Review Summary|Outside Voice" skills/plan-eng-review/SKILL.md.tmpl skills/plan-eng-review/SKILL.md`

- [x] **Step 1: Replace the loose ENG test-review section with the upstream coverage-graph review flow**
```text
Require the review to classify each meaningful branch or user-visible state as:
- automated
- manual QA
- explicitly not required with written justification
```

- [x] **Step 2: Expand the test-plan artifact guidance additively without changing the required header contract**
```markdown
# Test Plan
**Source Plan:** `<repo-relative plan path>`
**Source Plan Revision:** <integer>
**Branch:** <branch>
**Repo:** <owner/repo or repo root>
**Browser QA Required:** yes | no
**Generated By:** superpowers:plan-eng-review
**Generated At:** <ISO-8601 UTC>
```

- [x] **Step 3: Add the richer additive body sections to the ENG QA handoff guidance**
```text
Add sections for:
- Coverage Graph
- Browser Matrix
- Non-Browser Contract Checks
- Regression Risks
- Manual QA Notes
```

- [x] **Step 4: Add the authoritative plan summary-write mechanics**
```markdown
## Engineering Review Summary

**Review Status:** clear | issues_open
**Reviewed At:** <ISO-8601 UTC>
**Review Mode:** big_change | small_change | scope_reduction
**Reviewed Plan Revision:** <integer>
**Critical Gaps:** <integer>
**Browser QA Required:** yes | no
**Test Plan Artifact:** `<artifact path>`
**Outside Voice:** skipped | unavailable | cross-model | fresh-context-subagent
```

- [x] **Step 5: Create the ENG outside-voice prompt and integrate the optional review challenge**
```text
Prompt requirements:
- review only the supplied plan and QA-handoff context
- do not mutate plan or artifacts directly
- report disagreements as candidate findings for the main reviewer to adopt or reject
- try `codex exec` first, then fall back to a fresh-context reviewer path, then record `Outside Voice: unavailable` if neither path is usable
```

- [x] **Step 6: Regenerate the skill docs and inspect the generated ENG output**
Run: `node scripts/gen-skill-docs.mjs`
Expected: PASS with regenerated `skills/plan-eng-review/SKILL.md`

Run: `rg -n "coverage graph|Test Plan Artifact|## Engineering Review Summary|Outside Voice" skills/plan-eng-review/SKILL.md.tmpl skills/plan-eng-review/SKILL.md`
Expected: PASS with at least one match for each required ENG-review addition

- [x] **Step 7: Commit the ENG review sync slice**
```bash
git add skills/plan-eng-review/SKILL.md.tmpl skills/plan-eng-review/outside-voice-prompt.md skills/plan-eng-review/SKILL.md
git commit -m "feat: sync eng planning review behavior"
```

## Task 4: Update Downstream Readers And Public Docs Without Changing Approval Authority

**Spec Coverage:** REQ-007, DEC-001, NONGOAL-001
**Task Outcome:** `writing-plans` and `qa-only` both treat the new summary and rich-handoff material as additive context only, while public docs describe the capability without introducing any forbidden workflow state.
**Plan Constraints:**
- `writing-plans` and `qa-only` must describe the new sections as additive context only and must not require those sections to exist.
- Public docs must describe the new capabilities without creating workflow obligations that the generated skill docs do not support.
- Do not add dashboard, `ceo-plans`, `docs/designs`, or any alternate approval/state model references in this task.
**Open Questions:** none

**Files:**
- Modify: `skills/writing-plans/SKILL.md.tmpl`
- Modify: `skills/qa-only/SKILL.md.tmpl`
- Modify: `skills/writing-plans/SKILL.md`
- Modify: `skills/qa-only/SKILL.md`
- Modify: `README.md`
- Modify: `docs/README.codex.md`
- Modify: `docs/README.copilot.md`
- Test: `node scripts/gen-skill-docs.mjs`
- Test: `node scripts/gen-skill-docs.mjs --check`

- [x] **Step 1: Add additive-reader guidance to `writing-plans`**
```text
Document that:
- writing-plans must treat ## CEO Review Summary as additive context only
- the approved spec headers and Requirement Index remain the prerequisite gate
- the summary does not replace plan-contract approval law
- absence of the summary must not become a prerequisite failure
```

- [x] **Step 2: Add additive-reader guidance to `qa-only`**
```text
Document that:
- qa-only must treat richer test-plan sections and ## Engineering Review Summary as additive context only
- finish-gate freshness still depends on the current required headers
- absence of rich sections does not invalidate the artifact
```

- [x] **Step 3: Update the public README surfaces only where the review workflow description has materially changed**
```text
Touch only the planning-review capability and discoverability wording needed to describe:
- artifact-native review summaries
- selective expansion
- UI design-intent review
- richer ENG QA handoff
- optional outside voice
```

- [x] **Step 4: Regenerate docs and enforce generator freshness**
Run: `node scripts/gen-skill-docs.mjs`
Expected: PASS with regenerated `skills/writing-plans/SKILL.md` and `skills/qa-only/SKILL.md`

Run: `node scripts/gen-skill-docs.mjs --check`
Expected: PASS with no stale generated skill docs

- [x] **Step 5: Commit the downstream-reader and docs slice**
```bash
git add skills/writing-plans/SKILL.md.tmpl skills/qa-only/SKILL.md.tmpl skills/writing-plans/SKILL.md skills/qa-only/SKILL.md README.md docs/README.codex.md docs/README.copilot.md
git commit -m "docs: align downstream planning review guidance"
```

## Task 5: Run Full Verification For The Planned Skill-Layer Sync

**Spec Coverage:** DEC-002, VERIFY-001
**Task Outcome:** The full targeted verification set passes for the skill-layer sync, or a concrete failing compatibility suite is identified and handed off to the conditional runtime-fix task.
**Plan Constraints:**
- Keep this task verification-only; do not modify Rust runtime files here.
- Only activate Task 6 if a targeted compatibility suite fails for a concrete parser or finish-gate reason.
**Open Questions:** none

**Files:**
- Test: `node scripts/gen-skill-docs.mjs --check`
- Test: `cargo test --test runtime_instruction_contracts`
- Test: `node --test tests/codex-runtime/skill-doc-contracts.test.mjs`
- Test: `cargo test --test contracts_spec_plan`
- Test: `cargo test --test plan_execution`

- [x] **Step 1: Run the generator freshness check**
Run: `node scripts/gen-skill-docs.mjs --check`
Expected: PASS with no generated-doc drift

- [x] **Step 2: Run the runtime instruction and generated-doc contract suites**
Run: `cargo test --test runtime_instruction_contracts`
Expected: PASS

Run: `node --test tests/codex-runtime/skill-doc-contracts.test.mjs`
Expected: PASS

- [x] **Step 3: Run the parser and finish-gate compatibility suites**
Run: `cargo test --test contracts_spec_plan`
Expected: PASS

Run: `cargo test --test plan_execution`
Expected: PASS

- [x] **Step 4: Stop at the first concrete compatibility failure and route only that failure into Task 6**
```text
Trigger Task 6 only for:
- trailing CEO summary parsing failure
- trailing ENG summary parsing or analyze-plan compatibility failure
- richer additive test-plan body compatibility failure
```

- [x] **Step 5: If all targeted suites pass without activating Task 6, commit the verified skill-layer sync**
```bash
git add skills/plan-ceo-review/SKILL.md.tmpl skills/plan-ceo-review/outside-voice-prompt.md skills/plan-ceo-review/SKILL.md skills/plan-eng-review/SKILL.md.tmpl skills/plan-eng-review/outside-voice-prompt.md skills/plan-eng-review/SKILL.md skills/writing-plans/SKILL.md.tmpl skills/writing-plans/SKILL.md skills/qa-only/SKILL.md.tmpl skills/qa-only/SKILL.md README.md docs/README.codex.md docs/README.copilot.md tests/runtime_instruction_contracts.rs tests/codex-runtime/skill-doc-contracts.test.mjs tests/contracts_spec_plan.rs tests/plan_execution.rs
git commit -m "feat: sync planning review skills with gstack"
```

## Task 6: Apply The Smallest Runtime Compatibility Fix Only If Verification Forces It

**Spec Coverage:** DEC-002, VERIFY-001
**Task Outcome:** Any real parser or finish-gate incompatibility introduced by the sync is repaired with the smallest runtime patch required, then the full verification set passes.
**Plan Constraints:**
- Only start this task after Task 5 identifies a concrete compatibility failure.
- Patch only the parser or finish-gate surface implicated by the failing test, then rerun the full targeted suite.
**Open Questions:** none

**Files:**
- Modify: `src/contracts/spec.rs`
- Modify: `src/contracts/plan.rs`
- Modify: `src/execution/state.rs`
- Test: `node scripts/gen-skill-docs.mjs --check`
- Test: `cargo test --test runtime_instruction_contracts`
- Test: `node --test tests/codex-runtime/skill-doc-contracts.test.mjs`
- Test: `cargo test --test contracts_spec_plan`
- Test: `cargo test --test plan_execution`

- [x] **Step 1: Patch only the implicated runtime surface**
```text
Allowed fixes only if forced by failing tests:
- `src/contracts/spec.rs` for trailing CEO summary parsing
- `src/contracts/plan.rs` for trailing ENG summary parsing or analyze-plan compatibility
- `src/execution/state.rs` for richer additive test-plan body compatibility
```

- [x] **Step 2: Re-run the full verification set after the fix**
```bash
node scripts/gen-skill-docs.mjs --check
cargo test --test runtime_instruction_contracts
node --test tests/codex-runtime/skill-doc-contracts.test.mjs
cargo test --test contracts_spec_plan
cargo test --test plan_execution
```

- [x] **Step 3: Commit the verified sync including the forced runtime compatibility fix**
```bash
git add skills/plan-ceo-review/SKILL.md.tmpl skills/plan-ceo-review/outside-voice-prompt.md skills/plan-ceo-review/SKILL.md skills/plan-eng-review/SKILL.md.tmpl skills/plan-eng-review/outside-voice-prompt.md skills/plan-eng-review/SKILL.md skills/writing-plans/SKILL.md.tmpl skills/writing-plans/SKILL.md skills/qa-only/SKILL.md.tmpl skills/qa-only/SKILL.md README.md docs/README.codex.md docs/README.copilot.md tests/runtime_instruction_contracts.rs tests/codex-runtime/skill-doc-contracts.test.mjs tests/contracts_spec_plan.rs tests/plan_execution.rs src/contracts/spec.rs src/contracts/plan.rs src/execution/state.rs
git commit -m "feat: sync planning review skills with gstack"
```

## Final Handoff Expectations

- After implementation, invoke `superpowers:requesting-code-review`.
- Do not merge or hand off execution recommendations until the targeted verification suite in this plan is green.
