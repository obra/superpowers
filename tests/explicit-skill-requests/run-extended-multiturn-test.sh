#!/bin/bash
# Extended multi-turn test with more conversation history
# This tries to reproduce the failure by building more context

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PLUGIN_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"

TIMESTAMP=$(date +%s)
OUTPUT_DIR="/tmp/superpowers-tests/${TIMESTAMP}/explicit-skill-requests/extended-multiturn"
mkdir -p "$OUTPUT_DIR"

PROJECT_DIR="$OUTPUT_DIR/project"
mkdir -p "$PROJECT_DIR/docs/plans"

echo "=== Extended Multi-Turn Test ==="
echo "Output dir: $OUTPUT_DIR"
echo "Plugin dir: $PLUGIN_DIR"
echo ""

cd "$PROJECT_DIR"

# Turn 1: Start brainstorming
echo ">>> Turn 1: Brainstorming request..."
claude -p "I want to add user authentication to my app. Help me think through this." \
    --plugin-dir "$PLUGIN_DIR" \
    --dangerously-skip-permissions \
    --max-turns 3 \
    --output-format stream-json \
    > "$OUTPUT_DIR/turn1.json" 2>&1 || true
echo "Done."

# Turn 2: Answer a brainstorming question
echo ">>> Turn 2: Answering questions..."
claude -p "Let's use JWT tokens with 24-hour expiry. Email/password registration." \
    --continue \
    --plugin-dir "$PLUGIN_DIR" \
    --dangerously-skip-permissions \
    --max-turns 3 \
    --output-format stream-json \
    > "$OUTPUT_DIR/turn2.json" 2>&1 || true
echo "Done."

# Turn 3: Ask to write a plan
echo ">>> Turn 3: Requesting plan..."
claude -p "Great, write this up as an implementation plan." \
    --continue \
    --plugin-dir "$PLUGIN_DIR" \
    --dangerously-skip-permissions \
    --max-turns 3 \
    --output-format stream-json \
    > "$OUTPUT_DIR/turn3.json" 2>&1 || true
echo "Done."

# Turn 4: Confirm plan looks good
echo ">>> Turn 4: Confirming plan..."
claude -p "The plan looks good. What are my options for executing it?" \
    --continue \
    --plugin-dir "$PLUGIN_DIR" \
    --dangerously-skip-permissions \
    --max-turns 2 \
    --output-format stream-json \
    > "$OUTPUT_DIR/turn4.json" 2>&1 || true
echo "Done."

# Turn 5: THE CRITICAL TEST
echo ">>> Turn 5: Requesting subagent-driven-development..."
FINAL_LOG="$OUTPUT_DIR/turn5.json"
claude -p "subagent-driven-development, please" \
    --continue \
    --plugin-dir "$PLUGIN_DIR" \
    --dangerously-skip-permissions \
    --max-turns 2 \
    --output-format stream-json \
    > "$FINAL_LOG" 2>&1 || true
echo "Done."
echo ""

echo "=== Results ==="

# Check final turn
SKILL_PATTERN='"skill":"([^"]*:)?subagent-driven-development"'
if grep -q '"name":"Skill"' "$FINAL_LOG" && grep -qE "$SKILL_PATTERN" "$FINAL_LOG"; then
    echo "PASS: Skill was triggered"
    TRIGGERED=true
else
    echo "FAIL: Skill was NOT triggered"
    TRIGGERED=false

    # Show what was invoked instead
    echo ""
    echo "Tools invoked in final turn:"
    grep '"type":"tool_use"' "$FINAL_LOG" | jq -r '.content[] | select(.type=="tool_use") | .name' 2>/dev/null | head -10 || \
    grep -o '"name":"[^"]*"' "$FINAL_LOG" | head -10 || echo "  (none found)"
fi

echo ""
echo "Skills triggered:"
grep -o '"skill":"[^"]*"' "$FINAL_LOG" 2>/dev/null | sort -u || echo "  (none)"

echo ""
echo "Final turn response (first 500 chars):"
grep '"type":"assistant"' "$FINAL_LOG" | head -1 | jq -r '.message.content[0].text // .message.content' 2>/dev/null | head -c 500 || echo "  (could not extract)"

echo ""
echo "Logs in: $OUTPUT_DIR"

if [ "$TRIGGERED" = "true" ]; then
    exit 0
else
    exit 1
fi
