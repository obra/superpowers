#!/bin/bash
# Test with haiku model and user's {{AGENTS_MD}}
# This tests whether a cheaper/faster model fails more easily

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PLUGIN_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"

TIMESTAMP=$(date +%s)
OUTPUT_DIR="/tmp/superpowers-tests/${TIMESTAMP}/explicit-skill-requests/haiku"
mkdir -p "$OUTPUT_DIR"

PROJECT_DIR="$OUTPUT_DIR/project"
mkdir -p "$PROJECT_DIR/docs/plans"
mkdir -p "$PROJECT_DIR/.{{AGENT_ID}}"

echo "=== Haiku Model Test with User {{AGENTS_MD}} ==="
echo "Output dir: $OUTPUT_DIR"
echo "Plugin dir: $PLUGIN_DIR"
echo ""

cd "$PROJECT_DIR"

# Copy user's {{AGENTS_MD}} to simulate real environment
if [ -f "{{AGENT_HOME_ENV}}/{{AGENTS_MD}}" ]; then
    cp "{{AGENT_HOME_ENV}}/{{AGENTS_MD}}" "$PROJECT_DIR/.{{AGENT_ID}}/{{AGENTS_MD}}"
    echo "Copied user {{AGENTS_MD}}"
else
    echo "No user {{AGENTS_MD}} found, proceeding without"
fi

# Create a dummy plan file
cat > "$PROJECT_DIR/docs/plans/auth-system.md" << 'EOF'
# Auth System Implementation Plan

## Task 1: Add User Model
Create user model with email and password fields.

## Task 2: Add Auth Routes
Create login and register endpoints.

## Task 3: Add JWT Middleware
Protect routes with JWT validation.

## Task 4: Write Tests
Add comprehensive test coverage.
EOF

echo ""

# Turn 1: Start brainstorming
echo ">>> Turn 1: Brainstorming request..."
{{CLI_CMD}} -p "I want to add user authentication to my app. Help me think through this." \
    --model haiku \
    --plugin-dir "$PLUGIN_DIR" \
    --dangerously-skip-permissions \
    --max-turns 3 \
    --output-format stream-json \
    > "$OUTPUT_DIR/turn1.json" 2>&1 || true
echo "Done."

# Turn 2: Answer questions
echo ">>> Turn 2: Answering questions..."
{{CLI_CMD}} -p "Let's use JWT tokens with 24-hour expiry. Email/password registration." \
    --continue \
    --model haiku \
    --plugin-dir "$PLUGIN_DIR" \
    --dangerously-skip-permissions \
    --max-turns 3 \
    --output-format stream-json \
    > "$OUTPUT_DIR/turn2.json" 2>&1 || true
echo "Done."

# Turn 3: Ask to write a plan
echo ">>> Turn 3: Requesting plan..."
{{CLI_CMD}} -p "Great, write this up as an implementation plan." \
    --continue \
    --model haiku \
    --plugin-dir "$PLUGIN_DIR" \
    --dangerously-skip-permissions \
    --max-turns 3 \
    --output-format stream-json \
    > "$OUTPUT_DIR/turn3.json" 2>&1 || true
echo "Done."

# Turn 4: Confirm plan looks good
echo ">>> Turn 4: Confirming plan..."
{{CLI_CMD}} -p "The plan looks good. What are my options for executing it?" \
    --continue \
    --model haiku \
    --plugin-dir "$PLUGIN_DIR" \
    --dangerously-skip-permissions \
    --max-turns 2 \
    --output-format stream-json \
    > "$OUTPUT_DIR/turn4.json" 2>&1 || true
echo "Done."

# Turn 5: THE CRITICAL TEST
echo ">>> Turn 5: Requesting subagent-driven-development..."
FINAL_LOG="$OUTPUT_DIR/turn5.json"
{{CLI_CMD}} -p "subagent-driven-development, please" \
    --continue \
    --model haiku \
    --plugin-dir "$PLUGIN_DIR" \
    --dangerously-skip-permissions \
    --max-turns 2 \
    --output-format stream-json \
    > "$FINAL_LOG" 2>&1 || true
echo "Done."
echo ""

echo "=== Results (Haiku) ==="

# Check final turn
SKILL_PATTERN='"skill":"([^"]*:)?subagent-driven-development"'
if grep -q '"name":"Skill"' "$FINAL_LOG" && grep -qE "$SKILL_PATTERN" "$FINAL_LOG"; then
    echo "PASS: Skill was triggered"
    TRIGGERED=true
else
    echo "FAIL: Skill was NOT triggered"
    TRIGGERED=false

    echo ""
    echo "Tools invoked in final turn:"
    grep '"type":"tool_use"' "$FINAL_LOG" | grep -o '"name":"[^"]*"' | head -10 || echo "  (none)"
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
