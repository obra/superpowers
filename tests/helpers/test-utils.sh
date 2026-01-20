#!/usr/bin/env bash
# Test utility functions for Horspowers test suite
# Provides common assertion and helper functions

# Assert two values are equal
# Usage: assert_equal "expected" "actual" "test name"
assert_equal() {
    local expected="$1"
    local actual="$2"
    local test_name="${3:-assertion}"

    if [ "$expected" = "$actual" ]; then
        echo "  [PASS] $test_name"
        return 0
    else
        echo "  [FAIL] $test_name"
        echo "  Expected: '$expected'"
        echo "  Actual:   '$actual'"
        return 1
    fi
}

# Assert a command exits with code 0 (true)
# Usage: assert_true $exit_code "test name"
assert_true() {
    local exit_code=$1
    local test_name="${2:-assertion}"

    if [ "$exit_code" -eq 0 ]; then
        echo "  [PASS] $test_name"
        return 0
    else
        echo "  [FAIL] $test_name"
        echo "  Expected exit code 0, got $exit_code"
        return 1
    fi
}

# Assert a command exits with non-zero code (false)
# Usage: assert_false $exit_code "test name"
assert_false() {
    local exit_code=$1
    local test_name="${2:-assertion}"

    if [ "$exit_code" -ne 0 ]; then
        echo "  [PASS] $test_name"
        return 0
    else
        echo "  [FAIL] $test_name"
        echo "  Expected non-zero exit code, got 0"
        return 1
    fi
}
