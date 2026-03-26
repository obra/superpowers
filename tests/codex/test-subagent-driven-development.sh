#!/usr/bin/env bash
# Test: subagent-driven-development skill
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/test-helpers.sh"

echo "=== Test: subagent-driven-development skill ==="
echo ""

setup_codex_test_env
TEST_PROJECT=$(create_test_project)
trap 'cleanup_test_project "$TEST_PROJECT"; cleanup_codex_test_env' EXIT

echo "Test 1: Skill loading..."
output=$(run_codex "What is the subagent-driven-development skill? Describe its key steps briefly." "$TEST_PROJECT" 60)

assert_contains "$output" "subagent-driven-development|Subagent-Driven Development|Subagent Driven" "Skill is recognized" || exit 1
assert_contains "$output" "Load Plan|read.*plan|extract.*task" "Mentions loading plan" || exit 1

echo ""
echo "Test 2: Workflow ordering..."
output=$(run_codex "In the subagent-driven-development skill, what comes first: spec compliance review or code quality review? Be specific about the order." "$TEST_PROJECT" 60)
assert_contains "$output" "spec compliance review.? comes first|spec compliance review first|spec reviewer.*before.*code quality|two-stage review.*spec compliance.*first.*code quality" "Spec compliance before code quality" || exit 1
assert_contains "$output" "only after spec compliance.*code quality|only after spec review.*code quality|only after spec approval.*code quality|only if spec compliance is approved.*code quality|do not start code quality review before spec compliance" "Code quality waits for spec approval" || exit 1

echo ""
echo "Test 3: Self-review requirement..."
output=$(run_codex "Does the subagent-driven-development skill require implementers to do self-review? What should they check?" "$TEST_PROJECT" 60)
assert_contains "$output" "self-review|self review" "Mentions self-review" || exit 1
assert_contains "$output" "completeness|Completeness|match.*task|miss.*requirements|requested behavior|edge cases|complete|completely|nothing extra|missing requirement|omissions" "Checks completeness" || exit 1

echo ""
echo "Test 4: Plan reading efficiency..."
output=$(run_codex "In subagent-driven-development, how many times should the controller read the plan file? When does this happen?" "$TEST_PROJECT" 60)
assert_contains "$output" "once|one time|single" "Read plan once" || exit 1
assert_contains "$output" "beginning|start|Load Plan|Step 1" "Read at beginning" || exit 1

echo ""
echo "Test 5: Spec compliance reviewer mindset..."
output=$(run_codex "What is the spec compliance reviewer's attitude toward the implementer's report in subagent-driven-development?" "$TEST_PROJECT" 60)
assert_contains "$output" "not trust|don't trust|skeptical|verify.*independently|suspiciously" "Reviewer is skeptical" || exit 1
assert_contains "$output" "read.*code|inspect.*code|verify.*code" "Reviewer reads code" || exit 1

echo ""
echo "Test 6: Review loop requirements..."
output=$(run_codex "In subagent-driven-development, what happens if a reviewer finds issues? Is it a one-time review or a loop?" "$TEST_PROJECT" 60)
assert_contains "$output" "loop|again|repeat|until.*approved|until.*compliant" "Review loops mentioned" || exit 1
assert_contains "$output" "implementer.*fix|fix.*issues" "Implementer fixes issues" || exit 1

echo ""
echo "Test 7: Task context provision..."
output=$(run_codex "In subagent-driven-development, how does the controller provide task information to the implementer subagent? Does it make them read a file or provide it directly?" "$TEST_PROJECT" 60)
assert_contains "$output" "provide.*directly|full.*text|paste|include.*prompt" "Provides text directly" || exit 1
assert_contains "$output" "rather than making.*read.*file|do not tell.*read.*file|don't.*read.*file|never.*read.*file|not:.*read this file yourself|provide full text instead" "Doesn't make subagent read file" || exit 1

echo ""
echo "Test 8: Worktree requirement..."
output=$(run_codex "What workflow skills are required before using subagent-driven-development? List any prerequisites or required skills." "$TEST_PROJECT" 60)
assert_contains "$output" "using-git-worktrees|worktree" "Mentions worktree requirement" || exit 1

echo ""
echo "Test 9: Main branch red flag..."
output=$(run_codex "In subagent-driven-development, is it okay to start implementation directly on the main branch?" "$TEST_PROJECT" 60)
assert_contains "$output" "worktree|feature.*branch|not.*main|never.*main|avoid.*main|don't.*main|consent|permission" "Warns against main branch" || exit 1

echo ""
echo "=== All subagent-driven-development skill tests passed ==="
