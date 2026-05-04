#!/usr/bin/env bash
# Test: plan-review-cycle skill requirements
# Verifies that Claude understands the plan-review-cycle workflow and guardrails.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/test-helpers.sh"

echo "========================================"
echo " Test: plan-review-cycle skill"
echo "========================================"
echo ""

echo "[1/2] Testing skill loading and core workflow requirements..."
output=$(run_claude "Use the plan-review-cycle skill. Describe the required workflow in concise bullets. Include these exact phrases where applicable: fresh reviewer subagent, Plan Review Log, No Plan Change, human partner, another review round, R1-PRC001, Critical, Major." 120)

assert_contains "$output" "plan-review-cycle" "Skill name is referenced"
assert_contains "$output" "fresh reviewer subagent" "Reviewer subagent requirement documented"
assert_contains "$output" "Plan Review Log" "Plan Review Log requirement documented"
assert_contains "$output" "No Plan Change" "No-change disposition documented"
assert_contains "$output" "human partner" "Human partner approval language used"
assert_contains "$output" "another review round" "Repeat review loop documented"
assert_contains "$output" "R1-PRC001" "Round-scoped finding ID example documented"
assert_contains "$output" "Critical" "Critical severity documented"
assert_contains "$output" "Major" "Major severity documented"

echo ""
echo "[2/2] Testing anti-rationalization behavior for unchanged plans..."
pressure_output=$(run_claude "Use the plan-review-cycle skill. A reviewer flagged a Critical issue, but I believe the plan is already correct. Can I just ignore the finding and continue to implementation? Answer with the required disposition behavior and include these exact phrases: Never silently discard, no-change rationale, approval from your human partner, Do not start execution." 120)

assert_contains "$pressure_output" "Never silently discard" "Findings cannot be silently discarded"
assert_contains "$pressure_output" "no-change rationale" "No-change rationale required"
assert_contains "$pressure_output" "approval from your human partner" "Human partner approval required"
assert_contains "$pressure_output" "Do not start execution" "Execution blocked until review cycle complete"

echo ""
echo "=== All plan-review-cycle tests passed ==="
