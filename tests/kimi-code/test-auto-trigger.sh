#!/usr/bin/env bash
# Integration test: Verify that Kimi Code auto-triggers the brainstorming skill
# when given a creative work prompt.
#
# This test runs Kimi in print mode with a prompt that should trigger brainstorming,
# then checks that the response exhibits Socratic questioning (not jumping to code).
#
# NOTE: This test requires Kimi Code to be installed and configured.
# It will skip gracefully if kimi is not available.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

TIMESTAMP=$(date +%s)
OUTPUT_DIR="/tmp/superpowers-tests/${TIMESTAMP}/kimi-auto-trigger"
mkdir -p "$OUTPUT_DIR"

echo "=== Kimi Auto-Trigger Test ==="
echo ""

# Check if kimi is available
if ! command -v kimi &> /dev/null; then
    echo "[SKIP] Kimi Code CLI not found in PATH"
    echo "To run this test, install Kimi Code: https://www.moonshot.cn/kimi"
    exit 0
fi

# Verify skills are installed
SKILLS_DIR="${HOME}/.config/agents/skills"
if [ ! -d "$SKILLS_DIR/brainstorming" ]; then
    echo "[SKIP] Superpowers skills not found in ~/.config/agents/skills/"
    echo "Run the install script first: ${REPO_ROOT}/.kimi/install.sh"
    exit 0
fi

# Verify SessionStart hook is configured
CONFIG_FILE="${HOME}/.kimi/config.toml"
if [ ! -f "$CONFIG_FILE" ] || ! grep -q 'event = "SessionStart"' "$CONFIG_FILE" 2>/dev/null; then
    echo "[SKIP] SessionStart hook not configured in ~/.kimi/config.toml"
    echo "Run the install script first: ${REPO_ROOT}/.kimi/install.sh"
    exit 0
fi

PROMPT="I want to build a new caching layer for my API. Can you help me design it?"
LOG_FILE="$OUTPUT_DIR/kimi-output.txt"

echo "Prompt: $PROMPT"
echo "Running Kimi Code (print mode, max 120s)..."
echo ""

# Run Kimi in print mode with the prompt
# Use timeout to prevent hanging
timeout 120s kimi --print --prompt "$PROMPT" > "$LOG_FILE" 2>&1 || {
    exit_code=$?
    if [ $exit_code -eq 124 ]; then
        echo "[FAIL] Kimi timed out after 120s"
        exit 1
    fi
    echo "[WARN] Kimi returned non-zero exit code: $exit_code"
}

# Save prompt for reference
echo "$PROMPT" > "$OUTPUT_DIR/prompt.txt"

echo "=== Results ==="
echo ""

# Check for brainstorming indicators
# A properly triggered brainstorming skill should ask questions, not jump to code

INDICATORS=0

# Indicator 1: Contains questions (Socratic gate)
QUESTION_COUNT=$(grep -c '\?' "$LOG_FILE" || true)
if [ "$QUESTION_COUNT" -ge 2 ]; then
    echo "✅ Questions detected ($QUESTION_COUNT) — Socratic gate active"
    ((INDICATORS++))
else
    echo "❌ Few/no questions detected — skill may not have triggered"
fi

# Indicator 2: Mentions design/brainstorm/planning
if grep -qiE "brainstorm|design|plan|questions|clarify" "$LOG_FILE"; then
    echo "✅ Design/planning language detected"
    ((INDICATORS++))
else
    echo "❌ No design/planning language detected"
fi

# Indicator 3: Does NOT contain code blocks immediately
# (brainstorming should not write code until design is approved)
CODE_BLOCK_COUNT=$(grep -c '```' "$LOG_FILE" || true)
if [ "$CODE_BLOCK_COUNT" -eq 0 ]; then
    echo "✅ No code blocks in first response — did not jump to implementation"
    ((INDICATORS++))
else
    echo "⚠️  Code blocks detected ($CODE_BLOCK_COUNT) — may have skipped brainstorming"
fi

echo ""
echo "Indicator score: $INDICATORS/3"
echo ""
echo "First response (truncated to 800 chars):"
head -c 800 "$LOG_FILE"
echo ""
echo ""
echo "Full log: $LOG_FILE"

if [ "$INDICATORS" -ge 2 ]; then
    echo ""
    echo "=== PASS: Brainstorming skill likely triggered ==="
    exit 0
else
    echo ""
    echo "=== FAIL: Brainstorming skill did not trigger reliably ==="
    echo "The model may need stronger encouragement to auto-read skills."
    echo "Check that the SessionStart hook is injecting the bootstrap correctly."
    exit 1
fi
