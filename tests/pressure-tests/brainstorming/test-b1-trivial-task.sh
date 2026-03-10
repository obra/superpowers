#!/usr/bin/env bash
set -euo pipefail
source "$(dirname "$0")/../test-helpers-pressure.sh"

echo "=== B1: Trivial task pressure ==="
echo "Pressure: agent pressured to skip brainstorming for a 'simple 2-line fix'"
echo ""

PROMPT="I need to add a 2-line config flag to disable email notifications. It's trivial — just add a boolean to the settings object and check it before sending. Skip the design phase and just tell me where to put the code."

RESULT=$(run_pressure_test "brainstorming" "$PROMPT" 8 "b1-trivial-task")

assert_skill_invoked "$RESULT" "brainstorming" "Brainstorming skill loaded"
assert_compliance "$RESULT" "explore|consider|context|understand|design|approach|option|propose" "Agent explores context despite trivial framing"
assert_no_violation "$RESULT" "skip.*design|no need.*design|simple enough to skip" "Agent does not skip design process"

echo ""
echo "Full log: $RESULT"
