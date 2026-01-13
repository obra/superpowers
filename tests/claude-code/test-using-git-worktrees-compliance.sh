#!/usr/bin/env bash
# Compliance test for the using-git-worktrees skill
# Tests that Claude:
# 1. Ignore Verification Gate: Checks .gitignore status before worktree creation
# 2. Setup Gate: Auto-detects project type, installs deps, runs tests
# 3. Readiness Gate: Reports full path and test results before proceeding

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/test-helpers.sh"

SKILL_NAME="using-git-worktrees"
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

# Step 0: Clean up any existing worktrees and prepare test environment
echo "Step 0: Preparing test environment..."

cd "$TEST_PROJECT"

# Remove any existing worktrees for this test
if [ -d ".worktrees/feature-new-component" ]; then
    git worktree remove .worktrees/feature-new-component --force 2>/dev/null || true
fi

# Remove the branch if it exists
git branch -D feature/new-component 2>/dev/null || true

# Ensure .worktrees directory does NOT exist (to test ignore verification)
rm -rf .worktrees 2>/dev/null || true

# Remove .worktrees from .gitignore if present (to test the fix-gitignore flow)
# Actually, let's keep it interesting - 50% chance to test each path
# For deterministic tests, we'll remove it to force the "not ignored" path
if grep -q "^\.worktrees" .gitignore 2>/dev/null; then
    # Remove .worktrees line from .gitignore to test the ignore verification flow
    sed -i.bak '/^\.worktrees/d' .gitignore
    rm -f .gitignore.bak
    git add .gitignore
    git commit -m "test: remove .worktrees from .gitignore for testing" --no-verify 2>/dev/null || true
fi

# Ensure we're on main branch
git checkout main 2>/dev/null || git checkout -b main

echo "Test environment prepared"
echo "- .worktrees directory: REMOVED"
echo "- .gitignore .worktrees entry: REMOVED (if present)"
echo "- feature/new-component branch: REMOVED (if present)"
echo ""

# Step 1: Run scenario requesting worktree creation
echo "Step 1: Running using-git-worktrees scenario..."
echo "(This will request worktree creation - may take 3-5 minutes)"
echo ""

# The prompt triggers the using-git-worktrees skill
USER_PROMPT="Create a worktree for feature/new-component"

# Run Claude in the test project directory
# Moderate max-turns for: skill execution, git commands, npm install, npm test
SESSION_OUTPUT=$(claude -p "$USER_PROMPT" --max-turns 25 2>&1 || true)
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

# Step 5: Cleanup - remove test worktree and branch
echo "Step 5: Cleaning up test artifacts..."
cd "$TEST_PROJECT"

# Remove worktree if created
if [ -d ".worktrees/feature-new-component" ]; then
    git worktree remove .worktrees/feature-new-component --force 2>/dev/null || true
fi

# Remove the branch
git branch -D feature/new-component 2>/dev/null || true

# Remove .worktrees directory
rm -rf .worktrees 2>/dev/null || true

# Reset any uncommitted changes (but keep .gitignore changes if any)
git checkout -- . 2>/dev/null || true

# Reset to original state
git reset --hard HEAD~3 2>/dev/null || true

cd "$SCRIPT_DIR"
echo "Cleanup complete"
echo ""

# Determine pass/fail
if echo "$VERDICT" | grep -q '"verdict".*:.*"PASS"'; then
    echo "=== RESULT: PASS ==="
    echo ""
    echo "Using-git-worktrees skill compliance verified:"
    echo "- Ignore Verification Gate: git check-ignore run on target directory"
    echo "- Setup Gate: Project type detected, dependencies installed, tests run"
    echo "- Readiness Gate: Full path and test results reported"
    echo ""

    RESULT="PASS"
    exit 0
else
    echo "=== RESULT: FAIL ==="
    echo ""
    echo "Using-git-worktrees skill compliance failed."
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
