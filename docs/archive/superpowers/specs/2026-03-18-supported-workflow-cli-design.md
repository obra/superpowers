# Supported Workflow CLI

**Workflow State:** CEO Approved
**Spec Revision:** 1
**Last Reviewed By:** plan-ceo-review

## Summary

Add a supported user-facing workflow inspection CLI for Superpowers:

1. `bin/superpowers-workflow`
2. `bin/superpowers-workflow.ps1`

This CLI gives humans a stable way to answer three questions without reading skill internals, local manifest files, or raw helper diagnostics:

- where am I in the workflow?
- why did Superpowers resolve that stage?
- what is the next safe action?

V1 is intentionally narrow:

- inspection-only
- human-first output
- product-workflow only, up to `implementation_ready`
- no supported public JSON contract
- no execution-stage inspection
- no public mutation commands

The public CLI must reuse the existing workflow-state derivation logic, but it must do so through a side-effect-free inspection path. A supported public read command must not mutate local runtime state just to discover workflow state.

## Problem

Superpowers now has a strong internal workflow runtime, but the user-facing inspection story is still weak.

Today:

- `bin/superpowers-workflow-status` exists and can derive workflow state
- README and platform docs describe it as an internal helper, not a supported public CLI
- the helper's default outputs are shaped for runtime consumption first, not for humans trying to understand what to do next
- the helper's `status` path can write or repair the local manifest while resolving state

That creates a trust and usability gap:

- users do not have a stable supported way to inspect workflow state directly
- users must interpret raw status codes or skill behavior to understand the current stage
- a discovery command can have local side effects, which is surprising for a supported inspection surface
- documentation cannot confidently tell users "run this command to see where you are" because the current helper is intentionally internal

Superpowers has already invested in making workflow routing conservative and reliable. The next leverage point is exposing that capability through a human-friendly, supportable inspection surface.

## Goals

- Add a supported public CLI for inspecting product-workflow state.
- Let users answer "where am I?", "why?", and "what next?" from the terminal.
- Keep repo-tracked spec and plan documents authoritative for approvals and revision linkage.
- Reuse the existing workflow-state derivation logic instead of building a second parser and routing engine.
- Guarantee that public inspection commands are side-effect-free.
- Keep conservative fallback behavior: ambiguity, malformed headers, stale linkage, and local-state mismatches should route to the earlier safe stage instead of guessing.
- Preserve Bash and PowerShell parity.
- Treat public wording as a deliberate compatibility surface and test it accordingly.

## Not In Scope

- Making the local manifest authoritative over repo-tracked workflow docs.
- Publishing `expect` or `sync` as supported user-facing commands.
- Public execution-stage inspection or mutation.
- A stable public JSON schema in v1.
- A new umbrella `superpowers workflow ...` dispatcher or PATH-oriented command family in this change.
- Replacing `bin/superpowers-workflow-status`; it remains the internal helper.
- Broad workflow changes outside the existing product-workflow pipeline:
  - `brainstorming`
  - `plan-ceo-review`
  - `writing-plans`
  - `plan-eng-review`
  - `implementation_ready`

## Existing Context

Superpowers already has the internal pieces needed for this change:

- `bin/superpowers-workflow-status` derives workflow state conservatively from repo docs plus a branch-scoped manifest.
- Repo docs remain authoritative for workflow truth.
- The local manifest under `~/.superpowers/projects/<repo-slug>/<user>-<safe-branch>-workflow-state.json` is a rebuildable index, not the approval record.
- Existing docs and release notes explicitly label the helper as internal and defer a supported public workflow CLI until the contract is stable.
- The current runtime installation model exposes dedicated binaries under `~/.superpowers/install/bin/` rather than a single top-level `superpowers` dispatcher.

That existing runtime layout matters. The clean v1 surface is another dedicated binary, not a larger command router.

## User Experience

### Supported Commands

The public CLI exposes these commands:

```text
superpowers-workflow status
superpowers-workflow next
superpowers-workflow artifacts
superpowers-workflow explain
superpowers-workflow help
```

PowerShell wrapper parity is required through `bin/superpowers-workflow.ps1`.

### Invocation Model

V1 uses the same installation style as the existing runtime helpers:

```bash
~/.superpowers/install/bin/superpowers-workflow status
```

This spec does not introduce a broader PATH or dispatcher story. The public contract is the supported dedicated binary at the install root.

### Command Roles

`status`

- one-screen workflow summary
- human wording first
- includes current stage, short reason, next safe action, and key artifact pointers

`next`

- emphasizes the next safe action
- explains why no later stage is valid yet
- may mention the relevant Superpowers skill or workflow stage explicitly
- at `implementation_ready`, stops at the execution handoff boundary:
  - shows that product-workflow routing is complete
  - prints the approved plan path
  - points the user to the execution handoff surface without calling execution recommendation logic

`artifacts`

- shows the active or expected spec and plan paths
- indicates whether paths came from authoritative repo docs or local expected-path state
- does not show the manifest path by default
- may surface the manifest path only when local manifest state is directly relevant to a diagnostic explanation
- prints explicit `none` lines when no current spec path or plan path is available

`explain`

- expands terse diagnostics into actionable guidance
- is available for any resolved workflow state
- gives the fuller causal explanation behind the current stage selection
- is used for ordinary resolved states as well as ambiguity, malformed headers, stale plan linkage, repo identity mismatches, missing expected artifacts, or ignored local manifest state
- may include the manifest path when that detail materially helps diagnose local-state issues

`help`

- prints supported commands and short descriptions
- must clearly distinguish supported public inspection commands from internal helper surfaces
- documents the available debug entrypoint for diagnostic use
- is always available, even outside a git repo

## Public Output Contract

The public CLI is human-first by default.

It must not primarily expose raw internal status codes or raw reason codes. Internals may still power the output, but the wording users read should be stable human language.

V1 also includes an opt-in non-mutating debug surface for support and diagnostics:

- `--debug`

`--debug` is the supported public trigger in v1. An environment-controlled trigger may exist as an internal implementation detail, but it is not part of the public contract.

Debug mode rules:

- must remain side-effect-free
- must not create, repair, or rewrite manifests
- must not write persistent debug artifacts to disk
- may print resolver path details, inspected artifact candidates, ignored manifest diagnostics, and named failure-class information
- must not become the default output surface
- is a diagnostic surface, not a stable human-facing wording contract

### Example `status`

```text
Workflow status: Spec review needed
Why: The current spec is still in Draft.
Next: Use superpowers:plan-ceo-review
Spec: docs/superpowers/specs/2026-03-18-example-design.md
Plan: none
```

### Example `next`

```text
Next safe step: Review and approve the current spec with superpowers:plan-ceo-review.

Reason:
- A spec exists and is authoritative.
- Its Workflow State is Draft.
- No later stage is safe until the spec review resolves.
```

### Example `artifacts`

```text
Workflow artifacts
- Spec: docs/superpowers/specs/2026-03-18-example-design.md (from repo docs)
- Plan: docs/superpowers/plans/2026-03-18-example.md (expected, missing)
```

Empty-state artifact output must be explicit:

```text
Workflow artifacts
- Spec: none
- Plan: none
```

### Example `explain`

```text
Superpowers could not identify one unambiguous current spec.

Safe fallback:
- Treat the workflow as spec review stage.

Why this happened:
- Multiple candidate spec documents matched the current repo state.
- Superpowers will not guess which one should drive routing.

What to do:
1. Decide which spec is current.
2. Remove or supersede stale competing specs.
3. Re-run: ~/.superpowers/install/bin/superpowers-workflow status
```

### Public Vocabulary Mapping

The public CLI maps internal workflow codes to human-oriented wording.

Recommended v1 wording:

- `needs_brainstorming` -> `Brainstorming needed`
- `spec_draft` -> `Spec review needed`
- `spec_approved_needs_plan` -> `Plan writing needed`
- `plan_draft` -> `Engineering plan review needed`
- `stale_plan` -> `Plan update needed`
- `implementation_ready` -> `Ready for implementation handoff`

At `implementation_ready`, public wording should remain inside the product-workflow boundary. `superpowers-workflow next` should say that workflow routing is complete, identify the approved plan path, and direct the user to the execution handoff surface. It must not call `superpowers-plan-execution recommend --plan ...` in v1.

Internal reason codes such as `fallback_ambiguity_spec` or `malformed_plan_headers` remain implementation details. The public CLI translates them into stable explanation text rather than surfacing them as the primary contract.

### Exit Code Policy

- Exit `0` for successful inspection, including conservative fallback outcomes.
- Exit nonzero only for true usage or runtime failures:
  - invalid arguments
  - unsupported command shape
  - unreadable runtime environment
  - read-only resolver runtime failure
  - wrapper execution failure

Normal workflow outcomes like "go back to plan review" or "state is ambiguous, fall back conservatively" are not errors.

The read-only resolver must classify each invocation as one of:

- `resolved`
- `runtime_failure`

`resolved` means the resolver successfully determined a workflow result, even if that result is a conservative fallback caused by ambiguity, malformed headers, stale linkage, or invalid local manifest hints.

`runtime_failure` means the resolver itself could not complete its work because of an actual runtime problem, such as:

- invocation outside a git repo
- unreadable repo inspection state
- unexpected internal parse failure outside the documented conservative cases
- wrapper or helper execution failure
- unsupported invocation contract between the public CLI and the read-only resolver

The public CLI must exit `0` only for `resolved` results. It must exit nonzero for `runtime_failure` and print explicit human-readable failure text instead of silently degrading into a conservative workflow result.

Running the public CLI outside a git repo is always `runtime_failure`. The public CLI must not inherit the internal helper's fallback-to-current-directory behavior for supported user-facing inspection commands.

`help` is the exception. It is command metadata, not workflow inspection, and must remain available without repo context.

### Failure Class Registry

The read-only resolver and public CLI integration must use a small named failure-class set for all non-resolved outcomes.

Required v1 classes:

- `InvalidCommandInput`
  - bad command name
  - unknown flag
  - unsupported argument shape
- `RepoContextUnavailable`
  - invocation outside a git repo
  - repo root unreadable
  - repo inspection cannot establish required context
- `ResolverContractViolation`
  - the public CLI and read-only resolver disagree on the supported invocation or result contract
  - the resolver returns an invalid or incomplete result shape
- `ResolverRuntimeFailure`
  - unexpected resolver failure outside the documented conservative fallback cases
  - internal read-only resolution aborts without a valid workflow result
- `WrapperExecutionFailed`
  - PowerShell or shell wrapper cannot invoke the underlying runtime surface correctly

These classes are internal support and test contracts. The public CLI remains human-first:

- exit code and human stderr are the supported user-facing failure surface
- named failure classes must still be testable and available to the implementation layer
- tests must assert both the failure class and the user-visible stderr meaning

## Architecture

### High-Level Shape

Add two public runtime surfaces:

1. `bin/superpowers-workflow`
2. `bin/superpowers-workflow.ps1`

These public binaries sit above the existing internal helper:

```text
user
  |
  v
superpowers-workflow
  |
  v
side-effect-free internal resolution path
  |
  v
superpowers-workflow-status
  |
  +--> repo docs remain authoritative
  |
  +--> existing manifest may be consulted as a hint
```

### Read-Only Resolution Contract

The public CLI must only use a side-effect-free internal resolution path.

The exact internal entrypoint name is an implementation detail. It may be:

- a dedicated subcommand such as `resolve`
- or a new flag such as `status --read-only`

What matters is behavior, not the internal spelling.

The public CLI's semantic parity target is this read-only resolver contract, not the current mutating `status` behavior. Public inspection commands must match the stage selection, next-step meaning, and chosen artifact paths produced by the side-effect-free resolver. They must not be defined as "whatever `status --refresh` currently does."

Required read-only guarantees:

- must not create a manifest when none exists
- must not rewrite an existing manifest
- must not back up, repair, or rename a corrupt manifest
- must not invoke behavior owned by `expect` or `sync`
- must not edit repo-tracked spec or plan docs under any circumstance
- must not change the effective workflow state merely because the public CLI was run

Read-only inspection may still:

- read authoritative repo docs
- read an existing manifest as a hint
- inspect alternate or prior manifests as read-only diagnostic candidates when needed to explain recoverable state
- ignore an invalid or mismatched manifest
- report that local manifest state appears corrupt, stale, mismatched, or ambiguous

### Authority Model

The existing authority split remains unchanged:

- spec approval truth lives in the spec document headers
- plan approval truth lives in the plan document headers and source-spec linkage
- the manifest may provide expected artifact paths, but it is not the approval authority

If repo docs and local manifest state disagree:

- the public CLI must treat repo docs as authoritative when available
- the public CLI must report the earlier safe stage
- the public CLI must explain the reason in human language

### Why Not A Separate Public Parser

This spec rejects a separate public artifact parser and workflow engine.

That approach would:

- duplicate routing logic the repo just spent multiple releases hardening
- create drift risk between the public CLI and internal runtime behavior
- force every future workflow change to update two sources of derivation logic

The public CLI should be a presentation layer over one routing brain, not a second workflow brain.

## State Handling Rules

The public CLI covers the same product-workflow states as the internal helper up to `implementation_ready`.

It must support and explain at least these conditions:

- no workflow docs present
- one draft spec
- one approved spec without a plan
- one draft plan
- one stale approved plan
- one implementation-ready plan
- malformed spec headers
- malformed plan headers
- ambiguous spec discovery
- ambiguous plan discovery
- missing expected spec
- missing expected plan
- manifest repo-root mismatch
- manifest branch mismatch
- prior-manifest recovery opportunities
- corrupt local manifest

For corrupt or mismatched local state, the public CLI must prefer transparency over repair. If repair is useful later, that remains the job of internal helper behavior or skill-driven flows, not the supported public inspection surface.

When alternate or prior manifests are inspected in read-only mode:

- they are diagnostic inputs only
- they must not be adopted as the active manifest
- they must not be rewritten, backed up, moved, or normalized
- the public CLI may report that recoverable prior state exists, but it must still leave repair or reconciliation to internal helper behavior or skill-driven flows
- the candidate scan must use the same bounded limit and selection policy as the internal helper's recovery path so the public and internal surfaces cannot silently diverge

When the resolved state is `implementation_ready`:

- `status` reports that the repo is ready for implementation handoff
- `artifacts` shows the approved plan path that defines the handoff target
- `next` stops at "use the approved plan for execution handoff" and does not cross into execution recommendation behavior
- `explain` may clarify that execution recommendation belongs to `plan-eng-review` and `superpowers-plan-execution`, which remain separate runtime surfaces

## Testing Requirements

This enhancement must ship with a thorough public CLI test surface. The non-mutation guarantee is as important as the feature itself.

### 1. Public Command Matrix

Add regression coverage for all supported public commands:

- `status`
- `next`
- `artifacts`
- `explain`
- `help`

Cover every user-visible workflow condition the public surface can report:

- bootstrap with no docs
- draft spec
- approved spec with no plan
- draft plan
- stale approved plan
- implementation ready
- malformed spec
- malformed plan
- ambiguous spec discovery
- ambiguous plan discovery
- missing expected spec
- missing expected plan
- repo-root mismatch
- branch mismatch
- prior-manifest recovery opportunity
- corrupt manifest present

The implementation plan must also include an explicit command-by-state coverage matrix. At minimum, it must account for every combination of:

- `status`
- `next`
- `artifacts`
- `explain`
- `help`

against every supported public state or failure condition:

- bootstrap with no docs
- draft spec
- approved spec with no plan
- draft plan
- stale approved plan
- implementation ready
- malformed spec
- malformed plan
- ambiguous spec discovery
- ambiguous plan discovery
- missing expected spec
- missing expected plan
- repo-root mismatch
- branch mismatch
- prior-manifest recovery opportunity
- corrupt manifest present
- invocation outside a git repo
- resolver-classified `runtime_failure`

Each cell in that matrix must be one of:

- covered by an explicit test
- intentionally unsupported, with the user-visible behavior documented
- intentionally routed to a simpler shared behavior, with that shared behavior tested

No command/state combination may be left implicit.

### 2. Non-Mutation Guarantees

Add explicit tests that every public inspection command:

- leaves repo-tracked docs byte-identical
- leaves an existing manifest byte-identical
- does not create a manifest when none exists
- does not back up, repair, rename, or rewrite corrupt manifests
- does not invoke or emulate `expect` or `sync`

If the implementation ever needs ephemeral computation state, it must not persist that state as a side effect of a public inspection command in v1.

### 3. Public/Private Semantic Parity

For each supported repo-state fixture:

- compare the public CLI meaning against the internal helper's side-effect-free resolved state
- require semantic alignment on:
  - selected workflow stage
  - next safe action
  - chosen spec path
  - chosen plan path when applicable

The text can differ. The workflow meaning cannot.

This parity contract must be anchored to the read-only resolver itself. It must not depend on the current mutating `status` codepath in corrupt-manifest, mismatch, or recovery scenarios.

### 4. Output Contract Coverage

Treat public wording as a real compatibility surface.

Add golden or fixture-based tests for:

- `status`
- `next`
- `artifacts`
- `explain`
- `help`

Normalize dynamic values in test output where needed:

- temp paths
- usernames
- repo roots
- timestamps

Copy changes to the public CLI should be intentional and reviewed, not accidental side effects of internal helper changes.

### 5. Failure-Mode Coverage

Add explicit coverage for:

- invalid command names
- unknown flags
- invocation outside a git repo
- missing or unreadable repo context
- `help` outside a git repo
- debug-mode output on resolved states
- debug-mode output on named failure-class paths
- wrapper execution failures
- runtime failures that should exit nonzero
- resolver-classified `runtime_failure` results

Also verify that conservative fallback results still exit `0`.

### 6. PowerShell Parity

Add parity coverage for `bin/superpowers-workflow.ps1`:

- same command set
- same stage semantics
- same non-mutation guarantees
- same human-facing meaning
- same debug-mode semantics where supported

Wrapper parity should be tested semantically, not just by asserting that the wrapper launches.

### 7. Documentation Contract Coverage

Update and test documentation so it clearly states:

- `superpowers-workflow` is the supported public inspection surface
- `superpowers-workflow-status` remains internal
- v1 does not promise public JSON
- v1 does not promise execution-stage inspection

### 8. Regression Policy

Any future change to workflow-state derivation should run both:

- the internal helper suite
- the public CLI semantic-parity suite

Superpowers should not be able to change internal routing meaning without either:

- preserving public CLI behavior
- or intentionally updating the public surface and its golden fixtures

## Documentation And Rollout

Update these docs in this change:

- `README.md`
- `docs/README.codex.md`
- `docs/README.copilot.md`
- any runtime-helper references that currently imply the internal helper is the user-facing inspection entrypoint

Documentation changes should:

- promote `superpowers-workflow` as the supported way to inspect workflow state
- continue to describe `superpowers-workflow-status` as an internal runtime helper
- show example invocations using the install-root binary path
- explain that public inspection commands are read-only

This change should not deprecate `superpowers-workflow-status`. It remains a valid internal helper and skill-facing implementation surface.

## Success Criteria

This enhancement is successful when:

- a user can answer "where am I?", "why?", and "what next?" without reading local manifests, skill docs, or raw reason codes
- the supported public inspection commands are demonstrably non-mutating
- the public CLI stays semantically aligned with the internal routing logic
- README and platform docs can confidently point users at one supported workflow inspection command

## Alternatives Considered

### Thin Wrapper Over Current `status --refresh`

Rejected as-is.

Although the internal helper already derives the right workflow meaning, its current `status` behavior can mutate local manifest state. A supported public inspection surface should not inherit that side effect model directly.

### Separate Public Parser

Rejected.

This would create a second workflow engine and increase drift risk between supported user output and internal routing behavior.

### Broader Public CLI Covering Execution In V1

Rejected for now.

The execution helper is a separate runtime surface with its own state machine. Product-workflow inspection should stabilize first before expanding the public scope to execution-stage inspection.

## Dream State Delta

```text
CURRENT STATE                      THIS SPEC                               12-MONTH IDEAL
internal helper only         ---> supported public read-only CLI     ---> durable operator surface for
machine-oriented output            for human workflow inspection           workflow inspection, explanation,
read can mutate local index        with explicit non-mutation rules        and later execution visibility
```

## Security & Threat Model

Threat: path confusion or directory spoofing
- Likelihood: Medium
- Impact: Medium
- Mitigation: public CLI requires git repo context for workflow inspection, fails outside a repo, and must not inherit the internal helper's `pwd` fallback.

Threat: unintended local state mutation from read commands
- Likelihood: High if unspecified
- Impact: High because it breaks user trust and the public support contract
- Mitigation: read-only resolver contract, explicit non-mutation tests, no manifest creation or repair, no persistent debug artifacts.

Threat: command or path injection through artifact discovery
- Likelihood: Low
- Impact: High
- Mitigation: reuse existing normalized repo-relative path handling and bounded manifest scanning; no new shell-eval surface is introduced by this CLI.

Threat: support/debug leakage through noisy internal paths
- Likelihood: Medium
- Impact: Low to Medium
- Mitigation: manifest paths hidden by default; only surfaced when materially relevant; debug mode is opt-in and ephemeral.

Threat: public/internal semantic drift
- Likelihood: Medium
- Impact: High
- Mitigation: parity is defined against the side-effect-free resolver contract, not mutating helper behavior, and enforced by a command-by-state matrix.

Threat: wrapper mismatch between Bash and PowerShell
- Likelihood: Medium
- Impact: Medium
- Mitigation: semantic parity tests on both wrappers, including failure classes and debug behavior.

## Data Flow

### Public Inspection Flow

```text
USER COMMAND
   |
   v
parse args
   |
   +--> invalid/unknown ----------> InvalidCommandInput -> nonzero stderr
   |
   +--> help ---------------------> help text -> exit 0
   |
   v
require git repo context
   |
   +--> not a repo ---------------> RepoContextUnavailable -> nonzero stderr
   |
   v
invoke read-only resolver
   |
   +--> resolved -----------------> render status/next/artifacts/explain -> exit 0
   |
   +--> runtime_failure ----------> named failure class + human stderr -> nonzero
```

### Shadow Paths

```text
INPUT -> VALIDATION -> RESOLUTION -> RENDER
  |         |             |           |
  v         v             v           v
[nil]   [bad flag]   [repo absent] [stdout failure]
[help]  [bad cmd]    [manifest bad][wrapper mismatch]
[debug] [wrong arity][ambiguous]   [unexpected shape]
```

Rules:
- `help` bypasses repo inspection.
- `--debug` follows the same resolver path and must not mutate state.
- ambiguity, malformed headers, stale linkage, and ignored manifest hints are `resolved` conservative outcomes, not runtime failures.

## State Machine

```text
needs_brainstorming
  |
  v
spec_draft
  |
  v
spec_approved_needs_plan
  |
  v
plan_draft
  |
  v
stale_plan
  | \
  |  \ corrected
  |   \
  |    v
  +--> implementation_ready

Invalid local manifest state does NOT create a new public workflow state.
It influences explanation and conservative routing only.
```

Invalid transitions prevented by this spec:
- public CLI must not transition workflow state by being run
- public CLI must not cross from `implementation_ready` into execution recommendation
- public CLI must not adopt alternate manifests as active state

## Error & Rescue Registry

```text
CODEPATH                         | WHAT CAN GO WRONG                         | FAILURE CLASS
---------------------------------|------------------------------------------|---------------------------
superpowers-workflow <command>   | unknown command/flag/arity               | InvalidCommandInput
public inspection preflight      | not inside git repo                      | RepoContextUnavailable
public inspection preflight      | repo root unreadable                     | RepoContextUnavailable
read-only resolver               | invalid resolver result shape            | ResolverContractViolation
read-only resolver               | unsupported CLI/resolver invocation pair | ResolverContractViolation
read-only resolver               | unexpected internal abort                | ResolverRuntimeFailure
shell/pwsh wrapper               | wrapper cannot invoke helper             | WrapperExecutionFailed
```

```text
FAILURE CLASS             | RESCUED? | RESCUE ACTION                                  | USER SEES
--------------------------|----------|------------------------------------------------|--------------------------------------------
InvalidCommandInput       | Y        | print usage/help and exit nonzero              | clear usage error
RepoContextUnavailable    | Y        | print repo-context guidance and exit nonzero   | "Run this inside a git repo"
ResolverContractViolation | N        | fail closed with explicit stderr + debug info  | explicit runtime failure
ResolverRuntimeFailure    | N        | fail closed with explicit stderr + debug info  | explicit runtime failure
WrapperExecutionFailed    | N        | fail closed with explicit stderr               | explicit wrapper/runtime failure
```

Conservative resolved outcomes are intentionally not failure classes:
- ambiguous spec or plan discovery
- malformed spec or plan headers
- stale plan linkage
- ignored manifest mismatch
- recoverable prior-manifest diagnostics

These remain `resolved` with exit `0` and actionable human explanation.

## Failure Modes Registry

```text
CODEPATH                  | FAILURE MODE                          | RESCUED? | TEST? | USER SEES?                    | LOGGED?
--------------------------|---------------------------------------|----------|-------|-------------------------------|--------
help                      | run outside repo                      | Y        | Y     | help text only                | N
status/next/artifacts     | run outside repo                      | Y        | Y     | explicit repo-context error   | Y(debug)
read-only resolver        | ambiguous spec discovery              | Y        | Y     | conservative fallback         | Y(debug)
read-only resolver        | malformed plan headers                | Y        | Y     | conservative fallback         | Y(debug)
read-only resolver        | corrupt current manifest              | Y        | Y     | diagnostic explanation        | Y(debug)
read-only resolver        | alternate manifest candidate exists   | Y        | Y     | diagnostic explanation        | Y(debug)
read-only resolver        | invalid result contract               | N        | Y     | explicit runtime failure      | Y
wrapper                   | helper invocation failure             | N        | Y     | explicit runtime failure      | Y
debug mode                | request debug on resolved state       | Y        | Y     | richer stdout/stderr only     | N
debug mode                | request debug on failure state        | Y        | Y     | richer stderr only            | N
```

No row is allowed to become `RESCUED=N`, `TEST=N`, and `USER SEES=Silent`.

## Observability & Debuggability

Required v1 observability:
- explicit human stderr for all named failure classes
- opt-in `--debug` output for resolver path, inspected artifact candidates, ignored manifest diagnostics, and failure class details
- no persistent debug artifacts
- parity tests that verify debug mode remains non-mutating

This spec does not require dashboards or telemetry because the public CLI is a local runtime surface, not a network service. The equivalent observability surface here is deterministic stderr/debug output plus strong regression coverage.

## Deployment & Rollout

Deployment sequence:

```text
1. Add read-only resolver contract to internal helper
2. Add public CLI + PowerShell wrapper
3. Add full command/state matrix tests
4. Update README and platform docs
5. Run runtime + wrapper + doc suites
6. Ship without deprecating internal helper
```

Rollback posture:

```text
public CLI breaks
   |
   v
revert public CLI binary/wrapper + docs
   |
   v
retain internal helper unchanged
   |
   v
existing skill routing continues to work
```

Post-deploy verification:
- `help` works outside a repo
- `status` fails outside a repo with explicit guidance
- bootstrap repo prints `Spec: none` and `Plan: none`
- draft spec repo points to `plan-ceo-review`
- implementation-ready repo stops at execution handoff without calling execution recommendation logic
- debug mode produces richer output without writing manifest state

## Long-Term Trajectory

This spec moves the project toward a clearer operator surface without prematurely freezing execution-stage inspection or a public JSON schema.

Reversibility: 4/5
- easy to remove or change wording before widespread adoption
- harder to change once docs and tests treat command wording as public contract

Primary follow-ups intentionally deferred:
- public execution-stage inspection
- public machine-readable JSON
- broader top-level command dispatcher

## Stale Diagram Audit

Touched diagrams and diagram-bearing docs:
- this spec now includes system/data/state/deploy/rollback ASCII diagrams
- [`README.md`](/Users/dmulcahey/development/skills/superpowers/README.md) contains the main workflow Mermaid diagram

Audit result:
- the existing README workflow diagram remains accurate because this spec adds a public inspection surface on top of `superpowers-workflow-status`; it does not change the workflow-state authority model or execution handoff ownership
- no existing ASCII diagrams in touched runtime-helper files are made stale by this spec
