#!/usr/bin/env bash
# Test suite for upgrade skill
# Tests the skill that handles version upgrades

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/test-helpers.sh"

echo "========================================="
echo " Upgrade Skill Tests"
echo "========================================="
echo ""

# Test: upgrade skill is available
test_upgrade_availability() {
    echo "Test: upgrade skill availability..."

    local output
    output=$(run_claude "What is the upgrade skill for? When should it be used?" 120)

    if echo "$output" | grep -qi "upgrade"; then
        echo "  [PASS] upgrade skill is available"
        return 0
    else
        echo "  [FAIL] upgrade skill should be available"
        echo "  Output: $(echo "$output" | head -20)"
        return 1
    fi
}

# Test: upgrade mentions version check
test_upgrade_mentions_version() {
    echo "Test: upgrade mentions version checking..."

    local output
    output=$(run_claude "Use the upgrade skill. What version checking does it do?" 120)

    if echo "$output" | grep -qE "(version|版本|4\.2|upgrade)"; then
        echo "  [PASS] upgrade mentions version checking"
        return 0
    else
        echo "  [FAIL] upgrade should mention version checking"
        echo "  Output: $(echo "$output" | head -20)"
        return 1
    fi
}

# Test: upgrade handles DDAW directory
test_upgrade_handles_ddaw() {
    echo "Test: upgrade handles DDAW directory..."

    local output
    output=$(run_claude "Use the upgrade skill. What does it do with document-driven-ai-workflow directory?" 120)

    if echo "$output" | grep -qE "(DDAW|document-driven|迁移|移除|备份|trash)"; then
        echo "  [PASS] upgrade handles DDAW directory"
        return 0
    else
        echo "  [FAIL] upgrade should handle DDAW directory"
        echo "  Output: $(echo "$output" | head -30)"
        return 1
    fi
}

# Test: upgrade mentions docs migration
test_upgrade_mentions_docs_migration() {
    echo "Test: upgrade mentions docs migration..."

    local output
    output=$(run_claude "Use the upgrade skill. What documentation migration does it perform?" 120)

    if echo "$output" | grep -qE "(docs|文档|migrate|迁移|统一)"; then
        echo "  [PASS] upgrade mentions docs migration"
        return 0
    else
        echo "  [FAIL] upgrade should mention docs migration"
        echo "  Output: $(echo "$output" | head -30)"
        return 1
    fi
}

# Test: /upgrade command invokes the skill
test_upgrade_command_invokes_skill() {
    echo "Test: /upgrade command invokes upgrade skill..."

    local output
    output=$(run_claude "Run /upgrade command" 120)

    # The command should trigger the skill
    if echo "$output" | grep -qiE "(upgrade|版本|升级|version)"; then
        echo "  [PASS] /upgrade command invokes upgrade skill"
        return 0
    else
        echo "  [FAIL] /upgrade should invoke upgrade skill"
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

test_upgrade_availability || ((failed++))
test_upgrade_mentions_version || ((failed++))
test_upgrade_handles_ddaw || ((failed++))
test_upgrade_mentions_docs_migration || ((failed++))
test_upgrade_command_invokes_skill || ((failed++))

echo ""
echo "========================================="
if [ $failed -eq 0 ]; then
    echo "All tests passed!"
    exit 0
else
    echo "$failed test(s) failed"
    exit 1
fi
