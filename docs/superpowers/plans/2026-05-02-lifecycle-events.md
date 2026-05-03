# Lifecycle Events Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a minimum-surface lifecycle event API to Superpowers core so plugin authors can mirror plan/task lifecycle without forking skills. Four events (`PlanWritten`, `TaskClaimed`, `TaskCompleted`, `BlockedOnHuman`), one shell event-bus script, one env-var registry.

**Architecture:** Core ships a single bash script (`scripts/emit-hook.sh`) that skills invoke at lifecycle points. The script reads `$SUPERPOWERS_HOOK_DIRS` (colon-separated), scans each dir for `<EventName>.sh`, and runs matching scripts with payload data exported as `SP_*` env vars. Failures are logged but never propagate. Three core skills get small additive emit blocks marked with `<!-- BEGIN lifecycle:Event -->` comments.

**Spec:** [docs/superpowers/specs/2026-05-02-lifecycle-events-design.md](../specs/2026-05-02-lifecycle-events-design.md)

**Tech Stack:** Bash 4+, coreutils `timeout` (or `gtimeout` on macOS), no other dependencies. Tests use the existing `*.test.sh` convention from `tests/brainstorm-server/windows-lifecycle.test.sh`.

---

## File Structure

**Created:**
- `scripts/emit-hook.sh` — the event dispatcher (~60 LOC bash)
- `tests/lifecycle-events/emit-hook.test.sh` — bash test suite (~250 LOC)
- `docs/superpowers/lifecycle-events.md` — plugin author reference doc (~150 LOC)

**Modified:**
- `skills/writing-plans/SKILL.md` — add 1 emit block
- `skills/executing-plans/SKILL.md` — add 3 emit blocks
- `skills/subagent-driven-development/SKILL.md` — add 3 emit blocks

---

## Chunk 1: emit-hook.sh + tests

The event dispatcher and its test suite. Built incrementally TDD-style: each task adds one new behavior with its tests.

### Task 1: Bootstrap test harness + skeleton script

**Files:**
- Create: `tests/lifecycle-events/emit-hook.test.sh`
- Create: `scripts/emit-hook.sh`

- [ ] **Step 1: Write the failing test**

Create `tests/lifecycle-events/emit-hook.test.sh`:

```bash
#!/usr/bin/env bash
# Tests for scripts/emit-hook.sh — the lifecycle event dispatcher.
#
# Usage:
#   bash tests/lifecycle-events/emit-hook.test.sh

set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="${SUPERPOWERS_ROOT:-$(cd "$SCRIPT_DIR/../.." && pwd)}"
EMIT_HOOK="$REPO_ROOT/scripts/emit-hook.sh"

passed=0
failed=0

# Per-test scratch dir; cleaned between tests
TEST_DIR=""

setup_test() {
  TEST_DIR="$(mktemp -d "${TMPDIR:-/tmp}/emit-hook-test-XXXXXX")"
}

teardown_test() {
  if [[ -n "${TEST_DIR:-}" && -d "$TEST_DIR" ]]; then
    rm -rf "$TEST_DIR"
  fi
  unset TEST_DIR SUPERPOWERS_HOOK_DIRS SUPERPOWERS_HOOK_TIMEOUT
}

trap teardown_test EXIT

pass() {
  echo "  PASS: $1"
  passed=$((passed + 1))
}

fail() {
  echo "  FAIL: $1"
  echo "    $2"
  failed=$((failed + 1))
}

# ========== Tests ==========

echo ""
echo "=== emit-hook.sh tests ==="
echo ""

# Test: unset HOOK_DIRS is a silent no-op
setup_test
unset SUPERPOWERS_HOOK_DIRS
out="$("$EMIT_HOOK" PlanWritten plan_path=/tmp/x 2>&1)"
rc=$?
if [[ "$rc" -eq 0 && -z "$out" ]]; then
  pass "unset HOOK_DIRS: silent no-op"
else
  fail "unset HOOK_DIRS: silent no-op" "rc=$rc out='$out'"
fi
teardown_test

# ========== Summary ==========
echo ""
echo "=== Results: $passed passed, $failed failed ==="
[[ "$failed" -eq 0 ]]
```

Make it executable:

```bash
chmod +x tests/lifecycle-events/emit-hook.test.sh
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bash tests/lifecycle-events/emit-hook.test.sh`

Expected: FAIL — `scripts/emit-hook.sh` does not exist yet.

- [ ] **Step 3: Write minimal implementation**

Create `scripts/emit-hook.sh`:

```bash
#!/usr/bin/env bash
# emit-hook.sh — Lifecycle event dispatcher for Superpowers plugins.
#
# Usage: emit-hook.sh <EventName> [key=value ...]
#
# Reads $SUPERPOWERS_HOOK_DIRS (colon-separated, like $PATH). For each
# dir, runs <dir>/<EventName>.sh if it exists and is executable, with
# key=value pairs translated to SP_<KEY> env vars (uppercased).
#
# Failures (nonzero exit, timeout, missing exec bit) log a warning to
# stderr and skip to the next dir. emit-hook.sh always exits 0.

set -uo pipefail

# Always exit 0; never propagate plugin failures to caller.
trap 'exit 0' EXIT

if [[ $# -lt 1 ]]; then
  echo "[hook warn] emit-hook.sh: missing event name" >&2
  exit 0
fi

# Silent no-op if no plugins are registered.
if [[ -z "${SUPERPOWERS_HOOK_DIRS:-}" ]]; then
  exit 0
fi

# Further behavior added in Task 2.
exit 0
```

Make it executable:

```bash
chmod +x scripts/emit-hook.sh
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bash tests/lifecycle-events/emit-hook.test.sh`

Expected: `PASS: unset HOOK_DIRS: silent no-op` and `Results: 1 passed, 0 failed`.

- [ ] **Step 5: Commit**

```bash
git add scripts/emit-hook.sh tests/lifecycle-events/emit-hook.test.sh
git commit -m "feat(lifecycle): emit-hook skeleton + first test

scripts/emit-hook.sh exits silently when SUPERPOWERS_HOOK_DIRS is
unset. Test harness lives in tests/lifecycle-events/."
```

---

### Task 2: Dir scanning + hook execution + env var translation

**Files:**
- Modify: `scripts/emit-hook.sh`
- Modify: `tests/lifecycle-events/emit-hook.test.sh`

- [ ] **Step 1: Write the failing tests**

Append to `tests/lifecycle-events/emit-hook.test.sh` after the existing test (and before the Summary section):

```bash
# Test: hook script not present in registered dir → silent skip
setup_test
mkdir -p "$TEST_DIR/hooks"
export SUPERPOWERS_HOOK_DIRS="$TEST_DIR/hooks"
out="$("$EMIT_HOOK" PlanWritten plan_path=/tmp/x 2>&1)"
rc=$?
if [[ "$rc" -eq 0 && -z "$out" ]]; then
  pass "missing hook script: silent skip"
else
  fail "missing hook script: silent skip" "rc=$rc out='$out'"
fi
teardown_test

# Test: hook script runs and sees SP_* env vars
setup_test
mkdir -p "$TEST_DIR/hooks"
cat > "$TEST_DIR/hooks/PlanWritten.sh" <<'EOF'
#!/usr/bin/env bash
echo "plan_path=$SP_PLAN_PATH plan_title=$SP_PLAN_TITLE" > "$SP_TEST_LOG"
EOF
chmod +x "$TEST_DIR/hooks/PlanWritten.sh"
export SUPERPOWERS_HOOK_DIRS="$TEST_DIR/hooks"
log_file="$TEST_DIR/log"
"$EMIT_HOOK" PlanWritten \
  plan_path=/tmp/foo.md \
  plan_title="My Feature" \
  test_log="$log_file" >/dev/null 2>&1
if [[ -f "$log_file" ]] && grep -q "plan_path=/tmp/foo.md plan_title=My Feature" "$log_file"; then
  pass "hook runs with SP_* env vars exported"
else
  fail "hook runs with SP_* env vars exported" "log_file=$log_file contents='$(cat "$log_file" 2>/dev/null)'"
fi
teardown_test
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `bash tests/lifecycle-events/emit-hook.test.sh`

Expected: First two pass (skeleton + missing hook); third fails because no execution logic exists yet (the log file is never written).

- [ ] **Step 3: Write the implementation**

Replace the body of `scripts/emit-hook.sh` (everything after the unset HOOK_DIRS check) with:

```bash
event_name="$1"; shift

# Translate key=value args to SP_<KEY> env vars (key uppercased).
declare -a env_assignments=()
for arg in "$@"; do
  if [[ "$arg" != *"="* ]]; then
    echo "[hook warn] emit-hook.sh: malformed arg '$arg' (expected key=value)" >&2
    continue
  fi
  key="${arg%%=*}"
  val="${arg#*=}"
  upper_key="SP_$(printf '%s' "$key" | tr '[:lower:]' '[:upper:]')"
  env_assignments+=("$upper_key=$val")
done

# Iterate dirs in registration order; sequential per dir.
IFS=':' read -ra dirs <<< "$SUPERPOWERS_HOOK_DIRS"
for dir in "${dirs[@]}"; do
  [[ -z "$dir" ]] && continue
  hook_script="$dir/${event_name}.sh"

  [[ ! -e "$hook_script" ]] && continue

  if [[ ! -x "$hook_script" ]]; then
    echo "[hook warn] $event_name in $dir: not executable" >&2
    continue
  fi

  env "${env_assignments[@]}" "$hook_script" </dev/null >/dev/null
done

exit 0
```

The full file should now be:

```bash
#!/usr/bin/env bash
# emit-hook.sh — Lifecycle event dispatcher for Superpowers plugins.
#
# Usage: emit-hook.sh <EventName> [key=value ...]
#
# Reads $SUPERPOWERS_HOOK_DIRS (colon-separated, like $PATH). For each
# dir, runs <dir>/<EventName>.sh if it exists and is executable, with
# key=value pairs translated to SP_<KEY> env vars (uppercased).
#
# Failures (nonzero exit, timeout, missing exec bit) log a warning to
# stderr and skip to the next dir. emit-hook.sh always exits 0.

set -uo pipefail

trap 'exit 0' EXIT

if [[ $# -lt 1 ]]; then
  echo "[hook warn] emit-hook.sh: missing event name" >&2
  exit 0
fi

if [[ -z "${SUPERPOWERS_HOOK_DIRS:-}" ]]; then
  exit 0
fi

event_name="$1"; shift

declare -a env_assignments=()
for arg in "$@"; do
  if [[ "$arg" != *"="* ]]; then
    echo "[hook warn] emit-hook.sh: malformed arg '$arg' (expected key=value)" >&2
    continue
  fi
  key="${arg%%=*}"
  val="${arg#*=}"
  upper_key="SP_$(printf '%s' "$key" | tr '[:lower:]' '[:upper:]')"
  env_assignments+=("$upper_key=$val")
done

IFS=':' read -ra dirs <<< "$SUPERPOWERS_HOOK_DIRS"
for dir in "${dirs[@]}"; do
  [[ -z "$dir" ]] && continue
  hook_script="$dir/${event_name}.sh"

  [[ ! -e "$hook_script" ]] && continue

  if [[ ! -x "$hook_script" ]]; then
    echo "[hook warn] $event_name in $dir: not executable" >&2
    continue
  fi

  env "${env_assignments[@]}" "$hook_script" </dev/null >/dev/null
done

exit 0
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `bash tests/lifecycle-events/emit-hook.test.sh`

Expected: 3 PASSed, 0 failed.

- [ ] **Step 5: Commit**

```bash
git add scripts/emit-hook.sh tests/lifecycle-events/emit-hook.test.sh
git commit -m "feat(lifecycle): dir scanning + hook execution + env vars

emit-hook.sh now scans SUPERPOWERS_HOOK_DIRS, locates matching
<EventName>.sh files, and runs them with key=value args translated
to SP_<KEY> env vars."
```

---

### Task 3: Failure handling — nonzero exit and missing exec bit

**Files:**
- Modify: `scripts/emit-hook.sh`
- Modify: `tests/lifecycle-events/emit-hook.test.sh`

- [ ] **Step 1: Write the failing tests**

Append to `tests/lifecycle-events/emit-hook.test.sh` (before Summary):

```bash
# Test: hook exits nonzero → warning logged, emit-hook still exits 0
setup_test
mkdir -p "$TEST_DIR/hooks"
cat > "$TEST_DIR/hooks/PlanWritten.sh" <<'EOF'
#!/usr/bin/env bash
exit 7
EOF
chmod +x "$TEST_DIR/hooks/PlanWritten.sh"
export SUPERPOWERS_HOOK_DIRS="$TEST_DIR/hooks"
err="$("$EMIT_HOOK" PlanWritten plan_path=/tmp/x 2>&1 1>/dev/null)"
rc=$?
if [[ "$rc" -eq 0 && "$err" == *"PlanWritten"* && "$err" == *"exit 7"* ]]; then
  pass "nonzero exit: warning logged, emit-hook exits 0"
else
  fail "nonzero exit" "rc=$rc err='$err'"
fi
teardown_test

# Test: hook script not executable → warning logged, skip
setup_test
mkdir -p "$TEST_DIR/hooks"
cat > "$TEST_DIR/hooks/PlanWritten.sh" <<'EOF'
#!/usr/bin/env bash
exit 0
EOF
# Intentionally NOT chmod +x
export SUPERPOWERS_HOOK_DIRS="$TEST_DIR/hooks"
err="$("$EMIT_HOOK" PlanWritten plan_path=/tmp/x 2>&1 1>/dev/null)"
rc=$?
if [[ "$rc" -eq 0 && "$err" == *"not executable"* ]]; then
  pass "not executable: warning logged"
else
  fail "not executable" "rc=$rc err='$err'"
fi
teardown_test
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `bash tests/lifecycle-events/emit-hook.test.sh`

Expected: First three pass; "nonzero exit" fails (no warning emitted yet); "not executable" passes (already implemented in Task 2).

- [ ] **Step 3: Write the implementation**

In `scripts/emit-hook.sh`, replace the line:

```bash
  env "${env_assignments[@]}" "$hook_script" </dev/null >/dev/null
```

with:

```bash
  env "${env_assignments[@]}" "$hook_script" </dev/null >/dev/null
  rc=$?
  if [[ "$rc" -ne 0 ]]; then
    echo "[hook warn] $event_name in $dir: exit $rc" >&2
  fi
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `bash tests/lifecycle-events/emit-hook.test.sh`

Expected: 5 passed, 0 failed.

- [ ] **Step 5: Commit**

```bash
git add scripts/emit-hook.sh tests/lifecycle-events/emit-hook.test.sh
git commit -m "feat(lifecycle): warn on hook failures, never propagate

Nonzero hook exit codes log a warning but emit-hook still exits 0.
Non-executable hook scripts produce a warning and are skipped."
```

---

### Task 4: Timeout enforcement (10s default + override)

**Files:**
- Modify: `scripts/emit-hook.sh`
- Modify: `tests/lifecycle-events/emit-hook.test.sh`

- [ ] **Step 1: Write the failing test**

Append to `tests/lifecycle-events/emit-hook.test.sh` (before Summary):

```bash
# Test: hook exceeds timeout → killed, warning logged
# Use SUPERPOWERS_HOOK_TIMEOUT=1 to keep the test fast.
setup_test
mkdir -p "$TEST_DIR/hooks"
cat > "$TEST_DIR/hooks/PlanWritten.sh" <<'EOF'
#!/usr/bin/env bash
sleep 30
EOF
chmod +x "$TEST_DIR/hooks/PlanWritten.sh"
export SUPERPOWERS_HOOK_DIRS="$TEST_DIR/hooks"
export SUPERPOWERS_HOOK_TIMEOUT=1
start_ts=$(date +%s)
err="$("$EMIT_HOOK" PlanWritten plan_path=/tmp/x 2>&1 1>/dev/null)"
rc=$?
elapsed=$(( $(date +%s) - start_ts ))
if [[ "$rc" -eq 0 && "$err" == *"timed out"* && "$elapsed" -lt 5 ]]; then
  pass "timeout: hook killed and warning logged (elapsed=${elapsed}s)"
else
  fail "timeout" "rc=$rc elapsed=${elapsed}s err='$err'"
fi
teardown_test
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bash tests/lifecycle-events/emit-hook.test.sh`

Expected: Existing tests pass; "timeout" test FAILS or hangs for ~30s. If it hangs, kill it (`Ctrl+C`); confirm no timeout enforcement exists yet.

- [ ] **Step 3: Write the implementation**

In `scripts/emit-hook.sh`, add this near the top (after the `set -uo pipefail` line):

```bash
readonly DEFAULT_TIMEOUT=10

# Resolve timeout command (Linux: timeout; macOS w/ coreutils: gtimeout).
TIMEOUT_CMD=""
if command -v timeout >/dev/null 2>&1; then
  TIMEOUT_CMD="timeout"
elif command -v gtimeout >/dev/null 2>&1; then
  TIMEOUT_CMD="gtimeout"
fi
```

Replace the hook execution block:

```bash
  env "${env_assignments[@]}" "$hook_script" </dev/null >/dev/null
  rc=$?
  if [[ "$rc" -ne 0 ]]; then
    echo "[hook warn] $event_name in $dir: exit $rc" >&2
  fi
```

with:

```bash
  hook_timeout="${SUPERPOWERS_HOOK_TIMEOUT:-$DEFAULT_TIMEOUT}"

  if [[ -n "$TIMEOUT_CMD" ]]; then
    env "${env_assignments[@]}" \
      "$TIMEOUT_CMD" --kill-after=1 "$hook_timeout" "$hook_script" </dev/null >/dev/null
    rc=$?
    if [[ "$rc" -eq 124 || "$rc" -eq 137 ]]; then
      echo "[hook warn] $event_name in $dir: timed out after ${hook_timeout}s" >&2
    elif [[ "$rc" -ne 0 ]]; then
      echo "[hook warn] $event_name in $dir: exit $rc" >&2
    fi
  else
    # No timeout(1) available — run unbounded with one-time warning.
    if [[ -z "${EMIT_HOOK_TIMEOUT_WARNED:-}" ]]; then
      echo "[hook warn] timeout(1) not available; hooks run unbounded" >&2
      EMIT_HOOK_TIMEOUT_WARNED=1
      export EMIT_HOOK_TIMEOUT_WARNED
    fi
    env "${env_assignments[@]}" "$hook_script" </dev/null >/dev/null
    rc=$?
    if [[ "$rc" -ne 0 ]]; then
      echo "[hook warn] $event_name in $dir: exit $rc" >&2
    fi
  fi
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `bash tests/lifecycle-events/emit-hook.test.sh`

Expected: 6 passed, 0 failed. The timeout test should complete in ~1-2 seconds, not 30.

- [ ] **Step 5: Commit**

```bash
git add scripts/emit-hook.sh tests/lifecycle-events/emit-hook.test.sh
git commit -m "feat(lifecycle): enforce 10s default hook timeout

Hooks that exceed SUPERPOWERS_HOOK_TIMEOUT (default 10s) are killed
via timeout(1)/gtimeout(1) with a warning. Falls back to unbounded
execution + one-time warning if neither tool is available."
```

---

### Task 5: stdio + multi-dir + key=value edge cases

**Files:**
- Modify: `tests/lifecycle-events/emit-hook.test.sh`

This task adds tests for behaviors that the existing implementation already supports — verifying they actually work as designed. No implementation changes expected.

- [ ] **Step 1: Write the tests**

Append to `tests/lifecycle-events/emit-hook.test.sh` (before Summary):

```bash
# Test: hook stdin is /dev/null (read returns empty)
setup_test
mkdir -p "$TEST_DIR/hooks"
cat > "$TEST_DIR/hooks/PlanWritten.sh" <<'EOF'
#!/usr/bin/env bash
read -r line || true
echo "stdin_was='$line'" > "$SP_OUT"
EOF
chmod +x "$TEST_DIR/hooks/PlanWritten.sh"
export SUPERPOWERS_HOOK_DIRS="$TEST_DIR/hooks"
echo "should-not-reach-hook" | "$EMIT_HOOK" PlanWritten out="$TEST_DIR/out" >/dev/null 2>&1
if grep -q "stdin_was=''" "$TEST_DIR/out"; then
  pass "hook stdin redirected to /dev/null"
else
  fail "hook stdin redirected to /dev/null" "got: $(cat "$TEST_DIR/out" 2>/dev/null)"
fi
teardown_test

# Test: hook stdout is discarded
setup_test
mkdir -p "$TEST_DIR/hooks"
cat > "$TEST_DIR/hooks/PlanWritten.sh" <<'EOF'
#!/usr/bin/env bash
echo "this-should-not-be-visible"
EOF
chmod +x "$TEST_DIR/hooks/PlanWritten.sh"
export SUPERPOWERS_HOOK_DIRS="$TEST_DIR/hooks"
out="$("$EMIT_HOOK" PlanWritten plan_path=x 2>/dev/null)"
if [[ -z "$out" ]]; then
  pass "hook stdout discarded"
else
  fail "hook stdout discarded" "got: '$out'"
fi
teardown_test

# Test: multiple registered dirs run sequentially in order
setup_test
mkdir -p "$TEST_DIR/h1" "$TEST_DIR/h2"
cat > "$TEST_DIR/h1/PlanWritten.sh" <<'EOF'
#!/usr/bin/env bash
echo "h1" >> "$SP_LOG"
EOF
cat > "$TEST_DIR/h2/PlanWritten.sh" <<'EOF'
#!/usr/bin/env bash
echo "h2" >> "$SP_LOG"
EOF
chmod +x "$TEST_DIR/h1/PlanWritten.sh" "$TEST_DIR/h2/PlanWritten.sh"
export SUPERPOWERS_HOOK_DIRS="$TEST_DIR/h1:$TEST_DIR/h2"
"$EMIT_HOOK" PlanWritten log="$TEST_DIR/seq.log" >/dev/null 2>&1
if [[ "$(cat "$TEST_DIR/seq.log")" == $'h1\nh2' ]]; then
  pass "multiple dirs run sequentially in order"
else
  fail "multiple dirs sequential" "got: $(cat "$TEST_DIR/seq.log")"
fi
teardown_test

# Test: key=value with literal '=' in value preserved
setup_test
mkdir -p "$TEST_DIR/hooks"
cat > "$TEST_DIR/hooks/PlanWritten.sh" <<'EOF'
#!/usr/bin/env bash
echo "$SP_REASON" > "$SP_OUT"
EOF
chmod +x "$TEST_DIR/hooks/PlanWritten.sh"
export SUPERPOWERS_HOOK_DIRS="$TEST_DIR/hooks"
"$EMIT_HOOK" PlanWritten reason="error: foo=bar baz=qux" out="$TEST_DIR/r.out" >/dev/null 2>&1
if [[ "$(cat "$TEST_DIR/r.out")" == "error: foo=bar baz=qux" ]]; then
  pass "key=value preserves literal '=' in value"
else
  fail "key=value preserves '='" "got: '$(cat "$TEST_DIR/r.out")'"
fi
teardown_test

# Test: missing event name → warning logged, exits 0
setup_test
err="$("$EMIT_HOOK" 2>&1 1>/dev/null)"
rc=$?
if [[ "$rc" -eq 0 && "$err" == *"missing event name"* ]]; then
  pass "missing event name: warning logged, exits 0"
else
  fail "missing event name" "rc=$rc err='$err'"
fi
teardown_test
```

- [ ] **Step 2: Run tests to verify all pass**

Run: `bash tests/lifecycle-events/emit-hook.test.sh`

Expected: 11 passed, 0 failed. If any fail, the prior implementation has a gap — fix in `scripts/emit-hook.sh`.

- [ ] **Step 3: Verify edge cases manually**

Run a quick sanity check from the repo root:

```bash
mkdir -p /tmp/sp-hook-smoke
cat > /tmp/sp-hook-smoke/PlanWritten.sh <<'EOF'
#!/usr/bin/env bash
echo "got plan_path=$SP_PLAN_PATH" >&2
EOF
chmod +x /tmp/sp-hook-smoke/PlanWritten.sh

SUPERPOWERS_HOOK_DIRS=/tmp/sp-hook-smoke \
  ./scripts/emit-hook.sh PlanWritten plan_path=/tmp/foo.md plan_title="Smoke Test"
```

Expected stderr: `got plan_path=/tmp/foo.md`

Cleanup:

```bash
rm -rf /tmp/sp-hook-smoke
```

- [ ] **Step 4: Commit**

```bash
git add tests/lifecycle-events/emit-hook.test.sh
git commit -m "test(lifecycle): cover stdio, multi-dir, kv parsing edges"
```

---

## Chunk 2: Skill integration

Add small additive emit blocks at the lifecycle points identified in the spec. Each block uses the existing `<!-- BEGIN ... -->` / `<!-- END ... -->` comment convention.

### Task 6: Add PlanWritten emit block to writing-plans skill

**Files:**
- Modify: `skills/writing-plans/SKILL.md` (insertion point: after the "Self-Review" section, before "Execution Handoff")

- [ ] **Step 1: Read the current skill and identify the insertion point**

Run: `grep -n "^## " skills/writing-plans/SKILL.md`

Expected output includes lines like:
```
... ## Self-Review
... ## Execution Handoff
```

Note the line number where `## Execution Handoff` begins. The new block goes immediately before that heading.

- [ ] **Step 2: Insert the emit block**

Add this block after the Self-Review section, immediately before the `## Execution Handoff` heading in `skills/writing-plans/SKILL.md`:

````markdown
<!-- BEGIN lifecycle:PlanWritten -->
## Lifecycle Event: PlanWritten

After self-review passes, emit the `PlanWritten` lifecycle event so any registered plugins (e.g., a Beads mirror) can react. This is a no-op when no plugins are installed (`SUPERPOWERS_HOOK_DIRS` unset).

Resolve the script path and emit:

```bash
SP_ROOT="${CLAUDE_PLUGIN_ROOT:-${CURSOR_PLUGIN_ROOT:-${SUPERPOWERS_ROOT:-}}}"
[[ -n "$SP_ROOT" ]] && "$SP_ROOT/scripts/emit-hook.sh" PlanWritten \
  plan_path="<absolute-plan-path>" \
  plan_title="<plan H1 title>"
```

Substitute `<absolute-plan-path>` with the path you just saved the plan to, and `<plan H1 title>` with the H1 heading from the plan file. Plugins receive these as `$SP_PLAN_PATH` and `$SP_PLAN_TITLE`.
<!-- END lifecycle:PlanWritten -->

````

- [ ] **Step 3: Verify the block parses cleanly and the file still loads as a skill**

Run: `grep -c "BEGIN lifecycle\|END lifecycle" skills/writing-plans/SKILL.md`

Expected: `2` (one BEGIN, one END).

Run: `grep -A2 "^---$" skills/writing-plans/SKILL.md | head -5`

Expected: shows the YAML frontmatter — confirms the file structure wasn't damaged.

- [ ] **Step 4: Commit**

```bash
git add skills/writing-plans/SKILL.md
git commit -m "feat(lifecycle): emit PlanWritten in writing-plans skill

Adds a small additive block that fires the PlanWritten lifecycle
event after self-review passes. No-op when SUPERPOWERS_HOOK_DIRS
is unset; the legacy markdown-only flow is unchanged."
```

---

### Task 7: Add task-state emit blocks to executing-plans skill

**Files:**
- Modify: `skills/executing-plans/SKILL.md` (3 insertion points within Step 2)

- [ ] **Step 1: Identify insertion points**

Run: `grep -n "^### Step 2\|Mark as completed\|Mark as in_progress\|BLOCKED" skills/executing-plans/SKILL.md`

You should find references to task state transitions in Step 2: "Execute Tasks". The current Step 2 reads roughly:

```
For each task:
1. Mark as in_progress
2. Execute steps
3. Run verifications as specified
4. Mark as completed
```

The three emit blocks attach to: "Mark as in_progress", "Mark as completed", and the implicit BLOCKED escalation.

- [ ] **Step 2: Insert the three emit blocks**

In `skills/executing-plans/SKILL.md`, replace the Step 2 list:

```markdown
For each task:

1. Mark as in_progress
2. Execute steps
3. Run verifications as specified
4. Mark as completed
```

with:

````markdown
For each task:

1. Mark as in_progress
   <!-- BEGIN lifecycle:TaskClaimed -->
   **Lifecycle event:** also emit `TaskClaimed`:
   ```bash
   SP_ROOT="${CLAUDE_PLUGIN_ROOT:-${CURSOR_PLUGIN_ROOT:-${SUPERPOWERS_ROOT:-}}}"
   [[ -n "$SP_ROOT" ]] && "$SP_ROOT/scripts/emit-hook.sh" TaskClaimed \
     plan_path="<absolute-plan-path>" \
     task_number="<N>" \
     task_title="<task heading>"
   ```
   No-op when `SUPERPOWERS_HOOK_DIRS` is unset.
   <!-- END lifecycle:TaskClaimed -->

2. Execute steps
3. Run verifications as specified
4. Mark as completed
   <!-- BEGIN lifecycle:TaskCompleted -->
   **Lifecycle event:** also emit `TaskCompleted`:
   ```bash
   SP_ROOT="${CLAUDE_PLUGIN_ROOT:-${CURSOR_PLUGIN_ROOT:-${SUPERPOWERS_ROOT:-}}}"
   [[ -n "$SP_ROOT" ]] && "$SP_ROOT/scripts/emit-hook.sh" TaskCompleted \
     plan_path="<absolute-plan-path>" \
     task_number="<N>" \
     task_title="<task heading>"
   ```
   <!-- END lifecycle:TaskCompleted -->

If a task cannot proceed and needs human resolution:

<!-- BEGIN lifecycle:BlockedOnHuman -->
**Lifecycle event:** emit `BlockedOnHuman` before stopping:
```bash
SP_ROOT="${CLAUDE_PLUGIN_ROOT:-${CURSOR_PLUGIN_ROOT:-${SUPERPOWERS_ROOT:-}}}"
[[ -n "$SP_ROOT" ]] && "$SP_ROOT/scripts/emit-hook.sh" BlockedOnHuman \
  plan_path="<absolute-plan-path>" \
  task_number="<N>" \
  task_title="<task heading>" \
  reason="<short explanation of the block>"
```
<!-- END lifecycle:BlockedOnHuman -->

````

- [ ] **Step 3: Verify the file integrity**

Run: `grep -c "BEGIN lifecycle\|END lifecycle" skills/executing-plans/SKILL.md`

Expected: `6` (3 BEGIN, 3 END).

Run: `head -10 skills/executing-plans/SKILL.md`

Expected: shows YAML frontmatter intact (`---`, `name:`, `description:`).

- [ ] **Step 4: Commit**

```bash
git add skills/executing-plans/SKILL.md
git commit -m "feat(lifecycle): emit Task* events in executing-plans

Adds three additive blocks for TaskClaimed, TaskCompleted, and
BlockedOnHuman at the corresponding state-transition points in
Step 2. No behavior change when SUPERPOWERS_HOOK_DIRS is unset."
```

---

### Task 8: Add task-state emit blocks to subagent-driven-development skill

**Files:**
- Modify: `skills/subagent-driven-development/SKILL.md` (3 insertion points around the per-task loop)

- [ ] **Step 1: Identify insertion points**

Run: `grep -n "in_progress\|completed\|BLOCKED\|implementer.*report" skills/subagent-driven-development/SKILL.md | head -20`

The skill describes a per-task loop with state transitions matching `executing-plans`. Find the lines near the per-task in_progress mark, the per-task completed mark, and the BLOCKED handling section.

- [ ] **Step 2: Add the emit blocks**

Find the section in `skills/subagent-driven-development/SKILL.md` describing the per-task loop. Near the line marking a task in_progress, insert this block (immediately after the existing in_progress mark instruction):

````markdown
<!-- BEGIN lifecycle:TaskClaimed -->
**Lifecycle event:** also emit `TaskClaimed`:
```bash
SP_ROOT="${CLAUDE_PLUGIN_ROOT:-${CURSOR_PLUGIN_ROOT:-${SUPERPOWERS_ROOT:-}}}"
[[ -n "$SP_ROOT" ]] && "$SP_ROOT/scripts/emit-hook.sh" TaskClaimed \
  plan_path="<absolute-plan-path>" \
  task_number="<N>" \
  task_title="<task heading>"
```
No-op when `SUPERPOWERS_HOOK_DIRS` is unset.
<!-- END lifecycle:TaskClaimed -->
````

Near the line marking a task completed (after both reviews pass), insert:

````markdown
<!-- BEGIN lifecycle:TaskCompleted -->
**Lifecycle event:** also emit `TaskCompleted`:
```bash
SP_ROOT="${CLAUDE_PLUGIN_ROOT:-${CURSOR_PLUGIN_ROOT:-${SUPERPOWERS_ROOT:-}}}"
[[ -n "$SP_ROOT" ]] && "$SP_ROOT/scripts/emit-hook.sh" TaskCompleted \
  plan_path="<absolute-plan-path>" \
  task_number="<N>" \
  task_title="<task heading>"
```
<!-- END lifecycle:TaskCompleted -->
````

In the "Handling Implementer Status" / BLOCKED section (find via `grep -n "BLOCKED" skills/subagent-driven-development/SKILL.md`), add immediately before the existing escalation guidance:

````markdown
<!-- BEGIN lifecycle:BlockedOnHuman -->
**Lifecycle event:** before escalating, emit `BlockedOnHuman`:
```bash
SP_ROOT="${CLAUDE_PLUGIN_ROOT:-${CURSOR_PLUGIN_ROOT:-${SUPERPOWERS_ROOT:-}}}"
[[ -n "$SP_ROOT" ]] && "$SP_ROOT/scripts/emit-hook.sh" BlockedOnHuman \
  plan_path="<absolute-plan-path>" \
  task_number="<N>" \
  task_title="<task heading>" \
  reason="<short explanation of the block>"
```
<!-- END lifecycle:BlockedOnHuman -->
````

- [ ] **Step 3: Verify the file integrity**

Run: `grep -c "BEGIN lifecycle\|END lifecycle" skills/subagent-driven-development/SKILL.md`

Expected: `6` (3 BEGIN, 3 END).

Run: `head -10 skills/subagent-driven-development/SKILL.md`

Expected: shows YAML frontmatter intact.

- [ ] **Step 4: Commit**

```bash
git add skills/subagent-driven-development/SKILL.md
git commit -m "feat(lifecycle): emit Task* events in subagent-driven-development

Adds TaskClaimed, TaskCompleted, and BlockedOnHuman emit blocks at
the corresponding per-task transitions in the SDD loop. No behavior
change when SUPERPOWERS_HOOK_DIRS is unset."
```

---

## Chunk 3: Documentation + verification

### Task 9: Write the lifecycle-events reference doc

**Files:**
- Create: `docs/superpowers/lifecycle-events.md`

- [ ] **Step 1: Write the reference doc**

Create `docs/superpowers/lifecycle-events.md`:

````markdown
# Superpowers Lifecycle Events (Plugin Author Reference)

Superpowers core fires lifecycle events at well-defined moments during plan and task workflows. Plugin authors subscribe by dropping shell scripts into a registered directory.

## Quick start

1. Create a directory for your plugin's hook scripts:
   ```bash
   mkdir -p ~/.config/my-plugin/hooks
   ```

2. Add an executable hook script for the event you care about:
   ```bash
   cat > ~/.config/my-plugin/hooks/TaskClaimed.sh <<'EOF'
   #!/usr/bin/env bash
   echo "Task $SP_TASK_NUMBER claimed in $SP_PLAN_PATH" >&2
   EOF
   chmod +x ~/.config/my-plugin/hooks/TaskClaimed.sh
   ```

3. Register the dir in your shell rc:
   ```bash
   export SUPERPOWERS_HOOK_DIRS="$HOME/.config/my-plugin/hooks${SUPERPOWERS_HOOK_DIRS:+:$SUPERPOWERS_HOOK_DIRS}"
   ```

4. Restart your agent session. The hook fires automatically when a task is claimed.

## How dispatch works

When core wants to emit an event, it calls:

```bash
$SUPERPOWERS_ROOT/scripts/emit-hook.sh <EventName> [key=value ...]
```

`emit-hook.sh` then:

1. Reads `$SUPERPOWERS_HOOK_DIRS` (colon-separated, like `$PATH`). If unset/empty, exits 0 immediately.
2. Translates each `key=value` arg into an `SP_<KEY>` env var (key uppercased; values may contain `=`).
3. For each registered dir in order, runs `<dir>/<EventName>.sh` if it exists and is executable.
4. Hooks run sequentially, never in parallel. Stdin is `/dev/null`; stdout is discarded; stderr is captured and surfaced.
5. Plugin failures (nonzero exit, timeout, missing exec bit) log a warning to stderr but never propagate. `emit-hook.sh` always exits 0.

## Configuration

| Env var | Default | Purpose |
|---|---|---|
| `SUPERPOWERS_HOOK_DIRS` | unset (no plugins) | Colon-separated list of plugin hook directories. |
| `SUPERPOWERS_HOOK_TIMEOUT` | `10` | Seconds before a hook script is killed. Integer only. |

## Event catalog

### `PlanWritten`

Fired by `writing-plans` skill after self-review passes.

| Env var | Description |
|---|---|
| `SP_PLAN_PATH` | Absolute path to the plan markdown file |
| `SP_PLAN_TITLE` | H1 heading from the plan |

**Plugin guidance:** plugins may mutate the plan file at this point (e.g., add a `**Refs:** xxx` line to each task body). The implementer prompt sends full task body text, so plan-level enrichment propagates naturally to subagent prompts.

### `TaskClaimed`

Fired when a task transitions to in_progress in `executing-plans` and `subagent-driven-development`.

| Env var | Description |
|---|---|
| `SP_PLAN_PATH` | Plan the task belongs to |
| `SP_TASK_NUMBER` | Integer matching `### Task N:` heading in plan |
| `SP_TASK_TITLE` | Task heading text |

### `TaskCompleted`

Fired when a task reaches completed state. Same payload as `TaskClaimed`.

### `BlockedOnHuman`

Fired when a task cannot proceed and needs human resolution.

| Env var | Description |
|---|---|
| `SP_PLAN_PATH` | Plan the task belongs to |
| `SP_TASK_NUMBER` | Integer matching `### Task N:` heading in plan |
| `SP_TASK_TITLE` | Task heading text |
| `SP_REASON` | Free-text explanation of the block |

## Failure modes

| Condition | Behavior |
|---|---|
| `SUPERPOWERS_HOOK_DIRS` unset/empty | Silent no-op |
| Hook script not present | Silent skip; continue |
| Hook script not executable | Warning logged; skip |
| Hook script exits nonzero | Warning logged; continue |
| Hook script exceeds timeout | Killed (SIGTERM, then SIGKILL after 1s); warning logged; continue |
| `timeout(1)` / `gtimeout(1)` not available | One-time warning; hooks run unbounded |

## Writing a plugin: example

A minimal plugin that logs every event to a file:

```
~/.config/my-plugin/hooks/
├── PlanWritten.sh
├── TaskClaimed.sh
├── TaskCompleted.sh
└── BlockedOnHuman.sh
```

Each script could simply be:

```bash
#!/usr/bin/env bash
set -euo pipefail
event_name="$(basename "$0" .sh)"
echo "[$(date -u +%FT%TZ)] $event_name plan=$SP_PLAN_PATH task=${SP_TASK_NUMBER:-} reason=${SP_REASON:-}" \
  >> "$HOME/.config/my-plugin/events.log"
```

Plugins that don't care about an event simply don't ship a script for it. Multiple plugins coexist by registering multiple dirs in `SUPERPOWERS_HOOK_DIRS`.

## Stability and forward compatibility

- New events may be added in future releases. Plugins ignore events they don't subscribe to.
- New env vars may be added to existing event payloads. Plugins ignore vars they don't read.
- Existing env var names will not change without a major version bump.
- The `SP_*` prefix is reserved for core. Plugins should not rely on or set their own `SP_*` env vars.

## See also

- [Lifecycle Events Design Spec](specs/2026-05-02-lifecycle-events-design.md)
````

- [ ] **Step 2: Verify the doc renders cleanly**

Run: `head -3 docs/superpowers/lifecycle-events.md`

Expected: First line is `# Superpowers Lifecycle Events (Plugin Author Reference)`.

Run: `wc -l docs/superpowers/lifecycle-events.md`

Expected: ~120-180 lines.

- [ ] **Step 3: Commit**

```bash
git add docs/superpowers/lifecycle-events.md
git commit -m "docs: add lifecycle events plugin author reference

Documents the event catalog (PlanWritten, TaskClaimed, TaskCompleted,
BlockedOnHuman), the emit-hook.sh dispatch contract, configuration
env vars, failure modes, and a minimal example plugin layout."
```

---

### Task 10: End-to-end verification with stub plugin

**Files:**
- No source files modified
- Creates and removes a temp stub plugin

This is a manual verification task — no test code is committed. Confirms the end-to-end path: plugin install → events fire during a real plan flow.

- [ ] **Step 1: Run the unit test suite end-to-end**

Run: `bash tests/lifecycle-events/emit-hook.test.sh`

Expected: 11 passed, 0 failed.

- [ ] **Step 2: Build a stub plugin in a temp dir**

```bash
STUB_DIR="$(mktemp -d)/stub-plugin/hooks"
mkdir -p "$STUB_DIR"
LOG_FILE="$(mktemp)"

for evt in PlanWritten TaskClaimed TaskCompleted BlockedOnHuman; do
  cat > "$STUB_DIR/$evt.sh" <<EOF
#!/usr/bin/env bash
echo "[\$(date -u +%FT%TZ)] $evt plan=\$SP_PLAN_PATH task=\${SP_TASK_NUMBER:-} reason=\${SP_REASON:-}" >> "$LOG_FILE"
EOF
  chmod +x "$STUB_DIR/$evt.sh"
done

echo "Stub plugin: $STUB_DIR"
echo "Log file:    $LOG_FILE"
```

- [ ] **Step 3: Manually fire each event via emit-hook.sh**

```bash
export SUPERPOWERS_HOOK_DIRS="$STUB_DIR"
export SUPERPOWERS_ROOT="$(pwd)"

"$SUPERPOWERS_ROOT/scripts/emit-hook.sh" PlanWritten \
  plan_path=/tmp/foo.md plan_title="Stub Test"

"$SUPERPOWERS_ROOT/scripts/emit-hook.sh" TaskClaimed \
  plan_path=/tmp/foo.md task_number=1 task_title="First task"

"$SUPERPOWERS_ROOT/scripts/emit-hook.sh" TaskCompleted \
  plan_path=/tmp/foo.md task_number=1 task_title="First task"

"$SUPERPOWERS_ROOT/scripts/emit-hook.sh" BlockedOnHuman \
  plan_path=/tmp/foo.md task_number=2 task_title="Second task" \
  reason="Need API credentials"

echo ""
echo "=== Event log ==="
cat "$LOG_FILE"
```

Expected: 4 lines in the log, one per event, with correct `plan=`, `task=`, and `reason=` fields populated.

- [ ] **Step 4: Verify the no-plugins case is silent**

```bash
unset SUPERPOWERS_HOOK_DIRS
out="$("$SUPERPOWERS_ROOT/scripts/emit-hook.sh" PlanWritten plan_path=/tmp/x 2>&1)"
echo "rc=$? out='$out'"
```

Expected: `rc=0 out=''`

- [ ] **Step 5: Cleanup**

```bash
rm -rf "$STUB_DIR" "$LOG_FILE"
unset SUPERPOWERS_HOOK_DIRS SUPERPOWERS_ROOT
```

- [ ] **Step 6: Verify no uncommitted changes remain**

```bash
git status
```

Expected: working tree clean. (The verification doesn't commit anything; just confirms the system works end-to-end.)

---

## Done

After Task 10:

- All 11 unit tests pass
- 4 events fire correctly with payloads
- No-plugins case is silent
- Skill blocks are additive (no rewrites)
- Reference doc is published

The PR is ready for human review against the maintainer guidelines in `CLAUDE.md`. Before opening the PR:

1. Search both open and closed PRs at `obra/superpowers` for prior lifecycle-event / plugin-API attempts; reference findings in PR description.
2. Fully complete every section of `.github/PULL_REQUEST_TEMPLATE.md`.
3. Show the full diff to your human partner for explicit approval before submission.
