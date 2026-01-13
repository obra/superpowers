#!/usr/bin/env bash
# Compliance test for the research skill
# Tests that Claude properly dispatches all 8 research agents and synthesizes findings:
# 1. Agent Dispatch Gate: All 8 agents dispatched in parallel
# 2. Handoff Consumption Gate: Each agent's findings quoted in synthesis
# 3. Synthesis Verification Gate: Per-agent citation checklist completed
# 4. Contradiction Identification: Nuances between agents noted
# 5. Open Questions: Design doc questions addressed or carried forward

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/test-helpers.sh"

SKILL_NAME="research"
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

# Step 0: Set up the test environment with design document
echo "Step 0: Setting up test environment with design document..."

cd "$TEST_PROJECT"

# Clean up any previous test artifacts
rm -rf docs/designs/ docs/research/ 2>/dev/null || true

# Create design directory and document
mkdir -p docs/designs
mkdir -p docs/research

# Create the design document for research
cat > docs/designs/2026-01-13-notification-system-design.md << 'DESIGN_EOF'
# Notification System Design

## Date
2026-01-13

## Overview
Add a notification system to the Next.js app that supports:
- In-app toast notifications
- Email notifications (via external service)
- Notification preferences per user

## Initial Architecture Thoughts
- Could use React Context for in-app notification state
- Toast component should support multiple notification types (success, error, warning, info)
- Email integration will need an API route
- Preferences should persist

## Requirements
1. Toast notifications with configurable duration
2. Email notifications for critical events
3. User can configure notification preferences
4. Notifications should be accessible (ARIA)

## Open Questions
- What existing notification patterns exist in the codebase?
- What email service integrations are common in Next.js apps?
- How should notification state be managed - Context vs Zustand vs Redux?
- What accessibility requirements apply to toast notifications?
- Are there any performance concerns with real-time notifications?
DESIGN_EOF

# Make sure git is initialized and clean
git add docs/ 2>/dev/null || true
git commit -m "Add design document for notification system" 2>/dev/null || true

echo "Design document created at docs/designs/2026-01-13-notification-system-design.md"
echo ""

# Step 1: Run scenario asking Claude to research the design
echo "Step 1: Running research scenario..."
echo "(This will dispatch 8 parallel agents - may take 15-20 minutes)"
echo ""

# The prompt triggers the research skill
USER_PROMPT="Research this design"

# Run Claude in the test project directory
# High max-turns needed for: design check + 8 agents + synthesis
SESSION_OUTPUT=$(claude -p "$USER_PROMPT" --max-turns 40 2>&1 || true)
cd "$SCRIPT_DIR"

# Debug: show session output length and preview
echo "Session output captured (${#SESSION_OUTPUT} chars)"
if [ ${#SESSION_OUTPUT} -lt 1000 ]; then
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
rm -rf docs/designs/ docs/research/ 2>/dev/null || true
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
    echo "Research skill compliance verified:"
    echo "- Agent Dispatch Gate: All 8 agents dispatched in parallel"
    echo "- Handoff Consumption Gate: Each agent's findings quoted"
    echo "- Synthesis Verification Gate: Per-agent citation complete"
    echo "- Contradiction Identification: Nuances noted"
    echo "- Open Questions: Design questions addressed"
    echo ""

    RESULT="PASS"
    exit 0
else
    echo "=== RESULT: FAIL ==="
    echo ""
    echo "Research skill compliance failed."
    echo ""

    # Extract specific failure reasons
    if echo "$VERDICT" | grep -q '"status".*:.*"MISSING"'; then
        echo "Missing checklist items:"
        echo "$VERDICT" | grep -B 1 '"status".*:.*"MISSING"' | grep '"item"' | head -20
    fi

    if echo "$VERDICT" | grep -q '"status".*:.*"OBSERVED"'; then
        echo "Skipping signs observed:"
        echo "$VERDICT" | grep -B 1 '"status".*:.*"OBSERVED"' | grep '"sign"' | head -20
    fi
    echo ""

    RESULT="FAIL"
    exit 1
fi
