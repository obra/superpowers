#!/usr/bin/env bash
# Test: Native Skill Tool Functionality
# Verifies that OpenCode's native skill tool can load personal, project,
# and bundled superpowers skills.
# NOTE: These tests require OpenCode to be installed and configured
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
OPENCODE_TEST_TIMEOUT_SECONDS="${OPENCODE_TEST_TIMEOUT_SECONDS:-120}"

echo "=== Test: Tools Functionality ==="

# Source setup to create isolated environment
source "$SCRIPT_DIR/setup.sh"

# Trap to cleanup on exit
trap cleanup_test_env EXIT

# Check if opencode is available
if ! command -v opencode &> /dev/null; then
    echo "  [SKIP] OpenCode not installed - skipping integration tests"
    echo "  To run these tests, install OpenCode: https://opencode.ai"
    exit 0
fi

run_opencode() {
    local result_var="$1"
    local dir="$2"
    local prompt="$3"
    local command_output
    local exit_code

    set +e
    command_output=$(cd "$dir" && timeout "${OPENCODE_TEST_TIMEOUT_SECONDS}s" opencode run --print-logs --format json "$prompt" 2>&1)
    exit_code=$?
    set -e

    if [ $exit_code -eq 124 ]; then
        echo "  [FAIL] OpenCode timed out after ${OPENCODE_TEST_TIMEOUT_SECONDS}s"
        exit 1
    fi

    if [ $exit_code -ne 0 ]; then
        echo "  [FAIL] OpenCode returned non-zero exit code: $exit_code"
        echo "  Output was:"
        awk 'NR <= 80 { print }' <<<"$command_output"
        exit 1
    fi

    printf -v "$result_var" '%s' "$command_output"
}

assert_contains() {
    local output="$1"
    local needle="$2"
    local message="$3"

    if [[ "$output" == *"$needle"* ]]; then
        echo "  [PASS] $message"
    else
        echo "  [FAIL] $message"
        echo "  Expected to find: $needle"
        echo "  Output was:"
        awk 'NR <= 80 { print }' <<<"$output"
        exit 1
    fi
}

# Test 1: Test personal skill loading via OpenCode's native skill tool
echo "Test 1: Testing native skill tool with a personal skill..."
echo "  Running opencode with personal-test request..."

run_opencode output "$TEST_HOME/test-project" "Call the skill tool with name \"personal-test\". Then print the PERSONAL_SKILL_MARKER_12345 marker."
assert_contains "$output" '"tool":"skill"' "OpenCode called the native skill tool"
assert_contains "$output" "PERSONAL_SKILL_MARKER_12345" "native skill tool loaded personal-test skill content"

# Test 2: Test project skill loading
echo ""
echo "Test 2: Testing native skill tool with a project skill..."
echo "  Running opencode with project-test request..."

run_opencode output "$TEST_HOME/test-project" "Call the skill tool with name \"project-test\". Then print the PROJECT_SKILL_MARKER_67890 marker."
assert_contains "$output" "PROJECT_SKILL_MARKER_67890" "native skill tool loaded project-test skill content"

# Test 3: Test bundled superpowers skill loading
echo ""
echo "Test 3: Testing native skill tool with a superpowers skill..."
echo "  Running opencode with brainstorming skill..."

run_opencode output "$TEST_HOME/test-project" "Call the skill tool with name \"brainstorming\". Then tell me the loaded skill title."
assert_contains "$output" '"name":"brainstorming"' "native skill tool loaded bundled brainstorming skill"
assert_contains "$output" "Brainstorming Ideas Into Designs" "brainstorming skill content was returned"

echo ""
echo "=== All native skill tool tests passed ==="
