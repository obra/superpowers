#!/usr/bin/env bash
# Consistency verification for #2273: an Approved verdict must close the
# task. Reviewer and controller contracts must agree that Approved is
# compatible only with Minor findings and forward risks — never with
# Critical/Important — so an accepted deliverable cannot reopen the loop.
set -euo pipefail

DIR="$(cd "$(dirname "$0")/../../skills/subagent-driven-development" && pwd)"
SKILL="$DIR/SKILL.md"
REVIEWER="$DIR/task-reviewer-prompt.md"
pass=0; fail=0

check() {
  local desc="$1"; shift
  if "$@"; then echo "  [PASS] $desc"; pass=$((pass+1));
  else echo "  [FAIL] $desc"; fail=$((fail+1)); fi
}
has() { grep -q "$1" "$2"; }

echo "=== #2273: Approve + Important gate ==="
echo
echo "Reviewer contract (task-reviewer-prompt.md):"

check "Approved bound to Minor + Forward risks only" \
  has 'Approved is compatible only with' "$REVIEWER"
check "severity/assessment agreement rule" \
  has 'Severity and Assessment must agree' "$REVIEWER"
check "forbids emitting Approved + Important" \
  has 'never emit Approved + Important' "$REVIEWER"
check "Forward risks / deferred section exists" \
  has '### Forward Risks / Deferred (non-blocking)' "$REVIEWER"
check "forward risks never block or trigger fix rounds" \
  has 'never block completion and never trigger a fix' "$REVIEWER"
check "calibration ties Important to its output header" \
  has 'Important (Should Fix) means' "$REVIEWER"
check "Assessment annotates Approved semantics" \
  has 'no fixes are required to accept this task' "$REVIEWER"
check "reviewer-returns summary carries the binding" \
  has 'compatible only with Minor and' "$REVIEWER"

echo
echo "Controller contract (SKILL.md):"

check "'Approved closes the task' rule present" \
  has 'Approved closes the task' "$SKILL"
check "loop triggers require Needs-fixes verdict for C/I findings" \
  has 'Important finding under a Needs-fixes verdict' "$SKILL"
check "no fix/re-review solely for Important under Approve" \
  has 'do not dispatch a fix or a re-review solely because' "$SKILL"
check "Approved + Important routed as deferred/forward risk" \
  has 'minor (deferred)' "$SKILL"
check "complete-task allows Approved with deferred items" \
  has 'An Approved verdict with deferred minors or forward risks is complete' "$SKILL"
check "polish-after-Approve path documented" \
  has 'Polish after Approve' "$SKILL"
check "polish is covered by final whole-branch review" \
  has 'final whole-branch review' "$SKILL"
check "rationalization: reopening approved task forbidden" \
  has 'reopen the loop' "$SKILL"
check "example workflow shows a forward risk routed" \
  has 'Forward risks: install script assumes' "$SKILL"

echo
echo "=== $pass passed, $fail failed ==="
[ "$fail" -eq 0 ]
