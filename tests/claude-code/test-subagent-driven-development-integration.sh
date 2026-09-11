#!/usr/bin/env bash
# Integration Test: subagent-driven-development workflow
# Actually executes a plan and checks observable implementation outcomes
#
# Drill coverage: evals/scenarios/sdd-rejects-extra-features.yaml covers the
# YAGNI enforcement subset (forbidden exports + reviewer-as-gate semantics)
# and is stricter on that axis. This bash test asserts:
#   - >=3 git commits (initial + per-milestone commits, exercising SDD's
#     commit-per-milestone workflow shape)
#   - >=2 Claude Code Agent/Task tool calls (dispatch activity only)
#   - Claude Code task-tracking tool usage (drill makes no assertion)
#   - test/math.test.js exists (drill relies on `npm test` succeeding)
#   - no unrequested arithmetic exports
#   - analyze-token-usage.py token-budget telemetry
# The tool-call count does not infer child identity, reuse, non-overlap, reviewer filesystem
# behavior, fix routing, review-pass caps, or the phase stop boundary from
# aggregate tool-call counts.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/test-helpers.sh"

echo "========================================"
echo " Integration Test: subagent-driven-development"
echo "========================================"
echo ""
echo "This test executes a real plan using the skill and checks:"
echo "  1. The skill is invoked"
echo "  2. Child-dispatch activity and milestone tracking are observable"
echo "  3. Two milestone commits produce the requested implementation"
echo "  4. Tests pass and no extra arithmetic exports are added"
echo "  5. Token telemetry can analyze the session transcript"
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

mkdir -p src test docs/superpowers/plans

# Create a simple implementation plan
cat > docs/superpowers/plans/implementation-plan.md <<'EOF'
# Test Implementation Plan

This is a minimal plan to test the subagent-driven-development workflow.

## Milestone 1: Create Add Function

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

## Milestone 2: Create Multiply Function

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
I approve this exact bounded delegation proposal:
- Phase: Arithmetic core
- Milestones: add function; multiply function
- Implementer: general-purpose child, Anthropic model claude-sonnet-4-5-20250929, medium reasoning, default context
- Reviewer: general-purpose child, Anthropic model claude-sonnet-4-5-20250929, medium reasoning, default context
- Scope: package.json, src/math.js, test/math.test.js, and git commits in this temporary repository
- Validation: npm test; all six specified arithmetic cases pass; no divide, power, or subtract export
- Topology: create both children idle; activate only one at a time; reuse the same implementer and reviewer
- Limits: maximum 17 child activations for this two-milestone phase; at most three review passes per milestone
- Stop boundary: stop after Arithmetic core; do not continue, push, create a PR, merge, or deploy

Execute docs/superpowers/plans/implementation-plan.md using the
subagent-driven-development skill and only this approved phase.

Begin now. Execute the plan.
EOF

# Note: We use a longer timeout since this is integration testing
# Use --allowed-tools to enable tool usage in headless mode
PROMPT="I approve this exact bounded delegation proposal:
- Phase: Arithmetic core
- Milestones: add function; multiply function
- Implementer: general-purpose child, Anthropic model claude-sonnet-4-5-20250929, medium reasoning, default context
- Reviewer: general-purpose child, Anthropic model claude-sonnet-4-5-20250929, medium reasoning, default context
- Scope: package.json, src/math.js, test/math.test.js, and git commits in this temporary repository
- Validation: npm test; all six specified arithmetic cases pass; no divide, power, or subtract export
- Topology: create both children idle; activate only one at a time; reuse the same implementer and reviewer
- Limits: maximum 17 child activations for this two-milestone phase; at most three review passes per milestone
- Stop boundary: stop after Arithmetic core; do not continue, push, create a PR, merge, or deploy

Execute docs/superpowers/plans/implementation-plan.md using the
subagent-driven-development skill and only this approved phase.

Begin now. Execute the plan."

PLUGIN_DIR=$(cd "$SCRIPT_DIR/../.." && pwd)

# Run claude from inside the test project so its session JSONL lands in a
# project-specific directory under ~/.claude/projects/, isolated from any
# other concurrent claude sessions.
echo "Running Claude (plugin-dir: $PLUGIN_DIR, cwd: $TEST_PROJECT)..."
echo "================================================================================"
cd "$TEST_PROJECT" && timeout 1800 claude -p "$PROMPT" --plugin-dir "$PLUGIN_DIR" --allowed-tools=all --permission-mode bypassPermissions 2>&1 | tee "$OUTPUT_FILE" || {
    echo ""
    echo "================================================================================"
    echo "EXECUTION FAILED (exit code: $?)"
    exit 1
}
echo "================================================================================"

echo ""
echo "Execution complete. Analyzing results..."
echo ""

# Find the session transcript. Because we ran claude from $TEST_PROJECT (a
# unique tmp dir), its sessions live in their own ~/.claude/projects/ folder
# and we can pick the most-recent one without racing other concurrent sessions.
# Resolve the real path because macOS mktemp returns /var/... but claude
# normalizes it to /private/var/... when naming the project dir.
TEST_PROJECT_REAL=$(cd "$TEST_PROJECT" && pwd -P)
# Claude normalizes the cwd to a directory name by replacing every non-alphanumeric
# character with `-` (so `_`, `.`, `/` all become `-`).
SESSION_DIR="$HOME/.claude/projects/$(echo "$TEST_PROJECT_REAL" | sed 's|[^a-zA-Z0-9]|-|g')"
# `|| true` prevents pipefail killing the script if ls gets SIGPIPE'd by head.
SESSION_FILE=$(ls -t "$SESSION_DIR"/*.jsonl 2>/dev/null | head -1 || true)

if [ -z "$SESSION_FILE" ]; then
    echo "ERROR: Could not find session transcript file"
    echo "Looked in: $SESSION_DIR"
    exit 1
fi

echo "Analyzing session transcript: $(basename "$SESSION_FILE")"
echo ""

# Verification tests
FAILED=0

echo "=== Verification Tests ==="
echo ""

# Test 1: Skill was invoked
echo "Test 1: Skill tool invoked..."
if grep -q '"name":"Skill".*"skill":"superpowers:subagent-driven-development"' "$SESSION_FILE"; then
    echo "  [PASS] subagent-driven-development skill was invoked"
else
    echo "  [FAIL] Skill was not invoked"
    FAILED=$((FAILED + 1))
fi
echo ""

# Test 2: Child-dispatch activity is observable
echo "Test 2: Child-dispatch activity..."
task_count=$(grep -cE '"name":"(Agent|Task)"' "$SESSION_FILE" || true)
task_count=${task_count:-0}
if [ "$task_count" -ge 2 ]; then
    echo "  [PASS] child dispatch activity observed ($task_count tool calls)"
else
    echo "  [FAIL] Only $task_count subagent(s) dispatched (expected >= 2)"
    FAILED=$((FAILED + 1))
fi
echo ""

# Test 3: Claude Code task-tracking tool was used
echo "Test 3: Task tracking..."
todo_count=$(grep -cE '"name":"(TodoWrite|TaskCreate|TaskUpdate|TaskList|TaskGet)"' "$SESSION_FILE" || true)
todo_count=${todo_count:-0}
if [ "$todo_count" -ge 1 ]; then
    echo "  [PASS] Task tracking used $todo_count time(s)"
else
    echo "  [FAIL] No Claude Code task-tracking tool used"
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
if [ "$commit_count" -gt 2 ]; then  # Initial + at least 2 milestone commits
    echo "  [PASS] Multiple commits created ($commit_count total)"
else
    echo "  [FAIL] Too few commits ($commit_count, expected >2)"
    FAILED=$((FAILED + 1))
fi
echo ""

# Test 8: Check for extra features
echo "Test 8: No extra features added (spec compliance)..."
if grep -q "export function divide\|export function power\|export function subtract" "$TEST_PROJECT/src/math.js" 2>/dev/null; then
    echo "  [FAIL] Extra arithmetic export found"
    FAILED=$((FAILED + 1))
else
    echo "  [PASS] No extra features added"
fi
echo ""

# Token Usage Analysis
echo "========================================="
echo " Token Usage Analysis"
echo "========================================="
echo ""
python3 "$SCRIPT_DIR/analyze-token-usage.py" "$SESSION_FILE"
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
    echo "The integration run produced the observable outcomes asserted here:"
    echo "  ✓ Skill invocation"
    echo "  ✓ Child-dispatch and task-tracking activity"
    echo "  ✓ Working milestone commits"
    echo "  ✓ Passing tests with no extra arithmetic exports"
    echo "  ✓ Analyzable token telemetry"
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
