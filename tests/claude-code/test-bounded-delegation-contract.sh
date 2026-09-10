#!/usr/bin/env bash
# Static contract test for the bounded phase/pair delegation workflow.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

SDD="$REPO_ROOT/skills/subagent-driven-development/SKILL.md"
IMPLEMENTER="$REPO_ROOT/skills/subagent-driven-development/implementer-prompt.md"
REVIEWER="$REPO_ROOT/skills/subagent-driven-development/task-reviewer-prompt.md"
RE_REVIEWER="$REPO_ROOT/skills/subagent-driven-development/re-review-prompt.md"
EXECUTING="$REPO_ROOT/skills/executing-plans/SKILL.md"
REQUESTING="$REPO_ROOT/skills/requesting-code-review/SKILL.md"
WRITING="$REPO_ROOT/skills/writing-plans/SKILL.md"
README="$REPO_ROOT/README.md"
CODEX="$REPO_ROOT/skills/using-superpowers/references/codex-tools.md"
GEMINI="$REPO_ROOT/skills/using-superpowers/references/gemini-tools.md"
PI="$REPO_ROOT/skills/using-superpowers/references/pi-tools.md"
ANTIGRAVITY="$REPO_ROOT/skills/using-superpowers/references/antigravity-tools.md"
HERMES="$REPO_ROOT/skills/using-superpowers/references/hermes-tools.md"

assert_has() {
    local file="$1"
    local pattern="$2"
    local label="$3"

    if grep -Eiq "$pattern" "$file"; then
        printf '  [PASS] %s\n' "$label"
    else
        printf '  [FAIL] %s\n' "$label"
        printf '         missing /%s/ in %s\n' "$pattern" "${file#"$REPO_ROOT/"}"
        return 1
    fi
}

assert_lacks() {
    local file="$1"
    local pattern="$2"
    local label="$3"

    if grep -Eiq "$pattern" "$file"; then
        printf '  [FAIL] %s\n' "$label"
        grep -Ein "$pattern" "$file" | sed 's/^/         /'
        return 1
    else
        printf '  [PASS] %s\n' "$label"
    fi
}

echo "=== Bounded delegation contract ==="

assert_has "$SDD" 'at most (2-3|two or three).*milestones' \
    "phase size is capped"
assert_has "$SDD" 'one persistent implementer' \
    "one persistent implementer is reused"
assert_has "$SDD" 'one persistent.*reviewer' \
    "one persistent reviewer is reused"
assert_has "$SDD" 'at most one delegated agent.*active' \
    "delegated work is sequential"
assert_has "$SDD" 'same implementer' \
    "findings return to the same implementer"
assert_has "$SDD" 'at most three total review passes' \
    "review passes are capped at three"
assert_has "$SDD" 'stop after.*approved phase' \
    "execution stops at the phase boundary"
assert_has "$SDD" 'model.*provider.*reasoning effort.*context tier' \
    "approval disclosure includes exact runtime choices"
assert_has "$SDD" 'gpt-5\.6-sol' \
    "default GPT-5.6 Sol child model is explicit"

assert_lacks "$SDD" 'fresh (implementer )?subagent per task|broad (final|whole-branch) review|dispatch.*most capable available model|Rounds 4-5' \
    "unbounded topology language is removed"

for prompt in "$IMPLEMENTER" "$REVIEWER" "$RE_REVIEWER"; do
    for term in 'task' 'create_session' 'run_factory' 'background agents' 'nested delegation'; do
        assert_has "$prompt" "$term" \
            "$(basename "$prompt") prohibits $term"
    done
done

assert_has "$REVIEWER" 'exact.*BASE\.\.HEAD|fixed.*BASE\.\.HEAD' \
    "reviewer receives a fixed review range"
assert_has "$REVIEWER" 'read-only' \
    "reviewer remains read-only"
assert_has "$EXECUTING" 'approval.*phase|approved phase' \
    "inline routing preserves the phase approval gate"
assert_has "$REQUESTING" 'additional review.*approval|approval.*additional review' \
    "extra review requires new approval"
assert_has "$WRITING" '2-3 closely related.*milestones|two or three closely related.*milestones' \
    "plans define bounded phases"
assert_has "$README" 'persistent implementer' \
    "user documentation describes the persistent implementer"
assert_has "$README" 'persistent.*reviewer' \
    "user documentation describes the persistent reviewer"
assert_lacks "$CODEX" 'close each implementer.*after its task' \
    "Codex keeps the phase pair reusable"
assert_has "$GEMINI" 'at most one active delegated agent' \
    "Gemini preserves sequential bounded dispatch"
assert_has "$PI" 'do not emulate persistence with fresh children' \
    "Pi refuses fresh-child emulation"
assert_has "$ANTIGRAVITY" 'execute the phase inline' \
    "Antigravity falls back inline without resumable children"
assert_has "$HERMES" 'fresh children' \
    "Hermes falls back inline without resumable children"

echo "=== Bounded delegation contract passed ==="
