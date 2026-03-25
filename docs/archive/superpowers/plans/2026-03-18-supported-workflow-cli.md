# Supported Workflow CLI Implementation Plan

> **For Codex and GitHub Copilot workers:** REQUIRED: Use `superpowers:subagent-driven-development` when isolated-agent workflows are available in the current platform/session; otherwise use `superpowers:executing-plans`. Steps use checkbox (`- [ ]`) syntax for tracking.

**Workflow State:** Engineering Approved
**Plan Revision:** 1
**Execution Mode:** superpowers:executing-plans
**Source Spec:** `docs/superpowers/specs/2026-03-18-supported-workflow-cli-design.md`
**Source Spec Revision:** 1
**Last Reviewed By:** plan-eng-review

**Goal:** Add a supported read-only workflow inspection CLI that gives humans stable `status`, `next`, `artifacts`, `explain`, and `help` commands without mutating manifests or repo docs during inspection.

**Architecture:** Extend `bin/superpowers-workflow-status` with an explicit read-only `resolve` entrypoint, then layer a new `bin/superpowers-workflow` presentation binary and PowerShell wrapper on top. Keep `bin/superpowers-workflow-status` as the internal helper for `expect`, `sync`, and mutating refresh behavior, but make the public CLI depend on that same conservative routing brain so public wording and internal workflow routing cannot silently drift.

**Tech Stack:** POSIX shell, PowerShell wrappers, shell regression tests, existing workflow fixtures, runtime documentation, release notes

---

## What Already Exists

Historical note: this section captures the draft-time repo state before the plan was executed. For the current shipped state, use the repo contents plus `docs/superpowers/execution-evidence/2026-03-18-supported-workflow-cli-r1-evidence.md`.

- `bin/superpowers-workflow-status` already resolves workflow state, reads and writes branch-scoped manifests, and owns `expect` / `sync`.
- `bin/superpowers-workflow-status.ps1` and `bin/superpowers-plan-execution.ps1` already establish the PowerShell wrapper pattern this feature should follow.
- `tests/codex-runtime/test-superpowers-workflow-status.sh` already covers the internal helper's conservative routing, manifest recovery, malformed headers, and summary behavior.
- `tests/codex-runtime/test-powershell-wrapper-bash-resolution.sh` already verifies wrapper argument forwarding, JSON path conversion, and nonzero exit preservation.
- `README.md`, `docs/README.codex.md`, `docs/README.copilot.md`, and `docs/testing.md` already document runtime helpers and deterministic test entrypoints.

## Planned File Structure

- Create: `bin/superpowers-workflow`
  Public human-facing CLI with `status`, `next`, `artifacts`, `explain`, `help`, and `--debug`.
- Create: `bin/superpowers-workflow.ps1`
  PowerShell wrapper for the public CLI that mirrors the existing bash-wrapper contract.
- Create: `tests/codex-runtime/test-superpowers-workflow.sh`
  Public CLI regression suite, including command-by-state coverage, non-mutation assertions, and failure-class/debug assertions.
- Modify: `bin/superpowers-workflow-status`
  Add a side-effect-free internal resolver entrypoint and preserve `expect` / `sync` ownership.
- Modify: `tests/codex-runtime/test-superpowers-workflow-status.sh`
  Add read-only resolver coverage and parity checks against the public CLI contract.
- Modify: `tests/codex-runtime/test-powershell-wrapper-bash-resolution.sh`
  Cover the new wrapper alongside the existing helper wrappers.
- Modify: `tests/codex-runtime/test-runtime-instructions.sh`
  Add the new binaries and test suite to the runtime validation set.
- Modify: `README.md`
- Modify: `docs/README.codex.md`
- Modify: `docs/README.copilot.md`
- Modify: `docs/testing.md`
- Modify: `RELEASE-NOTES.md`

## Not In Scope

- Changing the planning/execution skill routing pipeline.
- Replacing `bin/superpowers-workflow-status` with the public CLI for skill automation.
- Public mutation commands, public JSON guarantees, or execution-stage inspection.
- Unbounded manifest scans or manifest-authoritative workflow truth.
- TODO hygiene beyond the release note for this shipped surface; defer that to `superpowers:document-release` or a follow-up only if implementation exposes a real new backlog item.

## Implementation Notes

- Prefer an explicit internal resolver subcommand such as `resolve` over overloading `status --read-only`; it keeps the public/private boundary obvious in tests and docs.
- Keep human wording in `bin/superpowers-workflow`, not in the resolver entrypoint inside `bin/superpowers-workflow-status`.
- The read-only resolver must classify outcomes as either `resolved` or `runtime_failure`, plus a named failure class for all non-resolved outcomes.
- `help` must succeed outside a repo; all other public commands must fail with `RepoContextUnavailable` when no git repo context exists.
- Public inspection must never create, repair, rename, or rewrite manifests, including corrupt manifests and alternate manifest candidates.
- If release notes stay under the current top entry instead of a new version heading, do not touch `VERSION`.

## Diagrams

### Public CLI Data Flow

```text
user command
   |
   v
bin/superpowers-workflow
   |
   +--> help -------------------------------> static command text
   |
   +--> status / next / artifacts / explain
            |
            v
   bin/superpowers-workflow-status resolve
            |
            +--> repo docs (authoritative)
            |
            +--> current manifest as hint only
            |
            +--> bounded prior-manifest scan for diagnostics only
            |
            +--> resolved -----------------> human renderer -> exit 0
            |
            +--> runtime_failure ---------> human stderr + debug details -> nonzero
```

### Files That Should Get Inline ASCII Diagram Comments

- `bin/superpowers-workflow-status` for the split between read-only `resolve` and mutating `status` / `expect` / `sync`.
- `bin/superpowers-workflow` for command parsing, resolver invocation, and failure-class rendering.

## Command-By-State Coverage Matrix

`E` means an explicit test case. `S` means the command is intentionally routed through a shared renderer already covered elsewhere in the same suite. `U` means intentionally unsupported with explicit user-facing failure text.

| State / Failure | `status` | `next` | `artifacts` | `explain` | `help` |
| --- | --- | --- | --- | --- | --- |
| bootstrap with no docs | E | E | E | E | S |
| draft spec | E | E | E | E | S |
| approved spec, no plan | E | E | E | E | S |
| draft plan | E | E | E | E | S |
| stale approved plan | E | E | E | E | S |
| implementation ready | E | E | E | E | S |
| malformed spec | E | E | E | E | S |
| malformed plan | E | E | E | E | S |
| ambiguous spec discovery | E | E | E | E | S |
| ambiguous plan discovery | E | E | E | E | S |
| missing expected spec | E | E | E | E | S |
| missing expected plan | E | E | E | E | S |
| repo-root mismatch | E | E | E | E | S |
| branch mismatch | E | E | E | E | S |
| prior-manifest recovery opportunity | E | S | E | E | S |
| corrupt manifest present | E | S | E | E | S |
| outside git repo | U | U | U | U | E |
| resolver-classified runtime failure | E | E | E | E | S |

Each `S` row still needs an assertion that the command delegates to a shared renderer path rather than silently going untested.

## Test Review Diagram

```text
public CLI invocation
   |
   +--> help
   |     |
   |     +--> repo-independent static text
   |
   +--> status / next / artifacts / explain
         |
         +--> resolve current repo context
         |     |
         |     +--> bootstrap with no docs
         |     +--> draft spec
         |     +--> approved spec, no plan
         |     +--> draft plan
         |     +--> stale approved plan
         |     +--> implementation ready
         |     +--> malformed / ambiguous / missing artifact states
         |     +--> manifest mismatch / corrupt / prior-manifest diagnostics
         |     +--> outside-repo / runtime-failure path
         |
         +--> default human renderer
         |
         +--> --debug diagnostic renderer
         |
         +--> PowerShell wrapper parity path
```

Project-native automated tests required for every new branch above:

- `tests/codex-runtime/test-superpowers-workflow.sh`
  Covers the public command matrix, non-mutation assertions, runtime failures, debug output, and the execution-boundary rule.
- `tests/codex-runtime/test-superpowers-workflow-status.sh`
  Covers the internal `resolve` contract, failure classes, and parity against the public CLI's selected state and artifact paths.
- `tests/codex-runtime/test-powershell-wrapper-bash-resolution.sh`
  Covers wrapper forwarding plus at least one resolved-path and one failure/debug-path assertion for the public CLI wrapper.
- `tests/codex-runtime/test-runtime-instructions.sh`
  Covers runtime validation inventory and the public-doc surface.

## Failure Modes

| Codepath | Realistic failure | Test? | Error handling? | User sees? |
| --- | --- | --- | --- | --- |
| `superpowers-workflow status` outside repo | repo context cannot be derived | Y | Y | explicit repo-context error |
| `superpowers-workflow` on corrupt manifest | resolver accidentally repairs or renames manifest | Y | Y | diagnostic explanation, no mutation |
| `superpowers-workflow-status resolve` | invalid internal result contract | Y | Y | explicit runtime failure |
| `superpowers-workflow next` at `implementation_ready` | command crosses into execution recommendation behavior | Y | Y | explicit handoff-only wording |
| `superpowers-workflow.ps1` | wrapper drops stderr or exit code | Y | Y | explicit PowerShell failure |
| runtime docs | public/internal surfaces drift from shipped binaries | Y | Y | deterministic doc/test failure before release |

No critical gap remains in this plan if the tests above are implemented exactly as written.

## Task 1: Add Red Coverage For The Public CLI Contract

**Files:**
- Create: `tests/codex-runtime/test-superpowers-workflow.sh`
- Modify: `tests/codex-runtime/test-superpowers-workflow-status.sh`
- Modify: `tests/codex-runtime/test-runtime-instructions.sh`
- Test: `bash tests/codex-runtime/test-superpowers-workflow.sh`
- Test: `bash tests/codex-runtime/test-superpowers-workflow-status.sh`

- [x] **Step 1: Add a failing public CLI regression scaffold**
```bash
#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
WORKFLOW_BIN="$REPO_ROOT/bin/superpowers-workflow"
STATUS_BIN="$REPO_ROOT/bin/superpowers-workflow-status"

# cover:
# - status / next / artifacts / explain / help
# - every supported workflow state
# - outside-repo failure
# - --debug output
# - non-mutation of repo docs and manifest files
```

- [x] **Step 2: Add explicit red cases for read-only behavior**
```bash
# Assert before implementation:
# - running `superpowers-workflow status` does not create a manifest
# - running against a corrupt manifest does not create `.corrupt-*` backups
# - running against an existing manifest leaves file bytes unchanged
# - repo-tracked spec/plan docs remain byte-identical after each public command
```

- [x] **Step 3: Add failing runtime-failure coverage**
```bash
# Cover at least:
# - `status` outside a git repo -> nonzero + repo-context message
# - bad command / bad flag -> nonzero + invalid-input message
# - injected resolver failure -> nonzero + named failure class in debug output
```

- [x] **Step 4: Extend the internal-helper suite with red read-only resolver assertions**
```bash
# Add coverage that the internal helper exposes a side-effect-free resolver entrypoint:
# - same stage/artifact selection as the public CLI fixtures
# - no manifest mutation
# - same bounded candidate scan policy as the recovery path
```

- [x] **Step 5: Add the new runtime files to the validation set**
```bash
# Add to FILES in tests/codex-runtime/test-runtime-instructions.sh
"bin/superpowers-workflow"
"bin/superpowers-workflow.ps1"
"tests/codex-runtime/test-superpowers-workflow.sh"
```

- [x] **Step 6: Run the red tests and capture the expected failures**
Run: `bash tests/codex-runtime/test-superpowers-workflow.sh`
Expected: FAIL with missing-binary assertions or missing public-command behavior.

Run: `bash tests/codex-runtime/test-superpowers-workflow-status.sh`
Expected: FAIL because the internal read-only resolver contract does not exist yet.

Run: `bash tests/codex-runtime/test-runtime-instructions.sh`
Expected: FAIL with missing runtime file errors for the new CLI surfaces.

- [x] **Step 7: Commit the red test surface**
```bash
git add tests/codex-runtime/test-superpowers-workflow.sh tests/codex-runtime/test-superpowers-workflow-status.sh tests/codex-runtime/test-runtime-instructions.sh
git commit -m "test: add workflow cli contract coverage"
```

## Task 2: Add The Internal Read-Only Resolver And Preserve Existing Helper Semantics

**Files:**
- Modify: `bin/superpowers-workflow-status`
- Modify: `tests/codex-runtime/test-superpowers-workflow-status.sh`
- Test: `bash tests/codex-runtime/test-superpowers-workflow-status.sh`

- [x] **Step 1: Refactor the existing helper into explicit read-only and mutating phases**
```bash
# Inside bin/superpowers-workflow-status
# - keep shared parsing/path helpers near the top
# - isolate read-only resolution from manifest-writing helpers
# - make the command entrypoints call those smaller functions
```

- [x] **Step 2: Implement a read-only resolver entrypoint in the existing helper**
```bash
cmd_resolve() {
  # returns JSON with:
  # - outcome: resolved | runtime_failure
  # - failure_class: optional
  # - status
  # - next_skill
  # - spec_path
  # - plan_path
  # - reason
  # - explain_lines[]
  # - artifact_sources
}
```

- [x] **Step 3: Keep read-only resolution strictly non-mutating**
```bash
# Required guards inside `cmd_resolve` and the functions it calls:
# - never call write_manifest_with_retry
# - never call backup_corrupt_manifest
# - never call expect/sync helpers
# - read alternate manifests only as diagnostic candidates
```

- [x] **Step 4: Expose the internal resolver subcommand without changing the supported helper surfaces**
```bash
case "${1:-}" in
  status) shift; cmd_status "$@" ;;
  resolve) shift; cmd_resolve "$@" ;;  # internal, read-only
  expect) shift; cmd_expect "$@" ;;
  sync) shift; cmd_sync "$@" ;;
  *) usage; exit 1 ;;
esac
```

- [x] **Step 5: Preserve existing mutating helper semantics on the `status --refresh`, `expect`, and `sync` codepaths**
```bash
# Keep:
# - branch-scoped manifest writes
# - corruption backup / rebuild behavior
# - repo-identity mismatch recovery
# - canonical JSON fields used by skills
```

- [x] **Step 6: Add deterministic failure-class coverage to the helper suite**
```bash
# Assert:
# - outside repo read-only resolve -> RepoContextUnavailable
# - malformed invocation -> InvalidCommandInput
# - injected bad resolver contract -> ResolverContractViolation
# - injected unexpected abort -> ResolverRuntimeFailure
```

- [x] **Step 7: Run the helper suite until the read-only resolver contract passes**
Run: `bash tests/codex-runtime/test-superpowers-workflow-status.sh`
Expected: PASS with existing helper behavior preserved and new read-only resolver assertions green.

- [x] **Step 8: Commit the shared resolver extraction**
```bash
git add bin/superpowers-workflow-status tests/codex-runtime/test-superpowers-workflow-status.sh
git commit -m "refactor: add read-only workflow resolver"
```

## Task 3: Implement The Public Bash CLI

**Files:**
- Create: `bin/superpowers-workflow`
- Modify: `tests/codex-runtime/test-superpowers-workflow.sh`
- Test: `bash tests/codex-runtime/test-superpowers-workflow.sh`

- [x] **Step 1: Add the public command parser and shared option handling**
```bash
#!/usr/bin/env bash
set -euo pipefail

command="${1:-help}"
shift || true

case "$command" in
  status|next|artifacts|explain|help) ;;
  *) fail_invalid_input "Unsupported command: $command" ;;
esac
```

- [x] **Step 2: Implement `help` as a repo-independent command**
```text
Supported commands:
  superpowers-workflow status
  superpowers-workflow next
  superpowers-workflow artifacts
  superpowers-workflow explain
  superpowers-workflow help

Diagnostics:
  --debug  Show resolver details without changing workflow state
```

- [x] **Step 3: Shell out to the internal read-only resolver and validate the returned contract**
```bash
resolver_json="$("$STATUS_BIN" resolve --debug="$debug")" || {
  render_runtime_failure "WrapperExecutionFailed" "Could not run the internal workflow resolver."
}

# Validate required keys before rendering.
```

- [x] **Step 4: Render the public `status`, `next`, `artifacts`, and `explain` outputs**
```text
Workflow status: Plan writing needed
Why: The spec is approved, but no current plan is available.
Next: Use superpowers:writing-plans
Spec: docs/superpowers/specs/2026-03-18-supported-workflow-cli-design.md
Plan: none
```

- [x] **Step 5: Keep `implementation_ready` inside the product-workflow boundary**
```text
Next safe step: Use the approved plan for execution handoff.
Plan: docs/superpowers/plans/2026-03-18-supported-workflow-cli.md
Execution recommendation stays with superpowers-plan-execution.
```

- [x] **Step 6: Implement `--debug` without changing the default human contract**
```text
Debug:
- resolver_outcome=resolved
- inspected_manifest=/Users/.../workflow-state.json
- ignored_manifest_reason=branch_mismatch
- failure_class=RepoContextUnavailable
```

- [x] **Step 7: Run the public CLI suite until all supported states and failures pass**
Run: `bash tests/codex-runtime/test-superpowers-workflow.sh`
Expected: PASS with command-by-state, non-mutation, and debug/failure coverage green.

- [x] **Step 8: Commit the public bash CLI**
```bash
git add bin/superpowers-workflow tests/codex-runtime/test-superpowers-workflow.sh
git commit -m "feat: add public workflow cli"
```

## Task 4: Add PowerShell Wrapper Parity

**Files:**
- Create: `bin/superpowers-workflow.ps1`
- Modify: `tests/codex-runtime/test-powershell-wrapper-bash-resolution.sh`
- Modify: `tests/codex-runtime/test-superpowers-workflow.sh`
- Test: `bash tests/codex-runtime/test-powershell-wrapper-bash-resolution.sh`

- [x] **Step 1: Add the PowerShell wrapper using the existing shared helper**
```powershell
. (Join-Path $PSScriptRoot 'superpowers-pwsh-common.ps1')

$bashPath = Get-SuperpowersBashPath
$bashScript = Convert-SuperpowersPathToBash -Path (Join-Path $PSScriptRoot 'superpowers-workflow')
$output = & $bashPath $bashScript @args
$exitCode = $LASTEXITCODE
```

- [x] **Step 2: Preserve JSON path conversion only where the wrapper is actually returning JSON diagnostics**
```powershell
if ($exitCode -eq 0 -and $outputText.TrimStart().StartsWith('{')) {
  $outputText = Convert-SuperpowersJsonFieldPathsToWindows -JsonText $outputText -Fields @('root')
}
```

- [x] **Step 3: Extend wrapper regression coverage for the new binary**
```bash
# Assert:
# - wrapper selects Git Bash
# - wrapper forwards args unchanged
# - wrapper preserves nonzero exit codes
# - wrapper handles debug/error output without truncation
# - wrapper exercises one resolved public CLI path and one runtime-failure/debug path
```

- [x] **Step 4: Run the wrapper regression suite**
Run: `bash tests/codex-runtime/test-powershell-wrapper-bash-resolution.sh`
Expected: PASS or SKIP with the new `superpowers-workflow.ps1` assertions green on hosts with PowerShell.

- [x] **Step 5: Commit wrapper parity**
```bash
git add bin/superpowers-workflow.ps1 tests/codex-runtime/test-powershell-wrapper-bash-resolution.sh tests/codex-runtime/test-superpowers-workflow.sh
git commit -m "feat: add workflow cli powershell wrapper"
```

## Task 5: Document The Supported Public Surface And Close The Loop

**Files:**
- Modify: `README.md`
- Modify: `docs/README.codex.md`
- Modify: `docs/README.copilot.md`
- Modify: `docs/testing.md`
- Modify: `RELEASE-NOTES.md`
- Modify: `tests/codex-runtime/test-runtime-instructions.sh`
- Test: `bash tests/codex-runtime/test-runtime-instructions.sh`

- [x] **Step 1: Update runtime docs to distinguish the public CLI from the internal helper**
```markdown
- `bin/superpowers-workflow` is the supported public inspection CLI.
- `bin/superpowers-workflow-status` remains an internal helper for workflow automation.
- Public inspection commands are read-only and do not repair manifests.
```

- [x] **Step 2: Document the public commands and the execution-boundary rule**
```markdown
Supported commands:
- `status`
- `next`
- `artifacts`
- `explain`
- `help`

At `implementation_ready`, `next` stops at execution handoff and does not run `superpowers-plan-execution recommend`.
```

- [x] **Step 3: Update testing docs and runtime validation inventory**
```markdown
- Add `bash tests/codex-runtime/test-superpowers-workflow.sh`
- Clarify that public CLI tests assert non-mutation and debug/failure behavior
```

- [x] **Step 4: Record the feature in release notes**
```markdown
### Workflow Runtime
- Added supported public workflow inspection binaries: `bin/superpowers-workflow` and `bin/superpowers-workflow.ps1`
- Added a side-effect-free internal resolver contract shared by the internal helper and public CLI
- Added deterministic regression coverage for non-mutation, failure classes, and wrapper parity
```

- [x] **Step 5: Run the full deterministic validation set**
Run: `bash tests/codex-runtime/test-runtime-instructions.sh`
Expected: PASS

Run: `bash tests/codex-runtime/test-superpowers-workflow-status.sh`
Expected: PASS

Run: `bash tests/codex-runtime/test-superpowers-workflow.sh`
Expected: PASS

Run: `bash tests/codex-runtime/test-powershell-wrapper-bash-resolution.sh`
Expected: PASS or SKIP on hosts without PowerShell

Run: `bash tests/codex-runtime/test-workflow-enhancements.sh`
Expected: PASS

Run: `bash tests/codex-runtime/test-workflow-sequencing.sh`
Expected: PASS

Run: `node --test tests/codex-runtime/*.test.mjs`
Expected: PASS

- [x] **Step 6: Commit docs and release-surface updates**
```bash
git add README.md docs/README.codex.md docs/README.copilot.md docs/testing.md RELEASE-NOTES.md tests/codex-runtime/test-runtime-instructions.sh
git commit -m "docs: document supported workflow cli"
```
