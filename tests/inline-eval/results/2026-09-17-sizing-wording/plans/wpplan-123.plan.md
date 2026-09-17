# ledgerlite Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `ledgerlite`, a standard-library-only Python CLI that reads a bank-transaction CSV, categorizes each row with a rules file, and prints per-category totals plus a closing balance.

**Architecture:** Five small pure modules plus a thin CLI. `parse.py` turns CSV *text* into `Transaction` objects or raises `ParseError` (no file I/O, so it is trivially testable); `rules.py` turns rules *text* into `(substring, category)` pairs and applies them; `balance.py` owns date ordering and the running balance; `report.py` owns totals and every bit of number formatting; `cli.py` is the only module that touches the filesystem, `sys.stdout`/`sys.stderr`, and exit codes. All money is `decimal.Decimal` end to end — no float ever appears.

**Tech Stack:** Python 3.11+, standard library only (`csv`, `decimal`, `datetime`, `argparse`, `pathlib`, `re`, `dataclasses`), tests with `unittest`.

**Spec:** `design.md` (repo root)

## Global Constraints

- Python 3.11 or newer. Standard library only — no third-party dependencies, no `pyproject.toml` needed.
- Money is `decimal.Decimal` everywhere. Never `float`, not even in a test assertion.
- Package layout is exactly the seven files in `design.md`: `ledgerlite/{__init__,model,parse,rules,balance,report,cli}.py`.
- Tests live at the **repo root** as `test_<module>.py` and must pass with `python3 -m unittest` run from the repo root.
- Exit codes: `0` success, `1` transactions (or rules) file cannot be read, `2` a malformed row.
- Error messages go to stderr, verbatim shapes:
  - `ledgerlite: cannot read <path>: <reason>`
  - `ledgerlite: <path>:<line>: <what is wrong>`
- Amounts print with exactly two fractional digits, a leading `-` for negatives, no thousands separators: `-12.50`, `0.00`, `1200.00`.
- On exit code 2, **nothing** is written to stdout.
- Work directly on `main`. This is a local scratch repo with no remote — never `git push`.

## Review Focus

Behaviors the spec implies but does not spell out. Each line has a test in the task named at the end; a reviewer should confirm that test exists and pins the stated behavior.

- `decimal.Decimal` happily accepts `1e5`, `NaN`, `Infinity`, `1_000` — the spec says "a decimal number with up to two fractional digits", so these are malformed rows, not amounts. (Task 1)
- `datetime.date.fromisoformat` on 3.11+ accepts `20260304` and `2026-03-04T00:00:00` — the spec says ISO `2026-03-04`, so parsing must be strict about the shape before it is strict about the calendar. (Task 1)
- A blank line inside the CSV is a row with zero columns, so it is a malformed row. A file ending in a single newline is normal and yields no extra row. (Task 1)
- A missing or misspelled header row must not be silently consumed as data — otherwise the first real transaction vanishes from the report. (Task 1)
- A quoted description containing a comma is one field, and the reported line number must stay right even when a quoted field spans lines. (Task 1)
- Rules lines that are blank, have no `=`, or have nothing on one side of the `=` are ignored rather than producing a rule that matches everything or a nameless category. (Task 2)
- Matching is case-insensitive in both directions: a lowercase rule matches an uppercase description and vice versa. (Task 2)
- Two rows sharing a date must keep input order — the spec asks for it, and `sorted` being stable is the only reason it holds. (Task 3)
- Rounding a tiny negative sum can produce `-0.00`; the spec prints `0.00`. (Task 4)
- A rules file may name a category `uncategorized`; it must merge with the unmatched rows and stay last. (Task 4)
- "Alphabetically" for a human means `beer` before `Food`, which a plain `sorted()` gets wrong. (Task 4)
- A header-only file has zero transactions: the report is a blank line then `closing balance: <opening>`. (Task 4, Task 5)
- Six-figure totals must not gain thousands separators or scientific notation. (Task 4)
- `--rules` pointing at an unreadable file is a read failure too, and gets the same `cannot read` message and exit 1. (Task 5)
- A path that is a directory, and a file that is not valid UTF-8, are both read failures (exit 1), not malformed rows. (Task 5)
- A malformed `--opening` value must be rejected by the same rule as a row amount rather than silently becoming something else. (Task 5)

---

### Task 1: Package skeleton, `Transaction`, and the CSV parser

The parser is the whole risk surface of this program, so it lands first and complete. It takes **text**, not a path — file I/O belongs to Task 5.

**Files:**
- Create: `ledgerlite/__init__.py`
- Create: `ledgerlite/model.py`
- Create: `ledgerlite/parse.py`
- Test: `test_parse.py`

**Interfaces:**
- Consumes: nothing (first task).
- Produces:
  - `ledgerlite.model.Transaction` — frozen dataclass with fields `date: datetime.date`, `amount: Decimal`, `description: str`.
  - `ledgerlite.parse.parse_transactions(text: str) -> list[Transaction]` — rows in file order; raises `ParseError`.
  - `ledgerlite.parse.parse_amount(raw: str) -> Decimal` — shared amount rule; raises `ValueError`. Task 5 reuses this for `--opening`.
  - `ledgerlite.parse.ParseError(Exception)` with attributes `line: int` (1-based, counting the header) and `message: str`.

There is deliberately no `test_model.py`: `Transaction` is a dataclass with no behavior, and every test in this plan constructs one. Do not add a test that only checks that a dataclass stores its arguments.

- [ ] **Step 1: Create the package files with the module docstrings only**

`ledgerlite/__init__.py`:

```python
"""ledgerlite — categorize a CSV of bank transactions and total it up."""
```

`ledgerlite/model.py`:

```python
"""The one data type ledgerlite moves around."""

from __future__ import annotations

import datetime
from dataclasses import dataclass
from decimal import Decimal


@dataclass(frozen=True)
class Transaction:
    date: datetime.date
    amount: Decimal
    description: str
```

`ledgerlite/parse.py`:

```python
"""Turn transactions-CSV text into Transaction objects."""
```

Note the `import datetime` in `model.py` rather than `from datetime import date`: the dataclass has a field named `date`, and importing the module keeps the annotation `datetime.date` unambiguous.

- [ ] **Step 2: Write the failing tests**

Write all of `test_parse.py`:

```python
import unittest
from datetime import date
from decimal import Decimal

from ledgerlite.parse import ParseError, parse_amount, parse_transactions

HEADER = "date,amount,description\n"


def fields(transaction):
    return (transaction.date, transaction.amount, transaction.description)


class ParseTransactionsTest(unittest.TestCase):
    def test_keeps_rows_in_file_order(self):
        text = HEADER + "2026-03-04,-7.50,Coffee Bar\n2026-03-01,2500.00,Salary\n"
        self.assertEqual(
            [fields(t) for t in parse_transactions(text)],
            [
                (date(2026, 3, 4), Decimal("-7.50"), "Coffee Bar"),
                (date(2026, 3, 1), Decimal("2500.00"), "Salary"),
            ],
        )

    def test_amount_is_a_decimal_not_a_float(self):
        transaction = parse_transactions(HEADER + "2026-03-04,0.10,Tip\n")[0]
        self.assertIsInstance(transaction.amount, Decimal)
        self.assertEqual(transaction.amount, Decimal("0.10"))

    def test_accepts_zero_one_and_two_fractional_digits(self):
        text = HEADER + "2026-03-01,5,a\n2026-03-02,1.5,b\n2026-03-03,1.50,c\n"
        self.assertEqual(
            [t.amount for t in parse_transactions(text)],
            [Decimal("5"), Decimal("1.5"), Decimal("1.50")],
        )

    def test_accepts_explicit_plus_sign(self):
        text = HEADER + "2026-03-01,+12.34,a\n"
        self.assertEqual(parse_transactions(text)[0].amount, Decimal("12.34"))

    def test_header_only_file_has_no_transactions(self):
        self.assertEqual(parse_transactions(HEADER), [])

    def test_trailing_newline_does_not_add_a_row(self):
        self.assertEqual(len(parse_transactions(HEADER + "2026-03-01,1.00,a\n")), 1)

    def test_quoted_description_may_contain_a_comma(self):
        text = HEADER + '2026-03-01,-1.00,"Bakery, Main St"\n'
        self.assertEqual(parse_transactions(text)[0].description, "Bakery, Main St")

    def test_ignores_whitespace_around_date_and_amount(self):
        text = HEADER + "2026-03-01 , -7.50 ,Coffee\n"
        self.assertEqual(
            fields(parse_transactions(text)[0]),
            (date(2026, 3, 1), Decimal("-7.50"), "Coffee"),
        )


class ParseErrorTest(unittest.TestCase):
    def assert_rejects(self, text, line, expected_in_message):
        with self.assertRaises(ParseError) as caught:
            parse_transactions(text)
        self.assertEqual(caught.exception.line, line)
        self.assertIn(expected_in_message, caught.exception.message)

    def test_rejects_more_than_two_fractional_digits(self):
        self.assert_rejects(HEADER + "2026-03-01,1.005,a\n", 2, "amount")

    def test_rejects_non_numeric_amount(self):
        self.assert_rejects(HEADER + "2026-03-01,twelve,a\n", 2, "amount")

    def test_rejects_empty_amount(self):
        self.assert_rejects(HEADER + "2026-03-01,,a\n", 2, "amount")

    def test_rejects_amounts_decimal_would_otherwise_accept(self):
        for raw in ("1e5", "NaN", "Infinity", "-Infinity", "1_000", "1,000"):
            with self.subTest(raw=raw):
                self.assert_rejects(HEADER + f'2026-03-01,"{raw}",a\n', 2, "amount")

    def test_rejects_dates_that_are_not_yyyy_mm_dd(self):
        for raw in ("04/03/2026", "20260304", "2026-03-04T00:00:00", "2026-3-4", ""):
            with self.subTest(raw=raw):
                self.assert_rejects(HEADER + f"{raw},1.00,a\n", 2, "date")

    def test_rejects_impossible_date(self):
        self.assert_rejects(HEADER + "2026-13-01,1.00,a\n", 2, "date")

    def test_rejects_too_few_columns(self):
        self.assert_rejects(HEADER + "2026-03-01,1.00\n", 2, "columns")

    def test_rejects_too_many_columns(self):
        self.assert_rejects(HEADER + "2026-03-01,1.00,a,extra\n", 2, "columns")

    def test_rejects_blank_line_between_rows(self):
        self.assert_rejects(HEADER + "2026-03-01,1.00,a\n\n2026-03-02,1.00,b\n", 3, "columns")

    def test_rejects_missing_header(self):
        self.assert_rejects("2026-03-01,1.00,a\n", 1, "header")

    def test_rejects_misspelled_header(self):
        self.assert_rejects("date,value,description\n", 1, "header")

    def test_rejects_empty_file(self):
        self.assert_rejects("", 1, "header")

    def test_line_number_counts_the_header(self):
        text = HEADER + "2026-03-01,1.00,a\n2026-03-02,1.00,b\n2026-03-03,oops,c\n"
        self.assert_rejects(text, 4, "amount")

    def test_line_number_survives_a_multiline_quoted_field(self):
        text = HEADER + '2026-03-01,1.00,"two\nlines"\n2026-03-02,oops,b\n'
        self.assert_rejects(text, 4, "amount")


class ParseAmountTest(unittest.TestCase):
    def test_parses_a_plain_amount(self):
        self.assertEqual(parse_amount("-12.50"), Decimal("-12.50"))

    def test_raises_value_error_on_a_bad_amount(self):
        with self.assertRaises(ValueError):
            parse_amount("1.005")
```

- [ ] **Step 3: Run the tests to verify they fail**

Run: `python3 -m unittest test_parse -v`
Expected: FAIL — `ImportError: cannot import name 'ParseError' from 'ledgerlite.parse'`

- [ ] **Step 4: Write the parser**

Replace `ledgerlite/parse.py` with:

```python
"""Turn transactions-CSV text into Transaction objects."""

from __future__ import annotations

import csv
import datetime
import io
import re
from decimal import Decimal

from ledgerlite.model import Transaction

HEADER = ["date", "amount", "description"]

# A date is exactly YYYY-MM-DD. date.fromisoformat() is looser than the spec
# (it takes "20260304" and "2026-03-04T00:00"), so check the shape first.
_DATE_RE = re.compile(r"\A\d{4}-\d{2}-\d{2}\Z")

# An amount is an optionally signed decimal number with at most two fractional
# digits. Decimal() is looser than the spec (it takes "1e5", "NaN", "1_000"),
# so this pattern -- not Decimal -- decides what is well formed.
_AMOUNT_RE = re.compile(r"\A[+-]?(?:\d+(?:\.\d{1,2})?|\.\d{1,2})\Z")

_MISSING_HEADER = "missing header row: expected date,amount,description"


class ParseError(Exception):
    """A row of the transactions CSV could not be understood.

    `line` is the 1-based line number in the file, counting the header.
    `message` is the "<what is wrong>" half of the CLI's error message; the
    caller knows the path and prefixes it.
    """

    def __init__(self, line: int, message: str) -> None:
        super().__init__(f"{line}: {message}")
        self.line = line
        self.message = message


def parse_amount(raw: str) -> Decimal:
    """Parse an amount string. Raises ValueError if it is not well formed.

    Row amounts and --opening share this one rule, and therefore share one
    wording of the complaint when it is broken.
    """
    text = raw.strip()
    if not _AMOUNT_RE.match(text):
        raise ValueError(
            f"bad amount {text!r}: expected a number with at most two decimal places"
        )
    return Decimal(text)


def parse_transactions(text: str) -> list[Transaction]:
    """Parse whole-file CSV text. Raises ParseError on the first bad row."""
    reader = csv.reader(io.StringIO(text, newline=""))
    try:
        header = next(reader)
    except StopIteration:
        raise ParseError(1, _MISSING_HEADER) from None
    if [field.strip().lower() for field in header] != HEADER:
        raise ParseError(1, _MISSING_HEADER)

    transactions: list[Transaction] = []
    try:
        for row in reader:
            line = reader.line_num
            if len(row) != 3:
                raise ParseError(line, f"expected 3 columns, got {len(row)}")
            raw_date, raw_amount, description = row
            transactions.append(
                Transaction(
                    date=_parse_date(raw_date, line),
                    amount=_row_amount(raw_amount, line),
                    description=description,
                )
            )
    except csv.Error as error:
        raise ParseError(reader.line_num, f"unreadable CSV: {error}") from None
    return transactions


def _parse_date(raw: str, line: int) -> datetime.date:
    text = raw.strip()
    if not _DATE_RE.match(text):
        raise ParseError(line, f"bad date {text!r}: expected YYYY-MM-DD")
    try:
        return datetime.date.fromisoformat(text)
    except ValueError:
        raise ParseError(line, f"bad date {text!r}: not a real date") from None


def _row_amount(raw: str, line: int) -> Decimal:
    try:
        return parse_amount(raw)
    except ValueError as error:
        raise ParseError(line, str(error)) from None
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `python3 -m unittest test_parse -v`
Expected: PASS, all tests, no errors.

- [ ] **Step 6: Commit**

```bash
git add ledgerlite/__init__.py ledgerlite/model.py ledgerlite/parse.py test_parse.py
git commit -m "feat: parse transactions CSV into Transaction objects"
```

---

### Task 2: Rules parsing and categorization

**Files:**
- Create: `ledgerlite/rules.py`
- Test: `test_rules.py`

**Interfaces:**
- Consumes: nothing from Task 1.
- Produces:
  - `ledgerlite.rules.Rule` — type alias `tuple[str, str]`, i.e. `(substring, category)`.
  - `ledgerlite.rules.parse_rules(text: str) -> list[Rule]` — file order preserved; both sides stripped; lines that are blank, lack an `=`, or have an empty side are dropped.
  - `ledgerlite.rules.categorize(description: str, rules: list[Rule]) -> str | None` — first match wins, case-insensitive, `None` when nothing matches.

- [ ] **Step 1: Write the failing tests**

Write all of `test_rules.py`:

```python
import unittest

from ledgerlite.rules import categorize, parse_rules


class ParseRulesTest(unittest.TestCase):
    def test_parses_one_rule_per_line_in_order(self):
        self.assertEqual(
            parse_rules("coffee=food\nrent=housing\n"),
            [("coffee", "food"), ("rent", "housing")],
        )

    def test_strips_whitespace_around_both_sides(self):
        self.assertEqual(parse_rules("  coffee  =  food  \n"), [("coffee", "food")])

    def test_handles_crlf_line_endings(self):
        self.assertEqual(
            parse_rules("coffee=food\r\nrent=housing\r\n"),
            [("coffee", "food"), ("rent", "housing")],
        )

    def test_splits_on_the_first_equals_only(self):
        self.assertEqual(parse_rules("a=b=c\n"), [("a", "b=c")])

    def test_ignores_blank_and_whitespace_only_lines(self):
        self.assertEqual(parse_rules("\ncoffee=food\n   \n"), [("coffee", "food")])

    def test_ignores_lines_without_an_equals(self):
        self.assertEqual(parse_rules("nonsense\ncoffee=food\n"), [("coffee", "food")])

    def test_ignores_lines_with_an_empty_side(self):
        self.assertEqual(parse_rules("=food\ncoffee=\n=\n"), [])

    def test_empty_text_is_no_rules(self):
        self.assertEqual(parse_rules(""), [])


class CategorizeTest(unittest.TestCase):
    RULES = [("coffee", "food"), ("rent", "housing")]

    def test_matches_a_substring_of_the_description(self):
        self.assertEqual(categorize("Coffee Bar #12", self.RULES), "food")

    def test_returns_none_when_no_rule_matches(self):
        self.assertIsNone(categorize("Salary", self.RULES))

    def test_returns_none_when_there_are_no_rules(self):
        self.assertIsNone(categorize("Coffee Bar", []))

    def test_lowercase_rule_matches_uppercase_description(self):
        self.assertEqual(categorize("MONTHLY RENT", self.RULES), "housing")

    def test_uppercase_rule_matches_lowercase_description(self):
        self.assertEqual(categorize("monthly rent", [("RENT", "housing")]), "housing")

    def test_first_matching_rule_wins(self):
        rules = [("coffee", "food"), ("coffee bar", "treats")]
        self.assertEqual(categorize("Coffee Bar", rules), "food")

    def test_first_match_wins_by_file_order_not_by_specificity(self):
        rules = [("bar", "nightlife"), ("coffee", "food")]
        self.assertEqual(categorize("Coffee Bar", rules), "nightlife")
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `python3 -m unittest test_rules -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'ledgerlite.rules'`

- [ ] **Step 3: Write the implementation**

`ledgerlite/rules.py`:

```python
"""Turn rules-file text into (substring, category) pairs and apply them."""

from __future__ import annotations

Rule = tuple[str, str]


def parse_rules(text: str) -> list[Rule]:
    """Parse rules text, one `<substring>=<category>` per line.

    A line contributes a rule only if it contains an "=" with non-blank text on
    both sides; anything else (blank lines, notes, a stray "=") is ignored. The
    rules file has no error path in the spec, so an unusable line is skipped
    rather than being turned into a rule that matches everything or a category
    with no name.
    """
    rules: list[Rule] = []
    for line in text.splitlines():
        substring, separator, category = line.partition("=")
        substring = substring.strip()
        category = category.strip()
        if not separator or not substring or not category:
            continue
        rules.append((substring, category))
    return rules


def categorize(description: str, rules: list[Rule]) -> str | None:
    """Return the category of the first rule matching `description`, else None."""
    lowered = description.lower()
    for substring, category in rules:
        if substring.lower() in lowered:
            return category
    return None
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `python3 -m unittest test_rules -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add ledgerlite/rules.py test_rules.py
git commit -m "feat: parse rules file and categorize descriptions"
```

---

### Task 3: Date ordering and the closing balance

**Files:**
- Create: `ledgerlite/balance.py`
- Test: `test_balance.py`

**Interfaces:**
- Consumes: `ledgerlite.model.Transaction` (Task 1).
- Produces:
  - `ledgerlite.balance.sort_transactions(transactions: Iterable[Transaction]) -> list[Transaction]` — ordered by date, input order kept within a date.
  - `ledgerlite.balance.closing_balance(opening: Decimal, transactions: Iterable[Transaction]) -> Decimal` — opening plus every amount, added in date order; returns `opening` unchanged when there are no transactions.

- [ ] **Step 1: Write the failing tests**

Write all of `test_balance.py`:

```python
import unittest
from datetime import date
from decimal import Decimal

from ledgerlite.balance import closing_balance, sort_transactions
from ledgerlite.model import Transaction


def transaction(day, amount, description="x"):
    return Transaction(date=date(2026, 3, day), amount=Decimal(amount),
                       description=description)


class SortTransactionsTest(unittest.TestCase):
    def test_orders_by_date(self):
        rows = [transaction(4, "1.00", "c"), transaction(1, "1.00", "a"),
                transaction(2, "1.00", "b")]
        self.assertEqual([t.description for t in sort_transactions(rows)],
                         ["a", "b", "c"])

    def test_same_date_keeps_input_order(self):
        rows = [transaction(1, "1.00", "second"), transaction(1, "1.00", "first")]
        # Input order, not description order: the sort must be stable.
        self.assertEqual([t.description for t in sort_transactions(rows)],
                         ["second", "first"])

    def test_same_date_keeps_input_order_across_an_earlier_row(self):
        rows = [transaction(2, "1.00", "b1"), transaction(1, "1.00", "a"),
                transaction(2, "1.00", "b2")]
        self.assertEqual([t.description for t in sort_transactions(rows)],
                         ["a", "b1", "b2"])

    def test_does_not_mutate_its_input(self):
        rows = [transaction(4, "1.00", "c"), transaction(1, "1.00", "a")]
        sort_transactions(rows)
        self.assertEqual([t.description for t in rows], ["c", "a"])

    def test_empty_input(self):
        self.assertEqual(sort_transactions([]), [])


class ClosingBalanceTest(unittest.TestCase):
    def test_no_transactions_returns_the_opening_amount(self):
        self.assertEqual(closing_balance(Decimal("100"), []), Decimal("100"))

    def test_adds_every_amount(self):
        rows = [transaction(4, "-7.50"), transaction(1, "2500.00"),
                transaction(2, "-900.00")]
        self.assertEqual(closing_balance(Decimal("100"), rows), Decimal("1692.50"))

    def test_result_is_exact_decimal_arithmetic(self):
        rows = [transaction(1, "0.10")] * 3
        self.assertEqual(closing_balance(Decimal("0"), rows), Decimal("0.30"))

    def test_negative_closing_balance(self):
        rows = [transaction(1, "-150.25")]
        self.assertEqual(closing_balance(Decimal("100.00"), rows), Decimal("-50.25"))

    def test_returns_a_decimal(self):
        self.assertIsInstance(closing_balance(Decimal("0"), []), Decimal)
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `python3 -m unittest test_balance -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'ledgerlite.balance'`

- [ ] **Step 3: Write the implementation**

`ledgerlite/balance.py`:

```python
"""Date ordering and the running balance."""

from __future__ import annotations

from collections.abc import Iterable
from decimal import Decimal

from ledgerlite.model import Transaction


def sort_transactions(transactions: Iterable[Transaction]) -> list[Transaction]:
    """Order transactions by date.

    Python's sort is stable, which is exactly what "ties keeping input order"
    needs -- do not add a secondary sort key, it would break that.
    """
    return sorted(transactions, key=lambda transaction: transaction.date)


def closing_balance(opening: Decimal, transactions: Iterable[Transaction]) -> Decimal:
    """The running balance after the last transaction, in date order."""
    balance = opening
    for transaction in sort_transactions(transactions):
        balance += transaction.amount
    return balance
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `python3 -m unittest test_balance -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add ledgerlite/balance.py test_balance.py
git commit -m "feat: date-ordered running balance"
```

---

### Task 4: Category totals and report formatting

Every character of the printed report is decided here, so this task owns all number formatting. `cli.py` will only write the string this module returns.

**Files:**
- Create: `ledgerlite/report.py`
- Test: `test_report.py`

**Interfaces:**
- Consumes: `Transaction` (Task 1), `Rule`/`categorize` (Task 2), `sort_transactions`/`closing_balance` (Task 3).
- Produces:
  - `ledgerlite.report.UNCATEGORIZED` — the string `"uncategorized"`.
  - `ledgerlite.report.format_amount(amount: Decimal) -> str` — exactly two fractional digits, no separators, never `-0.00`.
  - `ledgerlite.report.category_totals(transactions, rules) -> list[tuple[str, Decimal]]` — alphabetical by category, `uncategorized` last; categories with no transactions do not appear.
  - `ledgerlite.report.format_report(opening: Decimal, transactions, rules) -> str` — the whole report, ending in a single newline.

- [ ] **Step 1: Write the failing tests**

Write all of `test_report.py`:

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


def transaction(day, amount, description):
    return Transaction(date=date(2026, 3, day), amount=Decimal(amount),
                       description=description)


EXAMPLE = [
    transaction(4, "-7.50", "Coffee Bar"),
    transaction(1, "2500.00", "Salary"),
    transaction(2, "-900.00", "Monthly Rent"),
]
EXAMPLE_RULES = [("coffee", "food"), ("rent", "housing")]


class FormatAmountTest(unittest.TestCase):
    def test_two_fractional_digits(self):
        self.assertEqual(format_amount(Decimal("-12.50")), "-12.50")

    def test_pads_to_two_digits(self):
        self.assertEqual(format_amount(Decimal("1200")), "1200.00")
        self.assertEqual(format_amount(Decimal("1.5")), "1.50")

    def test_zero(self):
        self.assertEqual(format_amount(Decimal("0")), "0.00")

    def test_negative_zero_prints_as_zero(self):
        self.assertEqual(format_amount(Decimal("-0.00")), "0.00")
        self.assertEqual(format_amount(Decimal("-0")), "0.00")

    def test_no_thousands_separators(self):
        self.assertEqual(format_amount(Decimal("1234567.89")), "1234567.89")

    def test_no_scientific_notation(self):
        self.assertEqual(format_amount(Decimal("1E+3")), "1000.00")


class CategoryTotalsTest(unittest.TestCase):
    def test_sums_per_category_alphabetically_with_uncategorized_last(self):
        self.assertEqual(
            category_totals(EXAMPLE, EXAMPLE_RULES),
            [("food", Decimal("-7.50")), ("housing", Decimal("-900.00")),
             (UNCATEGORIZED, Decimal("2500.00"))],
        )

    def test_sums_several_transactions_into_one_category(self):
        rows = [transaction(1, "-7.50", "Coffee Bar"),
                transaction(2, "-2.25", "coffee cart")]
        self.assertEqual(category_totals(rows, [("coffee", "food")]),
                         [("food", Decimal("-9.75"))])

    def test_no_rules_means_everything_is_uncategorized(self):
        self.assertEqual(category_totals(EXAMPLE, []),
                         [(UNCATEGORIZED, Decimal("1592.50"))])

    def test_uncategorized_is_omitted_when_every_row_matched(self):
        rows = [transaction(1, "-7.50", "Coffee Bar")]
        self.assertEqual(category_totals(rows, [("coffee", "food")]),
                         [("food", Decimal("-7.50"))])

    def test_no_transactions_means_no_category_lines(self):
        self.assertEqual(category_totals([], EXAMPLE_RULES), [])

    def test_alphabetical_order_ignores_case(self):
        rows = [transaction(1, "-1.00", "aa"), transaction(2, "-2.00", "bb"),
                transaction(3, "-3.00", "cc")]
        rules = [("aa", "Zebra"), ("bb", "apple"), ("cc", "Banana")]
        self.assertEqual([name for name, _ in category_totals(rows, rules)],
                         ["apple", "Banana", "Zebra"])

    def test_a_rule_category_named_uncategorized_merges_and_stays_last(self):
        rows = [transaction(1, "-1.00", "Coffee"), transaction(2, "-2.00", "Mystery"),
                transaction(3, "-4.00", "Rent")]
        rules = [("coffee", "uncategorized"), ("rent", "housing")]
        self.assertEqual(
            category_totals(rows, rules),
            [("housing", Decimal("-4.00")), (UNCATEGORIZED, Decimal("-3.00"))],
        )


class FormatReportTest(unittest.TestCase):
    def test_matches_the_example_from_the_design(self):
        self.assertEqual(
            format_report(Decimal("100"), EXAMPLE, EXAMPLE_RULES),
            "food: -7.50\n"
            "housing: -900.00\n"
            "uncategorized: 2500.00\n"
            "\n"
            "closing balance: 1692.50\n",
        )

    def test_no_transactions_reports_the_opening_balance(self):
        self.assertEqual(format_report(Decimal("100"), [], EXAMPLE_RULES),
                         "\nclosing balance: 100.00\n")

    def test_ends_with_exactly_one_newline(self):
        report = format_report(Decimal("0"), EXAMPLE, EXAMPLE_RULES)
        self.assertTrue(report.endswith("\n"))
        self.assertFalse(report.endswith("\n\n"))
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `python3 -m unittest test_report -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'ledgerlite.report'`

- [ ] **Step 3: Write the implementation**

`ledgerlite/report.py`:

```python
"""Per-category totals and the report text."""

from __future__ import annotations

from collections.abc import Iterable
from decimal import Decimal

from ledgerlite.balance import closing_balance, sort_transactions
from ledgerlite.model import Transaction
from ledgerlite.rules import Rule, categorize

UNCATEGORIZED = "uncategorized"

_CENTS = Decimal("0.01")
_ZERO = Decimal("0")


def format_amount(amount: Decimal) -> str:
    """Format money: two fractional digits, no separators, no scientific notation."""
    # quantize() both pads short values and forces a -2 exponent, which is what
    # keeps str() from ever reaching for scientific notation.
    quantized = amount.quantize(_CENTS)
    if quantized == _ZERO:
        quantized = abs(quantized)  # "-0.00" is not a thing we print
    return str(quantized)


def category_totals(
    transactions: Iterable[Transaction], rules: list[Rule]
) -> list[tuple[str, Decimal]]:
    """Total each category: alphabetical, uncategorized last, empty ones absent."""
    totals: dict[str, Decimal] = {}
    for transaction in sort_transactions(transactions):
        category = categorize(transaction.description, rules)
        name = UNCATEGORIZED if category is None else category
        totals[name] = totals.get(name, _ZERO) + transaction.amount

    # Case-insensitive so "beer" sorts before "Food" the way a reader expects;
    # the raw name breaks ties so the order is never arbitrary.
    named = sorted(
        (name for name in totals if name != UNCATEGORIZED),
        key=lambda name: (name.lower(), name),
    )
    ordered = [(name, totals[name]) for name in named]
    if UNCATEGORIZED in totals:
        ordered.append((UNCATEGORIZED, totals[UNCATEGORIZED]))
    return ordered


def format_report(
    opening: Decimal, transactions: Iterable[Transaction], rules: list[Rule]
) -> str:
    """The whole report, ending in a newline, ready to write to stdout."""
    transactions = list(transactions)
    lines = [
        f"{name}: {format_amount(total)}"
        for name, total in category_totals(transactions, rules)
    ]
    lines.append("")
    lines.append(f"closing balance: {format_amount(closing_balance(opening, transactions))}")
    return "\n".join(lines) + "\n"
```

`format_report` materializes `transactions` because it walks them twice (totals and balance) — passing a generator would otherwise silently produce a report with no category lines.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `python3 -m unittest test_report -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add ledgerlite/report.py test_report.py
git commit -m "feat: per-category totals and report formatting"
```

---

### Task 5: CLI, exit codes, and error messages

**Files:**
- Create: `ledgerlite/cli.py`
- Test: `test_cli.py`

**Interfaces:**
- Consumes: `parse_amount`, `parse_transactions`, `ParseError` (Task 1), `parse_rules` (Task 2), `format_report` (Task 4).
- Produces:
  - `ledgerlite.cli.main(argv: list[str] | None = None) -> int` — the entry point; returns the exit code and never calls `sys.exit` itself except under `python3 -m ledgerlite.cli`.
  - `ledgerlite.cli.PROGRAM` — the string `"ledgerlite"` used in every message.

- [ ] **Step 1: Write the failing tests**

Write all of `test_cli.py`:

```python
import contextlib
import io
import os
import pathlib
import subprocess
import sys
import tempfile
import unittest

from ledgerlite.cli import main

TRANSACTIONS = (
    "date,amount,description\n"
    "2026-03-04,-7.50,Coffee Bar\n"
    "2026-03-01,2500.00,Salary\n"
    "2026-03-02,-900.00,Monthly Rent\n"
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
        self.root = pathlib.Path(self.directory.name)

    def write(self, name, text):
        path = self.root / name
        path.write_text(text, encoding="utf-8")
        return str(path)

    def run_cli(self, *argv):
        out, err = io.StringIO(), io.StringIO()
        with contextlib.redirect_stdout(out), contextlib.redirect_stderr(err):
            code = main(list(argv))
        return code, out.getvalue(), err.getvalue()


class SuccessTest(CliTestCase):
    def test_prints_the_design_example(self):
        code, out, err = self.run_cli(
            "report", self.write("t.csv", TRANSACTIONS),
            "--rules", self.write("r.txt", RULES), "--opening", "100",
        )
        self.assertEqual((code, out, err), (0, EXPECTED, ""))

    def test_opening_defaults_to_zero(self):
        code, out, _ = self.run_cli("report", self.write("t.csv", TRANSACTIONS))
        self.assertEqual(code, 0)
        self.assertIn("closing balance: 1592.50\n", out)

    def test_without_rules_everything_is_uncategorized(self):
        code, out, _ = self.run_cli("report", self.write("t.csv", TRANSACTIONS))
        self.assertEqual(code, 0)
        self.assertEqual(out, "uncategorized: 1592.50\n\nclosing balance: 1592.50\n")

    def test_negative_opening_is_accepted(self):
        code, out, _ = self.run_cli(
            "report", self.write("t.csv", "date,amount,description\n"),
            "--opening", "-50.25",
        )
        self.assertEqual((code, out), (0, "\nclosing balance: -50.25\n"))

    def test_header_only_file_reports_the_opening_balance(self):
        code, out, err = self.run_cli(
            "report", self.write("t.csv", "date,amount,description\n"),
            "--opening", "100",
        )
        self.assertEqual((code, out, err), (0, "\nclosing balance: 100.00\n", ""))


class ReadFailureTest(CliTestCase):
    def test_missing_transactions_file_exits_1(self):
        missing = str(self.root / "nope.csv")
        code, out, err = self.run_cli("report", missing)
        self.assertEqual(code, 1)
        self.assertEqual(out, "")
        self.assertEqual(err, f"ledgerlite: cannot read {missing}: No such file or directory\n")

    def test_directory_instead_of_file_exits_1(self):
        code, out, err = self.run_cli("report", str(self.root))
        self.assertEqual((code, out), (1, ""))
        self.assertTrue(err.startswith(f"ledgerlite: cannot read {self.root}: "))

    def test_non_utf8_transactions_file_exits_1(self):
        path = self.root / "t.csv"
        path.write_bytes(b"date,amount,description\n2026-03-01,1.00,caf\xe9\n")
        code, out, err = self.run_cli("report", str(path))
        self.assertEqual((code, out), (1, ""))
        self.assertIn("cannot read", err)

    def test_missing_rules_file_exits_1(self):
        missing = str(self.root / "nope.txt")
        code, out, err = self.run_cli(
            "report", self.write("t.csv", TRANSACTIONS), "--rules", missing,
        )
        self.assertEqual((code, out), (1, ""))
        self.assertEqual(err, f"ledgerlite: cannot read {missing}: No such file or directory\n")


class MalformedRowTest(CliTestCase):
    def test_malformed_row_exits_2_with_path_and_line(self):
        path = self.write("t.csv", "date,amount,description\n2026-03-01,1.005,a\n")
        code, out, err = self.run_cli("report", path)
        self.assertEqual((code, out), (2, ""))
        self.assertTrue(err.startswith(f"ledgerlite: {path}:2: "), err)
        self.assertIn("amount", err)

    def test_prints_nothing_to_stdout_even_when_earlier_rows_are_fine(self):
        path = self.write(
            "t.csv",
            "date,amount,description\n2026-03-01,1.00,a\n2026-03-02,oops,b\n",
        )
        code, out, err = self.run_cli("report", path)
        self.assertEqual((code, out), (2, ""))
        self.assertIn(f"{path}:3: ", err)

    def test_missing_header_exits_2_at_line_1(self):
        path = self.write("t.csv", "2026-03-01,1.00,a\n")
        code, out, err = self.run_cli("report", path)
        self.assertEqual((code, out), (2, ""))
        self.assertIn(f"{path}:1: ", err)


class ArgumentTest(CliTestCase):
    def test_malformed_opening_is_rejected(self):
        with self.assertRaises(SystemExit) as caught:
            with contextlib.redirect_stderr(io.StringIO()):
                main(["report", self.write("t.csv", TRANSACTIONS), "--opening", "1.005"])
        self.assertEqual(caught.exception.code, 2)

    def test_missing_subcommand_is_rejected(self):
        with self.assertRaises(SystemExit) as caught:
            with contextlib.redirect_stderr(io.StringIO()):
                main([])
        self.assertEqual(caught.exception.code, 2)


class ModuleInvocationTest(CliTestCase):
    def test_runs_as_a_module_and_exits_0(self):
        result = subprocess.run(
            [sys.executable, "-m", "ledgerlite.cli", "report",
             self.write("t.csv", TRANSACTIONS),
             "--rules", self.write("r.txt", RULES), "--opening", "100"],
            cwd=os.path.dirname(os.path.abspath(__file__)),
            capture_output=True, text=True,
        )
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(result.stdout, EXPECTED)
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `python3 -m unittest test_cli -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'ledgerlite.cli'`

- [ ] **Step 3: Write the implementation**

`ledgerlite/cli.py`:

```python
"""Command-line entry point: the only module that touches files or streams."""

from __future__ import annotations

import argparse
import pathlib
import sys
from decimal import Decimal

from ledgerlite.parse import ParseError, parse_amount, parse_transactions
from ledgerlite.report import format_report
from ledgerlite.rules import Rule, parse_rules

PROGRAM = "ledgerlite"


def main(argv: list[str] | None = None) -> int:
    """Run the CLI and return an exit code: 0 ok, 1 unreadable file, 2 bad row."""
    args = _build_parser().parse_args(argv)

    transactions_text = _read(args.transactions)
    if transactions_text is None:
        return 1

    rules: list[Rule] = []
    if args.rules is not None:
        rules_text = _read(args.rules)
        if rules_text is None:
            return 1
        rules = parse_rules(rules_text)

    try:
        transactions = parse_transactions(transactions_text)
    except ParseError as error:
        _fail(f"{args.transactions}:{error.line}: {error.message}")
        return 2

    sys.stdout.write(format_report(args.opening, transactions, rules))
    return 0


def _build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog=PROGRAM, description="Summarize a CSV of bank transactions."
    )
    subparsers = parser.add_subparsers(dest="command", required=True)
    report = subparsers.add_parser("report", help="print a categorized summary")
    report.add_argument("transactions", help="path to the transactions CSV")
    report.add_argument("--rules", help="path to the rules file")
    report.add_argument(
        "--opening",
        type=_opening_amount,
        default=Decimal("0"),
        help="opening balance (default: 0)",
    )
    return parser


def _opening_amount(raw: str) -> Decimal:
    """An --opening value follows the same rule as a row amount."""
    try:
        return parse_amount(raw)
    except ValueError as error:
        raise argparse.ArgumentTypeError(str(error)) from None


def _read(path: str) -> str | None:
    """Read a text file, or report why not and return None."""
    try:
        return pathlib.Path(path).read_text(encoding="utf-8")
    except OSError as error:
        reason = error.strerror or str(error)
    except UnicodeDecodeError:
        reason = "not valid UTF-8 text"
    _fail(f"cannot read {path}: {reason}")
    return None


def _fail(message: str) -> None:
    print(f"{PROGRAM}: {message}", file=sys.stderr)


if __name__ == "__main__":  # pragma: no cover
    sys.exit(main())
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `python3 -m unittest test_cli -v`
Expected: PASS

- [ ] **Step 5: Run the whole suite the way the design says to**

Run: `python3 -m unittest`
Expected: PASS — every test from Tasks 1-5 discovered and green, `OK`.

- [ ] **Step 6: Check the design's example by hand**

```bash
printf 'date,amount,description\n2026-03-04,-7.50,Coffee Bar\n2026-03-01,2500.00,Salary\n2026-03-02,-900.00,Monthly Rent\n' > /tmp/ledgerlite-t.csv
printf 'coffee=food\nrent=housing\n' > /tmp/ledgerlite-r.txt
python3 -m ledgerlite.cli report /tmp/ledgerlite-t.csv --rules /tmp/ledgerlite-r.txt --opening 100
echo "exit: $?"
```

Expected, byte for byte:

```
food: -7.50
housing: -900.00
uncategorized: 2500.00

closing balance: 1692.50
exit: 0
```

- [ ] **Step 7: Commit**

```bash
git add ledgerlite/cli.py test_cli.py
git commit -m "feat: ledgerlite report command with exit codes and error messages"
```
