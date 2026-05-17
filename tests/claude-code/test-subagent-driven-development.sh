#!/usr/bin/env bash
# Test: subagent-driven-development skill
# Verifies that the skill is loaded and follows correct workflow
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/test-helpers.sh"

# Path to skill file (relative to this script's directory)
SKILL_FILE="../../skills/subagent-driven-development/SKILL.md"

echo "=== Test: subagent-driven-development skill ==="
echo ""

# Test 1: Verify skill can be loaded
echo "Test 1: Skill loading..."

output=$(run_claude "Read the file at $SKILL_FILE and tell me: what is the subagent-driven-development skill? Describe its key steps briefly." 60 "Read")

if assert_contains "$output" "subagent-driven-development\|Subagent-Driven Development\|Subagent Driven" "Skill is recognized"; then
    : # pass
else
    exit 1
fi

if assert_contains "$output" "Load Plan\|read.*plan\|extract.*tasks" "Mentions loading plan"; then
    : # pass
else
    exit 1
fi

echo ""

# Test 2: Verify skill describes correct workflow order
echo "Test 2: Workflow ordering..."

output=$(run_claude "Read the file at $SKILL_FILE. Answer yes or no: does spec compliance review happen before code quality review in subagent-driven-development?" 60 "Read")

if assert_contains "$output" "[Yy]es\|spec.*compliance.*before\|compliance.*first\|compliance.*then.*quality\|quality.*after.*compliance" "Spec compliance before code quality"; then
    : # pass
else
    exit 1
fi

echo ""

# Test 3: Verify self-review is mentioned
echo "Test 3: Self-review requirement..."

output=$(run_claude "Read the file at $SKILL_FILE and answer: does the subagent-driven-development skill require implementers to do self-review? What should they check?" 60 "Read")

if assert_contains "$output" "self-review\|self review" "Mentions self-review"; then
    : # pass
else
    exit 1
fi

if assert_contains "$output" "verification\|evidence\|tests\|fix\|report" "Requires verification evidence"; then
    : # pass
else
    exit 1
fi

echo ""

# Test 4: Verify plan is read once
echo "Test 4: Plan reading efficiency..."

output=$(run_claude "Read the file at $SKILL_FILE and answer: how many times should the controller read the plan file? When does this happen?" 60 "Read")

if assert_contains "$output" "once\|one time\|single" "Read plan once"; then
    : # pass
else
    exit 1
fi

if assert_contains "$output" "Step 1\|beginning\|start\|Load Plan" "Read at beginning"; then
    : # pass
else
    exit 1
fi

echo ""

# Test 5: Verify spec compliance reviewer is skeptical
echo "Test 5: Spec compliance reviewer mindset..."

output=$(run_claude "Read the file at $SKILL_FILE and answer: what is the spec compliance reviewer's attitude toward the implementer's report?" 60 "Read")

if assert_contains "$output" "not trust\|don't trust\|skeptical\|verify.*independently\|suspiciously" "Reviewer is skeptical"; then
    : # pass
else
    exit 1
fi

if assert_contains "$output" "read.*code\|inspect.*code\|verify.*code" "Reviewer reads code"; then
    : # pass
else
    exit 1
fi

echo ""

# Test 6: Verify review loops
echo "Test 6: Review loop requirements..."

output=$(run_claude "Read the file at $SKILL_FILE and answer: what happens if a reviewer finds issues? Is it a one-time review or a loop?" 60 "Read")

if assert_contains "$output" "loop\|again\|repeat\|until.*approved\|until.*compliant" "Review loops mentioned"; then
    : # pass
else
    exit 1
fi

if assert_contains "$output" "implementer.*fix\|fix.*issues" "Implementer fixes issues"; then
    : # pass
else
    exit 1
fi

echo ""

# Test 7: Verify full task text is provided
echo "Test 7: Task context provision..."

output=$(run_claude "Read the file at $SKILL_FILE and answer: how does the controller provide task information to the implementer subagent? Does it make them read a file or provide it directly?" 60 "Read")

if assert_contains "$output" "provide.*directly\|full.*text\|paste\|include.*prompt\|inline\|passed.*directly" "Provides text directly"; then
    : # pass
else
    exit 1
fi

echo ""

# Test 8: Verify worktree requirement
echo "Test 8: Worktree requirement..."

output=$(run_claude "Read the file at $SKILL_FILE and answer: what workflow skills are required before using subagent-driven-development? List any prerequisites." 60 "Read")

if assert_contains "$output" "using-git-worktrees\|worktree" "Mentions worktree requirement"; then
    : # pass
else
    exit 1
fi

echo ""

# Test 9: Verify main branch warning
echo "Test 9: Main branch red flag..."

output=$(run_claude "Read the file at $SKILL_FILE and answer: is it okay to start implementation directly on the main branch in subagent-driven-development?" 60 "Read")

if assert_contains "$output" "worktree\|feature.*branch\|not.*main\|never.*main\|avoid.*main\|don't.*main\|consent\|permission" "Warns against main branch"; then
    : # pass
else
    exit 1
fi

echo ""

echo "=== All subagent-driven-development skill tests passed ==="
