#!/usr/bin/env bash
# Integration Test: subagent-driven-development workflow via Codex
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/test-helpers.sh"

echo "========================================"
echo " Integration Test: subagent-driven-development"
echo "========================================"
echo ""
echo "This test executes a real plan with Codex and verifies:"
echo "  1. Todo list events are emitted from the plan"
echo "  2. Subagents are spawned during execution"
echo "  3. Native workflow roles are visible in session metadata"
echo "  4. The implementation is written to the fixture project"
echo "  5. The generated tests pass"
echo "  6. A persisted Codex session is written"
echo ""
echo "WARNING: This test may take 10-30 minutes to complete."
echo ""

setup_codex_test_env
TEST_PROJECT=$(create_test_project)
trap 'cleanup_test_project "$TEST_PROJECT"; cleanup_codex_test_env' EXIT

echo "Test project: $TEST_PROJECT"
echo ""

cd "$TEST_PROJECT"

cat > package.json <<'EOF'
{
  "name": "codex-integration-fixture",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "test": "node --test"
  }
}
EOF

mkdir -p src test docs/superpowers/plans

cat > docs/superpowers/plans/implementation-plan.md <<'EOF'
# Test Implementation Plan

This plan exists only to verify the real Codex subagent-driven-development workflow.

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
- DO NOT add any extra features like divide, modulo, or power

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

git init --quiet
git config user.email "test@test.com"
git config user.name "Test User"
git add .
git commit -m "Initial commit" --quiet
git checkout -b codex-integration-test --quiet

OUTPUT_FILE="$TEST_PROJECT/codex-output.jsonl"
JSON_OUTPUT_FILE="$TEST_PROJECT/codex-events.jsonl"
PROMPT=$(cat <<'EOF'
Execute the implementation plan at docs/superpowers/plans/implementation-plan.md using the subagent-driven-development skill.

This repository is a disposable integration-test fixture that is already isolated on a throwaway branch. You may work directly in the current repository and create commits here. Do not create another worktree for this test.

Follow the skill exactly otherwise. In particular, do real work:
- read the plan and maintain a todo list
- use subagents for implementation and review
- if native Superpowers Codex workflow roles are available in this environment, use them instead of the generic worker or explorer fallback wherever the role matches the task
- create the requested files in this repository
- run the requested verification commands
- finish the implementation instead of stopping at analysis

This is a non-interactive test run. When you reach finishing-a-development-branch, keep the branch as-is and report that choice instead of asking a follow-up question.
EOF
)

echo "Running Codex..."
echo ""

if ! run_codex_json_to_file "$PROMPT" "$TEST_PROJECT" "$OUTPUT_FILE" 1800; then
    echo "Codex execution failed. Raw output:"
    sed 's/^/  /' "$OUTPUT_FILE"
    exit 1
fi

grep '^{' "$OUTPUT_FILE" > "$JSON_OUTPUT_FILE" || true

if [ ! -s "$JSON_OUTPUT_FILE" ]; then
    echo "ERROR: No JSON lines found in Codex output. Raw output:"
    sed 's/^/  /' "$OUTPUT_FILE"
    exit 1
fi

if ! jq empty "$JSON_OUTPUT_FILE" >/dev/null 2>&1; then
    echo "ERROR: Invalid JSON events produced by Codex. Raw output:"
    sed 's/^/  /' "$OUTPUT_FILE"
    exit 1
fi

SESSION_FILE=$(latest_codex_session_file)
if [ -z "$SESSION_FILE" ] || [ ! -f "$SESSION_FILE" ]; then
    echo "ERROR: Could not find persisted Codex session file"
    exit 1
fi

echo "Execution complete. Analyzing results..."
echo "JSON events: $JSON_OUTPUT_FILE"
echo "Session file: $SESSION_FILE"
echo ""

FAILED=0

json_query() {
    local query="$1"
    local result
    local status

    set +e
    result=$(jq -rs "$query" "$JSON_OUTPUT_FILE" 2>&1)
    status=$?
    set -e

    if [ "$status" -ne 0 ]; then
        echo "ERROR: jq failed in json_query" >&2
        echo "  Query: $query" >&2
        echo "  JSON events file: $JSON_OUTPUT_FILE" >&2
        echo "  Raw Codex output: $OUTPUT_FILE" >&2
        echo "  jq error/output:" >&2
        echo "$result" >&2
        FAILED=$((FAILED + 1))
        printf '0\n'
        return 0
    fi

    printf '%s\n' "$result"
}

count_session_role_hits() {
    local pattern="$1"
    local matches_file
    local status
    local count

    matches_file=$(mktemp)

    set +e
    find "$CODEX_HOME/sessions" -name "*.jsonl" -type f -exec rg -o --no-messages "$pattern" {} + > "$matches_file"
    status=$?
    set -e

    if [ "$status" -eq 0 ]; then
        count=$(wc -l < "$matches_file" | tr -d ' ')
    elif [ "$status" -eq 1 ]; then
        count=0
    else
        echo "ERROR: failed to count session role matches for pattern: $pattern" >&2
        FAILED=$((FAILED + 1))
        count=0
    fi

    rm -f "$matches_file"
    printf '%s\n' "$count"
}

echo "=== Verification Tests ==="
echo ""

echo "Test 1: Todo list emitted..."
todo_event_count=$(json_query 'map(select(.item.type? == "todo_list")) | length')
todo_max_items=$(json_query 'map(select(.item.type? == "todo_list") | (.item.items | length)) | max // 0')
if [ "$todo_event_count" -ge 1 ] && [ "$todo_max_items" -ge 2 ]; then
    echo "  [PASS] Todo list events captured ($todo_event_count events, up to $todo_max_items items)"
else
    echo "  [FAIL] Expected todo list events for both plan tasks (events=$todo_event_count, max_items=$todo_max_items)"
    FAILED=$((FAILED + 1))
fi
echo ""

echo "Test 2: Subagents spawned..."
spawn_count=$(json_query 'map(select(.item.type? == "collab_tool_call" and .item.tool == "spawn_agent")) | length')
if [ "$spawn_count" -ge 1 ]; then
    echo "  [PASS] Spawn-agent events captured ($spawn_count)"
else
    echo "  [FAIL] No spawn-agent events captured"
    FAILED=$((FAILED + 1))
fi
echo ""

echo "Test 3: Native workflow roles captured in session metadata..."
implementer_role_hits=$(count_session_role_hits '"agent_role":"superpowers_implementer"')
reviewer_role_hits=$(count_session_role_hits '"agent_role":"superpowers_(spec_reviewer|reviewer)"')
if [ "$implementer_role_hits" -ge 1 ] && [ "$reviewer_role_hits" -ge 2 ]; then
    echo "  [PASS] Found native implementer role ($implementer_role_hits) and native reviewer roles ($reviewer_role_hits)"
else
    echo "  [FAIL] Expected native implementer role and native reviewer roles in session metadata (implementer=$implementer_role_hits, reviewers=$reviewer_role_hits)"
    FAILED=$((FAILED + 1))
fi
echo ""

echo "Test 4: Turn completed with token usage..."
turn_completed_count=$(json_query 'map(select(.type == "turn.completed")) | length')
output_tokens=$(json_query 'map(select(.type == "turn.completed") | .usage.output_tokens) | last // 0')
if [ "$turn_completed_count" -ge 1 ] && [ "$output_tokens" -gt 0 ]; then
    echo "  [PASS] turn.completed present with output tokens ($output_tokens)"
else
    echo "  [FAIL] Missing turn.completed usage evidence"
    FAILED=$((FAILED + 1))
fi
echo ""

echo "Test 5: Persisted session created..."
if grep -q '"type":"task_complete"' "$SESSION_FILE" && grep -q '"last_agent_message":' "$SESSION_FILE"; then
    echo "  [PASS] Persisted session contains task completion evidence"
else
    echo "  [FAIL] Persisted session missing task completion evidence"
    FAILED=$((FAILED + 1))
fi
echo ""

echo "Test 6: Headless finishing path did not block..."
if rg -qi 'keeping the branch as-is|Keeping branch .*Worktree preserved|Non-interactive session detected' "$OUTPUT_FILE" "$SESSION_FILE"; then
    echo "  [PASS] Headless run reported keep-as-is completion"
else
    echo "  [FAIL] Missing keep-as-is completion evidence for headless run"
    FAILED=$((FAILED + 1))
fi
echo ""

echo "Test 7: Implementation files created..."
if [ -f "$TEST_PROJECT/src/math.js" ]; then
    echo "  [PASS] src/math.js created"
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

if [ -f "$TEST_PROJECT/src/math.js" ] && grep -Eq 'export function add' "$TEST_PROJECT/src/math.js"; then
    echo "  [PASS] add function exists"
else
    echo "  [FAIL] add function missing"
    FAILED=$((FAILED + 1))
fi

if [ -f "$TEST_PROJECT/src/math.js" ] && grep -Eq 'export function multiply' "$TEST_PROJECT/src/math.js"; then
    echo "  [PASS] multiply function exists"
else
    echo "  [FAIL] multiply function missing"
    FAILED=$((FAILED + 1))
fi

if [ -f "$TEST_PROJECT/src/math.js" ] && ! grep -Eiq 'function (divide|modulo|power)' "$TEST_PROJECT/src/math.js"; then
    echo "  [PASS] no extra math functions added"
else
    echo "  [FAIL] unexpected extra math function detected"
    FAILED=$((FAILED + 1))
fi
echo ""

echo "Test 8: Project tests pass..."
if cd "$TEST_PROJECT" && npm test > "$TEST_PROJECT/npm-test-output.txt" 2>&1; then
    echo "  [PASS] npm test passes"
else
    echo "  [FAIL] npm test failed"
    sed 's/^/    /' "$TEST_PROJECT/npm-test-output.txt"
    FAILED=$((FAILED + 1))
fi
echo ""

echo "Test 9: Git history shows work was committed..."
commit_count=$(git -C "$TEST_PROJECT" rev-list --count HEAD)
if [ "$commit_count" -ge 2 ]; then
    echo "  [PASS] Repository has additional commit(s) ($commit_count total)"
elif grep -Eiq 'index\.lock|read-only filesystem|read-only file system|commit blocked|\.codex-git' "$OUTPUT_FILE" "$SESSION_FILE"; then
    echo "  [PASS] Codex attempted commits, but `.git` writes were blocked by sandbox policy"
else
    echo "  [FAIL] No Codex-created commits or commit-blocker evidence detected"
    FAILED=$((FAILED + 1))
fi
echo ""

if [ "$FAILED" -eq 0 ]; then
    echo "========================================"
    echo " Integration Test Passed"
    echo "========================================"
    exit 0
fi

echo "========================================"
echo " Integration Test Failed ($FAILED checks)"
echo "========================================"
exit 1
