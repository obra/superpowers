#!/usr/bin/env bash
# Compliance test for the receiving-code-review skill
# Tests that Claude:
# 1. Shows Understanding Gate (explains WHY for each change)
# 2. Shows Clarity Gate (clarifies ambiguous items FIRST)
# 3. Implements changes ONE AT A TIME (not batched)
# 4. Runs tests AFTER EACH change (not just at end)
# 5. Does NOT use performative agreement ("Great point!")

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/test-helpers.sh"

SKILL_NAME="receiving-code-review"
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

# Step 0: Create code to review
echo "Step 0: Setting up code for review feedback..."

cd "$TEST_PROJECT"

# Clean up any existing test files
rm -f src/api.ts src/api.test.ts 2>/dev/null || true

# Create the API utility with intentional issues
mkdir -p src

cat > src/api.ts << 'API_EOF'
// Simple API utility for user data fetching
// This code lacks error handling and input validation

export async function fetchUserData(userId: string) {
  const response = await fetch(`/api/users/${userId}`);
  const data = await response.json();
  return data;
}

export async function updateUserData(userId: string, updates: any) {
  const response = await fetch(`/api/users/${userId}`, {
    method: 'PUT',
    body: JSON.stringify(updates)
  });
  const data = await response.json();
  return data;
}
API_EOF

# Create a basic test file
cat > src/api.test.ts << 'TEST_EOF'
import { describe, it, expect, vi } from 'vitest';
import { fetchUserData, updateUserData } from './api';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch as any;

describe('fetchUserData', () => {
  it('fetches user data by id', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ id: '123', name: 'Test User' })
    });

    const result = await fetchUserData('123');
    expect(result).toEqual({ id: '123', name: 'Test User' });
  });
});

describe('updateUserData', () => {
  it('updates user data', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ id: '123', name: 'Updated User' })
    });

    const result = await updateUserData('123', { name: 'Updated User' });
    expect(result).toEqual({ id: '123', name: 'Updated User' });
  });
});
TEST_EOF

# Stage the files so Claude can see them
git add src/api.ts src/api.test.ts
git commit -m "feat: add basic API utilities for code review" 2>/dev/null || true

echo "API utility created at src/api.ts (lacks error handling and validation)"
echo ""

# Step 1: Run scenario with code review feedback
echo "Step 1: Running receiving-code-review scenario..."
echo "(This will provide review feedback - may take 3-5 minutes)"
echo ""

# The prompt simulates code review feedback with multiple items
USER_PROMPT="I've reviewed your API code in src/api.ts. Add error handling to the API call and improve the validation logic."

# Run Claude in the test project directory with the feedback
# More turns needed for Understanding Gate + Clarity Gate + per-change implementation
SESSION_OUTPUT=$(claude -p "$USER_PROMPT" --max-turns 20 2>&1 || true)
cd "$SCRIPT_DIR"

# Debug: show session output length and preview
echo "Session output captured (${#SESSION_OUTPUT} chars)"
if [ ${#SESSION_OUTPUT} -lt 100 ]; then
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
git checkout -- src/api.ts src/api.test.ts 2>/dev/null || true
git reset HEAD~1 --hard 2>/dev/null || true
rm -f src/api.ts src/api.test.ts 2>/dev/null || true
cd "$SCRIPT_DIR"
echo "Cleanup complete"
echo ""

# Determine pass/fail
if echo "$VERDICT" | grep -q '"verdict".*:.*"PASS"'; then
    echo "=== RESULT: PASS ==="
    echo ""
    echo "Receiving-code-review skill compliance verified:"
    echo "- Understanding Gate appeared (WHY explained)"
    echo "- Clarity Gate appeared for ambiguous items"
    echo "- Changes implemented one at a time"
    echo "- Tests run after EACH change"
    echo "- No performative agreement"
    echo ""

    RESULT="PASS"
    exit 0
else
    echo "=== RESULT: FAIL ==="
    echo ""
    echo "Receiving-code-review skill compliance failed."
    echo ""

    # Extract specific failure reasons
    if echo "$VERDICT" | grep -q '"status".*:.*"MISSING"'; then
        echo "Missing checklist items:"
        echo "$VERDICT" | grep -B 1 '"status".*:.*"MISSING"' | grep '"item"' | head -10
    fi

    if echo "$VERDICT" | grep -q '"status".*:.*"OBSERVED"'; then
        echo "Skipping signs observed:"
        echo "$VERDICT" | grep -B 1 '"status".*:.*"OBSERVED"' | grep '"sign"' | head -10
    fi
    echo ""

    RESULT="FAIL"
    exit 1
fi
