#!/usr/bin/env bash
# Test: Legacy .factory/ cleanup verification
# Ensures old .factory/ hook/script/skill files are removed
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/test-helpers.sh"

echo "=== Test: Legacy Cleanup ==="
echo ""

FAILED=0

# Test 1: Old .factory/hooks/ removed
echo "Test 1: Legacy hooks removed..."
assert_file_not_exists "$REPO_ROOT/.factory/hooks/hooks.json" "No .factory/hooks/hooks.json" || FAILED=$((FAILED + 1))
assert_file_not_exists "$REPO_ROOT/.factory/hooks/session-start.sh" "No .factory/hooks/session-start.sh" || FAILED=$((FAILED + 1))
echo ""

# Test 2: Old .factory/scripts/ removed
echo "Test 2: Legacy scripts removed..."
assert_file_not_exists "$REPO_ROOT/.factory/scripts/init-superpowers.sh" "No .factory/scripts/init-superpowers.sh" || FAILED=$((FAILED + 1))
assert_file_not_exists "$REPO_ROOT/.factory/scripts/verify-install.sh" "No .factory/scripts/verify-install.sh" || FAILED=$((FAILED + 1))
echo ""

# Test 3: Old .factory/skills/ removed
echo "Test 3: Legacy skills removed..."
assert_file_not_exists "$REPO_ROOT/.factory/skills/superpowers/SKILL.md" "No .factory/skills/superpowers/SKILL.md" || FAILED=$((FAILED + 1))
echo ""

# Test 4: .factory/INSTALL.md exists (the only expected file)
echo "Test 4: INSTALL.md present..."
assert_file_exists "$REPO_ROOT/.factory/INSTALL.md" ".factory/INSTALL.md exists" || FAILED=$((FAILED + 1))
echo ""

# Test 5: INSTALL.md references plugin system (not symlinks)
echo "Test 5: INSTALL.md uses plugin system..."
install_content=$(cat "$REPO_ROOT/.factory/INSTALL.md")
assert_contains "$install_content" "plugin" "INSTALL.md mentions plugin system" || FAILED=$((FAILED + 1))
assert_not_contains "$install_content" "symlink" "INSTALL.md does not mention symlinks" || FAILED=$((FAILED + 1))
echo ""

# Summary
if [ $FAILED -eq 0 ]; then
    echo "=== All legacy cleanup tests passed ==="
    exit 0
else
    echo "=== FAILED: $FAILED test(s) ==="
    exit 1
fi
