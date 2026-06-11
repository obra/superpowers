#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
SKILL="$ROOT/skills/loop-state/SKILL.md"

fail() {
  echo "[FAIL] $1" >&2
  exit 1
}

pass() {
  echo "[PASS] $1"
}

contains() {
  local file="$1"
  local pattern="$2"
  local label="$3"

  if ! grep -Fq "$pattern" "$file"; then
    fail "$label missing '$pattern'"
  fi
}

[[ -f "$SKILL" ]] || fail "Missing skill: $SKILL"

contains "$SKILL" "name: loop-state" "frontmatter name"
contains "$SKILL" "description: Use when" "frontmatter description"
contains "$SKILL" "cross-session" "trigger wording"
contains "$SKILL" "external events" "trigger wording"
contains "$SKILL" "State is facts, not plans" "core principle"
contains "$SKILL" ".superpowers/state/" "storage layout"
contains "$SKILL" "entities/" "entity storage"
contains "$SKILL" "loops/" "loop summary storage"
contains "$SKILL" "worktrees/" "worktree storage"
contains "$SKILL" "worktree_id" "worktree identity"
contains "$SKILL" "last_observed" "external cursor"
contains "$SKILL" "timeline_cursor" "timeline cursor"
contains "$SKILL" "Loop Summary" "loop summary template"
contains "$SKILL" "Resume and Reconcile" "resume workflow"
contains "$SKILL" "source of truth" "external ownership"
contains "$SKILL" "Do not store" "red lines"
contains "$SKILL" "next_step" "planner-field prohibition"
contains "$SKILL" "next_trigger" "planner-field prohibition"
contains "$SKILL" "full chat transcripts" "transcript prohibition"

if grep -Fq "Next Step:" "$SKILL"; then
  fail "Skill must not define a Next Step field"
fi

if grep -Fq "Next Trigger:" "$SKILL"; then
  fail "Skill must not define a Next Trigger field"
fi

pass "loop-state skill structure is present"
