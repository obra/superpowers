#!/usr/bin/env bash
# Test: Tools Functionality
# Verifies that use_skill and find_skills tools work correctly
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

# Test 1: Test find_skills tool via direct invocation
echo "Test 1: Testing find_skills tool..."
echo "  Running opencode with find_skills request..."

# Use timeout to prevent hanging, capture both stdout and stderr
output=$(timeout 60s opencode run --print-logs "Use the find_skills tool to list available skills. Just call the tool and show me the raw output." 2>&1) || {
    exit_code=$?
    if [ $exit_code -eq 124 ]; then
        echo "  [FAIL] OpenCode timed out after 60s"
        exit 1
    fi
    echo "  [WARN] OpenCode returned non-zero exit code: $exit_code"
}

# Check for expected patterns in output
if echo "$output" | grep -qi "superpowers:brainstorming\|superpowers:using-superpowers\|Available skills"; then
    echo "  [PASS] find_skills tool discovered superpowers skills"
else
    echo "  [FAIL] find_skills did not return expected skills"
    echo "  Output was:"
    echo "$output" | head -50
    exit 1
fi

# Check if personal test skill was found
if echo "$output" | grep -qi "personal-test"; then
    echo "  [PASS] find_skills found personal test skill"
else
    echo "  [WARN] personal test skill not found in output (may be ok if tool returned subset)"
fi

# Test 2: Test use_skill tool
echo ""
echo "Test 2: Testing use_skill tool..."
echo "  Running opencode with use_skill request..."

output=$(timeout 60s opencode run --print-logs "Use the use_skill tool to load the personal-test skill and show me what you get." 2>&1) || {
    exit_code=$?
    if [ $exit_code -eq 124 ]; then
        echo "  [FAIL] OpenCode timed out after 60s"
        exit 1
    fi
    echo "  [WARN] OpenCode returned non-zero exit code: $exit_code"
}

# Check for the skill marker we embedded
if echo "$output" | grep -qi "PERSONAL_SKILL_MARKER_12345\|Personal Test Skill\|Launching skill"; then
    echo "  [PASS] use_skill loaded personal-test skill content"
else
    echo "  [FAIL] use_skill did not load personal-test skill correctly"
    echo "  Output was:"
    echo "$output" | head -50
    exit 1
fi

# Test 3: Test use_skill with superpowers: prefix
echo ""
echo "Test 3: Testing use_skill with superpowers: prefix..."
echo "  Running opencode with superpowers:brainstorming skill..."

output=$(timeout 60s opencode run --print-logs "Use the use_skill tool to load superpowers:brainstorming and tell me the first few lines of what you received." 2>&1) || {
    exit_code=$?
    if [ $exit_code -eq 124 ]; then
        echo "  [FAIL] OpenCode timed out after 60s"
        exit 1
    fi
    echo "  [WARN] OpenCode returned non-zero exit code: $exit_code"
}

# Check for expected content from brainstorming skill
if echo "$output" | grep -qi "brainstorming\|Launching skill\|skill.*loaded"; then
    echo "  [PASS] use_skill loaded superpowers:brainstorming skill"
else
    echo "  [FAIL] use_skill did not load superpowers:brainstorming correctly"
    echo "  Output was:"
    echo "$output" | head -50
    exit 1
fi

echo ""
echo "=== All tools tests passed ==="
