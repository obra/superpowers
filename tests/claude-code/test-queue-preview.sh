#!/usr/bin/env bash
# Quick preview of test queue - shows what the interactive runner looks like

BLUE='\033[0;34m'
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}=========================================${NC}"
echo -e "${CYAN} Interactive Skill Tests${NC}"
echo -e "${CYAN}=========================================${NC}"
echo ""
echo "Mode: Single-step with real-time feedback"
echo ""

# Test timing estimates (in seconds)
declare -A TEST_TIME_ESTIMATES=(
    ["test-brainstorming.sh"]=600
    ["test-writing-plans.sh"]=600
    ["test-tdd.sh"]=600
    ["test-systematic-debugging.sh"]=600
    ["test-subagent-driven-development.sh"]=900
    ["test-automated-development-workflow.sh"]=900
)

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
total_estimated=0
for test_file in "${TEST_FILES[@]}"; do
    total_estimated=$((total_estimated + ${TEST_TIME_ESTIMATES[$test_file]:-600}))
done

echo "Test Queue (${total_tests} tests, ~$((total_estimated / 60)) minutes total):"
echo ""
for i in "${!TEST_FILES[@]}"; do
    test_file="${TEST_FILES[$i]}"
    estimate=${TEST_TIME_ESTIMATES[$test_file]:-600}
    echo "  $((i + 1)). ${test_file} (~$((estimate / 60))m)"
done
echo ""
echo -e "${CYAN}=========================================${NC}"
echo ""
echo "This preview shows the test queue interface."
echo "The actual interactive runner will:"
echo "  • Show progress for each test in real-time"
echo "  • Display elapsed and estimated remaining time"
echo "  • Use color-coded results (green/red)"
echo ""
echo "To run the actual tests:"
echo -e "  ${GREEN}./tests/claude-code/run-skill-tests-interactive.sh${NC}"
echo ""
echo "To run with step-by-step confirmation:"
echo -e "  ${GREEN}./tests/claude-code/run-skill-tests-stepwise.sh${NC}"
echo ""
