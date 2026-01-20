#!/usr/bin/env bash
# Stepwise test runner - waits for user confirmation between tests
# Gives you full control to inspect results before proceeding

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/test-helpers.sh"

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Parse arguments
SKIP_TO="${1:-}"
CONFIRM_EACH="${CONFIRM_EACH:-true}"

# Test list
declare -a TEST_FILES=(
    "test-brainstorming.sh"
    "test-writing-plans.sh"
    "test-tdd.sh"
    "test-systematic-debugging.sh"
    "test-subagent-driven-development.sh"
    "test-automated-development-workflow.sh"
)

total_tests=${#TEST_FILES[@]}
passed=0
failed=0

echo -e "${CYAN}=========================================${NC}"
echo -e "${CYAN} Stepwise Test Runner${NC}"
echo -e "${CYAN}=========================================${NC}"
echo ""
echo "Each test will run and pause for your confirmation."
echo "Press Enter to continue, or Ctrl+C to exit."
echo ""

# Find starting point
start_index=0
if [ -n "$SKIP_TO" ]; then
    for i in "${!TEST_FILES[@]}"; do
        if [ "${TEST_FILES[$i]}" = "$SKIP_TO" ]; then
            start_index=$i
            break
        fi
    done
fi

# Run tests one by one
for ((i=start_index; i<total_tests; i++)); do
    test_file="${TEST_FILES[$i]}"
    test_path="$SCRIPT_DIR/$test_file"

    # Header
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}Test $((i + 1))/${total_tests}: ${test_file}${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""

    # Countdown
    echo -ne "${YELLOW}Starting in 3...${NC} "
    sleep 1
    echo -ne "${YELLOW}2...${NC} "
    sleep 1
    echo -ne "${YELLOW}1...${NC} "
    sleep 1
    echo -e "${GREEN}Go!${NC}"
    echo ""

    # Run the test
    test_start=$(date +%s)
    if bash "$test_path" 2>&1; then
        test_end=$(date +%s)
        test_duration=$((test_end - test_start))
        echo ""
        echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        echo -e "${GREEN}✅ TEST PASSED${NC}"
        echo -e "${GREEN}Duration: ${test_duration}s ($((test_duration / 60))m $((test_duration % 60))s)${NC}"
        echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        ((passed++))
    else
        test_end=$(date +%s)
        test_duration=$((test_end - test_start))
        echo ""
        echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        echo -e "${RED}❌ TEST FAILED${NC}"
        echo -e "${RED}Duration: ${test_duration}s ($((test_duration / 60))m $((test_duration % 60))s)${NC}"
        echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        ((failed++))
    fi

    # Progress update
    echo ""
    echo -e "${CYAN}Progress: $((i + 1))/${total_tests} | ${GREEN}Passed: ${passed}${NC} | ${RED}Failed: ${failed}${NC}"
    echo ""

    # Wait for confirmation (unless it's the last test)
    if [ $i -lt $((total_tests - 1)) ]; then
        if [ "$CONFIRM_EACH" = "true" ]; then
            echo -ne "${YELLOW}Press Enter to continue to next test...${NC}"
            read -r
            echo ""
        fi
    fi
done

# Final summary
echo ""
echo -e "${CYAN}=========================================${NC}"
echo -e "${CYAN} All Tests Complete${NC}"
echo -e "${CYAN}=========================================${NC}"
echo ""
echo -e "Total: ${total_tests} tests"
echo -e "${GREEN}Passed: ${passed}${NC}"
echo -e "${RED}Failed: ${failed}${NC}"
echo ""

if [ $failed -eq 0 ]; then
    echo -e "${GREEN}🎉 All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}⚠️  ${failed} test(s) failed${NC}"
    exit 1
fi
