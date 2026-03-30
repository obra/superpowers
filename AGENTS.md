# FeatureForge Agent Guide

This file is project-local guidance for agents working in `featureforge`. It applies to this repository only.

## Purpose

- `featureforge` is the FeatureForge runtime and workflow toolkit.
- The repo mixes Rust runtime code, workflow contracts, generated skill docs, and verification tests.
- Treat workflow truth, review artifacts, and execution-state artifacts as authoritative surfaces. Do not make casual compatibility changes around them.

## Project Layout

- `src/`: Rust implementation for contracts, execution, workflow routing, repo safety, update checks, and CLI support.
- `tests/`: Rust integration tests. Many helpers here model authoritative runtime artifacts; preserve behavior when refactoring test support.
- `skills/*.md.tmpl`: source templates for generated skill docs.
- `skills/*/SKILL.md`: generated skill docs. Regenerate them instead of hand-editing when a corresponding `.tmpl` exists.
- `review/`: review guidance and review-support references.
- `docs/featureforge/`: specs, plans, and execution evidence.

## Working Rules

- Prefer minimal behavior-preserving fixes over broad rewrites unless a rewrite is required to satisfy the workflow contract.
- Do not silently weaken runtime trust boundaries, workflow gates, or artifact validation.
- Do not update historical plans or specs unless the user explicitly asks for that exact artifact change.
- When a change touches generated skill docs, edit the `.tmpl` source and regenerate the checked-in `SKILL.md` output.

## Project Memory

- `docs/project_notes/` is supportive memory only; approved specs, plans, execution evidence, review artifacts, runtime state, and active repo instructions remain authoritative.
- Before inventing a new cross-cutting approach, check `docs/project_notes/decisions.md` for prior decisions and follow the authoritative source it links.
- When debugging recurring failures, check `docs/project_notes/bugs.md` for previously recorded root causes, fixes, and prevention notes.
- Never store credentials, secrets, or secret-shaped values in `docs/project_notes/`.
- Use `featureforge:project-memory` when setting up or making structured updates to repo-visible project memory.

## Subagent Coordination

- Do not rush, ping, or interrupt productive subagents just to force a faster-looking loop. Premature interruption creates churn, duplicated work, broken local context, and lower-quality results.
- Treat interruption as exceptional. Redirect or stop a subagent only when it is clearly blocked, working the wrong scope, producing repeated low-value output, or the user explicitly changes direction.
- Independent reviewers and other independence-sensitive subagents must start from fresh context by default. Do not fork them from the current session when the point of the task is independent judgment.
- Reserve `fork_context=true` for continuation work that explicitly depends on current-session state. If the subagent is meant to be independent, pass only the minimal task statement and concrete repo paths or artifacts it should inspect.
- Do not describe a subagent as independent if it inherited the parent session's full context, conclusions, or preferred answer shape. Independence means the agent can reach its own judgment from repo truth.
- After any compaction, context reset, or session recovery, inventory existing subagents before spawning fresh ones.
- That inventory should answer three questions first: which agents are still running, which agents already completed but have unread results, and which agents are blocked but still hold useful context.
- Reuse relevant in-flight or recently completed subagents whenever possible. Do not spawn replacement workers or reviewers until you have confirmed the existing agents cannot supply the needed result.
- In multi-agent work, treat existing subagent progress as part of the authoritative session state. Preserving continuity is usually safer and cheaper than restarting the same slice from scratch.

## Rust and Lint Policy

- The Rust codebase is expected to pass `cargo clippy --all-targets --all-features -- -D warnings`.
- The strict Clippy policy is intentional for this repository. Do not weaken `[lints.clippy]`, add allow-list entries in `Cargo.toml`, or introduce `#[allow(clippy::...)]` suppressions without explicit user approval.
- Prefer fixing offending code by refactoring helper inputs, collapsing control flow, boxing oversized enum variants, or simplifying expressions rather than suppressing the lint.
- Keep builds warning-clean under `cargo test` as well; unused variables, dead code, and stale helper paths should be cleaned up, not ignored.

## Verification Expectations

- For Rust code changes, default verification is:
  - `cargo clippy --all-targets --all-features -- -D warnings`
  - targeted `cargo test` commands for changed areas
- For skill template changes, also run:
  - `node scripts/gen-skill-docs.mjs`
  - `node --test tests/codex-runtime/skill-doc-contracts.test.mjs`
- For workflow-boundary or plan-execution changes, favor targeted tests first, then broader suites once local regressions are closed.

## FeatureForge-Specific Notes

- If a change touches plan execution, review gating, or authoritative artifact handling, inspect both runtime code and the matching tests.
- When editing surfaces used by the workflow runtime, preserve repo-relative path normalization and artifact fingerprint invariants.
- If a change affects execution guidance, keep `writing-plans`, `executing-plans`, and related review/dispatch docs consistent with the runtime behavior.
- Runtime-owned strategy checkpoint and deviation-truthing hardening is an execution contract surface. Do not remove or downgrade it as "out-of-plan cleanup" without explicit user direction.

## Review Bar

- Before calling work complete, verify both implementation correctness and workflow correctness.
- Fresh independent review is preferred for material workflow or trust-boundary changes.
- If a reviewer finds real issues, fix them in code or tests; do not paper over them with policy exceptions.
