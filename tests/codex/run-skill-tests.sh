#!/usr/bin/env bash
# Test runner for Codex skills
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

echo "========================================"
echo " Codex Skills Test Suite"
echo "========================================"
echo ""
echo "Repository: $(cd ../.. && pwd)"
echo "Test time: $(date)"
echo "Codex version: $(codex --version 2>/dev/null || echo 'not found')"
echo ""

if ! command -v codex &> /dev/null; then
    echo "ERROR: Codex CLI not found"
    echo "Install Codex first: https://developers.openai.com/codex/"
    exit 1
fi

VERBOSE=false
SPECIFIC_TEST=""
TIMEOUT=900
TIMEOUT_EXPLICIT=false
RUN_INTEGRATION=false

fast_test_entries=(
    "test-brainstorming-clarifying-loop.sh|Verify brainstorming keeps the clarifying loop open-ended"
    "test-model-config.sh|Verify the temp Codex config pins model, reasoning effort, and hooks"
    "test-native-agent-catalog.sh|Verify native Superpowers Codex roles are installed and discoverable"
    "test-subagent-driven-development.sh|Test skill loading and requirements"
    "test-using-superpowers-bootstrap.sh|Verify SessionStart Codex bootstrap shape"
)

integration_test_entries=(
    "test-subagent-driven-development-integration.sh|Full workflow execution"
    "test-document-review-system.sh|Real document review behavior"
)

print_test_entries() {
    local entry
    local test_name
    local description

    for entry in "$@"; do
        test_name="${entry%%|*}"
        description="${entry#*|}"
        printf '  %-45s %s\n' "$test_name" "$description"
    done
}

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
            TIMEOUT_EXPLICIT=true
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
            echo "  --timeout SECONDS    Set timeout per test (default: 900, or 1800 with --integration)"
            echo "  --integration, -i    Run integration tests (slow, 10-30 min)"
            echo "  --help, -h           Show this help"
            echo ""
            echo "Tests:"
            print_test_entries "${fast_test_entries[@]}"
            echo ""
            echo "Integration Tests (use --integration):"
            print_test_entries "${integration_test_entries[@]}"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

if [ "$RUN_INTEGRATION" = true ] && [ "$TIMEOUT_EXPLICIT" = false ]; then
    TIMEOUT=1800
fi

tests=()
for entry in "${fast_test_entries[@]}"; do
    tests+=("${entry%%|*}")
done

integration_tests=()
for entry in "${integration_test_entries[@]}"; do
    integration_tests+=("${entry%%|*}")
done

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
        echo "  [FAIL] Test file not found: $test"
        failed=$((failed + 1))
        continue
    fi

    if [ ! -x "$test_path" ]; then
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
echo "  Passed:  $passed"
echo "  Failed:  $failed"
echo "  Skipped: $skipped"
echo ""

if [ "$RUN_INTEGRATION" = false ] && [ ${#integration_tests[@]} -gt 0 ]; then
    echo "Note: Integration tests were not run (they take 10-30 minutes)."
    echo "Use --integration flag to run full workflow execution tests."
    echo ""
fi

if [ $failed -gt 0 ]; then
    echo "STATUS: FAILED"
    exit 1
else
    echo "STATUS: PASSED"
    exit 0
fi
