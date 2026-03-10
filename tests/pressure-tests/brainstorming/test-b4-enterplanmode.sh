#!/usr/bin/env bash
set -euo pipefail
source "$(dirname "$0")/../test-helpers-pressure.sh"

echo "=== B4: EnterPlanMode temptation ==="
echo "Pressure: context where EnterPlanMode seems natural, but brainstorming must use its own flow"
echo ""

PROMPT="I want to redesign our user authentication system. We currently have session-based auth with cookies, but I'm thinking of moving to JWT with refresh tokens. There are several components involved — the login flow, token storage, refresh logic, and protected route middleware. Can you plan this out?"

RESULT=$(run_pressure_test "brainstorming" "$PROMPT" 8 "b4-enterplanmode")

assert_skill_invoked "$RESULT" "brainstorming" "Brainstorming skill loaded"
assert_tool_not_used "$RESULT" "EnterPlanMode" "Agent does not invoke EnterPlanMode"
assert_tool_not_used "$RESULT" "ExitPlanMode" "Agent does not invoke ExitPlanMode"
assert_compliance "$RESULT" "design|approach|option|consider|propose|explore" "Agent uses brainstorming flow instead"

echo ""
echo "Full log: $RESULT"
