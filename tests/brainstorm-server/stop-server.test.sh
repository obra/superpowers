#!/usr/bin/env bash
# Tests for stop-server.sh PID-ownership safety.
#
# A stale server.pid (e.g. after a reboot, when the kernel has recycled the PID)
# can point at an unrelated, live process. stop-server.sh must verify the PID is
# actually our brainstorm server before signalling it.

set -u
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
STOP="$SCRIPT_DIR/../../skills/brainstorming/scripts/stop-server.sh"
SERVER="$SCRIPT_DIR/../../skills/brainstorming/scripts/server.cjs"

PASS=0; FAIL=0
ok() { echo "  PASS: $1"; PASS=$((PASS + 1)); }
bad() { echo "  FAIL: $1"; echo "    $2"; FAIL=$((FAIL + 1)); }

# --- Test 1: an unrelated, reused PID must NOT be killed ---
SESS="$(mktemp -d)"; mkdir -p "$SESS/state"
sleep 600 &
UNRELATED=$!
echo "$UNRELATED" > "$SESS/state/server.pid"
OUT="$("$STOP" "$SESS")"
if kill -0 "$UNRELATED" 2>/dev/null; then
  case "$OUT" in
    *stale_pid*) ok "unrelated reused PID is left alone (stale_pid)" ;;
    *) bad "unrelated PID survived but status was not stale_pid" "$OUT" ;;
  esac
else
  bad "unrelated reused PID was KILLED" "$OUT"
fi
kill -9 "$UNRELATED" 2>/dev/null
rm -rf "$SESS"

# --- Test 2: a real brainstorm server IS stopped ---
SESS="$(mktemp -d)"; mkdir -p "$SESS/content" "$SESS/state"
BRAINSTORM_DIR="$SESS" BRAINSTORM_PORT=3399 node "$SERVER" > /dev/null 2>&1 &
SRV=$!
for _ in $(seq 1 40); do kill -0 "$SRV" 2>/dev/null && break; sleep 0.1; done
sleep 0.4
echo "$SRV" > "$SESS/state/server.pid"
OUT="$("$STOP" "$SESS")"
sleep 0.3
if kill -0 "$SRV" 2>/dev/null; then
  bad "real brainstorm server still running after stop" "$OUT"
  kill -9 "$SRV" 2>/dev/null
else
  case "$OUT" in
    *stopped*) ok "real brainstorm server is stopped" ;;
    *) bad "server stopped but status was not 'stopped'" "$OUT" ;;
  esac
fi
rm -rf "$SESS"

# --- Test 3: no pid file ---
SESS="$(mktemp -d)"; mkdir -p "$SESS/state"
OUT="$("$STOP" "$SESS")"
case "$OUT" in
  *not_running*) ok "missing pid file reports not_running" ;;
  *) bad "missing pid file: unexpected status" "$OUT" ;;
esac
rm -rf "$SESS"

echo "--- Results: $PASS passed, $FAIL failed ---"
[ "$FAIL" -eq 0 ] || exit 1
