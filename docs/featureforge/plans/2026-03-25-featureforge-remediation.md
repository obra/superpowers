# FeatureForge Remediation Implementation Plan

> **For Codex and GitHub Copilot workers:** REQUIRED: Use the execution skill recommended by `featureforge plan execution recommend --plan <approved-plan-path>` after engineering approval; do not choose solely from isolated-agent availability. Steps use checkbox (`- [ ]`) syntax for tracking.

**Workflow State:** Engineering Approved
**Plan Revision:** 1
**Execution Mode:** featureforge:executing-plans
**Source Spec:** `docs/featureforge/specs/2026-03-25-featureforge-remediation-design.md`
**Source Spec Revision:** 1
**Last Reviewed By:** plan-eng-review

**Goal:** Deliver the full FeatureForge remediation program in phase-gated slices that stabilize runtime contracts first, remove unsupported legacy surfaces second, converge docs third, and defer structural cleanup until behavior is pinned by tests.

**Architecture:** This plan keeps one umbrella artifact because the approved spec is one umbrella remediation program, but execution remains phase-gated and reviewable. Runtime-owned contracts stay in Rust, shell and markdown consumers call or narrate those contracts, and each task ends with the phase-specific regression gate plus the canonical validation command for that phase.

**Tech Stack:** Rust CLI runtime (`clap`, `serde`, `schemars`), Node.js doc generators and contract tests, Bash and PowerShell repo scripts, `cargo nextest`, checked-in schema artifacts under `schemas/`

---

## Existing Capabilities / Built-ins to Reuse

- `src/update_check/mod.rs` already owns update-check cache and remote-version behavior; Task 1 should tighten install discovery instead of rebuilding the command family.
- `src/session_entry/mod.rs` already owns persisted session-entry state; Task 2 should extend that runtime rather than create a parallel bootstrap path.
- `scripts/gen-skill-docs.mjs` already centralizes shared preamble and doc generation; Tasks 1 through 4 should use it to regenerate checked-in skill docs instead of hand-editing repeated shell logic.
- `scripts/check-featureforge-cutover.sh` already enforces a repo-wide cutover gate; Task 3 should extend that gate to cover the remaining unsupported legacy-root surfaces.
- `tests/packet_and_schema.rs` already checks checked-in schema parity; Tasks 1 and 2 should plug new helper schemas into that existing test surface.
- `docs/testing.md` already defines the repo’s release-facing validation surface; Task 4 should converge it into one canonical command matrix instead of adding a second doc.

## Known Footguns / Constraints

- Do not treat a repo-local `VERSION` file by itself as a valid FeatureForge install.
- Do not preserve `~/.codex/featureforge` or `~/.copilot/featureforge` as supported or migration-only runtime paths.
- Do not let spawned-subagent bypass write human session-entry state unless an explicit opt-in path requests persistence.
- Do not perform broad refactors in Tasks 1 through 3; every extraction in those tasks must directly reduce a live contract split.
- Do not weaken `repo-safety`, approval-fingerprint, or workflow-manifest guarantees while moving helper logic.
- Use `featureforge:test-driven-development` discipline inside every task: write the red test first, make the smallest implementation change, rerun the targeted suite, then regenerate checked-in artifacts.

## Change Surface

- Task 1 changes runtime-root resolution, one new CLI surface, checked-in schema output, update-check integration, and shell/doc consumers that currently duplicate root-search logic.
- Task 2 changes session-entry resolution, the session-entry JSON/schema contract, and launcher-facing skill docs that need to pass the spawned-subagent runtime marker.
- Task 3 changes the cutover gate, remaining active legacy-root references, and install-smoke coverage for checked-in prebuilt layouts.
- Task 4 changes release-facing docs and doc-contract tests so contributors see one canonical validation and install story.
- Task 5 changes duplicate helper seams and hotspot modules only after Tasks 1 through 4 are green.
- Task 6 changes bounded CLI parsing and bare-command help behavior only after Task 5 helper-preservation tests are green.

## Preconditions

- Start from the approved spec at `docs/featureforge/specs/2026-03-25-featureforge-remediation-design.md` with `Spec Revision: 1`.
- Run all work from the repo root so `node scripts/gen-skill-docs.mjs`, `bash scripts/check-featureforge-cutover.sh`, and `cargo nextest` resolve the checked-in artifacts under test.
- Treat generated skill docs and checked-in schema files as first-class artifacts: regenerate them in the same task that changes their source.
- Keep commits phase-scoped. Do not mix Task 5 cleanup into Tasks 1 through 4.

## Execution Strategy

- Execute tasks strictly in order. Do not start Task 3 until Tasks 1 and 2 are green.
- End every task with the targeted regression subset for that phase plus the canonical release-facing validation command that Task 4 defines in `docs/testing.md`.
- Preserve the runtime-owned boundary: Rust decides, shell consumers call, markdown documents the result.
- When a task exposes a missing prerequisite from an earlier phase, stop and repair the earlier task instead of carrying the fix forward.

## Dependency Diagram

```text
Task 1  runtime-root helper + schema + consumer migration
   |
   v
Task 2  session-entry owns spawned-subagent bypass
   |
   v
Task 3  hard legacy-surface removal + repo-bounded cutover gate
   |
   v
Task 4  docs/testing convergence
   |
   v
Task 5  helper consolidation + hotspot narrowing
   |
   v
Task 6  typed CLI boundary + bare-help behavior

Green gate between every task:
targeted regression suite for the current task
  +
canonical validation command once Task 4 defines it
```

## Requirement Coverage Matrix

- REQ-001 -> Task 1
- REQ-002 -> Task 2
- REQ-003 -> Task 3
- REQ-004 -> Task 4
- REQ-005 -> Task 5
- REQ-006 -> Task 6
- REQ-007 -> Task 1
- DEC-001 -> Task 1, Task 2, Task 3, Task 4, Task 5, Task 6
- DEC-002 -> Task 3
- DEC-003 -> Task 1, Task 2, Task 3, Task 4, Task 5, Task 6
- VERIFY-001 -> Task 1, Task 2, Task 3, Task 5, Task 6
- VERIFY-002 -> Task 1, Task 2, Task 3, Task 4, Task 5, Task 6
- NONGOAL-001 -> Task 3
- NONGOAL-002 -> Task 1, Task 2, Task 3

## Task 1: Establish the Runtime-Root Contract

**Spec Coverage:** REQ-001, REQ-007, DEC-001, DEC-003, VERIFY-001, VERIFY-002, NONGOAL-002
**Task Outcome:** `featureforge repo runtime-root --json` becomes the single schemaed runtime-root contract, `update-check` stops accepting `VERSION`-only false positives, and shell/doc consumers stop embedding their own search-order logic or helper-failure fallback logic.
**Plan Constraints:**
- Keep the candidate list bounded to explicit env, repo-local runtime, binary-adjacent runtime, and canonical install.
- A repo-local candidate must include both `bin/featureforge` and `VERSION`.
- Preserve the existing `update-check` cache and TTL fetch posture; runtime-root changes must not increase remote fetch frequency.
- Consumer migration belongs in this task only after the helper and its tests are green.
- If the helper is unavailable or returns a named failure, shell and doc consumers must fail closed instead of synthesizing a fallback search path.
- Do not fold structural cleanup into this task beyond the helper extraction that establishes the contract.
**Open Questions:** none

**Files:**
- Create: `src/runtime_root/mod.rs`
- Create: `src/cli/runtime_root.rs`
- Create: `schemas/repo-runtime-root.schema.json`
- Modify: `src/cli/mod.rs`
- Modify: `src/lib.rs`
- Modify: `src/update_check/mod.rs`
- Modify: `scripts/gen-skill-docs.mjs`
- Modify: `featureforge-upgrade/SKILL.md`
- Modify: `skills/*/SKILL.md`
- Create: `tests/runtime_root_cli.rs`
- Modify: `tests/update_and_install.rs`
- Modify: `tests/upgrade_skill.rs`
- Modify: `tests/packet_and_schema.rs`
- Modify: `tests/codex-runtime/gen-skill-docs.unit.test.mjs`
- Modify: `tests/codex-runtime/skill-doc-generation.test.mjs`
- Test: `cargo nextest run --test runtime_root_cli --test update_and_install --test upgrade_skill --test packet_and_schema`
- Test: `node --test tests/codex-runtime/gen-skill-docs.unit.test.mjs tests/codex-runtime/skill-doc-generation.test.mjs`

- [x] **Step 1: Add red direct helper-contract tests in `tests/runtime_root_cli.rs` for resolved output, `resolved=false`, and named failure paths**
- [x] **Step 2: Add red Rust tests in `tests/update_and_install.rs` for `VERSION`-only false positives, valid repo-local runtimes, binary-adjacent runtimes, invalid `FEATUREFORGE_DIR` overrides, and cached `update-check` behavior under the existing TTL rules**
- [x] **Step 3: Add a red schema-parity case in `tests/packet_and_schema.rs` for `schemas/repo-runtime-root.schema.json`**
- [x] **Step 4: Add red Node generator tests that fail when shared preambles or upgrade instructions still embed root-search order or continue after helper failure**
- [x] **Step 5: Implement the bounded resolver and schema writer in `src/runtime_root/mod.rs`**
- [x] **Step 6: Add `repo runtime-root` CLI plumbing in `src/cli/runtime_root.rs`, `src/cli/mod.rs`, and `src/lib.rs`**
- [x] **Step 7: Replace `update_check::discover_paths()` with helper-backed resolution that rejects `VERSION`-only installs without changing cache/TTL fetch behavior**
- [x] **Step 8: Update `scripts/gen-skill-docs.mjs` and `featureforge-upgrade/SKILL.md` to call the runtime-root helper, then regenerate `skills/*/SKILL.md` with `node scripts/gen-skill-docs.mjs`**
- [x] **Step 9: Check in `schemas/repo-runtime-root.schema.json` and make the schema tests pass**
- [x] **Step 10: Run `cargo nextest run --test runtime_root_cli --test update_and_install --test upgrade_skill --test packet_and_schema` and `node --test tests/codex-runtime/gen-skill-docs.unit.test.mjs tests/codex-runtime/skill-doc-generation.test.mjs` until both suites pass**
- [x] **Step 11: Commit the phase slice with `git commit -m \"feat: add runtime-root helper contract\"`**
## Task 2: Make Session-Entry Own Spawned-Subagent Bypass

**Spec Coverage:** REQ-002, DEC-001, DEC-003, VERIFY-001, VERIFY-002, NONGOAL-002
**Task Outcome:** Session-entry resolution recognizes a spawned-subagent marker, bypasses first-turn bootstrap by default for that nested context, keeps the bypass ephemeral unless explicitly opted in, and leaves skill docs describing runtime truth instead of inventing it.
**Plan Constraints:**
- The default spawned-subagent bypass must not persist a decision file.
- Explicit re-entry and explicit opt-in persistence must remain distinguishable in the JSON contract.
- Launcher-facing skill docs must set the runtime marker consistently in the same task that changes runtime behavior.
- Do not remove legacy roots in this task.
**Open Questions:** none

**Files:**
- Modify: `src/session_entry/mod.rs`
- Modify: `src/cli/session_entry.rs`
- Modify: `schemas/session-entry-resolve.schema.json`
- Modify: `skills/using-featureforge/SKILL.md.tmpl`
- Modify: `skills/dispatching-parallel-agents/SKILL.md.tmpl`
- Modify: `skills/subagent-driven-development/SKILL.md.tmpl`
- Modify: `skills/using-featureforge/SKILL.md`
- Modify: `skills/dispatching-parallel-agents/SKILL.md`
- Modify: `skills/subagent-driven-development/SKILL.md`
- Modify: `tests/using_featureforge_skill.rs`
- Modify: `tests/session_config_slug.rs`
- Modify: `tests/runtime_instruction_contracts.rs`
- Modify: `tests/workflow_runtime.rs`
- Modify: `tests/packet_and_schema.rs`
- Test: `cargo nextest run --test using_featureforge_skill --test session_config_slug --test workflow_runtime --test runtime_instruction_contracts --test packet_and_schema`

- [x] **Step 1: Add red Rust tests for spawned-subagent default bypass, non-persistence, explicit opt-in re-entry, and nested review noise suppression**
- [x] **Step 2: Add red doc-contract assertions in `tests/using_featureforge_skill.rs` and `tests/runtime_instruction_contracts.rs` for the runtime-owned spawned-subagent marker path**
- [x] **Step 3: Extend `src/cli/session_entry.rs` with explicit spawned-subagent and opt-in inputs that are visible at the parse boundary**
- [x] **Step 4: Implement ephemeral spawned-subagent bypass behavior in `src/session_entry/mod.rs` and keep persistence disabled by default for nested contexts**
- [x] **Step 5: Update the session-entry schema output and refresh `schemas/session-entry-resolve.schema.json`**
- [x] **Step 6: Update `skills/using-featureforge/SKILL.md.tmpl`, `skills/dispatching-parallel-agents/SKILL.md.tmpl`, and `skills/subagent-driven-development/SKILL.md.tmpl`, then regenerate the checked-in skill docs**
- [x] **Step 7: Run `cargo nextest run --test using_featureforge_skill --test session_config_slug --test workflow_runtime --test runtime_instruction_contracts --test packet_and_schema` until the nested-session contract is green**
- [x] **Step 8: Commit the phase slice with `git commit -m \"feat: make subagent bypass runtime-owned\"`**
## Task 3: Remove Unsupported Legacy Surfaces and Add the Gate

**Spec Coverage:** REQ-003, DEC-001, DEC-002, DEC-003, VERIFY-001, VERIFY-002, NONGOAL-001, NONGOAL-002
**Task Outcome:** Active FeatureForge behavior and active generated/public surfaces stop referencing `~/.codex/featureforge` and `~/.copilot/featureforge`, the cutover gate blocks reintroduction in active paths and active content, and checked-in prebuilt layout smoke coverage covers `darwin-arm64` and `windows-x64`.
**Plan Constraints:**
- Remove unsupported legacy behavior in the same task that adds the gate and refreshes affected artifacts.
- Ignore archive and history roots intentionally preserved under `docs/archive/`.
- Do not add a legacy migration fallback or a dedicated runtime diagnostic path.
- Keep the cutover gate repo-bounded and classify active versus archived legacy-surface hits in one scan pass per invocation.
- Keep docs-only cleanup that is not required for cutover correctness in Task 4.
**Open Questions:** none

**Files:**
- Modify: `scripts/check-featureforge-cutover.sh`
- Modify: `scripts/gen-skill-docs.mjs`
- Modify: `scripts/refresh-prebuilt-runtime.sh`
- Modify: `scripts/refresh-prebuilt-runtime.ps1`
- Modify: `featureforge-upgrade/SKILL.md`
- Modify: `skills/*/SKILL.md`
- Modify: `tests/upgrade_skill.rs`
- Modify: `tests/workflow_shell_smoke.rs`
- Modify: `tests/powershell_wrapper_resolution.rs`
- Modify: `tests/support/prebuilt.rs`
- Modify: `tests/codex-runtime/skill-doc-contracts.test.mjs`
- Modify: `tests/codex-runtime/skill-doc-generation.test.mjs`
- Modify: `TODOS.md`
- Test: `bash scripts/check-featureforge-cutover.sh`
- Test: `cargo nextest run --test upgrade_skill --test workflow_shell_smoke --test powershell_wrapper_resolution`
- Test: `node --test tests/codex-runtime/skill-doc-contracts.test.mjs tests/codex-runtime/skill-doc-generation.test.mjs`

- [x] **Step 1: Add red gate and doc-contract tests that fail on active legacy-root content, active legacy-root paths, and stale generated artifacts while allowing `docs/archive/` content**
- [x] **Step 2: Extend `scripts/check-featureforge-cutover.sh` to classify active versus archived hits in one repo-bounded pass and print exact offending files for active legacy-root path and content hits**
- [x] **Step 3: Remove remaining active legacy-root references from `scripts/gen-skill-docs.mjs`, `featureforge-upgrade/SKILL.md`, and regenerated `skills/*/SKILL.md`**
- [x] **Step 4: Add red install-smoke assertions for `bin/prebuilt/darwin-arm64` and `bin/prebuilt/windows-x64`, then update `tests/support/prebuilt.rs`, `tests/upgrade_skill.rs`, `tests/workflow_shell_smoke.rs`, and `tests/powershell_wrapper_resolution.rs` until the layout contract passes**
- [x] **Step 5: Update `scripts/refresh-prebuilt-runtime.sh` and `scripts/refresh-prebuilt-runtime.ps1` so the checked-in refresh flow matches the smoke-tested layout contract**
- [x] **Step 6: Update `TODOS.md` so the completed cutover items are no longer tracked as open debt**
- [x] **Step 7: Run `bash scripts/check-featureforge-cutover.sh`, `cargo nextest run --test upgrade_skill --test workflow_shell_smoke --test powershell_wrapper_resolution`, and `node --test tests/codex-runtime/skill-doc-contracts.test.mjs tests/codex-runtime/skill-doc-generation.test.mjs` until all cutover gates pass**
- [x] **Step 8: Commit the phase slice with `git commit -m \"feat: remove legacy root surfaces\"`**
## Task 4: Converge Docs and Validation Commands

**Spec Coverage:** REQ-004, DEC-001, DEC-003, VERIFY-002
**Task Outcome:** README, install docs, testing docs, and machine-checkable doc contracts all tell one canonical FeatureForge story that matches the stabilized runtime and cutover behavior.
**Plan Constraints:**
- Use one canonical validation entrypoint in `docs/testing.md`.
- Keep generated-doc freshness checks visible anywhere the repo contract depends on them.
- Do not introduce new runtime behavior in this task.
- Do not add a starter/example artifact unless the docs point at a checked-in file that exists in the same task.
**Open Questions:** none

**Files:**
- Modify: `README.md`
- Modify: `docs/testing.md`
- Modify: `docs/README.codex.md`
- Modify: `docs/README.copilot.md`
- Modify: `.codex/INSTALL.md`
- Modify: `.copilot/INSTALL.md`
- Modify: `tests/codex-runtime/skill-doc-contracts.test.mjs`
- Modify: `tests/runtime_instruction_contracts.rs`
- Test: `node scripts/gen-skill-docs.mjs --check`
- Test: `node --test tests/codex-runtime/*.test.mjs`
- Test: `cargo nextest run --test runtime_instruction_contracts --test workflow_runtime`

- [x] **Step 1: Add red doc-contract assertions for the canonical validation entrypoint and generated-doc freshness mentions**
- [x] **Step 2: Update `docs/testing.md` to remove the duplicate `cargo nextest` line and publish the canonical validation command matrix**
- [x] **Step 3: Update `README.md`, `docs/README.codex.md`, `docs/README.copilot.md`, `.codex/INSTALL.md`, and `.copilot/INSTALL.md` so install, runtime-root, session-entry, and update behavior match Tasks 1 through 3**
- [x] **Step 4: Tighten `tests/codex-runtime/skill-doc-contracts.test.mjs` and `tests/runtime_instruction_contracts.rs` so drift in release-facing guidance fails loudly**
- [x] **Step 5: Run `node scripts/gen-skill-docs.mjs --check`, `node --test tests/codex-runtime/*.test.mjs`, and `cargo nextest run --test runtime_instruction_contracts --test workflow_runtime` until the doc surface is green**
- [x] **Step 6: Commit the phase slice with `git commit -m \"docs: converge featureforge validation guidance\"`**
## Task 5: Consolidate Shared Helpers and Narrow Hotspots

**Spec Coverage:** REQ-005, DEC-001, DEC-003, VERIFY-001, VERIFY-002
**Task Outcome:** Duplicate helper seams are reduced behind focused shared modules, hotspot files are narrower, and the earlier behavior contracts remain pinned by helper-preservation tests.
**Plan Constraints:**
- Every extracted helper must delete at least one existing duplicate call site.
- Keep shared parsing close to the owning boundary; do not push invalid-input handling deeper into runtime code.
- Restrict this task to helper consolidation and hotspot narrowing; do not mix CLI parse-boundary or bare-help behavior into this slice.
- Preserve the Task 1 through Task 4 behavior contracts exactly while moving code.
**Open Questions:** none

**Files:**
- Create: `src/contracts/headers.rs`
- Create: `src/workflow/markdown_scan.rs`
- Modify: `src/contracts/mod.rs`
- Modify: `src/contracts/spec.rs`
- Modify: `src/contracts/plan.rs`
- Modify: `src/contracts/evidence.rs`
- Modify: `src/git/mod.rs`
- Modify: `src/workflow/manifest.rs`
- Modify: `src/workflow/status.rs`
- Modify: `src/execution/state.rs`
- Modify: `src/repo_safety/mod.rs`
- Modify: `tests/contracts_spec_plan.rs`
- Modify: `tests/plan_execution.rs`
- Modify: `tests/repo_safety.rs`
- Modify: `tests/workflow_runtime.rs`
- Test: `cargo nextest run --test contracts_spec_plan --test plan_execution --test repo_safety --test workflow_runtime`

- [x] **Step 1: Add red tests for shared-header parity, shared markdown-scan parity, and helper-preservation behavior across workflow, execution, and repo-safety surfaces**
- [x] **Step 2: Extract shared header parsing into `src/contracts/headers.rs` and route `src/contracts/spec.rs`, `src/contracts/plan.rs`, and `src/contracts/evidence.rs` through it without changing accepted headers**
- [x] **Step 3: Consolidate repo-slug and hashing helpers across `src/git/mod.rs`, `src/workflow/manifest.rs`, `src/execution/state.rs`, and `src/repo_safety/mod.rs`**
- [x] **Step 4: Extract one shared markdown scan helper in `src/workflow/markdown_scan.rs` and route both `src/workflow/status.rs` and `src/execution/state.rs` through it**
- [x] **Step 5: Run `cargo nextest run --test contracts_spec_plan --test plan_execution --test repo_safety --test workflow_runtime` until the helper-preservation slice is green**
- [x] **Step 6: Commit the helper slice with `git commit -m \"refactor: consolidate featureforge helper seams\"`**
## Task 6: Harden the CLI Parse Boundary and Bare Help Behavior

**Spec Coverage:** REQ-006, DEC-001, DEC-003, VERIFY-001, VERIFY-002
**Task Outcome:** Bounded CLI inputs are typed at the parse boundary, runtime adapters consume those typed values without widening accepted inputs, and bare `featureforge` prints help instead of silently succeeding.
**Plan Constraints:**
- Keep parse-boundary validation at the CLI boundary; do not push invalid-input handling deeper into runtime code.
- Restrict this task to typed CLI parsing, runtime adapters for those typed values, and bare-help behavior.
- Preserve the Task 1 through Task 5 behavior contracts exactly while changing input types.
- End this task with the full canonical validation command from `docs/testing.md`.
**Open Questions:** none

**Files:**
- Create: `tests/cli_parse_boundary.rs`
- Modify: `src/cli/plan_execution.rs`
- Modify: `src/cli/repo_safety.rs`
- Modify: `src/cli/session_entry.rs`
- Modify: `src/lib.rs`
- Modify: `src/workflow/operator.rs`
- Modify: `src/execution/state.rs`
- Modify: `src/execution/mutate.rs`
- Modify: `src/repo_safety/mod.rs`
- Modify: `src/session_entry/mod.rs`
- Test: `cargo nextest run --test cli_parse_boundary`

- [x] **Step 1: Add red tests in `tests/cli_parse_boundary.rs` for invalid bounded CLI inputs and bare `featureforge` help output**
- [x] **Step 2: Replace bounded string parsing with typed `clap` values in `src/cli/plan_execution.rs`, `src/cli/repo_safety.rs`, and `src/cli/session_entry.rs`**
- [x] **Step 3: Update `src/lib.rs`, `src/workflow/operator.rs`, `src/execution/state.rs`, `src/execution/mutate.rs`, `src/repo_safety/mod.rs`, and `src/session_entry/mod.rs` to consume the typed boundary values without widening accepted inputs**
- [x] **Step 4: Make bare `featureforge` print help and exit cleanly**
- [x] **Step 5: Run `cargo nextest run --test cli_parse_boundary`, then run the full canonical validation command from `docs/testing.md`**
- [x] **Step 6: Commit the CLI slice with `git commit -m \"refactor: harden featureforge cli boundary\"`**
## Evidence Expectations

- Record the red test or gate failure that justified each task before the first code change in that task.
- Capture the exact green verification commands from the task-level test lines in the eventual execution evidence.
- When a task regenerates checked-in artifacts, include both the regeneration command and the freshness check command in the evidence.
- When a task changes a schema artifact, include the schema-parity test output that proves the checked-in file matches generated output.

## Validation Strategy

- Task 1 validates the helper contract with Rust integration tests, schema parity, and Node generator tests while preserving the current `update-check` cache/TTL fetch behavior.
- Task 2 validates the nested-session contract with Rust runtime tests plus skill/doc contract assertions.
- Task 3 validates canonical cutover with a repo-bounded single-pass shell gate, install-smoke suites, and generated-doc contract tests.
- Task 4 validates contributor guidance with the canonical doc-check commands and runtime instruction contract tests.
- Task 5 validates helper-preservation refactors with focused Rust suites across contract, workflow, execution, and repo-safety surfaces.
- Task 6 validates typed CLI parsing with dedicated parse-boundary tests first, then the full canonical validation command published in `docs/testing.md`.

## Documentation Update Expectations

- Update release-facing docs only after the runtime or gate behavior they describe is already real in the repo.
- Regenerated skill docs must land in the same task as their template or generator source changes.
- `docs/testing.md` becomes the canonical validation reference by the end of Task 4 and stays authoritative for Task 5 full-validation runs.

## Rollout Plan

- Roll forward one task at a time with the same phase order as the approved spec.
- Treat Task 1 and Task 2 as the stabilization gate for every later task.
- Land Task 3 only when the Task 1 and Task 2 suites are already green in the same branch state.
- Land Task 5 only after Task 4 publishes the final canonical validation command and that command is green before cleanup starts.
- Land Task 6 only after the Task 5 helper-preservation slice is already green.

## Rollback Plan

- If Task 1 consumer migration regresses, revert the consumer-side changes first and preserve the helper contract plus red tests.
- If Task 2 leaks bypass state into later human sessions, revert the spawned-subagent behavior change before touching later tasks.
- If Task 3 breaks generated artifacts or prebuilt smoke expectations, revert the legacy-surface removal slice together with the gate change and regenerate the last known good artifacts.
- If Task 4 creates mixed guidance, revert the doc bundle as one slice.
- If Task 5 reopens behavior bugs, revert the helper-consolidation slice and keep the earlier task contracts intact.
- If Task 6 causes CLI regressions, revert the typed-boundary slice and preserve the Task 5 helper cleanup.

## Risks and Mitigations

- Hard cutover can expose hidden dependencies in tests or generated artifacts.
  Mitigation: Task 3 starts with red gate coverage before any removal patch lands.
- Cross-language helper contracts can drift again after the first cleanup.
  Mitigation: Task 1 checks in a schema artifact and Task 4 makes freshness checks part of the canonical validation path.
- Structural cleanup or CLI hardening can smuggle in behavior changes.
  Mitigation: Task 5 begins with helper-preservation red tests, and Task 6 applies typed-boundary changes only after the helper slice is green.

## NOT in Scope

- Legacy-root migration fallbacks or dedicated runtime diagnostics are deferred because the approved program removes those surfaces outright in Task 3.
- New browser-visible UI, browser QA workflows, or Playwright coverage are excluded because this remediation remains CLI/runtime and generated-doc only.
- New daemons, watchers, background cache services, or recursive install discovery are excluded because the approved spec requires bounded local execution.
- A wholesale runtime rewrite or new service boundary is excluded because the plan is intentionally a contract-first remediation that reuses the existing runtime.

## What Already Exists

- `src/update_check/mod.rs` already owns cache, TTL, and remote-version logic, so Task 1 narrows discovery without rebuilding update-check behavior.
- `src/session_entry/mod.rs` already owns persisted session-entry state, so Task 2 extends the runtime-owned contract instead of adding a parallel launcher path.
- `scripts/gen-skill-docs.mjs` already centralizes preamble and skill-doc generation, so Tasks 1 through 4 reuse one generator surface.
- `scripts/check-featureforge-cutover.sh` already enforces repo-wide cutover checks, so Task 3 tightens and bounds that gate instead of replacing it.
- `tests/packet_and_schema.rs` already checks schema parity, so Tasks 1 and 2 reuse the existing contract-validation surface.
- `docs/testing.md` already exists as the contributor validation doc, so Task 4 converges guidance there instead of inventing a second release checklist.

## Inline Diagram Expectations

- Add a small candidate-resolution diagram comment in `src/runtime_root/mod.rs` when Task 1 lands.
- Add a nested-session bypass state diagram comment in `src/session_entry/mod.rs` when Task 2 lands.
- Add an active-versus-archive classification diagram comment near the scan logic in `scripts/check-featureforge-cutover.sh` when Task 3 lands.
- Add a shared markdown-scan flow diagram comment in `src/workflow/markdown_scan.rs` when Task 5 lands.

## Failure Modes

- Runtime-root helper unavailable or returns a named failure. Covered by Task 1 direct helper tests and Node generator failure-path assertions; error handling is explicit fail-closed behavior, and the user sees a named failure instead of silent fallback.
- `update-check` resolves a `VERSION`-only tree or fetches more often than the current TTL rules allow. Covered by Task 1 `tests/update_and_install.rs`; error handling stays in existing update-check logic, and the user sees either the current cached behavior or no update output, not a false install.
- Spawned-subagent bypass persists into later human sessions. Covered by Task 2 runtime tests; error handling is runtime-owned non-persistence by default, and the user sees contract drift in test failures instead of silent state mutation.
- Legacy-surface gate misclassifies `docs/archive/` content or rescans active content unnecessarily. Covered by Task 3 gate/doc-contract tests; the shell gate must print exact offending files, so failures stay diagnosable.
- Release-facing docs drift from stabilized runtime behavior. Covered by Task 4 doc-contract suites; failures are loud freshness/contract failures rather than silent drift.
- Typed CLI boundary changes widen accepted inputs or bare `featureforge` still exits silently. Covered by Task 6 parse-boundary tests; the user sees immediate parse/help output and no silent-success path remains.

## TODOS.md Review

- No new deferred work was strong enough to justify a separate `TODOS.md` entry; the review findings were all tightened directly into the task plan.

## Engineering Review Summary

- Step 0: Scope Challenge (user chose: `BIG CHANGE`)
- Architecture Review: 1 issue found
- Code Quality Review: 1 issue found
- Test Review: coverage graph produced, 1 automated gap identified, browser QA required: no
- Performance Review: 1 issue found
- NOT in scope: written
- What already exists: written
- TODOS.md updates: 0 items proposed to user
- Failure modes: 0 critical gaps flagged
- Test Plan Artifact: `/Users/dmulcahey/.featureforge/projects/dmulcahey-superpowers/dmulcahey-dm-review-remediation-de74ce66a8d4-test-plan-20260325-100440.md`
- Outside Voice: skipped
- Retrospective learning: no prior plan-review cycle commits were found on this branch before the current draft/spec commit
