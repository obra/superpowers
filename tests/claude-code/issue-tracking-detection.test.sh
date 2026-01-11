#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/test-helpers.sh"

TEST_NAME="issue-tracking-detection"

# Helper functions for this test
pass() {
    echo "  [PASS] $1"
}

fail() {
    echo "  [FAIL] $1"
    exit 1
}

setup_test_env() {
    TEST_DIR=$(mktemp -d)
    cd "$TEST_DIR"
    git init --quiet

    # Copy agent definition
    mkdir -p agents/issue-tracking
    cp "$SCRIPT_DIR/../../agents/issue-tracking/AGENT.md" agents/issue-tracking/
}

cleanup_test_env() {
    rm -rf "$TEST_DIR"
}

test_detection_priority_documented() {
    echo "Testing: Detection priority is documented in agent"

    grep -q "CLAUDE.md prose" agents/issue-tracking/AGENT.md || fail "Missing CLAUDE.md detection"
    grep -q ".beads/" agents/issue-tracking/AGENT.md || fail "Missing beads detection"
    grep -q "gh auth status" agents/issue-tracking/AGENT.md || fail "Missing GitHub detection"
    grep -q "Jira\|MCP" agents/issue-tracking/AGENT.md || fail "Missing Jira detection"

    pass "Detection priority documented"
}

test_operations_defined() {
    echo "Testing: All operations defined"

    for op in detect discover update-status create close add-comment get-branch-convention; do
        grep -q "### $op" agents/issue-tracking/AGENT.md || fail "Missing operation: $op"
    done

    pass "All operations defined"
}

test_output_format_specified() {
    echo "Testing: Output format specified"

    grep -q "ISSUE_TRACKER:" agents/issue-tracking/AGENT.md || fail "Missing ISSUE_TRACKER output"
    grep -q "ISSUES_FOUND:" agents/issue-tracking/AGENT.md || fail "Missing ISSUES_FOUND output"
    grep -q "COMMAND_TO_RUN:" agents/issue-tracking/AGENT.md || fail "Missing COMMAND_TO_RUN output"

    pass "Output format specified"
}

# Run tests
setup_test_env
trap cleanup_test_env EXIT

test_detection_priority_documented
test_operations_defined
test_output_format_specified

echo "All $TEST_NAME tests passed!"
