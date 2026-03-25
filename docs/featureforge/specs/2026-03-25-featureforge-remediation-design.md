# FeatureForge Remediation Program

**Workflow State:** CEO Approved
**Spec Revision:** 1
**Last Reviewed By:** plan-ceo-review

## Problem Statement

FeatureForge already has strong workflow concepts, but several runtime contracts still drift across Rust code, generated skill preambles, checked-in markdown skills, upgrade docs, and contributor documentation. The highest-risk defects are not isolated bugs. They are contract splits:

- install and runtime-root detection are implemented in more than one place
- session-entry and spawned-subagent behavior are partly runtime-owned and partly prose-owned
- canonical path policy and active generated/public surfaces do not fully agree
- contributor validation instructions, generated-doc freshness checks, and example layout are not yet telling one coherent story
- hotspot modules still bundle too many responsibilities, which makes later behavior work harder to review safely

This program turns the remediation findings `FF-01` through `FF-11` into one sequenced delivery plan that keeps the entire scope in view while preventing later cleanup work from obscuring earlier contract fixes.

## Desired Outcome

At the end of this remediation program, FeatureForge should have one runtime-owned story for install discovery, session-entry policy, and canonical artifact routing. Generated skills, upgrade flows, checked-in docs, and tests should consume that story instead of restating or partially re-implementing it. Later refactors should happen only after the behavior they depend on is pinned by regression coverage.

## Scope

In scope:

- all remediation findings `FF-01` through `FF-11`
- one umbrella spec and one full implementation plan that covers the entire remediation set
- phased delivery that preserves all scope while sequencing behavior stabilization before cleanup and refactors

Out of scope:

- reintroducing removed install command surfaces
- preserving legacy-root compatibility as a product feature
- broad structural refactors before behavior regressions are pinned
- mixing new product-policy decisions into later implementation phases

## Requirement Index

- [REQ-001][behavior] Runtime root resolution must become a single runtime-owned contract used by `update-check`, generated skill preambles, and upgrade flows.
- [REQ-002][behavior] Spawned-subagent session-entry behavior must become runtime-owned, deterministic, and testable.
- [REQ-003][behavior] Legacy roots `~/.codex/featureforge` and `~/.copilot/featureforge` must be removed from active discovery and active generated/public surfaces.
- [REQ-004][behavior] Contributor-facing docs, validation commands, generated-doc freshness checks, and starter/example guidance must converge on one canonical FeatureForge story.
- [REQ-005][behavior] Shared helper logic and hotspot modules must be refactored only after earlier contract behavior is pinned by tests.
- [REQ-006][behavior] CLI inputs that encode bounded choices must move to typed parse-boundary validation, and bare `featureforge` invocation must show help instead of silently succeeding.
- [REQ-007][behavior] Non-Rust consumers must obtain runtime-root decisions through one schemaed CLI helper contract rather than embedding search-order logic.
- [DEC-001][decision] The remediation program remains one umbrella spec and one implementation plan, but delivery is phase-gated rather than executed as one mixed-risk blob.
- [DEC-002][decision] Legacy roots are unsupported and are removed outright from active behavior and active generated/public surfaces; no migration-only runtime path remains in scope.
- [DEC-003][decision] Later phases may not silently repair behavior that belongs to an earlier phase.
- [VERIFY-001][verification] Each behavior-changing phase must add or update regression coverage before the behavior change lands.
- [VERIFY-002][verification] Each phase must define targeted acceptance criteria, explicit exclusions, and release-facing verification commands.
- [NONGOAL-001][non-goal] Do not reintroduce removed install command surfaces or compatibility shims just to soften cutover debt.
- [NONGOAL-002][non-goal] Do not perform broad refactors in Phases 1 through 3 beyond the minimum extraction needed to establish runtime-owned contracts.

## Repo Reality Check

The current repository seams that drive this design are concrete:

- [`src/update_check/mod.rs`](/Users/dmulcahey/development/skills/superpowers/src/update_check/mod.rs) still accepts a repo-local `VERSION` file as a default install signal.
- [`scripts/gen-skill-docs.mjs`](/Users/dmulcahey/development/skills/superpowers/scripts/gen-skill-docs.mjs) still emits root-detection logic and upgrade notes that reference legacy roots.
- [`featureforge-upgrade/SKILL.md`](/Users/dmulcahey/development/skills/superpowers/featureforge-upgrade/SKILL.md) still owns separate install-root search logic, including legacy roots.
- [`src/session_entry/mod.rs`](/Users/dmulcahey/development/skills/superpowers/src/session_entry/mod.rs) owns session-entry state resolution, but spawned-subagent bypass is still described primarily in [`skills/using-featureforge/SKILL.md`](/Users/dmulcahey/development/skills/superpowers/skills/using-featureforge/SKILL.md).
- [`docs/testing.md`](/Users/dmulcahey/development/skills/superpowers/docs/testing.md) still duplicates one `cargo nextest` command and omits one generated-doc freshness check already implied elsewhere.
- [`TODOS.md`](/Users/dmulcahey/development/skills/superpowers/TODOS.md) already points at the unfinished cutover, session-entry, and install-smoke work, which means the remediation program should reshape and extend that known backlog instead of pretending to start from zero.

## Delivery Model

The remediation program keeps the workstreams for traceability, but execution is phase-based:

```text
FF-01..FF-11 findings
        |
        v
Phase 1  -> WS1  runtime root-resolution contract
Phase 2  -> WS3  runtime-owned subagent/session-entry policy
Phase 3  -> WS2  hard canonical cutover and legacy-surface removal
Phase 4  -> WS4  docs, validation, and example convergence
Phase 5  -> WS5 + WS6  helper extraction, module decomposition, typed CLI cleanup
```

The ordering is intentional:

- Phase 1 stabilizes the highest-severity contract bug before anything else changes around it.
- Phase 2 stabilizes the other live runtime/prose contract split before cutover cleanup removes more surface area.
- Phase 3 removes unsupported legacy behavior only after the runtime contracts it used to mask are stable.
- Phase 4 aligns docs and validation after the product story is real.
- Phase 5 performs the lower-risk cleanup and maintainability work only after behavior is pinned.

## System Architecture

The remediation program keeps behavior authority in runtime code and pushes markdown and generator surfaces into a consumer role:

```text
                            +----------------------------------+
                            | Rust runtime                     |
                            |----------------------------------|
                            | runtime-root resolver            |
                            | session-entry resolver           |
                            | workflow / repo-safety contracts |
                            +----------------+-----------------+
                                             |
                    +------------------------+------------------------+
                    |                                                 |
                    v                                                 v
     featureforge repo runtime-root --json               featureforge session-entry ...
                    |                                                 |
                    v                                                 v
        +-----------+------------------+                  +-----------+------------+
        | shell-facing consumers       |                  | nested-agent launchers |
        |------------------------------|                  | and review flows       |
        | scripts/gen-skill-docs.mjs   |                  +------------------------+
        | featureforge-upgrade/SKILL   |
        | checked-in generated skills  |
        +------------------------------+
```

The architectural rule is simple: runtime code owns decision-making; shell and markdown surfaces may call the contract, narrate it, or test it, but they may not restate the algorithm.

## Phase Overview

### Phase 1: Runtime Root-Resolution Contract

**Primary workstream:** `WS1`

**Goal**

Make runtime root discovery deterministic and runtime-owned for `update-check`, generated skill preambles, and upgrade flows.

**Key changes**

- Introduce one shared runtime-root resolver module with separate discovery and validation concerns.
- Stop treating arbitrary repo-local `VERSION` files as enough to identify the active install.
- Expose one schemaed CLI helper surface, for example `featureforge repo runtime-root --json`, so generators and upgrade docs stop re-implementing the algorithm.
- Update generated-skill preambles and upgrade flow references to consume the runtime contract instead of embedding legacy-root search logic.

**Shell-facing contract**

Phase 1 must define one machine-readable contract for non-Rust consumers. The exact subcommand name may change during implementation, but the spec requires these properties:

- runtime-owned resolution and validation logic
- JSON output with enough structure to distinguish `resolved` state, source, and validation facts
- coverage that fails when shell-facing consumers reintroduce embedded search-order logic

Representative output shape:

```json
{
  "resolved": true,
  "root": "/absolute/path/to/runtime",
  "source": "featureforge_dir_env | repo_local | binary_adjacent | canonical_install",
  "validation": {
    "has_version": true,
    "has_binary": true,
    "upgrade_eligible": false
  }
}
```

**Expected file touch points**

- [`src/update_check/mod.rs`](/Users/dmulcahey/development/skills/superpowers/src/update_check/mod.rs)
- [`src/cli/mod.rs`](/Users/dmulcahey/development/skills/superpowers/src/cli/mod.rs)
- new runtime-root resolver module under `src/`
- [`scripts/gen-skill-docs.mjs`](/Users/dmulcahey/development/skills/superpowers/scripts/gen-skill-docs.mjs)
- [`featureforge-upgrade/SKILL.md`](/Users/dmulcahey/development/skills/superpowers/featureforge-upgrade/SKILL.md)

**Regression tests to add first**

- false-positive install regression for a repo with `VERSION` but no `bin/featureforge`
- positive repo-local runtime case
- binary-adjacent runtime case
- valid explicit `FEATUREFORGE_DIR` override case
- upgrade-specific validation case when runtime-valid roots are not upgrade-eligible

**Acceptance criteria**

- no runtime path infers the install root from `VERSION` alone
- one runtime-owned search order exists and active consumers use it
- non-Rust consumers depend on one schemaed CLI helper instead of embedded root-search logic
- generated skills and upgrade docs no longer embed legacy-root search logic

**Not in this phase**

- spawned-subagent session-entry policy
- forbidden-legacy-surface gate
- hotspot module decomposition unrelated to root resolution

### Phase 2: Runtime-Owned Session-Entry Policy

**Primary workstream:** `WS3`

**Goal**

Make spawned-subagent bypass behavior a runtime rule rather than a markdown convention.

**Key changes**

- Introduce one explicit runtime marker for spawned-subagent context.
- Teach session-entry resolution to bypass first-turn bootstrap by default for spawned subagents unless explicitly opted back in.
- Keep the default spawned-subagent bypass ephemeral and non-persisted so nested sessions cannot rewrite later human entry state unless the caller explicitly opts in.
- Audit launcher and dispatcher surfaces so they set the runtime marker consistently.
- Rewrite skill prose to describe the runtime-owned rule instead of acting as the only source of truth.

**Expected file touch points**

- [`src/session_entry/mod.rs`](/Users/dmulcahey/development/skills/superpowers/src/session_entry/mod.rs)
- [`src/cli/session_entry.rs`](/Users/dmulcahey/development/skills/superpowers/src/cli/session_entry.rs)
- [`skills/using-featureforge/SKILL.md`](/Users/dmulcahey/development/skills/superpowers/skills/using-featureforge/SKILL.md)
- launcher or dispatcher-facing skill templates that start nested work

**Regression tests to add first**

- spawned subagent bypasses bootstrap by default
- spawned subagent bypass does not persist a decision file by default
- explicit subagent opt-in re-enables FeatureForge
- direct human re-entry still works when supported
- nested review or audit flows do not emit bootstrap noise

**Acceptance criteria**

- runtime and skill behavior agree on spawned-subagent policy
- default spawned-subagent bypass does not mutate persisted human session-entry state
- nested review and audit flows no longer rely on prose-only bypass behavior

**Not in this phase**

- legacy-root removal
- docs/testing convergence outside session-entry-specific instructions
- helper extraction that is not required for the runtime policy

### Phase 3: Hard Canonical Cutover

**Primary workstream:** `WS2`

**Goal**

Remove unsupported legacy-root behavior and references from active FeatureForge operation.

**Policy**

Legacy roots are unsupported. This phase does not preserve migration-only runtime compatibility and does not add a dedicated diagnostic path for removed legacy roots. Active behavior resolves only through the supported runtime contract established in Phase 1.

**Key changes**

- remove legacy roots from active root discovery, active generated-skill preambles, and active upgrade/public instructions
- add a forbidden-legacy-surface gate that fails on active files and generated artifacts while ignoring archive/history content where appropriate
- strengthen install-smoke coverage for checked-in prebuilt artifacts on supported layouts

**Expected file touch points**

- [`scripts/gen-skill-docs.mjs`](/Users/dmulcahey/development/skills/superpowers/scripts/gen-skill-docs.mjs)
- [`featureforge-upgrade/SKILL.md`](/Users/dmulcahey/development/skills/superpowers/featureforge-upgrade/SKILL.md)
- generated files under [`skills/`](/Users/dmulcahey/development/skills/superpowers/skills)
- [`tests/upgrade_skill.rs`](/Users/dmulcahey/development/skills/superpowers/tests/upgrade_skill.rs)
- cutover or install smoke coverage under [`tests/`](/Users/dmulcahey/development/skills/superpowers/tests)
- [`TODOS.md`](/Users/dmulcahey/development/skills/superpowers/TODOS.md)

**Regression tests to add first**

- forbidden-legacy-surface gate fails on active content and active paths
- forbidden-legacy-surface gate ignores archive/history fixtures
- upgrade-skill and generated-doc expectations reflect canonical-root-only output
- macOS arm64 and `windows-x64` install-smoke coverage validates expected checked-in artifact layout

**Acceptance criteria**

- active FeatureForge behavior no longer references `~/.codex/featureforge` or `~/.copilot/featureforge`
- active generated/public surfaces point only to canonical supported locations
- automation blocks reintroduction of active legacy-root references

**Not in this phase**

- contributor-doc cleanup that does not affect canonical cutover correctness
- large helper extraction unrelated to legacy-surface removal

### Phase 4: Docs, Validation, and Example Convergence

**Primary workstream:** `WS4`

**Goal**

Make contributor-facing documentation and validation commands match the stabilized product story.

**Key changes**

- replace duplicate or drifted validation instructions with one canonical release-facing entrypoint
- add missing generated-doc freshness references where the repo contract already depends on them
- clarify or add starter example/template guidance so the repository layout matches README claims
- reduce active platform-doc duplication where templating or generator-backed maintenance materially lowers drift risk

**Expected file touch points**

- [`README.md`](/Users/dmulcahey/development/skills/superpowers/README.md)
- [`docs/testing.md`](/Users/dmulcahey/development/skills/superpowers/docs/testing.md)
- platform install docs under [`docs/`](/Users/dmulcahey/development/skills/superpowers/docs)
- template or generator inputs for generated docs
- example or starter artifact paths if they are added

**Regression tests to add first**

- generated-doc freshness checks fail when checked-in generated artifacts drift
- doc contract tests cover the canonical validation entrypoint and starter/example expectations where those are machine-checkable

**Acceptance criteria**

- README, testing docs, generated-doc expectations, and starter/example guidance align on one canonical workflow story
- the documented validation path includes generated-doc freshness checks where the repo contract depends on them

**Not in this phase**

- runtime contract changes that should have landed in earlier phases
- module decomposition unrelated to documentation drift

### Phase 5: Structural Cleanup and CLI Hardening

**Primary workstreams:** `WS5`, `WS6`

**Goal**

Consolidate duplicated helper logic and improve maintainability only after behavior is already pinned.

**Key changes**

- extract duplicated repo slug derivation, markdown scanning, header parsing, hashing, install-root logic, and base-branch resolution into shared runtime-owned helpers where that meaningfully reduces drift
- split hotspot modules along responsibility boundaries once behavior is guarded by tests
- replace raw bounded-string CLI inputs with enums or equivalent typed parsing at the boundary
- make bare `featureforge` invocation print help instead of silently succeeding

**Code-quality targets**

Phase 5 should target the concrete duplication and hotspot seams that already exist in the repository rather than doing generic cleanup:

- repo slug derivation is currently duplicated across [`src/git/mod.rs`](/Users/dmulcahey/development/skills/superpowers/src/git/mod.rs), [`src/workflow/manifest.rs`](/Users/dmulcahey/development/skills/superpowers/src/workflow/manifest.rs), and [`src/execution/state.rs`](/Users/dmulcahey/development/skills/superpowers/src/execution/state.rs)
- markdown scanning is duplicated across [`src/workflow/status.rs`](/Users/dmulcahey/development/skills/superpowers/src/workflow/status.rs) and [`src/execution/state.rs`](/Users/dmulcahey/development/skills/superpowers/src/execution/state.rs)
- required-header parsing is duplicated across [`src/contracts/spec.rs`](/Users/dmulcahey/development/skills/superpowers/src/contracts/spec.rs), [`src/contracts/plan.rs`](/Users/dmulcahey/development/skills/superpowers/src/contracts/plan.rs), and [`src/contracts/evidence.rs`](/Users/dmulcahey/development/skills/superpowers/src/contracts/evidence.rs)
- hashing helpers are duplicated across contract and execution modules
- the largest hotspot files currently include [`src/execution/state.rs`](/Users/dmulcahey/development/skills/superpowers/src/execution/state.rs), [`src/contracts/runtime.rs`](/Users/dmulcahey/development/skills/superpowers/src/contracts/runtime.rs), [`src/workflow/status.rs`](/Users/dmulcahey/development/skills/superpowers/src/workflow/status.rs), and [`src/repo_safety/mod.rs`](/Users/dmulcahey/development/skills/superpowers/src/repo_safety/mod.rs)

**Code-quality guardrails**

- prefer extracting one focused helper with two or more deleted duplicate call sites over introducing broad utility modules with speculative helpers
- split hotspot modules by responsibility boundary, not by arbitrary line count
- do not move logic into new abstractions unless the change also deletes an existing duplicate implementation
- keep parse-boundary validation close to the CLI or artifact parser that owns it; do not push invalid-input handling deeper into runtime code
- if a refactor increases fan-out or branching without deleting duplication, it does not meet this phase's goal

**Expected file touch points**

- hotspot modules under [`src/`](/Users/dmulcahey/development/skills/superpowers/src)
- CLI modules under [`src/cli/`](/Users/dmulcahey/development/skills/superpowers/src/cli)
- helper modules under [`src/paths/`](/Users/dmulcahey/development/skills/superpowers/src/paths), [`src/workflow/`](/Users/dmulcahey/development/skills/superpowers/src/workflow), or new focused modules as needed
- contract and regression tests under [`tests/`](/Users/dmulcahey/development/skills/superpowers/tests)

**Regression tests to add first**

- CLI parse-boundary tests for new enums or bounded modes
- bare CLI help behavior tests
- helper-backed regression tests that prove extracted logic preserved earlier behavior

**Acceptance criteria**

- duplicate contract logic is materially reduced without reopening earlier behavior decisions
- hotspot modules are narrower and easier to review
- each extracted helper replaces at least one real duplicate implementation
- CLI behavior is stricter and clearer at the parse boundary

**Not in this phase**

- policy changes already settled earlier in this spec
- retroactive expansion of remediation scope beyond `FF-01` through `FF-11`

## Program-Level Rules

1. Every finding `FF-01` through `FF-11` remains in scope for the umbrella remediation program and its implementation plan.
2. Later phases may depend on artifacts from earlier phases, but they may not silently fix earlier-phase behavior under the banner of cleanup.
3. Each phase must land its regression coverage before or alongside the behavior change it protects.
4. Any new abstraction introduced during Phases 1 through 3 must earn its keep by reducing a real contract split, not by serving general cleanup preferences.
5. If a phase uncovers a missing prerequisite from an earlier phase, the work must be resequenced back into that earlier phase instead of hidden inside the current one.

## Error Flow

```text
INPUT / ENV / STATE
        |
        v
  runtime-owned helper
        |
        +--> valid result ------------------------> caller continues
        |
        +--> contract violation ------------------> named failure_class, no state mutation
        |
        +--> runtime I/O failure -----------------> named failure_class, caller stops or degrades safely
        |
        +--> persisted state unreadable ----------> fail closed, preserve user-controlled recovery path
```

The no-silent-failure rule for this program is:

- runtime-facing helpers must emit named failure classes
- failed helper calls must not partially mutate persisted state
- callers must either stop, degrade safely, or surface a structured blocked state; they may not silently continue on untrusted inputs

## Error & Rescue Registry

Failure-class names below are the contract intent for this remediation program. Implementations may reuse existing enum variants where they are semantically correct or introduce dedicated variants where the current taxonomy is too generic, but the final behavior must keep these failures named, testable, and non-silent.

| Method / Codepath | What Can Go Wrong | Failure Class | Rescued? | Rescue Action | User / Operator Sees |
| --- | --- | --- | --- | --- | --- |
| Phase 1 runtime-root helper | invalid CLI input or unsupported flags | `InvalidCommandInput` | Y | exit without mutation and print structured usage failure | non-zero CLI with named `failure_class` |
| Phase 1 runtime-root helper | consumer-provided root candidate violates contract or resolves ambiguously | `ResolverContractViolation` | Y | return structured failure or `resolved=false`; do not guess | JSON or CLI output that names the contract failure |
| Phase 1 runtime-root helper | filesystem or process-context lookup fails unexpectedly | `ResolverRuntimeFailure` | Y | stop resolution, preserve existing state, do not fall back to legacy roots | named runtime failure and no state mutation |
| Phase 1 update-check consumer | state cache read or write fails | `UpdateCheckStateFailed` | Y | skip emitting upgrade state changes rather than writing partial cache | no misleading upgrade banner; diagnostics remain available |
| Phase 2 session-entry resolve | decision file unreadable or malformed | `DecisionReadFailed` or `MalformedDecisionState` | Y | fail closed to a safe bypass or `needs_user_choice`; do not trust persisted state | structured blocked or bypassed result with named reason |
| Phase 2 explicit re-entry persist | explicit opt-in cannot be written | `DecisionWriteFailed` | Y | honor current-turn re-entry when allowed, mark persistence failure, leave future turns undecided | current turn continues, `persisted=false`, named failure |
| Phase 2 spawned-subagent bypass | nested subagent default bypass tries to persist state | `ResolverContractViolation` | Y | reject persistence and keep bypass ephemeral | no human session-state mutation |
| Phase 3 forbidden legacy surface gate | active file or generated artifact still contains unsupported legacy root | `ForbiddenLegacySurfaceDetected` | Y | fail the gate, print offending paths, block rollout | non-zero gate failure with exact offending files |
| Phase 4 generated-doc validation | generated skill or agent docs are stale relative to source templates | `ReviewArtifactNotFresh` or `ReleaseArtifactNotFresh` | Y | block release-facing validation until regenerated | freshness failure with regeneration path |
| Phase 5 CLI parse boundary | invalid execution mode or bounded enum value | `InvalidExecutionMode` or `InvalidCommandInput` | Y | reject at parse boundary before runtime side effects | immediate CLI failure with named invalid input |

## Failure Modes Registry

| Codepath | Failure Mode | Rescued? | Test? | User Sees? | Logged? |
| --- | --- | --- | --- | --- | --- |
| runtime-root helper | arbitrary repo `VERSION` mistaken for install root | Y | Y | structured failure or `resolved=false` | Y |
| runtime-root helper | explicit `FEATUREFORGE_DIR` is invalid | Y | Y | named contract failure | Y |
| session-entry resolve | persisted decision file unreadable | Y | Y | fail-closed result, not silent success | Y |
| session-entry resolve | spawned-subagent bypass leaks into later human state | Y | Y | no leak permitted; test must prove non-persistence | Y |
| forbidden legacy surface gate | archive/history ignored incorrectly or active file missed | Y | Y | gate blocks with exact path list | Y |
| generated-doc validation | stale checked-in docs pass unexpectedly | Y | Y | freshness failure blocks validation | Y |
| CLI parse boundary | invalid bounded mode reaches runtime logic | Y | Y | immediate parse failure | Y |

## Failure Modes and Edge Cases

- **False-positive runtime discovery:** a non-FeatureForge repo with a top-level `VERSION` file must not be treated as the active install.
- **False-negative runtime discovery:** valid repo-local runtime checkouts, binary-adjacent installs, and explicit `FEATUREFORGE_DIR` overrides must still resolve correctly.
- **Session-entry noise in nested flows:** dispatched reviewers or auditors must not trigger first-turn bootstrap unexpectedly.
- **Generated-doc drift:** checked-in skills or upgrade docs must not continue carrying removed legacy-root behavior after the runtime cutover.
- **Active-vs-archived gating mistakes:** forbidden-legacy-surface automation must distinguish active files from preserved historical content.
- **Refactor regressions disguised as cleanup:** helper extraction and module splitting must preserve the earlier behavior contracts they build on.

## Security & Threat Model

This program does not introduce new product-user authorization flows, new secrets, or new external service dependencies. Its security boundary is the local runtime environment: repo-root-bounded file access, local FeatureForge state under `~/.featureforge/`, checked-in generated artifacts, and the small number of environment variables that influence runtime behavior.

Threat model:

| Threat | Likelihood | Impact | Mitigation Required In Spec |
| --- | --- | --- | --- |
| `FEATUREFORGE_DIR` or equivalent helper input points at an arbitrary tree | Medium | High | runtime-root helper validates the candidate before use, returns a named failure instead of guessing, and never falls through to unsupported legacy paths |
| spawned-subagent marker leaks or is spoofed into later human entry behavior | Medium | Medium | default subagent bypass is ephemeral, explicit opt-in is required for persistence or re-entry, and tests prove human state is not rewritten |
| decision, cache, or approval-related state under `~/.featureforge/` is malformed or tampered with | Medium | Medium | malformed persisted state fails closed, writes stay atomic, and helpers do not trust partially readable state |
| forbidden-legacy-surface scanning escapes the repo root or misclassifies archived history | Low | High | scan inputs stay repo-bounded, active and archived roots are distinguished explicitly, and regression tests cover both false-positive and false-negative cases |
| generated docs or upgrade instructions reintroduce removed legacy behavior | Medium | Medium | generated-doc freshness checks and legacy-surface gates block stale or drifted artifacts before release-facing validation passes |

Security expectations:

- all path-like inputs remain normalized and repo-bounded when they refer to repository content
- env-driven runtime decisions must be validated before they influence install resolution or session behavior
- malformed local state must fail closed rather than silently preserving an unsafe path
- this program must not weaken the existing protected-branch approval and approval-fingerprint guarantees owned by `repo-safety`
- any new helper output that other tools consume should be treated as structured data, not shell-evaluated text

## Data Flow & Interaction Edge Cases

The user-visible interactions in this remediation program are primarily CLI and workflow-skill interactions rather than UI screens. The spec must still describe their shadow paths explicitly.

### Data Flow: Phase 1 runtime-root resolution

```text
INPUT
  FEATUREFORGE_DIR / cwd / binary location
        |
        v
VALIDATION
  runtime-root helper checks required runtime markers
        |
        +--> nil env ------------------------> continue to next candidate
        +--> invalid candidate -------------> named contract failure or continue when allowed
        +--> unreadable filesystem ---------> named runtime failure
        |
        v
TRANSFORM
  choose canonical resolved root + source metadata
        |
        +--> ambiguous result -------------> fail closed; do not guess
        |
        v
PERSIST
  update-check cache may read/write state
        |
        +--> cache read failure -----------> skip cache use safely
        +--> cache write failure ----------> no partial state mutation
        |
        v
OUTPUT
  JSON helper output or update-check behavior
        |
        +--> stale/malformed output -------> validation failure in consumer tests
```

### Data Flow: Phase 2 session-entry resolution

```text
INPUT
  message file + session key + optional spawned-subagent marker
        |
        v
VALIDATION
  parse message text and inspect persisted decision state
        |
        +--> missing state ---------------> needs_user_choice or safe bypass
        +--> malformed state -------------> fail closed
        +--> spoofed subagent marker ----> bypass only for current nested context
        |
        v
TRANSFORM
  resolve enabled / bypassed / needs_user_choice
        |
        +--> explicit re-entry -----------> attempt persist with named failure on write miss
        |
        v
PERSIST
  write decision only on explicit supported paths
        |
        +--> nested bypass default -------> no persistence
        +--> write failure ---------------> current-turn behavior preserved, persistence false
        |
        v
OUTPUT
  structured session-entry result consumed by skills and workflow helpers
```

### Data Flow: Phase 3 forbidden-legacy-surface gate

```text
INPUT
  active source files + generated artifacts + allowlisted archive/history roots
        |
        v
VALIDATION
  repo-bounded scan and classification
        |
        +--> archive path ---------------> ignore intentionally
        +--> active path match ---------> collect exact offending path
        +--> generated artifact drift --> fail gate
        |
        v
OUTPUT
  pass with zero findings or fail with exact offending files
```

### Interaction Edge Cases

| Interaction | Edge Case | Handled? | How |
| --- | --- | --- | --- |
| `featureforge repo runtime-root --json` | env var set to non-runtime path | Yes | helper validates and returns named failure instead of inferring a root |
| `featureforge repo runtime-root --json` | command run outside a FeatureForge repo with no supported install available | Yes | helper returns unresolved or runtime failure without legacy fallback |
| `featureforge session-entry resolve` | nested subagent starts while parent human session is bypassed or unresolved | Yes | nested bypass is ephemeral and cannot rewrite later human state |
| `featureforge session-entry resolve` | explicit re-entry requested but write fails | Yes | current turn may continue with `persisted=false`; future turns remain undecided |
| generated-skill refresh and check flow | generated docs not regenerated after source changes | Yes | freshness checks fail validation before release-facing commands pass |
| forbidden legacy gate | archived history contains legacy roots | Yes | archive/history roots are explicitly ignored by the gate |
| forbidden legacy gate | active generated artifact reintroduces legacy root text | Yes | gate fails on active artifact path and blocks rollout |

No browser or UI interaction surface is introduced by this remediation spec.

## Test Strategy

```text
NEW UX FLOWS:
  - CLI/runtime helper invocation for runtime-root resolution
  - session-entry resolution for nested subagent and human re-entry paths
  - validation and release-facing docs/check flows for generated artifacts

NEW DATA FLOWS:
  - runtime-root candidate discovery -> validation -> helper output
  - session-entry state read/write -> structured resolve output
  - forbidden legacy surface scan -> offending-path report or pass
  - generated-doc source/template change -> freshness check failure or pass

NEW CODEPATHS:
  - explicit runtime-root helper contract
  - ephemeral spawned-subagent bypass branch
  - hard canonical legacy-surface gate branch
  - typed CLI parse-boundary rejection branch

NEW BACKGROUND JOBS / ASYNC WORK:
  - none

NEW INTEGRATIONS / EXTERNAL CALLS:
  - update-check remote version fetch remains the only live network-facing call in affected code
  - generated skill documentation remains a Node-based generator consumer of runtime contracts

NEW ERROR/RESCUE PATHS:
  - resolver contract/runtime failures
  - decision read/write failures
  - generated-doc freshness failures
  - forbidden legacy surface gate failures
  - typed CLI invalid-input rejections
```

Coverage plan by layer:

- **Rust integration / contract tests**
  - [`tests/update_and_install.rs`](/Users/dmulcahey/development/skills/superpowers/tests/update_and_install.rs) for runtime-root and update-check behavior
  - [`tests/using_featureforge_skill.rs`](/Users/dmulcahey/development/skills/superpowers/tests/using_featureforge_skill.rs) and [`tests/session_config_slug.rs`](/Users/dmulcahey/development/skills/superpowers/tests/session_config_slug.rs) for session-entry and bypass behavior
  - [`tests/upgrade_skill.rs`](/Users/dmulcahey/development/skills/superpowers/tests/upgrade_skill.rs) for upgrade-flow shell contract alignment
  - [`tests/repo_safety.rs`](/Users/dmulcahey/development/skills/superpowers/tests/repo_safety.rs) where protected-branch or scoped-write guarantees could be affected
  - [`tests/packet_and_schema.rs`](/Users/dmulcahey/development/skills/superpowers/tests/packet_and_schema.rs) when new helper schemas become checked-in contract artifacts
- **Rust workflow / routing tests**
  - [`tests/workflow_runtime.rs`](/Users/dmulcahey/development/skills/superpowers/tests/workflow_runtime.rs) and [`tests/workflow_shell_smoke.rs`](/Users/dmulcahey/development/skills/superpowers/tests/workflow_shell_smoke.rs) for route-time contract and shell-facing behavior
- **Node generated-doc / contract tests**
  - [`tests/codex-runtime/gen-skill-docs.unit.test.mjs`](/Users/dmulcahey/development/skills/superpowers/tests/codex-runtime/gen-skill-docs.unit.test.mjs)
  - [`tests/codex-runtime/skill-doc-generation.test.mjs`](/Users/dmulcahey/development/skills/superpowers/tests/codex-runtime/skill-doc-generation.test.mjs)
  - [`tests/codex-runtime/skill-doc-contracts.test.mjs`](/Users/dmulcahey/development/skills/superpowers/tests/codex-runtime/skill-doc-contracts.test.mjs)
- **Fixture-driven workflow artifacts**
  - checked-in fixtures under [`tests/codex-runtime/fixtures/workflow-artifacts/`](/Users/dmulcahey/development/skills/superpowers/tests/codex-runtime/fixtures/workflow-artifacts/README.md) stay the stable route-time inputs

Test expectations:

- every new helper contract needs one happy-path test, one failure-path test, and one edge-case test
- every removed legacy path needs one regression proving active surfaces no longer reference it
- any new schemaed helper output should have a checked-in schema or equivalent contract fixture when consumed across language boundaries
- release-facing validation should remain mostly deterministic: Node contract checks plus targeted Rust suites, not new flaky end-to-end harnesses
- the hostile QA test for this program is “reintroduce a legacy root in generated output or persist nested bypass state and ensure validation fails loudly”

## Performance & Scale Expectations

This remediation program should preserve FeatureForge’s current CLI-scale behavior. It is not a throughput feature, but it does touch several paths that already scan directories, walk markdown trees, and hash artifact content.

Performance guardrails:

- Phase 1 runtime-root resolution must use a bounded candidate list only: explicit env, repo-local runtime, binary-adjacent runtime, and canonical install. It must not introduce recursive filesystem search.
- Phase 1 must not increase `update-check` network fetch frequency beyond the existing cache and TTL behavior.
- Phase 3 forbidden-legacy-surface validation must scan active roots once per invocation and avoid rescanning archived content that is intentionally excluded.
- Phase 5 helper extraction should reduce duplicated markdown-tree walks in [`src/workflow/status.rs`](/Users/dmulcahey/development/skills/superpowers/src/workflow/status.rs) and [`src/execution/state.rs`](/Users/dmulcahey/development/skills/superpowers/src/execution/state.rs), not add more full-tree passes.
- Phase 5 helper extraction should consolidate repeated hashing helpers where that reduces duplicate file-content hashing and repeated digest plumbing.
- No phase should introduce a background daemon, long-lived cache invalidation service, or always-on watcher for this remediation work.

Scale questions this spec must answer in implementation:

- how does workflow routing behave in a repo with many spec and plan artifacts?
- how does the forbidden-legacy-surface gate behave when run repeatedly in CI across the full repo tree?
- how many times is the same artifact content hashed or scanned during one validation run?

Performance acceptance criteria:

- helper-driven refactors do not increase the number of repo-tree scans required for one normal validation run
- root-resolution remains constant-bounded in candidate count
- full validation remains deterministic and suitable for local iteration and CI use

## Observability & Debuggability Expectations

FeatureForge is primarily a local CLI/runtime system, so the key observability surfaces are structured command output, stable failure classes, checked-in schemas, and reproducible validation commands rather than hosted dashboards.

Required operator-facing surfaces:

- runtime helper outputs should expose structured fields like `failure_class`, `reason_codes`, and diagnostics where the surrounding command family already uses them
- workflow-facing debug commands such as `workflow phase`, `workflow doctor`, and `workflow handoff` must remain useful after this remediation and should reflect any new helper-owned state transitions
- any new cross-language helper contract should have a checked-in schema or equivalent machine-readable contract artifact
- validation failures should point at the exact stale artifact, offending path, or missing prerequisite rather than forcing source inspection

Debuggability rules:

- a resolver or gate failure must be diagnosable from one command invocation plus repo-local artifact inspection; it should not require ad hoc instrumentation
- generated-doc or legacy-surface failures must print enough context to identify whether the problem is in runtime code, a template, or a checked-in generated file
- persisted-state failures should name the affected state file domain, for example session-entry state, update-check cache, or approval record
- any new helper that feeds generators or shell instructions should be testable in isolation from the larger workflow stack

Runbook expectations:

- `docs/testing.md` should describe the canonical local commands for validating each affected surface
- the implementation plan should call out which command a contributor runs first when root resolution, session-entry, generated-doc freshness, or legacy-surface gating fails
- no phase should rely on hidden maintainer knowledge to recover from a blocked validation or helper failure

Verification expectations:

- each phase must leave behind machine-checkable regression coverage for the behavior it changes
- generated artifacts must remain freshness-checkable in CI and local validation
- release-facing verification docs must describe the canonical commands needed to validate active runtime, generated docs, and install-smoke behavior
- if a phase adds a new machine-readable helper surface, its output contract should be schemaable or otherwise precisely testable

## Rollout and Rollback

- Roll forward by phase, not by mixing unrelated workstreams into one unbounded branch slice.
- Roll back at phase boundaries when a later phase exposes instability in an earlier contract.
- Do not start Phase 3 until Phases 1 and 2 regression suites are passing, because hard cutover removal is intentionally intolerant of hidden fallback behavior.
- Do not start Phase 5 until the canonical behavior story is stable enough that refactors can be evaluated as pure maintainability changes.

Phase-specific rollout rules:

- **Phase 1:** land the runtime-root helper and its tests before switching generated consumers over to it; if consumer migration regresses, roll back the consumer switch before reconsidering the helper contract.
- **Phase 2:** land ephemeral subagent bypass behavior and nested-session tests before updating skill prose that depends on it.
- **Phase 3:** remove unsupported legacy surfaces only in the same slice that adds the forbidden-legacy-surface gate and updated generated artifacts; do not ship “removed behavior” separately from the gate that prevents reintroduction.
- **Phase 4:** docs and validation command convergence should land together so contributor guidance does not point at a half-updated command matrix.
- **Phase 5:** helper extraction or module decomposition should land only when the earlier phase suites are already green and the refactor diff stays behavior-preserving.

Rollback rules:

- if Phase 1 consumer migration fails, keep the helper contract but revert consumer adoption until the contract mismatch is fixed
- if Phase 2 nested-session behavior leaks state, revert the bypass behavior change before touching later cutover phases
- if Phase 3 cutover breaks generated artifacts or install-smoke validation, restore the last known good canonical surfaces and regenerate checked-in artifacts before retrying removal
- if Phase 4 docs drift causes contributor confusion, revert the doc bundle together rather than leaving mixed instructions in place
- if Phase 5 refactors reopen behavior bugs, revert the refactor slice and preserve the earlier behavior contract

Post-change verification expectations:

- every phase completion should end with the phase-specific regression subset plus the canonical release-facing validation command documented in `docs/testing.md`
- any phase that changes generated artifacts must include regeneration plus freshness checks in the same rollout slice
- any phase that changes prebuilt artifact expectations must include the relevant prebuilt/install smoke coverage in the same rollout slice

## Risks and Mitigations

- **Risk:** hard removal of legacy roots reveals hidden dependencies in tests or generated docs.
  **Mitigation:** Phase 3 adds explicit forbidden-legacy-surface coverage and updates all generated expectations together.
- **Risk:** helper extraction reopens behavior changes that should be closed.
  **Mitigation:** the spec defers WS5 and WS6 until after contract stabilization and requires helper-preservation regression tests.
- **Risk:** documentation cleanup drifts again after the cutover.
  **Mitigation:** Phase 4 ties docs changes to canonical validation commands and generated-doc freshness checks instead of relying on prose alone.

## What Already Exists

- [`src/update_check/mod.rs`](/Users/dmulcahey/development/skills/superpowers/src/update_check/mod.rs) already owns the runtime update-check path and cache semantics, but its install discovery is too permissive.
- [`src/session_entry/mod.rs`](/Users/dmulcahey/development/skills/superpowers/src/session_entry/mod.rs) already owns session-entry state resolution, but spawned-subagent bypass is not fully runtime-owned yet.
- [`scripts/gen-skill-docs.mjs`](/Users/dmulcahey/development/skills/superpowers/scripts/gen-skill-docs.mjs) already centralizes generated skill preambles, making it the right place to consume a runtime helper instead of repeating root detection.
- [`tests/update_and_install.rs`](/Users/dmulcahey/development/skills/superpowers/tests/update_and_install.rs), [`tests/using_featureforge_skill.rs`](/Users/dmulcahey/development/skills/superpowers/tests/using_featureforge_skill.rs), [`tests/upgrade_skill.rs`](/Users/dmulcahey/development/skills/superpowers/tests/upgrade_skill.rs), and [`tests/runtime_instruction_contracts.rs`](/Users/dmulcahey/development/skills/superpowers/tests/runtime_instruction_contracts.rs) already pin much of the active contract surface.
- [`docs/testing.md`](/Users/dmulcahey/development/skills/superpowers/docs/testing.md) already describes the deterministic validation suites, even though it still needs convergence work.

## NOT In Scope

- Reintroducing removed install command surfaces:
  The remediation program hardens current contracts; it does not reopen removed CLI product surface.
- Preserving legacy roots as supported or migration-only runtime behavior:
  the policy decision is already made and this spec executes that removal.
- Hosted observability systems, dashboards, or background services:
  FeatureForge remains a local CLI/runtime system with structured command-level observability.
- Broad architecture rewrites outside the identified duplication and hotspot seams:
  the goal is sharper contracts and bounded cleanup, not a wholesale rewrite.

## Dream State Delta

```text
CURRENT STATE
- Runtime contracts split across Rust, generated shell, checked-in skills, and docs
- Legacy-root cutover not fully finished in active surfaces
- Hotspot modules still carry duplicated helper logic

THIS SPEC
- Re-centralizes root resolution and session-entry policy in runtime-owned contracts
- Removes unsupported legacy surfaces from active behavior and generated/public artifacts
- Aligns docs, validation, and examples with the canonical runtime story
- Defers cleanup until behavior is pinned, then consolidates duplicate helpers intentionally

12-MONTH IDEAL
- FeatureForge has one obvious contract per behavior boundary
- Generated skills narrate runtime truth instead of reproducing it
- New contributors can debug blocked workflow states from one command plus one doc
- Cleanup and extension work builds on small helpers instead of rediscovering hidden rules
```

This spec moves the system toward a future where FeatureForge behaves like a small platform with explicit contracts instead of a runtime plus a parallel folklore layer in markdown.

## Acceptance Criteria

- The repository contains one approved remediation spec and one derived implementation plan that cover the entire remediation set.
- Phase ordering in the plan follows the contract-first sequencing defined here.
- Legacy roots are absent from active behavior and active generated/public surfaces by the end of Phase 3.
- Runtime root resolution and spawned-subagent session-entry behavior are runtime-owned and regression-tested before later cleanup begins.
- Contributor docs, validation commands, and examples align with the stabilized canonical FeatureForge story.
- Structural cleanup work lands only after earlier behavior contracts are pinned and preserved by tests.

## Plan Handoff Notes

The follow-on implementation plan should stay umbrella-shaped and cover every phase in this spec. It should not flatten the work into one unordered checklist. Instead, it should group tasks by phase, preserve the phase gates, and make dependencies explicit so execution can proceed in reviewable slices without reopening product-policy questions.

## CEO Review Summary

**Review Status:** clear
**Reviewed At:** 2026-03-25T13:39:31Z
**Review Mode:** hold_scope
**Reviewed Spec Revision:** 1
**Critical Gaps:** 0
**UI Design Intent Required:** no
**Outside Voice:** skipped
