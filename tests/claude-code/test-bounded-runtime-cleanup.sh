#!/usr/bin/env bash
# Static contract test for Milestone 3 runtime, eval, and workflow cleanup.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

SDD="$REPO_ROOT/skills/subagent-driven-development/SKILL.md"
PORTING="$REPO_ROOT/docs/porting-to-a-new-harness.md"
KIMI="$REPO_ROOT/.kimi-plugin/plugin.json"
KIMI_DOC="$REPO_ROOT/docs/README.kimi.md"
OPENCODE="$REPO_ROOT/.opencode/plugins/superpowers.js"
OPENCODE_INSTALL="$REPO_ROOT/.opencode/INSTALL.md"
OPENCODE_DOC="$REPO_ROOT/docs/README.opencode.md"
PI_EXTENSION="$REPO_ROOT/.pi/extensions/superpowers.ts"
PI_TOOLS="$REPO_ROOT/skills/using-superpowers/references/pi-tools.md"
CODEX_TOOLS="$REPO_ROOT/skills/using-superpowers/references/codex-tools.md"
GEMINI_TOOLS="$REPO_ROOT/skills/using-superpowers/references/gemini-tools.md"
ANTIGRAVITY_TOOLS="$REPO_ROOT/skills/using-superpowers/references/antigravity-tools.md"
HERMES_TOOLS="$REPO_ROOT/skills/using-superpowers/references/hermes-tools.md"
RECEIVING="$REPO_ROOT/skills/receiving-code-review/SKILL.md"
VERIFYING="$REPO_ROOT/skills/verification-before-completion/SKILL.md"
RUNNER="$REPO_ROOT/tests/claude-code/run-skill-tests.sh"

assert_has() {
    local file="$1"
    local pattern="$2"
    local label="$3"

    if tr '\n' ' ' < "$file" | grep -Eiq "$pattern"; then
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

    if tr '\n' ' ' < "$file" | grep -Eiq "$pattern"; then
        printf '  [FAIL] %s\n' "$label"
        grep -Ein "$pattern" "$file" | sed 's/^/         /'
        return 1
    else
        printf '  [PASS] %s\n' "$label"
    fi
}

assert_top_banner() {
    local file="$1"
    local label="$2"

    if head -n 8 "$file" | grep -Eiq '^>[[:space:]].*(Historical|Superseded|Do not execute)'; then
        printf '  [PASS] %s\n' "$label"
    else
        printf '  [FAIL] %s\n' "$label"
        printf '         missing historical/non-executable banner near top of %s\n' \
            "${file#"$REPO_ROOT/"}"
        return 1
    fi
}

echo "=== Bounded runtime and eval cleanup contract ==="

assert_has "$SDD" 'milestone-brief' \
    "SDD uses milestone-oriented brief naming"
assert_has "$SDD" 'milestone-reviewer-prompt' \
    "SDD uses milestone-oriented reviewer naming"
assert_has "$REPO_ROOT/skills/subagent-driven-development/scripts/task-brief" \
    'compatibility' \
    "legacy task-brief path is documented as compatibility-only"
assert_has "$REPO_ROOT/skills/subagent-driven-development/task-reviewer-prompt.md" \
    'compatibility' \
    "legacy reviewer prompt path is documented as compatibility-only"

for field in 'provider/model' 'reasoning effort' 'context tier' \
    'persistent.*identity|resume.*same' 'idle.*creat' \
    'sequential|at most one active' 'finite.*activation' \
    'read-only reviewer' 'no nested delegation|must not delegate'; do
    assert_has "$PORTING" "$field" \
        "porting guide requires $field"
done
assert_has "$PORTING" \
    'cannot.*(express|apply|preserve).*(direct|inline|stop|reapproval)|direct.*or stop.*reapproval' \
    "unsupported bounded fields require direct execution or reapproval"

for file in "$KIMI" "$KIMI_DOC" "$OPENCODE" "$OPENCODE_INSTALL" \
    "$OPENCODE_DOC" "$PI_EXTENSION" "$PI_TOOLS" "$CODEX_TOOLS" \
    "$GEMINI_TOOLS" "$ANTIGRAVITY_TOOLS" "$HERMES_TOOLS"; do
    assert_has "$file" 'persistent' \
        "$(basename "$file") preserves persistent child identity"
    assert_has "$file" 'reasoning effort' \
        "$(basename "$file") requires explicit reasoning effort"
    assert_has "$file" 'context tier' \
        "$(basename "$file") requires explicit context tier"
    assert_has "$file" 'inline|current session|stop.*reapproval' \
        "$(basename "$file") has a safe fallback"
done
assert_lacks "$KIMI" 'run_in_background' \
    "Kimi mapping does not recommend background delegation"
assert_lacks "$CODEX_TOOLS" 'default_subagent_model|default_subagent_reasoning_effort' \
    "Codex mapping does not use default child routing as a backstop"

for prompt in \
    "$REPO_ROOT/tests/explicit-skill-requests/prompts/action-oriented.txt" \
    "$REPO_ROOT/tests/explicit-skill-requests/prompts/after-planning-flow.txt" \
    "$REPO_ROOT/tests/explicit-skill-requests/prompts/claude-suggested-it.txt" \
    "$REPO_ROOT/tests/explicit-skill-requests/prompts/i-know-what-sdd-means.txt" \
    "$REPO_ROOT/tests/explicit-skill-requests/prompts/mid-conversation-execute-plan.txt" \
    "$REPO_ROOT/tests/explicit-skill-requests/prompts/skip-formalities.txt" \
    "$REPO_ROOT/tests/explicit-skill-requests/prompts/subagent-driven-development-please.txt"; do
    assert_lacks "$prompt" 'fresh (subagent|agent).*per task|per task.*fresh (subagent|agent)' \
        "$(basename "$prompt") does not request fresh agents per task"
    assert_has "$prompt" 'persistent|bounded phase|approval' \
        "$(basename "$prompt") requests bounded execution semantics"
done

assert_has "$RECEIVING" 'Do not.*(create|dispatch|spawn).*(agent|reviewer)' \
    "receiving review never creates another reviewer"
assert_has "$VERIFYING" 'direct.*verification|verification.*direct' \
    "verification runs evidence checks directly"
assert_has "$VERIFYING" 'Do not.*(create|dispatch|spawn).*(agent|reviewer)' \
    "verification never creates a reviewer"

for historical in \
    "$REPO_ROOT/docs/superpowers/plans/2026-05-06-lift-drill-into-evals.md" \
    "$REPO_ROOT/docs/superpowers/plans/2026-06-09-sdd-task-scoped-review-dispatch.md" \
    "$REPO_ROOT/docs/superpowers/plans/2026-07-06-sdd-plan-scoped-workspace.md" \
    "$REPO_ROOT/docs/superpowers/plans/2026-07-15-sdd-fix-loop-redesign.md" \
    "$REPO_ROOT/docs/superpowers/plans/2026-01-22-document-review-system.md" \
    "$REPO_ROOT/docs/superpowers/plans/2026-07-30-codex-efficiency-fixes.md" \
    "$REPO_ROOT/docs/superpowers/specs/2026-06-09-sdd-task-scoped-review-dispatch-design.md" \
    "$REPO_ROOT/docs/superpowers/specs/2026-06-10-strict-cost-sdd-design.md" \
    "$REPO_ROOT/docs/superpowers/specs/2026-07-06-sdd-plan-scoped-workspace.md" \
    "$REPO_ROOT/docs/superpowers/specs/2026-07-06-sdd-plan-scoped-workspace-eval-results.md" \
    "$REPO_ROOT/docs/superpowers/specs/2026-07-15-sdd-fix-loop-redesign-design.md" \
    "$REPO_ROOT/docs/superpowers/specs/2026-01-22-document-review-system-design.md" \
    "$REPO_ROOT/docs/superpowers/specs/2026-05-06-lift-drill-into-evals-design.md" \
    "$REPO_ROOT/docs/superpowers/specs/2026-07-30-codex-efficiency-fixes-design.md" \
    "$REPO_ROOT/docs/plans/2025-11-28-skills-improvements-from-user-feedback.md"; do
    assert_top_banner "$historical" \
        "$(basename "$historical") is clearly non-executable history"
done

assert_has "$RUNNER" 'test-bounded-runtime-cleanup\.sh' \
    "fast runner includes the cleanup contract"

echo "=== Bounded runtime and eval cleanup contract passed ==="
