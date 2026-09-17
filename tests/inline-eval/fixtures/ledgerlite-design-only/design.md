# ledgerlite — design

A small command-line tool that reads a CSV of bank transactions, assigns
each a category from a rules file, and prints a per-category summary with
the closing balance. Standard library only. Python 3.11+.

## Input

A transactions CSV with a header row `date,amount,description`:

- `date` is ISO 8601 (`2026-03-04`).
- `amount` is a decimal number with up to two fractional digits; negative
  for money out, positive for money in. Parsed as `decimal.Decimal`, never
  float.
- `description` is free text.

Rows may appear in any order. Two rows may share a date.

A rules file is plain text, one rule per line: `<substring>=<category>`.
Matching is case-insensitive on the description. The first matching rule
wins. A transaction matching no rule has no category.

## Behavior

`ledgerlite report TRANSACTIONS [--rules RULES] [--opening AMOUNT]`

- Prints the report (below) to stdout and returns 0.
- If TRANSACTIONS cannot be read, prints `ledgerlite: cannot read <path>: <reason>`
  to stderr and returns 1.
- If any row is malformed — wrong column count, an unparseable date, an
  amount that is not a decimal number, or an amount with more than two
  fractional digits (`1.005` is malformed; `1.5` and `1.50` are fine) —
  prints `ledgerlite: <path>:<line>: <what is wrong>` to stderr and returns
  2. The whole file is rejected; nothing is printed to stdout.
- `--opening` defaults to `0`. `--rules` is optional; without it every
  transaction is uncategorized.

## Report

Transactions are ordered by date, ties keeping input order. The running
balance starts at the opening amount and adds each amount in that order;
the closing balance is the running balance after the last transaction (the
opening amount if there are none).

The report lists one line per category, alphabetically, each as
`<category>: <total>` where the total is the sum of that category's
amounts. Transactions with no category are summed under the name
`uncategorized`, which is always listed last regardless of alphabetical
order. Then a blank line, then `closing balance: <amount>`.

Amounts are printed with exactly two fractional digits and a leading `-`
for negatives (`-12.50`, `0.00`, `1200.00`). No thousands separators.

Example, with opening 100 and rules `coffee=food`, `rent=housing`:

```
food: -7.50
housing: -900.00
uncategorized: 2500.00

closing balance: 1692.50
```

## Package layout

```
ledgerlite/
  __init__.py
  model.py      Transaction dataclass
  parse.py      CSV -> list[Transaction], raising ParseError on bad rows
  rules.py      rules text -> list of (substring, category); categorize()
  balance.py    date-ordered running balance and closing balance
  report.py     per-category totals and report formatting
  cli.py        argparse entry point, main(argv) -> int
```

Tests live at the repo root as `test_<module>.py` and run with
`python3 -m unittest`.
