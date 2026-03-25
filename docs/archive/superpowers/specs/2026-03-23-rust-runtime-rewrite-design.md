# Superpowers Rust Runtime Rewrite

**Workflow State:** CEO Approved
**Spec Revision:** 4
**Last Reviewed By:** plan-ceo-review

## Summary

Rewrite the Superpowers runtime from shell-heavy helper scripts into one Rust application, while preserving the current markdown-authoritative workflow model, public command surface, authoritative repo-visible artifacts, and fail-closed behavior.

This is a replatforming project, not a shell port.

The existing runtime already behaves like a product-grade CLI with strict contracts, state machines, policy engines, and cross-platform wrappers. The Rust rewrite must therefore preserve the product contract and replace the implementation style:

- keep repo-visible markdown authoritative
- keep local helper state derived and rebuildable
- keep workflow, plan, execution, and repo-safety semantics conservative
- keep Bash and PowerShell entrypoint compatibility
- replace text scraping, shell orchestration, wrapper-side payload rewriting, and parser duplication with typed Rust services

The target end state is one shipped binary named `superpowers`, a library-backed command tree behind it, a cleaned-up canonical command surface, and a parity-first migration process enforced by differential tests.

The install experience should also become simpler: installing Superpowers skills on a supported platform should provision the matching checked-in prebuilt runtime binary from the repo `bin/` tree into the shared install root without requiring a local Rust toolchain or a local Cargo build.

## Problem

Superpowers has outgrown shell as its primary runtime language.

As of March 23, 2026, the current repository still presents a broad shell runtime surface under `bin/`, including:

- `superpowers-config`
- `superpowers-migrate-install`
- `superpowers-plan-contract`
- `superpowers-plan-execution`
- `superpowers-plan-structure-common`
- `superpowers-repo-safety`
- `superpowers-runtime-common.sh`
- `superpowers-session-entry`
- `superpowers-slug`
- `superpowers-update-check`
- `superpowers-workflow`
- `superpowers-workflow-status`
- PowerShell wrappers for most public helpers

The core helpers are not tiny shell shims anymore. The current tree contains:

- `bin/superpowers-plan-execution`: about 3,508 lines
- `bin/superpowers-plan-contract`: about 1,840 lines
- `bin/superpowers-workflow-status`: about 1,597 lines
- shared runtime and wrapper logic split across `superpowers-runtime-common.sh`, `superpowers-plan-structure-common`, and `superpowers-pwsh-common.ps1`

The regression burden is correspondingly large:

- `tests/codex-runtime/` exercises workflow routing, plan contracts, execution, repo safety, wrapper behavior, and session entry
- `tests/brainstorm-server/`, `tests/evals/`, and `scripts/*.mjs` sit adjacent to the runtime and must keep working around it

This creates five concrete problems.

### 1. The runtime contract is larger than shell is good at expressing

The current helpers enforce:

- exact markdown header contracts
- requirement and coverage parsing
- execution-state invariants
- protected-branch approval semantics
- manifest identity and repair rules
- path normalization and instruction discovery
- structured JSON output with stable reason codes

Those are typed-domain problems. Shell can implement them, but it makes correctness, refactoring, and reuse expensive.

### 2. Shared logic is split across Bash, PowerShell, and wrapper glue

Today the same business logic is spread across:

- Bash helpers
- shared `.sh` libraries
- shared `.ps1` libraries
- wrapper-specific path rewriting
- tests that must account for shell-specific edge behavior

That increases parity risk and makes Windows support more fragile than it should be.

### 3. Parsing is stricter than the implementation model

Superpowers deliberately treats specs, plans, execution evidence, and approval records as strict contracts. Shell implementation forces that strictness through:

- `sed`
- `awk`
- `grep`
- exact-line parsing
- text normalization helpers

That is workable, but it is difficult to evolve confidently and easy to make platform-sensitive.

### 4. Error handling and diagnostics are limited by the implementation medium

The product contract already wants:

- named failures
- structured diagnostics
- conservative downgrade behavior
- deterministic packet and fingerprint generation

Shell can emit those strings, but it cannot model them cleanly. That leads to incidental complexity such as wrapper-side payload adaptation and repeated parsing branches.

### 5. Release and packaging are harder than necessary

The current runtime shape implies:

- many public helper names
- platform-specific wrappers
- install migration logic
- update-check behavior

That is a natural fit for a single compiled CLI plus alias entrypoints. It is a poor fit for indefinitely growing shell surface area.

## Why This Matters

Superpowers is strongest when the workflow is strict, explainable, and auditable:

- repo markdown says what is approved
- helpers derive the current state from repo truth
- malformed or stale state fails closed
- public inspection surfaces never overstate readiness

That philosophy is already correct. The implementation medium is the weak point.

If the runtime keeps growing in shell:

- contract drift becomes more likely
- PowerShell parity stays expensive
- every new helper law pays a higher maintenance tax
- packaging and distribution remain awkward
- the runtime becomes harder to reason about than the workflow it is supposed to enforce

The rewrite is therefore about reliability, maintainability, and authority preservation, not about language preference.

## Goals

- Replace the shell runtime in `bin/` with one Rust-based CLI while preserving the existing public command surface.
- Preserve the current authority model: approved markdown remains authoritative and local state remains derived.
- Prefer a cleaned-up canonical `superpowers ...` command surface and avoid turning shell-era helper names into a new long-term public contract.
- Preserve current workflow states, reason codes, failure classes, packet semantics, approval semantics, and evidence semantics unless an explicit compatibility exception is documented.
- Preserve current stable output conventions, including default human-vs-machine mode behavior, stdout and stderr routing, machine-readable field shapes, and snapshot-backed human-readable summaries, unless an explicit compatibility exception is documented.
- Clean up helper-owned local state file formats and internal layout in the Rust cutover where doing so removes shell-era baggage, while keeping repo-visible markdown authority unchanged and retaining `~/.superpowers/` as the local runtime root.
- Keep helper-owned runtime state file-based and human-inspectable under `~/.superpowers/` rather than introducing a local database as part of the rewrite.
- Centralize parsing, normalization, policy, and rendering in one typed Rust library behind the CLI.
- Make Bash and PowerShell behavior converge on one core implementation instead of parallel business logic.
- Replace wrapper-side JSON rewriting with native platform-aware output from the Rust core.
- Move machine-readable outputs onto typed `serde` models with versioned schemas.
- Port the shell-heavy compatibility suite into Rust integration coverage while keeping a small wrapper smoke layer.
- Make release packaging first-class for macOS arm64 and Windows x64 in the cutover release, with Linux packaging as a follow-on target rather than a first-release blocker.
- Make the normal skills installation flow provision the matching checked-in prebuilt runtime binary from the repo `bin/` tree into `~/.superpowers/install/` instead of expecting users to build from source.

## Not In Scope

- Changing Superpowers' product philosophy or moving workflow authority out of repo-visible markdown
- Replacing specs, plans, or execution evidence with a database or service
- Turning the public workflow CLI into a mutating approval authority
- Rewriting Node-only areas such as the brainstorm server, eval harnesses, or `.mjs` generators as part of the initial runtime cutover
- Shipping many new Rust binaries that recreate the current helper-per-file fragmentation
- Preserving shell implementation techniques such as text-scraped JSON, `awk` config mutation, wrapper-side path rewriting, or `ls -t` artifact discovery as product requirements
- Re-approving historical specs or plans solely because the runtime implementation changed
- Expanding browser QA into a universal gate

## Success Criteria

The rewrite is successful when all of the following are true in one release:

1. The installed runtime ships one primary binary named `superpowers`.
2. Repo-owned callers, docs, tests, and install surfaces use the canonical `superpowers ...` command tree by the time of the Rust cutover.
3. Current authoritative markdown artifacts continue to route to the same workflow decisions unless a documented compatibility exception says otherwise.
4. Current runtime tests, or their Rust replacements, pass against the new runtime.
5. No platform keeps a wrapper-owned supported surface after cutover; Windows invokes the Rust binary directly just like other supported platforms.
6. JSON outputs come from typed Rust models and have checked-in schema files.
7. Stable command families preserve their current default output modes, stdout and stderr routing, and reviewed human-readable and machine-readable output shapes unless an explicit compatibility exception says otherwise.
8. The public CLI remains read-only where it is read-only today.
9. Historical workflow artifacts remain readable.
10. Checked-in prebuilt binaries and integrity metadata exist under `bin/prebuilt/` for the first-release targets, and a fresh skills installation on those targets provisions the matching repo binary into the shared install root without local compilation.
11. The installed runtime does not ship helper-style executable names after the Rust cutover; any exceptional retained shim must be explicitly justified in `compat/exceptions.md`.
12. Helper-owned local state migrates deterministically into a cleaned-up Rust layout rooted under `~/.superpowers/`, with backup, validation, and rollback coverage.

## Affected Surfaces

The rewrite directly affects these surfaces:

- all public helper entrypoints under `bin/`
- `bin/superpowers-runtime-common.sh`
- `bin/superpowers-plan-structure-common`
- `bin/superpowers-pwsh-common.ps1`
- PowerShell wrappers under `bin/*.ps1`
- runtime docs in `README.md`, `docs/README.codex.md`, `docs/README.copilot.md`, `docs/testing.md`, and release notes
- runtime regression coverage under `tests/codex-runtime/`
- install/update/migration flows that assume shell helpers

The rewrite must explicitly catalog, but does not need to block on, these adjacent surfaces:

- deprecated `commands/*.md` shims
- `tests/brainstorm-server/`
- `tests/evals/`
- `scripts/*.mjs`

## Current-System Findings

### Runtime shape

The README is explicit that six layers matter:

- `superpowers-session-entry`
- `using-superpowers`
- `superpowers-workflow-status`
- `superpowers-repo-safety`
- `superpowers-plan-contract`
- `superpowers-plan-execution`

That layer model is correct and must survive the rewrite.

### Authority model

The README is equally explicit that:

- approved spec truth lives in repo-visible spec headers
- approved plan truth lives in repo-visible plan headers
- execution truth lives in the approved plan and evidence artifacts
- the branch-scoped workflow manifest under `~/.superpowers/projects/.../workflow-state.json` is a rebuildable index, not approval authority

That is the right source-of-truth hierarchy and must not change.

### Current pain points worth fixing

- duplicate parsing and normalization logic across Bash and PowerShell
- shell-native string and path handling for correctness-sensitive contracts
- fragile platform adaptation in wrappers instead of in the core runtime
- command fan-out that reflects implementation history more than product intent
- difficulty expressing typed diagnostics, fingerprints, and state transitions cleanly

### Strengths worth preserving

- conservative routing
- strict markdown contracts
- explicit workflow states
- derived local state instead of hidden approval state
- small public mental model despite internal complexity

## Landscape Snapshot

### Layer 1

The repo already provides the most important architectural answers:

- the runtime is a layered state machine, not a prompt bundle
- markdown artifacts are authoritative
- local helper state is rebuildable
- helper behavior is intentionally strict and fail-closed
- the compatibility surface is defined by tests, wrappers, and README-described workflows

That means the rewrite should not search for a new product model. The repo-native model is already correct.

### Layer 2

The Rust ecosystem supports this rewrite well:

- `clap` is the standard choice for a nested CLI with alias-friendly dispatch and strong help-text generation
- `gix` is an application-facing Git API hub and is a better long-term base than shelling out to `git` for every identity and path question
- `assert_cmd`, `insta`, `proptest`, `cargo-nextest`, and `cargo-llvm-cov` line up well with the existing compatibility-heavy test posture
- `cargo-dist` or equivalent cross-target packaging tooling matches the requirement to build deterministic prebuilt binaries for the supported targets, even when the repo itself is the normal installation source
- `serde_yaml` is archived and explicitly unmaintained, so config parsing should avoid it in favor of a maintained YAML path or a deliberately narrow schema parser

The practical lesson is that the runtime can move to mainstream, well-supported Rust tooling without inventing bespoke infrastructure.

### Layer 3

For this repo specifically, the best move is:

- one binary, not many
- one core library, not helper-specific islands
- typed parsers around the existing markdown contracts
- compatibility preserved at the command boundary, not at the shell-implementation boundary
- differential testing used as a guardrail, not as the only truth source

### Eureka

The right migration unit is not "one script at a time." The right migration unit is "one contract surface at a time," because the real product is the contract shared across helpers, wrappers, docs, and tests.

## Architecture Boundary

The rewrite must preserve the current authority split.

Authority stays in repo-visible artifacts:

- approved specs define product and workflow intent
- approved plans define execution decomposition
- approved execution evidence and late-stage artifacts define proof of work state

The Rust runtime becomes a derived enforcement layer:

- it parses authoritative markdown
- it normalizes and validates runtime inputs
- it emits structured diagnostics and human-readable explanations
- it persists only rebuildable helper state
- it never becomes a second approval authority

## Dream State Delta

```text
CURRENT
- many shell entrypoints over shared shell libraries
- strict contracts enforced through text parsing
- platform differences handled partly in wrappers
- helper law split across Bash and PowerShell

TARGET
- one Rust binary with subcommands and alias dispatch
- strict contracts enforced through typed parsers and validators
- platform differences handled in the core runtime
- wrappers reduced to invocation transport
```

## Design Principles

### 1. Replatform, do not transliterate

The Rust rewrite must port behavior and contracts, not shell control flow. Translating a long shell script into a long Rust function would preserve the wrong boundary.

### 2. One binary, many verbs

Superpowers should ship one executable and many command verbs. Compatibility names are part of the public surface, not a reason to ship many binaries.

### 3. Preserve public contracts, replace implementation accidents

Preserve:

- command names
- subcommands and flags
- workflow state names
- reason codes and failure classes
- repo-visible authoritative artifact shapes and user-visible semantics that current workflows rely on
- packet and evidence semantics

Replace:

- text-scraped JSON
- wrapper-side payload mutation
- `awk` and `sed` contract parsing
- platform-conditional shell tricks
- listing-order artifact discovery

### 4. Fail closed everywhere

If the shell runtime currently routes conservatively on malformed, stale, ambiguous, or mismatched state, the Rust runtime must do the same.

### 5. No silent drift

Any intentional behavior difference from the legacy runtime must be written to `compat/exceptions.md` before release, including:

- old behavior
- new behavior
- reason for the change
- tests that pin the new behavior

### 6. Typed models at every contract boundary

Anything emitted as JSON, stored as approval or manifest state, or validated as a workflow contract must have a typed Rust representation.

## Scope

### Hard In-Scope

- every public shell helper in `bin/`
- shared runtime shell and PowerShell libraries
- PowerShell public wrappers
- the shell-heavy runtime regression suite
- install, config, update, and migration behavior that is part of the current runtime contract
- release packaging for supported targets

### Soft In-Scope

- compatibility shims for deprecated command docs
- runtime documentation updates
- fixture and snapshot refresh work needed by the parity harness

### Adjacent But Not Blocking

- Node brainstorm server tests
- eval infrastructure
- `.mjs` generators that are not part of the runtime contract

Those adjacent areas must be inventoried during planning so they do not become orphaned, but they should not block the shell-to-Rust runtime cutover.

## Source-Of-Truth Hierarchy

When legacy shell behavior conflicts with the desired Rust behavior, use this decision order:

1. Explicit workflow and product contract in `README.md` and shipped docs
2. User-visible tests and fixtures
3. Differential output from the legacy shell runtime on a curated corpus
4. Legacy shell source, only as fallback

This hierarchy prevents the rewrite from freezing shell bugs into Rust merely because the shell did something first.

## Target Public Surface

The canonical workflow surface of the Rust runtime is one command family under `superpowers workflow`.

There is no long-term public or internal split between `superpowers-workflow` and `superpowers-workflow-status` after the rewrite. If those names exist at all during migration, they are temporary shims into the canonical `superpowers workflow ...` tree and may not evolve as distinct workflow contracts.

The public surface of the Rust runtime is:

```text
superpowers workflow status|resolve|expect|sync
superpowers plan contract lint|analyze|packet build
superpowers plan execution status|recommend|preflight|gate-review|gate-finish|begin|transfer|complete|note|reopen
superpowers repo-safety check|approve
superpowers session-entry resolve|record
superpowers repo slug
superpowers config get|set|list
superpowers update-check
superpowers install migrate
```

If short-lived development shims are needed before the cutover commit lands, the expected mappings are:

- `superpowers-workflow` -> `superpowers workflow`
- `superpowers-plan-contract` -> `superpowers plan contract`
- `superpowers-plan-execution` -> `superpowers plan execution`
- `superpowers-repo-safety` -> `superpowers repo-safety`
- `superpowers-session-entry` -> `superpowers session-entry`
- `superpowers-workflow-status` -> `superpowers workflow`
- `superpowers-slug` -> `superpowers repo slug`
- `superpowers-config` -> `superpowers config`
- `superpowers-update-check` -> `superpowers update-check`
- `superpowers-migrate-install` -> `superpowers install migrate`

The implementation mechanism may be:

- `argv[0]` dispatch from the same binary
- symlinks or hardlinks on Unix-like systems
- tiny shell or PowerShell wrappers where symlinks are undesirable

The release contract should assume these shim names are removed from normal repo-owned use and from the installed runtime surface by the cutover itself.

## Migration Compatibility Model

Compatibility is a first-class deliverable, not cleanup work.

### Compatibility guarantees

During implementation, preserve for any short-lived shim that still exists:

- argument meaning
- default output mode and machine-readable selector behavior
- stdout shape and stable human-readable section ordering where the current contract already depends on it
- stderr routing
- exit-code behavior
- current-working-directory semantics
- environment-variable semantics where the current runtime already relies on them
- any legacy-to-Rust local-state migration behavior that the cutover still needs during transition

### Compatibility non-goals

The rewrite does not need to preserve:

- shell-era helper names as a permanent public API
- shell-era helper-owned local-state paths or file shapes
- shell implementation internals
- subprocess layout between helpers
- wrapper-owned JSON rewrites
- incidental output ordering that exists only because a shell command listed files in that order and the tests do not depend on it

### Compatibility decision log

Every intentional compatibility break must be logged in `compat/exceptions.md` with:

- legacy behavior
- Rust behavior
- reason for the difference
- rollout notes
- the tests or fixtures that pin the decision

### Migration matrix

```text
Legacy shim, if still needed       Canonical Rust command
superpowers-workflow               superpowers workflow ...
superpowers-workflow-status        superpowers workflow status|resolve|expect|sync
superpowers-plan-contract          superpowers plan contract lint|analyze|packet build
superpowers-plan-execution         superpowers plan execution ...
superpowers-repo-safety            superpowers repo-safety check|approve
superpowers-session-entry          superpowers session-entry resolve|record
superpowers-slug                   superpowers repo slug
superpowers-config                 superpowers config get|set|list
superpowers-update-check           superpowers update-check
superpowers-migrate-install        superpowers install migrate
```

## Installed Layout

Installed runtime layout should become:

```text
~/.superpowers/install/
  bin/
    superpowers[.exe]
    direct platform-native invocation of `superpowers`
  artifacts/
    optional installer-managed cache of copied binaries or integrity metadata
```

Rules:

- only one native compiled binary is shipped
- the normal skills installation flow provisions the host-matching checked-in prebuilt binary into this install root
- helper-style executable names are not installed after cutover
- Windows invokes `superpowers.exe` directly; `.ps1` wrappers are not part of the post-cutover supported install surface
- missing-binary failure must be crisp and actionable

## Repo-Tracked Binary Layout

The source repo should carry the supported checked-in runtime binaries under `bin/prebuilt/` so skills installation can provision them without fetching a remote artifact.

```text
bin/
  prebuilt/
    darwin-arm64/
      superpowers
    windows-x64/
      superpowers.exe
```

Rules:

- these binaries are committed directly to the repo for the supported first-release targets
- Git LFS is not part of the normal installation assumption for these binaries
- skills installation selects the host-matching binary from this tree and installs it into `~/.superpowers/install/bin/`
- checked-in checksum or integrity metadata should live alongside this tree so installation can verify what it copies without contacting a release service

## Wrapper Contract

If launchers or wrappers exist during migration, they are transitional only and not part of the intended post-cutover install surface.

Wrappers may:

- locate the compiled binary
- pass arguments through unchanged
- preserve stdin, stdout, stderr, and exit status
- print a concise missing-binary error when the core executable is unavailable

Wrappers may not:

- parse or transform JSON payloads
- rewrite file paths inside machine-readable output
- apply business logic
- implement fallback behavior that diverges from the Rust core

The missing-binary path must still be tested where migration wrappers exist, but the intended steady state after cutover is direct binary invocation.

## Proposed Repository Layout

The rewrite should prefer one package and one main library crate at the repo root, not a feature-per-crate explosion.

```text
superpowers/
  Cargo.toml
  rust-toolchain.toml
  .cargo/config.toml
  src/
    main.rs
    lib.rs
    cli/
    compat/
    diagnostics/
    output/
    paths/
    git/
    instructions/
    workflow/
    contracts/
      spec.rs
      plan.rs
      packet.rs
      evidence.rs
    repo_safety/
    session_entry/
    config/
    update_check/
    install/
  compat/
    bash/
    powershell/
  schemas/
  tests/
    integration/
    fixtures/
    snapshots/
    differential/
```

If helper crates are later added for tooling convenience, they must not fracture the runtime boundary or create multiple shipped binaries.

## Internal Architecture

### Core Modules

- `cli`: top-level `clap` command tree and alias resolution
- `compat`: optional migration shims and wrapper-facing behaviors
- `diagnostics`: typed diagnostics, reason codes, failure classes, and rendering helpers
- `output`: human renderers, JSON serializers, and schema support
- `paths`: repo-relative normalization, scoped path parsing, and path rendering
- `git`: repo discovery, branch identity, remote slug derivation, detached-HEAD handling
- `instructions`: instruction-chain discovery and protected-branch rule parsing
- `workflow`: artifact discovery, manifest persistence, state routing, and `expect` or `sync`
- `contracts::spec`: spec headers, requirement index parsing, and validation
- `contracts::plan`: plan headers, task grammar, coverage matrix parsing, and validation
- `contracts::packet`: task-packet generation and packet fingerprinting
- `contracts::evidence`: execution evidence parsing, rendering, and provenance
- `repo_safety`: protected-branch policy engine, approvals, and scope fingerprints
- `session_entry`: session decision storage and resolution
- `config`: typed config IO and schema enforcement
- `update_check`: version resolution, cache, snooze, disable semantics, and HTTP fetches
- `install`: install migration and shared-install validation

### Shared Types

The rewrite must center on shared typed primitives instead of helper-local string conventions.

Important primitives include:

- `RepoPath`
- `ArtifactPath`
- `ArtifactFingerprint`
- `WorkflowStatus`
- `WorkflowDiagnostic`
- `RequirementId`
- `TaskNumber`
- `ExecutionMode`
- `StepState`
- `GateOutcome`
- `ApprovalScope`
- `ApprovalFingerprint`
- `SessionDecision`

These types should be reused across commands so the runtime cannot silently diverge by subsystem.

### Module Dependency Graph

```text
cli / compat
    |
    v
command services
    |
    +--> paths
    +--> git
    +--> instructions
    +--> workflow
    +--> contracts::{spec, plan, packet, evidence}
    +--> repo_safety
    +--> session_entry
    +--> config
    +--> update_check
    +--> install
    |
    v
output / diagnostics
```

Dependency rule:

- domain modules may depend on lower-level primitives such as `paths`, `diagnostics`, and `output` contracts
- wrappers and CLI parsing may depend on domain modules
- domain modules must not depend on wrappers
- one domain module should not call another through subprocess boundaries

### Core Runtime Flow

```text
user invokes binary or alias
        |
        v
argv0 compatibility resolution
        |
        v
clap parses canonical command tree
        |
        v
typed service executes against repo + helper state + markdown artifacts
        |
        +--> typed diagnostics
        +--> typed JSON output
        +--> deterministic human rendering
        +--> atomic state writes where needed
```

## Functional Design

### 1. CLI and Dispatch

Use `clap` for the command tree.

The CLI must support:

- modern nested commands under `superpowers`

Optional legacy shim dispatch via `argv[0]` may exist during migration, but it is not a release requirement.

The dispatch rules are:

1. If invoked as `superpowers`, parse the full nested command tree.
2. If a temporary legacy shim is still present, map that alias to the canonical nested command and parse the remaining arguments under that subtree.
3. Emit the same exit codes, stdout, and stderr regardless of invocation path while shims exist.

Additional dispatch rules:

- alias resolution happens before command validation so help text and error messages still reflect the canonical command tree
- `--help` and `--version` must behave sensibly from both canonical commands and any temporary shim paths
- unknown subcommands and flag errors must remain deterministic regardless of invocation path

### 2. Paths and Identity

`RepoPath` must become a first-class type.

It preserves the current normalization rules:

- reject absolute POSIX paths
- reject Windows drive-absolute paths
- reject UNC-style paths
- reject `..` traversal
- convert backslashes to `/`
- collapse `.` and empty segments
- store normalized repo-relative form

This type must be used everywhere path identity matters:

- workflow manifests
- spec and plan references
- task `Files` blocks
- repo-safety approval scopes
- packet provenance
- diagnostics that reference repo artifacts

Absolute filesystem paths may still be emitted where the contract truly requires them, but repo-internal identity must use normalized repo-relative paths.

Path rendering rules:

- internal comparisons use normalized repo-relative paths
- JSON that represents repo-scoped identity uses normalized repo-relative paths unless a current contract explicitly requires native absolute paths
- human-readable diagnostics may include both normalized repo-relative and host-native absolute paths when that improves remediation
- all persisted fingerprints that incorporate paths must use normalized repo-relative form to avoid platform drift

### 3. Instruction Discovery

Preserve the current instruction-chain discovery order:

1. root `AGENTS.md`
2. root `AGENTS.override.md`
3. root `.github/copilot-instructions.md`
4. root `.github/instructions/*.instructions.md`
5. nested `AGENTS.md` and `AGENTS.override.md` from repo root down to the working directory

Malformed instruction entries that currently fail closed must continue to fail closed.

Instruction parsing must surface:

- parse location
- failure class
- whether the failure blocks all writes or only protected-branch evaluation
- remediation text that points the user to the malformed file

### 4. Workflow Engine

`superpowers workflow` owns a typed workflow state machine in Rust.

The legacy `superpowers-workflow-status` name becomes a compatibility alias into that command family, not a separately documented helper contract.

Preserved workflow states:

- `needs_brainstorming`
- `spec_draft`
- `spec_approved_needs_plan`
- `plan_draft`
- `stale_plan`
- `implementation_ready`

Preserved behavior:

- conservative downgrade on malformed artifacts
- structured diagnostics on ambiguity
- manifest remains derived
- `expect` records intended paths before an artifact exists
- `sync` reparses the real artifact and updates manifest state

Replaced implementation details:

- no `ls -t` or implicit shell listing order
- no ad hoc JSON assembly
- no manifest writes without atomic temp-file-and-rename

The workflow engine must use:

- deterministic artifact ranking
- explicit ambiguity detection
- manifest repair that backs up corrupt files with a timestamped suffix
- advisory file locking for manifest writes

The status command must continue to emit:

- human-readable summaries
- JSON output with schema versioning
- legacy `reason` strings where currently required for compatibility

Command-level behavior:

- `status` reads current repo truth and returns the derived workflow state
- `resolve` remains the structured routing-oriented variant if current callers rely on it
- `expect` validates and stores the intended future artifact path before the artifact exists
- `sync` reparses the named artifact, updates the manifest, and returns the derived state rooted in the actual file on disk
- any temporary `superpowers-workflow` and `superpowers-workflow-status` shims must dispatch to these same implementations rather than maintaining separate workflow logic

Artifact resolution rules:

- prefer manifest-expected path when it exists and is still valid
- fall back to deterministic bounded scans only when necessary
- report ambiguity explicitly with candidate counts and diagnostics
- never auto-pick one artifact from an ambiguous set just because it sorts first

Workflow manifest model:

- manifest schema version
- repo identity
- branch identity
- expected spec path
- expected plan path
- last derived status
- last successful sync timestamps or equivalent helper metadata
- corruption-recovery metadata where the current runtime already persists it or where new helper-only metadata is required for safe repair

### 5. Spec and Plan Contract Parsing

The spec and plan documents are not generic markdown. They are strict workflow DSLs embedded inside markdown files.

The Rust parser must therefore be multi-stage:

1. raw file reader with stable line preservation
2. exact header parser
3. section splitter
4. typed DSL parser for requirement index, coverage matrix, tasks, files, and steps
5. cross-document validator
6. deterministic renderer for packets and diagnostics

#### Spec contract requirements

Preserve and validate:

- exact workflow header lines
- `Requirement Index`
- stable requirement IDs
- exact-match references used by planning and routing

#### Plan contract requirements

Preserve and validate:

- exact workflow header lines
- `Execution Mode`
- `Source Spec`
- `Source Spec Revision`
- canonical `## Task N:` headings
- required sections such as `Spec Coverage`, `Task Outcome`, `Plan Constraints`, `Open Questions`, and `Files`
- step checklists and numbering rules
- overlapping write-scope analysis

`superpowers plan contract` keeps:

- `lint`
- `analyze`
- `packet build`

It must become a library-backed command, not a subprocess that other runtime pieces shell out to.

Parser design rules:

- retain enough source location information to point diagnostics at exact headers, sections, or task lines
- separate parse errors from validation errors so the runtime can explain whether a file is malformed or merely contract-invalid
- preserve exact-match semantics for headers that the current workflow treats as regex-parsed contract law
- treat line-ending normalization as an implementation detail, not as a reason to reject otherwise valid artifacts

Recommended internal split:

```text
lexer / line index
    -> header parser
    -> section map
    -> typed document AST
    -> cross-document validator
    -> renderer / packet builder
```

### 6. Task Packet Generation

Packet generation must be deterministic and versioned.

Each packet must carry explicit provenance:

- plan path
- plan revision
- plan fingerprint
- source spec path
- source spec revision
- source spec fingerprint
- task number
- task title
- packet fingerprint
- generation timestamp

The packet format remains markdown-compatible where the current runtime expects markdown, but the source of truth for packet construction becomes a typed AST plus a single renderer.

Packet builder rules:

- packet fingerprints change only when semantically relevant packet content changes
- renderer output is deterministic with stable section ordering
- packet provenance is embedded both in machine-readable JSON views and in rendered markdown where current workflows expect visible provenance
- packet generation failures are diagnosable per task, not only at whole-plan scope

### 7. Plan Execution Engine

`superpowers plan execution` is the hardest subsystem and must be modeled explicitly.

The Rust design must preserve the current command family:

- `status`
- `recommend`
- `preflight`
- `gate-review`
- `gate-finish`
- `begin`
- `transfer`
- `complete`
- `note`
- `reopen`

The design must preserve the current execution invariants:

- one active step at a time
- at most one parked interrupted step
- checked steps do not keep stale execution notes
- blocked work halts forward execution
- fresh approved plan revisions start execution-clean
- review and finish gates fail closed when provenance diverges

Execution mutations should use compare-and-swap semantics over a persisted execution fingerprint so callers cannot accidentally mutate stale state.

Execution evidence must be treated as a typed contract, not appended free-form text. The renderer can still produce markdown, but the runtime should manipulate a structured model.

Execution state model should explicitly represent:

- current approved plan identity
- current execution mode
- active step
- interrupted step, if any
- blocked state, if any
- checked-step evidence linkage
- last mutation fingerprint
- plan or evidence divergence diagnostics

Execution flow:

```text
approved plan
    |
    v
status / recommend / preflight
    |
    v
begin -> note|transfer|complete|reopen
    |
    v
updated plan + evidence + execution fingerprint
    |
    v
gate-review -> gate-finish
```

Execution evidence v1 and v2 handling:

- the Rust runtime must read legacy evidence shapes where current tests require it
- any new mutation path may rewrite into the canonical Rust-rendered format once compatibility rules allow
- warnings for legacy evidence should be explicit and machine-readable where feasible

Mutation safety rules:

- mutation commands must reject stale fingerprints
- mutation commands must refuse to act on a different approved plan revision than the one they inspected
- complete and reopen flows must update both checklist state and evidence provenance consistently or fail the mutation

### 8. Repo Safety

`superpowers repo-safety` should become a typed policy engine with explicit inputs and outputs.

Preserve:

- `check`
- `approve`
- protected-branch detection
- instruction-derived protected-branch rules
- deterministic approval fingerprinting
- failure classes such as `ProtectedBranchDetected`, `ApprovalFingerprintMismatch`, `ApprovalScopeMismatch`, and `InstructionParseFailed`

The Rust runtime must own path rendering on every platform.

That means:

- PowerShell wrappers stop rewriting `approval_path`
- Windows-specific path presentation comes from the Rust core
- repo-relative path identity stays normalized and platform-agnostic inside the core

Approval record model should include:

- repo identity
- branch identity if relevant to the current contract
- stage
- task id
- normalized path set
- write-target set
- approval fingerprint
- human reason text
- timestamp

Repo-safety decisions must remain deterministic for the same normalized input scope.

Legacy repo-safety approval records should migrate forward through the Rust cutover when the runtime can parse and rewrite them safely into the new helper-owned state layout. Cutover should not invalidate existing approvals by default.

### 9. Session Entry

Keep the session-decision file intentionally small:

- `enabled`
- `bypassed`

Preserve current semantics:

- missing or malformed state yields `needs_user_choice`
- explicit re-entry can upgrade a bypassed session back to enabled
- `resolve` and `record` remain public subcommands

The canonical post-cutover decision path should move into the stable session-entry subsystem at `~/.superpowers/session-entry/using-superpowers/<ppid>`. The legacy `~/.superpowers/session-flags/using-superpowers/<ppid>` path is migration input, not the long-term canonical location.

Use atomic writes and lightweight locking because correctness matters more than micro-optimizing this tiny path.

Resolution algorithm:

```text
read decision file
    |
    +--> missing -> needs_user_choice
    +--> malformed -> needs_user_choice + failure class
    +--> enabled -> enabled
    +--> bypassed + explicit re-entry -> enabled
    +--> bypassed without re-entry -> bypassed
```

### 10. Repo Slug

Preserve exact slug behavior:

- derive repo slug from git identity
- sanitize the branch
- emit detached HEAD as `current`
- emit only `SLUG` and `BRANCH`
- do not revive removed outputs such as `SAFE_BRANCH`

### 11. Config

Preserve config semantics and `get|set|list`, but do not treat `~/.superpowers/config.yaml` as a required long-term file shape.

The implementation changes are:

- typed config schema
- explicit key validation
- atomic writes
- maintained YAML parser choice

The rewrite should migrate config into the stable config subsystem path `~/.superpowers/config/config.yaml`, with one-time migration, backup, validation, and rollback rules from the legacy root-level file.

The rewrite must keep migrated config YAML on disk. It must not depend on archived YAML infrastructure, and the final parser crate can be finalized in planning only within a maintained YAML-based path that enforces a narrow accepted schema.

Config rules:

- preserve current config semantics unless a documented compatibility exception says otherwise
- keep YAML as the on-disk config format after migration rather than redesigning config storage during this rewrite
- use `~/.superpowers/config/config.yaml` as the canonical post-cutover config path
- reject unsupported YAML features explicitly instead of partially accepting them
- list output should be deterministic and stable for snapshot testing

### 12. Update Check

Preserve current update-check behavior:

- `JUST_UPGRADED`
- `UPGRADE_AVAILABLE`
- `UP_TO_DATE`
- cache
- snooze
- disable via config

Reimplement with:

- typed cache structs
- `semver` comparison
- blocking HTTP client suitable for a CLI
- deterministic output rules

Update-check state model should include:

- installed version
- last checked time
- cached latest version
- snooze-until time or disabled state
- just-upgraded marker where current behavior exposes it

Network rules:

- the command must behave deterministically when offline or when the update source returns malformed data
- cached negative or malformed states must not leave the runtime in a misleading "healthy" state
- the command must continue to respect config-based disable and snooze semantics before making avoidable network calls

### 13. Install Migration

Fold migrate-install into `superpowers install migrate`.

`superpowers install migrate` should also own any explicit cutover-time migration of non-rebuildable helper-owned local state that cannot be handled safely through lazy rebuild.

Preserve:

- shared-install validation
- legacy-install detection
- invalid-install backup
- ambiguous-install refusal behavior

Install migration rules:

- the migration command must be idempotent when rerun against an already-correct install
- invalid legacy installs should be backed up, not silently deleted
- when more than one plausible legacy install exists, the command must stop with an explicit ambiguity diagnostic instead of guessing
- when non-rebuildable helper-owned local state needs explicit migration, that migration should be orchestrated from this command rather than from a separate public migration surface
- while explicit migration is still pending, read-only and diagnostic commands may continue only with explicit warning state; mutation paths and any command that depends on migrated non-rebuildable state must fail closed with remediation to run `superpowers install migrate`
- parseable legacy repo-safety approval records should be migrated forward rather than invalidated by default
- if a legacy approval record cannot be migrated safely, the command should back it up, report the failure explicitly, and require a fresh approval only for that unreadable or unmigratable record

## Artifact And State Inventory

The rewrite should document helper-owned state explicitly so planning can treat each artifact as a contract with an owner.

Because the project is not public yet and the rewrite is intentionally cleaning local runtime state, these helper-owned artifacts are eligible for format and internal-layout cleanup under `~/.superpowers/` during the Rust cutover as long as migration and rollback are explicit:

- repo-visible spec files: authoritative, edited by workflow skills, parsed by `contracts::spec`
- repo-visible plan files: authoritative, edited by planning and execution flows, parsed by `contracts::plan`
- repo-visible execution evidence: authoritative proof artifact, parsed by `contracts::evidence`
- workflow manifest under `~/.superpowers/projects/...`: helper-owned derived index, owned by `workflow`
- session-entry decision file under `~/.superpowers/session-entry/using-superpowers/...`: helper-owned session gate state, owned by `session_entry`
- config YAML under `~/.superpowers/config/config.yaml`: helper-owned user config, owned by `config`
- repo-safety approval records under `~/.superpowers/repo-safety/approvals/...`: helper-owned approval state, owned by `repo_safety`
- update-check cache and snooze state under `~/.superpowers/update-check/...`: helper-owned cache state, owned by `update_check`
- install-migration backup markers or moved installs under `~/.superpowers/install/...`: helper-owned administrative state, owned by `install`

## Persistence and File Rules

The rewrite must preserve repo-visible authoritative artifact locations unless a separate approved workflow project changes them.

The rewrite does not need to preserve existing helper-owned local-state file shapes or subdirectory layout. It should, however, keep helper-owned runtime state rooted under `~/.superpowers/` and migrate or rebuild it intentionally.

The cleaned Rust-owned layout should use stable top-level subsystem paths under `~/.superpowers/` rather than a versioned root such as `~/.superpowers/v2/`. File contents and per-artifact schemas may carry explicit versions where needed.

The rewrite should also keep helper-owned runtime state file-based. This project should not introduce SQLite or another embedded database for manifests, approvals, config, caches, or session flags.

Important persisted surfaces include:

- legacy workflow manifest under `~/.superpowers/projects/<repo-slug>/<user>-<safe-branch>-workflow-state.json`
- legacy session-entry decision file under `~/.superpowers/session-flags/using-superpowers/<ppid>`
- canonical migrated session-entry decision file under `~/.superpowers/session-entry/using-superpowers/<ppid>`
- legacy config at `~/.superpowers/config.yaml`
- canonical migrated config at `~/.superpowers/config/config.yaml`
- canonical repo-safety approvals under `~/.superpowers/repo-safety/approvals/...`
- canonical update-check cache and snooze files under `~/.superpowers/update-check/...`
- canonical install migration markers and backups under `~/.superpowers/install/...`
- repo-visible spec, plan, packet, evidence, QA, and release-readiness artifacts
- repo-safety approval files where current behavior persists them
- update-check cache and snooze files

Rules for all helper-owned writes:

- write through temp file then rename
- use explicit file locks or a small lock abstraction where needed
- preserve line endings and final newline expectations where the artifact contract depends on them
- back up corrupt helper state before replacing it
- make partial-write recovery explicit in tests for manifests, approvals, config, and update cache

Rules for helper-owned local-state migration:

- migration must be idempotent
- migration must keep cleaned helper-owned runtime state under `~/.superpowers/`
- migration must preserve a file-based, inspectable local-state model
- migration must distinguish authoritative repo-visible artifacts from helper-owned migratable state
- rebuildable derived state such as workflow manifests and update caches may rebuild or lazily upgrade during normal command execution when that path is non-destructive and deterministic
- destructive rewrites of non-rebuildable or user-meaningful helper state, including config and repo-safety approvals, must run through `superpowers install migrate` with visible backup reporting
- commands that only inspect repo truth or helper state may continue while explicit migration is pending, but mutation paths and any path that depends on migrated non-rebuildable state must fail closed until migration succeeds
- legacy local state must be backed up before destructive rewrite where rollback would otherwise lose information
- derived state such as manifests may be rebuilt instead of migrated when rebuild is cheaper and safer
- user-config state must either migrate losslessly or fail with an actionable remediation path
- legacy repo-safety approvals should remain valid after migration when their stored scope can be carried forward safely into the Rust-owned approval model

## Output, Schemas, and Diagnostics

All machine-readable outputs must be produced from typed `serde` structs.

The rewrite must:

- commit generated JSON Schemas under `schemas/`
- version schema-bearing outputs explicitly
- keep human output and JSON output derived from the same core model
- preserve current stable default output behavior instead of treating this rewrite as a broad CLI UX redesign
- send errors to stderr
- send successful machine output to stdout
- return structured negative outcomes for expected states like `blocked`, `stale_plan`, or `needs_user_choice`

No wrapper may mutate JSON payloads.

## Schema Evolution Rules

Schema-bearing outputs need an explicit compatibility policy.

Rules:

- additive fields are preferred over field renames
- removing or renaming an existing machine-readable field requires a documented compatibility exception
- schema version bumps are required when machine-readable meaning changes materially
- human-readable output may improve only in clearly non-contractual areas and may not change default summaries, headings, ordering, or other snapshot-backed conventions without explicit review
- all schema files checked into `schemas/` must be generated from the same Rust types used at runtime

### Failure Families

Every important failure path must have a stable name.

Representative families include:

- artifact discovery failures
- header parse failures
- contract validation failures
- provenance mismatches
- approval scope mismatches
- manifest corruption
- session decision corruption
- path normalization failures
- update-check cache corruption
- install migration ambiguity

The exact internal Rust enum layout can change, but user-visible failure classes that already exist must remain stable unless listed in `compat/exceptions.md`.

## Security and Trust Model

The rewrite must improve safety, not merely performance.

Required behaviors:

- never shell out for core contract logic
- never shell out to `git`; repository identity, branch, refs, remotes, and related metadata must come from library APIs
- never `eval` or interpolate user-controlled strings through shell parsing
- validate repo-relative paths before use
- preserve protected-branch enforcement
- preserve fail-closed behavior on malformed instruction files
- minimize network access to the update-check path
- treat git metadata through library APIs throughout the runtime, not through subprocess parsing

When using `gix`, prefer safe repository-open behavior and do not accidentally reintroduce trust problems by executing untrusted config or external tools.

## Observability

This is a local CLI, so observability means local diagnostics, traceability, and reproducibility, not remote telemetry.

The rewrite must provide:

- structured diagnostics in JSON mode
- stable reason codes
- human-readable remediation messages
- optional verbose tracing for debug sessions
- differential test artifacts that capture Rust-vs-shell mismatches

No new remote telemetry is introduced in this project.

## Performance and Scaling

The rewrite must preserve the current bounded-scan philosophy.

Requirements:

- no repo-wide recursive scan in the hot path when the runtime only needs the workflow artifact directories
- deterministic artifact resolution with explicit ambiguity detection
- streaming or single-pass parsing where possible
- fingerprints computed once per artifact read
- benchmarks or regression tests around status and parse hot paths

The goal is not speculative micro-optimization. The goal is predictable latency and elimination of shell-process overhead in correctness-sensitive paths.

## Cross-Platform Contract

Cross-platform parity is a first-class requirement.

Rules:

- core business logic lives in Rust
- supported platforms invoke the Rust binary directly in steady state
- repo-relative paths are normalized with `/` internally
- native filesystem paths are rendered in the host's natural form when user-facing contracts require absolute paths
- line-ending sensitive artifact parsing must accept the forms already seen in the repo and render deterministically

Windows-specific behavior belongs in the core runtime, not in wrapper-side JSON rewrites or wrapper-owned launch surfaces.

## Dependency Strategy

The rewrite should prefer mainstream, well-documented crates.

Expected categories:

- CLI: `clap`
- serialization: `serde`, `serde_json`
- schemas: `schemars`
- git: `gix`
- UTF-8 paths: `camino`
- markdown tokenization where useful: `pulldown-cmark`
- hashing: `sha2`, optionally `blake3` for internal cache keys only
- time: `jiff`
- versions: `semver`
- HTTP: `reqwest` blocking client
- diagnostics and errors: `thiserror`, optionally `miette`
- filesystem ergonomics: `fs-err`, `tempfile`

Additional dependencies must clear a high bar. The shell rewrite should not become a dependency explosion.

Dependency guardrails:

- prefer crates with active maintenance, clear documentation, and broad adoption
- prefer feature-light configurations where heavy default feature sets are unnecessary
- introduce new dependencies only when they remove real complexity or risk from the runtime
- pin or constrain versions in a way that supports reproducible release builds

## Testing Strategy

### 1. Port runtime coverage before flipping the public runtime

The current shell-heavy suite under `tests/codex-runtime/` is the first compatibility target.

### 2. Keep a small migration-launcher smoke layer

After the Rust cutover:

- Rust integration tests should own most behavior verification
- any migration-only shell or PowerShell wrappers should be tested only as transitional transports
- migration-wrapper tests should cover binary discovery, argument passthrough, stdin and stdout behavior, exit codes, and missing-binary messaging

### 3. Add property and snapshot coverage

Use:

- `assert_cmd` for CLI integration tests
- `insta` for large text and JSON snapshots
- `proptest` for path normalization, overlap detection, branch sanitization, and execution invariants

### 4. Add a differential harness

Before the public cutover, create a differential harness that runs:

- the legacy shell helper
- the Rust command
- the same fixture corpus

Each mismatch must be triaged into one of:

- Rust bug
- legacy bug that should remain for compatibility
- intentional contract improvement that must be listed in `compat/exceptions.md`

### 5. Treat performance regressions as testable risks

Add targeted performance smoke coverage for:

- workflow status on fixture repos
- plan-contract parsing
- execution status

## Verification Matrix

Every subsystem should leave both parity evidence and Rust-native evidence.

- CLI dispatch: canonical command invocation, alias invocation, help output, version output, exit-code parity
- workflow: current-state routing, manifest repair, ambiguity handling, expected-path flows
- plan contract: valid parse, malformed headers, invalid task grammar, coverage mismatches, packet build parity
- execution: status parity, mutation safety, stale fingerprint rejection, evidence compatibility, gate failures
- repo safety: protected-branch block, approval success, scope mismatch, malformed instructions
- session entry: missing state, malformed state, enabled, bypassed, explicit re-entry
- slug: repo slug, branch sanitization, detached HEAD
- config: get, set, list, malformed config handling
- update check: disabled, snoozed, offline, up-to-date, upgrade available, just upgraded
- install migration: valid install, invalid install, ambiguous legacy installs, idempotent rerun
- migration wrappers, if they still exist during cutover work: passthrough behavior, missing-binary messaging, exit-code propagation on Bash and PowerShell

## Release and Packaging

Use `cargo-dist` or equivalent Rust-native build tooling to produce the checked-in first-release binaries for:

- macOS arm64
- Windows x64

Linux x64 packaging remains desirable follow-on scope, but it is not part of the first Rust release contract.

Release expectations:

- the first public Rust release is atomic, not helper-by-helper
- it ships the Rust binary, migrated tests, and updated docs together
- it supports a normal install flow where skills installation provisions the matching checked-in repo binary without requiring local Cargo or Rustup
- rollback remains possible through explicit backup or rebuild rules for migrated local helper state

Checked-in binary expectations:

- keep checksum or equivalent integrity metadata checked in alongside the supported binaries
- keep the `bin/prebuilt/` layout stable enough that install scripts and migration tooling can target it deterministically
- document macOS arm64 as the first-release fully validated target and Windows x64 as a first-release packaged/installable target whose direct host-launch validation may follow later
- treat Linux x64 as follow-on scope until a later release explicitly promotes it
- keep the checked-in `bin/prebuilt/` binary set version-aligned with the Rust source revision and checked-in integrity metadata for the same runtime revision
- treat macOS arm64 host fresh-install proof as the blocking cutover gate for the initial Rust release
- treat Windows x64 checked-in binary refresh, manifest resolution, checksum verification, install-time provisioning, and PE artifact sanity checks as required packaging proof for the initial Rust release
- treat direct Windows-host `superpowers.exe` launch proof as advisory follow-on validation rather than a blocker or a separately tracked release obligation for the initial cutover

## Developer Workflow

Use Cargo as the canonical build system.

Baseline repo standards:

- pinned stable toolchain in `rust-toolchain.toml`
- `cargo fmt`
- `cargo clippy`
- `cargo nextest`
- coverage via `cargo llvm-cov`
- dependency policy via `cargo-deny` and `cargo-audit`

Illustrative CI gate:

```bash
cargo fmt --check
cargo clippy --workspace --all-targets --all-features -- -D warnings
cargo nextest run
cargo llvm-cov nextest --workspace --all-features --lcov --output-path target/lcov.info
cargo deny check
cargo audit
```

## Apple Silicon Bootstrap

For local development on Apple Silicon macOS, the setup guidance from the task brief is acceptable and should be preserved in implementation planning:

```bash
xcode-select --install
brew update
brew install git ripgrep powershell rustup node cargo-llvm-cov
echo 'export PATH="$(brew --prefix rustup)/bin:$PATH"' >> ~/.zprofile
source ~/.zprofile
rustup default stable
rustup component add rustfmt clippy llvm-tools-preview
cargo install --locked cargo-nextest
cargo install --locked cargo-deny
cargo install --locked cargo-audit
cargo install cargo-insta
cargo install cargo-dist
```

Validation should include:

```bash
brew --prefix
rustc -Vv
cargo -V
cargo nextest --version
cargo llvm-cov --version
cargo deny --version
cargo audit --version
cargo insta --version
cargo dist --version
pwsh -v
node -v
git --version
rg --version
```

## Migration Strategy

The rewrite should proceed in explicit phases.

### Phase 1: Contract capture

- finish the detailed spec
- write the implementation plan
- inventory all helper surfaces, files, tests, and launcher or wrapper assumptions
- pin the compatibility corpus

### Phase 2: Rust shadow runtime

- add the Rust package and typed models
- implement the command tree and only the short-lived shim dispatch needed to keep development moving before the cutover commit lands
- port the highest-value pure read paths first
- stand up the differential harness

### Phase 3: Parity and mutation paths

- port the remaining helpers
- replace wrapper-owned logic
- validate write paths, approvals, manifests, and evidence mutations
- implement lazy rebuild behavior for derived helper-owned state and `superpowers install migrate` handling for non-rebuildable helper-owned state that is being cleaned up
- keep parity checks running on every touched subsystem

### Phase 4: Cutover

- update repo-owned callers, docs, and install surfaces to canonical `superpowers ...` commands
- remove helper-style shim usage from repo-owned callers and do not ship retained command-name shims unless a documented blocker requires one
- refresh and commit the supported checked-in binaries and their integrity metadata under `bin/prebuilt/`
- document any explicit exceptions

### Phase 5: Post-cutover cleanup

- remove dead shell implementation code only after compatibility confidence is earned
- keep launcher or wrapper smoke tests
- keep `compat/exceptions.md` current until a separate deprecation project says otherwise

## Phase Exit Criteria

Each migration phase needs an explicit gate so the rewrite does not drift into a long-lived half-state.

### Exit for Phase 1

- the spec is approved
- the implementation plan exists
- every current helper entrypoint and state file has an inventory record
- the differential fixture corpus has been selected

### Exit for Phase 2

- the Rust workspace builds
- canonical CLI parsing works and any temporary development-only shim dispatch is bounded and understood
- at least one read-only command family runs in shadow mode against the differential harness
- CI can run Rust lint, test, and snapshot review tooling

### Exit for Phase 3

- all public helper surfaces have Rust implementations
- mutation paths use atomic writes and stale-write protection
- wrapper-owned JSON rewriting has been removed
- lazy rebuild behavior for derived helper-owned state has passing coverage
- explicit migration paths for non-rebuildable helper-owned state have passing coverage
- pending-migration gating has passing coverage for read-only allowance, mutation refusal, and remediation output
- differential mismatches are either fixed or logged as explicit compatibility exceptions

### Exit for Phase 4

- checked-in first-release binaries and integrity metadata exist under `bin/prebuilt/`
- install and migration flows succeed from a clean environment
- direct binary invocation works on the first-release supported platforms, including Windows
- reviewed differential report shows no unexplained mismatches
- repo-owned callers, docs, tests, and generated skills invoke canonical `superpowers ...` commands
- the installed runtime exposes only `superpowers` and no post-cutover wrapper-owned command surface
- explicit migration reporting and backup behavior for non-rebuildable helper-owned state are verified from a legacy-state fixture

### Exit for Phase 5

- dead shell implementation code removed is no longer needed by the release surface or any explicitly documented exception
- documentation reflects the Rust runtime as the authoritative implementation
- follow-up deprecation work, if any, is captured explicitly rather than assumed

## Acceptance Gates

Before the rewrite can be called complete:

- all requirements in this spec must map to implementation-plan tasks
- all compatibility exceptions must be documented and reviewed
- all release entrypoints are exercised in CI or release verification, and any explicitly retained shim is covered as an exception rather than assumed as normal surface
- the release notes must call out the Rust cutover and any known compatibility caveats
- the public install story must be simpler after the rewrite than before it

## Rollout Plan

- Land the spec first.
- Write an engineering implementation plan that breaks the rewrite into narrow, test-backed tasks.
- Build the Rust runtime in shadow mode before changing installed entrypoint ownership.
- Keep the legacy shell runtime available during differential testing.
- Cut over in one release with clear compatibility notes.

## Rollback Plan

- Revert install launchers and any retained migration shims back to the legacy shell runtime if the Rust cutover proves unstable.
- Preserve all repo-visible markdown artifacts.
- Restore migrated helper-owned local state from backups where rollback needs legacy-readable state.
- Rebuild derived helper-owned state where rebuild is safer than restoring stale migrated files.
- Preserve the compatibility corpus and mismatch evidence for postmortem use.
- Because some helper-owned local state may be cleaned up in this project, rollback must include an explicit restore-or-rebuild procedure rather than assuming zero migration.

## Risks And Mitigations

- Risk: the Rust rewrite accidentally bakes in shell bugs as product law.
  Mitigation: honor the source-of-truth hierarchy and document explicit exceptions.

- Risk: temporary migration shims drift from canonical command behavior while both exist.
  Mitigation: differential tests and launcher or wrapper smoke tests must gate release for as long as those shims exist.

- Risk: PowerShell parity regresses because the shell logic disappears before the core runtime is complete.
  Mitigation: move platform behavior into Rust first, then simplify wrappers.

- Risk: the team recreates the current fragmentation as many Rust modules or binaries.
  Mitigation: keep one main library crate, one shipped binary, and explicit module boundaries.

- Risk: release scope grows to include adjacent Node systems.
  Mitigation: treat Node-only areas as cataloged adjacency, not runtime blockers.

- Risk: YAML and lockfile choices become hidden implementation churn.
  Mitigation: make the parser choice, locking strategy, and schema layout explicit in the implementation plan.

- Risk: local-state cleanup introduces migration or rollback failures that are worse than the shell implementation debt it removes.
  Mitigation: limit cleanup to helper-owned state, back up legacy state before destructive rewrites, and require explicit migration and rollback coverage.

## Requirement Index

- [REQ-001][behavior] Superpowers must replace the shell runtime in `bin/` with one shipped Rust binary named `superpowers` while preserving the existing authority model and public helper surface.
- [REQ-002][behavior] The first Rust release should use canonical `superpowers ...` subcommands as the public contract, and repo-owned callers, generated skills, docs, tests, and install surfaces must switch to that command tree in the cutover release itself.
- [REQ-003][behavior] The Rust runtime must preserve current workflow, repo-safety, plan-contract, execution, session-entry, config, slug, update-check, and install-migration semantics unless an explicit exception is recorded in `compat/exceptions.md`, even when helper-owned local state paths or file formats are cleaned up.
- [REQ-004][constraint] Approved spec markdown, approved plan markdown, execution evidence, and other repo-visible workflow artifacts must remain authoritative; helper-owned manifests, caches, and approvals remain derived enforcement state only.
- [REQ-005][behavior] Behavior conflicts during the rewrite must be resolved in this order: shipped docs and README, user-visible tests and fixtures, differential runtime output, then legacy shell source as fallback.
- [REQ-006][behavior] Repo-relative path identity must be implemented as a typed normalized path abstraction that rejects absolute and traversing paths, canonicalizes separators, and is reused across workflow, plan, packet, and repo-safety logic.
- [REQ-007][behavior] Instruction discovery order and fail-closed malformed-instruction behavior must match the current runtime contract.
- [REQ-008][behavior] `superpowers workflow status|resolve|expect|sync` must preserve the current workflow states, conservative downgrade rules, expected-path semantics, and manifest-derived nature.
- [REQ-009][behavior] `superpowers-workflow` and `superpowers-workflow-status`, if used at all before the cutover lands, must collapse into thin shims over the canonical `superpowers workflow ...` command tree rather than remain separate workflow contract surfaces, and they should not remain part of normal repo-owned usage after cutover.
- [REQ-010][behavior] Artifact discovery and workflow routing must use deterministic ranking and explicit ambiguity detection instead of shell listing-order behavior.
- [REQ-011][behavior] Workflow manifests and other helper-owned mutable state must be written atomically, guarded against corruption, and backed up before replacement when malformed content is detected.
- [REQ-012][behavior] Machine-readable workflow and helper outputs must come from typed `serde` models, include explicit schema versioning where currently applicable, preserve legacy compatibility fields such as `reason` where existing consumers depend on them, and preserve current default human-vs-machine mode behavior plus stdout and stderr routing for stable command families unless an explicit compatibility exception is recorded.
- [REQ-013][behavior] Specs and plans must be parsed as strict workflow DSLs embedded in markdown, with exact header parsing, section splitting, typed task parsing, and cross-document validation.
- [REQ-014][behavior] `superpowers plan contract lint|analyze|packet build` must remain supported commands and must become library-backed runtime functionality rather than subprocess-driven shell composition.
- [REQ-015][behavior] Task-packet output must preserve current provenance semantics and must include deterministic fingerprints for plan, spec, task, and packet identity.
- [REQ-016][behavior] `superpowers plan execution status|recommend|preflight|gate-review|gate-finish|begin|transfer|complete|note|reopen` must preserve current execution-state invariants and fail-closed gate behavior.
- [REQ-017][behavior] Execution mutation commands must defend against stale writes through explicit execution fingerprint or compare-and-swap semantics.
- [REQ-018][behavior] Execution evidence must remain readable from existing artifacts and must be modeled as a typed contract with deterministic rendering in the Rust runtime.
- [REQ-019][behavior] `superpowers repo-safety check|approve` must preserve protected-branch semantics, deterministic approval fingerprinting, existing user-visible failure classes, and migrated legacy approval usability where approval records can be carried forward safely.
- [REQ-020][behavior] Host-platform path rendering, including Windows-native presentation where required, must be owned by the Rust core instead of wrapper-side JSON rewriting.
- [REQ-021][constraint] The Rust runtime must not invoke the `git` CLI; repository identity, branch, refs, remotes, and related metadata must be obtained through library APIs.
- [REQ-022][behavior] `superpowers session-entry resolve|record` must preserve the plain-text `enabled` and `bypassed` decision file contract, fail closed on missing or malformed state, and support explicit re-entry behavior.
- [REQ-023][behavior] `superpowers repo slug` must preserve current `SLUG` and `BRANCH` output semantics, including `current` for detached HEAD and no reintroduction of removed outputs.
- [REQ-024][behavior] `superpowers config get|set|list` must preserve current config semantics while migrating the legacy `~/.superpowers/config.yaml` file into the canonical stable-subsystem path `~/.superpowers/config/config.yaml`, with explicit backup and rollback behavior; the migrated on-disk config format should remain YAML with a maintained parser and a narrow accepted schema.
- [REQ-025][behavior] `superpowers update-check` must preserve current force-check, cache, snooze, disable, and status-line behavior while using typed Rust models for cache and version resolution.
- [REQ-026][behavior] `superpowers install migrate` must preserve current shared-install validation, backup behavior, and ambiguous-install refusal semantics, and it must own any explicit cutover-time migration required for non-rebuildable helper-owned local state.
- [REQ-027][behavior] Every important negative outcome must surface as a named diagnostic or failure class with stable user-visible identifiers where the current runtime already exposes them.
- [REQ-028][constraint] Post-cutover supported platforms must invoke the Rust binary directly; wrapper-owned launch surfaces, including PowerShell `.ps1` wrappers, are not part of the intended steady-state install surface.
- [REQ-029][behavior] The installed runtime must not ship helper-style executable names after cutover; only `superpowers` may remain in the supported install surface.
- [REQ-030][behavior] A differential harness must compare the legacy shell runtime and the Rust runtime against a curated fixture corpus before public cutover.
- [REQ-031][verification] The migrated Rust test suite must cover current runtime behavior, property-style invariants, snapshot-heavy text and JSON output, any migration-wrapper smoke behavior, and differential mismatch triage.
- [REQ-032][behavior] The first public Rust cutover must be released atomically with the binary, migrated tests, and updated documentation rather than as a helper-by-helper partial migration.
- [REQ-033][behavior] The repo must adopt Cargo-based build, lint, test, coverage, and dependency-policy tooling with a pinned stable Rust toolchain.
- [REQ-034][constraint] Adjacent Node-based areas such as brainstorm-server tests, evals, and `.mjs` generators must be cataloged during planning but must not block the initial runtime cutover unless they directly depend on shell-runtime internals being replaced.
- [REQ-035][behavior] The rewrite must preserve the bounded-scan philosophy of the current runtime and avoid repo-wide hot-path scans when the artifact scope is already known.
- [REQ-036][constraint] The Rust runtime must not reintroduce shell-eval behavior, unvalidated path usage, or weaker protected-branch enforcement than the current runtime.
- [REQ-037][decision] The runtime architecture should use one main library crate and one shipped binary with internal modules for workflow, contracts, repo safety, session entry, config, update, and install logic rather than a crate-per-helper or binary-per-helper design.
- [REQ-038][decision] Mainstream Rust crates such as `clap`, `serde`, `serde_json`, `schemars`, `gix`, `camino`, `sha2`, `semver`, `reqwest`, `jiff`, `assert_cmd`, `insta`, and `proptest` are the default dependency direction unless planning identifies a stronger repo-specific reason to differ.
- [REQ-039][behavior] Any temporary development shims and canonical `superpowers` subcommands must preserve equivalent stdout, stderr, exit-code, and current-working-directory semantics for the same logical command while those shims exist.
- [REQ-040][behavior] The rewrite must replace wrapper-owned missing-binary handling, path adaptation, and transport logic with a documented migration-only wrapper contract that leaves business logic in the Rust core.
- [REQ-041][behavior] The implementation plan must inventory every helper-owned artifact and state file with an explicit Rust module owner and migration strategy before cutover work begins.
- [REQ-042][decision] Tooling choices materially influenced by ecosystem landscape, including use of `clap`, `gix`, Rust-native testing tools, `cargo-dist`, and rejection of archived `serde_yaml` in favor of a maintained YAML path for config, are the default planning direction unless later repo evidence justifies a different choice.
- [REQ-043][behavior] The migration must use explicit phase exit criteria so the runtime does not remain indefinitely split between shell-owned and Rust-owned behavior without a reviewed gate.
- [REQ-044][behavior] Helper-owned local state such as workflow manifests, session-entry decisions, config, update caches, and approval records may be reformatted and reorganized under `~/.superpowers/` in the Rust cutover, but only through hybrid migration rules: rebuildable derived state may rebuild or lazily upgrade non-destructively during normal command execution, while non-rebuildable or user-meaningful helper state must use an explicit migration path with backup and rollback coverage.
- [REQ-045][decision] Helper-owned runtime state under `~/.superpowers/` should remain file-based and inspectable; this rewrite should not introduce SQLite or another embedded database for local manifests, approvals, config, caches, or session flags.
- [REQ-046][behavior] The Rust rewrite must not be used as a general CLI UX redesign; stable command families should preserve current reviewed human-readable summaries, headings, ordering, and machine-readable field shapes unless a compatibility exception or reviewed snapshot change explicitly authorizes the difference.
- [REQ-047][behavior] `superpowers install migrate` must surface what non-rebuildable helper-owned state changed, what was backed up, and what still needs user action instead of rewriting that state silently during unrelated command execution.
- [REQ-048][decision] The first Rust release contract should keep macOS arm64 and Windows x64 as the only tier-1 checked-in packaging targets, but only macOS arm64 host validation blocks the initial cutover; Windows x64 may ship as a packaged/installable target once manifest, checksum, install-provisioning, and PE artifact checks are green, while direct Windows-host launch validation remains advisory follow-on evidence.
- [REQ-049][behavior] When pending explicit migration of non-rebuildable helper-owned state is detected, read-only and diagnostic commands may continue only with explicit warning state, while mutation paths and any command that depends on migrated non-rebuildable state must fail closed with remediation to run `superpowers install migrate`.
- [REQ-050][behavior] Legacy repo-safety approval records should be migrated forward by `superpowers install migrate` whenever they can be parsed and rewritten safely; only unreadable or unmigratable approval records should fall back to explicit invalidation and fresh approval.
- [REQ-051][decision] The cleaned helper-owned runtime state layout should keep stable subsystem paths directly under `~/.superpowers/`, with evolution handled by file-format or schema versioning rather than a versioned root directory.
- [REQ-052][decision] Canonical helper-owned subsystem paths after cutover should be `~/.superpowers/projects/...` for workflow manifests, `~/.superpowers/session-entry/using-superpowers/<ppid>` for session-entry decisions, `~/.superpowers/config/config.yaml` for config, `~/.superpowers/repo-safety/approvals/...` for repo-safety approvals, `~/.superpowers/update-check/...` for update-check state, and `~/.superpowers/install/...` for install-migration state.
- [REQ-053][behavior] On supported first-release targets, normal skills installation must provision the matching checked-in prebuilt `superpowers` binary from `bin/prebuilt/<target>/` into `~/.superpowers/install/bin` without requiring a local Rust toolchain or source build.
- [REQ-054][behavior] The repo must carry committed first-release target binaries plus checked-in checksum or integrity metadata under `bin/prebuilt/`, and those binaries must stay version-aligned with the Rust source revision they represent.
- [NONGOAL-001][non-goal] Do not replace markdown authority with a database, service, or hidden authoritative local store.
- [NONGOAL-002][non-goal] Do not turn this rewrite into a broad port of the brainstorm server, eval harnesses, or unrelated Node tooling.
- [NONGOAL-003][non-goal] Do not ship many separate Rust executables that simply recreate the current shell-helper fragmentation under a new language.
- [NONGOAL-004][non-goal] Do not preserve shell implementation accidents such as wrapper-side payload rewriting or listing-order artifact discovery as if they were product requirements.
- [NONGOAL-005][non-goal] Do not require a local Rust or Cargo build, or a remote artifact fetch, as the normal skills-installation path on supported targets.
- [VERIFY-001][verification] Release readiness must include green Rust integration coverage, green launcher or wrapper smoke coverage, and a reviewed differential report for all intentional runtime differences.
- [VERIFY-002][verification] Packaging verification for the first Rust cutover must cover blocking macOS arm64 fresh-install proof plus checked-in Windows x64 binary refresh, manifest resolution, checksum verification, install-time provisioning, and PE artifact sanity checks; direct Windows-host launch proof is advisory follow-on evidence rather than a cutover blocker. Linux x64 verification belongs to the later release that adds Linux packaging to the supported contract.
- [VERIFY-003][verification] Documentation verification must confirm that runtime README, operator docs, testing docs, and release notes describe the Rust runtime, the canonical command surface, and any explicit exceptions accurately.
- [VERIFY-004][verification] Phase exit criteria must be checked explicitly during execution planning and cutover review, with no unexplained transition to a later phase.
- [VERIFY-005][verification] Cutover verification must include legacy-local-state migration or rebuild coverage plus rollback proof for any helper-owned state format or path that changes.
- [VERIFY-006][verification] Output verification must include snapshot or differential parity coverage for representative human-readable and machine-readable outputs in every major command family, with every intentional difference logged in `compat/exceptions.md`.
- [VERIFY-007][verification] Verification must cover both lazy rebuild of derived helper-owned state and explicit migration reporting for non-rebuildable helper-owned state, including backup creation and actionable failure output.
- [VERIFY-008][verification] Verification must cover pending-migration behavior for representative commands, including allowed read-only inspection with warning state, blocked mutation paths, and remediation that points to `superpowers install migrate`.
- [VERIFY-009][verification] Verification must cover migrated legacy repo-safety approvals, including successful reuse of a migrated approval record under equivalent scope and explicit fallback behavior when a legacy approval record cannot be migrated safely.
- [VERIFY-010][verification] Verification must cover a fresh skills installation on each first-release target, including resolution of the correct checked-in `bin/prebuilt/` binary, integrity verification, installation into `~/.superpowers/install/bin`, and operation without a local Rust build step or remote artifact fetch.
