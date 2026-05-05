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
    if [ -d "$link" ]; then
        skill_count=$((skill_count + 1))
    else
        echo "  [FAIL] Missing or invalid directory for: $skill_name"
        exit 1
    fi
done
if [ "$skill_count" -gt 0 ]; then
    echo "  [PASS] All $skill_count skills symlinked"
else
    echo "  [FAIL] No skills found to symlink"
    exit 1
fi

# Test 3: using-superpowers skill directory exists (critical for bootstrap)
echo "Test 3: using-superpowers skill directory exists..."
if [ -d "$JUNIE_HOME/skills/superpowers/using-superpowers" ]; then
    echo "  [PASS] using-superpowers directory exists"
else
    echo "  [FAIL] using-superpowers directory missing"
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

# Test 5: bootstrap has EXTREMELY_IMPORTANT wrapper (required for skill auto-triggering)
echo "Test 5: Bootstrap wrapper..."
if grep -qF "<EXTREMELY_IMPORTANT>" "$JUNIE_HOME/guidelines.md"; then
    echo "  [PASS] EXTREMELY_IMPORTANT wrapper present"
else
    echo "  [FAIL] EXTREMELY_IMPORTANT wrapper missing from guidelines.md"
    exit 1
fi

echo ""
echo "All tests passed."
