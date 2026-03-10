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

# Test 5: INSTALL.md exists in .crush/
echo "Test 5: Checking .crush/INSTALL.md..."
if [ -f "$HOME/.config/crush/superpowers/.crush/INSTALL.md" ]; then
    echo "  [PASS] .crush/INSTALL.md exists"
else
    echo "  [FAIL] .crush/INSTALL.md not found"
    exit 1
fi

# Test 6: All skills have required frontmatter fields (name and description)
echo "Test 6: Checking skill frontmatter validity..."
invalid_skills=()
while IFS= read -r skill_file; do
    # Extract name field
    name=$(grep -m1 "^name:" "$skill_file" | sed 's/^name: *//' | tr -d '"' || true)
    # Extract description field
    desc=$(grep -m1 "^description:" "$skill_file" | sed 's/^description: *//' | tr -d '"' || true)
    if [ -z "$name" ] || [ -z "$desc" ]; then
        invalid_skills+=("$skill_file (name='$name' desc='$desc')")
    fi
done < <(find -L "$HOME/.config/crush/skills/superpowers" -name "SKILL.md")

if [ ${#invalid_skills[@]} -eq 0 ]; then
    echo "  [PASS] All skills have valid name and description"
else
    echo "  [FAIL] Skills missing required frontmatter:"
    for s in "${invalid_skills[@]}"; do
        echo "    - $s"
    done
    exit 1
fi

# Test 7: Skill name matches directory name
echo "Test 7: Checking skill name/directory consistency..."
mismatched=()
while IFS= read -r skill_file; do
    dir_name="$(basename "$(dirname "$skill_file")")"
    skill_name=$(grep -m1 "^name:" "$skill_file" | sed 's/^name: *//' | tr -d '"' || true)
    if [ "${dir_name,,}" != "${skill_name,,}" ]; then
        mismatched+=("$skill_file: dir='$dir_name' name='$skill_name'")
    fi
done < <(find -L "$HOME/.config/crush/skills/superpowers" -name "SKILL.md")

if [ ${#mismatched[@]} -eq 0 ]; then
    echo "  [PASS] All skill names match their directory names"
else
    echo "  [FAIL] Skill name/directory mismatches:"
    for s in "${mismatched[@]}"; do
        echo "    - $s"
    done
    exit 1
fi

echo ""
echo "=== All Crush installation tests passed ==="
