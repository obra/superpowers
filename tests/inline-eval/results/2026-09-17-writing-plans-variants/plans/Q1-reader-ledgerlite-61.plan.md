# ledgerlite Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `ledgerlite`, a standard-library-only command-line tool that reads a transactions CSV, categorizes each row with a rules file, and prints per-category totals plus the closing balance.

**Architecture:** Six small modules under `ledgerlite/`, each with one responsibility and no upward dependencies: `model` (data), `parse` (CSV text → transactions), `rules` (rules text → matchers), `balance` (ordering and running balance), `report` (totals and text formatting), `cli` (argparse, file I/O, exit codes). Pure functions take *text*, not paths — `cli` owns all file reading so it can own the exit-code-1 path, and every other module is testable with string literals. Money is `decimal.Decimal` end to end; no float ever touches an amount.

**Tech Stack:** Python 3.11+, standard library only (`argparse`, `csv`, `dataclasses`, `datetime`, `decimal`, `io`, `pathlib`, `sys`). Tests are `unittest`, at the repo root, run with `python3 -m unittest`.

**Spec:** `design.md` (same directory as this plan)

## Global Constraints

- Python 3.11 or newer. Standard library only — no third-party dependencies, no `pyproject.toml` needed.
- Amounts are `decimal.Decimal` everywhere. Never `float`, not even transiently.
- Test files live at the repo root as `test_<module>.py` and are discovered by bare `python3 -m unittest`.
- Package layout is fixed by the spec: `ledgerlite/{__init__,model,parse,rules,balance,report,cli}.py`. One addition: `ledgerlite/__main__.py`, a three-line shim so the tool is runnable as `python3 -m ledgerlite report ...` (the spec names the command line but no entry point).
- Exit codes: `0` success, `1` a file could not be read, `2` a malformed input file (nothing written to stdout).
- User-facing messages are prefixed `ledgerlite: ` and go to stderr.
- Amounts are printed with exactly two fractional digits, a leading `-` for negatives, and no thousands separators.

## Review Focus

Five input classes the spec implies but does not spell out, most likely to bite first. Each already has its test assigned to the task that owns the code:

1. **A CSV with no header row** — data on line 1 would be silently swallowed as a header, producing a quietly wrong closing balance. Task 2 validates the header and exits 2 instead.
2. **A transactions file that is not UTF-8 text** (a binary file, a mis-encoded export) — must produce `ledgerlite: cannot read <path>: ...` and exit 1, not a `UnicodeDecodeError` traceback. Task 6.
3. **`--opening 1.005` or `--opening abc`** — must be rejected rather than silently rounded or crashing; the CSV's amount rules apply to the opening amount too. Task 6.
4. **A transactions file with no data rows** (header only, or completely empty) — must print just `closing balance: <opening>` with no stray leading blank line and no crash. Tasks 5 and 6.
5. **An amount of `-0.00` in the input** — the spec prints zero as `0.00`; naive formatting yields `-0.00`. Task 5.

---

### Task 1: Package skeleton and the Transaction model

**Files:**
- Create: `ledgerlite/__init__.py`
- Create: `ledgerlite/model.py`
- Create: `.gitignore`
- Test: `test_model.py`

**Interfaces:**
- Consumes: nothing.
- Produces: `ledgerlite.model.Transaction`, a frozen dataclass with fields `date: datetime.date`, `amount: decimal.Decimal`, `description: str`, in that positional order. Every later task uses it.

- [ ] **Step 1: Write the failing test**

Create `test_model.py`:

```python
import datetime
import unittest
from dataclasses import FrozenInstanceError
from decimal import Decimal

from ledgerlite.model import Transaction


class TransactionTest(unittest.TestCase):
    def test_holds_date_amount_and_description(self):
        transaction = Transaction(datetime.date(2026, 3, 4), Decimal("-7.50"), "Coffee Shop")
        self.assertEqual(transaction.date, datetime.date(2026, 3, 4))
        self.assertEqual(transaction.amount, Decimal("-7.50"))
        self.assertEqual(transaction.description, "Coffee Shop")

    def test_amount_is_a_decimal_not_a_float(self):
        transaction = Transaction(datetime.date(2026, 3, 4), Decimal("0.10"), "x")
        self.assertIsInstance(transaction.amount, Decimal)

    def test_is_frozen(self):
        transaction = Transaction(datetime.date(2026, 3, 4), Decimal("1.00"), "x")
        with self.assertRaises(FrozenInstanceError):
            transaction.amount = Decimal("2.00")


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run test to verify it fails**

Run: `python3 -m unittest test_model -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'ledgerlite'`

- [ ] **Step 3: Write minimal implementation**

Create `.gitignore`:

```
__pycache__/
*.pyc
```

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
    date: datetime.date
    amount: Decimal
    description: str
```

- [ ] **Step 4: Run test to verify it passes**

Run: `python3 -m unittest -v`
Expected: PASS, 3 tests

- [ ] **Step 5: Commit**

```bash
git add .gitignore ledgerlite/__init__.py ledgerlite/model.py test_model.py
git commit -m "feat: add Transaction model and package skeleton"
```

---

### Task 2: Parse the transactions CSV

**Files:**
- Create: `ledgerlite/parse.py`
- Test: `test_parse.py`

**Interfaces:**
- Consumes: `Transaction(date, amount, description)` from Task 1.
- Produces:
  - `ledgerlite.parse.ParseError(line: int, message: str)`, an `Exception` subclass with attributes `.line` and `.message`. Task 3 raises it for the rules file; Task 6 formats it.
  - `parse_transactions(text: str) -> list[Transaction]` — takes CSV *contents*, returns transactions in file order, raises `ParseError` on the first bad row.
  - `parse_amount(text: str) -> Decimal` — strips whitespace, returns a `Decimal` with at most two fractional digits, raises `ValueError` whose `str()` is the user-facing message. Task 6 reuses this for `--opening`.

Decisions this task locks in, all pinned by tests below:

- The first row is the header and must be `date,amount,description` (per-cell whitespace stripped, case-insensitive). A mismatch is a line-1 `ParseError` — this is what stops a headerless CSV from silently losing its first transaction.
- Completely empty text is zero transactions, not a header error: there is no row to lose.
- Any row that is not exactly 3 columns is malformed, including a blank line in the middle of the file (0 columns).
- Line numbers come from `csv.reader.line_num`, so a quoted description containing a newline does not skew them.
- "More than two fractional digits" is judged by the parsed `Decimal`'s exponent, which also rejects `1e-3`. `NaN` and `Infinity` parse as `Decimal` but are rejected as not-a-number.

- [ ] **Step 1: Write the failing test**

Create `test_parse.py`:

```python
import datetime
import unittest
from decimal import Decimal

from ledgerlite.model import Transaction
from ledgerlite.parse import ParseError, parse_amount, parse_transactions

HEADER = "date,amount,description\n"


class ParseTransactionsTest(unittest.TestCase):
    def test_parses_rows_in_file_order(self):
        text = HEADER + "2026-03-05,-900.00,Rent March\n2026-03-04,-7.50,Coffee Shop\n"
        self.assertEqual(
            parse_transactions(text),
            [
                Transaction(datetime.date(2026, 3, 5), Decimal("-900.00"), "Rent March"),
                Transaction(datetime.date(2026, 3, 4), Decimal("-7.50"), "Coffee Shop"),
            ],
        )

    def test_amounts_are_decimals(self):
        transactions = parse_transactions(HEADER + "2026-03-04,0.10,a\n")
        self.assertIsInstance(transactions[0].amount, Decimal)

    def test_accepts_zero_one_and_two_fractional_digits_and_a_leading_plus(self):
        text = HEADER + "2026-03-04,1200,a\n2026-03-04,1.5,b\n2026-03-04,+1.50,c\n"
        self.assertEqual(
            [t.amount for t in parse_transactions(text)],
            [Decimal("1200"), Decimal("1.5"), Decimal("1.50")],
        )

    def test_header_only_file_has_no_transactions(self):
        self.assertEqual(parse_transactions(HEADER), [])

    def test_empty_file_has_no_transactions(self):
        self.assertEqual(parse_transactions(""), [])

    def test_description_keeps_its_spacing_and_commas(self):
        text = HEADER + '2026-03-04,-7.50,"  Coffee, Shop  "\n'
        self.assertEqual(parse_transactions(text)[0].description, "  Coffee, Shop  ")

    def test_rejects_a_missing_header(self):
        text = "2026-03-04,-7.50,Coffee Shop\n"
        with self.assertRaises(ParseError) as caught:
            parse_transactions(text)
        self.assertEqual(caught.exception.line, 1)
        self.assertEqual(caught.exception.message, "expected header date,amount,description")

    def test_accepts_a_header_with_padding_and_different_case(self):
        text = "Date, Amount , DESCRIPTION\n2026-03-04,-7.50,a\n"
        self.assertEqual(len(parse_transactions(text)), 1)

    def test_rejects_wrong_column_count(self):
        text = HEADER + "2026-03-04,-7.50,a\n2026-03-05,-1.00\n"
        with self.assertRaises(ParseError) as caught:
            parse_transactions(text)
        self.assertEqual(caught.exception.line, 3)
        self.assertEqual(caught.exception.message, "expected 3 columns, got 2")

    def test_rejects_a_blank_line(self):
        text = HEADER + "2026-03-04,-7.50,a\n\n"
        with self.assertRaises(ParseError) as caught:
            parse_transactions(text)
        self.assertEqual(caught.exception.line, 3)
        self.assertEqual(caught.exception.message, "expected 3 columns, got 0")

    def test_rejects_an_unparseable_date(self):
        text = HEADER + "04/03/2026,-7.50,a\n"
        with self.assertRaises(ParseError) as caught:
            parse_transactions(text)
        self.assertEqual(caught.exception.line, 2)
        self.assertEqual(caught.exception.message, "invalid date '04/03/2026'")

    def test_rejects_an_impossible_date(self):
        text = HEADER + "2026-13-40,-7.50,a\n"
        with self.assertRaises(ParseError) as caught:
            parse_transactions(text)
        self.assertEqual(caught.exception.message, "invalid date '2026-13-40'")

    def test_rejects_a_non_numeric_amount(self):
        text = HEADER + "2026-03-04,twelve,a\n"
        with self.assertRaises(ParseError) as caught:
            parse_transactions(text)
        self.assertEqual(caught.exception.line, 2)
        self.assertEqual(caught.exception.message, "invalid amount 'twelve'")

    def test_rejects_an_empty_amount(self):
        text = HEADER + "2026-03-04,,a\n"
        with self.assertRaises(ParseError) as caught:
            parse_transactions(text)
        self.assertEqual(caught.exception.message, "invalid amount ''")

    def test_rejects_three_fractional_digits(self):
        text = HEADER + "2026-03-04,1.005,a\n"
        with self.assertRaises(ParseError) as caught:
            parse_transactions(text)
        self.assertEqual(
            caught.exception.message,
            "amount '1.005' has more than two fractional digits",
        )

    def test_line_number_survives_a_newline_inside_a_quoted_description(self):
        text = HEADER + '2026-03-04,-7.50,"two\nlines"\n2026-03-05,nope,b\n'
        with self.assertRaises(ParseError) as caught:
            parse_transactions(text)
        self.assertEqual(caught.exception.line, 4)


class ParseAmountTest(unittest.TestCase):
    def test_strips_surrounding_whitespace(self):
        self.assertEqual(parse_amount("  -12.50 "), Decimal("-12.50"))

    def test_rejects_exponent_notation_below_two_places(self):
        with self.assertRaises(ValueError) as caught:
            parse_amount("1e-3")
        self.assertEqual(str(caught.exception), "amount '1e-3' has more than two fractional digits")

    def test_rejects_not_a_number(self):
        for text in ("NaN", "Infinity", "-Infinity"):
            with self.subTest(text=text), self.assertRaises(ValueError) as caught:
                parse_amount(text)
            self.assertEqual(str(caught.exception), f"invalid amount '{text}'")


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run test to verify it fails**

Run: `python3 -m unittest test_parse -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'ledgerlite.parse'`

- [ ] **Step 3: Write minimal implementation**

Create `ledgerlite/parse.py`:

```python
"""Turn transactions-CSV text into Transaction records."""

import csv
import datetime
import io
from decimal import Decimal, InvalidOperation

from ledgerlite.model import Transaction

HEADER = ("date", "amount", "description")


class ParseError(Exception):
    """A line of an input file could not be parsed."""

    def __init__(self, line: int, message: str) -> None:
        super().__init__(f"{line}: {message}")
        self.line = line
        self.message = message


def parse_transactions(text: str) -> list[Transaction]:
    """Parse CSV text into transactions, in file order.

    Raises ParseError on the first malformed line; the caller is expected to
    reject the whole file.
    """
    reader = csv.reader(io.StringIO(text))
    transactions: list[Transaction] = []
    for index, row in enumerate(reader):
        if index == 0:
            if tuple(cell.strip().lower() for cell in row) != HEADER:
                raise ParseError(reader.line_num, "expected header date,amount,description")
            continue
        if len(row) != 3:
            raise ParseError(reader.line_num, f"expected 3 columns, got {len(row)}")
        raw_date, raw_amount, description = row
        date = _parse_date(raw_date, reader.line_num)
        try:
            amount = parse_amount(raw_amount)
        except ValueError as error:
            raise ParseError(reader.line_num, str(error)) from None
        transactions.append(Transaction(date, amount, description))
    return transactions


def parse_amount(text: str) -> Decimal:
    """Parse an amount with at most two fractional digits.

    Raises ValueError whose message is fit to show a user.
    """
    text = text.strip()
    try:
        amount = Decimal(text)
    except InvalidOperation:
        raise ValueError(f"invalid amount '{text}'") from None
    if not amount.is_finite():
        raise ValueError(f"invalid amount '{text}'")
    if amount.as_tuple().exponent < -2:
        raise ValueError(f"amount '{text}' has more than two fractional digits")
    return amount


def _parse_date(text: str, line: int) -> datetime.date:
    stripped = text.strip()
    try:
        return datetime.date.fromisoformat(stripped)
    except ValueError:
        raise ParseError(line, f"invalid date '{stripped}'") from None
```

- [ ] **Step 4: Run test to verify it passes**

Run: `python3 -m unittest -v`
Expected: PASS, all tests

- [ ] **Step 5: Commit**

```bash
git add ledgerlite/parse.py test_parse.py
git commit -m "feat: parse transactions CSV with per-line error reporting"
```

---

### Task 3: Parse and apply categorization rules

**Files:**
- Create: `ledgerlite/rules.py`
- Test: `test_rules.py`

**Interfaces:**
- Consumes: `ParseError(line, message)` from Task 2 (`rules.py` imports it; `parse.py` does not import `rules.py`, so there is no cycle).
- Produces:
  - `parse_rules(text: str) -> list[tuple[str, str]]` — rules text to `(substring, category)` pairs in file order, raising `ParseError` on a malformed line.
  - `categorize(description: str, rules: list[tuple[str, str]]) -> str | None` — first matching rule's category, case-insensitive substring match, or `None`.

Decisions this task locks in:

- A line is split on its **first** `=`, so a category may contain `=` but a substring may not.
- Substring and category are stripped of surrounding whitespace.
- Blank and whitespace-only lines are skipped. There is no comment syntax.
- A non-blank line with no `=`, an empty substring, or an empty category is a `ParseError` — silently ignoring a typo'd rule would silently misfile money. Line numbers are 1-based over `splitlines()`.

- [ ] **Step 1: Write the failing test**

Create `test_rules.py`:

```python
import unittest

from ledgerlite.parse import ParseError
from ledgerlite.rules import categorize, parse_rules


class ParseRulesTest(unittest.TestCase):
    def test_parses_one_pair_per_line_in_order(self):
        self.assertEqual(
            parse_rules("coffee=food\nrent=housing\n"),
            [("coffee", "food"), ("rent", "housing")],
        )

    def test_strips_whitespace_around_substring_and_category(self):
        self.assertEqual(parse_rules("  coffee  =  food  \n"), [("coffee", "food")])

    def test_skips_blank_lines(self):
        self.assertEqual(parse_rules("\ncoffee=food\n   \n"), [("coffee", "food")])

    def test_empty_text_has_no_rules(self):
        self.assertEqual(parse_rules(""), [])

    def test_splits_on_the_first_equals_so_a_category_may_contain_one(self):
        self.assertEqual(parse_rules("a=b=c\n"), [("a", "b=c")])

    def test_rejects_a_line_without_an_equals(self):
        with self.assertRaises(ParseError) as caught:
            parse_rules("coffee=food\nrent housing\n")
        self.assertEqual(caught.exception.line, 2)
        self.assertEqual(
            caught.exception.message,
            "expected '<substring>=<category>', got 'rent housing'",
        )

    def test_rejects_an_empty_substring(self):
        with self.assertRaises(ParseError) as caught:
            parse_rules("=food\n")
        self.assertEqual(caught.exception.line, 1)
        self.assertEqual(caught.exception.message, "rule has an empty substring")

    def test_rejects_an_empty_category(self):
        with self.assertRaises(ParseError) as caught:
            parse_rules("coffee=\n")
        self.assertEqual(caught.exception.line, 1)
        self.assertEqual(caught.exception.message, "rule has an empty category")


class CategorizeTest(unittest.TestCase):
    RULES = [("coffee", "food"), ("rent", "housing")]

    def test_matches_a_substring_of_the_description(self):
        self.assertEqual(categorize("Blue Bottle Coffee Co", self.RULES), "food")

    def test_matching_ignores_case_in_both_directions(self):
        self.assertEqual(categorize("COFFEE", self.RULES), "food")
        self.assertEqual(categorize("monthly rent", [("RENT", "housing")]), "housing")

    def test_first_matching_rule_wins(self):
        rules = [("coffee", "food"), ("coffee shop", "treats")]
        self.assertEqual(categorize("Coffee Shop", rules), "food")

    def test_no_match_is_none(self):
        self.assertIsNone(categorize("Salary", self.RULES))

    def test_no_rules_means_no_match(self):
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
"""Rules text and the category lookup it powers."""

from ledgerlite.parse import ParseError


def parse_rules(text: str) -> list[tuple[str, str]]:
    """Parse `<substring>=<category>` lines into pairs, in file order."""
    rules: list[tuple[str, str]] = []
    for line_number, line in enumerate(text.splitlines(), start=1):
        if not line.strip():
            continue
        substring, separator, category = line.partition("=")
        if not separator:
            raise ParseError(
                line_number,
                f"expected '<substring>=<category>', got '{line.strip()}'",
            )
        substring, category = substring.strip(), category.strip()
        if not substring:
            raise ParseError(line_number, "rule has an empty substring")
        if not category:
            raise ParseError(line_number, "rule has an empty category")
        rules.append((substring, category))
    return rules


def categorize(description: str, rules: list[tuple[str, str]]) -> str | None:
    """Category of the first rule whose substring appears in description."""
    lowered = description.lower()
    for substring, category in rules:
        if substring.lower() in lowered:
            return category
    return None
```

- [ ] **Step 4: Run test to verify it passes**

Run: `python3 -m unittest -v`
Expected: PASS, all tests

- [ ] **Step 5: Commit**

```bash
git add ledgerlite/rules.py test_rules.py
git commit -m "feat: parse rules file and categorize descriptions"
```

---

### Task 4: Date ordering and the closing balance

**Files:**
- Create: `ledgerlite/balance.py`
- Test: `test_balance.py`

**Interfaces:**
- Consumes: `Transaction` from Task 1.
- Produces:
  - `in_date_order(transactions: list[Transaction]) -> list[Transaction]` — a new list sorted by date, ties keeping input order (Python's sort is stable).
  - `closing_balance(transactions: list[Transaction], opening: Decimal) -> Decimal` — the running balance after the last transaction in date order; `opening` when there are none.

- [ ] **Step 1: Write the failing test**

Create `test_balance.py`:

```python
import datetime
import unittest
from decimal import Decimal

from ledgerlite.balance import closing_balance, in_date_order
from ledgerlite.model import Transaction


def transaction(day, amount, description="x"):
    return Transaction(datetime.date(2026, 3, day), Decimal(amount), description)


class InDateOrderTest(unittest.TestCase):
    def test_orders_by_date(self):
        rows = [transaction(5, "1.00", "b"), transaction(4, "2.00", "a")]
        self.assertEqual([t.description for t in in_date_order(rows)], ["a", "b"])

    def test_ties_keep_input_order(self):
        rows = [transaction(4, "1.00", "first"), transaction(4, "2.00", "second")]
        self.assertEqual(
            [t.description for t in in_date_order(rows)], ["first", "second"]
        )

    def test_does_not_mutate_its_argument(self):
        rows = [transaction(5, "1.00", "b"), transaction(4, "2.00", "a")]
        in_date_order(rows)
        self.assertEqual([t.description for t in rows], ["b", "a"])

    def test_empty_list(self):
        self.assertEqual(in_date_order([]), [])


class ClosingBalanceTest(unittest.TestCase):
    def test_adds_every_amount_to_the_opening_amount(self):
        rows = [transaction(4, "-7.50"), transaction(5, "-900.00"), transaction(6, "2500.00")]
        self.assertEqual(closing_balance(rows, Decimal("100")), Decimal("1692.50"))

    def test_no_transactions_is_the_opening_amount(self):
        self.assertEqual(closing_balance([], Decimal("100")), Decimal("100"))

    def test_default_opening_of_zero(self):
        self.assertEqual(closing_balance([transaction(4, "-7.50")], Decimal("0")), Decimal("-7.50"))

    def test_arithmetic_is_exact(self):
        rows = [transaction(4, "0.10"), transaction(4, "0.20")]
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
"""Date ordering and the running balance it defines."""

from decimal import Decimal

from ledgerlite.model import Transaction


def in_date_order(transactions: list[Transaction]) -> list[Transaction]:
    """Transactions sorted by date; ties keep their input order."""
    return sorted(transactions, key=lambda transaction: transaction.date)


def closing_balance(transactions: list[Transaction], opening: Decimal) -> Decimal:
    """The running balance after the last transaction in date order."""
    balance = opening
    for transaction in in_date_order(transactions):
        balance += transaction.amount
    return balance
```

- [ ] **Step 4: Run test to verify it passes**

Run: `python3 -m unittest -v`
Expected: PASS, all tests

- [ ] **Step 5: Commit**

```bash
git add ledgerlite/balance.py test_balance.py
git commit -m "feat: add date ordering and closing balance"
```

---

### Task 5: Per-category totals and report formatting

**Files:**
- Create: `ledgerlite/report.py`
- Test: `test_report.py`

**Interfaces:**
- Consumes: `Transaction` (Task 1), `categorize` (Task 3), `closing_balance` (Task 4).
- Produces:
  - `UNCATEGORIZED = "uncategorized"`.
  - `format_amount(amount: Decimal) -> str` — exactly two fractional digits, leading `-` for negatives, no thousands separators, and `0.00` (never `-0.00`) for zero.
  - `category_totals(transactions: list[Transaction], rules: list[tuple[str, str]]) -> list[tuple[str, Decimal]]` — named categories first, alphabetical (case-insensitive), then `uncategorized` last if present.
  - `format_report(transactions: list[Transaction], rules: list[tuple[str, str]], opening: Decimal) -> str` — the whole report, newline-terminated.

Decisions this task locks in:

- Category names print exactly as written in the rules file; the alphabetical sort is case-insensitive (`(name.lower(), name)`), so `Food` and `apple` order the way a reader expects.
- A rules file whose category is literally `uncategorized` shares the bucket with unmatched transactions and prints last.
- With no category lines at all, the report is just `closing balance: ...` — no leading blank line.

- [ ] **Step 1: Write the failing test**

Create `test_report.py`:

```python
import datetime
import unittest
from decimal import Decimal

from ledgerlite.model import Transaction
from ledgerlite.report import category_totals, format_amount, format_report


def transaction(day, amount, description):
    return Transaction(datetime.date(2026, 3, day), Decimal(amount), description)


class FormatAmountTest(unittest.TestCase):
    def test_two_fractional_digits(self):
        self.assertEqual(format_amount(Decimal("1200")), "1200.00")
        self.assertEqual(format_amount(Decimal("1.5")), "1.50")
        self.assertEqual(format_amount(Decimal("-12.50")), "-12.50")

    def test_zero(self):
        self.assertEqual(format_amount(Decimal("0")), "0.00")

    def test_negative_zero_prints_as_zero(self):
        self.assertEqual(format_amount(Decimal("-0.00")), "0.00")

    def test_no_thousands_separators(self):
        self.assertEqual(format_amount(Decimal("1234567.89")), "1234567.89")


class CategoryTotalsTest(unittest.TestCase):
    RULES = [("coffee", "food"), ("rent", "housing")]

    def test_sums_each_category(self):
        rows = [
            transaction(4, "-7.50", "Coffee Shop"),
            transaction(5, "-2.50", "coffee again"),
            transaction(6, "-900.00", "Rent March"),
        ]
        self.assertEqual(
            category_totals(rows, self.RULES),
            [("food", Decimal("-10.00")), ("housing", Decimal("-900.00"))],
        )

    def test_unmatched_transactions_are_uncategorized_and_last(self):
        rows = [transaction(4, "2500.00", "Salary"), transaction(5, "-900.00", "Rent March")]
        self.assertEqual(
            category_totals(rows, self.RULES),
            [("housing", Decimal("-900.00")), ("uncategorized", Decimal("2500.00"))],
        )

    def test_uncategorized_is_last_even_when_alphabetically_earlier(self):
        rows = [transaction(4, "1.00", "Salary"), transaction(5, "-2.00", "zoo trip")]
        self.assertEqual(
            [name for name, _ in category_totals(rows, [("zoo", "zoo")])],
            ["zoo", "uncategorized"],
        )

    def test_no_uncategorized_line_when_everything_matches(self):
        rows = [transaction(4, "-7.50", "Coffee Shop")]
        self.assertEqual([name for name, _ in category_totals(rows, self.RULES)], ["food"])

    def test_alphabetical_order_ignores_case(self):
        rows = [transaction(4, "1.00", "b thing"), transaction(5, "1.00", "a thing")]
        rules = [("a thing", "Apples"), ("b thing", "bananas")]
        self.assertEqual([name for name, _ in category_totals(rows, rules)], ["Apples", "bananas"])

    def test_a_rule_named_uncategorized_shares_the_bucket_and_stays_last(self):
        rows = [transaction(4, "1.00", "odd"), transaction(5, "2.00", "Salary")]
        rules = [("odd", "uncategorized"), ("nothing", "zebras")]
        self.assertEqual(category_totals(rows, rules), [("uncategorized", Decimal("3.00"))])

    def test_no_transactions_has_no_categories(self):
        self.assertEqual(category_totals([], self.RULES), [])


class FormatReportTest(unittest.TestCase):
    def test_matches_the_design_example(self):
        rows = [
            transaction(4, "-7.50", "Coffee Shop"),
            transaction(5, "-900.00", "Rent March"),
            transaction(6, "2500.00", "Salary"),
        ]
        rules = [("coffee", "food"), ("rent", "housing")]
        self.assertEqual(
            format_report(rows, rules, Decimal("100")),
            "food: -7.50\n"
            "housing: -900.00\n"
            "uncategorized: 2500.00\n"
            "\n"
            "closing balance: 1692.50\n",
        )

    def test_no_transactions_prints_only_the_closing_balance(self):
        self.assertEqual(format_report([], [], Decimal("100")), "closing balance: 100.00\n")

    def test_no_rules_means_everything_is_uncategorized(self):
        rows = [transaction(4, "-7.50", "Coffee Shop")]
        self.assertEqual(
            format_report(rows, [], Decimal("0")),
            "uncategorized: -7.50\n\nclosing balance: -7.50\n",
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
"""Per-category totals and the text of the report."""

from decimal import Decimal

from ledgerlite.balance import closing_balance
from ledgerlite.model import Transaction
from ledgerlite.rules import categorize

UNCATEGORIZED = "uncategorized"


def format_amount(amount: Decimal) -> str:
    """Exactly two fractional digits, no thousands separators, no negative zero."""
    text = f"{amount:.2f}"
    if text.startswith("-") and Decimal(text) == 0:
        return text[1:]
    return text


def category_totals(
    transactions: list[Transaction], rules: list[tuple[str, str]]
) -> list[tuple[str, Decimal]]:
    """(category, total) pairs: named categories alphabetically, uncategorized last."""
    totals: dict[str, Decimal] = {}
    for transaction in transactions:
        name = categorize(transaction.description, rules)
        if name is None:
            name = UNCATEGORIZED
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
    """The complete report text, newline-terminated."""
    lines = [
        f"{name}: {format_amount(total)}"
        for name, total in category_totals(transactions, rules)
    ]
    if lines:
        lines.append("")
    lines.append(f"closing balance: {format_amount(closing_balance(transactions, opening))}")
    return "\n".join(lines) + "\n"
```

- [ ] **Step 4: Run test to verify it passes**

Run: `python3 -m unittest -v`
Expected: PASS, all tests

- [ ] **Step 5: Commit**

```bash
git add ledgerlite/report.py test_report.py
git commit -m "feat: add per-category totals and report formatting"
```

---

### Task 6: Command-line entry point

**Files:**
- Create: `ledgerlite/cli.py`
- Create: `ledgerlite/__main__.py`
- Test: `test_cli.py`

**Interfaces:**
- Consumes: `parse_transactions`, `parse_amount`, `ParseError` (Task 2), `parse_rules` (Task 3), `format_report` (Task 5).
- Produces: `main(argv: list[str] | None = None) -> int`, the only file-reading code in the package.

Decisions this task locks in:

- `ledgerlite report TRANSACTIONS [--rules RULES] [--opening AMOUNT]` via an argparse subparser named `report`; `prog="ledgerlite"`.
- Files are read as UTF-8 text. `OSError` **and** `UnicodeDecodeError` both mean "cannot read": message `ledgerlite: cannot read <path>: <reason>`, exit 1. `reason` is the OS `strerror` when there is one, else `str(error)`.
- A `ParseError` from either file prints `ledgerlite: <path>:<line>: <message>` with *that file's* path, exit 2. Both files are fully parsed before anything reaches stdout, so a rejected file prints nothing there.
- `--opening` is validated by `parse_amount`, so it inherits the CSV's amount rules; a bad value is an argparse error (usage on stderr, `SystemExit(2)`). Default `Decimal("0")`.

- [ ] **Step 1: Write the failing test**

Create `test_cli.py`:

```python
import contextlib
import io
import tempfile
import unittest
from pathlib import Path

from ledgerlite.cli import main

TRANSACTIONS = (
    "date,amount,description\n"
    "2026-03-05,-900.00,Rent March\n"
    "2026-03-04,-7.50,Coffee Shop\n"
    "2026-03-06,2500.00,Salary\n"
)
RULES = "coffee=food\nrent=housing\n"


class CliTestCase(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory()
        self.addCleanup(self.directory.cleanup)
        self.root = Path(self.directory.name)

    def write(self, name, text):
        path = self.root / name
        path.write_text(text, encoding="utf-8")
        return str(path)

    def run_main(self, argv):
        out, err = io.StringIO(), io.StringIO()
        with contextlib.redirect_stdout(out), contextlib.redirect_stderr(err):
            code = main(argv)
        return code, out.getvalue(), err.getvalue()


class ReportCommandTest(CliTestCase):
    def test_prints_the_design_example_and_returns_zero(self):
        transactions = self.write("t.csv", TRANSACTIONS)
        rules = self.write("r.txt", RULES)
        code, out, err = self.run_main(
            ["report", transactions, "--rules", rules, "--opening", "100"]
        )
        self.assertEqual(code, 0)
        self.assertEqual(
            out,
            "food: -7.50\n"
            "housing: -900.00\n"
            "uncategorized: 2500.00\n"
            "\n"
            "closing balance: 1692.50\n",
        )
        self.assertEqual(err, "")

    def test_without_rules_everything_is_uncategorized(self):
        transactions = self.write("t.csv", TRANSACTIONS)
        code, out, _ = self.run_main(["report", transactions])
        self.assertEqual(code, 0)
        self.assertEqual(out, "uncategorized: 1592.50\n\nclosing balance: 1592.50\n")

    def test_opening_defaults_to_zero(self):
        transactions = self.write("t.csv", "date,amount,description\n2026-03-04,-7.50,a\n")
        code, out, _ = self.run_main(["report", transactions])
        self.assertEqual(code, 0)
        self.assertEqual(out, "uncategorized: -7.50\n\nclosing balance: -7.50\n")

    def test_header_only_file_prints_only_the_closing_balance(self):
        transactions = self.write("t.csv", "date,amount,description\n")
        code, out, _ = self.run_main(["report", transactions, "--opening", "12.5"])
        self.assertEqual(code, 0)
        self.assertEqual(out, "closing balance: 12.50\n")


class UnreadableFileTest(CliTestCase):
    def test_missing_transactions_file(self):
        missing = str(self.root / "nope.csv")
        code, out, err = self.run_main(["report", missing])
        self.assertEqual(code, 1)
        self.assertEqual(out, "")
        self.assertEqual(err, f"ledgerlite: cannot read {missing}: No such file or directory\n")

    def test_missing_rules_file(self):
        transactions = self.write("t.csv", TRANSACTIONS)
        missing = str(self.root / "nope.txt")
        code, out, err = self.run_main(["report", transactions, "--rules", missing])
        self.assertEqual(code, 1)
        self.assertEqual(out, "")
        self.assertEqual(err, f"ledgerlite: cannot read {missing}: No such file or directory\n")

    def test_transactions_file_that_is_not_utf8_text(self):
        path = self.root / "t.csv"
        path.write_bytes(b"date,amount,description\n2026-03-04,-7.50,\xff\xfe\n")
        code, out, err = self.run_main(["report", str(path)])
        self.assertEqual(code, 1)
        self.assertEqual(out, "")
        self.assertTrue(err.startswith(f"ledgerlite: cannot read {path}: "))
        self.assertTrue(err.endswith("\n"))


class MalformedFileTest(CliTestCase):
    def test_malformed_row_rejects_the_whole_file(self):
        transactions = self.write(
            "t.csv", "date,amount,description\n2026-03-04,-7.50,a\n2026-03-05,1.005,b\n"
        )
        code, out, err = self.run_main(["report", transactions])
        self.assertEqual(code, 2)
        self.assertEqual(out, "")
        self.assertEqual(
            err,
            f"ledgerlite: {transactions}:3: amount '1.005' has more than two fractional digits\n",
        )

    def test_missing_header_is_reported_on_line_one(self):
        transactions = self.write("t.csv", "2026-03-04,-7.50,a\n")
        code, out, err = self.run_main(["report", transactions])
        self.assertEqual(code, 2)
        self.assertEqual(out, "")
        self.assertEqual(
            err, f"ledgerlite: {transactions}:1: expected header date,amount,description\n"
        )

    def test_malformed_rules_line_reports_the_rules_path(self):
        transactions = self.write("t.csv", TRANSACTIONS)
        rules = self.write("r.txt", "coffee=food\nrent housing\n")
        code, out, err = self.run_main(["report", transactions, "--rules", rules])
        self.assertEqual(code, 2)
        self.assertEqual(out, "")
        self.assertEqual(
            err,
            f"ledgerlite: {rules}:2: expected '<substring>=<category>', got 'rent housing'\n",
        )


class OpeningArgumentTest(CliTestCase):
    def test_rejects_a_non_numeric_opening(self):
        transactions = self.write("t.csv", TRANSACTIONS)
        with contextlib.redirect_stderr(io.StringIO()) as err:
            with self.assertRaises(SystemExit) as caught:
                main(["report", transactions, "--opening", "abc"])
        self.assertEqual(caught.exception.code, 2)
        self.assertIn("invalid amount 'abc'", err.getvalue())

    def test_rejects_an_opening_with_three_fractional_digits(self):
        transactions = self.write("t.csv", TRANSACTIONS)
        with contextlib.redirect_stderr(io.StringIO()) as err:
            with self.assertRaises(SystemExit) as caught:
                main(["report", transactions, "--opening", "1.005"])
        self.assertEqual(caught.exception.code, 2)
        self.assertIn("more than two fractional digits", err.getvalue())

    def test_accepts_a_negative_opening(self):
        transactions = self.write("t.csv", "date,amount,description\n2026-03-04,1.00,a\n")
        code, out, _ = self.run_main(["report", transactions, "--opening", "-2.50"])
        self.assertEqual(code, 0)
        self.assertEqual(out, "uncategorized: 1.00\n\nclosing balance: -1.50\n")


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run test to verify it fails**

Run: `python3 -m unittest test_cli -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'ledgerlite.cli'`

- [ ] **Step 3: Write minimal implementation**

Create `ledgerlite/cli.py`:

```python
"""The ledgerlite command line: argument parsing, file I/O, exit codes."""

import argparse
import sys
from decimal import Decimal
from pathlib import Path

from ledgerlite.parse import ParseError, parse_amount, parse_transactions
from ledgerlite.report import format_report
from ledgerlite.rules import parse_rules


def main(argv: list[str] | None = None) -> int:
    args = _build_parser().parse_args(argv)

    try:
        transactions_text = _read_text(args.transactions)
    except (OSError, UnicodeDecodeError) as error:
        return _cannot_read(args.transactions, error)

    rules_text = ""
    if args.rules is not None:
        try:
            rules_text = _read_text(args.rules)
        except (OSError, UnicodeDecodeError) as error:
            return _cannot_read(args.rules, error)

    try:
        transactions = parse_transactions(transactions_text)
    except ParseError as error:
        return _malformed(args.transactions, error)

    try:
        rules = parse_rules(rules_text)
    except ParseError as error:
        return _malformed(args.rules, error)

    sys.stdout.write(format_report(transactions, rules, args.opening))
    return 0


def _build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="ledgerlite", description="Summarize bank transactions by category."
    )
    subparsers = parser.add_subparsers(dest="command", required=True)
    report = subparsers.add_parser("report", help="print a per-category summary")
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


def _opening_amount(text: str) -> Decimal:
    try:
        return parse_amount(text)
    except ValueError as error:
        raise argparse.ArgumentTypeError(str(error)) from None


def _read_text(path: str) -> str:
    return Path(path).read_text(encoding="utf-8")


def _cannot_read(path: str, error: Exception) -> int:
    reason = getattr(error, "strerror", None) or str(error)
    print(f"ledgerlite: cannot read {path}: {reason}", file=sys.stderr)
    return 1


def _malformed(path: str, error: ParseError) -> int:
    print(f"ledgerlite: {path}:{error.line}: {error.message}", file=sys.stderr)
    return 2
```

Create `ledgerlite/__main__.py`:

```python
"""Allow `python3 -m ledgerlite ...`."""

import sys

from ledgerlite.cli import main

if __name__ == "__main__":
    sys.exit(main())
```

- [ ] **Step 4: Run test to verify it passes**

Run: `python3 -m unittest -v`
Expected: PASS, all tests across all six test files

- [ ] **Step 5: Check the real command line end to end**

```bash
printf 'date,amount,description\n2026-03-05,-900.00,Rent March\n2026-03-04,-7.50,Coffee Shop\n2026-03-06,2500.00,Salary\n' > /tmp/ledgerlite-t.csv
printf 'coffee=food\nrent=housing\n' > /tmp/ledgerlite-r.txt
python3 -m ledgerlite report /tmp/ledgerlite-t.csv --rules /tmp/ledgerlite-r.txt --opening 100
```

Expected: the design's example report, and `echo $?` prints `0`.

```bash
python3 -m ledgerlite report /tmp/does-not-exist.csv; echo "exit=$?"
```

Expected: `ledgerlite: cannot read /tmp/does-not-exist.csv: No such file or directory` on stderr and `exit=1`.

- [ ] **Step 6: Commit**

```bash
git add ledgerlite/cli.py ledgerlite/__main__.py test_cli.py
git commit -m "feat: add ledgerlite report command line"
```

---

## Done when

- `python3 -m unittest` passes with all six test modules green.
- `python3 -m ledgerlite report ... --rules ... --opening 100` reproduces the report in `design.md` byte for byte.
- Exit codes are 0 / 1 / 2 as specified, and a rejected file writes nothing to stdout.
