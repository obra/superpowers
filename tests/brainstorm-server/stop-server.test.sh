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
OUT="$("$STOP" "$SESS/state")"
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
OUT="$("$STOP" "$SESS/state")"
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
OUT="$("$STOP" "$SESS/state")"
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
OUT="$("$STOP" "$SESS/state")"
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
OUT="$("$STOP" "$SESS/state")"
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
OUT="$("$STOP" "$SESS/state")"
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
OUT="$("$STOP" "$SESS/state")"
if kill -0 "$IMPOSTOR" 2>/dev/null; then
  case "$OUT" in
    *stale_pid*) ok "malformed instance id is fail-closed" ;;
    *) bad "malformed-id impostor survived but status was not stale_pid" "$OUT" ;;
  esac
else
  bad "killed process despite malformed instance id" "$OUT"
fi

# --- Test 7: passing parent session dir (not a state dir) fails with exit 1 ---
SESS="$(mktemp -d)"; track_dir "$SESS"; mkdir -p "$SESS/content" "$SESS/state"
RC=0
OUT="$("$STOP" "$SESS")" || RC=$?
if [[ "$RC" -eq 1 && "$OUT" == *'"error":'* ]]; then
  ok "passing parent session dir exits 1 with JSON error"
else
  bad "passing parent session dir should exit 1 with JSON error" "rc=$RC out=$OUT"
fi

RC=0
OUT="$("$STOP" "$SESS/does-not-exist/state")" || RC=$?
if [[ "$RC" -eq 1 && "$OUT" == *'"error":'* ]]; then
  ok "missing state dir exits 1 with JSON error"
else
  bad "missing state dir should exit 1 with JSON error" "rc=$RC out=$OUT"
fi

# --- Test 8: /tmp project mockups are preserved while /tmp/brainstorm-* is deleted ---
test_tmp_cleanup_case() {
  local label="$1" sess_dir="$2" expect_deleted="$3"
  local server_id srv rc=0 out=""

  mkdir -p "$sess_dir/content" "$sess_dir/state"
  printf '<h1>Mockup</h1>\n' > "$sess_dir/content/mockup.html"
  server_id="$(new_server_id)"
  printf '%s\n' "$server_id" > "$sess_dir/state/server-instance-id"
  node -e 'setInterval(()=>{},60000)' -- "--brainstorm-server-id=$server_id" >/dev/null 2>&1 &
  srv=$!
  track_pid "$srv"
  disown "$srv" 2>/dev/null || true
  for _ in $(seq 1 20); do kill -0 "$srv" 2>/dev/null && break; sleep 0.05; done
  echo "$srv" > "$sess_dir/state/server.pid"
  out="$("$STOP" "$sess_dir/state")" || rc=$?
  wait "$srv" 2>/dev/null || true
  untrack_pid "$srv"
  if [[ "$rc" -ne 0 || "$out" != *stopped* ]]; then
    bad "$label: stop failed" "rc=$rc out=$out"
  elif [[ "$expect_deleted" == "true" ]]; then
    if [[ -e "$sess_dir" ]]; then
      bad "$label: session dir was not deleted" "$sess_dir still exists"
    else
      ok "$label"
    fi
  elif [[ ! -f "$sess_dir/content/mockup.html" || ! -f "$sess_dir/state/server-stopped" ]]; then
    bad "$label: expected mockup.html and server-stopped to remain" "$out"
  else
    ok "$label"
  fi
}

BPROJ_ROOT="/tmp/brainstorm-proj-$$"; track_dir "$BPROJ_ROOT"
test_tmp_cleanup_case "/tmp/brainstorm-* project session preserves content/mockup.html on stop" "$BPROJ_ROOT/.superpowers/brainstorm/123" "false"

EPHEM_SESS="/tmp/brainstorm-ephemeral-$$"; track_dir "$EPHEM_SESS"
test_tmp_cleanup_case "ephemeral /tmp/brainstorm-* session dir is deleted on stop" "$EPHEM_SESS" "true"

echo "--- Results: $PASS passed, $FAIL failed ---"
[ "$FAIL" -eq 0 ] || exit 1
