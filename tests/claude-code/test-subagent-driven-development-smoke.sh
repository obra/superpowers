#!/usr/bin/env bash
# Fast smoke tests for subagent-driven-development skill

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/test-helpers.sh"

echo "=== Subagent-Driven Development Smoke Tests ==="
echo ""

if ! command -v claude > /dev/null 2>&1; then
    echo "SKIPPED: Claude Code CLI not found"
    exit 0
fi

echo "Test 1: skill discovery..."
output="$(run_claude "What is the subagent-driven-development skill for?" 60)"
assert_contains "$output" "subagent-driven-development\\|subagent\\|子代理" "subagent-driven-development skill is recognized"
echo ""

echo "Test 2: review ordering..."
output="$(run_claude "In subagent-driven-development, which review happens first: spec compliance or code quality?" 60)"
assert_contains "$output" "spec.*first\\|spec compliance\\|规格.*先\\|先.*规格" "subagent review ordering is preserved"
echo ""

echo "=== Subagent-driven development smoke tests passed ==="
