#!/usr/bin/env bash
# Fast smoke tests for test-driven-development skill

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/test-helpers.sh"

echo "=== TDD Smoke Tests ==="
echo ""

if ! command -v claude > /dev/null 2>&1; then
    echo "SKIPPED: Claude Code CLI not found"
    exit 0
fi

echo "Test 1: skill discovery..."
output="$(run_claude "What is the test-driven-development skill for?" 60)"
assert_contains "$output" "test-driven\\|TDD\\|测试驱动开发" "TDD skill is recognized"
echo ""

echo "Test 2: test-first rule..."
output="$(run_claude "Does TDD allow writing code before tests? What is the rule?" 60)"
assert_contains "$output" "no\\|not.*allow\\|test.*first\\|before.*code\\|Iron Law\\|铁律" "TDD keeps the test-first rule"
echo ""

echo "=== TDD smoke tests passed ==="
