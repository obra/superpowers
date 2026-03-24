#!/bin/bash
# Stop the brainstorm server and clean up
# Usage: stop-server.sh <screen_dir>
#
# Kills the server process. Only deletes sessions explicitly marked as
# ephemeral by start-server.sh. Persistent project-backed directories
# are kept so mockups can be reviewed later.

SCREEN_DIR="$1"

if [[ -z "$SCREEN_DIR" ]]; then
  echo '{"error": "Usage: stop-server.sh <screen_dir>"}'
  exit 1
fi

PID_FILE="${SCREEN_DIR}/.server.pid"
EPHEMERAL_MARKER="${SCREEN_DIR}/.ephemeral"

emit_json() {
  local status="$1"
  local reason="${2:-}"
  if [[ -n "$reason" ]]; then
    printf '{"status": "%s", "reason": "%s"}\n' "$status" "$reason"
  else
    printf '{"status": "%s"}\n' "$status"
  fi
}

is_ephemeral_session() {
  [[ -f "$EPHEMERAL_MARKER" ]]
}

cleanup_stale_session() {
  rm -f "$PID_FILE" "${SCREEN_DIR}/.server.log" "${SCREEN_DIR}/.server-info"
  if is_ephemeral_session; then
    rm -rf "$SCREEN_DIR"
  fi
}

cleanup_stopped_session() {
  rm -f "$PID_FILE" "${SCREEN_DIR}/.server.log"
  if is_ephemeral_session; then
    rm -rf "$SCREEN_DIR"
  fi
}

pid_matches_brainstorm_server() {
  local pid="$1"
  local command
  command="$(ps -ww -o command= -p "$pid" 2>/dev/null | head -1 | tr -d '\r')"
  [[ -n "$command" ]] || return 1
  [[ "$command" == *"server.js"* ]] || return 1
  [[ "$command" == *"--screen-dir $SCREEN_DIR"* ]]
}

if [[ -f "$PID_FILE" ]]; then
  pid="$(tr -d '[:space:]' < "$PID_FILE")"
  if [[ ! "$pid" =~ ^[0-9]+$ ]]; then
    cleanup_stale_session
    emit_json "not_running" "stale_pid"
    exit 0
  fi
  if ! kill -0 "$pid" 2>/dev/null; then
    cleanup_stale_session
    emit_json "not_running" "stale_pid"
    exit 0
  fi
  if ! pid_matches_brainstorm_server "$pid"; then
    cleanup_stale_session
    emit_json "not_running" "stale_pid"
    exit 0
  fi
  kill "$pid" 2>/dev/null || true
  for _ in {1..50}; do
    if ! kill -0 "$pid" 2>/dev/null; then
      break
    fi
    sleep 0.1
  done
  if kill -0 "$pid" 2>/dev/null; then
    kill -KILL "$pid" 2>/dev/null || true
    for _ in {1..20}; do
      if ! kill -0 "$pid" 2>/dev/null; then
        break
      fi
      sleep 0.1
    done
  fi
  if kill -0 "$pid" 2>/dev/null; then
    echo '{"error": "Server failed to stop cleanly"}'
    exit 1
  fi
  cleanup_stopped_session

  emit_json "stopped"
else
  if is_ephemeral_session && [[ -f "${SCREEN_DIR}/.server-stopped" ]]; then
    rm -rf "$SCREEN_DIR"
  fi
  emit_json "not_running"
fi
