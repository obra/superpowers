#!/usr/bin/env bash
# Test suite for writing-plans skill
# Tests the skill that creates detailed implementation plans

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/test-helpers.sh"

echo "========================================="
echo " Writing Plans Skill Tests"
echo "========================================="
echo ""

# Test: writing-plans skill is available
test_writing_plans_availability() {
    echo "Test: writing-plans skill availability..."

    local output
    output=$(run_claude "What is the writing-plans skill for?" 30)

    if echo "$output" | grep -q "writing-plans\|writing plans"; then
        echo "  [PASS] writing-plans skill is available"
        return 0
    else
        echo "  [FAIL] writing-plans skill should be available"
        return 1
    fi
}

# Test: writing-plans creates bite-sized tasks
test_writing_plans_bite_sized_tasks() {
    echo "Test: writing-plans creates bite-sized tasks..."

    local output
    output=$(run_claude "In the writing-plans skill, what size should tasks be?" 30)

    # More flexible matching - check for task size mentions
    if echo "$output" | grep -qE "(2-5|bite-sized|small|2 to 5|分钟|minute|task.*size|small.*task)"; then
        echo "  [PASS] writing-plans mentions bite-sized tasks"
        return 0
    else
        echo "  [FAIL] writing-plans should mention bite-sized tasks"
        echo "  Output: $(echo "$output" | head -30)"
        return 1
    fi
}

# Test: writing-plans includes file paths
test_writing_plans_file_paths() {
    echo "Test: writing-plans includes file paths..."

    local output
    output=$(run_claude "What information should each task in a writing-plans document include?" 30)

    # More flexible - check for file/location mentions or task structure
    if echo "$output" | grep -qiE "(file|路径|path|location|文件|任务.*包含|task.*include|structure)"; then
        echo "  [PASS] writing-plans mentions task structure"
        return 0
    else
        echo "  [FAIL] writing-plans should mention task structure"
        echo "  Output: $(echo "$output" | head -30)"
        return 1
    fi
}

# Test: writing-plans saves to docs/plans
test_writing_plans_save_location() {
    echo "Test: writing-plans save location..."

    local output
    output=$(run_claude "Where does writing-plans skill save the plan documents?" 30)

    if echo "$output" | grep -q "docs/plans"; then
        echo "  [PASS] writing-plans saves to docs/plans"
        return 0
    else
        echo "  [FAIL] writing-plans should save to docs/plans"
        return 1
    fi
}

# Test: writing-plans follows TDD
test_writing_plans_tdd() {
    echo "Test: writing-plans follows TDD..."

    local output
    output=$(run_claude "Does writing-plans require TDD? What testing approach does it use?" 30)

    if echo "$output" | grep -qi "TDD\|test-driven"; then
        echo "  [PASS] writing-plans mentions TDD"
        return 0
    else
        echo "  [FAIL] writing-plans should mention TDD"
        return 1
    fi
}

# Test: writing-plans includes commit steps
test_writing_plans_commit_steps() {
    echo "Test: writing-plans includes commit steps..."

    local output
    output=$(run_claude "What does writing-plans say about git commits?" 30)

    if echo "$output" | grep -q "commit\|Commit"; then
        echo "  [PASS] writing-plans includes commit steps"
        return 0
    else
        echo "  [FAIL] writing-plans should include commit steps"
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

test_writing_plans_availability || ((failed++))
test_writing_plans_bite_sized_tasks || ((failed++))
test_writing_plans_file_paths || ((failed++))
test_writing_plans_save_location || ((failed++))
test_writing_plans_tdd || ((failed++))
test_writing_plans_commit_steps || ((failed++))

echo ""
echo "========================================="
if [ $failed -eq 0 ]; then
    echo "All tests passed!"
    exit 0
else
    echo "$failed test(s) failed"
    exit 1
fi
