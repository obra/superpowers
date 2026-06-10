#!/usr/bin/env bash
# Stop the brainstorm server and clean up
# Usage: stop-server.sh <session_dir>
#
# Kills the server process. Only deletes session directory if it's
# under /tmp (ephemeral). Persistent directories (.superpowers/) are
# kept so mockups can be reviewed later.

SESSION_DIR="$1"

if [[ -z "$SESSION_DIR" ]]; then
  echo '{"error": "Usage: stop-server.sh <session_dir>"}'
  exit 1
fi

STATE_DIR="${SESSION_DIR}/state"
PID_FILE="${STATE_DIR}/server.pid"

# Confirm a PID is actually our brainstorm server (node running server.cjs),
# not a reused/unrelated process whose PID was recycled into a stale pid file.
is_brainstorm_server() {
  kill -0 "$1" 2>/dev/null || return 1
  case "$(ps -p "$1" -o command= 2>/dev/null)" in
    *node*server.cjs*) ;;
    *) return 1 ;;
  esac
  # Stronger check: if we recorded the bound port and lsof is available, require
  # the PID to be the process actually LISTENING on this session's port. This
  # rules out an unrelated `node ... server.cjs` (another project, an editor task
  # runner, a different session) that happened to recycle the stale PID.
  local info="${STATE_DIR}/server-info"
  if [[ -f "$info" ]] && command -v lsof >/dev/null 2>&1; then
    local port
    port=$(sed -n 's/.*"port":\([0-9][0-9]*\).*/\1/p' "$info" | head -1)
    if [[ -n "$port" ]]; then
      [[ "$(lsof -nP -iTCP:"$port" -sTCP:LISTEN -t 2>/dev/null | head -1)" == "$1" ]] || return 1
    fi
  fi
  return 0
}

if [[ -f "$PID_FILE" ]]; then
  pid=$(cat "$PID_FILE")

  # Refuse to signal a PID we can't prove is our server. A stale pid file may
  # point at an unrelated process after a reboot/PID wraparound.
  if ! is_brainstorm_server "$pid"; then
    rm -f "$PID_FILE"
    echo '{"status": "stale_pid"}'
    exit 0
  fi

  # Try to stop gracefully, fallback to force if still alive
  kill "$pid" 2>/dev/null || true

  # Wait for graceful shutdown (up to ~2s)
  for i in {1..20}; do
    if ! kill -0 "$pid" 2>/dev/null; then
      break
    fi
    sleep 0.1
  done

  # If still running, escalate to SIGKILL
  if kill -0 "$pid" 2>/dev/null; then
    kill -9 "$pid" 2>/dev/null || true

    # Give SIGKILL a moment to take effect
    sleep 0.1
  fi

  if kill -0 "$pid" 2>/dev/null; then
    echo '{"status": "failed", "error": "process still running"}'
    exit 1
  fi

  rm -f "$PID_FILE" "${STATE_DIR}/server.log"

  # Only delete ephemeral /tmp directories
  if [[ "$SESSION_DIR" == /tmp/* ]]; then
    rm -rf "$SESSION_DIR"
  fi

  echo '{"status": "stopped"}'
else
  echo '{"status": "not_running"}'
fi
