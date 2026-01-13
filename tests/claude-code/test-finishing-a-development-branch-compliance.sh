#!/usr/bin/env bash
# Compliance test for the finishing-a-development-branch skill
# Tests that Claude:
# 1. Actually RUNS tests, build, and lint (Pre-Completion Gate)
# 2. Shows command output as evidence (not claims from memory)
# 3. Presents options ONLY after all verifications pass
# 4. Executes all steps of the chosen option

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/test-helpers.sh"

SKILL_NAME="finishing-a-development-branch"
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

# Step 0: Create feature branch with a simple implementation
echo "Step 0: Setting up feature branch for test..."

cd "$TEST_PROJECT"

# Store original branch
ORIGINAL_BRANCH=$(git rev-parse --abbrev-ref HEAD)

# Clean up any existing test branch
git checkout main 2>/dev/null || git checkout master 2>/dev/null || true
git branch -D feature/add-greeting 2>/dev/null || true

# Create and checkout feature branch
git checkout -b feature/add-greeting

# Create the Greeting component
mkdir -p src/components

cat > src/components/Greeting.tsx << 'COMPONENT_EOF'
export function Greeting({ name }: { name: string }) {
  return <div>Hello, {name}!</div>;
}
COMPONENT_EOF

# Create the test file
cat > src/components/Greeting.test.tsx << 'TEST_EOF'
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Greeting } from './Greeting';

describe('Greeting', () => {
  it('renders with name', () => {
    render(<Greeting name="World" />);
    expect(screen.getByText('Hello, World!')).toBeDefined();
  });
});
TEST_EOF

# Commit the changes
git add .
git commit -m "feat: add greeting component"

echo "Feature branch 'feature/add-greeting' created with Greeting component"
echo ""

# Step 1: Run scenario in test project
echo "Step 1: Running finishing-a-development-branch scenario..."
echo "(This will verify Pre-Completion Gate execution - may take 3-5 minutes)"
echo ""

# The prompt should trigger the finishing-a-development-branch skill
USER_PROMPT="I'm done with this branch"

# Run Claude in the test project directory with the scenario
# More turns needed for verification gate + option selection
SESSION_OUTPUT=$(claude -p "$USER_PROMPT" --max-turns 15 2>&1 || true)
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
    echo "$VERDICT" | grep -A 80 '"checklist_results"' | head -85
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

# Step 5: Cleanup - return to original branch
echo "Step 5: Cleaning up test branch..."
cd "$TEST_PROJECT"
git checkout main 2>/dev/null || git checkout master 2>/dev/null || true
git branch -D feature/add-greeting 2>/dev/null || true
rm -f src/components/Greeting.tsx src/components/Greeting.test.tsx 2>/dev/null || true
cd "$SCRIPT_DIR"
echo "Cleanup complete"
echo ""

# Determine pass/fail
if echo "$VERDICT" | grep -q '"verdict".*:.*"PASS"'; then
    echo "=== RESULT: PASS ==="
    echo ""
    echo "Finishing-a-development-branch skill compliance verified:"
    echo "- Tests actually RUN (command output shown)"
    echo "- Build actually RUN (command output shown)"
    echo "- Lint actually RUN (command output shown)"
    echo "- Options presented after verifications pass"
    echo "- Chosen option steps executed"
    echo ""

    RESULT="PASS"
    exit 0
else
    echo "=== RESULT: FAIL ==="
    echo ""
    echo "Finishing-a-development-branch skill compliance failed."
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
