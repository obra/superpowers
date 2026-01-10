#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/test-helpers.sh"

echo "=== Test: Systematic Debugging Returns Investigation Summary ==="
echo ""

# Test 1: Skill requires Investigation Summary
echo "Test 1: Systematic debugging requires Investigation Summary..."
output=$(run_claude "What must the systematic-debugging skill return when it completes?" 30)
if assert_contains "$output" "Investigation Summary" "Requires summary return"; then
    :
else
    exit 1
fi

echo ""

# Test 2: Summary includes research process
echo "Test 2: Summary includes research process documentation..."
output=$(run_claude "What sections are in the systematic-debugging Investigation Summary?" 30)
if assert_contains "$output" "Research Process" "Summary has Research Process section"; then
    :
else
    exit 1
fi

echo ""
echo "=== All tests passed ==="
