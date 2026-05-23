#!/usr/bin/env bash
# Regression check: writing-plans should produce a concise Context Pack and
# subagent-driven-development should preserve it during dispatch.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

WRITING_PLANS="$REPO_ROOT/skills/writing-plans/SKILL.md"
SDD_SKILL="$REPO_ROOT/skills/subagent-driven-development/SKILL.md"
IMPLEMENTER_PROMPT="$REPO_ROOT/skills/subagent-driven-development/implementer-prompt.md"

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

echo "=== Context Pack Contract Test ==="
echo ""

assert_contains "$WRITING_PLANS" "**Context Pack:**" "writing-plans requires a Context Pack in the plan header"
assert_contains "$WRITING_PLANS" "Relevant files:" "Context Pack captures relevant files"
assert_contains "$WRITING_PLANS" "Entrypoints:" "Context Pack captures entrypoints"
assert_contains "$WRITING_PLANS" "Verification commands:" "Context Pack captures verification commands"
assert_contains "$WRITING_PLANS" "Acceptance criteria:" "Context Pack captures acceptance criteria"
assert_contains "$WRITING_PLANS" "Constraints:" "Context Pack captures constraints"
assert_contains "$WRITING_PLANS" "Open questions / assumptions:" "Context Pack captures open questions and assumptions"
assert_contains "$WRITING_PLANS" "Do not document the whole repository" "Context Pack stays feature-scoped"

assert_contains "$SDD_SKILL" "Read the Context Pack once" "SDD reads the Context Pack once"
assert_contains "$SDD_SKILL" "preserve it in controller notes" "SDD preserves Context Pack in controller notes"
assert_contains "$SDD_SKILL" "include the relevant Context Pack fields" "SDD forwards relevant Context Pack fields to subagents"
assert_contains "$SDD_SKILL" "Do not make subagents rediscover" "SDD prevents repeated repo rediscovery"

assert_contains "$IMPLEMENTER_PROMPT" "## Context Pack" "implementer prompt has Context Pack section"
assert_contains "$IMPLEMENTER_PROMPT" "[Relevant Context Pack fields" "implementer prompt provides Context Pack placeholder"
assert_contains "$IMPLEMENTER_PROMPT" "Treat this as the handoff contract" "implementer prompt explains Context Pack authority"

assert_not_contains "$WRITING_PLANS" "feature-doc-pack mode" "Context Pack does not introduce a feature-doc-pack mode"
assert_not_contains "$SDD_SKILL" "/create_handoff" "Context Pack does not introduce a handoff slash command"

echo ""

if [ "$failures" -gt 0 ]; then
    echo "STATUS: FAILED ($failures failures)"
    exit 1
fi

echo "STATUS: PASSED"
