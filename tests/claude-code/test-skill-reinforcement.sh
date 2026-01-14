#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
# Get the git root of the current worktree
REPO_ROOT="$(cd "$SCRIPT_DIR" && git rev-parse --show-toplevel 2>/dev/null || echo "$SCRIPT_DIR/../../../..")"

echo "=== Skill Reinforcement Verification ==="
echo "Checking skills in: $REPO_ROOT"
echo ""

# Dynamically discover all skills with SKILL.md files
SKILLS=()
while IFS= read -r skill_dir; do
    skill_name=$(basename "$skill_dir")
    SKILLS+=("$skill_name")
done < <(find "$REPO_ROOT/skills" -name "SKILL.md" -exec dirname {} \; | sort)

echo ""
echo "Found ${#SKILLS[@]} skills to verify"
echo ""

PASSED=0
FAILED=0

for skill in "${SKILLS[@]}"; do
    skill_file="$REPO_ROOT/skills/$skill/SKILL.md"
    echo "Testing: $skill"

    if [ ! -f "$skill_file" ]; then
        echo "  ✗ SKILL.md not found at $skill_file"
        ((FAILED++))
        continue
    fi

    if grep -q "COMPULSORY" "$skill_file"; then
        echo "  ✓ Has COMPULSORY gates"
        ((PASSED++))
    else
        echo "  ✗ Missing COMPULSORY gates"
        ((FAILED++))
    fi

    if grep -q "STOP CONDITION" "$skill_file"; then
        echo "  ✓ Has STOP CONDITIONS"
        ((PASSED++))
    else
        echo "  ✗ Missing STOP CONDITIONS"
        ((FAILED++))
    fi
done

echo ""
echo "=== Results ==="
echo "Passed: $PASSED"
echo "Failed: $FAILED"
echo "Skills checked: ${#SKILLS[@]}"

if [ $FAILED -gt 0 ]; then
    exit 1
fi

echo "=== All verification gate checks passed ==="
