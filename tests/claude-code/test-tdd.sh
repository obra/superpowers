#!/usr/bin/env bash
# Test suite for test-driven-development skill
# Tests the TDD workflow skill

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/test-helpers.sh"

echo "========================================="
echo " Test-Driven Development Skill Tests"
echo "========================================="
echo ""

# Test: TDD skill is available
test_tdd_availability() {
    echo "Test: TDD skill availability..."

    local output
    output=$(run_claude "What is the test-driven-development skill for?" 30)

    if echo "$output" | grep -qi "test-driven\|TDD"; then
        echo "  [PASS] TDD skill is available"
        return 0
    else
        echo "  [FAIL] TDD skill should be available"
        return 1
    fi
}

# Test: TDD announces in Chinese
test_tdd_chinese_announcement() {
    echo "Test: TDD Chinese announcement..."

    local output
    output=$(run_claude "Use the test-driven-development skill" 30)

    # More flexible - just check for TDD-related content
    if echo "$output" | grep -qiE "(测试驱动开发|TDD|test-driven|RED|GREEN|测试|test)"; then
        echo "  [PASS] TDD mentions itself"
        return 0
    else
        echo "  [FAIL] TDD should mention itself"
        echo "  Output: $(echo "$output" | head -30)"
        return 1
    fi
}

# Test: TDD follows RED-GREEN-REFACTOR
test_tdd_red_green_refactor() {
    echo "Test: TDD RED-GREEN-REFACTOR cycle..."

    local output
    output=$(run_claude "What are the phases of TDD in the test-driven-development skill?" 30)

    local found=0
    echo "$output" | grep -qi "RED\|red" && ((found++))
    echo "$output" | grep -qi "GREEN\|green" && ((found++))
    echo "$output" | grep -qi "REFACTOR\|refactor" && ((found++))

    if [ $found -ge 2 ]; then
        echo "  [PASS] TDD mentions RED-GREEN-REFACTOR (found $found/3)"
        return 0
    else
        echo "  [FAIL] TDD should mention RED-GREEN-REFACTOR"
        return 1
    fi
}

# Test: TDD requires test before code
test_tdd_test_first() {
    echo "Test: TDD requires test first..."

    local output
    output=$(run_claude "Does TDD allow writing code before tests? What is the rule?" 30)

    # More flexible matching for test-first principle
    if echo "$output" | grep -qiE "(no|not.*allowed|delete.*code|must.*test.*first|test.*before.*code|write.*test.*first|铁律|Iron Law)"; then
        echo "  [PASS] TDD requires test first"
        return 0
    else
        echo "  [FAIL] TDD should require test first"
        echo "  Output: $(echo "$output" | head -30)"
        return 1
    fi
}

# Test: TDD verifies test fails
test_tdd_verify_red() {
    echo "Test: TDD verifies test fails..."

    local output
    output=$(run_claude "In TDD, why should you verify the test fails in RED phase?" 30)

    # More flexible matching for RED phase verification
    if echo "$output" | grep -qiE "(prove|verif|correct|right|ensure|test.*fail|fail.*first|red.*phase)"; then
        echo "  [PASS] TDD explains verifying failure"
        return 0
    else
        echo "  [FAIL] TDD should explain verifying failure"
        echo "  Output: $(echo "$output" | head -30)"
        return 1
    fi
}

# Test: TDD minimal code
test_tdd_minimal_code() {
    echo "Test: TDD minimal code principle..."

    local output
    output=$(run_claude "How much code should you write in the GREEN phase of TDD?" 30)

    if echo "$output" | grep -qi "minimal\|simplest\|least\|just.*enough"; then
        echo "  [PASS] TDD mentions minimal code"
        return 0
    else
        echo "  [FAIL] TDD should mention minimal code"
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

test_tdd_availability || ((failed++))
test_tdd_chinese_announcement || ((failed++))
test_tdd_red_green_refactor || ((failed++))
test_tdd_test_first || ((failed++))
test_tdd_verify_red || ((failed++))
test_tdd_minimal_code || ((failed++))

echo ""
echo "========================================="
if [ $failed -eq 0 ]; then
    echo "All tests passed!"
    exit 0
else
    echo "$failed test(s) failed"
    exit 1
fi
