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
PIDS=()
DIRS=()

cleanup() {
  for pid in "${PIDS[@]}"; do
    kill -9 "$pid" 2>/dev/null || true
    wait "$pid" 2>/dev/null || true
  done
  for dir in "${DIRS[@]}"; do
    rm -rf "$dir"
  done
}
trap cleanup EXIT

track_dir() { DIRS+=("$1"); }
track_pid() { PIDS+=("$1"); }
untrack_pid() {
  local remove="$1"
  local kept=()
  local pid
  for pid in "${PIDS[@]}"; do
    [[ "$pid" == "$remove" ]] || kept+=("$pid")
  done
  PIDS=("${kept[@]}")
}
new_server_id() {
  printf 'testid%026d\n' "$RANDOM"
}

ok() { echo "  PASS: $1"; PASS=$((PASS + 1)); }
bad() { echo "  FAIL: $1"; echo "    $2"; FAIL=$((FAIL + 1)); }

# --- Test 1: an unrelated, reused PID must NOT be killed ---
SESS="$(mktemp -d)"; track_dir "$SESS"; mkdir -p "$SESS/state"
sleep 600 &
UNRELATED=$!
track_pid "$UNRELATED"
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

# --- Test 2: a real brainstorm server with matching instance id IS stopped ---
SESS="$(mktemp -d)"; track_dir "$SESS"; mkdir -p "$SESS/content" "$SESS/state"
SERVER_ID="$(new_server_id)"
printf '%s\n' "$SERVER_ID" > "$SESS/state/server-instance-id"
BRAINSTORM_DIR="$SESS" BRAINSTORM_PORT=3399 node "$SERVER" "--brainstorm-server-id=$SERVER_ID" > /dev/null 2>&1 &
SRV=$!
track_pid "$SRV"
disown "$SRV" 2>/dev/null || true
for _ in $(seq 1 40); do kill -0 "$SRV" 2>/dev/null && break; sleep 0.1; done
sleep 0.4
echo "$SRV" > "$SESS/state/server.pid"
OUT="$("$STOP" "$SESS")"
sleep 0.3
if kill -0 "$SRV" 2>/dev/null; then
  bad "real brainstorm server still running after stop" "$OUT"
else
  wait "$SRV" 2>/dev/null || true
  untrack_pid "$SRV"
  case "$OUT" in
    *stopped*) ok "real brainstorm server with matching instance id is stopped" ;;
    *) bad "server stopped but status was not 'stopped'" "$OUT" ;;
  esac
fi

# --- Test 2b: persistent sessions stop with explicit stopped metadata ---
SESS="$(mktemp -d "$SCRIPT_DIR/.stop-persistent.XXXXXX")"; track_dir "$SESS"; mkdir -p "$SESS/content" "$SESS/state"
SERVER_ID="$(new_server_id)"
printf '%s\n' "$SERVER_ID" > "$SESS/state/server-instance-id"
BRAINSTORM_DIR="$SESS" BRAINSTORM_PORT=0 node "$SERVER" "--brainstorm-server-id=$SERVER_ID" > /dev/null 2>&1 &
SRV=$!
track_pid "$SRV"
disown "$SRV" 2>/dev/null || true
for _ in $(seq 1 40); do
  [[ -f "$SESS/state/server-info" ]] && break
  sleep 0.1
done
echo "$SRV" > "$SESS/state/server.pid"
OUT="$("$STOP" "$SESS")"
sleep 0.3
if kill -0 "$SRV" 2>/dev/null; then
  bad "persistent brainstorm server still running after stop" "$OUT"
else
  wait "$SRV" 2>/dev/null || true
  untrack_pid "$SRV"
  if [[ -f "$SESS/state/server-info" ]]; then
    bad "persistent stop clears server-info" "server-info still exists after: $OUT"
  elif [[ ! -f "$SESS/state/server-stopped" ]]; then
    bad "persistent stop writes server-stopped" "server-stopped missing after: $OUT"
  elif grep -q '"reason":"stop-server.sh"' "$SESS/state/server-stopped"; then
    ok "persistent stop clears alive metadata and writes server-stopped"
  else
    bad "persistent stop writes stop reason" "$(cat "$SESS/state/server-stopped" 2>/dev/null || true)"
  fi
fi

# --- Test 3: no pid file ---
SESS="$(mktemp -d)"; track_dir "$SESS"; mkdir -p "$SESS/state"
OUT="$("$STOP" "$SESS")"
case "$OUT" in
  *not_running*) ok "missing pid file reports not_running" ;;
  *) bad "missing pid file: unexpected status" "$OUT" ;;
esac

# --- Test 4: a node server.cjs impostor with missing instance id is spared ---
SESS="$(mktemp -d)"; track_dir "$SESS"; mkdir -p "$SESS/state"
( exec -a "node server.cjs" sleep 600 ) &
IMPOSTOR=$!
track_pid "$IMPOSTOR"
disown "$IMPOSTOR" 2>/dev/null || true
echo "$IMPOSTOR" > "$SESS/state/server.pid"
OUT="$("$STOP" "$SESS")"
if kill -0 "$IMPOSTOR" 2>/dev/null; then
  case "$OUT" in
    *stale_pid*) ok "missing instance id leaves node server.cjs impostor alone" ;;
    *) bad "impostor survived but status was not stale_pid" "$OUT" ;;
  esac
else
  bad "killed a node server.cjs impostor with missing instance id" "$OUT"
fi

# --- Test 5: a node server.cjs impostor with wrong instance id is spared ---
SESS="$(mktemp -d)"; track_dir "$SESS"; mkdir -p "$SESS/state"
EXPECTED_ID="$(new_server_id)"
WRONG_ID="$(new_server_id)"
printf '%s\n' "$EXPECTED_ID" > "$SESS/state/server-instance-id"
( exec -a "node server.cjs --brainstorm-server-id=$WRONG_ID" sleep 600 ) &
IMPOSTOR=$!
track_pid "$IMPOSTOR"
disown "$IMPOSTOR" 2>/dev/null || true
echo "$IMPOSTOR" > "$SESS/state/server.pid"
OUT="$("$STOP" "$SESS")"
if kill -0 "$IMPOSTOR" 2>/dev/null; then
  case "$OUT" in
    *stale_pid*) ok "wrong instance id leaves node server.cjs impostor alone" ;;
    *) bad "wrong-id impostor survived but status was not stale_pid" "$OUT" ;;
  esac
else
  bad "killed a node server.cjs impostor with wrong instance id" "$OUT"
fi

# --- Test 6: malformed instance id is fail-closed ---
SESS="$(mktemp -d)"; track_dir "$SESS"; mkdir -p "$SESS/state"
printf '%s\n' 'bad id with spaces' > "$SESS/state/server-instance-id"
( exec -a "node server.cjs --brainstorm-server-id=bad-id-with-spaces" sleep 600 ) &
IMPOSTOR=$!
track_pid "$IMPOSTOR"
disown "$IMPOSTOR" 2>/dev/null || true
echo "$IMPOSTOR" > "$SESS/state/server.pid"
OUT="$("$STOP" "$SESS")"
if kill -0 "$IMPOSTOR" 2>/dev/null; then
  case "$OUT" in
    *stale_pid*) ok "malformed instance id is fail-closed" ;;
    *) bad "malformed-id impostor survived but status was not stale_pid" "$OUT" ;;
  esac
else
  bad "killed process despite malformed instance id" "$OUT"
fi

echo "--- Results: $PASS passed, $FAIL failed ---"
[ "$FAIL" -eq 0 ] || exit 1
