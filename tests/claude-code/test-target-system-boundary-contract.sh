#!/usr/bin/env bash
# Regression check: planning, execution, and review should guard against the
# development agent silently swallowing responsibilities that belong in the
# target system.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

WRITING_PLANS="$REPO_ROOT/skills/writing-plans/SKILL.md"
EXECUTING_PLANS="$REPO_ROOT/skills/executing-plans/SKILL.md"
IMPLEMENTER_PROMPT="$REPO_ROOT/skills/subagent-driven-development/implementer-prompt.md"
CODE_REVIEWER="$REPO_ROOT/skills/requesting-code-review/code-reviewer.md"

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

echo "=== Target-System Boundary Contract Test ==="
echo ""

assert_contains "$WRITING_PLANS" "## Target-System Responsibility Boundary" "writing-plans documents the boundary"
assert_contains "$WRITING_PLANS" "You are the development agent, not the target product/system" "planning names the development-agent boundary"
assert_contains "$WRITING_PLANS" "schema, state, policy, interface contracts" "planning calls out explicit modeling surfaces"
assert_contains "$WRITING_PLANS" "prefer explicit modeling over implementation-time inference" "planning prefers explicit system modeling"

assert_contains "$EXECUTING_PLANS" "Before adding inference, derivation, or helper logic" "executing-plans checks helper/inference additions"
assert_contains "$EXECUTING_PLANS" "am I implementing the target system, or compensating for missing target-system structure?" "executing-plans asks the boundary question"

assert_contains "$IMPLEMENTER_PROMPT" "## Target-System Responsibility Boundary" "implementer prompt documents the boundary"
assert_contains "$IMPLEMENTER_PROMPT" "Do not silently substitute for capabilities that should be explicitly modeled" "implementer prompt prevents capability substitution"
assert_contains "$IMPLEMENTER_PROMPT" "If behavior belongs in schema, state, policy, interface contracts, or the target agent's own responsibilities" "implementer prompt names escalation surfaces"

assert_contains "$CODE_REVIEWER" "Target-system responsibility boundary" "code reviewer checks target-system boundary"
assert_contains "$CODE_REVIEWER" "Does this change make target-system responsibilities explicit" "code reviewer asks explicitness question"
assert_contains "$CODE_REVIEWER" "hidden development-time inference or helper logic" "code reviewer catches hidden helper substitution"

echo ""

if [ "$failures" -gt 0 ]; then
    echo "STATUS: FAILED ($failures failures)"
    exit 1
fi

echo "STATUS: PASSED"
