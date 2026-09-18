# ledgerlite Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `ledgerlite`, a standard-library-only Python CLI that reads a transactions CSV, categorizes each row with a rules file, and prints per-category totals plus the closing balance.

**Architecture:** Six small modules with one responsibility each, wired together only at the CLI layer: `model` (the `Transaction` record), `parse` (text → transactions, raising `ParseError`), `rules` (rules text → rule list, plus `categorize`), `balance` (date-ordered running/closing balance), `report` (per-category totals and formatting), `cli` (argparse, file reading, exit codes). Every module below `cli` is pure — it takes strings and values, never paths — so all behavior is testable without touching the filesystem, and `cli` owns the only I/O and the mapping from exceptions to exit codes.

**Tech Stack:** Python 3.11+, standard library only (`csv`, `decimal`, `datetime`, `re`, `argparse`, `dataclasses`, `unittest`).

**Spec:** `design.md` (in this directory)

## Global Constraints

- Python 3.11+. Standard library only — no third-party runtime or test dependencies.
- Money is `decimal.Decimal`, never `float`. No arithmetic on money goes through `float` at any point, including formatting.
- Package lives in `ledgerlite/` with exactly the modules listed in the spec's layout, plus `__main__.py` so `python3 -m ledgerlite` runs the CLI (the spec names the command `ledgerlite report ...` but does not list an entry-point file; `__main__.py` is the standard-library way to provide it).
- Tests live at the repo root as `test_<module>.py` and run with `python3 -m unittest`.
- Amounts are printed with exactly two fractional digits, a leading `-` only for negatives, and no thousands separators: `-12.50`, `0.00`, `1200.00`.
- Exit codes: `0` success, `1` a file cannot be read, `2` the transactions file has a malformed row. Nothing is written to stdout on codes 1 and 2.
- Error message formats, verbatim:
  - `ledgerlite: cannot read <path>: <reason>`
  - `ledgerlite: <path>:<line>: <what is wrong>`
- Rule matching is case-insensitive on the description; the first matching rule wins.
- Transaction order is by date with ties keeping input order (Python's `sorted` is stable, so no tiebreak field is needed on `Transaction`).

## Review Focus

Input classes the spec implies but never spells out. Each has a test in the task named after it.

1. **`decimal.Decimal` accepts `NaN`, `Infinity`, and `1e3`** — a regex must gate the amount field, or a `NaN` amount silently poisons every total. Also `1,000.00`, `$5.00`, and `""` must be malformed. (Task 2)
2. **An empty transactions file, or one whose header row is wrong** — must exit 2 with a `:1:` message, not raise `StopIteration` or silently treat the header as data. (Task 3)
3. **A transactions file with a header but zero data rows** — must print `closing balance: 0.00` with no leading blank line and no `uncategorized: 0.00` line. (Task 6)
4. **A total of `-0.00`** (e.g. a single `-0.00` amount) — must print `0.00`; `-0.00` is not negative. (Task 6)
5. **A missing or unreadable `--rules` file** — the spec only names the transactions file, but this must exit 1 with `cannot read`, not a traceback. (Task 7)

---

### Task 1: Package skeleton and `Transaction`

**Files:**
- Create: `ledgerlite/__init__.py`
- Create: `ledgerlite/model.py`
- Create: `.gitignore`
- Test: `test_model.py`

**Interfaces:**
- Consumes: nothing.
- Produces: `ledgerlite.model.Transaction`, a frozen dataclass with fields `date: datetime.date`, `amount: decimal.Decimal`, `description: str`, constructed by keyword.

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
            date=date(2026, 3, 4),
            amount=Decimal("-7.50"),
            description="Blue Bottle Coffee",
        )
        self.assertEqual(txn.date, date(2026, 3, 4))
        self.assertEqual(txn.amount, Decimal("-7.50"))
        self.assertEqual(txn.description, "Blue Bottle Coffee")

    def test_is_frozen(self):
        txn = Transaction(date=date(2026, 3, 4), amount=Decimal("1.00"), description="x")
        with self.assertRaises(FrozenInstanceError):
            txn.amount = Decimal("2.00")


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run test to verify it fails**

Run: `python3 -m unittest test_model -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'ledgerlite'`

- [ ] **Step 3: Write minimal implementation**

Create `ledgerlite/__init__.py`:

```python
"""ledgerlite: summarize bank transactions by category."""
```

Create `ledgerlite/model.py`:

```python
"""The transaction record."""

from dataclasses import dataclass
from datetime import date
from decimal import Decimal


@dataclass(frozen=True)
class Transaction:
    """One row of the transactions CSV."""

    date: date
    amount: Decimal
    description: str
```

Create `.gitignore`:

```
__pycache__/
*.pyc
```

- [ ] **Step 4: Run test to verify it passes**

Run: `python3 -m unittest test_model -v`
Expected: PASS (2 tests)

- [ ] **Step 5: Commit**

```bash
git add .gitignore ledgerlite/__init__.py ledgerlite/model.py test_model.py
git commit -m "feat: add Transaction model"
```

---

### Task 2: Field parsers — `parse_date` and `parse_amount`

The two validators that decide whether a field is malformed. `parse_amount` is also used by the CLI for `--opening`, so it lands before row parsing.

**Files:**
- Create: `ledgerlite/parse.py`
- Test: `test_parse.py`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `ledgerlite.parse.parse_date(text: str) -> datetime.date` — raises `ValueError("invalid date: <repr>")`.
  - `ledgerlite.parse.parse_amount(text: str) -> decimal.Decimal` — raises `ValueError("invalid amount: <repr>")`.
  - Both strip surrounding whitespace before validating.

- [ ] **Step 1: Write the failing test**

Create `test_parse.py`:

```python
import unittest
from datetime import date
from decimal import Decimal

from ledgerlite.parse import parse_amount, parse_date


class ParseDateTest(unittest.TestCase):
    def test_parses_iso_date(self):
        self.assertEqual(parse_date("2026-03-04"), date(2026, 3, 4))

    def test_strips_surrounding_whitespace(self):
        self.assertEqual(parse_date("  2026-03-04 "), date(2026, 3, 4))

    def test_rejects_non_iso_and_impossible_dates(self):
        for text in ["2026-3-4", "20260304", "04/03/2026", "2026-02-30", "2026-13-01", "", "today"]:
            with self.subTest(text=text):
                with self.assertRaises(ValueError) as caught:
                    parse_date(text)
                self.assertIn("invalid date", str(caught.exception))


class ParseAmountTest(unittest.TestCase):
    def test_parses_decimals(self):
        self.assertEqual(parse_amount("1.50"), Decimal("1.50"))
        self.assertEqual(parse_amount("1.5"), Decimal("1.5"))
        self.assertEqual(parse_amount("-900"), Decimal("-900"))
        self.assertEqual(parse_amount("+2500.00"), Decimal("2500.00"))
        self.assertEqual(parse_amount(".25"), Decimal("0.25"))
        self.assertEqual(parse_amount(" -7.50 "), Decimal("-7.50"))

    def test_rejects_more_than_two_fractional_digits(self):
        with self.assertRaises(ValueError):
            parse_amount("1.005")

    # Review Focus 1: Decimal() itself accepts these; the regex must not.
    def test_rejects_non_numeric_and_special_values(self):
        for text in ["NaN", "nan", "Infinity", "-inf", "1e3", "1,000.00", "$5.00", "", "  ", "1.2.3", "--1"]:
            with self.subTest(text=text):
                with self.assertRaises(ValueError) as caught:
                    parse_amount(text)
                self.assertIn("invalid amount", str(caught.exception))


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run test to verify it fails**

Run: `python3 -m unittest test_parse -v`
Expected: FAIL — `ImportError: cannot import name 'parse_amount' from 'ledgerlite.parse'` (module does not exist)

- [ ] **Step 3: Write minimal implementation**

Create `ledgerlite/parse.py`:

```python
"""Parsing the transactions CSV."""

import re
from datetime import date
from decimal import Decimal

_DATE_RE = re.compile(r"\d{4}-\d{2}-\d{2}\Z")
_AMOUNT_RE = re.compile(r"[+-]?(?:\d+(?:\.\d{1,2})?|\.\d{1,2})\Z")


def parse_date(text: str) -> date:
    """Parse an ISO 8601 calendar date, e.g. 2026-03-04."""
    stripped = text.strip()
    if not _DATE_RE.match(stripped):
        raise ValueError(f"invalid date: {text!r}")
    try:
        return date.fromisoformat(stripped)
    except ValueError:
        raise ValueError(f"invalid date: {text!r}") from None


def parse_amount(text: str) -> Decimal:
    """Parse a decimal amount with at most two fractional digits."""
    stripped = text.strip()
    if not _AMOUNT_RE.match(stripped):
        raise ValueError(f"invalid amount: {text!r}")
    return Decimal(stripped)
```

Note: the regexes are deliberately stricter than `date.fromisoformat` and `Decimal`, both of which accept forms the spec does not (`20260304`, `NaN`, `1e3`).

- [ ] **Step 4: Run test to verify it passes**

Run: `python3 -m unittest test_parse -v`
Expected: PASS (6 tests)

- [ ] **Step 5: Commit**

```bash
git add ledgerlite/parse.py test_parse.py
git commit -m "feat: add strict date and amount field parsers"
```

---

### Task 3: `parse_transactions` and `ParseError`

**Files:**
- Modify: `ledgerlite/parse.py` (append `ParseError`, `HEADER`, `parse_transactions`)
- Test: `test_parse.py` (append two test classes)

**Interfaces:**
- Consumes: `Transaction(date=..., amount=..., description=...)` from Task 1; `parse_date`, `parse_amount` from Task 2.
- Produces:
  - `ledgerlite.parse.ParseError(line: int, message: str)`, an `Exception` with attributes `.line` and `.message`. It carries no path — the CLI owns the path and formats `ledgerlite: <path>:<line>: <message>`.
  - `ledgerlite.parse.parse_transactions(text: str) -> list[Transaction]` — returns rows in input order, raises `ParseError` on the first malformed row.

- [ ] **Step 1: Write the failing test**

Append to `test_parse.py` (and add `from ledgerlite.parse import ParseError, parse_transactions` to the imports at the top):

```python
class ParseTransactionsTest(unittest.TestCase):
    def test_parses_rows_in_input_order(self):
        text = (
            "date,amount,description\n"
            "2026-03-05,-900.00,Rent March\n"
            "2026-03-04,-7.50,Blue Bottle Coffee\n"
        )
        txns = parse_transactions(text)
        self.assertEqual(len(txns), 2)
        self.assertEqual(txns[0].date, date(2026, 3, 5))
        self.assertEqual(txns[0].amount, Decimal("-900.00"))
        self.assertEqual(txns[0].description, "Rent March")
        self.assertEqual(txns[1].description, "Blue Bottle Coffee")

    def test_handles_quoted_description_with_comma(self):
        text = 'date,amount,description\n2026-03-04,-7.50,"Coffee, large"\n'
        self.assertEqual(parse_transactions(text)[0].description, "Coffee, large")

    def test_header_only_file_yields_no_transactions(self):
        self.assertEqual(parse_transactions("date,amount,description\n"), [])

    def test_skips_blank_lines(self):
        text = "date,amount,description\n\n2026-03-04,-7.50,Coffee\n\n"
        self.assertEqual(len(parse_transactions(text)), 1)


class ParseTransactionsErrorTest(unittest.TestCase):
    def assert_parse_error(self, text, line, message_fragment):
        with self.assertRaises(ParseError) as caught:
            parse_transactions(text)
        self.assertEqual(caught.exception.line, line)
        self.assertIn(message_fragment, caught.exception.message)

    # Review Focus 2: empty file and bad header must be reported, not crash.
    def test_empty_file_is_missing_header(self):
        self.assert_parse_error("", 1, "missing header row")

    def test_wrong_header_is_rejected(self):
        self.assert_parse_error("when,how much,what\n2026-03-04,-7.50,Coffee\n", 1, "expected header")

    def test_wrong_column_count_reports_line(self):
        text = "date,amount,description\n2026-03-04,-7.50,Coffee\n2026-03-05,-900.00\n"
        self.assert_parse_error(text, 3, "expected 3 columns, got 2")

    def test_bad_date_reports_line(self):
        text = "date,amount,description\n2026-13-01,-7.50,Coffee\n"
        self.assert_parse_error(text, 2, "invalid date")

    def test_bad_amount_reports_line(self):
        text = "date,amount,description\n2026-03-04,1.005,Coffee\n"
        self.assert_parse_error(text, 2, "invalid amount")

    def test_reports_first_bad_row_only(self):
        text = (
            "date,amount,description\n"
            "2026-03-04,-7.50,Coffee\n"
            "2026-03-05,nope,Rent\n"
            "2026-03-06,also-nope,Gym\n"
        )
        self.assert_parse_error(text, 3, "invalid amount")
```

- [ ] **Step 2: Run test to verify it fails**

Run: `python3 -m unittest test_parse -v`
Expected: FAIL — `ImportError: cannot import name 'ParseError' from 'ledgerlite.parse'`

- [ ] **Step 3: Write minimal implementation**

Append to `ledgerlite/parse.py` (and add `import csv`, `import io`, and `from ledgerlite.model import Transaction` to the imports at the top):

```python
HEADER = ["date", "amount", "description"]


class ParseError(Exception):
    """A row of the transactions CSV is malformed.

    ``line`` is 1-based and counts the header row, so the first data row is
    line 2. The caller supplies the path when formatting the message.
    """

    def __init__(self, line: int, message: str) -> None:
        super().__init__(message)
        self.line = line
        self.message = message


def parse_transactions(text: str) -> list[Transaction]:
    """Parse CSV text into transactions, in input order.

    Raises ParseError on the first malformed row; the whole file is then
    the caller's to reject.
    """
    reader = csv.reader(io.StringIO(text))
    try:
        header = next(reader)
    except StopIteration:
        raise ParseError(1, "missing header row") from None
    if [column.strip().lower() for column in header] != HEADER:
        raise ParseError(1, "expected header date,amount,description")

    transactions = []
    for row in reader:
        line = reader.line_num
        if not row or (len(row) == 1 and not row[0].strip()):
            continue
        if len(row) != 3:
            raise ParseError(line, f"expected 3 columns, got {len(row)}")
        date_text, amount_text, description = row
        try:
            when = parse_date(date_text)
            amount = parse_amount(amount_text)
        except ValueError as exc:
            raise ParseError(line, str(exc)) from None
        transactions.append(Transaction(date=when, amount=amount, description=description))
    return transactions
```

- [ ] **Step 4: Run test to verify it passes**

Run: `python3 -m unittest test_parse -v`
Expected: PASS (16 tests)

- [ ] **Step 5: Commit**

```bash
git add ledgerlite/parse.py test_parse.py
git commit -m "feat: parse transactions CSV with per-line errors"
```

---

### Task 4: Rules parsing and categorization

**Files:**
- Create: `ledgerlite/rules.py`
- Test: `test_rules.py`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `ledgerlite.rules.parse_rules(text: str) -> list[tuple[str, str]]` — `(substring, category)` pairs in file order, substrings already lowercased for case-insensitive matching.
  - `ledgerlite.rules.categorize(description: str, rules: list[tuple[str, str]]) -> str | None` — first match wins, `None` when nothing matches.

- [ ] **Step 1: Write the failing test**

Create `test_rules.py`:

```python
import unittest

from ledgerlite.rules import categorize, parse_rules


class ParseRulesTest(unittest.TestCase):
    def test_parses_rules_in_file_order_with_lowercased_substrings(self):
        self.assertEqual(
            parse_rules("Coffee=food\nRENT=housing\n"),
            [("coffee", "food"), ("rent", "housing")],
        )

    def test_strips_whitespace_around_substring_and_category(self):
        self.assertEqual(parse_rules("  coffee  =  food  \n"), [("coffee", "food")])

    def test_splits_on_first_equals_only(self):
        self.assertEqual(parse_rules("a=b=c\n"), [("a", "b=c")])

    def test_skips_blank_incomplete_and_malformed_lines(self):
        text = "\n   \ncoffee=food\nno-equals-sign\n=food\ncoffee=\n"
        self.assertEqual(parse_rules(text), [("coffee", "food")])

    def test_empty_text_yields_no_rules(self):
        self.assertEqual(parse_rules(""), [])


class CategorizeTest(unittest.TestCase):
    def setUp(self):
        self.rules = parse_rules("coffee=food\nrent=housing\n")

    def test_matches_substring_case_insensitively(self):
        self.assertEqual(categorize("BLUE BOTTLE COFFEE", self.rules), "food")
        self.assertEqual(categorize("Rent March", self.rules), "housing")

    def test_first_matching_rule_wins(self):
        rules = parse_rules("coffee=food\ncoffee=drinks\n")
        self.assertEqual(categorize("Coffee", rules), "food")

    def test_returns_none_when_nothing_matches(self):
        self.assertIsNone(categorize("ACME Payroll", self.rules))

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
"""Categorization rules: `<substring>=<category>`, one per line."""


def parse_rules(text: str) -> list[tuple[str, str]]:
    """Parse rules text into (substring, category) pairs, in file order.

    Substrings are lowercased so matching is case-insensitive. Blank lines
    and lines missing either side of the `=` are ignored.
    """
    rules: list[tuple[str, str]] = []
    for raw_line in text.splitlines():
        line = raw_line.strip()
        if "=" not in line:
            continue
        substring, _, category = line.partition("=")
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

- [ ] **Step 4: Run test to verify it passes**

Run: `python3 -m unittest test_rules -v`
Expected: PASS (9 tests)

- [ ] **Step 5: Commit**

```bash
git add ledgerlite/rules.py test_rules.py
git commit -m "feat: add rules parsing and categorization"
```

---

### Task 5: Date-ordered balances

**Files:**
- Create: `ledgerlite/balance.py`
- Test: `test_balance.py`

**Interfaces:**
- Consumes: `Transaction` from Task 1.
- Produces:
  - `ledgerlite.balance.order_transactions(transactions: list[Transaction]) -> list[Transaction]` — sorted by date, ties keeping input order.
  - `ledgerlite.balance.running_balances(transactions: list[Transaction], opening: Decimal = Decimal("0")) -> list[tuple[Transaction, Decimal]]`
  - `ledgerlite.balance.closing_balance(transactions: list[Transaction], opening: Decimal = Decimal("0")) -> Decimal` — `opening` when there are no transactions.

- [ ] **Step 1: Write the failing test**

Create `test_balance.py`:

```python
import unittest
from datetime import date
from decimal import Decimal

from ledgerlite.balance import closing_balance, order_transactions, running_balances
from ledgerlite.model import Transaction


def txn(day, amount, description="x"):
    return Transaction(date=date(2026, 3, day), amount=Decimal(amount), description=description)


class OrderTransactionsTest(unittest.TestCase):
    def test_orders_by_date(self):
        rows = [txn(5, "-900.00", "rent"), txn(4, "-7.50", "coffee")]
        self.assertEqual([t.description for t in order_transactions(rows)], ["coffee", "rent"])

    def test_ties_keep_input_order(self):
        rows = [txn(4, "1.00", "second-in-file"), txn(4, "2.00", "first-was-earlier")]
        self.assertEqual(
            [t.description for t in order_transactions(rows)],
            ["second-in-file", "first-was-earlier"],
        )

    def test_does_not_mutate_input(self):
        rows = [txn(5, "1.00", "b"), txn(4, "1.00", "a")]
        order_transactions(rows)
        self.assertEqual([t.description for t in rows], ["b", "a"])


class RunningBalancesTest(unittest.TestCase):
    def test_accumulates_in_date_order_from_opening(self):
        rows = [txn(5, "-900.00"), txn(4, "-7.50"), txn(6, "2500.00")]
        result = running_balances(rows, Decimal("100"))
        self.assertEqual(
            [balance for _, balance in result],
            [Decimal("92.50"), Decimal("-807.50"), Decimal("1692.50")],
        )
        self.assertEqual([t.date.day for t, _ in result], [4, 5, 6])

    def test_empty_input_has_no_balances(self):
        self.assertEqual(running_balances([], Decimal("100")), [])


class ClosingBalanceTest(unittest.TestCase):
    def test_is_balance_after_last_transaction(self):
        rows = [txn(5, "-900.00"), txn(4, "-7.50"), txn(6, "2500.00")]
        self.assertEqual(closing_balance(rows, Decimal("100")), Decimal("1692.50"))

    def test_is_opening_when_there_are_no_transactions(self):
        self.assertEqual(closing_balance([], Decimal("100")), Decimal("100"))

    def test_defaults_to_zero_opening(self):
        self.assertEqual(closing_balance([txn(4, "-7.50")]), Decimal("-7.50"))


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run test to verify it fails**

Run: `python3 -m unittest test_balance -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'ledgerlite.balance'`

- [ ] **Step 3: Write minimal implementation**

Create `ledgerlite/balance.py`:

```python
"""Date-ordered running balance and closing balance."""

from decimal import Decimal

from ledgerlite.model import Transaction

ZERO = Decimal("0")


def order_transactions(transactions: list[Transaction]) -> list[Transaction]:
    """Return the transactions ordered by date; ties keep input order."""
    return sorted(transactions, key=lambda txn: txn.date)


def running_balances(
    transactions: list[Transaction], opening: Decimal = ZERO
) -> list[tuple[Transaction, Decimal]]:
    """Pair each transaction, in date order, with the balance after it."""
    balance = opening
    result: list[tuple[Transaction, Decimal]] = []
    for txn in order_transactions(transactions):
        balance += txn.amount
        result.append((txn, balance))
    return result


def closing_balance(transactions: list[Transaction], opening: Decimal = ZERO) -> Decimal:
    """The balance after the last transaction, or `opening` if there are none."""
    balances = running_balances(transactions, opening)
    return balances[-1][1] if balances else opening
```

- [ ] **Step 4: Run test to verify it passes**

Run: `python3 -m unittest test_balance -v`
Expected: PASS (8 tests)

- [ ] **Step 5: Commit**

```bash
git add ledgerlite/balance.py test_balance.py
git commit -m "feat: add date-ordered running and closing balances"
```

---

### Task 6: Report totals and formatting

**Files:**
- Create: `ledgerlite/report.py`
- Test: `test_report.py`

**Interfaces:**
- Consumes: `Transaction` (Task 1), `categorize` (Task 4), `closing_balance` (Task 5).
- Produces:
  - `ledgerlite.report.UNCATEGORIZED = "uncategorized"`
  - `ledgerlite.report.format_amount(value: Decimal) -> str`
  - `ledgerlite.report.category_totals(transactions, rules) -> list[tuple[str, Decimal]]` — alphabetical, `uncategorized` last, categories with no transactions absent.
  - `ledgerlite.report.format_report(transactions, rules, opening: Decimal = Decimal("0")) -> str` — no trailing newline; the CLI adds it via `print`.

- [ ] **Step 1: Write the failing test**

Create `test_report.py`:

```python
import unittest
from datetime import date
from decimal import Decimal

from ledgerlite.model import Transaction
from ledgerlite.report import UNCATEGORIZED, category_totals, format_amount, format_report
from ledgerlite.rules import parse_rules

RULES = parse_rules("coffee=food\nrent=housing\n")


def txn(day, amount, description):
    return Transaction(date=date(2026, 3, day), amount=Decimal(amount), description=description)


class FormatAmountTest(unittest.TestCase):
    def test_uses_exactly_two_fractional_digits(self):
        self.assertEqual(format_amount(Decimal("-12.5")), "-12.50")
        self.assertEqual(format_amount(Decimal("0")), "0.00")
        self.assertEqual(format_amount(Decimal("1200")), "1200.00")
        self.assertEqual(format_amount(Decimal("-900.00")), "-900.00")

    def test_no_thousands_separators(self):
        self.assertEqual(format_amount(Decimal("1234567.89")), "1234567.89")

    # Review Focus 4: -0.00 is not negative.
    def test_negative_zero_prints_without_sign(self):
        self.assertEqual(format_amount(Decimal("-0.00")), "0.00")


class CategoryTotalsTest(unittest.TestCase):
    def test_sums_per_category_alphabetically_with_uncategorized_last(self):
        rows = [
            txn(4, "2500.00", "ACME Payroll"),
            txn(5, "-900.00", "Rent March"),
            txn(6, "-7.50", "Blue Bottle Coffee"),
        ]
        self.assertEqual(
            category_totals(rows, RULES),
            [("food", Decimal("-7.50")), ("housing", Decimal("-900.00")), (UNCATEGORIZED, Decimal("2500.00"))],
        )

    def test_omits_uncategorized_when_everything_matches(self):
        rows = [txn(4, "-7.50", "Coffee"), txn(5, "-2.50", "coffee again")]
        self.assertEqual(category_totals(rows, RULES), [("food", Decimal("-10.00"))])

    def test_without_rules_everything_is_uncategorized(self):
        rows = [txn(4, "-7.50", "Coffee"), txn(5, "-900.00", "Rent")]
        self.assertEqual(category_totals(rows, []), [(UNCATEGORIZED, Decimal("-907.50"))])

    def test_no_transactions_yields_no_lines(self):
        self.assertEqual(category_totals([], RULES), [])


class FormatReportTest(unittest.TestCase):
    def test_matches_the_spec_example(self):
        rows = [
            txn(4, "-7.50", "Blue Bottle Coffee"),
            txn(5, "-900.00", "Rent March"),
            txn(6, "2500.00", "ACME Payroll"),
        ]
        self.assertEqual(
            format_report(rows, RULES, Decimal("100")),
            "food: -7.50\nhousing: -900.00\nuncategorized: 2500.00\n\nclosing balance: 1692.50",
        )

    # Review Focus 3: no leading blank line, no phantom uncategorized line.
    def test_no_transactions_prints_only_the_closing_balance(self):
        self.assertEqual(format_report([], RULES, Decimal("0")), "closing balance: 0.00")

    def test_defaults_to_zero_opening(self):
        self.assertEqual(
            format_report([txn(4, "-7.50", "Coffee")], RULES),
            "food: -7.50\n\nclosing balance: -7.50",
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
"""Per-category totals and report formatting."""

from decimal import Decimal

from ledgerlite.balance import closing_balance
from ledgerlite.model import Transaction
from ledgerlite.rules import categorize

UNCATEGORIZED = "uncategorized"
ZERO = Decimal("0")


def format_amount(value: Decimal) -> str:
    """Format an amount with exactly two fractional digits, no separators."""
    if value == ZERO:
        value = abs(value)  # a -0.00 total is not negative
    return f"{value:.2f}"


def category_totals(
    transactions: list[Transaction], rules: list[tuple[str, str]]
) -> list[tuple[str, Decimal]]:
    """Total each category: alphabetical, with `uncategorized` always last."""
    totals: dict[str, Decimal] = {}
    for txn in transactions:
        name = categorize(txn.description, rules) or UNCATEGORIZED
        totals[name] = totals.get(name, ZERO) + txn.amount
    ordered = sorted((name, total) for name, total in totals.items() if name != UNCATEGORIZED)
    if UNCATEGORIZED in totals:
        ordered.append((UNCATEGORIZED, totals[UNCATEGORIZED]))
    return ordered


def format_report(
    transactions: list[Transaction],
    rules: list[tuple[str, str]],
    opening: Decimal = ZERO,
) -> str:
    """Render the whole report, without a trailing newline."""
    lines = [
        f"{name}: {format_amount(total)}"
        for name, total in category_totals(transactions, rules)
    ]
    if lines:
        lines.append("")
    lines.append(f"closing balance: {format_amount(closing_balance(transactions, opening))}")
    return "\n".join(lines)
```

- [ ] **Step 4: Run test to verify it passes**

Run: `python3 -m unittest test_report -v`
Expected: PASS (10 tests)

- [ ] **Step 5: Commit**

```bash
git add ledgerlite/report.py test_report.py
git commit -m "feat: add category totals and report formatting"
```

---

### Task 7: CLI, exit codes, and entry point

**Files:**
- Create: `ledgerlite/cli.py`
- Create: `ledgerlite/__main__.py`
- Test: `test_cli.py`

**Interfaces:**
- Consumes: `parse_amount`, `parse_transactions`, `ParseError` (Tasks 2–3), `parse_rules` (Task 4), `format_report` (Task 6).
- Produces: `ledgerlite.cli.main(argv: list[str] | None = None) -> int`.
- Behavior decisions this task locks in:
  - Files are read as UTF-8 with a BOM tolerated (`encoding="utf-8-sig"`).
  - Read failures (exit 1) are reported before row parsing (exit 2), and the rules file is read before the transactions file is parsed, so an unreadable rules file wins over a malformed row.
  - `--opening` goes through `parse_amount`, so it accepts the same forms as an amount column; a bad value is an argparse usage error.

- [ ] **Step 1: Write the failing test**

Create `test_cli.py`:

```python
import contextlib
import io
import os
import tempfile
import unittest

from ledgerlite.cli import main

TRANSACTIONS = (
    "date,amount,description\n"
    "2026-03-06,2500.00,ACME Payroll\n"
    "2026-03-04,-7.50,Blue Bottle Coffee\n"
    "2026-03-05,-900.00,Rent March\n"
)
RULES = "coffee=food\nrent=housing\n"


class CliTestCase(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)

    def write(self, name, text):
        path = os.path.join(self.tmp.name, name)
        with open(path, "w", encoding="utf-8") as handle:
            handle.write(text)
        return path

    def run_main(self, argv):
        out, err = io.StringIO(), io.StringIO()
        with contextlib.redirect_stdout(out), contextlib.redirect_stderr(err):
            code = main(argv)
        return code, out.getvalue(), err.getvalue()


class ReportSuccessTest(CliTestCase):
    def test_prints_report_and_returns_zero(self):
        txns = self.write("txns.csv", TRANSACTIONS)
        rules = self.write("rules.txt", RULES)
        code, out, err = self.run_main(["report", txns, "--rules", rules, "--opening", "100"])
        self.assertEqual(code, 0)
        self.assertEqual(err, "")
        self.assertEqual(
            out,
            "food: -7.50\nhousing: -900.00\nuncategorized: 2500.00\n\nclosing balance: 1692.50\n",
        )

    def test_without_rules_everything_is_uncategorized(self):
        txns = self.write("txns.csv", TRANSACTIONS)
        code, out, _ = self.run_main(["report", txns])
        self.assertEqual(code, 0)
        self.assertEqual(out, "uncategorized: 1592.50\n\nclosing balance: 1592.50\n")

    def test_opening_defaults_to_zero(self):
        txns = self.write("txns.csv", "date,amount,description\n2026-03-04,-7.50,Coffee\n")
        code, out, _ = self.run_main(["report", txns])
        self.assertEqual(code, 0)
        self.assertEqual(out, "uncategorized: -7.50\n\nclosing balance: -7.50\n")

    def test_tolerates_utf8_bom(self):
        path = os.path.join(self.tmp.name, "bom.csv")
        with open(path, "w", encoding="utf-8-sig") as handle:
            handle.write("date,amount,description\n2026-03-04,-7.50,Coffee\n")
        code, out, err = self.run_main(["report", path])
        self.assertEqual((code, err), (0, ""))
        self.assertIn("closing balance: -7.50", out)


class ReadFailureTest(CliTestCase):
    def test_missing_transactions_file_returns_one(self):
        missing = os.path.join(self.tmp.name, "nope.csv")
        code, out, err = self.run_main(["report", missing])
        self.assertEqual(code, 1)
        self.assertEqual(out, "")
        self.assertEqual(err, f"ledgerlite: cannot read {missing}: No such file or directory\n")

    def test_directory_as_transactions_file_returns_one(self):
        code, out, err = self.run_main(["report", self.tmp.name])
        self.assertEqual(code, 1)
        self.assertEqual(out, "")
        self.assertTrue(err.startswith(f"ledgerlite: cannot read {self.tmp.name}: "))

    # Review Focus 5: the spec never mentions this file failing to open.
    def test_missing_rules_file_returns_one(self):
        txns = self.write("txns.csv", TRANSACTIONS)
        missing = os.path.join(self.tmp.name, "nope.txt")
        code, out, err = self.run_main(["report", txns, "--rules", missing])
        self.assertEqual(code, 1)
        self.assertEqual(out, "")
        self.assertEqual(err, f"ledgerlite: cannot read {missing}: No such file or directory\n")


class MalformedRowTest(CliTestCase):
    def test_malformed_row_returns_two_and_prints_nothing_to_stdout(self):
        txns = self.write(
            "txns.csv",
            "date,amount,description\n2026-03-04,-7.50,Coffee\n2026-03-05,1.005,Rent\n",
        )
        code, out, err = self.run_main(["report", txns])
        self.assertEqual(code, 2)
        self.assertEqual(out, "")
        self.assertEqual(err, f"ledgerlite: {txns}:3: invalid amount: '1.005'\n")

    def test_empty_file_returns_two(self):
        txns = self.write("empty.csv", "")
        code, out, err = self.run_main(["report", txns])
        self.assertEqual(code, 2)
        self.assertEqual(out, "")
        self.assertEqual(err, f"ledgerlite: {txns}:1: missing header row\n")

    def test_unreadable_rules_file_wins_over_malformed_row(self):
        txns = self.write("txns.csv", "date,amount,description\n2026-03-04,nope,Coffee\n")
        missing = os.path.join(self.tmp.name, "nope.txt")
        code, _, err = self.run_main(["report", txns, "--rules", missing])
        self.assertEqual(code, 1)
        self.assertIn("cannot read", err)


class UsageTest(CliTestCase):
    def test_bad_opening_value_is_a_usage_error(self):
        txns = self.write("txns.csv", TRANSACTIONS)
        with contextlib.redirect_stderr(io.StringIO()) as err:
            with self.assertRaises(SystemExit) as caught:
                main(["report", txns, "--opening", "1.005"])
        self.assertEqual(caught.exception.code, 2)
        self.assertIn("invalid amount", err.getvalue())

    def test_missing_subcommand_is_a_usage_error(self):
        with contextlib.redirect_stderr(io.StringIO()):
            with self.assertRaises(SystemExit):
                main([])


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run test to verify it fails**

Run: `python3 -m unittest test_cli -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'ledgerlite.cli'`

- [ ] **Step 3: Write minimal implementation**

Create `ledgerlite/cli.py`:

```python
"""Command-line entry point."""

import argparse
import sys
from decimal import Decimal

from ledgerlite.parse import ParseError, parse_amount, parse_transactions
from ledgerlite.report import format_report
from ledgerlite.rules import parse_rules

PROG = "ledgerlite"


class _ReadError(Exception):
    """A file could not be read."""

    def __init__(self, path: str, reason: str) -> None:
        super().__init__(reason)
        self.path = path
        self.reason = reason


def _read_text(path: str) -> str:
    try:
        with open(path, encoding="utf-8-sig") as handle:
            return handle.read()
    except OSError as exc:
        raise _ReadError(path, exc.strerror or str(exc)) from None
    except UnicodeDecodeError:
        raise _ReadError(path, "not valid UTF-8 text") from None


def _opening_amount(text: str) -> Decimal:
    try:
        return parse_amount(text)
    except ValueError as exc:
        raise argparse.ArgumentTypeError(str(exc)) from None


def _build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(prog=PROG)
    subcommands = parser.add_subparsers(dest="command", required=True)
    report = subcommands.add_parser("report", help="print a per-category summary")
    report.add_argument("transactions", help="path to the transactions CSV")
    report.add_argument("--rules", help="path to the rules file")
    report.add_argument(
        "--opening",
        type=_opening_amount,
        default=Decimal("0"),
        help="opening balance (default: 0)",
    )
    return parser


def main(argv: list[str] | None = None) -> int:
    """Run the CLI. Returns the process exit code."""
    args = _build_parser().parse_args(argv)

    try:
        transactions_text = _read_text(args.transactions)
        rules_text = _read_text(args.rules) if args.rules is not None else ""
    except _ReadError as exc:
        print(f"{PROG}: cannot read {exc.path}: {exc.reason}", file=sys.stderr)
        return 1

    try:
        transactions = parse_transactions(transactions_text)
    except ParseError as exc:
        print(f"{PROG}: {args.transactions}:{exc.line}: {exc.message}", file=sys.stderr)
        return 2

    print(format_report(transactions, parse_rules(rules_text), args.opening))
    return 0
```

Create `ledgerlite/__main__.py`:

```python
"""Run the CLI with `python3 -m ledgerlite`."""

import sys

from ledgerlite.cli import main

if __name__ == "__main__":
    sys.exit(main())
```

- [ ] **Step 4: Run test to verify it passes**

Run: `python3 -m unittest test_cli -v`
Expected: PASS (12 tests)

- [ ] **Step 5: Run the whole suite and the real command**

Run: `python3 -m unittest -v`
Expected: PASS, all tests from all five test modules, no errors.

Then exercise the real entry point end to end:

```bash
printf 'date,amount,description\n2026-03-06,2500.00,ACME Payroll\n2026-03-04,-7.50,Blue Bottle Coffee\n2026-03-05,-900.00,Rent March\n' > /tmp/ledgerlite-txns.csv
printf 'coffee=food\nrent=housing\n' > /tmp/ledgerlite-rules.txt
python3 -m ledgerlite report /tmp/ledgerlite-txns.csv --rules /tmp/ledgerlite-rules.txt --opening 100
echo "exit: $?"
```

Expected, matching the spec example exactly:

```
food: -7.50
housing: -900.00
uncategorized: 2500.00

closing balance: 1692.50
exit: 0
```

- [ ] **Step 6: Commit**

```bash
git add ledgerlite/cli.py ledgerlite/__main__.py test_cli.py
git commit -m "feat: add ledgerlite report CLI"
```

---

### Task 8: README

**Files:**
- Create: `README.md`

**Interfaces:**
- Consumes: the CLI from Task 7. Produces nothing other tasks use.

- [ ] **Step 1: Write the README**

Create `README.md`:

```markdown
# ledgerlite

Summarize a CSV of bank transactions by category. Standard library only,
Python 3.11+.

## Usage

    python3 -m ledgerlite report TRANSACTIONS [--rules RULES] [--opening AMOUNT]

`TRANSACTIONS` is a CSV with a `date,amount,description` header row. Dates
are ISO 8601 (`2026-03-04`); amounts are decimal with at most two
fractional digits, negative for money out.

`RULES` is a text file of `<substring>=<category>` lines. Matching is
case-insensitive on the description and the first matching rule wins;
transactions matching no rule are reported as `uncategorized`.

## Example

    $ cat txns.csv
    date,amount,description
    2026-03-06,2500.00,ACME Payroll
    2026-03-04,-7.50,Blue Bottle Coffee
    2026-03-05,-900.00,Rent March
    $ cat rules.txt
    coffee=food
    rent=housing
    $ python3 -m ledgerlite report txns.csv --rules rules.txt --opening 100
    food: -7.50
    housing: -900.00
    uncategorized: 2500.00

    closing balance: 1692.50

## Exit codes

| Code | Meaning |
| ---- | ------- |
| 0    | Report printed. |
| 1    | A file could not be read. |
| 2    | The transactions file has a malformed row; the whole file is rejected. |

## Tests

    python3 -m unittest
```

- [ ] **Step 2: Verify the documented example still works**

Run the example from Task 7 Step 5 again and confirm the output matches the README byte for byte.

- [ ] **Step 3: Commit**

```bash
git add README.md
git commit -m "docs: add README"
```
