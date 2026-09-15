#!/usr/bin/env bash
# Test: subagent-driven-development skill (direct-execution architecture)
#
# No drill coverage: this test asks the agent to *describe* the skill (string-
# matches its verbal explanation against expected keywords like "directly",
# "self-review", "optional", "user owns"). Drill scenarios test behavior (real
# execution, actual git state), not description-recall. Kept by design.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/test-helpers.sh"

CLAUDE_PROMPT_TIMEOUT="${CLAUDE_PROMPT_TIMEOUT:-90}"

echo "=== Test: subagent-driven-development skill (direct-execution) ==="
echo ""

# Test 1: Skill recognized and states its central rule
echo "Test 1: Skill loading and central rule..."

output=$(run_claude "What is the subagent-driven-development skill? What is its central rule about delegation?" "$CLAUDE_PROMPT_TIMEOUT")

if assert_contains "$output" "subagent-driven-development\|Subagent-Driven Development\|Direct-Execution" "Skill is recognized"; then
    :
else
    exit 1
fi

if assert_contains "$output" "does not automatically delegate\|not.*automatically delegate\|delegation is optional\|optional.*delegat" "States delegation is not automatic"; then
    :
else
    exit 1
fi

echo ""

# Test 2: Default execution model is direct, not a fresh subagent per task
echo "Test 2: Default execution model..."

output=$(run_claude "In subagent-driven-development, who implements each task by default: the primary agent directly, or a fresh subagent dispatched per task? Answer using exactly this structure:
Default implementer: <primary agent directly | subagent per task>" "$CLAUDE_PROMPT_TIMEOUT")

if assert_contains "$output" "Default implementer:.*primary agent" "Primary agent implements directly by default"; then
    :
else
    exit 1
fi

echo ""

# Test 3: Per-task loop includes focused verification, self-review, fix, re-test
echo "Test 3: Per-task verification loop..."

output=$(run_claude "In subagent-driven-development, what happens immediately after implementing a single task, and what happens if that verification fails?" "$CLAUDE_PROMPT_TIMEOUT")

if assert_contains "$output" "focused.*test\|focused.*verif\|run.*test" "Runs focused verification after each task"; then
    :
else
    exit 1
fi

if assert_contains "$output" "self-review" "Self-reviews each task"; then
    :
else
    exit 1
fi

if assert_contains "$output" "fix\|re-test\|test again" "Fixes and re-tests on failure"; then
    :
else
    exit 1
fi

echo ""

# Test 4: Final verification covers full suite + working-tree inspection + plan comparison
echo "Test 4: Final verification scope..."

output=$(run_claude "In subagent-driven-development, once all tasks are complete, what does final verification check? Mention what happens to the working tree and whether the implementation is compared back against the plan." "$CLAUDE_PROMPT_TIMEOUT")

if assert_contains "$output" "full.*test\|entire.*test\|whole.*test suite\|relevant test suite" "Runs the full relevant test suite"; then
    :
else
    exit 1
fi

if assert_contains "$output" "git status\|working tree\|untracked" "Inspects the working tree"; then
    :
else
    exit 1
fi

if assert_contains "$output" "plan\|acceptance criteria" "Compares against the plan/acceptance criteria"; then
    :
else
    exit 1
fi

echo ""

# Test 5: Subagent delegation is optional, based on concrete benefit
echo "Test 5: Optional delegation..."

output=$(run_claude "In subagent-driven-development, is a subagent dispatched for every task automatically, or only in some cases? If only some cases, what makes it worth dispatching one?" "$CLAUDE_PROMPT_TIMEOUT")

if assert_contains "$output" "not.*every task\|not.*automatic\|only when\|concrete benefit\|optional" "Delegation is optional, not automatic per task"; then
    :
else
    exit 1
fi

echo ""

# Test 6: No mandatory reviewer/fixer chain, no recursive delegation by default
echo "Test 6: No mandatory review/fixer chain..."

output=$(run_claude "In subagent-driven-development, is there a mandatory reviewer agent and fixer agent for every task? Can a dispatched subagent spawn its own subagents by default?" "$CLAUDE_PROMPT_TIMEOUT")

if assert_contains "$output" "not.*mandatory\|no mandatory\|optional\|not required" "No mandatory reviewer/fixer agent"; then
    :
else
    exit 1
fi

if assert_contains "$output" "not.*recursive\|no.*recursive\|should not\|avoid" "No recursive delegation by default"; then
    :
else
    exit 1
fi

echo ""

# Test 7: Git history ownership
echo "Test 7: Git ownership..."

output=$(run_claude "According to subagent-driven-development, who decides when to stage, commit, push, and manage branches: Superpowers/the agent, or the user? Answer using exactly this structure:
Owner of staging and commits: <agent | user>" "$CLAUDE_PROMPT_TIMEOUT")

if assert_contains "$output" "Owner of staging and commits:.*user" "User owns staging/commits/branch management"; then
    :
else
    exit 1
fi

echo ""

# Test 8: Working tree default, worktrees optional
echo "Test 8: Working tree default..."

output=$(run_claude "In subagent-driven-development, is a git worktree or new branch required before implementation can begin, or does work happen in the current working tree by default?" "$CLAUDE_PROMPT_TIMEOUT")

if assert_contains "$output" "current working tree\|not required\|optional" "Current working tree is the default; worktree is optional"; then
    :
else
    exit 1
fi

echo ""

# Test 9: No execution ledger / hidden progress state
echo "Test 9: No execution ledger..."

output=$(run_claude "Does subagent-driven-development create a persistent execution ledger, workspace directory, or other hidden state file to track task progress across the session?" "$CLAUDE_PROMPT_TIMEOUT")

if assert_contains "$output" "no\|does not\|not create" "No execution ledger or hidden progress state"; then
    :
else
    exit 1
fi

echo ""

echo "=== All subagent-driven-development skill tests passed ==="
