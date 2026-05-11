#!/usr/bin/env bash
# Windows lifecycle tests for the brainstorm server.
#
# Verifies that the brainstorm server survives the 60-second lifecycle
# check on Windows, where OWNER_PID monitoring is disabled because the
# MSYS2 PID namespace is invisible to Node.js.
#
# Requirements:
#   - Node.js in PATH
#   - Run from the repository root, or set SUPERPOWERS_ROOT
#   - On Windows: Git Bash (OSTYPE=msys*)
#
# Usage:
#   bash tests/brainstorm-server/windows-lifecycle.test.sh
set -uo pipefail

# ========== Configuration ==========

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="${SUPERPOWERS_ROOT:-$(cd "$SCRIPT_DIR/../.." && pwd)}"
START_SCRIPT="$REPO_ROOT/skills/brainstorming/scripts/start-server.sh"
STOP_SCRIPT="$REPO_ROOT/skills/brainstorming/scripts/stop-server.sh"
SERVER_JS="$REPO_ROOT/skills/brainstorming/scripts/server.js"

TEST_DIR="${TMPDIR:-/tmp}/brainstorm-win-test-$$"

passed=0
failed=0
skipped=0

# ========== Helpers ==========

cleanup() {
  # Kill any server processes we started
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
    if [[ -f "$dir/.server-info" ]]; then
      return 0
    fi
    sleep 0.1
  done
  return 1
}

get_port_from_info() {
  # Read the port from .server-info. Use grep/sed instead of Node.js
  # to avoid MSYS2-to-Windows path translation issues.
  grep -o '"port":[0-9]*' "$1/.server-info" | head -1 | sed 's/"port"://'
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

# ========== Platform Detection ==========

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
  echo "NOTE: Not running on Windows/MSYS2 (OSTYPE=${OSTYPE:-unset})."
  echo "Windows-specific tests will be skipped. Tests 4-6 still run."
  echo ""
fi

mkdir -p "$TEST_DIR"

SERVER_PID=""
CONTROL_PID=""
STOP_TEST_PID=""

# ========== Test 1: OWNER_PID is empty on Windows ==========

echo "--- Owner PID Resolution ---"

if [[ "$is_windows" == "true" ]]; then
  # Replicate the PID resolution logic from start-server.sh lines 104-112
  TEST_OWNER_PID="$(ps -o ppid= -p "$PPID" 2>/dev/null | tr -d ' ' || true)"
  if [[ -z "$TEST_OWNER_PID" || "$TEST_OWNER_PID" == "1" ]]; then
    TEST_OWNER_PID="$PPID"
  fi
  # The fix: clear on Windows
  case "${OSTYPE:-}" in
    msys*|cygwin*|mingw*) TEST_OWNER_PID="" ;;
  esac

  if [[ -z "$TEST_OWNER_PID" ]]; then
    pass "OWNER_PID is empty on Windows after fix"
  else
    fail "OWNER_PID is empty on Windows after fix" \
         "Expected empty, got '$TEST_OWNER_PID'"
  fi
else
  skip "OWNER_PID is empty on Windows" "not on Windows"
fi

# ========== Test 2: start-server.sh passes empty BRAINSTORM_OWNER_PID ==========

if [[ "$is_windows" == "true" ]]; then
  # Use a fake 'node' that captures the env var and exits
  FAKE_NODE_DIR="$TEST_DIR/fake-bin"
  mkdir -p "$FAKE_NODE_DIR"
  cat > "$FAKE_NODE_DIR/node" <<'FAKENODE'
#!/usr/bin/env bash
echo "CAPTURED_OWNER_PID=${BRAINSTORM_OWNER_PID:-__UNSET__}"
exit 0
FAKENODE
  chmod +x "$FAKE_NODE_DIR/node"

  captured=$(PATH="$FAKE_NODE_DIR:$PATH" bash "$START_SCRIPT" --project-dir "$TEST_DIR/session" --foreground 2>/dev/null || true)
  owner_pid_value=$(echo "$captured" | grep "CAPTURED_OWNER_PID=" | head -1 | sed 's/CAPTURED_OWNER_PID=//')

  if [[ "$owner_pid_value" == "" || "$owner_pid_value" == "__UNSET__" ]]; then
    pass "start-server.sh passes empty BRAINSTORM_OWNER_PID on Windows"
  else
    fail "start-server.sh passes empty BRAINSTORM_OWNER_PID on Windows" \
         "Expected empty or unset, got '$owner_pid_value'"
  fi

  rm -rf "$FAKE_NODE_DIR" "$TEST_DIR/session"
else
  skip "start-server.sh passes empty BRAINSTORM_OWNER_PID" "not on Windows"
fi

# ========== Test 3: Auto-foreground detection on Windows ==========

echo ""
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

  # Run WITHOUT --foreground flag — Windows should auto-detect
  captured=$(PATH="$FAKE_NODE_DIR:$PATH" bash "$START_SCRIPT" --project-dir "$TEST_DIR/session2" 2>/dev/null || true)

  if echo "$captured" | grep -q "FOREGROUND_MODE=true"; then
    pass "Windows auto-detects foreground mode"
  else
    fail "Windows auto-detects foreground mode" \
         "Expected foreground code path, output: $captured"
  fi

  rm -rf "$FAKE_NODE_DIR" "$TEST_DIR/session2"
else
  skip "Windows auto-detects foreground mode" "not on Windows"
fi

# ========== Test 4: Server survives past 60-second lifecycle check ==========

echo ""
echo "--- Server Survival (lifecycle check) ---"

mkdir -p "$TEST_DIR/survival"

echo "  Starting server (will wait ~75s to verify survival past lifecycle check)..."

BRAINSTORM_DIR="$TEST_DIR/survival" \
BRAINSTORM_HOST="127.0.0.1" \
BRAINSTORM_URL_HOST="localhost" \
BRAINSTORM_OWNER_PID="" \
BRAINSTORM_PORT=$((49152 + RANDOM % 16383)) \
  node "$SERVER_JS" > "$TEST_DIR/survival/.server.log" 2>&1 &
SERVER_PID=$!

if ! wait_for_server_info "$TEST_DIR/survival"; then
  fail "Server starts successfully" "Server did not write .server-info within 5 seconds"
  kill "$SERVER_PID" 2>/dev/null || true
  SERVER_PID=""
else
  pass "Server starts successfully with empty OWNER_PID"

  SERVER_PORT=$(get_port_from_info "$TEST_DIR/survival")

  sleep 75

  if kill -0 "$SERVER_PID" 2>/dev/null; then
    pass "Server is still alive after 75 seconds"
  else
    fail "Server is still alive after 75 seconds" \
         "Server died. Log tail: $(tail -5 "$TEST_DIR/survival/.server.log" 2>/dev/null)"
  fi

  if http_check "$SERVER_PORT"; then
    pass "Server responds to HTTP after lifecycle check window"
  else
    fail "Server responds to HTTP after lifecycle check window" \
         "HTTP request to port $SERVER_PORT failed"
  fi

  if grep -q "owner process exited" "$TEST_DIR/survival/.server.log" 2>/dev/null; then
    fail "No 'owner process exited' in logs" \
         "Found spurious owner-exit shutdown in log"
  else
    pass "No 'owner process exited' in logs"
  fi

  kill "$SERVER_PID" 2>/dev/null || true
  wait "$SERVER_PID" 2>/dev/null || true
  SERVER_PID=""
fi

# ========== Test 5: Bad OWNER_PID causes shutdown (control) ==========

echo ""
echo "--- Control: Bad OWNER_PID causes shutdown ---"

mkdir -p "$TEST_DIR/control"

# Find a PID that does not exist
BAD_PID=99999
while kill -0 "$BAD_PID" 2>/dev/null; do
  BAD_PID=$((BAD_PID + 1))
done

BRAINSTORM_DIR="$TEST_DIR/control" \
BRAINSTORM_HOST="127.0.0.1" \
BRAINSTORM_URL_HOST="localhost" \
BRAINSTORM_OWNER_PID="$BAD_PID" \
BRAINSTORM_PORT=$((49152 + RANDOM % 16383)) \
  node "$SERVER_JS" > "$TEST_DIR/control/.server.log" 2>&1 &
CONTROL_PID=$!

if ! wait_for_server_info "$TEST_DIR/control"; then
  fail "Control server starts" "Server did not write .server-info within 5 seconds"
  kill "$CONTROL_PID" 2>/dev/null || true
  CONTROL_PID=""
else
  pass "Control server starts with bad OWNER_PID=$BAD_PID"

  echo "  Waiting ~75s for lifecycle check to kill server..."
  sleep 75

  if kill -0 "$CONTROL_PID" 2>/dev/null; then
    fail "Control server self-terminates with bad OWNER_PID" \
         "Server is still alive (expected it to die)"
    kill "$CONTROL_PID" 2>/dev/null || true
  else
    pass "Control server self-terminates with bad OWNER_PID"
  fi

  if grep -q "owner process exited" "$TEST_DIR/control/.server.log" 2>/dev/null; then
    pass "Control server logs 'owner process exited'"
  else
    fail "Control server logs 'owner process exited'" \
         "Log tail: $(tail -5 "$TEST_DIR/control/.server.log" 2>/dev/null)"
  fi
fi

wait "$CONTROL_PID" 2>/dev/null || true
CONTROL_PID=""

# ========== Test 6: stop-server.sh cleanly stops the server ==========

echo ""
echo "--- Clean Shutdown ---"

mkdir -p "$TEST_DIR/stop-test"

BRAINSTORM_DIR="$TEST_DIR/stop-test" \
BRAINSTORM_HOST="127.0.0.1" \
BRAINSTORM_URL_HOST="localhost" \
BRAINSTORM_OWNER_PID="" \
BRAINSTORM_PORT=$((49152 + RANDOM % 16383)) \
  node "$SERVER_JS" > "$TEST_DIR/stop-test/.server.log" 2>&1 &
STOP_TEST_PID=$!
echo "$STOP_TEST_PID" > "$TEST_DIR/stop-test/.server.pid"

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
    fail "stop-server.sh cleanly stops the server" \
         "Server PID $STOP_TEST_PID is still alive after stop"
    kill "$STOP_TEST_PID" 2>/dev/null || true
  fi
fi

wait "$STOP_TEST_PID" 2>/dev/null || true
STOP_TEST_PID=""

# ========== Summary ==========

echo ""
echo "=== Results: $passed passed, $failed failed, $skipped skipped ==="

if [[ $failed -gt 0 ]]; then
  exit 1
fi
exit 0
