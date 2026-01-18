#!/bin/bash
# Write HTML to screen and wait for user feedback
# Usage: show-and-wait.sh <screen_dir> < html_content
#
# Reads HTML from stdin, writes to screen_file, waits for feedback.
# Outputs the feedback JSON when user sends from browser.

SCREEN_DIR="${1:?Usage: show-and-wait.sh <screen_dir>}"
SCREEN_FILE="${SCREEN_DIR}/screen.html"
LOG_FILE="${SCREEN_DIR}/.server.log"

if [[ ! -d "$SCREEN_DIR" ]]; then
  echo '{"error": "Screen directory not found"}' >&2
  exit 1
fi

# Write HTML from stdin to screen file
cat > "$SCREEN_FILE"

# Record current position in log file
LOG_POS=$(wc -l < "$LOG_FILE" 2>/dev/null || echo 0)

# Poll for new lines containing the event
while true; do
  # Check for new matching lines since our starting position
  RESULT=$(tail -n +$((LOG_POS + 1)) "$LOG_FILE" 2>/dev/null | grep -m 1 "send-to-claude")
  if [[ -n "$RESULT" ]]; then
    echo "$RESULT"
    exit 0
  fi
  sleep 0.2
done
