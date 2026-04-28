#!/usr/bin/env bash
# Layered test runner for Claude Code skills

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"
source "$SCRIPT_DIR/suite-helpers.sh"

echo "========================================"
echo " Claude Code Skills Test Suite"
echo "========================================"
echo ""
echo "Repository: $(cd ../.. && pwd)"
echo "Test time: $(date)"
echo "Claude version: $(claude --version 2>/dev/null || echo 'not found')"
echo ""

VERBOSE=false
LIST_ONLY=false
SPECIFIC_TEST=""
SUITE="$DEFAULT_SUITE"
TIMEOUT=""

while [[ $# -gt 0 ]]; do
    case $1 in
        --verbose|-v)
            VERBOSE=true
            shift
            ;;
        --suite|-s)
            SUITE="$2"
            shift 2
            ;;
        --test|-t)
            SPECIFIC_TEST="$2"
            shift 2
            ;;
        --timeout)
            TIMEOUT="$2"
            shift 2
            ;;
        --list)
            LIST_ONLY=true
            shift
            ;;
        --integration|-i)
            SUITE="integration"
            shift
            ;;
        --help|-h)
            echo "Usage: $0 [options]"
            echo ""
            echo "Options:"
            echo "  --verbose, -v        Show verbose output"
            echo "  --suite, -s NAME     Select suite: smoke, full, integration"
            echo "  --test, -t NAME      Run only the specified test"
            echo "  --timeout SECONDS    Set timeout per test (default: suite-specific)"
            echo "  --list               Show selected tests without running them"
            echo "  --integration, -i    Alias for --suite integration"
            echo "  --help, -h           Show this help"
            echo ""
            echo "Suites:"
            echo "  smoke        Fast compatibility checks for core skills"
            echo "  full         Deeper semantic checks for skill instructions"
            echo "  integration  Long-running end-to-end workflow validation"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

if ! is_valid_suite "$SUITE"; then
    echo "ERROR: Unknown suite '$SUITE'"
    echo "Valid suites: smoke, full, integration"
    exit 1
fi

if [ -z "$TIMEOUT" ]; then
    TIMEOUT="$(suite_default_timeout "$SUITE")"
fi

tests=()
if [ -n "$SPECIFIC_TEST" ]; then
    tests=("$SPECIFIC_TEST")
else
    while IFS= read -r test_name; do
        [ -n "$test_name" ] || continue
        tests+=("$test_name")
    done < <(suite_tests "$SUITE")
fi

if [ "$LIST_ONLY" = true ]; then
    if [ -n "$SPECIFIC_TEST" ]; then
        echo "Selected suite: $SUITE"
        echo "Specific test override: $SPECIFIC_TEST"
        echo "Timeout: ${TIMEOUT}s"
    else
        print_suite_listing "$SUITE"
    fi
    exit 0
fi

if ! command -v claude > /dev/null 2>&1; then
    echo "ERROR: Claude Code CLI not found"
    echo "Install Claude Code first: https://code.claude.com"
    exit 1
fi

passed=0
failed=0
skipped=0

for test in "${tests[@]}"; do
    echo "----------------------------------------"
    echo "Running: $test"
    echo "----------------------------------------"

    test_path="$SCRIPT_DIR/$test"

    if [ ! -f "$test_path" ]; then
        echo "  [SKIP] Test file not found: $test"
        skipped=$((skipped + 1))
        echo ""
        continue
    fi

    if [ ! -x "$test_path" ]; then
        echo "  Making $test executable..."
        chmod +x "$test_path"
    fi

    start_time=$(date +%s)

    if [ "$VERBOSE" = true ]; then
        if timeout "$TIMEOUT" bash "$test_path"; then
            end_time=$(date +%s)
            duration=$((end_time - start_time))
            echo ""
            echo "  [PASS] $test (${duration}s)"
            passed=$((passed + 1))
        else
            exit_code=$?
            end_time=$(date +%s)
            duration=$((end_time - start_time))
            echo ""
            if [ $exit_code -eq 124 ]; then
                echo "  [FAIL] $test (timeout after ${TIMEOUT}s)"
            else
                echo "  [FAIL] $test (${duration}s)"
            fi
            failed=$((failed + 1))
        fi
    else
        if output=$(timeout "$TIMEOUT" bash "$test_path" 2>&1); then
            end_time=$(date +%s)
            duration=$((end_time - start_time))
            echo "  [PASS] (${duration}s)"
            passed=$((passed + 1))
        else
            exit_code=$?
            end_time=$(date +%s)
            duration=$((end_time - start_time))
            if [ $exit_code -eq 124 ]; then
                echo "  [FAIL] (timeout after ${TIMEOUT}s)"
            else
                echo "  [FAIL] (${duration}s)"
            fi
            echo ""
            echo "  Output:"
            echo "$output" | sed 's/^/    /'
            failed=$((failed + 1))
        fi
    fi

    echo ""
done

echo "========================================"
echo " Test Results Summary"
echo "========================================"
echo ""
echo "  Suite:   $SUITE"
echo "  Passed:  $passed"
echo "  Failed:  $failed"
echo "  Skipped: $skipped"
echo ""

if [ "$SUITE" != "integration" ]; then
    echo "Note: Integration tests were not run."
    echo "Use --suite integration to run full workflow execution tests."
    echo ""
fi

if [ $failed -gt 0 ]; then
    echo "STATUS: FAILED"
    exit 1
fi

echo "STATUS: PASSED"
exit 0
