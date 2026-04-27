#!/usr/bin/env bash
# Windows lifecycle tests for the brainstorm server.
#
# Adapted for Horspowers paths and the current state/content directory layout.
set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="${HORSPOWERS_ROOT:-$(cd "$SCRIPT_DIR/../.." && pwd)}"
START_SCRIPT="$REPO_ROOT/skills/brainstorming/scripts/start-server.sh"
STOP_SCRIPT="$REPO_ROOT/skills/brainstorming/scripts/stop-server.sh"
SERVER_JS="$REPO_ROOT/skills/brainstorming/scripts/server.cjs"

TEST_DIR="${TMPDIR:-/tmp}/brainstorm-win-test-$$"

passed=0
failed=0
skipped=0

cleanup() {
  for pidvar in SERVER_PID CONTROL_PID STOP_TEST_PID; do
    pid="${!pidvar:-}"
    if [[ -n "$pid" ]]; then
      kill "$pid" 2>/dev/null || true
      wait "$pid" 2>/dev/null || true
    fi
  done
  if [[ -n "${TEST_DIR:-}" && -d "$TEST_DIR" ]]; then
    rm -rf "$TEST_DIR"
  fi
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

skip() {
  echo "  SKIP: $1 ($2)"
  skipped=$((skipped + 1))
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

get_port_from_info() {
  grep -o '"port":[0-9]*' "$1/state/server-info" | head -1 | sed 's/"port"://'
}

http_check() {
  local port="$1"
  node -e "
    const http = require('http');
    http.get('http://localhost:$port/', (res) => {
      process.exit(res.statusCode === 200 ? 0 : 1);
    }).on('error', () => process.exit(1));
  " 2>/dev/null
}

echo ""
echo "=== Brainstorm Server Windows Lifecycle Tests ==="
echo "Platform: ${OSTYPE:-unknown}"
echo "MSYSTEM: ${MSYSTEM:-unset}"
echo "Node: $(node --version 2>/dev/null || echo 'not found')"
echo ""

is_windows="false"
case "${OSTYPE:-}" in
  msys*|cygwin*|mingw*) is_windows="true" ;;
esac
if [[ -n "${MSYSTEM:-}" ]]; then
  is_windows="true"
fi

if [[ "$is_windows" != "true" ]]; then
  echo "NOTE: Not running on Windows/MSYS2."
  echo "Windows-specific tests will be skipped."
  echo ""
fi

mkdir -p "$TEST_DIR"

SERVER_PID=""
CONTROL_PID=""
STOP_TEST_PID=""

echo "--- Foreground Mode Detection ---"

if [[ "$is_windows" == "true" ]]; then
  FAKE_NODE_DIR="$TEST_DIR/fake-bin"
  mkdir -p "$FAKE_NODE_DIR"
  cat > "$FAKE_NODE_DIR/node" <<'FAKENODE'
#!/usr/bin/env bash
echo "FOREGROUND_MODE=true"
exit 0
FAKENODE
  chmod +x "$FAKE_NODE_DIR/node"

  captured=$(PATH="$FAKE_NODE_DIR:$PATH" bash "$START_SCRIPT" --project-dir "$TEST_DIR/session2" 2>/dev/null || true)

  if echo "$captured" | grep -q "FOREGROUND_MODE=true"; then
    pass "Windows auto-detects foreground mode"
  else
    fail "Windows auto-detects foreground mode" "Expected foreground code path, output: $captured"
  fi

  rm -rf "$FAKE_NODE_DIR" "$TEST_DIR/session2"
else
  skip "Windows auto-detects foreground mode" "not on Windows"
fi

echo ""
echo "--- Server Survival (lifecycle check) ---"

mkdir -p "$TEST_DIR/survival"

BRAINSTORM_DIR="$TEST_DIR/survival" \
BRAINSTORM_HOST="127.0.0.1" \
BRAINSTORM_URL_HOST="localhost" \
BRAINSTORM_OWNER_PID="" \
BRAINSTORM_PORT=$((49152 + RANDOM % 16383)) \
  node "$SERVER_JS" > "$TEST_DIR/survival/server.log" 2>&1 &
SERVER_PID=$!

if ! wait_for_server_info "$TEST_DIR/survival"; then
  fail "Server starts successfully" "Server did not write state/server-info within 5 seconds"
  kill "$SERVER_PID" 2>/dev/null || true
  SERVER_PID=""
else
  pass "Server starts successfully with empty OWNER_PID"

  SERVER_PORT=$(get_port_from_info "$TEST_DIR/survival")
  sleep 75

  if kill -0 "$SERVER_PID" 2>/dev/null; then
    pass "Server is still alive after 75 seconds"
  else
    fail "Server is still alive after 75 seconds" "Server died. Log tail: $(tail -5 "$TEST_DIR/survival/server.log" 2>/dev/null)"
  fi

  if http_check "$SERVER_PORT"; then
    pass "Server responds to HTTP after lifecycle check window"
  else
    fail "Server responds to HTTP after lifecycle check window" "HTTP request to port $SERVER_PORT failed"
  fi

  if grep -q "owner process exited" "$TEST_DIR/survival/server.log" 2>/dev/null; then
    fail "No 'owner process exited' in logs" "Found spurious owner-exit shutdown in log"
  else
    pass "No 'owner process exited' in logs"
  fi

  kill "$SERVER_PID" 2>/dev/null || true
  wait "$SERVER_PID" 2>/dev/null || true
  SERVER_PID=""
fi

echo ""
echo "--- Clean Shutdown ---"

mkdir -p "$TEST_DIR/stop-test"

BRAINSTORM_DIR="$TEST_DIR/stop-test" \
BRAINSTORM_HOST="127.0.0.1" \
BRAINSTORM_URL_HOST="localhost" \
BRAINSTORM_OWNER_PID="" \
BRAINSTORM_PORT=$((49152 + RANDOM % 16383)) \
  node "$SERVER_JS" > "$TEST_DIR/stop-test/server.log" 2>&1 &
STOP_TEST_PID=$!

if ! wait_for_server_info "$TEST_DIR/stop-test"; then
  fail "Stop-test server starts" "Server did not start"
  kill "$STOP_TEST_PID" 2>/dev/null || true
  STOP_TEST_PID=""
else
  bash "$STOP_SCRIPT" "$TEST_DIR/stop-test" >/dev/null 2>&1 || true
  sleep 1

  if ! kill -0 "$STOP_TEST_PID" 2>/dev/null; then
    pass "stop-server.sh cleanly stops the server"
  else
    fail "stop-server.sh cleanly stops the server" "Server PID $STOP_TEST_PID is still alive after stop"
    kill "$STOP_TEST_PID" 2>/dev/null || true
  fi
fi

wait "$STOP_TEST_PID" 2>/dev/null || true
STOP_TEST_PID=""

echo ""
echo "=== Results: $passed passed, $failed failed, $skipped skipped ==="

if [[ $failed -gt 0 ]]; then
  exit 1
fi
exit 0
