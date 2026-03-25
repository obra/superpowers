# Testing FeatureForge

This document describes the active validation surface for the FeatureForge runtime and skill library.

Legacy `tests/codex-runtime/*.sh` harnesses have been removed; use the Rust and Node contract suites below as the active oracle.

## Fast Validation

Run these commands from the repo root for the core contract surface:

```bash
node scripts/gen-skill-docs.mjs --check
node --test tests/codex-runtime/*.test.mjs
cargo nextest run --test runtime_instruction_contracts --test using_featureforge_skill --test contracts_spec_plan --test session_config_slug --test repo_safety --test update_and_install --test workflow_runtime --test workflow_shell_smoke --test plan_execution --test powershell_wrapper_resolution --test upgrade_skill
cargo nextest run --test contracts_spec_plan --test runtime_instruction_contracts --test using_featureforge_skill --test session_config_slug --test repo_safety --test update_and_install --test workflow_runtime --test workflow_shell_smoke --test plan_execution --test powershell_wrapper_resolution --test upgrade_skill
bash tests/differential/run_legacy_vs_rust.sh
```

## What Each Layer Covers

### Node Contract Tests

`tests/codex-runtime/*.test.mjs` covers:

- generated skill-doc structure and freshness
- active docs and archive layout fixtures
- workflow-fixture invariants
- routing and eval-document contract assertions

### Rust Runtime Tests

The main Rust suites cover:

- workflow artifact resolution and failure contracts
- session-entry and `using-featureforge` routing behavior
- repo-safety and protected-branch write guarantees
- install, state, and update-check runtime behavior
- public workflow CLI behavior
- execution state transitions and plan linkage

### Differential Harness

`tests/differential/run_legacy_vs_rust.sh` compares the checked-in legacy snapshot against current canonical workflow-status behavior. Treat any mismatch as a triage event.

### Eval Docs

`tests/evals/README.md` describes the active higher-level eval surfaces:

- the doc-driven `using-featureforge` routing gate
- the doc-driven Search Before Building gate
- opt-in Node-based `.eval.mjs` tests where a local judge run is still useful

## Change-Scoped Guidance

Editing skill templates or generated skill docs:

```bash
node scripts/gen-skill-docs.mjs --check
node --test tests/codex-runtime/*.test.mjs
```

Editing workflow routing, runtime docs, or execution contracts:

```bash
cargo nextest run --test contracts_spec_plan --test runtime_instruction_contracts --test using_featureforge_skill --test workflow_runtime --test workflow_shell_smoke --test plan_execution
```

Editing install or update surfaces:

```bash
cargo nextest run --test session_config_slug --test update_and_install --test upgrade_skill
```

Editing packaging or prebuilt artifact refresh flows:

```bash
cargo nextest run --test powershell_wrapper_resolution --test workflow_shell_smoke
bash tests/differential/run_legacy_vs_rust.sh
```

## Repo Fixtures

Keep workflow fixtures under `tests/codex-runtime/fixtures/workflow-artifacts/`. They are the stable contract inputs for route-time header parsing and approved-plan linkage tests.
