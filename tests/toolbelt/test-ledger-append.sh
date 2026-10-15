#!/usr/bin/env bash
# Runs scripts/ledger-append against a scratch ledger and checks its output.
set -euo pipefail

repo_root=$(git rev-parse --show-toplevel)
script="$repo_root/skills/subagent-driven-development/scripts/ledger-append"
tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT
ledger="$tmp/progress.md"

fail() { echo "not ok - $1" >&2; exit 1; }
ok() { echo "ok - $1"; }

[ -x "$script" ] || fail "ledger-append exists and is executable"

"$script" "$ledger" "Task 1: in-progress (agent a1)"
[ "$(wc -l < "$ledger")" -eq 1 ] || fail "first append creates the file with one line"
grep -Eq '^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}Z Task 1: in-progress \(agent a1\)$' "$ledger" \
  || fail "line is prefixed with an ISO-8601 UTC timestamp"
ok "first append creates the file with one timestamped line"

"$script" "$ledger" "Next: task 1 review verdict"
[ "$(wc -l < "$ledger")" -eq 2 ] || fail "second append adds one line"
head -1 "$ledger" | grep -Fq 'Task 1: in-progress (agent a1)' || fail "earlier lines are kept in place"
tail -1 "$ledger" | grep -Fq 'Next: task 1 review verdict' || fail "new line goes at the end"
ok "later appends keep earlier lines and add at the end"

if "$script" "$ledger" 2>/dev/null; then fail "a missing line is rejected"; fi
if "$script" "$ledger" "a" "b" 2>/dev/null; then fail "extra arguments are rejected"; fi
if "$script" "$ledger" $'two\nlines' 2>/dev/null; then fail "a multi-line entry is rejected"; fi
[ "$(wc -l < "$ledger")" -eq 2 ] || fail "rejected calls write nothing"
ok "bad calls are rejected and write nothing"

echo "PASS"
