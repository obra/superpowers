#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/test-helpers.sh"

echo "=== Test: Research Skill ==="
echo ""

# Test 1: Skill is recognized
echo "Test 1: Research skill is recognized..."
output=$(run_claude "What is the research skill in hyperpowers?" 30)
if assert_contains "$output" "research" "Research skill mentioned"; then
    :
else
    exit 1
fi

echo ""

# Test 2: Skill mentions parallel agents
echo "Test 2: Research skill mentions parallel agents..."
output=$(run_claude "How does the hyperpowers research skill gather information?" 30)
if assert_contains "$output" "parallel|agent|codebase|git.*history|framework|best.*practice" "Mentions research agents"; then
    :
else
    exit 1
fi

echo ""

# Test 3: Skill mentions output location
echo "Test 3: Research skill saves to docs/research/..."
output=$(run_claude "Where does the hyperpowers research skill save its output?" 30)
if assert_contains "$output" "docs/research" "Saves to docs/research/"; then
    :
else
    exit 1
fi

echo ""
echo "=== All tests passed ==="
