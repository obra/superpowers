#!/usr/bin/env bash
# Test suite for systematic-debugging skill
# Tests the debugging workflow skill

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/test-helpers.sh"

echo "========================================="
echo " Systematic Debugging Skill Tests"
echo "========================================="
echo ""

# Test: debugging skill is available
test_debugging_availability() {
    echo "Test: debugging skill availability..."

    local output
    output=$(run_claude "What is the systematic-debugging skill for?" 30)

    if echo "$output" | grep -qi "debugging\|debug"; then
        echo "  [PASS] debugging skill is available"
        return 0
    else
        echo "  [FAIL] debugging skill should be available"
        return 1
    fi
}

# Test: debugging has 4 phases
test_debugging_four_phases() {
    echo "Test: debugging has 4 phases..."

    local output
    output=$(run_claude "What are the phases of systematic-debugging? List them." 30)

    # Look for mentions of phases or the phases themselves
    local found_phases=0
    echo "$output" | grep -qiE "(reproduce|reproducible|复现)" && ((found_phases++))
    echo "$output" | grep -qiE "(hypothes|cause|假设|根因)" && ((found_phases++))
    echo "$output" | grep -qiE "(test.*hypothesis|verif|验证)" && ((found_phases++))
    echo "$output" | grep -qiE "(fix|solution|修复|解决)" && ((found_phases++))

    if [ $found_phases -ge 2 ]; then
        echo "  [PASS] debugging mentions phases (found $found_phases)"
        return 0
    else
        echo "  [FAIL] debugging should mention phases"
        echo "  Output: $(echo "$output" | head -30)"
        return 1
    fi
}

# Test: debugging starts with reproduction
test_debugging_reproduce_first() {
    echo "Test: debugging starts with reproduction..."

    local output
    output=$(run_claude "What is the first step in systematic-debugging?" 30)

    # Support both English and Chinese keywords
    if echo "$output" | grep -qiE "(reproduce|reproducible|复现|reproducibility|第一步|first.*step)"; then
        echo "  [PASS] debugging starts with reproduction"
        return 0
    else
        echo "  [FAIL] debugging should start with reproduction"
        echo "  Output: $(echo "$output" | head -30)"
        return 1
    fi
}

# Test: debugging forms hypotheses
test_debugging_hypothesis() {
    echo "Test: debugging forms hypotheses..."

    local output
    output=$(run_claude "Does systematic-debugging form hypotheses before fixing bugs?" 30)

    # Check for hypothesis-related terms (English and Chinese)
    if echo "$output" | grep -qiE "(hypothes|theory|guess|suspect|假设|推测|猜想|怀疑|根因|原因)"; then
        echo "  [PASS] debugging mentions hypotheses"
        return 0
    else
        echo "  [FAIL] debugging should mention hypotheses"
        echo "  Output: $(echo "$output" | head -30)"
        return 1
    fi
}

# Test: debugging verifies fix
test_debugging_verify_fix() {
    echo "Test: debugging verifies fix..."

    local output
    output=$(run_claude "Should you verify the fix in systematic-debugging? How?" 30)

    if echo "$output" | grep -qi "verif\|test.*fix\|confirm"; then
        echo "  [PASS] debugging verifies fix"
        return 0
    else
        echo "  [FAIL] debugging should verify fix"
        return 1
    fi
}

# Test: debugging prevents premature fixes
test_debugging_no_premature_fix() {
    echo "Test: debugging prevents premature fixes..."

    local output
    output=$(run_claude "Does systematic-debugging allow fixing before understanding the root cause?" 30)

    if echo "$output" | grep -qi "no\|not.*allow\|understand.*first\|root.*cause"; then
        echo "  [PASS] debugging prevents premature fixes"
        return 0
    else
        echo "  [FAIL] debugging should prevent premature fixes"
        return 1
    fi
}

# Run all tests
failed=0

if ! command -v claude &> /dev/null; then
    echo "SKIPPED: Claude Code CLI not found"
    exit 0
fi

echo "Running tests..."
echo ""

test_debugging_availability || ((failed++))
test_debugging_four_phases || ((failed++))
test_debugging_reproduce_first || ((failed++))
test_debugging_hypothesis || ((failed++))
test_debugging_verify_fix || ((failed++))
test_debugging_no_premature_fix || ((failed++))

echo ""
echo "========================================="
if [ $failed -eq 0 ]; then
    echo "All tests passed!"
    exit 0
else
    echo "$failed test(s) failed"
    exit 1
fi
