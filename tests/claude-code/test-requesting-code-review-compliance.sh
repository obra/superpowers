#!/usr/bin/env bash
# Compliance test for the requesting-code-review skill
# Tests that Claude:
# 1. Captures BASE_SHA and HEAD_SHA via git commands (Context Gate)
# 2. Generates git diff for review context
# 3. Dispatches ALL 4 review agents (security, performance, style, test)
# 4. Cites each reviewer's findings in synthesis (Handoff Consumption)
# 5. Groups findings by severity (Critical/Warning/Suggestion)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/test-helpers.sh"

SKILL_NAME="requesting-code-review"
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

# Step 0: Create code to review with intentional issues
echo "Step 0: Setting up code with intentional issues for review..."

cd "$TEST_PROJECT"

# Clean up any existing test files
rm -f src/validation.ts src/validation.test.ts 2>/dev/null || true

# Create the validation utility with intentional issues for each reviewer to find
mkdir -p src

cat > src/validation.ts << 'VALIDATION_EOF'
// Validation utility with intentional issues for code review testing

export function validateEmail(email: string): boolean {
  // Missing null check - Security issue
  // No regex validation - Security issue
  return email.includes('@');
}

export function validateUser(user: any): boolean {
  // Using 'any' type - Style issue
  // No type definition - Style issue
  return user.name && user.email && validateEmail(user.email);
}

export function validateUsers(users: any[]): boolean[] {
  // N+1 validation pattern - Performance issue
  // Could use map() - Style issue
  const results: boolean[] = [];
  for (const user of users) {
    results.push(validateUser(user));
  }
  return results;
}

export function validateAge(age: number): boolean {
  // No bounds checking - Security issue
  // Magic number - Style issue
  return age > 0 && age < 150;
}
VALIDATION_EOF

# Create a basic test file (intentionally incomplete)
cat > src/validation.test.ts << 'TEST_EOF'
import { describe, it, expect } from 'vitest';
import { validateEmail, validateUser } from './validation';

// Intentionally missing edge case tests - Test issue
// Missing validateUsers tests - Test issue
// Missing validateAge tests - Test issue

describe('validateEmail', () => {
  it('returns true for valid email', () => {
    expect(validateEmail('test@example.com')).toBe(true);
  });

  it('returns false for invalid email', () => {
    expect(validateEmail('notanemail')).toBe(false);
  });

  // Missing: null input test
  // Missing: empty string test
  // Missing: special character tests
});

describe('validateUser', () => {
  it('returns true for valid user', () => {
    expect(validateUser({ name: 'Test', email: 'test@example.com' })).toBe(true);
  });

  // Missing: null user test
  // Missing: missing fields test
});
TEST_EOF

# Commit the changes so Claude can review them
git add src/validation.ts src/validation.test.ts
git commit -m "feat: add validation utilities" 2>/dev/null || true

echo "Validation code created with intentional issues:"
echo "  - Security: Missing null checks, no regex validation, no bounds"
echo "  - Performance: N+1 validation pattern"
echo "  - Style: 'any' types, magic numbers, could use map()"
echo "  - Test: Missing edge cases, incomplete coverage"
echo ""

# Step 1: Run scenario requesting code review
echo "Step 1: Running requesting-code-review scenario..."
echo "(This will request code review - may take 3-5 minutes for 4 parallel agents)"
echo ""

# The prompt triggers the requesting-code-review skill
USER_PROMPT="Review my changes"

# Run Claude in the test project directory
# Higher turns needed for: context gathering + 4 agent dispatches + synthesis
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
git checkout -- src/validation.ts src/validation.test.ts 2>/dev/null || true
git reset HEAD~1 --hard 2>/dev/null || true
rm -f src/validation.ts src/validation.test.ts 2>/dev/null || true
cd "$SCRIPT_DIR"
echo "Cleanup complete"
echo ""

# Determine pass/fail
if echo "$VERDICT" | grep -q '"verdict".*:.*"PASS"'; then
    echo "=== RESULT: PASS ==="
    echo ""
    echo "Requesting-code-review skill compliance verified:"
    echo "- Context Gate: BASE_SHA and HEAD_SHA captured"
    echo "- Git diff generated"
    echo "- Dispatch Gate: All 4 reviewers dispatched"
    echo "- Handoff Consumption: Each reviewer's output cited"
    echo "- Synthesis Gate: Findings grouped by severity"
    echo ""

    RESULT="PASS"
    exit 0
else
    echo "=== RESULT: FAIL ==="
    echo ""
    echo "Requesting-code-review skill compliance failed."
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
