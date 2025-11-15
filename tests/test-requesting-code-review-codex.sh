#!/usr/bin/env bash
set -euo pipefail

test_skill_mentions_codex() {
    skill_file="/Users/fh/.claude/plugins/cache/superpowers/skills/requesting-code-review/SKILL.md"

    if ! grep -q "codex" "$skill_file"; then
        echo "FAIL: Skill doesn't mention Codex integration"
        return 1
    fi

    echo "PASS: Skill mentions Codex integration"
}

test_skill_has_delegation_logic() {
    skill_file="/Users/fh/.claude/plugins/cache/superpowers/skills/requesting-code-review/SKILL.md"

    if ! grep -q "Check.*codex.*config" "$skill_file"; then
        echo "FAIL: Skill missing delegation check logic"
        return 1
    fi

    echo "PASS: Skill has delegation check logic"
}

test_skill_references_codex_delegator() {
    skill_file="/Users/fh/.claude/plugins/cache/superpowers/skills/requesting-code-review/SKILL.md"

    if ! grep -q "codex-delegator" "$skill_file"; then
        echo "FAIL: Skill doesn't reference codex-delegator"
        return 1
    fi

    echo "PASS: Skill references codex-delegator"
}

# Run tests
test_skill_mentions_codex
test_skill_has_delegation_logic
test_skill_references_codex_delegator
