#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/test-helpers.sh"

TEST_NAME="issue-tracking-integration"

# Helper functions for this test
pass() {
    echo "  [PASS] $1"
}

fail() {
    echo "  [FAIL] $1"
    exit 1
}

test_research_has_related_issues_section() {
    echo "Testing: Research skill includes Related Issues section"

    grep -q "## Related Issues" skills/research/SKILL.md || fail "Missing Related Issues section"
    grep -q "Phase 2.5" skills/research/SKILL.md || fail "Missing Phase 2.5"

    pass "Research skill updated"
}

test_writing_plans_has_issue_context() {
    echo "Testing: Writing-plans skill carries issue context"

    grep -q "Phase 0.5\|Issue Context" skills/writing-plans/SKILL.md || fail "Missing issue context phase"
    grep -q "Related Issues:" skills/writing-plans/SKILL.md || fail "Missing Related Issues in header"
    grep -q "Primary Issue:" skills/writing-plans/SKILL.md || fail "Missing Primary Issue in header"

    pass "Writing-plans skill updated"
}

test_subagent_has_pre_implementation() {
    echo "Testing: Subagent-driven-development has pre-implementation offers"

    grep -q "Pre-Implementation Setup\|Branch Creation Offer" skills/subagent-driven-development/SKILL.md || fail "Missing pre-implementation"
    grep -q "Status Update Offer" skills/subagent-driven-development/SKILL.md || fail "Missing status update offer"
    grep -q "Discovered Work" skills/subagent-driven-development/SKILL.md || fail "Missing discovered work tracking"

    pass "Subagent-driven-development skill updated"
}

test_verification_no_beads_hardcoding() {
    echo "Testing: Verification skill has no beads hardcoding"

    # Should NOT find beads-specific commands
    if grep -q "bd close\|Beads issues CLOSED" skills/verification-before-completion/SKILL.md; then
        fail "Still has beads-specific hardcoding"
    fi

    # Should find system-agnostic offers
    grep -q "Issue Offers Phase\|Issue tracking offers reviewed" skills/verification-before-completion/SKILL.md || fail "Missing system-agnostic offers"

    pass "Verification skill updated"
}

test_finishing_branch_has_close_timing() {
    echo "Testing: Finishing-branch skill has close timing"

    grep -q "Issue Close Offer\|Close timing" skills/finishing-a-development-branch/SKILL.md || fail "Missing close timing"
    grep -q "Closes" skills/finishing-a-development-branch/SKILL.md || fail "Missing PR close reference"

    pass "Finishing-branch skill updated"
}

test_claude_md_system_agnostic() {
    echo "Testing: CLAUDE.md is system-agnostic"

    # Should NOT have mandatory bd commands
    if grep -q "MANDATORY.*bd\|bd ready\|bd close" CLAUDE.md | grep -v "To configure"; then
        fail "Still has mandatory beads commands"
    fi

    # Should mention detection priority
    grep -q "Detection priority" CLAUDE.md || fail "Missing detection priority"

    pass "CLAUDE.md updated"
}

test_agent_structure_complete() {
    echo "Testing: Issue tracking agent structure complete"

    test -f agents/issue-tracking/AGENT.md || fail "Missing AGENT.md"
    test -f agents/issue-tracking/beads-adapter.md || fail "Missing beads-adapter.md"
    test -f agents/issue-tracking/github-adapter.md || fail "Missing github-adapter.md"
    test -f agents/issue-tracking/jira-adapter.md || fail "Missing jira-adapter.md"

    pass "Agent structure complete"
}

# Run all tests
cd "$SCRIPT_DIR/../.."

test_agent_structure_complete
test_research_has_related_issues_section
test_writing_plans_has_issue_context
test_subagent_has_pre_implementation
test_verification_no_beads_hardcoding
test_finishing_branch_has_close_timing
test_claude_md_system_agnostic

echo "All $TEST_NAME tests passed!"
