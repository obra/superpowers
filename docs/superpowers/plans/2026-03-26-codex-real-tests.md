# Codex Real Tests Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Codex-native test suite with fast and real integration tests that mirrors the practical coverage already available for Claude Code.

**Architecture:** Create a dedicated `tests/codex/` directory with isolated `HOME` and `CODEX_HOME` setup, a Claude-style test runner, one fast skill test, and two real integration tests driven by `codex exec --json`. The suite uses both live JSONL output and persisted session rollouts as evidence, and the documentation explicitly treats failures as discovery signals for future docs/skill/script adjustments.

**Tech Stack:** Bash, Git, Codex CLI, Node.js test fixtures, Markdown

**Spec:** `docs/superpowers/specs/2026-03-26-codex-real-tests-design.md`

---

## File Structure

| File | Responsibility | Action |
|---|---|---|
| `tests/codex/test-helpers.sh` | Isolated Codex environment setup and shared assertions | Create |
| `tests/codex/run-skill-tests.sh` | Codex test runner matching Claude Code workflow | Create |
| `tests/codex/test-subagent-driven-development.sh` | Fast Codex skill verification | Create |
| `tests/codex/test-subagent-driven-development-integration.sh` | Real `subagent-driven-development` execution test | Create |
| `tests/codex/test-document-review-system.sh` | Real document review execution test | Create |
| `tests/codex/README.md` | Codex test suite usage and troubleshooting | Create |
| `docs/testing.md` | Cross-platform testing documentation | Modify |

---

### Task 1: Create Shared Codex Test Helpers

**Files:**
- Create: `tests/codex/test-helpers.sh`

- [ ] **Step 1: Create the `tests/codex` directory**

Run:

```bash
mkdir -p tests/codex
```

Expected: `tests/codex/` exists.

- [ ] **Step 2: Write `tests/codex/test-helpers.sh`**

Create `tests/codex/test-helpers.sh` with this content:

```bash
#!/usr/bin/env bash
# Helper functions for Codex skill tests
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
ORIGINAL_CODEX_HOME="${CODEX_HOME:-$HOME/.codex}"

setup_codex_test_env() {
    export TEST_ROOT
    TEST_ROOT="$(mktemp -d)"
    export HOME="$TEST_ROOT/home"
    export CODEX_HOME="$TEST_ROOT/codex-home"

    mkdir -p "$HOME/.agents/skills" "$CODEX_HOME"
    ln -s "$REPO_ROOT/skills" "$HOME/.agents/skills/superpowers"

    if [ -f "$ORIGINAL_CODEX_HOME/auth.json" ]; then
        cp "$ORIGINAL_CODEX_HOME/auth.json" "$CODEX_HOME/auth.json"
    fi

    cat > "$CODEX_HOME/config.toml" <<'EOF'
[features]
multi_agent = true
EOF
}

cleanup_codex_test_env() {
    if [ -n "${TEST_ROOT:-}" ] && [ -d "$TEST_ROOT" ]; then
        rm -rf "$TEST_ROOT"
    fi
}

create_test_project() {
    mktemp -d
}

cleanup_test_project() {
    local test_dir="$1"
    if [ -d "$test_dir" ]; then
        rm -rf "$test_dir"
    fi
}

run_codex() {
    local prompt="$1"
    local project_dir="$2"
    local timeout_seconds="${3:-60}"
    local output_file
    output_file=$(mktemp)

    if timeout "$timeout_seconds" env HOME="$HOME" CODEX_HOME="$CODEX_HOME" codex exec \
        --skip-git-repo-check \
        -C "$project_dir" \
        -s workspace-write \
        "$prompt" > "$output_file" 2>&1; then
        cat "$output_file"
        rm -f "$output_file"
        return 0
    else
        local exit_code=$?
        cat "$output_file" >&2
        rm -f "$output_file"
        return "$exit_code"
    fi
}

run_codex_json_to_file() {
    local prompt="$1"
    local project_dir="$2"
    local output_file="$3"
    local timeout_seconds="${4:-1800}"

    timeout "$timeout_seconds" env HOME="$HOME" CODEX_HOME="$CODEX_HOME" codex exec \
        --json \
        --skip-git-repo-check \
        -C "$project_dir" \
        -s workspace-write \
        "$prompt" > "$output_file" 2>&1
}

latest_codex_session_file() {
    find "$CODEX_HOME/sessions" -name "*.jsonl" -type f 2>/dev/null | sort -r | head -1
}

assert_contains() {
    local output="$1"
    local pattern="$2"
    local test_name="${3:-test}"

    if echo "$output" | grep -Eq "$pattern"; then
        echo "  [PASS] $test_name"
        return 0
    else
        echo "  [FAIL] $test_name"
        echo "  Expected to find: $pattern"
        echo "  In output:"
        echo "$output" | sed 's/^/    /'
        return 1
    fi
}

assert_not_contains() {
    local output="$1"
    local pattern="$2"
    local test_name="${3:-test}"

    if echo "$output" | grep -Eq "$pattern"; then
        echo "  [FAIL] $test_name"
        echo "  Did not expect to find: $pattern"
        echo "  In output:"
        echo "$output" | sed 's/^/    /'
        return 1
    else
        echo "  [PASS] $test_name"
        return 0
    fi
}

assert_order() {
    local output="$1"
    local pattern_a="$2"
    local pattern_b="$3"
    local test_name="${4:-test}"

    local line_a
    local line_b
    line_a=$(echo "$output" | grep -En "$pattern_a" | head -1 | cut -d: -f1 || true)
    line_b=$(echo "$output" | grep -En "$pattern_b" | head -1 | cut -d: -f1 || true)

    if [ -z "$line_a" ]; then
        echo "  [FAIL] $test_name: pattern A not found: $pattern_a"
        return 1
    fi

    if [ -z "$line_b" ]; then
        echo "  [FAIL] $test_name: pattern B not found: $pattern_b"
        return 1
    fi

    if [ "$line_a" -lt "$line_b" ]; then
        echo "  [PASS] $test_name (A at line $line_a, B at line $line_b)"
        return 0
    else
        echo "  [FAIL] $test_name"
        echo "  Expected '$pattern_a' before '$pattern_b'"
        echo "  But found A at line $line_a, B at line $line_b"
        return 1
    fi
}

export -f setup_codex_test_env
export -f cleanup_codex_test_env
export -f create_test_project
export -f cleanup_test_project
export -f run_codex
export -f run_codex_json_to_file
export -f latest_codex_session_file
export -f assert_contains
export -f assert_not_contains
export -f assert_order
export REPO_ROOT
```

- [ ] **Step 3: Verify shell syntax**

Run:

```bash
bash -n tests/codex/test-helpers.sh
```

Expected: no output, exit code `0`.

- [ ] **Step 4: Commit**

```bash
git add tests/codex/test-helpers.sh
git commit -m "test(codex): add shared test helpers"
```

---

### Task 2: Add the Codex Runner and README

**Files:**
- Create: `tests/codex/run-skill-tests.sh`
- Create: `tests/codex/README.md`

- [ ] **Step 1: Write `tests/codex/run-skill-tests.sh`**

Create `tests/codex/run-skill-tests.sh` with this content:

```bash
#!/usr/bin/env bash
# Test runner for Codex skills
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

echo "========================================"
echo " Codex Skills Test Suite"
echo "========================================"
echo ""
echo "Repository: $(cd ../.. && pwd)"
echo "Test time: $(date)"
echo "Codex version: $(codex --version 2>/dev/null || echo 'not found')"
echo ""

if ! command -v codex &> /dev/null; then
    echo "ERROR: Codex CLI not found"
    echo "Install Codex first: https://developers.openai.com/codex/"
    exit 1
fi

VERBOSE=false
SPECIFIC_TEST=""
TIMEOUT=300
RUN_INTEGRATION=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --verbose|-v)
            VERBOSE=true
            shift
            ;;
        --test|-t)
            SPECIFIC_TEST="$2"
            shift 2
            ;;
        --timeout)
            TIMEOUT="$2"
            shift 2
            ;;
        --integration|-i)
            RUN_INTEGRATION=true
            shift
            ;;
        --help|-h)
            echo "Usage: $0 [options]"
            echo ""
            echo "Options:"
            echo "  --verbose, -v        Show verbose output"
            echo "  --test, -t NAME      Run only the specified test"
            echo "  --timeout SECONDS    Set timeout per test (default: 300)"
            echo "  --integration, -i    Run integration tests (slow, 10-30 min)"
            echo "  --help, -h           Show this help"
            echo ""
            echo "Tests:"
            echo "  test-subagent-driven-development.sh  Test skill loading and requirements"
            echo ""
            echo "Integration Tests (use --integration):"
            echo "  test-subagent-driven-development-integration.sh  Full workflow execution"
            echo "  test-document-review-system.sh                Real document review behavior"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

tests=(
    "test-subagent-driven-development.sh"
)

integration_tests=(
    "test-subagent-driven-development-integration.sh"
    "test-document-review-system.sh"
)

if [ "$RUN_INTEGRATION" = true ]; then
    tests+=("${integration_tests[@]}")
fi

if [ -n "$SPECIFIC_TEST" ]; then
    tests=("$SPECIFIC_TEST")
fi

passed=0
failed=0
skipped=0

for test in "${tests[@]}"; do
    echo "----------------------------------------"
    echo "Running: $test"
    echo "----------------------------------------"

    test_path="$SCRIPT_DIR/$test"

    if [ ! -f "$test_path" ]; then
        echo "  [SKIP] Test file not found: $test"
        skipped=$((skipped + 1))
        continue
    fi

    if [ ! -x "$test_path" ]; then
        chmod +x "$test_path"
    fi

    start_time=$(date +%s)

    if [ "$VERBOSE" = true ]; then
        if timeout "$TIMEOUT" bash "$test_path"; then
            end_time=$(date +%s)
            duration=$((end_time - start_time))
            echo ""
            echo "  [PASS] $test (${duration}s)"
            passed=$((passed + 1))
        else
            exit_code=$?
            end_time=$(date +%s)
            duration=$((end_time - start_time))
            echo ""
            if [ $exit_code -eq 124 ]; then
                echo "  [FAIL] $test (timeout after ${TIMEOUT}s)"
            else
                echo "  [FAIL] $test (${duration}s)"
            fi
            failed=$((failed + 1))
        fi
    else
        if output=$(timeout "$TIMEOUT" bash "$test_path" 2>&1); then
            end_time=$(date +%s)
            duration=$((end_time - start_time))
            echo "  [PASS] (${duration}s)"
            passed=$((passed + 1))
        else
            exit_code=$?
            end_time=$(date +%s)
            duration=$((end_time - start_time))
            if [ $exit_code -eq 124 ]; then
                echo "  [FAIL] (timeout after ${TIMEOUT}s)"
            else
                echo "  [FAIL] (${duration}s)"
            fi
            echo ""
            echo "  Output:"
            echo "$output" | sed 's/^/    /'
            failed=$((failed + 1))
        fi
    fi

    echo ""
done

echo "========================================"
echo " Test Results Summary"
echo "========================================"
echo ""
echo "  Passed:  $passed"
echo "  Failed:  $failed"
echo "  Skipped: $skipped"
echo ""

if [ "$RUN_INTEGRATION" = false ] && [ ${#integration_tests[@]} -gt 0 ]; then
    echo "Note: Integration tests were not run (they take 10-30 minutes)."
    echo "Use --integration flag to run full workflow execution tests."
    echo ""
fi

if [ $failed -gt 0 ]; then
    echo "STATUS: FAILED"
    exit 1
else
    echo "STATUS: PASSED"
    exit 0
fi
```

- [ ] **Step 2: Write `tests/codex/README.md`**

Create `tests/codex/README.md` with this content:

```markdown
# Codex Skills Tests

Automated tests for superpowers skills using the Codex CLI.

## Overview

This suite mirrors the Claude Code testing strategy:

- fast tests run by default
- slow, real integration tests run only with `--integration`

The tests run Codex in an isolated environment with temporary `HOME` and
`CODEX_HOME`, copy `auth.json` from the original Codex home when present, then
install the repository's `skills/` directory into
`$HOME/.agents/skills/superpowers`.

## Requirements

- Codex CLI installed and authenticated
- Node.js available for the integration fixture project
- Run from the repository root or from `tests/codex/`

## Running Tests

### Run fast tests

```bash
./tests/codex/run-skill-tests.sh
```

### Run integration tests

```bash
./tests/codex/run-skill-tests.sh --integration --timeout 1800
```

### Run one test

```bash
./tests/codex/run-skill-tests.sh --test test-document-review-system.sh --integration
```

## Evidence Sources

Codex integration tests use two evidence sources:

1. `codex exec --json` output captured during the test
2. Session rollout files written to `$CODEX_HOME/sessions`

Structured JSON events are preferred for workflow assertions:

- `todo_list` indicates `update_plan`
- `collab_tool_call` indicates subagent activity
- `turn.completed` indicates a real completed agent turn

## Using Failures as Signals

These tests are meant to reveal mismatches, not hide them.

If a Codex test fails because behavior differs from the current docs,
skills, or supporting scripts:

- inspect the JSON output and session rollout first
- decide whether the test is wrong or the repository assumptions are stale
- use the failure as evidence for a targeted follow-up change

Do not weaken assertions without evidence from the trace.

## Troubleshooting

### Codex not found

Verify:

```bash
codex --version
```

### Authentication issues

Verify:

```bash
codex exec --skip-git-repo-check -C /tmp "Reply with exactly OK."
```

### Session file not found

Because each test uses an isolated `CODEX_HOME`, look under the temporary
`$CODEX_HOME/sessions` created during that test run rather than your real
`~/.codex/sessions`. Authentication still works because the helper copies the
original `auth.json` into the temporary Codex home when available.
```

- [ ] **Step 3: Verify shell syntax and docs presence**

Run:

```bash
bash -n tests/codex/run-skill-tests.sh
chmod +x tests/codex/run-skill-tests.sh
test -f tests/codex/README.md
```

Expected: no output from `bash -n`, `chmod +x` succeeds, and `test -f` exits `0`.

- [ ] **Step 4: Commit**

```bash
git add tests/codex/run-skill-tests.sh tests/codex/README.md
git commit -m "test(codex): add runner and usage docs"
```

---

### Task 3: Add the Fast Codex Skill Test

**Files:**
- Create: `tests/codex/test-subagent-driven-development.sh`
- Test: `tests/codex/run-skill-tests.sh`

- [ ] **Step 1: Write `tests/codex/test-subagent-driven-development.sh`**

Create `tests/codex/test-subagent-driven-development.sh` with this content:

```bash
#!/usr/bin/env bash
# Test: subagent-driven-development skill
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/test-helpers.sh"

echo "=== Test: subagent-driven-development skill ==="
echo ""

setup_codex_test_env
TEST_PROJECT=$(create_test_project)
trap 'cleanup_test_project "$TEST_PROJECT"; cleanup_codex_test_env' EXIT

echo "Test 1: Skill loading..."
output=$(run_codex "What is the subagent-driven-development skill? Describe its key steps briefly." "$TEST_PROJECT" 60)

assert_contains "$output" "subagent-driven-development|Subagent-Driven Development|Subagent Driven" "Skill is recognized" || exit 1
assert_contains "$output" "Load Plan|read.*plan|extract.*tasks" "Mentions loading plan" || exit 1

echo ""
echo "Test 2: Workflow ordering..."
output=$(run_codex "In the subagent-driven-development skill, what comes first: spec compliance review or code quality review? Be specific about the order." "$TEST_PROJECT" 60)
assert_order "$output" "spec.*compliance" "code.*quality" "Spec compliance before code quality" || exit 1

echo ""
echo "Test 3: Self-review requirement..."
output=$(run_codex "Does the subagent-driven-development skill require implementers to do self-review? What should they check?" "$TEST_PROJECT" 60)
assert_contains "$output" "self-review|self review" "Mentions self-review" || exit 1
assert_contains "$output" "completeness|Completeness" "Checks completeness" || exit 1

echo ""
echo "Test 4: Plan reading efficiency..."
output=$(run_codex "In subagent-driven-development, how many times should the controller read the plan file? When does this happen?" "$TEST_PROJECT" 60)
assert_contains "$output" "once|one time|single" "Read plan once" || exit 1
assert_contains "$output" "beginning|start|Load Plan|Step 1" "Read at beginning" || exit 1

echo ""
echo "Test 5: Spec compliance reviewer mindset..."
output=$(run_codex "What is the spec compliance reviewer's attitude toward the implementer's report in subagent-driven-development?" "$TEST_PROJECT" 60)
assert_contains "$output" "not trust|don't trust|skeptical|verify.*independently|suspiciously" "Reviewer is skeptical" || exit 1
assert_contains "$output" "read.*code|inspect.*code|verify.*code" "Reviewer reads code" || exit 1

echo ""
echo "Test 6: Review loop requirements..."
output=$(run_codex "In subagent-driven-development, what happens if a reviewer finds issues? Is it a one-time review or a loop?" "$TEST_PROJECT" 60)
assert_contains "$output" "loop|again|repeat|until.*approved|until.*compliant" "Review loops mentioned" || exit 1
assert_contains "$output" "implementer.*fix|fix.*issues" "Implementer fixes issues" || exit 1

echo ""
echo "Test 7: Task context provision..."
output=$(run_codex "In subagent-driven-development, how does the controller provide task information to the implementer subagent? Does it make them read a file or provide it directly?" "$TEST_PROJECT" 60)
assert_contains "$output" "provide.*directly|full.*text|paste|include.*prompt" "Provides text directly" || exit 1
assert_not_contains "$output" "read.*file|open.*file" "Doesn't make subagent read file" || exit 1

echo ""
echo "Test 8: Worktree requirement..."
output=$(run_codex "What workflow skills are required before using subagent-driven-development? List any prerequisites or required skills." "$TEST_PROJECT" 60)
assert_contains "$output" "using-git-worktrees|worktree" "Mentions worktree requirement" || exit 1

echo ""
echo "Test 9: Main branch red flag..."
output=$(run_codex "In subagent-driven-development, is it okay to start implementation directly on the main branch?" "$TEST_PROJECT" 60)
assert_contains "$output" "worktree|feature.*branch|not.*main|never.*main|avoid.*main|don't.*main|consent|permission" "Warns against main branch" || exit 1

echo ""
echo "=== All subagent-driven-development skill tests passed ==="
```

- [ ] **Step 2: Verify shell syntax**

Run:

```bash
bash -n tests/codex/test-subagent-driven-development.sh
chmod +x tests/codex/test-subagent-driven-development.sh
```

Expected: no output from `bash -n`, and `chmod +x` succeeds.

- [ ] **Step 3: Run the fast Codex test**

Run:

```bash
tests/codex/run-skill-tests.sh --test test-subagent-driven-development.sh --timeout 300
```

Expected: the runner reports `STATUS: PASSED`.

- [ ] **Step 4: Commit**

```bash
git add tests/codex/test-subagent-driven-development.sh
git commit -m "test(codex): add fast subagent-driven-development test"
```

---

### Task 4: Add the Real `subagent-driven-development` Integration Test

**Files:**
- Create: `tests/codex/test-subagent-driven-development-integration.sh`
- Test: `tests/codex/run-skill-tests.sh`

- [ ] **Step 1: Write `tests/codex/test-subagent-driven-development-integration.sh`**

Create `tests/codex/test-subagent-driven-development-integration.sh` with this content:

```bash
#!/usr/bin/env bash
# Integration Test: subagent-driven-development workflow
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/test-helpers.sh"

echo "========================================"
echo " Integration Test: subagent-driven-development"
echo "========================================"
echo ""
echo "This test executes a real plan using Codex and verifies:"
echo "  1. Todo tracking is used"
echo "  2. Subagents are dispatched"
echo "  3. Implementation files are created"
echo "  4. Tests pass"
echo "  5. A real turn completes with token usage"
echo ""

setup_codex_test_env
TEST_PROJECT=$(create_test_project)
trap 'cleanup_test_project "$TEST_PROJECT"; cleanup_codex_test_env' EXIT

echo "Test project: $TEST_PROJECT"

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

cat > docs/superpowers/plans/implementation-plan.md <<'EOF'
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

git init --quiet
git config user.email "test@test.com"
git config user.name "Test User"
git add .
git commit -m "Initial commit" --quiet

OUTPUT_FILE="$TEST_PROJECT/codex-output.jsonl"
TRACE_FILE="$TEST_PROJECT/codex-trace.jsonl"

PROMPT="Execute the implementation plan at docs/superpowers/plans/implementation-plan.md using the subagent-driven-development skill.

IMPORTANT: Follow the skill exactly. I will be verifying that you:
1. Use task tracking
2. Dispatch subagents
3. Create the requested implementation and tests
4. Finish with passing tests

Begin now. Execute the plan."

echo ""
echo "Running Codex..."
echo "================================================================================"
run_codex_json_to_file "$PROMPT" "$TEST_PROJECT" "$OUTPUT_FILE" 1800 || {
    echo "================================================================================"
    echo "EXECUTION FAILED"
    exit 1
}
cat "$OUTPUT_FILE"
echo "================================================================================"

SESSION_FILE=$(latest_codex_session_file)
if [ -z "$SESSION_FILE" ]; then
    echo "ERROR: Could not find Codex session rollout"
    exit 1
fi

cat "$OUTPUT_FILE" "$SESSION_FILE" > "$TRACE_FILE"

FAILED=0

echo ""
echo "=== Verification Tests ==="
echo ""

echo "Test 1: Task tracking..."
if grep -q '"type":"todo_list"' "$TRACE_FILE"; then
    echo "  [PASS] Found todo_list event"
else
    echo "  [FAIL] Did not find todo_list event"
    FAILED=$((FAILED + 1))
fi
echo ""

echo "Test 2: Subagents dispatched..."
if grep -q '"type":"collab_tool_call".*"tool":"spawn_agent"' "$TRACE_FILE"; then
    echo "  [PASS] Found spawn_agent collab tool call"
else
    echo "  [FAIL] Did not find spawn_agent collab tool call"
    FAILED=$((FAILED + 1))
fi
echo ""

echo "Test 3: Implementation files..."
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
echo ""

echo "Test 4: Tests pass..."
if cd "$TEST_PROJECT" && npm test > test-output.txt 2>&1; then
    echo "  [PASS] Tests pass"
else
    echo "  [FAIL] Tests failed"
    cat "$TEST_PROJECT/test-output.txt"
    FAILED=$((FAILED + 1))
fi
echo ""

echo "Test 5: Real turn completed..."
if grep -q '"type":"turn.completed"' "$OUTPUT_FILE" && grep -q '"input_tokens":' "$OUTPUT_FILE"; then
    echo "  [PASS] Found turn.completed usage"
else
    echo "  [FAIL] Missing turn.completed usage"
    FAILED=$((FAILED + 1))
fi
echo ""

if [ $FAILED -eq 0 ]; then
    echo "STATUS: PASSED"
    exit 0
else
    echo "STATUS: FAILED"
    exit 1
fi
```

- [ ] **Step 2: Verify shell syntax**

Run:

```bash
bash -n tests/codex/test-subagent-driven-development-integration.sh
chmod +x tests/codex/test-subagent-driven-development-integration.sh
```

Expected: no output from `bash -n`, and `chmod +x` succeeds.

- [ ] **Step 3: Run the real workflow test**

Run:

```bash
tests/codex/run-skill-tests.sh --integration --test test-subagent-driven-development-integration.sh --timeout 1800
```

Expected: the runner reports `STATUS: PASSED`.

- [ ] **Step 4: Commit**

```bash
git add tests/codex/test-subagent-driven-development-integration.sh
git commit -m "test(codex): add real subagent workflow integration test"
```

---

### Task 5: Add the Real Document Review Test

**Files:**
- Create: `tests/codex/test-document-review-system.sh`
- Test: `tests/codex/run-skill-tests.sh`

- [ ] **Step 1: Write `tests/codex/test-document-review-system.sh`**

Create `tests/codex/test-document-review-system.sh` with this content:

```bash
#!/usr/bin/env bash
# Integration Test: Document Review System
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/test-helpers.sh"

echo "========================================"
echo " Integration Test: Document Review System"
echo "========================================"
echo ""
echo "This test verifies that Codex reviews a spec with intentional errors."
echo ""

setup_codex_test_env
TEST_PROJECT=$(create_test_project)
trap 'cleanup_test_project "$TEST_PROJECT"; cleanup_codex_test_env' EXIT

echo "Test project: $TEST_PROJECT"

cd "$TEST_PROJECT"
mkdir -p docs/superpowers/specs

cat > docs/superpowers/specs/test-feature-design.md <<'EOF'
# Test Feature Design

## Overview

This is a test feature that does something useful.

## Requirements

1. The feature should work correctly
2. It should be fast
3. TODO: Add more requirements here

## Architecture

The feature will use a simple architecture with:
- A frontend component
- A backend service
- Error handling will be specified later once we understand the failure modes better

## Data Flow

Data flows from the frontend to the backend.

## Testing Strategy

Tests will be written to cover the main functionality.
EOF

git init --quiet
git config user.email "test@test.com"
git config user.name "Test User"
git add .
git commit -m "Initial commit with test spec" --quiet

PROMPT="You are testing the spec document reviewer.

Read the spec-document-reviewer-prompt.md template in skills/brainstorming/ to understand the review format.

Then review the spec at docs/superpowers/specs/test-feature-design.md using the criteria from that template.

Look for:
- TODOs, placeholders, TBDs, incomplete sections
- sections saying content will be defined later
- sections noticeably less detailed than others

Output your review in the format specified in the template."

OUTPUT=$(run_codex "$PROMPT" "$TEST_PROJECT" 300) || {
    echo "EXECUTION FAILED"
    exit 1
}

FAILED=0

echo ""
echo "=== Verification Tests ==="
echo ""

echo "Test 1: Reviewer found TODO..."
if echo "$OUTPUT" | grep -Eqi "TODO" && echo "$OUTPUT" | grep -Eqi "requirements|Requirements"; then
    echo "  [PASS] Reviewer identified TODO in Requirements section"
else
    echo "  [FAIL] Reviewer did not identify TODO"
    FAILED=$((FAILED + 1))
fi
echo ""

echo "Test 2: Reviewer found deferred content..."
if echo "$OUTPUT" | grep -Eqi "specified later|later|defer|incomplete|error handling"; then
    echo "  [PASS] Reviewer identified deferred content"
else
    echo "  [FAIL] Reviewer did not identify deferred content"
    FAILED=$((FAILED + 1))
fi
echo ""

echo "Test 3: Review output format..."
if echo "$OUTPUT" | grep -Eqi "issues|Issues"; then
    echo "  [PASS] Review includes Issues section"
else
    echo "  [FAIL] Review missing Issues section"
    FAILED=$((FAILED + 1))
fi
echo ""

echo "Test 4: Reviewer verdict..."
if echo "$OUTPUT" | grep -Eqi "Issues Found|not approved|issues found|fail"; then
    echo "  [PASS] Reviewer correctly found issues"
elif echo "$OUTPUT" | grep -Eqi "Approved" && ! echo "$OUTPUT" | grep -Eqi "Issues Found|not approved"; then
    echo "  [FAIL] Reviewer incorrectly approved spec with errors"
    FAILED=$((FAILED + 1))
else
    echo "  [PASS] Reviewer identified problems"
fi
echo ""

if [ $FAILED -eq 0 ]; then
    echo "STATUS: PASSED"
    exit 0
else
    echo "STATUS: FAILED"
    exit 1
fi
```

- [ ] **Step 2: Verify shell syntax**

Run:

```bash
bash -n tests/codex/test-document-review-system.sh
chmod +x tests/codex/test-document-review-system.sh
```

Expected: no output from `bash -n`, and `chmod +x` succeeds.

- [ ] **Step 3: Run the review integration test**

Run:

```bash
tests/codex/run-skill-tests.sh --integration --test test-document-review-system.sh --timeout 600
```

Expected: the runner reports `STATUS: PASSED`.

- [ ] **Step 4: Commit**

```bash
git add tests/codex/test-document-review-system.sh
git commit -m "test(codex): add document review integration test"
```

---

### Task 6: Document the Codex Test Suite and Failure-Reconciliation Workflow

**Files:**
- Modify: `docs/testing.md`

- [ ] **Step 1: Append a Codex section to `docs/testing.md`**

Append this section to the end of `docs/testing.md`:

```markdown
## Codex Tests

### Overview

Codex tests mirror the Claude Code strategy:

- fast tests run by default
- real integration tests run only with `--integration`

Unlike Claude Code, Codex integration tests use two evidence sources:

1. `codex exec --json` output captured during the test
2. Session rollout files stored in `$CODEX_HOME/sessions`

### Running Codex Tests

```bash
./tests/codex/run-skill-tests.sh
./tests/codex/run-skill-tests.sh --integration --timeout 1800
./tests/codex/run-skill-tests.sh --test test-document-review-system.sh --integration
```

### Isolation Model

Each test creates an isolated `HOME` and `CODEX_HOME`, then installs the
repository's `skills/` directory into:

```bash
$HOME/.agents/skills/superpowers
```

The helper also copies `auth.json` from the original `CODEX_HOME` when present
so the isolated environment can still run real authenticated sessions.

This keeps the tests hermetic and prevents contamination of a developer's real
Codex state.

### Structured Assertions

Codex tests should prefer structured workflow signals when available:

- `todo_list` -> `update_plan`
- `collab_tool_call` with `spawn_agent` -> subagent activity
- `turn.completed` with usage -> real completed turn

Use plain text assertions only when the behavior under test is inherently
linguistic, such as review findings.

### Using Failures as Signals

These tests are intended to reveal mismatches between Codex behavior and the
repository's current assumptions.

If a test fails:

1. Inspect the `codex exec --json` trace
2. Inspect the session rollout under `$CODEX_HOME/sessions`
3. Decide whether the failure points to:
   - a broken test
   - stale documentation
   - a skill or support script that needs adjustment

Do not weaken an assertion without evidence from those traces.
```

- [ ] **Step 2: Verify the docs now mention Codex**

Run:

```bash
rg -n "## Codex Tests|codex exec --json|Using Failures as Signals" docs/testing.md
```

Expected: three matches in the new Codex section.

- [ ] **Step 3: Run the fast suite and a full integration sweep**

Run:

```bash
tests/codex/run-skill-tests.sh
tests/codex/run-skill-tests.sh --integration --timeout 1800
```

Expected:

- fast suite reports `STATUS: PASSED`
- integration suite reports `STATUS: PASSED`
- if a failure appears, keep the failing trace and use it as evidence for follow-up changes in docs, skills, or scripts rather than weakening the test immediately

- [ ] **Step 4: Commit**

```bash
git add docs/testing.md
git commit -m "docs(testing): add Codex suite guidance"
```
