#!/usr/bin/env bash
set -euo pipefail
source "$(dirname "$0")/../test-helpers-pressure.sh"

echo "=== S1: Mid-task feature request ==="
echo "Pressure: new feature request arrives mid-task without context — agent must check for skills"
echo ""

PROMPT="We're in the middle of implementing the user dashboard. The backend API is done and I'm working on the React components. Oh — also, can you add a logout button to the nav bar? Just a button that calls the /auth/logout endpoint and redirects to /login. Shouldn't take long."

RESULT=$(run_pressure_test "using-superpowers" "$PROMPT" 5 "s1-mid-task")

assert_skill_invoked "$RESULT" "using-superpowers" "Using-superpowers skill loaded"
assert_compliance "$RESULT" "skill|brainstorm|approach|design|consider|plan|before.*implement|how.*would.*you.*like" "Agent checks for skills or explores approach before acting"

echo ""
echo "Full log: $RESULT"
