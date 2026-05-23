#!/usr/bin/env bash
# Regression check: using-superpowers should triage task scope before launching
# heavyweight document workflows.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

USING_SUPERPOWERS="$REPO_ROOT/skills/using-superpowers/SKILL.md"

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

echo "=== Task Triage Contract Test ==="
echo ""

assert_contains "$USING_SUPERPOWERS" "## Task Triage Before Heavy Workflows" "using-superpowers documents task triage"
assert_contains "$USING_SUPERPOWERS" "Direct answer / command-only" "triage supports direct-answer tasks"
assert_contains "$USING_SUPERPOWERS" "Small edit" "triage supports small edits"
assert_contains "$USING_SUPERPOWERS" "Debugging" "triage supports debugging tasks"
assert_contains "$USING_SUPERPOWERS" "Multi-step or ambiguous feature" "triage supports full workflow candidates"
assert_contains "$USING_SUPERPOWERS" "Do not use triage to skip a requested or clearly applicable skill" "triage cannot bypass explicit skills"
assert_contains "$USING_SUPERPOWERS" "Do not launch brainstorming/spec/plan artifacts for small edits unless the user asks for them" "small edits avoid heavyweight artifacts"
assert_contains "$USING_SUPERPOWERS" "If the user explicitly asks for the full workflow, honor that" "user can still request full workflow"

echo ""

if [ "$failures" -gt 0 ]; then
    echo "STATUS: FAILED ($failures failures)"
    exit 1
fi

echo "STATUS: PASSED"
