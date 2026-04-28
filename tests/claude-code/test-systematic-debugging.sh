#!/usr/bin/env bash
# Test suite for systematic-debugging skill
# Tests the debugging workflow skill

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/test-helpers.sh"

echo "========================================="
echo " Systematic Debugging Skill Tests"
echo "========================================="
echo ""

SKILL_PATH="skills/systematic-debugging/SKILL.md"

# Test: debugging skill is available
test_debugging_availability() {
    echo "Test: debugging skill availability..."

    local output
    output=$(run_claude "Read $SKILL_PATH in the current workspace and answer only from that file. What is the systematic-debugging skill for?" 120)

    if echo "$output" | grep -qi "debugging\|debug"; then
        echo "  [PASS] debugging skill is available"
        return 0
    else
        echo "  [FAIL] debugging skill should be available"
        return 1
    fi
}

# Test: debugging has 4 phases
test_debugging_four_phases() {
    echo "Test: debugging has 4 phases..."

    local output
    output=$(run_claude "Read $SKILL_PATH in the current workspace and answer only from that file. What are the phases of systematic-debugging? List them." 120)

    # Look for mentions of the current phase names or their core concepts
    local found_phases=0
    echo "$output" | grep -qiE "(Phase 0|load.*context|BUG_DOC|TASK_DOC|文档上下文)" && ((found_phases++))
    echo "$output" | grep -qiE "(Phase 1|root cause|investigation|根因|调查)" && ((found_phases++))
    echo "$output" | grep -qiE "(Phase 2|pattern analysis|模式分析)" && ((found_phases++))
    echo "$output" | grep -qiE "(Phase 3|hypothes|testing|假设|验证)" && ((found_phases++))
    echo "$output" | grep -qiE "(Phase 4|implementation|fix|修复|实现)" && ((found_phases++))

    if [ $found_phases -ge 4 ]; then
        echo "  [PASS] debugging mentions phases (found $found_phases)"
        return 0
    else
        echo "  [FAIL] debugging should mention phases"
        echo "  Output: $(echo "$output" | head -30)"
        return 1
    fi
}

# Test: debugging loads document context before investigation
test_debugging_context_loading_first() {
    echo "Test: debugging loads document context first..."

    local output
    output=$(run_claude "Read $SKILL_PATH in the current workspace and answer only from that file. What happens before systematic-debugging starts root cause investigation?" 120)

    if echo "$output" | grep -qiE "(Phase 0|BUG_DOC|TASK_DOC|文档上下文|context)"; then
        echo "  [PASS] debugging loads context before investigation"
        return 0
    else
        echo "  [FAIL] debugging should load document context first"
        echo "  Output: $(echo "$output" | head -30)"
        return 1
    fi
}

# Test: debugging forms hypotheses
test_debugging_hypothesis() {
    echo "Test: debugging forms hypotheses..."

    local output
    output=$(run_claude "Read $SKILL_PATH in the current workspace and answer only from that file. Does systematic-debugging form hypotheses before fixing bugs?" 120)

    # Check for hypothesis-related terms (English and Chinese)
    if echo "$output" | grep -qiE "(hypothes|theory|guess|suspect|假设|推测|猜想|怀疑|根因|原因)"; then
        echo "  [PASS] debugging mentions hypotheses"
        return 0
    else
        echo "  [FAIL] debugging should mention hypotheses"
        echo "  Output: $(echo "$output" | head -30)"
        return 1
    fi
}

# Test: debugging verifies fix
test_debugging_verify_fix() {
    echo "Test: debugging verifies fix..."

    local output
    output=$(run_claude "Read $SKILL_PATH in the current workspace and answer only from that file. In systematic-debugging, should you verify the fix after implementing it? Answer briefly and mention the proof step." 180)

    if echo "$output" | grep -qi "verif\|test.*fix\|confirm"; then
        echo "  [PASS] debugging verifies fix"
        return 0
    else
        echo "  [FAIL] debugging should verify fix"
        return 1
    fi
}

# Test: debugging prevents premature fixes
test_debugging_no_premature_fix() {
    echo "Test: debugging prevents premature fixes..."

    local output
    output=$(run_claude "Read $SKILL_PATH in the current workspace and answer only from that file. Does systematic-debugging allow fixing before understanding the root cause?" 120)

    if echo "$output" | grep -qiE "(no|not.*allow|understand.*first|root.*cause|根本原因|绝对不允许)"; then
        echo "  [PASS] debugging prevents premature fixes"
        return 0
    else
        echo "  [FAIL] debugging should prevent premature fixes"
        return 1
    fi
}

# Run all tests
failed=0

if ! command -v claude &> /dev/null; then
    echo "SKIPPED: Claude Code CLI not found"
    exit 0
fi

echo "Running tests..."
echo ""

test_debugging_availability || ((failed++))
test_debugging_four_phases || ((failed++))
test_debugging_context_loading_first || ((failed++))
test_debugging_hypothesis || ((failed++))
test_debugging_verify_fix || ((failed++))
test_debugging_no_premature_fix || ((failed++))

echo ""
echo "========================================="
if [ $failed -eq 0 ]; then
    echo "All tests passed!"
    exit 0
else
    echo "$failed test(s) failed"
    exit 1
fi
