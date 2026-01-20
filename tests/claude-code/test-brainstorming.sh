#!/usr/bin/env bash
# Test suite for brainstorming skill
# Tests the skill that helps turn ideas into fully formed designs

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/test-helpers.sh"

echo "========================================="
echo " Brainstorming Skill Tests"
echo "========================================="
echo ""

# Test: brainstorming skill is available and describes its purpose
test_brainstorming_availability() {
    echo "Test: brainstorming skill availability..."

    local output
    output=$(run_claude "What is the brainstorming skill for? When should it be used?" 30)

    if assert_contains "$output" "brainstorming" "Mentions brainstorming"; then
        echo "  [PASS] brainstorming skill is available"
        return 0
    else
        echo "  [FAIL] brainstorming skill should be available"
        return 1
    fi
}

# Test: brainstorming announces itself in Chinese
test_brainstorming_chinese_announcement() {
    echo "Test: brainstorming Chinese announcement..."

    local output
    output=$(run_claude "Use the brainstorming skill to help me design a simple feature" 60)

    # Check for Chinese announcement (flexible matching)
    if echo "$output" | grep -q "使用.*头脑风暴"; then
        echo "  [PASS] brainstorming announces in Chinese"
        return 0
    else
        echo "  [FAIL] brainstorming should announce in Chinese"
        echo "  Output sample: $(echo "$output" | head -20)"
        return 1
    fi
}

# Test: brainstorming asks questions to understand requirements
test_brainstorming_asks_questions() {
    echo "Test: brainstorming asks clarifying questions..."

    local output
    output=$(run_claude "I want to add a login feature. Use brainstorming to help me design it." 60)

    if assert_contains "$output" "?" "Asks questions"; then
        echo "  [PASS] brainstorming asks clarifying questions"
        return 0
    else
        echo "  [FAIL] brainstorming should ask questions"
        echo "  Output: $(echo "$output" | head -30)"
        return 1
    fi
}

# Test: brainstorming proposes multiple approaches
test_brainstorming_proposes_approaches() {
    echo "Test: brainstorming proposes multiple approaches..."

    local output
    output=$(run_claude "Use brainstorming to design a caching strategy. What approaches would you consider?" 60)

    # Check for mentions of options/approaches
    if echo "$output" | grep -iE "(approach|option|alternative|方案|选项|Option 1|Option 2|First|Second)" > /dev/null; then
        echo "  [PASS] brainstorming proposes multiple approaches"
        return 0
    else
        echo "  [FAIL] brainstorming should propose approaches"
        echo "  Output: $(echo "$output" | head -30)"
        return 1
    fi
}

# Test: brainstorming covers design sections
test_brainstorming_design_sections() {
    echo "Test: brainstorming covers design sections..."

    local output
    output=$(run_claude "Use brainstorming skill. What sections does a design document typically include?" 30)

    # Check for key design sections
    local found_sections=0

    for section in "architecture" "component" "data flow" "testing"; do
        if echo "$output" | grep -iq "$section"; then
            ((found_sections++))
        fi
    done

    if [ $found_sections -ge 2 ]; then
        echo "  [PASS] brainstorming covers design sections (found $found_sections)"
        return 0
    else
        echo "  [FAIL] brainstorming should cover design sections"
        echo "  Found $found_sections sections"
        echo "  Output: $(echo "$output" | head -30)"
        return 1
    fi
}

# Test: brainstorming creates design documents
test_brainstorming_creates_docs() {
    echo "Test: brainstorming creates design documents..."

    local output
    output=$(run_claude "In the brainstorming skill, what happens after the design is validated? Where is it saved?" 30)

    if echo "$output" | grep -q "docs/plans"; then
        echo "  [PASS] brainstorming saves to docs/plans"
        return 0
    else
        echo "  [FAIL] brainstorming should mention docs/plans"
        echo "  Output: $(echo "$output" | head -30)"
        return 1
    fi
}

# Run all tests
failed=0

# Check if Claude CLI is available
if ! command -v claude &> /dev/null; then
    echo "SKIPPED: Claude Code CLI not found"
    echo "Install from: https://code.claude.com"
    exit 0
fi

echo "Running tests..."
echo ""

test_brainstorming_availability || ((failed++))
test_brainstorming_chinese_announcement || ((failed++))
test_brainstorming_asks_questions || ((failed++))
test_brainstorming_proposes_approaches || ((failed++))
test_brainstorming_design_sections || ((failed++))
test_brainstorming_creates_docs || ((failed++))

echo ""
echo "========================================="
if [ $failed -eq 0 ]; then
    echo "All tests passed!"
    exit 0
else
    echo "$failed test(s) failed"
    exit 1
fi
