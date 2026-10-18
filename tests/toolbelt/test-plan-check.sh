#!/usr/bin/env bash
# Runs writing-plans' plan-check against fixture plans.
set -euo pipefail

repo_root=$(git rev-parse --show-toplevel)
check="$repo_root/skills/writing-plans/scripts/plan-check"
fixtures="$repo_root/tests/toolbelt/fixtures/plan-check"
failures=0

fail() { echo "not ok - $1" >&2; failures=$((failures + 1)); }
ok() { echo "ok - $1"; }

# Each bad fixture exits non-zero and prints its own message.
for case in \
  "missing-risk-column:the PR Boundaries table has no Risk column" \
  "bad-risk-value:PR 1: Risk must be high, medium, or none" \
  "orphan-task:Task 3 is in no PR row" \
  "missing-task:PR 2 names Task 4, which has no heading" \
  "duplicate-task:Task 2 is defined more than once" \
  "missing-field:Task 2 has no **Proves:**" \
  "line-reference:Task 1 cites a line number: src/filters.ts:88" \
  "no-risks:no ## Risks section"; do
  name=${case%%:*}
  want=${case#*:}
  if out=$(bash "$check" "$fixtures/$name.md"); then
    fail "$name: plan-check should exit non-zero"
  elif printf '%s\n' "$out" | grep -qF -- "$want"; then
    ok "$name: $want"
  else
    fail "$name: expected \"$want\", got: $out"
  fi
done

for plan in "$fixtures/valid.md" "$fixtures/task-table.md" "$repo_root/docs/toolbelt/plans/2026-10-15-lean-delivery.md" \
  "$repo_root/skills/quick-task/mini-plan-example.md"; do
  if out=$(bash "$check" "$plan") && [ -z "$out" ]; then
    ok "passes: ${plan#"$repo_root"/}"
  else
    fail "should pass cleanly: ${plan#"$repo_root"/}: $out"
  fi
done

if out=$(bash "$check" "$fixtures/ten-tasks.md") && printf '%s\n' "$out" | grep -q '^warning: PR 1 has 10 tasks'; then
  ok "ten tasks in one PR warns and exits 0"
else
  fail "ten tasks in one PR should warn and exit 0: $out"
fi

if [ "$failures" -gt 0 ]; then
  exit 1
fi
echo "PASS"
