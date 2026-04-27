#!/usr/bin/env bash
# sspower cmd-rewrite hook — version 1
# Rewrites Bash commands through an external rewriter for token savings.
#
# Pluggable rewriter: set CMD_REWRITER env var to override the binary
# (default: rtk). The binary must implement the `<bin> rewrite <cmd>`
# protocol with these exit codes:
#   0 + stdout  Rewrite found, no deny/ask rule matched → auto-allow
#   1           No equivalent → pass through unchanged
#   2           Deny rule matched → pass through (Claude Code native deny handles it)
#   3 + stdout  Ask rule matched → rewrite but let Claude Code prompt the user
#
# Requires: <rewriter binary> >= 0.23.0, jq.

REWRITER="${CMD_REWRITER:-rtk}"

if ! command -v jq &>/dev/null; then
  echo "[cmd-rewrite] WARNING: jq is not installed. Hook cannot rewrite commands. Install jq: https://jqlang.github.io/jq/download/" >&2
  exit 0
fi

if ! command -v "$REWRITER" &>/dev/null; then
  echo "[cmd-rewrite] WARNING: rewriter '$REWRITER' is not installed or not in PATH. Hook is a no-op." >&2
  exit 0
fi

# NOTE: version guard removed — was a per-Bash-call subprocess. If the
# rewriter is too old, `rewrite` will exit non-0 below and we fall through.

INPUT=$(cat)
CMD=$(echo "$INPUT" | jq -r '.tool_input.command // empty')

if [ -z "$CMD" ]; then
  exit 0
fi

REWRITTEN=$("$REWRITER" rewrite "$CMD" 2>/dev/null)
EXIT_CODE=$?

case $EXIT_CODE in
  0)
    # Rewrite found, no permission rules matched — safe to auto-allow.
    # If output is identical, the command already used the rewriter.
    [ "$CMD" = "$REWRITTEN" ] && exit 0
    ;;
  1)
    # No rewrite equivalent — pass through unchanged.
    exit 0
    ;;
  2)
    # Deny rule matched — let Claude Code's native deny rule handle it.
    exit 0
    ;;
  3)
    # Ask rule matched — rewrite but don't auto-allow.
    ;;
  *)
    exit 0
    ;;
esac

ORIGINAL_INPUT=$(echo "$INPUT" | jq -c '.tool_input')
UPDATED_INPUT=$(echo "$ORIGINAL_INPUT" | jq --arg cmd "$REWRITTEN" '.command = $cmd')

if [ "$EXIT_CODE" -eq 3 ]; then
  jq -n \
    --argjson updated "$UPDATED_INPUT" \
    '{
      "hookSpecificOutput": {
        "hookEventName": "PreToolUse",
        "updatedInput": $updated
      }
    }'
else
  jq -n \
    --argjson updated "$UPDATED_INPUT" \
    '{
      "hookSpecificOutput": {
        "hookEventName": "PreToolUse",
        "permissionDecision": "allow",
        "permissionDecisionReason": "cmd-rewrite auto-allow",
        "updatedInput": $updated
      }
    }'
fi
