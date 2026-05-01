#!/usr/bin/env bash
# Verify Superpowers Kimi Code installation (no-symlink version)
# Checks skills in ~/.config/agents/skills/ and SessionStart hook in config.toml.

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

skills_dir="${HOME}/.config/agents/skills"
config_file="${HOME}/.kimi/config.toml"

# 1. Skills directory exists
check_path "$skills_dir" "Global skills directory (~/.config/agents/skills)"

# 2. SessionStart hook configured
if [ -f "$config_file" ] && grep -q 'event = "SessionStart"' "$config_file" 2>/dev/null; then
    echo "PASS: SessionStart hook configured in ~/.kimi/config.toml"
else
    echo "FAIL: SessionStart hook not found in ~/.kimi/config.toml" >&2
    ((errors++))
fi

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

# 4. merge_all_available_skills enabled
if [ -f "$config_file" ] && grep -q "^merge_all_available_skills = true" "$config_file" 2>/dev/null; then
    echo "PASS: merge_all_available_skills enabled"
else
    echo "FAIL: merge_all_available_skills not enabled in ~/.kimi/config.toml" >&2
    ((errors++))
fi

# 5. Project bootstrap (optional, warn only)
if [ -f ".kimi/AGENTS.md" ]; then
    echo "INFO: Project-level bootstrap found (.kimi/AGENTS.md) — optional"
else
    echo "INFO: No project-level bootstrap (.kimi/AGENTS.md) — global hook handles this"
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
