#!/usr/bin/env bash
# Test: Crush Installation Structure
# Verifies that superpowers is correctly set up for Crush
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "=== Test: Crush Installation Structure ==="

# Source setup to create isolated environment
source "$SCRIPT_DIR/setup.sh"

# Trap to cleanup on exit
trap cleanup_test_env EXIT

# Test 1: Skills symlink exists
echo "Test 1: Checking skills symlink..."
if [ -L "$HOME/.config/crush/skills/superpowers" ]; then
    echo "  [PASS] Skills symlink exists"
else
    echo "  [FAIL] Skills symlink not found at $HOME/.config/crush/skills/superpowers"
    exit 1
fi

# Test 2: Symlink target resolves to the skills directory
echo "Test 2: Checking symlink target..."
target="$(readlink -f "$HOME/.config/crush/skills/superpowers")"
if [ -d "$target" ]; then
    echo "  [PASS] Symlink target resolves to: $target"
else
    echo "  [FAIL] Symlink target does not exist: $target"
    exit 1
fi

# Test 3: using-superpowers skill exists (required for skill discipline)
echo "Test 3: Checking using-superpowers skill..."
if [ -f "$HOME/.config/crush/skills/superpowers/using-superpowers/SKILL.md" ]; then
    echo "  [PASS] using-superpowers skill exists"
else
    echo "  [FAIL] using-superpowers skill not found (required for bootstrap)"
    exit 1
fi

# Test 4: At least one skill with valid frontmatter
echo "Test 4: Checking skill count..."
skill_count=$(find -L "$HOME/.config/crush/skills/superpowers" -name "SKILL.md" | grep -c "SKILL.md" || true)
if [ "$skill_count" -gt 0 ]; then
    echo "  [PASS] Found $skill_count skills installed"
else
    echo "  [FAIL] No skills found"
    exit 1
fi

# Test 5: AGENTS.md bootstrap source exists in .crush/
echo "Test 5: Checking .crush/AGENTS.md source..."
if [ -f "$HOME/.config/crush/superpowers/.crush/AGENTS.md" ]; then
    echo "  [PASS] .crush/AGENTS.md exists"
else
    echo "  [FAIL] .crush/AGENTS.md not found"
    exit 1
fi

# Test 6: Bootstrap was injected into ~/.config/crush/AGENTS.md
echo "Test 6: Checking AGENTS.md bootstrap injection..."
if grep -q "superpowers" "$HOME/.config/crush/AGENTS.md" 2>/dev/null; then
    echo "  [PASS] Bootstrap found in ~/.config/crush/AGENTS.md"
else
    echo "  [FAIL] Bootstrap not found in ~/.config/crush/AGENTS.md"
    exit 1
fi

# Test 7: INSTALL.md exists in .crush/
echo "Test 7: Checking .crush/INSTALL.md..."
if [ -f "$HOME/.config/crush/superpowers/.crush/INSTALL.md" ]; then
    echo "  [PASS] .crush/INSTALL.md exists"
else
    echo "  [FAIL] .crush/INSTALL.md not found"
    exit 1
fi

echo ""
echo "=== All Crush installation tests passed ==="
