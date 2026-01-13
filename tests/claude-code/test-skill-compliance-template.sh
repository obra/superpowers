#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/test-helpers.sh"

SKILL_NAME="$1"
SCENARIO_FILE="$SCRIPT_DIR/skills/$SKILL_NAME/scenario.md"
CHECKLIST_FILE="$SCRIPT_DIR/skills/$SKILL_NAME/checklist.md"
SKIPPING_FILE="$SCRIPT_DIR/skills/$SKILL_NAME/skipping-signs.md"
BASELINE_FILE="$SCRIPT_DIR/skills/$SKILL_NAME/baseline-capture.md"

echo "=== Compliance Test: $SKILL_NAME ==="

# Step 1: Run scenario
echo "Running scenario..."
scenario=$(cat "$SCENARIO_FILE")
session_output=$(run_claude "$scenario" 300)

# Step 2: Prepare reviewer prompt
checklist=$(cat "$CHECKLIST_FILE")
skipping_signs=$(cat "$SKIPPING_FILE")
baseline=$(cat "$BASELINE_FILE")

reviewer_prompt=$(cat "$SCRIPT_DIR/reviewer-prompt-template.md")
reviewer_prompt="${reviewer_prompt//\{SESSION_OUTPUT\}/$session_output}"
reviewer_prompt="${reviewer_prompt//\{CHECKLIST\}/$checklist}"
reviewer_prompt="${reviewer_prompt//\{SKIPPING_SIGNS\}/$skipping_signs}"
reviewer_prompt="${reviewer_prompt//\{SKILL_NAME\}/$SKILL_NAME}"

# Step 3: Dispatch reviewer agent
echo "Dispatching reviewer agent..."
verdict=$(run_claude "$reviewer_prompt" 120)

# Step 4: Check verdict
if echo "$verdict" | grep -q '"verdict": "PASS"'; then
    echo "✓ $SKILL_NAME: PASS"
    exit 0
else
    echo "✗ $SKILL_NAME: FAIL"
    echo "$verdict"
    exit 1
fi
