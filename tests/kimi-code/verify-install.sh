#!/usr/bin/env bash
# Verify Superpowers Kimi Code installation
# Run this in your project directory after installing Superpowers

set -euo pipefail

errors=0

check_path() {
    local path="$1"
    local desc="$2"
    if [[ ! -e "$path" ]]; then
        echo "FAIL: $desc not found at $path" >&2
        ((errors++))
    else
        echo "PASS: $desc"
    fi
}

echo "=== Superpowers Kimi Code Installation Verification ==="
echo ""

skills_dir="$HOME/.kimi/skills"

# 1. Global skills directory
check_path "$skills_dir" "Global skills directory"

# 2. Project bootstrap
check_path ".kimi/AGENTS.md" "Project bootstrap (.kimi/AGENTS.md)"

# 3. Core skills present
required_skills=(
    "using-superpowers"
    "brainstorming"
    "test-driven-development"
    "writing-plans"
    "subagent-driven-development"
    "systematic-debugging"
    "using-git-worktrees"
    "finishing-a-development-branch"
    "requesting-code-review"
    "receiving-code-review"
)

for skill in "${required_skills[@]}"; do
    check_path "$skills_dir/$skill/SKILL.md" "Skill: $skill"
done

# 4. Bootstrap content check
if grep -q "You have superpowers" ".kimi/AGENTS.md"; then
    echo "PASS: Bootstrap contains superpowers preamble"
else
    echo "FAIL: Bootstrap missing 'You have superpowers' preamble" >&2
    ((errors++))
fi

if grep -q "ReadFile" ".kimi/AGENTS.md"; then
    echo "PASS: Bootstrap contains tool mapping"
else
    echo "FAIL: Bootstrap missing Kimi tool mapping" >&2
    ((errors++))
fi

echo ""
echo "===================================="
if [[ $errors -eq 0 ]]; then
    echo "All checks passed! Restart Kimi Code and try: /skill:using-superpowers"
    exit 0
else
    echo "$errors check(s) failed. See errors above."
    exit 1
fi
