#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/test-helpers.sh"

echo "=== Test: Systematic Debugging Uses Context Fork ==="
echo ""

# Test 1: Skill declares context: fork
echo "Test 1: Systematic debugging uses context: fork..."
output=$(run_claude "Does the systematic-debugging skill use context: fork?" 30)
if assert_contains "$output" "fork" "Mentions fork context"; then
    :
else
    exit 1
fi

echo ""
echo "=== All tests passed ==="
