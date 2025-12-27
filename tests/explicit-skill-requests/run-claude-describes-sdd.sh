#!/bin/bash
# Test where Claude explicitly describes subagent-driven-development before user requests it
# This mimics the original failure scenario

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PLUGIN_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"

TIMESTAMP=$(date +%s)
OUTPUT_DIR="/tmp/superpowers-tests/${TIMESTAMP}/explicit-skill-requests/claude-describes"
mkdir -p "$OUTPUT_DIR"

PROJECT_DIR="$OUTPUT_DIR/project"
mkdir -p "$PROJECT_DIR/docs/plans"

echo "=== Test: Claude Describes SDD First ==="
echo "Output dir: $OUTPUT_DIR"
echo ""

cd "$PROJECT_DIR"

# Create a plan
cat > "$PROJECT_DIR/docs/plans/auth-system.md" << 'EOF'
# Auth System Implementation Plan

## Task 1: Add User Model
Create user model with email and password fields.

## Task 2: Add Auth Routes
Create login and register endpoints.

## Task 3: Add JWT Middleware
Protect routes with JWT validation.
EOF

# Turn 1: Have Claude describe execution options including SDD
echo ">>> Turn 1: Ask Claude to describe execution options..."
claude -p "I have a plan at docs/plans/auth-system.md. Tell me about my options for executing it, including what subagent-driven-development means and how it works." \
    --model haiku \
    --plugin-dir "$PLUGIN_DIR" \
    --dangerously-skip-permissions \
    --max-turns 3 \
    --output-format stream-json \
    > "$OUTPUT_DIR/turn1.json" 2>&1 || true
echo "Done."

# Turn 2: THE CRITICAL TEST - now that Claude has explained it
echo ">>> Turn 2: Request subagent-driven-development..."
FINAL_LOG="$OUTPUT_DIR/turn2.json"
claude -p "subagent-driven-development, please" \
    --continue \
    --model haiku \
    --plugin-dir "$PLUGIN_DIR" \
    --dangerously-skip-permissions \
    --max-turns 2 \
    --output-format stream-json \
    > "$FINAL_LOG" 2>&1 || true
echo "Done."
echo ""

echo "=== Results ==="

# Check Turn 1 to see if Claude described SDD
echo "Turn 1 - Claude's description of options (excerpt):"
grep '"type":"assistant"' "$OUTPUT_DIR/turn1.json" | head -1 | jq -r '.message.content[0].text // .message.content' 2>/dev/null | head -c 800 || echo "  (could not extract)"
echo ""
echo "---"
echo ""

# Check final turn
SKILL_PATTERN='"skill":"([^"]*:)?subagent-driven-development"'
if grep -q '"name":"Skill"' "$FINAL_LOG" && grep -qE "$SKILL_PATTERN" "$FINAL_LOG"; then
    echo "PASS: Skill was triggered after Claude described it"
    TRIGGERED=true
else
    echo "FAIL: Skill was NOT triggered (Claude may have thought it already knew)"
    TRIGGERED=false

    echo ""
    echo "Tools invoked in final turn:"
    grep '"type":"tool_use"' "$FINAL_LOG" | grep -o '"name":"[^"]*"' | sort -u | head -10 || echo "  (none)"

    echo ""
    echo "Final turn response:"
    grep '"type":"assistant"' "$FINAL_LOG" | head -1 | jq -r '.message.content[0].text // .message.content' 2>/dev/null | head -c 800 || echo "  (could not extract)"
fi

echo ""
echo "Skills triggered in final turn:"
grep -o '"skill":"[^"]*"' "$FINAL_LOG" 2>/dev/null | sort -u || echo "  (none)"

echo ""
echo "Logs in: $OUTPUT_DIR"

if [ "$TRIGGERED" = "true" ]; then
    exit 0
else
    exit 1
fi
