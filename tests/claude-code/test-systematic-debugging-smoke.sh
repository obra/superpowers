#!/usr/bin/env bash
# Fast smoke tests for systematic-debugging skill

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/test-helpers.sh"

echo "=== Systematic Debugging Smoke Tests ==="
echo ""

if ! command -v claude > /dev/null 2>&1; then
    echo "SKIPPED: Claude Code CLI not found"
    exit 0
fi

echo "Test 1: context loading..."
output="$(run_claude "Before systematic-debugging starts root cause investigation, what context does it try to load?" 60)"
assert_contains "$output" "BUG_DOC\\|TASK_DOC\\|文档\\|context" "debugging loads document context first"
echo ""

echo "Test 2: no premature fix..."
output="$(run_claude "Does systematic-debugging allow fixing before understanding the root cause?" 60)"
assert_contains "$output" "no\\|not.*allow\\|root.*cause\\|understand.*first\\|根本原因\\|绝对不允许" "debugging blocks premature fixes"
echo ""

echo "=== Systematic debugging smoke tests passed ==="
