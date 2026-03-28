# FeatureForge Test Suite Enhancement Plan

This document tracks the next round of test improvements for FeatureForge after the rename and 1.0.0 reset.

## Current Baseline

The active contract surface already includes:

- Node contract tests under `tests/codex-runtime/`
- Rust runtime and workflow suites under `tests/`
- doc-driven eval gates under `tests/evals/`
- a checked-in workflow-status snapshot fixture under `tests/fixtures/differential/` exercised by `tests/workflow_runtime.rs`
- runtime strategy-checkpoint and deviation-truthing coverage in `tests/plan_execution_topology.rs`, `tests/plan_execution_final_review.rs`, and `tests/workflow_runtime_final_review.rs`

The active deterministic suite and recommended commands now live in `docs/testing.md`.

Use `cargo nextest run --test runtime_instruction_contracts` as part of the deterministic Rust contract subset when workflow docs or command surfaces change.

## Near-Term Additions

1. Add a single cutover gate that rejects new forbidden legacy names in active file contents and active path names while explicitly ignoring archived history.
2. Add stronger install smoke coverage for checked-in prebuilt artifacts on macOS arm64 and `windows-x64`.
3. Add a release-ready validation command that runs the full Node and Rust deterministic matrix in one place.

## Keep Stable

- Keep workflow fixtures in `tests/codex-runtime/fixtures/workflow-artifacts/` rather than coupling route-time tests to mutable repo docs.
- Keep doc-driven routing and Search Before Building gates checked in as versioned markdown artifacts.
- Keep generated-skill freshness enforced through `node scripts/gen-skill-docs.mjs --check`.

## Deferred

- Live hosted installer smoke outside local development environments
- Broader release-artifact verification across additional target triples
- More extensive browser-eval automation beyond the current change-specific gates
