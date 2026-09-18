# ledgerlite Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `ledgerlite`, a standard-library-only Python CLI that reads a transactions CSV, categorizes each row with a rules file, and prints per-category totals plus the closing balance.

**Architecture:** Six small modules with one responsibility each, layered bottom-up: `model` (data), `parse` (text → transactions, with precise per-line errors), `rules` (rules text → matcher), `balance` (date ordering and closing balance), `report` (totals and formatting), `cli` (argument parsing, file reading, exit codes and error messages). Money is `decimal.Decimal` end to end; no float ever touches an amount. Every layer is pure except `cli`, which owns all I/O, so each layer is testable in isolation.

**Tech Stack:** Python 3.11+, standard library only (`csv`, `decimal`, `datetime`, `argparse`, `re`, `io`, `sys`), `unittest` for tests.

**Spec:** `design.md` (in this directory — read it alongside this plan)

## Global Constraints

- Python 3.11+. Standard library only — no third-party dependencies, no `pip install`.
- Amounts are parsed and carried as `decimal.Decimal`, never `float`.
- Package layout is exactly as in the spec: `ledgerlite/{__init__,model,parse,rules,balance,report,cli}.py`, plus `ledgerlite/__main__.py` (see Decisions below).
- Tests live at the repo root as `test_<module>.py` and run with `python3 -m unittest`.
- Exit codes: `0` success, `1` transactions file unreadable, `2` malformed input.
- Error message formats, verbatim from the spec:
  - `ledgerlite: cannot read <path>: <reason>` (stderr, exit 1)
  - `ledgerlite: <path>:<line>: <what is wrong>` (stderr, exit 2)
- On exit 2 the whole file is rejected: nothing is written to stdout.
- Printed amounts have exactly two fractional digits, a leading `-` for negatives, and no thousands separators.
- Work directly on `main`. This is a local scratch repo with no remote; never `git push`.

## Decisions the spec leaves open

These are settled here so no task has to guess. Each is pinned by a test.

1. **Line numbers** in exit-2 messages are physical file line numbers, header included, so the first data row is line 2. `csv.reader.line_num` provides this and stays correct when a quoted description contains a newline.
2. **The header row is skipped unconditionally and never validated.** The spec lists no header-related malformation, so a file whose first line is anything else simply loses that line.
3. **Wholly empty CSV lines are skipped**, not treated as a column-count error — a trailing blank line is too common to reject.
4. **Dates must be exactly `YYYY-MM-DD`.** `2026-3-4` and `20260304` are malformed. (`strptime` is lenient about zero-padding, so `parse_date` gates on a regex first.)
5. **`nan` and `inf` are malformed amounts.** `Decimal("nan")` parses happily and would poison every total, so `parse_amount` requires a finite value.
6. **Rules-file oddities are ignored, not errors.** Blank lines, lines with no `=`, and lines with an empty substring or empty category are skipped. The spec defines no exit code for a bad rules file, and inventing one would exceed it. A rules file that cannot be *read* reuses the exit-1 `cannot read` path, since the alternative is a traceback.
7. **`--opening` is validated with the same rules as a row amount**, so `--opening 1.005` fails. Rejection goes through argparse, which prints usage to stderr and exits 2 — consistent with the malformed-input code.
8. **A category with no transactions produces no line**, including `uncategorized`. With no transactions at all the report is a blank line followed by `closing balance: <opening>`, which is the spec's rule ("one line per category" — there are none) read literally.
9. **"Alphabetically" means case-insensitive**, tie-broken by the raw name, so `apples` precedes `Food`.
10. **`ledgerlite/__main__.py` is added** beyond the spec's layout: without it the package has no way to be invoked as a command, and the spec calls this a command-line tool.

## Review Focus

Input classes the spec implies but does not spell out. Each has a test in the task named.

1. An unreadable transactions path that is not merely missing — a directory, or a file of non-UTF-8 bytes — must print `cannot read` and exit 1, never traceback (Task 5).
2. An empty file, or one with only a header, must exit 0 and print `closing balance: <opening>`; "the balance after the last transaction" must not index into an empty list (Tasks 4 and 5).
3. `nan`, `inf`, and an empty amount field must be rejected as malformed with exit 2 and empty stdout, never summed into a balance (Task 1).
4. Dates that are well-formed but nonexistent (`2026-02-30`) or sloppily padded (`2026-3-4`) must be rejected rather than silently mis-sorted (Task 1).
5. A total that lands on negative zero (`Decimal("-0.00")`) must print `0.00`, and mixed-case category names must sort as a person expects (Task 4).

---

### Task 1: Package skeleton, `Transaction` model, and CSV parsing

**Files:**
- Create: `ledgerlite/__init__.py`
- Create: `ledgerlite/model.py`
- Create: `ledgerlite/parse.py`
- Test: `test_parse.py`

**Interfaces:**
- Consumes: nothing (first task).
- Produces:
  - `ledgerlite.model.Transaction` — frozen dataclass with fields `date: datetime.date`, `amount: decimal.Decimal`, `description: str`, in that positional order.
  - `ledgerlite.parse.ParseError(Exception)` with attributes `line: int` and `message: str`.
  - `ledgerlite.parse.parse_amount(text: str) -> Decimal` — raises `ValueError` whose `str()` is the exact spec-facing wording.
  - `ledgerlite.parse.parse_date(text: str) -> datetime.date` — raises `ValueError` likewise.
  - `ledgerlite.parse.parse_transactions(text: str) -> list[Transaction]` — raises `ParseError`; preserves input row order (it does **not** sort).

- [ ] **Step 1: Write the failing test**

Create `test_parse.py`:

```python
import unittest
from datetime import date
from decimal import Decimal

from ledgerlite.model import Transaction
from ledgerlite.parse import ParseError, parse_amount, parse_date, parse_transactions


class TestParseAmount(unittest.TestCase):
    def test_parses_negative_two_place_amount(self):
        self.assertEqual(parse_amount("-12.50"), Decimal("-12.50"))

    def test_accepts_one_and_zero_fractional_digits(self):
        self.assertEqual(parse_amount("1.5"), Decimal("1.5"))
        self.assertEqual(parse_amount("1.50"), Decimal("1.50"))
        self.assertEqual(parse_amount("2500"), Decimal("2500"))

    def test_rejects_three_fractional_digits(self):
        with self.assertRaises(ValueError) as caught:
            parse_amount("1.005")
        self.assertEqual(
            str(caught.exception),
            "amount has more than two fractional digits: '1.005'",
        )

    def test_rejects_non_numeric(self):
        with self.assertRaises(ValueError) as caught:
            parse_amount("abc")
        self.assertEqual(str(caught.exception), "invalid amount: 'abc'")

    def test_rejects_empty(self):
        with self.assertRaises(ValueError) as caught:
            parse_amount("")
        self.assertEqual(str(caught.exception), "invalid amount: ''")

    def test_rejects_nan_and_infinity(self):
        for text in ("nan", "NaN", "inf", "-Infinity"):
            with self.subTest(text=text):
                with self.assertRaises(ValueError) as caught:
                    parse_amount(text)
                self.assertEqual(str(caught.exception), f"invalid amount: {text!r}")


class TestParseDate(unittest.TestCase):
    def test_parses_iso_date(self):
        self.assertEqual(parse_date("2026-03-04"), date(2026, 3, 4))

    def test_rejects_unpadded_date(self):
        with self.assertRaises(ValueError) as caught:
            parse_date("2026-3-4")
        self.assertEqual(str(caught.exception), "invalid date: '2026-3-4'")

    def test_rejects_compact_date(self):
        with self.assertRaises(ValueError):
            parse_date("20260304")

    def test_rejects_nonexistent_date(self):
        with self.assertRaises(ValueError) as caught:
            parse_date("2026-02-30")
        self.assertEqual(str(caught.exception), "invalid date: '2026-02-30'")

    def test_rejects_garbage(self):
        with self.assertRaises(ValueError) as caught:
            parse_date("not-a-date")
        self.assertEqual(str(caught.exception), "invalid date: 'not-a-date'")


class TestParseTransactions(unittest.TestCase):
    def test_parses_rows_in_input_order(self):
        text = (
            "date,amount,description\n"
            "2026-03-05,-900.00,Rent March\n"
            "2026-03-04,-7.50,Coffee shop\n"
        )
        self.assertEqual(
            parse_transactions(text),
            [
                Transaction(date(2026, 3, 5), Decimal("-900.00"), "Rent March"),
                Transaction(date(2026, 3, 4), Decimal("-7.50"), "Coffee shop"),
            ],
        )

    def test_empty_text_yields_no_transactions(self):
        self.assertEqual(parse_transactions(""), [])

    def test_header_only_yields_no_transactions(self):
        self.assertEqual(parse_transactions("date,amount,description\n"), [])

    def test_skips_blank_lines(self):
        text = "date,amount,description\n\n2026-03-04,1.00,Pay\n\n"
        self.assertEqual(len(parse_transactions(text)), 1)

    def test_quoted_description_keeps_comma(self):
        text = 'date,amount,description\n2026-03-04,1.00,"Acme, Inc."\n'
        self.assertEqual(parse_transactions(text)[0].description, "Acme, Inc.")

    def test_wrong_column_count_reports_line(self):
        text = "date,amount,description\n2026-03-04,1.00,Pay\n2026-03-05,1.00\n"
        with self.assertRaises(ParseError) as caught:
            parse_transactions(text)
        self.assertEqual(caught.exception.line, 3)
        self.assertEqual(caught.exception.message, "expected 3 columns, got 2")

    def test_bad_amount_reports_line_and_reason(self):
        text = "date,amount,description\n2026-03-04,x,Pay\n"
        with self.assertRaises(ParseError) as caught:
            parse_transactions(text)
        self.assertEqual(caught.exception.line, 2)
        self.assertEqual(caught.exception.message, "invalid amount: 'x'")

    def test_bad_date_reports_line_and_reason(self):
        text = "date,amount,description\n2026-13-04,1.00,Pay\n"
        with self.assertRaises(ParseError) as caught:
            parse_transactions(text)
        self.assertEqual(caught.exception.line, 2)
        self.assertEqual(caught.exception.message, "invalid date: '2026-13-04'")

    def test_line_number_counts_newline_inside_quoted_field(self):
        text = (
            "date,amount,description\n"
            '2026-03-04,1.00,"multi\nline"\n'
            "2026-03-05,x,Pay\n"
        )
        with self.assertRaises(ParseError) as caught:
            parse_transactions(text)
        self.assertEqual(caught.exception.line, 4)

    def test_surrounding_whitespace_in_date_and_amount_is_tolerated(self):
        text = "date,amount,description\n 2026-03-04 , -7.50 ,Coffee\n"
        transaction = parse_transactions(text)[0]
        self.assertEqual(transaction.date, date(2026, 3, 4))
        self.assertEqual(transaction.amount, Decimal("-7.50"))


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run test to verify it fails**

Run: `python3 -m unittest test_parse -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'ledgerlite'`

- [ ] **Step 3: Write minimal implementation**

Create `ledgerlite/__init__.py`:

```python
"""ledgerlite — categorize bank transactions and report per-category totals."""
```

Create `ledgerlite/model.py`:

```python
from dataclasses import dataclass
from datetime import date
from decimal import Decimal


@dataclass(frozen=True)
class Transaction:
    date: date
    amount: Decimal
    description: str
```

Create `ledgerlite/parse.py`:

```python
import csv
import io
import re
from datetime import date
from decimal import Decimal, InvalidOperation

from .model import Transaction

_DATE_PATTERN = re.compile(r"\d{4}-\d{2}-\d{2}\Z")
_COLUMN_COUNT = 3


class ParseError(Exception):
    """A row of the transactions file could not be parsed."""

    def __init__(self, line: int, message: str) -> None:
        super().__init__(f"{line}: {message}")
        self.line = line
        self.message = message


def parse_amount(text: str) -> Decimal:
    try:
        value = Decimal(text)
    except InvalidOperation as exc:
        raise ValueError(f"invalid amount: {text!r}") from exc
    if not value.is_finite():
        raise ValueError(f"invalid amount: {text!r}")
    if value.as_tuple().exponent < -2:
        raise ValueError(f"amount has more than two fractional digits: {text!r}")
    return value


def parse_date(text: str) -> date:
    if not _DATE_PATTERN.match(text):
        raise ValueError(f"invalid date: {text!r}")
    try:
        return date.fromisoformat(text)
    except ValueError as exc:
        raise ValueError(f"invalid date: {text!r}") from exc


def parse_transactions(text: str) -> list[Transaction]:
    """Parse CSV text into transactions, in input order.

    The first row is the header and is skipped. Raises ParseError on the
    first malformed row; the caller rejects the whole file.
    """
    reader = csv.reader(io.StringIO(text))
    transactions: list[Transaction] = []
    for index, row in enumerate(reader):
        if index == 0 or not row:
            continue
        if len(row) != _COLUMN_COUNT:
            raise ParseError(
                reader.line_num, f"expected {_COLUMN_COUNT} columns, got {len(row)}"
            )
        date_text, amount_text, description = row
        try:
            transaction_date = parse_date(date_text.strip())
            amount = parse_amount(amount_text.strip())
        except ValueError as exc:
            raise ParseError(reader.line_num, str(exc)) from exc
        transactions.append(Transaction(transaction_date, amount, description))
    return transactions
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `python3 -m unittest test_parse -v`
Expected: PASS (all tests)

- [ ] **Step 5: Commit**

```bash
git add ledgerlite/__init__.py ledgerlite/model.py ledgerlite/parse.py test_parse.py
git commit -m "feat: parse transactions CSV into Decimal-backed Transaction records"
```

---

### Task 2: Rules parsing and categorization

**Files:**
- Create: `ledgerlite/rules.py`
- Test: `test_rules.py`

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces:
  - `ledgerlite.rules.parse_rules(text: str) -> list[tuple[str, str]]` — ordered `(substring, category)` pairs; substrings are stripped and lowercased, categories stripped.
  - `ledgerlite.rules.categorize(description: str, rules: list[tuple[str, str]]) -> str | None` — first matching rule wins, matching case-insensitively; `None` when nothing matches.

- [ ] **Step 1: Write the failing test**

Create `test_rules.py`:

```python
import unittest

from ledgerlite.rules import categorize, parse_rules


class TestParseRules(unittest.TestCase):
    def test_parses_rules_in_order_with_lowercased_substrings(self):
        self.assertEqual(
            parse_rules("Coffee=food\nRENT=housing\n"),
            [("coffee", "food"), ("rent", "housing")],
        )

    def test_skips_blank_lines(self):
        self.assertEqual(parse_rules("\ncoffee=food\n   \n"), [("coffee", "food")])

    def test_skips_lines_without_separator(self):
        self.assertEqual(parse_rules("nonsense\ncoffee=food\n"), [("coffee", "food")])

    def test_strips_whitespace_around_both_sides(self):
        self.assertEqual(parse_rules("  coffee  =  food  \n"), [("coffee", "food")])

    def test_skips_empty_substring_or_empty_category(self):
        self.assertEqual(parse_rules("=food\ncoffee=\n"), [])

    def test_splits_on_first_separator_only(self):
        self.assertEqual(parse_rules("a=b=c\n"), [("a", "b=c")])


class TestCategorize(unittest.TestCase):
    RULES = [("coffee", "food"), ("rent", "housing")]

    def test_matches_case_insensitively(self):
        self.assertEqual(categorize("MORNING COFFEE", self.RULES), "food")

    def test_first_matching_rule_wins(self):
        rules = [("coffee", "food"), ("coffee shop", "outings")]
        self.assertEqual(categorize("Coffee shop", rules), "food")

    def test_returns_none_when_nothing_matches(self):
        self.assertIsNone(categorize("Salary", self.RULES))

    def test_returns_none_with_no_rules(self):
        self.assertIsNone(categorize("Coffee", []))


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run test to verify it fails**

Run: `python3 -m unittest test_rules -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'ledgerlite.rules'`

- [ ] **Step 3: Write minimal implementation**

Create `ledgerlite/rules.py`:

```python
_SEPARATOR = "="


def parse_rules(text: str) -> list[tuple[str, str]]:
    """Parse rules text into ordered (lowercased substring, category) pairs.

    Blank lines, lines without a separator, and lines with an empty
    substring or category are ignored.
    """
    rules: list[tuple[str, str]] = []
    for line in text.splitlines():
        substring, separator, category = line.partition(_SEPARATOR)
        if not separator:
            continue
        substring = substring.strip().lower()
        category = category.strip()
        if not substring or not category:
            continue
        rules.append((substring, category))
    return rules


def categorize(description: str, rules: list[tuple[str, str]]) -> str | None:
    """Return the category of the first rule whose substring occurs in description."""
    lowered = description.lower()
    for substring, category in rules:
        if substring in lowered:
            return category
    return None
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `python3 -m unittest test_rules -v`
Expected: PASS (all tests)

- [ ] **Step 5: Commit**

```bash
git add ledgerlite/rules.py test_rules.py
git commit -m "feat: parse rules file and categorize descriptions case-insensitively"
```

---

### Task 3: Date ordering and closing balance

**Files:**
- Create: `ledgerlite/balance.py`
- Test: `test_balance.py`

**Interfaces:**
- Consumes: `ledgerlite.model.Transaction` (fields `date`, `amount`, `description`) from Task 1.
- Produces:
  - `ledgerlite.balance.order_transactions(transactions: list[Transaction]) -> list[Transaction]` — sorted by date, ties keeping input order; returns a new list.
  - `ledgerlite.balance.closing_balance(transactions: list[Transaction], opening: Decimal) -> Decimal` — the running balance after the last transaction in date order, or `opening` when there are none.

- [ ] **Step 1: Write the failing test**

Create `test_balance.py`:

```python
import unittest
from datetime import date
from decimal import Decimal

from ledgerlite.balance import closing_balance, order_transactions
from ledgerlite.model import Transaction


def txn(date_text: str, amount_text: str, description: str = "x") -> Transaction:
    return Transaction(date.fromisoformat(date_text), Decimal(amount_text), description)


class TestOrderTransactions(unittest.TestCase):
    def test_sorts_by_date(self):
        rows = [txn("2026-03-05", "1.00", "b"), txn("2026-03-04", "2.00", "a")]
        self.assertEqual([t.description for t in order_transactions(rows)], ["a", "b"])

    def test_ties_keep_input_order(self):
        rows = [
            txn("2026-03-04", "1.00", "first"),
            txn("2026-03-04", "2.00", "second"),
            txn("2026-03-03", "3.00", "earlier"),
        ]
        self.assertEqual(
            [t.description for t in order_transactions(rows)],
            ["earlier", "first", "second"],
        )

    def test_does_not_mutate_input(self):
        rows = [txn("2026-03-05", "1.00", "b"), txn("2026-03-04", "2.00", "a")]
        order_transactions(rows)
        self.assertEqual([t.description for t in rows], ["b", "a"])


class TestClosingBalance(unittest.TestCase):
    def test_adds_amounts_to_opening(self):
        rows = [
            txn("2026-03-04", "-7.50"),
            txn("2026-03-05", "-900.00"),
            txn("2026-03-06", "2500.00"),
        ]
        self.assertEqual(closing_balance(rows, Decimal("100")), Decimal("1692.50"))

    def test_no_transactions_returns_opening(self):
        self.assertEqual(closing_balance([], Decimal("100")), Decimal("100"))

    def test_arithmetic_is_exact(self):
        rows = [txn("2026-03-04", "0.10") for _ in range(3)]
        self.assertEqual(closing_balance(rows, Decimal("0")), Decimal("0.30"))


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run test to verify it fails**

Run: `python3 -m unittest test_balance -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'ledgerlite.balance'`

- [ ] **Step 3: Write minimal implementation**

Create `ledgerlite/balance.py`:

```python
from decimal import Decimal

from .model import Transaction


def order_transactions(transactions: list[Transaction]) -> list[Transaction]:
    """Return the transactions by date; ties keep input order (stable sort)."""
    return sorted(transactions, key=lambda transaction: transaction.date)


def closing_balance(transactions: list[Transaction], opening: Decimal) -> Decimal:
    """Return the running balance after the last transaction in date order."""
    balance = opening
    for transaction in order_transactions(transactions):
        balance += transaction.amount
    return balance
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `python3 -m unittest test_balance -v`
Expected: PASS (all tests)

- [ ] **Step 5: Commit**

```bash
git add ledgerlite/balance.py test_balance.py
git commit -m "feat: add date-ordered running balance and closing balance"
```

---

### Task 4: Per-category totals and report formatting

**Files:**
- Create: `ledgerlite/report.py`
- Test: `test_report.py`

**Interfaces:**
- Consumes: `Transaction` (Task 1), `categorize(description, rules)` (Task 2), `closing_balance(transactions, opening)` (Task 3).
- Produces:
  - `ledgerlite.report.UNCATEGORIZED` — the string `"uncategorized"`.
  - `ledgerlite.report.format_amount(value: Decimal) -> str` — two fractional digits, no thousands separators, `0.00` for any zero.
  - `ledgerlite.report.category_totals(transactions: list[Transaction], rules: list[tuple[str, str]]) -> list[tuple[str, Decimal]]` — in report order: categories case-insensitively alphabetical, `uncategorized` last, categories with no transactions absent.
  - `ledgerlite.report.format_report(transactions: list[Transaction], rules: list[tuple[str, str]], opening: Decimal) -> str` — the whole report, newline-terminated.

- [ ] **Step 1: Write the failing test**

Create `test_report.py`:

```python
import unittest
from datetime import date
from decimal import Decimal

from ledgerlite.model import Transaction
from ledgerlite.report import UNCATEGORIZED, category_totals, format_amount, format_report


def txn(date_text: str, amount_text: str, description: str = "x") -> Transaction:
    return Transaction(date.fromisoformat(date_text), Decimal(amount_text), description)


RULES = [("coffee", "food"), ("rent", "housing")]


class TestFormatAmount(unittest.TestCase):
    def test_two_fractional_digits(self):
        self.assertEqual(format_amount(Decimal("-12.5")), "-12.50")
        self.assertEqual(format_amount(Decimal("0")), "0.00")
        self.assertEqual(format_amount(Decimal("1200")), "1200.00")

    def test_no_thousands_separators(self):
        self.assertEqual(format_amount(Decimal("1234567.5")), "1234567.50")

    def test_negative_zero_prints_as_zero(self):
        self.assertEqual(format_amount(Decimal("-0.00")), "0.00")


class TestCategoryTotals(unittest.TestCase):
    def test_alphabetical_with_uncategorized_last(self):
        rows = [
            txn("2026-03-04", "-7.50", "Coffee shop"),
            txn("2026-03-05", "-900.00", "Rent March"),
            txn("2026-03-06", "2500.00", "Salary"),
        ]
        self.assertEqual(
            category_totals(rows, RULES),
            [
                ("food", Decimal("-7.50")),
                ("housing", Decimal("-900.00")),
                (UNCATEGORIZED, Decimal("2500.00")),
            ],
        )

    def test_sums_repeated_categories(self):
        rows = [
            txn("2026-03-04", "-7.50", "Coffee shop"),
            txn("2026-03-06", "-2.50", "coffee cart"),
        ]
        self.assertEqual(category_totals(rows, RULES), [("food", Decimal("-10.00"))])

    def test_alphabetical_ignores_case(self):
        rules = [("a", "zoo"), ("b", "Food"), ("c", "apples")]
        rows = [
            txn("2026-03-04", "1.00", "a"),
            txn("2026-03-04", "1.00", "b"),
            txn("2026-03-04", "1.00", "c"),
        ]
        self.assertEqual(
            [name for name, _ in category_totals(rows, rules)],
            ["apples", "Food", "zoo"],
        )

    def test_uncategorized_absent_when_everything_matches(self):
        rows = [txn("2026-03-04", "-7.50", "Coffee shop")]
        self.assertEqual([name for name, _ in category_totals(rows, RULES)], ["food"])

    def test_no_rules_means_everything_uncategorized(self):
        rows = [txn("2026-03-04", "-7.50", "Coffee shop")]
        self.assertEqual(category_totals(rows, []), [(UNCATEGORIZED, Decimal("-7.50"))])

    def test_no_transactions_yields_no_categories(self):
        self.assertEqual(category_totals([], RULES), [])


class TestFormatReport(unittest.TestCase):
    def test_matches_design_example(self):
        rows = [
            txn("2026-03-05", "-900.00", "Rent March"),
            txn("2026-03-04", "-7.50", "Coffee shop"),
            txn("2026-03-06", "2500.00", "Salary"),
        ]
        self.assertEqual(
            format_report(rows, RULES, Decimal("100")),
            "food: -7.50\n"
            "housing: -900.00\n"
            "uncategorized: 2500.00\n"
            "\n"
            "closing balance: 1692.50\n",
        )

    def test_no_transactions_reports_opening_balance(self):
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
from decimal import ROUND_HALF_UP, Decimal

from .balance import closing_balance
from .model import Transaction
from .rules import categorize

UNCATEGORIZED = "uncategorized"
_TWO_PLACES = Decimal("0.01")


def format_amount(value: Decimal) -> str:
    """Format an amount with exactly two fractional digits and no separators."""
    quantized = value.quantize(_TWO_PLACES, rounding=ROUND_HALF_UP)
    if quantized == 0:
        quantized = abs(quantized)
    return f"{quantized:.2f}"


def category_totals(
    transactions: list[Transaction], rules: list[tuple[str, str]]
) -> list[tuple[str, Decimal]]:
    """Return (category, total) pairs in report order: alphabetical, uncategorized last."""
    totals: dict[str, Decimal] = {}
    for transaction in transactions:
        name = categorize(transaction.description, rules) or UNCATEGORIZED
        totals[name] = totals.get(name, Decimal("0")) + transaction.amount
    named = sorted(
        (name for name in totals if name != UNCATEGORIZED),
        key=lambda name: (name.lower(), name),
    )
    ordered = [(name, totals[name]) for name in named]
    if UNCATEGORIZED in totals:
        ordered.append((UNCATEGORIZED, totals[UNCATEGORIZED]))
    return ordered


def format_report(
    transactions: list[Transaction],
    rules: list[tuple[str, str]],
    opening: Decimal,
) -> str:
    """Render the whole report, newline-terminated."""
    lines = [
        f"{name}: {format_amount(total)}"
        for name, total in category_totals(transactions, rules)
    ]
    lines.append("")
    lines.append(
        f"closing balance: {format_amount(closing_balance(transactions, opening))}"
    )
    return "\n".join(lines) + "\n"
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `python3 -m unittest test_report -v`
Expected: PASS (all tests)

- [ ] **Step 5: Commit**

```bash
git add ledgerlite/report.py test_report.py
git commit -m "feat: format per-category totals and closing balance report"
```

---

### Task 5: CLI entry point, file reading, and exit codes

**Files:**
- Create: `ledgerlite/cli.py`
- Create: `ledgerlite/__main__.py`
- Test: `test_cli.py`

**Interfaces:**
- Consumes: `parse.parse_amount`, `parse.parse_transactions`, `parse.ParseError` (Task 1); `rules.parse_rules` (Task 2); `report.format_report` (Task 4).
- Produces:
  - `ledgerlite.cli.main(argv: list[str] | None = None) -> int` — returns the process exit code. Invalid command-line arguments raise `SystemExit(2)` from argparse rather than returning.
  - `python3 -m ledgerlite report TRANSACTIONS [--rules RULES] [--opening AMOUNT]`.

- [ ] **Step 1: Write the failing test**

Create `test_cli.py`:

```python
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
    "2026-03-05,-900.00,Rent March\n"
    "2026-03-04,-7.50,Coffee shop\n"
    "2026-03-06,2500.00,Salary\n"
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

    def write(self, name, content, *, mode="w"):
        path = os.path.join(self.directory.name, name)
        with open(path, mode) as handle:
            handle.write(content)
        return path

    def run_main(self, argv):
        out, err = io.StringIO(), io.StringIO()
        with contextlib.redirect_stdout(out), contextlib.redirect_stderr(err):
            code = main(argv)
        return code, out.getvalue(), err.getvalue()


class TestSuccess(CliTestCase):
    def test_reports_with_rules_and_opening(self):
        transactions = self.write("t.csv", TRANSACTIONS)
        rules = self.write("t.rules", RULES)
        code, out, err = self.run_main(
            ["report", transactions, "--rules", rules, "--opening", "100"]
        )
        self.assertEqual((code, out, err), (0, EXPECTED, ""))

    def test_opening_defaults_to_zero_and_rules_are_optional(self):
        transactions = self.write("t.csv", TRANSACTIONS)
        code, out, _ = self.run_main(["report", transactions])
        self.assertEqual(code, 0)
        self.assertEqual(out, "uncategorized: 1592.50\n\nclosing balance: 1592.50\n")

    def test_header_only_file_reports_opening_balance(self):
        transactions = self.write("t.csv", "date,amount,description\n")
        code, out, _ = self.run_main(["report", transactions, "--opening", "100"])
        self.assertEqual((code, out), (0, "\nclosing balance: 100.00\n"))

    def test_empty_file_reports_opening_balance(self):
        transactions = self.write("t.csv", "")
        code, out, _ = self.run_main(["report", transactions])
        self.assertEqual((code, out), (0, "\nclosing balance: 0.00\n"))


class TestUnreadable(CliTestCase):
    def test_missing_transactions_file(self):
        path = os.path.join(self.directory.name, "nope.csv")
        code, out, err = self.run_main(["report", path])
        self.assertEqual(code, 1)
        self.assertEqual(out, "")
        self.assertTrue(err.startswith(f"ledgerlite: cannot read {path}: "), err)
        self.assertIn("No such file", err)

    def test_directory_as_transactions_file(self):
        code, out, err = self.run_main(["report", self.directory.name])
        self.assertEqual(code, 1)
        self.assertEqual(out, "")
        self.assertTrue(err.startswith(f"ledgerlite: cannot read {self.directory.name}: "), err)

    def test_non_utf8_transactions_file(self):
        path = self.write("t.csv", b"date,amount,description\n2026-03-04,1.00,\xff\n", mode="wb")
        code, out, err = self.run_main(["report", path])
        self.assertEqual(code, 1)
        self.assertEqual(out, "")
        self.assertTrue(err.startswith(f"ledgerlite: cannot read {path}: "), err)

    def test_missing_rules_file(self):
        transactions = self.write("t.csv", TRANSACTIONS)
        path = os.path.join(self.directory.name, "nope.rules")
        code, out, err = self.run_main(["report", transactions, "--rules", path])
        self.assertEqual(code, 1)
        self.assertEqual(out, "")
        self.assertTrue(err.startswith(f"ledgerlite: cannot read {path}: "), err)


class TestMalformed(CliTestCase):
    def test_bad_amount_reports_path_and_line(self):
        transactions = self.write(
            "t.csv", "date,amount,description\n2026-03-04,1.00,Pay\n2026-03-05,x,Pay\n"
        )
        code, out, err = self.run_main(["report", transactions])
        self.assertEqual(code, 2)
        self.assertEqual(out, "")
        self.assertEqual(err, f"ledgerlite: {transactions}:3: invalid amount: 'x'\n")

    def test_three_fractional_digits_rejects_whole_file(self):
        transactions = self.write("t.csv", "date,amount,description\n2026-03-04,1.005,Pay\n")
        code, out, err = self.run_main(["report", transactions])
        self.assertEqual(code, 2)
        self.assertEqual(out, "")
        self.assertEqual(
            err,
            f"ledgerlite: {transactions}:2: amount has more than two "
            "fractional digits: '1.005'\n",
        )

    def test_nonexistent_date_rejects_whole_file(self):
        transactions = self.write("t.csv", "date,amount,description\n2026-02-30,1.00,Pay\n")
        code, out, _ = self.run_main(["report", transactions])
        self.assertEqual((code, out), (2, ""))

    def test_bad_opening_amount_exits_two(self):
        transactions = self.write("t.csv", TRANSACTIONS)
        with contextlib.redirect_stderr(io.StringIO()):
            with self.assertRaises(SystemExit) as caught:
                main(["report", transactions, "--opening", "1.005"])
        self.assertEqual(caught.exception.code, 2)


class TestModuleInvocation(CliTestCase):
    def test_runs_as_python_module(self):
        transactions = self.write("t.csv", TRANSACTIONS)
        rules = self.write("t.rules", RULES)
        completed = subprocess.run(
            [
                sys.executable, "-m", "ledgerlite", "report", transactions,
                "--rules", rules, "--opening", "100",
            ],
            capture_output=True,
            text=True,
        )
        self.assertEqual(completed.returncode, 0, completed.stderr)
        self.assertEqual(completed.stdout, EXPECTED)


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run test to verify it fails**

Run: `python3 -m unittest test_cli -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'ledgerlite.cli'`

- [ ] **Step 3: Write minimal implementation**

Create `ledgerlite/cli.py`:

```python
import argparse
import sys
from decimal import Decimal

from . import rules as rules_module
from .parse import ParseError, parse_amount, parse_transactions
from .report import format_report


def _opening_amount(text: str) -> Decimal:
    try:
        return parse_amount(text)
    except ValueError as exc:
        raise argparse.ArgumentTypeError(str(exc)) from exc


def _build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(prog="ledgerlite")
    subparsers = parser.add_subparsers(dest="command", required=True)
    report_parser = subparsers.add_parser("report", help="print a categorized report")
    report_parser.add_argument("transactions", help="path to the transactions CSV")
    report_parser.add_argument("--rules", help="path to the rules file")
    report_parser.add_argument(
        "--opening", type=_opening_amount, default=Decimal("0"),
        help="opening balance (default 0)",
    )
    return parser


def _read_text(path: str) -> str:
    with open(path, encoding="utf-8", newline="") as handle:
        return handle.read()


def _reason(exc: Exception) -> str:
    return getattr(exc, "strerror", None) or str(exc)


def main(argv: list[str] | None = None) -> int:
    args = _build_parser().parse_args(argv)

    paths = [args.transactions] + ([args.rules] if args.rules else [])
    texts = {}
    for path in paths:
        try:
            texts[path] = _read_text(path)
        except (OSError, UnicodeDecodeError) as exc:
            print(f"ledgerlite: cannot read {path}: {_reason(exc)}", file=sys.stderr)
            return 1

    rules = rules_module.parse_rules(texts[args.rules]) if args.rules else []

    try:
        transactions = parse_transactions(texts[args.transactions])
    except ParseError as exc:
        print(
            f"ledgerlite: {args.transactions}:{exc.line}: {exc.message}",
            file=sys.stderr,
        )
        return 2

    sys.stdout.write(format_report(transactions, rules, args.opening))
    return 0
```

Create `ledgerlite/__main__.py`:

```python
import sys

from .cli import main

sys.exit(main())
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `python3 -m unittest test_cli -v`
Expected: PASS (all tests)

- [ ] **Step 5: Run the whole suite and the documented example**

Run: `python3 -m unittest -v`
Expected: PASS — every test in `test_parse`, `test_rules`, `test_balance`, `test_report`, `test_cli`.

Then confirm the spec's example end to end:

```bash
printf 'date,amount,description\n2026-03-05,-900.00,Rent March\n2026-03-04,-7.50,Coffee shop\n2026-03-06,2500.00,Salary\n' > /tmp/ledgerlite-demo.csv
printf 'coffee=food\nrent=housing\n' > /tmp/ledgerlite-demo.rules
python3 -m ledgerlite report /tmp/ledgerlite-demo.csv --rules /tmp/ledgerlite-demo.rules --opening 100
```

Expected stdout, exactly:

```
food: -7.50
housing: -900.00
uncategorized: 2500.00

closing balance: 1692.50
```

- [ ] **Step 6: Commit**

```bash
git add ledgerlite/cli.py ledgerlite/__main__.py test_cli.py
git commit -m "feat: add ledgerlite report CLI with spec exit codes and messages"
```

---

## Spec coverage

| Spec requirement | Task |
| --- | --- |
| ISO date, two-place Decimal amount, free-text description | 1 |
| Rows in any order; shared dates allowed | 1 (parse preserves order), 3 (stable date sort) |
| Malformed row → `<path>:<line>: <reason>`, exit 2, no stdout | 1 (detection), 5 (message and code) |
| Unreadable transactions file → `cannot read`, exit 1 | 5 |
| Rules file format, case-insensitive match, first rule wins, no match → no category | 2 |
| `--rules` optional, `--opening` defaults to 0 | 5 |
| Date-ordered running balance; closing balance; opening when empty | 3 |
| One line per category, alphabetical, `uncategorized` last, blank line, `closing balance:` | 4 |
| Two-digit amounts, leading `-`, no thousands separators | 4 |
| Package layout, stdlib only, Decimal not float, root `test_<module>.py` under `python3 -m unittest` | all |
