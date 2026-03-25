# FeatureForge Rename and 1.0.0 Reset Implementation Plan

> **For Codex and GitHub Copilot workers:** REQUIRED: Use `superpowers:subagent-driven-development` when isolated-agent workflows are available in the current platform/session; otherwise use `superpowers:executing-plans`. Steps use checkbox (`- [ ]`) syntax for tracking.

**Workflow State:** Engineering Approved
**Plan Revision:** 1
**Execution Mode:** superpowers:subagent-driven-development
**Source Spec:** `docs/featureforge/specs/2026-03-24-featureforge-rename-reset-design.md`
**Source Spec Revision:** 1
**Last Reviewed By:** plan-eng-review

**Goal:** Cut the repository over from the current `superpowers` identity to the standalone `FeatureForge` `1.0.0` product with one supported Rust binary, archived historical docs, and no active migration or compatibility surfaces.

**Architecture:** Execute the cutover from the core outward. First rename the Rust/runtime identity and state/install contracts, then update workflow-path and failure contracts, then replace the shipped binary and remove wrapper surfaces, then cut the skill/install namespaces and active docs over to `featureforge`, and finally enforce the new surface with archive moves, integrity checks, and forbidden-reference validation. Historical `Superpowers` artifacts stay preserved under docs archive paths and must never remain active inputs.

**Tech Stack:** Rust stable, `clap`, `serde`, `serde_json`, `schemars`, `gix`, `reqwest`, `jiff`, `sha2`, `thiserror`, checked-in prebuilt binaries and manifests, Bash and PowerShell packaging scripts, Node-based skill-doc generation, Rust integration tests, shell regression suites, markdown workflow artifacts

---

## What Already Exists

- The product already has a Rust CLI core, so this project is primarily an identity, contract, and packaging cutover rather than a rewrite from scratch.
- The workflow already treats repo markdown as authoritative, so active artifact roots can move to `docs/featureforge/*` without changing the approval model.
- Checked-in prebuilt artifacts, manifest metadata, and checksum flows already exist under `bin/prebuilt/`, so integrity guarantees should be renamed and preserved rather than reinvented.
- Install-link, skill-discovery, and generated-skill patterns already exist; they need namespace cutover and regeneration, not a new mechanism.
- Historical specs, plans, and execution evidence already live under `docs/superpowers/`, which gives a clean source set to archive verbatim under `docs/archive/superpowers/`.

## Existing Capabilities / Built-ins to Reuse

- Reuse the existing Rust modules in `src/` instead of pushing logic back into wrappers.
- Reuse the current workflow sync/expect/plan-contract tooling to keep markdown artifacts authoritative throughout the cutover.
- Reuse `scripts/gen-skill-docs.mjs` to regenerate skill docs from updated templates instead of manually editing generated files only.
- Reuse the existing `bin/prebuilt/manifest.json` and refresh scripts to preserve binary checksum and packaging behavior under new names.
- Reuse the current Rust, shell, and Node test suites as the first contract gate for each renamed surface.

## Known Footguns / Constraints

- The current repo still hard-codes `docs/superpowers/*`, `~/.superpowers/*`, `SUPERPOWERS_*`, and `superpowers` command names across Rust code, wrappers, scripts, docs, and tests; partial cutovers will leave the repo in an inconsistent state.
- The approved spec requires a real compiled `bin/featureforge` or `bin/featureforge.exe` path in the repo, not another wrapper script. Do not satisfy that requirement with a forwarding shim.
- The approved spec also requires active skill IDs and install links to move to `featureforge`, but the current workflow runtime still uses `superpowers:` names during planning. Keep plan artifacts compatible with the current workflow while implementing the product cutover itself.
- The rename-specific spec and this plan must eventually move to `docs/archive/featureforge/`, but only after execution, review, and release handoff no longer rely on them as the active plan/spec pair.
- Do not introduce compatibility language, migration prompts, or dual-name reads that imply the prior project still exists.

## Change Surface

- Rust crate metadata, CLI identity, diagnostics, path helpers, state roots, install roots, and update-check defaults
- Workflow artifact discovery and enforcement for specs, plans, and execution evidence
- Checked-in binaries, manifest/checksum metadata, packaging scripts, and the repo-root canonical runtime binary
- All user-facing wrappers, compat launchers, markdown command shims, and migration helpers
- Skill templates, generated skill docs, install guides, agent configs, review references, and runtime instruction docs
- Active docs, release notes, TODO/review docs, archive layout, and grep/contract verification

## Planned File Structure

- Modify: `Cargo.toml`
- Modify: `VERSION`
- Modify: `README.md`
- Modify: `RELEASE-NOTES.md`
- Modify: `TODOS.md`
- Modify: `.codex/INSTALL.md`
- Modify: `.codex/agents/code-reviewer.toml`
- Modify: `.copilot/INSTALL.md`
- Create: `.featureforge/config.yaml`
- Delete: `.superpowers/config.yaml`
- Modify: `agents/code-reviewer.instructions.md`
- Modify: `agents/code-reviewer.md`
- Create: `bin/featureforge`
- Create: `bin/featureforge.exe`
- Modify: `bin/prebuilt/manifest.json`
- Create: `bin/prebuilt/darwin-arm64/featureforge`
- Create: `bin/prebuilt/darwin-arm64/featureforge.sha256`
- Delete: `bin/prebuilt/darwin-arm64/superpowers`
- Delete: `bin/prebuilt/darwin-arm64/superpowers.sha256`
- Create: `bin/prebuilt/windows-x64/featureforge.exe`
- Create: `bin/prebuilt/windows-x64/featureforge.exe.sha256`
- Delete: `bin/prebuilt/windows-x64/superpowers.exe`
- Delete: `bin/prebuilt/windows-x64/superpowers.exe.sha256`
- Delete: `bin/superpowers`
- Delete: `bin/superpowers-config`
- Delete: `bin/superpowers-config.ps1`
- Delete: `bin/superpowers-migrate-install`
- Delete: `bin/superpowers-migrate-install.ps1`
- Delete: `bin/superpowers-plan-contract`
- Delete: `bin/superpowers-plan-contract.ps1`
- Delete: `bin/superpowers-plan-execution`
- Delete: `bin/superpowers-plan-execution.ps1`
- Delete: `bin/superpowers-plan-structure-common`
- Delete: `bin/superpowers-pwsh-common.ps1`
- Delete: `bin/superpowers-repo-safety`
- Delete: `bin/superpowers-repo-safety.ps1`
- Delete: `bin/superpowers-runtime-common.sh`
- Delete: `bin/superpowers-session-entry`
- Delete: `bin/superpowers-session-entry.ps1`
- Delete: `bin/superpowers-slug`
- Delete: `bin/superpowers-update-check`
- Delete: `bin/superpowers-update-check.ps1`
- Delete: `bin/superpowers-workflow`
- Delete: `bin/superpowers-workflow-status`
- Delete: `bin/superpowers-workflow-status.ps1`
- Delete: `bin/superpowers-workflow.ps1`
- Delete: `bin/superpowers.ps1`
- Delete: `compat/bash/superpowers`
- Delete: `compat/powershell/superpowers.ps1`
- Delete: `commands/brainstorm.md`
- Delete: `commands/execute-plan.md`
- Delete: `commands/write-plan.md`
- Modify: `src/cli/mod.rs`
- Modify: `src/compat/argv0.rs`
- Modify: `src/config/mod.rs`
- Modify: `src/contracts/evidence.rs`
- Modify: `src/contracts/plan.rs`
- Modify: `src/contracts/runtime.rs`
- Modify: `src/contracts/spec.rs`
- Modify: `src/execution/mutate.rs`
- Modify: `src/execution/state.rs`
- Modify: `src/install/mod.rs`
- Modify: `src/instructions/mod.rs`
- Modify: `src/lib.rs`
- Modify: `src/main.rs`
- Modify: `src/paths/mod.rs`
- Modify: `src/repo_safety/mod.rs`
- Modify: `src/session_entry/mod.rs`
- Modify: `src/update_check/mod.rs`
- Modify: `src/workflow/operator.rs`
- Modify: `src/workflow/status.rs`
- Modify: `scripts/gen-skill-docs.mjs`
- Modify: `scripts/refresh-prebuilt-runtime.sh`
- Modify: `scripts/refresh-prebuilt-runtime.ps1`
- Create: `scripts/check-featureforge-cutover.sh`
- Modify: `docs/README.codex.md`
- Modify: `docs/README.copilot.md`
- Modify: `docs/testing.md`
- Modify: `docs/test-suite-enhancement-plan.md`
- Create: `docs/archive/superpowers/specs/...`
- Create: `docs/archive/superpowers/plans/...`
- Create: `docs/archive/superpowers/execution-evidence/...`
- Create: `docs/archive/featureforge/specs/2026-03-24-featureforge-rename-reset-design.md`
- Create: `docs/archive/featureforge/plans/2026-03-24-featureforge-rename-reset.md`
- Modify: `review/TODOS-format.md`
- Modify: `review/checklist.md`
- Modify: `review/review-accelerator-packet-contract.md`
- Modify: `references/search-before-building.md`
- Create: `featureforge-upgrade/SKILL.md`
- Delete: `superpowers-upgrade/SKILL.md`
- Create: `skills/using-featureforge/SKILL.md`
- Create: `skills/using-featureforge/SKILL.md.tmpl`
- Modify: `skills/brainstorming/SKILL.md`
- Modify: `skills/brainstorming/SKILL.md.tmpl`
- Modify: `skills/dispatching-parallel-agents/SKILL.md`
- Modify: `skills/dispatching-parallel-agents/SKILL.md.tmpl`
- Modify: `skills/document-release/SKILL.md`
- Modify: `skills/document-release/SKILL.md.tmpl`
- Modify: `skills/executing-plans/SKILL.md`
- Modify: `skills/executing-plans/SKILL.md.tmpl`
- Modify: `skills/finishing-a-development-branch/SKILL.md`
- Modify: `skills/finishing-a-development-branch/SKILL.md.tmpl`
- Modify: `skills/plan-ceo-review/SKILL.md`
- Modify: `skills/plan-ceo-review/SKILL.md.tmpl`
- Modify: `skills/plan-eng-review/SKILL.md`
- Modify: `skills/plan-eng-review/SKILL.md.tmpl`
- Modify: `skills/qa-only/SKILL.md`
- Modify: `skills/qa-only/SKILL.md.tmpl`
- Modify: `skills/receiving-code-review/SKILL.md`
- Modify: `skills/receiving-code-review/SKILL.md.tmpl`
- Modify: `skills/requesting-code-review/SKILL.md`
- Modify: `skills/requesting-code-review/SKILL.md.tmpl`
- Modify: `skills/subagent-driven-development/SKILL.md`
- Modify: `skills/subagent-driven-development/SKILL.md.tmpl`
- Modify: `skills/systematic-debugging/SKILL.md`
- Modify: `skills/systematic-debugging/SKILL.md.tmpl`
- Modify: `skills/test-driven-development/SKILL.md`
- Modify: `skills/test-driven-development/SKILL.md.tmpl`
- Modify: `skills/using-git-worktrees/SKILL.md`
- Modify: `skills/using-git-worktrees/SKILL.md.tmpl`
- Create: `skills/using-featureforge/references/codex-tools.md`
- Delete: `skills/using-superpowers/SKILL.md`
- Delete: `skills/using-superpowers/SKILL.md.tmpl`
- Delete: `skills/using-superpowers/references/codex-tools.md`
- Modify: `skills/verification-before-completion/SKILL.md`
- Modify: `skills/verification-before-completion/SKILL.md.tmpl`
- Modify: `skills/writing-plans/SKILL.md`
- Modify: `skills/writing-plans/SKILL.md.tmpl`
- Modify: `skills/writing-skills/SKILL.md`
- Modify: `skills/writing-skills/SKILL.md.tmpl`
- Modify: `tests/bootstrap_smoke.rs`
- Modify: `tests/contracts_spec_plan.rs`
- Modify: `tests/instructions_and_git.rs`
- Modify: `tests/packet_and_schema.rs`
- Modify: `tests/paths_identity.rs`
- Modify: `tests/plan_execution.rs`
- Modify: `tests/powershell_wrapper_bash_resolution.rs`
- Modify: `tests/powershell_wrapper_resolution.rs`
- Modify: `tests/repo_safety.rs`
- Modify: `tests/runtime_instruction_contracts.rs`
- Modify: `tests/session_config_slug.rs`
- Modify: `tests/update_and_install.rs`
- Create: `tests/support/featureforge.rs`
- Delete: `tests/support/superpowers.rs`
- Modify: `tests/support/workflow.rs`
- Modify: `tests/upgrade_skill.rs`
- Create: `tests/using_featureforge_skill.rs`
- Delete: `tests/using_superpowers_skill.rs`
- Modify: `tests/workflow_runtime.rs`
- Modify: `tests/workflow_shell_smoke.rs`
- Modify: `tests/brainstorm-server/test-launch-wrappers.sh`
- Modify: `tests/codex-runtime/gen-skill-docs.unit.test.mjs`
- Modify: `tests/codex-runtime/skill-doc-contracts.test.mjs`
- Modify: `tests/codex-runtime/skill-doc-generation.test.mjs`
- Modify: `tests/codex-runtime/workflow-fixtures.test.mjs`
- Modify: `tests/differential/README.md`
- Modify: `tests/differential/run_legacy_vs_rust.sh`
- Modify: `tests/evals/README.md`
- Modify: `tests/evals/search-before-building-contract.orchestrator.md`
- Create: `tests/evals/using-featureforge-routing.judge.md`
- Create: `tests/evals/using-featureforge-routing.orchestrator.md`
- Create: `tests/evals/using-featureforge-routing.runner.md`
- Create: `tests/evals/using-featureforge-routing.scenarios.md`
- Delete: `tests/evals/using-superpowers-routing.judge.md`
- Delete: `tests/evals/using-superpowers-routing.orchestrator.md`
- Delete: `tests/evals/using-superpowers-routing.runner.md`
- Delete: `tests/evals/using-superpowers-routing.scenarios.md`
- Modify: `tests/fixtures/differential/workflow-status.json`

## Preconditions

- Treat [2026-03-24-featureforge-rename-reset-design.md](/Users/dmulcahey/development/skills/superpowers/docs/featureforge/specs/2026-03-24-featureforge-rename-reset-design.md) revision `1` as the exact source contract.
- Execute every implementation task with `superpowers:test-driven-development`.
- Keep the cutover fail-closed: no compatibility aliases, no dual reads, and no “migration from the old product” messaging in active runtime or docs.
- Keep the active workflow authoritative in markdown; do not bypass spec/plan/header law during the rename.
- Archive historical `docs/superpowers/*` materials verbatim; do not rewrite their contents in place.
- Defer moving the active rename spec and plan to `docs/archive/featureforge/` until all execution and review stages that rely on their active paths are complete.

## Not In Scope

- Restoring compatibility aliases, wrapper entrypoints, or migration commands
- Rewriting archived historical docs to remove the old brand
- Changing the workflow model beyond path, namespace, and identity cutover
- Introducing new services, databases, or remote release-fetch mechanisms

## Execution Strategy

1. Rename the core runtime, state, install, and update identity first so every later surface points at stable `FeatureForge` primitives.
2. Move workflow/artifact enforcement second so active docs and tests can start using `docs/featureforge/*` and `.featureforge/*` safely.
3. Replace the binary/packaging surface and remove wrappers only after the real compiled `bin/featureforge` contract exists.
4. Update skill/install namespaces and generated docs after the runtime contract is stable.
5. Archive old docs and enforce the forbidden-reference contract late, when all active replacements are on disk.
6. Perform the rename-specific spec/plan archive only after all release-handoff steps no longer depend on the active plan path.

## Evidence Expectations

- Every renamed runtime surface must leave at least one Rust test change and one shell/Node/doc-contract assertion where that surface is already covered.
- Final verification must prove the repo-root `bin/featureforge` binary, the renamed prebuilt artifacts, and their checksums all agree.
- Final verification must prove archived `docs/archive/superpowers/*` artifacts are inert and ignored by active discovery.
- Final verification must prove active non-archive file contents and active path names contain no `superpowers` references beyond the provenance line in `README.md`.
- The release-ready state must include explicit evidence for the rename-specific spec/plan archival handoff path.

## Validation Strategy

At minimum, finish with these checks green:

```bash
cargo build --bin featureforge
cargo test
node scripts/gen-skill-docs.mjs --check
node --test tests/codex-runtime/*.test.mjs
bash tests/brainstorm-server/test-launch-wrappers.sh
bash scripts/check-featureforge-cutover.sh
rg -n --hidden '\bsuperpowers\b|Superpowers|SUPERPOWERS_|\.superpowers' \
  README.md .featureforge/ docs/ .codex/ .copilot/ agents/ review/ references/ skills/ src/ tests/ \
  bin/ compat/ commands/ \
  --glob '!docs/archive/**'
```

Plus targeted packaging and integrity checks for:

- `bin/featureforge` or `bin/featureforge.exe`
- `bin/prebuilt/manifest.json`
- `bin/prebuilt/darwin-arm64/featureforge`
- `bin/prebuilt/windows-x64/featureforge.exe`

## Documentation Update Expectations

- Rewrite all active install, skill, agent, review, and runtime docs to use `FeatureForge` and the `featureforge` namespace.
- Keep exactly one provenance attribution to the upstream project in `README.md`.
- Move historical docs under `docs/archive/superpowers/` verbatim and keep them out of active discovery.
- Archive this spec and the final executed plan under `docs/archive/featureforge/` after release handoff.

## Rollout Plan

- Land the runtime identity and path cutover.
- Land workflow and artifact-path enforcement.
- Land the real `bin/featureforge` binary and remove wrapper/compat surfaces.
- Land skill/install/doc namespace changes and regenerate active docs.
- Archive old docs, enforce forbidden-reference checks, and finish release verification.

## Rollback Plan

- Revert the rename/reset change set if validation finds active-surface leakage before release.
- Do not add emergency compatibility shims as rollback substitutes.
- Revert archive moves if active workflow needs to regain access to authoritative docs during rollback analysis.
- If release metadata is published incorrectly, correct and republish the `FeatureForge` release rather than keeping dual identities alive.

## Risks And Mitigations

- Risk: core runtime paths move to `.featureforge` while generated skills or docs still point to `.superpowers`.
  Mitigation: update runtime code before regenerating skill docs, then run contract tests and forbidden-reference checks.
- Risk: wrapper removal strands tests or packaging because the real repo-root binary contract is not in place first.
  Mitigation: establish `bin/featureforge` and `bin/featureforge.exe` before deleting wrapper entrypoints.
- Risk: archived `docs/superpowers/*` files remain discoverable by active workflow helpers.
  Mitigation: add archive-exclusion assertions in Rust and Node tests and a dedicated grep/check script.
- Risk: rename-specific spec/plan archival breaks review or finish stages if done too early.
  Mitigation: keep archival as the last documentation cleanup slice after release handoff no longer depends on the active paths.

## Diagrams

### Cutover Order

```text
runtime identity
    |
    v
workflow + state contracts
    |
    v
real featureforge binary + packaging
    |
    v
skill/install/doc namespace cutover
    |
    v
archive old docs + enforce no-active-legacy-surface
    |
    v
archive rename-specific spec + plan
```

### Active Vs Archive Boundary

```text
docs/featureforge/*          -> active workflow truth
docs/archive/superpowers/*   -> preserved history only
docs/archive/featureforge/*  -> archived rename-project history only
```

## Requirement Coverage Matrix

- REQ-001 -> Task 1, Task 3, Task 4, Task 5
- REQ-002 -> Task 1, Task 3, Task 5, Task 6
- REQ-003 -> Task 1, Task 3
- REQ-004 -> Task 2, Task 5
- REQ-005 -> Task 5, Task 6
- REQ-006 -> Task 1, Task 4
- REQ-007 -> Task 1, Task 3, Task 5
- REQ-008 -> Task 3
- REQ-009 -> Task 1, Task 2, Task 6
- REQ-010 -> Task 2, Task 3, Task 4, Task 5, Task 6
- REQ-011 -> Task 5, Task 6
- REQ-012 -> Task 6

## Task 1: Rename Core Runtime Identity And State Contracts

**Spec Coverage:** REQ-001, REQ-002, REQ-003, REQ-006, REQ-007, REQ-009
**Task Outcome:** The Rust runtime identifies itself as `FeatureForge` `1.0.0`, resolves install and state roots under `~/.featureforge/`, uses `FEATUREFORGE_*` env/config surfaces, and exposes the fixed-path repo binary contract required by the approved spec.
**Plan Constraints:**
- Keep all failures current-product only; do not mention migration or prior product names in runtime output.
- Do not satisfy the repo-root binary contract with another wrapper script.
- Preserve typed diagnostics and machine-readable output shapes where they already exist.
**Open Questions:** none

**Files:**
- Modify: `Cargo.toml`
- Modify: `VERSION`
- Modify: `src/cli/mod.rs`
- Modify: `src/compat/argv0.rs`
- Modify: `src/config/mod.rs`
- Modify: `src/install/mod.rs`
- Modify: `src/lib.rs`
- Modify: `src/main.rs`
- Modify: `src/paths/mod.rs`
- Modify: `src/update_check/mod.rs`
- Create: `bin/featureforge`
- Create: `bin/featureforge.exe`
- Modify: `tests/bootstrap_smoke.rs`
- Modify: `tests/paths_identity.rs`
- Modify: `tests/session_config_slug.rs`
- Modify: `tests/support/executable.rs`
- Modify: `tests/support/superpowers.rs`
- Modify: `tests/update_and_install.rs`
- Test: `tests/bootstrap_smoke.rs`

- [x] **Step 1: Tighten or add failing Rust tests for CLI identity, version output, install-root discovery, state-root discovery, env var parsing, and repo-root binary-path expectations.**
- [x] **Step 2: Run `cargo test bootstrap_smoke paths_identity session_config_slug update_and_install -- --nocapture` and confirm the pre-implementation failures point at the legacy identity and path contracts.**
- [x] **Step 3: Implement the minimum changes in the listed runtime files to rename the crate/runtime identity, cut over to `.featureforge` and `FEATUREFORGE_*`, and materialize the canonical repo-root `bin/featureforge` binary contract.**
- [x] **Step 4: Re-run the targeted Rust tests and `cargo build --bin featureforge` until the core identity and path contract is green.**
- [x] **Step 5: Commit with `git add Cargo.toml VERSION src/cli/mod.rs src/compat/argv0.rs src/config/mod.rs src/install/mod.rs src/lib.rs src/main.rs src/paths/mod.rs src/update_check/mod.rs bin/featureforge bin/featureforge.exe tests/bootstrap_smoke.rs tests/paths_identity.rs tests/session_config_slug.rs tests/support/executable.rs tests/support/superpowers.rs tests/update_and_install.rs && git commit -m "feat: rename core runtime identity to featureforge"`**

## Task 2: Cut Over Workflow, Artifact, And Failure Contracts

**Spec Coverage:** REQ-004, REQ-009, REQ-010
**Task Outcome:** Active workflow helpers, plan/spec/evidence contracts, invalid-surface failures, and archive exclusion all enforce `docs/featureforge/*` as the only active artifact root and reject invalid active surfaces with stable `FeatureForge` failure classes.
**Plan Constraints:**
- Keep markdown authoritative throughout; do not bypass spec/plan path enforcement.
- Archived docs must be preserved but fully ignored by active discovery.
- Invalid-surface failures must name only current supported `FeatureForge` surfaces.
**Open Questions:** none

**Files:**
- Modify: `src/contracts/evidence.rs`
- Modify: `src/contracts/plan.rs`
- Modify: `src/contracts/runtime.rs`
- Modify: `src/contracts/spec.rs`
- Modify: `src/execution/mutate.rs`
- Modify: `src/execution/state.rs`
- Modify: `src/instructions/mod.rs`
- Modify: `src/repo_safety/mod.rs`
- Modify: `src/session_entry/mod.rs`
- Modify: `src/workflow/operator.rs`
- Modify: `src/workflow/status.rs`
- Modify: `tests/contracts_spec_plan.rs`
- Modify: `tests/packet_and_schema.rs`
- Modify: `tests/plan_execution.rs`
- Modify: `tests/repo_safety.rs`
- Modify: `tests/runtime_instruction_contracts.rs`
- Modify: `tests/support/workflow.rs`
- Modify: `tests/workflow_runtime.rs`
- Modify: `tests/workflow_shell_smoke.rs`
- Test: `tests/contracts_spec_plan.rs`

- [x] **Step 1: Tighten failing Rust and shell-facing contract tests for active artifact roots, archive exclusion, invalid-surface failure classes, and current-product-only remediation messages.**
- [x] **Step 2: Run `cargo test contracts_spec_plan packet_and_schema plan_execution repo_safety runtime_instruction_contracts workflow_runtime workflow_shell_smoke -- --nocapture` and capture the red state before implementation.**
- [x] **Step 3: Implement the minimum contract changes in the listed workflow, execution, repo-safety, and contract modules to move active truth to `docs/featureforge/*`, ignore archive paths, and emit stable `FeatureForge` invalid-surface failures.**
- [x] **Step 4: Re-run the targeted Rust suites until active artifact-path enforcement and failure contracts are green.**
- [x] **Step 5: Commit with `git add src/contracts/evidence.rs src/contracts/plan.rs src/contracts/runtime.rs src/contracts/spec.rs src/execution/mutate.rs src/execution/state.rs src/instructions/mod.rs src/repo_safety/mod.rs src/session_entry/mod.rs src/workflow/operator.rs src/workflow/status.rs tests/contracts_spec_plan.rs tests/packet_and_schema.rs tests/plan_execution.rs tests/repo_safety.rs tests/runtime_instruction_contracts.rs tests/support/workflow.rs tests/workflow_runtime.rs tests/workflow_shell_smoke.rs && git commit -m "feat: enforce featureforge artifact and failure contracts"`**

## Task 3: Replace The Binary Surface And Remove Legacy Shims

**Spec Coverage:** REQ-001, REQ-002, REQ-003, REQ-007, REQ-008, REQ-010
**Task Outcome:** The repo and shipped runtime surface are built around real `featureforge` binaries and renamed prebuilt assets, while all legacy wrapper binaries, compat launchers, markdown command shims, and migration helpers are removed from the supported product surface.
**Plan Constraints:**
- Do not leave helper wrappers installed or documented as supported entrypoints.
- Preserve checksum and manifest integrity when renaming checked-in prebuilt artifacts.
- Keep packaging validation blocking on binary, manifest, and checksum agreement.
**Open Questions:** none

**Files:**
- Modify: `bin/prebuilt/manifest.json`
- Create: `bin/prebuilt/darwin-arm64/featureforge`
- Create: `bin/prebuilt/darwin-arm64/featureforge.sha256`
- Delete: `bin/prebuilt/darwin-arm64/superpowers`
- Delete: `bin/prebuilt/darwin-arm64/superpowers.sha256`
- Create: `bin/prebuilt/windows-x64/featureforge.exe`
- Create: `bin/prebuilt/windows-x64/featureforge.exe.sha256`
- Delete: `bin/prebuilt/windows-x64/superpowers.exe`
- Delete: `bin/prebuilt/windows-x64/superpowers.exe.sha256`
- Modify: `scripts/refresh-prebuilt-runtime.sh`
- Modify: `scripts/refresh-prebuilt-runtime.ps1`
- Delete: `bin/superpowers`
- Delete: `bin/superpowers-config`
- Delete: `bin/superpowers-config.ps1`
- Delete: `bin/superpowers-migrate-install`
- Delete: `bin/superpowers-migrate-install.ps1`
- Delete: `bin/superpowers-plan-contract`
- Delete: `bin/superpowers-plan-contract.ps1`
- Delete: `bin/superpowers-plan-execution`
- Delete: `bin/superpowers-plan-execution.ps1`
- Delete: `bin/superpowers-plan-structure-common`
- Delete: `bin/superpowers-pwsh-common.ps1`
- Delete: `bin/superpowers-repo-safety`
- Delete: `bin/superpowers-repo-safety.ps1`
- Delete: `bin/superpowers-runtime-common.sh`
- Delete: `bin/superpowers-session-entry`
- Delete: `bin/superpowers-session-entry.ps1`
- Delete: `bin/superpowers-slug`
- Delete: `bin/superpowers-update-check`
- Delete: `bin/superpowers-update-check.ps1`
- Delete: `bin/superpowers-workflow`
- Delete: `bin/superpowers-workflow-status`
- Delete: `bin/superpowers-workflow-status.ps1`
- Delete: `bin/superpowers-workflow.ps1`
- Delete: `bin/superpowers.ps1`
- Delete: `compat/bash/superpowers`
- Delete: `compat/powershell/superpowers.ps1`
- Delete: `commands/brainstorm.md`
- Delete: `commands/execute-plan.md`
- Delete: `commands/write-plan.md`
- Modify: `tests/brainstorm-server/test-launch-wrappers.sh`
- Modify: `tests/instructions_and_git.rs`
- Modify: `tests/powershell_wrapper_bash_resolution.rs`
- Modify: `tests/powershell_wrapper_resolution.rs`
- Modify: `tests/runtime_instruction_contracts.rs`
- Modify: `tests/workflow_shell_smoke.rs`
- Test: `tests/powershell_wrapper_resolution.rs`

- [x] **Step 1: Tighten failing tests for the real `bin/featureforge` binary, renamed prebuilt assets, removed shim entrypoints, and packaging/integrity expectations before deleting wrappers.**
- [x] **Step 2: Run `cargo test powershell_wrapper_bash_resolution powershell_wrapper_resolution instructions_and_git runtime_instruction_contracts workflow_shell_smoke -- --nocapture` plus any existing shell wrapper smoke commands that still exercise the legacy surface, and confirm the red state.**
- [x] **Step 3: Replace the wrapper-owned surface with the real compiled `featureforge` binaries, rename prebuilt assets and checksums, update the refresh scripts, and remove the legacy `bin/`, `compat/`, and `commands/` shim surfaces.**
- [x] **Step 4: Re-run the targeted Rust, shell, and packaging checks until the binary surface and integrity contract are green.**
- [x] **Step 5: Commit with `git add -A bin/prebuilt/manifest.json bin/prebuilt/darwin-arm64 bin/prebuilt/windows-x64 scripts/refresh-prebuilt-runtime.sh scripts/refresh-prebuilt-runtime.ps1 bin compat commands tests/brainstorm-server/test-launch-wrappers.sh tests/instructions_and_git.rs tests/powershell_wrapper_bash_resolution.rs tests/powershell_wrapper_resolution.rs tests/runtime_instruction_contracts.rs tests/workflow_shell_smoke.rs && git commit -m "feat: cut over featureforge binary surface"`**

## Task 4: Cut Over Skill, Install, And Agent Namespaces

**Spec Coverage:** REQ-001, REQ-006, REQ-010
**Task Outcome:** Active skill IDs, install links, agent surfaces, generated preambles, upgrade surfaces, and discovery docs all use the `featureforge` namespace and the `~/.featureforge/install` root.
**Plan Constraints:**
- Keep generated skill docs consistent with their templates; do not hand-edit generated files without regenerating.
- Active skill IDs must use the full `featureforge:<skill>` namespace.
- Do not keep `using-superpowers` or `superpowers-upgrade` as active namespaces after the cutover.
**Open Questions:** none

**Files:**
- Modify: `.codex/INSTALL.md`
- Modify: `.codex/agents/code-reviewer.toml`
- Modify: `.copilot/INSTALL.md`
- Modify: `agents/code-reviewer.instructions.md`
- Modify: `agents/code-reviewer.md`
- Modify: `references/search-before-building.md`
- Modify: `review/TODOS-format.md`
- Modify: `review/checklist.md`
- Modify: `review/review-accelerator-packet-contract.md`
- Modify: `scripts/gen-skill-docs.mjs`
- Create: `featureforge-upgrade/SKILL.md`
- Delete: `superpowers-upgrade/SKILL.md`
- Modify: `skills/brainstorming/SKILL.md`
- Modify: `skills/brainstorming/SKILL.md.tmpl`
- Modify: `skills/dispatching-parallel-agents/SKILL.md`
- Modify: `skills/dispatching-parallel-agents/SKILL.md.tmpl`
- Modify: `skills/document-release/SKILL.md`
- Modify: `skills/document-release/SKILL.md.tmpl`
- Modify: `skills/executing-plans/SKILL.md`
- Modify: `skills/executing-plans/SKILL.md.tmpl`
- Modify: `skills/finishing-a-development-branch/SKILL.md`
- Modify: `skills/finishing-a-development-branch/SKILL.md.tmpl`
- Modify: `skills/plan-ceo-review/SKILL.md`
- Modify: `skills/plan-ceo-review/SKILL.md.tmpl`
- Modify: `skills/plan-eng-review/SKILL.md`
- Modify: `skills/plan-eng-review/SKILL.md.tmpl`
- Modify: `skills/qa-only/SKILL.md`
- Modify: `skills/qa-only/SKILL.md.tmpl`
- Modify: `skills/receiving-code-review/SKILL.md`
- Modify: `skills/receiving-code-review/SKILL.md.tmpl`
- Modify: `skills/requesting-code-review/SKILL.md`
- Modify: `skills/requesting-code-review/SKILL.md.tmpl`
- Modify: `skills/subagent-driven-development/SKILL.md`
- Modify: `skills/subagent-driven-development/SKILL.md.tmpl`
- Modify: `skills/systematic-debugging/SKILL.md`
- Modify: `skills/systematic-debugging/SKILL.md.tmpl`
- Modify: `skills/test-driven-development/SKILL.md`
- Modify: `skills/test-driven-development/SKILL.md.tmpl`
- Modify: `skills/using-git-worktrees/SKILL.md`
- Modify: `skills/using-git-worktrees/SKILL.md.tmpl`
- Create: `skills/using-featureforge/SKILL.md`
- Create: `skills/using-featureforge/SKILL.md.tmpl`
- Create: `skills/using-featureforge/references/codex-tools.md`
- Delete: `skills/using-superpowers/SKILL.md`
- Delete: `skills/using-superpowers/SKILL.md.tmpl`
- Delete: `skills/using-superpowers/references/codex-tools.md`
- Modify: `skills/verification-before-completion/SKILL.md`
- Modify: `skills/verification-before-completion/SKILL.md.tmpl`
- Modify: `skills/writing-plans/SKILL.md`
- Modify: `skills/writing-plans/SKILL.md.tmpl`
- Modify: `skills/writing-skills/SKILL.md`
- Modify: `skills/writing-skills/SKILL.md.tmpl`
- Modify: `tests/codex-runtime/gen-skill-docs.unit.test.mjs`
- Modify: `tests/codex-runtime/skill-doc-contracts.test.mjs`
- Modify: `tests/codex-runtime/skill-doc-generation.test.mjs`
- Modify: `tests/upgrade_skill.rs`
- Create: `tests/using_featureforge_skill.rs`
- Delete: `tests/using_superpowers_skill.rs`
- Test: `tests/codex-runtime/skill-doc-generation.test.mjs`

- [x] **Step 1: Tighten failing Node and Rust tests for `featureforge:<skill>` IDs, `~/.featureforge/install`, renamed install links, the new upgrade surface, and the `using-featureforge` router before changing templates.**
- [x] **Step 2: Run `node scripts/gen-skill-docs.mjs --check`, `node --test tests/codex-runtime/gen-skill-docs.unit.test.mjs tests/codex-runtime/skill-doc-contracts.test.mjs tests/codex-runtime/skill-doc-generation.test.mjs`, and `cargo test upgrade_skill using_featureforge_skill -- --nocapture` to capture the red state.**
- [x] **Step 3: Update the install docs, agent files, review references, generation script, skill templates, and generated skill docs to the `featureforge` namespace, create the `using-featureforge` and `featureforge-upgrade` surfaces, and remove the old `using-superpowers` and `superpowers-upgrade` paths from the active repo.**
- [x] **Step 4: Re-run the generation and namespace tests until the active skill/install/agent surface is green and fully `featureforge`-named.**
- [x] **Step 5: Commit with `git add -A .codex .copilot agents review scripts/gen-skill-docs.mjs featureforge-upgrade superpowers-upgrade skills tests/codex-runtime tests/evals tests/runtime_instruction_contracts.rs tests/upgrade_skill.rs tests/using_featureforge_skill.rs tests/using_superpowers_skill.rs && git commit -m "feat: cut over featureforge skill and install namespaces"`**

## Task 5: Rewrite Active Docs And Archive Historical Superpowers Artifacts

**Spec Coverage:** REQ-001, REQ-004, REQ-005, REQ-007, REQ-010, REQ-011
**Task Outcome:** Active non-archive docs use the `FeatureForge` identity, retain only the required README provenance attribution, and historical `docs/superpowers/*` materials are preserved verbatim under `docs/archive/superpowers/`.
**Plan Constraints:**
- Preserve historical docs verbatim when archiving; do not edit them during the move.
- Keep exactly one provenance attribution to the upstream project in `README.md`.
- Do not leave any active non-archive `superpowers` references in docs, review references, or support files.
**Open Questions:** none

**Files:**
- Modify: `README.md`
- Modify: `RELEASE-NOTES.md`
- Modify: `TODOS.md`
- Create: `.featureforge/config.yaml`
- Delete: `.superpowers/config.yaml`
- Modify: `docs/README.codex.md`
- Modify: `docs/README.copilot.md`
- Modify: `docs/testing.md`
- Modify: `docs/test-suite-enhancement-plan.md`
- Create: `docs/archive/superpowers/specs/2026-03-17-execution-workflow-clarity-design.md`
- Create: `docs/archive/superpowers/specs/2026-03-17-workflow-state-runtime-design.md`
- Create: `docs/archive/superpowers/specs/2026-03-18-gstack-borrowed-layer-alignment-design.md`
- Create: `docs/archive/superpowers/specs/2026-03-18-review-accelerator-design.md`
- Create: `docs/archive/superpowers/specs/2026-03-18-supported-workflow-cli-design.md`
- Create: `docs/archive/superpowers/specs/2026-03-21-bootstrap-and-branch-safety-hardening-design.md`
- Create: `docs/archive/superpowers/specs/2026-03-21-search-before-building-design.md`
- Create: `docs/archive/superpowers/specs/2026-03-21-skill-layer-delivery-governance-design.md`
- Create: `docs/archive/superpowers/specs/2026-03-21-task-fidelity-improvement-design.md`
- Create: `docs/archive/superpowers/specs/2026-03-21-using-superpowers-bypass-design.md`
- Create: `docs/archive/superpowers/specs/2026-03-22-runtime-integration-hardening-design.md`
- Create: `docs/archive/superpowers/specs/2026-03-23-rust-runtime-rewrite-design.md`
- Create: `docs/archive/superpowers/specs/2026-03-24-planning-review-sync-design.md`
- Create: `docs/archive/superpowers/plans/2026-03-17-execution-workflow-clarity-adversarial-follow-up.md`
- Create: `docs/archive/superpowers/plans/2026-03-17-execution-workflow-clarity-parser-hardening-follow-up.md`
- Create: `docs/archive/superpowers/plans/2026-03-17-execution-workflow-clarity.md`
- Create: `docs/archive/superpowers/plans/2026-03-17-workflow-state-runtime-alignment-follow-up.md`
- Create: `docs/archive/superpowers/plans/2026-03-17-workflow-state-runtime.md`
- Create: `docs/archive/superpowers/plans/2026-03-18-review-accelerator.md`
- Create: `docs/archive/superpowers/plans/2026-03-18-supported-workflow-cli.md`
- Create: `docs/archive/superpowers/plans/2026-03-19-gstack-borrowed-layer-alignment.md`
- Create: `docs/archive/superpowers/plans/2026-03-21-bootstrap-and-branch-safety-hardening.md`
- Create: `docs/archive/superpowers/plans/2026-03-21-search-before-building.md`
- Create: `docs/archive/superpowers/plans/2026-03-21-skill-layer-delivery-governance.md`
- Create: `docs/archive/superpowers/plans/2026-03-21-task-fidelity-improvement.md`
- Create: `docs/archive/superpowers/plans/2026-03-21-using-superpowers-bypass.md`
- Create: `docs/archive/superpowers/plans/2026-03-22-runtime-integration-hardening.md`
- Create: `docs/archive/superpowers/plans/2026-03-23-rust-runtime-rewrite.md`
- Create: `docs/archive/superpowers/plans/2026-03-24-planning-review-sync.md`
- Create: `docs/archive/superpowers/execution-evidence/2026-03-17-execution-workflow-clarity-adversarial-follow-up-r1-evidence.md`
- Create: `docs/archive/superpowers/execution-evidence/2026-03-17-execution-workflow-clarity-parser-hardening-follow-up-r1-evidence.md`
- Create: `docs/archive/superpowers/execution-evidence/2026-03-18-review-accelerator-r1-evidence.md`
- Create: `docs/archive/superpowers/execution-evidence/2026-03-18-supported-workflow-cli-r1-evidence.md`
- Create: `docs/archive/superpowers/execution-evidence/2026-03-19-gstack-borrowed-layer-alignment-r2-evidence.md`
- Create: `docs/archive/superpowers/execution-evidence/2026-03-21-bootstrap-and-branch-safety-hardening-r1-evidence.md`
- Create: `docs/archive/superpowers/execution-evidence/2026-03-21-search-before-building-r4-evidence.md`
- Create: `docs/archive/superpowers/execution-evidence/2026-03-21-skill-layer-delivery-governance-r1-evidence.md`
- Create: `docs/archive/superpowers/execution-evidence/2026-03-21-task-fidelity-improvement-r1-evidence.md`
- Create: `docs/archive/superpowers/execution-evidence/2026-03-21-using-superpowers-bypass-r1-evidence.md`
- Create: `docs/archive/superpowers/execution-evidence/2026-03-22-runtime-integration-hardening-r1-evidence.md`
- Create: `docs/archive/superpowers/execution-evidence/2026-03-23-rust-runtime-rewrite-r1-evidence.md`
- Create: `docs/archive/superpowers/execution-evidence/2026-03-23-rust-runtime-rewrite-r2-evidence.md`
- Create: `docs/archive/superpowers/execution-evidence/2026-03-24-planning-review-sync-r1-evidence.md`
- Modify: `tests/differential/README.md`
- Modify: `tests/evals/README.md`
- Modify: `tests/evals/search-before-building-contract.orchestrator.md`
- Create: `tests/evals/using-featureforge-routing.judge.md`
- Create: `tests/evals/using-featureforge-routing.orchestrator.md`
- Create: `tests/evals/using-featureforge-routing.runner.md`
- Create: `tests/evals/using-featureforge-routing.scenarios.md`
- Delete: `tests/evals/using-superpowers-routing.judge.md`
- Delete: `tests/evals/using-superpowers-routing.orchestrator.md`
- Delete: `tests/evals/using-superpowers-routing.runner.md`
- Delete: `tests/evals/using-superpowers-routing.scenarios.md`
- Test: `tests/codex-runtime/workflow-fixtures.test.mjs`

- [x] **Step 1: Tighten failing docs and fixture tests for the active `FeatureForge` docs surface, archived `Superpowers` docs location, and the single allowed README attribution before rewriting docs.**
- [x] **Step 2: Run `node --test tests/codex-runtime/workflow-fixtures.test.mjs`, the relevant eval/fixture checks, and `rg`-based dry runs over active non-archive docs and active path names to capture the current legacy-reference surface.**
- [x] **Step 3: Rewrite active docs to `FeatureForge`, rename repo-local active config to `.featureforge/config.yaml`, move the historical `docs/superpowers/*` tree verbatim into `docs/archive/superpowers/`, and rename the active eval fixture files to `using-featureforge-routing*` so no active path names retain the old product name.**
- [x] **Step 4: Re-run the targeted fixture, eval, and grep checks until active docs are clean and archived docs are inert.**
- [x] **Step 5: Commit with `git add -A README.md RELEASE-NOTES.md TODOS.md .featureforge/config.yaml .superpowers/config.yaml docs/README.codex.md docs/README.copilot.md docs/testing.md docs/test-suite-enhancement-plan.md docs/archive docs/superpowers tests/differential/README.md tests/evals tests/codex-runtime/workflow-fixtures.test.mjs && git commit -m "docs: archive superpowers history and cut over active docs"`**

## Task 6: Enforce Verification Gates And Archive Rename-Specific Planning Artifacts

**Spec Coverage:** REQ-002, REQ-005, REQ-009, REQ-010, REQ-011, REQ-012
**Task Outcome:** The repo has a dedicated no-active-legacy-surface verification gate, the final validation matrix proves the cutover contract, and the rename-specific spec and plan are archived under `docs/archive/featureforge/` once execution no longer depends on their active paths.
**Plan Constraints:**
- Do not archive the active rename spec/plan until execution, review, and release handoff are complete.
- The cutover gate must ignore `docs/archive/**` and the one allowed upstream attribution line in `README.md`.
- Validation must prove archive exclusion, binary integrity, namespace cutover, and forbidden-reference cleanliness together.
**Open Questions:** none

**Files:**
- Create: `scripts/check-featureforge-cutover.sh`
- Create: `docs/archive/featureforge/specs/2026-03-24-featureforge-rename-reset-design.md`
- Create: `docs/archive/featureforge/plans/2026-03-24-featureforge-rename-reset.md`
- Delete: `docs/featureforge/specs/2026-03-24-featureforge-rename-reset-design.md`
- Delete: `docs/featureforge/plans/2026-03-24-featureforge-rename-reset.md`
- Modify: `tests/codex-runtime/gen-skill-docs.unit.test.mjs`
- Modify: `tests/codex-runtime/skill-doc-contracts.test.mjs`
- Modify: `tests/differential/run_legacy_vs_rust.sh`
- Modify: `tests/fixtures/differential/workflow-status.json`
- Modify: `tests/runtime_instruction_contracts.rs`
- Test: `scripts/check-featureforge-cutover.sh`

- [x] **Step 1: Add the failing verification gate for forbidden active legacy references in both file contents and active path names, archive exclusion, binary/checksum agreement, and rename-spec-plan archival readiness.**
- [x] **Step 2: Run `bash scripts/check-featureforge-cutover.sh`, `node --test tests/codex-runtime/gen-skill-docs.unit.test.mjs tests/codex-runtime/skill-doc-contracts.test.mjs`, `cargo test runtime_instruction_contracts -- --nocapture`, and any differential smoke checks that still encode legacy names, and confirm the red state before implementation.**
- [x] **Step 3: Implement the minimum gate, fixture, and documentation updates needed to make the final verification matrix green, then move the rename-specific spec and plan into `docs/archive/featureforge/` and delete their active `docs/featureforge/*` copies only after all earlier execution/review dependencies on their active paths are satisfied.**
- [x] **Step 4: Re-run the full validation matrix from this plan, including Rust tests, Node contract tests, shell checks, integrity checks, and `bash scripts/check-featureforge-cutover.sh`, until the cutover contract is green end to end.**
- [x] **Step 5: Commit with `git add -A scripts/check-featureforge-cutover.sh docs/archive/featureforge/specs/2026-03-24-featureforge-rename-reset-design.md docs/archive/featureforge/plans/2026-03-24-featureforge-rename-reset.md docs/featureforge/specs/2026-03-24-featureforge-rename-reset-design.md docs/featureforge/plans/2026-03-24-featureforge-rename-reset.md tests/codex-runtime/gen-skill-docs.unit.test.mjs tests/codex-runtime/skill-doc-contracts.test.mjs tests/differential/run_legacy_vs_rust.sh tests/fixtures/differential/workflow-status.json tests/runtime_instruction_contracts.rs && git commit -m "test: enforce featureforge cutover gates"`**
