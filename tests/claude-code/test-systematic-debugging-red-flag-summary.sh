#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/test-helpers.sh"

echo "=== Test: Systematic Debugging Has Summary Red Flag ==="
echo ""

# Test 1: Red flags include missing summary
echo "Test 1: Red flags warn about missing Investigation Summary..."
output=$(run_claude "What are the red flags in systematic-debugging skill?" 60)
if assert_contains "$output" "Investigation Summary" "Red flags mention summary requirement"; then
    :
else
    exit 1
fi

echo ""
echo "=== All tests passed ==="
