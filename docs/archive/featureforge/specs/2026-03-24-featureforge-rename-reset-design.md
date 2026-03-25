# FeatureForge Rename and 1.0.0 Reset

**Workflow State:** CEO Approved
**Spec Revision:** 1
**Last Reviewed By:** plan-ceo-review

## Summary

Rename the project to `FeatureForge`, reset the release line to `1.0.0`, and turn the current repository into a standalone product with one supported runtime entrypoint: the Rust-built `featureforge` binary.

This is a hard cut, not a compatibility release.

The end state is:

- active product, runtime, docs, state, package, and distribution surfaces use `FeatureForge` / `featureforge`
- legacy wrapper binaries, markdown command shims, migration helpers, and dual-name compatibility behavior are removed
- historical branded artifacts are preserved verbatim only under an explicit docs archive
- the only active non-archive reference to the old project name is the provenance attribution in the main `README.md`

## Problem

The repository still behaves like an evolution of the prior project instead of a new standalone product.

Today the active surface still carries the legacy identity across:

- the Rust package name and CLI metadata
- the shipped binary and wrapper names under `bin/`
- compatibility entrypoints in `compat/`
- runtime state rooted under `~/.superpowers/`
- environment variables prefixed with `SUPERPOWERS_`
- workflow artifact roots under `docs/superpowers/`
- update-check URLs, release notes, installation docs, and tests
- migration and compatibility command surfaces explicitly designed to bridge older installs

That leaves three product problems:

1. The repository cannot honestly present itself as a new standalone `1.0.0` product while its active operating surfaces still expose the prior identity.
2. The single-binary Rust cutover is incomplete as long as wrapper entrypoints and markdown compatibility aliases remain part of the supported surface.
3. Historical materials are mixed into active workflow paths, which makes it easy for tooling, documentation, and future changes to keep depending on legacy names and structures.

## Desired Outcome

`FeatureForge` ships as a clean standalone runtime and workflow toolkit whose supported operating model is obvious:

- users run `featureforge`
- active workflow artifacts live under `docs/featureforge/`
- active runtime state lives under `~/.featureforge/`
- distribution, update, and release identity all resolve through `FeatureForge`
- historical pre-rename materials remain preserved, but they are inert and non-authoritative

## Goals

- Rename all active project surfaces from the legacy identity to `FeatureForge` / `featureforge`.
- Reset the product version from `5.8.0` to `1.0.0`.
- Make the Rust-built `featureforge` binary the only supported runtime entrypoint.
- Remove migration helpers, compatibility aliases, wrapper binaries, and markdown command shims from the supported product surface.
- Move active workflow artifacts into `docs/featureforge/`.
- Preserve old branded history verbatim under a docs archive that active tooling ignores.
- Move active runtime state, config, install, and update state into `~/.featureforge/`.
- Update repo and distribution identity so releases and update checks point at the `FeatureForge` canonical source.
- Add verification that fails closed if active code or docs depend on legacy active surfaces.

## Not In Scope

- Maintaining backward compatibility with legacy binary names, wrapper scripts, environment variables, state directories, or command aliases
- Shipping a migration command that imports old installs or runtime state
- Rewriting archived historical docs to the new brand
- Preserving legacy markdown command aliases as hidden or undocumented entrypoints
- Keeping dual-read behavior for old and new state or env var names
- Adding new workflow stages or changing the fundamental approval model
- Re-architecting unrelated product behavior beyond what is required for the rename/reset

## Current-System Findings

The current repository still exposes the prior identity through all of the following active surfaces:

- package metadata in `Cargo.toml`
- root version metadata in `VERSION`
- CLI metadata in `src/cli/mod.rs`
- runtime state helpers in `src/paths/mod.rs`
- update-check discovery in `src/update_check/mod.rs`
- wrapper and helper executables in `bin/`
- compatibility launchers in `compat/`
- markdown compatibility commands in `commands/`
- active workflow docs under `docs/superpowers/`
- release notes in `RELEASE-NOTES.md`
- tests and fixtures that assert legacy names, paths, and wrappers

The current runtime already has the right technical center of gravity for the new product:

- one Rust CLI exists
- most product logic has already moved into Rust modules
- repo-visible markdown artifacts remain authoritative
- helper state is rebuildable rather than authoritative

The rename/reset should therefore be implemented as a strict identity and surface cleanup around the existing Rust-centered architecture rather than another compatibility bridge.

## Requirement Index

- [REQ-001][behavior] Active product identity uses `FeatureForge` / `featureforge` across binary name, package metadata, help text, diagnostics, version output, docs, release assets, supported instructions, active skill IDs, install discovery links, install roots, and agent-facing identifiers.
- [REQ-002][behavior] Active version metadata resets to `1.0.0`, and release/update surfaces treat that as the new standalone baseline.
- [REQ-003][behavior] The only supported runtime entrypoint is the Rust-built `featureforge` binary; the repo exposes a real compiled `bin/featureforge` or `bin/featureforge.exe` as the canonical fixed-path binary, install packaging copies that exact binary, and no user-facing wrapper or alias executables remain in the supported surface.
- [REQ-004][behavior] Active workflow artifacts move to `docs/featureforge/specs/`, `docs/featureforge/plans/`, and `docs/featureforge/execution-evidence/`.
- [REQ-005][behavior] Historical pre-rename specs, plans, evidence, release notes, and related materials are preserved verbatim under a dedicated docs archive and excluded from active workflow discovery.
- [REQ-006][behavior] Active runtime state, install state, config, and update-check files move to `~/.featureforge/`, including the canonical install root at `~/.featureforge/install`, and active env/config variables move to `FEATUREFORGE_*` without fallback reads from legacy names.
- [REQ-007][behavior] Distribution identity, install docs, update-check sources, and release metadata point to the canonical `FeatureForge` repo and release surfaces.
- [REQ-008][behavior] Migration helpers, legacy install-bridge flows, compatibility markdown commands, and legacy binary shims are removed from the supported product surface.
- [REQ-009][behavior] Active runtime and docs fail closed when pointed at invalid artifact paths, invalid state paths, removed shim commands, or invalid env/config surfaces, using stable `FeatureForge` failure classes and remediation that names only current supported surfaces.
- [REQ-010][verification] Verification covers CLI identity, artifact-path contracts, archive exclusion, forbidden active legacy references, packaging, and removed shim surfaces.
- [REQ-011][behavior] The main `README.md` keeps one explicit provenance attribution to the upstream project, and no other active non-archive docs retain the legacy name after cutover.
- [REQ-012][behavior] The rename-specific spec and plan for this cutover are archived under `docs/archive/featureforge/` after release handoff so the final active repository still satisfies `REQ-011` without rewriting those artifacts.

## Design Decisions

- `DEC-001` The rename is a hard cut with no compatibility aliases, migration helpers, or dual-name reads.
- `DEC-002` The supported command surface is one compiled binary, `featureforge`, with native subcommands only.
- `DEC-003` Historical materials are preserved in a docs archive rather than rewritten in place.
- `DEC-004` Active workflow and runtime paths move immediately into the `featureforge` namespace.
- `DEC-005` Repo and distribution identity change as part of the same cutover rather than a later follow-up.

## Affected Surfaces

The work directly affects at least these categories:

- Rust crate metadata and binary naming
- CLI help/version/about strings
- runtime state path helpers and env var parsing
- install, update-check, and release metadata
- checked-in runtime packaging under `bin/`
- the canonical real-binary path at `bin/featureforge` or `bin/featureforge.exe`
- wrapper and compat entrypoints under `bin/` and `compat/`
- workflow artifact path contracts and discovery logic
- skill namespaces, install discovery roots, and agent/runtime linkage surfaces
- skill and agent docs that mention active paths or commands
- active docs in `README.md`, `docs/README.codex.md`, `docs/README.copilot.md`, and workflow artifact templates
- tests, fixtures, snapshots, and grep-style contract checks

## Cutover Model

The rename/reset keeps the Rust core and changes the surrounding identity and surface law.

```text
before
------
user -> wrapper or helper alias -> superpowers runtime -> docs/superpowers/* + ~/.superpowers/*

after
-----
user -> featureforge binary -> featureforge runtime -> docs/featureforge/* + ~/.featureforge/*
                                         |
                                         +-> docs/archive/... (readable history only, never active input)
```

### Active Surface Rules

- `featureforge` is the only supported executable users invoke.
- All supported commands are native subcommands on the Rust CLI.
- Any repo-local scripts that remain for development, packaging, or release automation are internal-only and must not be installed, documented, or tested as public runtime entrypoints.
- Active docs, tests, and packaging must describe the single-binary model consistently.

### Archive Rules

- Historical branded materials move under a dedicated archive tree such as `docs/archive/superpowers/`.
- Archive files are preserved verbatim.
- Archive files are never candidates for active workflow discovery, release truth, or install guidance.
- Archive presence is for historical traceability only.

## Architecture

### 1. Runtime Identity

The Rust crate, compiled binary, CLI metadata, diagnostics, and checked-in runtime packaging all adopt the `FeatureForge` identity. The runtime must no longer present the legacy product name in `--help`, `--version`, error messages, schema descriptions, or public-facing operator text.

This is primarily a naming and contract update, not a change in the workflow model. The CLI tree may keep existing subcommand structure where it remains useful, but it must be reached through the single `featureforge` binary only.

The repository itself must expose a real compiled binary at `bin/featureforge` on Unix-like platforms and `bin/featureforge.exe` on Windows. When a fixed-path binary reference is needed in active docs, generated skills, runtime tests, or install logic, that repo-root binary path is the canonical contract rather than a wrapper script or PATH lookup.

All active skill, agent, and discovery surfaces also move to the `FeatureForge` identity. That includes:

- active skill IDs such as `featureforge:brainstorming`
- install links such as `~/.agents/skills/featureforge` and `~/.copilot/skills/featureforge`
- the canonical install root at `~/.featureforge/install`
- any supported agent identifiers that currently use the legacy project name

### 2. Public Command Surface

The current helper-style wrappers and compatibility entrypoints are removed from the supported product surface, including:

- helper executables under `bin/` that exist only to forward into the Rust CLI
- PowerShell mirrors of those helper executables
- compatibility launchers under `compat/`
- markdown command aliases under `commands/`
- install migration commands intended to bridge legacy layouts

The result must be one public command family:

```text
featureforge <top-level-command> [subcommand] [flags]
```

No shipped or documented surface may require users to discover or invoke helper names beside `featureforge`.

Install packaging copies the real repo-root `bin/featureforge` binary into the installed runtime layout rather than synthesizing a separate wrapper-owned launcher contract.

### 3. Workflow Artifact Namespace

Active artifact contracts move from `docs/superpowers/*` to `docs/featureforge/*`.

Active discovery logic must follow this model:

```text
docs/
  featureforge/
    specs/
    plans/
    execution-evidence/
  archive/
    superpowers/
      specs/
      plans/
      execution-evidence/
      ...
```

The runtime must scan only the active `docs/featureforge/*` roots for authoritative workflow artifacts. Archived docs must be ignored even if they contain parseable headers or newer timestamps.

### 4. Runtime State and Environment

Active state moves from `~/.superpowers/` to `~/.featureforge/`, including:

- workflow manifests
- session-entry decisions
- config
- update-check cache and snooze state
- contributor logs or other local runtime state that remains part of the active product

Active environment variables and related config keys move to the `FEATUREFORGE_*` prefix. The new standalone product must not silently read from legacy env vars or state roots.

### 5. Distribution and Update Identity

The canonical repo slug, release metadata, installation instructions, and update-check source all move to the `FeatureForge` identity in the same change. The active runtime should not continue checking the legacy repo for version data or release artifacts.

Binary integrity guarantees must survive the rename. Any checked-in prebuilt binaries, manifest metadata, or checksum validation already used by the runtime or install packaging must be updated to the `featureforge` naming and remain part of the supported release contract after cutover.

### 6. Rename-Specific Artifact Completion

This spec and its implementation plan necessarily describe legacy paths in order to execute the cutover safely. To satisfy `REQ-011`, those rename-specific planning artifacts must not remain in the active `docs/featureforge/*` surface once the cutover and release handoff are complete.

The required completion behavior is:

- archive the rename spec and plan under `docs/archive/featureforge/`
- preserve them verbatim
- ensure active workflow discovery ignores that archive path
- treat the archive move as part of the done criteria for the cutover

## Interfaces and Dependencies

### User-Facing Interfaces

- CLI invocation: `featureforge ...`
- installation and upgrade docs
- release notes and version output
- skill IDs and install surfaces that expose the active product namespace
- skill and agent instructions that mention runtime commands or paths

### Internal Interfaces

- workflow artifact discovery and sync
- state path resolution
- update-check cache and remote version lookup
- packaging logic for checked-in binaries or release assets
- tests and snapshots that assert names, paths, and supported entrypoints

### External Dependencies

- Git hosting and raw file endpoints for version/update lookup
- release artifact publishing location
- local filesystem layout for install and runtime state

## Failure Modes and Edge Cases

The cutover must make each of the following visible and testable.

### Runtime failures

- If active workflow discovery is pointed at `docs/superpowers/*`, the runtime rejects those paths as inactive legacy locations instead of treating them as valid input.
- If runtime state exists only under `~/.superpowers/*`, the new product does not silently consume it as if migration had occurred.
- If a removed helper executable or markdown command alias is invoked from active docs or tests, the failure is explicit and the docs/tests must be fixed rather than papered over.
- If update-check configuration still points at the legacy repo, tests fail and release validation blocks.

For any invalid path, env, config, or command surface that reaches the active runtime:

- the runtime exits non-zero with a stable `FeatureForge` failure class
- the user-facing message names only the current supported `FeatureForge` command, path, or state surface
- the message does not mention migrations, renames, compatibility, or prior product names
- tests assert those failure classes and message shapes as part of the public contract

### Documentation failures

- If active docs outside the main `README.md` still contain the legacy name, forbidden-reference checks fail.
- If archived docs accidentally remain under active discovery roots, workflow tests fail.
- If the archive is referenced as active install or workflow guidance, doc validation fails.

### Packaging failures

- If shipped runtime directories still contain wrapper executables or compatibility aliases, packaging validation fails.
- If platform packaging still depends on a user-facing wrapper rather than the compiled binary, the cutover is incomplete.
- If renamed prebuilt binaries, manifests, or checksums drift out of sync, release validation fails.

### Interaction edge cases

- Fresh install with no prior local state
- Existing checkout with archived historical docs present
- Existing user shell aliases or scripts still calling removed helper names
- Local env still exporting `SUPERPOWERS_*`
- Update-check cache present under legacy state root only

The new product does not support compatibility behavior for these edge cases. It must instead fail with current-product `FeatureForge` errors, document only the current supported surface, and rely on the new install/runtime contract.

## Observability Expectations

The cutover needs explicit observability at the contract boundary:

- CLI smoke tests for `featureforge --help` and `featureforge --version`
- contract tests for active artifact roots and state roots
- archive-exclusion tests proving archived docs are ignored
- forbidden-reference checks over active files
- packaging checks proving no shipped shim entrypoints remain
- update-check tests proving the runtime targets the new canonical source
- contract tests proving invalid-surface failures use stable `FeatureForge` failure classes and current-product-only remediation text
- integrity checks proving renamed binaries, manifests, and checksums stay aligned

If any legacy active surface survives, the verification suite should produce a precise failing path or command name.

## Rollout Plan

The implementation should follow one bounded cutover release:

1. Rename active runtime/package/docs/state contracts to `FeatureForge`.
2. Move active authoritative workflow artifacts into `docs/featureforge/`.
3. Archive old branded historical docs verbatim under `docs/archive/...`.
4. Remove wrapper, compat, migration, and markdown shim surfaces.
5. Update packaging, release, and update-check identity.
6. Add and run contract verification proving only the new active surface remains.
7. Archive the rename-specific spec and plan under `docs/archive/featureforge/` as required by `REQ-012`.
8. Cut the first standalone release as `1.0.0`.

## Rollback Plan

Because this is a hard-cut rename, rollback is repo-level rather than compatibility-driven:

- revert the rename/reset change set before release if verification finds active-surface leakage
- do not add emergency compatibility aliases as a substitute for rollback
- if distribution metadata has already been published incorrectly, correct the release metadata and republish rather than keeping dual identities alive

## Risks and Mitigations

- Risk: active discovery or tests keep reading archived legacy docs by accident.
  Mitigation: add explicit archive-exclusion tests and fail-closed path validation.
- Risk: wrapper removal breaks packaging or platform startup unexpectedly.
  Mitigation: verify packaging from the compiled binary directly on each supported platform.
- Risk: legacy-name references survive in active docs, tests, or diagnostics.
  Mitigation: add forbidden-reference checks scoped to active non-archive files.
- Risk: update-check or release metadata keeps pointing at the legacy repo.
  Mitigation: add explicit tests for remote URL defaults and release docs.
- Risk: rename-specific planning artifacts themselves violate the final no-legacy-reference rule.
  Mitigation: make `REQ-012` a tracked implementation requirement rather than a deferred cleanup note.

## Acceptance Criteria

The work is complete only when all of the following are true:

1. `featureforge --help` and `featureforge --version` identify the product as `FeatureForge` and `1.0.0`.
2. Active package metadata, binary naming, docs, and diagnostics use `FeatureForge` / `featureforge`.
3. The repo exposes a real compiled `bin/featureforge` or `bin/featureforge.exe` binary as the canonical fixed-path runtime, and install packaging copies that binary.
4. No supported user-facing wrapper executables, compatibility launchers, migration commands, or markdown command shims remain.
5. Active workflow artifacts live under `docs/featureforge/`, and runtime discovery ignores archived docs.
6. Historical branded artifacts are preserved under a docs archive without rewrite.
7. Active runtime state and env/config naming use `~/.featureforge/` and `FEATUREFORGE_*` only.
8. Active skill IDs and install discovery links use the `featureforge` namespace, including `featureforge:<skill>`, `~/.featureforge/install`, `~/.agents/skills/featureforge`, and `~/.copilot/skills/featureforge`.
9. Update-check and release metadata point at the canonical `FeatureForge` distribution identity.
10. Active non-archive files contain no legacy-name references except the provenance attribution in `README.md`.
11. Verification proves the absence of legacy shims and the exclusion of archived artifacts from active behavior.
12. The rename-specific spec and plan are preserved under `docs/archive/featureforge/`, and the final active repository still satisfies `REQ-011`.

## ASCII Diagrams

### Identity Boundary

```text
active product boundary

  +------------------------- FeatureForge --------------------------+
  | binary: featureforge                                           |
  | docs:   docs/featureforge/*                                    |
  | state:  ~/.featureforge/*                                      |
  | env:    FEATUREFORGE_*                                         |
  | dist:   FeatureForge repo / releases / update source           |
  +---------------------------------------------------------------+

  +---------------------- archive only ----------------------------+
  | docs/archive/superpowers/*                                     |
  | preserved verbatim                                             |
  | never scanned as active workflow or install truth              |
  +---------------------------------------------------------------+
```

### Command Surface Simplification

```text
legacy model
------------
user
  -> helper wrapper
  -> compat launcher
  -> markdown shim
  -> runtime

target model
------------
user
  -> featureforge
       -> native subcommands
       -> runtime services
```

### Invalid-Surface Error Flow

```text
invalid command / path / env / config
              |
              v
     FeatureForge runtime validation
              |
      +-------+--------+
      |                |
      v                v
 supported         invalid surface
 surface              detected
      |                |
      v                v
 normal flow     stable failure class
                       |
                       v
        current-product remediation only
                       |
                       v
                 non-zero exit
```

### Deployment Sequence

```text
update Rust/package identity
            |
            v
materialize real bin/featureforge(.exe)
            |
            v
move active docs/state/contracts to featureforge namespace
            |
            v
archive historical Superpowers materials under docs/archive/*
            |
            v
remove wrappers, compat launchers, migration surfaces, shims
            |
            v
update install links, skill IDs, release/update identity
            |
            v
run contract, integrity, packaging, and forbidden-reference checks
            |
            v
archive rename-specific spec and plan after release handoff
```

### Rollback Flowchart

```text
verification or release issue detected
              |
              v
      before standalone release?
         /              \
       yes              no
       /                  \
      v                    v
revert cutover       correct release metadata
change set           and republish cleanly
      |                    |
      v                    v
do not add           do not keep dual identity
compat aliases
```

## CEO Review Summary

**Review Mode:** HOLD SCOPE
**Review Status:** Ready for explicit approval

### System Audit

- Branch `dm/rename` currently contains only this spec change.
- The repo still hard-codes the legacy identity across `bin/`, `compat/`, `commands/`, `docs/superpowers/`, `~/.superpowers/`, `SUPERPOWERS_*`, install links, and update-check defaults.
- Existing open TODOs are unrelated review/runtime follow-ups and do not block this cutover.

### Review Decisions Applied

- `1A` Archive the rename-specific spec and plan under `docs/archive/featureforge/` after release handoff.
- `2A` Invalid command/path/state/env/config surfaces fail with current-product `FeatureForge` failure classes and remediation only.
- `3B` The repo exposes a real compiled `bin/featureforge` or `bin/featureforge.exe` as the canonical fixed-path binary, and install packaging copies that exact binary.
- `4A` Active skill IDs and install discovery links fully cut over to the `featureforge` namespace.

### NOT in Scope

- Compatibility aliases or dual-name reads: rejected because the product should behave as if the prior project never existed.
- Migration/import flows from old installs or runtime state: rejected for the same reason.
- Rewriting archived historical docs: rejected because the archive should preserve history verbatim.
- New workflow stages or unrelated product redesign: rejected because they do not serve the rename/reset objective.

### What Already Exists

- A Rust CLI core already owns most runtime behavior, so the rename centers on identity and contract cleanup rather than a fresh runtime rewrite.
- Repo-visible markdown artifacts are already authoritative, so active artifact roots can be renamed without changing the approval model.
- Checked-in prebuilt binaries, manifest metadata, and checksum validation already exist, so binary-integrity behavior can be preserved under new names.
- Current install-link and skill-discovery patterns already exist, so the work is a namespace cutover, not a new install architecture.

### Dream State Delta

```text
CURRENT STATE                    THIS SPEC                     12-MONTH IDEAL
legacy-branded multi-surface --> hard-cut FeatureForge  --> stable single-binary
runtime with wrappers,           rename/reset with           FeatureForge toolkit
compat layers, old docs/state    archive boundaries and      with no active legacy
roots, and mixed authority       one canonical binary        identity surface
```

### Error & Rescue Registry

| Codepath | What Can Go Wrong | Failure Class | Rescue Action | User Sees |
| --- | --- | --- | --- | --- |
| Artifact discovery | Active path points outside `docs/featureforge/*` | `FeatureForgeInvalidArtifactPath` | Reject immediately | Current-product invalid-path error |
| State resolution | Runtime points at unsupported state/install root | `FeatureForgeInvalidStateSurface` | Reject immediately | Current-product supported-state guidance |
| Command dispatch | Removed shim or alias is invoked | `FeatureForgeInvalidCommandSurface` | Reject immediately | Current-product command guidance |
| Update-check config | Release/version source still targets old repo | `FeatureForgeInvalidDistributionConfig` | Block validation/release | Current-product distribution error |
| Packaging/integrity | Binary, manifest, or checksum drift | `FeatureForgeArtifactIntegrityMismatch` | Block packaging/release | Validation failure requiring artifact fix |

### Failure Modes Registry

| Codepath | Failure Mode | Rescued? | Test? | User Sees? | Logged? |
| --- | --- | --- | --- | --- | --- |
| Artifact discovery | Archived or invalid active path used | Y | Y | Explicit current-product error | Y |
| State resolution | Unsupported state/env/config surface used | Y | Y | Explicit current-product error | Y |
| Command dispatch | Removed wrapper or alias invoked | Y | Y | Explicit current-product error | Y |
| Update/release identity | Legacy repo or URL survives | Y | Y | Validation failure | Y |
| Packaging | Binary/checksum mismatch | Y | Y | Validation failure | Y |

### Stale Diagram Audit

- This spec's current ASCII diagrams are accurate after the review edits.
- The active product diagrams in `README.md` and any generated skill docs that currently show `superpowers` paths, install roots, or command names will become stale during implementation and must be updated as part of the cutover.

### Completion Summary

```text
+====================================================================+
|            MEGA PLAN REVIEW — COMPLETION SUMMARY                   |
+====================================================================+
| Mode selected        | HOLD SCOPE                                 |
| System Audit         | Legacy identity still spans runtime/docs   |
| Step 0               | Keep scope; lock cutover contracts now     |
| Section 1  (Arch)    | 3 issues found, 3 resolved                 |
| Section 2  (Errors)  | 5 error paths mapped, 0 CRITICAL GAPS      |
| Section 3  (Security)| 1 issue found, 0 High severity             |
| Section 4  (Data/UX) | CLI/install edge cases mapped, 0 unhandled |
| Section 5  (Quality) | 0 new issues after contract tightening     |
| Section 6  (Tests)   | Diagrams produced, 0 major gaps            |
| Section 7  (Perf)    | 0 material issues found                    |
| Section 8  (Observ)  | 0 major gaps after validation additions    |
| Section 9  (Deploy)  | 1 sequencing risk flagged and resolved     |
| Section 10 (Future)  | Reversibility: 4/5, debt items: 0          |
+--------------------------------------------------------------------+
| NOT in scope         | written (4 items)                          |
| What already exists  | written                                     |
| Dream state delta    | written                                     |
| Error/rescue registry| 5 codepaths, 0 CRITICAL GAPS              |
| Failure modes        | 5 total, 0 CRITICAL GAPS                  |
| TODOS.md updates     | 0 items proposed                           |
| Delight opportunities| n/a (HOLD SCOPE)                           |
| Diagrams produced    | 5 (system, error, deploy, rollback, cmd)   |
| Stale diagrams found | README/install diagrams pending impl       |
| Unresolved decisions | 0                                          |
+====================================================================+
```

### Unresolved Decisions

None.
