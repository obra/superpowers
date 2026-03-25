# Superpowers Rust Runtime Rewrite Continuation Plan

> **For Codex and GitHub Copilot workers:** REQUIRED: Use `superpowers:subagent-driven-development` when isolated-agent workflows are available in the current platform/session; otherwise use `superpowers:executing-plans`. Steps use checkbox (`- [ ]`) syntax for tracking.

**Workflow State:** Engineering Approved
**Plan Revision:** 2
**Execution Mode:** superpowers:executing-plans
**Source Spec:** `docs/superpowers/specs/2026-03-23-rust-runtime-rewrite-design.md`
**Source Spec Revision:** 4
**Last Reviewed By:** plan-eng-review

**Goal:** Finish the remaining Rust-runtime cutover work on top of the already-landed branch baseline, then ship the checked-in binaries, final validation proof, and release-facing docs without replaying completed slices.

**Architecture:** Treat commits through `437048e` as the landed baseline from plan revision `1`, then use this continuation plan only for the unresolved parity, packaging, and release-verification work that remains after the revision-4 spec change. Keep the same one-binary Rust runtime, canonical `superpowers ...` command tree, file-based helper state, checked-in `bin/prebuilt/` contract, and advisory-only Windows host-launch proof from the approved spec.

**Tech Stack:** Rust stable, `clap`, `serde`, `serde_json`, `schemars`, `gix`, `camino`, `sha2`, `semver`, `reqwest`, `jiff`, `thiserror`, `fs-err`, `tempfile`, `assert_cmd`, `insta`, `proptest`, `criterion`, Cargo, `cargo-nextest`, `cargo-llvm-cov`, `cargo-deny`, `cargo-audit`, existing shell regression suites, Node-based skill-doc and fixture-contract tests

---

## What Already Exists

- Plan revision `1` already landed the bulk of the rewrite across commits `f0b64e9` through `437048e`, including the Rust workspace, foundation modules, plan-contract parsing, workflow runtime, execution runtime, policy and local-state helpers, checked-in provisioning contract, migration shims, and canonical runtime docs.
- `tests/codex-runtime/`, `tests/plan_execution.rs`, `tests/workflow_runtime.rs`, `tests/repo_safety.rs`, `tests/session_config_slug.rs`, and `tests/update_and_install.rs` already provide the parity corpus this continuation should extend rather than replace.
- Checked-in prebuilt artifact paths and refresh scripts already exist; this continuation only needs to verify, refresh, and cut over the approved target set under the revision-4 contract.
- Plan revision `1` execution evidence at `docs/superpowers/execution-evidence/2026-03-23-rust-runtime-rewrite-r1-evidence.md` is historical context only. It does not satisfy revision `2`.

## Existing Capabilities / Built-ins to Reuse

- Reuse the already-landed Rust modules in `src/` instead of reopening earlier decomposition decisions.
- Reuse existing shell parity suites and fixture tests as the first regression gate for every touched command family.
- Reuse `bin/superpowers-workflow-status sync`, `superpowers plan contract analyze-plan`, and `superpowers plan execution ...` as the artifact truth surfaces instead of inventing new continuation bookkeeping.
- Reuse `scripts/refresh-prebuilt-runtime.sh`, `scripts/refresh-prebuilt-runtime.ps1`, and the checked-in `bin/prebuilt/manifest.json` contract instead of adding a second packaging path.

## Known Footguns / Constraints

- Revision `2` must start execution-clean. Do not carry checked boxes, notes, or execution claims forward from revision `1`.
- Do not mutate or reinterpret `...-r1-evidence.md` as proof for revision `2`; execution must leave new revision-2 evidence.
- Do not declare `tests/codex-runtime/test-superpowers-workflow-status.sh` hung until it has exceeded 5 minutes. The workflow shell suite is allowed to run that long.
- Do not shell out to `git`.
- Do not reopen Windows x64 host-launch proof as a cutover blocker. Under spec revision `4`, blocking Windows proof is packaging, checksum, install-copy, and PE sanity only.
- Do not widen scope into new helper executables, CLI redesign, Linux packaging, or remote artifact fetching.

## Change Surface

- Remaining runtime parity fixes in workflow status, execution state, local-state migration gates, and canonical wrapper transport
- Remaining skill-doc and operator-doc alignment for canonical commands and revised Windows packaging language
- Final benchmark, prebuilt-binary, checksum, and release-document refresh for the atomic Rust cutover

## Planned File Structure

- Modify: `Cargo.toml`
- Create: `deny.toml`
- Modify: `README.md`
- Modify: `RELEASE-NOTES.md`
- Modify: `docs/testing.md`
- Modify: `src/cli/plan_execution.rs`
- Modify: `src/cli/workflow.rs`
- Modify: `src/compat/argv0.rs`
- Modify: `src/contracts/plan.rs`
- Modify: `src/contracts/runtime.rs`
- Modify: `src/diagnostics/mod.rs`
- Modify: `src/execution/mutate.rs`
- Modify: `src/execution/state.rs`
- Modify: `src/lib.rs`
- Modify: `src/repo_safety/mod.rs`
- Modify: `src/session_entry/mod.rs`
- Modify: `src/workflow/manifest.rs`
- Modify: `src/workflow/status.rs`
- Create: `benches/common.rs`
- Create: `benches/workflow_status.rs`
- Create: `benches/plan_contract.rs`
- Create: `benches/execution_status.rs`
- Create: `perf-baselines/runtime-hot-paths.json`
- Create: `scripts/check-runtime-benchmarks.sh`
- Modify: `scripts/gen-skill-docs.mjs`
- Modify: `skills/using-superpowers/SKILL.md`
- Modify: `bin/superpowers-config`
- Modify: `bin/superpowers-migrate-install`
- Modify: `bin/superpowers-plan-contract`
- Modify: `bin/superpowers-plan-execution`
- Modify: `bin/superpowers-repo-safety`
- Modify: `bin/superpowers-session-entry`
- Modify: `bin/superpowers-slug`
- Modify: `bin/superpowers-update-check`
- Modify: `bin/superpowers-workflow`
- Modify: `bin/superpowers-workflow-status`
- Modify: `bin/prebuilt/manifest.json`
- Create: `bin/prebuilt/darwin-arm64/superpowers`
- Create: `bin/prebuilt/darwin-arm64/superpowers.sha256`
- Create: `bin/prebuilt/windows-x64/superpowers.exe`
- Create: `bin/prebuilt/windows-x64/superpowers.exe.sha256`
- Modify: `tests/codex-runtime/gen-skill-docs.unit.test.mjs`
- Modify: `tests/codex-runtime/skill-doc-contracts.test.mjs`
- Modify: `tests/codex-runtime/test-powershell-wrapper-bash-resolution.sh`
- Modify: `tests/codex-runtime/test-runtime-instructions.sh`
- Modify: `tests/codex-runtime/test-superpowers-config.sh`
- Modify: `tests/codex-runtime/test-superpowers-migrate-install.sh`
- Modify: `tests/codex-runtime/test-superpowers-plan-execution.sh`
- Modify: `tests/codex-runtime/test-superpowers-repo-safety.sh`
- Modify: `tests/codex-runtime/test-superpowers-session-entry-gate.sh`
- Modify: `tests/codex-runtime/test-superpowers-session-entry.sh`
- Modify: `tests/codex-runtime/test-superpowers-update-check.sh`
- Modify: `tests/codex-runtime/test-superpowers-workflow-status.sh`
- Modify: `tests/codex-runtime/test-superpowers-workflow.sh`
- Modify: `tests/codex-runtime/test-using-superpowers-bypass.sh`
- Modify: `tests/differential/run_legacy_vs_rust.sh`
- Modify: `tests/plan_execution.rs`
- Modify: `tests/repo_safety.rs`
- Modify: `tests/session_config_slug.rs`
- Modify: `tests/update_and_install.rs`
- Modify: `tests/workflow_runtime.rs`

## Preconditions

- Work from `dm/rust-rewrite`, not `main`.
- Treat [2026-03-23-rust-runtime-rewrite-design.md](/Users/dmulcahey/development/skills/superpowers/docs/superpowers/specs/2026-03-23-rust-runtime-rewrite-design.md) revision `4` as the exact source contract for this continuation plan.
- Treat committed work through `437048e` (`docs: cut runtime references to canonical rust cli`) as the landed baseline. This revision should only track remaining continuation work.
- Start revision `2` execution-clean: all task steps begin unchecked, `Execution Mode` stays `none` until execution begins, and revision-1 evidence remains untouched.
- Execute every implementation task with `superpowers:test-driven-development`.
- Finish each task with targeted verification before moving on, and use `superpowers:verification-before-completion` before any success claim or merge proposal.
- Keep markdown authoritative throughout; helper-owned state may be migrated or rebuilt, but it may never become approval truth.
- Keep helper-owned local state file-based under `~/.superpowers/`; do not introduce SQLite or a service.
- Keep any migration wrappers thin and temporary; they may not own business logic or JSON mutation.
- Build checked-in prebuilt binaries only for macOS arm64 and Windows x64 in this cutover revision.

## Not In Scope

- Replaying already-landed Tasks 1-10 from revision `1` as if they were new work
- Re-expanding the public helper-name surface or shipping helper-style executables after cutover
- Restoring Windows host-launch proof as a blocker for this revision
- Treating Linux x64 as a first-release blocking target
- Introducing remote artifact distribution, database-backed helper state, or a fresh CLI redesign

## Execution Strategy

1. Normalize the draft to continuation scope first so execution tooling sees only the remaining work.
2. Close runtime parity gaps before touching release artifacts or docs that depend on final behavior.
3. Align canonical docs and generated skill surfaces only after runtime behavior is stable.
4. Refresh binaries, benchmarks, and release-facing artifacts last, then run the full validation matrix and cut the release commit.

## Evidence Expectations

- Every touched runtime surface must leave at least one Rust test update and one parity or fixture assertion where that contract is already covered by shell or Node tests.
- Revision `2` evidence must be new and self-contained; do not rely on revision-1 checkboxes or evidence history to satisfy this revision.
- Workflow-shell evidence must record the true command result even if the suite runs for several minutes; do not treat early termination as acceptable proof.
- Final cutover evidence must include blocking macOS arm64 fresh-install proof, blocking Windows x64 packaging proof, checked-in benchmark results against `perf-baselines/runtime-hot-paths.json`, and the refreshed binary checksums under `bin/prebuilt/`.

## Validation Strategy

At minimum, this continuation should finish with these passing commands:

```bash
cargo build --bin superpowers
cargo fmt --check
cargo clippy --workspace --all-targets --all-features -- -D warnings
cargo nextest run
cargo llvm-cov nextest --workspace --all-features --lcov --output-path target/lcov.info
cargo deny check
cargo audit
node scripts/gen-skill-docs.mjs --check
node --test tests/codex-runtime/*.test.mjs
bash tests/codex-runtime/test-superpowers-workflow-status.sh
bash tests/codex-runtime/test-superpowers-workflow.sh
bash tests/codex-runtime/test-superpowers-plan-execution.sh
bash tests/codex-runtime/test-superpowers-repo-safety.sh
bash tests/codex-runtime/test-superpowers-session-entry.sh
bash tests/codex-runtime/test-superpowers-session-entry-gate.sh
bash tests/codex-runtime/test-superpowers-config.sh
bash tests/codex-runtime/test-superpowers-update-check.sh
bash tests/codex-runtime/test-superpowers-migrate-install.sh
bash tests/codex-runtime/test-runtime-instructions.sh
bash tests/codex-runtime/test-powershell-wrapper-bash-resolution.sh
bash tests/codex-runtime/test-using-superpowers-bypass.sh
bash tests/brainstorm-server/test-launch-wrappers.sh
bash scripts/check-runtime-benchmarks.sh
# plus blocking macOS arm64 fresh-install verification and blocking Windows x64 packaging verification
```

## Documentation Update Expectations

- Keep `README.md` aligned with the canonical `superpowers ...` surface and the checked-in binary install story.
- Keep `skills/using-superpowers/SKILL.md` and generated skill-doc tests aligned with the bypass and canonical-command behavior the runtime actually ships.
- Keep `docs/testing.md` and `RELEASE-NOTES.md` aligned with the revision-4 Windows packaging contract, benchmark suite, and exact final verification commands.

## Rollout Plan

- Stabilize runtime parity first.
- Stabilize state, shim, and install behavior second.
- Regenerate and revalidate docs and differential guidance third.
- Refresh prebuilt binaries, checksums, benchmarks, and final release notes last.

## Rollback Plan

- If continuation work proves unstable, revert the continuation commits and return to committed baseline `437048e`.
- Restore non-rebuildable local state only from explicit migration backups.
- Rebuild derived helper-owned state, manifests, and caches instead of restoring them when that is safer.
- Keep repo-visible markdown artifacts and revision-1 evidence unchanged during rollback analysis.

## Risks And Mitigations

- Risk: revision-1 execution state leaks into revision `2` and blocks execution helpers.
  Mitigation: keep all continuation steps unchecked, leave `Execution Mode` as `none`, and treat revision-1 evidence as read-only history.
- Risk: shell parity appears green only because an old binary is still in `target/debug/`.
  Mitigation: rebuild `cargo build --bin superpowers` before shell suites that dispatch the Rust binary.
- Risk: the workflow shell suite is killed early even though it is legitimately slow.
  Mitigation: allow at least 5 minutes before declaring `test-superpowers-workflow-status.sh` hung.
- Risk: Windows packaging drift is hidden because host-launch proof is no longer blocking.
  Mitigation: keep manifest resolution, checksum validation, install-copy proof, and PE sanity checks blocking in Task 4.
- Risk: docs and generated skill copy drift from the runtime contract late in the cutover.
  Mitigation: keep docs and generated-surface alignment in a dedicated pre-release task and rerun the Node contract suite after every change.

## Diagrams

### Continuation Delivery Order

```text
Task 1 runtime parity closure
    |
    v
Task 2 state + shim parity closure
    |
    v
Task 3 canonical docs + differential alignment
    |
    v
Task 4 binaries + benchmarks + full cutover verification
```

### Release Gate

```text
Rust runtime parity green
    +
state/migration/shim parity green
    +
docs + generated skill surfaces green
    +
macOS fresh install + Windows packaging + benchmark thresholds green
    =
release commit
```

## Requirement Coverage Matrix

- REQ-001 -> Task 1, Task 2
- REQ-002 -> Task 1, Task 2, Task 3, Task 4
- REQ-003 -> Task 1, Task 2
- REQ-004 -> Task 1, Task 3
- REQ-005 -> Task 1, Task 3
- REQ-006 -> Task 1, Task 2
- REQ-007 -> Task 1, Task 2
- REQ-008 -> Task 1
- REQ-009 -> Task 1, Task 2
- REQ-010 -> Task 1, Task 3
- REQ-011 -> Task 1, Task 2
- REQ-012 -> Task 1, Task 2
- REQ-013 -> Task 1
- REQ-014 -> Task 1, Task 2
- REQ-015 -> Task 1
- REQ-016 -> Task 1, Task 2
- REQ-017 -> Task 1
- REQ-018 -> Task 1
- REQ-019 -> Task 2
- REQ-020 -> Task 1, Task 2
- REQ-021 -> Task 1, Task 2
- REQ-022 -> Task 2
- REQ-023 -> Task 2
- REQ-024 -> Task 2
- REQ-025 -> Task 2
- REQ-026 -> Task 2
- REQ-027 -> Task 1, Task 2
- REQ-028 -> Task 2, Task 4
- REQ-029 -> Task 2, Task 4
- REQ-030 -> Task 3
- REQ-031 -> Task 1, Task 2, Task 3, Task 4
- REQ-032 -> Task 4
- REQ-033 -> Task 1, Task 4
- REQ-034 -> Task 1, Task 3
- REQ-035 -> Task 1, Task 3, Task 4
- REQ-036 -> Task 1, Task 2
- REQ-037 -> Task 1
- REQ-038 -> Task 1, Task 4
- REQ-039 -> Task 1, Task 2, Task 3
- REQ-040 -> Task 2
- REQ-041 -> Task 1
- REQ-042 -> Task 1
- REQ-043 -> Task 1, Task 4
- REQ-044 -> Task 2
- REQ-045 -> Task 2
- REQ-046 -> Task 1, Task 2, Task 3
- REQ-047 -> Task 2
- REQ-048 -> Task 1, Task 2, Task 4
- REQ-049 -> Task 2
- REQ-050 -> Task 2
- REQ-051 -> Task 2
- REQ-052 -> Task 2
- REQ-053 -> Task 2, Task 4
- REQ-054 -> Task 2, Task 4
- NONGOAL-001 -> Task 1, Task 2
- NONGOAL-002 -> Task 1, Task 3
- NONGOAL-003 -> Task 1, Task 2
- NONGOAL-004 -> Task 1, Task 2
- NONGOAL-005 -> Task 2, Task 4
- VERIFY-001 -> Task 2, Task 3, Task 4
- VERIFY-002 -> Task 2, Task 4
- VERIFY-003 -> Task 3, Task 4
- VERIFY-004 -> Task 1, Task 4
- VERIFY-005 -> Task 2, Task 4
- VERIFY-006 -> Task 1, Task 2, Task 3
- VERIFY-007 -> Task 2, Task 4
- VERIFY-008 -> Task 2, Task 3
- VERIFY-009 -> Task 2, Task 3
- VERIFY-010 -> Task 2, Task 4

## Task 1: Close Workflow And Execution Parity Gaps

**Spec Coverage:** REQ-001, REQ-002, REQ-003, REQ-004, REQ-005, REQ-006, REQ-007, REQ-008, REQ-009, REQ-010, REQ-011, REQ-012, REQ-013, REQ-014, REQ-015, REQ-016, REQ-017, REQ-018, REQ-020, REQ-021, REQ-027, REQ-031, REQ-033, REQ-034, REQ-035, REQ-036, REQ-037, REQ-038, REQ-039, REQ-041, REQ-042, REQ-043, REQ-046, REQ-048, NONGOAL-001, NONGOAL-002, NONGOAL-003, NONGOAL-004, VERIFY-004, VERIFY-006
**Task Outcome:** The canonical Rust workflow and plan-execution surfaces match the approved contract for status, summary, refresh persistence, stale-plan gating, deterministic repair behavior, and execution-state law on top of the already-landed branch baseline.
**Plan Constraints:**
- Preserve current output defaults, failure classes, and machine-readable field shapes.
- Rebuild the Rust binary before shell parity suites that dispatch through `target/debug/superpowers`.
- Do not kill `tests/codex-runtime/test-superpowers-workflow-status.sh` before 5 minutes.
**Open Questions:** none

**Files:**
- Modify: `src/cli/plan_execution.rs`
- Modify: `src/cli/workflow.rs`
- Modify: `src/contracts/plan.rs`
- Modify: `src/contracts/runtime.rs`
- Modify: `src/diagnostics/mod.rs`
- Modify: `src/execution/mutate.rs`
- Modify: `src/execution/state.rs`
- Modify: `src/lib.rs`
- Modify: `src/workflow/manifest.rs`
- Modify: `src/workflow/status.rs`
- Modify: `bin/superpowers-plan-execution`
- Modify: `bin/superpowers-workflow`
- Modify: `bin/superpowers-workflow-status`
- Modify: `tests/codex-runtime/test-superpowers-plan-execution.sh`
- Modify: `tests/codex-runtime/test-superpowers-workflow-status.sh`
- Modify: `tests/codex-runtime/test-superpowers-workflow.sh`
- Modify: `tests/differential/run_legacy_vs_rust.sh`
- Modify: `tests/plan_execution.rs`
- Modify: `tests/workflow_runtime.rs`
- Test: `tests/codex-runtime/workflow-fixtures.test.mjs`

- [x] **Step 1: Tighten the Rust and shell parity tests for the remaining workflow and execution gaps, including refresh persistence, summary output, stale approved-plan detection, execution-clean recommendation law, and any currently unresolved legacy compatibility fields.**
- [x] **Step 2: Run `cargo build --bin superpowers`, `cargo nextest run --test workflow_runtime --test plan_execution`, `bash tests/codex-runtime/test-superpowers-workflow-status.sh`, `bash tests/codex-runtime/test-superpowers-workflow.sh`, `bash tests/codex-runtime/test-superpowers-plan-execution.sh`, and `node --test tests/codex-runtime/workflow-fixtures.test.mjs` and capture the current red state before implementation.**
- [x] **Step 3: Implement the minimum Rust and shim changes in the listed workflow and execution files to satisfy the revised tests without widening the approved runtime surface.**
- [x] **Step 4: Re-run the targeted Rust, shell, fixture, and differential workflow checks and confirm workflow plus execution parity is green with the rebuilt Rust binary.**
- [x] **Step 5: Commit with `git add src/cli/plan_execution.rs src/cli/workflow.rs src/contracts/plan.rs src/contracts/runtime.rs src/diagnostics/mod.rs src/execution/mutate.rs src/execution/state.rs src/lib.rs src/workflow/manifest.rs src/workflow/status.rs bin/superpowers-plan-execution bin/superpowers-workflow bin/superpowers-workflow-status tests/codex-runtime/test-superpowers-plan-execution.sh tests/codex-runtime/test-superpowers-workflow-status.sh tests/codex-runtime/test-superpowers-workflow.sh tests/differential/run_legacy_vs_rust.sh tests/plan_execution.rs tests/workflow_runtime.rs && git commit -m "fix: close workflow and execution parity gaps"`**
## Task 2: Close State, Migration, And Shim Parity Gaps

**Spec Coverage:** REQ-001, REQ-002, REQ-003, REQ-006, REQ-007, REQ-009, REQ-011, REQ-012, REQ-014, REQ-016, REQ-019, REQ-020, REQ-021, REQ-022, REQ-023, REQ-024, REQ-025, REQ-026, REQ-027, REQ-028, REQ-029, REQ-036, REQ-039, REQ-040, REQ-044, REQ-045, REQ-046, REQ-047, REQ-048, REQ-049, REQ-050, REQ-051, REQ-052, REQ-053, REQ-054, NONGOAL-001, NONGOAL-003, NONGOAL-004, NONGOAL-005, VERIFY-001, VERIFY-002, VERIFY-005, VERIFY-006, VERIFY-007, VERIFY-008, VERIFY-009, VERIFY-010
**Task Outcome:** Repo safety, session entry, update-check, install migration, slug routing, and the remaining helper shims all honor the revision-4 cutover contract, including canonical command transport, pending-migration behavior, and checked-in prebuilt provisioning.
**Plan Constraints:**
- Keep helper-owned state file-based and fail closed on non-rebuildable-state mutation paths.
- Keep helper shims transport-only.
- Do not reintroduce helper-style installed executables or remote artifact fetches.
**Open Questions:** none

**Files:**
- Modify: `src/compat/argv0.rs`
- Modify: `src/contracts/runtime.rs`
- Modify: `src/diagnostics/mod.rs`
- Modify: `src/lib.rs`
- Modify: `src/repo_safety/mod.rs`
- Modify: `src/session_entry/mod.rs`
- Modify: `bin/superpowers-config`
- Modify: `bin/superpowers-migrate-install`
- Modify: `bin/superpowers-plan-contract`
- Modify: `bin/superpowers-repo-safety`
- Modify: `bin/superpowers-session-entry`
- Modify: `bin/superpowers-slug`
- Modify: `bin/superpowers-update-check`
- Modify: `bin/superpowers-workflow-status`
- Modify: `tests/codex-runtime/test-powershell-wrapper-bash-resolution.sh`
- Modify: `tests/codex-runtime/test-runtime-instructions.sh`
- Modify: `tests/codex-runtime/test-superpowers-config.sh`
- Modify: `tests/codex-runtime/test-superpowers-migrate-install.sh`
- Modify: `tests/codex-runtime/test-superpowers-repo-safety.sh`
- Modify: `tests/codex-runtime/test-superpowers-session-entry-gate.sh`
- Modify: `tests/codex-runtime/test-superpowers-session-entry.sh`
- Modify: `tests/codex-runtime/test-superpowers-update-check.sh`
- Modify: `tests/codex-runtime/test-using-superpowers-bypass.sh`
- Modify: `tests/repo_safety.rs`
- Modify: `tests/session_config_slug.rs`
- Modify: `tests/update_and_install.rs`
- Test: `tests/brainstorm-server/test-launch-wrappers.sh`

- [x] **Step 1: Tighten failing Rust and shell tests for the remaining state, migration, wrapper, and bypass gaps, including canonical slug routing, pending-migration read-only allowances, blocked mutation paths, runtime-instruction behavior, and transport-only wrapper guarantees.**
- [x] **Step 2: Run `cargo build --bin superpowers`, `cargo nextest run --test repo_safety --test session_config_slug --test update_and_install`, `bash tests/codex-runtime/test-superpowers-repo-safety.sh`, `bash tests/codex-runtime/test-superpowers-session-entry.sh`, `bash tests/codex-runtime/test-superpowers-session-entry-gate.sh`, `bash tests/codex-runtime/test-superpowers-config.sh`, `bash tests/codex-runtime/test-superpowers-update-check.sh`, `bash tests/codex-runtime/test-superpowers-migrate-install.sh`, `bash tests/codex-runtime/test-runtime-instructions.sh`, `bash tests/codex-runtime/test-powershell-wrapper-bash-resolution.sh`, `bash tests/codex-runtime/test-using-superpowers-bypass.sh`, and `bash tests/brainstorm-server/test-launch-wrappers.sh` and confirm the current red state before implementation.**
- [x] **Step 3: Implement the minimum runtime and shim changes in the listed files so local-state migration, canonical dispatch, and checked-in provisioning behavior match the approved contract.**
- [x] **Step 4: Re-run the targeted Rust and shell suites and confirm the remaining state, migration, bypass, and wrapper parity checks are green.**
- [x] **Step 5: Commit with `git add src/compat/argv0.rs src/contracts/runtime.rs src/diagnostics/mod.rs src/lib.rs src/repo_safety/mod.rs src/session_entry/mod.rs bin/superpowers-config bin/superpowers-migrate-install bin/superpowers-plan-contract bin/superpowers-repo-safety bin/superpowers-session-entry bin/superpowers-slug bin/superpowers-update-check bin/superpowers-workflow-status tests/codex-runtime/test-powershell-wrapper-bash-resolution.sh tests/codex-runtime/test-runtime-instructions.sh tests/codex-runtime/test-superpowers-config.sh tests/codex-runtime/test-superpowers-migrate-install.sh tests/codex-runtime/test-superpowers-repo-safety.sh tests/codex-runtime/test-superpowers-session-entry-gate.sh tests/codex-runtime/test-superpowers-session-entry.sh tests/codex-runtime/test-superpowers-update-check.sh tests/codex-runtime/test-using-superpowers-bypass.sh tests/repo_safety.rs tests/session_config_slug.rs tests/update_and_install.rs && git commit -m "fix: close state, migration, and shim parity gaps"`**
## Task 3: Align Canonical Docs, Generated Skill Surfaces, And Differential Guidance

**Spec Coverage:** REQ-002, REQ-004, REQ-005, REQ-010, REQ-030, REQ-031, REQ-034, REQ-035, REQ-039, REQ-046, NONGOAL-002, VERIFY-001, VERIFY-003, VERIFY-006, VERIFY-008, VERIFY-009
**Task Outcome:** The repo-owned documentation, generated skill surfaces, and differential guidance all match the final canonical runtime behavior and the revision-4 Windows packaging contract.
**Plan Constraints:**
- Keep canonical `superpowers ...` commands as the only repo-owned vocabulary.
- Regenerate and revalidate generated skill surfaces after template or script edits.
- Treat differential mismatches as triage artifacts, not silent behavior changes.
**Open Questions:** none

**Files:**
- Modify: `README.md`
- Modify: `docs/testing.md`
- Modify: `scripts/gen-skill-docs.mjs`
- Modify: `skills/using-superpowers/SKILL.md`
- Modify: `tests/codex-runtime/gen-skill-docs.unit.test.mjs`
- Modify: `tests/codex-runtime/skill-doc-contracts.test.mjs`
- Modify: `tests/differential/run_legacy_vs_rust.sh`
- Test: `tests/codex-runtime/skill-doc-generation.test.mjs`

- [x] **Step 1: Tighten the Node and differential harness checks for the remaining doc-surface gaps, including canonical command wording, bypass guidance, and the softer Windows host-launch language from spec revision `4`.**
- [x] **Step 2: Run `node scripts/gen-skill-docs.mjs --check`, `node --test tests/codex-runtime/gen-skill-docs.unit.test.mjs tests/codex-runtime/skill-doc-contracts.test.mjs tests/codex-runtime/skill-doc-generation.test.mjs`, and the differential harness smoke command from `tests/differential/run_legacy_vs_rust.sh` and confirm the current red state before implementation.**
- [x] **Step 3: Update the listed docs, skill surfaces, and differential guidance files so they describe the final runtime behavior exactly once and do not reintroduce helper-style command vocabulary.**
- [x] **Step 4: Re-run the Node contract suite and differential smoke command and confirm the repo-owned vocabulary and review guidance are aligned with the Rust runtime.**
- [x] **Step 5: Commit with `git add README.md docs/testing.md scripts/gen-skill-docs.mjs skills/using-superpowers/SKILL.md tests/codex-runtime/gen-skill-docs.unit.test.mjs tests/codex-runtime/skill-doc-contracts.test.mjs tests/differential/run_legacy_vs_rust.sh && git commit -m "docs: align runtime docs and generated surfaces"`**
## Task 4: Refresh Checked-In Artifacts, Run Final Verification, And Cut Over

**Spec Coverage:** REQ-002, REQ-028, REQ-029, REQ-031, REQ-032, REQ-033, REQ-035, REQ-038, REQ-043, REQ-048, REQ-053, REQ-054, NONGOAL-005, VERIFY-001, VERIFY-002, VERIFY-003, VERIFY-004, VERIFY-005, VERIFY-007, VERIFY-010
**Task Outcome:** The repo carries refreshed checked-in binaries, checksums, benchmark thresholds, dependency-check configuration, final validation evidence, and release-facing docs for the Rust cutover under the revision-4 contract.
**Plan Constraints:**
- Refresh binaries only after Tasks 1-3 are green.
- Keep macOS arm64 fresh-install proof blocking.
- Keep Windows x64 packaging proof blocking, but treat direct Windows-host launch proof as follow-on evidence only.
**Open Questions:** none

**Files:**
- Modify: `Cargo.toml`
- Create: `deny.toml`
- Modify: `docs/testing.md`
- Modify: `RELEASE-NOTES.md`
- Create: `benches/common.rs`
- Create: `benches/workflow_status.rs`
- Create: `benches/plan_contract.rs`
- Create: `benches/execution_status.rs`
- Create: `perf-baselines/runtime-hot-paths.json`
- Create: `scripts/check-runtime-benchmarks.sh`
- Modify: `bin/prebuilt/manifest.json`
- Create: `bin/prebuilt/darwin-arm64/superpowers`
- Create: `bin/prebuilt/darwin-arm64/superpowers.sha256`
- Create: `bin/prebuilt/windows-x64/superpowers.exe`
- Create: `bin/prebuilt/windows-x64/superpowers.exe.sha256`
- Test: `tests/bootstrap_smoke.rs`
- Test: `tests/contracts_spec_plan.rs`
- Test: `tests/workflow_runtime.rs`
- Test: `tests/plan_execution.rs`
- Test: `tests/repo_safety.rs`
- Test: `tests/session_config_slug.rs`
- Test: `tests/update_and_install.rs`

- [x] **Step 1: Add or refresh the remaining benchmark and release-verification scaffolding in `Cargo.toml`, `deny.toml`, `benches/`, `perf-baselines/runtime-hot-paths.json`, `scripts/check-runtime-benchmarks.sh`, `docs/testing.md`, and `RELEASE-NOTES.md` so the final cutover contract is fully represented on disk.**
- [x] **Step 2: Refresh the checked-in `bin/prebuilt/` artifacts, manifest entries, and checksum files for macOS arm64 and Windows x64 using the approved local refresh flow, leaving Windows host-launch proof as optional follow-on evidence only.**
- [x] **Step 3: Run the full validation matrix from this plan, including Cargo checks, Node checks, shell parity suites, wrapper tests, `bash scripts/check-runtime-benchmarks.sh`, blocking macOS arm64 fresh-install proof, and blocking Windows x64 packaging proof.**
- [x] **Step 4: Update the final release-facing docs with the exact commands, target support statement, benchmark-threshold suite, and checked-in binary refresh instructions used by this cutover, then confirm there are no unexplained parity or threshold regressions.**
- [x] **Step 5: Commit with `git add Cargo.toml deny.toml RELEASE-NOTES.md benches/common.rs benches/workflow_status.rs benches/plan_contract.rs benches/execution_status.rs perf-baselines/runtime-hot-paths.json scripts/check-runtime-benchmarks.sh bin/prebuilt/manifest.json bin/prebuilt/darwin-arm64/superpowers bin/prebuilt/darwin-arm64/superpowers.sha256 bin/prebuilt/windows-x64/superpowers.exe bin/prebuilt/windows-x64/superpowers.exe.sha256 docs/testing.md && git commit -m "release: cut over superpowers runtime to rust"`**
