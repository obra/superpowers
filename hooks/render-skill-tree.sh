#!/usr/bin/env bash
# Renders session skill events as ASCII call tree
# Called by Stop hook to display session summary

set -euo pipefail

# Read hook input to get session ID
HOOK_INPUT=$(cat)
SESSION_ID=$(echo "$HOOK_INPUT" | jq -r '.session.id // ""' 2>/dev/null || echo "")

ANALYTICS_FILE="${HOME}/.claude/superpowers-analytics/events.jsonl"

# Exit silently if no analytics file or no session
if [[ ! -f "$ANALYTICS_FILE" || -z "$SESSION_ID" ]]; then
  exit 0
fi

# Get events for this session, sorted by sequence
EVENTS=$(jq -s --arg sid "$SESSION_ID" '
  [.[] | select(.session == $sid)] | sort_by(.seq)
' "$ANALYTICS_FILE" 2>/dev/null || echo "[]")

EVENT_COUNT=$(echo "$EVENTS" | jq 'length' 2>/dev/null || echo "0")

# Exit silently if no events for this session
if [[ "$EVENT_COUNT" -eq 0 || "$EVENT_COUNT" == "0" ]]; then
  exit 0
fi

# Print header
echo ""
echo "╭──────────────────────────────────────────────────╮"
echo "│             Session Skill Tree                   │"
echo "╰──────────────────────────────────────────────────╯"
echo ""

# Render each event as tree structure
PREV_TYPE=""
echo "$EVENTS" | jq -r '.[] | "\(.ts[11:19])|\(.type)|\(.skill)"' 2>/dev/null | while IFS='|' read -r TIME TYPE SKILL; do
  if [[ "$TYPE" == "skill" ]]; then
    echo "$TIME ─── $SKILL"
  else
    echo "             └── [$TYPE] $SKILL"
  fi
done

# Calculate summary statistics
SKILL_COUNT=$(echo "$EVENTS" | jq '[.[] | select(.type == "skill")] | length' 2>/dev/null || echo "0")
SUBAGENT_COUNT=$(echo "$EVENTS" | jq '[.[] | select(.type == "subagent")] | length' 2>/dev/null || echo "0")

# Calculate duration if we have timestamps
FIRST_TS=$(echo "$EVENTS" | jq -r '.[0].ts // ""' 2>/dev/null || echo "")
LAST_TS=$(echo "$EVENTS" | jq -r '.[-1].ts // ""' 2>/dev/null || echo "")

DURATION=""
if [[ -n "$FIRST_TS" && -n "$LAST_TS" ]]; then
  # Try to calculate duration using date
  if command -v gdate &>/dev/null; then
    # macOS with coreutils
    START_EPOCH=$(gdate -d "$FIRST_TS" +%s 2>/dev/null || echo "0")
    END_EPOCH=$(gdate -d "$LAST_TS" +%s 2>/dev/null || echo "0")
  else
    # Linux
    START_EPOCH=$(date -d "$FIRST_TS" +%s 2>/dev/null || echo "0")
    END_EPOCH=$(date -d "$LAST_TS" +%s 2>/dev/null || echo "0")
  fi

  if [[ "$START_EPOCH" != "0" && "$END_EPOCH" != "0" ]]; then
    DURATION_SECS=$((END_EPOCH - START_EPOCH))
    if [[ $DURATION_SECS -lt 60 ]]; then
      DURATION="${DURATION_SECS}s"
    elif [[ $DURATION_SECS -lt 3600 ]]; then
      MINS=$((DURATION_SECS / 60))
      SECS=$((DURATION_SECS % 60))
      DURATION="${MINS}m ${SECS}s"
    else
      HOURS=$((DURATION_SECS / 3600))
      MINS=$(((DURATION_SECS % 3600) / 60))
      DURATION="${HOURS}h ${MINS}m"
    fi
  fi
fi

# Print summary
echo ""
echo "───────────────────────────────────────────────────"
if [[ -n "$DURATION" ]]; then
  echo "Summary: $SKILL_COUNT skills │ $SUBAGENT_COUNT subagents │ $DURATION"
else
  echo "Summary: $SKILL_COUNT skills │ $SUBAGENT_COUNT subagents"
fi
echo "───────────────────────────────────────────────────"

# Clean up session sequence file
SEQ_FILE="${HOME}/.claude/superpowers-analytics/.seq-${SESSION_ID}"
rm -f "$SEQ_FILE" 2>/dev/null || true

exit 0
