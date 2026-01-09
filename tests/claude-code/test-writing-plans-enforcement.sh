#!/usr/bin/env bash
# Test: writing-plans skill enforcement language exists
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/test-helpers.sh"

echo "=== Test: writing-plans enforcement language ==="
echo ""

SKILL_FILE="$SCRIPT_DIR/../../skills/writing-plans/SKILL.md"

# Test 1: Iron Law exists
echo "Test 1: Iron Law statement exists..."
if grep -q "IRON LAW: NO PLAN WRITING WITHOUT ALL THREE PHASES COMPLETE" "$SKILL_FILE"; then
    echo "PASS: Iron Law statement found"
else
    echo "FAIL: Iron Law statement missing"
    exit 1
fi

# Test 2: Pre-Plan Writing Gate exists
echo "Test 2: Pre-Plan Writing Gate exists..."
if grep -q "## Pre-Plan Writing Gate" "$SKILL_FILE"; then
    echo "PASS: Pre-Plan Writing Gate section found"
else
    echo "FAIL: Pre-Plan Writing Gate section missing"
    exit 1
fi

# Test 3: Rationalization table exists
echo "Test 3: Rationalization table exists..."
if grep -q "## Do NOT Skip Context Gathering" "$SKILL_FILE"; then
    echo "PASS: Rationalization table found"
else
    echo "FAIL: Rationalization table missing"
    exit 1
fi

# Test 4: Red flags checklist exists
echo "Test 4: Red Flags checklist exists..."
if grep -q "## Red Flags - STOP Immediately" "$SKILL_FILE"; then
    echo "PASS: Red Flags checklist found"
else
    echo "FAIL: Red Flags checklist missing"
    exit 1
fi

# Test 5: Announcement includes enforcement
echo "Test 5: Announcement includes enforcement language..."
if grep -q "MUST complete.*ALL THREE" "$SKILL_FILE"; then
    echo "PASS: Announcement has enforcement language"
else
    echo "FAIL: Announcement missing enforcement language"
    exit 1
fi

# Test 6: Gate verification command exists
echo "Test 6: Gate verification command exists..."
if grep -q "ls docs/handoffs/context-\*.md" "$SKILL_FILE"; then
    echo "PASS: Gate verification command found"
else
    echo "FAIL: Gate verification command missing"
    exit 1
fi

echo ""
echo "=== All writing-plans enforcement tests passed ==="
