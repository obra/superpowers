#!/usr/bin/env bash
# Preview the interactive runner queue for a selected suite

set -euo pipefail

BLUE='\033[0;34m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/suite-helpers.sh"

SUITE="${1:-$DEFAULT_SUITE}"

if ! is_valid_suite "$SUITE"; then
    echo "Unknown suite: $SUITE"
    echo "Valid suites: smoke, full, integration"
    exit 1
fi

declare -a TEST_FILES=()
while IFS= read -r test_file; do
    [ -n "$test_file" ] || continue
    TEST_FILES+=("$test_file")
done < <(suite_tests "$SUITE")

total_tests=${#TEST_FILES[@]}
total_estimated=0
for test_file in "${TEST_FILES[@]}"; do
    total_estimated=$((total_estimated + $(estimate_for_test "$test_file")))
done

echo -e "${CYAN}=========================================${NC}"
echo -e "${CYAN} Interactive Skill Tests${NC}"
echo -e "${CYAN}=========================================${NC}"
echo ""
echo "Mode: Single-step with real-time feedback"
echo "Suite: ${SUITE} ($(suite_description "$SUITE"))"
echo ""
echo "Test Queue (${total_tests} tests, ~$((total_estimated / 60)) minutes total):"
echo ""
for i in "${!TEST_FILES[@]}"; do
    test_file="${TEST_FILES[$i]}"
    estimate="$(estimate_for_test "$test_file")"
    echo "  $((i + 1)). ${test_file} (~$((estimate / 60))m)"
done
echo ""
echo -e "${CYAN}=========================================${NC}"
echo ""
echo "This preview shows the test queue interface."
echo "The actual interactive runner will:"
echo "  - Show progress for each test in real-time"
echo "  - Display elapsed and estimated remaining time"
echo "  - Use color-coded results"
echo ""
echo "To run the actual tests:"
echo -e "  ${GREEN}./tests/claude-code/run-skill-tests-interactive.sh --suite ${SUITE}${NC}"
echo ""
echo "To run with step-by-step confirmation:"
echo -e "  ${GREEN}./tests/claude-code/run-skill-tests-stepwise.sh --suite ${SUITE}${NC}"
echo ""
