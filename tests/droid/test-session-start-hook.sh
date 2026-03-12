#!/usr/bin/env bash
# Test: SessionStart hook behavior for Factory Droid
# Verifies the hook correctly skips injection when DROID_PLUGIN_ROOT is set
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/test-helpers.sh"

echo "=== Test: SessionStart Hook Behavior ==="
echo ""

HOOK_SCRIPT="$REPO_ROOT/hooks/session-start"
FAILED=0

# Test 1: Hook script exists and is executable
echo "Test 1: Hook script exists..."
assert_file_exists "$HOOK_SCRIPT" "hooks/session-start exists" || FAILED=$((FAILED + 1))

if [ ! -x "$HOOK_SCRIPT" ]; then
    echo "  [INFO] Making hook executable for testing"
    chmod +x "$HOOK_SCRIPT"
fi
echo ""

# Test 2: Hook contains DROID_PLUGIN_ROOT detection
echo "Test 2: Factory environment detection in hook..."
assert_contains "$(cat "$HOOK_SCRIPT")" "DROID_PLUGIN_ROOT" "Hook checks DROID_PLUGIN_ROOT" || FAILED=$((FAILED + 1))
echo ""

# Test 3: Hook exits early when DROID_PLUGIN_ROOT is set
echo "Test 3: Hook exits early for Factory Droid..."
output=$(DROID_PLUGIN_ROOT="$REPO_ROOT" bash "$HOOK_SCRIPT" 2>&1) || true
if [ -z "$output" ]; then
    echo "  [PASS] Hook produces no output when DROID_PLUGIN_ROOT is set"
else
    echo "  [FAIL] Hook produced output when DROID_PLUGIN_ROOT is set:"
    echo "$output" | sed 's/^/    /'
    FAILED=$((FAILED + 1))
fi
echo ""

# Test 4: Hook exit code is 0 when DROID_PLUGIN_ROOT is set
echo "Test 4: Hook exit code for Factory Droid..."
DROID_PLUGIN_ROOT="$REPO_ROOT" bash "$HOOK_SCRIPT" > /dev/null 2>&1
exit_code=$?
if [ $exit_code -eq 0 ]; then
    echo "  [PASS] Exit code is 0"
else
    echo "  [FAIL] Exit code is $exit_code (expected 0)"
    FAILED=$((FAILED + 1))
fi
echo ""

# Test 5: Hook produces output when DROID_PLUGIN_ROOT is NOT set
echo "Test 5: Hook produces output for Claude Code (no DROID_PLUGIN_ROOT)..."
output=$(unset DROID_PLUGIN_ROOT && bash "$HOOK_SCRIPT" 2>&1) || true
if [ -n "$output" ]; then
    echo "  [PASS] Hook produces output when DROID_PLUGIN_ROOT is not set"
else
    echo "  [FAIL] Hook produced no output when DROID_PLUGIN_ROOT is not set"
    FAILED=$((FAILED + 1))
fi
echo ""

# Test 6: Claude Code output is valid JSON
echo "Test 6: Claude Code output is valid JSON..."
if echo "$output" | python3 -c "import json, sys; json.load(sys.stdin)" 2>/dev/null; then
    echo "  [PASS] Output is valid JSON"
else
    echo "  [FAIL] Output is not valid JSON"
    FAILED=$((FAILED + 1))
fi
echo ""

# Test 7: Claude Code output contains expected fields
echo "Test 7: Claude Code output structure..."
if echo "$output" | python3 -c "
import json, sys
data = json.load(sys.stdin)
assert 'additional_context' in data, 'missing additional_context'
assert 'hookSpecificOutput' in data, 'missing hookSpecificOutput'
assert data['hookSpecificOutput']['hookEventName'] == 'SessionStart', 'wrong hookEventName'
print('OK')
" 2>/dev/null | grep -q "OK"; then
    echo "  [PASS] Output has expected JSON structure"
else
    echo "  [FAIL] Output missing expected JSON fields"
    FAILED=$((FAILED + 1))
fi
echo ""

# Test 8: Claude Code output contains superpowers content
echo "Test 8: Claude Code output contains skill content..."
assert_contains "$output" "superpowers" "Output mentions superpowers" || FAILED=$((FAILED + 1))
assert_contains "$output" "using-superpowers" "Output mentions using-superpowers" || FAILED=$((FAILED + 1))
echo ""

# Summary
if [ $FAILED -eq 0 ]; then
    echo "=== All session-start hook tests passed ==="
    exit 0
else
    echo "=== FAILED: $FAILED test(s) ==="
    exit 1
fi
