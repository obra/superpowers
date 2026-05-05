#!/usr/bin/env bash
# Test: install-junie.sh creates the correct directory and symlink structure
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/setup.sh"
trap cleanup_test_env EXIT

echo "=== Test: Junie Install Script ==="

# --- run install ---
"$REPO_ROOT/scripts/install-junie.sh"

# Test 1: skills directory created
echo "Test 1: Skills directory created..."
if [ -d "$JUNIE_HOME/skills/superpowers" ]; then
    echo "  [PASS] $JUNIE_HOME/skills/superpowers exists"
else
    echo "  [FAIL] Skills directory not found"
    exit 1
fi

# Test 2: every skill in the repo is symlinked
echo "Test 2: Skill symlinks..."
skill_count=0
for skill_dir in "$REPO_ROOT/skills"/*/; do
    [ -d "$skill_dir" ] || continue
    skill_name=$(basename "$skill_dir")
    link="$JUNIE_HOME/skills/superpowers/$skill_name"
    if [ -L "$link" ] && [ -e "$link" ]; then
        skill_count=$((skill_count + 1))
    else
        echo "  [FAIL] Missing or broken symlink for: $skill_name"
        exit 1
    fi
done
if [ "$skill_count" -gt 0 ]; then
    echo "  [PASS] All $skill_count skills symlinked"
else
    echo "  [FAIL] No skills found to symlink"
    exit 1
fi

# Test 3: using-superpowers skill symlinked (critical for bootstrap)
echo "Test 3: using-superpowers skill symlinked..."
if [ -L "$JUNIE_HOME/skills/superpowers/using-superpowers" ]; then
    echo "  [PASS] using-superpowers symlinked"
else
    echo "  [FAIL] using-superpowers not symlinked"
    exit 1
fi

# Test 4: guidelines.md has sentinel markers
echo "Test 4: guidelines.md sentinel markers..."
if grep -qF "<!-- BEGIN SUPERPOWERS -->" "$JUNIE_HOME/guidelines.md"; then
    echo "  [PASS] BEGIN sentinel present"
else
    echo "  [FAIL] BEGIN sentinel missing"
    exit 1
fi
if grep -qF "<!-- END SUPERPOWERS -->" "$JUNIE_HOME/guidelines.md"; then
    echo "  [PASS] END sentinel present"
else
    echo "  [FAIL] END sentinel missing"
    exit 1
fi

# Test 5: bootstrap content includes using-superpowers key phrase
echo "Test 5: Bootstrap content..."
if grep -qF "You have superpowers" "$JUNIE_HOME/guidelines.md"; then
    echo "  [PASS] Bootstrap content present"
else
    echo "  [FAIL] Bootstrap content missing from guidelines.md"
    exit 1
fi

echo ""
echo "All tests passed."
