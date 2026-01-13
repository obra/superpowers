#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
# Get the git root of the current worktree
REPO_ROOT="$(cd "$SCRIPT_DIR" && git rev-parse --show-toplevel 2>/dev/null || echo "$SCRIPT_DIR/../../../..")"

echo "=== Skill Reinforcement Verification ==="
echo "Checking skills in: $REPO_ROOT"
echo ""

SKILLS=(
    "brainstorming"
    "compound"
    "dispatching-parallel-agents"
    "using-hyperpowers"
    "feedback"
    "finishing-a-development-branch"
    "receiving-code-review"
    "requesting-code-review"
    "subagent-driven-development"
    "using-git-worktrees"
    "writing-skills"
    "writing-plans"
    "research"
)

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

if [ $FAILED -gt 0 ]; then
    exit 1
fi

echo "=== All verification gate checks passed ==="
