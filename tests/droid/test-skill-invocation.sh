#!/usr/bin/env bash
# Integration Test: Droid CLI skill invocation
# Verifies that skills can be invoked and produce expected behavior
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/test-helpers.sh"

echo "========================================="
echo " Integration Test: Skill Invocation"
echo "========================================="
echo ""
echo "This test invokes skills via droid exec and verifies behavior."
echo "Each test may take 30-60 seconds."
echo ""

# Check droid CLI is available
if ! command -v droid &> /dev/null; then
    echo "ERROR: droid CLI not found"
    exit 1
fi

FAILED=0

# Test 1: Droid knows when to use brainstorming skill
echo "Test 1: Brainstorming skill trigger..."
output=$(droid exec "I want to add a new feature to my app: a dark mode toggle. What skill should I use first before implementing?" 2>&1)
assert_contains "$output" "brainstorming\|Brainstorming" "Suggests brainstorming skill" || FAILED=$((FAILED + 1))
echo ""

# Test 2: Droid knows when to use TDD skill
echo "Test 2: TDD skill trigger..."
output=$(droid exec "I need to implement a function that validates email addresses. What superpowers skill should I use?" 2>&1)
assert_contains "$output" "test-driven-development\|TDD\|test" "Suggests TDD skill" || FAILED=$((FAILED + 1))
echo ""

# Test 3: Droid knows when to use systematic-debugging skill
echo "Test 3: Debugging skill trigger..."
output=$(droid exec "My app crashes with a null pointer exception when I click the submit button. What superpowers skill should I use?" 2>&1)
assert_contains "$output" "systematic-debugging\|debug" "Suggests debugging skill" || FAILED=$((FAILED + 1))
echo ""

# Test 4: Droid knows when to use verification-before-completion
echo "Test 4: Verification skill awareness..."
output=$(droid exec "What does the verification-before-completion skill do? One sentence." 2>&1)
assert_contains "$output" "verif\|check\|confirm\|complete" "Describes verification skill" || FAILED=$((FAILED + 1))
echo ""

# Test 5: Droid knows about writing-plans skill
echo "Test 5: Writing-plans skill awareness..."
output=$(droid exec "I have a complex multi-step project to implement. What superpowers skill helps me create a plan?" 2>&1)
assert_contains "$output" "writing-plans\|plan" "Suggests writing-plans skill" || FAILED=$((FAILED + 1))
echo ""

# Summary
if [ $FAILED -eq 0 ]; then
    echo "=== All skill invocation tests passed ==="
    exit 0
else
    echo "=== FAILED: $FAILED test(s) ==="
    exit 1
fi
