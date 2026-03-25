#!/usr/bin/env bash
# Test runner for Factory Droid plugin tests
# Verifies plugin manifests, hook behavior, skill discovery, and legacy cleanup
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

# Portable timeout: prefer gtimeout (macOS brew), then timeout (Linux), then fallback
if command -v gtimeout &> /dev/null; then
    TIMEOUT_CMD="gtimeout"
elif command -v timeout &> /dev/null; then
    TIMEOUT_CMD="timeout"
else
    # Fallback: no timeout, just run directly
    TIMEOUT_CMD=""
fi

echo "========================================"
echo " Factory Droid Plugin Test Suite"
echo "========================================"
echo ""
echo "Repository: $(cd ../.. && pwd)"
echo "Test time: $(date)"
echo ""

# Parse arguments
VERBOSE=false
SPECIFIC_TEST=""
TIMEOUT=300
RUN_INTEGRATION=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --verbose|-v)
            VERBOSE=true
            shift
            ;;
        --test|-t)
            SPECIFIC_TEST="$2"
            shift 2
            ;;
        --timeout)
            TIMEOUT="$2"
            shift 2
            ;;
        --integration|-i)
            RUN_INTEGRATION=true
            shift
            ;;
        --help|-h)
            echo "Usage: $0 [options]"
            echo ""
            echo "Options:"
            echo "  --verbose, -v        Show verbose output"
            echo "  --test, -t NAME      Run only the specified test"
            echo "  --timeout SECONDS    Set timeout per test (default: 300)"
            echo "  --integration, -i    Run integration tests (requires droid CLI, slow)"
            echo "  --help, -h           Show this help"
            echo ""
            echo "Tests:"
            echo "  test-plugin-manifests.sh    Validate .factory-plugin/ JSON files"
            echo "  test-session-start-hook.sh  Verify hook skips injection for Droid"
            echo "  test-skill-discovery.sh     Check all skills are discoverable"
            echo "  test-legacy-cleanup.sh      Ensure old .factory/ files removed"
            echo ""
            echo "Integration Tests (use --integration):"
            echo "  test-plugin-installation.sh  Verify plugin installed and skills loaded"
            echo "  test-skill-invocation.sh     Test skill triggering via droid exec"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

# Fast unit tests (no droid CLI needed)
tests=(
    "test-plugin-manifests.sh"
    "test-session-start-hook.sh"
    "test-skill-discovery.sh"
    "test-legacy-cleanup.sh"
)

# Integration tests (require droid CLI, slow)
integration_tests=(
    "test-plugin-installation.sh"
    "test-skill-invocation.sh"
)

if [ "$RUN_INTEGRATION" = true ]; then
    tests+=("${integration_tests[@]}")
fi

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

    chmod +x "$test_path"

    start_time=$(date +%s)

    if [ "$VERBOSE" = true ]; then
        if [ -n "$TIMEOUT_CMD" ]; then
            run_cmd="$TIMEOUT_CMD $TIMEOUT bash $test_path"
        else
            run_cmd="bash $test_path"
        fi
        if eval "$run_cmd"; then
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
        if [ -n "$TIMEOUT_CMD" ]; then
            run_cmd="$TIMEOUT_CMD $TIMEOUT bash $test_path"
        else
            run_cmd="bash $test_path"
        fi
        if output=$(eval "$run_cmd" 2>&1); then
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
echo "  Passed:  $passed"
echo "  Failed:  $failed"
echo "  Skipped: $skipped"
echo ""

if [ "$RUN_INTEGRATION" = false ] && [ ${#integration_tests[@]} -gt 0 ]; then
    echo "Note: Integration tests were not run (they require droid CLI and take 2-5 minutes)."
    echo "Use --integration flag to run them."
    echo ""
fi

if [ $failed -gt 0 ]; then
    echo "STATUS: FAILED"
    exit 1
else
    echo "STATUS: PASSED"
    exit 0
fi
