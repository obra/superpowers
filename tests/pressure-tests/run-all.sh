#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "=== Running Pressure Tests ==="
echo ""

PASSED=0
FAILED=0
SKIPPED=0
RESULTS=()

for test_file in "$SCRIPT_DIR"/*/test-*.sh; do
    # Skip if glob didn't match anything
    [ -e "$test_file" ] || continue

    # Extract skill name from directory and test name from file
    skill_dir=$(basename "$(dirname "$test_file")")
    test_name=$(basename "$test_file" .sh)

    echo "Running: $skill_dir/$test_name"

    if bash "$test_file"; then
        PASSED=$((PASSED + 1))
        RESULTS+=("PASS: $skill_dir/$test_name")
    else
        FAILED=$((FAILED + 1))
        RESULTS+=("FAIL: $skill_dir/$test_name")
    fi
    echo "---"
done

# Summary
echo ""
echo "=== Pressure Test Summary ==="
for result in "${RESULTS[@]:-}"; do
    echo "  $result"
done
echo ""
echo "Passed: $PASSED  Failed: $FAILED  Skipped: $SKIPPED"
[ $FAILED -eq 0 ] || exit 1
