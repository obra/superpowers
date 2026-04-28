#!/usr/bin/env bash
# Fast smoke tests for brainstorming skill

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/test-helpers.sh"

echo "=== Brainstorming Smoke Tests ==="
echo ""

if ! command -v claude > /dev/null 2>&1; then
    echo "SKIPPED: Claude Code CLI not found"
    exit 0
fi

echo "Test 1: skill discovery..."
output="$(run_claude "What is the brainstorming skill for? When should it be used?" 60)"
assert_contains "$output" "brainstorming\\|头脑风暴\\|设计" "brainstorming skill is recognized"
echo ""

echo "Test 2: adapted document flow..."
output="$(run_claude "After brainstorming validates a design, where is the design saved?" 60)"
assert_contains "$output" "docs/plans" "brainstorming keeps the docs/plans workflow"
echo ""

echo "=== Brainstorming smoke tests passed ==="
