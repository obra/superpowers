#!/usr/bin/env bash
# Test suite for tests/helpers/test-utils.sh

# Source the test-utils.sh to test
TEST_UTILS_PATH="$(dirname "$0")/../test-utils.sh"

if [ -f "$TEST_UTILS_PATH" ]; then
    source "$TEST_UTILS_PATH"
else
    echo "Error: test-utils.sh not found at $TEST_UTILS_PATH"
    exit 1
fi

# Test: assert_equal checks if two values are equal
test_assert_equal_strings_pass() {
    local result
    result=$(assert_equal "hello" "hello" "strings are equal")
    if [ $? -eq 0 ]; then
        echo "  [PASS] assert_equal passes for equal strings"
        return 0
    else
        echo "  [FAIL] assert_equal should pass for equal strings"
        return 1
    fi
}

# Test: assert_equal fails for different strings
test_assert_equal_strings_fail() {
    local result
    result=$(assert_equal "hello" "world" "strings are different" 2>&1)
    if [ $? -ne 0 ]; then
        echo "  [PASS] assert_equal fails for different strings"
        return 0
    else
        echo "  [FAIL] assert_equal should fail for different strings"
        return 1
    fi
}

# Test: assert_equal checks numbers
test_assert_equal_numbers_pass() {
    local result
    result=$(assert_equal "42" "42" "numbers are equal")
    if [ $? -eq 0 ]; then
        echo "  [PASS] assert_equal passes for equal numbers"
        return 0
    else
        echo "  [FAIL] assert_equal should pass for equal numbers"
        return 1
    fi
}

# Test: assert_true passes for true value
test_assert_true_pass() {
    local result
    result=$(assert_true 0 "value is true (exit code 0)")
    if [ $? -eq 0 ]; then
        echo "  [PASS] assert_true passes for exit code 0"
        return 0
    else
        echo "  [FAIL] assert_true should pass for exit code 0"
        return 1
    fi
}

# Test: assert_true fails for non-zero exit code
test_assert_true_fail() {
    local result
    result=$(assert_true 1 "value is false (exit code 1)" 2>&1)
    if [ $? -ne 0 ]; then
        echo "  [PASS] assert_true fails for exit code 1"
        return 0
    else
        echo "  [FAIL] assert_true should fail for exit code 1"
        return 1
    fi
}

# Test: assert_false passes for non-zero exit code
test_assert_false_pass() {
    local result
    result=$(assert_false 1 "value is false (non-zero)")
    if [ $? -eq 0 ]; then
        echo "  [PASS] assert_false passes for non-zero exit"
        return 0
    else
        echo "  [FAIL] assert_false should pass for non-zero exit"
        return 1
    fi
}

# Test: assert_false fails for zero exit code
test_assert_false_fail() {
    local result
    result=$(assert_false 0 "value is true (zero)" 2>&1)
    if [ $? -ne 0 ]; then
        echo "  [PASS] assert_false fails for zero exit code"
        return 0
    else
        echo "  [FAIL] assert_false should fail for zero exit code"
        return 1
    fi
}

# Run all tests
echo "========================================="
echo "Running test-utils.sh tests"
echo "========================================="
echo ""

failed=0

test_assert_equal_strings_pass || ((failed++))
test_assert_equal_strings_fail || ((failed++))
test_assert_equal_numbers_pass || ((failed++))
test_assert_true_pass || ((failed++))
test_assert_true_fail || ((failed++))
test_assert_false_pass || ((failed++))
test_assert_false_fail || ((failed++))

echo ""
echo "========================================="
if [ $failed -eq 0 ]; then
    echo "All tests passed!"
    exit 0
else
    echo "$failed test(s) failed"
    exit 1
fi
