#!/usr/bin/env bash
set -euo pipefail

test_skill_exists() {
    skill_file="/Users/fh/.claude/plugins/cache/superpowers/skills/codex-delegator/SKILL.md"
    if [ ! -f "$skill_file" ]; then
        echo "FAIL: Codex delegator skill does not exist"
        return 1
    fi
    echo "PASS: Codex delegator skill exists"
}

test_skill_has_frontmatter() {
    skill_file="/Users/fh/.claude/plugins/cache/superpowers/skills/codex-delegator/SKILL.md"

    if ! grep -q "^---" "$skill_file"; then
        echo "FAIL: Skill missing frontmatter"
        return 1
    fi

    if ! grep -q "^name: codex-delegator" "$skill_file"; then
        echo "FAIL: Skill missing name field"
        return 1
    fi

    echo "PASS: Skill has valid frontmatter"
}

test_skill_defines_delegation_logic() {
    skill_file="/Users/fh/.claude/plugins/cache/superpowers/skills/codex-delegator/SKILL.md"

    if ! grep -q "Codex Delegation" "$skill_file"; then
        echo "FAIL: Skill missing delegation logic section"
        return 1
    fi

    echo "PASS: Skill defines delegation logic"
}

# Run tests
test_skill_exists
test_skill_has_frontmatter
test_skill_defines_delegation_logic
