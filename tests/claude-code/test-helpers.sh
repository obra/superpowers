#!/usr/bin/env bash
# Helper functions for Claude Code skill tests

# Run Claude Code with a prompt and capture output
# Usage: run_claude "prompt text" [timeout_seconds] [allowed_tools]
run_claude() {
    local prompt="$1"
    local timeout="${2:-60}"
    local allowed_tools="${3:-}"
    local output_file=$(mktemp)

    # Build command
    local cmd="claude -p \"$prompt\""
    if [ -n "$allowed_tools" ]; then
        cmd="$cmd --allowed-tools=$allowed_tools"
    fi

    # Run Claude in headless mode with timeout
    if timeout "$timeout" bash -c "$cmd" > "$output_file" 2>&1; then
        cat "$output_file"
        rm -f "$output_file"
        return 0
    else
        local exit_code=$?
        cat "$output_file" >&2
        rm -f "$output_file"
        return $exit_code
    fi
}

# Check if output contains a pattern
# Usage: assert_contains "output" "pattern" "test name"
assert_contains() {
    local output="$1"
    local pattern="$2"
    local test_name="${3:-test}"

    if echo "$output" | grep -q "$pattern"; then
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

# Check if output does NOT contain a pattern
# Usage: assert_not_contains "output" "pattern" "test name"
assert_not_contains() {
    local output="$1"
    local pattern="$2"
    local test_name="${3:-test}"

    if echo "$output" | grep -q "$pattern"; then
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

# Check if output matches a count
# Usage: assert_count "output" "pattern" expected_count "test name"
assert_count() {
    local output="$1"
    local pattern="$2"
    local expected="$3"
    local test_name="${4:-test}"

    local actual=$(echo "$output" | grep -c "$pattern" || echo "0")

    if [ "$actual" -eq "$expected" ]; then
        echo "  [PASS] $test_name (found $actual instances)"
        return 0
    else
        echo "  [FAIL] $test_name"
        echo "  Expected $expected instances of: $pattern"
        echo "  Found $actual instances"
        echo "  In output:"
        echo "$output" | sed 's/^/    /'
        return 1
    fi
}

# Check if pattern A appears before pattern B
# Usage: assert_order "output" "pattern_a" "pattern_b" "test name"
assert_order() {
    local output="$1"
    local pattern_a="$2"
    local pattern_b="$3"
    local test_name="${4:-test}"

    # Get line numbers where patterns appear
    local line_a=$(echo "$output" | grep -n "$pattern_a" | head -1 | cut -d: -f1)
    local line_b=$(echo "$output" | grep -n "$pattern_b" | head -1 | cut -d: -f1)

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

# Create a temporary test project directory
# Usage: test_project=$(create_test_project)
create_test_project() {
    local test_dir=$(mktemp -d)
    echo "$test_dir"
}

# Cleanup test project
# Usage: cleanup_test_project "$test_dir"
cleanup_test_project() {
    local test_dir="$1"
    if [ -d "$test_dir" ]; then
        rm -rf "$test_dir"
    fi
}

# Create a simple plan file for testing
# Usage: create_test_plan "$project_dir" "$plan_name"
create_test_plan() {
    local project_dir="$1"
    local plan_name="${2:-test-plan}"
    local plan_file="$project_dir/docs/plans/$plan_name.md"

    mkdir -p "$(dirname "$plan_file")"

    cat > "$plan_file" <<'EOF'
# Test Implementation Plan

## Task 1: Create Hello Function

Create a simple hello function that returns "Hello, World!".

**File:** `src/hello.js`

**Implementation:**
```javascript
export function hello() {
  return "Hello, World!";
}
```

**Tests:** Write a test that verifies the function returns the expected string.

**Verification:** `npm test`

## Task 2: Create Goodbye Function

Create a goodbye function that takes a name and returns a goodbye message.

**File:** `src/goodbye.js`

**Implementation:**
```javascript
export function goodbye(name) {
  return `Goodbye, ${name}!`;
}
```

**Tests:** Write tests for:
- Default name
- Custom name
- Edge cases (empty string, null)

**Verification:** `npm test`
EOF

    echo "$plan_file"
}

# Check if a file exists
# Usage: assert_file_exists "/path" "test name"
assert_file_exists() {
    local file="$1"
    local test_name="${2:-test}"
    if [ -f "$file" ]; then
        echo "  [PASS] $test_name"
        return 0
    else
        echo "  [FAIL] $test_name"
        echo "  Missing file: $file"
        return 1
    fi
}

# Check if file contains a pattern
# Usage: assert_file_contains "/path" "pattern" "test name"
assert_file_contains() {
    local file="$1"
    local pattern="$2"
    local test_name="${3:-test}"
    if grep -q "$pattern" "$file"; then
        echo "  [PASS] $test_name"
        return 0
    else
        echo "  [FAIL] $test_name"
        echo "  Expected to find: $pattern"
        echo "  In file: $file"
        return 1
    fi
}

# Validate JSON string
# Usage: assert_valid_json "{...}" "test name"
assert_valid_json() {
    local json="$1"
    local test_name="${2:-test}"
    if echo "$json" | python3 -c 'import json, sys; json.load(sys.stdin)' 2>/dev/null; then
        echo "  [PASS] $test_name"
        return 0
    else
        echo "  [FAIL] $test_name"
        echo "  Invalid JSON"
        return 1
    fi
}

# Extract Ralph status block from output
# Usage: extract_ralph_status "output"
extract_ralph_status() {
    echo "$1" | sed -n '/---RALPH_STATUS---/,/---END_RALPH_STATUS---/p'
}

# Verify Ralph status block fields and enums
# Usage: verify_ralph_status_block "status_block" "test name"
verify_ralph_status_block() {
    local status="$1"
    local test_name="${2:-test}"

    echo "$status" | grep -q "STATUS: " || { echo "  [FAIL] $test_name (missing STATUS)"; return 1; }
    echo "$status" | grep -q "TASKS_COMPLETED_THIS_LOOP: " || { echo "  [FAIL] $test_name (missing TASKS_COMPLETED_THIS_LOOP)"; return 1; }
    echo "$status" | grep -q "FILES_MODIFIED: " || { echo "  [FAIL] $test_name (missing FILES_MODIFIED)"; return 1; }
    echo "$status" | grep -q "TESTS_STATUS: " || { echo "  [FAIL] $test_name (missing TESTS_STATUS)"; return 1; }
    echo "$status" | grep -q "WORK_TYPE: " || { echo "  [FAIL] $test_name (missing WORK_TYPE)"; return 1; }
    echo "$status" | grep -q "EXIT_SIGNAL: " || { echo "  [FAIL] $test_name (missing EXIT_SIGNAL)"; return 1; }
    echo "$status" | grep -q "RECOMMENDATION: " || { echo "  [FAIL] $test_name (missing RECOMMENDATION)"; return 1; }

    echo "$status" | grep -Eq "STATUS: (IN_PROGRESS|COMPLETE|BLOCKED)" || { echo "  [FAIL] $test_name (bad STATUS)"; return 1; }
    echo "$status" | grep -Eq "TESTS_STATUS: (PASSING|FAILING|NOT_RUN)" || { echo "  [FAIL] $test_name (bad TESTS_STATUS)"; return 1; }
    echo "$status" | grep -Eq "WORK_TYPE: (IMPLEMENTATION|TESTING|DOCUMENTATION|REFACTORING)" || { echo "  [FAIL] $test_name (bad WORK_TYPE)"; return 1; }
    echo "$status" | grep -Eq "EXIT_SIGNAL: (true|false)" || { echo "  [FAIL] $test_name (bad EXIT_SIGNAL)"; return 1; }

    echo "  [PASS] $test_name"
}

# Export functions for use in tests
export -f run_claude
export -f assert_contains
export -f assert_not_contains
export -f assert_count
export -f assert_order
export -f assert_file_exists
export -f assert_file_contains
export -f assert_valid_json
export -f extract_ralph_status
export -f verify_ralph_status_block
export -f create_test_project
export -f cleanup_test_project
export -f create_test_plan
