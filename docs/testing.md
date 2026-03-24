# Testing Superpowers

This repository has three primary automated validation surfaces plus opt-in or change-specific eval gates:

- `tests/codex-runtime/*.test.mjs` for deterministic generated-skill, template, and fixture contracts
- root Rust suites under `tests/*.rs` for runtime behavior, wrapper parity, and install/update/migration contracts
- `tests/differential/` for legacy-vs-canonical runtime smoke comparisons during command-surface cutovers
- `tests/brainstorm-server/` for the brainstorming visual companion server

## Recommended Validation Order

Run these commands from the repository root:

```bash
node scripts/gen-agent-docs.mjs --check
node scripts/gen-skill-docs.mjs --check
node --test tests/codex-runtime/*.test.mjs
cargo nextest run --test contracts_spec_plan --test runtime_instruction_contracts --test using_superpowers_skill --test session_config_slug --test repo_safety --test update_and_install --test workflow_runtime --test workflow_shell_smoke --test plan_execution --test powershell_wrapper_resolution --test upgrade_skill
bash tests/differential/run_legacy_vs_rust.sh
bash tests/brainstorm-server/test-launch-wrappers.sh
npm ci --prefix tests/brainstorm-server
node --test tests/brainstorm-server/server.test.js tests/brainstorm-server/ws-protocol.test.js
```

For prompt-surface or workflow-doc changes, keep validation deterministic-first: regenerate outputs, run the checked deterministic suites, and only then run any higher-order eval gates that exercise agent judgment.

Run the helper timing suites sequentially. The `contracts_spec_plan`, `workflow_runtime`, and `plan_execution` suites include warm-path slowdown guards and cache-invalidation checks; they are meant to catch real regressions in the helpers, not scheduler noise from launching all perf-sensitive suites in parallel.

## Rust Cutover Gate

For the Rust runtime cutover, the checked-in prebuilt runtime contract is release-critical:

- supported checked-in targets are `darwin-arm64` and `windows-x64`
- refresh the macOS binary with `SUPERPOWERS_PREBUILT_TARGET=darwin-arm64 SUPERPOWERS_PREBUILT_RUST_TARGET=aarch64-apple-darwin bash scripts/refresh-prebuilt-runtime.sh`
- refresh the Windows binary with `CARGO_TARGET_X86_64_PC_WINDOWS_GNU_LINKER=x86_64-w64-mingw32-gcc SUPERPOWERS_PREBUILT_TARGET=windows-x64 SUPERPOWERS_PREBUILT_RUST_TARGET=x86_64-pc-windows-gnu pwsh -File scripts/refresh-prebuilt-runtime.ps1`
- after refreshing `bin/prebuilt/manifest.json` and the `*.sha256` files, run `bash scripts/check-runtime-benchmarks.sh`
- before calling the cutover complete, capture blocking fresh-install evidence from a macOS arm64 host showing that `superpowers install migrate` resolves the checked-in manifest, verifies the checksum, installs the host-matching runtime into `~/.superpowers/install/bin`, and launches the installed binary directly
- for `windows-x64`, capture blocking packaging evidence that the checked-in manifest resolves the Windows binary, verifies the checksum, installs it into `~/.superpowers/install/bin`, and yields a valid PE artifact; direct `superpowers.exe` launch proof on a real Windows host is recommended follow-on validation rather than a cutover blocker

## What Each Suite Covers

### `tests/codex-runtime/*.test.mjs`

- Generated `skills/*/SKILL.md` presence, frontmatter, generated-header, and placeholder coverage
- Semantic preamble contracts for base and review skills
- Unit coverage for `scripts/gen-skill-docs.mjs` pure helper behavior
- Workflow-fixture regression coverage for the sequencing contract

### Root Rust Runtime Suites (`tests/*.rs`)

- Runtime-facing install docs, generated `skills/*/SKILL.md` contracts, wrapper parity, and behavior checks anchored in the root Rust suites under `tests/*.rs`
- `using-superpowers` runtime-owned session-entry wording, decision-file contract, malformed-state fail-closed handling, explicit re-entry semantics, and the deterministic documented first-turn gate flow around the real `superpowers session-entry resolve` command
- the dedicated `superpowers session-entry` contract for decision resolution, re-entry, deterministic decision paths, and command-input failure handling
- the dedicated `superpowers plan contract` runtime contract for Requirement Index parsing, coverage-matrix linting, fail-closed ambiguity detection, task-packet generation, and bounded packet-cache behavior
- Protected-branch repo-write guarantees for the `superpowers repo-safety` runtime contract, plus the shared workflow-stage adoption of that gate
- Generated reviewer-agent artifact freshness for Codex and GitHub Copilot
- Runtime helper contracts for config, plan execution, update checks, migration, and upgrade flow
- Wrapper and compatibility coverage for the shipped `bin/superpowers-workflow` and `bin/superpowers-workflow-status` surfaces, including wrapper-forwarding parity for the supported public workflow operator commands
- Workflow-status helper contracts for branch-scoped workflow manifests, conservative stage routing, bounded scans, and warm-path performance
- PowerShell wrapper behavior, including Git Bash selection and Windows path handling
- Install documentation and supported runtime references
- Required support files such as `VERSION`, `review/TODOS-format.md`, `review/checklist.md`, the shared QA assets, and `superpowers-upgrade/SKILL.md`
- Dedicated workflow-artifact fixtures under `tests/codex-runtime/fixtures/workflow-artifacts/` cover most sequencing-contract cases, while a small number of assertions still intentionally pin checked-in repo docs

### `tests/differential/`

- Legacy-vs-canonical runtime smoke comparisons for the command families being cut over
- Differential coverage is intentionally narrow today: it only checks normalized `workflow status --refresh` parity and should not be read as full operator-surface proof
- Checked-in normalized fixture expectations for canonical workflow status output
- Mismatch triage guidance so output differences are reviewed instead of silently blessed

### Rust Integration Coverage

- `tests/runtime_instruction_contracts.rs` is the canonical Rust coverage for the old static runtime-instruction, workflow-enhancement, and workflow-sequencing shell gates. It owns the deterministic repo-doc, fixture, generation-freshness, reviewer-contract, and runtime-instruction assertions.
- `tests/using_superpowers_skill.rs` is the canonical Rust coverage for the documented bypass wording, canonical decision-path derivation, and a deterministic execution of the published first-turn gate flow around the real `session-entry resolve` command, plus the eval-doc references that previously pointed at shell harnesses.
- `tests/workflow_runtime.rs` is the canonical Rust coverage for `superpowers workflow ...` behavior, including the public operator surface (`next`, `artifacts`, `explain`, `phase`, `doctor`, `handoff`, `preflight`, `gate review`, `gate finish`), read-only corrupt-manifest handling, canonical session-entry lookup, and workflow-status parity where that parity is still intentional
- `tests/workflow_shell_smoke.rs` is the canonical Rust wrapper-parity coverage for the shipped public `bin/superpowers-workflow` bash surface, including `help`, `status`, `next`, `artifacts`, `explain`, `phase`, `doctor`, `handoff`, `preflight`, and `gate`
- `tests/powershell_wrapper_resolution.rs` is the canonical Rust coverage for PowerShell wrapper bash selection, transport fidelity, canonical subcommand forwarding, and nonzero-exit preservation
- `tests/upgrade_skill.rs` is the canonical Rust coverage for the `superpowers-upgrade` skill contract, including install-root resolution and direct version-relation checks
- `tests/plan_execution.rs`, `tests/repo_safety.rs`, `tests/session_config_slug.rs`, and `tests/update_and_install.rs` carry the canonical Rust contracts for the corresponding runtime families

### `tests/brainstorm-server/`

- WebSocket protocol behavior for the brainstorming visual companion
- HTTP server behavior and frame-serving expectations
- Shell and PowerShell launch-wrapper smoke coverage

## When To Run What

- Editing any `SKILL.md.tmpl`, runtime helper, or install/readme doc: run `node --test tests/codex-runtime/*.test.mjs`, `cargo nextest run --test runtime_instruction_contracts --test using_superpowers_skill --test session_config_slug --test repo_safety --test update_and_install --test workflow_runtime --test workflow_shell_smoke --test plan_execution --test powershell_wrapper_resolution --test upgrade_skill`
- Editing canonical command vocabulary, workflow routing docs, or runtime wrapper references: include `cargo nextest run --test workflow_runtime` and `bash tests/differential/run_legacy_vs_rust.sh`
- Editing task-fidelity helpers, packet-backed execution/review prompts, or plan traceability docs: include `cargo nextest run --test contracts_spec_plan --test plan_execution --test runtime_instruction_contracts`
- Editing `skills/using-superpowers/*`, `scripts/gen-skill-docs.mjs`, or entry-routing docs: include `cargo nextest run --test using_superpowers_skill --test session_config_slug`, and review the routing-gate notes below
- Editing protected-branch repo-write guarantees, repo-writing workflow skill docs, or the `superpowers repo-safety` runtime contract: include `cargo nextest run --test repo_safety --test runtime_instruction_contracts`
- Editing brainstorming server files under `skills/brainstorming/scripts/`: run `bash tests/brainstorm-server/test-launch-wrappers.sh` and `node --test tests/brainstorm-server/server.test.js tests/brainstorm-server/ws-protocol.test.js`
- Editing both runtime and brainstorming-server files: run both suites

The brainstorm-server Node tests use a checked-in test-only dependency (`ws`). On a fresh checkout, or whenever `tests/brainstorm-server/node_modules/` is absent, bootstrap that fixture first with:

```bash
npm ci --prefix tests/brainstorm-server
```

## Evals And Change-Specific Gates

- `tests/evals/*.eval.mjs` remains an opt-in quality tier for the Node-driven prompt-behavior checks that still use `.eval.mjs`
- `tests/evals/using-superpowers-routing.orchestrator.md` is the authoritative Item 1 routing gate and drives the repo-versioned scenario, runner, and judge markdown artifacts plus local per-scenario evidence bundles under `~/.superpowers/projects/<slug>/...`
  This gate is agent-executed and does not run through `node --test` or the Node OpenAI-judge helper path. It is not part of the default deterministic validation order, but it is a required change-specific gate for Item 1 routing-safety work.
- `tests/evals/search-before-building-contract.orchestrator.md` is the doc-driven contract gate for the shared Search-Before-Building preamble plus both reviewer prompt surfaces. It uses repo-versioned scenarios plus fresh runner and judge subagents, stays representative instead of exhaustive, and does not require the Node OpenAI-judge helper path.
- `cargo nextest run --test using_superpowers_skill` is the deterministic Rust gate for the session-entry contract, canonical decision-path surface, and the documented first-turn gate flow.
- `cargo nextest run --test workflow_runtime` is the deterministic Rust gate for workflow-phase routing once session-entry is enabled, including the canonical `execution_preflight` and `plan_writing` phase mappings for representative ready and stale-plan fixtures.
- See `tests/evals/README.md` for the Node-based eval environment variables and for routing-eval logging behavior.
- The same README also documents the doc-driven Search-Before-Building runner/judge gate instructions.

Search-Before-Building changes should normally validate in this order:

1. `node scripts/gen-skill-docs.mjs` and `node scripts/gen-skill-docs.mjs --check`
2. `node scripts/gen-agent-docs.mjs` and `node scripts/gen-agent-docs.mjs --check`
3. deterministic codex-runtime coverage such as `gen-skill-docs.unit.test.mjs`, `skill-doc-contracts.test.mjs`, and `cargo nextest run --test runtime_instruction_contracts`
4. the doc-driven `tests/evals/search-before-building-contract.orchestrator.md` gate when you need the higher-order prompt check

That gate uses fresh runner and judge subagents against the checked-in scenario matrix and does not require `OPENAI_API_KEY`. If isolated subagent execution is unavailable in the current environment, skip the gate intentionally and record that limitation.

## Notes

- `tests/runtime_instruction_contracts.rs` is the canonical static contract gate for supported install and runtime documentation, including repo-root workflow diagrams, platform workflow summaries, reviewer/prompt contracts, workflow fixtures, and generation freshness checks
- `tests/using_superpowers_skill.rs` is the canonical Rust gate for the pre-routing `using-superpowers` session-entry wording, including the decision path, malformed-state fail-closed wording, explicit re-entry semantics, and deterministic execution of the documented first-turn gate flow
- `tests/session_config_slug.rs` covers the helper-level session-entry and config contracts, including decision resolution, explicit re-entry detection, clause/negation handling, deterministic decision paths, invalid command input, canonical config writes, legacy read-only migration behavior, and slug helper parity
- `tests/contracts_spec_plan.rs` covers Requirement Index and Requirement Coverage Matrix parsing, helper fail-closed lint output, task-packet generation, stale-packet regeneration, bounded task-packet cache retention, warm-path slowdown guards, and cache invalidation after spec or plan changes
- `tests/repo_safety.rs` covers the protected-branch repo-write guarantees in the runtime contract, including default protected branches, task-scoped approvals, approval-fingerprint mismatches, and read-only intent behavior
- Legacy `tests/codex-runtime/*.sh` harnesses have been removed; active runtime validation now lives in the Rust integration suites plus `tests/codex-runtime/*.test.mjs`
- `tests/codex-runtime/*.test.mjs` covers the deterministic generated-skill and fixture assertions that do not need Rust command execution
- `tests/plan_execution.rs` covers the execution helper state machine, same-revision stale source-spec path rejection, canonical task-structure enforcement, evidence canonicalization, rollback behavior, malformed evidence rejection, warm-path slowdown guards, and status-cache invalidation after plan changes
- `tests/workflow_runtime.rs` plus `tests/workflow_shell_smoke.rs` cover the supported public workflow inspection CLI, the shipped public workflow bash wrapper, read-only state rendering, missing-expected-path handling, manifest diagnostics, public operator surfaces, wrapper-forwarding parity, summary-mode parity, repo-identity recovery, and conservative write-conflict handling
- `tests/update_and_install.rs` covers semver comparison, snooze handling, just-upgraded markers, explicit install migration, checked-in runtime provisioning, and manifest failure modes
- `tests/upgrade_skill.rs` covers install-root resolution and direct upgrade-flow version resolution
- `tests/session_config_slug.rs` also covers the shared slug helper, including missing-remote fallback, detached HEAD handling, weird-path hashing fallback, and shell-safe escaped output
- `tests/differential/run_legacy_vs_rust.sh` covers normalized legacy-vs-canonical workflow status parity and checked-in fixture freshness for the command-surface cutover; it is intentionally narrower than the full operator-surface coverage in `tests/workflow_runtime.rs`
- `test-launch-wrappers.sh` covers the brainstorm launcher wrappers for Bash and PowerShell, including documented `C:\...` project paths
- `tests/brainstorm-server/server.test.js` and `tests/brainstorm-server/ws-protocol.test.js` cover the brainstorming server's HTTP behavior and websocket protocol semantics
