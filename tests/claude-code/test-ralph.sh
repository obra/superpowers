#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/test-helpers.sh"

echo "=== Test: Ralph Skill ==="
echo ""

# Test 1: Skill is recognized
echo "Test 1: Ralph skill is recognized..."
output=$(run_claude "What is the ralph skill in hyperpowers?" 30)
if assert_contains "$output" "ralph" "Ralph skill mentioned"; then
    :
else
    exit 1
fi

echo ""

# Test 2: Skill mentions fresh context
echo "Test 2: Ralph skill emphasizes fresh context per iteration..."
output=$(run_claude "What is the core principle of the hyperpowers ralph skill?" 30)
if assert_contains "$output" "fresh" "Mentions fresh context"; then
    :
else
    exit 1
fi

echo ""

# Test 3: Skill mentions tmux background execution
echo "Test 3: Ralph skill uses tmux for background execution..."
output=$(run_claude "How does the hyperpowers ralph skill run in the background?" 30)
if assert_contains "$output" "tmux" "Mentions tmux background"; then
    :
else
    exit 1
fi

echo ""

# Test 4: Skill mentions Haiku model for cost control
echo "Test 4: Ralph skill enforces Haiku model..."
output=$(run_claude "What model does the hyperpowers ralph skill use?" 30)
if assert_contains "$output" "haiku" "Mentions Haiku model"; then
    :
else
    exit 1
fi

echo ""

# Test 5: Skill has multiple commands
echo "Test 5: Ralph skill has init/start/resume/status/stop commands..."
output=$(run_claude "What commands does the hyperpowers ralph skill provide?" 30)
if assert_contains "$output" "start" "Mentions ralph commands"; then
    :
else
    exit 1
fi

echo ""

# Test 6: Skill mentions progress tracking
echo "Test 6: Ralph skill uses progress.txt for state bridging..."
output=$(run_claude "How does the hyperpowers ralph skill track progress between iterations?" 30)
if assert_contains "$output" "progress" "Mentions progress tracking"; then
    :
else
    exit 1
fi

echo ""
echo "=== All tests passed ==="
