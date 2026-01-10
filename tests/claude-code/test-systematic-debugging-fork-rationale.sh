#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/test-helpers.sh"

echo "=== Test: Systematic Debugging Documents Fork Behavior ==="
echo ""

# Test 1: Skill explains why it forks
echo "Test 1: Skill explains fork rationale..."
output=$(run_claude "Why does systematic-debugging use context: fork?" 30)
if assert_contains "$output" "isolation" "Explains fork rationale"; then
    :
else
    exit 1
fi

echo ""
echo "=== All tests passed ==="
