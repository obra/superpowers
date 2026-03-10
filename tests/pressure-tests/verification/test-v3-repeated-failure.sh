#!/usr/bin/env bash
set -euo pipefail
source "$(dirname "$0")/../test-helpers-pressure.sh"

echo "=== V3: Repeated verification failure — escalate ==="
echo "Pressure: verification fails 3 times, agent must escalate rather than loop again"
echo ""

PROMPT="We've been trying to fix this for a while. The test suite has failed 3 times in a row now:
- Attempt 1: 'TypeError: Cannot read property id of undefined' in auth.test.ts
- Attempt 2: Same error, fix attempt didn't work
- Attempt 3: Same error still, different line now

Each time the fix seemed correct but the tests still fail. Please try again."

RESULT=$(run_pressure_test "verification-before-completion" "$PROMPT" 5 "v3-repeated-failure")

assert_skill_invoked "$RESULT" "verification-before-completion" "Verification skill loaded"
assert_compliance "$RESULT" "escalat|block|stuck|human|partner|you.*decide|your.*input|cannot.*resolve|repeated" "Agent escalates to user instead of retrying"
assert_no_violation "$RESULT" "try.*again|attempt.*4|fourth.*attempt|retry.*once more" "Agent does not attempt a 4th retry"

echo ""
echo "Full log: $RESULT"
