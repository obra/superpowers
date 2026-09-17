# ledgerlite Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `ledgerlite`, a standard-library-only CLI that reads a transactions CSV, categorizes each row with a rules file, and prints per-category totals plus the closing balance.

**Architecture:** Six small modules with one responsibility each, wired together only at the top: `parse` turns CSV *text* into `Transaction` objects, `rules` turns rules *text* into match pairs, `balance` orders by date and folds the running balance, `report` formats, and `cli` is the only layer that touches the filesystem, stderr, and exit codes. Because file I/O lives solely in `cli`, every other module is tested with plain strings — no temp files. All money is `decimal.Decimal` end to end; no `float` appears anywhere in the package.

**Tech Stack:** Python 3.11+, standard library only (`csv`, `decimal`, `datetime`, `dataclasses`, `argparse`, `io`, `sys`), `unittest` for tests.

**Spec:** `design.md` (in this directory — read it before starting; this plan argues from it)

## Global Constraints

- Python 3.11+. Use no syntax or library feature newer than 3.11 (the local interpreter is 3.14, so newer features would pass locally and break on the floor).
- Standard library only. No third-party packages, no `requirements.txt`, no packaging metadata beyond the plain package directory.
- Money is `decimal.Decimal`, never `float`. The string `float` must not appear in the package.
- Package layout is exactly as the spec's "Package layout" section lists: `ledgerlite/{__init__,model,parse,rules,balance,report,cli}.py`, plus `__main__.py` (see Task 6 for why).
- Tests live at the repo root as `test_<module>.py` and run with `python3 -m unittest` from the repo root.
- Every stderr message is prefixed `ledgerlite: `. Exit codes: 0 success, 1 unreadable file, 2 malformed input.
- Amounts print with exactly two fractional digits, a leading `-` for negatives, no thousands separators.
- Work directly on `main`. Commit at the end of every task.

## Decisions this plan makes where the spec is silent

The spec is a vision document; these are the readings this plan commits to, so the executor does not have to invent them:

1. **Header row is validated.** The three header fields, stripped and lowercased, must be `date,amount,description`. Otherwise it is malformed input (exit 2, reported at the header's line). Without this check, a headerless file would silently drop its first real transaction.
2. **Empty transactions file** (zero bytes) is malformed input, reported as a missing header at line 1.
3. **Header-only file** (no data rows) is valid: zero transactions, so no category lines, so no blank separator line either — the whole report is `closing balance: <opening>`.
4. **A malformed rules line is malformed input** (exit 2), reported as `ledgerlite: <rules path>:<line>: ...`, the same shape the spec gives for transaction rows. Blank and whitespace-only lines in the rules file are skipped. A line with no `=`, an empty substring, or an empty category is rejected — an empty substring would match everything and an empty category would print as a nameless line.
5. **An unreadable rules file** behaves like an unreadable transactions file: `cannot read` on stderr, exit 1. The transactions file is read and parsed first, so its error wins if both are bad.
6. **`--opening` is validated by the same amount rules** as CSV amounts; a bad value exits 2 via argparse's own usage message.
7. **Files are decoded as UTF-8, tolerating a leading BOM** (`encoding="utf-8-sig"`), so a spreadsheet-exported CSV does not fail header validation on `﻿date`. Undecodable bytes are an unreadable file (exit 1).
8. **Alphabetical** means case-insensitively alphabetical, tie-broken by the raw name, so `Food` and `food` sort together and the order is deterministic.
9. **Negative zero prints as `0.00`**, never `-0.00`.

## Review Focus

Input classes and failure modes the spec implies but does not spell out. Each line names the task whose tests pin it; nothing here is left for the final reviewer to rediscover.

- Empty `date` or `amount` field (`2026-03-04,,x`) → malformed row, not a crash — Task 2.
- Non-finite amounts (`nan`, `inf`, `Infinity`), which `Decimal` accepts happily → malformed row — Task 2.
- Missing or misspelled header row → malformed input at line 1, not a lost transaction — Task 2.
- Zero-byte transactions file → malformed input, not an empty success — Task 2.
- Quoted description containing a comma, and CRLF line endings → parsed correctly, line numbers still right — Task 2.
- Rules file lines that are blank, have no `=`, or have an empty substring/category — Task 3.
- Two rules matching the same description → the first listed wins — Task 3.
- Two transactions sharing a date → input order preserved (stable sort) — Task 4.
- A category whose amounts sum to exactly zero → still printed, as `0.00` not `-0.00` — Task 5.
- A rule whose category is literally `uncategorized` → merges with the no-category bucket and stays last — Task 5.
- Category names differing only in case → deterministic alphabetical order — Task 5.
- Header-only file → `closing balance:` alone, with no leading blank line — Task 5 and Task 6.
- Transactions path that is a directory, and a file of undecodable bytes → exit 1 `cannot read` — Task 6.
- Unreadable rules file, and `--opening` with a bad value → exit 1 and exit 2 respectively — Task 6.
- Both files bad at once → the transactions error is the one reported — Task 6.

---

## Task 1: Package skeleton and the Transaction model

Sets up the repo so `python3 -m unittest` works, and lands the one data type every other module consumes.

**Files:**
- Create: `ledgerlite/__init__.py`
- Create: `ledgerlite/model.py`
- Create: `.gitignore`
- Test: `test_model.py`

**Interfaces:**
- Consumes: nothing.
- Produces: `ledgerlite.model.Transaction`, a frozen dataclass with fields `date: datetime.date`, `amount: decimal.Decimal`, `description: str`, in that positional order.

- [ ] **Step 1: Write the failing test**

Create `test_model.py`:

```python
"""Tests for ledgerlite.model."""

import unittest
from dataclasses import FrozenInstanceError
from datetime import date
from decimal import Decimal

from ledgerlite.model import Transaction


class TransactionTest(unittest.TestCase):
    def test_holds_date_amount_and_description(self):
        transaction = Transaction(date(2026, 3, 4), Decimal("-7.50"), "Coffee beans")

        self.assertEqual(transaction.date, date(2026, 3, 4))
        self.assertEqual(transaction.amount, Decimal("-7.50"))
        self.assertEqual(transaction.description, "Coffee beans")

    def test_accepts_fields_by_keyword(self):
        transaction = Transaction(
            date=date(2026, 3, 4), amount=Decimal("2500.00"), description="Salary"
        )

        self.assertEqual(transaction.amount, Decimal("2500.00"))

    def test_is_immutable(self):
        transaction = Transaction(date(2026, 3, 4), Decimal("1.00"), "x")

        with self.assertRaises(FrozenInstanceError):
            transaction.amount = Decimal("2.00")


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `python3 -m unittest test_model -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'ledgerlite'`

- [ ] **Step 3: Write the package skeleton and the model**

Create `ledgerlite/__init__.py`:

```python
"""ledgerlite — categorize bank transactions and summarize them."""
```

Create `ledgerlite/model.py`:

```python
"""The one data type the rest of the package passes around."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import date
from decimal import Decimal


@dataclass(frozen=True)
class Transaction:
    """A single bank transaction. `amount` is negative for money out."""

    date: date
    amount: Decimal
    description: str
```

Create `.gitignore`:

```gitignore
__pycache__/
*.pyc
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `python3 -m unittest -v`
Expected: PASS — 3 tests, OK

- [ ] **Step 5: Commit**

```bash
git add .gitignore ledgerlite/__init__.py ledgerlite/model.py test_model.py
git commit -m "feat: add ledgerlite package skeleton and Transaction model"
```

---

## Task 2: Parse the transactions CSV

**Files:**
- Create: `ledgerlite/parse.py`
- Test: `test_parse.py`

**Interfaces:**
- Consumes: `ledgerlite.model.Transaction(date, amount, description)`.
- Produces:
  - `ledgerlite.parse.ParseError(line: int, message: str)` — an exception with `.line` and `.message` attributes. Task 3 raises this same type for rules-file lines; Task 6 formats it.
  - `ledgerlite.parse.parse_amount(text: str) -> Decimal` — raises `ValueError` whose message is the "what is wrong" text. Task 6 reuses it for `--opening`.
  - `ledgerlite.parse.parse_date(text: str) -> datetime.date` — raises `ValueError`.
  - `ledgerlite.parse.parse_transactions(text: str) -> list[Transaction]` — takes the file's *text*, not a path; raises `ParseError`. Rows come back in input order.

Note on validation: `Decimal` accepts `"nan"`, `"Infinity"`, and exponent forms, so `parse_amount` checks `is_finite()` before it looks at the exponent (`as_tuple().exponent` is a string, not an int, for non-finite values — checking the exponent first would crash). "More than two fractional digits" is exactly `exponent < -2`, which accepts `1.5` and `1.50` and rejects `1.005`.

- [ ] **Step 1: Write the failing test**

Create `test_parse.py`:

```python
"""Tests for ledgerlite.parse."""

import unittest
from datetime import date
from decimal import Decimal

from ledgerlite.parse import ParseError, parse_amount, parse_date, parse_transactions

HEADER = "date,amount,description\n"


class ParseAmountTest(unittest.TestCase):
    def test_parses_negative_and_positive_amounts(self):
        self.assertEqual(parse_amount("-7.50"), Decimal("-7.50"))
        self.assertEqual(parse_amount("2500.00"), Decimal("2500.00"))

    def test_accepts_zero_one_or_two_fractional_digits(self):
        self.assertEqual(parse_amount("12"), Decimal("12"))
        self.assertEqual(parse_amount("1.5"), Decimal("1.5"))
        self.assertEqual(parse_amount("1.50"), Decimal("1.50"))

    def test_ignores_surrounding_whitespace(self):
        self.assertEqual(parse_amount("  -7.50 "), Decimal("-7.50"))

    def test_rejects_more_than_two_fractional_digits(self):
        with self.assertRaises(ValueError) as caught:
            parse_amount("1.005")

        self.assertIn("more than two fractional digits", str(caught.exception))

    def test_rejects_non_numbers(self):
        for text in ["", "   ", "abc", "1.2.3", "12,50", "$5.00"]:
            with self.subTest(text=text), self.assertRaises(ValueError) as caught:
                parse_amount(text)
            self.assertIn("not a decimal number", str(caught.exception))

    def test_rejects_nan_and_infinity(self):
        for text in ["nan", "NaN", "inf", "-Infinity"]:
            with self.subTest(text=text), self.assertRaises(ValueError) as caught:
                parse_amount(text)
            self.assertIn("not a decimal number", str(caught.exception))


class ParseDateTest(unittest.TestCase):
    def test_parses_iso_date(self):
        self.assertEqual(parse_date("2026-03-04"), date(2026, 3, 4))

    def test_ignores_surrounding_whitespace(self):
        self.assertEqual(parse_date(" 2026-03-04 "), date(2026, 3, 4))

    def test_rejects_non_dates(self):
        for text in ["", "not-a-date", "2026-13-01", "03/04/2026"]:
            with self.subTest(text=text), self.assertRaises(ValueError) as caught:
                parse_date(text)
            self.assertIn("ISO 8601", str(caught.exception))


class ParseTransactionsTest(unittest.TestCase):
    def test_parses_rows_in_input_order(self):
        text = HEADER + "2026-03-03,2500.00,Salary\n2026-03-01,-900.00,Rent March\n"

        transactions = parse_transactions(text)

        self.assertEqual(len(transactions), 2)
        self.assertEqual(transactions[0].date, date(2026, 3, 3))
        self.assertEqual(transactions[0].amount, Decimal("2500.00"))
        self.assertEqual(transactions[0].description, "Salary")
        self.assertEqual(transactions[1].description, "Rent March")

    def test_header_only_file_has_no_transactions(self):
        self.assertEqual(parse_transactions(HEADER), [])

    def test_accepts_quoted_description_containing_a_comma(self):
        text = HEADER + '2026-03-04,-7.50,"Coffee, beans"\n'

        self.assertEqual(parse_transactions(text)[0].description, "Coffee, beans")

    def test_accepts_crlf_line_endings(self):
        text = "date,amount,description\r\n2026-03-04,-7.50,Coffee\r\n"

        self.assertEqual(parse_transactions(text)[0].amount, Decimal("-7.50"))

    def test_skips_blank_lines(self):
        text = HEADER + "2026-03-04,-7.50,Coffee\n\n"

        self.assertEqual(len(parse_transactions(text)), 1)

    def test_rejects_missing_header(self):
        with self.assertRaises(ParseError) as caught:
            parse_transactions("2026-03-04,-7.50,Coffee\n")

        self.assertEqual(caught.exception.line, 1)
        self.assertIn("expected header date,amount,description", caught.exception.message)

    def test_rejects_empty_file(self):
        with self.assertRaises(ParseError) as caught:
            parse_transactions("")

        self.assertEqual(caught.exception.line, 1)
        self.assertIn("expected header date,amount,description", caught.exception.message)

    def test_rejects_wrong_column_count(self):
        text = HEADER + "2026-03-04,-7.50,Coffee\n2026-03-05,-1.00\n"

        with self.assertRaises(ParseError) as caught:
            parse_transactions(text)

        self.assertEqual(caught.exception.line, 3)
        self.assertIn("expected 3 columns, found 2", caught.exception.message)

    def test_rejects_unparseable_date_and_reports_its_line(self):
        text = HEADER + "2026-03-04,-7.50,Coffee\nyesterday,-1.00,Tea\n"

        with self.assertRaises(ParseError) as caught:
            parse_transactions(text)

        self.assertEqual(caught.exception.line, 3)
        self.assertIn("ISO 8601", caught.exception.message)

    def test_rejects_bad_amount_and_reports_its_line(self):
        text = HEADER + "2026-03-04,1.005,Coffee\n"

        with self.assertRaises(ParseError) as caught:
            parse_transactions(text)

        self.assertEqual(caught.exception.line, 2)
        self.assertIn("more than two fractional digits", caught.exception.message)

    def test_rejects_empty_amount_field(self):
        with self.assertRaises(ParseError) as caught:
            parse_transactions(HEADER + "2026-03-04,,Coffee\n")

        self.assertEqual(caught.exception.line, 2)
        self.assertIn("not a decimal number", caught.exception.message)

    def test_rejects_empty_date_field(self):
        with self.assertRaises(ParseError) as caught:
            parse_transactions(HEADER + ",-7.50,Coffee\n")

        self.assertEqual(caught.exception.line, 2)
        self.assertIn("ISO 8601", caught.exception.message)


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `python3 -m unittest test_parse -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'ledgerlite.parse'`

- [ ] **Step 3: Write the implementation**

Create `ledgerlite/parse.py`:

```python
"""Turn transactions-CSV text into Transaction objects."""

from __future__ import annotations

import csv
import io
from datetime import date
from decimal import Decimal, InvalidOperation

from ledgerlite.model import Transaction

HEADER = ["date", "amount", "description"]
MISSING_HEADER = "expected header date,amount,description"


class ParseError(Exception):
    """A numbered line of an input file is malformed."""

    def __init__(self, line: int, message: str) -> None:
        super().__init__(f"{line}: {message}")
        self.line = line
        self.message = message


def parse_amount(text: str) -> Decimal:
    """Parse a money amount. Never a float."""
    try:
        amount = Decimal(text.strip())
    except InvalidOperation:
        raise ValueError(f"amount is not a decimal number: {text!r}") from None
    if not amount.is_finite():
        raise ValueError(f"amount is not a decimal number: {text!r}")
    if amount.as_tuple().exponent < -2:
        raise ValueError(f"amount has more than two fractional digits: {text!r}")
    return amount


def parse_date(text: str) -> date:
    try:
        return date.fromisoformat(text.strip())
    except ValueError:
        raise ValueError(f"date is not an ISO 8601 date: {text!r}") from None


def parse_transactions(text: str) -> list[Transaction]:
    """Parse the whole file or raise ParseError; callers reject the file entirely."""
    reader = csv.reader(io.StringIO(text, newline=""))
    try:
        header = next(reader)
    except StopIteration:
        raise ParseError(1, MISSING_HEADER) from None
    if [field.strip().lower() for field in header] != HEADER:
        raise ParseError(reader.line_num, MISSING_HEADER)

    transactions = []
    for row in reader:
        if not row:
            continue
        if len(row) != 3:
            raise ParseError(reader.line_num, f"expected 3 columns, found {len(row)}")
        raw_date, raw_amount, description = row
        try:
            when = parse_date(raw_date)
            amount = parse_amount(raw_amount)
        except ValueError as error:
            raise ParseError(reader.line_num, str(error)) from None
        transactions.append(Transaction(when, amount, description))
    return transactions
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `python3 -m unittest -v`
Expected: PASS — all tests OK (Task 1's 3 plus Task 2's)

- [ ] **Step 5: Commit**

```bash
git add ledgerlite/parse.py test_parse.py
git commit -m "feat: parse transactions CSV into Transactions with line-numbered errors"
```

---

## Task 3: Rules file and categorization

**Files:**
- Create: `ledgerlite/rules.py`
- Test: `test_rules.py`

**Interfaces:**
- Consumes: `ledgerlite.parse.ParseError(line, message)` — rules-file lines are reported exactly like CSV rows, so they share the error type.
- Produces:
  - `ledgerlite.rules.parse_rules(text: str) -> list[tuple[str, str]]` — `(substring, category)` pairs in file order; raises `ParseError`.
  - `ledgerlite.rules.categorize(description: str, rules: list[tuple[str, str]]) -> str | None` — first matching rule's category, case-insensitive substring match, `None` if nothing matches.

- [ ] **Step 1: Write the failing test**

Create `test_rules.py`:

```python
"""Tests for ledgerlite.rules."""

import unittest

from ledgerlite.parse import ParseError
from ledgerlite.rules import categorize, parse_rules


class ParseRulesTest(unittest.TestCase):
    def test_parses_rules_in_file_order(self):
        self.assertEqual(
            parse_rules("coffee=food\nrent=housing\n"),
            [("coffee", "food"), ("rent", "housing")],
        )

    def test_ignores_blank_and_whitespace_only_lines(self):
        self.assertEqual(parse_rules("\ncoffee=food\n   \n"), [("coffee", "food")])

    def test_empty_text_has_no_rules(self):
        self.assertEqual(parse_rules(""), [])

    def test_strips_whitespace_around_substring_and_category(self):
        self.assertEqual(parse_rules(" coffee = food \n"), [("coffee", "food")])

    def test_splits_on_the_first_equals_only(self):
        self.assertEqual(parse_rules("a=b=c\n"), [("a", "b=c")])

    def test_rejects_line_without_separator(self):
        with self.assertRaises(ParseError) as caught:
            parse_rules("coffee=food\njust-a-substring\n")

        self.assertEqual(caught.exception.line, 2)
        self.assertIn("expected <substring>=<category>", caught.exception.message)

    def test_rejects_empty_substring(self):
        with self.assertRaises(ParseError) as caught:
            parse_rules("=food\n")

        self.assertEqual(caught.exception.line, 1)
        self.assertIn("expected <substring>=<category>", caught.exception.message)

    def test_rejects_empty_category(self):
        with self.assertRaises(ParseError) as caught:
            parse_rules("coffee=\n")

        self.assertEqual(caught.exception.line, 1)
        self.assertIn("expected <substring>=<category>", caught.exception.message)


class CategorizeTest(unittest.TestCase):
    RULES = [("coffee", "food"), ("rent", "housing")]

    def test_matches_substring_anywhere_in_description(self):
        self.assertEqual(categorize("Monthly rent payment", self.RULES), "housing")

    def test_matching_is_case_insensitive_both_ways(self):
        self.assertEqual(categorize("COFFEE BEANS", self.RULES), "food")
        self.assertEqual(categorize("coffee beans", [("COFFEE", "food")]), "food")

    def test_first_matching_rule_wins(self):
        rules = [("coffee", "food"), ("coffee shop", "outings")]

        self.assertEqual(categorize("Coffee shop", rules), "food")

    def test_returns_none_when_nothing_matches(self):
        self.assertIsNone(categorize("Salary", self.RULES))

    def test_returns_none_with_no_rules(self):
        self.assertIsNone(categorize("Coffee beans", []))


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `python3 -m unittest test_rules -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'ledgerlite.rules'`

- [ ] **Step 3: Write the implementation**

Create `ledgerlite/rules.py`:

```python
"""Turn rules text into (substring, category) pairs and apply them."""

from __future__ import annotations

from ledgerlite.parse import ParseError

Rule = tuple[str, str]


def parse_rules(text: str) -> list[Rule]:
    """Parse `<substring>=<category>` lines. Blank lines are skipped."""
    rules: list[Rule] = []
    for number, line in enumerate(text.splitlines(), start=1):
        if not line.strip():
            continue
        substring, separator, category = line.partition("=")
        substring, category = substring.strip(), category.strip()
        if not separator or not substring or not category:
            raise ParseError(number, f"expected <substring>=<category>: {line!r}")
        rules.append((substring, category))
    return rules


def categorize(description: str, rules: list[Rule]) -> str | None:
    """The first matching rule's category, or None when nothing matches."""
    lowered = description.lower()
    for substring, category in rules:
        if substring.lower() in lowered:
            return category
    return None
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `python3 -m unittest -v`
Expected: PASS — all tests OK

- [ ] **Step 5: Commit**

```bash
git add ledgerlite/rules.py test_rules.py
git commit -m "feat: parse rules file and categorize descriptions"
```

---

## Task 4: Date ordering and running balance

**Files:**
- Create: `ledgerlite/balance.py`
- Test: `test_balance.py`

**Interfaces:**
- Consumes: `ledgerlite.model.Transaction`.
- Produces:
  - `ledgerlite.balance.order_by_date(transactions: list[Transaction]) -> list[Transaction]` — a new list sorted by date; ties keep input order.
  - `ledgerlite.balance.closing_balance(opening: Decimal, transactions: list[Transaction]) -> Decimal` — the running balance after the last transaction in date order, or `opening` when there are none.

`sorted` is stable, which is exactly the "ties keep input order" rule — do not sort by any secondary key.

- [ ] **Step 1: Write the failing test**

Create `test_balance.py`:

```python
"""Tests for ledgerlite.balance."""

import unittest
from datetime import date
from decimal import Decimal

from ledgerlite.balance import closing_balance, order_by_date
from ledgerlite.model import Transaction


def transaction(day, amount, description="x"):
    return Transaction(date(2026, 3, day), Decimal(amount), description)


class OrderByDateTest(unittest.TestCase):
    def test_orders_by_date(self):
        rows = [transaction(3, "1.00"), transaction(1, "2.00"), transaction(2, "3.00")]

        self.assertEqual([t.date.day for t in order_by_date(rows)], [1, 2, 3])

    def test_ties_keep_input_order(self):
        rows = [
            transaction(1, "1.00", "second-in-file"),
            transaction(1, "2.00", "third-in-file"),
        ]
        rows.insert(0, transaction(2, "3.00", "first-in-file"))

        ordered = order_by_date(rows)

        self.assertEqual(
            [t.description for t in ordered],
            ["second-in-file", "third-in-file", "first-in-file"],
        )

    def test_does_not_mutate_its_argument(self):
        rows = [transaction(3, "1.00"), transaction(1, "2.00")]

        order_by_date(rows)

        self.assertEqual([t.date.day for t in rows], [3, 1])


class ClosingBalanceTest(unittest.TestCase):
    def test_adds_every_amount_to_the_opening_balance(self):
        rows = [transaction(1, "-900.00"), transaction(2, "-7.50"), transaction(3, "2500.00")]

        self.assertEqual(closing_balance(Decimal("100"), rows), Decimal("1692.50"))

    def test_is_the_opening_balance_when_there_are_no_transactions(self):
        self.assertEqual(closing_balance(Decimal("100.00"), []), Decimal("100.00"))

    def test_out_of_order_input_gives_the_same_balance(self):
        rows = [transaction(3, "2500.00"), transaction(1, "-900.00"), transaction(2, "-7.50")]

        self.assertEqual(closing_balance(Decimal("100"), rows), Decimal("1692.50"))

    def test_default_opening_of_zero(self):
        self.assertEqual(closing_balance(Decimal("0"), [transaction(1, "-7.50")]), Decimal("-7.50"))


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `python3 -m unittest test_balance -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'ledgerlite.balance'`

- [ ] **Step 3: Write the implementation**

Create `ledgerlite/balance.py`:

```python
"""Date ordering and the running balance."""

from __future__ import annotations

from decimal import Decimal

from ledgerlite.model import Transaction


def order_by_date(transactions: list[Transaction]) -> list[Transaction]:
    """Sorted by date. `sorted` is stable, so same-date rows keep input order."""
    return sorted(transactions, key=lambda transaction: transaction.date)


def closing_balance(opening: Decimal, transactions: list[Transaction]) -> Decimal:
    """The running balance after the last transaction in date order."""
    balance = opening
    for transaction in order_by_date(transactions):
        balance += transaction.amount
    return balance
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `python3 -m unittest -v`
Expected: PASS — all tests OK

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
- Consumes: `ledgerlite.model.Transaction`, `ledgerlite.rules.categorize(description, rules)`, `ledgerlite.balance.closing_balance(opening, transactions)`.
- Produces:
  - `ledgerlite.report.UNCATEGORIZED = "uncategorized"`
  - `ledgerlite.report.format_amount(amount: Decimal) -> str` — exactly two fractional digits, no thousands separators, `0.00` for negative zero.
  - `ledgerlite.report.category_totals(transactions, rules) -> list[tuple[str, Decimal]]` — case-insensitively alphabetical, `uncategorized` last.
  - `ledgerlite.report.format_report(transactions, rules, opening) -> str` — the whole report, ending in a single `\n`. Task 6 writes it to stdout verbatim.

- [ ] **Step 1: Write the failing test**

Create `test_report.py`:

```python
"""Tests for ledgerlite.report."""

import unittest
from datetime import date
from decimal import Decimal

from ledgerlite.model import Transaction
from ledgerlite.report import category_totals, format_amount, format_report


def transaction(day, amount, description):
    return Transaction(date(2026, 3, day), Decimal(amount), description)


RULES = [("coffee", "food"), ("rent", "housing")]
LEDGER = [
    transaction(1, "-900.00", "Rent March"),
    transaction(2, "-7.50", "Coffee beans"),
    transaction(3, "2500.00", "Salary"),
]


class FormatAmountTest(unittest.TestCase):
    def test_always_two_fractional_digits(self):
        self.assertEqual(format_amount(Decimal("0")), "0.00")
        self.assertEqual(format_amount(Decimal("1200")), "1200.00")
        self.assertEqual(format_amount(Decimal("1.5")), "1.50")
        self.assertEqual(format_amount(Decimal("1692.50")), "1692.50")

    def test_leading_minus_for_negatives(self):
        self.assertEqual(format_amount(Decimal("-12.5")), "-12.50")

    def test_no_thousands_separators(self):
        self.assertEqual(format_amount(Decimal("1234567.89")), "1234567.89")

    def test_negative_zero_prints_as_zero(self):
        self.assertEqual(format_amount(Decimal("-0.00")), "0.00")
        self.assertEqual(format_amount(Decimal("5.00") - Decimal("5.00")), "0.00")


class CategoryTotalsTest(unittest.TestCase):
    def test_sums_each_category_with_uncategorized_last(self):
        self.assertEqual(
            category_totals(LEDGER, RULES),
            [
                ("food", Decimal("-7.50")),
                ("housing", Decimal("-900.00")),
                ("uncategorized", Decimal("2500.00")),
            ],
        )

    def test_categories_are_alphabetical_regardless_of_rule_order(self):
        rules = [("rent", "housing"), ("coffee", "food")]

        self.assertEqual([name for name, _ in category_totals(LEDGER, rules)][:2], ["food", "housing"])

    def test_uncategorized_is_last_even_though_u_sorts_late_anyway(self):
        rows = [transaction(1, "1.00", "Zoo trip"), transaction(2, "2.00", "Mystery")]
        rules = [("zoo", "zoo visits")]

        self.assertEqual(
            [name for name, _ in category_totals(rows, rules)], ["zoo visits", "uncategorized"]
        )

    def test_omitted_when_no_transaction_is_uncategorized(self):
        rows = [transaction(1, "-7.50", "Coffee beans")]

        self.assertEqual(category_totals(rows, RULES), [("food", Decimal("-7.50"))])

    def test_no_transactions_gives_no_categories(self):
        self.assertEqual(category_totals([], RULES), [])

    def test_without_rules_everything_is_uncategorized(self):
        self.assertEqual(category_totals(LEDGER, []), [("uncategorized", Decimal("1592.50"))])

    def test_a_category_summing_to_zero_is_still_listed(self):
        rows = [transaction(1, "-5.00", "Coffee beans"), transaction(2, "5.00", "Coffee refund")]

        self.assertEqual(category_totals(rows, RULES), [("food", Decimal("0.00"))])

    def test_rule_category_named_uncategorized_merges_and_stays_last(self):
        rows = [transaction(1, "-7.50", "Coffee beans"), transaction(2, "2500.00", "Salary")]
        rules = [("coffee", "uncategorized")]

        self.assertEqual(category_totals(rows, rules), [("uncategorized", Decimal("2492.50"))])

    def test_names_differing_only_in_case_sort_together(self):
        rows = [
            transaction(1, "1.00", "aaa"),
            transaction(2, "2.00", "bbb"),
            transaction(3, "3.00", "ccc"),
        ]
        rules = [("bbb", "Food"), ("aaa", "apples"), ("ccc", "food")]

        self.assertEqual(
            [name for name, _ in category_totals(rows, rules)], ["apples", "Food", "food"]
        )


class FormatReportTest(unittest.TestCase):
    def test_matches_the_example_in_the_design(self):
        expected = (
            "food: -7.50\n"
            "housing: -900.00\n"
            "uncategorized: 2500.00\n"
            "\n"
            "closing balance: 1692.50\n"
        )

        self.assertEqual(format_report(LEDGER, RULES, Decimal("100")), expected)

    def test_no_transactions_prints_only_the_closing_balance(self):
        self.assertEqual(format_report([], RULES, Decimal("100")), "closing balance: 100.00\n")

    def test_closing_balance_uses_the_opening_amount(self):
        rows = [transaction(1, "-7.50", "Coffee beans")]

        self.assertEqual(
            format_report(rows, RULES, Decimal("0")), "food: -7.50\n\nclosing balance: -7.50\n"
        )


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `python3 -m unittest test_report -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'ledgerlite.report'`

- [ ] **Step 3: Write the implementation**

Create `ledgerlite/report.py`:

```python
"""Per-category totals and report formatting."""

from __future__ import annotations

from decimal import ROUND_HALF_UP, Decimal

from ledgerlite.balance import closing_balance
from ledgerlite.model import Transaction
from ledgerlite.rules import Rule, categorize

UNCATEGORIZED = "uncategorized"
CENTS = Decimal("0.01")


def format_amount(amount: Decimal) -> str:
    """Exactly two fractional digits, no thousands separators, no negative zero."""
    quantized = amount.quantize(CENTS, rounding=ROUND_HALF_UP)
    if quantized == 0:
        quantized = abs(quantized)
    return f"{quantized:f}"


def category_totals(
    transactions: list[Transaction], rules: list[Rule]
) -> list[tuple[str, Decimal]]:
    """Totals per category: alphabetical, with uncategorized last."""
    totals: dict[str, Decimal] = {}
    for transaction in transactions:
        category = categorize(transaction.description, rules)
        if category is None:
            category = UNCATEGORIZED
        totals[category] = totals.get(category, Decimal("0")) + transaction.amount

    named = sorted(
        (name for name in totals if name != UNCATEGORIZED), key=lambda name: (name.lower(), name)
    )
    ordered = [(name, totals[name]) for name in named]
    if UNCATEGORIZED in totals:
        ordered.append((UNCATEGORIZED, totals[UNCATEGORIZED]))
    return ordered


def format_report(
    transactions: list[Transaction], rules: list[Rule], opening: Decimal
) -> str:
    """The whole report, ending in a newline."""
    lines = [
        f"{name}: {format_amount(total)}" for name, total in category_totals(transactions, rules)
    ]
    if lines:
        lines.append("")
    lines.append(f"closing balance: {format_amount(closing_balance(opening, transactions))}")
    return "\n".join(lines) + "\n"
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `python3 -m unittest -v`
Expected: PASS — all tests OK

- [ ] **Step 5: Commit**

```bash
git add ledgerlite/report.py test_report.py
git commit -m "feat: add per-category totals and report formatting"
```

---

## Task 6: CLI entry point

The only layer that opens files, writes to stderr, and chooses exit codes. `__main__.py` is not in the spec's layout list, but the spec's `ledgerlite report ...` invocation needs some entry point, and a three-line `__main__.py` makes `python3 -m ledgerlite report ...` work without packaging metadata.

**Files:**
- Create: `ledgerlite/cli.py`
- Create: `ledgerlite/__main__.py`
- Test: `test_cli.py`

**Interfaces:**
- Consumes: `parse_transactions(text)`, `parse_amount(text)`, `ParseError(.line, .message)`, `parse_rules(text)`, `format_report(transactions, rules, opening)`.
- Produces: `ledgerlite.cli.main(argv: list[str] | None = None) -> int`.

Two details worth knowing before you write it:

- `argparse` raises `SystemExit` rather than returning, so `main` catches it and returns the code — that keeps `main(argv) -> int` honest and testable. `SystemExit(None)` (which argparse does not currently produce, but `ArgumentParser.exit()` allows) maps to 2.
- `UnicodeDecodeError` is a `ValueError`, not an `OSError`, so the read has to catch both to keep an undecodable file on the exit-1 path instead of a traceback.

- [ ] **Step 1: Write the failing test**

Create `test_cli.py`:

```python
"""Tests for ledgerlite.cli."""

import contextlib
import io
import os
import subprocess
import sys
import tempfile
import unittest

from ledgerlite.cli import main

TRANSACTIONS = (
    "date,amount,description\n"
    "2026-03-03,2500.00,Salary\n"
    "2026-03-01,-900.00,Rent March\n"
    "2026-03-02,-7.50,Coffee beans\n"
)
RULES = "coffee=food\nrent=housing\n"
EXPECTED = (
    "food: -7.50\n"
    "housing: -900.00\n"
    "uncategorized: 2500.00\n"
    "\n"
    "closing balance: 1692.50\n"
)


class CliTestCase(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory()
        self.addCleanup(self.directory.cleanup)

    def write(self, name, text, encoding="utf-8"):
        path = os.path.join(self.directory.name, name)
        with open(path, "w", encoding=encoding, newline="") as handle:
            handle.write(text)
        return path

    def write_bytes(self, name, data):
        path = os.path.join(self.directory.name, name)
        with open(path, "wb") as handle:
            handle.write(data)
        return path

    def run_main(self, argv):
        out, err = io.StringIO(), io.StringIO()
        with contextlib.redirect_stdout(out), contextlib.redirect_stderr(err):
            code = main(argv)
        return code, out.getvalue(), err.getvalue()

    def missing(self, name="nope.csv"):
        return os.path.join(self.directory.name, name)


class SuccessTest(CliTestCase):
    def test_prints_the_design_example_and_returns_zero(self):
        transactions = self.write("t.csv", TRANSACTIONS)
        rules = self.write("rules.txt", RULES)

        code, out, err = self.run_main(["report", transactions, "--rules", rules, "--opening", "100"])

        self.assertEqual(code, 0)
        self.assertEqual(out, EXPECTED)
        self.assertEqual(err, "")

    def test_opening_defaults_to_zero(self):
        transactions = self.write("t.csv", TRANSACTIONS)

        code, out, _ = self.run_main(["report", transactions])

        self.assertEqual(code, 0)
        self.assertEqual(out, "uncategorized: 1592.50\n\nclosing balance: 1592.50\n")

    def test_negative_opening_balance(self):
        transactions = self.write("t.csv", "date,amount,description\n2026-03-01,10.00,Refund\n")

        code, out, _ = self.run_main(["report", transactions, "--opening", "-2.50"])

        self.assertEqual(out, "uncategorized: 10.00\n\nclosing balance: 7.50\n")
        self.assertEqual(code, 0)

    def test_header_only_file_prints_only_the_closing_balance(self):
        transactions = self.write("t.csv", "date,amount,description\n")

        code, out, _ = self.run_main(["report", transactions, "--opening", "100"])

        self.assertEqual(code, 0)
        self.assertEqual(out, "closing balance: 100.00\n")

    def test_tolerates_a_utf8_byte_order_mark(self):
        transactions = self.write("t.csv", TRANSACTIONS, encoding="utf-8-sig")

        code, out, err = self.run_main(["report", transactions])

        self.assertEqual((code, err), (0, ""))
        self.assertIn("closing balance: 1592.50", out)


class UnreadableFileTest(CliTestCase):
    def test_missing_transactions_file_returns_one(self):
        path = self.missing()

        code, out, err = self.run_main(["report", path])

        self.assertEqual(code, 1)
        self.assertEqual(out, "")
        self.assertEqual(err, f"ledgerlite: cannot read {path}: No such file or directory\n")

    def test_directory_as_transactions_file_returns_one(self):
        code, out, err = self.run_main(["report", self.directory.name])

        self.assertEqual(code, 1)
        self.assertEqual(out, "")
        self.assertTrue(err.startswith(f"ledgerlite: cannot read {self.directory.name}: "))

    def test_undecodable_bytes_return_one(self):
        path = self.write_bytes("t.csv", b"date,amount,description\n2026-03-01,1.00,\xff\xfe\n")

        code, out, err = self.run_main(["report", path])

        self.assertEqual(code, 1)
        self.assertEqual(out, "")
        self.assertTrue(err.startswith(f"ledgerlite: cannot read {path}: "))

    def test_missing_rules_file_returns_one(self):
        transactions = self.write("t.csv", TRANSACTIONS)
        path = self.missing("rules.txt")

        code, out, err = self.run_main(["report", transactions, "--rules", path])

        self.assertEqual(code, 1)
        self.assertEqual(out, "")
        self.assertEqual(err, f"ledgerlite: cannot read {path}: No such file or directory\n")


class MalformedInputTest(CliTestCase):
    def test_bad_amount_reports_path_and_line_and_returns_two(self):
        transactions = self.write(
            "t.csv", "date,amount,description\n2026-03-01,-900.00,Rent\n2026-03-02,1.005,Coffee\n"
        )

        code, out, err = self.run_main(["report", transactions])

        self.assertEqual(code, 2)
        self.assertEqual(out, "")
        self.assertTrue(err.startswith(f"ledgerlite: {transactions}:3: "))
        self.assertIn("more than two fractional digits", err)

    def test_wrong_column_count_returns_two(self):
        transactions = self.write("t.csv", "date,amount,description\n2026-03-01,-900.00\n")

        code, out, err = self.run_main(["report", transactions])

        self.assertEqual((code, out), (2, ""))
        self.assertIn(f"{transactions}:2:", err)
        self.assertIn("expected 3 columns, found 2", err)

    def test_missing_header_returns_two(self):
        transactions = self.write("t.csv", "2026-03-01,-900.00,Rent\n")

        code, out, err = self.run_main(["report", transactions])

        self.assertEqual((code, out), (2, ""))
        self.assertIn(f"{transactions}:1:", err)
        self.assertIn("expected header date,amount,description", err)

    def test_bad_rules_line_returns_two(self):
        transactions = self.write("t.csv", TRANSACTIONS)
        rules = self.write("rules.txt", "coffee=food\noops\n")

        code, out, err = self.run_main(["report", transactions, "--rules", rules])

        self.assertEqual((code, out), (2, ""))
        self.assertIn(f"{rules}:2:", err)
        self.assertIn("expected <substring>=<category>", err)

    def test_bad_opening_amount_returns_two(self):
        transactions = self.write("t.csv", TRANSACTIONS)

        code, out, err = self.run_main(["report", transactions, "--opening", "1.005"])

        self.assertEqual((code, out), (2, ""))
        self.assertIn("--opening", err)

    def test_transactions_error_wins_when_both_files_are_bad(self):
        transactions = self.write("t.csv", "date,amount,description\n2026-03-01,nope,Rent\n")
        rules = self.write("rules.txt", "oops\n")

        code, _, err = self.run_main(["report", transactions, "--rules", rules])

        self.assertEqual(code, 2)
        self.assertIn(transactions, err)
        self.assertNotIn(rules, err)

    def test_missing_subcommand_returns_two(self):
        code, out, err = self.run_main([])

        self.assertEqual((code, out), (2, ""))
        self.assertIn("usage:", err)


class ModuleEntryPointTest(CliTestCase):
    def test_python_m_ledgerlite_prints_the_report(self):
        transactions = self.write("t.csv", TRANSACTIONS)
        rules = self.write("rules.txt", RULES)

        completed = subprocess.run(
            [
                sys.executable, "-m", "ledgerlite", "report", transactions,
                "--rules", rules, "--opening", "100",
            ],
            capture_output=True,
            text=True,
            cwd=os.path.dirname(os.path.abspath(__file__)),
        )

        self.assertEqual(completed.returncode, 0, completed.stderr)
        self.assertEqual(completed.stdout, EXPECTED)


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `python3 -m unittest test_cli -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'ledgerlite.cli'`

- [ ] **Step 3: Write the implementation**

Create `ledgerlite/cli.py`:

```python
"""argparse entry point: the only layer that touches files, stderr, and exit codes."""

from __future__ import annotations

import argparse
import sys
from decimal import Decimal

from ledgerlite.parse import ParseError, parse_amount, parse_transactions
from ledgerlite.report import format_report
from ledgerlite.rules import parse_rules

PROGRAM = "ledgerlite"


def _opening_amount(text: str) -> Decimal:
    try:
        return parse_amount(text)
    except ValueError as error:
        raise argparse.ArgumentTypeError(str(error)) from None


def _build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(prog=PROGRAM)
    subcommands = parser.add_subparsers(dest="command", required=True)
    report = subcommands.add_parser("report", help="print a per-category summary")
    report.add_argument("transactions", help="path to the transactions CSV")
    report.add_argument("--rules", help="path to the rules file")
    report.add_argument(
        "--opening",
        type=_opening_amount,
        default=Decimal("0"),
        metavar="AMOUNT",
        help="opening balance (default: 0)",
    )
    return parser


def _read(path: str) -> str:
    with open(path, encoding="utf-8-sig", newline="") as handle:
        return handle.read()


def _reason(error: Exception) -> str:
    if isinstance(error, OSError) and error.strerror:
        return error.strerror
    if isinstance(error, UnicodeDecodeError):
        return "not valid UTF-8 text"
    return str(error)


def _fail(message: str) -> None:
    print(f"{PROGRAM}: {message}", file=sys.stderr)


def main(argv: list[str] | None = None) -> int:
    parser = _build_parser()
    try:
        args = parser.parse_args(argv)
    except SystemExit as exit_request:
        return 2 if exit_request.code is None else int(exit_request.code)

    try:
        transactions_text = _read(args.transactions)
    except (OSError, UnicodeDecodeError) as error:
        _fail(f"cannot read {args.transactions}: {_reason(error)}")
        return 1
    try:
        transactions = parse_transactions(transactions_text)
    except ParseError as error:
        _fail(f"{args.transactions}:{error.line}: {error.message}")
        return 2

    rules = []
    if args.rules is not None:
        try:
            rules_text = _read(args.rules)
        except (OSError, UnicodeDecodeError) as error:
            _fail(f"cannot read {args.rules}: {_reason(error)}")
            return 1
        try:
            rules = parse_rules(rules_text)
        except ParseError as error:
            _fail(f"{args.rules}:{error.line}: {error.message}")
            return 2

    sys.stdout.write(format_report(transactions, rules, args.opening))
    return 0
```

Create `ledgerlite/__main__.py`:

```python
"""Support `python3 -m ledgerlite report ...`."""

import sys

from ledgerlite.cli import main

if __name__ == "__main__":
    sys.exit(main())
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `python3 -m unittest -v`
Expected: PASS — every test in all six `test_*.py` files, OK

- [ ] **Step 5: Check the design's example by hand**

```bash
printf 'date,amount,description\n2026-03-03,2500.00,Salary\n2026-03-01,-900.00,Rent March\n2026-03-02,-7.50,Coffee beans\n' > /tmp/ledgerlite-t.csv
printf 'coffee=food\nrent=housing\n' > /tmp/ledgerlite-rules.txt
python3 -m ledgerlite report /tmp/ledgerlite-t.csv --rules /tmp/ledgerlite-rules.txt --opening 100
echo "exit: $?"
```

Expected, matching `design.md` exactly:

```
food: -7.50
housing: -900.00
uncategorized: 2500.00

closing balance: 1692.50
exit: 0
```

- [ ] **Step 6: Confirm no floats crept in**

Run: `grep -rn "float" ledgerlite/`
Expected: no output.

- [ ] **Step 7: Commit**

```bash
git add ledgerlite/cli.py ledgerlite/__main__.py test_cli.py
git commit -m "feat: add ledgerlite report CLI with exit codes 0/1/2"
```
