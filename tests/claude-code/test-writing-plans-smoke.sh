#!/usr/bin/env bash
# Fast smoke tests for writing-plans skill

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/test-helpers.sh"

echo "=== Writing Plans Smoke Tests ==="
echo ""

if ! command -v claude > /dev/null 2>&1; then
    echo "SKIPPED: Claude Code CLI not found"
    exit 0
fi

echo "Test 1: skill discovery..."
output="$(run_claude "What is the writing-plans skill for?" 60)"
assert_contains "$output" "writing-plans\\|writing plans\\|编写计划\\|实施计划" "writing-plans skill is recognized"
echo ""

echo "Test 2: task sizing..."
output="$(run_claude "In writing-plans, how large should each task be?" 60)"
assert_contains "$output" "2-5\\|bite-sized\\|small\\|分钟\\|minute" "writing-plans keeps bite-sized tasks"
echo ""

echo "=== Writing plans smoke tests passed ==="
