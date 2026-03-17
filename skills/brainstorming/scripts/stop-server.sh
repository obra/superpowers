#!/bin/bash
# Stop the brainstorm server and clean up
# Usage: stop-server.sh <screen_dir>
#
# Kills the server process. Only deletes session directory if it's
# under /tmp (ephemeral). Persistent directories (.superpowers/) are
# kept so mockups can be reviewed later.

SCREEN_DIR="$1"

if [[ -z "$SCREEN_DIR" ]]; then
  echo '{"error": "Usage: stop-server.sh <screen_dir>"}'
  exit 1
fi

resolve_dir() {
  local dir="$1"
  if [[ -d "$dir" ]]; then
    (cd "$dir" 2>/dev/null && pwd -P)
  fi
}

SCREEN_DIR_REAL="$(resolve_dir "$SCREEN_DIR")"
if [[ -n "$SCREEN_DIR_REAL" ]]; then
  PID_FILE="${SCREEN_DIR_REAL}/.server.pid"
  LOG_FILE="${SCREEN_DIR_REAL}/.server.log"
else
  PID_FILE="${SCREEN_DIR}/.server.pid"
  LOG_FILE="${SCREEN_DIR}/.server.log"
fi

if [[ -f "$PID_FILE" ]]; then
  pid=$(cat "$PID_FILE")
  kill "$pid" 2>/dev/null
  rm -f "$PID_FILE" "$LOG_FILE"

  # Only delete ephemeral /tmp directories
  TMP_ROOT="$(cd /tmp && pwd -P)"
  if [[ -n "$SCREEN_DIR_REAL" && "$SCREEN_DIR_REAL" == "$TMP_ROOT"/brainstorm-* ]]; then
    rm -rf -- "$SCREEN_DIR_REAL"
  fi

  echo '{"status": "stopped"}'
else
  echo '{"status": "not_running"}'
fi
