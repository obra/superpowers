# Harness Contribution Strategy Design

Date: 2026-02-22  
Repo: `obra/superpowers` + standalone harness plugin

## Context

Goal: make harness-engineering long-living and amplify OSS impact.

Observed signals from repository analysis:
- `obra/superpowers` is active and high-visibility.
- External PRs are accepted (`README.md` contributing section).
- Review selectivity is meaningful (sample of recent closed PRs shows low outsider merge ratio).
- Direct demand exists for harness/e2e verification in issues (`#455`, `#126`).

## Approaches Considered

1. Upstream-only PR strategy
- Pros: trust, discoverability, official community signal.
- Cons: maintainer-priority dependency, slower iteration.

2. Plugin-only strategy
- Pros: full control, fast iteration, product autonomy.
- Cons: weaker initial distribution and legitimacy.

3. Balanced dual-track strategy (recommended)
- Pros: combines upstream trust with independent velocity and durability.
- Cons: requires strict scope boundaries to avoid duplicated effort.

## Recommended Architecture

Use one shared conceptual core with two adapters:

1. Core Harness Spec
- Shared contract for invariants, deterministic smoke behavior, output schema, and failure taxonomy.
- Tool-agnostic language for portability.

2. Upstream Adapter (`superpowers`)
- Narrow, mergeable slice only.
- Target issue `#455` first (end-to-end validation gap).
- Keep implementation low-risk and composable.

3. Plugin Adapter (standalone)
- Full harness feature surface, richer config, strict/relaxed modes, stronger diagnostics.
- Include `superpowers-compatible` profile for migration compatibility.

## Scope Split Rules

Upstream gets:
- Minimal deterministic end-to-end validation workflow.
- Single canonical check command.
- Tight docs and smoke evidence.

Plugin gets:
- Broader framework capabilities.
- Advanced policy controls and integrations.
- Faster iteration on new enforcement patterns.

## Data Flow

1. User/agent runs canonical harness command.
2. Harness performs deterministic setup (fixtures/env).
3. Checks execute and emit JSON artifact.
4. Schema validation runs on artifact.
5. Pass/fail with concise error codes is returned.

## Error Taxonomy

- `CONFIG_ERROR`: invalid config or non-machine-checkable contract.
- `ENV_ERROR`: missing runtime/tool dependency.
- `CHECK_FAIL`: contract assertion failure.
- `NON_DETERMINISM`: unstable output drift.
- `INTERNAL_ERROR`: harness runtime crash.

## Verification Model

Upstream PR verification:
- Deterministic smoke command.
- Documentation consistency.
- No regression in existing tests.

Plugin verification:
- Fixture contract tests.
- Schema conformance tests.
- Golden artifact checks.
- CI matrix in at least two environments.

## Rollout Plan

1. Phase 1: upstream issue-first alignment + minimal PR (anchor `#455`).
2. Phase 2: plugin alpha release with compatibility profile.
3. Phase 3: feed proven plugin pieces back upstream as small PRs.

## Success Criteria (90 days)

- Upstream: at least one merged PR tied to harness validation gap.
- Plugin: 2-3 active repos/users running it in CI.
- Cross-linking: upstream points to plugin advanced mode; plugin points to upstream baseline path.

## Risks and Mitigations

- Risk: broad upstream proposal stalls review.
  - Mitigation: issue-first alignment + minimal PR surface.

- Risk: duplicated effort between upstream and plugin.
  - Mitigation: explicit scope split and shared core contract language.

- Risk: plugin adoption lag.
  - Mitigation: publish compatibility profile and concrete CI examples early.
