#!/usr/bin/env bash
# Helper functions for Claude Code skill tests

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Run Claude Code with a prompt and capture output
# Usage: run_claude "prompt text" [timeout_seconds] [allowed_tools]
run_claude() {
    local prompt="$1"
    local timeout="${2:-60}"
    local allowed_tools="${3:-}"
    local output_file=$(mktemp)
    local -a cmd=("claude" "-p" "$prompt" "--add-dir" "$REPO_ROOT")

    if [ -n "$allowed_tools" ]; then
        cmd+=("--allowed-tools=$allowed_tools")
    fi

    # Run Claude in headless mode with timeout
    if (
        cd "$REPO_ROOT"
        timeout "$timeout" "${cmd[@]}"
    ) > "$output_file" 2>&1; then
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

assert_semantic_judgment() {
    local source_text="$1"
    local question="$2"
    local answer="$3"
    local rubric="$4"
    local test_name="${5:-semantic judgment}"
    local timeout_seconds="${6:-90}"
    local evaluator_output
    local parse_errors_file
    local failed_criteria
    local reason
    local prompt

    if ! command -v jq >/dev/null 2>&1; then
        echo "  [FAIL] $test_name: jq is required for semantic evaluation"
        return 1
    fi

    parse_errors_file=$(mktemp)
    prompt=$(cat <<EOF_PROMPT
You are grading whether an answer correctly reflects source material.

Use only the provided source text and rubric. Do not rely on outside knowledge.
Judge based on meaning, not wording. If the answer is materially correct but phrased differently, it should pass.

Return exactly one JSON object with this shape:
{"pass":true,"reason":"short explanation","failed_criteria":[]}

Rules:
- "pass" must be true only if every rubric item is satisfied.
- "failed_criteria" must list the unmet rubric items verbatim when pass is false.
- Do not include markdown fences or any text outside the JSON object.

## Source Text
$source_text

## Question
$question

## Answer Under Review
$answer

## Rubric
$rubric
EOF_PROMPT
)

    if ! evaluator_output=$(run_claude "$prompt" "$timeout_seconds"); then
        echo "  [FAIL] $test_name"
        echo "  Semantic evaluator failed to run"
        rm -f "$parse_errors_file"
        return 1
    fi

    if ! printf '%s' "$evaluator_output" | jq empty >/dev/null 2>"$parse_errors_file"; then
        echo "  [FAIL] $test_name"
        echo "  Semantic evaluator did not return valid JSON"
        cat "$parse_errors_file" | sed 's/^/    /'
        printf '%s\n' "$evaluator_output" | sed 's/^/    /'
        rm -f "$parse_errors_file"
        return 1
    fi

    if ! printf '%s' "$evaluator_output" | jq -e '
        type == "object"
        and (.pass | type == "boolean")
        and (.reason | type == "string")
        and (.failed_criteria | type == "array")
    ' >/dev/null 2>"$parse_errors_file"; then
        echo "  [FAIL] $test_name"
        echo "  Semantic evaluator returned an unexpected JSON shape"
        cat "$parse_errors_file" | sed 's/^/    /'
        printf '%s\n' "$evaluator_output" | sed 's/^/    /'
        rm -f "$parse_errors_file"
        return 1
    fi

    if printf '%s' "$evaluator_output" | jq -e '.pass == true' >/dev/null 2>"$parse_errors_file"; then
        echo "  [PASS] $test_name"
        rm -f "$parse_errors_file"
        return 0
    fi

    reason=$(printf '%s' "$evaluator_output" | jq -r '.reason // "No reason provided"' 2>/dev/null || true)
    failed_criteria=$(printf '%s' "$evaluator_output" | jq -r '(.failed_criteria // []) | join("; ")' 2>/dev/null || true)

    echo "  [FAIL] $test_name"
    if [ -n "$reason" ]; then
        echo "  Reason: $reason"
    fi
    if [ -n "$failed_criteria" ]; then
        echo "  Failed criteria: $failed_criteria"
    fi
    rm -f "$parse_errors_file"
    return 1
}

# Create a simple plan file for testing
# Usage: create_test_plan "$project_dir" "$plan_name"
create_test_plan() {
    local project_dir="$1"
    local plan_name="${2:-test-plan}"
    local plan_file="$project_dir/docs/superpowers/plans/$plan_name.md"

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

# Export functions for use in tests
export -f run_claude
export -f assert_contains
export -f assert_not_contains
export -f assert_count
export -f assert_order
export -f assert_semantic_judgment
export -f create_test_project
export -f cleanup_test_project
export -f create_test_plan
