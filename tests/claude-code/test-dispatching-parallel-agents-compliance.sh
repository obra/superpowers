#!/usr/bin/env bash
# Compliance test for the dispatching-parallel-agents skill
# Tests that Claude properly analyzes task dependencies and dispatches
# agents appropriately (parallel for independent, sequential for dependent)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/test-helpers.sh"

SKILL_NAME="dispatching-parallel-agents"
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

# Verify test files exist in the project
for test_file in "src/auth.test.ts" "src/api.test.ts" "src/auth-api.test.ts" "src/shared-state.ts"; do
    if [ ! -f "$TEST_PROJECT/$test_file" ]; then
        echo "[ERROR] Required test file not found: $TEST_PROJECT/$test_file"
        echo "Test files should be created by the compliance test setup"
        exit 1
    fi
done

# Verify tests are actually failing (should have 5 failures)
echo "Verifying test files are set up correctly..."
cd "$TEST_PROJECT"
TEST_OUTPUT=$(npm test -- --run 2>&1 || true)
if ! echo "$TEST_OUTPUT" | grep -q "5 failed"; then
    echo "[WARNING] Expected 5 failing tests, check output:"
    echo "$TEST_OUTPUT" | tail -20
fi
cd "$SCRIPT_DIR"
echo "Test files verified (5 failing tests across 3 files)"
echo ""

# Step 1: Run scenario in test project
echo "Step 1: Running scenario in test project..."
echo "(This will call Claude with multi-task dispatch scenario - may take 5-10 minutes)"
echo ""

# The dispatching-parallel-agents skill triggers when facing 2+ tasks to fix
USER_PROMPT="Fix these 3 failing tests. I'm seeing 5 test failures across auth.test.ts, api.test.ts, and auth-api.test.ts."

# Run Claude in the test project directory with the scenario
# Higher max-turns for parallel dispatch workflow (analysis + multiple agents + integration)
cd "$TEST_PROJECT"
SESSION_OUTPUT=$(claude -p "$USER_PROMPT" --max-turns 25 2>&1 || true)
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
    echo "$VERDICT" | grep -A 50 '"checklist_results"' | head -55
fi
echo ""

if echo "$VERDICT" | grep -q '"skipping_observations"'; then
    echo "Skipping Observations:"
    echo "$VERDICT" | grep -A 30 '"skipping_observations"' | head -35
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

# Determine pass/fail
if echo "$VERDICT" | grep -q '"verdict".*:.*"PASS"'; then
    echo "=== RESULT: PASS ==="
    echo ""
    echo "Dispatching-parallel-agents skill compliance verified:"
    echo "- Independence Gate executed (dependency analysis)"
    echo "- Prompt Quality Gate executed (specific prompts)"
    echo "- Integration Gate executed (test suite run)"
    echo "- Dependent tasks dispatched sequentially"
    echo ""

    RESULT="PASS"
    exit 0
else
    echo "=== RESULT: FAIL ==="
    echo ""
    echo "Dispatching-parallel-agents skill compliance failed."
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
