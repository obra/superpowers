#!/usr/bin/env bash
# Interactive test runner with real-time progress feedback
# Shows estimated time, current test status, and queue position

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/test-helpers.sh"

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test timing estimates (in seconds)
declare -A TEST_TIME_ESTIMATES=(
    ["test-brainstorming.sh"]=600
    ["test-writing-plans.sh"]=600
    ["test-tdd.sh"]=600
    ["test-systematic-debugging.sh"]=600
    ["test-subagent-driven-development.sh"]=900
    ["test-automated-development-workflow.sh"]=900
)

# Progress tracking
total_tests=0
completed_tests=0
total_start_time=$(date +%s)

echo "========================================="
echo " Interactive Skill Tests"
echo "========================================="
echo ""
echo "Mode: Single-step with real-time feedback"
echo ""

# Parse arguments
TEST_FILTER="${1:-}"
VERBOSE="${VERBOSE:-0}"

# List all tests to run
declare -a TEST_FILES=()
if [ -n "$TEST_FILTER" ]; then
    TEST_FILES=("$SCRIPT_DIR/$TEST_FILTER")
else
    for test_file in test-brainstorming.sh test-writing-plans.sh test-tdd.sh test-systematic-debugging.sh test-subagent-driven-development.sh test-automated-development-workflow.sh; do
        if [ -f "$SCRIPT_DIR/$test_file" ]; then
            TEST_FILES+=("$SCRIPT_DIR/$test_file")
        fi
    done
fi

total_tests=${#TEST_FILES[@]}

# Calculate total estimated time
total_estimated=0
for test_file in "${TEST_FILES[@]}"; do
    basename=$(basename "$test_file")
    total_estimated=$((total_estimated + ${TEST_TIME_ESTIMATES[$basename]:-600}))
done

echo "Test Queue (${total_tests} tests, ~$((total_estimated / 60)) minutes total):"
echo ""
for i in "${!TEST_FILES[@]}"; do
    test_file="${TEST_FILES[$i]}"
    basename=$(basename "$test_file")
    estimate=${TEST_TIME_ESTIMATES[$basename]:-600}
    echo "  $((i + 1)). $basename (~$((estimate / 60))m)"
done
echo ""
echo "========================================="
echo ""

# Run each test file with progress tracking
declare -a PASSED_TESTS=()
declare -a FAILED_TESTS=()
declare -a TEST_TIMES=()

for i in "${!TEST_FILES[@]}"; do
    test_file="${TEST_FILES[$i]}"
    basename=$(basename "$test_file")
    estimate=${TEST_TIME_ESTIMATES[$basename]:-600}

    # Progress header
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}Test $((i + 1))/${total_tests}: ${basename}${NC}"
    echo -e "${BLUE}Estimated: ~$((estimate / 60)) minutes${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""

    # Run the test
    test_start=$(date +%s)
    if bash "$test_file" 2>&1; then
        test_end=$(date +%s)
        test_duration=$((test_end - test_start))
        TEST_TIMES+=("$basename:$test_duration")

        echo ""
        echo -e "${GREEN}✅ PASSED${NC} (${test_duration}s)"
        PASSED_TESTS+=("$basename")
        ((completed_tests++))
    else
        test_end=$(date +%s)
        test_duration=$((test_end - test_start))
        TEST_TIMES+=("$basename:$test_duration")

        echo ""
        echo -e "${RED}❌ FAILED${NC} (${test_duration}s)"
        FAILED_TESTS+=("$basename")
        ((completed_tests++))
    fi

    # Show progress
    echo ""
    echo -e "${BLUE}Progress: ${completed_tests}/${total_tests} tests completed${NC}"

    # Show elapsed time
    total_elapsed=$(($(date +%s) - total_start_time))
    echo -e "${BLUE}Elapsed: $((total_elapsed / 60))m $((total_elapsed % 60))s${NC}"

    # Estimate remaining time
    if [ $completed_tests -lt $total_tests ]; then
        remaining_tests=$((total_tests - completed_tests))
        avg_time=$((total_elapsed / completed_tests))
        estimated_remaining=$((avg_time * remaining_tests))
        echo -e "${BLUE}Estimated remaining: ~$((estimated_remaining / 60))m${NC}"
    fi

    echo ""
    echo "========================================="
    echo ""
done

# Final summary
total_end_time=$(date +%s)
total_duration=$((total_end_time - total_start_time))

echo "========================================="
echo " Test Results Summary"
echo "========================================="
echo ""
echo "Total time: $((total_duration / 60))m $((total_duration % 60))s"
echo ""
echo -e "${GREEN}Passed: ${#PASSED_TESTS[@]}${NC}"
for test in "${PASSED_TESTS[@]}"; do
    echo -e "  ${GREEN}✅${NC} $test"
done

if [ ${#FAILED_TESTS[@]} -gt 0 ]; then
    echo ""
    echo -e "${RED}Failed: ${#FAILED_TESTS[@]}${NC}"
    for test in "${FAILED_TESTS[@]}"; do
        echo -e "  ${RED}❌${NC} $test"
    done
fi

echo ""
echo "========================================="

# Individual test times
echo ""
echo "Individual Test Times:"
echo ""
for time_entry in "${TEST_TIMES[@]}"; do
    test_name="${time_entry%:*}"
    test_time="${time_entry#*:}"
    printf "  %-40s %3dm %2ds\n" "$test_name" "$((test_time / 60))" "$((test_time % 60))"
done

echo ""
echo "========================================="

if [ ${#FAILED_TESTS[@]} -eq 0 ]; then
    echo -e "${GREEN}🎉 All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}⚠️  ${#FAILED_TESTS[@]} test(s) failed${NC}"
    exit 1
fi
