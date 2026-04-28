#!/usr/bin/env bash
# Test suite for Claude Code runner layering behavior

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

assert_contains() {
    local output="$1"
    local pattern="$2"
    local message="$3"

    if echo "$output" | grep -qE -- "$pattern"; then
        echo "  [PASS] $message"
    else
        echo "  [FAIL] $message"
        echo "  Expected pattern: $pattern"
        echo "  Output:"
        echo "$output" | sed 's/^/    /'
        exit 1
    fi
}

echo "========================================="
echo " Claude Code Runner Layering Tests"
echo "========================================="
echo ""

echo "Test 1: help output documents layered suites..."
help_output="$(bash "$SCRIPT_DIR/run-skill-tests.sh" --help)"
assert_contains "$help_output" "--suite" "help exposes suite flag"
assert_contains "$help_output" "smoke" "help mentions smoke suite"
assert_contains "$help_output" "full" "help mentions full suite"
assert_contains "$help_output" "integration" "help mentions integration suite"
echo ""

echo "Test 2: default list is smoke suite..."
default_list="$(bash "$SCRIPT_DIR/run-skill-tests.sh" --list)"
assert_contains "$default_list" "Selected suite: smoke" "default suite is smoke"
assert_contains "$default_list" "test-brainstorming-smoke\\.sh" "smoke suite contains brainstorming smoke test"
echo ""

echo "Test 3: full suite includes deeper semantic coverage..."
full_list="$(bash "$SCRIPT_DIR/run-skill-tests.sh" --list --suite full)"
assert_contains "$full_list" "Selected suite: full" "full suite selection works"
assert_contains "$full_list" "test-writing-plans\\.sh" "full suite contains writing-plans semantic test"
assert_contains "$full_list" "test-subagent-driven-development\\.sh" "full suite contains subagent skill test"
echo ""

echo "Test 4: integration suite stays isolated..."
integration_list="$(bash "$SCRIPT_DIR/run-skill-tests.sh" --list --suite integration)"
assert_contains "$integration_list" "Selected suite: integration" "integration suite selection works"
assert_contains "$integration_list" "test-subagent-driven-development-integration\\.sh" "integration suite contains end-to-end test"
echo ""

echo "=== All runner layering tests passed ==="
