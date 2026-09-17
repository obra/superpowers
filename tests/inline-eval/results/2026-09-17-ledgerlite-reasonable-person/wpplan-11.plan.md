# ledgerlite Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `ledgerlite`, a stdlib-only Python command-line tool that reads a transactions CSV, categorizes each row from a rules file, and prints per-category totals plus the closing balance.

**Architecture:** Six small modules with one responsibility each, wired together only at the CLI layer: `model` holds the `Transaction` value type, `parse` turns CSV text into transactions (raising `ParseError` for bad rows), `rules` turns rules text into `(substring, category)` pairs and matches descriptions, `balance` orders transactions by date and folds the closing balance, `report` builds per-category totals and formats the output text, and `cli` does argument parsing, error messages, and exit codes. Every module below `cli` is pure — it takes values and returns values, never touches `sys.exit`, `stdout`, or `stderr` — so each is testable in isolation and the CLI tests only need to cover wiring, exit codes, and message text.

**Tech Stack:** Python 3.11+, standard library only (`argparse`, `csv`, `dataclasses`, `datetime`, `decimal`, `unittest`, `tempfile`). No third-party packages, no build tooling.

**Spec:** `design.md` (in this directory — read it before starting)

## Global Constraints

- Python 3.11+ only. Standard library only — no third-party dependencies, no `pip install`, no `requirements.txt`, no packaging files.
- Money is `decimal.Decimal` everywhere. Never `float`. No `float()` call, no float literal, and no arithmetic mixing `Decimal` with `float` anywhere in `ledgerlite/`.
- Package layout is exactly the one in the spec: `ledgerlite/{__init__,model,parse,rules,balance,report,cli}.py`. One addition beyond the spec's list: `ledgerlite/__main__.py`, a three-line shim so the tool is runnable as `python3 -m ledgerlite` (the spec describes a command-line tool but lists no entry point file). Nothing else gets added.
- Tests live at the repo root as `test_<module>.py`, one per module, using `unittest`. The whole suite runs with `python3 -m unittest` from the repo root.
- Exit codes are exactly: `0` success, `1` a file could not be read, `2` the transactions file had a malformed row.
- Error messages go to stderr with these exact shapes: `ledgerlite: cannot read <path>: <reason>` and `ledgerlite: <path>:<line>: <what is wrong>`.
- Amounts print with exactly two fractional digits, a leading `-` only for negatives, no thousands separators: `-12.50`, `0.00`, `1200.00`.
- Work directly on `main` in this repo. Commit after every task (each task's last step is the commit).

## Assumptions

The spec is silent on these; the plan resolves them this way, and the tests below pin the resolutions:

1. **First CSV line is always the header** and is skipped without being validated. An empty file therefore yields zero transactions, and a header-only file yields zero transactions.
2. **Zero transactions** produce a report with no category lines at all — just the blank line and `closing balance: <opening>`. `uncategorized` appears only when at least one transaction is uncategorized.
3. **Rules file lines** that are blank, whitespace-only, or contain no `=` are ignored. The split is on the *first* `=`, so a category may contain `=` but a substring may not. Substring and category are stripped of surrounding whitespace; a rule with an empty substring or empty category is ignored.
4. **An unreadable `--rules` file** is reported with the same `cannot read` message and exit code `1` as an unreadable transactions file.
5. **A malformed `--opening` value** (not a decimal number, or more than two fractional digits) is an argparse error: usage to stderr, exit code `2`.
6. **A transactions or rules file that is not valid UTF-8** is a read failure: `ledgerlite: cannot read <path>: not valid UTF-8 text`, exit code `1`.

## Review Focus

Input classes and failure modes the spec implies. Each line names where its test lives; a line with no test is one the final reviewer checks deliberately.

- `Decimal("NaN")` and `Decimal("Infinity")` parse successfully from an amount column — they must be rejected as malformed, not silently summed into a NaN total. *Test: Task 3.*
- Negative zero: `format(Decimal("-0.00"), "f")` is `"-0.00"`, but the spec says zero prints `0.00`. Reachable via `--opening -0.00` with no transactions. *Test: Task 5 (`format_amount`) and Task 6 (CLI).*
- Empty CSV and header-only CSV: zero transactions, closing balance equals opening, no category lines. *Test: Task 3 (parse) and Task 6 (CLI end-to-end).*
- A malformed row must leave stdout completely empty — no partial report before the error. *Test: Task 6.*
- Wrong column count in both directions: two columns and four columns, including the four-column case caused by a trailing comma. *Test: Task 3.*
- A description containing a comma or a double quote must survive the CSV reader intact and still match rules. *Test: Task 3 (parse) and Task 5 (report).*
- Rules matching is case-insensitive in both directions: an uppercase rule substring against a lowercase description, and vice versa. *Test: Task 2.*
- First matching rule wins even when a later rule also matches, and the winner is decided by file order, not by which substring is longer. *Test: Task 2.*
- Ties on date keep input order. Because addition is commutative this cannot be detected from the closing balance, so it is tested on the ordering function directly. *Test: Task 4.*
- A category in the rules file literally named `uncategorized` merges with the no-rule-matched bucket and is still printed last. *Test: Task 5.*
- Unreadable inputs beyond "missing file": a path that is a directory, and a path with no read permission. Both are `OSError`, both must produce `cannot read` and exit `1`. *Test: Task 6 covers missing file and directory; permissions are not tested (they behave differently under root) — reviewer confirms the `except OSError` is broad enough.*
- The default `decimal` context has 28 significant digits, so a total wider than that would round. Ordinary bank amounts are far below this and the code never sets a context or precision. *No test; reviewer confirms no `float` and no context manipulation anywhere in `ledgerlite/`.*

---

### Task 1: Package skeleton and the `Transaction` model

**Files:**
- Create: `ledgerlite/__init__.py`
- Create: `ledgerlite/model.py`
- Create: `.gitignore`
- Test: `test_model.py`

**Interfaces:**
- Consumes: nothing.
- Produces: `ledgerlite.model.Transaction`, a frozen dataclass with fields `date: datetime.date`, `amount: decimal.Decimal`, `description: str`, constructed by keyword in every later task: `Transaction(date=date(2026, 3, 4), amount=Decimal("-7.50"), description="Coffee")`.

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
        txn = Transaction(
            date=date(2026, 3, 4), amount=Decimal("-7.50"), description="Coffee"
        )
        self.assertEqual(txn.date, date(2026, 3, 4))
        self.assertEqual(txn.amount, Decimal("-7.50"))
        self.assertEqual(txn.description, "Coffee")

    def test_equal_when_all_fields_equal(self):
        first = Transaction(
            date=date(2026, 3, 4), amount=Decimal("-7.50"), description="Coffee"
        )
        second = Transaction(
            date=date(2026, 3, 4), amount=Decimal("-7.50"), description="Coffee"
        )
        self.assertEqual(first, second)

    def test_is_immutable(self):
        txn = Transaction(
            date=date(2026, 3, 4), amount=Decimal("-7.50"), description="Coffee"
        )
        with self.assertRaises(FrozenInstanceError):
            txn.amount = Decimal("0.00")


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `python3 -m unittest test_model -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'ledgerlite'`

- [ ] **Step 3: Write the minimal implementation**

Create `ledgerlite/__init__.py`:

```python
"""ledgerlite — categorize bank transactions and summarize them."""
```

Create `ledgerlite/model.py`:

```python
"""The transaction value type."""

from dataclasses import dataclass
from datetime import date
from decimal import Decimal


@dataclass(frozen=True)
class Transaction:
    """One row of the transactions CSV, already parsed and validated."""

    date: date
    amount: Decimal
    description: str
```

Create `.gitignore`:

```
__pycache__/
*.pyc
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `python3 -m unittest test_model -v`
Expected: PASS — 3 tests OK

- [ ] **Step 5: Commit**

```bash
git add .gitignore ledgerlite/__init__.py ledgerlite/model.py test_model.py
git commit -m "feat: add ledgerlite package and Transaction model"
```

---

### Task 2: Rules parsing and categorization

**Files:**
- Create: `ledgerlite/rules.py`
- Test: `test_rules.py`

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces:
  - `ledgerlite.rules.Rule` — type alias for `tuple[str, str]`, i.e. `(substring, category)`.
  - `parse_rules(text: str) -> list[Rule]` — takes the whole rules file as one string, returns rules in file order.
  - `categorize(description: str, rules: list[Rule]) -> str | None` — returns the category of the first rule whose substring appears case-insensitively in `description`, or `None`.

- [ ] **Step 1: Write the failing test**

Create `test_rules.py`:

```python
import unittest

from ledgerlite.rules import categorize, parse_rules


class ParseRulesTest(unittest.TestCase):
    def test_parses_one_rule_per_line_in_order(self):
        rules = parse_rules("coffee=food\nrent=housing\n")
        self.assertEqual(rules, [("coffee", "food"), ("rent", "housing")])

    def test_ignores_blank_and_whitespace_only_lines(self):
        rules = parse_rules("coffee=food\n\n   \nrent=housing\n")
        self.assertEqual(rules, [("coffee", "food"), ("rent", "housing")])

    def test_ignores_lines_without_an_equals_sign(self):
        self.assertEqual(parse_rules("coffee\ncoffee=food\n"), [("coffee", "food")])

    def test_strips_surrounding_whitespace(self):
        self.assertEqual(parse_rules("  coffee = food  \n"), [("coffee", "food")])

    def test_ignores_rules_with_an_empty_side(self):
        self.assertEqual(parse_rules("=food\ncoffee=\n"), [])

    def test_splits_on_the_first_equals_so_category_may_contain_one(self):
        self.assertEqual(parse_rules("coffee=food=drink\n"), [("coffee", "food=drink")])

    def test_no_rules_for_empty_text(self):
        self.assertEqual(parse_rules(""), [])


class CategorizeTest(unittest.TestCase):
    def test_matches_substring_anywhere_in_description(self):
        self.assertEqual(
            categorize("BLUE BOTTLE COFFEE #12", [("coffee", "food")]), "food"
        )

    def test_matching_is_case_insensitive_in_both_directions(self):
        self.assertEqual(categorize("blue bottle coffee", [("COFFEE", "food")]), "food")
        self.assertEqual(categorize("BLUE BOTTLE COFFEE", [("coffee", "food")]), "food")

    def test_first_matching_rule_wins_even_if_a_later_one_also_matches(self):
        rules = [("coffee", "food"), ("blue bottle coffee", "treats")]
        self.assertEqual(categorize("Blue Bottle Coffee", rules), "food")

    def test_returns_none_when_nothing_matches(self):
        self.assertIsNone(categorize("ACME PAYROLL", [("coffee", "food")]))

    def test_returns_none_when_there_are_no_rules(self):
        self.assertIsNone(categorize("Blue Bottle Coffee", []))


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `python3 -m unittest test_rules -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'ledgerlite.rules'`

- [ ] **Step 3: Write the minimal implementation**

Create `ledgerlite/rules.py`:

```python
"""Rules file parsing and description matching."""

Rule = tuple[str, str]


def parse_rules(text: str) -> list[Rule]:
    """Parse `<substring>=<category>` lines, keeping file order.

    Blank lines and lines with no `=` are ignored, as are rules with an
    empty substring or an empty category.
    """
    rules: list[Rule] = []
    for line in text.splitlines():
        if "=" not in line:
            continue
        substring, category = line.split("=", 1)
        substring = substring.strip()
        category = category.strip()
        if not substring or not category:
            continue
        rules.append((substring, category))
    return rules


def categorize(description: str, rules: list[Rule]) -> str | None:
    """Return the category of the first rule matching `description`, or None."""
    haystack = description.lower()
    for substring, category in rules:
        if substring.lower() in haystack:
            return category
    return None
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `python3 -m unittest test_rules -v`
Expected: PASS — 12 tests OK

- [ ] **Step 5: Commit**

```bash
git add ledgerlite/rules.py test_rules.py
git commit -m "feat: parse rules files and categorize descriptions"
```

---

### Task 3: CSV parsing with `ParseError`

**Files:**
- Create: `ledgerlite/parse.py`
- Test: `test_parse.py`

**Interfaces:**
- Consumes: `ledgerlite.model.Transaction(date=..., amount=..., description=...)` from Task 1.
- Produces:
  - `ledgerlite.parse.ParseError(Exception)` with attributes `path: str`, `line: int`, `problem: str`, and `str(err) == f"{path}:{line}: {problem}"` (no `ledgerlite: ` prefix — the CLI adds that).
  - `parse_amount(text: str) -> Decimal` — raises `ValueError` with a human-readable message for a non-decimal, non-finite, or more-than-two-fractional-digit amount. Task 6 reuses this for `--opening`.
  - `parse_transactions(path: str) -> list[Transaction]` — in file order; propagates `OSError` and `UnicodeDecodeError` to the caller, raises `ParseError` on the first malformed row.

- [ ] **Step 1: Write the failing test**

Create `test_parse.py`:

```python
import tempfile
import unittest
from datetime import date
from decimal import Decimal
from pathlib import Path

from ledgerlite.model import Transaction
from ledgerlite.parse import ParseError, parse_amount, parse_transactions

HEADER = "date,amount,description\n"


class AmountTest(unittest.TestCase):
    def test_accepts_zero_one_and_two_fractional_digits(self):
        self.assertEqual(parse_amount("1"), Decimal("1"))
        self.assertEqual(parse_amount("1.5"), Decimal("1.5"))
        self.assertEqual(parse_amount("1.50"), Decimal("1.50"))
        self.assertEqual(parse_amount("-12.50"), Decimal("-12.50"))

    def test_rejects_three_fractional_digits(self):
        with self.assertRaisesRegex(ValueError, "two fractional digits"):
            parse_amount("1.005")

    def test_rejects_text(self):
        with self.assertRaisesRegex(ValueError, "not a decimal number"):
            parse_amount("twelve")

    def test_rejects_empty_string(self):
        with self.assertRaisesRegex(ValueError, "not a decimal number"):
            parse_amount("")

    def test_rejects_nan_and_infinity(self):
        for text in ("NaN", "nan", "Infinity", "-Infinity"):
            with self.subTest(text=text):
                with self.assertRaisesRegex(ValueError, "not a decimal number"):
                    parse_amount(text)


class ParseTransactionsTest(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)

    def write(self, text, name="txns.csv"):
        path = Path(self.tmp.name) / name
        path.write_text(text, encoding="utf-8")
        return str(path)

    def test_parses_rows_in_file_order(self):
        path = self.write(
            HEADER + "2026-03-05,2500.00,ACME PAYROLL\n2026-03-04,-7.50,Coffee\n"
        )
        self.assertEqual(
            parse_transactions(path),
            [
                Transaction(
                    date=date(2026, 3, 5),
                    amount=Decimal("2500.00"),
                    description="ACME PAYROLL",
                ),
                Transaction(
                    date=date(2026, 3, 4),
                    amount=Decimal("-7.50"),
                    description="Coffee",
                ),
            ],
        )

    def test_header_only_file_has_no_transactions(self):
        self.assertEqual(parse_transactions(self.write(HEADER)), [])

    def test_empty_file_has_no_transactions(self):
        self.assertEqual(parse_transactions(self.write("")), [])

    def test_skips_blank_lines_between_rows(self):
        path = self.write(HEADER + "2026-03-04,-7.50,Coffee\n\n")
        self.assertEqual(len(parse_transactions(path)), 1)

    def test_keeps_quoted_commas_and_quotes_in_description(self):
        path = self.write(
            HEADER + '2026-03-04,-7.50,"Blue Bottle, 3"" cup"\n'
        )
        self.assertEqual(
            parse_transactions(path)[0].description, 'Blue Bottle, 3" cup'
        )

    def test_too_few_columns_is_a_parse_error_on_its_line(self):
        path = self.write(HEADER + "2026-03-04,-7.50\n")
        with self.assertRaises(ParseError) as caught:
            parse_transactions(path)
        self.assertEqual(caught.exception.line, 2)
        self.assertEqual(caught.exception.path, path)
        self.assertIn("expected 3 columns, got 2", caught.exception.problem)
        self.assertEqual(str(caught.exception), f"{path}:2: expected 3 columns, got 2")

    def test_trailing_comma_makes_four_columns(self):
        path = self.write(HEADER + "2026-03-04,-7.50,Coffee,\n")
        with self.assertRaisesRegex(ParseError, "expected 3 columns, got 4"):
            parse_transactions(path)

    def test_unparseable_date_is_a_parse_error(self):
        path = self.write(HEADER + "2026-13-40,-7.50,Coffee\n")
        with self.assertRaises(ParseError) as caught:
            parse_transactions(path)
        self.assertEqual(caught.exception.line, 2)
        self.assertIn("date", caught.exception.problem)

    def test_unparseable_amount_is_a_parse_error(self):
        path = self.write(HEADER + "2026-03-04,seven fifty,Coffee\n")
        with self.assertRaises(ParseError) as caught:
            parse_transactions(path)
        self.assertIn("not a decimal number", caught.exception.problem)

    def test_three_fractional_digits_is_a_parse_error(self):
        path = self.write(HEADER + "2026-03-04,-1.005,Coffee\n")
        with self.assertRaises(ParseError) as caught:
            parse_transactions(path)
        self.assertIn("two fractional digits", caught.exception.problem)

    def test_reports_the_line_of_the_first_bad_row(self):
        path = self.write(
            HEADER
            + "2026-03-04,-7.50,Coffee\n"
            + "2026-03-05,nope,Rent\n"
            + "2026-03-06,oops,Gas\n"
        )
        with self.assertRaises(ParseError) as caught:
            parse_transactions(path)
        self.assertEqual(caught.exception.line, 3)

    def test_missing_file_raises_oserror(self):
        with self.assertRaises(OSError):
            parse_transactions(str(Path(self.tmp.name) / "nope.csv"))

    def test_non_utf8_file_raises_unicodedecodeerror(self):
        path = Path(self.tmp.name) / "latin.csv"
        path.write_bytes(HEADER.encode("utf-8") + b"2026-03-04,-7.50,Caf\xe9\n")
        with self.assertRaises(UnicodeDecodeError):
            parse_transactions(str(path))


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `python3 -m unittest test_parse -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'ledgerlite.parse'`

- [ ] **Step 3: Write the minimal implementation**

Create `ledgerlite/parse.py`:

```python
"""Read a transactions CSV into Transaction objects."""

import csv
from datetime import date
from decimal import Decimal, InvalidOperation
from typing import Iterator, TextIO

from .model import Transaction

COLUMN_COUNT = 3


class ParseError(Exception):
    """A row of the transactions file could not be parsed."""

    def __init__(self, path: str, line: int, problem: str) -> None:
        super().__init__(f"{path}:{line}: {problem}")
        self.path = path
        self.line = line
        self.problem = problem


def parse_amount(text: str) -> Decimal:
    """Parse a money amount with at most two fractional digits.

    Raises ValueError with a human-readable message if `text` is not a
    finite decimal number or has more than two fractional digits.
    """
    try:
        amount = Decimal(text)
    except InvalidOperation:
        raise ValueError(f"amount is not a decimal number: {text!r}") from None
    if not amount.is_finite():
        raise ValueError(f"amount is not a decimal number: {text!r}")
    if amount.as_tuple().exponent < -2:
        raise ValueError(f"amount has more than two fractional digits: {text!r}")
    return amount


def parse_date(text: str) -> date:
    """Parse an ISO 8601 date, raising ValueError with a readable message."""
    try:
        return date.fromisoformat(text)
    except ValueError:
        raise ValueError(f"date is not ISO 8601: {text!r}") from None


def parse_transactions(path: str) -> list[Transaction]:
    """Parse the whole transactions file, or raise ParseError on a bad row.

    The first line is treated as the header and skipped. OSError and
    UnicodeDecodeError propagate to the caller.
    """
    with open(path, newline="", encoding="utf-8") as handle:
        return list(_rows(path, handle))


def _rows(path: str, handle: TextIO) -> Iterator[Transaction]:
    reader = csv.reader(handle)
    for row in reader:
        if reader.line_num == 1 or not row:
            continue
        if len(row) != COLUMN_COUNT:
            raise ParseError(
                path, reader.line_num, f"expected 3 columns, got {len(row)}"
            )
        try:
            when = parse_date(row[0])
            amount = parse_amount(row[1])
        except ValueError as exc:
            raise ParseError(path, reader.line_num, str(exc)) from None
        yield Transaction(date=when, amount=amount, description=row[2])
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `python3 -m unittest test_parse -v`
Expected: PASS — 18 tests OK

- [ ] **Step 5: Run the whole suite**

Run: `python3 -m unittest`
Expected: PASS — everything from Tasks 1–3 OK

- [ ] **Step 6: Commit**

```bash
git add ledgerlite/parse.py test_parse.py
git commit -m "feat: parse transactions CSV with per-row error reporting"
```

---

### Task 4: Date ordering and closing balance

**Files:**
- Create: `ledgerlite/balance.py`
- Test: `test_balance.py`

**Interfaces:**
- Consumes: `ledgerlite.model.Transaction` from Task 1.
- Produces:
  - `order_by_date(transactions: list[Transaction]) -> list[Transaction]` — a new list sorted by `date`, ties keeping input order. Does not mutate its argument.
  - `closing_balance(opening: Decimal, transactions: list[Transaction]) -> Decimal` — `opening` plus every amount, added in date order; returns `opening` for an empty list.

- [ ] **Step 1: Write the failing test**

Create `test_balance.py`:

```python
import unittest
from datetime import date
from decimal import Decimal

from ledgerlite.balance import closing_balance, order_by_date
from ledgerlite.model import Transaction


def txn(day, amount, description):
    return Transaction(
        date=date(2026, 3, day), amount=Decimal(amount), description=description
    )


class OrderByDateTest(unittest.TestCase):
    def test_sorts_by_date(self):
        rows = [txn(6, "1.00", "c"), txn(4, "1.00", "a"), txn(5, "1.00", "b")]
        self.assertEqual(
            [t.description for t in order_by_date(rows)], ["a", "b", "c"]
        )

    def test_ties_keep_input_order(self):
        rows = [
            txn(4, "1.00", "first"),
            txn(4, "2.00", "second"),
            txn(4, "3.00", "third"),
        ]
        self.assertEqual(
            [t.description for t in order_by_date(rows)],
            ["first", "second", "third"],
        )

    def test_does_not_mutate_the_input(self):
        rows = [txn(6, "1.00", "c"), txn(4, "1.00", "a")]
        order_by_date(rows)
        self.assertEqual([t.description for t in rows], ["c", "a"])

    def test_empty_list(self):
        self.assertEqual(order_by_date([]), [])


class ClosingBalanceTest(unittest.TestCase):
    def test_adds_every_amount_to_the_opening(self):
        rows = [
            txn(4, "-7.50", "Coffee"),
            txn(5, "-900.00", "Rent"),
            txn(6, "2500.00", "Payroll"),
        ]
        self.assertEqual(
            closing_balance(Decimal("100"), rows), Decimal("1692.50")
        )

    def test_is_the_opening_when_there_are_no_transactions(self):
        self.assertEqual(closing_balance(Decimal("100"), []), Decimal("100"))

    def test_zero_opening(self):
        self.assertEqual(
            closing_balance(Decimal("0"), [txn(4, "-7.50", "Coffee")]),
            Decimal("-7.50"),
        )

    def test_result_is_exact_not_floating_point(self):
        rows = [txn(4, "0.10", "a")] * 3
        self.assertEqual(closing_balance(Decimal("0"), rows), Decimal("0.30"))


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `python3 -m unittest test_balance -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'ledgerlite.balance'`

- [ ] **Step 3: Write the minimal implementation**

Create `ledgerlite/balance.py`:

```python
"""Date ordering and the running balance."""

from decimal import Decimal

from .model import Transaction


def order_by_date(transactions: list[Transaction]) -> list[Transaction]:
    """Return the transactions sorted by date, ties keeping input order."""
    return sorted(transactions, key=lambda txn: txn.date)


def closing_balance(opening: Decimal, transactions: list[Transaction]) -> Decimal:
    """Return the balance after adding every amount in date order."""
    balance = opening
    for txn in order_by_date(transactions):
        balance += txn.amount
    return balance
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `python3 -m unittest test_balance -v`
Expected: PASS — 8 tests OK

- [ ] **Step 5: Commit**

```bash
git add ledgerlite/balance.py test_balance.py
git commit -m "feat: order transactions by date and compute closing balance"
```

---

### Task 5: Category totals and report formatting

**Files:**
- Create: `ledgerlite/report.py`
- Test: `test_report.py`

**Interfaces:**
- Consumes: `Transaction` (Task 1), `categorize(description, rules)` and `Rule` (Task 2).
- Produces:
  - `UNCATEGORIZED = "uncategorized"`.
  - `format_amount(amount: Decimal) -> str` — exactly two fractional digits, `-` only for negatives, negative zero printed as `0.00`.
  - `category_totals(transactions: list[Transaction], rules: list[Rule]) -> list[tuple[str, Decimal]]` — named categories alphabetically, then `uncategorized` last if present.
  - `format_report(transactions: list[Transaction], rules: list[Rule], closing: Decimal) -> str` — the full report text, ending in a single trailing newline.

- [ ] **Step 1: Write the failing test**

Create `test_report.py`:

```python
import unittest
from datetime import date
from decimal import Decimal

from ledgerlite.model import Transaction
from ledgerlite.report import category_totals, format_amount, format_report

RULES = [("coffee", "food"), ("rent", "housing")]


def txn(day, amount, description):
    return Transaction(
        date=date(2026, 3, day), amount=Decimal(amount), description=description
    )


class FormatAmountTest(unittest.TestCase):
    def test_two_fractional_digits(self):
        self.assertEqual(format_amount(Decimal("1200")), "1200.00")
        self.assertEqual(format_amount(Decimal("1200.5")), "1200.50")
        self.assertEqual(format_amount(Decimal("1200.00")), "1200.00")

    def test_leading_minus_for_negatives(self):
        self.assertEqual(format_amount(Decimal("-12.5")), "-12.50")

    def test_zero(self):
        self.assertEqual(format_amount(Decimal("0")), "0.00")

    def test_negative_zero_prints_without_a_sign(self):
        self.assertEqual(format_amount(Decimal("-0.00")), "0.00")

    def test_no_thousands_separators(self):
        self.assertEqual(format_amount(Decimal("1234567.89")), "1234567.89")


class CategoryTotalsTest(unittest.TestCase):
    def test_sums_each_category(self):
        rows = [
            txn(4, "-7.50", "Blue Bottle Coffee"),
            txn(5, "-2.50", "COFFEE CART"),
            txn(6, "-900.00", "March Rent"),
        ]
        self.assertEqual(
            category_totals(rows, RULES),
            [("food", Decimal("-10.00")), ("housing", Decimal("-900.00"))],
        )

    def test_categories_are_alphabetical(self):
        rules = [("z", "zebra"), ("a", "apple"), ("m", "mango")]
        rows = [txn(4, "1.00", "z"), txn(4, "1.00", "a"), txn(4, "1.00", "m")]
        self.assertEqual(
            [name for name, _ in category_totals(rows, rules)],
            ["apple", "mango", "zebra"],
        )

    def test_unmatched_transactions_go_to_uncategorized_last(self):
        rows = [
            txn(4, "2500.00", "ACME PAYROLL"),
            txn(5, "-900.00", "March Rent"),
        ]
        self.assertEqual(
            category_totals(rows, RULES),
            [("housing", Decimal("-900.00")), ("uncategorized", Decimal("2500.00"))],
        )

    def test_uncategorized_is_last_even_when_alphabetically_early(self):
        rows = [txn(4, "1.00", "unknown"), txn(5, "-900.00", "March Rent")]
        rules = [("rent", "zzz")]
        self.assertEqual(
            [name for name, _ in category_totals(rows, rules)],
            ["zzz", "uncategorized"],
        )

    def test_a_rule_category_named_uncategorized_merges_and_stays_last(self):
        rows = [txn(4, "-7.50", "Coffee"), txn(5, "1.00", "Mystery")]
        rules = [("coffee", "uncategorized")]
        self.assertEqual(
            category_totals(rows, rules),
            [("uncategorized", Decimal("-6.50"))],
        )

    def test_no_rules_means_everything_is_uncategorized(self):
        rows = [txn(4, "-7.50", "Coffee")]
        self.assertEqual(
            category_totals(rows, []), [("uncategorized", Decimal("-7.50"))]
        )

    def test_no_transactions_means_no_categories(self):
        self.assertEqual(category_totals([], RULES), [])

    def test_matches_descriptions_containing_commas_and_quotes(self):
        rows = [txn(4, "-7.50", 'Blue Bottle, 3" COFFEE cup')]
        self.assertEqual(
            category_totals(rows, RULES), [("food", Decimal("-7.50"))]
        )


class FormatReportTest(unittest.TestCase):
    def test_matches_the_design_example(self):
        rows = [
            txn(4, "-7.50", "Blue Bottle Coffee"),
            txn(5, "-900.00", "March Rent"),
            txn(6, "2500.00", "ACME PAYROLL"),
        ]
        closing = Decimal("1692.50")
        self.assertEqual(
            format_report(rows, RULES, closing),
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

- [ ] **Step 2: Run the test to verify it fails**

Run: `python3 -m unittest test_report -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'ledgerlite.report'`

- [ ] **Step 3: Write the minimal implementation**

Create `ledgerlite/report.py`:

```python
"""Per-category totals and report formatting."""

from decimal import Decimal

from .model import Transaction
from .rules import Rule, categorize

UNCATEGORIZED = "uncategorized"
CENTS = Decimal("0.01")


def format_amount(amount: Decimal) -> str:
    """Format an amount with exactly two fractional digits, no separators."""
    quantized = amount.quantize(CENTS)
    if quantized.is_zero():
        quantized = quantized.copy_abs()
    return format(quantized, "f")


def category_totals(
    transactions: list[Transaction], rules: list[Rule]
) -> list[tuple[str, Decimal]]:
    """Total each category: named ones alphabetically, uncategorized last."""
    totals: dict[str, Decimal] = {}
    for txn in transactions:
        name = categorize(txn.description, rules) or UNCATEGORIZED
        totals[name] = totals.get(name, Decimal("0")) + txn.amount
    ordered = sorted(
        (name, total) for name, total in totals.items() if name != UNCATEGORIZED
    )
    if UNCATEGORIZED in totals:
        ordered.append((UNCATEGORIZED, totals[UNCATEGORIZED]))
    return ordered


def format_report(
    transactions: list[Transaction], rules: list[Rule], closing: Decimal
) -> str:
    """Build the whole report text, ending in a single newline."""
    lines = [
        f"{name}: {format_amount(total)}"
        for name, total in category_totals(transactions, rules)
    ]
    lines.append("")
    lines.append(f"closing balance: {format_amount(closing)}")
    return "\n".join(lines) + "\n"
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `python3 -m unittest test_report -v`
Expected: PASS — 15 tests OK

- [ ] **Step 5: Commit**

```bash
git add ledgerlite/report.py test_report.py
git commit -m "feat: total categories and format the report"
```

---

### Task 6: CLI entry point

**Files:**
- Create: `ledgerlite/cli.py`
- Create: `ledgerlite/__main__.py`
- Test: `test_cli.py`

**Interfaces:**
- Consumes: `parse_transactions(path)`, `parse_amount(text)`, `ParseError` (Task 3); `parse_rules(text)` (Task 2); `closing_balance(opening, transactions)` (Task 4); `format_report(transactions, rules, closing)` (Task 5).
- Produces: `ledgerlite.cli.main(argv: list[str] | None = None) -> int` — writes the report to stdout or an error to stderr and returns the exit code. `ledgerlite/__main__.py` calls `sys.exit(main())`.

- [ ] **Step 1: Write the failing test**

Create `test_cli.py`:

```python
import contextlib
import io
import tempfile
import unittest
from pathlib import Path

from ledgerlite.cli import main

HEADER = "date,amount,description\n"
ROWS = (
    "2026-03-06,2500.00,ACME PAYROLL\n"
    "2026-03-04,-7.50,Blue Bottle Coffee\n"
    "2026-03-05,-900.00,March Rent\n"
)


class CliTest(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)

    def write(self, name, text):
        path = Path(self.tmp.name) / name
        path.write_text(text, encoding="utf-8")
        return str(path)

    def run_cli(self, argv):
        out, err = io.StringIO(), io.StringIO()
        with contextlib.redirect_stdout(out), contextlib.redirect_stderr(err):
            code = main(argv)
        return code, out.getvalue(), err.getvalue()

    def test_reports_the_design_example(self):
        txns = self.write("txns.csv", HEADER + ROWS)
        rules = self.write("rules.txt", "coffee=food\nrent=housing\n")
        code, out, err = self.run_cli(
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

    def test_opening_defaults_to_zero(self):
        txns = self.write("txns.csv", HEADER + "2026-03-04,-7.50,Coffee\n")
        code, out, _ = self.run_cli(["report", txns])
        self.assertEqual(code, 0)
        self.assertEqual(
            out, "uncategorized: -7.50\n\nclosing balance: -7.50\n"
        )

    def test_without_rules_everything_is_uncategorized(self):
        txns = self.write("txns.csv", HEADER + ROWS)
        code, out, _ = self.run_cli(["report", txns])
        self.assertEqual(code, 0)
        self.assertEqual(
            out, "uncategorized: 1592.50\n\nclosing balance: 1592.50\n"
        )

    def test_header_only_file_reports_just_the_closing_balance(self):
        txns = self.write("txns.csv", HEADER)
        code, out, _ = self.run_cli(["report", txns, "--opening", "100"])
        self.assertEqual(code, 0)
        self.assertEqual(out, "\nclosing balance: 100.00\n")

    def test_negative_zero_opening_prints_zero(self):
        txns = self.write("txns.csv", HEADER)
        code, out, _ = self.run_cli(["report", txns, "--opening", "-0.00"])
        self.assertEqual(code, 0)
        self.assertEqual(out, "\nclosing balance: 0.00\n")

    def test_missing_transactions_file_is_exit_1(self):
        missing = str(Path(self.tmp.name) / "nope.csv")
        code, out, err = self.run_cli(["report", missing])
        self.assertEqual(code, 1)
        self.assertEqual(out, "")
        self.assertEqual(err, f"ledgerlite: cannot read {missing}: No such file or directory\n")

    def test_directory_as_transactions_file_is_exit_1(self):
        code, out, err = self.run_cli(["report", self.tmp.name])
        self.assertEqual(code, 1)
        self.assertEqual(out, "")
        self.assertTrue(err.startswith(f"ledgerlite: cannot read {self.tmp.name}: "))

    def test_non_utf8_transactions_file_is_exit_1(self):
        path = Path(self.tmp.name) / "latin.csv"
        path.write_bytes(HEADER.encode("utf-8") + b"2026-03-04,-7.50,Caf\xe9\n")
        code, out, err = self.run_cli(["report", str(path)])
        self.assertEqual(code, 1)
        self.assertEqual(out, "")
        self.assertEqual(err, f"ledgerlite: cannot read {path}: not valid UTF-8 text\n")

    def test_missing_rules_file_is_exit_1(self):
        txns = self.write("txns.csv", HEADER + ROWS)
        missing = str(Path(self.tmp.name) / "nope.txt")
        code, out, err = self.run_cli(["report", txns, "--rules", missing])
        self.assertEqual(code, 1)
        self.assertEqual(out, "")
        self.assertEqual(err, f"ledgerlite: cannot read {missing}: No such file or directory\n")

    def test_malformed_row_is_exit_2_with_nothing_on_stdout(self):
        txns = self.write(
            "txns.csv", HEADER + "2026-03-04,-7.50,Coffee\n2026-03-05,nope,Rent\n"
        )
        code, out, err = self.run_cli(["report", txns])
        self.assertEqual(code, 2)
        self.assertEqual(out, "")
        self.assertTrue(err.startswith(f"ledgerlite: {txns}:3: "), err)
        self.assertIn("not a decimal number", err)

    def test_too_many_fractional_digits_is_exit_2(self):
        txns = self.write("txns.csv", HEADER + "2026-03-04,-1.005,Coffee\n")
        code, out, err = self.run_cli(["report", txns])
        self.assertEqual(code, 2)
        self.assertEqual(out, "")
        self.assertIn("two fractional digits", err)

    def test_bad_opening_value_exits_2(self):
        txns = self.write("txns.csv", HEADER + ROWS)
        for value in ("twelve", "1.005"):
            with self.subTest(value=value):
                with contextlib.redirect_stderr(io.StringIO()):
                    with self.assertRaises(SystemExit) as caught:
                        main(["report", txns, "--opening", value])
                self.assertEqual(caught.exception.code, 2)


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `python3 -m unittest test_cli -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'ledgerlite.cli'`

- [ ] **Step 3: Write the minimal implementation**

Create `ledgerlite/cli.py`:

```python
"""Command-line entry point."""

import argparse
import sys
from decimal import Decimal

from .balance import closing_balance
from .parse import ParseError, parse_amount, parse_transactions
from .report import format_report
from .rules import parse_rules

PROG = "ledgerlite"


def _opening_amount(text: str) -> Decimal:
    try:
        return parse_amount(text)
    except ValueError as exc:
        raise argparse.ArgumentTypeError(str(exc)) from None


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog=PROG, description="Summarize bank transactions by category."
    )
    subcommands = parser.add_subparsers(dest="command", required=True)
    report = subcommands.add_parser("report", help="print a category report")
    report.add_argument("transactions", help="path to the transactions CSV")
    report.add_argument("--rules", help="path to the rules file")
    report.add_argument(
        "--opening",
        type=_opening_amount,
        default=Decimal("0"),
        help="opening balance (default: 0)",
    )
    return parser


def _read_text(path: str) -> str:
    with open(path, encoding="utf-8") as handle:
        return handle.read()


def _cannot_read(path: str, exc: Exception) -> None:
    reason = "not valid UTF-8 text"
    if isinstance(exc, OSError):
        reason = exc.strerror or str(exc)
    print(f"{PROG}: cannot read {path}: {reason}", file=sys.stderr)


def main(argv: list[str] | None = None) -> int:
    args = build_parser().parse_args(argv)

    rules = []
    if args.rules is not None:
        try:
            rules = parse_rules(_read_text(args.rules))
        except (OSError, UnicodeDecodeError) as exc:
            _cannot_read(args.rules, exc)
            return 1

    try:
        transactions = parse_transactions(args.transactions)
    except (OSError, UnicodeDecodeError) as exc:
        _cannot_read(args.transactions, exc)
        return 1
    except ParseError as exc:
        print(f"{PROG}: {exc}", file=sys.stderr)
        return 2

    closing = closing_balance(args.opening, transactions)
    sys.stdout.write(format_report(transactions, rules, closing))
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

- [ ] **Step 4: Run the test to verify it passes**

Run: `python3 -m unittest test_cli -v`
Expected: PASS — 12 tests OK

- [ ] **Step 5: Run the whole suite**

Run: `python3 -m unittest`
Expected: PASS — all tests from Tasks 1–6 OK, no failures, no errors

- [ ] **Step 6: Check the real command end to end**

```bash
printf 'date,amount,description\n2026-03-06,2500.00,ACME PAYROLL\n2026-03-04,-7.50,Blue Bottle Coffee\n2026-03-05,-900.00,March Rent\n' > /tmp/txns.csv
printf 'coffee=food\nrent=housing\n' > /tmp/rules.txt
python3 -m ledgerlite report /tmp/txns.csv --rules /tmp/rules.txt --opening 100
echo "exit=$?"
```

Expected output, matching the design example exactly:

```
food: -7.50
housing: -900.00
uncategorized: 2500.00

closing balance: 1692.50
exit=0
```

Then confirm the failure paths:

```bash
python3 -m ledgerlite report /tmp/does-not-exist.csv; echo "exit=$?"
printf 'date,amount,description\n2026-03-04,nope,Coffee\n' > /tmp/bad.csv
python3 -m ledgerlite report /tmp/bad.csv; echo "exit=$?"
```

Expected: the first prints `ledgerlite: cannot read /tmp/does-not-exist.csv: No such file or directory` and `exit=1`; the second prints `ledgerlite: /tmp/bad.csv:2: amount is not a decimal number: 'nope'` and `exit=2`, with nothing on stdout.

- [ ] **Step 7: Verify no floats anywhere**

Run: `grep -rn "float" ledgerlite/`
Expected: no matches.

- [ ] **Step 8: Commit**

```bash
git add ledgerlite/cli.py ledgerlite/__main__.py test_cli.py
git commit -m "feat: add ledgerlite report command"
```

---

## Done When

- `python3 -m unittest` passes from the repo root with zero failures and zero errors.
- `python3 -m ledgerlite report ... --rules ... --opening 100` reproduces the design example byte for byte.
- Exit codes are 0 / 1 / 2 as specified, and stdout is empty for both error paths.
- `grep -rn "float" ledgerlite/` finds nothing, and no file outside the spec's layout plus `__main__.py` exists.
