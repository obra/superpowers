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
