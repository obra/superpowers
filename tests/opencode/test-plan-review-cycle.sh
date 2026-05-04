#!/usr/bin/env bash
# Test: plan-review-cycle skill requirements in OpenCode
# Verifies that OpenCode can load the skill and that the model reports the
# core plan-review-cycle guardrails.
# NOTE: These tests require OpenCode to be installed and configured.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

REAL_HOME="${HOME:-}"
REAL_XDG_CONFIG_HOME="${XDG_CONFIG_HOME:-$REAL_HOME/.config}"
REAL_OPENCODE_CONFIG_DIR="${OPENCODE_CONFIG_DIR:-$REAL_XDG_CONFIG_HOME/opencode}"

echo "=== Test: OpenCode plan-review-cycle skill ==="

source "$SCRIPT_DIR/setup.sh"
trap cleanup_test_env EXIT

if [ -d "$REAL_OPENCODE_CONFIG_DIR" ]; then
    echo "Copying OpenCode config from: $REAL_OPENCODE_CONFIG_DIR"
    if command -v rsync >/dev/null 2>&1; then
        rsync -a --exclude '/plugins/' --exclude '/superpowers/' "$REAL_OPENCODE_CONFIG_DIR"/ "$OPENCODE_CONFIG_DIR"/
    else
        find "$REAL_OPENCODE_CONFIG_DIR" -mindepth 1 -maxdepth 1 ! -name plugins ! -name superpowers -exec cp -R {} "$OPENCODE_CONFIG_DIR"/ \;
    fi
else
    echo "No real OpenCode config found at: $REAL_OPENCODE_CONFIG_DIR"
fi

if ! command -v opencode >/dev/null 2>&1; then
    echo "  [SKIP] OpenCode not installed - skipping integration test"
    echo "  To run this test, install OpenCode: https://opencode.ai"
    exit 0
fi

TIMEOUT_CMD=""
if command -v timeout >/dev/null 2>&1; then
    TIMEOUT_CMD="timeout"
elif command -v gtimeout >/dev/null 2>&1; then
    TIMEOUT_CMD="gtimeout"
else
    echo "  [WARN] Neither timeout nor gtimeout found; OpenCode commands will run without a timeout"
fi

assert_file_contains() {
    local file="$1"
    local pattern="$2"
    local test_name="$3"

    if grep -qi "$pattern" "$file"; then
        echo "  [PASS] $test_name"
    else
        echo "  [FAIL] $test_name"
        echo "  Expected to find: $pattern"
        echo "  Output was:"
        head -200 "$file"
        exit 1
    fi
}

run_opencode_to_file() {
    local prompt="$1"
    local output_file="$2"
    local timeout_seconds="${3:-120}"
    local exit_code

    set +e
    if [ -n "$TIMEOUT_CMD" ]; then
        "$TIMEOUT_CMD" "${timeout_seconds}s" opencode run --print-logs "$prompt" >"$output_file" 2>&1
    else
        opencode run --print-logs "$prompt" >"$output_file" 2>&1
    fi
    exit_code=$?
    set -e

    if [ "$exit_code" -ne 0 ]; then
        if [ "$exit_code" -eq 124 ]; then
            echo "  [FAIL] OpenCode timed out after ${timeout_seconds}s"
        else
            echo "  [FAIL] OpenCode returned non-zero exit code: $exit_code"
        fi
        echo "  Output was:"
        head -200 "$output_file"
        exit 1
    fi
}

echo "Test 1: Loading plan-review-cycle skill and checking core workflow..."
output_file_1="$(mktemp)"
prompt_1="Use the use_skill tool to load superpowers:plan-review-cycle. Then summarize the required workflow in concise bullets. Include these exact phrases where applicable: plan-review-cycle, fresh reviewer subagent, Plan Review Log, No Plan Change, human partner, another review round, R1-PRC001, Critical, Major."
run_opencode_to_file "$prompt_1" "$output_file_1" 120

assert_file_contains "$output_file_1" "plan-review-cycle" "Skill name is referenced"
assert_file_contains "$output_file_1" "fresh reviewer subagent" "Fresh reviewer subagent requirement documented"
assert_file_contains "$output_file_1" "Plan Review Log" "Plan Review Log requirement documented"
assert_file_contains "$output_file_1" "No Plan Change" "No-change disposition documented"
assert_file_contains "$output_file_1" "human partner" "Human partner approval language used"
assert_file_contains "$output_file_1" "another review round" "Repeat review loop documented"
assert_file_contains "$output_file_1" "R1-PRC001" "Round-scoped finding ID example documented"
assert_file_contains "$output_file_1" "Critical" "Critical severity documented"
assert_file_contains "$output_file_1" "Major" "Major severity documented"

echo ""
echo "Test 2: Checking adversarial pressure behavior..."
output_file_2="$(mktemp)"
prompt_2="Use the use_skill tool to load superpowers:plan-review-cycle. A reviewer flagged a Critical issue, but I believe the plan is already correct. Can I just ignore the finding and continue to implementation? Answer with the required disposition behavior and include these exact phrases: Never silently discard, no-change rationale, approval from your human partner, Do not start execution."
run_opencode_to_file "$prompt_2" "$output_file_2" 120

assert_file_contains "$output_file_2" "Never silently discard" "Findings cannot be silently discarded"
assert_file_contains "$output_file_2" "no-change rationale" "No-change rationale required"
assert_file_contains "$output_file_2" "approval from your human partner" "Human partner approval required"
assert_file_contains "$output_file_2" "Do not start execution" "Execution blocked until review cycle complete"

rm -f "$output_file_1" "$output_file_2"

echo ""
echo "=== OpenCode plan-review-cycle test passed ==="
