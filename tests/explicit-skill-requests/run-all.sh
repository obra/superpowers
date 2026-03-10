#!/bin/bash
# Run all explicit skill request tests
# Usage: ./run-all.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROMPTS_DIR="$SCRIPT_DIR/prompts"

echo "=== Running All Explicit Skill Request Tests ==="
echo ""

PASSED=0
FAILED=0
RESULTS=""

# Test: subagent-driven-development, please
echo ">>> Test 1: subagent-driven-development-please"
if "$SCRIPT_DIR/run-test.sh" "subagent-driven-development" "$PROMPTS_DIR/subagent-driven-development-please.txt"; then
    PASSED=$((PASSED + 1))
    RESULTS="$RESULTS\nPASS: subagent-driven-development-please"
else
    FAILED=$((FAILED + 1))
    RESULTS="$RESULTS\nFAIL: subagent-driven-development-please"
fi
echo ""

# Test: use systematic-debugging
echo ">>> Test 2: use-systematic-debugging"
if "$SCRIPT_DIR/run-test.sh" "systematic-debugging" "$PROMPTS_DIR/use-systematic-debugging.txt"; then
    PASSED=$((PASSED + 1))
    RESULTS="$RESULTS\nPASS: use-systematic-debugging"
else
    FAILED=$((FAILED + 1))
    RESULTS="$RESULTS\nFAIL: use-systematic-debugging"
fi
echo ""

# Test: please use brainstorming
echo ">>> Test 3: please-use-brainstorming"
if "$SCRIPT_DIR/run-test.sh" "brainstorming" "$PROMPTS_DIR/please-use-brainstorming.txt"; then
    PASSED=$((PASSED + 1))
    RESULTS="$RESULTS\nPASS: please-use-brainstorming"
else
    FAILED=$((FAILED + 1))
    RESULTS="$RESULTS\nFAIL: please-use-brainstorming"
fi
echo ""

# Test: mid-conversation execute plan
echo ">>> Test 4: mid-conversation-execute-plan"
if "$SCRIPT_DIR/run-test.sh" "subagent-driven-development" "$PROMPTS_DIR/mid-conversation-execute-plan.txt"; then
    PASSED=$((PASSED + 1))
    RESULTS="$RESULTS\nPASS: mid-conversation-execute-plan"
else
    FAILED=$((FAILED + 1))
    RESULTS="$RESULTS\nFAIL: mid-conversation-execute-plan"
fi
echo ""

# Test: use agent-team-driven-development
echo ">>> Test 5: use-agent-team"
if "$SCRIPT_DIR/run-test.sh" "agent-team-driven-development" "$PROMPTS_DIR/use-agent-team.txt"; then
    PASSED=$((PASSED + 1))
    RESULTS="$RESULTS\nPASS: use-agent-team"
else
    FAILED=$((FAILED + 1))
    RESULTS="$RESULTS\nFAIL: use-agent-team"
fi
echo ""

# Test: compose a team (action-oriented)
echo ">>> Test 6: compose-team-action"
if "$SCRIPT_DIR/run-test.sh" "composing-teams" "$PROMPTS_DIR/compose-team-action.txt"; then
    PASSED=$((PASSED + 1))
    RESULTS="$RESULTS\nPASS: compose-team-action"
else
    FAILED=$((FAILED + 1))
    RESULTS="$RESULTS\nFAIL: compose-team-action"
fi
echo ""

# Test: dispatching-parallel-agents
echo ">>> Test 7: dispatch-parallel-agents"
if "$SCRIPT_DIR/run-test.sh" "dispatching-parallel-agents" "$PROMPTS_DIR/dispatch-parallel-agents.txt"; then
    PASSED=$((PASSED + 1))
    RESULTS="$RESULTS\nPASS: dispatch-parallel-agents"
else
    FAILED=$((FAILED + 1))
    RESULTS="$RESULTS\nFAIL: dispatch-parallel-agents"
fi
echo ""

# Test: execute plan (action-oriented)
echo ">>> Test 8: execute-plan-action"
if "$SCRIPT_DIR/run-test.sh" "executing-plans" "$PROMPTS_DIR/execute-plan-action.txt"; then
    PASSED=$((PASSED + 1))
    RESULTS="$RESULTS\nPASS: execute-plan-action"
else
    FAILED=$((FAILED + 1))
    RESULTS="$RESULTS\nFAIL: execute-plan-action"
fi
echo ""

# Test: finish branch (mid-conversation)
echo ">>> Test 9: finish-branch-mid-conversation"
if "$SCRIPT_DIR/run-test.sh" "finishing-a-development-branch" "$PROMPTS_DIR/finish-branch-mid-conversation.txt"; then
    PASSED=$((PASSED + 1))
    RESULTS="$RESULTS\nPASS: finish-branch-mid-conversation"
else
    FAILED=$((FAILED + 1))
    RESULTS="$RESULTS\nFAIL: finish-branch-mid-conversation"
fi
echo ""

# Test: use receiving-code-review
echo ">>> Test 10: use-receiving-code-review"
if "$SCRIPT_DIR/run-test.sh" "receiving-code-review" "$PROMPTS_DIR/use-receiving-code-review.txt"; then
    PASSED=$((PASSED + 1))
    RESULTS="$RESULTS\nPASS: use-receiving-code-review"
else
    FAILED=$((FAILED + 1))
    RESULTS="$RESULTS\nFAIL: use-receiving-code-review"
fi
echo ""

# Test: request code review (action-oriented)
echo ">>> Test 11: request-review-action"
if "$SCRIPT_DIR/run-test.sh" "requesting-code-review" "$PROMPTS_DIR/request-review-action.txt"; then
    PASSED=$((PASSED + 1))
    RESULTS="$RESULTS\nPASS: request-review-action"
else
    FAILED=$((FAILED + 1))
    RESULTS="$RESULTS\nFAIL: request-review-action"
fi
echo ""

# Test: use test-driven-development
echo ">>> Test 12: use-tdd"
if "$SCRIPT_DIR/run-test.sh" "test-driven-development" "$PROMPTS_DIR/use-tdd.txt"; then
    PASSED=$((PASSED + 1))
    RESULTS="$RESULTS\nPASS: use-tdd"
else
    FAILED=$((FAILED + 1))
    RESULTS="$RESULTS\nFAIL: use-tdd"
fi
echo ""

# Test: setup worktree (mid-conversation)
echo ">>> Test 13: setup-worktree"
if "$SCRIPT_DIR/run-test.sh" "using-git-worktrees" "$PROMPTS_DIR/setup-worktree.txt"; then
    PASSED=$((PASSED + 1))
    RESULTS="$RESULTS\nPASS: setup-worktree"
else
    FAILED=$((FAILED + 1))
    RESULTS="$RESULTS\nFAIL: setup-worktree"
fi
echo ""

# Test: use using-superpowers (direct)
echo ">>> Test 14: use-superpowers-direct"
if "$SCRIPT_DIR/run-test.sh" "using-superpowers" "$PROMPTS_DIR/use-superpowers-direct.txt"; then
    PASSED=$((PASSED + 1))
    RESULTS="$RESULTS\nPASS: use-superpowers-direct"
else
    FAILED=$((FAILED + 1))
    RESULTS="$RESULTS\nFAIL: use-superpowers-direct"
fi
echo ""

# Test: verify before done (action-oriented)
echo ">>> Test 15: verify-before-done"
if "$SCRIPT_DIR/run-test.sh" "verification-before-completion" "$PROMPTS_DIR/verify-before-done.txt"; then
    PASSED=$((PASSED + 1))
    RESULTS="$RESULTS\nPASS: verify-before-done"
else
    FAILED=$((FAILED + 1))
    RESULTS="$RESULTS\nFAIL: verify-before-done"
fi
echo ""

# Test: write plan (mid-conversation)
echo ">>> Test 16: write-plan-mid-conversation"
if "$SCRIPT_DIR/run-test.sh" "writing-plans" "$PROMPTS_DIR/write-plan-mid-conversation.txt"; then
    PASSED=$((PASSED + 1))
    RESULTS="$RESULTS\nPASS: write-plan-mid-conversation"
else
    FAILED=$((FAILED + 1))
    RESULTS="$RESULTS\nFAIL: write-plan-mid-conversation"
fi
echo ""

# Test: use writing-skills (direct)
echo ">>> Test 17: use-writing-skills"
if "$SCRIPT_DIR/run-test.sh" "writing-skills" "$PROMPTS_DIR/use-writing-skills.txt"; then
    PASSED=$((PASSED + 1))
    RESULTS="$RESULTS\nPASS: use-writing-skills"
else
    FAILED=$((FAILED + 1))
    RESULTS="$RESULTS\nFAIL: use-writing-skills"
fi
echo ""

echo "=== Summary ==="
echo -e "$RESULTS"
echo ""
echo "Passed: $PASSED"
echo "Failed: $FAILED"
echo "Total: $((PASSED + FAILED))"

if [ "$FAILED" -gt 0 ]; then
    exit 1
fi
