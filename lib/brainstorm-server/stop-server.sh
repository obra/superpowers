#!/bin/bash
# Stop the brainstorm server and clean up
# Usage: stop-server.sh

SCREEN_DIR="${BRAINSTORM_SCREEN_DIR:-/tmp/brainstorm}"
PID_FILE="${SCREEN_DIR}/.server.pid"

if [[ -f "$PID_FILE" ]]; then
  pid=$(cat "$PID_FILE")
  kill "$pid" 2>/dev/null
  rm -f "$PID_FILE"
  echo '{"status": "stopped"}'
else
  echo '{"status": "not_running"}'
fi
