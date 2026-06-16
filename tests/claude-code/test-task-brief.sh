#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
TASK_BRIEF="$REPO_ROOT/skills/subagent-driven-development/scripts/task-brief"

FAILURES=0
TEST_ROOT=""

pass() {
    echo "  [PASS] $1"
}

fail() {
    echo "  [FAIL] $1"
    FAILURES=$((FAILURES + 1))
}

cleanup() {
    if [[ -n "$TEST_ROOT" && -d "$TEST_ROOT" ]]; then
        rm -rf "$TEST_ROOT"
    fi
}

extract_written_path() {
    local output="$1"
    printf '%s\n' "$output" | sed -n 's/^wrote \(.*\): [0-9][0-9]* lines$/\1/p'
}

assert_not_equals() {
    local actual="$1"
    local expected="$2"
    local description="$3"

    if [[ "$actual" != "$expected" ]]; then
        pass "$description"
    else
        fail "$description"
        echo "    both were: $actual"
    fi
}

assert_file_contains() {
    local path="$1"
    local needle="$2"
    local description="$3"

    if grep -Fq -- "$needle" "$path"; then
        pass "$description"
    else
        fail "$description"
        echo "    expected $path to contain: $needle"
    fi
}

main() {
    echo "=== Test: task-brief output paths ==="

    TEST_ROOT="$(mktemp -d)"
    trap cleanup EXIT

    local repo="$TEST_ROOT/repo"
    local plan="$repo/plan.md"
    local output_one
    local output_two
    local path_one
    local path_two

    git init -q -b main "$repo"

    cat > "$plan" <<'EOF'
# Implementation Plan

## Task 1: First thing

Do the first thing.

## Task 2: Second thing

Do the second thing.
EOF

    output_one="$(cd "$repo" && "$TASK_BRIEF" "$plan" 1)"
    output_two="$(cd "$repo" && "$TASK_BRIEF" "$plan" 1)"
    path_one="$(extract_written_path "$output_one")"
    path_two="$(extract_written_path "$output_two")"

    assert_not_equals "$path_one" "$path_two" "Default task brief paths are unique per invocation"
    assert_file_contains "$path_one" "## Task 1: First thing" "First default brief contains the requested task"
    assert_file_contains "$path_two" "## Task 1: First thing" "Second default brief contains the requested task"

    if [[ "$path_one" == "$repo/.git/sdd/"* ]]; then
        pass "First default brief stays under the repo git metadata directory"
    else
        fail "First default brief stays under the repo git metadata directory"
        echo "    actual: $path_one"
    fi

    if [[ "$path_two" == "$repo/.git/sdd/"* ]]; then
        pass "Second default brief stays under the repo git metadata directory"
    else
        fail "Second default brief stays under the repo git metadata directory"
        echo "    actual: $path_two"
    fi

    if [[ $FAILURES -ne 0 ]]; then
        echo ""
        echo "FAILED: $FAILURES assertion(s) failed."
        exit 1
    fi

    echo ""
    echo "PASS"
}

main "$@"
