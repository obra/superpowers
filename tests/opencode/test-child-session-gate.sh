#!/usr/bin/env bash
# Test: Task-subagent child session gate (#2160)
# Verifies bootstrap injection skips child (task subagent) sessions, fails
# open without caching on lookup errors, and logs each decision once.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "=== Test: Child Session Gate (#2160) ==="

source "$SCRIPT_DIR/setup.sh"
trap cleanup_test_env EXIT

run_case() {
    node "$SCRIPT_DIR/test-child-session-gate.mjs" "$SUPERPOWERS_PLUGIN_FILE" "$1"
}

echo "Test 1: Skips bootstrap in child sessions (V1 envelope)..."
run_case skip-child-envelope
echo "  [PASS] Child session gets no controller bootstrap; decision cached; logged once"

echo "Test 2: Injects bootstrap in top-level sessions (V1 envelope)..."
run_case inject-top-level-envelope
echo "  [PASS] Top-level session keeps receiving bootstrap on fresh message arrays"

echo "Test 3: Skips bootstrap in child sessions (bare V2-style record)..."
run_case skip-child-bare-record
echo "  [PASS] Bare-record child session detected without an envelope"

echo "Test 4: Envelope carrying its own parentID key is still detected as child..."
run_case skip-child-envelope-parentid-key
echo "  [PASS] data.parentID wins over a parentID key on the envelope"

echo "Test 5: Non-2xx result tuple fails open, uncached, logged once..."
run_case error-tuple-fail-open-uncached
echo "  [PASS] {data: undefined, error} never poisons the child-session cache (#2160 review finding)"

echo "Test 6: Rejecting lookup fails open, uncached, logged once..."
run_case throw-fail-open-uncached
echo "  [PASS] Thrown lookup errors keep injecting without per-step log spam"

echo "Test 7: Transient lookup failure recovers on the next step..."
run_case transient-error-recovers
echo "  [PASS] Fail-open bootstrap on failure, child skip after recovery"

echo "Test 8: Degenerate response shapes keep injecting..."
run_case degenerate-shapes-inject
echo "  [PASS] {data: null}, {data: {parentID: null}}, {data: {parentID: ''}}, undefined all inject"

echo ""
echo "=== All child session gate tests passed ==="
