#!/bin/bash
# Stop the brainstorm server and clean up session directory
# Usage: stop-server.sh <screen_dir>

SCREEN_DIR="$1"

if [[ -z "$SCREEN_DIR" ]]; then
  echo '{"error": "Usage: stop-server.sh <screen_dir>"}'
  exit 1
fi

PID_FILE="${SCREEN_DIR}/.server.pid"

if [[ -f "$PID_FILE" ]]; then
  pid=$(cat "$PID_FILE")
  kill "$pid" 2>/dev/null
  # Clean up session directory
  rm -rf "$SCREEN_DIR"
  echo '{"status": "stopped"}'
else
  echo '{"status": "not_running"}'
fi
