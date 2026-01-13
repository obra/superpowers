#!/usr/bin/env bash
# Compliance test for the writing-plans skill
# Tests that Claude properly consumes research documents when writing plans:
# 1. Handoff Consumption Gate: Research document explicitly cited
# 2. Context Gate: Research findings inform the plan
# 3. Task Quality Gate: Exact file paths, complete code
# 4. Plan Completeness Gate: Proper header sections
# 5. Open Questions: Research questions addressed or carried forward

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/test-helpers.sh"

SKILL_NAME="writing-plans"
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

# Step 0: Set up the test environment with research document
echo "Step 0: Setting up test environment with research document..."

cd "$TEST_PROJECT"

# Clean up any previous test artifacts
rm -rf docs/research/ docs/plans/ docs/handoffs/ 2>/dev/null || true

# Create research directory and document
mkdir -p docs/research
mkdir -p docs/plans

# Create the research document that the plan should consume
cat > docs/research/2026-01-13-user-preferences.md << 'RESEARCH_EOF'
# User Preferences Feature Research

## Date
2026-01-13

## Context
Research for implementing user preferences in the Next.js app.

## Key Findings

### Architecture Patterns
- The app uses React Context for global state
- Existing patterns show preferences stored in localStorage
- Theme switching uses CSS variables

### Best Practices
- Use Zod for preference schema validation
- Default preferences should be type-safe
- Persistence layer should be abstracted

### Codebase Analysis
- Found existing ThemeProvider at `src/providers/ThemeProvider.tsx`
- Layout wraps all pages at `src/app/layout.tsx`
- No existing preferences context found

### Recommended Approach
1. Create PreferencesContext with typed interface
2. Add localStorage persistence with schema validation
3. Wire into existing layout

## Open Questions
- Should preferences sync to server for logged-in users?
- What's the migration strategy for existing localStorage data?
- How should preferences affect SSR/hydration?
RESEARCH_EOF

# Make sure git is initialized and clean
git add docs/ 2>/dev/null || true
git commit -m "Add research document for preferences feature" 2>/dev/null || true

echo "Research document created at docs/research/2026-01-13-user-preferences.md"
echo ""

# Step 1: Run scenario asking Claude to write a plan
echo "Step 1: Running writing-plans scenario..."
echo "(This will ask Claude to write a plan based on research - may take 10-15 minutes)"
echo ""

# The prompt triggers the writing-plans skill
USER_PROMPT="Write a plan based on this research to implement user preferences"

# Run Claude in the test project directory
# Medium max-turns needed for: research check + plan writing
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
rm -rf docs/research/ docs/plans/ docs/handoffs/ 2>/dev/null || true
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
    echo "Writing-plans skill compliance verified:"
    echo "- Handoff Consumption Gate: Research document explicitly cited"
    echo "- Context Gate: Research findings informed the plan"
    echo "- Task Quality Gate: Exact file paths, complete code"
    echo "- Plan Completeness Gate: Proper header sections"
    echo "- Open Questions: Research questions addressed/carried forward"
    echo ""

    RESULT="PASS"
    exit 0
else
    echo "=== RESULT: FAIL ==="
    echo ""
    echo "Writing-plans skill compliance failed."
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
