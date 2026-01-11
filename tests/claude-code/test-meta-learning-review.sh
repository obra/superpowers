#!/bin/bash

source "$(dirname "$0")/test-helpers.sh"

echo "=== Test: meta-learning-review skill ==="
echo ""

# Test 1: Verify skill can be loaded
echo "Test 1: Skill loading..."

output=$(run_claude "What is the meta-learning-review skill? Describe its key steps briefly." 30)

if assert_contains "$output" "meta-learning-review" "Skill is recognized"; then
    : # pass
else
    exit 1
fi

if assert_contains "$output" "pattern\|analyze\|learning" "Mentions key concepts"; then
    : # pass
else
    exit 1
fi

echo ""

# Test 2: Verify skill describes stale learning handling
echo "Test 2: Stale learning handling..."

output=$(run_claude "In the meta-learning-review skill, how are stale learnings handled? What is the time threshold?" 30)

if assert_contains "$output" "6.*month\|stale\|archive" "Mentions 6 month threshold"; then
    : # pass
else
    exit 1
fi

echo ""

# Test 3: Verify pattern detection threshold is mentioned
echo "Test 3: Pattern detection threshold..."

output=$(run_claude "What is the threshold for detecting patterns in the meta-learning-review skill?" 30)

if assert_contains "$output" "3.*learning\|three\|threshold" "Mentions 3+ learnings threshold"; then
    : # pass
else
    exit 1
fi

echo ""

# Test 4: Verify learning analyzer script works
echo "Test 4: Learning analyzer execution..."

mkdir -p ~/Dev/superpowers/docs/learnings

for i in 1 2 3; do
  cat > ~/Dev/superpowers/docs/learnings/2026-01-0${i}-yaml-issue.md << MDEOF
---
date: 2026-01-0${i}
tags: [yaml, debugging]
workflow: systematic-debugging
---

# YAML Issue $i

Sample learning content.
MDEOF
done

output=$(cd ~/Dev/superpowers && node skills/meta-learning-review/lib/learning-analyzer.js analyze 2>&1)

if assert_contains "$output" "yaml" "Analyzer detects yaml tag"; then
    : # pass
else
    exit 1
fi

if assert_contains "$output" '"count": 3' "Analyzer counts 3 learnings"; then
    : # pass
else
    exit 1
fi

echo ""
echo "=== All tests passed ==="

# Cleanup
rm -rf ~/Dev/superpowers/docs/learnings
