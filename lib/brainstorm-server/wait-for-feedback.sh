#!/bin/bash
# Wait for user feedback from the brainstorm browser
# Usage: wait-for-feedback.sh <screen_dir>
#
# Blocks until user sends feedback, then outputs the JSON.
# Write HTML to screen_file BEFORE calling this.

SCREEN_DIR="${1:?Usage: wait-for-feedback.sh <screen_dir>}"
LOG_FILE="${SCREEN_DIR}/.server.log"

if [[ ! -d "$SCREEN_DIR" ]]; then
  echo '{"error": "Screen directory not found"}' >&2
  exit 1
fi

# Record current position in log file
LOG_POS=$(wc -l < "$LOG_FILE" 2>/dev/null || echo 0)

# Poll for new lines containing the event
while true; do
  RESULT=$(tail -n +$((LOG_POS + 1)) "$LOG_FILE" 2>/dev/null | grep -m 1 "send-to-claude")
  if [[ -n "$RESULT" ]]; then
    echo "$RESULT"
    exit 0
  fi
  sleep 0.2
done
