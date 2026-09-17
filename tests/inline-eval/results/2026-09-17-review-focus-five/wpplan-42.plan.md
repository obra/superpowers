# ledgerlite Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `ledgerlite`, a stdlib-only Python package and CLI that reads a bank-transaction CSV, categorizes each row with a rules file, and prints per-category totals plus the closing balance.

**Architecture:** Six small modules with one responsibility each, composed by a thin `cli.py`. Pure functions take already-read text (iterables of lines) and return values; only `cli.py` touches the filesystem, `sys.stdout`/`sys.stderr`, and exit codes. That split keeps every parsing and formatting rule testable without temp files, and keeps all three exit codes in one place. Money is `decimal.Decimal` end to end — never `float`.

**Tech Stack:** Python 3.11+, standard library only (`csv`, `decimal`, `datetime`, `argparse`, `dataclasses`, `re`), `unittest` for tests.

**Spec:** `design.md` (repo root)

## Global Constraints

- Python 3.11+. Standard library only — no third-party dependencies, no `pyproject.toml`/`setup.py` needed.
- Money is `decimal.Decimal` everywhere. Never `float`, not even transiently.
- Amounts are printed with exactly two fractional digits, a leading `-` only for negative values, and no thousands separators: `-12.50`, `0.00`, `1200.00`.
- Package layout is exactly as the spec lists it: `ledgerlite/{__init__,model,parse,rules,balance,report,cli}.py`. One addition (see Task 5): a three-line `ledgerlite/__main__.py`, because without it there is no way to invoke the tool at all in a repo with no packaging metadata.
- Tests live at the repo root as `test_<module>.py` and run with `python3 -m unittest`.
- Exit codes: `0` success, `1` transactions/rules file unreadable, `2` malformed row.
- Error text, verbatim, to stderr:
  - unreadable file: `ledgerlite: cannot read <path>: <reason>`
  - malformed row: `ledgerlite: <path>:<line>: <what is wrong>`
- CLI surface, verbatim: `ledgerlite report TRANSACTIONS [--rules RULES] [--opening AMOUNT]`. `--opening` defaults to `0`; `--rules` is optional.
- Work directly on `main` in this local scratch repo. There is no remote and no worktree; never `git push`.
- Commit after every green test run, using the commit commands given in the steps.

## Review Focus

Input classes the spec implies but never names. Each has a test in the task that owns the code:

1. **Whitespace around fields** — `2026-03-04, -7.50, coffee` (spaces after commas) is an ordinary hand-edited CSV and must parse, not be rejected as a malformed amount. Covered in Task 1, Step 11.
2. **Blank lines in the CSV** — a file ending in a blank line, or with one between rows, must be skipped, not rejected as "wrong column count". Rejecting a whole file over a trailing newline is the single most likely way this tool annoys someone. Covered in Task 1, Step 11.
3. **Amount strings `Decimal()` accepts but a bank statement never means** — `NaN`, `Infinity`, `1e5`, `1,000`, `1.` must all be rejected as malformed (exit 2), never silently turned into a total. A `NaN` amount would poison every sum and print garbage. Covered in Task 1, Step 6.
4. **A malformed `--opening`** — `--opening abc` or `--opening 1.005` must produce an argparse usage error, not a `decimal.InvalidOperation` traceback. Covered in Task 5, Step 1.
5. **An unreadable `--rules` path** — the spec only promises a message for TRANSACTIONS, but a typo'd rules path must get the same `cannot read` message and exit 1 rather than a traceback, and must never print a silently uncategorized report. Covered in Task 5, Step 6.

Also pinned by tests, one notch below the above: an impossible calendar date (`2026-02-30`, Task 1 Step 6), a literal `-0.00` amount printing as `0.00` rather than `-0.00` (Task 4, Step 6), and a rules file that names a category `uncategorized` (Task 4, Step 6).

## File Structure

| File | Responsibility |
| --- | --- |
| `ledgerlite/__init__.py` | Package docstring only. No re-exports. |
| `ledgerlite/model.py` | `Transaction` frozen dataclass. No logic. |
| `ledgerlite/parse.py` | `ParseError`, `parse_date`, `parse_amount`, `parse_transactions`. Validation lives here and nowhere else. |
| `ledgerlite/rules.py` | `Rule` alias, `parse_rules`, `categorize`. |
| `ledgerlite/balance.py` | `order_by_date`, `closing_balance`. |
| `ledgerlite/report.py` | `UNCATEGORIZED`, `category_totals`, `format_amount`, `sorted_categories`, `format_report`. |
| `ledgerlite/cli.py` | `build_parser`, `main(argv) -> int`. Only module doing I/O or exit codes. |
| `ledgerlite/__main__.py` | `sys.exit(main())` shim. |
| `test_parse.py`, `test_rules.py`, `test_balance.py`, `test_report.py`, `test_cli.py` | One test module per implementation module with behavior worth testing. `model.py` is a bare dataclass and is exercised through the others. |

---

### Task 1: Transaction model and CSV parsing

The whole validation surface of the tool. Everything downstream can assume a
`list[Transaction]` with a real `date`, a `Decimal` amount with at most two
fractional digits, and a `str` description.

**Files:**
- Create: `ledgerlite/__init__.py`
- Create: `ledgerlite/model.py`
- Create: `ledgerlite/parse.py`
- Test: `test_parse.py`

**Interfaces:**
- Consumes: nothing (first task).
- Produces:
  - `ledgerlite.model.Transaction(date: datetime.date, amount: Decimal, description: str)` — frozen dataclass, keyword or positional construction.
  - `ledgerlite.parse.ParseError(Exception)` with attributes `line: int` and `problem: str`.
  - `ledgerlite.parse.parse_date(raw: str) -> datetime.date` — raises `ValueError` whose message is the `problem` text.
  - `ledgerlite.parse.parse_amount(raw: str) -> Decimal` — raises `ValueError` whose message is the `problem` text. Reused by the CLI for `--opening`.
  - `ledgerlite.parse.parse_transactions(lines: Iterable[str]) -> list[Transaction]` — raises `ParseError`. Takes lines, not a path: the caller owns file I/O.

- [ ] **Step 1: Write the failing test**

Create `test_parse.py`:

```python
"""Tests for ledgerlite.parse."""

import datetime
import unittest
from decimal import Decimal

from ledgerlite.model import Transaction
from ledgerlite.parse import ParseError, parse_amount, parse_date, parse_transactions

HEADER = "date,amount,description\n"


class ParseTransactionsTests(unittest.TestCase):
    def test_parses_rows_in_input_order(self):
        lines = [
            HEADER,
            "2026-03-04,-7.50,Coffee Bar\n",
            "2026-03-01,2500.00,ACME payroll\n",
        ]

        self.assertEqual(
            parse_transactions(lines),
            [
                Transaction(datetime.date(2026, 3, 4), Decimal("-7.50"), "Coffee Bar"),
                Transaction(datetime.date(2026, 3, 1), Decimal("2500.00"), "ACME payroll"),
            ],
        )

    def test_amount_is_decimal_not_float(self):
        transactions = parse_transactions([HEADER, "2026-03-04,0.10,dime\n"])

        self.assertIsInstance(transactions[0].amount, Decimal)
        self.assertEqual(transactions[0].amount, Decimal("0.10"))

    def test_header_only_file_has_no_transactions(self):
        self.assertEqual(parse_transactions([HEADER]), [])

    def test_empty_file_has_no_transactions(self):
        self.assertEqual(parse_transactions([]), [])


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run test to verify it fails**

Run: `python3 -m unittest test_parse -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'ledgerlite'`

- [ ] **Step 3: Write minimal implementation**

Create `ledgerlite/__init__.py`:

```python
"""ledgerlite: categorize bank transactions and report per-category totals."""
```

Create `ledgerlite/model.py`:

```python
"""The transaction record shared by every other module."""

import datetime
from dataclasses import dataclass
from decimal import Decimal


@dataclass(frozen=True)
class Transaction:
    """One row of the transactions CSV."""

    date: datetime.date
    amount: Decimal
    description: str
```

Create `ledgerlite/parse.py`:

```python
"""Turn transactions-CSV lines into Transaction objects."""

from __future__ import annotations

import csv
import datetime
from decimal import Decimal
from typing import Iterable

from .model import Transaction


class ParseError(Exception):
    """A row of the transactions file could not be parsed."""

    def __init__(self, line: int, problem: str) -> None:
        super().__init__(f"line {line}: {problem}")
        self.line = line
        self.problem = problem


def parse_date(raw: str) -> datetime.date:
    """Parse an ISO 8601 calendar date (`2026-03-04`)."""
    return datetime.datetime.strptime(raw, "%Y-%m-%d").date()


def parse_amount(raw: str) -> Decimal:
    """Parse a signed decimal amount with at most two fractional digits."""
    return Decimal(raw)


def parse_transactions(lines: Iterable[str]) -> list[Transaction]:
    """Parse CSV lines into transactions, preserving input order.

    `lines` is any iterable of lines (an open file, a list of strings). The
    first row is the header and is skipped.
    """
    rows = iter(csv.reader(lines))
    try:
        next(rows)
    except StopIteration:
        return []

    transactions: list[Transaction] = []
    for row in rows:
        raw_date, raw_amount, description = row
        transactions.append(
            Transaction(
                date=parse_date(raw_date),
                amount=parse_amount(raw_amount),
                description=description,
            )
        )
    return transactions
```

- [ ] **Step 4: Run test to verify it passes**

Run: `python3 -m unittest test_parse -v`
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add ledgerlite/__init__.py ledgerlite/model.py ledgerlite/parse.py test_parse.py
git commit -m "feat: parse transactions CSV into Transaction records"
```

- [ ] **Step 6: Write the failing tests for malformed rows**

The spec rejects the whole file on any malformed row. `Decimal()` happily
accepts `NaN`, `Infinity`, and `1e5`, so validation has to be stricter than
"did `Decimal()` raise" — that is Review Focus item 3. `2026-3-4` and
`2026-02-30` are not valid ISO calendar dates and must be rejected too.

Append to `test_parse.py`, before the `if __name__` block:

```python
class MalformedRowTests(unittest.TestCase):
    def assertRejected(self, row, line, problem):
        with self.assertRaises(ParseError) as caught:
            parse_transactions([HEADER, row])

        self.assertEqual(caught.exception.line, line)
        self.assertEqual(caught.exception.problem, problem)

    def test_too_few_columns(self):
        self.assertRejected("2026-03-04,-7.50\n", 2, "expected 3 columns, got 2")

    def test_too_many_columns(self):
        self.assertRejected("2026-03-04,-7.50,coffee,extra\n", 2, "expected 3 columns, got 4")

    def test_non_iso_date(self):
        self.assertRejected("2026-3-4,-7.50,coffee\n", 2, "invalid date: '2026-3-4'")

    def test_impossible_date(self):
        self.assertRejected("2026-02-30,-7.50,coffee\n", 2, "invalid date: '2026-02-30'")

    def test_empty_date(self):
        self.assertRejected(",-7.50,coffee\n", 2, "invalid date: ''")

    def test_three_fractional_digits(self):
        self.assertRejected(
            "2026-03-04,1.005,coffee\n",
            2,
            "amount has more than two decimal places: '1.005'",
        )

    def test_rejects_amounts_decimal_would_accept(self):
        for raw in ["NaN", "nan", "Infinity", "-Infinity", "1e5", "1_000", "1.", "", "--1", "$5.00"]:
            with self.subTest(raw=raw):
                self.assertRejected(f"2026-03-04,{raw},coffee\n", 2, f"invalid amount: {raw!r}")

    def test_thousands_separator_is_invalid(self):
        # Quoted, or the comma would look like a fourth column.
        self.assertRejected('2026-03-04,"1,000",coffee\n', 2, "invalid amount: '1,000'")

    def test_reports_the_line_number_of_the_bad_row(self):
        lines = [
            HEADER,
            "2026-03-01,1.00,good\n",
            "2026-03-02,2.00,good\n",
            "2026-03-03,oops,bad\n",
        ]

        with self.assertRaises(ParseError) as caught:
            parse_transactions(lines)

        self.assertEqual(caught.exception.line, 4)
        self.assertEqual(caught.exception.problem, "invalid amount: 'oops'")

    def test_accepts_one_or_zero_fractional_digits(self):
        transactions = parse_transactions(
            [HEADER, "2026-03-04,1.5,a\n", "2026-03-04,1.50,b\n", "2026-03-04,7,c\n", "2026-03-04,+7,d\n"]
        )

        self.assertEqual(
            [t.amount for t in transactions],
            [Decimal("1.5"), Decimal("1.50"), Decimal("7"), Decimal("7")],
        )


class ParseFieldTests(unittest.TestCase):
    def test_parse_date_raises_value_error_with_message(self):
        with self.assertRaises(ValueError) as caught:
            parse_date("nope")

        self.assertEqual(str(caught.exception), "invalid date: 'nope'")

    def test_parse_amount_raises_value_error_with_message(self):
        with self.assertRaises(ValueError) as caught:
            parse_amount("1.005")

        self.assertEqual(str(caught.exception), "amount has more than two decimal places: '1.005'")

    def test_parse_amount_returns_decimal(self):
        self.assertEqual(parse_amount("-12.50"), Decimal("-12.50"))
```

- [ ] **Step 7: Run tests to verify they fail**

Run: `python3 -m unittest test_parse -v`
Expected: FAIL — the column-count tests raise `ValueError: not enough values to unpack`, the date tests raise a raw `ValueError` from `strptime` instead of `ParseError`, and `test_rejects_amounts_decimal_would_accept` shows `NaN`/`1e5` being accepted.

- [ ] **Step 8: Write the validation implementation**

In `ledgerlite/parse.py`, add `re` to the imports and the amount pattern below
them:

```python
import csv
import datetime
import re
from decimal import Decimal
from typing import Iterable

from .model import Transaction

# A signed run of digits with an optional fractional part. Deliberately
# stricter than Decimal(), which also accepts NaN, Infinity and 1e5.
_AMOUNT_RE = re.compile(r"^[+-]?(?:\d+(?:\.\d+)?|\.\d+)$")
```

Replace `parse_date`, `parse_amount` and the loop body of
`parse_transactions` with:

```python
def parse_date(raw: str) -> datetime.date:
    """Parse an ISO 8601 calendar date (`2026-03-04`).

    Raises ValueError whose message is report-ready.
    """
    try:
        return datetime.datetime.strptime(raw, "%Y-%m-%d").date()
    except ValueError:
        raise ValueError(f"invalid date: {raw!r}") from None


def parse_amount(raw: str) -> Decimal:
    """Parse a signed decimal amount with at most two fractional digits.

    Raises ValueError whose message is report-ready.
    """
    if not _AMOUNT_RE.match(raw):
        raise ValueError(f"invalid amount: {raw!r}")
    _, _, fraction = raw.partition(".")
    if len(fraction) > 2:
        raise ValueError(f"amount has more than two decimal places: {raw!r}")
    return Decimal(raw)
```

```python
    transactions: list[Transaction] = []
    for row in rows:
        if len(row) != 3:
            raise ParseError(reader.line_num, f"expected 3 columns, got {len(row)}")
        raw_date, raw_amount, description = row
        try:
            when = parse_date(raw_date)
            amount = parse_amount(raw_amount)
        except ValueError as exc:
            raise ParseError(reader.line_num, str(exc)) from exc
        transactions.append(Transaction(date=when, amount=amount, description=description))
    return transactions
```

`reader.line_num` is the source line number, so keep a reference to the reader
itself. Change the top of the function to:

```python
    reader = csv.reader(lines)
    rows = iter(reader)
    try:
        next(rows)
    except StopIteration:
        return []
```

- [ ] **Step 9: Run tests to verify they pass**

Run: `python3 -m unittest test_parse -v`
Expected: PASS (all tests)

- [ ] **Step 10: Commit**

```bash
git add ledgerlite/parse.py test_parse.py
git commit -m "feat: reject malformed rows with line number and reason"
```

- [ ] **Step 11: Write the failing tests for real-world CSV whitespace and blank lines**

Review Focus items 1 and 2. Hand-edited CSVs have spaces after commas and a
trailing blank line; neither is a malformed transaction.

Append to `test_parse.py`, before the `if __name__` block:

```python
class ForgivingInputTests(unittest.TestCase):
    def test_ignores_whitespace_around_date_and_amount(self):
        transactions = parse_transactions([HEADER, "2026-03-04 , -7.50 , Coffee Bar\n"])

        self.assertEqual(
            transactions,
            [Transaction(datetime.date(2026, 3, 4), Decimal("-7.50"), " Coffee Bar")],
        )

    def test_skips_trailing_blank_line(self):
        transactions = parse_transactions([HEADER, "2026-03-04,-7.50,coffee\n", "\n"])

        self.assertEqual(len(transactions), 1)

    def test_skips_blank_and_whitespace_only_lines_between_rows(self):
        lines = [
            HEADER,
            "2026-03-01,1.00,a\n",
            "\n",
            "   \n",
            "2026-03-02,2.00,b\n",
        ]

        self.assertEqual([t.description for t in parse_transactions(lines)], ["a", "b"])

    def test_blank_lines_do_not_shift_reported_line_numbers(self):
        lines = [HEADER, "\n", "2026-03-04,oops,bad\n"]

        with self.assertRaises(ParseError) as caught:
            parse_transactions(lines)

        self.assertEqual(caught.exception.line, 3)
```

- [ ] **Step 12: Run tests to verify they fail**

Run: `python3 -m unittest test_parse -v`
Expected: FAIL — the whitespace test reports `invalid date: '2026-03-04 '`, and the blank-line tests report `expected 3 columns, got 0`.

- [ ] **Step 13: Write the implementation**

In `ledgerlite/parse.py`, replace the loop body of `parse_transactions` with:

```python
    transactions: list[Transaction] = []
    for row in rows:
        if _is_blank(row):
            continue
        if len(row) != 3:
            raise ParseError(reader.line_num, f"expected 3 columns, got {len(row)}")
        raw_date, raw_amount, description = row
        try:
            when = parse_date(raw_date.strip())
            amount = parse_amount(raw_amount.strip())
        except ValueError as exc:
            raise ParseError(reader.line_num, str(exc)) from exc
        transactions.append(Transaction(date=when, amount=amount, description=description))
    return transactions
```

Add above `parse_transactions`:

```python
def _is_blank(row: list[str]) -> bool:
    """True for a blank line: csv gives [] or a single empty-ish field."""
    return not row or (len(row) == 1 and not row[0].strip())
```

The description is deliberately *not* stripped — the spec calls it free text,
and substring matching is unaffected by surrounding spaces.

- [ ] **Step 14: Run tests to verify they pass**

Run: `python3 -m unittest test_parse -v`
Expected: PASS (all tests)

- [ ] **Step 15: Commit**

```bash
git add ledgerlite/parse.py test_parse.py
git commit -m "feat: tolerate field whitespace and blank lines in the CSV"
```

---

### Task 2: Rules file and categorization

**Files:**
- Create: `ledgerlite/rules.py`
- Test: `test_rules.py`

**Interfaces:**
- Consumes: nothing from Task 1 (rules are pure text; `categorize` takes a description string, not a `Transaction`).
- Produces:
  - `ledgerlite.rules.Rule = tuple[str, str]` — `(substring, category)`.
  - `ledgerlite.rules.parse_rules(lines: Iterable[str]) -> list[Rule]` — file order preserved.
  - `ledgerlite.rules.categorize(description: str, rules: Iterable[Rule]) -> str | None` — case-insensitive substring match, first rule wins, `None` when nothing matches.

- [ ] **Step 1: Write the failing test**

Create `test_rules.py`:

```python
"""Tests for ledgerlite.rules."""

import unittest

from ledgerlite.rules import categorize, parse_rules


class ParseRulesTests(unittest.TestCase):
    def test_parses_substring_and_category_in_file_order(self):
        self.assertEqual(
            parse_rules(["coffee=food\n", "rent=housing\n"]),
            [("coffee", "food"), ("rent", "housing")],
        )

    def test_strips_surrounding_whitespace_but_keeps_interior_spaces(self):
        self.assertEqual(parse_rules([" coffee shop = food \n"]), [("coffee shop", "food")])

    def test_only_the_first_equals_separates(self):
        self.assertEqual(parse_rules(["a=b=c\n"]), [("a", "b=c")])

    def test_skips_blank_lines(self):
        self.assertEqual(parse_rules(["\n", "   \n", "coffee=food\n"]), [("coffee", "food")])

    def test_skips_lines_without_a_separator(self):
        self.assertEqual(parse_rules(["nonsense\n", "coffee=food\n"]), [("coffee", "food")])

    def test_skips_rules_with_an_empty_substring_or_category(self):
        self.assertEqual(parse_rules(["=food\n", "coffee=\n", "coffee=food\n"]), [("coffee", "food")])

    def test_handles_a_final_line_without_a_newline(self):
        self.assertEqual(parse_rules(["coffee=food"]), [("coffee", "food")])


class CategorizeTests(unittest.TestCase):
    RULES = [("coffee", "food"), ("rent", "housing")]

    def test_matches_substring_anywhere_in_description(self):
        self.assertEqual(categorize("SQ *COFFEE BAR 4471", self.RULES), "food")

    def test_matching_is_case_insensitive_both_ways(self):
        self.assertEqual(categorize("coffee bar", [("COFFEE", "food")]), "food")
        self.assertEqual(categorize("COFFEE BAR", [("coffee", "food")]), "food")

    def test_first_matching_rule_wins(self):
        rules = [("coffee", "food"), ("coffee bar", "treats")]

        self.assertEqual(categorize("coffee bar", rules), "food")

    def test_returns_none_when_nothing_matches(self):
        self.assertIsNone(categorize("ACME payroll", self.RULES))

    def test_returns_none_with_no_rules(self):
        self.assertIsNone(categorize("anything", []))


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run test to verify it fails**

Run: `python3 -m unittest test_rules -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'ledgerlite.rules'`

- [ ] **Step 3: Write minimal implementation**

Create `ledgerlite/rules.py`:

```python
"""Rules-file parsing and description categorization."""

from __future__ import annotations

from typing import Iterable

Rule = tuple[str, str]
"""A (substring, category) pair. Both parts are non-empty."""


def parse_rules(lines: Iterable[str]) -> list[Rule]:
    """Parse `<substring>=<category>` lines, preserving file order.

    Blank lines, lines with no `=`, and rules with an empty substring or
    category are skipped: a rule with an empty substring would match every
    transaction, and an empty category would print as a nameless total.
    """
    rules: list[Rule] = []
    for line in lines:
        substring, separator, category = line.partition("=")
        if not separator:
            continue
        substring = substring.strip()
        category = category.strip()
        if not substring or not category:
            continue
        rules.append((substring, category))
    return rules


def categorize(description: str, rules: Iterable[Rule]) -> str | None:
    """Return the category of the first rule matching `description`, else None."""
    haystack = description.lower()
    for substring, category in rules:
        if substring.lower() in haystack:
            return category
    return None
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `python3 -m unittest test_rules -v`
Expected: PASS (all tests)

- [ ] **Step 5: Commit**

```bash
git add ledgerlite/rules.py test_rules.py
git commit -m "feat: parse rules file and categorize descriptions"
```

---

### Task 3: Date ordering and closing balance

**Files:**
- Create: `ledgerlite/balance.py`
- Test: `test_balance.py`

**Interfaces:**
- Consumes: `ledgerlite.model.Transaction` from Task 1.
- Produces:
  - `ledgerlite.balance.order_by_date(transactions: Iterable[Transaction]) -> list[Transaction]` — stable sort by `date`, so same-date rows keep input order.
  - `ledgerlite.balance.closing_balance(opening: Decimal, transactions: Iterable[Transaction]) -> Decimal` — the running balance after the last transaction in date order; `opening` when there are none.

- [ ] **Step 1: Write the failing test**

Create `test_balance.py`:

```python
"""Tests for ledgerlite.balance."""

import datetime
import unittest
from decimal import Decimal

from ledgerlite.balance import closing_balance, order_by_date
from ledgerlite.model import Transaction


def txn(day, amount, description="x"):
    return Transaction(datetime.date(2026, 3, day), Decimal(amount), description)


class OrderByDateTests(unittest.TestCase):
    def test_sorts_by_date(self):
        rows = [txn(4, "1.00", "c"), txn(1, "1.00", "a"), txn(2, "1.00", "b")]

        self.assertEqual([t.description for t in order_by_date(rows)], ["a", "b", "c"])

    def test_ties_keep_input_order(self):
        rows = [txn(1, "1.00", "second"), txn(1, "1.00", "first")]

        self.assertEqual(
            [t.description for t in order_by_date(rows)], ["second", "first"]
        )

    def test_does_not_mutate_the_input(self):
        rows = [txn(4, "1.00", "c"), txn(1, "1.00", "a")]

        order_by_date(rows)

        self.assertEqual([t.description for t in rows], ["c", "a"])


class ClosingBalanceTests(unittest.TestCase):
    def test_adds_every_amount_to_the_opening_balance(self):
        rows = [txn(4, "-7.50"), txn(1, "2500.00"), txn(2, "-900.00")]

        self.assertEqual(closing_balance(Decimal("100"), rows), Decimal("1692.50"))

    def test_no_transactions_leaves_the_opening_balance(self):
        self.assertEqual(closing_balance(Decimal("100.00"), []), Decimal("100.00"))

    def test_result_is_decimal_not_float(self):
        result = closing_balance(Decimal("0"), [txn(1, "0.10"), txn(1, "0.20")])

        self.assertIsInstance(result, Decimal)
        self.assertEqual(result, Decimal("0.30"))


if __name__ == "__main__":
    unittest.main()
```

`test_result_is_decimal_not_float` is the float canary: `0.1 + 0.2` is
`0.30000000000000004` in binary floating point, so this test fails loudly if
anything in the chain touches `float`.

- [ ] **Step 2: Run test to verify it fails**

Run: `python3 -m unittest test_balance -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'ledgerlite.balance'`

- [ ] **Step 3: Write minimal implementation**

Create `ledgerlite/balance.py`:

```python
"""Date ordering and the running balance."""

from __future__ import annotations

from decimal import Decimal
from typing import Iterable

from .model import Transaction


def order_by_date(transactions: Iterable[Transaction]) -> list[Transaction]:
    """Return the transactions ordered by date; ties keep input order.

    `sorted` is stable, which is exactly the tie rule the spec asks for.
    """
    return sorted(transactions, key=lambda transaction: transaction.date)


def closing_balance(opening: Decimal, transactions: Iterable[Transaction]) -> Decimal:
    """Return the running balance after the last transaction in date order."""
    balance = opening
    for transaction in order_by_date(transactions):
        balance += transaction.amount
    return balance
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `python3 -m unittest test_balance -v`
Expected: PASS (all tests)

- [ ] **Step 5: Commit**

```bash
git add ledgerlite/balance.py test_balance.py
git commit -m "feat: order transactions by date and compute closing balance"
```

---

### Task 4: Per-category totals and report formatting

**Files:**
- Create: `ledgerlite/report.py`
- Test: `test_report.py`

**Interfaces:**
- Consumes: `Transaction` (Task 1), `Rule`/`categorize` (Task 2), `closing_balance` (Task 3).
- Produces:
  - `ledgerlite.report.UNCATEGORIZED = "uncategorized"`
  - `ledgerlite.report.category_totals(transactions: Sequence[Transaction], rules: Sequence[Rule]) -> dict[str, Decimal]`
  - `ledgerlite.report.format_amount(amount: Decimal) -> str`
  - `ledgerlite.report.sorted_categories(totals: dict[str, Decimal]) -> list[str]`
  - `ledgerlite.report.format_report(transactions: Sequence[Transaction], rules: Sequence[Rule], opening: Decimal) -> str` — the whole report, ending in a single `\n`.

- [ ] **Step 1: Write the failing test**

Create `test_report.py`:

```python
"""Tests for ledgerlite.report."""

import datetime
import unittest
from decimal import Decimal

from ledgerlite.model import Transaction
from ledgerlite.report import (
    category_totals,
    format_amount,
    format_report,
    sorted_categories,
)

RULES = [("coffee", "food"), ("rent", "housing")]


def txn(day, amount, description):
    return Transaction(datetime.date(2026, 3, day), Decimal(amount), description)


class FormatAmountTests(unittest.TestCase):
    def test_two_fractional_digits_always(self):
        self.assertEqual(format_amount(Decimal("1200")), "1200.00")
        self.assertEqual(format_amount(Decimal("1.5")), "1.50")
        self.assertEqual(format_amount(Decimal("0")), "0.00")

    def test_leading_minus_for_negatives(self):
        self.assertEqual(format_amount(Decimal("-12.5")), "-12.50")

    def test_no_thousands_separators(self):
        self.assertEqual(format_amount(Decimal("1234567.89")), "1234567.89")


class CategoryTotalsTests(unittest.TestCase):
    def test_sums_amounts_per_category(self):
        rows = [txn(1, "-7.50", "Coffee Bar"), txn(2, "-3.25", "coffee cart"), txn(3, "-900", "Rent")]

        self.assertEqual(
            category_totals(rows, RULES),
            {"food": Decimal("-10.75"), "housing": Decimal("-900")},
        )

    def test_unmatched_transactions_are_uncategorized(self):
        rows = [txn(1, "2500.00", "ACME payroll")]

        self.assertEqual(category_totals(rows, RULES), {"uncategorized": Decimal("2500.00")})

    def test_no_rules_means_everything_is_uncategorized(self):
        rows = [txn(1, "-7.50", "Coffee Bar"), txn(2, "-900", "Rent")]

        self.assertEqual(category_totals(rows, []), {"uncategorized": Decimal("-907.50")})

    def test_no_transactions_has_no_categories(self):
        self.assertEqual(category_totals([], RULES), {})


class SortedCategoriesTests(unittest.TestCase):
    def test_alphabetical_with_uncategorized_last(self):
        totals = {
            "uncategorized": Decimal("0"),
            "travel": Decimal("0"),
            "food": Decimal("0"),
            "housing": Decimal("0"),
        }

        self.assertEqual(
            sorted_categories(totals), ["food", "housing", "travel", "uncategorized"]
        )

    def test_uncategorized_omitted_when_absent(self):
        self.assertEqual(sorted_categories({"food": Decimal("0")}), ["food"])


class FormatReportTests(unittest.TestCase):
    def test_matches_the_spec_example(self):
        rows = [
            txn(4, "-7.50", "Coffee Bar"),
            txn(1, "2500.00", "ACME payroll"),
            txn(2, "-900.00", "Rent March"),
        ]

        self.assertEqual(
            format_report(rows, RULES, Decimal("100")),
            "food: -7.50\n"
            "housing: -900.00\n"
            "uncategorized: 2500.00\n"
            "\n"
            "closing balance: 1692.50\n",
        )

    def test_no_transactions_prints_only_the_closing_balance(self):
        self.assertEqual(
            format_report([], RULES, Decimal("100")),
            "\nclosing balance: 100.00\n",
        )


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run test to verify it fails**

Run: `python3 -m unittest test_report -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'ledgerlite.report'`

- [ ] **Step 3: Write minimal implementation**

Create `ledgerlite/report.py`:

```python
"""Per-category totals and report text."""

from __future__ import annotations

from decimal import ROUND_HALF_UP, Decimal
from typing import Sequence

from .balance import closing_balance
from .model import Transaction
from .rules import Rule, categorize

UNCATEGORIZED = "uncategorized"
_CENTS = Decimal("0.01")


def category_totals(
    transactions: Sequence[Transaction], rules: Sequence[Rule]
) -> dict[str, Decimal]:
    """Sum amounts per category; unmatched transactions land in UNCATEGORIZED."""
    totals: dict[str, Decimal] = {}
    for transaction in transactions:
        category = categorize(transaction.description, rules) or UNCATEGORIZED
        totals[category] = totals.get(category, Decimal("0")) + transaction.amount
    return totals


def format_amount(amount: Decimal) -> str:
    """Format with exactly two fractional digits, `-` only for negatives."""
    quantized = amount.quantize(_CENTS, rounding=ROUND_HALF_UP)
    return f"{quantized:f}"


def sorted_categories(totals: dict[str, Decimal]) -> list[str]:
    """Category names alphabetically, with UNCATEGORIZED last if present."""
    names = sorted(name for name in totals if name != UNCATEGORIZED)
    if UNCATEGORIZED in totals:
        names.append(UNCATEGORIZED)
    return names


def format_report(
    transactions: Sequence[Transaction], rules: Sequence[Rule], opening: Decimal
) -> str:
    """Render the whole report, ending in a single newline."""
    totals = category_totals(transactions, rules)
    lines = [
        f"{name}: {format_amount(totals[name])}" for name in sorted_categories(totals)
    ]
    lines.append("")
    lines.append(f"closing balance: {format_amount(closing_balance(opening, transactions))}")
    return "\n".join(lines) + "\n"
```

Note the blank line is unconditional, as the spec words it ("Then a blank
line, then `closing balance:`"), so a report with no categories starts with an
empty line — pinned by `test_no_transactions_prints_only_the_closing_balance`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `python3 -m unittest test_report -v`
Expected: PASS (all tests)

- [ ] **Step 5: Commit**

```bash
git add ledgerlite/report.py test_report.py
git commit -m "feat: format per-category totals and closing balance"
```

- [ ] **Step 6: Write the failing tests for negative zero and a category named uncategorized**

`-0.00` is a legal input amount and `Decimal("-0.00")` formats as `-0.00`,
which the spec forbids: the leading `-` is for negatives, and zero is not
negative. A rules file may also name a category `uncategorized`; those
transactions should merge into the one bucket rather than producing two lines.

Append to `test_report.py`, before the `if __name__` block:

```python
class NegativeZeroTests(unittest.TestCase):
    def test_negative_zero_prints_without_a_sign(self):
        self.assertEqual(format_amount(Decimal("-0.00")), "0.00")
        self.assertEqual(format_amount(Decimal("-0")), "0.00")

    def test_cancelling_category_prints_zero(self):
        rows = [txn(1, "-7.50", "Coffee Bar"), txn(2, "7.50", "coffee refund")]

        self.assertEqual(
            format_report(rows, RULES, Decimal("0")),
            "food: 0.00\n\nclosing balance: 0.00\n",
        )

    def test_negative_zero_amount_in_input(self):
        self.assertEqual(
            format_report([txn(1, "-0.00", "Coffee Bar")], RULES, Decimal("0")),
            "food: 0.00\n\nclosing balance: 0.00\n",
        )


class ExplicitUncategorizedCategoryTests(unittest.TestCase):
    def test_a_rule_named_uncategorized_merges_and_prints_last(self):
        rules = [("misc", "uncategorized"), ("rent", "housing")]
        rows = [txn(1, "-5.00", "misc fee"), txn(2, "-900.00", "Rent"), txn(3, "1.00", "unmatched")]

        self.assertEqual(
            format_report(rows, rules, Decimal("0")),
            "housing: -900.00\nuncategorized: -4.00\n\nclosing balance: -904.00\n",
        )
```

- [ ] **Step 7: Run tests to verify they fail**

Run: `python3 -m unittest test_report -v`
Expected: FAIL — `test_negative_zero_prints_without_a_sign` and `test_negative_zero_amount_in_input` get `-0.00`. (`test_cancelling_category_prints_zero` and the `uncategorized`-rule test should already pass — that is fine, they are regression pins.)

- [ ] **Step 8: Write the implementation**

In `ledgerlite/report.py`, replace `format_amount` with:

```python
def format_amount(amount: Decimal) -> str:
    """Format with exactly two fractional digits, `-` only for negatives.

    Decimal keeps the sign of a negative zero; zero is not negative, so drop
    it rather than printing `-0.00`.
    """
    quantized = amount.quantize(_CENTS, rounding=ROUND_HALF_UP)
    if quantized == 0:
        quantized = abs(quantized)
    return f"{quantized:f}"
```

- [ ] **Step 9: Run tests to verify they pass**

Run: `python3 -m unittest test_report -v`
Expected: PASS (all tests)

- [ ] **Step 10: Commit**

```bash
git add ledgerlite/report.py test_report.py
git commit -m "fix: never print a negative zero amount"
```

---

### Task 5: CLI, exit codes, and error messages

**Files:**
- Create: `ledgerlite/cli.py`
- Create: `ledgerlite/__main__.py`
- Test: `test_cli.py`

**Interfaces:**
- Consumes: `parse.parse_amount`, `parse.parse_transactions`, `parse.ParseError` (Task 1), `rules.parse_rules` (Task 2), `report.format_report` (Task 4).
- Produces:
  - `ledgerlite.cli.build_parser() -> argparse.ArgumentParser`
  - `ledgerlite.cli.main(argv: list[str] | None = None) -> int` — returns the exit code, never calls `sys.exit` itself (argparse still raises `SystemExit` on usage errors).
  - `python3 -m ledgerlite report ...` as the invocation.

- [ ] **Step 1: Write the failing test**

Create `test_cli.py`:

```python
"""Tests for ledgerlite.cli."""

import contextlib
import io
import os
import tempfile
import unittest

from ledgerlite.cli import main

TRANSACTIONS = (
    "date,amount,description\n"
    "2026-03-04,-7.50,Coffee Bar\n"
    "2026-03-01,2500.00,ACME payroll\n"
    "2026-03-02,-900.00,Rent March\n"
)
RULES = "coffee=food\nrent=housing\n"

EXPECTED = (
    "food: -7.50\n"
    "housing: -900.00\n"
    "uncategorized: 2500.00\n"
    "\n"
    "closing balance: 1692.50\n"
)


def run_cli(argv):
    """Run main(argv), capturing stdout and stderr."""
    out, err = io.StringIO(), io.StringIO()
    with contextlib.redirect_stdout(out), contextlib.redirect_stderr(err):
        code = main(argv)
    return code, out.getvalue(), err.getvalue()


class CliTestCase(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory()
        self.addCleanup(self.directory.cleanup)

    def write(self, name, text):
        path = os.path.join(self.directory.name, name)
        with open(path, "w", encoding="utf-8") as handle:
            handle.write(text)
        return path

    def path(self, name):
        return os.path.join(self.directory.name, name)


class SuccessTests(CliTestCase):
    def test_reports_the_spec_example(self):
        transactions = self.write("txns.csv", TRANSACTIONS)
        rules = self.write("rules.txt", RULES)

        code, out, err = run_cli(["report", transactions, "--rules", rules, "--opening", "100"])

        self.assertEqual((code, out, err), (0, EXPECTED, ""))

    def test_without_rules_everything_is_uncategorized(self):
        transactions = self.write("txns.csv", TRANSACTIONS)

        code, out, err = run_cli(["report", transactions])

        self.assertEqual(code, 0)
        self.assertEqual(out, "uncategorized: 1592.50\n\nclosing balance: 1592.50\n")
        self.assertEqual(err, "")

    def test_opening_defaults_to_zero(self):
        transactions = self.write("txns.csv", "date,amount,description\n2026-03-04,-7.50,Coffee Bar\n")

        code, out, _ = run_cli(["report", transactions, "--rules", self.write("r.txt", RULES)])

        self.assertEqual(code, 0)
        self.assertEqual(out, "food: -7.50\n\nclosing balance: -7.50\n")

    def test_negative_opening_is_accepted(self):
        transactions = self.write("txns.csv", "date,amount,description\n2026-03-04,10.00,x\n")

        code, out, _ = run_cli(["report", transactions, "--opening", "-2.50"])

        self.assertEqual(code, 0)
        self.assertEqual(out, "uncategorized: 10.00\n\nclosing balance: 7.50\n")


class UnreadableTransactionsTests(CliTestCase):
    def test_missing_file_exits_1(self):
        missing = self.path("nope.csv")

        code, out, err = run_cli(["report", missing])

        self.assertEqual(code, 1)
        self.assertEqual(out, "")
        self.assertTrue(err.startswith(f"ledgerlite: cannot read {missing}: "), err)
        self.assertIn("No such file or directory", err)
        self.assertTrue(err.endswith("\n"))

    def test_directory_instead_of_file_exits_1(self):
        code, out, err = run_cli(["report", self.directory.name])

        self.assertEqual(code, 1)
        self.assertEqual(out, "")
        self.assertTrue(err.startswith(f"ledgerlite: cannot read {self.directory.name}: "), err)


class MalformedRowTests(CliTestCase):
    def test_malformed_row_exits_2_with_path_and_line(self):
        transactions = self.write(
            "txns.csv",
            "date,amount,description\n2026-03-01,1.00,good\n2026-03-02,oops,bad\n",
        )

        code, out, err = run_cli(["report", transactions])

        self.assertEqual(code, 2)
        self.assertEqual(out, "")
        self.assertEqual(err, f"ledgerlite: {transactions}:3: invalid amount: 'oops'\n")

    def test_nothing_is_printed_to_stdout_for_a_partly_good_file(self):
        transactions = self.write(
            "txns.csv",
            "date,amount,description\n2026-03-01,1.00,good\n2026-03-02,1.005,bad\n",
        )

        code, out, err = run_cli(["report", transactions])

        self.assertEqual(code, 2)
        self.assertEqual(out, "")
        self.assertEqual(
            err,
            f"ledgerlite: {transactions}:3: amount has more than two decimal places: '1.005'\n",
        )


class OpeningAmountTests(CliTestCase):
    """Review Focus item 4: a bad --opening must be a usage error, not a traceback."""

    def assertUsageError(self, argv, needle):
        err = io.StringIO()
        with contextlib.redirect_stderr(err), self.assertRaises(SystemExit) as caught:
            main(argv)

        self.assertEqual(caught.exception.code, 2)
        self.assertIn(needle, err.getvalue())

    def test_non_numeric_opening_is_a_usage_error(self):
        transactions = self.write("txns.csv", TRANSACTIONS)

        self.assertUsageError(
            ["report", transactions, "--opening", "abc"], "invalid amount: 'abc'"
        )

    def test_over_precise_opening_is_a_usage_error(self):
        transactions = self.write("txns.csv", TRANSACTIONS)

        self.assertUsageError(
            ["report", transactions, "--opening", "1.005"],
            "amount has more than two decimal places: '1.005'",
        )

    def test_opening_is_parsed_as_decimal_not_float(self):
        transactions = self.write("txns.csv", "date,amount,description\n2026-03-04,0.20,x\n")

        code, out, _ = run_cli(["report", transactions, "--opening", "0.10"])

        self.assertEqual(code, 0)
        self.assertEqual(out, "uncategorized: 0.20\n\nclosing balance: 0.30\n")


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run test to verify it fails**

Run: `python3 -m unittest test_cli -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'ledgerlite.cli'`

- [ ] **Step 3: Write minimal implementation**

Create `ledgerlite/cli.py`:

```python
"""Command-line entry point: the only module that does I/O or exit codes."""

from __future__ import annotations

import argparse
import sys
from decimal import Decimal

from . import parse, report, rules
from .parse import ParseError


def _opening_amount(raw: str) -> Decimal:
    """argparse type for --opening: same rules as a transaction amount.

    ArgumentTypeError makes argparse print a usage error and exit 2 instead of
    letting a decimal.InvalidOperation traceback escape.
    """
    try:
        return parse.parse_amount(raw)
    except ValueError as exc:
        raise argparse.ArgumentTypeError(str(exc)) from exc


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="ledgerlite", description="Categorize bank transactions and report totals."
    )
    subcommands = parser.add_subparsers(dest="command", required=True)
    report_command = subcommands.add_parser("report", help="print a categorized report")
    report_command.add_argument(
        "transactions", metavar="TRANSACTIONS", help="transactions CSV to read"
    )
    report_command.add_argument(
        "--rules", metavar="RULES", help="rules file (<substring>=<category> per line)"
    )
    report_command.add_argument(
        "--opening",
        metavar="AMOUNT",
        type=_opening_amount,
        default=Decimal("0"),
        help="opening balance (default: 0)",
    )
    return parser


def _read_lines(path: str) -> list[str]:
    with open(path, newline="", encoding="utf-8") as handle:
        return handle.readlines()


def _reason(exc: BaseException) -> str:
    """The human-readable half of an I/O failure."""
    return getattr(exc, "strerror", None) or str(exc)


def main(argv: list[str] | None = None) -> int:
    args = build_parser().parse_args(argv)

    try:
        transaction_lines = _read_lines(args.transactions)
    except OSError as exc:
        print(f"ledgerlite: cannot read {args.transactions}: {_reason(exc)}", file=sys.stderr)
        return 1

    try:
        transactions = parse.parse_transactions(transaction_lines)
    except ParseError as exc:
        print(f"ledgerlite: {args.transactions}:{exc.line}: {exc.problem}", file=sys.stderr)
        return 2

    loaded_rules: list[rules.Rule] = []
    if args.rules is not None:
        loaded_rules = rules.parse_rules(_read_lines(args.rules))

    sys.stdout.write(report.format_report(transactions, loaded_rules, args.opening))
    return 0
```

Create `ledgerlite/__main__.py`:

```python
"""Allow `python3 -m ledgerlite`."""

import sys

from .cli import main

if __name__ == "__main__":
    sys.exit(main())
```

`main` returns the exit code rather than calling `sys.exit`, so tests can
assert on it directly; `__main__.py` is the only place that exits.

- [ ] **Step 4: Run tests to verify they pass**

Run: `python3 -m unittest test_cli -v`
Expected: PASS (all tests)

- [ ] **Step 5: Commit**

```bash
git add ledgerlite/cli.py ledgerlite/__main__.py test_cli.py
git commit -m "feat: add report CLI with exit codes and --opening validation"
```

- [ ] **Step 6: Write the failing test for an unreadable rules file**

Review Focus item 5. The spec only promises a message for TRANSACTIONS, but a
typo'd `--rules` path currently escapes as a `FileNotFoundError` traceback.
Worse would be treating it as "no rules" and printing an all-uncategorized
report that looks plausible and is wrong.

Append to `test_cli.py`, before the `if __name__` block:

```python
class UnreadableRulesTests(CliTestCase):
    def test_missing_rules_file_exits_1_without_a_report(self):
        transactions = self.write("txns.csv", TRANSACTIONS)
        missing = self.path("nope.txt")

        code, out, err = run_cli(["report", transactions, "--rules", missing])

        self.assertEqual(code, 1)
        self.assertEqual(out, "")
        self.assertTrue(err.startswith(f"ledgerlite: cannot read {missing}: "), err)
        self.assertIn("No such file or directory", err)
```

- [ ] **Step 7: Run test to verify it fails**

Run: `python3 -m unittest test_cli -v`
Expected: FAIL — `FileNotFoundError` escapes `main` uncaught (the test errors
rather than getting exit code 1).

- [ ] **Step 8: Write the implementation**

In `ledgerlite/cli.py`, wrap the rules read in `main`, replacing the
`if args.rules is not None` block:

```python
    loaded_rules: list[rules.Rule] = []
    if args.rules is not None:
        try:
            loaded_rules = rules.parse_rules(_read_lines(args.rules))
        except OSError as exc:
            print(f"ledgerlite: cannot read {args.rules}: {_reason(exc)}", file=sys.stderr)
            return 1
```

- [ ] **Step 9: Run tests to verify they pass**

Run: `python3 -m unittest test_cli -v`
Expected: PASS (all tests)

- [ ] **Step 10: Commit**

```bash
git add ledgerlite/cli.py test_cli.py
git commit -m "feat: report an unreadable rules file instead of crashing"
```

- [ ] **Step 11: Run the whole suite**

Run: `python3 -m unittest -v`
Expected: PASS — every test from Tasks 1–5, zero failures, zero errors.

- [ ] **Step 12: Drive the real CLI end to end**

The tests call `main()` in-process; this checks the actual command, the exit
codes the shell sees, and the stdout/stderr split.

```bash
mkdir -p /tmp/ledgerlite-check
printf 'date,amount,description\n2026-03-04,-7.50,Coffee Bar\n2026-03-01,2500.00,ACME payroll\n2026-03-02,-900.00,Rent March\n' > /tmp/ledgerlite-check/txns.csv
printf 'coffee=food\nrent=housing\n' > /tmp/ledgerlite-check/rules.txt

python3 -m ledgerlite report /tmp/ledgerlite-check/txns.csv --rules /tmp/ledgerlite-check/rules.txt --opening 100
echo "exit=$?"
```

Expected, exactly:

```
food: -7.50
housing: -900.00
uncategorized: 2500.00

closing balance: 1692.50
exit=0
```

Then the two failure paths:

```bash
python3 -m ledgerlite report /tmp/ledgerlite-check/missing.csv > /dev/null
echo "exit=$?"
printf 'date,amount,description\n2026-03-04,oops,bad\n' > /tmp/ledgerlite-check/bad.csv
python3 -m ledgerlite report /tmp/ledgerlite-check/bad.csv > /dev/null
echo "exit=$?"
```

Expected, exactly:

```
ledgerlite: cannot read /tmp/ledgerlite-check/missing.csv: No such file or directory
exit=1
ledgerlite: /tmp/ledgerlite-check/bad.csv:2: invalid amount: 'oops'
exit=2
```

Both messages must still appear even though stdout went to `/dev/null` — that
is the check that they go to stderr.

- [ ] **Step 13: Commit**

Nothing should have changed in Steps 11–12. If a fix was needed, commit it:

```bash
git status --short
git commit -am "fix: correct CLI behavior found in end-to-end check"
```

Otherwise skip the commit and note that the tree is clean.
