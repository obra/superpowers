# Workflow State Runtime
**Workflow State:** CEO Approved
**Spec Revision:** 1
**Last Reviewed By:** plan-ceo-review

## Summary

Add a manifest-backed workflow runtime layer that can determine the next safe Superpowers stage even when no spec or plan artifacts exist yet. Repo documents remain authoritative for approvals and revision gates; the runtime manifest exists to bootstrap missing-artifact states, index expected artifact paths, and reconcile local workflow state against the repo.

## Problem

The current product-workflow router assumes that relevant workflow artifacts already exist under `docs/superpowers/specs/` and `docs/superpowers/plans/`. That works once a workflow is already in motion, but it breaks down in the exact bootstrap case where the runtime should be most helpful:

- a repo has no workflow artifacts yet
- a workflow has started conceptually but the next artifact has not been written yet
- a user or agent needs to know the next safe stage before any design or plan document exists
- a local session has enough context to continue, but artifact discovery alone cannot tell whether the expected next document is missing, pending, or stale

This creates an avoidable gap between Superpowers' product promise and the runtime's current behavior. The system already has durable runtime state under `~/.superpowers/` and already uses cross-session artifacts for QA handoff. Product workflow state should get the same kind of bootstrap support without making local runtime state the approval authority.

## Goals

- Determine the next safe workflow stage for product work even when no spec or plan artifact exists yet.
- Preserve repo documents as the authoritative source for approval state and revision linkage.
- Add a reconstruction-friendly runtime manifest that records expected artifact paths and current derived workflow status.
- Provide a helper binary that relevant skills can call instead of reimplementing routing logic in prose alone.
- Fail closed to the earlier safe stage when repo docs and manifest state disagree.
- Support lazy backfill for existing repositories with zero explicit migration.

## Not In Scope

- Make local runtime state authoritative over repo-tracked workflow docs.
- Replace spec and plan header contracts with manifest-only approval semantics.
- Expand v1 beyond the default product-workflow pipeline (`brainstorming -> plan-ceo-review -> writing-plans -> plan-eng-review -> implementation`).
- Ship a supported user-facing workflow CLI in this change.

## What Already Exists

- `skills/using-superpowers/SKILL.md` already defines the artifact-state routing contract and exact workflow headers for spec/plan transitions.
- `bin/superpowers-config`, `bin/superpowers-update-check`, and `bin/superpowers-migrate-install` already establish the runtime-helper pattern this spec should follow.
- `~/.superpowers/` already stores runtime state for sessions, contributor logs, config, update checks, and project-scoped QA artifacts.
- `skills/plan-eng-review/SKILL.md` and `skills/qa-only/SKILL.md` already use `~/.superpowers/projects/<repo-slug>/...` artifacts for cross-session handoff.
- `tests/codex-runtime/fixtures/workflow-artifacts/` already provides deterministic spec/plan fixtures that can be reused for helper behavior tests.

## Dream State Delta

```text
CURRENT STATE                      THIS SPEC                              12-MONTH IDEAL
doc parsing only after docs exist  helper + branch-scoped workflow index  durable workflow runtime with
                                   bootstraps missing artifacts           stable user-facing inspection tools
```

## Proposed Architecture

Add two new runtime surfaces:

1. `bin/superpowers-workflow-status`
2. `~/.superpowers/projects/<repo-slug>/<user>-<safe-branch>-workflow-state.json`

The helper binary is the runtime entrypoint. It reads and updates a branch-scoped manifest for the current repo, inspects any existing workflow docs, and returns the current derived status plus the next safe skill. The manifest is a local index, not the approval record.

Authority split:

- Spec approval comes from the spec document headers.
- Plan approval comes from the plan document headers and source-spec linkage.
- The manifest may record that a spec or plan path is expected before the file exists.
- If a spec or plan file exists, the helper reparses the file and treats its headers as authoritative.
- If the manifest and docs disagree, the helper routes to the earlier safe stage and reports the mismatch.

### System Architecture

```text
user request
   |
   v
using-superpowers / review skill
   |
   v
superpowers-workflow-status
   |                    |
   |                    +--> branch-scoped manifest
   |                          ~/.superpowers/projects/<slug>/<user>-<safe-branch>-workflow-state.json
   |
   +--> repo docs
         docs/superpowers/specs/*.md
         docs/superpowers/plans/*.md
```

### High-Level Flow

```text
user request
   |
   v
using-superpowers
   |
   v
superpowers-workflow-status --refresh
   |
   +--> no manifest, no docs
   |       -> bootstrap manifest
   |       -> next skill: brainstorming
   |
   +--> manifest exists, docs missing
   |       -> use manifest intent
   |       -> next skill: earlier safe stage
   |
   +--> docs exist
           -> parse authoritative headers
           -> reconcile manifest
           -> next skill from approved/draft state
```

## Manifest Contract

Manifest location:

- `~/.superpowers/projects/<repo-slug>/<user>-<safe-branch>-workflow-state.json`

Shipped v1 persisted shape:

The helper's internal manifest schema is intentionally flat and shell-friendly in v1. It is an internal runtime contract, not a supported public workflow-CLI schema.

```json
{
  "version": 1,
  "repo_root": "/abs/path/to/repo",
  "branch": "dm-enhancements",
  "expected_spec_path": "docs/superpowers/specs/2026-03-17-workflow-state-runtime-design.md",
  "expected_plan_path": "docs/superpowers/plans/2026-03-17-workflow-state-runtime.md",
  "status": "needs_brainstorming",
  "next_skill": "superpowers:brainstorming",
  "updated_at": "2026-03-17T12:34:56Z"
}
```

Rules:

- `status` is derived and may be rewritten whenever the helper refreshes from docs.
- `expected_spec_path` and `expected_plan_path` may be recorded before the corresponding file exists.
- Artifact paths should be repo-relative for portability; `repo_root` is stored only to identify the current checkout context.
- The manifest is branch-scoped so concurrent branches or worktrees in the same repo slug do not overwrite each other's workflow state.
- Manifest writes must be atomic: write to a temp file in the same directory and rename into place.
- The manifest must remain reconstructable from repo context plus artifact discovery.
- The manifest must never be the sole source of approval truth.

## Helper Interface

The helper is internal-first in v1. It should expose machine-readable output by default and a short human summary when requested.

### Commands

```text
superpowers-workflow-status status [--refresh] [--summary]
superpowers-workflow-status expect --artifact spec|plan --path <repo-relative-path>
superpowers-workflow-status sync --artifact spec|plan [--path <repo-relative-path>]
```

Behavior:

- `status`
  - Resolves current workflow state from manifest plus repo docs.
  - Creates the manifest lazily if none exists.
  - Defaults to JSON output.
- `status --refresh`
  - Forces reconciliation from current repo docs before returning.
- `status --summary`
  - Prints a compact human-readable line instead of JSON.
  - The shipped v1 shape is `status=<status> next=<next-action> spec=<spec-path> plan=<plan-path> reason=<reason>`.
  - `status --summary` is human-oriented and not the machine-routing surface skills consume.
- `expect`
  - Records the intended future path for a spec or plan before the file exists.
- `sync`
  - Reads the actual file, parses authoritative headers, and updates manifest discovery fields.
- `expect` and `sync`
  - Reject absolute paths, `..` traversal, and any normalized path that resolves outside the repo root.
- `reason`
  - `reason` is the canonical diagnostic field in helper JSON output and persisted manifest state when a diagnostic is present.
  - `note` may remain as a compatibility alias, but it must mirror `reason` exactly.

Exit codes:

- Exit `0` for successful state resolution, including safe-stage fallback outcomes.
- Exit nonzero only for true helper/runtime failures, such as invalid invocation or unreadable repo state.

### Expected Status Outcomes

Examples:

- No manifest, no docs -> `superpowers:brainstorming`
- Manifest expects spec path, file still missing -> `superpowers:brainstorming`
- Draft spec exists -> `superpowers:plan-ceo-review`
- Approved spec exists, no plan exists -> `superpowers:writing-plans`
- Draft plan exists -> `superpowers:plan-eng-review`
- Approved plan references stale spec revision -> `superpowers:writing-plans`
- Approved plan matches current approved spec revision -> implementation handoff

### Workflow State Machine

```text
needs_brainstorming
  |
  v
spec_draft ----------------------+
  |                              |
  v                              |
spec_approved_needs_plan         |
  |                              |
  v                              |
plan_draft -------------------+  |
  |                           |  |
  v                           |  |
plan_approved_current         |  |
  |                           |  |
  v                           |  |
implementation_ready          |  |
                              |  |
malformed_or_ambiguous -------+--+
      |
      v
earlier_safe_stage
```

## Skill Integration

Relevant skills stop treating artifact inspection as purely ad hoc shell logic and instead call the helper first.

Generated skills call `$_SUPERPOWERS_ROOT/bin/superpowers-workflow-status`.

### `using-superpowers`

- Calls `$_SUPERPOWERS_ROOT/bin/superpowers-workflow-status status --refresh`
- If the helper returns a non-empty `next_skill`, use that route.
- `next_skill` is only used when non-empty.
- If the helper returns `status` `implementation_ready`, present the normal execution handoff instead of fabricating a pseudo-skill.
- `implementation_ready` is a terminal status that hands off to execution.
- Uses returned `reason`
- Falls back to manual repo inspection only if the helper itself fails

### `brainstorming`

- Before writing the spec doc, records the intended spec path with `expect`
- After writing the spec doc, runs `sync --artifact spec`
- Leaves status in a draft-spec state that routes to `plan-ceo-review`

### `plan-ceo-review`

- Uses helper state to identify the current spec path when possible
- After spec edits or approval, runs `sync --artifact spec`
- If the spec becomes approved, helper resolves to `superpowers:writing-plans`

### `writing-plans`

- Reads the approved spec path from helper state when available
- Before writing the plan, records intended plan path with `expect`
- After writing the plan, runs `sync --artifact plan`
- Leaves status in a draft-plan state that routes to `plan-eng-review`

### `plan-eng-review`

- Refreshes plan and linked spec state through the helper
- If plan approval succeeds and source-spec revision is current, helper resolves to implementation
- If the linked approved spec revision is stale, helper routes back to `superpowers:writing-plans`

## Reconciliation Rules

The helper must fail closed.

- If the manifest says a spec exists but the file is missing, treat it as a missing artifact and route earlier.
- If the manifest says a plan exists but the file is missing, treat it as a missing artifact and route earlier.
- If a doc exists but required headers are malformed, treat that doc as draft/malformed and route earlier.
- If the manifest claims approval but the doc headers do not, the doc wins.
- If multiple candidate docs exist and the helper cannot determine which one is current, route to the earlier safe stage and explain the ambiguity.
- If the manifest is corrupted, move it to a timestamped backup, emit a warning, rebuild a fresh manifest from current repo context and any discoverable workflow docs, and route conservatively for that invocation.
- If the manifest is deleted, rebuild it from current repo context and any discoverable workflow docs.

### Reconciliation Flow

```text
manifest present?
  |
  +--> no
  |      -> create bootstrap manifest
  |
  +--> yes
         |
         v
   docs present?
         |
         +--> no
         |      -> keep intent fields
         |      -> route earlier safe stage
         |
         +--> yes
                -> parse headers
                -> compare manifest vs docs
                -> authoritative docs win
                -> update derived workflow status
```

### Error Flow

```text
helper invocation
   |
   +--> corrupted manifest
   |       -> backup
   |       -> warn
   |       -> rebuild
   |       -> earlier safe stage for this invocation
   |
   +--> malformed doc headers
   |       -> report malformed artifact
   |       -> treat as draft
   |       -> earlier safe stage
   |
   +--> path escape attempt
           -> reject input
           -> do not write manifest state
           -> surface explicit error
```

## Error Handling

Specific failure modes the helper and skills must surface explicitly:

- Missing artifact expected by manifest
- Malformed workflow headers in spec
- Malformed workflow headers in plan
- Approved plan linked to missing spec
- Approved plan linked to stale spec revision
- Multiple candidate specs with no unambiguous current winner
- Multiple candidate plans with no unambiguous current winner
- Corrupted manifest JSON
- Repo identity mismatch caused by moved checkout or changed remote slug
- Rejected path input that attempts to escape the repo root
- Concurrent manifest write conflict or partial write attempt

User-facing behavior for these cases should remain conservative:

- report the mismatch or malformed state
- preserve debugging evidence when repairing corrupted local workflow state
- route to the earlier safe stage
- avoid silently promoting workflow state

## Error & Rescue Registry

```text
METHOD/CODEPATH                       | WHAT CAN GO WRONG                           | EXCEPTION / FAILURE CLASS
--------------------------------------|---------------------------------------------|---------------------------
workflow-status status --refresh      | manifest missing                            | ManifestMissing
                                      | manifest JSON invalid                        | ManifestCorrupt
                                      | spec headers malformed                       | MalformedSpecHeaders
                                      | plan headers malformed                       | MalformedPlanHeaders
                                      | spec/plan ambiguity                          | AmbiguousArtifacts
                                      | repo identity mismatch                       | RepoIdentityMismatch
workflow-status expect                | path escapes repo root                       | InvalidArtifactPath
                                      | manifest write conflict                      | ManifestWriteConflict
workflow-status sync                  | artifact file missing                        | MissingArtifact
                                      | artifact headers malformed                   | MalformedArtifactHeaders
                                      | source spec revision stale                   | StaleSourceSpecRevision
                                      | path escapes repo root                       | InvalidArtifactPath
```

```text
EXCEPTION / FAILURE CLASS             | RESCUED? | RESCUE ACTION                                      | USER SEES
--------------------------------------|----------|----------------------------------------------------|-------------------------------
ManifestMissing                       | Y        | create bootstrap manifest                          | next safe stage summary
ManifestCorrupt                       | Y        | backup, warn, rebuild, conservative route          | warning + earlier safe stage
MalformedSpecHeaders                  | Y        | treat spec as draft/malformed                       | explicit malformed-spec message
MalformedPlanHeaders                  | Y        | treat plan as draft/malformed                       | explicit malformed-plan message
AmbiguousArtifacts                    | Y        | do not guess; route earlier                         | explicit ambiguity message
RepoIdentityMismatch                  | Y        | rebuild using current repo context; warn            | warning + conservative route
InvalidArtifactPath                   | Y        | reject update, preserve current state               | explicit invalid-path error
ManifestWriteConflict                 | Y        | retry atomic write once, then conservative route    | warning + retry/conservative route
MissingArtifact                       | Y        | keep expected path, route earlier                   | missing-artifact message
StaleSourceSpecRevision               | Y        | route back to writing-plans                         | stale-plan explanation
```

## Failure Modes Registry

```text
CODEPATH                              | FAILURE MODE                           | RESCUED? | TEST? | USER SEES?                  | LOGGED?
--------------------------------------|----------------------------------------|----------|-------|-----------------------------|--------
status --refresh                      | corrupted manifest JSON                | Y        | Y     | warning + safe-stage route  | Y
status --refresh                      | malformed spec headers                 | Y        | Y     | malformed-spec message      | Y
status --refresh                      | malformed plan headers                 | Y        | Y     | malformed-plan message      | Y
status --refresh                      | ambiguous candidate artifacts          | Y        | Y     | ambiguity message           | Y
expect                                | path traversal / out-of-repo path      | Y        | Y     | invalid-path error          | Y
expect / sync                         | concurrent write conflict              | Y        | Y     | warning if retry fails      | Y
sync --artifact spec|plan             | expected artifact missing              | Y        | Y     | missing-artifact message    | Y
sync --artifact plan                  | stale source-spec revision             | Y        | Y     | routed back to planning     | Y
```

## Security & Threat Model

- **Path traversal / local file abuse**
  - Threat: `expect` or `sync` is given a path outside the repo.
  - Likelihood: medium.
  - Impact: high if trusted.
  - Mitigation: normalize and reject absolute, parent-traversal, or out-of-repo paths.

- **Manifest tampering or corruption**
  - Threat: local state is edited or truncated and then trusted.
  - Likelihood: medium.
  - Impact: medium.
  - Mitigation: treat the manifest as untrusted cache, preserve corrupted backups, rederive from docs, route conservatively.

- **Cross-branch state clobbering**
  - Threat: multiple active branches overwrite each other's workflow state.
  - Likelihood: high without branch scoping.
  - Impact: medium/high.
  - Mitigation: branch-scoped manifest paths.

- **Concurrent writes**
  - Threat: two sessions on the same branch produce partial or stale manifest writes.
  - Likelihood: medium.
  - Impact: medium.
  - Mitigation: atomic same-directory write+rename, retry once on conflict, route conservatively on repeated failure.

## Testing

Add a dedicated shell regression suite for the helper, following the runtime helper test style already used in this repo.

Required scenarios:

- bootstrap with no manifest and no workflow docs
- manifest bootstrap when `docs/superpowers/` does not exist
- draft spec resolution
- approved spec without plan resolution
- draft plan resolution
- approved plan with current spec resolution
- approved plan with stale spec revision resolution
- malformed spec headers
- malformed plan headers
- manifest/doc mismatch
- corrupted manifest recovery
- corrupted manifest backup plus warning emission
- helper-created manifest backfilled from existing valid docs
- rejection of path traversal or out-of-repo artifact paths

Test strategy:

- use fixture-backed workflow docs for deterministic approval-state scenarios
- add purpose-built temporary repos for missing-artifact and corruption scenarios
- extend sequencing tests to assert that workflow-critical skills call the helper before manual inspection
- add Bash and PowerShell wrapper coverage in v1 to preserve parity across supported platforms

## Observability & Debuggability

- Emit explicit warnings for corrupted-manifest recovery, repo-identity mismatch, and repeated manifest write conflicts.
- Log helper decisions at a human-readable summary level suitable for debugging routing mistakes.
- Preserve corrupted-manifest backups for forensic debugging instead of silently discarding them.
- Include enough context in warnings to identify repo slug, branch, and selected artifact paths without dumping unrelated local state.

## Deployment & Rollout

Rollout principles:

- Ship this as an internal runtime primitive first.
- Limit v1 to the default product-workflow pipeline.
- Keep repo docs authoritative and document that clearly.
- Ship Bash and PowerShell wrapper parity in v1 because the helper sits on the critical path for supported-platform routing.

Rollback posture:

- Revert the helper integration in workflow-critical skills first if routing regresses.
- Treat the manifest as disposable cache; deleting branch-scoped manifests is a safe rollback aid.
- Preserve repo docs untouched during rollback so workflow approvals remain visible in git.

### Deployment Sequence

```text
add helper + wrappers
   ->
add helper tests
   ->
teach skills to call helper
   ->
update docs
   ->
validate sequencing + helper suites
```

### Rollback Flow

```text
helper regression detected
   |
   v
revert skill integration
   |
   v
delete disposable manifests if needed
   |
   v
fall back to doc-only routing
```

Migration behavior:

- No explicit migration command in v1
- Manifest created lazily on first helper use
- Existing repos with workflow docs are backfilled from those docs
- Existing repos without workflow docs start in bootstrap state and route to `superpowers:brainstorming`
- Deleting the manifest is safe; the helper recreates it
- Each active branch creates or refreshes its own manifest instead of sharing one repo-level workflow-state file

## Alternatives Considered

### Read-only artifact scanner

A read-only helper that only scans spec/plan docs is a simpler first step, but it does not solve the bootstrap problem where the runtime needs to know the next stage before artifacts exist.

### Manifest-authoritative workflow engine

Making the manifest authoritative would create a stronger long-term workflow engine, but it would also introduce hidden local truth and force approval semantics away from the repo docs. That is too large a conceptual shift for this change.

## Deferred Follow-Ups

- Add a supported user-facing CLI built on the same helper and manifest layer once the internal runtime contract is stable.
- Consider expanding the manifest pattern to other workflow surfaces only after the product-workflow pipeline proves reliable.

## Stale Diagram Audit

- Existing touched runtime-helper files do not currently contain ASCII diagrams that this spec would invalidate.
- Existing workflow diagrams in `skills/using-superpowers/SKILL.md` remain conceptually valid because docs stay authoritative and the helper only becomes the runtime mechanism for state resolution.

## Open Questions For Review

- Should the helper's human-readable summary be stable and documented now, or remain intentionally internal in v1?
- Should the helper store only the current artifact paths, or preserve a small bounded history of superseded paths for debugging?
- Should repo identity be keyed only from remote slug plus branch name, or should the manifest also store a stable repo UUID/fingerprint to handle renamed remotes more gracefully?
