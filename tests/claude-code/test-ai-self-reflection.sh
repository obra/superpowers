#!/bin/bash

source "$(dirname "$0")/test-helpers.sh"

echo "=== Test: ai-self-reflection skill ==="
echo ""

# Test 1: Verify skill can be loaded
echo "Test 1: Skill loading..."

output=$(run_claude "What is the ai-self-reflection skill? Describe its purpose briefly." 30)

if assert_contains "$output" "ai-self-reflection" "Skill is recognized"; then
    : # pass
else
    exit 1
fi

if assert_contains "$output" "reflect\|learning\|verification\|skill" "Mentions key concepts"; then
    : # pass
else
    exit 1
fi

echo ""

# Test 2: Verify skill file exists and has correct structure
echo "Test 2: Skill file structure..."

if [ -f ~/Dev/superpowers/skills/ai-self-reflection/SKILL.md ]; then
    echo "  [PASS] Skill file exists"
else
    echo "  [FAIL] Skill file not found"
    exit 1
fi

if grep -q "^name: ai-self-reflection" ~/Dev/superpowers/skills/ai-self-reflection/SKILL.md; then
    echo "  [PASS] Has correct name in frontmatter"
else
    echo "  [FAIL] Missing or incorrect name in frontmatter"
    exit 1
fi

if grep -q "user-correction\|backtracking\|repeated-error" ~/Dev/superpowers/skills/ai-self-reflection/SKILL.md; then
    echo "  [PASS] Contains mistake type definitions"
else
    echo "  [FAIL] Missing mistake type definitions"
    exit 1
fi

echo ""

# Test 3: Verify command file exists
echo "Test 3: Command file..."

if [ -f ~/Dev/superpowers/commands/ai-self-reflection.md ]; then
    echo "  [PASS] Command file exists"
else
    echo "  [FAIL] Command file not found"
    exit 1
fi

if grep -q "REQUIRED SUB-SKILL.*ai-self-reflection" ~/Dev/superpowers/commands/ai-self-reflection.md; then
    echo "  [PASS] Command references skill correctly"
else
    echo "  [FAIL] Command missing skill reference"
    exit 1
fi

echo ""
echo "=== All tests passed ==="
