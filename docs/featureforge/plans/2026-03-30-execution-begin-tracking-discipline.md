# Execution Begin Tracking Discipline Implementation Plan

> **For Codex and GitHub Copilot workers:** REQUIRED: Use the execution skill recommended by `featureforge plan execution recommend --plan <approved-plan-path>` after engineering approval; do not choose solely from isolated-agent availability. Steps use checkbox (`- [ ]`) syntax for tracking.

**Workflow State:** Engineering Approved
**Plan Revision:** 1
**Execution Mode:** featureforge:executing-plans
**Source Spec:** `docs/featureforge/specs/2026-03-30-execution-begin-tracking-discipline-design.md`
**Source Spec Revision:** 1
**Last Reviewed By:** plan-eng-review

**Goal:** Enforce explicit begin-before-mutation execution guidance across execution skills and lock it with contract tests so dirty-before-begin recovery is handled consistently and safely.

**Architecture:** This plan updates execution-skill template contracts first, then regenerates checked-in skill docs from templates, then validates the wording contract via the codex-runtime skill-doc suite and targeted execution runtime smoke coverage. Work is decomposed so each parallel lane owns disjoint template scope, with regeneration and verification in serial reintegration tasks.

**Tech Stack:** Markdown skill templates, generated skill docs, Node.js test runner (`node --test`), Rust integration tests (`cargo test`).

---

## Change Surface

- `skills/executing-plans/SKILL.md.tmpl`: add explicit preflight->first begin mutation boundary, dirty-before-begin warning, recovery-only retroactive policy, and 5-step recovery runbook.
- `skills/subagent-driven-development/SKILL.md.tmpl`: add semantically equivalent guardrail language.
- `skills/executing-plans/SKILL.md` and `skills/subagent-driven-development/SKILL.md`: regenerated from templates.
- `tests/codex-runtime/skill-doc-contracts.test.mjs`: assert both skill surfaces include the new wording contract.

## Preconditions

- Approved spec header remains:
  - `**Workflow State:** CEO Approved`
  - `**Spec Revision:** 1`
  - `**Last Reviewed By:** plan-ceo-review`
- Node and Rust test tooling available locally.
- Repo-safety write checks pass for plan and implementation task slices.

## Not in Scope

- Changing Rust runtime preflight/begin command semantics.
- Adding automatic retroactive reconciliation or dirty-state auto-repair behavior.
- Expanding this slice into release-process or unrelated workflow-stage changes.

## What Already Exists

- Existing runtime enforcement already blocks begin without preflight acceptance and fail-closes dirty preflight (`tracked_worktree_dirty`).
- Existing skill-doc generation pipeline (`node scripts/gen-skill-docs.mjs`) is the authoritative path for generated `SKILL.md` files.
- Existing contract harness in `tests/codex-runtime/skill-doc-contracts.test.mjs` already validates execution-skill wording and helper boundaries.

## Known Footguns / Constraints

- Do not hand-edit generated `skills/*/SKILL.md` files; modify `.tmpl` and regenerate.
- Keep reason-code references aligned with runtime-owned diagnostics; do not invent alternate runtime taxonomies.
- Maintain semantic parity between execution skills without forcing brittle byte-for-byte phrasing.

## Requirement Coverage Matrix

- REQ-001 -> Task 2
- REQ-002 -> Task 2
- REQ-003 -> Task 2
- REQ-004 -> Task 2
- REQ-005 -> Task 2
- REQ-006 -> Task 3
- REQ-007 -> Task 2, Task 3, Task 4
- REQ-008 -> Task 1, Task 5
- REQ-009 -> Task 5
- REQ-010 -> Task 2
- REQ-011 -> Task 1, Task 2, Task 3, Task 4

## Execution Strategy

- Execute Task 1 serially. It establishes the wording-contract test floor before implementation lanes begin.
- After Task 1, create two worktrees and run Tasks 2 and 3 in parallel:
  - Task 2 owns `executing-plans` template guardrail updates.
  - Task 3 owns `subagent-driven-development` template guardrail parity updates.
- Execute Task 4 serially after Tasks 2 and 3 complete. It is the regeneration seam for generated skill docs.
- Execute Task 5 serially after Task 4. It is the final verification and ratification gate for contract and runtime-smoke confidence.

## Dependency Diagram

```text
Task 1 -> Task 2
Task 1 -> Task 3
Task 2 -> Task 4
Task 3 -> Task 4
Task 4 -> Task 5
```

## Task 1: Expand skill-doc contract tests for begin-before-mutation discipline

**Spec Coverage:** REQ-008, REQ-011
**Task Outcome:** Contract tests fail when either execution skill drops the no-edit-before-begin or recovery-policy guardrail wording.
**Plan Constraints:**
- Keep assertions resilient to minor prose edits while pinning behavior-critical wording.
- Assert both execution skills, not only `executing-plans`.
**Open Questions:** none

**Files:**
- Test: `tests/codex-runtime/skill-doc-contracts.test.mjs`

- [x] **Step 1: Add failing assertion coverage for the new guidance contract**
Update the execution-skill assertions to require:
- no code/test edits between successful preflight and first `begin`
- dirty-before-begin fail-closed warning posture
- retroactive tracking marked recovery-only
- five-step recovery runbook including helper `status` anchoring and factual-only backfill
- semantic parity expectations across both execution skills

- [x] **Step 2: Run skill-doc contract tests to confirm the new assertions fail before template changes**
Run: `node --test tests/codex-runtime/skill-doc-contracts.test.mjs`
Expected: FAIL with assertion errors pointing to missing new wording in execution skill docs.

- [x] **Step 3: Commit the failing-test contract scaffold**
```bash
git add tests/codex-runtime/skill-doc-contracts.test.mjs
git commit -m "test: codify begin-before-mutation skill contract"
```

## Task 2: Harden `executing-plans` template execution-start and recovery guidance

**Spec Coverage:** REQ-001, REQ-002, REQ-003, REQ-004, REQ-005, REQ-007, REQ-010, REQ-011
**Task Outcome:** `executing-plans` template clearly enforces preflight->first-begin mutation ordering and explicit recovery discipline.
**Plan Constraints:**
- Keep helper-owned mutation model authoritative.
- Use runtime-aligned wording (`tracked_worktree_dirty`, preflight acceptance, task-boundary review/verification gates).
**Open Questions:** none

**Files:**
- Modify: `skills/executing-plans/SKILL.md.tmpl`

- [x] **Step 1: Add explicit no-edit-before-first-begin rule after successful preflight**
Clarify that successful preflight does not authorize repo mutation until first `begin` is recorded for the active step.

- [x] **Step 2: Add dirty-before-begin warning and recovery-only retroactive policy text**
State that dirtying workspace before first `begin` can block later preflight and that retroactive tracking is recovery-only.

- [x] **Step 3: Add the five-step recovery runbook with helper `status` anchoring and factual-only backfill**
Ensure runbook includes:
1. reconcile/isolate
2. fresh preflight acceptance
3. helper-backed status read
4. factual-only authoritative mutation backfill
5. task-boundary review/verification resume

- [x] **Step 4: Commit the `executing-plans` template change**
```bash
git add skills/executing-plans/SKILL.md.tmpl
git commit -m "docs: enforce begin-before-mutation in executing-plans template"
```

## Task 3: Mirror guardrails in `subagent-driven-development` template

**Spec Coverage:** REQ-006, REQ-007, REQ-011
**Task Outcome:** `subagent-driven-development` template carries semantically equivalent execution-start and recovery guidance.
**Plan Constraints:**
- Preserve coordinator-owned mutation boundaries.
- Match intent and safety posture from Task 2 while fitting subagent-specific flow language.
**Open Questions:** none

**Files:**
- Modify: `skills/subagent-driven-development/SKILL.md.tmpl`

- [x] **Step 1: Add no-edit-before-first-begin guidance in preflight/dispatch flow**
Ensure dispatch guidance states implementation edits must wait until first runtime `begin` for active step.

- [x] **Step 2: Add dirty-before-begin warning plus recovery-only retroactive policy**
Mirror risk posture and prohibit treating retroactive tracking as normal execution path.

- [x] **Step 3: Add semantically equivalent five-step recovery runbook**
Include helper `status` anchoring and factual-only backfill before returning to task-boundary review/verification gate.

- [x] **Step 4: Commit the `subagent-driven-development` template change**
```bash
git add skills/subagent-driven-development/SKILL.md.tmpl
git commit -m "docs: mirror begin-before-mutation guardrails in subagent template"
```

## Task 4: Regenerate skill docs from templates

**Spec Coverage:** REQ-007, REQ-011
**Task Outcome:** Generated `SKILL.md` docs reflect template updates without manual drift.
**Plan Constraints:**
- Generation must be script-driven only.
- Generated docs must preserve helper boundary guidance and existing runtime command contracts.
**Open Questions:** none

**Files:**
- Modify: `skills/executing-plans/SKILL.md`
- Modify: `skills/subagent-driven-development/SKILL.md`

- [x] **Step 1: Regenerate checked-in skill docs from updated templates**
Run: `node scripts/gen-skill-docs.mjs`
Expected: script completes and updates generated docs for modified templates.

- [x] **Step 2: Verify generated docs contain the new guardrails on both skill surfaces**
Run:
- `rg -n 'no .* edit|first .*begin|recovery-only|factual-only|tracked_worktree_dirty' skills/executing-plans/SKILL.md`
- `rg -n 'no .* edit|first .*begin|recovery-only|factual-only|tracked_worktree_dirty' skills/subagent-driven-development/SKILL.md`
Expected: both files include semantically equivalent guardrail language.

- [x] **Step 3: Commit regenerated skill docs**
```bash
git add skills/executing-plans/SKILL.md skills/subagent-driven-development/SKILL.md
git commit -m "chore: regenerate execution skill docs for begin-tracking hardening"
```

## Task 5: Run validation and finalize execution-proof evidence

**Spec Coverage:** REQ-008, REQ-009
**Task Outcome:** Contract tests and targeted runtime-smoke checks pass with no runtime behavior drift.
**Plan Constraints:**
- Prefer targeted suites first; do not claim runtime changes in this slice.
- Fail closed on test regressions; do not weaken assertions to pass.
**Open Questions:** none

**Files:**
- Test: `tests/codex-runtime/skill-doc-contracts.test.mjs`
- Test: `tests/workflow_shell_smoke.rs`
- Test: `tests/plan_execution_topology.rs`

- [x] **Step 1: Run skill-doc contract tests**
Run: `node --test tests/codex-runtime/skill-doc-contracts.test.mjs`
Expected: PASS.

- [x] **Step 2: Run targeted runtime-smoke coverage for execution preflight/begin invariants**
Run: `cargo test --test workflow_shell_smoke -- task-boundary-blocked`
Expected: PASS with task-boundary/preflight scenarios green.

- [x] **Step 3: Run targeted topology coverage for preflight identity/recommendation stability**
Run: `cargo test --test plan_execution_topology -- preflight`
Expected: PASS for targeted preflight/topology scenarios.

- [x] **Step 4: Commit verification-facing updates (if any) and finalize branch state**
```bash
git add -A
git commit -m "test: verify execution begin-tracking guidance hardening"
```

## Evidence Expectations

- Contract evidence: updated `skill-doc-contracts` assertions and passing output.
- Generation evidence: deterministic regenerated `SKILL.md` diffs from template changes.
- Runtime parity evidence: targeted Rust test passes for preflight/begin related smoke coverage.

## Validation Strategy

- Enforce TDD for wording contracts by landing failing assertions before template edits.
- Validate parity across both execution skill surfaces.
- Confirm no execution runtime drift via targeted Rust suites.

## Documentation Update Expectations

- No additional release-document edits expected in this slice.
- Keep spec and plan linkage authoritative via header fields and workflow sync.

## Rollout Plan

1. Merge template + generated doc + contract-test changes as one cohesive slice.
2. Run CI contract and targeted runtime suites.
3. Hand off to `featureforge:plan-eng-review` after independent plan-fidelity gate passes.

## Rollback Plan

- Revert the documentation-contract patch commit set if regressions appear.
- Restore prior generated skill docs by re-running generation on reverted templates.
- Re-run contract tests to confirm rollback integrity.

## Risks and Mitigations

- Risk: regex assertions overfit exact prose.
  - Mitigation: use semantic patterns that pin behavior-critical meaning, not brittle full-line text.
- Risk: parity drift between execution skills over time.
  - Mitigation: explicit cross-surface assertions in contract tests (REQ-011).
- Risk: accidental runtime terminology drift in skill text.
  - Mitigation: keep reason-code references aligned with existing runtime diagnostics and avoid inventing new runtime enums.

## Failure Modes

- Failure mode: template guardrails updated in one execution skill but not the other.
  - Test coverage: yes (`tests/codex-runtime/skill-doc-contracts.test.mjs` parity assertions).
  - Error handling: yes (test failure blocks merge/progression).
  - User impact visibility: clear (explicit CI/local test failure).
- Failure mode: templates updated but generated `SKILL.md` docs not regenerated.
  - Test coverage: partial (contract suite validates wording in generated docs; regeneration omission should surface as missing/wrong text).
  - Error handling: yes (contract test or review diff fails closed).
  - User impact visibility: clear (verification failure before execution handoff).
- Failure mode: guidance wording changes unintentionally imply runtime behavior changes.
  - Test coverage: yes (targeted `workflow_shell_smoke` and `plan_execution_topology` checks remain expected green).
  - Error handling: yes (targeted test regressions block completion).
  - User impact visibility: clear (test output indicates regression path).

## Engineering Review Summary

**Review Status:** clear
**Reviewed At:** 2026-03-30T13:58:53Z
**Review Mode:** small_change
**Reviewed Plan Revision:** 1
**Critical Gaps:** 0
**Browser QA Required:** no
**Test Plan Artifact:** `/Users/davidmulcahey/.featureforge/projects/dmulcahey-featureforge/davidmulcahey-current-test-plan-20260330-135723.md`
**Outside Voice:** skipped
