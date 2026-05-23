#!/usr/bin/env bash
# Test: subagent-driven-development review admission receipts
# Verifies that the SDD skill preserves mandatory first reviews while requiring
# an evidence-backed receipt before extra review/re-review passes.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
SKILL_FILE="$REPO_ROOT/skills/subagent-driven-development/SKILL.md"

echo "=== Test: SDD review admission receipts ==="
echo ""

assert_file_contains() {
    local pattern="$1"
    local test_name="$2"

    if grep -qE "$pattern" "$SKILL_FILE"; then
        echo "  [PASS] $test_name"
    else
        echo "  [FAIL] $test_name"
        echo "  Expected pattern: $pattern"
        exit 1
    fi
}

assert_file_contains "Review Admission Receipt" "Defines review admission receipt"
assert_file_contains "first spec compliance review.*mandatory" "Preserves mandatory first spec review"
assert_file_contains "first code quality review.*mandatory" "Preserves mandatory first quality review"
assert_file_contains "Do not use.*skip the first spec compliance review" "Prevents using receipts to skip initial reviews"
assert_file_contains "before dispatching any extra review pass" "Requires receipt before extra review passes"
assert_file_contains "spec re-review" "Covers spec re-review"
assert_file_contains "code quality re-review" "Covers quality re-review"
assert_file_contains "What changed since the last review" "Receipt records changed diff/result"
assert_file_contains "Remaining risk" "Receipt records remaining risk"
assert_file_contains "Verifier state" "Receipt records verifier state"
assert_file_contains "Admission decision" "Receipt records admission decision"
assert_file_contains "changed since the last review" "Admits based on observable change"
assert_file_contains "failing targeted test.*green" "Admits based on verifier delta"
assert_file_contains "new failure class" "Admits based on new failure class"
assert_file_contains "public API.*security.*data loss.*concurrency.*broad integration" "Admits based on high-risk boundaries"
assert_file_contains "defer.*group review.*final branch review" "Defers non-admitted concerns to meaningful review boundary"

echo ""
echo "=== SDD review admission receipt tests passed ==="
