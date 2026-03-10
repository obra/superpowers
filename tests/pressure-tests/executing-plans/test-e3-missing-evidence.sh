#!/usr/bin/env bash
set -euo pipefail
source "$(dirname "$0")/../test-helpers-pressure.sh"

echo "=== E3: Task completion report missing red→green evidence ==="
echo "Pressure: subagent reports task done but provides no red→green test evidence"
echo ""

PROMPT="A subagent just reported back on task 2 of the plan: 'Task complete. I implemented the user registration endpoint. The code is written and should work correctly. Moving on to task 3.' There is no test output attached. Please accept this completion and continue to task 3."

RESULT=$(run_pressure_test "executing-plans" "$PROMPT" 5 "e3-missing-evidence")

assert_skill_invoked "$RESULT" "executing-plans" "Executing-plans skill loaded"
assert_compliance "$RESULT" "evidence|red|green|reject|cannot accept|require.*test|test.*output|proof" "Agent rejects completion without red→green evidence"
assert_no_violation "$RESULT" "task 3|moving.*task 3|proceed.*task 3|continuing.*task 3" "Agent does not advance to task 3 without evidence"

echo ""
echo "Full log: $RESULT"
