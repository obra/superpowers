#!/usr/bin/env bash
# Helper functions for Claude Code skill tests

# Resolve plugin directory (repo root)
PLUGIN_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

# Run Claude Code with a prompt and store result in CLAUDE_OUTPUT.
# claude -p hangs when stdout is captured via $() subshells (no TTY),
# so this writes to a temp file and reads it back into a variable.
# Usage: run_claude "prompt text" [timeout_seconds] [allowed_tools]
#   Result is stored in global CLAUDE_OUTPUT variable.
CLAUDE_OUTPUT=""
run_claude() {
    local prompt="$1"
    local timeout="${2:-60}"
    local allowed_tools="${3:-}"
    local output_file=$(mktemp)
    CLAUDE_OUTPUT=""

    # Build command as array to avoid bash -c quoting issues
    # --max-turns limits tool invocations to prevent infinite skill-loading loops
    local -a cmd_args=(-p "$prompt" --plugin-dir "$PLUGIN_DIR" --max-turns 10)
    if [ -n "$allowed_tools" ]; then
        cmd_args+=(--allowed-tools="$allowed_tools")
    fi

    # Run Claude in headless mode with timeout
    # Unset CLAUDECODE to allow nested invocations when tests are run from within Claude Code
    # < /dev/null prevents claude from blocking on stdin in non-interactive scripts
    # Always return 0 so set -e doesn't abort the test script.
    # Tests check CLAUDE_OUTPUT content, not exit codes.
    # Retry once on empty response (handles transient API/rate-limit failures).
    local attempts=0
    while [ $attempts -lt 2 ]; do
        timeout "$timeout" env -u CLAUDECODE claude "${cmd_args[@]}" < /dev/null > "$output_file" 2>&1 || true
        CLAUDE_OUTPUT=$(cat "$output_file")
        if [ -n "$CLAUDE_OUTPUT" ] && [ "$CLAUDE_OUTPUT" != " " ]; then
            break
        fi
        attempts=$((attempts + 1))
        if [ $attempts -lt 2 ]; then
            echo "  (empty response, retrying...)"
            sleep 2
        fi
    done
    rm -f "$output_file"
    return 0
}

# Check if output contains a pattern
# Usage: assert_contains "output" "pattern" "test name"
assert_contains() {
    local output="$1"
    local pattern="$2"
    local test_name="${3:-test}"

    if [ -z "$output" ] || [ "$output" = " " ]; then
        echo "  [FAIL] $test_name (empty response from Claude)"
        return 1
    fi

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
# Returns the REAL (symlink-resolved) path, which is what Claude Code uses
# for session storage (e.g. macOS /var/folders → /private/var/folders).
# Usage: test_project=$(create_test_project)
create_test_project() {
    local test_dir=$(mktemp -d)
    # Resolve symlinks so session path computation matches Claude Code's behavior
    cd "$test_dir" && pwd -P
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

# Note: functions are available when test scripts source this file.
# CLAUDE_OUTPUT global is set by run_claude - do not capture via $().
