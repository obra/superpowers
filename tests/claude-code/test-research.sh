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

# Test 4: Skill mentions all 8 research agents
echo "Test 4: Research skill mentions all 8 agents..."
output=$(run_claude "List all the research agents that the hyperpowers research skill dispatches" 45)
# Check for each agent name
all_found=true
for agent in "codebase-analyst" "git-history-analyzer" "framework-docs-researcher" "best-practices-researcher" "test-coverage-analyst" "error-handling-analyst" "dependency-analyst" "architecture-boundaries-analyst"; do
    if ! echo "$output" | grep -qi "$agent"; then
        echo "  Missing agent: $agent"
        all_found=false
    fi
done
if [ "$all_found" = true ]; then
    echo "  [PASS] All 8 agents mentioned"
else
    echo "  [FAIL] Not all 8 agents mentioned"
    exit 1
fi

echo ""
echo "=== All tests passed ==="
