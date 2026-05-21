#!/usr/bin/env bash
# Regression check: using-git-worktrees should guard against the known Claude
# Code EnterWorktree parent-checkout core.bare failure mode.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

USING_SKILL="$REPO_ROOT/skills/using-git-worktrees/SKILL.md"

failures=0

assert_contains() {
    local file="$1"
    local pattern="$2"
    local label="$3"

    if grep -Fq "$pattern" "$file"; then
        echo "  [PASS] $label"
    else
        echo "  [FAIL] $label"
        echo "    Expected to find: $pattern"
        echo "    In file: $file"
        failures=$((failures + 1))
    fi
}

assert_not_contains() {
    local file="$1"
    local pattern="$2"
    local label="$3"

    if grep -Fq "$pattern" "$file"; then
        echo "  [FAIL] $label"
        echo "    Did not expect to find: $pattern"
        echo "    In file: $file"
        failures=$((failures + 1))
    else
        echo "  [PASS] $label"
    fi
}

echo "=== EnterWorktree core.bare Guard Test ==="
echo ""

assert_contains "$USING_SKILL" "Known issue (Claude Code)" "Step 1a names the known Claude Code issue"
assert_contains "$USING_SKILL" "EnterWorktree" "Step 1a names EnterWorktree"
assert_contains "$USING_SKILL" "core.bare" "Step 1a names core.bare"
assert_contains "$USING_SKILL" 'PARENT_REPO_ROOT=$(git rev-parse --show-toplevel)' "Step 1a records the parent checkout root"
assert_contains "$USING_SKILL" 'git -C "$PARENT_REPO_ROOT" config --get core.bare' "Step 1a checks parent checkout core.bare"
assert_contains "$USING_SKILL" 'git -C "$PARENT_REPO_ROOT" config --unset core.bare' "Step 1a repairs parent checkout core.bare"
assert_contains "$USING_SKILL" "Native tools handle directory placement, branch creation, and cleanup automatically." "Step 1a still preserves native tool preference"
assert_not_contains "$USING_SKILL" "avoid native tools" "Step 1a does not tell agents to avoid native tools"
assert_not_contains "$USING_SKILL" "skip EnterWorktree" "Step 1a does not tell agents to skip EnterWorktree"

echo ""

if [ "$failures" -gt 0 ]; then
    echo "STATUS: FAILED ($failures failures)"
    exit 1
fi

echo "STATUS: PASSED"
