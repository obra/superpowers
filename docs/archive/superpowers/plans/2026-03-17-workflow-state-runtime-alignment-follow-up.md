# Workflow State Runtime Alignment Follow-Up Implementation Plan

> **For Codex and GitHub Copilot workers:** REQUIRED: Use `superpowers:subagent-driven-development` when isolated-agent workflows are available in the current platform/session; otherwise use `superpowers:executing-plans`. Steps use checkbox (`- [ ]`) syntax for tracking.

**Workflow State:** Engineering Approved
**Source Spec:** `docs/superpowers/specs/2026-03-17-workflow-state-runtime-design.md`
**Source Spec Revision:** 1
**Last Reviewed By:** plan-eng-review

**Goal:** Close the remaining helper/spec/plan alignment gaps in the workflow-state runtime without changing its approved core architecture.

**Architecture:** Extend the existing helper and regression suite to cover the remaining spec-promised surfaces: `status --summary`, repo-identity mismatch recovery, and explicit malformed-artifact diagnostics. Canonicalize helper diagnostics on `reason`, keep `implementation_ready` terminal with no fake execution skill, and reconcile the approved workflow documents with the final helper contract so the written artifacts, generated skills, and runtime behavior agree end to end. Keep repo docs authoritative, keep the manifest disposable, and keep every new rescue path fail-closed.

**Tech Stack:** POSIX shell, PowerShell wrapper parity, generated `SKILL.md` docs from `SKILL.md.tmpl`, shell regression tests, Node contract/freshness tests

---

## What Already Exists

Historical note: this section captures the draft-time repo state for this follow-up plan. For the current shipped state, use the repo contents and current release notes rather than the pre-implementation summary below.

- `bin/superpowers-workflow-status` already implements branch-scoped manifests, bounded fallback discovery, corruption recovery, path validation, and conservative workflow routing.
- `tests/codex-runtime/test-superpowers-workflow-status.sh` already covers bootstrap, stale plans, corruption recovery, write conflicts, branch isolation, fallback refresh behavior, and implementation-ready terminal state.
- `skills/using-superpowers/SKILL.md` and `skills/plan-eng-review/SKILL.md` already route through the helper and special-case `implementation_ready`.
- The review pass identified four remaining gaps:
  1. `status --summary` is specified but not implemented.
  2. Repo-identity mismatch handling is specified but not implemented.
  3. Malformed spec/plan diagnostics are not surfaced explicitly or tested.
  4. The approved spec/plan text is stale relative to the live helper contract.

## Not In Scope

- Re-architecting the helper away from branch-scoped manifests or repo-authoritative approvals.
- Expanding helper-driven routing beyond the current product-workflow pipeline.
- Turning the internal helper into the supported user-facing workflow CLI; that remains separate follow-up work.
- Broad execution-workflow changes related to plan checkbox enforcement; that is captured in `TODOS.md` as a separate workflow item.

## Decisions To Preserve

- Keep `implementation_ready` as a terminal status with an empty `next_skill`; do not reintroduce a fake execution pseudo-skill string.
- Make `reason` the canonical diagnostic field for helper JSON, summary output, and persisted manifest state; keep `note` only as a temporary compatibility alias if needed.
- Keep workflow skills invoking `$_SUPERPOWERS_ROOT/bin/superpowers-workflow-status`, not a bare command that assumes `PATH` installation.
- Keep repo docs authoritative for approvals and revision linkage.
- Keep manifest writes atomic and rescue paths conservative.
- Treat approved-doc reconciliation in this plan as clarification-only. If execution uncovers a material architectural change, stop and route back through the normal spec/review workflow instead of silently mutating approved artifacts in place.

## Task 1: Add Red Regression And Contract Coverage For The Missing Alignment Gaps

**Files:**
- Modify: `tests/codex-runtime/test-superpowers-workflow-status.sh`
- Modify: `tests/codex-runtime/test-workflow-sequencing.sh`
- Modify: `tests/codex-runtime/skill-doc-contracts.test.mjs`
- Test: `bash tests/codex-runtime/test-superpowers-workflow-status.sh`
- Test: `bash tests/codex-runtime/test-workflow-sequencing.sh`
- Test: `node --test tests/codex-runtime/skill-doc-contracts.test.mjs`

- [x] **Step 1: Add a failing `status --summary` regression**

```bash
# Assert that:
# - `status --summary` exits 0
# - it emits a compact human-readable line
# - it still reflects the same derived status as JSON mode
```

- [x] **Step 2: Add failing repo-identity mismatch regressions**

```bash
# Cover at least:
# - moved checkout / manifest repo_root mismatch
# - remote-slug change or cross-slug recovery path
#
# Expected behavior:
# - helper warns
# - preserves debugging evidence when needed
# - rebuilds under the current manifest path
# - routes conservatively for that invocation
```

- [x] **Step 3: Add failing malformed-artifact regressions**

```bash
# Cover:
# - malformed spec headers -> spec_draft + explicit malformed note
# - malformed plan headers -> plan_draft + explicit malformed note
```

- [x] **Step 4: Add failing schema-level helper contract assertions**

```bash
# Assert:
# - persisted manifest state stores current repo identity fields
# - `reason` is the canonical diagnostic field in emitted JSON and manifest state
# - any temporary `note` compatibility alias matches `reason`
# - `status --summary` and JSON describe the same derived status
```

- [x] **Step 5: Add failing doc-contract assertions for the approved artifacts**

```bash
# Assert the final written contract explicitly says:
# - runtime-root-aware helper invocation
# - `next_skill` is consumed only when non-empty
# - `implementation_ready` is terminal and must be handled separately
# - `status --summary` behavior, once finalized
```

- [x] **Step 6: Run the red tests and capture the failures**

Run: `bash tests/codex-runtime/test-superpowers-workflow-status.sh`
Expected: FAIL on missing summary, missing repo-identity handling, missing malformed-artifact notes, or canonical-field mismatches

Run: `bash tests/codex-runtime/test-workflow-sequencing.sh`
Expected: FAIL until approved-doc contract checks are updated

Run: `node --test tests/codex-runtime/skill-doc-contracts.test.mjs`
Expected: FAIL only if the new contract assertions are not yet satisfied

- [ ] **Step 7: Commit the red coverage**

```bash
git add tests/codex-runtime/test-superpowers-workflow-status.sh tests/codex-runtime/test-workflow-sequencing.sh tests/codex-runtime/skill-doc-contracts.test.mjs
git commit -m "test: cover workflow-state alignment gaps"
```

## Task 2: Implement `status --summary` And Lock Its Contract

**Files:**
- Modify: `bin/superpowers-workflow-status`
- Modify: `tests/codex-runtime/test-superpowers-workflow-status.sh`
- Modify: `README.md`
- Modify: `docs/README.codex.md`
- Modify: `docs/README.copilot.md`
- Test: `bash tests/codex-runtime/test-superpowers-workflow-status.sh`

- [x] **Step 1: Define the exact summary behavior**

```text
Recommended v1 behavior:
- default `status` -> JSON only
- `status --summary` -> one human-readable line instead of JSON
- line includes: status, next action (or implementation-ready handoff), selected spec/plan path, and canonical `reason`
- emitted JSON and persisted manifest state use `reason` as the canonical diagnostic field
```

- [x] **Step 2: Implement `--summary` option parsing without changing default JSON mode**

```bash
case "$arg" in
  --refresh) refresh=1 ;;
  --summary) summary=1 ;;
  *)
```

- [x] **Step 3: Implement a deterministic summary renderer**

```bash
emit_summary() {
  # Example shape:
  # status=spec_draft next=superpowers:plan-ceo-review spec=... plan=... reason=...
}
```

- [x] **Step 4: Route `implementation_ready` cleanly in summary mode**

```text
Do not fabricate `next_skill`.
Summaries should explicitly say the next step is the normal execution handoff.
If `note` remains for compatibility, keep it an exact alias of `reason` rather than a second independent field.
```

- [x] **Step 5: Update runtime docs to describe the finalized summary contract**

```markdown
- `status --summary` is human-oriented and intentionally not the routing surface skills consume
- default `status` remains JSON for machine consumers
- `reason` is the canonical diagnostic field; any `note` field is compatibility-only
```

- [x] **Step 6: Run the helper suite until summary coverage passes**

Run: `bash tests/codex-runtime/test-superpowers-workflow-status.sh`
Expected: PASS with summary assertions green

- [ ] **Step 7: Commit the summary implementation**

```bash
git add bin/superpowers-workflow-status README.md docs/README.codex.md docs/README.copilot.md tests/codex-runtime/test-superpowers-workflow-status.sh
git commit -m "feat: add workflow-status summary mode"
```

## Task 3: Implement Repo-Identity Mismatch Recovery

**Files:**
- Modify: `bin/superpowers-workflow-status`
- Modify: `tests/codex-runtime/test-superpowers-workflow-status.sh`
- Test: `bash tests/codex-runtime/test-superpowers-workflow-status.sh`

- [x] **Step 1: Parse stored repo-identity fields from the manifest**

```bash
# Read at least:
# - repo_root
# - branch
#
# Compare them to the current checkout before trusting cached manifest state.
```

- [x] **Step 2: Add moved-checkout mismatch handling**

```text
If manifest repo_root != current REPO_ROOT:
- emit explicit warning / note
- preserve old manifest evidence when appropriate
- rebuild current manifest from repo docs and context
- route conservatively for that invocation
```

- [x] **Step 3: Add cross-slug recovery for remote-slug changes**

```text
If the current slug path has no manifest:
- inspect only candidate files matching `~/.superpowers/projects/*/${USER_NAME}-${SAFE_BRANCH}-workflow-state.json`
- cap the search at the first 12 candidate files
- detect a matching repo_root under an old slug
- migrate or rehydrate state into the current slug path
- warn once so the cause is visible
- if multiple candidates still match, refuse to guess and route conservatively
```

- [x] **Step 4: Keep recovery fail-closed and bounded**

```bash
# No unbounded recursive scans.
# Only inspect the minimum state needed under ~/.superpowers/projects/.
# Enforce the exact candidate pattern and the 12-file lookup budget in tests.
```

- [x] **Step 5: Add regression cases and run them green**

Run: `bash tests/codex-runtime/test-superpowers-workflow-status.sh`
Expected: PASS with moved-checkout and slug-change recovery assertions green

- [ ] **Step 6: Commit repo-identity recovery**

```bash
git add bin/superpowers-workflow-status tests/codex-runtime/test-superpowers-workflow-status.sh
git commit -m "feat: recover workflow state across repo identity changes"
```

## Task 4: Surface Explicit Malformed-Artifact Diagnostics

**Files:**
- Modify: `bin/superpowers-workflow-status`
- Modify: `tests/codex-runtime/test-superpowers-workflow-status.sh`
- Modify: `README.md`
- Modify: `docs/testing.md`
- Test: `bash tests/codex-runtime/test-superpowers-workflow-status.sh`

- [x] **Step 1: Add distinct malformed reason codes**

```text
Recommended reason codes:
- malformed_spec_headers
- malformed_plan_headers
```

- [x] **Step 2: Emit malformed reasons at the exact downgrade point**

```bash
if parse_spec_headers fails on an existing selected spec:
  append_status_note "malformed_spec_headers"
  route to spec_draft

if parse_plan_headers fails on an existing selected plan:
  append_status_note "malformed_plan_headers"
  route to plan_draft
```

- [x] **Step 3: Preserve conservative routing semantics**

```text
Do not promote malformed artifacts.
Do not let malformed notes mask stale-plan or missing-artifact behavior.
Emit malformed diagnostics through canonical `reason` semantics; if `note` remains, mirror the same value.
```

- [x] **Step 4: Extend regression coverage and testing docs**

```bash
# Add malformed-spec and malformed-plan cases to the helper suite
# Update docs/testing.md so the deterministic validation set names those cases explicitly
```

- [x] **Step 5: Run the helper suite green**

Run: `bash tests/codex-runtime/test-superpowers-workflow-status.sh`
Expected: PASS with malformed-artifact reason assertions green

- [ ] **Step 6: Commit malformed-artifact diagnostics**

```bash
git add bin/superpowers-workflow-status tests/codex-runtime/test-superpowers-workflow-status.sh README.md docs/testing.md
git commit -m "fix: surface malformed workflow artifact diagnostics"
```

## Task 5: Reconcile The Approved Docs With The Final Helper Contract

**Files:**
- Modify: `docs/superpowers/specs/2026-03-17-workflow-state-runtime-design.md`
- Modify: `docs/superpowers/plans/2026-03-17-workflow-state-runtime.md`
- Modify: `skills/using-superpowers/SKILL.md.tmpl`
- Modify: `skills/plan-eng-review/SKILL.md.tmpl`
- Modify: `tests/codex-runtime/test-workflow-sequencing.sh`
- Modify: `tests/codex-runtime/skill-doc-contracts.test.mjs`
- Modify: generated `skills/*/SKILL.md` via `node scripts/gen-skill-docs.mjs`
- Test: `node scripts/gen-skill-docs.mjs --check`
- Test: `bash tests/codex-runtime/test-workflow-sequencing.sh`
- Test: `node --test tests/codex-runtime/skill-doc-contracts.test.mjs`

- [x] **Step 1: Make the approved docs reflect the actual supported routing contract**

```text
The final written contract should say:
- skills call `$_SUPERPOWERS_ROOT/bin/superpowers-workflow-status`
- `next_skill` is only used when non-empty
- `implementation_ready` is a terminal status that leads to execution handoff
- `status --summary` is human-oriented, not the machine-routing path
- `reason` is the canonical diagnostic field
```

- [x] **Step 2: Keep approved-doc reconciliation clarification-only**

```text
Do not use this task to change the architecture, authority split, or execution model.
If any proposed wording crosses that line:
- stop this task
- leave the approved artifacts untouched
- route back through the normal spec/review workflow

For this plan, keep changes narrowly scoped to contract clarifications and document why approval validity remains intact.
```

- [x] **Step 3: Update generated skill templates only where the final contract changed**

```text
Do not regress the runtime-root-aware invocation or the `implementation_ready` special case.
```

- [x] **Step 4: Regenerate checked-in skills and run contract tests**

Run: `node scripts/gen-skill-docs.mjs`
Expected: regenerated `skills/*/SKILL.md` files reflect the finalized helper contract

Run: `node scripts/gen-skill-docs.mjs --check`
Expected: PASS

Run: `bash tests/codex-runtime/test-workflow-sequencing.sh`
Expected: PASS

Run: `node --test tests/codex-runtime/skill-doc-contracts.test.mjs`
Expected: PASS

- [ ] **Step 5: Commit the doc reconciliation**

```bash
git add docs/superpowers/specs/2026-03-17-workflow-state-runtime-design.md docs/superpowers/plans/2026-03-17-workflow-state-runtime.md skills/using-superpowers/SKILL.md.tmpl skills/plan-eng-review/SKILL.md.tmpl skills/*/SKILL.md tests/codex-runtime/test-workflow-sequencing.sh tests/codex-runtime/skill-doc-contracts.test.mjs
git commit -m "docs: reconcile workflow-state runtime contract"
```

## Task 6: Run End-To-End Validation And Prepare Review Handoff

**Files:**
- Modify: `RELEASE-NOTES.md`
- Modify: `docs/testing.md`
- Test: `bash tests/codex-runtime/test-runtime-instructions.sh`
- Test: `bash tests/codex-runtime/test-workflow-enhancements.sh`
- Test: `bash tests/codex-runtime/test-powershell-wrapper-bash-resolution.sh`
- Test: `bash tests/codex-runtime/test-superpowers-workflow-status.sh`
- Test: `node --test tests/codex-runtime/*.test.mjs`

- [x] **Step 1: Update release notes with the follow-up alignment work**

```markdown
### Workflow Runtime
- Added summary-mode support
- Added repo-identity mismatch recovery
- Added explicit malformed-artifact diagnostics
- Reconciled helper contract docs with the shipped runtime behavior
```

- [x] **Step 2: Run the full deterministic validation set**

Run: `node scripts/gen-skill-docs.mjs --check`
Expected: PASS

Run: `node scripts/gen-agent-docs.mjs --check`
Expected: PASS

Run: `node --test tests/codex-runtime/*.test.mjs`
Expected: PASS

Run: `bash tests/codex-runtime/test-runtime-instructions.sh`
Expected: PASS

Run: `bash tests/codex-runtime/test-workflow-enhancements.sh`
Expected: PASS

Run: `bash tests/codex-runtime/test-workflow-sequencing.sh`
Expected: PASS

Run: `bash tests/codex-runtime/test-powershell-wrapper-bash-resolution.sh`
Expected: PASS or SKIP on hosts without PowerShell

Run: `bash tests/codex-runtime/test-superpowers-workflow-status.sh`
Expected: PASS

- [x] **Step 3: Review the final diff against the approved core architecture**

```text
Confirm the follow-up still preserves:
- branch-scoped manifests
- repo-authoritative approvals
- fail-closed rescue paths
- no fake execution next_skill
- runtime-root-aware helper invocation
- canonical `reason` diagnostics
- explicit cross-slug lookup budget
```

- [ ] **Step 4: Commit validation and release-note updates**

```bash
git add RELEASE-NOTES.md docs/testing.md
git commit -m "docs: record workflow-state runtime alignment follow-up"
```
