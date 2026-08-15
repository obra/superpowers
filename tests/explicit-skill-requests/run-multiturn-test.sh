#!/usr/bin/env bash
# Test explicit skill requests in multi-turn conversations
# Usage: ./run-multiturn-test.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LIB_DIR="$SCRIPT_DIR/../lib"

# shellcheck source=../lib/common.sh
source "$LIB_DIR/common.sh"
# shellcheck source=../lib/assertions.sh
source "$LIB_DIR/assertions.sh"
# shellcheck source=../lib/run-claude.sh
source "$LIB_DIR/run-claude.sh"

init_test_run "explicit-skill-requests" "multiturn"
create_auth_system_plan_short

TURN1_LOG="$OUTPUT_DIR/turn1.json"
TURN2_LOG="$OUTPUT_DIR/turn2.json"
TURN3_LOG="$OUTPUT_DIR/turn3.json"

echo "=== Multi-Turn Explicit Skill Request Test ==="
echo "Output dir: $OUTPUT_DIR"
echo "Project dir: $PROJECT_DIR"
echo "Plugin dir: $PLUGIN_ROOT"
echo ""

echo ">>> Turn 1: Starting planning conversation..."
run_claude_stream_json "$TURN1_LOG" \
    "I need to implement an authentication system. Let's plan this out. The requirements are: user registration with email/password, JWT tokens, and protected routes." \
    2
echo "Turn 1 complete."
echo ""

echo ">>> Turn 2: Continuing planning..."
run_claude_stream_json_continue "$TURN2_LOG" \
    "Good analysis. I've already written the plan to docs/superpowers/plans/auth-system.md. Now I'm ready to implement. What are my options for execution?" \
    2
echo "Turn 2 complete."
echo ""

echo ">>> Turn 3: Requesting subagent-driven-development..."
run_claude_stream_json_continue "$TURN3_LOG" \
    "subagent-driven-development, please" \
    2
echo "Turn 3 complete."
echo ""

echo "=== Results ==="

TRIGGERED=false
if assert_skill_triggered "$TURN3_LOG" "subagent-driven-development"; then
    TRIGGERED=true
fi

print_skill_trigger_summary "$TURN3_LOG" "Turn 3"
assert_no_premature_tools "$TURN3_LOG" "Turn 3"
show_first_assistant_message "$TURN3_LOG" "Turn 3"

echo ""
echo "Logs:"
echo "  Turn 1: $TURN1_LOG"
echo "  Turn 2: $TURN2_LOG"
echo "  Turn 3: $TURN3_LOG"
echo "Timestamp: $TIMESTAMP"

if [ "$TRIGGERED" = true ]; then
    exit 0
fi

exit 1
