#!/usr/bin/env bash
# Integration Test: subagent-driven-development workflow (direct-execution)
#
# Verifies the current default: the primary agent implements a small approved
# plan directly in the current working tree, runs focused verification and
# self-review per task, runs final verification, inspects the working tree,
# and stops without any automatic Git mutation. Delegating a task to a
# subagent remains a valid *optional* choice under this skill — this test
# does not require, forbid, or assert on whether one was used, since the
# harness cannot reliably observe an optional internal choice either way.
#
# Drill coverage: evals/scenarios/sdd-rejects-extra-features.yaml covers YAGNI
# enforcement (forbidden exports). This bash test additionally exercises the
# full task-by-task loop end-to-end and inspects real working-tree/Git state,
# which drill does not.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/test-helpers.sh"

echo "========================================"
echo " Integration Test: subagent-driven-development"
echo "========================================"
echo ""
echo "This test executes a small deterministic plan directly and verifies:"
echo "  1. The skill was invoked"
echo "  2. The implementation matches the plan"
echo "  3. Focused verification (npm test) actually passes"
echo "  4. The working tree holds the implementation, uncommitted"
echo "  5. No automatic commit, staging, or other Git history mutation occurred"
echo ""
echo "WARNING: This test may take several minutes to complete."
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

# Create a simple, already-approved implementation plan
cat > docs/superpowers/plans/implementation-plan.md <<'EOF'
# Test Implementation Plan

This is a minimal, approved plan to exercise the subagent-driven-development
direct-execution workflow.

## Task 1: Create Add Function

Create a function that adds two numbers.

**File:** `src/math.js`

**Requirements:**
- Function named `add`
- Takes two parameters: `a` and `b`
- Returns the sum of `a` and `b`
- Export the function

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

**Tests:** Add to `test/math.test.js`:
- `multiply(2, 3)` returns `6`
- `multiply(0, 5)` returns `0`
- `multiply(-2, 3)` returns `-6`

**Verification:** `npm test`
EOF

# Initialize git repo with one baseline commit, matching a real
# already-approved-plan starting point.
git init --quiet
git config user.email "test@test.com"
git config user.name "Test User"
git add .
git commit -m "Initial commit" --quiet

BASELINE_COMMITS=$(git log --oneline | wc -l | tr -d ' ')

echo ""
echo "Project setup complete. Starting execution..."
echo ""

OUTPUT_FILE="$TEST_PROJECT/claude-output.txt"

PROMPT="Execute the implementation plan at docs/superpowers/plans/implementation-plan.md using the subagent-driven-development skill.

Follow the skill exactly: implement each task directly in the current working
tree, run focused verification and self-review after each task, run final
verification once both tasks are done, inspect the working tree, report what
you did, and then stop. Do not stage, commit, push, or otherwise change Git
history — leave the result in the working tree for the user.

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
#
# Resolve the path exactly as Claude Code itself sees it, not as this shell
# sees it — the two can differ:
#   - macOS: mktemp returns /var/..., but Claude Code resolves it to
#     /private/var/... when naming the project dir. `pwd -P` (physical path,
#     symlinks resolved) matches that.
#   - Windows/Git Bash: Claude Code runs as a native Windows process, so it
#     names the project dir from the Windows form of the path (drive letter,
#     e.g. C:/Users/<user>/AppData/Local/Temp/...), even though this test's
#     $TEST_PROJECT is a POSIX-style path (e.g. /tmp/... or /c/Users/...).
#     `pwd -W` is a bash builtin on MSYS/Git-Bash that reports that native
#     Windows form directly from the OS, regardless of which POSIX alias was
#     used to reach the directory — no drive letter, username, or temp path
#     needs to be hard-coded or guessed. It's unavailable (and errors) on
#     real Unix shells, so it's only used when it actually works.
if TEST_PROJECT_REAL=$(cd "$TEST_PROJECT" && pwd -W 2>/dev/null) && [ -n "$TEST_PROJECT_REAL" ]; then
    : # native Windows path resolved via MSYS/Git-Bash's pwd -W
else
    TEST_PROJECT_REAL=$(cd "$TEST_PROJECT" && pwd -P)
fi
# Claude normalizes the cwd to a directory name by replacing every non-alphanumeric
# character with `-` (so `_`, `.`, `/`, `\`, `:` all become `-`).
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

# Test 2: Implementation matches the plan (behavioral: read the actual files)
echo "Test 2: Implementation matches the plan..."
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
echo ""

# Test 3: Focused verification actually passes
echo "Test 3: Tests pass..."
if cd "$TEST_PROJECT" && npm test > test-output.txt 2>&1; then
    echo "  [PASS] Tests pass"
else
    echo "  [FAIL] Tests failed"
    cat test-output.txt
    FAILED=$((FAILED + 1))
fi
echo ""

# Test 4: The working tree holds the implementation, uncommitted
echo "Test 4: Implementation left uncommitted in the working tree..."
tree_status="$(git -C "$TEST_PROJECT" status --porcelain)"
if [ -n "$tree_status" ]; then
    echo "  [PASS] Working tree has uncommitted changes"
else
    echo "  [FAIL] Working tree is clean (expected uncommitted implementation)"
    FAILED=$((FAILED + 1))
fi
echo ""

# Test 5: No automatic commit was created beyond the baseline
echo "Test 5: No automatic commit..."
final_commits=$(git -C "$TEST_PROJECT" log --oneline | wc -l | tr -d ' ')
if [ "$final_commits" -eq "$BASELINE_COMMITS" ]; then
    echo "  [PASS] Commit count unchanged ($final_commits, matches baseline)"
else
    echo "  [FAIL] Commit count changed ($BASELINE_COMMITS -> $final_commits); the skill should not commit automatically"
    FAILED=$((FAILED + 1))
fi
echo ""

# Test 6: No branch/history mutation
echo "Test 6: No branch mutation..."
final_branch=$(git -C "$TEST_PROJECT" branch --show-current)
if [ "$final_branch" = "main" ] || [ "$final_branch" = "master" ]; then
    echo "  [PASS] Still on the original branch ($final_branch)"
else
    echo "  [FAIL] Branch changed unexpectedly (now: $final_branch)"
    FAILED=$((FAILED + 1))
fi
echo ""

# Test 7: No hidden execution ledger/workspace was created
echo "Test 7: No execution ledger..."
if [ -d "$TEST_PROJECT/.superpowers" ]; then
    echo "  [FAIL] .superpowers execution ledger/workspace was created"
    FAILED=$((FAILED + 1))
else
    echo "  [PASS] No .superpowers execution ledger created"
fi
echo ""

# Test 8: No extra features added (self-review should catch this)
echo "Test 8: No extra features added..."
if grep -q "export function divide\|export function power\|export function subtract" "$TEST_PROJECT/src/math.js" 2>/dev/null; then
    echo "  [WARN] Extra features found (self-review should have caught this)"
    # Not failing on this — it tests self-review effectiveness, not a hard requirement.
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
    echo "The subagent-driven-development skill correctly:"
    echo "  ✓ Implemented the plan directly (no subagent dispatch required)"
    echo "  ✓ Produced a working, tested implementation"
    echo "  ✓ Left the result uncommitted in the working tree"
    echo "  ✓ Performed no automatic Git mutation"
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
