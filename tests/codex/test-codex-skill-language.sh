#!/usr/bin/env bash
# Fails when Codex skills contain operational references to unavailable tools or model names.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
SKILLS_DIR="$REPO_ROOT/plugins/sonbbal-superpowers-codex/skills"
FORBIDDEN='TeamCreate|SendMessage|TaskUpdate|TodoWrite|Task tool|Skill tool|NotebookEdit|Opus|Sonnet|Haiku'

fail() {
  echo "  [FAIL] $1"
  exit 1
}

pass() {
  echo "  [PASS] $1"
}

echo "=== Test: Codex Skill Language ==="

[ -d "$SKILLS_DIR" ] || fail "Missing skills directory: $SKILLS_DIR"

matches="$(rg -n "$FORBIDDEN" "$SKILLS_DIR" || true)"
if [ -z "$matches" ]; then
  pass "no unavailable operational references found"
  exit 0
fi

violations="$(printf '%s\n' "$matches" | grep -v 'not available in Codex' || true)"
if [ -n "$violations" ]; then
  echo "$violations"
  fail "Codex skills contain unavailable operational references"
fi

pass "only explicitly disallowed-in-Codex explanations mention unavailable terms"
