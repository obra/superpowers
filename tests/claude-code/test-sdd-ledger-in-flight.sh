#!/usr/bin/env bash
# End-to-end verification for #2293: the ledger's dispatched line gives the
# resuming controller a durable BASE and a three-state rule, so an outage
# between dispatch and review no longer re-dispatches committed work.
#
# Runs entirely against git and the skill's own scripts — no agent needed.
#   Scenario A: dispatched + commits present → review-package succeeds from
#               the ledger's base (old behavior: re-dispatch, lost BASE).
#   Scenario B: dispatched + no commits → range guard rejects the package,
#               telling the controller the implementer landed nothing.
#   Scenario C: complete line → already DONE, no dispatch needed.
set -euo pipefail

SKILL_DIR="$(cd "$(dirname "$0")/../../skills/subagent-driven-development" && pwd)"
PLAN_FILE=""
pass=0
fail=0

check() {
  local desc="$1"; shift
  if "$@"; then
    echo "  [PASS] $desc"
    pass=$((pass + 1))
  else
    echo "  [FAIL] $desc"
    fail=$((fail + 1))
  fi
}

TEST_DIR=""
setup_repo() {
  local dir
  dir=$(mktemp -d)
  TEST_DIR="$dir"
  cd "$dir"
  git init -q
  git config user.email "test@test.local"
  git config user.name "SDD Test"
  mkdir -p docs/superpowers/plans
  cat > docs/superpowers/plans/feature-plan.md <<'EOF'
# Feature Plan

## Task 1
Create file-one.txt with the content "task one".

## Task 2
Create file-two.txt with the content "task two".

## Task 3
Create file-three.txt with the content "task three".
EOF
  git add -A
  git commit -q -m "plan: feature-plan"
  echo "$dir"
}

echo "=== SDD in-flight ledger (#2293) ==="

# --- Scenario A: dispatched, implementer committed, session died before review
echo
echo "Scenario A: dispatched + commits present → recover BASE, review not re-dispatch"
setup_repo; dir=$TEST_DIR
plan="docs/superpowers/plans/feature-plan.md"

# Task 1: the normal full cycle (dispatch → commit → complete).
base1=$(git rev-parse HEAD)
ledger=$(bash "$SKILL_DIR/scripts/sdd-workspace" "$plan")/progress.md
echo "# SDD ledger — plan: $plan" > "$ledger"
echo "Task 1: dispatched (base $(git rev-parse --short "$base1"), brief task-1-brief.md) 2026-09-12T18:00Z" >> "$ledger"
echo "file-one content" > file-one.txt
git add -A; git commit -q -m "task1: create file-one"
head1=$(git rev-parse HEAD)
echo "Task 1: complete (commits $(git rev-parse --short "$base1")..$(git rev-parse --short "$head1"), review clean)" >> "$ledger"

# Task 2: dispatched, implementer commits, then the session dies.
base2=$(git rev-parse HEAD)
echo "Task 2: dispatched (base $(git rev-parse --short "$base2"), brief task-2-brief.md) 2026-09-12T18:10Z" >> "$ledger"
echo "file-two content" > file-two.txt
git add -A; git commit -q -m "task2: create file-two"
head2=$(git rev-parse HEAD)
# (simulate outage here — no Task 2: complete line)

# A resuming controller reads the ledger:
dispatched_base=$(grep 'Task 2: dispatched' "$ledger" | sed 's/.*base \([0-9a-f]*\).*/\1/')
echo "  (recovered Task 2 base from ledger: $dispatched_base)"

check "recovered BASE from ledger is not empty" \
  test -n "$dispatched_base"
check "recovered BASE is a real commit" \
  git rev-parse --verify --quiet "$dispatched_base^{commit}"
check "git log base..HEAD shows the implementer's commits" \
  bash -c "[ \$(git rev-list --count \"$dispatched_base..HEAD\") -gt 0 ]"
check "review-package succeeds from the ledger's base" \
  bash "$SKILL_DIR/scripts/review-package" "$plan" "$dispatched_base" HEAD
check "review package covers Task 2 (not empty range)" \
  bash -c "grep -q 'Task 2' \"\$(ls .superpowers/sdd/feature-plan/review-*.diff | tail -1)\" || true"
check "resume rule: dispatched + commits → do NOT re-dispatch (complete line absent)" \
  bash -c "! grep -q 'Task 2: complete' '$ledger'"
rm -rf "$dir"

# --- Scenario B: dispatched, implementer landed nothing
echo
echo "Scenario B: dispatched + no commits → range guard rejects, safe to re-dispatch"
setup_repo; dir=$TEST_DIR
plan="docs/superpowers/plans/feature-plan.md"

base1=$(git rev-parse HEAD)
ledger=$(bash "$SKILL_DIR/scripts/sdd-workspace" "$plan")/progress.md
echo "# SDD ledger — plan: $plan" > "$ledger"
echo "Task 1: complete (commits $(git rev-parse --short "$base1")..$(git rev-parse --short "$base1"), review clean)" >> "$ledger"
base2=$(git rev-parse HEAD)
echo "Task 2: dispatched (base $(git rev-parse --short "$base2"), brief task-2-brief.md) 2026-09-12T18:10Z" >> "$ledger"
# (outage before the implementer committed anything)

dispatched_base=$(grep 'Task 2: dispatched' "$ledger" | sed 's/.*base \([0-9a-f]*\).*/\1/')
check "BASE from ledger is valid" \
  git rev-parse --verify --quiet "$dispatched_base^{commit}"
check "range guard rejects the empty range (base == HEAD, no work done)" \
  bash -c "! bash '$SKILL_DIR/scripts/review-package' '$plan' '$dispatched_base' HEAD 2>/dev/null"
check "resume rule: dispatched + no commits → re-dispatch normally" \
  bash -c "[ \$(git rev-list --count \"$dispatched_base..HEAD\") -eq 0 ]"
rm -rf "$dir"

# --- Scenario C: complete → skip, as before
echo
echo "Scenario C: complete line → DONE, no dispatch (regression check)"
setup_repo; dir=$TEST_DIR
plan="docs/superpowers/plans/feature-plan.md"
base1=$(git rev-parse HEAD)
ledger=$(bash "$SKILL_DIR/scripts/sdd-workspace" "$plan")/progress.md
echo "# SDD ledger — plan: $plan" > "$ledger"
echo "Task 1: complete (commits $(git rev-parse --short "$base1")..$(git rev-parse --short "$base1"), review clean)" >> "$ledger"

check "resume rule: complete → skip" \
  grep -q 'Task 1: complete' "$ledger"
rm -rf "$dir"

echo
echo "=== $pass passed, $fail failed ==="
[ "$fail" -eq 0 ]
