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
reap_job() { wait "$1" 2>/dev/null || true; }

# --- Test 1: an unrelated, reused PID must NOT be killed ---
SESS="$(mktemp -d)"; mkdir -p "$SESS/state"
sleep 600 &
UNRELATED=$!
disown "$UNRELATED" 2>/dev/null || true
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
reap_job "$UNRELATED"
rm -rf "$SESS"

# --- Test 2: a real brainstorm server IS stopped ---
SESS="$(mktemp -d)"; mkdir -p "$SESS/content" "$SESS/state"
BRAINSTORM_DIR="$SESS" BRAINSTORM_PORT=3399 node "$SERVER" > /dev/null 2>&1 &
SRV=$!
disown "$SRV" 2>/dev/null || true
for _ in $(seq 1 40); do kill -0 "$SRV" 2>/dev/null && break; sleep 0.1; done
sleep 0.4
echo "$SRV" > "$SESS/state/server.pid"
OUT="$("$STOP" "$SESS")"
sleep 0.3
if kill -0 "$SRV" 2>/dev/null; then
  bad "real brainstorm server still running after stop" "$OUT"
  kill -9 "$SRV" 2>/dev/null
  reap_job "$SRV"
else
  reap_job "$SRV"
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

# --- Test 4: a `node server.cjs` impostor NOT listening on our port is spared ---
if command -v lsof > /dev/null 2>&1; then
  SESS="$(mktemp -d)"; mkdir -p "$SESS/state"
  echo '{"type":"server-started","port":3499}' > "$SESS/state/server-info" # nothing listens on 3499
  ( exec -a "node server.cjs" sleep 600 ) &
  IMPOSTOR=$!
  disown "$IMPOSTOR" 2>/dev/null || true
  echo "$IMPOSTOR" > "$SESS/state/server.pid"
  OUT="$("$STOP" "$SESS")"
  if kill -0 "$IMPOSTOR" 2>/dev/null; then
    case "$OUT" in
      *stale_pid*) ok "a node server.cjs not listening on our port is left alone" ;;
      *) bad "impostor survived but status was not stale_pid" "$OUT" ;;
    esac
  else
    bad "killed a node server.cjs that was NOT on our recorded port" "$OUT"
  fi
  kill -9 "$IMPOSTOR" 2>/dev/null
  reap_job "$IMPOSTOR"
  rm -rf "$SESS"
else
  echo "  SKIP: lsof unavailable — port cross-check test"
fi

echo "--- Results: $PASS passed, $FAIL failed ---"
[ "$FAIL" -eq 0 ] || exit 1
