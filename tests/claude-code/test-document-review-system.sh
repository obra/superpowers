#!/usr/bin/env bash
# Test: Document Review System
# Verifies that spec and plan document reviewers are integrated correctly
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/test-helpers.sh"

echo "=== Test: Document Review System ==="
echo ""

# Test 1: Spec document reviewer exists and describes correct checks
echo "Test 1: Spec document reviewer checks..."

output=$(run_claude "What does the spec document reviewer check for in the brainstorming skill? List the categories." 30)

if assert_contains "$output" "Completeness\|completeness" "Checks completeness"; then
    : # pass
else
    exit 1
fi

if assert_contains "$output" "TODO\|placeholder" "Checks for TODOs"; then
    : # pass
else
    exit 1
fi

echo ""

# Test 2: Brainstorming skill has spec review loop
echo "Test 2: Brainstorming skill spec review loop..."

output=$(run_claude "Does the brainstorming skill have a spec review loop? What happens if issues are found?" 30)

if assert_contains "$output" "review.*loop\|loop.*review\|re-dispatch\|repeat\|re-review" "Has review loop"; then
    : # pass
else
    exit 1
fi

if assert_contains "$output" "fix.*issues\|issues.*fix" "Fix issues mentioned"; then
    : # pass
else
    exit 1
fi

echo ""

# Test 3: Plan document reviewer exists and checks correct things
echo "Test 3: Plan document reviewer checks..."

output=$(run_claude "What does the plan document reviewer check for in the writing-plans skill? What categories?" 30)

if assert_contains "$output" "Spec Alignment\|spec alignment\|matches.*spec" "Checks spec alignment"; then
    : # pass
else
    exit 1
fi

if assert_contains "$output" "Task Decomposition\|task decomposition\|atomic" "Checks task decomposition"; then
    : # pass
else
    exit 1
fi

echo ""

# Test 4: Writing-plans skill has chunk-by-chunk review
echo "Test 4: Chunk-by-chunk plan review..."

output=$(run_claude "How does the writing-plans skill review plans? Is it all at once or chunk by chunk?" 30)

if assert_contains "$output" "chunk" "Mentions chunks"; then
    : # pass
else
    exit 1
fi

if assert_contains "$output" "1000.*line\|under.*1000\|≤1000" "Mentions chunk size limit"; then
    : # pass
else
    exit 1
fi

echo ""

# Test 5: Review loops have iteration guidance
echo "Test 5: Review loop iteration guidance..."

output=$(run_claude "In the brainstorming or writing-plans skills, what happens if the review loop runs too many times? Is there a limit?" 30)

if assert_contains "$output" "5.*iteration\|5 iteration\|exceed.*5\|human.*guidance" "Has iteration limit or escalation"; then
    : # pass
else
    exit 1
fi

echo ""

# Test 6: Checkbox syntax is on steps only
echo "Test 6: Checkbox syntax on steps..."

output=$(run_claude "In writing-plans, where should checkbox syntax be used - on task headings, steps, or both?" 30)

if assert_contains "$output" "step" "Mentions steps"; then
    : # pass
else
    exit 1
fi

if assert_not_contains "$output" "task.*heading.*checkbox\|checkbox.*task.*heading" "Not on task headings"; then
    : # pass
else
    exit 1
fi

echo ""

# Test 7: Specs go to correct directory
echo "Test 7: Spec document directory..."

output=$(run_claude "Where does the brainstorming skill save spec documents? What directory?" 30)

if assert_contains "$output" "docs/superpowers/specs" "Uses correct spec directory"; then
    : # pass
else
    exit 1
fi

echo ""

# Test 8: Plans go to correct directory
echo "Test 8: Plan document directory..."

output=$(run_claude "Where does the writing-plans skill save plan documents? What directory?" 30)

if assert_contains "$output" "docs/superpowers/plans" "Uses correct plan directory"; then
    : # pass
else
    exit 1
fi

echo ""

# Test 9: Reviewers are advisory
echo "Test 9: Reviewer advisory nature..."

output=$(run_claude "Are the spec and plan document reviewers blocking or advisory? Can disagreements be explained?" 30)

if assert_contains "$output" "advisory\|explain.*disagreement\|disagreement" "Reviewers are advisory"; then
    : # pass
else
    exit 1
fi

echo ""

# Test 10: Same agent fixes issues (preserves context)
echo "Test 10: Same agent fixes issues..."

output=$(run_claude "In the document review loops, who fixes the issues - a new agent or the same agent that wrote the document?" 30)

if assert_contains "$output" "same.*agent\|preserves.*context\|same agent" "Same agent fixes issues"; then
    : # pass
else
    exit 1
fi

echo ""

echo "=== All document review system tests passed ==="
