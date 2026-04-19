#!/usr/bin/env bash
# Test: explore subagent guidance across workflow skills
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/test-helpers.sh"

echo "=== Test: explore subagent guidance ==="
echo ""

check_guidance() {
    local prompt="$1"
    local label="$2"
    local context_pattern="$3"

    echo "Test: $label"
    output=$(run_claude "$prompt" 30)

    if assert_contains "$output" "explore.*subagent\|subagent.*explore" "$label mentions explore subagents"; then
        : # pass
    else
        exit 1
    fi

    if assert_contains "$output" "$context_pattern" "$label stays scoped to broad discovery"; then
        : # pass
    else
        exit 1
    fi

    echo ""
}

check_guidance \
    "In the using-superpowers workflow, when you need broad context from many files, what should you do before reading everything yourself?" \
    "using-superpowers" \
    "broad\|unfamiliar\|many files\|scattered\|large"

check_guidance \
    "In the brainstorming skill, how should you gather project context when the codebase is broad or unfamiliar?" \
    "brainstorming" \
    "broad\|unfamiliar\|many files\|scattered\|large"

check_guidance \
    "In the writing-plans skill, how should you gather missing context before locking the plan?" \
    "writing-plans" \
    "unfamiliar\|context\|codebase"

check_guidance \
    "In the systematic-debugging skill, how should you gather evidence when a bug spans multiple components?" \
    "systematic-debugging" \
    "multiple components\|multi-component\|independent\|evidence"

check_guidance \
    "In subagent-driven-development, what should the controller do before assigning implementer tasks if the plan touches unfamiliar files?" \
    "subagent-driven-development" \
    "reconnaissance\|unfamiliar\|missing context"

echo "=== All explore subagent guidance tests passed ==="
