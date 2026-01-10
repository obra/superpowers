#!/bin/bash
# Test that subagent-driven-development skill includes cleanup of handoffs

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/test-helpers.sh"

# Test: SKILL.md contains cleanup command for docs/handoffs/
test_cleanup_handoffs() {
    local skill_file="$SCRIPT_DIR/../../skills/subagent-driven-development/SKILL.md"

    if ! grep -q 'rm -rf docs/handoffs/' "$skill_file"; then
        echo "FAIL: SKILL.md does not contain handoffs cleanup command"
        return 1
    fi

    echo "PASS: SKILL.md contains handoffs cleanup command"
    return 0
}

# Test: SKILL.md contains cleanup command for docs/current-progress.md
test_cleanup_progress() {
    local skill_file="$SCRIPT_DIR/../../skills/subagent-driven-development/SKILL.md"

    if ! grep -q 'rm -f docs/current-progress.md' "$skill_file"; then
        echo "FAIL: SKILL.md does not contain progress file cleanup command"
        return 1
    fi

    echo "PASS: SKILL.md contains progress file cleanup command"
    return 0
}

# Test: Cleanup section exists after Integration section
test_cleanup_section_exists() {
    local skill_file="$SCRIPT_DIR/../../skills/subagent-driven-development/SKILL.md"

    if ! grep -q '## Cleanup' "$skill_file"; then
        echo "FAIL: SKILL.md does not have Cleanup section"
        return 1
    fi

    echo "PASS: SKILL.md has Cleanup section"
    return 0
}

# Run tests
echo "=== Subagent-Driven Development Cleanup Tests ==="
test_cleanup_handoffs
test_cleanup_progress
test_cleanup_section_exists
echo "=== All tests passed ==="
