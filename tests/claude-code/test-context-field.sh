#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/test-helpers.sh"

echo "=== Test: Context Field Parsing ==="
echo ""

# Test 1: Parser recognizes context field
echo "Test 1: Frontmatter parser extracts context field..."
output=$(run_claude "What fields does the hyperpowers frontmatter parser extract from SKILL.md files?" 30)
if assert_contains "$output" "context" "Context field mentioned"; then
    :
else
    exit 1
fi

echo ""
echo "=== All tests passed ==="
