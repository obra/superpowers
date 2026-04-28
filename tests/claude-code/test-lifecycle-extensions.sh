#!/usr/bin/env bash
# Test: lifecycle extensions skill instructions
# Verifies that skills correctly instruct Claude to check extensions
# at each lifecycle event point
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/test-helpers.sh"

echo "=== Test: lifecycle extensions skill instructions ==="
echo ""

# Test 1: using-superpowers teaches about extensions
echo "Test 1: using-superpowers knows about extensions..."

output=$(run_claude "According to the using-superpowers skill, what are lifecycle extensions? List the 7 lifecycle events." 60)

assert_contains "$output" "post-brainstorm" "Mentions post-brainstorm"
assert_contains "$output" "post-plan" "Mentions post-plan"
assert_contains "$output" "pre-task" "Mentions pre-task"
assert_contains "$output" "post-task" "Mentions post-task"
assert_contains "$output" "post-execution" "Mentions post-execution"
assert_contains "$output" "post-review" "Mentions post-review"
assert_contains "$output" "pre-finish" "Mentions pre-finish"

echo ""

# Test 2: executing-plans checks extensions at all 3 points
echo "Test 2: executing-plans extension checks..."

output=$(run_claude "In the executing-plans skill, at what points should you check the extensions registry? List each check point and which event it checks for." 60)

assert_contains "$output" "pre-task" "Checks pre-task extensions"
assert_contains "$output" "post-task" "Checks post-task extensions"
assert_contains "$output" "post-execution" "Checks post-execution extensions"

echo ""

# Test 3: subagent-driven-development checks extensions
echo "Test 3: subagent-driven-development extension checks..."

output=$(run_claude "In the subagent-driven-development skill, where in the workflow should you check extensions? Which lifecycle events are checked?" 60)

assert_contains "$output" "pre-task" "Checks pre-task extensions"
assert_contains "$output" "post-task" "Checks post-task extensions"
assert_contains "$output" "post-execution" "Checks post-execution extensions"

echo ""

# Test 4: writing-plans checks post-plan
echo "Test 4: writing-plans post-plan check..."

output=$(run_claude "In the writing-plans skill, what should you do before offering the execution choice? Specifically, is there an extensions check?" 60)

assert_contains "$output" "post-plan" "Checks post-plan extensions"

echo ""

# Test 5: brainstorming checks post-brainstorm
echo "Test 5: brainstorming post-brainstorm check..."

output=$(run_claude "In the brainstorming skill, is there an extensions registry check before invoking writing-plans? If so, which lifecycle event does it check?" 60)

assert_contains "$output" "post-brainstorm" "Checks post-brainstorm extensions"

echo ""

# Test 6: finishing-a-development-branch checks pre-finish
echo "Test 6: finishing-a-development-branch pre-finish check..."

output=$(run_claude "In the finishing-a-development-branch skill, what is Step 1.5? Which lifecycle event does it check?" 60)

assert_contains "$output" "pre-finish" "Checks pre-finish extensions"

echo ""

# Test 7: requesting-code-review checks post-review
echo "Test 7: requesting-code-review post-review check..."

output=$(run_claude "In the requesting-code-review skill, what is step 4 of 'How to Request'? Which lifecycle event does it check?" 60)

assert_contains "$output" "post-review" "Checks post-review extensions"

echo ""

# Test 8: Non-blocking behavior
echo "Test 8: Extensions don't block workflow..."

output=$(run_claude "According to the using-superpowers skill, what happens if a lifecycle extension fails or isn't found? Quote the relevant rule." 60)

assert_contains "$output" "report and continue" "Extensions are non-blocking"

echo ""

echo "=== All lifecycle extensions skill tests passed ==="
