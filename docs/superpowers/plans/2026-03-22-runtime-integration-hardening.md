# Runtime Integration Hardening Implementation Plan

> **For Codex and GitHub Copilot workers:** REQUIRED: Use `superpowers:subagent-driven-development` when isolated-agent workflows are available in the current platform/session; otherwise use `superpowers:executing-plans`. Steps use checkbox (`- [ ]`) syntax for tracking.

**Workflow State:** Engineering Approved
**Plan Revision:** 1
**Execution Mode:** superpowers:executing-plans
**Source Spec:** `docs/superpowers/specs/2026-03-22-runtime-integration-hardening-design.md`
**Source Spec Revision:** 1
**Last Reviewed By:** plan-eng-review

**Goal:** Make the newer runtime-backed workflow contracts authoritative end to end so route-time readiness, engineering approval, execution gates, late-stage artifacts, and the public read-only CLI all agree on the same fail-closed semantics.

**Architecture:** Extend the existing runtime in place instead of inventing a parallel control plane. First lock the stronger contract into fixtures and regression tests, then harden route-time and plan-contract analysis, then add execution preflight and late-stage gates with richer provenance, then wire structured QA and release artifacts plus public CLI inspection, and finally reduce `using-superpowers` fallback and add compatibility shims without weakening markdown authority or read-only CLI constraints.

**Tech Stack:** POSIX shell helpers, PowerShell parity wrappers, Markdown skill templates plus generated `SKILL.md` outputs, runtime docs, shell regression tests, Node contract tests

---

## What Already Exists

- `bin/superpowers-workflow-status` already owns workflow-state resolution, artifact expectations, and manifest sync.
- `bin/superpowers-plan-contract` already parses requirement-indexed specs and coverage-matrix plans and already builds task packets.
- `bin/superpowers-plan-execution` already owns execution-state truth, execution recommendations, and progress mutation.
- `bin/superpowers-workflow` already exists as the supported public read-only wrapper.
- `bin/superpowers-session-entry`, `bin/superpowers-repo-safety`, `bin/superpowers-runtime-common.sh`, and `bin/superpowers-plan-structure-common` already provide the runtime-owned gate and shared parsing patterns this work should reuse.
- Skill templates already exist for the review, execution, QA, release, and routing stages that need wording or artifact-contract updates.
- The repo already has regression suites for workflow sequencing, workflow status, plan contract, plan execution, session entry, wrapper parity, and skill-doc contracts.

## Planned File Structure

- Modify: `bin/superpowers-workflow-status`
- Modify: `bin/superpowers-workflow-status.ps1`
- Modify: `bin/superpowers-plan-contract`
- Modify: `bin/superpowers-plan-contract.ps1`
- Modify: `bin/superpowers-plan-execution`
- Modify: `bin/superpowers-plan-execution.ps1`
- Modify: `bin/superpowers-workflow`
- Modify: `bin/superpowers-workflow.ps1`
- Modify: `bin/superpowers-plan-structure-common`
- Modify: `skills/plan-eng-review/SKILL.md.tmpl`
- Modify: `skills/plan-eng-review/SKILL.md`
- Modify: `skills/executing-plans/SKILL.md.tmpl`
- Modify: `skills/executing-plans/SKILL.md`
- Modify: `skills/subagent-driven-development/SKILL.md.tmpl`
- Modify: `skills/subagent-driven-development/SKILL.md`
- Modify: `skills/requesting-code-review/SKILL.md.tmpl`
- Modify: `skills/requesting-code-review/SKILL.md`
- Modify: `skills/finishing-a-development-branch/SKILL.md.tmpl`
- Modify: `skills/finishing-a-development-branch/SKILL.md`
- Modify: `skills/qa-only/SKILL.md.tmpl`
- Modify: `skills/qa-only/SKILL.md`
- Modify: `skills/document-release/SKILL.md.tmpl`
- Modify: `skills/document-release/SKILL.md`
- Modify: `skills/using-superpowers/SKILL.md.tmpl`
- Modify: `skills/using-superpowers/SKILL.md`
- Modify: `commands/brainstorm.md`
- Modify: `commands/write-plan.md`
- Modify: `commands/execute-plan.md`
- Modify: `README.md`
- Modify: `docs/README.codex.md`
- Modify: `docs/README.copilot.md`
- Modify: `docs/testing.md`
- Modify: `RELEASE-NOTES.md`
- Modify: `tests/codex-runtime/test-superpowers-workflow-status.sh`
- Modify: `tests/codex-runtime/test-superpowers-plan-contract.sh`
- Modify: `tests/codex-runtime/test-superpowers-plan-execution.sh`
- Modify: `tests/codex-runtime/test-superpowers-workflow.sh`
- Modify: `tests/codex-runtime/test-superpowers-session-entry-gate.sh`
- Modify: `tests/codex-runtime/test-using-superpowers-bypass.sh`
- Modify: `tests/codex-runtime/test-workflow-sequencing.sh`
- Modify: `tests/codex-runtime/test-workflow-enhancements.sh`
- Modify: `tests/codex-runtime/test-runtime-instructions.sh`
- Modify: `tests/codex-runtime/test-powershell-wrapper-bash-resolution.sh`
- Modify: `tests/codex-runtime/workflow-fixtures.test.mjs`
- Modify: `tests/codex-runtime/skill-doc-contracts.test.mjs`
- Modify existing and add new fixture files under `tests/codex-runtime/fixtures/plan-contract/`
- Modify existing and add new fixture files under `tests/codex-runtime/fixtures/workflow-artifacts/`

## Preconditions

- Work from `dm/workflow-hardening`, not `main`.
- Treat [2026-03-22-runtime-integration-hardening-design.md](/Users/dmulcahey/development/skills/superpowers/docs/superpowers/specs/2026-03-22-runtime-integration-hardening-design.md) revision `1` as the exact source contract for this draft plan.
- Keep markdown authoritative throughout; no helper or wrapper may become a second approval authority.
- Reuse and extend existing helpers instead of introducing duplicate binaries or alternate state machines.
- Edit `SKILL.md.tmpl` files and regenerate `SKILL.md`; do not hand-edit generated skill docs.
- Preserve one-release compatibility for legacy `reason`, legacy evidence reading, and deprecated command-entry shims.
- Preserve Bash and PowerShell parity for every new helper surface and JSON schema.

## Not In Scope

- Replacing markdown artifacts with hidden authoritative runtime state
- Adding mutating public CLI commands
- Making browser QA universal
- Removing step-serial execution
- Reworking unrelated workflow stages outside this contract-hardening slice
- Adding accelerated-review packet inspection to the public workflow CLI; that remains a separate TODO and should not widen this implementation slice

## Execution Strategy

1. Lock the stronger end-to-end contract into red fixtures and regression tests before changing runtime behavior.
2. Harden route-time readiness so `implementation_ready` uses the same approved-plan contract as deeper helpers.
3. Promote `superpowers-plan-contract` analysis and packet buildability into engineering approval law and handoff law.
4. Add helper-owned execution `preflight`, `gate-review`, and `gate-finish` surfaces plus evidence v2 provenance.
5. Formalize structured QA and release-readiness artifacts and wire them into finish freshness rules.
6. Expand `superpowers-workflow` into the full read-only operator view over routing, handoff, preflight, review, and finish.
7. Make `using-superpowers` start with runtime-owned session-entry resolution and reduce fallback to the smallest conservative surface.
8. Replace deprecated command dead ends with compatibility shims, align docs, and run the full targeted verification matrix.

## Evidence Expectations

- Every task must leave targeted regression coverage for the contract it tightens.
- Helper-command tasks must leave JSON-schema or fixture-backed proof for both happy-path and fail-closed cases.
- Skill-template tasks must leave regenerated `SKILL.md` output plus passing wording-contract tests.
- Late-stage gate tasks must leave stale-artifact and stale-evidence proof, not just passing happy-path assertions.
- Final verification must demonstrate route-time readiness, analyze-plan gating, execution gates, late-stage artifact freshness, public CLI inspection, session-entry routing, and Bash/PowerShell parity.

## Validation Strategy

At minimum, this plan should finish with these passing commands:

```bash
node scripts/gen-skill-docs.mjs --check
node --test tests/codex-runtime/*.test.mjs
bash tests/codex-runtime/test-superpowers-workflow-status.sh
bash tests/codex-runtime/test-superpowers-plan-contract.sh
bash tests/codex-runtime/test-superpowers-plan-execution.sh
bash tests/codex-runtime/test-superpowers-workflow.sh
bash tests/codex-runtime/test-superpowers-session-entry-gate.sh
bash tests/codex-runtime/test-using-superpowers-bypass.sh
bash tests/codex-runtime/test-workflow-sequencing.sh
bash tests/codex-runtime/test-workflow-enhancements.sh
bash tests/codex-runtime/test-runtime-instructions.sh
bash tests/codex-runtime/test-powershell-wrapper-bash-resolution.sh
```

## Documentation Update Expectations

- Update `README.md` with stronger readiness semantics, public CLI expansion, and helper-owned review and finish gating.
- Update `docs/README.codex.md` and `docs/README.copilot.md` where operator-facing workflow explanations change.
- Update `docs/testing.md` so the new gate, artifact-freshness, and wrapper-parity checks are discoverable.
- Update `RELEASE-NOTES.md` with the contract-hardening summary and compatibility notes.
- Update any touched workflow-fixture documentation when new artifact shapes or expectations are added.

## Rollout Plan

- Land regression fixtures and red assertions first.
- Land route-time and plan-contract hardening before public CLI expansion so the wrapper consumes stable semantics.
- Land execution gates before QA and release freshness wiring so finish gating can compose on top of concrete helper behavior.
- Land `using-superpowers` and compatibility shims after the helper-backed route semantics are stable.
- Keep the full change fail-closed throughout; no intermediate slice should widen readiness semantics.

## Rollback Plan

- Revert helper, wrapper, skill-template, generated-skill, command-doc, test, and docs changes together.
- Stop routing through stronger plan-contract and late-stage gate checks.
- Leave approved specs, approved plans, execution evidence, and historical late-stage artifacts untouched.
- Because helper state is derived, rollback does not require a data migration.

## Risks And Mitigations

- Risk: route-time and deeper helpers drift again after this project.
  Mitigation: centralize canonical plan parsing and make all consumers reuse the same structured contract output.
- Risk: evidence v2 introduces compatibility churn.
  Mitigation: keep one-release read compatibility, rewrite on new mutations, and emit explicit legacy warnings.
- Risk: the public CLI grows beyond a read-only operator view.
  Mitigation: keep all new wrapper commands read-only and helper-composed.
- Risk: this change touches many files and becomes difficult to verify.
  Mitigation: stage work in narrow, test-backed tasks and keep full verification in the final task.

## Diagrams

### Change Surface

```text
Task 1: red fixtures and contract coverage
    |
    v
Task 2: workflow-status + shared parser hardening
    |
    v
Task 3: analyze-plan authority + ENG approval law
    |
    v
Task 4: execution gates + evidence v2
    |
    v
Task 5: QA/release artifacts + finish freshness
    |
    v
Task 6: public workflow CLI expansion
    |
    v
Task 7: using-superpowers gate + compatibility shims
    |
    v
Task 8: docs alignment + full verification
```

### Runtime Boundary

```text
approved spec ----+
                  |
approved plan ----+--> plan-contract / workflow-status / workflow
                  |
                  +--> plan-execution --> evidence v2 --> gate-review / gate-finish

Authority stays in markdown.
Helpers enforce and inspect.
```

## Requirement Coverage Matrix

- REQ-001 -> Task 2
- REQ-002 -> Task 2, Task 3
- REQ-003 -> Task 2
- REQ-004 -> Task 1, Task 2, Task 6
- REQ-005 -> Task 1, Task 3
- REQ-006 -> Task 3
- REQ-007 -> Task 3, Task 4
- REQ-008 -> Task 1, Task 4
- REQ-009 -> Task 4
- REQ-010 -> Task 4
- REQ-011 -> Task 4, Task 5
- REQ-012 -> Task 4
- REQ-013 -> Task 4
- REQ-014 -> Task 1, Task 3, Task 5
- REQ-015 -> Task 5
- REQ-016 -> Task 1, Task 6
- REQ-017 -> Task 6
- REQ-018 -> Task 1, Task 7
- REQ-019 -> Task 1, Task 7
- REQ-020 -> Task 2, Task 3, Task 4, Task 5, Task 6, Task 7, Task 8
- REQ-021 -> Task 2, Task 3
- REQ-022 -> Task 7
- NONGOAL-001 -> Task 2, Task 3, Task 6
- NONGOAL-002 -> Task 5, Task 6, Task 7
- NONGOAL-003 -> Task 4, Task 5, Task 6
- VERIFY-001 -> Task 1, Task 2, Task 3, Task 4, Task 5, Task 6, Task 7, Task 8

## Task 1: Add Red Contract Coverage And Fixtures

**Spec Coverage:** REQ-004, REQ-005, REQ-008, REQ-014, REQ-016, REQ-018, REQ-019, VERIFY-001
**Task Outcome:** The repo has red tests and fixtures that pin the stronger route-time, plan-contract, execution-gate, late-stage-artifact, public-CLI, and session-entry expectations before implementation begins.
**Plan Constraints:**
- Keep this task test-first; do not make production helper changes here.
- Add both happy-path and fail-closed fixtures.
- Prefer extending existing fixture directories and harnesses over inventing parallel test scaffolds.
**Open Questions:** none

**Files:**
- Modify: `tests/codex-runtime/test-superpowers-workflow-status.sh`
- Modify: `tests/codex-runtime/test-superpowers-plan-contract.sh`
- Modify: `tests/codex-runtime/test-superpowers-plan-execution.sh`
- Modify: `tests/codex-runtime/test-superpowers-workflow.sh`
- Modify: `tests/codex-runtime/test-superpowers-session-entry-gate.sh`
- Modify: `tests/codex-runtime/test-using-superpowers-bypass.sh`
- Modify: `tests/codex-runtime/test-workflow-sequencing.sh`
- Modify: `tests/codex-runtime/test-workflow-enhancements.sh`
- Modify: `tests/codex-runtime/test-runtime-instructions.sh`
- Modify: `tests/codex-runtime/test-powershell-wrapper-bash-resolution.sh`
- Modify: `tests/codex-runtime/workflow-fixtures.test.mjs`
- Modify: `tests/codex-runtime/skill-doc-contracts.test.mjs`
- Modify: `tests/codex-runtime/fixtures/plan-contract/valid-plan.md`
- Modify: `tests/codex-runtime/fixtures/plan-contract/invalid-malformed-files-plan.md`
- Modify: `tests/codex-runtime/fixtures/plan-contract/invalid-missing-coverage-plan.md`
- Create: `tests/codex-runtime/fixtures/workflow-artifacts/specs/2026-03-22-runtime-integration-hardening-design.md`
- Create: `tests/codex-runtime/fixtures/workflow-artifacts/plans/2026-03-22-runtime-integration-hardening.md`
- Modify: `tests/codex-runtime/fixtures/workflow-artifacts/README.md`
- Test: `bash tests/codex-runtime/test-superpowers-workflow-status.sh`
- Test: `bash tests/codex-runtime/test-superpowers-plan-contract.sh`
- Test: `bash tests/codex-runtime/test-superpowers-plan-execution.sh`
- Test: `bash tests/codex-runtime/test-superpowers-workflow.sh`
- Test: `bash tests/codex-runtime/test-superpowers-session-entry-gate.sh`
- Test: `bash tests/codex-runtime/test-using-superpowers-bypass.sh`

- [x] **Step 1: Extend route-time fixtures for thin-header, malformed-contract, stale-plan, and ambiguous-resolution cases**
- [x] **Step 2: Extend plan-contract fixtures for invalid analysis output, incomplete packet buildability, and overlapping write-scope diagnostics**
- [x] **Step 3: Extend execution-state fixtures for legacy evidence, stale evidence, missed reopen, and packet-fingerprint mismatch**
- [x] **Step 4: Add QA-result and release-readiness freshness fixtures plus wrapper expectations for `phase`, `doctor`, `handoff`, and gate surfaces**
- [x] **Step 5: Add red assertions to workflow, skill-doc, and session-entry tests for the new helper-owned wording and compatibility-shim behavior**
- [x] **Step 6: Run the targeted tests and confirm failures point at missing hardening rather than unrelated repo state**
- [x] **Step 7: Commit the red contract scaffold**
## Task 2: Harden `superpowers-workflow-status` Around The Full Approved-Plan Contract

**Spec Coverage:** REQ-001, REQ-002, REQ-003, REQ-004, REQ-020, REQ-021, VERIFY-001, NONGOAL-001
**Task Outcome:** Route-time readiness and JSON diagnostics are driven by the same canonical approved-plan contract that deeper helpers already expect, and `implementation_ready` can no longer be produced from a thin or malformed plan.
**Plan Constraints:**
- Reuse shared parsing rather than duplicating header law.
- Preserve conservative fallback behavior and the legacy `reason` field for one release cycle.
- Keep public wrapper behavior read-only; only helper internals change here.
**Open Questions:** none

**Files:**
- Modify: `bin/superpowers-workflow-status`
- Modify: `bin/superpowers-workflow-status.ps1`
- Modify: `bin/superpowers-plan-structure-common`
- Modify: `tests/codex-runtime/test-superpowers-workflow-status.sh`
- Modify: `tests/codex-runtime/test-superpowers-workflow.sh`
- Modify: `tests/codex-runtime/test-powershell-wrapper-bash-resolution.sh`
- Test: `bash tests/codex-runtime/test-superpowers-workflow-status.sh`
- Test: `bash tests/codex-runtime/test-superpowers-workflow.sh`
- Test: `bash tests/codex-runtime/test-powershell-wrapper-bash-resolution.sh`

- [x] **Step 1: Extract or extend canonical approved-plan header parsing so route-time and deeper helpers can share one effective contract**
- [x] **Step 2: Make route-time readiness require full header validation, approved spec path and revision matching, and contract-valid execution-bound plans**
- [x] **Step 3: Add conservative backward routing for invalid headers, invalid contract state, stale spec-plan linkage, and ambiguous artifact resolution**
- [x] **Step 4: Add schema-versioned structured diagnostics, bounded-scan visibility, and candidate counts while preserving legacy `reason`**
- [x] **Step 5: Mirror the behavior and output schema in `bin/superpowers-workflow-status.ps1`**
- [x] **Step 6: Run the workflow-status, wrapper, and parity tests until the new route-time contract is green**
- [x] **Step 7: Commit the route-time hardening slice**
## Task 3: Promote `superpowers-plan-contract` Into Approval And Handoff Law

**Spec Coverage:** REQ-002, REQ-005, REQ-006, REQ-007, REQ-014, REQ-020, REQ-021, VERIFY-001, NONGOAL-001
**Task Outcome:** `analyze-plan` becomes the authoritative contract-analysis surface, packet provenance is standardized, and `plan-eng-review` cannot approve or hand off a plan unless every task packet is buildable.
**Plan Constraints:**
- Extend the existing helper instead of creating a parallel analyzer.
- Keep packet output derived from authoritative markdown rather than turning packets into new authority.
- Update the engineering review skill contract through templates, then regenerate generated docs.
**Open Questions:** none

**Files:**
- Modify: `bin/superpowers-plan-contract`
- Modify: `bin/superpowers-plan-contract.ps1`
- Modify: `skills/plan-eng-review/SKILL.md.tmpl`
- Modify: `skills/plan-eng-review/SKILL.md`
- Modify: `tests/codex-runtime/test-superpowers-plan-contract.sh`
- Modify: `tests/codex-runtime/test-workflow-sequencing.sh`
- Modify: `tests/codex-runtime/test-runtime-instructions.sh`
- Modify: `tests/codex-runtime/skill-doc-contracts.test.mjs`
- Test: `bash tests/codex-runtime/test-superpowers-plan-contract.sh`
- Test: `bash tests/codex-runtime/test-workflow-sequencing.sh`
- Test: `bash tests/codex-runtime/test-runtime-instructions.sh`
- Test: `node --test tests/codex-runtime/skill-doc-contracts.test.mjs`

- [x] **Step 1: Add `analyze-plan --format json` with the required contract-state, fingerprint, buildability, and diagnostics schema**
- [x] **Step 2: Standardize task-packet provenance fields so every packet includes the exact approved plan and spec identity it was built from**
- [x] **Step 3: Mirror the command surface and JSON schema in `bin/superpowers-plan-contract.ps1`**
- [x] **Step 4: Tighten `plan-eng-review` so approval requires `contract_state == valid` and `packet_buildable_tasks == task_count`**
- [x] **Step 5: Upgrade the ENG review handoff wording so execution never starts from packets that are missing or stale for the approved revision**
- [x] **Step 6: Regenerate skill docs and run the helper plus skill-contract suites**
- [x] **Step 7: Commit the plan-contract and ENG-gate slice**
## Task 4: Add Execution Preflight, Review And Finish Gates Plus Evidence V2

**Spec Coverage:** REQ-007, REQ-008, REQ-009, REQ-010, REQ-011, REQ-012, REQ-013, REQ-020, VERIFY-001, NONGOAL-003
**Task Outcome:** `superpowers-plan-execution` owns read-only `preflight`, `gate-review`, and core `gate-finish` logic with fail-closed provenance checks, and execution mutations rewrite evidence into v2 with packet identity binding.
**Plan Constraints:**
- Keep execution-state ownership inside `superpowers-plan-execution`.
- Preserve one-release readability for legacy evidence while making new mutations write v2.
- Update execution and review skills only after helper behavior is concrete.
**Open Questions:** none

**Files:**
- Modify: `bin/superpowers-plan-execution`
- Modify: `bin/superpowers-plan-execution.ps1`
- Modify: `skills/executing-plans/SKILL.md.tmpl`
- Modify: `skills/executing-plans/SKILL.md`
- Modify: `skills/subagent-driven-development/SKILL.md.tmpl`
- Modify: `skills/subagent-driven-development/SKILL.md`
- Modify: `skills/requesting-code-review/SKILL.md.tmpl`
- Modify: `skills/requesting-code-review/SKILL.md`
- Modify: `tests/codex-runtime/test-superpowers-plan-execution.sh`
- Modify: `tests/codex-runtime/test-workflow-sequencing.sh`
- Modify: `tests/codex-runtime/test-workflow-enhancements.sh`
- Modify: `tests/codex-runtime/test-powershell-wrapper-bash-resolution.sh`
- Test: `bash tests/codex-runtime/test-superpowers-plan-execution.sh`
- Test: `bash tests/codex-runtime/test-workflow-sequencing.sh`
- Test: `bash tests/codex-runtime/test-workflow-enhancements.sh`
- Test: `bash tests/codex-runtime/test-powershell-wrapper-bash-resolution.sh`

- [x] **Step 1: Add read-only `preflight`, `gate-review`, and `gate-finish` command parsing plus fail-closed failure classes and diagnostics**
- [x] **Step 2: Implement evidence-v2 parsing and writing, including plan, spec, task, step, packet, head, base, and file-proof provenance**
- [x] **Step 3: Bind `begin`, `transfer`, `complete`, and `status` to packet identity so stale or mismatched packets cannot silently pass**
- [x] **Step 4: Mirror the new gate behavior and schema in `bin/superpowers-plan-execution.ps1`**
- [x] **Step 5: Update `executing-plans`, `subagent-driven-development`, and `requesting-code-review` to call the new preflight and review gates instead of relying on prose-only checks**
- [x] **Step 6: Run execution, sequencing, enhancement, and parity tests until stale-evidence and missed-reopen cases are green**
- [x] **Step 7: Commit the execution-gates and evidence-v2 slice**
## Task 5: Formalize QA And Release-Readiness Artifacts

**Spec Coverage:** REQ-011, REQ-014, REQ-015, REQ-020, VERIFY-001, NONGOAL-002, NONGOAL-003
**Task Outcome:** QA and release-readiness artifacts are structured, helper-inspectable, freshness-checked inputs into finish gating instead of loosely coupled late-stage prose.
**Plan Constraints:**
- Keep browser QA conditional; do not make it universal.
- Preserve `document-release` as a required repo-facing late-stage handoff, not as an approval authority.
- Reuse the existing project-state artifact locations and naming patterns.
**Open Questions:** none

**Files:**
- Modify: `skills/plan-eng-review/SKILL.md.tmpl`
- Modify: `skills/plan-eng-review/SKILL.md`
- Modify: `skills/qa-only/SKILL.md.tmpl`
- Modify: `skills/qa-only/SKILL.md`
- Modify: `skills/document-release/SKILL.md.tmpl`
- Modify: `skills/document-release/SKILL.md`
- Modify: `skills/finishing-a-development-branch/SKILL.md.tmpl`
- Modify: `skills/finishing-a-development-branch/SKILL.md`
- Modify: `bin/superpowers-plan-execution`
- Modify: `tests/codex-runtime/test-superpowers-plan-execution.sh`
- Modify: `tests/codex-runtime/test-workflow-enhancements.sh`
- Modify: `tests/codex-runtime/test-runtime-instructions.sh`
- Test: `bash tests/codex-runtime/test-superpowers-plan-execution.sh`
- Test: `bash tests/codex-runtime/test-workflow-enhancements.sh`
- Test: `bash tests/codex-runtime/test-runtime-instructions.sh`

- [x] **Step 1: Upgrade the ENG review test-plan artifact metadata so source plan, revision, branch, repo, QA requirement, and generation provenance are explicit**
- [x] **Step 2: Make `qa-only` write structured QA result artifacts with stable result values and source-plan linkage**
- [x] **Step 3: Make `document-release` write structured release-readiness artifacts with branch, base, head, and result provenance**
- [x] **Step 4: Wire `gate-finish` freshness checks for QA and release artifacts, including branch, head, plan-path, and plan-revision validation**
- [x] **Step 5: Update `finishing-a-development-branch` to rely on helper-backed finish readiness instead of prose-only late-stage checks**
- [x] **Step 6: Regenerate skill docs and run finish-gate, workflow-enhancement, and runtime-instruction tests**
- [x] **Step 7: Commit the structured-artifact slice**
## Task 6: Expand `superpowers-workflow` Into The Full Read-Only Operator Surface

**Spec Coverage:** REQ-004, REQ-016, REQ-017, REQ-020, VERIFY-001, NONGOAL-001, NONGOAL-002, NONGOAL-003
**Task Outcome:** The public workflow CLI can report phase, diagnostics, handoff readiness, preflight state, review gate results, and finish gate results without mutating workflow state or becoming a new authority.
**Plan Constraints:**
- Keep this surface read-only.
- Compose helper outputs; do not duplicate deeper business logic inside the wrapper.
- Provide both human-readable and JSON output for every new command.
**Open Questions:** none

**Files:**
- Modify: `bin/superpowers-workflow`
- Modify: `bin/superpowers-workflow.ps1`
- Modify: `tests/codex-runtime/test-superpowers-workflow.sh`
- Modify: `tests/codex-runtime/test-powershell-wrapper-bash-resolution.sh`
- Modify: `tests/codex-runtime/workflow-fixtures.test.mjs`
- Modify: `README.md`
- Modify: `docs/README.codex.md`
- Modify: `docs/README.copilot.md`
- Test: `bash tests/codex-runtime/test-superpowers-workflow.sh`
- Test: `bash tests/codex-runtime/test-powershell-wrapper-bash-resolution.sh`
- Test: `node --test tests/codex-runtime/workflow-fixtures.test.mjs`

- [x] **Step 1: Add `phase`, `doctor`, `handoff`, `preflight`, `gate review`, and `gate finish` command routing to the Bash wrapper**
- [x] **Step 2: Compose route-time status, plan-contract analysis, execution-gate state, late-stage artifact freshness, and manifest diagnostics into stable human-readable and JSON output**
- [x] **Step 3: Mirror the command surface and output semantics in `bin/superpowers-workflow.ps1`**
- [x] **Step 4: Extend wrapper tests and fixtures to cover the new operator surfaces and bounded-scan diagnostics**
- [x] **Step 5: Update operator-facing README docs so the supported public CLI reflects the expanded read-only surface**
- [x] **Step 6: Run wrapper, fixture, and parity tests until the public CLI contract is green**
- [x] **Step 7: Commit the public-CLI expansion slice**
## Task 7: Make `using-superpowers` Session-Entry First And Replace Dead-End Command Docs

**Spec Coverage:** REQ-018, REQ-019, REQ-022, REQ-020, VERIFY-001, NONGOAL-002
**Task Outcome:** `using-superpowers` begins with the runtime-owned Step 1 session-entry gate before any normal-stack behavior, and deprecated command entry points become compatibility shims that route users into the supported workflow instead of stranding them.
**Plan Constraints:**
- Do not compute `_SESSIONS`, inspect artifacts, or start normal routing before the session-entry helper resolves to `enabled`.
- Keep fallback helper-unavailable logic minimal and conservative.
- Update templates first, then regenerate generated docs.
**Open Questions:** none

**Files:**
- Modify: `skills/using-superpowers/SKILL.md.tmpl`
- Modify: `skills/using-superpowers/SKILL.md`
- Modify: `commands/brainstorm.md`
- Modify: `commands/write-plan.md`
- Modify: `commands/execute-plan.md`
- Modify: `tests/codex-runtime/test-using-superpowers-bypass.sh`
- Modify: `tests/codex-runtime/test-superpowers-session-entry-gate.sh`
- Modify: `tests/codex-runtime/test-workflow-sequencing.sh`
- Modify: `tests/codex-runtime/test-runtime-instructions.sh`
- Modify: `tests/codex-runtime/skill-doc-contracts.test.mjs`
- Test: `bash tests/codex-runtime/test-using-superpowers-bypass.sh`
- Test: `bash tests/codex-runtime/test-superpowers-session-entry-gate.sh`
- Test: `bash tests/codex-runtime/test-workflow-sequencing.sh`
- Test: `bash tests/codex-runtime/test-runtime-instructions.sh`
- Test: `node --test tests/codex-runtime/skill-doc-contracts.test.mjs`

- [x] **Step 1: Make session-entry resolution the explicit first step in `using-superpowers` before `_SESSIONS`, artifact inspection, or normal routing**
- [x] **Step 2: Remove thin-header readiness inference from fallback and limit helper-unavailable behavior to conservative backward routing**
- [x] **Step 3: Replace dead-end command docs with compatibility shims that report current phase and route to the correct supported next surface**
- [x] **Step 4: Regenerate skill docs and update wording-contract tests for the new Step 1 gate and shim behavior**
- [x] **Step 5: Run bypass, session-entry, sequencing, and runtime-instruction tests until the fallback path cannot produce false-positive readiness**
- [x] **Step 6: Commit the routing-hardening and compatibility-shim slice**
## Task 8: Align Docs, Release Notes, And Run Full Verification

**Spec Coverage:** REQ-020, VERIFY-001
**Task Outcome:** Repo documentation, release notes, and verification outputs all reflect the stronger runtime contract, and the targeted regression matrix passes end to end.
**Plan Constraints:**
- Do not claim completion without running the full targeted verification matrix.
- Keep docs aligned with the actual helper behavior; do not document aspirational commands that are not implemented.
- Regenerate skill docs as part of final verification.
**Open Questions:** none

**Files:**
- Modify: `README.md`
- Modify: `docs/README.codex.md`
- Modify: `docs/README.copilot.md`
- Modify: `docs/testing.md`
- Modify: `RELEASE-NOTES.md`
- Modify: `skills/plan-eng-review/SKILL.md`
- Modify: `skills/executing-plans/SKILL.md`
- Modify: `skills/subagent-driven-development/SKILL.md`
- Modify: `skills/requesting-code-review/SKILL.md`
- Modify: `skills/finishing-a-development-branch/SKILL.md`
- Modify: `skills/qa-only/SKILL.md`
- Modify: `skills/document-release/SKILL.md`
- Modify: `skills/using-superpowers/SKILL.md`
- Test: `node scripts/gen-skill-docs.mjs --check`
- Test: `tests/codex-runtime/gen-skill-docs.unit.test.mjs`
- Test: `tests/codex-runtime/skill-doc-contracts.test.mjs`
- Test: `tests/codex-runtime/skill-doc-generation.test.mjs`
- Test: `tests/codex-runtime/workflow-fixtures.test.mjs`
- Test: `bash tests/codex-runtime/test-superpowers-workflow-status.sh`
- Test: `bash tests/codex-runtime/test-superpowers-plan-contract.sh`
- Test: `bash tests/codex-runtime/test-superpowers-plan-execution.sh`
- Test: `bash tests/codex-runtime/test-superpowers-workflow.sh`
- Test: `bash tests/codex-runtime/test-superpowers-session-entry-gate.sh`
- Test: `bash tests/codex-runtime/test-using-superpowers-bypass.sh`
- Test: `bash tests/codex-runtime/test-workflow-sequencing.sh`
- Test: `bash tests/codex-runtime/test-workflow-enhancements.sh`
- Test: `bash tests/codex-runtime/test-runtime-instructions.sh`
- Test: `bash tests/codex-runtime/test-powershell-wrapper-bash-resolution.sh`

- [x] **Step 1: Regenerate skill docs and update README, platform docs, testing docs, and release notes to match the implemented helper-owned contract**
- [x] **Step 2: Run `node scripts/gen-skill-docs.mjs --check` and the Node contract suites**
- [x] **Step 3: Run the full targeted shell regression matrix for workflow status, plan contract, plan execution, workflow wrapper, session entry, bypass, sequencing, enhancements, instructions, and parity**
- [x] **Step 4: Fix any doc drift, command-surface mismatch, or parity regression uncovered by the final verification pass**
- [x] **Step 5: Re-run the full targeted matrix until everything is green**
- [x] **Step 6: Commit the documentation and verification slice**
