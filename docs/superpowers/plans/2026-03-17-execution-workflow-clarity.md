# Execution Workflow Clarity Implementation Plan

> **For Codex and GitHub Copilot workers:** REQUIRED: Use `superpowers:subagent-driven-development` when isolated-agent workflows are available in the current platform/session; otherwise use `superpowers:executing-plans`. Steps use checkbox (`- [ ]`) syntax for tracking.

**Workflow State:** Engineering Approved
**Source Spec:** `docs/superpowers/specs/2026-03-17-execution-workflow-clarity-design.md`
**Source Spec Revision:** 1
**Last Reviewed By:** plan-eng-review

**Goal:** Add a dedicated execution-stage helper that keeps approved plan markdown truthful during execution, records step evidence canonically, and gives `plan-eng-review` a deterministic execution-path recommendation.

**Architecture:** Implement `bin/superpowers-plan-execution` as a shell helper with a PowerShell wrapper matching the existing runtime-helper pattern. Keep the approved plan markdown authoritative for live execution state, store semantic proof in a revision-scoped evidence artifact, and update execution/review skills so they call the helper instead of relying on ad hoc checklist edits or handoff judgment.

**Tech Stack:** POSIX shell, PowerShell wrapper parity, generated `SKILL.md` docs from `SKILL.md.tmpl`, shell regression tests, Node skill-doc contract tests

---

## What Already Exists

- `bin/superpowers-workflow-status` and `bin/superpowers-workflow-status.ps1` already provide the internal-helper shape to mirror: shell-first runtime logic, JSON output, bounded failure behavior, and wrapper parity.
- `bin/superpowers-pwsh-common.ps1` already provides the Git Bash discovery and JSON path-conversion primitives needed by a new wrapper.
- `tests/codex-runtime/test-superpowers-workflow-status.sh` already shows the preferred temp-repo regression style for workflow helpers.
- `tests/codex-runtime/test-runtime-instructions.sh`, `tests/codex-runtime/test-workflow-sequencing.sh`, `tests/codex-runtime/skill-doc-contracts.test.mjs`, and `tests/codex-runtime/skill-doc-generation.test.mjs` already enforce runtime-surface, workflow-contract, and generated-doc freshness guarantees.
- `scripts/gen-skill-docs.mjs` is already the supported way to regenerate `skills/*/SKILL.md` from the `.tmpl` sources.
- `skills/plan-eng-review/`, `skills/subagent-driven-development/`, `skills/executing-plans/`, `skills/requesting-code-review/`, `skills/finishing-a-development-branch/`, and `skills/writing-plans/` already define the execution-stage workflow that must be brought into alignment with the new helper contract.

## Not In Scope

- Replacing markdown plans with manifest-owned execution state.
- Turning `superpowers-plan-execution` into a public user-facing CLI beyond the internal runtime contract in the spec.
- Reworking the approval workflow before `implementation_ready`.
- Expanding the helper into a general local event log or background service.
- Reopening the approved v1 design during implementation; if the helper contract proves unworkable, stop and route back through a new spec/review cycle.

## Decisions To Preserve

- The plan markdown is the only authoritative live execution-state record.
- `superpowers-plan-execution` is a dedicated helper, not an extension of `superpowers-workflow-status`.
- `status`, mutation success payloads, and failures stay machine-readable on `stdout`.
- V1 uses one combined `execution_fingerprint`, not separate plan/evidence fingerprints.
- Execution stays serial at the step level, with one current-work slot and one parked interrupted slot.
- `recommend` remains pre-execution-only and fail-closed on non-execution-ready plans.

## Implementation Shape

```text
plan-eng-review
    |
    v
superpowers-plan-execution recommend
    |
    v
execution skill preflight
    |
    v
status -> begin -> note/complete/transfer/reopen
    |
    +--> plan markdown (authoritative live state)
    |
    +--> execution-evidence/<plan>-r<revision>-evidence.md
    |
    v
requesting-code-review / finishing-a-development-branch
```

## Task 1: Add Red Regression Coverage For The New Helper Contract

**Files:**
- Create: `tests/codex-runtime/test-superpowers-plan-execution.sh`
- Modify: `tests/codex-runtime/test-runtime-instructions.sh`
- Modify: `tests/codex-runtime/test-powershell-wrapper-bash-resolution.sh`
- Modify: `tests/codex-runtime/test-workflow-sequencing.sh`
- Modify: `tests/codex-runtime/skill-doc-contracts.test.mjs`
- Test: `bash tests/codex-runtime/test-superpowers-plan-execution.sh`
- Test: `bash tests/codex-runtime/test-runtime-instructions.sh`
- Test: `bash tests/codex-runtime/test-powershell-wrapper-bash-resolution.sh`
- Test: `bash tests/codex-runtime/test-workflow-sequencing.sh`
- Test: `node --test tests/codex-runtime/skill-doc-contracts.test.mjs`

- [ ] **Step 1: Scaffold a temp-repo shell regression harness for the new helper**

```bash
#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
EXEC_BIN="$REPO_ROOT/bin/superpowers-plan-execution"
STATE_DIR="$(mktemp -d)"
REPO_DIR="$(mktemp -d)"
trap 'rm -rf "$STATE_DIR" "$REPO_DIR"' EXIT
export SUPERPOWERS_STATE_DIR="$STATE_DIR"
```

- [ ] **Step 2: Add failing read-only contract cases for `status` and `recommend`**

```text
Cover at least:
- valid approved plan with `Execution Mode: none`
- missing / malformed `Plan Revision` or `Execution Mode`
- empty/header-only evidence stub
- evidence history plus `Execution Mode: none`
- malformed note structure
- post-start `recommend`
```

- [ ] **Step 3: Add failing mutation cases for `begin`, `note`, `complete`, `reopen`, and `transfer`**

```text
Cover at least:
- stale `--expect-execution-fingerprint`
- same-step `begin` idempotency
- blocked/interrupted resume rules
- overlong ordinary `note`
- verification-mode exclusivity
- cross-step parked-step transfer rules
- partial-write rollback and stale/ambiguous recovery for `complete`, `reopen`, and `transfer`
```

- [ ] **Step 4: Extend runtime validation and wrapper tests to require the new helper binaries**

```bash
# Add:
# - bin/superpowers-plan-execution
# - bin/superpowers-plan-execution.ps1
# - tests/codex-runtime/test-superpowers-plan-execution.sh
#
# Extend the wrapper test so it verifies the new PowerShell wrapper forwards
# arguments to the bash helper and preserves its exit code.
```

- [ ] **Step 5: Add failing workflow/doc contract assertions for the new helper**

```text
Assert that:
- plan-eng-review calls `recommend` during handoff
- execution skills call `status` during preflight and helper mutations during step execution
- review/finish skills reject dirty or unsupported checked-off state
- writing-plans emits `Plan Revision: 1` and `Execution Mode: none`
```

- [ ] **Step 6: Run the red tests and capture the expected failures**

Run: `bash tests/codex-runtime/test-superpowers-plan-execution.sh`
Expected: FAIL because the helper and contract wiring do not exist yet

Run: `bash tests/codex-runtime/test-runtime-instructions.sh`
Expected: FAIL with missing runtime-file references for the new helper

Run: `bash tests/codex-runtime/test-powershell-wrapper-bash-resolution.sh`
Expected: FAIL once the new wrapper assertions are added but the wrapper does not exist yet

Run: `bash tests/codex-runtime/test-workflow-sequencing.sh`
Expected: FAIL until the skill/docs mention the new helper contract

Run: `node --test tests/codex-runtime/skill-doc-contracts.test.mjs`
Expected: FAIL until the generated skill docs reflect the new helper-owned workflow

- [ ] **Step 7: Commit the red regression scaffold**

```bash
git add tests/codex-runtime/test-superpowers-plan-execution.sh tests/codex-runtime/test-runtime-instructions.sh tests/codex-runtime/test-powershell-wrapper-bash-resolution.sh tests/codex-runtime/test-workflow-sequencing.sh tests/codex-runtime/skill-doc-contracts.test.mjs
git commit -m "test: scaffold plan execution helper coverage"
```

## Task 2: Implement The Helper Skeleton, Read-Only State Model, And Wrapper Parity

**Files:**
- Create: `bin/superpowers-plan-execution`
- Create: `bin/superpowers-plan-execution.ps1`
- Modify: `tests/codex-runtime/test-superpowers-plan-execution.sh`
- Modify: `tests/codex-runtime/test-powershell-wrapper-bash-resolution.sh`
- Test: `bash tests/codex-runtime/test-superpowers-plan-execution.sh`
- Test: `bash tests/codex-runtime/test-powershell-wrapper-bash-resolution.sh`

- [ ] **Step 1: Implement the CLI skeleton with explicit subcommands**

```bash
case "${1:-}" in
  status) shift; cmd_status "$@" ;;
  recommend) shift; cmd_recommend "$@" ;;
  begin) shift; cmd_begin "$@" ;;
  transfer) shift; cmd_transfer "$@" ;;
  complete) shift; cmd_complete "$@" ;;
  note) shift; cmd_note "$@" ;;
  reopen) shift; cmd_reopen "$@" ;;
  *) usage; exit 1 ;;
esac
```

- [ ] **Step 2: Add the bounded JSON success and failure emitters**

```bash
emit_error() {
  local klass="$1" message="$2"
  printf '{"error_class":"%s","message":"%s"}\n' \
    "$(json_escape "$klass")" \
    "$(json_escape "$message")"
}
```

- [ ] **Step 3: Implement shared parsing and path-normalization helpers**

```text
Add helpers for:
- repo-relative `--plan` validation under `docs/superpowers/plans/`
- plan header parsing
- evidence-path derivation from plan path + plan revision
- execution note parsing / normalization
- combined execution fingerprint generation
```

- [ ] **Step 4: Implement `status` with the exact bounded schema**

```text
Return:
- plan_revision
- execution_mode
- execution_fingerprint
- evidence_path
- execution_started
- active_task / active_step
- blocking_task / blocking_step
- resume_task / resume_step
```

- [ ] **Step 5: Implement `recommend` with bounded `decision_flags`**

```text
Return only:
- recommended_skill
- reason
- decision_flags

Fail closed on:
- non-execution-ready plans
- post-start calls
```

- [ ] **Step 6: Add PowerShell wrapper parity using the workflow-status wrapper shape**

```powershell
. (Join-Path $PSScriptRoot 'superpowers-pwsh-common.ps1')
$bashPath = Get-SuperpowersBashPath
$bashScript = Convert-SuperpowersPathToBash -Path (Join-Path $PSScriptRoot 'superpowers-plan-execution')
```

- [ ] **Step 7: Run the read-only and wrapper regressions until they pass**

Run: `bash tests/codex-runtime/test-superpowers-plan-execution.sh`
Expected: PASS for `status`, `recommend`, and wrapper preflight cases; mutation cases still FAIL

Run: `bash tests/codex-runtime/test-powershell-wrapper-bash-resolution.sh`
Expected: PASS with the new helper wrapper included

- [ ] **Step 8: Commit the helper skeleton and read-only surfaces**

```bash
git add bin/superpowers-plan-execution bin/superpowers-plan-execution.ps1 tests/codex-runtime/test-superpowers-plan-execution.sh tests/codex-runtime/test-powershell-wrapper-bash-resolution.sh
git commit -m "feat: add plan execution helper read-only contract"
```

## Task 3: Implement `begin` And `note` With Strict Plan-State Enforcement

**Files:**
- Modify: `bin/superpowers-plan-execution`
- Modify: `tests/codex-runtime/test-superpowers-plan-execution.sh`
- Test: `bash tests/codex-runtime/test-superpowers-plan-execution.sh`

- [ ] **Step 1: Add current-work and parked-slot validation helpers**

```text
Detect and reject:
- duplicate active notes
- duplicate parked interrupted notes
- orphan notes
- note-bearing checked steps
- malformed note prefixes
```

- [ ] **Step 2: Implement `begin` with execution-mode initialization and summary synthesis**

```text
Rules:
- requires `--execution-mode` only when current mode is `none`
- writes `Active - <summary>` from the step title
- same-step retry is a no-op
- different-step conflict fails closed
```

- [ ] **Step 3: Implement `note --state interrupted|blocked` with the v1 targeting rules**

```text
Rules:
- only the current active step may be noted
- summaries must normalize to <= 120 characters
- repair-step interruption is blocked when the parked slot is already occupied
- blocked repair steps keep the current-work slot
```

- [ ] **Step 4: Return refreshed `status` after successful plan-only mutations**

```text
Do not add mutation metadata.
Always emit the same bounded `status` JSON schema on success.
```

- [ ] **Step 5: Run targeted mutation regressions**

Run: `bash tests/codex-runtime/test-superpowers-plan-execution.sh`
Expected: PASS for `begin` and `note` coverage; `complete`, `reopen`, and `transfer` cases still FAIL

- [ ] **Step 6: Commit the plan-only mutation flow**

```bash
git add bin/superpowers-plan-execution tests/codex-runtime/test-superpowers-plan-execution.sh
git commit -m "feat: add active-step execution note mutations"
```

## Task 4: Implement `complete`, `reopen`, And `transfer` With Atomic Evidence Updates

**Files:**
- Modify: `bin/superpowers-plan-execution`
- Modify: `tests/codex-runtime/test-superpowers-plan-execution.sh`
- Test: `bash tests/codex-runtime/test-superpowers-plan-execution.sh`

- [ ] **Step 1: Implement canonical empty-evidence handling and evidence-path creation**

```text
Treat both:
- missing evidence file
- valid header-only stub

as the same empty state behind one `execution_fingerprint`.
```

- [ ] **Step 2: Implement `complete` evidence-input validation and canonicalization**

```text
Validate:
- exactly one verification mode
- repo-root-bounded `--file` paths
- diff-aware deleted/renamed path handling
- sorted unique `**Files:**`
- canonical sentinel synthesis for no-file / manual verification cases
```

- [ ] **Step 3: Implement atomic `complete` plan + evidence writes**

```text
One logical mutation:
- check the step
- remove the execution note
- append/update the evidence attempt
- preserve pre-write state if either write fails
```

- [ ] **Step 4: Implement `reopen` invalidation and canonical reopened-note behavior**

```text
One logical mutation:
- clear the checked step
- invalidate the latest active evidence attempt
- record `Execution Source`
- write `Interrupted - Reopened: <reason summary>`
```

- [ ] **Step 5: Implement atomic `transfer` for cross-step invalidation repair**

```text
One logical mutation:
- park the current step
- reopen the completed repair step
- invalidate its prior evidence
- activate the repair step
- fail closed if a second parked interrupted step would be required
```

- [ ] **Step 6: Run the full helper regression suite to green**

- [ ] **Step 6: Add explicit failure-injection coverage for atomic rollback paths**

```text
Cover at least:
- evidence write failure after plan mutation attempt for `complete`
- evidence invalidation failure during `reopen`
- any mid-sequence failure during `transfer`
- stale/ambiguous follow-up behavior after those failures
```

- [ ] **Step 7: Run the full helper regression suite to green**

Run: `bash tests/codex-runtime/test-superpowers-plan-execution.sh`
Expected: PASS with `status`, `recommend`, `begin`, `note`, `complete`, `reopen`, and `transfer` coverage green

- [ ] **Step 8: Commit the evidence-backed mutation flow**

```bash
git add bin/superpowers-plan-execution tests/codex-runtime/test-superpowers-plan-execution.sh
git commit -m "feat: add execution evidence mutations"
```

## Task 5: Wire The Contract-Bearing Workflow Surfaces To The Helper

**Files:**
- Modify: `skills/writing-plans/SKILL.md.tmpl`
- Modify: `skills/plan-eng-review/SKILL.md.tmpl`
- Modify: `skills/subagent-driven-development/SKILL.md.tmpl`
- Modify: `skills/executing-plans/SKILL.md.tmpl`
- Modify: `skills/requesting-code-review/SKILL.md.tmpl`
- Modify: `skills/finishing-a-development-branch/SKILL.md.tmpl`
- Generate: `skills/writing-plans/SKILL.md`
- Generate: `skills/plan-eng-review/SKILL.md`
- Generate: `skills/subagent-driven-development/SKILL.md`
- Generate: `skills/executing-plans/SKILL.md`
- Generate: `skills/requesting-code-review/SKILL.md`
- Generate: `skills/finishing-a-development-branch/SKILL.md`
- Modify: `tests/codex-runtime/test-workflow-sequencing.sh`
- Modify: `tests/codex-runtime/skill-doc-contracts.test.mjs`
- Modify: `tests/codex-runtime/skill-doc-generation.test.mjs`
- Test: `node scripts/gen-skill-docs.mjs`
- Test: `node scripts/gen-skill-docs.mjs --check`
- Test: `bash tests/codex-runtime/test-workflow-sequencing.sh`
- Test: `node --test tests/codex-runtime/skill-doc-contracts.test.mjs tests/codex-runtime/skill-doc-generation.test.mjs`

- [ ] **Step 1: Update the plan-writing and handoff templates to emit the new header contract**

```text
`writing-plans` must default new plans to:
- `**Plan Revision:** 1`
- `**Execution Mode:** none`
```

- [ ] **Step 2: Update `plan-eng-review` to use helper recommendation at handoff**

```text
Handoff should:
- call `superpowers-plan-execution recommend --plan ...`
- present the recommended path first
- still mention the alternate override in prose
```

- [ ] **Step 3: Update the execution skills to use helper preflight and mutations**

```text
Execution skills should:
- call `status` during preflight
- call `begin` before live work
- call `note` / `complete` / `reopen` / `transfer` per the helper contract
- stop treating external task trackers as authoritative execution state
```

- [ ] **Step 4: Update review and branch-finish skills to enforce evidence-backed checked steps**

```text
`requesting-code-review` and `finishing-a-development-branch` should fail closed when:
- execution state is malformed or dirty
- checked steps lack valid evidence
- a missed reopen leaves stale evidence claiming completion
```

- [ ] **Step 5: Regenerate the skill docs and update runtime-facing documentation**

Run: `node scripts/gen-skill-docs.mjs`
Expected: Generated `SKILL.md` files reflect the updated templates

```text
This task is limited to:
- workflow-skill templates
- generated workflow-skill docs
- workflow contract tests
```

- [ ] **Step 6: Run the workflow contract and freshness checks**

Run: `bash tests/codex-runtime/test-workflow-sequencing.sh`
Expected: PASS with the new execution-helper workflow language present

Run: `node --test tests/codex-runtime/skill-doc-contracts.test.mjs tests/codex-runtime/skill-doc-generation.test.mjs`
Expected: PASS with regenerated skills and updated contract assertions

Run: `node scripts/gen-skill-docs.mjs --check`
Expected: PASS with `Generated skill docs are up to date.`

- [ ] **Step 7: Commit the workflow/documentation integration**

```bash
git add skills/writing-plans/SKILL.md.tmpl skills/plan-eng-review/SKILL.md.tmpl skills/subagent-driven-development/SKILL.md.tmpl skills/executing-plans/SKILL.md.tmpl skills/requesting-code-review/SKILL.md.tmpl skills/finishing-a-development-branch/SKILL.md.tmpl skills/writing-plans/SKILL.md skills/plan-eng-review/SKILL.md skills/subagent-driven-development/SKILL.md skills/executing-plans/SKILL.md skills/requesting-code-review/SKILL.md skills/finishing-a-development-branch/SKILL.md tests/codex-runtime/test-workflow-sequencing.sh tests/codex-runtime/skill-doc-contracts.test.mjs tests/codex-runtime/skill-doc-generation.test.mjs
git commit -m "docs: wire workflow skills to plan execution helper"
```

## Task 6: Update Runtime-Facing Docs And Runtime-Surface Validation

**Files:**
- Modify: `README.md`
- Modify: `docs/README.codex.md`
- Modify: `docs/README.copilot.md`
- Modify: `RELEASE-NOTES.md`
- Modify: `tests/codex-runtime/test-runtime-instructions.sh`
- Test: `bash tests/codex-runtime/test-runtime-instructions.sh`

- [ ] **Step 1: Update runtime-facing docs for the new internal helper surface**

```text
Update only:
- README workflow descriptions
- Codex/Copilot runtime docs
- release notes for the new internal helper surface
```

- [ ] **Step 2: Update runtime-surface validation expectations**

```text
Extend the runtime-instructions test so it checks:
- the new helper binaries exist
- runtime-facing docs mention the new helper contract where required
- no stale workflow text conflicts with the new execution helper model
```

- [ ] **Step 3: Run the runtime-surface validation check**

Run: `bash tests/codex-runtime/test-runtime-instructions.sh`
Expected: PASS with new helper files and runtime-facing references included

- [ ] **Step 4: Commit the runtime-facing documentation pass**

```bash
git add README.md docs/README.codex.md docs/README.copilot.md RELEASE-NOTES.md tests/codex-runtime/test-runtime-instructions.sh
git commit -m "docs: describe plan execution helper surface"
```

## Task 7: Run The Full Verification Set And Prepare For Engineering Review

**Files:**
- Modify: `docs/superpowers/plans/2026-03-17-execution-workflow-clarity.md`
- Test: `bash tests/codex-runtime/test-superpowers-plan-execution.sh`
- Test: `bash tests/codex-runtime/test-superpowers-workflow-status.sh`
- Test: `bash tests/codex-runtime/test-powershell-wrapper-bash-resolution.sh`
- Test: `bash tests/codex-runtime/test-runtime-instructions.sh`
- Test: `bash tests/codex-runtime/test-workflow-sequencing.sh`
- Test: `node --test tests/codex-runtime/skill-doc-contracts.test.mjs tests/codex-runtime/skill-doc-generation.test.mjs`
- Test: `node scripts/gen-skill-docs.mjs --check`

- [ ] **Step 1: Run the new helper regression suite**

Run: `bash tests/codex-runtime/test-superpowers-plan-execution.sh`
Expected: PASS

- [ ] **Step 2: Re-run the existing workflow-status regression suite**

Run: `bash tests/codex-runtime/test-superpowers-workflow-status.sh`
Expected: PASS

- [ ] **Step 3: Re-run PowerShell wrapper parity coverage**

Run: `bash tests/codex-runtime/test-powershell-wrapper-bash-resolution.sh`
Expected: PASS

- [ ] **Step 4: Re-run runtime-surface and workflow-sequencing checks**

Run: `bash tests/codex-runtime/test-runtime-instructions.sh`
Expected: PASS

Run: `bash tests/codex-runtime/test-workflow-sequencing.sh`
Expected: PASS

- [ ] **Step 5: Re-run generated-doc and skill-contract tests**

Run: `node --test tests/codex-runtime/skill-doc-contracts.test.mjs tests/codex-runtime/skill-doc-generation.test.mjs`
Expected: PASS

Run: `node scripts/gen-skill-docs.mjs --check`
Expected: PASS with no stale generated-skill output

- [ ] **Step 6: Update this plan with any engineering-review clarifications discovered during verification**

```text
Only clarify the written plan here.
Do not silently change the approved spec during implementation.
If verification reveals a spec bug, stop and route back through the spec workflow.
```

- [ ] **Step 7: Commit the final verification pass**

```bash
git add docs/superpowers/plans/2026-03-17-execution-workflow-clarity.md
git commit -m "chore: verify execution workflow clarity implementation"
```
