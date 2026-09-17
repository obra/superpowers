# ledgerlite Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `ledgerlite`, a standard-library-only Python package and CLI that reads a bank-transaction CSV, categorizes each row with a rules file, and prints per-category totals plus the closing balance.

**Architecture:** Six small modules with one responsibility each, dependencies flowing one way: `model` (data) ← `parse` (CSV text → transactions) and `rules` (rules text → matchers) ← `balance` (ordering, closing balance) ← `report` (totals, formatting) ← `cli` (argument parsing, file I/O, exit codes). All file I/O and all message/exit-code decisions live in `cli.py`; every other module is pure functions over text and values, which makes each one testable with plain `unittest` and no temp files. Money is `decimal.Decimal` end to end — no float ever touches an amount.

**Tech Stack:** Python 3.11+, standard library only (`csv`, `decimal`, `datetime`, `argparse`, `re`, `io`, `dataclasses`), `unittest` for tests.

**Spec:** `design.md` (repo root)

## Global Constraints

- Python 3.11+. Standard library only — no third-party dependencies, no `setup.py`/`pyproject.toml` needed.
- Amounts are parsed and summed as `decimal.Decimal`, **never** `float`. No `float(...)` anywhere in the package.
- Package layout is exactly as the spec's "Package layout" section: `ledgerlite/{__init__,model,parse,rules,balance,report,cli}.py`.
- Tests live at the repo root as `test_<module>.py` and run with `python3 -m unittest` from the repo root.
- Amounts are printed with exactly two fractional digits, a leading `-` for negatives, and no thousands separators.
- Exit codes: `0` success, `1` transactions file cannot be read, `2` malformed input.
- Error messages go to stderr verbatim in these shapes:
  - `ledgerlite: cannot read <path>: <reason>`
  - `ledgerlite: <path>:<line>: <what is wrong>`
- Work directly on `main`; commit after every task.

## Review Focus

The spec defines the happy path and three error classes; these are the inputs it does not mention but that the program will meet. Each line states the decision this plan makes, and each has a test in the named task. Reviewer: confirm the behavior, not just the presence of a test.

1. **Empty file / missing header** — a file with no rows, or whose first row is not `date,amount,description`, is malformed: `<path>:1: expected header 'date,amount,description'`, exit 2. Silently treating row 1 as data would swallow a transaction. (Task 2)
2. **Header-only file** — valid: zero transactions, closing balance equals opening. (Task 2, Task 5, Task 6)
3. **Zero category lines** — with no transactions the report is just `closing balance: <amount>`, with no leading blank line: the blank line is a separator, and there is nothing to separate. (Task 5)
4. **`NaN`, `Infinity`, `1e5`, `+5`, `.5`, `1.005`, empty amount** — all malformed (exit 2). `Decimal("nan")` would silently poison every total, so amounts are validated by strict regex, not by `Decimal`'s own tolerance. (Task 2)
5. **Impossible or loosely written dates** — `2026-02-30`, `2026-3-4`, `20260304`, `2026-03-04T00:00` are all malformed. `date.fromisoformat` accepts several of these on 3.11+; the spec says `2026-03-04`, so parsing is strict `%Y-%m-%d`. (Task 2)
6. **First error wins** — a file with two malformed rows reports the earlier line only, and prints nothing to stdout. (Task 2, Task 6)
7. **Blank lines inside the CSV** — skipped, not an error; a trailing newline or a stray blank line is not a wrong-column-count row. A row with content but not 3 fields is still malformed. (Task 2)
8. **CRLF line endings and a UTF-8 BOM** — both tolerated (files exported from spreadsheets have them). BOM handled by reading as `utf-8-sig`; CRLF by handing `csv` an untranslated buffer. (Task 2, Task 6)
9. **Non-UTF-8 transactions file** — reported as `cannot read <path>: invalid utf-8: <reason>`, exit 1. `UnicodeDecodeError` is not an `OSError`, so without this it would be an uncaught traceback. (Task 6)
10. **Missing/unreadable `--rules` file** — same `cannot read` message, exit 1. The spec only names the transactions file, but a typo'd rules path must not traceback. (Task 6)
11. **Malformed rules lines** — a line with no `=`, a blank line, an empty substring, or an empty category is ignored. The spec defines no error path for the rules file, so it never fails the run. (Task 3)
12. **A rule whose category is literally `uncategorized`** — merges with the no-rule bucket and is still printed last. (Task 5)
13. **A category with rules but no matching transactions** — not printed. "One line per category" means per category that has transactions. (Task 5)
14. **Two rules mapping to the same category** — one line, totals summed. (Task 5)
15. **Same-date rows** — ordering is a stable sort, so ties keep input order. (Task 4)
16. **`-0.00`** — printed as `0.00`; negative zero is not negative. (Task 5)
17. **Whole amounts and thousands** — `1200` prints `1200.00`, never `1,200.00` or `1.2E+3`. (Task 5)
18. **Invalid `--opening`** — rejected by argparse with a usage message, exit 2 (argparse's own code, which matches the spec's malformed-input code). `--opening` uses the same strict amount rule as the CSV. (Task 6)

---

## File Structure

| File | Responsibility |
|---|---|
| `ledgerlite/__init__.py` | Package docstring only. |
| `ledgerlite/model.py` | `Transaction` frozen dataclass. No logic. |
| `ledgerlite/parse.py` | `ParseError`, `parse_amount`, `parse_transactions`. CSV *text* → transactions. No file I/O. |
| `ledgerlite/rules.py` | `parse_rules`, `categorize`. Rules *text* → matchers, and description → category. |
| `ledgerlite/balance.py` | `order_by_date`, `closing_balance`. |
| `ledgerlite/report.py` | `UNCATEGORIZED`, `category_totals`, `format_amount`, `format_report`. |
| `ledgerlite/cli.py` | `main(argv) -> int`: argparse, file reading, error messages, exit codes. |
| `ledgerlite/__main__.py` | Three lines so `python3 -m ledgerlite` runs the CLI. |
| `test_model.py` … `test_cli.py` | One test module per package module, at the repo root. |

**Stated addition beyond the spec's layout:** `ledgerlite/__main__.py`. The spec's layout omits it, but without it the "command-line tool" has no way to be invoked. It contains no logic — it calls `cli.main()`.

---

## Task 1: Package skeleton and the Transaction model

**Files:**
- Create: `ledgerlite/__init__.py`
- Create: `ledgerlite/model.py`
- Test: `test_model.py`

**Interfaces:**
- Consumes: nothing.
- Produces: `ledgerlite.model.Transaction`, a frozen dataclass with fields, in positional order, `date: datetime.date`, `amount: decimal.Decimal`, `description: str`. Every later task constructs `Transaction(day, amount, description)`.

- [ ] **Step 1: Write the failing test**

Create `test_model.py`:

```python
import unittest
from dataclasses import FrozenInstanceError
from datetime import date
from decimal import Decimal

from ledgerlite.model import Transaction


class TransactionTest(unittest.TestCase):
    def test_holds_date_amount_and_description(self):
        txn = Transaction(date(2026, 3, 4), Decimal("-7.50"), "Coffee Bar")

        self.assertEqual(txn.date, date(2026, 3, 4))
        self.assertEqual(txn.amount, Decimal("-7.50"))
        self.assertEqual(txn.description, "Coffee Bar")

    def test_is_frozen(self):
        txn = Transaction(date(2026, 3, 4), Decimal("-7.50"), "Coffee Bar")

        with self.assertRaises(FrozenInstanceError):
            txn.amount = Decimal("0.00")


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run the test to verify it fails**

Run from the repo root: `python3 -m unittest test_model -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'ledgerlite'`

- [ ] **Step 3: Write the minimal implementation**

Create `ledgerlite/__init__.py`:

```python
"""ledgerlite — categorize bank transactions and summarize them."""
```

Create `ledgerlite/model.py`:

```python
"""The one data type ledgerlite passes around."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import date
from decimal import Decimal


@dataclass(frozen=True)
class Transaction:
    """One row of a transactions CSV.

    `amount` is negative for money out, positive for money in.
    """

    date: date
    amount: Decimal
    description: str
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `python3 -m unittest test_model -v`
Expected: PASS (2 tests)

- [ ] **Step 5: Commit**

```bash
git add ledgerlite/__init__.py ledgerlite/model.py test_model.py
git commit -m "feat: add Transaction model and package skeleton"
```

---

## Task 2: Parsing transactions CSV text

This is the task with the most rules in it. Read the whole task before starting.

**Files:**
- Create: `ledgerlite/parse.py`
- Test: `test_parse.py`

**Interfaces:**
- Consumes: `ledgerlite.model.Transaction` (Task 1).
- Produces:
  - `parse.ParseError(line: int, message: str)` — exception with attributes `.line` (1-based line number in the source file) and `.message` (the "what is wrong" text, with no path and no line prefix). Task 6 formats it.
  - `parse.parse_amount(text: str) -> Decimal` — raises `ValueError` on anything that is not an optionally-negative decimal with at most two fractional digits. Task 6 reuses this for `--opening`.
  - `parse.parse_transactions(text: str) -> list[Transaction]` — takes the file's *decoded text*, not a path; returns transactions in input order; raises `ParseError` on the first malformed row.

- [ ] **Step 1: Write the failing tests for `parse_amount`**

Create `test_parse.py`:

```python
import unittest
from datetime import date
from decimal import Decimal

from ledgerlite.parse import ParseError, parse_amount, parse_transactions


class ParseAmountTest(unittest.TestCase):
    def test_accepts_zero_one_and_two_fractional_digits(self):
        self.assertEqual(parse_amount("1"), Decimal("1"))
        self.assertEqual(parse_amount("1.5"), Decimal("1.5"))
        self.assertEqual(parse_amount("1.50"), Decimal("1.50"))

    def test_accepts_negative_amounts(self):
        self.assertEqual(parse_amount("-900.00"), Decimal("-900.00"))

    def test_ignores_surrounding_whitespace(self):
        self.assertEqual(parse_amount("  -7.50 "), Decimal("-7.50"))

    def test_rejects_more_than_two_fractional_digits(self):
        with self.assertRaises(ValueError):
            parse_amount("1.005")

    def test_rejects_values_decimal_would_otherwise_accept(self):
        # Decimal() happily builds these; they must not reach a total.
        for bad in ["nan", "NaN", "Infinity", "-inf", "1e5", "1E+3"]:
            with self.subTest(bad=bad), self.assertRaises(ValueError):
                parse_amount(bad)

    def test_rejects_other_malformed_amounts(self):
        for bad in ["", "   ", "+5", ".5", "5.", "-", "1,200.00", "12.50USD"]:
            with self.subTest(bad=bad), self.assertRaises(ValueError):
                parse_amount(bad)


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `python3 -m unittest test_parse -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'ledgerlite.parse'`

- [ ] **Step 3: Implement `ParseError` and `parse_amount`**

Create `ledgerlite/parse.py`:

```python
"""Turn transactions-CSV text into Transaction objects."""

from __future__ import annotations

import csv
import io
import re
from datetime import datetime
from decimal import Decimal

from .model import Transaction

HEADER = ["date", "amount", "description"]
_HEADER_MESSAGE = "expected header 'date,amount,description'"

# Deliberately stricter than Decimal(): no NaN, no Infinity, no exponents,
# no leading '+', at most two fractional digits.
_AMOUNT_RE = re.compile(r"-?\d+(?:\.\d{1,2})?\Z")


class ParseError(Exception):
    """A malformed row.

    `line` is the 1-based line number in the source file; `message` says what
    is wrong, without the path or line prefix (the CLI adds those).
    """

    def __init__(self, line: int, message: str) -> None:
        super().__init__(f"{line}: {message}")
        self.line = line
        self.message = message


def parse_amount(text: str) -> Decimal:
    """Parse a decimal amount with at most two fractional digits.

    Raises ValueError if `text` is not such an amount.
    """
    stripped = text.strip()
    if not _AMOUNT_RE.match(stripped):
        raise ValueError(f"invalid amount: {stripped!r}")
    return Decimal(stripped)
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `python3 -m unittest test_parse -v`
Expected: PASS (6 tests)

- [ ] **Step 5: Commit**

```bash
git add ledgerlite/parse.py test_parse.py
git commit -m "feat: add strict decimal amount parsing"
```

- [ ] **Step 6: Write the failing tests for `parse_transactions`**

Append to `test_parse.py`, above the `if __name__` block:

```python
HEADER_LINE = "date,amount,description\n"


class ParseTransactionsTest(unittest.TestCase):
    def test_parses_rows_in_input_order(self):
        text = HEADER_LINE + "2026-03-05,2500.00,Salary\n2026-03-04,-7.50,Coffee Bar\n"

        txns = parse_transactions(text)

        self.assertEqual(len(txns), 2)
        self.assertEqual(txns[0].date, date(2026, 3, 5))
        self.assertEqual(txns[0].amount, Decimal("2500.00"))
        self.assertEqual(txns[0].description, "Salary")
        self.assertEqual(txns[1].description, "Coffee Bar")

    def test_header_only_file_has_no_transactions(self):
        self.assertEqual(parse_transactions(HEADER_LINE), [])

    def test_accepts_quoted_description_containing_a_comma(self):
        text = HEADER_LINE + '2026-03-04,-7.50,"Coffee Bar, Ltd"\n'

        self.assertEqual(parse_transactions(text)[0].description, "Coffee Bar, Ltd")

    def test_accepts_crlf_line_endings(self):
        text = "date,amount,description\r\n2026-03-04,-7.50,Coffee Bar\r\n"

        txns = parse_transactions(text)

        self.assertEqual(len(txns), 1)
        self.assertEqual(txns[0].description, "Coffee Bar")

    def test_skips_blank_lines(self):
        text = HEADER_LINE + "\n2026-03-04,-7.50,Coffee Bar\n   \n"

        self.assertEqual(len(parse_transactions(text)), 1)

    def test_rejects_empty_file_as_missing_header(self):
        with self.assertRaises(ParseError) as caught:
            parse_transactions("")

        self.assertEqual(caught.exception.line, 1)
        self.assertEqual(
            caught.exception.message, "expected header 'date,amount,description'"
        )

    def test_rejects_file_whose_first_row_is_data(self):
        with self.assertRaises(ParseError) as caught:
            parse_transactions("2026-03-04,-7.50,Coffee Bar\n")

        self.assertEqual(caught.exception.line, 1)
        self.assertEqual(
            caught.exception.message, "expected header 'date,amount,description'"
        )

    def test_accepts_header_with_padding_and_mixed_case(self):
        text = "Date, Amount , DESCRIPTION\n2026-03-04,-7.50,Coffee Bar\n"

        self.assertEqual(len(parse_transactions(text)), 1)

    def test_rejects_row_with_too_few_columns(self):
        with self.assertRaises(ParseError) as caught:
            parse_transactions(HEADER_LINE + "2026-03-04,-7.50\n")

        self.assertEqual(caught.exception.line, 2)
        self.assertEqual(caught.exception.message, "expected 3 columns, got 2")

    def test_rejects_row_with_too_many_columns(self):
        with self.assertRaises(ParseError) as caught:
            parse_transactions(HEADER_LINE + "2026-03-04,-7.50,Coffee,extra\n")

        self.assertEqual(caught.exception.line, 2)
        self.assertEqual(caught.exception.message, "expected 3 columns, got 4")

    def test_rejects_unparseable_dates(self):
        for bad in ["2026-13-01", "2026-02-30", "2026-3-4", "20260304",
                    "2026-03-04T00:00", "04/03/2026", ""]:
            with self.subTest(bad=bad):
                with self.assertRaises(ParseError) as caught:
                    parse_transactions(HEADER_LINE + f"{bad},-7.50,Coffee Bar\n")

                self.assertEqual(caught.exception.line, 2)
                self.assertEqual(caught.exception.message, f"invalid date: {bad!r}")

    def test_rejects_amount_with_three_fractional_digits(self):
        with self.assertRaises(ParseError) as caught:
            parse_transactions(HEADER_LINE + "2026-03-04,1.005,Coffee Bar\n")

        self.assertEqual(caught.exception.line, 2)
        self.assertEqual(caught.exception.message, "invalid amount: '1.005'")

    def test_rejects_non_numeric_amount(self):
        with self.assertRaises(ParseError) as caught:
            parse_transactions(HEADER_LINE + "2026-03-04,NaN,Coffee Bar\n")

        self.assertEqual(caught.exception.message, "invalid amount: 'NaN'")

    def test_reports_the_first_malformed_row_only(self):
        text = (
            HEADER_LINE
            + "2026-03-04,-7.50,Coffee Bar\n"
            + "2026-03-05,oops,Salary\n"
            + "nope,-1.00,Rent\n"
        )

        with self.assertRaises(ParseError) as caught:
            parse_transactions(text)

        self.assertEqual(caught.exception.line, 3)
        self.assertEqual(caught.exception.message, "invalid amount: 'oops'")

    def test_line_numbers_count_blank_lines(self):
        text = HEADER_LINE + "\n\n2026-03-04,oops,Coffee Bar\n"

        with self.assertRaises(ParseError) as caught:
            parse_transactions(text)

        self.assertEqual(caught.exception.line, 4)
```

- [ ] **Step 7: Run the tests to verify they fail**

Run: `python3 -m unittest test_parse -v`
Expected: FAIL — `ImportError: cannot import name 'parse_transactions'`

- [ ] **Step 8: Implement `parse_transactions`**

Append to `ledgerlite/parse.py`:

```python
def parse_transactions(text: str) -> list[Transaction]:
    """Parse decoded transactions-CSV text.

    Returns transactions in input order. Raises ParseError on the first
    malformed row; the caller is expected to reject the whole file.
    """
    # newline="" keeps \r\n intact so csv handles the line endings itself.
    reader = csv.reader(io.StringIO(text, newline=""))
    transactions: list[Transaction] = []
    header_seen = False

    for row in reader:
        line = reader.line_num
        if _is_blank(row):
            continue

        if not header_seen:
            if [field.strip().lower() for field in row] != HEADER:
                raise ParseError(line, _HEADER_MESSAGE)
            header_seen = True
            continue

        transactions.append(_parse_row(row, line))

    if not header_seen:
        raise ParseError(1, _HEADER_MESSAGE)
    return transactions


def _parse_row(row: list[str], line: int) -> Transaction:
    if len(row) != 3:
        raise ParseError(line, f"expected 3 columns, got {len(row)}")

    raw_date, raw_amount, description = row
    raw_date = raw_date.strip()
    try:
        day = datetime.strptime(raw_date, "%Y-%m-%d").date()
    except ValueError:
        raise ParseError(line, f"invalid date: {raw_date!r}") from None

    try:
        amount = parse_amount(raw_amount)
    except ValueError as exc:
        raise ParseError(line, str(exc)) from None

    return Transaction(day, amount, description)


def _is_blank(row: list[str]) -> bool:
    """True for a line with no content at all (csv gives [] or ['  '])."""
    return len(row) <= 1 and (not row or not row[0].strip())
```

- [ ] **Step 9: Run the tests to verify they pass**

Run: `python3 -m unittest test_parse -v`
Expected: PASS (21 tests)

- [ ] **Step 10: Commit**

```bash
git add ledgerlite/parse.py test_parse.py
git commit -m "feat: parse transactions CSV text with strict row validation"
```

---

## Task 3: Rules parsing and categorization

**Files:**
- Create: `ledgerlite/rules.py`
- Test: `test_rules.py`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `rules.parse_rules(text: str) -> list[tuple[str, str]]` — a list of `(substring, category)` in file order. **The substring is already lowercased**; the category keeps the case written in the file. Unusable lines are dropped.
  - `rules.categorize(description: str, rules: list[tuple[str, str]]) -> str | None` — the category of the first matching rule, or `None`.

- [ ] **Step 1: Write the failing tests**

Create `test_rules.py`:

```python
import unittest

from ledgerlite.rules import categorize, parse_rules


class ParseRulesTest(unittest.TestCase):
    def test_parses_one_rule_per_line_in_order(self):
        self.assertEqual(
            parse_rules("coffee=food\nrent=housing\n"),
            [("coffee", "food"), ("rent", "housing")],
        )

    def test_lowercases_the_substring_but_keeps_category_case(self):
        self.assertEqual(parse_rules("COFFEE=Food\n"), [("coffee", "Food")])

    def test_strips_whitespace_around_both_halves(self):
        self.assertEqual(parse_rules("  coffee  =  food  \n"), [("coffee", "food")])

    def test_splits_on_the_first_equals_only(self):
        self.assertEqual(parse_rules("coffee=food=drink\n"), [("coffee", "food=drink")])

    def test_ignores_unusable_lines(self):
        text = "\n   \nnot a rule\n=food\ncoffee=\ncoffee=food\n"

        self.assertEqual(parse_rules(text), [("coffee", "food")])

    def test_empty_text_gives_no_rules(self):
        self.assertEqual(parse_rules(""), [])


class CategorizeTest(unittest.TestCase):
    def setUp(self):
        self.rules = parse_rules("coffee=food\nrent=housing\n")

    def test_matches_a_substring_of_the_description(self):
        self.assertEqual(categorize("Coffee Bar No 4", self.rules), "food")

    def test_matching_is_case_insensitive(self):
        self.assertEqual(categorize("MONTHLY RENT", self.rules), "housing")

    def test_first_matching_rule_wins(self):
        rules = parse_rules("coffee=food\ncoffee bar=drinks\n")

        self.assertEqual(categorize("Coffee Bar", rules), "food")

    def test_returns_none_when_nothing_matches(self):
        self.assertIsNone(categorize("ACME Payroll", self.rules))

    def test_returns_none_with_no_rules(self):
        self.assertIsNone(categorize("Coffee Bar", []))


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `python3 -m unittest test_rules -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'ledgerlite.rules'`

- [ ] **Step 3: Write the implementation**

Create `ledgerlite/rules.py`:

```python
"""Rules text -> (substring, category) matchers, and matching itself."""

from __future__ import annotations


def parse_rules(text: str) -> list[tuple[str, str]]:
    """Parse `<substring>=<category>` lines, in order.

    Substrings come back lowercased, ready to match a lowercased description.
    Lines that cannot be a rule — blank, no `=`, an empty half — are ignored:
    the spec gives the rules file no error path, so it never fails a run.
    """
    rules: list[tuple[str, str]] = []
    for line in text.splitlines():
        if "=" not in line:
            continue
        substring, category = line.split("=", 1)
        substring = substring.strip().lower()
        category = category.strip()
        if not substring or not category:
            continue
        rules.append((substring, category))
    return rules


def categorize(description: str, rules: list[tuple[str, str]]) -> str | None:
    """Return the first matching rule's category, or None if none match."""
    lowered = description.lower()
    for substring, category in rules:
        if substring in lowered:
            return category
    return None
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `python3 -m unittest test_rules -v`
Expected: PASS (11 tests)

- [ ] **Step 5: Commit**

```bash
git add ledgerlite/rules.py test_rules.py
git commit -m "feat: add rules parsing and description categorization"
```

---

## Task 4: Date ordering and closing balance

**Files:**
- Create: `ledgerlite/balance.py`
- Test: `test_balance.py`

**Interfaces:**
- Consumes: `ledgerlite.model.Transaction` (Task 1).
- Produces:
  - `balance.order_by_date(transactions: list[Transaction]) -> list[Transaction]` — a new list sorted by date, ties keeping input order. Does not mutate its argument.
  - `balance.closing_balance(opening: Decimal, transactions: Iterable[Transaction]) -> Decimal` — the running balance after the last transaction; `opening` when there are none.

- [ ] **Step 1: Write the failing tests**

Create `test_balance.py`:

```python
import unittest
from datetime import date
from decimal import Decimal

from ledgerlite.balance import closing_balance, order_by_date
from ledgerlite.model import Transaction


def txn(day, amount, description="x"):
    return Transaction(date(2026, 3, day), Decimal(amount), description)


class OrderByDateTest(unittest.TestCase):
    def test_sorts_by_date(self):
        rows = [txn(5, "1.00", "b"), txn(4, "1.00", "a")]

        self.assertEqual(
            [t.description for t in order_by_date(rows)], ["a", "b"]
        )

    def test_ties_keep_input_order(self):
        rows = [txn(4, "1.00", "first"), txn(4, "2.00", "second"), txn(3, "3.00", "early")]

        self.assertEqual(
            [t.description for t in order_by_date(rows)], ["early", "first", "second"]
        )

    def test_does_not_mutate_the_input(self):
        rows = [txn(5, "1.00", "b"), txn(4, "1.00", "a")]

        order_by_date(rows)

        self.assertEqual([t.description for t in rows], ["b", "a"])

    def test_empty_input(self):
        self.assertEqual(order_by_date([]), [])


class ClosingBalanceTest(unittest.TestCase):
    def test_adds_every_amount_to_the_opening_balance(self):
        rows = [txn(4, "-7.50"), txn(4, "-900.00"), txn(5, "2500.00")]

        self.assertEqual(closing_balance(Decimal("100"), rows), Decimal("1692.50"))

    def test_no_transactions_gives_the_opening_balance(self):
        self.assertEqual(closing_balance(Decimal("100"), []), Decimal("100"))

    def test_sums_exactly_where_float_would_drift(self):
        rows = [txn(4, "0.10") for _ in range(3)]

        self.assertEqual(closing_balance(Decimal("0"), rows), Decimal("0.30"))


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `python3 -m unittest test_balance -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'ledgerlite.balance'`

- [ ] **Step 3: Write the implementation**

Create `ledgerlite/balance.py`:

```python
"""Date ordering and the running balance."""

from __future__ import annotations

from collections.abc import Iterable
from decimal import Decimal

from .model import Transaction


def order_by_date(transactions: list[Transaction]) -> list[Transaction]:
    """Return the transactions ordered by date, ties keeping input order.

    sorted() is stable, which is exactly the tie-break the spec asks for.
    """
    return sorted(transactions, key=lambda txn: txn.date)


def closing_balance(opening: Decimal, transactions: Iterable[Transaction]) -> Decimal:
    """Run the balance from `opening` through `transactions`, in the given order."""
    balance = opening
    for txn in transactions:
        balance += txn.amount
    return balance
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `python3 -m unittest test_balance -v`
Expected: PASS (7 tests)

- [ ] **Step 5: Commit**

```bash
git add ledgerlite/balance.py test_balance.py
git commit -m "feat: add date ordering and closing balance"
```

---

## Task 5: Per-category totals and report formatting

**Files:**
- Create: `ledgerlite/report.py`
- Test: `test_report.py`

**Interfaces:**
- Consumes: `Transaction` (Task 1), `rules.categorize` (Task 3), `balance.order_by_date` and `balance.closing_balance` (Task 4).
- Produces:
  - `report.UNCATEGORIZED = "uncategorized"`
  - `report.format_amount(amount: Decimal) -> str` — exactly two fractional digits, no thousands separators, no `-0.00`.
  - `report.category_totals(transactions, rules) -> list[tuple[str, Decimal]]` — categories with at least one transaction, alphabetical, `uncategorized` last.
  - `report.format_report(transactions, rules, opening: Decimal) -> str` — the whole report, ending in a single trailing newline.

- [ ] **Step 1: Write the failing tests for `format_amount`**

Create `test_report.py`:

```python
import unittest
from datetime import date
from decimal import Decimal

from ledgerlite.model import Transaction
from ledgerlite.report import (
    UNCATEGORIZED,
    category_totals,
    format_amount,
    format_report,
)
from ledgerlite.rules import parse_rules


def txn(day, amount, description):
    return Transaction(date(2026, 3, day), Decimal(amount), description)


class FormatAmountTest(unittest.TestCase):
    def test_pads_to_two_fractional_digits(self):
        self.assertEqual(format_amount(Decimal("1200")), "1200.00")
        self.assertEqual(format_amount(Decimal("1.5")), "1.50")

    def test_keeps_two_fractional_digits(self):
        self.assertEqual(format_amount(Decimal("-12.50")), "-12.50")

    def test_zero(self):
        self.assertEqual(format_amount(Decimal("0")), "0.00")

    def test_negative_zero_is_not_negative(self):
        self.assertEqual(format_amount(Decimal("-0.00")), "0.00")

    def test_no_thousands_separator_and_no_exponent(self):
        self.assertEqual(format_amount(Decimal("1234567.89")), "1234567.89")
        self.assertEqual(format_amount(Decimal("1000") * Decimal("1000")), "1000000.00")


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `python3 -m unittest test_report -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'ledgerlite.report'`

- [ ] **Step 3: Implement `format_amount`**

Create `ledgerlite/report.py`:

```python
"""Per-category totals and the printed report."""

from __future__ import annotations

from decimal import Decimal

from .balance import closing_balance, order_by_date
from .model import Transaction
from .rules import categorize

UNCATEGORIZED = "uncategorized"

_CENTS = Decimal("0.01")


def format_amount(amount: Decimal) -> str:
    """Format an amount with exactly two fractional digits, no separators."""
    quantized = amount.quantize(_CENTS)
    if quantized == 0:
        quantized = abs(quantized)  # never print "-0.00"
    return f"{quantized:f}"
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `python3 -m unittest test_report -v`
Expected: PASS (5 tests)

- [ ] **Step 5: Commit**

```bash
git add ledgerlite/report.py test_report.py
git commit -m "feat: add amount formatting"
```

- [ ] **Step 6: Write the failing tests for `category_totals` and `format_report`**

Append to `test_report.py`, above the `if __name__` block:

```python
RULES = parse_rules("coffee=food\nrent=housing\n")


class CategoryTotalsTest(unittest.TestCase):
    def test_sums_each_category(self):
        rows = [txn(4, "-7.50", "Coffee Bar"), txn(5, "-2.50", "coffee cart")]

        self.assertEqual(category_totals(rows, RULES), [("food", Decimal("-10.00"))])

    def test_orders_categories_alphabetically(self):
        rows = [txn(4, "-900.00", "Rent"), txn(5, "-7.50", "Coffee Bar")]

        self.assertEqual(
            [name for name, _ in category_totals(rows, RULES)], ["food", "housing"]
        )

    def test_uncategorized_is_last_despite_alphabetical_order(self):
        rows = [txn(4, "2500.00", "ACME Payroll"), txn(5, "-900.00", "Rent")]

        self.assertEqual(
            [name for name, _ in category_totals(rows, RULES)],
            ["housing", UNCATEGORIZED],
        )

    def test_two_rules_for_one_category_produce_one_line(self):
        rules = parse_rules("coffee=food\ncanteen=food\n")
        rows = [txn(4, "-7.50", "Coffee Bar"), txn(5, "-4.00", "Canteen")]

        self.assertEqual(category_totals(rows, rules), [("food", Decimal("-11.50"))])

    def test_a_rule_category_named_uncategorized_merges_and_stays_last(self):
        rules = parse_rules("coffee=uncategorized\nrent=housing\n")
        rows = [
            txn(4, "-7.50", "Coffee Bar"),
            txn(5, "2500.00", "ACME Payroll"),
            txn(6, "-900.00", "Rent"),
        ]

        self.assertEqual(
            category_totals(rows, rules),
            [("housing", Decimal("-900.00")), (UNCATEGORIZED, Decimal("2492.50"))],
        )

    def test_categories_with_no_transactions_are_not_listed(self):
        rows = [txn(4, "-7.50", "Coffee Bar")]

        self.assertEqual([name for name, _ in category_totals(rows, RULES)], ["food"])

    def test_no_transactions_gives_no_categories(self):
        self.assertEqual(category_totals([], RULES), [])


class FormatReportTest(unittest.TestCase):
    def test_matches_the_example_in_the_design(self):
        rows = [
            txn(4, "-7.50", "Coffee Bar"),
            txn(4, "-900.00", "Rent March"),
            txn(5, "2500.00", "ACME Payroll"),
        ]

        report = format_report(rows, RULES, Decimal("100"))

        self.assertEqual(
            report,
            "food: -7.50\n"
            "housing: -900.00\n"
            "uncategorized: 2500.00\n"
            "\n"
            "closing balance: 1692.50\n",
        )

    def test_without_rules_everything_is_uncategorized(self):
        rows = [txn(4, "-7.50", "Coffee Bar")]

        self.assertEqual(
            format_report(rows, [], Decimal("0")),
            "uncategorized: -7.50\n\nclosing balance: -7.50\n",
        )

    def test_no_transactions_prints_only_the_closing_balance(self):
        self.assertEqual(
            format_report([], RULES, Decimal("100")), "closing balance: 100.00\n"
        )

    def test_no_transactions_and_no_opening(self):
        self.assertEqual(
            format_report([], [], Decimal("0")), "closing balance: 0.00\n"
        )
```

- [ ] **Step 7: Run the tests to verify they fail**

Run: `python3 -m unittest test_report -v`
Expected: FAIL — `ImportError: cannot import name 'category_totals'`

- [ ] **Step 8: Implement `category_totals` and `format_report`**

Append to `ledgerlite/report.py`:

```python
def category_totals(
    transactions: list[Transaction], rules: list[tuple[str, str]]
) -> list[tuple[str, Decimal]]:
    """Total each category, alphabetically, with `uncategorized` last.

    Only categories with at least one transaction appear. A rule whose
    category is literally "uncategorized" lands in the same bucket as the
    unmatched transactions.
    """
    totals: dict[str, Decimal] = {}
    for txn in transactions:
        name = categorize(txn.description, rules) or UNCATEGORIZED
        totals[name] = totals.get(name, Decimal("0")) + txn.amount

    ordered = [
        (name, totals[name])
        for name in sorted(name for name in totals if name != UNCATEGORIZED)
    ]
    if UNCATEGORIZED in totals:
        ordered.append((UNCATEGORIZED, totals[UNCATEGORIZED]))
    return ordered


def format_report(
    transactions: list[Transaction],
    rules: list[tuple[str, str]],
    opening: Decimal,
) -> str:
    """Build the whole report, ending in a single newline."""
    ordered = order_by_date(transactions)

    lines = [
        f"{name}: {format_amount(total)}"
        for name, total in category_totals(ordered, rules)
    ]
    if lines:
        # The blank line separates the category block from the closing
        # balance; with no categories there is nothing to separate.
        lines.append("")
    lines.append(f"closing balance: {format_amount(closing_balance(opening, ordered))}")
    return "\n".join(lines) + "\n"
```

- [ ] **Step 9: Run the tests to verify they pass**

Run: `python3 -m unittest test_report -v`
Expected: PASS (16 tests)

- [ ] **Step 10: Commit**

```bash
git add ledgerlite/report.py test_report.py
git commit -m "feat: add per-category totals and report formatting"
```

---

## Task 6: CLI, file reading, and exit codes

**Files:**
- Create: `ledgerlite/cli.py`
- Create: `ledgerlite/__main__.py`
- Test: `test_cli.py`

**Interfaces:**
- Consumes: `parse.parse_transactions`, `parse.parse_amount`, `parse.ParseError` (Task 2), `rules.parse_rules` (Task 3), `report.format_report` (Task 5).
- Produces: `cli.main(argv: list[str] | None = None) -> int` — prints the report to stdout, error messages to stderr, and returns the exit code. It never calls `sys.exit` itself (argparse still may, on a usage error).

- [ ] **Step 1: Write the failing tests**

Create `test_cli.py`:

```python
import codecs
import contextlib
import io
import os
import tempfile
import unittest

from ledgerlite.cli import main

TRANSACTIONS = (
    "date,amount,description\n"
    "2026-03-05,2500.00,ACME Payroll\n"
    "2026-03-04,-7.50,Coffee Bar\n"
    "2026-03-04,-900.00,Rent March\n"
)
RULES = "coffee=food\nrent=housing\n"


class CliTestCase(unittest.TestCase):
    """Runs main() in a temp directory, capturing stdout and stderr."""

    def setUp(self):
        self._dir = tempfile.TemporaryDirectory()
        self.addCleanup(self._dir.cleanup)

    def write(self, name, content, encoding="utf-8"):
        path = os.path.join(self._dir.name, name)
        with open(path, "w", encoding=encoding, newline="") as handle:
            handle.write(content)
        return path

    def write_bytes(self, name, data):
        path = os.path.join(self._dir.name, name)
        with open(path, "wb") as handle:
            handle.write(data)
        return path

    def run_main(self, argv):
        out, err = io.StringIO(), io.StringIO()
        with contextlib.redirect_stdout(out), contextlib.redirect_stderr(err):
            code = main(argv)
        return code, out.getvalue(), err.getvalue()


class ReportCommandTest(CliTestCase):
    def test_prints_the_report_and_returns_zero(self):
        txns = self.write("txns.csv", TRANSACTIONS)
        rules = self.write("rules.txt", RULES)

        code, out, err = self.run_main(
            ["report", txns, "--rules", rules, "--opening", "100"]
        )

        self.assertEqual(code, 0)
        self.assertEqual(err, "")
        self.assertEqual(
            out,
            "food: -7.50\n"
            "housing: -900.00\n"
            "uncategorized: 2500.00\n"
            "\n"
            "closing balance: 1692.50\n",
        )

    def test_opening_defaults_to_zero_and_rules_are_optional(self):
        txns = self.write("txns.csv", "date,amount,description\n2026-03-04,-7.50,Coffee Bar\n")

        code, out, _ = self.run_main(["report", txns])

        self.assertEqual(code, 0)
        self.assertEqual(out, "uncategorized: -7.50\n\nclosing balance: -7.50\n")

    def test_header_only_file_reports_the_opening_balance(self):
        txns = self.write("txns.csv", "date,amount,description\n")

        code, out, _ = self.run_main(["report", txns, "--opening", "12.34"])

        self.assertEqual(code, 0)
        self.assertEqual(out, "closing balance: 12.34\n")

    def test_tolerates_a_utf8_bom_and_crlf_endings(self):
        # What a spreadsheet export looks like: a BOM, then CRLF endings.
        txns = self.write_bytes(
            "txns.csv",
            codecs.BOM_UTF8
            + b"date,amount,description\r\n2026-03-04,-7.50,Coffee Bar\r\n",
        )

        code, out, err = self.run_main(["report", txns])

        self.assertEqual((code, err), (0, ""))
        self.assertEqual(out, "uncategorized: -7.50\n\nclosing balance: -7.50\n")


class UnreadableInputTest(CliTestCase):
    def test_missing_transactions_file(self):
        missing = os.path.join(self._dir.name, "nope.csv")

        code, out, err = self.run_main(["report", missing])

        self.assertEqual(code, 1)
        self.assertEqual(out, "")
        self.assertEqual(
            err, f"ledgerlite: cannot read {missing}: No such file or directory\n"
        )

    def test_transactions_path_is_a_directory(self):
        code, out, err = self.run_main(["report", self._dir.name])

        self.assertEqual(code, 1)
        self.assertEqual(out, "")
        self.assertTrue(err.startswith(f"ledgerlite: cannot read {self._dir.name}: "))

    def test_non_utf8_transactions_file(self):
        txns = self.write_bytes("txns.csv", b"date,amount,description\n2026-03-04,-7.50,Caf\xe9\n")

        code, out, err = self.run_main(["report", txns])

        self.assertEqual(code, 1)
        self.assertEqual(out, "")
        self.assertTrue(err.startswith(f"ledgerlite: cannot read {txns}: invalid utf-8"))

    def test_missing_rules_file(self):
        txns = self.write("txns.csv", TRANSACTIONS)
        missing = os.path.join(self._dir.name, "nope.txt")

        code, out, err = self.run_main(["report", txns, "--rules", missing])

        self.assertEqual(code, 1)
        self.assertEqual(out, "")
        self.assertEqual(
            err, f"ledgerlite: cannot read {missing}: No such file or directory\n"
        )


class MalformedInputTest(CliTestCase):
    def test_malformed_row_reports_path_line_and_reason(self):
        txns = self.write(
            "txns.csv",
            "date,amount,description\n2026-03-04,-7.50,Coffee Bar\n2026-03-05,1.005,Rent\n",
        )

        code, out, err = self.run_main(["report", txns])

        self.assertEqual(code, 2)
        self.assertEqual(out, "")
        self.assertEqual(err, f"ledgerlite: {txns}:3: invalid amount: '1.005'\n")

    def test_wrong_column_count(self):
        txns = self.write("txns.csv", "date,amount,description\n2026-03-04,-7.50\n")

        code, out, err = self.run_main(["report", txns])

        self.assertEqual((code, out), (2, ""))
        self.assertEqual(err, f"ledgerlite: {txns}:2: expected 3 columns, got 2\n")

    def test_missing_header(self):
        txns = self.write("txns.csv", "2026-03-04,-7.50,Coffee Bar\n")

        code, out, err = self.run_main(["report", txns])

        self.assertEqual((code, out), (2, ""))
        self.assertEqual(
            err,
            f"ledgerlite: {txns}:1: expected header 'date,amount,description'\n",
        )

    def test_nothing_is_printed_to_stdout_when_a_later_row_is_bad(self):
        txns = self.write(
            "txns.csv",
            "date,amount,description\n2026-03-04,-7.50,Coffee Bar\n2026-03-05,oops,Rent\n",
        )

        code, out, _ = self.run_main(["report", txns])

        self.assertEqual((code, out), (2, ""))

    def test_invalid_opening_is_a_usage_error(self):
        txns = self.write("txns.csv", TRANSACTIONS)

        with contextlib.redirect_stderr(io.StringIO()):
            with self.assertRaises(SystemExit) as caught:
                main(["report", txns, "--opening", "1.005"])

        self.assertEqual(caught.exception.code, 2)


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `python3 -m unittest test_cli -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'ledgerlite.cli'`

- [ ] **Step 3: Write the implementation**

Create `ledgerlite/cli.py`:

```python
"""Command-line entry point: argument parsing, file I/O, exit codes."""

from __future__ import annotations

import argparse
import sys
from decimal import Decimal

from .parse import ParseError, parse_amount, parse_transactions
from .report import format_report
from .rules import parse_rules


class _CannotRead(Exception):
    """A file we were asked to read is not readable."""

    def __init__(self, path: str, reason: str) -> None:
        super().__init__(f"cannot read {path}: {reason}")
        self.path = path
        self.reason = reason


def _read_text(path: str) -> str:
    """Read a file as UTF-8 text, raising _CannotRead with a human reason.

    utf-8-sig drops a spreadsheet-exported BOM; newline="" leaves line
    endings for the csv module to sort out.
    """
    try:
        with open(path, encoding="utf-8-sig", newline="") as handle:
            return handle.read()
    except OSError as exc:
        raise _CannotRead(path, exc.strerror or type(exc).__name__) from None
    except UnicodeDecodeError as exc:
        # Not an OSError; without this it would be an uncaught traceback.
        raise _CannotRead(path, f"invalid utf-8: {exc.reason}") from None


def _opening_amount(text: str) -> Decimal:
    try:
        return parse_amount(text)
    except ValueError as exc:
        raise argparse.ArgumentTypeError(str(exc)) from None


def _build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="ledgerlite", description="Summarize bank transactions by category."
    )
    subparsers = parser.add_subparsers(dest="command", required=True)

    report = subparsers.add_parser("report", help="print a per-category summary")
    report.add_argument("transactions", help="path to the transactions CSV")
    report.add_argument("--rules", help="path to a <substring>=<category> rules file")
    report.add_argument(
        "--opening",
        type=_opening_amount,
        default=Decimal("0"),
        help="opening balance (default: 0)",
    )
    return parser


def main(argv: list[str] | None = None) -> int:
    """Run the CLI and return the process exit code."""
    args = _build_parser().parse_args(sys.argv[1:] if argv is None else argv)

    try:
        transactions_text = _read_text(args.transactions)
        rules_text = _read_text(args.rules) if args.rules else ""
    except _CannotRead as exc:
        print(f"ledgerlite: cannot read {exc.path}: {exc.reason}", file=sys.stderr)
        return 1

    try:
        transactions = parse_transactions(transactions_text)
    except ParseError as exc:
        print(
            f"ledgerlite: {args.transactions}:{exc.line}: {exc.message}",
            file=sys.stderr,
        )
        return 2

    print(
        format_report(transactions, parse_rules(rules_text), args.opening),
        end="",
    )
    return 0
```

Create `ledgerlite/__main__.py`:

```python
"""Allow `python3 -m ledgerlite ...`."""

import sys

from .cli import main

if __name__ == "__main__":
    sys.exit(main())
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `python3 -m unittest test_cli -v`
Expected: PASS (13 tests)

- [ ] **Step 5: Run the whole suite**

Run: `python3 -m unittest -v`
Expected: PASS — all 70 tests across `test_model`, `test_parse`, `test_rules`, `test_balance`, `test_report`, `test_cli`

- [ ] **Step 6: Check the real CLI end to end**

```bash
printf 'date,amount,description\n2026-03-05,2500.00,ACME Payroll\n2026-03-04,-7.50,Coffee Bar\n2026-03-04,-900.00,Rent March\n' > /tmp/txns.csv
printf 'coffee=food\nrent=housing\n' > /tmp/rules.txt
python3 -m ledgerlite report /tmp/txns.csv --rules /tmp/rules.txt --opening 100
echo "exit=$?"
python3 -m ledgerlite report /tmp/missing.csv; echo "exit=$?"
```

Expected: the design's example report and `exit=0`, then
`ledgerlite: cannot read /tmp/missing.csv: No such file or directory` and `exit=1`.

- [ ] **Step 7: Confirm no float touched the money path**

Run: `grep -rn "float" ledgerlite/`
Expected: no output.

- [ ] **Step 8: Commit**

```bash
git add ledgerlite/cli.py ledgerlite/__main__.py test_cli.py
git commit -m "feat: add ledgerlite report CLI with exit codes and error messages"
```
