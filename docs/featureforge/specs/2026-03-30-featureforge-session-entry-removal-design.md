# FeatureForge Session Entry Removal

**Workflow State:** CEO Approved
**Spec Revision:** 1
**Last Reviewed By:** plan-ceo-review

## Problem Statement

FeatureForge currently enforces a session-entry gate and user approval path before normal workflow routing. In practice this path is brittle, spreads across runtime plus generated skill prose, and still requires substantial contract coverage to keep behavior coherent. The result is high complexity for low value and frequent routing friction.

The requested change is to remove session-entry gating completely from FeatureForge.

## Desired Outcome

After this change:

- FeatureForge does not ask for session-entry approval before workflow use.
- `using-featureforge` has no bypass gate and no session-entry precondition.
- Workflow routing is derived directly from artifact/runtime state without session-entry blocking.
- Session-entry-specific command, schema, docs, and tests are removed from active surfaces.

## Decision

Selected approach: **A) Hard removal**.

FeatureForge will remove session entry as an active product surface, not just stop enforcing it.

## Approaches Considered

### A) Hard removal (selected)

- Remove `featureforge session-entry` and all gate semantics (`needs_user_choice`, `bypassed`, strict gate env, session-entry reason codes and next actions).
- Remove session-entry schema and session-entry-specific generated-skill gate text.
- Rewrite active tests/docs/evals to reflect direct routing with no approval gate.

Pros:

- Maximum simplification and least policy drift.
- Removes entire category of fail-closed gate regressions.
- Aligns behavior with user expectation: no session entry approval path.

Cons:

- Breaking change for any external caller using `featureforge session-entry`.
- Broad test/doc updates required in one slice.

### B) Soft removal shim

- Keep command as compatibility surface returning always-enabled semantics.
- Remove enforcement only.

Pros:

- Lower immediate compatibility impact.

Cons:

- Keeps dead conceptual surface and drift risk.
- Still requires docs/tests/schema support for a non-feature.

### C) Observability-only retention

- Keep session-entry state for diagnostics but never gate.

Pros:

- Retains telemetry context.

Cons:

- Preserves maintenance burden and conceptual noise.
- Not aligned with explicit “remove completely” direction.

## Scope

In scope:

- Runtime and CLI removal of session-entry subsystem.
- Workflow status/operator contract removal of session-entry gate semantics.
- Generated skill template/runtime instruction removal of session-entry gate text and env wiring.
- Session-entry schema and schema-contract updates.
- Active docs, evals, and tests aligned to no-gate behavior.

Out of scope:

- Historical archive rewrite (`docs/archive/**`).
- Any new replacement consent system.
- Non-session-entry workflow semantics unrelated to this gate.

## Requirement Index

- [REQ-001][behavior] FeatureForge must remove the public `featureforge session-entry` command family from active CLI surfaces.
- [REQ-002][behavior] Workflow resolution must never fail closed on session-entry state and must not require `FEATUREFORGE_WORKFLOW_REQUIRE_SESSION_ENTRY`.
- [REQ-003][behavior] Workflow/operator phase modeling must remove session-entry gate states and gate-only actions (`needs_user_choice`, `bypassed`, `session_entry_gate`, `continue_outside_featureforge`) from active routing logic.
- [REQ-004][behavior] Generated `using-featureforge` docs and generation logic must remove bypass-gate semantics, session-entry command guidance, and session-entry env exports.
- [REQ-005][behavior] Session-entry schema generation and checked-in `schemas/session-entry-resolve.schema.json` must be removed from active contract surfaces.
- [REQ-006][behavior] Active docs must no longer describe session-entry as a required entry point or strict gate.
- [REQ-007][behavior] Session-entry-only tests/evals must be removed or rewritten to validate direct non-gated routing behavior.
- [REQ-008][verification] Contract suites must fail closed if session-entry gate language or strict-session-entry runtime checks are reintroduced on active surfaces.
- [REQ-009][behavior] Breaking workflow-output changes in this slice must use explicit schema/version signaling per command output family and release-note callouts so automation breakage is visible, not silent.
- [REQ-010][verification] Active contract tests must fail closed if session-entry gate semantics are reintroduced in runtime, templates, generated docs, or runtime instruction docs, including `FEATUREFORGE_WORKFLOW_REQUIRE_SESSION_ENTRY`, `FEATUREFORGE_SPAWNED_SUBAGENT`, and `FEATUREFORGE_SPAWNED_SUBAGENT_OPT_IN`.
- [REQ-011][verification] Active runtime surfaces (outside `docs/archive/**`) must fail contract checks if legacy session-entry gate module wiring, strict gate checks, or `~/.featureforge/session-entry/...` gate-path references are reintroduced.

## Active Surface Inventory (Current)

### Runtime/CLI surfaces

- `src/cli/mod.rs`
- `src/cli/session_entry.rs`
- `src/lib.rs`
- `src/session_entry/mod.rs`
- `src/compat/argv0.rs`
- `src/workflow/status.rs`
- `src/workflow/operator.rs`

### Generated skill/runtime instruction surfaces

- `skills/using-featureforge/SKILL.md.tmpl`
- `skills/using-featureforge/SKILL.md`
- `scripts/gen-skill-docs.mjs`

### Schema surfaces

- `schemas/session-entry-resolve.schema.json`
- `tests/packet_and_schema.rs` (schema parity assertions)

### Documentation surfaces

- `README.md`
- `docs/README.codex.md`
- `docs/README.copilot.md`
- `docs/testing.md`
- `tests/evals/README.md`
- `tests/evals/using-featureforge-routing.scenarios.md` (currently references pre-seeded enabled decision state)

### Test surfaces (active)

- `tests/session_config_slug.rs`
- `tests/workflow_entry_shell_smoke.rs`
- `tests/workflow_runtime.rs`
- `tests/workflow_shell_smoke.rs`
- `tests/workflow_runtime_final_review.rs`
- `tests/using_featureforge_skill.rs`
- `tests/runtime_instruction_contracts.rs`
- `tests/cli_parse_boundary.rs`
- `tests/codex-runtime/gen-skill-docs.unit.test.mjs`
- `tests/codex-runtime/skill-doc-contracts.test.mjs`

## Proposed Design

### 1) Remove session-entry command and runtime module

- Delete `SessionEntry` command wiring from `src/cli/mod.rs` and `src/lib.rs`.
- Remove `src/cli/session_entry.rs` and `src/session_entry/mod.rs`.
- Remove `featureforge-session-entry` argv0 compatibility alias from `src/compat/argv0.rs`.
- Remove `session_entry` module export from crate root.

### 2) Remove session-entry gating from workflow status/operator

- In `src/workflow/status.rs`:
  - Remove strict gate env constant and check path.
  - Remove `read_session_entry`, `strict_session_entry_route`, `workflow_session_key`, and helper logic tied only to gate routing.
  - Remove gate-specific reason codes and diagnostics (`session_entry_unresolved`, `session_entry_bypassed`).
  - Remove `SessionEntryState` from public workflow phase contract.
- In `src/workflow/operator.rs`:
  - Remove runtime reads of session-entry state.
  - Remove phase/action derivation branches tied to `needs_user_choice`/`bypassed`.
  - Remove next-step/reason text bound to session-entry gate.
  - Remove session-entry payload from doctor/handoff/phase JSON and text outputs.

### 3) Remove bypass-gate logic from `using-featureforge` generation

- In `scripts/gen-skill-docs.mjs`:
  - Remove `buildUsingFeatureForgeShellLines` session-entry env exports and decision-path setup.
  - Remove `buildUsingFeatureForgeBypassGateSection`.
  - Regenerate `skills/using-featureforge/SKILL.md` from updated template.
- In `skills/using-featureforge/SKILL.md.tmpl`:
  - Remove `{{USING_FEATUREFORGE_BYPASS_GATE}}`.
  - Keep normal routing stack focused on workflow/artifact-state routing only.

### 4) Remove session-entry schema and related schema checks

- Delete `schemas/session-entry-resolve.schema.json`.
- Remove session-entry schema writer path from tests/contract checks (`tests/packet_and_schema.rs`).

### 5) Update active docs/evals to no-gate model

- Remove session-entry command-family references from runtime summaries.
- Remove strict gate env explanations.
- Update routing-eval docs so they no longer depend on pre-seeding `enabled` decision state.

### 6) Rewrite or delete gate-specific tests

- Remove dedicated session-entry runtime tests currently validating:
  - missing decision -> `needs_user_choice`
  - bypassed states
  - explicit re-entry
  - spawned-subagent bypass semantics
  - strict gate env fail-close behavior
- Replace with direct-route assertions proving workflow functions without any session-entry precondition.

## Contract Changes

### Breaking CLI/API changes

- `featureforge session-entry ...` is removed.
- Any external callers depending on session-entry JSON payloads must stop calling that surface.
- No compatibility alias, deprecation shim, or migration wrapper is included in this slice.
- Removed command invocation follows default CLI unknown-command behavior.

### Workflow JSON changes

- `workflow phase`, `workflow doctor`, and `workflow handoff` remove session-entry fields from output.
- Phase/action values tied only to session-entry gating are removed from active output set.

### Versioning and Compatibility Policy

- Any command output that changes field presence or allowed enum values must update its explicit schema/output version in the same slice.
- This pre-adoption product phase does **not** require a major release version gate for these removals.
- For this change, that includes workflow output families touched by:
  - `workflow status --refresh` JSON
  - `workflow phase --json`
  - `workflow doctor --json`
  - `workflow handoff --json`
- Release notes must include a dedicated “breaking output contract changes” section listing:
  - removed fields
  - removed enum values
  - removed reason codes/actions
  - the new schema/version identifiers
- Tests must fail if output removals occur without corresponding schema/version updates.

### Exact Output Delta (By Command)

This section is normative. Implementation and tests should assert these exact removals.

#### `featureforge workflow phase --json`

- Remove top-level field: `session_entry`.
- Remove allowed `phase` values that exist only for session-entry gating:
  - `needs_user_choice`
  - `bypassed`
- Remove allowed `next_action` values that exist only for session-entry gating:
  - `session_entry_gate`
  - `continue_outside_featureforge`

#### `featureforge workflow doctor --json`

- Remove top-level field: `session_entry`.
- Remove allowed `phase` values that exist only for session-entry gating:
  - `needs_user_choice`
  - `bypassed`
- Remove allowed `next_action` values that exist only for session-entry gating:
  - `session_entry_gate`
  - `continue_outside_featureforge`

#### `featureforge workflow handoff --json`

- Remove top-level field: `session_entry`.
- Remove allowed `phase` values that exist only for session-entry gating:
  - `needs_user_choice`
  - `bypassed`
- Remove allowed `next_action` values that exist only for session-entry gating:
  - `session_entry_gate`
  - `continue_outside_featureforge`

#### `featureforge workflow status --refresh` (JSON mode)

- Remove strict-gate derived `status` outcomes:
  - `needs_user_choice`
  - `bypassed`
- Remove strict-gate derived `reason_codes`:
  - `session_entry_unresolved`
  - `session_entry_bypassed`
- Remove diagnostics that instruct:
  - `featureforge session-entry resolve --message-file <path>`

#### `featureforge workflow next` / `artifacts` / `explain` / text `phase` / text `doctor` / text `handoff`

- Remove all text that references:
  - resolving a session-entry gate
  - FeatureForge being bypassed for the session
  - continuing outside FeatureForge due to session-entry outcome

### Env contract changes

- `FEATUREFORGE_WORKFLOW_REQUIRE_SESSION_ENTRY` is no longer consumed by runtime gating.
- `FEATUREFORGE_SPAWNED_SUBAGENT` and `FEATUREFORGE_SPAWNED_SUBAGENT_OPT_IN` no longer affect routing through session-entry behavior.

## Data and State Impact

- Existing files under `~/.featureforge/session-entry/using-featureforge/*` become unused runtime leftovers.
- No migration is required; runtime ignores legacy session-entry state.
- Optional cleanup command can be considered later, but is out of scope for this slice.

## Rollout and Compatibility

- Rollout model: single hard cutover.
- No compatibility shim for removed command surface in this spec.
- Because this is pre-adoption product surface, we accept immediate removal without transitional command aliases.
- Because FeatureForge is not live yet, this spec does not require major-version-only shipment for the breaking contract deltas.
- Docs and tests must land atomically with runtime removal so active contracts stay coherent.

## Risks and Mitigations

- Risk: External scripts fail on removed command.
  - Mitigation: Call out explicit breaking change in release notes and docs.
- Risk: Hidden gate dependencies remain in workflow/operator tests.
  - Mitigation: Remove gate-only reason codes and assert no session-entry precondition in route tests.
- Risk: Generated doc drift reintroduces gate text.
  - Mitigation: strengthen generation/doc-contract tests to reject session-entry gate language on active surfaces.

## Verification Plan

Minimum validation after implementation:

```bash
node scripts/gen-skill-docs.mjs
node scripts/gen-skill-docs.mjs --check
node --test tests/codex-runtime/skill-doc-contracts.test.mjs tests/codex-runtime/gen-skill-docs.unit.test.mjs
cargo clippy --all-targets --all-features -- -D warnings
cargo nextest run --test runtime_instruction_contracts --test using_featureforge_skill --test workflow_runtime --test workflow_shell_smoke --test workflow_entry_shell_smoke --test cli_parse_boundary --test packet_and_schema
```

Change-scoped red/green expectations:

- Session-entry-specific tests are removed or rewritten to no-gate behavior.
- Workflow tests prove routing works without any session-entry state file.
- Runtime-instruction contracts fail if active docs mention strict session-entry gating.
- Runtime, template, and instruction contracts fail if removed gate env keys or gate prose reappear.
- Static/runtime contract tests fail if active code reintroduces session-entry gate path/module references outside archival docs.

Implementation checklist additions:

- `tests/cli_parse_boundary.rs` asserts `session-entry` is no longer a valid command surface.
- `tests/workflow_runtime.rs` removes assertions for:
  - `phase.session_entry`
  - `doctor.session_entry`
  - `handoff.session_entry`
  - strict-gate `status=needs_user_choice|bypassed`
  - strict-gate reason codes
- `tests/workflow_shell_smoke.rs` and `tests/workflow_entry_shell_smoke.rs` stop seeding `~/.featureforge/session-entry/using-featureforge/<session-key>`.
- `tests/runtime_instruction_contracts.rs` and Node doc-contract tests reject active docs that mention:
  - `featureforge session-entry`
  - `FEATUREFORGE_WORKFLOW_REQUIRE_SESSION_ENTRY`
  - bypass prompt-first routing contract language
- `tests/packet_and_schema.rs` no longer expects `schemas/session-entry-resolve.schema.json`.
- output-contract tests verify schema/version increments for each changed workflow output family.

## Acceptance Criteria

- No active runtime command, module, schema, skill template section, or workflow route branch requires session-entry approval or state.
- Active docs no longer claim session-entry is an entry gate.
- Active tests pass under the no-session-entry model.
- FeatureForge routes directly by workflow/artifact/runtime state with no session-entry prerequisite.
- Changed workflow output families include explicit version signaling and release-note documentation for breaking output deltas.

## CEO Review Summary

**Review Status:** clear
**Reviewed At:** 2026-03-30T13:44:39Z
**Review Mode:** hold_scope
**Reviewed Spec Revision:** 1
**Critical Gaps:** 0
**UI Design Intent Required:** no
**Outside Voice:** skipped
