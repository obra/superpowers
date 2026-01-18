#!/bin/bash
# Wait for a browser event from the brainstorm server
# Usage: wait-for-event.sh <output-file> [event-type]
#
# Blocks until a matching event arrives, then prints it and exits.
# Default event type: "send-to-claude"

OUTPUT_FILE="${1:?Usage: wait-for-event.sh <output-file> [event-type]}"
EVENT_TYPE="${2:-send-to-claude}"

if [[ ! -f "$OUTPUT_FILE" ]]; then
  echo "Error: Output file not found: $OUTPUT_FILE" >&2
  exit 1
fi

# Wait for new lines matching the event type
# -n 0: start at end (only new content)
# -f: follow
# grep -m 1: exit after first match
tail -n 0 -f "$OUTPUT_FILE" | grep -m 1 "$EVENT_TYPE"
