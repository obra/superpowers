#!/usr/bin/env bash
# Test with haiku model and user's CLAUDE.md
# Usage: ./run-haiku-test.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LIB_DIR="$SCRIPT_DIR/../lib"

# shellcheck source=../lib/common.sh
source "$LIB_DIR/common.sh"
# shellcheck source=../lib/assertions.sh
source "$LIB_DIR/assertions.sh"
# shellcheck source=../lib/run-claude.sh
source "$LIB_DIR/run-claude.sh"

init_test_run "explicit-skill-requests" "haiku"
create_auth_system_plan
mkdir -p "$PROJECT_DIR/.claude"

echo "=== Haiku Model Test with User CLAUDE.md ==="
echo "Output dir: $OUTPUT_DIR"
echo "Plugin dir: $PLUGIN_ROOT"
echo ""

if [ -f "$HOME/.claude/CLAUDE.md" ]; then
    cp "$HOME/.claude/CLAUDE.md" "$PROJECT_DIR/.claude/CLAUDE.md"
    echo "Copied user CLAUDE.md"
else
    echo "No user CLAUDE.md found, proceeding without"
fi

echo ""

TURN1_LOG="$OUTPUT_DIR/turn1.json"
TURN2_LOG="$OUTPUT_DIR/turn2.json"
TURN3_LOG="$OUTPUT_DIR/turn3.json"
TURN4_LOG="$OUTPUT_DIR/turn4.json"
FINAL_LOG="$OUTPUT_DIR/turn5.json"
HAIKU_ARGS=(--model haiku)

echo ">>> Turn 1: Brainstorming request..."
run_claude_stream_json "$TURN1_LOG" \
    "I want to add user authentication to my app. Help me think through this." \
    3 "${HAIKU_ARGS[@]}"
echo "Done."

echo ">>> Turn 2: Answering questions..."
run_claude_stream_json_continue "$TURN2_LOG" \
    "Let's use JWT tokens with 24-hour expiry. Email/password registration." \
    3 "${HAIKU_ARGS[@]}"
echo "Done."

echo ">>> Turn 3: Requesting plan..."
run_claude_stream_json_continue "$TURN3_LOG" \
    "Great, write this up as an implementation plan." \
    3 "${HAIKU_ARGS[@]}"
echo "Done."

echo ">>> Turn 4: Confirming plan..."
run_claude_stream_json_continue "$TURN4_LOG" \
    "The plan looks good. What are my options for executing it?" \
    2 "${HAIKU_ARGS[@]}"
echo "Done."

echo ">>> Turn 5: Requesting subagent-driven-development..."
run_claude_stream_json_continue "$FINAL_LOG" \
    "subagent-driven-development, please" \
    2 "${HAIKU_ARGS[@]}"
echo "Done."
echo ""

echo "=== Results ==="

TRIGGERED=false
if assert_skill_triggered "$FINAL_LOG" "subagent-driven-development"; then
    TRIGGERED=true
fi

print_skill_trigger_summary "$FINAL_LOG" "Turn 5"
assert_no_premature_tools "$FINAL_LOG" "Turn 5"
show_first_assistant_message "$FINAL_LOG" "Turn 5"

echo ""
echo "Final log: $FINAL_LOG"
echo "Timestamp: $TIMESTAMP"

if [ "$TRIGGERED" = true ]; then
    exit 0
fi

exit 1
