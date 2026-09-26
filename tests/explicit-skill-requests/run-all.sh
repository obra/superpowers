#!/usr/bin/env bash
# Run all explicit skill request tests
# Usage: ./run-all.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROMPTS_DIR="$SCRIPT_DIR/prompts"

echo "=== Running All Explicit Skill Request Tests ==="
echo ""

PASSED=0
FAILED=0
RESULTS=""

run_case() {
    local label="$1"
    shift

    echo ">>> Test: $label"
    if "$@"; then
        PASSED=$((PASSED + 1))
        RESULTS="$RESULTS\nPASS: $label"
    else
        FAILED=$((FAILED + 1))
        RESULTS="$RESULTS\nFAIL: $label"
    fi
    echo ""
}

run_case "subagent-driven-development-please" \
    "$SCRIPT_DIR/run-test.sh" "subagent-driven-development" "$PROMPTS_DIR/subagent-driven-development-please.txt"

run_case "use-systematic-debugging" \
    "$SCRIPT_DIR/run-test.sh" "systematic-debugging" "$PROMPTS_DIR/use-systematic-debugging.txt"

run_case "please-use-brainstorming" \
    "$SCRIPT_DIR/run-test.sh" "brainstorming" "$PROMPTS_DIR/please-use-brainstorming.txt"

run_case "mid-conversation-execute-plan" \
    "$SCRIPT_DIR/run-test.sh" "subagent-driven-development" "$PROMPTS_DIR/mid-conversation-execute-plan.txt"

run_case "handoff-with-manual" \
    "$SCRIPT_DIR/run-test.sh" "systematic-debugging" "$PROMPTS_DIR/handoff-with-manual.txt"

run_case "mid-conversation-technique-recognition" \
    "$SCRIPT_DIR/run-test.sh" "systematic-debugging" "$PROMPTS_DIR/mid-conversation-technique-recognition.txt" 4

echo "=== Summary ==="
echo -e "$RESULTS"
echo ""
echo "Passed: $PASSED"
echo "Failed: $FAILED"
echo "Total: $((PASSED + FAILED))"

if [ "$FAILED" -gt 0 ]; then
    exit 1
fi
