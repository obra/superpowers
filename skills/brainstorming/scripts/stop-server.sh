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

canonicalize_dir() {
  (cd "$1" 2>/dev/null && pwd -P)
}

is_managed_session_dir() {
  case "$1" in
    /tmp/brainstorm-*|*/.superpowers/brainstorm/*)
      return 0
      ;;
    *)
      return 1
      ;;
  esac
}

CANONICAL_SCREEN_DIR="$(canonicalize_dir "$SCREEN_DIR")"
if [[ -z "$CANONICAL_SCREEN_DIR" ]]; then
  echo '{"error": "Refusing to stop unknown brainstorm session"}'
  exit 1
fi

if ! is_managed_session_dir "$CANONICAL_SCREEN_DIR"; then
  echo '{"error": "Refusing to stop unmanaged brainstorm session"}'
  exit 1
fi

SERVER_INFO_FILE="${CANONICAL_SCREEN_DIR}/.server-info"
if [[ ! -f "$SERVER_INFO_FILE" ]] || ! grep -Fq "\"screen_dir\":\"${CANONICAL_SCREEN_DIR}\"" "$SERVER_INFO_FILE"; then
  echo '{"error": "Refusing to stop unverified brainstorm session"}'
  exit 1
fi

PID_FILE="${CANONICAL_SCREEN_DIR}/.server.pid"

if [[ -f "$PID_FILE" ]]; then
  pid=$(tr -d '[:space:]' < "$PID_FILE")
  if ! [[ "$pid" =~ ^[0-9]+$ ]]; then
    echo '{"error": "Refusing to stop session with invalid pid file"}'
    exit 1
  fi

  command="$(ps -p "$pid" -o command= 2>/dev/null)"
  if [[ -n "$command" && ( "$command" != *"node"* || "$command" != *"index.js"* ) ]]; then
    echo '{"error": "Refusing to stop unrelated process"}'
    exit 1
  fi

  if [[ -n "$command" ]]; then
    kill "$pid" 2>/dev/null
  fi

  rm -f "$PID_FILE" "${CANONICAL_SCREEN_DIR}/.server.log"

  # Only delete ephemeral /tmp directories
  if [[ "$CANONICAL_SCREEN_DIR" == /tmp/brainstorm-* ]]; then
    rm -rf "$CANONICAL_SCREEN_DIR"
  fi

  if [[ -n "$command" ]]; then
    echo '{"status": "stopped"}'
  else
    echo '{"status": "not_running"}'
  fi
else
  echo '{"status": "not_running"}'
fi
