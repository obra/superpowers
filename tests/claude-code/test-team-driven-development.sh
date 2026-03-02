#!/usr/bin/env bash
# Test: team-driven-development skill
# Verifies that the skill is loaded and covers key workflow concepts
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/test-helpers.sh"

FAILURES=0

show_output() {
    echo "  --- Claude output ---"
    echo "$CLAUDE_OUTPUT" | sed 's/^/  | /'
    echo "  --- end output ---"
}

check() {
    if ! "$@"; then
        FAILURES=$((FAILURES + 1))
    fi
}

echo "=== Test: team-driven-development skill ==="
echo ""

# Test 1: Verify skill can be loaded
echo "Test 1: Skill loading..."

run_claude "What is the team-driven-development skill? Describe it briefly." 90
show_output

check assert_contains "$CLAUDE_OUTPUT" "team-driven-development\|[Tt]eam.driven\|agent team" "Skill is recognized"
check assert_contains "$CLAUDE_OUTPUT" "parallel\|concurrent\|simultaneous\|multiple.*agent" "Mentions parallel execution"

echo ""

# Test 2: Verify team vs subagent distinction
echo "Test 2: Team vs subagent distinction..."

run_claude "In the team-driven-development skill, what is the key difference between agent teams and subagents? Answer concisely." 90
show_output

check assert_contains "$CLAUDE_OUTPUT" "peer.*peer\|direct.*messag\|direct.*communicat\|inter-agent\|communicate.*directly" "Teams have direct communication"
check assert_contains "$CLAUDE_OUTPUT" "hub.*spoke\|through.*lead\|sequential\|independent" "Subagents are hub-and-spoke or sequential"

echo ""

# Test 3: Verify team composition
echo "Test 3: Team composition..."

run_claude "What roles does team-driven-development recommend? Is the composition fixed or flexible?" 90
show_output

check assert_contains "$CLAUDE_OUTPUT" "[Ll]ead\|[Oo]rchestrat" "Mentions lead role"
check assert_contains "$CLAUDE_OUTPUT" "[Ii]mplement" "Mentions implementer role"
check assert_contains "$CLAUDE_OUTPUT" "[Rr]eview" "Mentions reviewer role"
check assert_contains "$CLAUDE_OUTPUT" "[Ff]lexible\|[Cc]ustom\|[Aa]dapt\|not.*fixed\|any.*role\|any.*composition" "Composition is flexible"

echo ""

# Test 4: Verify max team size
echo "Test 4: Team size limits..."

run_claude "What is the maximum recommended team size in team-driven-development? Why?" 90
show_output

check assert_contains "$CLAUDE_OUTPUT" "6\|six" "Max 6 agents"
check assert_contains "$CLAUDE_OUTPUT" "coordination.*overhead\|overhead\|diminishing\|too.*many" "Explains overhead reason"

echo ""

# Test 5: Verify shared task list requirement
echo "Test 5: Shared task list..."

run_claude "How do agents coordinate work in team-driven-development? What shared structure do they use?" 90
show_output

check assert_contains "$CLAUDE_OUTPUT" "shared.*task.*list\|task.*list\|tasks.json\|TaskList\|shared.*list" "Uses shared task list"
check assert_contains "$CLAUDE_OUTPUT" "claim\|assign\|pick.*up\|take.*task" "Agents claim tasks"

echo ""

# Test 6: Verify cost awareness
echo "Test 6: Cost comparison..."

run_claude "How does team-driven-development compare to subagent-driven-development on cost? Give the multiplier." 90
show_output

check assert_contains "$CLAUDE_OUTPUT" "2.*4x\|2-4x\|3x\|2x.*4x\|more.*expensive\|higher.*cost" "Mentions 2-4x cost multiplier"

echo ""

# Test 7: Verify environment prerequisite
echo "Test 7: Environment setup..."

run_claude "What environment variable must be set before using team-driven-development?" 90
show_output

check assert_contains "$CLAUDE_OUTPUT" "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS" "Mentions required env var"

echo ""

# Test 8: Verify escalation to human
echo "Test 8: Human escalation..."

run_claude "When should agents escalate to the human in team-driven-development? List the situations." 90
show_output

check assert_contains "$CLAUDE_OUTPUT" "disagree\|conflict\|architectural\|approach" "Escalate on disagreements"
check assert_contains "$CLAUDE_OUTPUT" "blocked\|external.*decision\|library.*choice\|cost\|budget" "Escalate on blockers or cost"

echo ""

# Test 9: Verify red flags
echo "Test 9: Red flags..."

run_claude "What are the red flags or 'never do' items in team-driven-development?" 90
show_output

check assert_contains "$CLAUDE_OUTPUT" "6\|six.*agent\|exceed" "Never exceed 6 agents"
check assert_contains "$CLAUDE_OUTPUT" "same.*task\|race.*condition\|claim.*same" "Never let agents claim same task"
check assert_contains "$CLAUDE_OUTPUT" "[Mm]ix.*team.*subagent\|[Mm]ix.*subagent.*team\|[Mm]ix.*approach" "Never mix team and subagent approaches"

echo ""

# Test 10: Verify worktree requirement
echo "Test 10: Worktree requirement..."

run_claude "What workflow skills are required before using team-driven-development?" 90
show_output

check assert_contains "$CLAUDE_OUTPUT" "using-git-worktrees\|worktree" "Requires worktrees"
check assert_contains "$CLAUDE_OUTPUT" "writing-plans\|plan" "Requires a plan"
check assert_contains "$CLAUDE_OUTPUT" "finishing-a-development-branch\|finishing.*branch" "Requires finishing skill"

echo ""

if [ $FAILURES -gt 0 ]; then
    echo "=== $FAILURES assertion(s) failed ==="
    exit 1
else
    echo "=== All team-driven-development skill tests passed ==="
fi
