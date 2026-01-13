#!/usr/bin/env bash
# Compliance test for the writing-skills skill
# Tests that Claude follows TDD cycle when creating skills:
# 1. RED Phase Gate: Baseline test created BEFORE skill writing
# 2. GREEN Phase Gate: Skill addresses specific baseline failures
# 3. REFACTOR Phase Gate: Rationalization table and red flags included
# 4. Order matters: Baseline -> Skill -> Compliance -> Refactor

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/test-helpers.sh"

SKILL_NAME="writing-skills"
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

# Step 0: Clean up any existing skill artifacts in test project
echo "Step 0: Cleaning up test project..."

cd "$TEST_PROJECT"

# Clean up any existing skill-related directories
rm -rf skills/ ~/.claude/skills/lint-before-commit/ 2>/dev/null || true
rm -rf docs/tests/ tests/skills/ 2>/dev/null || true

# Create skills directory for the test skill to be written
mkdir -p skills

echo "Test project prepared"
echo ""

# Step 1: Run scenario asking Claude to create a skill
echo "Step 1: Running writing-skills scenario..."
echo "(This will ask Claude to create a skill following TDD - may take 15-25 minutes)"
echo ""

# The prompt triggers the writing-skills skill
USER_PROMPT="Create a skill for always running lints before commits"

# Run Claude in the test project directory
# High max-turns needed for: baseline creation + skill writing + compliance testing + refactoring
SESSION_OUTPUT=$(claude -p "$USER_PROMPT" --max-turns 40 2>&1 || true)
cd "$SCRIPT_DIR"

# Debug: show session output length and preview
echo "Session output captured (${#SESSION_OUTPUT} chars)"
if [ ${#SESSION_OUTPUT} -lt 500 ]; then
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
    echo "$VERDICT" | grep -A 150 '"checklist_results"' | head -155
fi
echo ""

if echo "$VERDICT" | grep -q '"skipping_observations"'; then
    echo "Skipping Observations:"
    echo "$VERDICT" | grep -A 80 '"skipping_observations"' | head -85
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
rm -rf skills/ 2>/dev/null || true
rm -rf docs/tests/ tests/skills/ 2>/dev/null || true
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
    echo "Writing-skills skill compliance verified:"
    echo "- RED Phase Gate: Baseline test created BEFORE skill writing"
    echo "- GREEN Phase Gate: Skill addresses specific baseline failures"
    echo "- REFACTOR Phase Gate: Rationalization table and red flags included"
    echo "- TDD order maintained: Baseline -> Skill -> Compliance -> Refactor"
    echo ""

    RESULT="PASS"
    exit 0
else
    echo "=== RESULT: FAIL ==="
    echo ""
    echo "Writing-skills skill compliance failed."
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
