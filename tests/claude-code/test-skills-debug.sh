#!/usr/bin/env bash
# Enhanced test runner with debug mode and manual verification support
# Usage:
#   Run with debug: TEST_DEBUG_MODE=1 ./test-skills-debug.sh
#   Run specific test: ./test-skills-debug.sh test-brainstorming.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/test-helpers.sh"

echo "========================================="
echo " Enhanced Skill Tests (Debug Mode)"
echo "========================================="
echo ""

# Parse arguments
TEST_FILTER="${1:-}"
SKIP_INTERACTIVE="${SKIP_INTERACTIVE:-false}"

# Counters
total_tests=0
passed_tests=0
failed_tests=0
manual_review=0
interactive_skipped=0

# Test result tracking
declare -a failed_test_names
declare -a failed_test_outputs

# Run a single test with detailed output
run_test_detailed() {
    local test_name="$1"
    local test_function="$2"
    local test_file="$3"
    local is_interactive="${4:-false}"

    ((total_tests++))

    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "Test: $test_name"
    echo "File: $test_file"
    echo "Interactive: $is_interactive"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

    # Check if should skip interactive tests
    if [ "$is_interactive" = "true" ] && [ "$SKIP_INTERACTIVE" = "true" ]; then
        echo "  [SKIP] Interactive test (use SKIP_INTERACTIVE=false to enable)"
        ((interactive_skipped++))
        echo ""
        return 0
    fi

    # Run the test
    local start_time=$(date +%s)
    local test_output
    local test_exit_code

    if test_output=$(eval "$test_function" 2>&1); then
        test_exit_code=0
    else
        test_exit_code=$?
    fi

    local end_time=$(date +%s)
    local duration=$((end_time - start_time))

    if [ $test_exit_code -eq 0 ]; then
        echo "  [PASS] (${duration}s)"
        ((passed_tests++))
    else
        echo "  [FAIL] (${duration}s)"
        ((failed_tests++))
        failed_test_names+=("$test_name")
        failed_test_outputs+=("$test_output")

        # Ask for manual review if output was suspicious
        if echo "$test_output" | grep -q "\[WARN\]"; then
            echo ""
            echo "  ⚠️  This test has warnings - review recommended"
            ((manual_review++))
            echo "  Output preview:"
            echo "$test_output" | head -20 | sed 's/^/  /'
        fi
    fi

    echo ""
}

# Source and run tests
run_test_file() {
    local test_file="$1"

    if [ ! -f "$test_file" ]; then
        echo "  [ERROR] Test file not found: $test_file"
        return 1
    fi

    echo "========================================="
    echo " Running: $test_file"
    echo "========================================="
    echo ""

    # Source the test file to get its functions
    source "$test_file"

    # Run test functions based on file name
    case "$test_file" in
        *brainstorming*)
            run_test_detailed "brainstorming: availability" "test_brainstorming_availability" "$test_file" "false"
            run_test_detailed "brainstorming: Chinese announcement" "test_brainstorming_chinese_announcement" "$test_file" "true"
            run_test_detailed "brainstorming: asks questions" "test_brainstorming_asks_questions" "$test_file" "true"
            run_test_detailed "brainstorming: proposes approaches" "test_brainstorming_proposes_approaches" "$test_file" "false"
            run_test_detailed "brainstorming: design sections" "test_brainstorming_design_sections" "$test_file" "false"
            run_test_detailed "brainstorming: creates docs" "test_brainstorming_creates_docs" "$test_file" "false"
            ;;
        *writing-plans*)
            run_test_detailed "writing-plans: availability" "test_writing_plans_availability" "$test_file" "false"
            run_test_detailed "writing-plans: bite-sized tasks" "test_writing_plans_bite_sized_tasks" "$test_file" "false"
            run_test_detailed "writing-plans: file paths" "test_writing_plans_file_paths" "$test_file" "false"
            run_test_detailed "writing-plans: save location" "test_writing_plans_save_location" "$test_file" "false"
            run_test_detailed "writing-plans: TDD" "test_writing_plans_tdd" "$test_file" "false"
            run_test_detailed "writing-plans: commit steps" "test_writing_plans_commit_steps" "$test_file" "false"
            ;;
        *tdd*)
            run_test_detailed "TDD: availability" "test_tdd_availability" "$test_file" "false"
            run_test_detailed "TDD: Chinese announcement" "test_tdd_chinese_announcement" "$test_file" "false"
            run_test_detailed "TDD: RED-GREEN-REFACTOR" "test_tdd_red_green_refactor" "$test_file" "false"
            run_test_detailed "TDD: test first" "test_tdd_test_first" "$test_file" "false"
            run_test_detailed "TDD: verify RED" "test_tdd_verify_red" "$test_file" "false"
            run_test_detailed "TDD: minimal code" "test_tdd_minimal_code" "$test_file" "false"
            ;;
        *debugging*)
            run_test_detailed "debugging: availability" "test_debugging_availability" "$test_file" "false"
            run_test_detailed "debugging: 4 phases" "test_debugging_four_phases" "$test_file" "false"
            run_test_detailed "debugging: reproduce first" "test_debugging_reproduce_first" "$test_file" "false"
            run_test_detailed "debugging: hypotheses" "test_debugging_hypothesis" "$test_file" "false"
            run_test_detailed "debugging: verify fix" "test_debugging_verify_fix" "$test_file" "false"
            run_test_detailed "debugging: no premature fix" "test_debugging_no_premature_fix" "$test_file" "false"
            ;;
        *subagent*)
            # Subagent tests have different structure
            echo "  Running subagent-driven-development tests..."
            bash "$test_file"
            local exit_code=$?
            if [ $exit_code -eq 0 ]; then
                echo "  [PASS] All subagent tests passed"
                ((passed_tests += 7))
            else
                echo "  [FAIL] Some subagent tests failed"
                ((failed_tests++))
            fi
            ((total_tests += 7))
            ;;
        *)
            echo "  [WARN] Unknown test format: $test_file"
            ;;
    esac
}

# Main test execution
if [ -n "$TEST_FILTER" ]; then
    echo "Running only: $TEST_FILTER"
    echo ""
    run_test_file "$SCRIPT_DIR/$TEST_FILTER"
else
    # Run all core skill tests
    for test_file in test-brainstorming.sh test-writing-plans.sh test-tdd.sh test-systematic-debugging.sh test-subagent-driven-development.sh; do
        if [ -f "$SCRIPT_DIR/$test_file" ]; then
            run_test_file "$SCRIPT_DIR/$test_file"
        fi
    done
fi

# Final report
echo "========================================="
echo " Test Results Summary"
echo "========================================="
echo ""
echo "Total tests:  $total_tests"
echo "Passed:        $passed_tests ✅"
echo "Failed:        $failed_tests ❌"
echo "Manual review: $manual_review ⚠️"
echo "Interactive skipped: $interactive_skipped ⊘"
echo ""

if [ $failed_tests -gt 0 ]; then
    echo "========================================="
    echo " Failed Tests Details"
    echo "========================================="
    echo ""

    for i in "${!failed_test_names[@]}"; do
        echo "❌ ${failed_test_names[$i]}"
        echo "Output:"
        echo "${failed_test_outputs[$i]}" | head -30 | sed 's/^/  /'
        echo ""
    done
fi

echo "========================================="
if [ $failed_tests -eq 0 ]; then
    echo "🎉 All tests passed!"
    exit 0
else
    echo "⚠️  Some tests failed - review above"
    exit 1
fi
