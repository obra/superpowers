#!/usr/bin/env bash
# Test: Skill discovery for Factory Droid
# Verifies that all skills have proper SKILL.md files and are discoverable
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/test-helpers.sh"

echo "=== Test: Skill Discovery ==="
echo ""

SKILLS_DIR="$REPO_ROOT/skills"
FAILED=0

# Test 1: Skills directory exists
echo "Test 1: Skills directory..."
assert_dir_exists "$SKILLS_DIR" "skills/ directory exists" || FAILED=$((FAILED + 1))
echo ""

# Test 2: Every skill directory has a SKILL.md
echo "Test 2: SKILL.md presence in each skill..."
for skill_dir in "$SKILLS_DIR"/*/; do
    skill_name=$(basename "$skill_dir")
    if [ -f "$skill_dir/SKILL.md" ]; then
        echo "  [PASS] $skill_name/SKILL.md exists"
    else
        echo "  [FAIL] $skill_name/SKILL.md missing"
        FAILED=$((FAILED + 1))
    fi
done
echo ""

# Test 3: Each SKILL.md has a description (first non-empty line or frontmatter)
echo "Test 3: SKILL.md has content..."
for skill_dir in "$SKILLS_DIR"/*/; do
    skill_name=$(basename "$skill_dir")
    skill_file="$skill_dir/SKILL.md"
    [ -f "$skill_file" ] || continue

    line_count=$(wc -l < "$skill_file" | tr -d ' ')
    if [ "$line_count" -gt 3 ]; then
        echo "  [PASS] $skill_name/SKILL.md has content ($line_count lines)"
    else
        echo "  [FAIL] $skill_name/SKILL.md is too short ($line_count lines)"
        FAILED=$((FAILED + 1))
    fi
done
echo ""

# Test 4: No duplicate skill names
echo "Test 4: No duplicate skill names..."
skill_names=$(ls -1 "$SKILLS_DIR")
unique_count=$(echo "$skill_names" | sort -u | wc -l | tr -d ' ')
total_count=$(echo "$skill_names" | wc -l | tr -d ' ')
if [ "$unique_count" -eq "$total_count" ]; then
    echo "  [PASS] All $total_count skill names are unique"
else
    echo "  [FAIL] Duplicate skill names found"
    echo "$skill_names" | sort | uniq -d | sed 's/^/    /'
    FAILED=$((FAILED + 1))
fi
echo ""

# Test 5: Shared skills are not duplicated in .factory/
echo "Test 5: No duplicate skills in .factory/..."
if [ -d "$REPO_ROOT/.factory/skills" ]; then
    factory_skill_count=$(find "$REPO_ROOT/.factory/skills" -name "SKILL.md" 2>/dev/null | wc -l | tr -d ' ')
    if [ "$factory_skill_count" -eq 0 ]; then
        echo "  [PASS] No duplicate skills in .factory/skills/"
    else
        echo "  [FAIL] Found $factory_skill_count SKILL.md file(s) in .factory/skills/ (should use shared skills/)"
        find "$REPO_ROOT/.factory/skills" -name "SKILL.md" | sed 's/^/    /'
        FAILED=$((FAILED + 1))
    fi
else
    echo "  [PASS] No .factory/skills/ directory (correct: uses shared skills/)"
fi
echo ""

# Test 6: Key skills expected by Factory Droid exist
echo "Test 6: Key skills present..."
expected_skills=(
    "using-superpowers"
    "test-driven-development"
    "systematic-debugging"
    "subagent-driven-development"
    "writing-plans"
    "executing-plans"
    "brainstorming"
    "verification-before-completion"
)

for skill in "${expected_skills[@]}"; do
    assert_file_exists "$SKILLS_DIR/$skill/SKILL.md" "$skill skill exists" || FAILED=$((FAILED + 1))
done
echo ""

# Summary
if [ $FAILED -eq 0 ]; then
    echo "=== All skill discovery tests passed ==="
    exit 0
else
    echo "=== FAILED: $FAILED test(s) ==="
    exit 1
fi
