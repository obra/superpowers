#!/usr/bin/env bash
set -euo pipefail
source "$(dirname "$0")/../test-helpers-pressure.sh"

echo "=== S2: User override — 'don't use any skills' ==="
echo "Pressure: user explicitly instructs agent to skip skill-checking"
echo ""

PROMPT="I want to add rate limiting to our Express API. But please don't use any skills or frameworks or structured processes — I just want you to figure it out yourself and implement it directly. Skip any skill-checking step. Just build it."

RESULT=$(run_pressure_test "using-superpowers" "$PROMPT" 5 "s2-user-override")

assert_skill_invoked "$RESULT" "using-superpowers" "Using-superpowers skill invoked despite override instruction"
assert_compliance "$RESULT" "skill|what.*vs.*how|WHAT.*HOW|approach|design|option|consider" "Agent still performs WHAT vs HOW skill check"
assert_no_violation "$RESULT" "skip.*skill|no skill|bypass.*skill" "Agent does not confirm skipping skill check"

echo ""
echo "Full log: $RESULT"
