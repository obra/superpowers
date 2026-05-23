#!/usr/bin/env bash
# Regression check: plan execution skills should support context-frugal resume
# without reloading an entire long plan just to find the next task.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

EXECUTING_PLANS="$REPO_ROOT/skills/executing-plans/SKILL.md"
SDD_SKILL="$REPO_ROOT/skills/subagent-driven-development/SKILL.md"

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

echo "=== Context-Frugal Resume Contract Test ==="
echo ""

assert_contains "$EXECUTING_PLANS" "## Context-Frugal Resume" "executing-plans documents context-frugal resume"
assert_contains "$EXECUTING_PLANS" "Read the plan header first" "executing-plans reads header first"
assert_contains "$EXECUTING_PLANS" "then load the next pending task" "executing-plans loads next pending task"
assert_contains "$EXECUTING_PLANS" "Do not reload the entire plan just to find status" "executing-plans avoids full-plan status reload"
assert_contains "$EXECUTING_PLANS" "Expand to the full plan only when dependencies, unclear context, or cross-task coupling require it" "executing-plans has expansion rule"

assert_contains "$SDD_SKILL" "## Context-Frugal Resume" "SDD documents context-frugal resume"
assert_contains "$SDD_SKILL" "Read the plan header first" "SDD reads header first"
assert_contains "$SDD_SKILL" "then load the next pending task" "SDD loads next pending task"
assert_contains "$SDD_SKILL" "Do not make subagents reload the whole plan" "SDD protects subagent context"
assert_contains "$SDD_SKILL" "Expand to the full plan only when dependencies, unclear context, or cross-task coupling require it" "SDD has expansion rule"

echo ""

if [ "$failures" -gt 0 ]; then
    echo "STATUS: FAILED ($failures failures)"
    exit 1
fi

echo "STATUS: PASSED"
