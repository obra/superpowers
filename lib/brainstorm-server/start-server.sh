#!/bin/bash
# Start the brainstorm server and output connection info
# Usage: start-server.sh
#
# Starts server on a random high port, outputs JSON with URL
# Server runs in background, PID saved for cleanup

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SCREEN_DIR="${BRAINSTORM_SCREEN_DIR:-/tmp/brainstorm}"
SCREEN_FILE="${SCREEN_DIR}/screen.html"
PID_FILE="${SCREEN_DIR}/.server.pid"
LOG_FILE="${SCREEN_DIR}/.server.log"

# Ensure screen directory exists
mkdir -p "$SCREEN_DIR"

# Kill any existing server
if [[ -f "$PID_FILE" ]]; then
  old_pid=$(cat "$PID_FILE")
  kill "$old_pid" 2>/dev/null
  rm -f "$PID_FILE"
fi

# Start server, capturing output to log file
cd "$SCRIPT_DIR"
node index.js > "$LOG_FILE" 2>&1 &
SERVER_PID=$!
echo "$SERVER_PID" > "$PID_FILE"

# Wait for server-started message (check log file)
for i in {1..50}; do
  if grep -q "server-started" "$LOG_FILE" 2>/dev/null; then
    # Extract and output the server-started line
    grep "server-started" "$LOG_FILE" | head -1
    exit 0
  fi
  sleep 0.1
done

# Timeout - server didn't start
echo '{"error": "Server failed to start within 5 seconds"}'
exit 1
