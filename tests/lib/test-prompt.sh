#!/usr/bin/env bash
# Run a single explicit skill request test.
# Usage: test-prompt.sh <skill-name> <prompt-file> [max-turns]

set -euo pipefail

SKILL_NAME="${1:-}"
PROMPT_FILE="${2:-}"
MAX_TURNS="${3:-3}"

if [ -z "$SKILL_NAME" ] || [ -z "$PROMPT_FILE" ]; then
    echo "Usage: $0 <skill-name> <prompt-file> [max-turns]"
    echo "Example: $0 subagent-driven-development ./prompts/subagent-driven-development-please.txt"
    exit 1
fi

LIB_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=common.sh
source "$LIB_DIR/common.sh"
# shellcheck source=assertions.sh
source "$LIB_DIR/assertions.sh"
# shellcheck source=run-claude.sh
source "$LIB_DIR/run-claude.sh"

init_test_run "explicit-skill-requests" "$SKILL_NAME"
create_auth_system_plan_short
copy_prompt_for_reference "$PROMPT_FILE"

PROMPT=$(cat "$PROMPT_FILE")

echo "=== Explicit Skill Request Test ==="
echo "Skill: $SKILL_NAME"
echo "Prompt file: $PROMPT_FILE"
echo "Max turns: $MAX_TURNS"
echo "Output dir: $OUTPUT_DIR"
echo "Plugin dir: $PLUGIN_ROOT"
echo ""
echo "Running claude -p with explicit skill request..."
echo "Prompt: $PROMPT"
echo ""

run_claude_stream_json "$LOG_FILE" "$PROMPT" "$MAX_TURNS"

echo ""
echo "=== Results ==="

TRIGGERED=false
if assert_skill_triggered "$LOG_FILE" "$SKILL_NAME"; then
    TRIGGERED=true
fi

print_skill_trigger_summary "$LOG_FILE"
assert_no_premature_tools "$LOG_FILE"
show_first_assistant_message "$LOG_FILE"

echo ""
echo "Full log: $LOG_FILE"
echo "Timestamp: $TIMESTAMP"

if [ "$TRIGGERED" = true ]; then
    exit 0
fi

exit 1
