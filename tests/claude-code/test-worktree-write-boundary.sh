#!/usr/bin/env bash
# Regression check: implementation work must stay inside the active worktree.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

USING_SKILL="$REPO_ROOT/skills/using-git-worktrees/SKILL.md"
SDD_SKILL="$REPO_ROOT/skills/subagent-driven-development/SKILL.md"
IMPLEMENTER_PROMPT="$REPO_ROOT/skills/subagent-driven-development/implementer-prompt.md"
SPEC_REVIEWER_PROMPT="$REPO_ROOT/skills/subagent-driven-development/spec-reviewer-prompt.md"
CODE_REVIEWER_PROMPT="$REPO_ROOT/skills/subagent-driven-development/code-quality-reviewer-prompt.md"

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

echo "=== Worktree Write Boundary Test ==="
echo ""

assert_contains "$USING_SKILL" 'WORKTREE_ROOT=$(git rev-parse --show-toplevel)' "using-git-worktrees records active root"
assert_contains "$USING_SKILL" "active workspace root" "using-git-worktrees names the active workspace root"
assert_contains "$USING_SKILL" 'translate it to the same relative path under `$WORKTREE_ROOT`' "using-git-worktrees remaps stale paths"
assert_contains "$USING_SKILL" "Never write to the parent checkout" "using-git-worktrees forbids parent checkout writes"

assert_contains "$SDD_SKILL" "Record the active workspace root before dispatching any subagent" "SDD records active root before dispatch"
assert_contains "$SDD_SKILL" "include the active workspace root in every implementer and reviewer prompt" "SDD threads root through prompts"
assert_contains "$SDD_SKILL" "translate it into the active workspace root before passing it to a subagent" "SDD remaps stale paths before dispatch"

assert_contains "$IMPLEMENTER_PROMPT" "Workspace Boundary" "implementer prompt has workspace boundary section"
assert_contains "$IMPLEMENTER_PROMPT" 'Treat `Work from` as a hard boundary' "implementer prompt treats directory as hard boundary"
assert_contains "$IMPLEMENTER_PROMPT" "Do not edit files outside this directory" "implementer prompt forbids outside writes"

assert_contains "$SPEC_REVIEWER_PROMPT" "Review from: [directory]" "spec reviewer prompt receives review root"
assert_contains "$CODE_REVIEWER_PROMPT" "Review from: [directory]" "code reviewer prompt receives review root"

echo ""

if [ "$failures" -gt 0 ]; then
    echo "STATUS: FAILED ($failures failures)"
    exit 1
fi

echo "STATUS: PASSED"
