#!/usr/bin/env bash
# Tests for the effort-pinned worker roster: agents/worker-<level>-effort.md
# exist with valid frontmatter, and every worker name referenced in the SDD
# skill and its dispatch templates has a matching agent file (drift guard).
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
AGENTS_DIR="$REPO_ROOT/agents"
SDD_DIR="$REPO_ROOT/skills/subagent-driven-development"
CODE_REVIEWER="$REPO_ROOT/skills/requesting-code-review/code-reviewer.md"

FAILURES=0
pass() { echo "  [PASS] $1"; }
fail() { echo "  [FAIL] $1"; FAILURES=$((FAILURES + 1)); }

# fm_value <file> <key> : print a single-line YAML frontmatter value
fm_value() {
    awk -v key="$2" '
        /^---$/ { d++; next }
        d==1 && $1==key":" { sub(/^[^:]*:[[:space:]]*/, ""); print; exit }
    ' "$1"
}

check_roster() {
    echo "--- roster files exist with valid frontmatter ---"
    local level file name effort
    for level in low medium high; do
        file="$AGENTS_DIR/worker-${level}-effort.md"
        if [[ -f "$file" ]]; then
            pass "exists: agents/worker-${level}-effort.md"
        else
            fail "missing: agents/worker-${level}-effort.md"
            continue
        fi
        name="$(fm_value "$file" name)"
        [[ "$name" == "worker-${level}-effort" ]] \
            && pass "name matches for worker-${level}-effort" \
            || fail "name mismatch for worker-${level}-effort (got '$name')"
        [[ -n "$(fm_value "$file" description)" ]] \
            && pass "has description: worker-${level}-effort" \
            || fail "missing description: worker-${level}-effort"
        effort="$(fm_value "$file" effort)"
        [[ "$effort" == "$level" ]] \
            && pass "effort=$level for worker-${level}-effort" \
            || fail "effort mismatch for worker-${level}-effort (got '$effort')"
    done
}

check_drift_guard() {
    echo "--- every referenced worker name has a file (drift guard) ---"
    local refs name
    refs="$(grep -rhoE 'worker-(low|medium|high)-effort' \
        "$SDD_DIR/SKILL.md" \
        "$SDD_DIR/implementer-prompt.md" \
        "$SDD_DIR/task-reviewer-prompt.md" \
        "$CODE_REVIEWER" \
        2>/dev/null | sort -u || true)"
    if [[ -z "$refs" ]]; then
        pass "no worker references yet (nothing to drift)"
        return
    fi
    while IFS= read -r name; do
        [[ -n "$name" ]] || continue
        [[ -f "$AGENTS_DIR/${name}.md" ]] \
            && pass "referenced $name has a file" \
            || fail "referenced $name has NO file in agents/"
    done <<< "$refs"
}

check_effort_section() {
    echo "--- SDD SKILL.md has Effort Selection section referencing the roster ---"
    local skill="$SDD_DIR/SKILL.md"
    grep -q '^## Effort Selection' "$skill" \
        && pass "SKILL.md has '## Effort Selection'" \
        || fail "SKILL.md missing '## Effort Selection'"
    grep -q 'cheapen mechanics, never judgment' "$skill" \
        && pass "Effort Selection keeps the judgment guardrail" \
        || fail "Effort Selection missing the judgment guardrail phrase"
    local level
    for level in low medium high; do
        grep -q "worker-${level}-effort" "$skill" \
            && pass "Effort Selection references worker-${level}-effort" \
            || fail "Effort Selection missing worker-${level}-effort"
    done
}

check_template_wiring() {
    echo "--- dispatch templates reference the effort roster / Effort Selection ---"
    grep -q 'Effort Selection' "$SDD_DIR/implementer-prompt.md" \
        && pass "implementer-prompt references Effort Selection" \
        || fail "implementer-prompt missing Effort Selection reference"
    grep -q 'model_reasoning_effort' "$SDD_DIR/implementer-prompt.md" \
        && pass "implementer-prompt notes Codex model_reasoning_effort" \
        || fail "implementer-prompt missing Codex effort note"
    grep -q 'Effort Selection' "$SDD_DIR/task-reviewer-prompt.md" \
        && pass "task-reviewer-prompt references Effort Selection" \
        || fail "task-reviewer-prompt missing Effort Selection reference"
    grep -q 'model_reasoning_effort' "$SDD_DIR/task-reviewer-prompt.md" \
        && pass "task-reviewer-prompt notes Codex model_reasoning_effort" \
        || fail "task-reviewer-prompt missing Codex effort note"
    grep -q 'Effort Selection' "$CODE_REVIEWER" \
        && pass "code-reviewer template references Effort Selection" \
        || fail "code-reviewer template missing Effort Selection reference"
    grep -q 'model_reasoning_effort' "$CODE_REVIEWER" \
        && pass "code-reviewer template notes Codex model_reasoning_effort" \
        || fail "code-reviewer template missing Codex effort note"
}

main() {
    echo "=== Test: effort worker roster ==="
    check_roster
    check_drift_guard
    check_effort_section
    check_template_wiring
    if [[ "$FAILURES" -gt 0 ]]; then
        echo "FAILED ($FAILURES failure(s))"
        exit 1
    fi
    echo "OK"
}

main "$@"
