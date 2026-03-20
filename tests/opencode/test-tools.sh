#!/usr/bin/env bash
# Test: Tools Functionality
# Verifies that the native skill tool works correctly
# NOTE: These tests require OpenCode to be installed and configured
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "=== Test: Tools Functionality ==="

# Source setup to create isolated environment
source "$SCRIPT_DIR/setup.sh"

# Trap to cleanup on exit
trap cleanup_test_env EXIT

# Check if opencode is available
if ! command -v opencode &> /dev/null; then
    echo "  [SKIP] OpenCode not installed - skipping integration tests"
    echo "  To run these tests, install OpenCode: https://opencode.ai"
    exit 0
fi

# Test 1: Test native skill listing via direct invocation
echo "Test 1: Testing skill tool listing..."
echo "  Running opencode with skill listing request..."

# Use timeout to prevent hanging, capture both stdout and stderr
output=$(timeout 60s opencode run --print-logs "Use the skill tool to list available skills. Just call the tool and show me the raw output." 2>&1) || {
    exit_code=$?
    if [ $exit_code -eq 124 ]; then
        echo "  [FAIL] OpenCode timed out after 60s"
        exit 1
    fi
    echo "  [WARN] OpenCode returned non-zero exit code: $exit_code"
}

# Check for expected patterns in output
if echo "$output" | grep -qi "superpowers:brainstorming\|superpowers:using-superpowers\|Available skills"; then
    echo "  [PASS] skill tool discovered superpowers skills"
else
    echo "  [FAIL] skill tool did not return expected skills"
    echo "  Output was:"
    echo "$output" | head -50
    exit 1
fi

# Check if personal test skill was found
if echo "$output" | grep -qi "personal-test"; then
    echo "  [PASS] skill tool found personal test skill"
else
    echo "  [WARN] personal test skill not found in output (may be ok if tool returned subset)"
fi

# Test 2: Test native skill loading
echo ""
echo "Test 2: Testing skill tool loading..."
echo "  Running opencode with skill loading request..."

output=$(timeout 60s opencode run --print-logs "Use the skill tool to load the personal-test skill and show me what you get." 2>&1) || {
    exit_code=$?
    if [ $exit_code -eq 124 ]; then
        echo "  [FAIL] OpenCode timed out after 60s"
        exit 1
    fi
    echo "  [WARN] OpenCode returned non-zero exit code: $exit_code"
}

# Check for the skill marker we embedded
if echo "$output" | grep -qi "PERSONAL_SKILL_MARKER_12345\|Personal Test Skill\|Launching skill"; then
    echo "  [PASS] skill tool loaded personal-test skill content"
else
    echo "  [FAIL] skill tool did not load personal-test skill correctly"
    echo "  Output was:"
    echo "$output" | head -50
    exit 1
fi

# Test 3: Test skill tool with superpowers: prefix
echo ""
echo "Test 3: Testing skill tool with superpowers: prefix..."
echo "  Running opencode with superpowers:brainstorming skill..."

output=$(timeout 60s opencode run --print-logs "Use the skill tool to load superpowers:brainstorming and tell me the first few lines of what you received." 2>&1) || {
    exit_code=$?
    if [ $exit_code -eq 124 ]; then
        echo "  [FAIL] OpenCode timed out after 60s"
        exit 1
    fi
    echo "  [WARN] OpenCode returned non-zero exit code: $exit_code"
}

# Check for expected content from brainstorming skill
if echo "$output" | grep -qi "brainstorming\|Launching skill\|skill.*loaded"; then
    echo "  [PASS] skill tool loaded superpowers:brainstorming skill"
else
    echo "  [FAIL] skill tool did not load superpowers:brainstorming correctly"
    echo "  Output was:"
    echo "$output" | head -50
    exit 1
fi

echo ""
echo "=== All tools tests passed ==="
