#!/usr/bin/env bash
set -euo pipefail

test_skill_mentions_codex() {
    skill_file="/Users/fh/.claude/plugins/cache/superpowers/skills/systematic-debugging/SKILL.md"

    if ! grep -qi "codex" "$skill_file"; then
        echo "FAIL: Skill doesn't mention Codex integration"
        return 1
    fi

    echo "PASS: Skill mentions Codex integration"
}

test_phase1_has_codex_option() {
    skill_file="/Users/fh/.claude/plugins/cache/superpowers/skills/systematic-debugging/SKILL.md"

    # Check if Phase 1 section mentions Codex
    if ! sed -n '/^### Phase 1:/,/^### Phase 2:/p' "$skill_file" | grep -qi "codex"; then
        echo "FAIL: Phase 1 doesn't mention Codex delegation option"
        return 1
    fi

    echo "PASS: Phase 1 has Codex delegation option"
}

test_skill_references_codex_delegator() {
    skill_file="/Users/fh/.claude/plugins/cache/superpowers/skills/systematic-debugging/SKILL.md"

    if ! grep -q "codex-delegator" "$skill_file"; then
        echo "FAIL: Skill doesn't reference codex-delegator"
        return 1
    fi

    echo "PASS: Skill references codex-delegator"
}

# Run tests
test_skill_mentions_codex
test_phase1_has_codex_option
test_skill_references_codex_delegator
