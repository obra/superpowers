#!/usr/bin/env bash
# Stepwise layered test runner with user confirmation between tests

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/test-helpers.sh"
source "$SCRIPT_DIR/suite-helpers.sh"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

SKIP_TO=""
SUITE="$DEFAULT_SUITE"
CONFIRM_EACH="${CONFIRM_EACH:-true}"

while [[ $# -gt 0 ]]; do
    case $1 in
        --suite|-s)
            SUITE="$2"
            shift 2
            ;;
        --test|-t)
            SKIP_TO="$2"
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
            if [ -z "$SKIP_TO" ]; then
                SKIP_TO="$1"
                shift
            else
                echo "Unknown option: $1"
                exit 1
            fi
            ;;
    esac
done

if ! is_valid_suite "$SUITE"; then
    echo "ERROR: Unknown suite '$SUITE'"
    exit 1
fi

declare -a TEST_FILES=()
while IFS= read -r test_file; do
    [ -n "$test_file" ] || continue
    TEST_FILES+=("$test_file")
done < <(suite_tests "$SUITE")

total_tests=${#TEST_FILES[@]}
passed=0
failed=0

echo -e "${CYAN}=========================================${NC}"
echo -e "${CYAN} Stepwise Test Runner${NC}"
echo -e "${CYAN}=========================================${NC}"
echo ""
echo "Suite: $SUITE ($(suite_description "$SUITE"))"
echo "Each test will run and pause for your confirmation."
echo "Press Enter to continue, or Ctrl+C to exit."
echo ""

start_index=0
if [ -n "$SKIP_TO" ]; then
    for i in "${!TEST_FILES[@]}"; do
        if [ "${TEST_FILES[$i]}" = "$SKIP_TO" ]; then
            start_index=$i
            break
        fi
    done
fi

for ((i=start_index; i<total_tests; i++)); do
    test_file="${TEST_FILES[$i]}"
    test_path="$SCRIPT_DIR/$test_file"

    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}Test $((i + 1))/${total_tests}: ${test_file}${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""

    echo -ne "${YELLOW}Starting in 3...${NC} "
    sleep 1
    echo -ne "${YELLOW}2...${NC} "
    sleep 1
    echo -ne "${YELLOW}1...${NC} "
    sleep 1
    echo -e "${GREEN}Go!${NC}"
    echo ""

    test_start=$(date +%s)
    if bash "$test_path" 2>&1; then
        test_end=$(date +%s)
        test_duration=$((test_end - test_start))
        echo ""
        echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        echo -e "${GREEN}PASS${NC}"
        echo -e "${GREEN}Duration: ${test_duration}s ($((test_duration / 60))m $((test_duration % 60))s)${NC}"
        echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        passed=$((passed + 1))
    else
        test_end=$(date +%s)
        test_duration=$((test_end - test_start))
        echo ""
        echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        echo -e "${RED}FAIL${NC}"
        echo -e "${RED}Duration: ${test_duration}s ($((test_duration / 60))m $((test_duration % 60))s)${NC}"
        echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        failed=$((failed + 1))
    fi

    echo ""
    echo -e "${CYAN}Progress: $((i + 1))/${total_tests} | ${GREEN}Passed: ${passed}${NC} | ${RED}Failed: ${failed}${NC}"
    echo ""

    if [ $i -lt $((total_tests - 1)) ] && [ "$CONFIRM_EACH" = "true" ]; then
        echo -ne "${YELLOW}Press Enter to continue to next test...${NC}"
        read -r
        echo ""
    fi
done

echo ""
echo -e "${CYAN}=========================================${NC}"
echo -e "${CYAN} All Tests Complete${NC}"
echo -e "${CYAN}=========================================${NC}"
echo ""
echo -e "Suite: ${SUITE}"
echo -e "Total: ${total_tests} tests"
echo -e "${GREEN}Passed: ${passed}${NC}"
echo -e "${RED}Failed: ${failed}${NC}"
echo ""

if [ $failed -eq 0 ]; then
    echo -e "${GREEN}All tests passed${NC}"
    exit 0
fi

echo -e "${RED}${failed} test(s) failed${NC}"
exit 1
