#!/usr/bin/env bash
# Real Codex integration test for Superpowers skills.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ORIGINAL_HOME="${HOME:-}"

if ! command -v codex >/dev/null 2>&1; then
    echo "  [SKIP] Codex not installed - skipping integration tests"
    exit 0
fi

if [ ! -f "$ORIGINAL_HOME/.codex/auth.json" ]; then
    echo "  [SKIP] Codex auth not found at $ORIGINAL_HOME/.codex/auth.json"
    exit 0
fi

source "$SCRIPT_DIR/setup.sh"
source "$SCRIPT_DIR/test-helpers.sh"

trap cleanup_test_env EXIT

echo "=== Test: Codex real skill integration ==="
echo ""

echo "Test 1: subagent-driven-development role pipeline..."
output=$(run_codex 'Use the $subagent-driven-development skill. Reply in exactly two lines:
PIPELINE: <roles in order>
CLARIFICATION: <say whether to use send_input or start a new thread when the worker needs more context>') || {
    echo "  [FAIL] Codex exec failed for subagent-driven-development"
    exit 1
}

assert_contains "$output" "PIPELINE:.*worker.*spec_reviewer.*quality_reviewer.*monitor.*reviewer" \
    "Reports the full role pipeline" || exit 1
assert_contains "$output" "CLARIFICATION:.*send_input" \
    "Uses send_input for clarification" || exit 1
assert_contains "$output" "same thread|same worker thread|same agent thread|keep.*thread" \
    "Keeps clarification in the same thread" || exit 1

echo ""

echo "Test 2: dispatching-parallel-agents orchestration patterns..."
output=$(run_codex 'Use the $dispatching-parallel-agents skill. Reply in exactly three lines:
UI_DEBUGGING: <describe the UI debugging prompt pattern>
FALLBACK: <name the fallback when browser_debugger is unavailable>
FANOUT: <name the homogeneous fan-out tool>') || {
    echo "  [FAIL] Codex exec failed for dispatching-parallel-agents"
    exit 1
}

assert_contains "$output" "UI_DEBUGGING:.*browser_debugger.*explorer.*worker" \
    "Names the UI debugging roles" || exit 1
assert_contains "$output" "FALLBACK:.*explorer.*worker" \
    "Names the explorer + worker fallback" || exit 1
assert_contains "$output" "FANOUT:.*spawn_agents_on_csv" \
    "Names spawn_agents_on_csv for homogeneous fan-out" || exit 1
assert_order "$output" "UI_DEBUGGING:" "FALLBACK:" \
    "Keeps UI debugging before fallback" || exit 1
assert_order "$output" "FALLBACK:" "FANOUT:" \
    "Keeps fallback before fan-out" || exit 1

echo ""
echo "=== All Codex skill integration tests passed ==="
