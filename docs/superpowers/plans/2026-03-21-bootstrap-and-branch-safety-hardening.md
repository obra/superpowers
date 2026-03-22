# Bootstrap And Branch-Safety Hardening Implementation Plan

> **For Codex and GitHub Copilot workers:** REQUIRED: Use `superpowers:subagent-driven-development` when isolated-agent workflows are available in the current platform/session; otherwise use `superpowers:executing-plans`. Steps use checkbox (`- [ ]`) syntax for tracking.

**Workflow State:** Engineering Approved
**Plan Revision:** 1
**Execution Mode:** superpowers:executing-plans
**Source Spec:** `docs/superpowers/specs/2026-03-21-bootstrap-and-branch-safety-hardening-design.md`
**Source Spec Revision:** 1
**Last Reviewed By:** plan-eng-review

**Goal:** Make first-turn Superpowers entry fail closed through a runtime-owned session-entry contract, add a runtime-owned protected-branch repo-write gate, and ship the helper, workflow, docs, and regression coverage needed to make those guarantees real.

**Architecture:** First, introduce a shared runtime helper library so the new work does not deepen shell-primitive drift. Second, build two narrow helpers: `superpowers-session-entry` for first-turn bootstrap resolution and `superpowers-repo-safety` for protected-branch repo-write authorization. Third, wire the helpers into generated docs, supported entry instructions, and every repo-writing workflow stage, then prove the behavior with deterministic helper tests, workflow regressions, and the new first-turn gate.

**Tech Stack:** POSIX shell runtime helpers, PowerShell wrappers, Node-based skill-doc generation, Markdown skill templates, shell and `node:test` regression suites, repo docs and workflow docs

---

## What Already Exists

- `bin/superpowers-workflow-status` already owns conservative workflow-state routing, manifest recovery, JSON failure output, and repo identity recovery.
- `bin/superpowers-plan-execution` already owns explicit failure classes, normalized path validation, bounded text handling, and approved-plan execution truth.
- `bin/superpowers-slug` already owns repo slug plus repo-safe branch identity and should remain the identity source of truth.
- `bin/superpowers-pwsh-common.ps1` already provides a shared PowerShell wrapper surface.
- `scripts/gen-skill-docs.mjs` already owns generated preamble and `using-superpowers` contract rendering.
- `skills/using-superpowers/SKILL.md.tmpl` already documents the bypass gate, but today that wording is still generator-owned rather than runtime-owned.
- `tests/codex-runtime/test-using-superpowers-bypass.sh` already covers the decision-file wording contract, but not the first-turn entrypoint guarantee.
- `tests/codex-runtime/test-superpowers-workflow-status.sh`, `tests/codex-runtime/test-superpowers-plan-execution.sh`, and `tests/codex-runtime/test-superpowers-slug.sh` already provide strong regression surfaces for helper behavior that must keep passing after the shared-library migration.
- Workflow skill templates under `skills/*/SKILL.md.tmpl` already own the repo-writing stages that need the new protected-branch preflight.
- `references/search-before-building.md` plus `tests/evals/search-before-building-contract.orchestrator.md` already define a shared prompt-surface contract for representative design/review surfaces such as `brainstorming`; this plan must preserve that contract when it edits those skills.

## Planned File Structure

- Create: `bin/superpowers-runtime-common.sh`
  Shared Bash primitives for normalized repo-relative paths, bounded whitespace normalization, and shell-safe identifier normalization used by touched runtime helpers.
- Modify: `bin/superpowers-pwsh-common.ps1`
  Extend the shared PowerShell helper surface so the new wrappers and touched existing wrappers do not grow duplicate normalization logic.
- Modify: `bin/superpowers-workflow-status`
- Modify: `bin/superpowers-plan-execution`
  Migrate touched existing helpers onto the shared runtime primitive library without changing externally visible behavior.
- Create: `bin/superpowers-session-entry`
- Create: `bin/superpowers-session-entry.ps1`
  New runtime-owned first-turn bootstrap helper and PowerShell wrapper parity.
- Create: `bin/superpowers-repo-safety`
- Create: `bin/superpowers-repo-safety.ps1`
  New runtime-owned protected-branch repo-write authorization helper and PowerShell wrapper parity.
- Modify: `scripts/gen-skill-docs.mjs`
- Modify: `skills/using-superpowers/SKILL.md.tmpl`
- Modify generated output: `skills/using-superpowers/SKILL.md`
  Update generated docs so they reference runtime-owned session-entry enforcement instead of implying prose-only ownership.
- Modify: `skills/brainstorming/SKILL.md.tmpl`
- Modify: `skills/plan-ceo-review/SKILL.md.tmpl`
- Modify: `skills/writing-plans/SKILL.md.tmpl`
- Modify: `skills/plan-eng-review/SKILL.md.tmpl`
- Modify: `skills/executing-plans/SKILL.md.tmpl`
- Modify: `skills/subagent-driven-development/SKILL.md.tmpl`
- Modify: `skills/document-release/SKILL.md.tmpl`
- Modify: `skills/finishing-a-development-branch/SKILL.md.tmpl`
- Regenerate corresponding `skills/*/SKILL.md`
  Add the shared `superpowers-repo-safety` preflight at every repo-writing workflow stage.
- Create: `tests/codex-runtime/test-superpowers-session-entry.sh`
- Create: `tests/codex-runtime/test-superpowers-repo-safety.sh`
- Create: `tests/codex-runtime/test-superpowers-session-entry-gate.sh`
  Deterministic helper coverage plus a first-turn supported-entry gate.
- Modify: `tests/codex-runtime/test-superpowers-workflow-status.sh`
- Modify: `tests/codex-runtime/test-superpowers-plan-execution.sh`
- Modify: `tests/codex-runtime/test-superpowers-slug.sh`
  Parity coverage for the shared-runtime-library migration.
- Modify: `tests/codex-runtime/test-using-superpowers-bypass.sh`
- Modify: `tests/codex-runtime/test-runtime-instructions.sh`
- Modify: `tests/codex-runtime/test-workflow-enhancements.sh`
- Modify: `tests/codex-runtime/test-workflow-sequencing.sh`
- Modify: `tests/codex-runtime/skill-doc-contracts.test.mjs`
- Modify: `tests/evals/using-superpowers-routing.scenarios.md`
  Update deterministic regression suites for the new helper contracts and workflow-stage call sites.
- Modify: `README.md`
- Modify: `docs/README.codex.md`
- Modify: `docs/README.copilot.md`
- Modify: `docs/testing.md`
  Document the stronger bootstrap owner, protected-branch gate, and new test surfaces.

## Not In Scope

- A global or session-wide protected-branch bypass.
- Pattern or glob support for protected-branch configuration beyond exact names.
- Auto-creating worktrees, auto-switching branches, or auto-approving risky writes.
- A public inspection CLI for branch-safety approvals or session-entry diagnostics in this change.
- Broad workflow-state ownership expansion for `superpowers-workflow-status` or `superpowers-plan-execution`.
- Implementation work outside the runtime, workflow, docs, and tests needed for these guarantees.

## Preconditions

- The approved spec at `docs/superpowers/specs/2026-03-21-bootstrap-and-branch-safety-hardening-design.md` remains `CEO Approved` at `Spec Revision` 1 while this plan is authored and reviewed.
- The repo continues using generated `skills/*/SKILL.md` output from `SKILL.md.tmpl` plus `scripts/gen-skill-docs.mjs`.
- The engineer has Bash, Node, and the existing shell-based test harness available locally.

## Execution Strategy

Deliver this work in strict dependency order:

1. Shared runtime primitives and parity migration ship first so the new helpers do not add another copy of path, text, and identifier normalization.
2. `superpowers-session-entry` and `superpowers-repo-safety` ship as isolated helper slices with deterministic tests before any workflow or doc adoption depends on them.
3. Generated docs and workflow-stage call sites adopt the new helpers only after the helper contracts and parity coverage are stable.
4. Final docs and verification land last so the published runtime contract and the test matrix describe the shipped behavior exactly.

This ordering is mandatory. Do not start workflow-stage adoption or public-contract wording changes on top of drifting helper primitives.

## Evidence Expectations

- Each task must start with a failing targeted test or assertion that proves the behavior is not yet implemented.
- Each task must end with the smallest passing verification set for the files changed in that slice.
- Each task commit must include only the files listed for that slice unless an unexpected dependency is discovered and documented in the commit message or handoff.
- Final handoff must include the exact commands run, whether they passed, and any remaining gaps if a command could not be executed.

## Validation Strategy

- Primitive-sharing validation:
  - parity assertions in the touched existing helper suites
  - no externally visible behavior drift after migration
- New-helper validation:
  - deterministic JSON contract coverage for both new helpers
  - PowerShell wrapper resolution coverage
- Adoption validation:
  - generated skill-doc contract assertions
  - workflow-sequencing and workflow-enhancement regressions
  - first-turn session-entry gate regression
  - post-bypass `using-superpowers` routing eval through the checked-in orchestrator/runner/judge flow
  - Search-Before-Building contract eval when touched workflow skill or doc surfaces overlap that shared prompt contract
- Final validation:
  - full targeted matrix from Task 6
  - `superpowers:verification-before-completion` before handoff

## Documentation Update Expectations

- Any change to `SKILL.md.tmpl` must be followed by regenerating the corresponding `SKILL.md`.
- Runtime-facing docs must distinguish bootstrap-entry ownership, workflow-state ownership, and protected-branch repo-write ownership.
- `docs/testing.md` must describe the new helper suites and the first-turn gate regression so future work knows which guarantees are covered where.

## Rollout Plan

1. Land the shared runtime helper library and parity migration for touched existing helpers.
2. Land `superpowers-session-entry` with deterministic helper and wrapper coverage.
3. Land `superpowers-repo-safety` with deterministic helper coverage.
4. Adopt runtime-owned session-entry wording and the first-turn supported-entry gate.
5. Adopt protected-branch preflight at every repo-writing workflow stage.
6. Refresh docs and run the final targeted verification matrix before handoff.

## Rollback Plan

- If the shared runtime library migration regresses existing helpers, revert that slice before any new helper or workflow adoption lands.
- If either new helper proves unstable, revert that helper slice and any dependent adoption commits together so generated docs and workflow stages do not point at a missing contract.
- If workflow-stage adoption causes false positives on protected branches, revert the adoption slice while retaining helper-level tests and implementation for follow-up fixes.
- If doc generation or runtime-instruction wording drifts, revert the affected doc/adoption slice rather than weakening helper fail-closed behavior.

## Risks And Mitigations

- Risk: shared primitive migration changes helper behavior in subtle ways.
  Mitigation: add explicit parity assertions before the refactor and rerun the existing helper suites unchanged after migration.
- Risk: session-entry adoption still leaves a supported entry path that skips the helper.
  Mitigation: add a dedicated first-turn gate regression that fails if normal behavior appears before the bypass question.
- Risk: repo-safety approvals are reused too broadly on protected branches.
  Mitigation: bind approvals to deterministic fingerprints over branch, stage, task identity, paths, and symbolic write targets.
- Risk: workflow templates miss one repo-writing stage.
  Mitigation: update the stage list from the approved spec and pin the expected helper call sites in workflow regression tests.
- Risk: PowerShell wrapper parity drifts from the Bash helpers.
  Mitigation: keep wrapper coverage in scope for both new helpers and route shared normalization through the common wrapper surface.

## Implementation Notes

- Use `superpowers:test-driven-development` per task slice: make the tests fail first, implement the smallest change, rerun, then commit.
- Keep the helper boundaries strict:
  - `superpowers-session-entry` owns bootstrap resolution only
  - `superpowers-repo-safety` owns protected-branch authorization only
  - `superpowers-workflow-status` and `superpowers-plan-execution` keep their current authority boundaries
- Reuse `bin/superpowers-slug` for repo identity. Do not re-derive slug or branch-safe identity in new helpers.
- Shared primitives introduced here must be reused by the touched helpers in the same change. Do not ship new private copies of path, text, or identifier normalization logic.
- Keep the hot path cheap:
  - deterministic file paths
  - bounded local reads
  - no broad directory scans on normal helper invocations
- Keep blocked-write messaging explicit and auditable. The user must be told the branch, stage, blocking failure class, and next action.
- Keep local runtime state local. Neither helper should write authoritative repo artifacts.
- Use `superpowers:verification-before-completion` before final handoff.

## Diagrams

### Delivery Slices

```text
Task 1: shared runtime primitives + helper parity
   |
   v
Task 2: session-entry helper
   |
   v
Task 3: repo-safety helper
   |
   v
Task 4: session-entry contract adoption
   |
   v
Task 5: repo-safety workflow adoption
   |
   v
Task 6: docs + final verification
```

### Runtime Integration Flow

```text
supported entrypoint
    |
    v
superpowers-session-entry
    |
    +--> bypass / needs question / enabled
                       |
                       v
               using-superpowers routing
                       |
                       v
             repo-writing workflow stages
                       |
                       v
             superpowers-repo-safety
                       |
          +------------+------------+
          |                         |
          v                         v
       allowed                  blocked
          |                         |
          v                         v
    mutate repo state       explain + reroute
```

## Failure Modes To Guard

| Codepath | Failure to prevent | Guardrail |
| --- | --- | --- |
| shared runtime primitive migration | helper parity regressions in path/text/identifier normalization | explicit parity tests in existing helper suites |
| session entry resolve | missing or malformed decision state silently falls through to normal behavior | `needs_user_choice` fail-closed contract + first-turn gate test |
| explicit re-entry | persistence failure suppresses future turns incorrectly | `explicit_reentry_unpersisted` coverage |
| repo safety check | stale or partially matching approval is reused | approval fingerprint + mismatch failure class coverage |
| workflow-stage adoption | one repo-writing stage mutates repo state without preflight | workflow sequencing/enhancement regressions |
| docs/runtime guidance | generated or public docs still imply prose-only ownership | runtime-instructions and skill-doc contract coverage |

## Task 1: Add Shared Runtime Primitives And Migrate Touched Helpers

**Files:**
- Create: `bin/superpowers-runtime-common.sh`
- Modify: `bin/superpowers-pwsh-common.ps1`
- Modify: `bin/superpowers-workflow-status`
- Modify: `bin/superpowers-plan-execution`
- Modify: `tests/codex-runtime/test-superpowers-workflow-status.sh`
- Modify: `tests/codex-runtime/test-superpowers-plan-execution.sh`
- Modify: `tests/codex-runtime/test-superpowers-slug.sh`
- Test: `bash tests/codex-runtime/test-superpowers-workflow-status.sh`
- Test: `bash tests/codex-runtime/test-superpowers-plan-execution.sh`
- Test: `bash tests/codex-runtime/test-superpowers-slug.sh`

- [x] **Step 1: Add red parity assertions for shared primitives**
```bash
require_pattern tests/codex-runtime/test-superpowers-workflow-status.sh "normalized repo-relative paths"
require_pattern tests/codex-runtime/test-superpowers-plan-execution.sh "whitespace normalization"
require_pattern tests/codex-runtime/test-superpowers-slug.sh "branch-safe identifier"
```

- [x] **Step 2: Run the helper parity suites and capture the current baseline**
Run: `bash tests/codex-runtime/test-superpowers-workflow-status.sh && bash tests/codex-runtime/test-superpowers-plan-execution.sh && bash tests/codex-runtime/test-superpowers-slug.sh`
Expected: PASS before the refactor so failures after migration are real regressions.

- [x] **Step 3: Create the shared Bash runtime library**
```bash
normalize_repo_relative_path() { ... }
normalize_whitespace_bounded() { ... }
normalize_identifier_token() { ... }
```

- [x] **Step 4: Move touched existing helpers onto the shared primitives**
Update `bin/superpowers-workflow-status` and `bin/superpowers-plan-execution` to source the shared Bash library and to keep their existing JSON/error contracts unchanged.

- [x] **Step 5: Extend the shared PowerShell helper surface**
Add PowerShell equivalents for the new normalization primitives to `bin/superpowers-pwsh-common.ps1` so the new wrappers do not grow private implementations. This task owns all shared PowerShell foundation changes needed by later helper wrappers.

- [x] **Step 6: Re-run the helper parity suites**
Run: `bash tests/codex-runtime/test-superpowers-workflow-status.sh && bash tests/codex-runtime/test-superpowers-plan-execution.sh && bash tests/codex-runtime/test-superpowers-slug.sh`
Expected: PASS with no externally visible behavior drift.

- [x] **Step 7: Commit the shared-runtime-library migration**
```bash
git add bin/superpowers-runtime-common.sh bin/superpowers-pwsh-common.ps1 bin/superpowers-workflow-status bin/superpowers-plan-execution tests/codex-runtime/test-superpowers-workflow-status.sh tests/codex-runtime/test-superpowers-plan-execution.sh tests/codex-runtime/test-superpowers-slug.sh
git commit -m "refactor: share runtime helper primitives"
```

## Task 2: Implement `superpowers-session-entry`

**Files:**
- Create: `bin/superpowers-session-entry`
- Create: `bin/superpowers-session-entry.ps1`
- Create: `tests/codex-runtime/test-superpowers-session-entry.sh`
- Modify: `tests/codex-runtime/test-powershell-wrapper-bash-resolution.sh`
- Test: `bash tests/codex-runtime/test-superpowers-session-entry.sh`
- Test: `bash tests/codex-runtime/test-powershell-wrapper-bash-resolution.sh`

- [x] **Step 1: Add red helper tests for session-entry outcomes**
```bash
expect_json_field outcome needs_user_choice
expect_json_field decision_source missing
expect_json_field failure_class MalformedDecisionState
populate_decoy_state_tree 100
expect_json_field decision_path "$EXPECTED_DECISION_PATH"
require_absent_pattern bin/superpowers-session-entry 'find .*session-flags'
```

- [x] **Step 2: Run the red session-entry helper test**
Run: `bash tests/codex-runtime/test-superpowers-session-entry.sh`
Expected: FAIL because the helper does not exist yet.

- [x] **Step 3: Implement the Bash helper**
```bash
superpowers-session-entry resolve --message-file <path> [--session-key <id>]
superpowers-session-entry record --decision enabled|bypassed [--session-key <id>]
```
Return JSON with `outcome`, `decision_source`, `session_key`, `decision_path`, `policy_source`, `persisted`, `failure_class`, and `reason`.

- [x] **Step 4: Implement the PowerShell wrapper**
Use the shared PowerShell helper surface from Task 1 and keep CLI semantics aligned with the Bash helper. Do not add new shared-wrapper primitives in this task unless Task 1 is explicitly reopened.

- [x] **Step 5: Re-run the helper tests**
Run: `bash tests/codex-runtime/test-superpowers-session-entry.sh && bash tests/codex-runtime/test-powershell-wrapper-bash-resolution.sh`
Expected: PASS for missing, enabled, bypassed, malformed, explicit re-entry, re-entry write-failure, and the normal-path hot-path guard that proves the helper still uses the derived decision file even when unrelated session state exists.

- [x] **Step 6: Commit the session-entry helper**
```bash
git add bin/superpowers-session-entry bin/superpowers-session-entry.ps1 tests/codex-runtime/test-superpowers-session-entry.sh tests/codex-runtime/test-powershell-wrapper-bash-resolution.sh
git commit -m "feat: add session-entry runtime helper"
```

## Task 3: Implement `superpowers-repo-safety`

**Files:**
- Create: `bin/superpowers-repo-safety`
- Create: `bin/superpowers-repo-safety.ps1`
- Create: `tests/codex-runtime/test-superpowers-repo-safety.sh`
- Test: `bash tests/codex-runtime/test-superpowers-repo-safety.sh`

- [x] **Step 1: Add red helper tests for protected-branch authorization**
```bash
expect_json_field outcome blocked
expect_json_field failure_class ProtectedBranchDetected
expect_json_field failure_class ApprovalFingerprintMismatch
expect_json_field protected_by default
populate_decoy_approval_tree 100
expect_json_field approval_path "$EXPECTED_APPROVAL_PATH"
require_absent_pattern bin/superpowers-repo-safety 'find .*repo-safety'
```

- [x] **Step 2: Run the red repo-safety helper test**
Run: `bash tests/codex-runtime/test-superpowers-repo-safety.sh`
Expected: FAIL because the helper does not exist yet.

- [x] **Step 3: Implement the Bash helper**
Support:
```text
superpowers-repo-safety check --intent write|read --stage <skill-id> --task-id <id> [--path <repo-path>]... [--write-target <target>]...
superpowers-repo-safety approve --stage <skill-id> --task-id <id> --reason <text> [--path <repo-path>]... [--write-target <target>]...
```
Use deterministic approval paths, exact protected-branch defaults, bounded input validation, and approval fingerprints.

- [x] **Step 4: Implement the PowerShell wrapper**
Keep output fields and failure classes aligned with the Bash helper and reuse the shared wrapper primitives established in Task 1.

- [x] **Step 5: Re-run the repo-safety tests**
Run: `bash tests/codex-runtime/test-superpowers-repo-safety.sh`
Expected: PASS for default-protected branches, feature branches, matching approvals, mismatched task/path/target/fingerprint cases, read-only calls, and the normal-path hot-path guard that proves the helper reads the deterministic approval path rather than scanning decoy local state.

- [x] **Step 6: Commit the repo-safety helper**
```bash
git add bin/superpowers-repo-safety bin/superpowers-repo-safety.ps1 tests/codex-runtime/test-superpowers-repo-safety.sh
git commit -m "feat: add protected-branch repo safety helper"
```

## Task 4: Adopt Runtime-Owned Session Entry

**Files:**
- Modify: `scripts/gen-skill-docs.mjs`
- Modify: `skills/using-superpowers/SKILL.md.tmpl`
- Modify generated output: `skills/using-superpowers/SKILL.md`
- Modify: `README.md`
- Modify: `docs/README.codex.md`
- Modify: `docs/README.copilot.md`
- Modify: `docs/testing.md`
- Modify: `tests/codex-runtime/test-using-superpowers-bypass.sh`
- Modify: `tests/codex-runtime/test-runtime-instructions.sh`
- Modify: `tests/codex-runtime/skill-doc-contracts.test.mjs`
- Modify: `tests/evals/using-superpowers-routing.scenarios.md`
- Create: `tests/codex-runtime/test-superpowers-session-entry-gate.sh`
- Test: `node scripts/gen-skill-docs.mjs`
- Test: `node scripts/gen-skill-docs.mjs --check`
- Test: `node --test tests/codex-runtime/skill-doc-contracts.test.mjs`
- Test: `bash tests/codex-runtime/test-using-superpowers-bypass.sh`
- Test: `bash tests/codex-runtime/test-superpowers-session-entry-gate.sh`
- Test: `bash tests/codex-runtime/test-runtime-instructions.sh`
- Test: agent-executed routing evaluation using the checked-in orchestration entrypoint plus the runner/judge instruction set

- [x] **Step 1: Add red contract assertions for runtime-owned session entry**
```bash
require_pattern skills/using-superpowers/SKILL.md "session-entry bootstrap ownership is runtime-owned"
require_pattern skills/using-superpowers/SKILL.md "missing or malformed decision state fails closed"
```

- [x] **Step 2: Run the red doc/runtime tests**
Run: `node --test tests/codex-runtime/skill-doc-contracts.test.mjs && bash tests/codex-runtime/test-using-superpowers-bypass.sh && bash tests/codex-runtime/test-runtime-instructions.sh`
Expected: FAIL because the generated docs still describe the bootstrap boundary as generator-owned.

- [x] **Step 3: Update the generator and template**
Make the generated `using-superpowers` contract explicitly reference `superpowers-session-entry` as the bootstrap owner and document `needs_user_choice`, explicit re-entry, and fail-closed behavior.

- [x] **Step 4: Add the first-turn supported-entry gate**
Create `tests/codex-runtime/test-superpowers-session-entry-gate.sh` to fail if a fresh entry path reaches normal behavior before the bypass prompt or if malformed state bypasses the prompt.

- [x] **Step 5: Extend the post-bypass routing eval with one bootstrap-adjacent scenario**
Update `tests/evals/using-superpowers-routing.scenarios.md` with one scenario where the session is already pre-seeded to `enabled`, the prompt explicitly mentions using Superpowers, and the expected route still follows artifact state instead of resurfacing bootstrap logic.

- [x] **Step 6: Refresh the public docs**
Update `README.md`, `docs/README.codex.md`, `docs/README.copilot.md`, and `docs/testing.md` so they distinguish workflow-state guarantees from bootstrap-entry guarantees and explicitly call out the deterministic first-turn gate plus the post-bypass routing eval as complementary coverage.

- [x] **Step 7: Re-run the session-entry verification set**
Run: `node scripts/gen-skill-docs.mjs && node scripts/gen-skill-docs.mjs --check && node --test tests/codex-runtime/skill-doc-contracts.test.mjs && bash tests/codex-runtime/test-using-superpowers-bypass.sh && bash tests/codex-runtime/test-superpowers-session-entry-gate.sh && bash tests/codex-runtime/test-runtime-instructions.sh`
Expected: PASS with the new runtime-owned bootstrap wording and first-turn gate.

- [x] **Step 8: Run the required focused routing eval for the `using-superpowers` surface**
Run the checked-in orchestration flow defined in `tests/evals/using-superpowers-routing.orchestrator.md`.
Expected behavior of that gate:
- execute the full repo-versioned scenario matrix from `tests/evals/using-superpowers-routing.scenarios.md`
- include the new bootstrap-adjacent post-bypass scenario
- preserve the existing positive-control and fail-closed routing expectations
- pass only if the judge finds that the runtime-owned bootstrap wording changes do not perturb post-bypass routing outcomes

- [x] **Step 9: Commit the session-entry adoption slice**
```bash
git add scripts/gen-skill-docs.mjs skills/using-superpowers/SKILL.md.tmpl skills/using-superpowers/SKILL.md README.md docs/README.codex.md docs/README.copilot.md docs/testing.md tests/codex-runtime/test-using-superpowers-bypass.sh tests/codex-runtime/test-superpowers-session-entry-gate.sh tests/codex-runtime/test-runtime-instructions.sh tests/codex-runtime/skill-doc-contracts.test.mjs tests/evals/using-superpowers-routing.scenarios.md
git commit -m "feat: harden runtime-owned session entry"
```

## Task 5: Wire Protected-Branch Safety Into Repo-Writing Workflow Stages

**Files:**
- Modify: `skills/brainstorming/SKILL.md.tmpl`
- Modify: `skills/plan-ceo-review/SKILL.md.tmpl`
- Modify: `skills/writing-plans/SKILL.md.tmpl`
- Modify: `skills/plan-eng-review/SKILL.md.tmpl`
- Modify: `skills/executing-plans/SKILL.md.tmpl`
- Modify: `skills/subagent-driven-development/SKILL.md.tmpl`
- Modify: `skills/document-release/SKILL.md.tmpl`
- Modify: `skills/finishing-a-development-branch/SKILL.md.tmpl`
- Regenerate corresponding `skills/*/SKILL.md`
- Modify: `tests/codex-runtime/test-workflow-enhancements.sh`
- Modify: `tests/codex-runtime/test-workflow-sequencing.sh`
- Modify: `tests/codex-runtime/skill-doc-contracts.test.mjs`
- Test: `node scripts/gen-skill-docs.mjs`
- Test: `node scripts/gen-skill-docs.mjs --check`
- Test: `bash tests/codex-runtime/test-workflow-enhancements.sh`
- Test: `bash tests/codex-runtime/test-workflow-sequencing.sh`
- Test: agent-executed Search-Before-Building contract evaluation using the checked-in orchestration entrypoint plus the runner/judge instruction set

- [x] **Step 1: Add red workflow-stage assertions for repo-safety preflight**
```bash
require_pattern skills/brainstorming/SKILL.md 'superpowers-repo-safety check --intent write'
require_pattern skills/brainstorming/SKILL.md 'superpowers-repo-safety approve --stage'
require_pattern skills/plan-ceo-review/SKILL.md 'superpowers-repo-safety check --intent write'
require_pattern skills/finishing-a-development-branch/SKILL.md 'superpowers-repo-safety check --intent write'
```

- [x] **Step 2: Run the red workflow-stage tests**
Run: `bash tests/codex-runtime/test-workflow-enhancements.sh && bash tests/codex-runtime/test-workflow-sequencing.sh`
Expected: FAIL because repo-writing workflow stages do not yet document or require the shared preflight and rescue flow.

- [x] **Step 3: Update repo-writing workflow templates**
Add one shared blocked-write rescue pattern at the correct pre-write boundary for spec writes, approval-header writes, plan writes, execution task slices, release-doc writes, and branch-finishing commands:

```text
superpowers-repo-safety check --intent write ...
  -> if allowed, continue
  -> if blocked, explain branch/stage/failure_class and route to either:
     - feature branch / superpowers:using-git-worktrees
     - explicit user approval for the current task scope
  -> if the user explicitly approves the current task scope:
     superpowers-repo-safety approve --stage ... --task-id ... --reason ... [--path ...] [--write-target ...]
     superpowers-repo-safety check --intent write ...   # must pass before continuing
```

Keep this flow structurally identical across touched repo-writing skills so the protected-branch escape hatch is narrow, auditable, and not re-invented per stage.

- [x] **Step 4: Regenerate the skill docs**
Run: `node scripts/gen-skill-docs.mjs`
Expected: generated `SKILL.md` files match the updated templates.

- [x] **Step 5: Re-run workflow-stage regressions**
Run: `node scripts/gen-skill-docs.mjs --check && bash tests/codex-runtime/test-workflow-enhancements.sh && bash tests/codex-runtime/test-workflow-sequencing.sh`
Expected: PASS with the repo-safety gate present at every repo-writing stage, the explicit approval rescue flow documented consistently, and the gate still absent from read-only flows.

- [x] **Step 6: Re-run the shared Search-Before-Building contract gate**
Run the checked-in orchestration flow defined in `tests/evals/search-before-building-contract.orchestrator.md`.
Expected: PASS for the representative scenario matrix, proving the touched workflow skill surfaces still treat Layer 2 as input-not-authority, preserve sanitization/fallback language, and do not regress the shared Search-Before-Building contract.

- [x] **Step 7: Commit the workflow adoption slice**
```bash
git add skills/brainstorming/SKILL.md.tmpl skills/plan-ceo-review/SKILL.md.tmpl skills/writing-plans/SKILL.md.tmpl skills/plan-eng-review/SKILL.md.tmpl skills/executing-plans/SKILL.md.tmpl skills/subagent-driven-development/SKILL.md.tmpl skills/document-release/SKILL.md.tmpl skills/finishing-a-development-branch/SKILL.md.tmpl skills/brainstorming/SKILL.md skills/plan-ceo-review/SKILL.md skills/writing-plans/SKILL.md skills/plan-eng-review/SKILL.md skills/executing-plans/SKILL.md skills/subagent-driven-development/SKILL.md skills/document-release/SKILL.md skills/finishing-a-development-branch/SKILL.md tests/codex-runtime/test-workflow-enhancements.sh tests/codex-runtime/test-workflow-sequencing.sh tests/codex-runtime/skill-doc-contracts.test.mjs
git commit -m "feat: gate repo-writing workflow stages on protected branches"
```

## Task 6: Final Verification, Docs, And Handoff

**Files:**
- Test: `node scripts/gen-agent-docs.mjs --check`
- Test: `node scripts/gen-skill-docs.mjs --check`
- Test: `node --test tests/codex-runtime/*.test.mjs`
- Test: `bash tests/codex-runtime/test-runtime-instructions.sh`
- Test: `bash tests/codex-runtime/test-using-superpowers-bypass.sh`
- Test: `bash tests/codex-runtime/test-superpowers-session-entry.sh`
- Test: `bash tests/codex-runtime/test-superpowers-session-entry-gate.sh`
- Test: `bash tests/codex-runtime/test-superpowers-repo-safety.sh`
- Test: `bash tests/codex-runtime/test-workflow-enhancements.sh`
- Test: `bash tests/codex-runtime/test-workflow-sequencing.sh`
- Test: `bash tests/codex-runtime/test-superpowers-plan-execution.sh`
- Test: `bash tests/codex-runtime/test-superpowers-workflow-status.sh`
- Test: `bash tests/codex-runtime/test-superpowers-slug.sh`
- Test: `bash tests/codex-runtime/test-powershell-wrapper-bash-resolution.sh`
- Test: agent-executed routing evaluation using the checked-in orchestration entrypoint plus the runner/judge instruction set
- Test: agent-executed Search-Before-Building contract evaluation using the checked-in orchestration entrypoint plus the runner/judge instruction set

- [x] **Step 1: Refresh the docs/testing guidance**
Verify that the docs already updated in Task 4 still explicitly distinguish:
  - helper-backed workflow-state guarantees
  - bootstrap-entry guarantees
  - protected-branch repo-write guarantees

If this verification reveals a doc regression, reopen the owning task instead of silently broadening Task 6 into another doc-edit slice.

- [x] **Step 2: Run the full targeted verification matrix**
Run:
```bash
node scripts/gen-agent-docs.mjs --check
node scripts/gen-skill-docs.mjs --check
node --test tests/codex-runtime/*.test.mjs
bash tests/codex-runtime/test-runtime-instructions.sh
bash tests/codex-runtime/test-using-superpowers-bypass.sh
bash tests/codex-runtime/test-superpowers-session-entry.sh
bash tests/codex-runtime/test-superpowers-session-entry-gate.sh
bash tests/codex-runtime/test-superpowers-repo-safety.sh
bash tests/codex-runtime/test-workflow-enhancements.sh
bash tests/codex-runtime/test-workflow-sequencing.sh
bash tests/codex-runtime/test-superpowers-plan-execution.sh
bash tests/codex-runtime/test-superpowers-workflow-status.sh
bash tests/codex-runtime/test-superpowers-slug.sh
bash tests/codex-runtime/test-powershell-wrapper-bash-resolution.sh
```
Expected: PASS.

Run the checked-in orchestration flow defined in `tests/evals/using-superpowers-routing.orchestrator.md`.
Expected: PASS for the full repo-versioned routing matrix, including the bootstrap-adjacent post-bypass scenario added in Task 4.

Run the checked-in orchestration flow defined in `tests/evals/search-before-building-contract.orchestrator.md`.
Expected: PASS for the representative Search-Before-Building matrix after the workflow skill and doc changes in this plan.

- [x] **Step 3: Run `superpowers:verification-before-completion`**
Confirm the helper binaries, generated docs, and regression surfaces all pass before handoff.

- [x] **Step 4: Commit the final verification/doc updates**
```bash
git commit -m "test: finalize bootstrap and branch-safety hardening coverage"
```

- [x] **Step 5: Sync the plan artifact and hand off**
Run: `$_SUPERPOWERS_ROOT/bin/superpowers-workflow-status sync --artifact plan --path docs/superpowers/plans/2026-03-21-bootstrap-and-branch-safety-hardening.md`
Expected: manifest reports the draft plan path.

Then invoke `superpowers:plan-eng-review`.
