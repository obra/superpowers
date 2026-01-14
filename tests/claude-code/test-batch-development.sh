#!/bin/bash

# Test: batch-development skill verification
# Fast test - verifies skill content and structure

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/test-helpers.sh"

echo "=== Testing batch-development skill ==="

# Test 1: Skill file exists
echo "Test 1: Skill file exists..."
SKILL_FILE="$SCRIPT_DIR/../../skills/batch-development/SKILL.md"
if [[ ! -f "$SKILL_FILE" ]]; then
    echo "FAIL: Skill file not found at $SKILL_FILE"
    exit 1
fi
echo "PASS: Skill file exists"

# Test 2: YAML frontmatter correct
echo "Test 2: YAML frontmatter..."
if ! grep -q "^name: batch-development$" "$SKILL_FILE"; then
    echo "FAIL: Missing or incorrect name in frontmatter"
    exit 1
fi
if ! grep -q "^description: Use when" "$SKILL_FILE"; then
    echo "FAIL: Description doesn't start with 'Use when'"
    exit 1
fi
echo "PASS: YAML frontmatter correct"

# Test 3: Required gates present
echo "Test 3: Required gates..."
assert_contains "$(cat "$SKILL_FILE")" "COMPULSORY: Batch Completion Gate" "Batch Completion Gate"
assert_contains "$(cat "$SKILL_FILE")" "COMPULSORY: Human Checkpoint" "Human Checkpoint Gate"
assert_contains "$(cat "$SKILL_FILE")" "MANDATORY CHECKPOINT: Pre-Execution Setup" "Pre-Execution Setup"
echo "PASS: Required gates present"

# Test 4: STOP CONDITIONS present
echo "Test 4: STOP CONDITIONS..."
STOP_COUNT=$(grep -c "STOP CONDITION:" "$SKILL_FILE" || true)
if [[ "$STOP_COUNT" -lt 3 ]]; then
    echo "FAIL: Expected at least 3 STOP CONDITIONS, found $STOP_COUNT"
    exit 1
fi
echo "PASS: STOP CONDITIONS present ($STOP_COUNT found)"

# Test 5: Red Flags table present
echo "Test 5: Red Flags table..."
assert_contains "$(cat "$SKILL_FILE")" "Red Flags" "Red Flags section"
assert_contains "$(cat "$SKILL_FILE")" "| Violation |" "Red Flags table header"
echo "PASS: Red Flags table present"

# Test 6: Integration section present
echo "Test 6: Integration section..."
assert_contains "$(cat "$SKILL_FILE")" "verification-before-completion" "verification skill reference"
assert_contains "$(cat "$SKILL_FILE")" "finishing-a-development-branch" "finishing skill reference"
echo "PASS: Integration section present"

# Test 7: No subagent prompts (human is reviewer)
echo "Test 7: No subagent prompt files..."
PROMPT_COUNT=$(find "$SCRIPT_DIR/../../skills/batch-development" -name "*-prompt.md" | wc -l | tr -d ' ')
if [[ "$PROMPT_COUNT" -gt 0 ]]; then
    echo "FAIL: Found $PROMPT_COUNT prompt files - batch-development should have none"
    exit 1
fi
echo "PASS: No subagent prompt files"

echo ""
echo "=== All batch-development tests passed ==="
