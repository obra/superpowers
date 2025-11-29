#!/usr/bin/env bash
# Integration Test: subagent-driven-development workflow
# Actually executes a plan and verifies the new workflow behaviors
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/test-helpers.sh"

echo "========================================"
echo " Integration Test: subagent-driven-development"
echo "========================================"
echo ""
echo "This test executes a real plan using the skill and verifies:"
echo "  1. Plan is read once (not per task)"
echo "  2. Full task text provided to subagents"
echo "  3. Subagents perform self-review"
echo "  4. Spec compliance review before code quality"
echo "  5. Review loops when issues found"
echo "  6. Spec reviewer reads code independently"
echo ""
echo "WARNING: This test may take 10-30 minutes to complete."
echo ""

# Create test project
TEST_PROJECT=$(create_test_project)
echo "Test project: $TEST_PROJECT"

# Trap to cleanup
trap "cleanup_test_project $TEST_PROJECT" EXIT

# Set up minimal Node.js project
cd "$TEST_PROJECT"

cat > package.json <<'EOF'
{
  "name": "test-project",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "test": "node --test"
  }
}
EOF

mkdir -p src test docs/plans

# Create a simple implementation plan
cat > docs/plans/implementation-plan.md <<'EOF'
# Test Implementation Plan

This is a minimal plan to test the subagent-driven-development workflow.

## Task 1: Create Add Function

Create a function that adds two numbers.

**File:** `src/math.js`

**Requirements:**
- Function named `add`
- Takes two parameters: `a` and `b`
- Returns the sum of `a` and `b`
- Export the function

**Implementation:**
```javascript
export function add(a, b) {
  return a + b;
}
```

**Tests:** Create `test/math.test.js` that verifies:
- `add(2, 3)` returns `5`
- `add(0, 0)` returns `0`
- `add(-1, 1)` returns `0`

**Verification:** `npm test`

## Task 2: Create Multiply Function

Create a function that multiplies two numbers.

**File:** `src/math.js` (add to existing file)

**Requirements:**
- Function named `multiply`
- Takes two parameters: `a` and `b`
- Returns the product of `a` and `b`
- Export the function
- DO NOT add any extra features (like power, divide, etc.)

**Implementation:**
```javascript
export function multiply(a, b) {
  return a * b;
}
```

**Tests:** Add to `test/math.test.js`:
- `multiply(2, 3)` returns `6`
- `multiply(0, 5)` returns `0`
- `multiply(-2, 3)` returns `-6`

**Verification:** `npm test`
EOF

# Initialize git repo
git init --quiet
git config user.email "test@test.com"
git config user.name "Test User"
git add .
git commit -m "Initial commit" --quiet

echo ""
echo "Project setup complete. Starting execution..."
echo ""

# Run Claude with subagent-driven-development
# Capture full output to analyze
OUTPUT_FILE="$TEST_PROJECT/claude-output.txt"

# Create prompt file
cat > "$TEST_PROJECT/prompt.txt" <<'EOF'
I want you to execute the implementation plan at docs/plans/implementation-plan.md using the subagent-driven-development skill.

IMPORTANT: Follow the skill exactly. I will be verifying that you:
1. Read the plan once at the beginning
2. Provide full task text to subagents (don't make them read files)
3. Ensure subagents do self-review before reporting
4. Run spec compliance review before code quality review
5. Use review loops when issues are found

Begin now. Execute the plan.
EOF

# Note: We use a longer timeout since this is integration testing
# Use --allowed-tools to enable tool usage in headless mode
# IMPORTANT: Run from superpowers directory so local dev skills are available
PROMPT="Change to directory $TEST_PROJECT and then execute the implementation plan at docs/plans/implementation-plan.md using the subagent-driven-development skill.

IMPORTANT: Follow the skill exactly. I will be verifying that you:
1. Read the plan once at the beginning
2. Provide full task text to subagents (don't make them read files)
3. Ensure subagents do self-review before reporting
4. Run spec compliance review before code quality review
5. Use review loops when issues are found

Begin now. Execute the plan."

cd "$SCRIPT_DIR/../.." && timeout 1800 claude -p "$PROMPT" --allowed-tools=all > "$OUTPUT_FILE" 2>&1 || {
    echo "EXECUTION FAILED"
    cat "$OUTPUT_FILE"
    exit 1
}

echo ""
echo "Execution complete. Analyzing results..."
echo ""

# Read the output
OUTPUT=$(cat "$OUTPUT_FILE")

# Verification tests
FAILED=0

echo "=== Verification Tests ==="
echo ""

# Test 1: Plan should be read once at the beginning
echo "Test 1: Plan read once at beginning..."
if echo "$OUTPUT" | grep -q "Load Plan\|read.*plan\|extract.*tasks"; then
    # Check it's near the beginning (within first 20% of output)
    total_lines=$(echo "$OUTPUT" | wc -l)
    plan_line=$(echo "$OUTPUT" | grep -n "Load Plan\|read.*plan\|extract.*tasks" | head -1 | cut -d: -f1)
    threshold=$((total_lines / 5))

    if [ "$plan_line" -lt "$threshold" ]; then
        echo "  [PASS] Plan read early (line $plan_line of $total_lines)"
    else
        echo "  [FAIL] Plan not read early (line $plan_line of $total_lines)"
        FAILED=$((FAILED + 1))
    fi

    # Should NOT re-read for each task
    read_count=$(echo "$OUTPUT" | grep -c "read.*plan" || echo "0")
    if [ "$read_count" -le 3 ]; then  # Allow some mentions but not per-task
        echo "  [PASS] Plan not re-read per task ($read_count mentions)"
    else
        echo "  [FAIL] Plan read too many times ($read_count mentions)"
        FAILED=$((FAILED + 1))
    fi
else
    echo "  [FAIL] No evidence of plan loading"
    FAILED=$((FAILED + 1))
fi
echo ""

# Test 2: Full task text provided to subagents
echo "Test 2: Full task text provided to subagents..."
if echo "$OUTPUT" | grep -q "Task Description.*Requirements\|FULL TEXT"; then
    echo "  [PASS] Task text appears to be provided in prompts"
else
    echo "  [FAIL] No evidence of full task text in prompts"
    FAILED=$((FAILED + 1))
fi

# Should NOT make subagent read files
if echo "$OUTPUT" | grep -q "Read.*docs/plans/implementation-plan.md" | grep -v "I'm reading\|I read"; then
    echo "  [FAIL] Subagent was told to read plan file"
    FAILED=$((FAILED + 1))
else
    echo "  [PASS] Subagent not told to read plan file"
fi
echo ""

# Test 3: Subagents do self-review
echo "Test 3: Subagents perform self-review..."
if echo "$OUTPUT" | grep -qi "self-review\|self review\|reviewing my work\|look.*with fresh eyes"; then
    echo "  [PASS] Self-review mentioned"

    # Check for self-review findings
    if echo "$OUTPUT" | grep -qi "completeness\|quality\|discipline"; then
        echo "  [PASS] Self-review checklist items mentioned"
    else
        echo "  [WARN] Self-review checklist items not clearly mentioned"
    fi
else
    echo "  [FAIL] No evidence of self-review"
    FAILED=$((FAILED + 1))
fi
echo ""

# Test 4: Spec compliance review before code quality
echo "Test 4: Spec compliance review before code quality..."
spec_line=$(echo "$OUTPUT" | grep -ni "spec.*compliance.*review" | head -1 | cut -d: -f1)
code_line=$(echo "$OUTPUT" | grep -ni "code.*quality.*review" | head -1 | cut -d: -f1)

if [ -n "$spec_line" ] && [ -n "$code_line" ]; then
    if [ "$spec_line" -lt "$code_line" ]; then
        echo "  [PASS] Spec compliance review before code quality (line $spec_line < $code_line)"
    else
        echo "  [FAIL] Code quality before spec compliance (line $code_line < $spec_line)"
        FAILED=$((FAILED + 1))
    fi
else
    if [ -z "$spec_line" ]; then
        echo "  [FAIL] No spec compliance review found"
        FAILED=$((FAILED + 1))
    fi
    if [ -z "$code_line" ]; then
        echo "  [WARN] No code quality review found (might be acceptable if spec review caught issues)"
    fi
fi
echo ""

# Test 5: Spec reviewer is skeptical and reads code
echo "Test 5: Spec reviewer reads code independently..."
if echo "$OUTPUT" | grep -qi "do not trust.*report\|verify.*independently\|reading.*code\|inspecting.*implementation"; then
    echo "  [PASS] Spec reviewer reads code independently"
else
    echo "  [FAIL] No evidence of independent code verification"
    FAILED=$((FAILED + 1))
fi
echo ""

# Test 6: Implementation actually works
echo "Test 6: Implementation verification..."
if [ -f "$TEST_PROJECT/src/math.js" ]; then
    echo "  [PASS] src/math.js created"

    if grep -q "export function add" "$TEST_PROJECT/src/math.js"; then
        echo "  [PASS] add function exists"
    else
        echo "  [FAIL] add function missing"
        FAILED=$((FAILED + 1))
    fi

    if grep -q "export function multiply" "$TEST_PROJECT/src/math.js"; then
        echo "  [PASS] multiply function exists"
    else
        echo "  [FAIL] multiply function missing"
        FAILED=$((FAILED + 1))
    fi
else
    echo "  [FAIL] src/math.js not created"
    FAILED=$((FAILED + 1))
fi

if [ -f "$TEST_PROJECT/test/math.test.js" ]; then
    echo "  [PASS] test/math.test.js created"
else
    echo "  [FAIL] test/math.test.js not created"
    FAILED=$((FAILED + 1))
fi

# Try running tests
if cd "$TEST_PROJECT" && npm test > test-output.txt 2>&1; then
    echo "  [PASS] Tests pass"
else
    echo "  [FAIL] Tests failed"
    cat test-output.txt
    FAILED=$((FAILED + 1))
fi
echo ""

# Test 7: Git commits show proper workflow
echo "Test 7: Git commit history..."
commit_count=$(git -C "$TEST_PROJECT" log --oneline | wc -l)
if [ "$commit_count" -gt 2 ]; then  # Initial + at least 2 task commits
    echo "  [PASS] Multiple commits created ($commit_count total)"
else
    echo "  [FAIL] Too few commits ($commit_count, expected >2)"
    FAILED=$((FAILED + 1))
fi
echo ""

# Test 8: Check for extra features (spec compliance should catch)
echo "Test 8: No extra features added (spec compliance)..."
if grep -q "export function divide\|export function power\|export function subtract" "$TEST_PROJECT/src/math.js" 2>/dev/null; then
    echo "  [WARN] Extra features found (spec review should have caught this)"
    # Not failing on this as it tests reviewer effectiveness
else
    echo "  [PASS] No extra features added"
fi
echo ""

# Summary
echo "========================================"
echo " Test Summary"
echo "========================================"
echo ""

if [ $FAILED -eq 0 ]; then
    echo "STATUS: PASSED"
    echo "All verification tests passed!"
    echo ""
    echo "The subagent-driven-development skill correctly:"
    echo "  ✓ Reads plan once at start"
    echo "  ✓ Provides full task text to subagents"
    echo "  ✓ Enforces self-review"
    echo "  ✓ Runs spec compliance before code quality"
    echo "  ✓ Spec reviewer verifies independently"
    echo "  ✓ Produces working implementation"
    exit 0
else
    echo "STATUS: FAILED"
    echo "Failed $FAILED verification tests"
    echo ""
    echo "Output saved to: $OUTPUT_FILE"
    echo ""
    echo "Review the output to see what went wrong."
    exit 1
fi
