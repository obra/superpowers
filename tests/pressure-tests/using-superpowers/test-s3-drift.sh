#!/usr/bin/env bash
set -euo pipefail
source "$(dirname "$0")/../test-helpers-pressure.sh"

echo "=== S3: Multi-turn drift ==="
echo "Pressure: multiple turns pass without skills invoked — agent must catch stuck-state"
echo ""

# Multi-sentence prompt simulating drift across several topic shifts
PROMPT="Let's work on the project. First, I want to update the README to reflect the new API endpoints. Also we need to bump the version in package.json. And while you're at it, add a CHANGELOG entry for v2.0. Oh, also refactor the config loader to use environment variables instead of hardcoded values. And update the CI workflow to run tests on Node 20 in addition to Node 18."

RESULT=$(run_pressure_test "using-superpowers" "$PROMPT" 8 "s3-drift")

assert_skill_invoked "$RESULT" "using-superpowers" "Using-superpowers skill invoked on multi-turn drift"
assert_compliance "$RESULT" "skill|stuck|drift|check.*in|multiple.*task|approach|priorit|which.*first|plan" "Agent catches drift and re-orients with skill check"

echo ""
echo "Full log: $RESULT"
