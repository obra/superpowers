#!/usr/bin/env bash
# Test: Plugin Loading
# Verifies that the hyperpowers plugin loads correctly in OpenCode
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "=== Test: Plugin Loading ==="

# Source setup to create isolated environment
source "$SCRIPT_DIR/setup.sh"

# Trap to cleanup on exit
trap cleanup_test_env EXIT

# Test 1: Verify plugin file exists and is registered
echo "Test 1: Checking plugin registration..."
if [ -L "$HOME/.config/opencode/plugin/hyperpowers.js" ]; then
    echo "  [PASS] Plugin symlink exists"
else
    echo "  [FAIL] Plugin symlink not found at $HOME/.config/opencode/plugin/hyperpowers.js"
    exit 1
fi

# Verify symlink target exists
if [ -f "$(readlink -f "$HOME/.config/opencode/plugin/hyperpowers.js")" ]; then
    echo "  [PASS] Plugin symlink target exists"
else
    echo "  [FAIL] Plugin symlink target does not exist"
    exit 1
fi

# Test 2: Verify lib/skills-core.js is in place
echo "Test 2: Checking skills-core.js..."
if [ -f "$HOME/.config/opencode/hyperpowers/lib/skills-core.js" ]; then
    echo "  [PASS] skills-core.js exists"
else
    echo "  [FAIL] skills-core.js not found"
    exit 1
fi

# Test 3: Verify skills directory is populated
echo "Test 3: Checking skills directory..."
skill_count=$(find "$HOME/.config/opencode/hyperpowers/skills" -name "SKILL.md" | wc -l)
if [ "$skill_count" -gt 0 ]; then
    echo "  [PASS] Found $skill_count skills installed"
else
    echo "  [FAIL] No skills found in installed location"
    exit 1
fi

# Test 4: Check using-hyperpowers skill exists (critical for bootstrap)
echo "Test 4: Checking using-hyperpowers skill (required for bootstrap)..."
if [ -f "$HOME/.config/opencode/hyperpowers/skills/using-hyperpowers/SKILL.md" ]; then
    echo "  [PASS] using-hyperpowers skill exists"
else
    echo "  [FAIL] using-hyperpowers skill not found (required for bootstrap)"
    exit 1
fi

# Test 5: Verify plugin JavaScript syntax (basic check)
echo "Test 5: Checking plugin JavaScript syntax..."
plugin_file="$HOME/.config/opencode/hyperpowers/.opencode/plugin/hyperpowers.js"
if node --check "$plugin_file" 2>/dev/null; then
    echo "  [PASS] Plugin JavaScript syntax is valid"
else
    echo "  [FAIL] Plugin has JavaScript syntax errors"
    exit 1
fi

# Test 6: Verify personal test skill was created
echo "Test 6: Checking test fixtures..."
if [ -f "$HOME/.config/opencode/skills/personal-test/SKILL.md" ]; then
    echo "  [PASS] Personal test skill fixture created"
else
    echo "  [FAIL] Personal test skill fixture not found"
    exit 1
fi

echo ""
echo "=== All plugin loading tests passed ==="
