#!/usr/bin/env bash
# Integration Test: Droid CLI plugin installation and skill loading
# Verifies that droid recognizes the plugin and can load skills
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/test-helpers.sh"

echo "=== Integration Test: Plugin Installation ==="
echo ""

# Check droid CLI is available
if ! command -v droid &> /dev/null; then
    echo "ERROR: droid CLI not found"
    echo "Install Factory Droid CLI first: https://docs.factory.ai/cli/getting-started/overview"
    exit 1
fi

echo "Droid version: $(droid --version 2>/dev/null)"
echo ""

FAILED=0

# Test 1: Plugin is installed
echo "Test 1: Plugin is installed..."
plugin_list=$(droid plugin list 2>&1)
if echo "$plugin_list" | grep -q "superpowers"; then
    echo "  [PASS] superpowers plugin is installed"
else
    echo "  [FAIL] superpowers plugin not found in 'droid plugin list'"
    echo "  Output:"
    echo "$plugin_list" | sed 's/^/    /'
    echo ""
    echo "  Install with: droid plugin marketplace add https://github.com/obra/superpowers && droid plugin install superpowers@superpowers"
    FAILED=$((FAILED + 1))
fi
echo ""

# Test 2: Skill tool is available
echo "Test 2: Skill tool available..."
tool_list=$(droid exec --list-tools 2>&1)
if echo "$tool_list" | grep -q "Skill"; then
    echo "  [PASS] Skill tool is available"
else
    echo "  [FAIL] Skill tool not found in tool list"
    FAILED=$((FAILED + 1))
fi
echo ""

# Test 3: Droid knows about superpowers skills
echo "Test 3: Skill recognition..."
output=$(droid exec "List the superpowers skills you have available. Just list their names, nothing else." 2>&1)
assert_contains "$output" "test-driven-development\|systematic-debugging\|brainstorming" "Droid recognizes superpowers skills" || FAILED=$((FAILED + 1))
echo ""

# Test 4: Droid can describe a specific skill
echo "Test 4: Skill content loading..."
output=$(droid exec "What is the test-driven-development skill about? Answer in one sentence." 2>&1)
assert_contains "$output" "test\|TDD\|Test" "Droid can describe TDD skill" || FAILED=$((FAILED + 1))
echo ""

# Test 5: SessionStart hook does NOT inject content (Factory skips it)
echo "Test 5: No SessionStart injection..."
# In Factory Droid, the hook should exit early and not inject using-superpowers content.
# We verify by checking that droid doesn't mention "EXTREMELY_IMPORTANT" or the hook injection markers
# in a basic prompt that doesn't invoke any skill.
output=$(droid exec "Say hello. Nothing else." 2>&1)
assert_not_contains "$output" "EXTREMELY_IMPORTANT" "No hook injection markers in output" || FAILED=$((FAILED + 1))
echo ""

# Summary
if [ $FAILED -eq 0 ]; then
    echo "=== All plugin installation tests passed ==="
    exit 0
else
    echo "=== FAILED: $FAILED test(s) ==="
    exit 1
fi
