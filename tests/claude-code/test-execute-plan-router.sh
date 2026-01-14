#!/bin/bash

# Test: execute-plan router verification
# Fast test - verifies command routes correctly

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/test-helpers.sh"

echo "=== Testing execute-plan router ==="

# Test 1: Command file exists
echo "Test 1: Command file exists..."
CMD_FILE="$SCRIPT_DIR/../../commands/execute-plan.md"
if [[ ! -f "$CMD_FILE" ]]; then
    echo "FAIL: Command file not found at $CMD_FILE"
    exit 1
fi
echo "PASS: Command file exists"

# Test 2: Description updated
echo "Test 2: Description..."
if ! grep -q "preferred approach" "$CMD_FILE"; then
    echo "FAIL: Description not updated to mention 'preferred approach'"
    exit 1
fi
echo "PASS: Description updated"

# Test 3: Choice is COMPULSORY
echo "Test 3: COMPULSORY choice..."
assert_contains "$(cat "$CMD_FILE")" "COMPULSORY" "COMPULSORY keyword"
assert_contains "$(cat "$CMD_FILE")" "Never skip" "Never skip instruction"
echo "PASS: Choice is COMPULSORY"

# Test 4: Both options documented
echo "Test 4: Both execution options..."
assert_contains "$(cat "$CMD_FILE")" "batch-development" "batch-development option"
assert_contains "$(cat "$CMD_FILE")" "subagent-driven-development" "subagent-driven-development option"
echo "PASS: Both options documented"

# Test 5: Batch size argument documented
echo "Test 5: Batch size argument..."
assert_contains "$(cat "$CMD_FILE")" "batch-size" "batch-size argument"
echo "PASS: Batch size argument documented"

# Test 6: Red Flags table present
echo "Test 6: Red Flags table..."
assert_contains "$(cat "$CMD_FILE")" "Red Flags" "Red Flags section"
assert_contains "$(cat "$CMD_FILE")" "Skipping the choice" "Skip warning"
echo "PASS: Red Flags table present"

echo ""
echo "=== All execute-plan router tests passed ==="
