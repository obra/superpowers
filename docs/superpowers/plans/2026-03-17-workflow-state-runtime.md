# Workflow State Runtime Implementation Plan

> **For Codex and GitHub Copilot workers:** REQUIRED: Use `superpowers:subagent-driven-development` when isolated-agent workflows are available in the current platform/session; otherwise use `superpowers:executing-plans`. Steps use checkbox (`- [ ]`) syntax for tracking.

**Workflow State:** Engineering Approved
**Source Spec:** `docs/superpowers/specs/2026-03-17-workflow-state-runtime-design.md`
**Source Spec Revision:** 1
**Last Reviewed By:** plan-eng-review

**Goal:** Add a branch-scoped workflow-status runtime helper that bootstraps missing workflow artifacts, keeps repo docs authoritative, and routes the product-workflow pipeline consistently on Unix-like and Windows installs.

**Architecture:** Implement a new `bin/superpowers-workflow-status` helper plus a PowerShell wrapper, store branch-scoped manifest state under `~/.superpowers/projects/<repo-slug>/`, and update workflow-critical skills to call the helper before manual artifact inspection. Keep the helper fail-closed: docs win when present, corrupted local state is backed up and rebuilt, and ambiguous or malformed state routes to the earlier safe stage.

**Tech Stack:** POSIX shell, PowerShell wrappers, generated `SKILL.md` docs from `SKILL.md.tmpl`, shell regression tests, existing Node freshness/contract tests

---

## What Already Exists

- `bin/superpowers-config`, `bin/superpowers-update-check`, and `bin/superpowers-migrate-install` already define the runtime-helper surface this work should match.
- `bin/superpowers-pwsh-common.ps1` already provides the Git Bash discovery and path-conversion primitives needed for PowerShell wrapper parity.
- `skills/using-superpowers/SKILL.md` already defines the product-workflow routing contract; this change replaces ad hoc routing logic with a helper-backed mechanism, not a new workflow.
- `tests/codex-runtime/fixtures/workflow-artifacts/` already provides approved spec/plan fixtures for status-resolution regression coverage.
- `skills/plan-eng-review/SKILL.md` and `skills/qa-only/SKILL.md` already use branch-aware artifacts under `~/.superpowers/projects/<repo-slug>/`.

## Not In Scope

- A supported user-facing workflow CLI: deferred until the internal helper contract is proven stable.
- Manifest-authoritative approvals: repo docs stay authoritative for workflow state transitions.
- Expanding helper-driven state to debugging, review feedback, QA-only, or branch-finishing flows in v1.
- New non-shell runtime dependencies for the helper.

## Diagrams

### Helper Data Flow

```text
skill invocation
   |
   v
workflow-status status --refresh
   |
   +--> branch-scoped manifest path
   |       ~/.superpowers/projects/<slug>/<user>-<safe-branch>-workflow-state.json
   |
   +--> expected spec/plan paths from manifest
   |       |
   |       +--> valid and current -> derive next skill
   |       |
   |       +--> missing/invalid -> bounded fallback discovery
   |
   +--> repo docs remain authoritative
```

### Files That Should Get Inline ASCII Diagram Comments

- `bin/superpowers-workflow-status` for the reconciliation flow and status-state transitions.

## Failure Modes

```text
CODEPATH                      | FAILURE MODE                        | TEST? | ERROR HANDLING? | USER SEES?
------------------------------|-------------------------------------|-------|-----------------|-------------------------------
status --refresh              | corrupted manifest                  | Y     | Y               | warning + earlier safe stage
status --refresh              | ambiguous artifacts after fallback  | Y     | Y               | ambiguity message
status --refresh              | stale approved plan                 | Y     | Y               | routed back to writing-plans
expect / sync                 | out-of-repo path input              | Y     | Y               | invalid-path error
manifest write                | concurrent write conflict           | Y     | Y               | warning if retry fails
branch-scoped state           | same repo, different branches       | Y     | Y               | independent manifests
```

### Task 1: Add Failing Workflow-Status Regression Coverage

**Files:**
- Create: `tests/codex-runtime/test-superpowers-workflow-status.sh`
- Modify: `tests/codex-runtime/test-runtime-instructions.sh`
- Test: `tests/codex-runtime/test-superpowers-workflow-status.sh`

- [ ] **Step 1: Write the failing helper regression scaffold**

```bash
#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
STATUS_BIN="$REPO_ROOT/bin/superpowers-workflow-status"

STATE_DIR="$(mktemp -d)"
REPO_DIR="$(mktemp -d)"
trap 'rm -rf "$STATE_DIR" "$REPO_DIR"' EXIT
export SUPERPOWERS_STATE_DIR="$STATE_DIR"

# bootstrap repo with no docs -> brainstorming
# draft spec -> plan-ceo-review
# approved spec with no plan -> writing-plans
# draft plan -> plan-eng-review
# stale approved plan -> writing-plans
# corrupted manifest -> backup + warning + conservative route
# out-of-repo path -> explicit failure
# same repo slug, different branches/worktrees -> independent manifests
```

- [ ] **Step 2: Run the new test to verify it fails because the helper does not exist yet**

Run: `bash tests/codex-runtime/test-superpowers-workflow-status.sh`
Expected: FAIL with `No such file or directory`, `command not found`, or missing-helper assertions.

- [ ] **Step 3: Extend the runtime validation set to require the new helper files and test**

```bash
# Add to FILES in tests/codex-runtime/test-runtime-instructions.sh
"bin/superpowers-workflow-status"
"bin/superpowers-workflow-status.ps1"
"tests/codex-runtime/test-superpowers-workflow-status.sh"
```

- [ ] **Step 4: Run runtime-instructions validation to verify the new references fail before implementation**

Run: `bash tests/codex-runtime/test-runtime-instructions.sh`
Expected: FAIL with missing-file errors for the new helper surfaces.

- [ ] **Step 4.5: Extend the failing regression scaffold with a same-repo multi-branch isolation case**

```bash
# Create two branches in the same temp repo and assert:
# - branch A writes .../user-branch-a-workflow-state.json
# - branch B writes .../user-branch-b-workflow-state.json
# - no status result on one branch reuses the other branch's manifest
```

- [ ] **Step 5: Commit the red test scaffold**

```bash
git add tests/codex-runtime/test-superpowers-workflow-status.sh tests/codex-runtime/test-runtime-instructions.sh
git commit -m "test: add workflow-status helper regression scaffold"
```

### Task 2: Implement the Bash Helper and Make the Shell Tests Pass

**Files:**
- Create: `bin/superpowers-workflow-status`
- Modify: `tests/codex-runtime/test-superpowers-workflow-status.sh`
- Test: `tests/codex-runtime/test-superpowers-workflow-status.sh`

- [ ] **Step 1: Implement the helper command skeleton with explicit subcommands**

```bash
#!/usr/bin/env bash
set -euo pipefail

usage() {
  echo "Usage: superpowers-workflow-status {status|expect|sync} ..."
}

case "${1:-}" in
  status) shift; cmd_status "$@" ;;
  expect) shift; cmd_expect "$@" ;;
  sync) shift; cmd_sync "$@" ;;
  *) usage; exit 1 ;;
esac
```

- [ ] **Step 2: Add shared repo/branch/manifest path resolution helpers**

```bash
REMOTE_URL="$(git remote get-url origin 2>/dev/null || true)"
SLUG="$(printf '%s\n' "$REMOTE_URL" | sed 's|.*[:/]\([^/]*/[^/]*\)\.git$|\1|;s|.*[:/]\([^/]*/[^/]*\)$|\1|' | tr '/' '-')"
[ -n "$SLUG" ] || SLUG="$(basename "$REPO_ROOT")"
BRANCH="$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo current)"
SAFE_BRANCH="$(printf '%s\n' "$BRANCH" | sed 's/[^[:alnum:]._-]/-/g')"
USER_NAME="$(whoami 2>/dev/null || echo user)"
MANIFEST_PATH="$STATE_DIR/projects/$SLUG/${USER_NAME}-${SAFE_BRANCH}-workflow-state.json"
```

- [ ] **Step 3: Implement atomic manifest read/write, bootstrap, and corruption recovery**

```bash
write_manifest() {
  local tmp
  tmp="$(mktemp "$MANIFEST_PATH.tmp.XXXXXX")"
  printf '%s\n' "$1" > "$tmp"
  mv "$tmp" "$MANIFEST_PATH"
}

backup_corrupt_manifest() {
  local stamp backup
  stamp="$(date +%Y%m%d-%H%M%S)"
  backup="$MANIFEST_PATH.corrupt-$stamp"
  mv "$MANIFEST_PATH" "$backup"
  printf 'WARNING: corrupted workflow manifest moved to %s\n' "$backup" >&2
}
```

- [ ] **Step 4: Implement bounded status derivation from expected paths first, fallback discovery second**

```bash
# First read manifest-declared spec/plan paths when present.
# Only if they are missing, malformed, or stale, perform bounded fallback discovery
# against docs/superpowers/specs/*.md and docs/superpowers/plans/*.md.
#
# Derive:
# needs_brainstorming -> superpowers:brainstorming
# spec_draft -> superpowers:plan-ceo-review
# spec_approved_needs_plan -> superpowers:writing-plans
# plan_draft -> superpowers:plan-eng-review
# stale_plan -> superpowers:writing-plans
# implementation_ready -> superpowers:subagent-driven-development or executing-plans handoff
```

- [ ] **Step 5: Implement `expect` and `sync` with shell-native repo-root path validation**

```bash
normalize_repo_relative_path() {
  local input="$1" part normalized=""
  case "$input" in
    ''|/*) return 1 ;;
  esac
  input="${input//\\//}"
  while IFS= read -r part; do
    case "$part" in
      ''|'.') continue ;;
      '..') return 1 ;;
      *) normalized="${normalized:+$normalized/}$part" ;;
    esac
  done < <(printf '%s\n' "$input" | tr '/' '\n')
  [ -n "$normalized" ] || return 1
  printf '%s\n' "$normalized"
}
```

- [ ] **Step 6: Cap refresh and write-conflict behavior explicitly**

```bash
# Refresh rules:
# - check manifest-declared paths first
# - if fallback discovery is needed, inspect only the newest bounded candidate set
#   (for example the newest few matching spec/plan docs, not an unbounded scan)
#
# Write-conflict rules:
# - atomic same-directory write + rename
# - single retry on conflict
# - conservative route if the retry still fails
```

- [ ] **Step 7: Run the helper regression suite until it passes**

Run: `bash tests/codex-runtime/test-superpowers-workflow-status.sh`
Expected: PASS with bootstrap, approval-state, corruption-recovery, branch-isolation, bounded-refresh, single-retry, and path-rejection assertions green.

- [ ] **Step 8: Commit the helper implementation**

```bash
git add bin/superpowers-workflow-status tests/codex-runtime/test-superpowers-workflow-status.sh
git commit -m "feat: add workflow-status runtime helper"
```

### Task 3: Add PowerShell Wrapper Parity and Windows-Facing Coverage

**Files:**
- Create: `bin/superpowers-workflow-status.ps1`
- Modify: `bin/superpowers-pwsh-common.ps1`
- Modify: `tests/codex-runtime/test-powershell-wrapper-bash-resolution.sh`
- Test: `tests/codex-runtime/test-powershell-wrapper-bash-resolution.sh`

- [ ] **Step 1: Add the PowerShell wrapper for the new helper**

```powershell
. (Join-Path $PSScriptRoot 'superpowers-pwsh-common.ps1')

$bashPath = Get-SuperpowersBashPath
$bashScript = Convert-SuperpowersPathToBash -Path (Join-Path $PSScriptRoot 'superpowers-workflow-status')
$output = & $bashPath $bashScript @args
$exitCode = $LASTEXITCODE

if ($exitCode -eq 0 -and $output -and $output.TrimStart().StartsWith('{')) {
  $output = Convert-SuperpowersJsonFieldPathsToWindows -JsonText $output -Fields @('root')
}

if ($null -ne $output) {
  $output
}
exit $exitCode
```

- [ ] **Step 2: Extend the shared PowerShell helper only if JSON field conversion needs nested-path support**

```powershell
# If repo.root is emitted as a nested field, either:
# 1) flatten the helper JSON output for v1, or
# 2) extend Convert-SuperpowersJsonFieldPathsToWindows to handle nested fields.
#
# Prefer option 1 unless nested conversion is already needed elsewhere.
```

- [ ] **Step 3: Add or extend wrapper regression coverage for the new script**

```bash
# Verify:
# - wrapper resolves bash via Get-SuperpowersBashPath
# - wrapper invokes bin/superpowers-workflow-status
# - JSON path fields remain usable on Windows if emitted
```

- [ ] **Step 4: Run the PowerShell wrapper regression test**

Run: `bash tests/codex-runtime/test-powershell-wrapper-bash-resolution.sh`
Expected: PASS, or SKIP with the existing no-PowerShell message on hosts without `pwsh`/`powershell`.

- [ ] **Step 5: Commit wrapper parity**

```bash
git add bin/superpowers-workflow-status.ps1 bin/superpowers-pwsh-common.ps1 tests/codex-runtime/test-powershell-wrapper-bash-resolution.sh
git commit -m "feat: add workflow-status powershell wrapper"
```

### Task 4: Integrate Workflow-Critical Skills and Regenerate Generated Docs

**Files:**
- Modify: `skills/using-superpowers/SKILL.md.tmpl`
- Modify: `skills/brainstorming/SKILL.md.tmpl`
- Modify: `skills/plan-ceo-review/SKILL.md.tmpl`
- Modify: `skills/writing-plans/SKILL.md.tmpl`
- Modify: `skills/plan-eng-review/SKILL.md.tmpl`
- Modify: `tests/codex-runtime/test-workflow-sequencing.sh`
- Modify: `tests/codex-runtime/skill-doc-contracts.test.mjs`
- Modify: generated `skills/*/SKILL.md` via `node scripts/gen-skill-docs.mjs`
- Test: `node scripts/gen-skill-docs.mjs --check`

Clarification for the shipped contract:

- Skills call `$_SUPERPOWERS_ROOT/bin/superpowers-workflow-status`.
- First, call `$_SUPERPOWERS_ROOT/bin/superpowers-workflow-status status --refresh`.
- If the helper returns a non-empty `next_skill`, use that route.
- If the helper returns `status` `implementation_ready`, present the normal execution handoff.
- `status --summary` is human-oriented, not the routing surface.
- `reason` is the canonical diagnostic field.

- [ ] **Step 1: Update `using-superpowers` to call the helper before manual artifact inspection**

```markdown
- First, call `$_SUPERPOWERS_ROOT/bin/superpowers-workflow-status status --refresh` when available.
- If it returns a non-empty `next_skill`, use that route.
- If it returns `status` `implementation_ready`, present the normal execution handoff.
- Only fall back to manual artifact inspection if the helper itself is unavailable or fails.
```

- [ ] **Step 2: Update `brainstorming`, `plan-ceo-review`, `writing-plans`, and `plan-eng-review` to use `expect` / `sync`**

```markdown
- `brainstorming`: record expected spec path before write, sync after write
- `plan-ceo-review`: sync spec after edits/approval
- `writing-plans`: record expected plan path before write, sync after write
- `plan-eng-review`: refresh status from helper before final execution handoff
```

- [ ] **Step 3: Regenerate all checked-in skill docs**

Run: `node scripts/gen-skill-docs.mjs`
Expected: regenerated `skills/*/SKILL.md` files with helper guidance included.

- [ ] **Step 4: Update sequencing/contract tests to assert helper-first routing language**

```bash
# Add required patterns such as:
# - "call `$_SUPERPOWERS_ROOT/bin/superpowers-workflow-status status --refresh`"
# - "If the helper returns a non-empty `next_skill`, use that route."
# - "If the helper returns `status` `implementation_ready`, present the normal execution handoff."
# - "record the intended spec path with `expect`"
# - "runs `sync --artifact spec`"
# - "runs `sync --artifact plan`"
```

- [ ] **Step 5: Run generated-doc freshness and workflow contract tests**

Run: `node scripts/gen-skill-docs.mjs --check`
Expected: PASS

Run: `node --test tests/codex-runtime/skill-doc-contracts.test.mjs`
Expected: PASS

Run: `bash tests/codex-runtime/test-workflow-sequencing.sh`
Expected: PASS

- [ ] **Step 6: Commit the skill/runtime integration**

```bash
git add skills/using-superpowers/SKILL.md.tmpl skills/brainstorming/SKILL.md.tmpl skills/plan-ceo-review/SKILL.md.tmpl skills/writing-plans/SKILL.md.tmpl skills/plan-eng-review/SKILL.md.tmpl skills/*/SKILL.md tests/codex-runtime/test-workflow-sequencing.sh tests/codex-runtime/skill-doc-contracts.test.mjs
git commit -m "feat: route workflow skills through status helper"
```

### Task 5: Update Runtime Docs, Release Notes, and End-to-End Validation

**Files:**
- Modify: `README.md`
- Modify: `docs/README.codex.md`
- Modify: `docs/README.copilot.md`
- Modify: `docs/testing.md`
- Modify: `RELEASE-NOTES.md`
- Modify: `tests/codex-runtime/test-runtime-instructions.sh`
- Test: `bash tests/codex-runtime/test-runtime-instructions.sh`

- [ ] **Step 1: Document the new helper and branch-scoped workflow manifest**

```markdown
- Runtime state now includes branch-scoped workflow manifests under `~/.superpowers/projects/<repo-slug>/`
- `bin/superpowers-workflow-status` resolves product-workflow stage before docs exist
- Repo docs remain authoritative for approval state
```

- [ ] **Step 2: Update Codex and Copilot docs for helper parity and runtime state**

```markdown
## Runtime Helpers
- `bin/superpowers-workflow-status`
- `bin/superpowers-workflow-status.ps1`
```

- [ ] **Step 3: Add a release-notes entry for the workflow-state runtime**

```markdown
### Workflow Runtime
- Added `bin/superpowers-workflow-status` with branch-scoped manifest bootstrap
- Added PowerShell wrapper parity
- Routed workflow-critical skills through the helper before manual artifact inspection
```

- [ ] **Step 4: Run the runtime-instructions suite and the full deterministic validation set**

Run: `bash tests/codex-runtime/test-runtime-instructions.sh`
Expected: PASS

Run: `node --test tests/codex-runtime/*.test.mjs`
Expected: PASS

Run: `bash tests/codex-runtime/test-workflow-enhancements.sh`
Expected: PASS

Run: `bash tests/codex-runtime/test-workflow-sequencing.sh`
Expected: PASS

Run: `bash tests/codex-runtime/test-superpowers-workflow-status.sh`
Expected: PASS

Run: `bash tests/codex-runtime/test-powershell-wrapper-bash-resolution.sh`
Expected: PASS or SKIP on hosts without PowerShell

- [ ] **Step 5: Commit docs and validation updates**

```bash
git add README.md docs/README.codex.md docs/README.copilot.md docs/testing.md RELEASE-NOTES.md tests/codex-runtime/test-runtime-instructions.sh
git commit -m "docs: document workflow-status runtime helper"
```
