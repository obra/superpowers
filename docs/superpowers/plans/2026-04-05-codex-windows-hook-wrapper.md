# Codex Windows Hook Wrapper Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a versioned PowerShell wrapper for Codex `SessionStart` on Windows and document it as the supported installation path.

**Architecture:** Keep the existing bash bootstrap logic as the single source of truth. Add one PowerShell adapter that sets the Codex target and delegates to `run-hook.cmd`, then update the Codex docs and contract tests around that adapter.

**Tech Stack:** PowerShell, bash, Markdown docs, existing Codex shell tests

---

### Task 1: Add the failing Windows wrapper contract test

**Files:**
- Modify: `tests/codex/test-using-superpowers-bootstrap.sh`
- Test: `tests/codex/test-using-superpowers-bootstrap.sh`

- [ ] **Step 1: Write the failing test**

```bash
is_windows_bash="false"
case "${OSTYPE:-}" in
    msys*|cygwin*|win32*) is_windows_bash="true" ;;
esac

if [ "$is_windows_bash" = "true" ]; then
    WRAPPER_SCRIPT="$REPO_ROOT/hooks/session-start-codex.ps1"

    if [ ! -f "$WRAPPER_SCRIPT" ]; then
        echo "  [FAIL] Windows wrapper missing: $WRAPPER_SCRIPT"
        exit 1
    fi
fi
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bash tests/codex/test-using-superpowers-bootstrap.sh`
Expected: FAIL on Windows because `hooks/session-start-codex.ps1` does not exist yet

### Task 2: Implement the PowerShell wrapper

**Files:**
- Create: `hooks/session-start-codex.ps1`
- Test: `tests/codex/test-using-superpowers-bootstrap.sh`

- [ ] **Step 1: Write minimal implementation**

```powershell
$ErrorActionPreference = "Stop"

$runHook = Join-Path $PSScriptRoot "run-hook.cmd"

if (-not (Test-Path -LiteralPath $runHook)) {
    Write-Error "Missing superpowers hook wrapper at $runHook"
    exit 1
}

$env:SUPERPOWERS_HOOK_TARGET = "codex"

& $runHook session-start

if ($null -eq $LASTEXITCODE) {
    exit 0
}

exit $LASTEXITCODE
```

- [ ] **Step 2: Expand the Windows test to assert output shape**

```bash
if [ "$is_windows_bash" = "true" ]; then
    wrapper_output=$(HOME="$TEST_HOME" powershell.exe -NoProfile -ExecutionPolicy Bypass -File "$WRAPPER_SCRIPT")
    assert_contains "$wrapper_output" '"hookSpecificOutput"' "PowerShell wrapper uses hookSpecificOutput" || exit 1
    assert_contains "$wrapper_output" '"hookEventName": "SessionStart"' "PowerShell wrapper identifies SessionStart" || exit 1
    assert_not_contains "$wrapper_output" '"additional_context"' "PowerShell wrapper avoids Cursor-only field" || exit 1
fi
```

- [ ] **Step 3: Run test to verify it passes**

Run: `bash tests/codex/test-using-superpowers-bootstrap.sh`
Expected: PASS, with the Windows wrapper assertions succeeding on Windows and skipping elsewhere

### Task 3: Update Codex docs to use the wrapper

**Files:**
- Modify: `.codex/INSTALL.md`
- Modify: `docs/README.codex.md`

- [ ] **Step 1: Update installation docs**

```md
**Windows (PowerShell):**

```json
{
  "hooks": {
    "SessionStart": [
      {
        "matcher": "^(startup|resume)$",
        "hooks": [
          {
            "type": "command",
            "command": "powershell.exe -NoProfile -ExecutionPolicy Bypass -File \"C:\\Users\\<you>\\.codex\\superpowers\\hooks\\session-start-codex.ps1\"",
            "statusMessage": "loading superpowers",
            "timeout": 600
          }
        ]
      }
    ]
  }
}
```
```

- [ ] **Step 2: Add troubleshooting note**

```md
On Windows, do not use the POSIX `SUPERPOWERS_HOOK_TARGET=codex bash ...` form from PowerShell. Codex hooks inherit the active shell, so use the repository's PowerShell wrapper instead.
```

- [ ] **Step 3: Re-run the contract test**

Run: `bash tests/codex/test-using-superpowers-bootstrap.sh`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add hooks/session-start-codex.ps1 tests/codex/test-using-superpowers-bootstrap.sh .codex/INSTALL.md docs/README.codex.md docs/superpowers/specs/2026-04-05-codex-windows-hook-wrapper-design.md docs/superpowers/plans/2026-04-05-codex-windows-hook-wrapper.md
git commit -m "fix: support codex SessionStart hooks on Windows"
```
