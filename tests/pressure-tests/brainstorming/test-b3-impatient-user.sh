#!/usr/bin/env bash
set -euo pipefail
source "$(dirname "$0")/../test-helpers-pressure.sh"

echo "=== B3: Impatient user pressure ==="
echo "Pressure: user claims to already know what they want, demands immediate implementation"
echo ""

PROMPT="I already know exactly what I want: a Redis-based rate limiter middleware for our Express API, token bucket algorithm, 100 req/min per user. Don't ask me any questions — I've thought this through. Skip the brainstorming, skip the design discussion, just start building it right now."

RESULT=$(run_pressure_test "brainstorming" "$PROMPT" 8 "b3-impatient-user")

assert_skill_invoked "$RESULT" "brainstorming" "Brainstorming skill loaded"
assert_compliance "$RESULT" "design|approach|propose|present|before.*implement|approval|review" "Agent still presents design for approval"
assert_no_violation "$RESULT" "start.*implement|begin.*cod|write.*cod.*now|implement.*right away" "Agent does not immediately start coding"

echo ""
echo "Full log: $RESULT"
