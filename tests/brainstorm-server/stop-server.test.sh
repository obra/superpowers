#!/usr/bin/env bash
# Tests for brainstorm stop-server.sh process ownership checks.
set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="${SUPERPOWERS_ROOT:-$(cd "$SCRIPT_DIR/../.." && pwd)}"
STOP_SCRIPT="$REPO_ROOT/skills/brainstorming/scripts/stop-server.sh"
SERVER_SCRIPT="$REPO_ROOT/skills/brainstorming/scripts/server.cjs"
TEST_DIR="${TMPDIR:-/tmp}/brainstorm stop test $$"

passed=0
failed=0
UNRELATED_PID=""
FAKE_SERVER_PID=""
OTHER_SERVER_PID=""
SERVER_PID=""

cleanup() {
  for pid in "$UNRELATED_PID" "$FAKE_SERVER_PID" "$OTHER_SERVER_PID" "$SERVER_PID"; do
    if [[ -n "${pid:-}" ]]; then
      kill "$pid" 2>/dev/null || true
      wait "$pid" 2>/dev/null || true
    fi
  done
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

wait_for_server_info() {
  local dir="$1"
  for _ in $(seq 1 50); do
    if [[ -f "$dir/state/server-info" ]]; then
      return 0
    fi
    sleep 0.1
  done
  return 1
}

echo ""
echo "=== Brainstorm stop-server.sh Tests ==="

mkdir -p "$TEST_DIR"

echo "--- Stale PID Safety ---"

mkdir -p "$TEST_DIR/stale/state"
node -e "setTimeout(() => {}, 30000)" &
UNRELATED_PID=$!
echo "$UNRELATED_PID" > "$TEST_DIR/stale/state/server.pid"

output="$(bash "$STOP_SCRIPT" "$TEST_DIR/stale" 2>&1)"

if kill -0 "$UNRELATED_PID" 2>/dev/null; then
  pass "stop-server.sh does not kill unrelated process from stale pid file"
else
  fail "stop-server.sh does not kill unrelated process from stale pid file" \
       "Unrelated process $UNRELATED_PID was killed. Output: $output"
  UNRELATED_PID=""
fi

if [[ "$output" == '{"status": "stale_pid"}' ]]; then
  pass "stop-server.sh reports stale pid files explicitly"
else
  fail "stop-server.sh reports stale pid files explicitly" "Unexpected output: $output"
fi

if [[ ! -f "$TEST_DIR/stale/state/server.pid" ]]; then
  pass "stop-server.sh removes stale pid files"
else
  fail "stop-server.sh removes stale pid files" "pid file still exists"
fi

kill "$UNRELATED_PID" 2>/dev/null || true
wait "$UNRELATED_PID" 2>/dev/null || true
UNRELATED_PID=""

echo "--- Fake server.cjs Argument Safety ---"

mkdir -p "$TEST_DIR/fake/state"
BRAINSTORM_DIR="$TEST_DIR/fake" node -e "setTimeout(() => {}, 30000)" server.cjs &
FAKE_SERVER_PID=$!
echo "$FAKE_SERVER_PID" > "$TEST_DIR/fake/state/server.pid"

output="$(bash "$STOP_SCRIPT" "$TEST_DIR/fake" 2>&1)"

if kill -0 "$FAKE_SERVER_PID" 2>/dev/null; then
  pass "stop-server.sh does not kill node processes that only mention server.cjs"
else
  fail "stop-server.sh does not kill node processes that only mention server.cjs" \
       "Fake process $FAKE_SERVER_PID was killed. Output: $output"
  FAKE_SERVER_PID=""
fi

if [[ "$output" == '{"status": "stale_pid"}' ]]; then
  pass "stop-server.sh treats fake server.cjs argv mentions as stale"
else
  fail "stop-server.sh treats fake server.cjs argv mentions as stale" "Unexpected output: $output"
fi

kill "$FAKE_SERVER_PID" 2>/dev/null || true
wait "$FAKE_SERVER_PID" 2>/dev/null || true
FAKE_SERVER_PID=""

echo "--- Different Session Server Safety ---"

mkdir -p "$TEST_DIR/target/state" "$TEST_DIR/target-other"
BRAINSTORM_DIR="$TEST_DIR/target-other" \
BRAINSTORM_HOST="127.0.0.1" \
BRAINSTORM_URL_HOST="localhost" \
BRAINSTORM_OWNER_PID="" \
BRAINSTORM_PORT=$((49152 + RANDOM % 16383)) \
  node "$SERVER_SCRIPT" > "$TEST_DIR/target-other/.server.log" 2>&1 &
OTHER_SERVER_PID=$!
echo "$OTHER_SERVER_PID" > "$TEST_DIR/target/state/server.pid"

if ! wait_for_server_info "$TEST_DIR/target-other"; then
  fail "different-session brainstorm server starts" "server-info was not written"
else
  output="$(bash "$STOP_SCRIPT" "$TEST_DIR/target" 2>&1)"
  sleep 0.3

  if kill -0 "$OTHER_SERVER_PID" 2>/dev/null; then
    pass "stop-server.sh does not stop a different-session brainstorm server"
  else
    fail "stop-server.sh does not stop a different-session brainstorm server" \
         "Different-session server $OTHER_SERVER_PID was killed. Output: $output"
    OTHER_SERVER_PID=""
  fi

  if [[ "$output" == '{"status": "stale_pid"}' ]]; then
    pass "stop-server.sh treats different-session server pids as stale"
  else
    fail "stop-server.sh treats different-session server pids as stale" "Unexpected output: $output"
  fi
fi

kill "$OTHER_SERVER_PID" 2>/dev/null || true
wait "$OTHER_SERVER_PID" 2>/dev/null || true
OTHER_SERVER_PID=""

echo "--- Real Server Shutdown ---"

mkdir -p "$TEST_DIR/real"
BRAINSTORM_DIR="$TEST_DIR/real" \
BRAINSTORM_HOST="127.0.0.1" \
BRAINSTORM_URL_HOST="localhost" \
BRAINSTORM_OWNER_PID="" \
BRAINSTORM_PORT=$((49152 + RANDOM % 16383)) \
  node "$SERVER_SCRIPT" > "$TEST_DIR/real/.server.log" 2>&1 &
SERVER_PID=$!
mkdir -p "$TEST_DIR/real/state"
echo "$SERVER_PID" > "$TEST_DIR/real/state/server.pid"

if ! wait_for_server_info "$TEST_DIR/real"; then
  fail "real brainstorm server starts" "server-info was not written"
else
  output="$(bash "$STOP_SCRIPT" "$TEST_DIR/real" 2>&1)"
  sleep 0.3

  if ! kill -0 "$SERVER_PID" 2>/dev/null; then
    pass "stop-server.sh still stops the real brainstorm server"
    SERVER_PID=""
  else
    fail "stop-server.sh still stops the real brainstorm server" \
         "Server process $SERVER_PID is still alive. Output: $output"
  fi

  if [[ "$output" == '{"status": "stopped"}' ]]; then
    pass "stop-server.sh preserves stopped status for real servers"
  else
    fail "stop-server.sh preserves stopped status for real servers" "Unexpected output: $output"
  fi
fi

echo ""
echo "=== Results: $passed passed, $failed failed ==="

if [[ $failed -gt 0 ]]; then
  exit 1
fi
exit 0
