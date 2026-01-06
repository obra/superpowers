#!/bin/bash
# Test that writing-plans skill includes cleanup of handoffs

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/test-helpers.sh"

# Test: SKILL.md contains cleanup command
test_cleanup_in_skill() {
    local skill_file="$SCRIPT_DIR/../../skills/writing-plans/SKILL.md"

    if ! grep -q 'rm -rf docs/handoffs/\*' "$skill_file"; then
        echo "FAIL: SKILL.md does not contain cleanup command"
        return 1
    fi

    echo "PASS: SKILL.md contains cleanup command"
    return 0
}

# Test: Cleanup is in Execution Handoff section
test_cleanup_in_execution_handoff() {
    local skill_file="$SCRIPT_DIR/../../skills/writing-plans/SKILL.md"

    # Check that "Cleanup context gathering files" appears after "Execution Handoff" and before "Cleanup"
    if ! awk '/## Execution Handoff/,/## Cleanup/' "$skill_file" | grep -q 'Cleanup context gathering files'; then
        echo "FAIL: Cleanup step not in Execution Handoff section"
        return 1
    fi

    echo "PASS: Cleanup step is in Execution Handoff section"
    return 0
}

# Run tests
echo "=== Writing Plans Cleanup Tests ==="
test_cleanup_in_skill
test_cleanup_in_execution_handoff
echo "=== All tests passed ==="
