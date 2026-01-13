#!/usr/bin/env bash
# Compliance test for the systematic-debugging skill
# Tests that Claude follows systematic debugging phases:
# 1. Phase 1: Root Cause Investigation - Observe error FIRST
# 2. Phase 2: Pattern Analysis - Examine code and patterns
# 3. Phase 3: Hypothesis and Testing - State hypothesis explicitly
# 4. Phase 4: Implementation - Fix root cause (not symptoms)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/test-helpers.sh"

SKILL_NAME="systematic-debugging"
SCENARIO_FILE="$SCRIPT_DIR/skills/$SKILL_NAME/scenario.md"
CHECKLIST_FILE="$SCRIPT_DIR/skills/$SKILL_NAME/checklist.md"
SKIPPING_FILE="$SCRIPT_DIR/skills/$SKILL_NAME/skipping-signs.md"
BASELINE_FILE="$SCRIPT_DIR/skills/$SKILL_NAME/baseline-capture.md"
TEST_PROJECT="/tmp/hyperpowers-test-app"

echo "=== Compliance Test: $SKILL_NAME ==="
echo ""

# Verify test project exists
if [ ! -d "$TEST_PROJECT" ]; then
    echo "[ERROR] Test project not found at $TEST_PROJECT"
    echo "Run Task 17 to create the test project first"
    exit 1
fi

# Verify required files exist
for file in "$SCENARIO_FILE" "$CHECKLIST_FILE" "$SKIPPING_FILE" "$BASELINE_FILE"; do
    if [ ! -f "$file" ]; then
        echo "[ERROR] Required file not found: $file"
        exit 1
    fi
done

echo "Test project verified at $TEST_PROJECT"
echo ""

# Step 0: Setup bug in test project
echo "Step 0: Creating bug scenario in test project..."

cd "$TEST_PROJECT"

# Ensure src directory exists
mkdir -p src

# Create the buggy utility function
cat > src/userGreeting.ts << 'EOF'
export function getUserGreeting(userId: string): string {
  const users: Record<string, { name: string; type: 'premium' | 'standard' }> = {
    '1': { name: 'Alice', type: 'premium' },
    '2': { name: 'Bob', type: 'standard' },
    '3': { name: 'Charlie', type: 'premium' }
  };

  const user = users[userId];
  if (!user) return 'Hello, Guest!';

  // BUG: condition is inverted - premium users get standard greeting
  if (user.type !== 'premium') {
    return `Welcome back, ${user.name}! Enjoy your premium benefits.`;
  }
  return `Hello, ${user.name}!`;
}
EOF

# Create the test file that will fail
cat > src/userGreeting.test.ts << 'EOF'
import { describe, it, expect } from 'vitest';
import { getUserGreeting } from './userGreeting';

describe('getUserGreeting', () => {
  it('returns premium greeting for premium users', () => {
    // Alice is a premium user
    const greeting = getUserGreeting('1');
    expect(greeting).toBe('Welcome back, Alice! Enjoy your premium benefits.');
  });

  it('returns standard greeting for standard users', () => {
    // Bob is a standard user
    const greeting = getUserGreeting('2');
    expect(greeting).toBe('Hello, Bob!');
  });

  it('returns guest greeting for unknown users', () => {
    const greeting = getUserGreeting('999');
    expect(greeting).toBe('Hello, Guest!');
  });

  it('returns premium greeting for all premium users', () => {
    // Charlie is also premium
    const greeting = getUserGreeting('3');
    expect(greeting).toBe('Welcome back, Charlie! Enjoy your premium benefits.');
  });
});
EOF

echo "Bug scenario created: inverted condition in getUserGreeting"
echo ""

# Verify the bug exists by running tests
echo "Verifying bug causes test failures..."
if npm test -- src/userGreeting.test.ts 2>&1 | grep -q "FAIL"; then
    echo "Bug verified: tests are failing as expected"
else
    echo "[WARNING] Tests might not be failing - check setup"
fi
echo ""

# Step 1: Run scenario asking Claude to fix the failing tests
echo "Step 1: Running systematic-debugging scenario..."
echo "(This will report failing tests and ask Claude to fix - may take 10-20 minutes)"
echo ""

# The prompt mimics a real debugging scenario
USER_PROMPT="Tests are failing, can you fix it?"

# Run Claude in the test project directory
# Higher max-turns needed for: observe failure + read code + hypothesize + fix + verify
SESSION_OUTPUT=$(claude -p "$USER_PROMPT" --max-turns 30 2>&1 || true)
cd "$SCRIPT_DIR"

# Debug: show session output length and preview
echo "Session output captured (${#SESSION_OUTPUT} chars)"
if [ ${#SESSION_OUTPUT} -lt 300 ]; then
    echo "[WARNING] Session output seems too short. Full output:"
    echo "$SESSION_OUTPUT"
    echo ""
fi
echo ""

# Step 2: Prepare reviewer prompt
echo "Step 2: Preparing reviewer prompt..."

CHECKLIST=$(cat "$CHECKLIST_FILE")
SKIPPING_SIGNS=$(cat "$SKIPPING_FILE")

REVIEWER_PROMPT=$(cat "$SCRIPT_DIR/reviewer-prompt-template.md")
# Use bash string replacement (handles multi-line content correctly)
REVIEWER_PROMPT="${REVIEWER_PROMPT//\{SESSION_OUTPUT\}/$SESSION_OUTPUT}"
REVIEWER_PROMPT="${REVIEWER_PROMPT//\{CHECKLIST\}/$CHECKLIST}"
REVIEWER_PROMPT="${REVIEWER_PROMPT//\{SKIPPING_SIGNS\}/$SKIPPING_SIGNS}"
REVIEWER_PROMPT="${REVIEWER_PROMPT//\{SKILL_NAME\}/$SKILL_NAME}"

echo "Reviewer prompt prepared"
echo ""

# Step 3: Dispatch reviewer agent
echo "Step 3: Dispatching reviewer agent..."
echo "(This will call Claude Haiku for review - may take 30-60 seconds)"
echo ""

VERDICT=$(claude -p "$REVIEWER_PROMPT" --model haiku --max-turns 1 2>&1 || true)

echo "Reviewer verdict received"
echo ""

# Step 4: Check verdict
echo "Step 4: Checking verdict..."
echo ""

# Extract and display key parts of the verdict
echo "--- Reviewer Analysis ---"
if echo "$VERDICT" | grep -q '"checklist_results"'; then
    echo "Checklist Results:"
    echo "$VERDICT" | grep -A 100 '"checklist_results"' | head -105
fi
echo ""

if echo "$VERDICT" | grep -q '"skipping_observations"'; then
    echo "Skipping Observations:"
    echo "$VERDICT" | grep -A 50 '"skipping_observations"' | head -55
fi
echo ""

if echo "$VERDICT" | grep -q '"baseline_comparison"'; then
    echo "Baseline Comparison:"
    echo "$VERDICT" | grep -A 3 '"baseline_comparison"' | head -5
fi
echo ""

if echo "$VERDICT" | grep -q '"reasoning"'; then
    echo "Reasoning:"
    echo "$VERDICT" | grep -A 5 '"reasoning"' | head -7
fi
echo "-------------------------"
echo ""

# Step 5: Cleanup - remove test files
echo "Step 5: Cleaning up test files..."
cd "$TEST_PROJECT"
rm -f src/userGreeting.ts src/userGreeting.test.ts 2>/dev/null || true
# Reset any uncommitted changes
git checkout -- . 2>/dev/null || true
# Reset any new commits made during test
git reset --hard HEAD~10 2>/dev/null || true
cd "$SCRIPT_DIR"
echo "Cleanup complete"
echo ""

# Determine pass/fail
if echo "$VERDICT" | grep -q '"verdict".*:.*"PASS"'; then
    echo "=== RESULT: PASS ==="
    echo ""
    echo "Systematic-debugging skill compliance verified:"
    echo "- Phase 1: Error reproduced FIRST before any code changes"
    echo "- Phase 2: Code examined and patterns analyzed"
    echo "- Phase 3: Hypothesis explicitly stated"
    echo "- Phase 4: Root cause identified and fixed"
    echo ""

    RESULT="PASS"
    exit 0
else
    echo "=== RESULT: FAIL ==="
    echo ""
    echo "Systematic-debugging skill compliance failed."
    echo ""

    # Extract specific failure reasons
    if echo "$VERDICT" | grep -q '"status".*:.*"MISSING"'; then
        echo "Missing checklist items:"
        echo "$VERDICT" | grep -B 1 '"status".*:.*"MISSING"' | grep '"item"' | head -15
    fi

    if echo "$VERDICT" | grep -q '"status".*:.*"OBSERVED"'; then
        echo "Skipping signs observed:"
        echo "$VERDICT" | grep -B 1 '"status".*:.*"OBSERVED"' | grep '"sign"' | head -15
    fi
    echo ""

    RESULT="FAIL"
    exit 1
fi
