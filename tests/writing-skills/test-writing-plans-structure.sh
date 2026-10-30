#!/usr/bin/env bash
set -u

# Absolute path to the writing-plans skill
SKILL_UNDER_TEST="/c/Users/user/superpowers/skills/writing-plans/SKILL.md"

PASSES=0
FAILURES=0

TEST_ROOT="$(mktemp -d)"

cleanup() {
  rm -rf "$TEST_ROOT"
}
trap cleanup EXIT

pass() {
  echo "  [PASS] $1"
  PASSES=$((PASSES + 1))
}

fail() {
  echo "  [FAIL] $1"
  FAILURES=$((FAILURES + 1))
}

# Read the skill file
if [[ ! -f "$SKILL_UNDER_TEST" ]]; then
  echo "ERROR: Skill file not found: $SKILL_UNDER_TEST"
  exit 1
fi

skill_content="$(cat "$SKILL_UNDER_TEST")"
description_line="$(grep '^description:' "$SKILL_UNDER_TEST" || echo '')"
description_value="$(echo "$description_line" | sed 's/^description: //' | sed 's/^//;s/ $//')"

echo "Writing-plans structure tests"
echo "============================="
echo "Testing skill: writing-plans"
echo ""

# Test 1: File exists
if [[ -f "$SKILL_UNDER_TEST" ]]; then
  pass "Skill file exists"
else
  fail "Skill file exists"
  echo "  SKIPPING remaining tests - file missing"
  echo ""
  echo "Results: $PASSES passed, $FAILURES failed"
  exit 1
fi

# Test 2: Has YAML frontmatter with 'name'
if printf '%s' "$skill_content" | grep -q '^name:'; then
  pass "Has 'name' in frontmatter"
else
  fail "Has 'name' in frontmatter"
fi

# Test 3: Has YAML frontmatter with 'description'
if printf '%s' "$skill_content" | grep -q '^description:'; then
  pass "Has 'description' in frontmatter"
else
  fail "Has 'description' in frontmatter"
fi

# Test 4: Description starts with 'Use when...'
if echo "$description_value" | grep -q '^Use when'; then
  pass "Description starts with 'Use when...'"
else
  fail "Description starts with 'Use when...'"
  echo "  Found description: '$description_value'"
fi

# Test 5: No narrative storytelling anti-patterns
if ! printf '%s' "$skill_content" | grep -qi 'In session \|We found \|In this session \|The agent '; then
  pass "No narrative storytelling anti-patterns"
else
  fail "No narrative storytelling anti-patterns (found potential narrative)"
fi

# Test 6: Has core principle mention (YAGNI, TDD, or DRY)
if printf '%s' "$skill_content" | grep -qi 'YAGNI\|TDD\|DRY'; then
  pass "Has core principle mention (YAGNI/TDD/DRY)"
else
  fail "Has core principle mention (YAGNI/TDD/DRY)"
fi

# Test 7: Has Task Right-Sizing section
if printf '%s' "$skill_content" | grep -qi 'Task Right-Sizing\|smallest unit'; then
  pass "Has Task Right-Sizing section"
else
  fail "Has Task Right-Sizing section"
fi

# Test 8: Has Step Granularity section
if printf '%s' "$skill_content" | grep -qi 'Step Granularity\|each step is one action'; then
  pass "Has Step Granularity section"
else
  fail "Has Step Granularity section"
fi

# Test 9: Has Plan Document Header section (the required header format)
if printf '%s' "$skill_content" | grep -qi '\[Feature Name\] Implementation Plan'; then
  pass "Has Plan Document Header section"
else
  fail "Has Plan Document Header section"
fi

# Test 10: Has Self-Review section
if printf '%s' "$skill_content" | grep -qi 'Self-Review'; then
  pass "Has Self-Review section"
else
  fail "Has Self-Review section"
fi

echo ""
echo "Results: $PASSES passed, $FAILURES failed"

if [[ "$FAILURES" -gt 0 ]]; then
  echo ""
  echo "At least one test failed. The writing-plans skill needs improvement."
  exit 1
else
  echo ""
  echo "All tests passed! The writing-plans skill structure is valid."
  exit 0
fi
