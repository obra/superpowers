#!/usr/bin/env bash
# Compliance test for the subagent-driven-development skill
# Tests that Claude:
# 1. Context Curation Gate: Provides full task text (not file path reference)
# 2. Handoff Consumption Gate: Implementer acknowledges receiving context
# 3. Review Sequence Gate: Spec Compliance FIRST, then Code Quality
# 4. Task Completion Gate: Both reviews approved before marking complete
# 5. TodoWrite updated only after both reviews pass

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/test-helpers.sh"

SKILL_NAME="subagent-driven-development"
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

# Step 0: Create the implementation plan file
echo "Step 0: Setting up implementation plan..."

cd "$TEST_PROJECT"

# Clean up any existing test artifacts
rm -rf src/components/Greeting.tsx src/components/Greeting.test.tsx 2>/dev/null || true
rm -rf docs/plans/ docs/current-progress.md docs/handoffs/ 2>/dev/null || true

# Create the plan directory and file
mkdir -p docs/plans

cat > docs/plans/greeting-feature.md << 'PLAN_EOF'
# Implementation Plan: User Greeting Feature

**Goal:** Add a greeting feature to the homepage

**Architecture:** React component with personalized message

**Tech Stack:** Next.js, TypeScript, React Testing Library

---

## Task 1: Create Greeting component

**Files:**
- Create: src/components/Greeting.tsx
- Create: src/components/Greeting.test.tsx

**Steps:**
1. Create Greeting.tsx with props interface (name: string)
2. Render "Hello, {name}!" message
3. Write test for component rendering

**Commit:** feat: add Greeting component

---

## Task 2: Add time-based greeting

**Files:**
- Modify: src/components/Greeting.tsx
- Modify: src/components/Greeting.test.tsx

**Steps:**
1. Use native Date to get current hour
2. Update component to show "Good morning/afternoon/evening, {name}!"
3. Add tests for each time period (mock Date for testing)

**Context from Task 1:** Greeting component exists at src/components/Greeting.tsx

**Commit:** feat: add time-based greeting messages

---

## Task 3: Integrate Greeting into homepage

**Files:**
- Modify: src/app/page.tsx
- Create: src/app/page.test.tsx

**Steps:**
1. Import Greeting component
2. Add Greeting to page with hardcoded name "User" for now
3. Write test verifying Greeting appears on page

**Context from Tasks 1-2:** Greeting component with time-based messages exists

**Commit:** feat: integrate Greeting component into homepage
PLAN_EOF

# Create the components directory if it doesn't exist
mkdir -p src/components

echo "Implementation plan created at docs/plans/greeting-feature.md"
echo ""

# Step 1: Run scenario executing the plan
echo "Step 1: Running subagent-driven-development scenario..."
echo "(This will execute a 3-task plan with review cycles - may take 10-15 minutes)"
echo ""

# The prompt triggers the subagent-driven-development skill via /hyperpowers:execute-plan
USER_PROMPT="Execute the plan at docs/plans/greeting-feature.md using /hyperpowers:execute-plan"

# Run Claude in the test project directory
# High max-turns needed for: 3 tasks × (implementer + spec review + quality review + possible fixes)
SESSION_OUTPUT=$(claude -p "$USER_PROMPT" --max-turns 50 2>&1 || true)
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
    echo "$VERDICT" | grep -A 200 '"checklist_results"' | head -205
fi
echo ""

if echo "$VERDICT" | grep -q '"skipping_observations"'; then
    echo "Skipping Observations:"
    echo "$VERDICT" | grep -A 100 '"skipping_observations"' | head -105
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
rm -rf src/components/Greeting.tsx src/components/Greeting.test.tsx 2>/dev/null || true
rm -rf docs/plans/ docs/current-progress.md docs/handoffs/ 2>/dev/null || true
# Reset any uncommitted changes
git checkout -- . 2>/dev/null || true
# Reset any new commits made during test
git reset --hard HEAD~5 2>/dev/null || true
cd "$SCRIPT_DIR"
echo "Cleanup complete"
echo ""

# Determine pass/fail
if echo "$VERDICT" | grep -q '"verdict".*:.*"PASS"'; then
    echo "=== RESULT: PASS ==="
    echo ""
    echo "Subagent-driven-development skill compliance verified:"
    echo "- Context Curation Gate: Full task text provided to implementers"
    echo "- Handoff Consumption Gate: Implementers acknowledged context"
    echo "- Review Sequence Gate: Spec Review FIRST, then Code Quality"
    echo "- Task Completion Gate: Both reviews approved before marking complete"
    echo "- TodoWrite updated only after both reviews pass"
    echo ""

    RESULT="PASS"
    exit 0
else
    echo "=== RESULT: FAIL ==="
    echo ""
    echo "Subagent-driven-development skill compliance failed."
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
