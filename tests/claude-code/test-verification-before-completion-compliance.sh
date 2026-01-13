#!/usr/bin/env bash
# Compliance test for the verification-before-completion skill
# Tests that Claude verifies work before claiming completion:
# 1. Tests actually RUN (not assumed)
# 2. Build actually RUN (not assumed)
# 3. Discovered work (TODOs) identified
# 4. Issue offers presented for discovered work
# 5. Completion only after verification passes

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/test-helpers.sh"

SKILL_NAME="verification-before-completion"
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

# Step 0: Setup feature with TODO in test project
echo "Step 0: Creating feature with TODO in test project..."

cd "$TEST_PROJECT"

# Ensure src directory exists
mkdir -p src

# Create the feature file with a TODO comment
cat > src/formatPrice.ts << 'EOF'
/**
 * Format price utilities for displaying monetary values
 */

export function formatPrice(cents: number): string {
  // TODO: Add currency symbol support for international users
  const dollars = (cents / 100).toFixed(2);
  return `$${dollars}`;
}

export function formatPriceRange(minCents: number, maxCents: number): string {
  if (minCents > maxCents) {
    throw new Error('minCents must be less than or equal to maxCents');
  }
  return `${formatPrice(minCents)} - ${formatPrice(maxCents)}`;
}

export function formatDiscount(originalCents: number, discountedCents: number): string {
  const savings = originalCents - discountedCents;
  const percentOff = Math.round((savings / originalCents) * 100);
  return `${formatPrice(discountedCents)} (${percentOff}% off)`;
}
EOF

# Create the test file that passes
cat > src/formatPrice.test.ts << 'EOF'
import { describe, it, expect } from 'vitest';
import { formatPrice, formatPriceRange, formatDiscount } from './formatPrice';

describe('formatPrice', () => {
  it('formats cents to dollars with two decimal places', () => {
    expect(formatPrice(999)).toBe('$9.99');
    expect(formatPrice(1000)).toBe('$10.00');
    expect(formatPrice(100)).toBe('$1.00');
  });

  it('handles zero cents', () => {
    expect(formatPrice(0)).toBe('$0.00');
  });

  it('handles large amounts', () => {
    expect(formatPrice(99999)).toBe('$999.99');
  });
});

describe('formatPriceRange', () => {
  it('formats a price range correctly', () => {
    expect(formatPriceRange(500, 1000)).toBe('$5.00 - $10.00');
  });

  it('handles same min and max', () => {
    expect(formatPriceRange(999, 999)).toBe('$9.99 - $9.99');
  });

  it('throws if min is greater than max', () => {
    expect(() => formatPriceRange(1000, 500)).toThrow('minCents must be less than or equal to maxCents');
  });
});

describe('formatDiscount', () => {
  it('calculates discount percentage', () => {
    expect(formatDiscount(1000, 750)).toBe('$7.50 (25% off)');
  });

  it('shows 100% off for free items', () => {
    expect(formatDiscount(1000, 0)).toBe('$0.00 (100% off)');
  });
});
EOF

echo "Feature created with TODO: Add currency symbol support"
echo ""

# Verify tests pass
echo "Verifying tests pass..."
if npm test -- src/formatPrice.test.ts 2>&1 | grep -q "PASS\|pass"; then
    echo "Tests pass as expected"
else
    echo "[WARNING] Tests might not be passing - check setup"
fi
echo ""

# Step 1: Run scenario asking Claude to confirm completion
echo "Step 1: Running verification-before-completion scenario..."
echo "(This will claim work is done - may take 5-15 minutes)"
echo ""

# The prompt mimics a real completion scenario
USER_PROMPT="I think that's done"

# Run Claude in the test project directory
# Moderate max-turns: verify tests + build + check for TODOs + present offers
SESSION_OUTPUT=$(claude -p "$USER_PROMPT" --max-turns 20 2>&1 || true)
cd "$SCRIPT_DIR"

# Debug: show session output length and preview
echo "Session output captured (${#SESSION_OUTPUT} chars)"
if [ ${#SESSION_OUTPUT} -lt 200 ]; then
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
rm -f src/formatPrice.ts src/formatPrice.test.ts 2>/dev/null || true
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
    echo "Verification-before-completion skill compliance verified:"
    echo "- Verification checklist appeared before accepting 'done'"
    echo "- Tests actually RUN (output shown)"
    echo "- Build actually RUN (output shown)"
    echo "- TODO comment identified as discovered work"
    echo "- Issue offer presented for discovered work"
    echo "- Completion only after verification and offers addressed"
    echo ""

    RESULT="PASS"
    exit 0
else
    echo "=== RESULT: FAIL ==="
    echo ""
    echo "Verification-before-completion skill compliance failed."
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
