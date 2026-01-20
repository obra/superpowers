#!/usr/bin/env bash
# Integration Test Runner
# Runs all integration tests for Horspowers

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}=========================================${NC}"
echo -e "${CYAN} Horspowers Integration Tests${NC}"
echo -e "${CYAN}=========================================${NC}"
echo ""

# Parse arguments
TEST_FILTER="${1:-}"
FAST_MODE="${FAST_MODE:-false}"

# Test list
declare -a TESTS=(
    "test-complete-workflow.sh"
    "test-cross-skill-interaction.sh"
)

# Filter tests if specified
declare -a RUN_TESTS=()
if [ -n "$TEST_FILTER" ]; then
    for test in "${TESTS[@]}"; do
        if [[ "$test" == *"$TEST_FILTER"* ]]; then
            RUN_TESTS+=("$test")
        fi
    done
else
    RUN_TESTS=("${TESTS[@]}")
fi

if [ ${#RUN_TESTS[@]} -eq 0 ]; then
    echo -e "${RED}No tests found matching: $TEST_FILTER${NC}"
    exit 1
fi

# Show test plan
echo "Running ${#RUN_TESTS[@]} integration test(s):"
for i in "${!RUN_TESTS[@]}"; do
    echo "  $((i + 1)). ${RUN_TESTS[$i]}"
done
echo ""
echo -e "${CYAN}=========================================${NC}"
echo ""

# Run tests
total_tests=${#RUN_TESTS[@]}
passed=0
failed=0
declare -a FAILED_TESTS=()

for i in "${!RUN_TESTS[@]}"; do
    test_file="${RUN_TESTS[$i]}"
    test_path="$SCRIPT_DIR/$test_file"

    # Header
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}Test $((i + 1))/${total_tests}: ${test_file}${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""

    # Check if test file exists
    if [ ! -f "$test_path" ]; then
        echo -e "${RED}✗ FAIL${NC}: Test file not found: $test_path"
        ((failed++))
        FAILED_TESTS+=("$test_file (not found)")
        continue
    fi

    # Make sure it's executable
    chmod +x "$test_path"

    # Run the test
    test_start=$(date +%s)
    if bash "$test_path"; then
        test_end=$(date +%s)
        test_duration=$((test_end - test_start))
        echo ""
        echo -e "${GREEN}✓ PASSED${NC} (${test_duration}s)"
        ((passed++))
    else
        test_end=$(date +%s)
        test_duration=$((test_end - test_start))
        echo ""
        echo -e "${RED}✗ FAILED${NC} (${test_duration}s)"
        ((failed++))
        FAILED_TESTS+=("$test_file")
    fi

    echo ""
    echo -e "${BLUE}Progress: $((i + 1))/${total_tests} | ${GREEN}Passed: ${passed}${NC} | ${RED}Failed: ${failed}${NC}"
    echo ""
    echo -e "${CYAN}=========================================${NC}"
    echo ""
done

# Final summary
echo ""
echo -e "${CYAN}=========================================${NC}"
echo -e "${CYAN} Integration Tests Summary${NC}"
echo -e "${CYAN}=========================================${NC}"
echo ""
echo "Total tests:  $total_tests"
echo -e "${GREEN}Passed:        $passed${NC}"
echo -e "${RED}Failed:        $failed${NC}"
echo ""

if [ $failed -gt 0 ]; then
    echo -e "${RED}Failed Tests:${NC}"
    for test in "${FAILED_TESTS[@]}"; do
        echo -e "  ${RED}✗${NC} $test"
    done
    echo ""
    echo -e "${CYAN}=========================================${NC}"
    echo -e "${RED}⚠️  ${failed} test(s) failed${NC}"
    exit 1
fi

echo -e "${CYAN}=========================================${NC}"
echo -e "${GREEN}🎉 All integration tests passed!${NC}"
echo ""

exit 0
