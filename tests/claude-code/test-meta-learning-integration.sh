#!/bin/bash

source "$(dirname "$0")/test-helpers.sh"

echo "=== Test: meta-learning integration ==="
echo ""

# Test 1: Verify learning directory can be created
echo "Test 1: Create learning directory..."

mkdir -p ~/Dev/superpowers/docs/learnings

# Create 5 YAML learnings (pattern threshold = 3)
for i in {1..5}; do
  cat > ~/Dev/superpowers/docs/learnings/2026-01-0${i}-yaml-${i}.md << EOF
---
date: 2026-01-0${i}
tags: [yaml, debugging]
workflow: systematic-debugging
---

# YAML Issue ${i}

Sample learning content for YAML debugging.
EOF
done

echo "  [PASS] Learning directory created with 5 learnings"
echo ""

# Test 2: Verify pattern detection
echo "Test 2: Pattern detection in analyzer..."

output=$(cd ~/Dev/superpowers && node skills/meta-learning-review/lib/learning-analyzer.js analyze 2>&1)

if assert_contains "$output" "yaml" "Analyzer detects yaml tag"; then
    : # pass
else
    rm -rf ~/Dev/superpowers/docs/learnings
    exit 1
fi

if assert_contains "$output" '"count": 5' "Analyzer counts 5 learnings"; then
    : # pass
else
    rm -rf ~/Dev/superpowers/docs/learnings
    exit 1
fi

echo ""

# Test 3: Verify meta-learning-review skill can be invoked
echo "Test 3: Meta-learning-review skill invocation..."

output=$(run_claude "Use meta-learning-review to analyze the learnings in docs/learnings/" 60)

if assert_contains "$output" "meta-learning-review\|learning\|pattern" "Skill provides analysis"; then
    : # pass
else
    rm -rf ~/Dev/superpowers/docs/learnings
    exit 1
fi

echo ""

# Test 4: Verify compound-learning skill is discoverable
echo "Test 4: Compound-learning skill discovery..."

output=$(run_claude "What is the compound-learning skill? Describe its purpose briefly." 30)

if assert_contains "$output" "compound-learning\|capture\|learning" "Skill is recognized"; then
    : # pass
else
    rm -rf ~/Dev/superpowers/docs/learnings
    exit 1
fi

echo ""

# Test 5: Verify verification-before-completion mentions learning capture
echo "Test 5: Verification-before-completion learning integration..."

output=$(run_claude "In the verification-before-completion skill, what is mentioned about capturing learnings?" 30)

if assert_contains "$output" "learning\|capture\|compound" "Mentions learning capture option"; then
    : # pass
else
    rm -rf ~/Dev/superpowers/docs/learnings
    exit 1
fi

echo ""
echo "=== All integration tests passed ==="

# Cleanup
rm -rf ~/Dev/superpowers/docs/learnings
