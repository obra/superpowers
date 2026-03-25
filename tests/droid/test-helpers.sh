#!/usr/bin/env bash
# Helper functions for Factory Droid plugin tests

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

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

# Check file exists
# Usage: assert_file_exists "path" "test name"
assert_file_exists() {
    local path="$1"
    local test_name="${2:-file exists}"

    if [ -f "$path" ]; then
        echo "  [PASS] $test_name"
        return 0
    else
        echo "  [FAIL] $test_name"
        echo "  File not found: $path"
        return 1
    fi
}

# Check file does NOT exist
# Usage: assert_file_not_exists "path" "test name"
assert_file_not_exists() {
    local path="$1"
    local test_name="${2:-file not exists}"

    if [ ! -e "$path" ]; then
        echo "  [PASS] $test_name"
        return 0
    else
        echo "  [FAIL] $test_name"
        echo "  Expected not to exist: $path"
        return 1
    fi
}

# Check directory exists
# Usage: assert_dir_exists "path" "test name"
assert_dir_exists() {
    local path="$1"
    local test_name="${2:-dir exists}"

    if [ -d "$path" ]; then
        echo "  [PASS] $test_name"
        return 0
    else
        echo "  [FAIL] $test_name"
        echo "  Directory not found: $path"
        return 1
    fi
}

# Validate JSON file
# Usage: assert_valid_json "path" "test name"
assert_valid_json() {
    local path="$1"
    local test_name="${2:-valid JSON}"

    if python3 -c "import json; json.load(open('$path'))" 2>/dev/null; then
        echo "  [PASS] $test_name"
        return 0
    else
        echo "  [FAIL] $test_name"
        echo "  Invalid JSON: $path"
        return 1
    fi
}

# Check JSON field exists and has expected value
# Usage: assert_json_field "path" "field" "expected_value" "test name"
assert_json_field() {
    local path="$1"
    local field="$2"
    local expected="$3"
    local test_name="${4:-JSON field check}"

    local actual
    actual=$(python3 -c "
import json, sys
data = json.load(open('$path'))
keys = '$field'.split('.')
val = data
for k in keys:
    if isinstance(val, list):
        val = val[int(k)]
    else:
        val = val[k]
print(val)
" 2>/dev/null)

    if [ "$actual" = "$expected" ]; then
        echo "  [PASS] $test_name"
        return 0
    else
        echo "  [FAIL] $test_name"
        echo "  Expected $field = '$expected', got '$actual'"
        return 1
    fi
}

# Export functions
export -f assert_contains
export -f assert_not_contains
export -f assert_file_exists
export -f assert_file_not_exists
export -f assert_dir_exists
export -f assert_valid_json
export -f assert_json_field
export REPO_ROOT
