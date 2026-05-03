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

# ========== Summary ==========
echo ""
echo "=== Results: $passed passed, $failed failed ==="
[[ "$failed" -eq 0 ]]
