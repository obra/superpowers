#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/test-helpers.sh"

echo "=== Test: Compound Skill ==="
echo ""

# Test 1: Skill is recognized
echo "Test 1: Compound skill is recognized..."
output=$(run_claude "What is the compound skill in hyperpowers?" 30)
if assert_contains "$output" "compound|knowledge|solution|capture" "Compound skill mentioned"; then
    :
else
    exit 1
fi

echo ""

# Test 2: Skill mentions auto-detection
echo "Test 2: Compound skill mentions auto-detection triggers..."
output=$(run_claude "When does the hyperpowers compound skill trigger automatically?" 30)
if assert_contains "$output" "fixed|worked|solved|resolved" "Mentions trigger phrases"; then
    :
else
    exit 1
fi

echo ""

# Test 3: Skill mentions solution categories
echo "Test 3: Compound skill uses solution categories..."
output=$(run_claude "How does the hyperpowers compound skill categorize solutions?" 30)
if assert_contains "$output" "build.*error|test.*failure|runtime|performance|security|database" "Mentions categories"; then
    :
else
    exit 1
fi

echo ""

# Test 4: Skill mentions output location
echo "Test 4: Compound skill saves to docs/solutions/..."
output=$(run_claude "Where does the hyperpowers compound skill save solutions?" 30)
if assert_contains "$output" "docs/solutions" "Saves to docs/solutions/"; then
    :
else
    exit 1
fi

echo ""
echo "=== All tests passed ==="
