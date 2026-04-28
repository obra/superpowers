#!/usr/bin/env bash
# Interactive layered test runner with real-time progress feedback

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/test-helpers.sh"
source "$SCRIPT_DIR/suite-helpers.sh"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

total_tests=0
completed_tests=0
total_start_time=$(date +%s)
TEST_FILTER=""
SUITE="$DEFAULT_SUITE"

while [[ $# -gt 0 ]]; do
    case $1 in
        --suite|-s)
            SUITE="$2"
            shift 2
            ;;
        --test|-t)
            TEST_FILTER="$2"
            shift 2
            ;;
        --integration|-i)
            SUITE="integration"
            shift
            ;;
        --help|-h)
            echo "Usage: $0 [--suite smoke|full|integration] [--test NAME]"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

if ! is_valid_suite "$SUITE"; then
    echo "ERROR: Unknown suite '$SUITE'"
    exit 1
fi

declare -a TEST_FILES=()
if [ -n "$TEST_FILTER" ]; then
    TEST_FILES=("$SCRIPT_DIR/$TEST_FILTER")
else
    while IFS= read -r test_file; do
        [ -n "$test_file" ] || continue
        if [ -f "$SCRIPT_DIR/$test_file" ]; then
            TEST_FILES+=("$SCRIPT_DIR/$test_file")
        fi
    done < <(suite_tests "$SUITE")
fi

total_tests=${#TEST_FILES[@]}
total_estimated=0
for test_file in "${TEST_FILES[@]}"; do
    basename="$(basename "$test_file")"
    total_estimated=$((total_estimated + $(estimate_for_test "$basename")))
done

echo "========================================="
echo " Interactive Skill Tests"
echo "========================================="
echo ""
echo "Mode: Single-step with real-time feedback"
echo "Suite: $SUITE ($(suite_description "$SUITE"))"
echo ""
echo "Test Queue (${total_tests} tests, ~$((total_estimated / 60)) minutes total):"
echo ""
for i in "${!TEST_FILES[@]}"; do
    basename="$(basename "${TEST_FILES[$i]}")"
    estimate="$(estimate_for_test "$basename")"
    echo "  $((i + 1)). $basename (~$((estimate / 60))m)"
done
echo ""
echo "========================================="
echo ""

declare -a PASSED_TESTS=()
declare -a FAILED_TESTS=()
declare -a TEST_TIMES=()

for i in "${!TEST_FILES[@]}"; do
    test_file="${TEST_FILES[$i]}"
    basename="$(basename "$test_file")"
    estimate="$(estimate_for_test "$basename")"

    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}Test $((i + 1))/${total_tests}: ${basename}${NC}"
    echo -e "${BLUE}Estimated: ~$((estimate / 60)) minutes${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""

    test_start=$(date +%s)
    if bash "$test_file" 2>&1; then
        test_end=$(date +%s)
        test_duration=$((test_end - test_start))
        TEST_TIMES+=("$basename:$test_duration")
        echo ""
        echo -e "${GREEN}PASS${NC} (${test_duration}s)"
        PASSED_TESTS+=("$basename")
        completed_tests=$((completed_tests + 1))
    else
        test_end=$(date +%s)
        test_duration=$((test_end - test_start))
        TEST_TIMES+=("$basename:$test_duration")
        echo ""
        echo -e "${RED}FAIL${NC} (${test_duration}s)"
        FAILED_TESTS+=("$basename")
        completed_tests=$((completed_tests + 1))
    fi

    echo ""
    echo -e "${BLUE}Progress: ${completed_tests}/${total_tests} tests completed${NC}"

    total_elapsed=$(($(date +%s) - total_start_time))
    echo -e "${BLUE}Elapsed: $((total_elapsed / 60))m $((total_elapsed % 60))s${NC}"

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

total_end_time=$(date +%s)
total_duration=$((total_end_time - total_start_time))

echo "========================================="
echo " Test Results Summary"
echo "========================================="
echo ""
echo "Suite: $SUITE"
echo "Total time: $((total_duration / 60))m $((total_duration % 60))s"
echo ""
echo -e "${GREEN}Passed: ${#PASSED_TESTS[@]}${NC}"
for test in "${PASSED_TESTS[@]}"; do
    echo -e "  ${GREEN}PASS${NC} $test"
done

if [ ${#FAILED_TESTS[@]} -gt 0 ]; then
    echo ""
    echo -e "${RED}Failed: ${#FAILED_TESTS[@]}${NC}"
    for test in "${FAILED_TESTS[@]}"; do
        echo -e "  ${RED}FAIL${NC} $test"
    done
fi

echo ""
echo "========================================="
echo ""
echo "Individual Test Times:"
echo ""
for time_entry in "${TEST_TIMES[@]}"; do
    test_name="${time_entry%:*}"
    test_time="${time_entry#*:}"
    printf "  %-45s %3dm %2ds\n" "$test_name" "$((test_time / 60))" "$((test_time % 60))"
done

echo ""
echo "========================================="

if [ ${#FAILED_TESTS[@]} -eq 0 ]; then
    echo -e "${GREEN}All tests passed${NC}"
    exit 0
fi

echo -e "${RED}${#FAILED_TESTS[@]} test(s) failed${NC}"
exit 1
