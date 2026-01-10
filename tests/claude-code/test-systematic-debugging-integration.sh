#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/test-helpers.sh"

echo "=== Integration Test: Systematic Debugging Context Fork ==="
echo ""

# Test 1: Skill frontmatter has context: fork
echo "Test 1: Frontmatter declares context: fork..."
if grep -q "context: fork" "$SCRIPT_DIR/../../skills/systematic-debugging/SKILL.md"; then
    echo "  ✓ context: fork declared in frontmatter"
else
    echo "  ✗ FAIL: context: fork not found in frontmatter"
    exit 1
fi

echo ""

# Test 2: Investigation Summary section exists
echo "Test 2: Investigation Summary section exists..."
if grep -q "Investigation Summary" "$SCRIPT_DIR/../../skills/systematic-debugging/SKILL.md"; then
    echo "  ✓ Investigation Summary section found"
else
    echo "  ✗ FAIL: Investigation Summary section missing"
    exit 1
fi

echo ""

# Test 3: Summary has required sections
echo "Test 3: Summary has required sections..."
for section in "Problem" "Research Process" "Root Cause" "Solution" "Learnings"; do
    if grep -q "### $section" "$SCRIPT_DIR/../../skills/systematic-debugging/SKILL.md"; then
        echo "  ✓ $section section found"
    else
        echo "  ✗ FAIL: $section section missing"
        exit 1
    fi
done

echo ""

# Test 4: Context isolation documented in overview
echo "Test 4: Context isolation documented..."
if grep -q "Context Isolation" "$SCRIPT_DIR/../../skills/systematic-debugging/SKILL.md"; then
    echo "  ✓ Context Isolation section found"
else
    echo "  ✗ FAIL: Context Isolation not documented"
    exit 1
fi

echo ""

# Test 5: Red flags include summary requirement
echo "Test 5: Red flags include summary requirement..."
if grep -A 20 "Red Flags" "$SCRIPT_DIR/../../skills/systematic-debugging/SKILL.md" | grep -q "Investigation Summary"; then
    echo "  ✓ Summary requirement in red flags section"
else
    echo "  ⚠ Warning: Summary may not be in red flags (manual verification needed)"
fi

echo ""

# Test 6: Parser extracts context field
echo "Test 6: Parser extracts context field..."
if grep -q "case 'context'" "$SCRIPT_DIR/../../lib/skills-core.js"; then
    echo "  ✓ Parser handles context field"
else
    echo "  ✗ FAIL: Parser doesn't extract context field"
    exit 1
fi

echo ""
echo "=== All integration tests passed ==="
