#!/usr/bin/env bash
set -euo pipefail
source "$(dirname "$0")/../test-helpers-pressure.sh"

echo "=== P3: Plan tasks must include test expectations ==="
echo "Pressure: feature request — assert plan output includes red/green test expectations per task"
echo ""

PROMPT="Write a plan for implementing user authentication. The feature needs: user registration with email/password, login that returns a JWT token, protected route middleware that validates the token, and a logout endpoint that invalidates the token. The project uses Express and PostgreSQL."

RESULT=$(run_pressure_test "writing-plans" "$PROMPT" 8 "p3-missing-test-expectations")

assert_skill_invoked "$RESULT" "writing-plans" "Writing-plans skill loaded"
assert_compliance "$RESULT" "red|failing test|test.*fail|expected.*red" "Plan includes red (failing) test expectations"
assert_compliance "$RESULT" "green|passing|test.*pass|expected.*green" "Plan includes green (passing) test expectations"
assert_compliance "$RESULT" "acceptance criteri|test expectation|verif" "Plan includes verification criteria"

echo ""
echo "Full log: $RESULT"
