#!/usr/bin/env bash
# Tests for brainstorm visual companion start-server.sh argument handling.
set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="${SUPERPOWERS_ROOT:-$(cd "$SCRIPT_DIR/../.." && pwd)}"
START_SCRIPT="$REPO_ROOT/skills/brainstorming/scripts/start-server.sh"
TEST_DIR="${TMPDIR:-/tmp}/brainstorm-start-test-$$"

passed=0
failed=0

cleanup() {
  rm -rf "$TEST_DIR"
}
trap cleanup EXIT

pass() {
  echo "  PASS: $1"
  passed=$((passed + 1))
}

fail() {
  echo "  FAIL: $1"
  echo "    $2"
  failed=$((failed + 1))
}

run_with_fake_node() {
  local fake_bin="$TEST_DIR/fake-bin"
  mkdir -p "$fake_bin"
  cat > "$fake_bin/node" <<'FAKENODE'
#!/usr/bin/env bash
echo "CAPTURED_IDLE_TIMEOUT_MS=${BRAINSTORM_IDLE_TIMEOUT_MS:-__UNSET__}"
exit 0
FAKENODE
  chmod +x "$fake_bin/node"

  PATH="$fake_bin:$PATH" bash "$START_SCRIPT" "$@"
}

echo ""
echo "=== Brainstorm start-server.sh Tests ==="

mkdir -p "$TEST_DIR"

echo "--- Idle Timeout Argument ---"

output="$(run_with_fake_node --project-dir "$TEST_DIR/session" --foreground --idle-timeout-minutes 120 2>&1)"
if echo "$output" | grep -q "CAPTURED_IDLE_TIMEOUT_MS=7200000"; then
  pass "--idle-timeout-minutes passes milliseconds to server"
else
  fail "--idle-timeout-minutes passes milliseconds to server" "Output: $output"
fi

output="$(bash "$START_SCRIPT" --idle-timeout-minutes 2>/dev/null)"
status=$?
if [[ "$status" -eq 1 ]] && echo "$output" | grep -q "Missing value for --idle-timeout-minutes"; then
  pass "--idle-timeout-minutes requires a value"
else
  fail "--idle-timeout-minutes requires a value" "status=$status output=$output"
fi

output="$(bash "$START_SCRIPT" --idle-timeout-minutes abc 2>/dev/null)"
status=$?
if [[ "$status" -eq 1 ]] && echo "$output" | grep -q "must be a positive integer"; then
  pass "--idle-timeout-minutes rejects non-integers"
else
  fail "--idle-timeout-minutes rejects non-integers" "status=$status output=$output"
fi

output="$(bash "$START_SCRIPT" --idle-timeout-minutes 0 2>/dev/null)"
status=$?
if [[ "$status" -eq 1 ]] && echo "$output" | grep -q "must be a positive integer"; then
  pass "--idle-timeout-minutes rejects zero"
else
  fail "--idle-timeout-minutes rejects zero" "status=$status output=$output"
fi

output="$(bash "$START_SCRIPT" --idle-timeout-minutes 35792 2>/dev/null)"
status=$?
if [[ "$status" -eq 1 ]] && echo "$output" | grep -q "no more than 35791 minutes"; then
  pass "--idle-timeout-minutes rejects values beyond Node timer limit"
else
  fail "--idle-timeout-minutes rejects values beyond Node timer limit" "status=$status output=$output"
fi

echo ""
echo "=== Results: $passed passed, $failed failed ==="

if [[ $failed -gt 0 ]]; then
  exit 1
fi
exit 0
