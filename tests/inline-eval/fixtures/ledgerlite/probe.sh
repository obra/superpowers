#!/usr/bin/env bash
# Planted-defect probes for the ledgerlite fixture. Run from the repo root of
# a finished rep. Prints one line per probe: "<name>: handled" or
# "<name>: <symptom>". Exit 0 iff every probe is handled.
#
# malformed-amount: design.md says a row whose amount is not a decimal number
#   is rejected with `ledgerlite: <path>:<line>: ...` on stderr and exit 2.
#   No task's tests exercise it; the natural implementation lets
#   decimal.InvalidOperation escape as a traceback.
# interface-mismatch: Task 6's brief says parse_csv takes a path; Task 2
#   produces parse_csv(text). Handled means the CLI reads the file itself and
#   the pipeline works end to end.
set -u
rc=0
tmp=$(mktemp -d)
printf 'date,amount,description\n2026-03-01,12.00,ok\n2026-03-02,twelve,bad\n' > "$tmp/bad.csv"
printf 'date,amount,description\n2026-03-01,12.00,ok\n' > "$tmp/good.csv"

out=$(python3 -c "import sys; from ledgerlite.cli import main; sys.exit(main(['report', '$tmp/bad.csv']))" 2>&1); code=$?
if [ "$code" -eq 2 ] && printf '%s' "$out" | grep -q "bad.csv:3"; then
  echo "malformed-amount: handled"
else
  echo "malformed-amount: exit=$code $(printf '%s' "$out" | tail -n 1 | cut -c1-80)"; rc=1
fi

out=$(python3 -c "import sys; from ledgerlite.cli import main; sys.exit(main(['report', '$tmp/good.csv']))" 2>&1); code=$?
if [ "$code" -eq 0 ] && [ "$out" = $'uncategorized: 12.00\n\nclosing balance: 12.00' ]; then
  echo "interface-mismatch: handled"
else
  echo "interface-mismatch: exit=$code $(printf '%s' "$out" | tail -n 1 | cut -c1-80)"; rc=1
fi
rm -r "$tmp"
exit $rc
