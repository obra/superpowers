#!/usr/bin/env bash
# Regression check: Superpowers SessionStart hooks should not inject repository
# instruction files such as CLAUDE.md or AGENTS.md. Host harnesses may inject
# those separately; this hook owns only the Superpowers bootstrap.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
SESSION_START="$REPO_ROOT/hooks/session-start"
CODEX_SESSION_START="$REPO_ROOT/hooks/session-start-codex"

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
    local text="$1"
    local pattern="$2"
    local label="$3"

    if printf '%s' "$text" | grep -Fq "$pattern"; then
        echo "  [FAIL] $label"
        echo "    Did not expect to find: $pattern"
        failures=$((failures + 1))
    else
        echo "  [PASS] $label"
    fi
}

run_hook() {
    local hook="$1"

    env -i \
        PATH="${PATH:-}" \
        HOME="$(mktemp -d)" \
        CLAUDE_PLUGIN_ROOT="$REPO_ROOT" \
        bash "$hook"
}

echo "=== SessionStart Prompt Budget Guard Test ==="
echo ""

assert_contains "$SESSION_START" "Prompt Budget Guard" "Claude hook documents prompt budget boundary"
assert_contains "$CODEX_SESSION_START" "Prompt Budget Guard" "Codex hook documents prompt budget boundary"
assert_contains "$SESSION_START" 'Only inject `skills/using-superpowers/SKILL.md`' "Claude hook names the only injected file"
assert_contains "$CODEX_SESSION_START" 'Only inject `skills/using-superpowers/SKILL.md`' "Codex hook names the only injected file"

claude_output="$(run_hook "$SESSION_START")"
codex_output="$(run_hook "$CODEX_SESSION_START")"

for output in "$claude_output" "$codex_output"; do
    assert_not_contains "$output" "Superpowers — Contributor Guidelines" "SessionStart output omits CLAUDE.md content"
    assert_not_contains "$output" "94% PR rejection rate" "SessionStart output omits contributor warning content"
    assert_not_contains "$output" "Pull Request Requirements" "SessionStart output omits PR guideline content"
done

echo ""

if [ "$failures" -gt 0 ]; then
    echo "STATUS: FAILED ($failures failures)"
    exit 1
fi

echo "STATUS: PASSED"
