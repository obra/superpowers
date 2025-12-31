#!/usr/bin/env bash
# Skill analytics hook - logs skill and subagent invocations to JSONL
# Usage: skill-analytics.sh [skill|subagent]

set -euo pipefail

EVENT_TYPE="${1:-skill}"  # "skill" or "subagent"

# Read hook input from stdin
HOOK_INPUT=$(cat)

# Analytics directory and files
ANALYTICS_DIR="${HOME}/.claude/superpowers-analytics"
ANALYTICS_FILE="${ANALYTICS_DIR}/events.jsonl"

mkdir -p "$ANALYTICS_DIR"

# Extract session ID from hook input
SESSION_ID=$(echo "$HOOK_INPUT" | jq -r '.session.id // "unknown"' 2>/dev/null || echo "unknown")
TIMESTAMP=$(date -u +%Y-%m-%dT%H:%M:%SZ)

# Get name based on event type
if [[ "$EVENT_TYPE" == "skill" ]]; then
  # For Skill tool, extract the skill name
  NAME=$(echo "$HOOK_INPUT" | jq -r '.tool_input.skill // "unknown"' 2>/dev/null || echo "unknown")
else
  # For Task tool (subagent), extract description or subagent_type
  NAME=$(echo "$HOOK_INPUT" | jq -r '.tool_input.description // .tool_input.subagent_type // "unknown"' 2>/dev/null || echo "unknown")
fi

# Skip if we couldn't extract a meaningful name
if [[ "$NAME" == "unknown" || "$NAME" == "null" || -z "$NAME" ]]; then
  exit 0
fi

# Sequence file per session (for ordering events within a session)
SEQ_FILE="${ANALYTICS_DIR}/.seq-${SESSION_ID}"

# Get and increment sequence number (atomic-ish for single process)
SEQ=$(cat "$SEQ_FILE" 2>/dev/null || echo "0")
SEQ=$((SEQ + 1))
echo "$SEQ" > "$SEQ_FILE"

# Build JSON event using jq for proper escaping
EVENT=$(jq -n \
  --arg ts "$TIMESTAMP" \
  --arg session "$SESSION_ID" \
  --arg skill "$NAME" \
  --arg type "$EVENT_TYPE" \
  --argjson seq "$SEQ" \
  '{ts: $ts, session: $session, skill: $skill, seq: $seq, type: $type}')

# Append to events file
echo "$EVENT" >> "$ANALYTICS_FILE"

exit 0
