#!/usr/bin/env bash
# Main test runner for Codex plugin compatibility checks.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

tests=(
  "test-plugin-package.sh"
  "test-codex-skill-language.sh"
  "test-codex-pressure-behavior.sh"
)

passed=0
failed=0

echo "========================================"
echo " Codex Plugin Compatibility Test Suite"
echo "========================================"
echo ""

for test in "${tests[@]}"; do
  test_path="$SCRIPT_DIR/$test"

  echo "----------------------------------------"
  echo "Running: $test"
  echo "----------------------------------------"

  if output=$(bash "$test_path" 2>&1); then
    echo "$output"
    echo "  [PASS] $test"
    passed=$((passed + 1))
  else
    echo "$output"
    echo "  [FAIL] $test"
    failed=$((failed + 1))
  fi

  echo ""
done

echo "========================================"
echo " Test Results Summary"
echo "========================================"
echo "  Passed: $passed"
echo "  Failed: $failed"
echo ""

if [ "$failed" -gt 0 ]; then
  echo "STATUS: FAILED"
  exit 1
fi

echo "STATUS: PASSED"
