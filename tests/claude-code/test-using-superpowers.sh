#!/usr/bin/env bash
# Test: using-superpowers skill (bootstrap)
# Verifies that the bootstrap skill loads correctly and its core rules are followed
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/test-helpers.sh"

echo "=== Test: using-superpowers skill (bootstrap) ==="
echo ""

# Test 1: Skill is recognized and describes the skill system
echo "Test 1: Skill loading and recognition..."

output=$(run_claude "What is the using-superpowers skill and what does it set up?" 30)

if assert_contains "$output" "using-superpowers\|skills system\|skill system\|superpowers" "Skill is recognized"; then
    : # pass
else
    exit 1
fi

if assert_contains "$output" "skill\|Skill" "Mentions the skills system"; then
    : # pass
else
    exit 1
fi

echo ""

# Test 2: Skill teaches how to discover and invoke skills
echo "Test 2: Skill discovery mechanism..."

output=$(run_claude "According to the using-superpowers skill, how should Claude find and use skills from the h-superpowers plugin?" 30)

if assert_contains "$output" "Skill tool\|skill tool\|h-superpowers:\|plugin" "Mentions skill invocation mechanism"; then
    : # pass
else
    exit 1
fi

echo ""

# Test 3: Skill establishes that skills should auto-trigger
echo "Test 3: Auto-triggering behaviour..."

output=$(run_claude "According to the using-superpowers skill, when should Claude use skills — only when explicitly asked, or automatically?" 30)

if assert_contains "$output" "automatic\|proactively\|trigger\|before.*asked\|without.*asking\|relevant" "Skills auto-trigger"; then
    : # pass
else
    exit 1
fi

if assert_not_contains "$output" "only.*explicitly\|only when asked" "Not only when explicitly asked"; then
    : # pass
else
    exit 1
fi

echo ""

# Test 4: Skill references the brainstorming prerequisite for creative work
echo "Test 4: Brainstorming as prerequisite..."

output=$(run_claude "According to the using-superpowers skill, what skill should be used before starting to build a new feature?" 30)

if assert_contains "$output" "brainstorm\|Brainstorm\|brainstorming\|Brainstorming" "References brainstorming"; then
    : # pass
else
    exit 1
fi

echo ""

# Test 5: Skill establishes that skills are mandatory, not optional
echo "Test 5: Skills are mandatory..."

output=$(run_claude "Are the workflows in the h-superpowers skills library optional suggestions or mandatory? What does using-superpowers say?" 30)

if assert_contains "$output" "mandatory\|required\|REQUIRED\|not.*optional\|must" "Skills are mandatory"; then
    : # pass
else
    exit 1
fi

echo ""

# Summary
echo "=== using-superpowers tests complete ==="
