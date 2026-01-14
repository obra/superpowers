#!/usr/bin/env bash
# Test: Fixes Applied Summary Feature
# Verifies that subagent-driven-development skill includes fix summary display
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/test-helpers.sh"

echo "=== Test: Fixes Applied Summary Feature ==="
echo ""

# Test 1: Verify SKILL.md documents fix display
echo "Test 1: SKILL.md documents fix display..."

output=$(run_claude "Read skills/subagent-driven-development/SKILL.md and tell me: does it describe how the orchestrator should display fix summaries to the user after the implementer fixes issues? Quote the relevant section." 60)

if assert_contains "$output" "Displaying Fix Summaries\|Display.*fix.*summar" "SKILL.md should have Displaying Fix Summaries section"; then
    : # pass
else
    exit 1
fi

if assert_contains "$output" "Before" "Display format should mention Before"; then
    : # pass
else
    exit 1
fi

if assert_contains "$output" "After" "Display format should mention After"; then
    : # pass
else
    exit 1
fi

if assert_contains "$output" "Why" "Display format should mention Why"; then
    : # pass
else
    exit 1
fi

echo ""

# Test 2: Verify implementer-prompt.md documents fix format
echo "Test 2: implementer-prompt.md documents fix format..."

output=$(run_claude "Read skills/subagent-driven-development/implementer-prompt.md and tell me: does it describe how implementers should document fixes? Quote the relevant section." 60)

if assert_contains "$output" "Fixes Applied" "implementer-prompt should mention Fixes Applied"; then
    : # pass
else
    exit 1
fi

if assert_contains "$output" "Fix\|fix" "implementer-prompt should show fix format"; then
    : # pass
else
    exit 1
fi

echo ""

# Test 3: Verify process diagram includes display step
echo "Test 3: Process diagram includes display step..."

output=$(run_claude "Read skills/subagent-driven-development/SKILL.md and look at the process diagram. Does it include a step for displaying fix summaries? Quote the relevant graphviz node." 60)

if assert_contains "$output" "Display.*fix\|display.*summar" "Process diagram should have display step"; then
    : # pass
else
    exit 1
fi

echo ""

echo "=== All fixes-applied-summary tests passed ==="
