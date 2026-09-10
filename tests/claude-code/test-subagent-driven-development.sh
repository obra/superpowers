#!/usr/bin/env bash
# Test: subagent-driven-development skill
# Verifies that the skill is loaded and describes the bounded workflow
#
# No drill coverage: this test asks the agent to *describe* SDD (string-
# matches its verbal explanation against expected keywords like
# "persistent", "read-only", "worktree", "phase", "loop"). Drill scenarios
# test behavior (real subagent dispatch, plan-following, review loops),
# not description-recall. Kept by design.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/test-helpers.sh"

CLAUDE_PROMPT_TIMEOUT="${CLAUDE_PROMPT_TIMEOUT:-90}"

echo "=== Test: subagent-driven-development skill ==="
echo ""

# Test 1: Verify skill can be loaded
echo "Test 1: Skill loading..."

output=$(run_claude "What is the subagent-driven-development skill? Describe its key steps briefly." "$CLAUDE_PROMPT_TIMEOUT")

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

# Test 2: Verify the persistent pair
echo "Test 2: Persistent pair..."

output=$(run_claude "In the subagent-driven-development skill, are new implementers and reviewers created for every milestone? Answer using exactly this structure:
Implementer: <persistent or fresh>
Reviewer: <persistent or fresh>" "$CLAUDE_PROMPT_TIMEOUT")

if assert_contains "$output" "Implementer:.*persistent" "Persistent implementer"; then
    : # pass
else
    exit 1
fi

if assert_contains "$output" "Reviewer:.*persistent" "Persistent reviewer"; then
    : # pass
else
    exit 1
fi

echo ""

# Test 3: Verify self-review is mentioned
echo "Test 3: Self-review requirement..."

output=$(run_claude "Does the subagent-driven-development skill require implementers to self-review before handoff, and can self-review replace the external reviews? Answer using exactly this structure:
Self-review required: <yes or no>
Self-review replaces external review: <yes or no>" "$CLAUDE_PROMPT_TIMEOUT")

if assert_contains "$output" "Self-review required:.*yes" "Mentions self-review"; then
    : # pass
else
    exit 1
fi

if assert_contains "$output" "Self-review replaces external review:.*no" "Self-review does not replace external review"; then
    : # pass
else
    exit 1
fi

echo ""

# Test 4: Verify phase size
echo "Test 4: Phase size..."

output=$(run_claude "How many milestones may one approved phase contain in subagent-driven-development?" "$CLAUDE_PROMPT_TIMEOUT")

if assert_contains "$output" "2-3\|two.*three\|at most three" "Phase contains at most 2-3 milestones"; then
    : # pass
else
    exit 1
fi

echo ""

# Test 5: Verify spec compliance reviewer is skeptical
echo "Test 5: Spec compliance reviewer mindset..."

output=$(run_claude "What is the spec compliance reviewer's attitude toward the implementer's report in subagent-driven-development?" "$CLAUDE_PROMPT_TIMEOUT")

if assert_contains "$output" "not.*trust\|don't trust\|skeptical\|verify.*independently\|suspiciously" "Reviewer is skeptical"; then
    : # pass
else
    exit 1
fi

if assert_contains "$output" "read.*code\|inspect.*code\|verify.*code\|read.*diff\|trust.*diff" "Reviewer reads code"; then
    : # pass
else
    exit 1
fi

echo ""

# Test 6: Verify bounded review loops
echo "Test 6: Bounded review loop requirements..."

output=$(run_claude "In subagent-driven-development, what happens if a reviewer finds Critical or Important issues, and what is the review-pass cap?" "$CLAUDE_PROMPT_TIMEOUT")

if assert_contains "$output" "loop\|again\|repeat\|until.*approved\|until.*compliant" "Review loops mentioned"; then
    : # pass
else
    exit 1
fi

if assert_contains "$output" "same.*implementer\|implementer.*same" "Same implementer fixes issues"; then
    : # pass
else
    exit 1
fi

if assert_contains "$output" "three\|3" "Review is capped at three passes"; then
    : # pass
else
    exit 1
fi

echo ""

# Test 7: Verify nested delegation prohibition
echo "Test 7: Nested delegation prohibition..."

output=$(run_claude "May child sessions in subagent-driven-development invoke task, create_session, run_factory, background agents, or nested delegation?" "$CLAUDE_PROMPT_TIMEOUT")

if assert_contains "$output" "no\|must not\|never\|prohibit" "Children cannot delegate"; then
    : # pass
else
    exit 1
fi

echo ""

# Test 8: Verify worktree requirement
echo "Test 8: Worktree requirement..."

output=$(run_claude "What workflow skills are required before using subagent-driven-development? List any prerequisites or required skills." "$CLAUDE_PROMPT_TIMEOUT")

if assert_contains "$output" "using-git-worktrees\|worktree" "Mentions worktree requirement"; then
    : # pass
else
    exit 1
fi

echo ""

# Test 9: Verify main branch warning
echo "Test 9: Main branch red flag..."

output=$(run_claude "In subagent-driven-development, is it okay to start implementation directly on the main branch?" "$CLAUDE_PROMPT_TIMEOUT")

if assert_contains "$output" "worktree\|feature.*branch\|not.*main\|never.*main\|avoid.*main\|don't.*main\|consent\|permission" "Warns against main branch"; then
    : # pass
else
    exit 1
fi

echo ""

# Test 10: Verify stop boundary
echo "Test 10: Phase stop boundary..."

output=$(run_claude "What must the controller do after the approved subagent-driven-development phase completes?" "$CLAUDE_PROMPT_TIMEOUT")

if assert_contains "$output" "stop\|new approval" "Stops after approved phase"; then
    : # pass
else
    exit 1
fi

echo ""

echo "=== All bounded subagent-driven-development skill tests passed ==="
