#!/usr/bin/env bash
# Pi test runner
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

echo "========================================"
echo " Pi Test Suite"
echo "========================================"
echo ""
echo "Repository: $(cd ../.. && pwd)"
echo "Test time: $(date)"
echo ""

VERBOSE=false
SPECIFIC_TEST=""

while [[ $# -gt 0 ]]; do
    case "$1" in
        --verbose|-v)
            VERBOSE=true
            shift
            ;;
        --test|-t)
            SPECIFIC_TEST="$2"
            shift 2
            ;;
        --help|-h)
            echo "Usage: $0 [options]"
            echo ""
            echo "Options:"
            echo "  --verbose, -v      Show verbose output"
            echo "  --test, -t NAME    Run only the specified test"
            echo "  --help, -h         Show this help"
            echo ""
            echo "Tests:"
            echo "  test-smoke.sh      Isolated install + skill discovery smoke test"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

tests=(
    "test-smoke.sh"
)

if [ -n "$SPECIFIC_TEST" ]; then
    tests=("$SPECIFIC_TEST")
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
        continue
    fi

    if [ ! -x "$test_path" ]; then
        chmod +x "$test_path"
    fi

    start_time=$(date +%s)

    if [ "$VERBOSE" = true ]; then
        if bash "$test_path"; then
            end_time=$(date +%s)
            duration=$((end_time - start_time))
            echo ""
            echo "  [PASS] $test (${duration}s)"
            passed=$((passed + 1))
        else
            end_time=$(date +%s)
            duration=$((end_time - start_time))
            echo ""
            echo "  [FAIL] $test (${duration}s)"
            failed=$((failed + 1))
        fi
    else
        if output=$(bash "$test_path" 2>&1); then
            end_time=$(date +%s)
            duration=$((end_time - start_time))
            echo "  [PASS] (${duration}s)"
            passed=$((passed + 1))
        else
            end_time=$(date +%s)
            duration=$((end_time - start_time))
            echo "  [FAIL] (${duration}s)"
            echo ""
            echo "  Output:"
            while IFS= read -r line; do
                echo "    $line"
            done <<< "$output"
            failed=$((failed + 1))
        fi
    fi

    echo ""
done

echo "========================================"
echo " Test Results Summary"
echo "========================================"
echo ""
echo "  Passed:  $passed"
echo "  Failed:  $failed"
echo "  Skipped: $skipped"
echo ""

if [ $failed -gt 0 ]; then
    echo "STATUS: FAILED"
    exit 1
fi

echo "STATUS: PASSED"
exit 0
