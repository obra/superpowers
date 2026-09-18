#!/usr/bin/env bash
# Verification for #2280: per-skill configuration must load automatically
# when a skill is invoked. The auto-load chain is session-start hook ->
# using-superpowers (injected verbatim) -> per-skill config convention.
# These tests verify the convention text is present and consistent, and
# that the hook really injects it into every session.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
USING="$REPO_ROOT/skills/using-superpowers/SKILL.md"
WRITING="$REPO_ROOT/skills/writing-skills/SKILL.md"
HOOK="$REPO_ROOT/hooks/session-start"

pass=0; fail=0
check() {
  local desc="$1"; shift
  if "$@"; then echo "  [PASS] $desc"; pass=$((pass+1));
  else echo "  [FAIL] $desc"; fail=$((fail+1)); fi
}
has() { grep -q "$1" "$2"; }

echo "=== #2280: per-skill configuration ==="
echo
echo "Convention text (using-superpowers):"

check "section exists" \
  has '## Per-Skill Configuration' "$USING"
check "per-skill path documented" \
  has '\.superpowers/config/<skill>\.md' "$USING"
check "global path documented" \
  has '\.superpowers/config/superpowers\.md' "$USING"
check "read on skill invocation, not session start" \
  has 'When you invoke a skill' "$USING"
check "do-not-read-at-session-start rule" \
  has 'Do not read these files at session start' "$USING"
check "precedence: user > per-skill > global > skill" \
  has 'user instructions > per-skill' "$USING"
check "config cannot license skipping gates" \
  has 'does not license skipping' "$USING"
check "conflict resolution: follow skill, surface conflict" \
  has 'note the' "$USING"

echo
echo "Author guidance (writing-skills):"
check "points project customizations at config, not new skills" \
  has 'superpowers/config/<skill>\.md' "$WRITING"

echo
echo "Auto-load chain (session-start hook):"
TMP=$(mktemp -d)
cd "$TMP"
git init -q
git config user.email t@t.local; git config user.name t
out=$(CLAUDE_PLUGIN_ROOT="$REPO_ROOT" bash "$HOOK" 2>/dev/null || true)
check "hook injects the convention into session context" \
  bash -c "[ -n \"\$0\" ] && echo \"\$0\" | grep -q 'Per-Skill Configuration'" "$out"
check "injected context names the per-skill path" \
  bash -c "echo \"\$0\" | grep -q 'config/<skill>'" "$out"
rm -rf "$TMP"

echo
echo "=== $pass passed, $fail failed ==="
[ "$fail" -eq 0 ]
