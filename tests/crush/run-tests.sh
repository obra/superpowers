#!/usr/bin/env bash
# Main test runner for Crush test suite
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

echo "========================================"
echo " Crush Superpowers Test Suite"
echo "========================================"
echo ""
echo "Repository: $(cd ../.. && pwd)"
echo "Test time: $(date)"
echo ""

tests=(
    "test-install.sh"
)

passed=0
failed=0

for test in "${tests[@]}"; do
    echo "----------------------------------------"
    echo "Running: $test"
    echo "----------------------------------------"

    test_path="$SCRIPT_DIR/$test"

    if [ ! -f "$test_path" ]; then
        echo "  [SKIP] Test file not found: $test"
        continue
    fi

    [ ! -x "$test_path" ] && chmod +x "$test_path"

    if output=$(bash "$test_path" 2>&1); then
        echo "  [PASS]"
        passed=$((passed + 1))
    else
        echo "  [FAIL]"
        echo ""
        echo "$output" | sed 's/^/    /'
        failed=$((failed + 1))
    fi
    echo ""
done

echo "========================================"
echo " Results: $passed passed, $failed failed"
echo "========================================"

[ $failed -gt 0 ] && exit 1 || exit 0
