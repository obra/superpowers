#!/usr/bin/env bash
# Regression check: sync-requirements owns durable requirements sync.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

SYNC_SKILL="$REPO_ROOT/skills/sync-requirements/SKILL.md"
FINISHING_SKILL="$REPO_ROOT/skills/finishing-a-development-branch/SKILL.md"
README_FILE="$REPO_ROOT/README.md"

failures=0

assert_file_exists() {
    local file="$1"
    local label="$2"

    if [ -f "$file" ]; then
        echo "  [PASS] $label"
    else
        echo "  [FAIL] $label"
        echo "    Missing file: $file"
        failures=$((failures + 1))
    fi
}

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

assert_order() {
    local file="$1"
    local first="$2"
    local second="$3"
    local label="$4"
    local first_line
    local second_line

    first_line=$(grep -Fn "$first" "$file" | head -1 | cut -d: -f1 || true)
    second_line=$(grep -Fn "$second" "$file" | head -1 | cut -d: -f1 || true)

    if [ -n "$first_line" ] && [ -n "$second_line" ] && [ "$first_line" -lt "$second_line" ]; then
        echo "  [PASS] $label"
    else
        echo "  [FAIL] $label"
        echo "    Expected '$first' before '$second'"
        echo "    In file: $file"
        failures=$((failures + 1))
    fi
}

echo "=== Sync Requirements Skill Test ==="
echo ""

assert_file_exists "$SYNC_SKILL" "sync-requirements skill exists"

if [ -f "$SYNC_SKILL" ]; then
    assert_contains "$SYNC_SKILL" "name: sync-requirements" "skill frontmatter uses exact name"
    assert_contains "$SYNC_SKILL" "description: Use when" "skill frontmatter has trigger description"
    assert_contains "$SYNC_SKILL" 'docs/req/<module>/req.md' "skill documents canonical req path"
    assert_contains "$SYNC_SKILL" 'docs/superpowers/specs/' "skill keeps dated brainstorming specs as inputs"
    assert_contains "$SYNC_SKILL" 'docs/superpowers/plans/' "skill keeps dated writing plans as inputs"
    assert_contains "$SYNC_SKILL" 'session-only user requirements' "skill considers session-only requirements"
    assert_contains "$SYNC_SKILL" 'SHALL NOT' "skill supports SHALL NOT"
    assert_contains "$SYNC_SKILL" 'MUST NOT' "skill supports MUST NOT"
    assert_contains "$SYNC_SKILL" '**BUT**' "skill supports BUT scenario steps"
    assert_contains "$SYNC_SKILL" 'prohibited behavior, exceptions, or negative expectations' "skill constrains BUT semantics"
    assert_contains "$SYNC_SKILL" '### Requirement:' "skill documents requirement heading format"
    assert_contains "$SYNC_SKILL" '#### Scenario:' "skill documents scenario heading format"
    assert_contains "$SYNC_SKILL" 'idempotent' "skill requires idempotent sync"
    assert_contains "$SYNC_SKILL" 'Do not require the OpenSpec CLI' "skill avoids OpenSpec runtime dependency"
    assert_order "$SYNC_SKILL" 'Resolve Work Context' 'Extract Durable Requirements' "skill resolves context before extraction"
    assert_order "$SYNC_SKILL" 'Extract Durable Requirements' 'Select Target Modules' "skill extracts before module selection"
    assert_order "$SYNC_SKILL" 'Select Target Modules' 'Merge Intelligently' "skill selects modules before merge"
fi

echo ""

if [ "$failures" -gt 0 ]; then
    echo "STATUS: FAILED ($failures failures)"
    exit 1
fi

echo "STATUS: PASSED"
