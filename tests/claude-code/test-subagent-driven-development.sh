#!/usr/bin/env bash
# Test: subagent-driven-development skill
# Verifies that the skill is loaded and follows correct workflow
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/test-helpers.sh"

FAILURES=0

# Helper to show Claude's response for debugging
show_output() {
    echo "  --- Claude output ---"
    echo "$CLAUDE_OUTPUT" | sed 's/^/  | /'
    echo "  --- end output ---"
}

# Helper to run assertion without exiting on failure
check() {
    if ! "$@"; then
        FAILURES=$((FAILURES + 1))
    fi
}

echo "=== Test: subagent-driven-development skill ==="
echo ""

# Test 1: Verify skill can be loaded
echo "Test 1: Skill loading..."

run_claude "What is the subagent-driven-development skill? Describe its key steps briefly." 90
show_output

check assert_contains "$CLAUDE_OUTPUT" "subagent-driven-development\|Subagent-Driven Development\|Subagent Driven" "Skill is recognized"
check assert_contains "$CLAUDE_OUTPUT" "Load Plan\|[Rr]ead.*plan\|[Ee]xtract.*tasks" "Mentions loading plan"

echo ""

# Test 2: Verify skill describes correct workflow order
echo "Test 2: Workflow ordering..."

run_claude "In the subagent-driven-development skill, what comes first: spec compliance review or code quality review? Answer in one sentence." 90
show_output

check assert_contains "$CLAUDE_OUTPUT" "[Ss]pec.*compliance.*first\|[Ss]pec.*compliance.*before.*code\|[Ss]pec.*compliance.*then.*code\|1.*[Ss]pec.*compliance" "Spec compliance comes first"

echo ""

# Test 3: Verify self-review is mentioned
echo "Test 3: Self-review requirement..."

run_claude "Does the subagent-driven-development skill require implementers to do self-review? What should they check?" 90
show_output

check assert_contains "$CLAUDE_OUTPUT" "self-review\|self review" "Mentions self-review"
check assert_contains "$CLAUDE_OUTPUT" "completeness\|Completeness\|gaps\|missing.*features\|requirements.*before.*committing\|checks.*own.*work\|miss.*anything\|sanity.*check\|first.pass" "Checks for gaps/completeness"

echo ""

# Test 4: Verify plan is read once
echo "Test 4: Plan reading efficiency..."

run_claude "In subagent-driven-development, how many times should the controller read the plan file? When does this happen?" 90
show_output

check assert_contains "$CLAUDE_OUTPUT" "once\|one time\|single" "Read plan once"
check assert_contains "$CLAUDE_OUTPUT" "Step 1\|beginning\|start\|Load Plan\|first" "Read at beginning"

echo ""

# Test 5: Verify spec compliance reviewer is skeptical
echo "Test 5: Spec compliance reviewer mindset..."

run_claude "What is the spec compliance reviewer's attitude toward the implementer's report in subagent-driven-development?" 90
show_output

check assert_contains "$CLAUDE_OUTPUT" "not trust\|don't trust\|skeptical\|verify.*independently\|suspiciously\|distrust\|independent" "Reviewer is skeptical"
check assert_contains "$CLAUDE_OUTPUT" "read.*code\|inspect.*code\|verify.*code\|review.*code\|check.*code\|examine\|line by line\|independently.*verif\|verif.*independently" "Reviewer verifies independently"

echo ""

# Test 6: Verify review loops
echo "Test 6: Review loop requirements..."

run_claude "In subagent-driven-development, what happens if a reviewer finds issues? Is it a one-time review or a loop?" 90
show_output

check assert_contains "$CLAUDE_OUTPUT" "loop\|again\|repeat\|until.*approved\|until.*compliant\|re-review\|rereview\|cycle" "Review loops mentioned"
check assert_contains "$CLAUDE_OUTPUT" "implementer.*fix\|fix.*issues\|fix.*them\|sent back\|goes back" "Implementer fixes issues"

echo ""

# Test 7: Verify full task text is provided
echo "Test 7: Task context provision..."

run_claude "In subagent-driven-development, how does the controller provide task information to the implementer subagent? Does it make them read a file or provide it directly?" 90
show_output

check assert_contains "$CLAUDE_OUTPUT" "provide.*directly\|full.*text\|paste\|include.*prompt\|directly.*in\|in.*prompt\|context.*directly" "Provides text directly"

echo ""

# Test 8: Verify worktree requirement
echo "Test 8: Worktree requirement..."

run_claude "What workflow skills are required before using subagent-driven-development? List any prerequisites or required skills." 90
show_output

check assert_contains "$CLAUDE_OUTPUT" "using-git-worktrees\|worktree" "Mentions worktree requirement"

echo ""

# Test 9: Verify main branch warning
echo "Test 9: Main branch red flag..."

run_claude "In subagent-driven-development, is it okay to start implementation directly on the main branch?" 90
show_output

check assert_contains "$CLAUDE_OUTPUT" "worktree\|feature.*branch\|not.*main\|never.*main\|avoid.*main\|don't.*main\|consent\|permission\|isolated" "Warns against main branch"

echo ""

if [ $FAILURES -gt 0 ]; then
    echo "=== $FAILURES assertion(s) failed ==="
    exit 1
else
    echo "=== All subagent-driven-development skill tests passed ==="
fi
