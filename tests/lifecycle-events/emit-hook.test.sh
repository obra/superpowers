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

# ========== Summary ==========
echo ""
echo "=== Results: $passed passed, $failed failed ==="
[[ "$failed" -eq 0 ]]
