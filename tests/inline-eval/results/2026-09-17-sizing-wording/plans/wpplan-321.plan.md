# ledgerlite Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `ledgerlite`, a standard-library-only Python CLI that reads a transactions CSV, categorizes each row with a rules file, and prints per-category totals plus the closing balance.

**Architecture:** Six small modules with one responsibility each, wired together only at the CLI layer: `model` holds the `Transaction` value type, `parse` turns CSV text into transactions (raising `ParseError` with a line number), `rules` turns rules text into `(substring, category)` pairs and matches descriptions, `balance` computes date-ordered running/closing balances, `report` formats amounts and assembles the report text, `cli` does argument parsing, file reading, error messages, and exit codes. Every pure module takes and returns plain values (text in, data out) so the whole program is testable without touching the filesystem; only `cli` opens files.

**Tech Stack:** Python 3.11+, standard library only (`csv`, `decimal`, `datetime`, `argparse`, `re`, `unittest`). No third-party packages, no packaging metadata.

**Spec:** `design.md` (in this same directory — read it before starting)

## Global Constraints

Every task's requirements implicitly include this section.

- **Python 3.11+.** Standard library only — no third-party imports anywhere, including tests.
- **Money is `decimal.Decimal`, never `float`.** No `float()` call may appear in the package. Do not build a `Decimal` from a float (`Decimal(1.5)`); always from a string.
- **Amounts are printed with exactly two fractional digits, a leading `-` for negatives, and no thousands separators:** `-12.50`, `0.00`, `1200.00`.
- **Package layout is exactly** (plus `__main__.py`, see below):
  ```
  ledgerlite/__init__.py  model.py  parse.py  rules.py  balance.py  report.py  cli.py
  ```
- **Tests live at the repo root** as `test_<module>.py` and run with `python3 -m unittest` from the repo root.
- **Error message formats are exact.** Unreadable file: `ledgerlite: cannot read <path>: <reason>`. Malformed input row: `ledgerlite: <path>:<line>: <what is wrong>`. Both go to stderr.
- **Exit codes:** `0` success, `1` a file could not be read, `2` input was malformed. On any non-zero exit, **nothing** is written to stdout.
- Work directly on `main` in this repo (local scratch repo, no remote). Commit at the end of every task.

### Decisions the spec leaves open

These are deliberate readings of the spec, not inventions to be revisited mid-implementation. Each is pinned by a test in the task that owns it.

1. **`ledgerlite/__main__.py` is added** even though the spec's layout omits it, because without it the "command-line tool" cannot be invoked at all. It is three lines (Task 5).
2. **A missing or misspelled header row is malformed** (exit 2, reported at line 1). The spec declares the header's content; treating a non-matching first row as data would silently drop a transaction.
3. **Malformed rules files reuse the transaction error shapes:** an unreadable rules file is `cannot read` / exit 1; a rules line that is not `<substring>=<category>` is `<path>:<line>: <reason>` / exit 2. The spec defines no separate codes, so no new ones are invented.
4. **A bad `--opening` value exits 2** with `ledgerlite: bad --opening amount '<value>'`.
5. **The blank line before `closing balance:` is always printed**, even when there are no category lines. It is part of the report's format, not a conditional separator.
6. **Date fields must match `\d{4}-\d{2}-\d{2}` and be a real calendar date.** `date.fromisoformat` alone accepts ISO forms the spec does not describe (`20260304`, week dates), so the shape is checked with a regex first.

## Review Focus

Input classes and failure modes the spec implies. Each has a test in the owning task; the final reviewer should confirm each one behaves as stated.

- `Decimal("nan")` and `Decimal("Infinity")` parse without error but are not numbers, and `as_tuple().exponent` is a string for them, so a naive decimal-places check raises `TypeError` instead of reporting a malformed row → both must be rejected as bad amounts (Task 1).
- A file whose first row is not `date,amount,description` — including a completely empty file — must be rejected at line 1, never read as data (Task 1).
- A total that cancels to zero can format as `-0.00` because `Decimal` keeps the sign; the spec says zero prints `0.00` (Task 4).
- Reported line numbers are physical, 1-based lines of the file, with the header on line 1, so the first data row is line 2 (Task 1).
- A blank line in the middle of the CSV is a row with zero columns → malformed, `expected 3 columns, got 0` (Task 1).
- Two rows sharing a date must keep input order; this only holds if the sort is stable and the sort key is the date alone (Task 3).
- `1.5` and `1.50` are both valid and equal; `1.005` is malformed; a leading `+` is valid (Task 1).
- A rules file whose category is literally `uncategorized` must merge into the uncategorized bucket and still print last (Task 4).
- A category with transactions that net to zero is still listed, as `<category>: 0.00` (Task 4).
- Two categories differing only in case are distinct categories; alphabetical ordering is plain codepoint order, so `Food` sorts before `food` (Task 4).
- A header-only file is valid: no category lines, then the blank line, then `closing balance: <opening>` (Task 4 and Task 5).
- A transactions file that is not valid UTF-8 cannot be read → exit 1, reason `not valid UTF-8 text` (Task 5).
- Descriptions are free text: embedded commas (quoted in CSV) and surrounding spaces are preserved verbatim; only the date and amount fields are stripped (Task 1).
- Every report ends with a trailing newline (Task 4).

---

## File Structure

| File | Responsibility |
|---|---|
| `ledgerlite/__init__.py` | Package docstring only. No logic. |
| `ledgerlite/model.py` | `Transaction` frozen dataclass. No behavior. |
| `ledgerlite/parse.py` | `ParseError`; `parse_date`, `parse_amount` (field validators raising `ValueError`); `parse_transactions(text) -> list[Transaction]`. |
| `ledgerlite/rules.py` | `parse_rules(text) -> list[tuple[str, str]]`; `categorize(description, rules) -> str \| None`. |
| `ledgerlite/balance.py` | `order_transactions`, `running_balances`, `closing_balance`. |
| `ledgerlite/report.py` | `format_amount`, `category_totals`, `format_report`. |
| `ledgerlite/cli.py` | `ReadError`, `read_text`, argparse setup, `main(argv) -> int`. The only module that touches the filesystem or stderr. |
| `ledgerlite/__main__.py` | `sys.exit(main())`. |
| `test_parse.py`, `test_rules.py`, `test_balance.py`, `test_report.py`, `test_cli.py` | Root-level unittest modules, one per module with behavior. `model.py` has no behavior and is exercised through `test_parse.py`. |

Dependency direction is one-way: `model` ← `parse` ← `rules` ← `report` → `balance` → `model`, and `cli` sits on top of all of them. Nothing imports `cli`.

---

## Task 1: Transaction model and CSV parsing

**Files:**
- Create: `ledgerlite/__init__.py`
- Create: `ledgerlite/model.py`
- Create: `ledgerlite/parse.py`
- Test: `test_parse.py`

**Interfaces:**
- Consumes: nothing (first task).
- Produces:
  - `ledgerlite.model.Transaction(date: datetime.date, amount: Decimal, description: str)` — frozen dataclass, keyword or positional construction.
  - `ledgerlite.parse.ParseError(line: int, message: str)` — exception with `.line` and `.message` attributes. **Reused by `rules.py` in Task 2 and formatted by `cli.py` in Task 5; do not define a second error class.**
  - `ledgerlite.parse.parse_date(field: str) -> datetime.date` — raises `ValueError` on a bad field.
  - `ledgerlite.parse.parse_amount(field: str) -> Decimal` — raises `ValueError` on a bad field. **Task 5 reuses this for `--opening`.**
  - `ledgerlite.parse.parse_transactions(text: str) -> list[Transaction]` — file order preserved, raises `ParseError`.

- [ ] **Step 1: Create the package skeleton**

Create `ledgerlite/__init__.py`:

```python
"""ledgerlite: categorize bank transactions and summarize them by category."""
```

Create `ledgerlite/model.py`:

```python
"""The value type shared by every other module."""

import datetime
from dataclasses import dataclass
from decimal import Decimal


@dataclass(frozen=True)
class Transaction:
    """One row of the transactions CSV, already validated."""

    date: datetime.date
    amount: Decimal
    description: str
```

- [ ] **Step 2: Write the failing tests for field validation**

Create `test_parse.py` with the field-level tests. (More tests are appended in Step 5; write only these now.)

```python
"""Tests for ledgerlite.parse."""

import datetime
import unittest
from decimal import Decimal

from ledgerlite.model import Transaction
from ledgerlite.parse import ParseError, parse_amount, parse_date, parse_transactions


class ParseDateTest(unittest.TestCase):
    def test_parses_iso_date(self):
        self.assertEqual(parse_date("2026-03-04"), datetime.date(2026, 3, 4))

    def test_strips_surrounding_whitespace(self):
        self.assertEqual(parse_date("  2026-03-04 "), datetime.date(2026, 3, 4))

    def test_rejects_impossible_calendar_date(self):
        with self.assertRaises(ValueError) as caught:
            parse_date("2026-02-30")
        self.assertEqual(str(caught.exception), "bad date '2026-02-30'")

    def test_rejects_forms_other_than_yyyy_mm_dd(self):
        for field in ["20260304", "2026-3-4", "2026-03-04T00:00", "04/03/2026", "", "yesterday"]:
            with self.subTest(field=field):
                with self.assertRaises(ValueError):
                    parse_date(field)


class ParseAmountTest(unittest.TestCase):
    def test_parses_positive_and_negative(self):
        self.assertEqual(parse_amount("2500.00"), Decimal("2500.00"))
        self.assertEqual(parse_amount("-7.50"), Decimal("-7.50"))

    def test_returns_decimal_not_float(self):
        self.assertIsInstance(parse_amount("1.50"), Decimal)

    def test_accepts_zero_one_or_two_fractional_digits(self):
        self.assertEqual(parse_amount("100"), Decimal("100"))
        self.assertEqual(parse_amount("1.5"), Decimal("1.5"))
        self.assertEqual(parse_amount("1.50"), Decimal("1.50"))

    def test_accepts_leading_plus(self):
        self.assertEqual(parse_amount("+12.34"), Decimal("12.34"))

    def test_rejects_more_than_two_fractional_digits(self):
        with self.assertRaises(ValueError) as caught:
            parse_amount("1.005")
        self.assertEqual(
            str(caught.exception), "amount '1.005' has more than two decimal places"
        )

    def test_rejects_non_numeric(self):
        for field in ["abc", "", "  ", "1,50", "1_000", "$1.50"]:
            with self.subTest(field=field):
                with self.assertRaises(ValueError):
                    parse_amount(field)

    def test_rejects_non_finite_values(self):
        for field in ["nan", "NaN", "Infinity", "-inf", "sNaN"]:
            with self.subTest(field=field):
                with self.assertRaises(ValueError) as caught:
                    parse_amount(field)
                self.assertIn("bad amount", str(caught.exception))
```

- [ ] **Step 3: Run the tests to verify they fail**

Run: `python3 -m unittest test_parse -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'ledgerlite.parse'`.

- [ ] **Step 4: Write the field validators**

Create `ledgerlite/parse.py`:

```python
"""Turn transactions-CSV text into validated Transaction objects."""

import csv
import io
import re
from datetime import date
from decimal import Decimal, InvalidOperation

from .model import Transaction

HEADER = ["date", "amount", "description"]
_HEADER_TEXT = ",".join(HEADER)
_DATE_SHAPE = re.compile(r"\d{4}-\d{2}-\d{2}")
_MAX_FRACTIONAL_DIGITS = 2


class ParseError(Exception):
    """Malformed input at a known 1-based line number."""

    def __init__(self, line: int, message: str) -> None:
        super().__init__(f"{line}: {message}")
        self.line = line
        self.message = message


def parse_date(field: str) -> date:
    """Parse an ISO 8601 calendar date. Raise ValueError explaining a bad field."""
    field = field.strip()
    if _DATE_SHAPE.fullmatch(field):
        try:
            return date.fromisoformat(field)
        except ValueError:
            pass
    raise ValueError(f"bad date {field!r}")


def parse_amount(field: str) -> Decimal:
    """Parse a money amount. Raise ValueError explaining a bad field."""
    field = field.strip()
    try:
        amount = Decimal(field)
    except InvalidOperation:
        raise ValueError(f"bad amount {field!r}") from None
    if not amount.is_finite():
        raise ValueError(f"bad amount {field!r}")
    if -amount.as_tuple().exponent > _MAX_FRACTIONAL_DIGITS:
        raise ValueError(f"amount {field!r} has more than two decimal places")
    return amount
```

`is_finite()` must be checked before `as_tuple().exponent`: for `NaN`/`Infinity` the exponent is a string (`'n'`, `'F'`) and comparing it to an int raises `TypeError`.

- [ ] **Step 5: Run the tests to verify they pass**

Run: `python3 -m unittest test_parse -v`
Expected: PASS (all `ParseDateTest` and `ParseAmountTest` tests).

- [ ] **Step 6: Write the failing tests for whole-file parsing**

Append to `test_parse.py`:

```python
HEADER_LINE = "date,amount,description\n"


class ParseTransactionsTest(unittest.TestCase):
    def test_parses_rows_in_file_order(self):
        text = HEADER_LINE + "2026-03-05,2500.00,Salary\n2026-03-04,-7.50,Coffee shop\n"
        self.assertEqual(
            parse_transactions(text),
            [
                Transaction(datetime.date(2026, 3, 5), Decimal("2500.00"), "Salary"),
                Transaction(datetime.date(2026, 3, 4), Decimal("-7.50"), "Coffee shop"),
            ],
        )

    def test_header_only_file_has_no_transactions(self):
        self.assertEqual(parse_transactions(HEADER_LINE), [])

    def test_preserves_descriptions_verbatim(self):
        text = HEADER_LINE + '2026-03-04,-1.00,"COFFEE, LARGE "\n'
        self.assertEqual(parse_transactions(text)[0].description, "COFFEE, LARGE ")

    def test_accepts_file_without_trailing_newline(self):
        text = HEADER_LINE + "2026-03-04,-1.00,Coffee"
        self.assertEqual(len(parse_transactions(text)), 1)

    def test_rejects_empty_file(self):
        with self.assertRaises(ParseError) as caught:
            parse_transactions("")
        self.assertEqual(caught.exception.line, 1)
        self.assertEqual(
            caught.exception.message,
            "file is empty; expected header 'date,amount,description'",
        )

    def test_rejects_wrong_header(self):
        for text in ["amount,date,description\n", "date,amount\n", "2026-03-04,-1.00,Coffee\n"]:
            with self.subTest(text=text):
                with self.assertRaises(ParseError) as caught:
                    parse_transactions(text)
                self.assertEqual(caught.exception.line, 1)
                self.assertEqual(
                    caught.exception.message,
                    "expected header 'date,amount,description'",
                )

    def test_accepts_header_with_padding_and_odd_case(self):
        text = " Date , Amount , Description \n2026-03-04,-1.00,Coffee\n"
        self.assertEqual(len(parse_transactions(text)), 1)

    def test_reports_wrong_column_count(self):
        text = HEADER_LINE + "2026-03-04,-1.00\n"
        with self.assertRaises(ParseError) as caught:
            parse_transactions(text)
        self.assertEqual(caught.exception.line, 2)
        self.assertEqual(caught.exception.message, "expected 3 columns, got 2")

    def test_reports_too_many_columns(self):
        text = HEADER_LINE + "2026-03-04,-1.00,Coffee,extra\n"
        with self.assertRaises(ParseError) as caught:
            parse_transactions(text)
        self.assertEqual(caught.exception.message, "expected 3 columns, got 4")

    def test_blank_line_inside_file_is_malformed(self):
        text = HEADER_LINE + "2026-03-04,-1.00,Coffee\n\n2026-03-05,1.00,Refund\n"
        with self.assertRaises(ParseError) as caught:
            parse_transactions(text)
        self.assertEqual(caught.exception.line, 3)
        self.assertEqual(caught.exception.message, "expected 3 columns, got 0")

    def test_reports_line_number_of_bad_amount(self):
        text = (
            HEADER_LINE
            + "2026-03-04,-1.00,Coffee\n"
            + "2026-03-05,1.005,Interest\n"
        )
        with self.assertRaises(ParseError) as caught:
            parse_transactions(text)
        self.assertEqual(caught.exception.line, 3)
        self.assertEqual(
            caught.exception.message, "amount '1.005' has more than two decimal places"
        )

    def test_reports_line_number_of_bad_date(self):
        text = HEADER_LINE + "2026-02-30,-1.00,Coffee\n"
        with self.assertRaises(ParseError) as caught:
            parse_transactions(text)
        self.assertEqual(caught.exception.line, 2)
        self.assertEqual(caught.exception.message, "bad date '2026-02-30'")

    def test_strips_padding_around_date_and_amount(self):
        text = HEADER_LINE + "  2026-03-04 , -7.50 ,Coffee\n"
        transaction = parse_transactions(text)[0]
        self.assertEqual(transaction.date, datetime.date(2026, 3, 4))
        self.assertEqual(transaction.amount, Decimal("-7.50"))


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 7: Run the tests to verify they fail**

Run: `python3 -m unittest test_parse -v`
Expected: FAIL — `ImportError: cannot import name 'parse_transactions'` (or `AttributeError`), while the Step 2 tests still pass.

- [ ] **Step 8: Implement whole-file parsing**

Append to `ledgerlite/parse.py`:

```python
def parse_transactions(text: str) -> list[Transaction]:
    """Parse transactions-CSV text, keeping file order.

    Raise ParseError on the first malformed row; the caller rejects the whole
    file, so nothing partial is ever returned.
    """
    reader = csv.reader(io.StringIO(text, newline=""))
    try:
        header = next(reader)
    except StopIteration:
        raise ParseError(1, f"file is empty; expected header {_HEADER_TEXT!r}") from None
    if [column.strip().lower() for column in header] != HEADER:
        raise ParseError(1, f"expected header {_HEADER_TEXT!r}")

    transactions = []
    for row in reader:
        line = reader.line_num
        if len(row) != len(HEADER):
            raise ParseError(line, f"expected {len(HEADER)} columns, got {len(row)}")
        transactions.append(
            Transaction(
                date=_field(parse_date, row[0], line),
                amount=_field(parse_amount, row[1], line),
                description=row[2],
            )
        )
    return transactions


def _field(validator, field: str, line: int):
    """Run a field validator, turning its ValueError into a located ParseError."""
    try:
        return validator(field)
    except ValueError as error:
        raise ParseError(line, str(error)) from None
```

`reader.line_num` is the physical line count consumed so far, so the header is line 1 and the first data row is line 2 — which is exactly what the error format wants.

- [ ] **Step 9: Run the whole suite to verify it passes**

Run: `python3 -m unittest -v`
Expected: PASS, all `test_parse.py` tests.

- [ ] **Step 10: Commit**

```bash
git add ledgerlite/__init__.py ledgerlite/model.py ledgerlite/parse.py test_parse.py
git commit -m "feat: parse transactions CSV into validated Transaction objects"
```

---

## Task 2: Rules parsing and categorization

**Files:**
- Create: `ledgerlite/rules.py`
- Test: `test_rules.py`

**Interfaces:**
- Consumes: `ledgerlite.parse.ParseError(line, message)` from Task 1.
- Produces:
  - `ledgerlite.rules.Rule` — type alias for `tuple[str, str]`, i.e. `(substring, category)`.
  - `ledgerlite.rules.parse_rules(text: str) -> list[Rule]` — raises `ParseError`.
  - `ledgerlite.rules.categorize(description: str, rules: list[Rule]) -> str | None` — first match wins, case-insensitive, `None` when nothing matches. **Task 4 calls this.**

- [ ] **Step 1: Write the failing tests**

Create `test_rules.py`:

```python
"""Tests for ledgerlite.rules."""

import unittest

from ledgerlite.parse import ParseError
from ledgerlite.rules import categorize, parse_rules


class ParseRulesTest(unittest.TestCase):
    def test_parses_one_rule_per_line(self):
        self.assertEqual(
            parse_rules("coffee=food\nrent=housing\n"),
            [("coffee", "food"), ("rent", "housing")],
        )

    def test_ignores_blank_and_whitespace_only_lines(self):
        self.assertEqual(
            parse_rules("\ncoffee=food\n   \n\trent=housing\n\n"),
            [("coffee", "food"), ("rent", "housing")],
        )

    def test_strips_whitespace_around_both_sides(self):
        self.assertEqual(parse_rules("  coffee  =  food  \n"), [("coffee", "food")])

    def test_splits_on_the_first_equals_only(self):
        self.assertEqual(parse_rules("a=b=c\n"), [("a", "b=c")])

    def test_accepts_text_without_trailing_newline(self):
        self.assertEqual(parse_rules("coffee=food"), [("coffee", "food")])

    def test_empty_text_yields_no_rules(self):
        self.assertEqual(parse_rules(""), [])

    def test_line_without_equals_is_an_error(self):
        with self.assertRaises(ParseError) as caught:
            parse_rules("coffee=food\ngroceries food\n")
        self.assertEqual(caught.exception.line, 2)
        self.assertEqual(
            caught.exception.message, "rule is missing '=': 'groceries food'"
        )

    def test_empty_substring_is_an_error(self):
        with self.assertRaises(ParseError) as caught:
            parse_rules("=food\n")
        self.assertEqual(caught.exception.line, 1)
        self.assertEqual(caught.exception.message, "rule has an empty substring")

    def test_empty_category_is_an_error(self):
        with self.assertRaises(ParseError) as caught:
            parse_rules("coffee=\n")
        self.assertEqual(caught.exception.line, 1)
        self.assertEqual(caught.exception.message, "rule has an empty category")

    def test_error_line_numbers_count_blank_lines(self):
        with self.assertRaises(ParseError) as caught:
            parse_rules("\n\nbroken\n")
        self.assertEqual(caught.exception.line, 3)


class CategorizeTest(unittest.TestCase):
    RULES = [("coffee", "food"), ("rent", "housing")]

    def test_matches_substring_of_description(self):
        self.assertEqual(categorize("Coffee shop no 4", self.RULES), "food")

    def test_matching_ignores_case_in_both_directions(self):
        self.assertEqual(categorize("MORNING COFFEE", self.RULES), "food")
        self.assertEqual(categorize("monthly rent", [("RENT", "housing")]), "housing")

    def test_first_matching_rule_wins_even_if_a_later_rule_matches_more(self):
        rules = [("co", "short"), ("coffee shop", "long")]
        self.assertEqual(categorize("Coffee shop", rules), "short")

    def test_returns_none_when_no_rule_matches(self):
        self.assertIsNone(categorize("ACME Payroll", self.RULES))

    def test_returns_none_when_there_are_no_rules(self):
        self.assertIsNone(categorize("Coffee shop", []))


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `python3 -m unittest test_rules -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'ledgerlite.rules'`.

- [ ] **Step 3: Implement the rules module**

Create `ledgerlite/rules.py`:

```python
"""Rules text -> (substring, category) pairs, and description matching."""

from .parse import ParseError

Rule = tuple[str, str]


def parse_rules(text: str) -> list[Rule]:
    """Parse rules text, one `<substring>=<category>` per line.

    Blank lines are ignored. Raise ParseError on any other unusable line.
    """
    rules: list[Rule] = []
    for line, raw in enumerate(text.splitlines(), start=1):
        if not raw.strip():
            continue
        if "=" not in raw:
            raise ParseError(line, f"rule is missing '=': {raw.strip()!r}")
        substring, category = (part.strip() for part in raw.split("=", 1))
        if not substring:
            raise ParseError(line, "rule has an empty substring")
        if not category:
            raise ParseError(line, "rule has an empty category")
        rules.append((substring, category))
    return rules


def categorize(description: str, rules: list[Rule]) -> str | None:
    """Return the category of the first rule matching description, else None."""
    lowered = description.lower()
    for substring, category in rules:
        if substring.lower() in lowered:
            return category
    return None
```

- [ ] **Step 4: Run the whole suite to verify it passes**

Run: `python3 -m unittest -v`
Expected: PASS, `test_parse.py` and `test_rules.py`.

- [ ] **Step 5: Commit**

```bash
git add ledgerlite/rules.py test_rules.py
git commit -m "feat: parse rules files and categorize descriptions"
```

---

## Task 3: Date-ordered balances

**Files:**
- Create: `ledgerlite/balance.py`
- Test: `test_balance.py`

**Interfaces:**
- Consumes: `ledgerlite.model.Transaction` from Task 1.
- Produces:
  - `ledgerlite.balance.order_transactions(transactions: list[Transaction]) -> list[Transaction]` — new list, sorted by date, ties in input order.
  - `ledgerlite.balance.running_balances(transactions: list[Transaction], opening: Decimal) -> list[Decimal]` — one balance per transaction, in date order.
  - `ledgerlite.balance.closing_balance(transactions: list[Transaction], opening: Decimal) -> Decimal` — the last running balance, or `opening` when there are none. **Task 4 calls this.**

- [ ] **Step 1: Write the failing tests**

Create `test_balance.py`:

```python
"""Tests for ledgerlite.balance."""

import datetime
import unittest
from decimal import Decimal

from ledgerlite.balance import closing_balance, order_transactions, running_balances
from ledgerlite.model import Transaction


def transaction(day: int, amount: str, description: str = "x") -> Transaction:
    return Transaction(datetime.date(2026, 3, day), Decimal(amount), description)


class OrderTransactionsTest(unittest.TestCase):
    def test_sorts_by_date(self):
        late = transaction(9, "1.00", "late")
        early = transaction(1, "1.00", "early")
        self.assertEqual(
            [t.description for t in order_transactions([late, early])],
            ["early", "late"],
        )

    def test_ties_keep_input_order(self):
        first = transaction(4, "-7.50", "first")
        second = transaction(4, "2500.00", "second")
        self.assertEqual(
            [t.description for t in order_transactions([first, second])],
            ["first", "second"],
        )
        self.assertEqual(
            [t.description for t in order_transactions([second, first])],
            ["second", "first"],
        )

    def test_does_not_mutate_the_input_list(self):
        given = [transaction(9, "1.00", "late"), transaction(1, "1.00", "early")]
        order_transactions(given)
        self.assertEqual([t.description for t in given], ["late", "early"])

    def test_empty_input(self):
        self.assertEqual(order_transactions([]), [])


class RunningBalancesTest(unittest.TestCase):
    def test_starts_at_opening_and_adds_in_date_order(self):
        transactions = [transaction(9, "10.00"), transaction(1, "-2.50")]
        self.assertEqual(
            running_balances(transactions, Decimal("100")),
            [Decimal("97.50"), Decimal("107.50")],
        )

    def test_no_transactions_means_no_balances(self):
        self.assertEqual(running_balances([], Decimal("100")), [])

    def test_balances_are_decimal(self):
        balances = running_balances([transaction(1, "0.10")], Decimal("0.20"))
        self.assertIsInstance(balances[0], Decimal)
        self.assertEqual(balances[0], Decimal("0.30"))


class ClosingBalanceTest(unittest.TestCase):
    def test_is_the_balance_after_the_last_transaction(self):
        transactions = [
            transaction(4, "-7.50"),
            transaction(6, "-900.00"),
            transaction(5, "2500.00"),
        ]
        self.assertEqual(
            closing_balance(transactions, Decimal("100")), Decimal("1692.50")
        )

    def test_is_the_opening_amount_when_there_are_no_transactions(self):
        self.assertEqual(closing_balance([], Decimal("42.00")), Decimal("42.00"))
        self.assertEqual(closing_balance([], Decimal("0")), Decimal("0"))


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `python3 -m unittest test_balance -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'ledgerlite.balance'`.

- [ ] **Step 3: Implement the balance module**

Create `ledgerlite/balance.py`:

```python
"""Date-ordered running balance and closing balance."""

from decimal import Decimal

from .model import Transaction


def order_transactions(transactions: list[Transaction]) -> list[Transaction]:
    """Return the transactions by date; sorted() is stable, so ties keep order."""
    return sorted(transactions, key=lambda transaction: transaction.date)


def running_balances(
    transactions: list[Transaction], opening: Decimal
) -> list[Decimal]:
    """Return the balance after each transaction, in date order."""
    balance = opening
    balances = []
    for transaction in order_transactions(transactions):
        balance += transaction.amount
        balances.append(balance)
    return balances


def closing_balance(transactions: list[Transaction], opening: Decimal) -> Decimal:
    """Return the balance after the last transaction, or opening if there are none."""
    balances = running_balances(transactions, opening)
    return balances[-1] if balances else opening
```

- [ ] **Step 4: Run the whole suite to verify it passes**

Run: `python3 -m unittest -v`
Expected: PASS, three test modules.

- [ ] **Step 5: Commit**

```bash
git add ledgerlite/balance.py test_balance.py
git commit -m "feat: compute date-ordered running and closing balances"
```

---

## Task 4: Per-category totals and report formatting

**Files:**
- Create: `ledgerlite/report.py`
- Test: `test_report.py`

**Interfaces:**
- Consumes: `Transaction` (Task 1), `Rule` and `categorize` (Task 2), `closing_balance` (Task 3).
- Produces:
  - `ledgerlite.report.UNCATEGORIZED` — the string `"uncategorized"`.
  - `ledgerlite.report.format_amount(amount: Decimal) -> str`.
  - `ledgerlite.report.category_totals(transactions: list[Transaction], rules: list[Rule]) -> list[tuple[str, Decimal]]` — alphabetical, `uncategorized` last.
  - `ledgerlite.report.format_report(transactions: list[Transaction], rules: list[Rule], opening: Decimal) -> str` — the full report, ending in a newline. **Task 5 writes this to stdout unchanged.**

- [ ] **Step 1: Write the failing tests**

Create `test_report.py`:

```python
"""Tests for ledgerlite.report."""

import datetime
import textwrap
import unittest
from decimal import Decimal

from ledgerlite.model import Transaction
from ledgerlite.report import category_totals, format_amount, format_report
from ledgerlite.rules import parse_rules


def transaction(day: int, amount: str, description: str) -> Transaction:
    return Transaction(datetime.date(2026, 3, day), Decimal(amount), description)


EXAMPLE_RULES = parse_rules("coffee=food\nrent=housing\n")
EXAMPLE_TRANSACTIONS = [
    transaction(5, "2500.00", "ACME Payroll"),
    transaction(4, "-7.50", "Coffee shop"),
    transaction(6, "-900.00", "Rent March"),
]


class FormatAmountTest(unittest.TestCase):
    def test_always_two_fractional_digits(self):
        self.assertEqual(format_amount(Decimal("1200")), "1200.00")
        self.assertEqual(format_amount(Decimal("1.5")), "1.50")
        self.assertEqual(format_amount(Decimal("-12.50")), "-12.50")

    def test_zero_has_no_sign(self):
        self.assertEqual(format_amount(Decimal("0")), "0.00")
        self.assertEqual(format_amount(Decimal("-0.00")), "0.00")
        self.assertEqual(
            format_amount(Decimal("-0.50") + Decimal("0.50")), "0.00"
        )

    def test_no_thousands_separators(self):
        self.assertEqual(format_amount(Decimal("1234567.89")), "1234567.89")
        self.assertEqual(format_amount(Decimal("-1000000")), "-1000000.00")


class CategoryTotalsTest(unittest.TestCase):
    def test_sums_each_category(self):
        transactions = [
            transaction(4, "-7.50", "Coffee shop"),
            transaction(5, "-2.50", "COFFEE to go"),
            transaction(6, "-900.00", "Rent March"),
        ]
        self.assertEqual(
            category_totals(transactions, EXAMPLE_RULES),
            [("food", Decimal("-10.00")), ("housing", Decimal("-900.00"))],
        )

    def test_categories_are_alphabetical_with_uncategorized_last(self):
        self.assertEqual(
            [name for name, _ in category_totals(EXAMPLE_TRANSACTIONS, EXAMPLE_RULES)],
            ["food", "housing", "uncategorized"],
        )

    def test_uncategorized_omitted_when_everything_matches(self):
        transactions = [transaction(4, "-7.50", "Coffee shop")]
        self.assertEqual(
            [name for name, _ in category_totals(transactions, EXAMPLE_RULES)], ["food"]
        )

    def test_without_rules_everything_is_uncategorized(self):
        self.assertEqual(
            category_totals(EXAMPLE_TRANSACTIONS, []),
            [("uncategorized", Decimal("1592.50"))],
        )

    def test_a_rule_category_named_uncategorized_merges_and_stays_last(self):
        rules = parse_rules("coffee=uncategorized\nrent=housing\n")
        self.assertEqual(
            category_totals(EXAMPLE_TRANSACTIONS, rules),
            [("housing", Decimal("-900.00")), ("uncategorized", Decimal("2492.50"))],
        )

    def test_category_netting_to_zero_is_still_listed(self):
        transactions = [
            transaction(4, "-7.50", "Coffee shop"),
            transaction(5, "7.50", "Coffee refund"),
        ]
        self.assertEqual(
            category_totals(transactions, EXAMPLE_RULES), [("food", Decimal("0.00"))]
        )

    def test_categories_differing_only_in_case_are_distinct(self):
        rules = parse_rules("coffee=Food\nrent=food\n")
        self.assertEqual(
            [name for name, _ in category_totals(EXAMPLE_TRANSACTIONS, rules)],
            ["Food", "food", "uncategorized"],
        )

    def test_no_transactions_means_no_categories(self):
        self.assertEqual(category_totals([], EXAMPLE_RULES), [])


class FormatReportTest(unittest.TestCase):
    def test_matches_the_example_from_the_design(self):
        expected = textwrap.dedent(
            """\
            food: -7.50
            housing: -900.00
            uncategorized: 2500.00

            closing balance: 1692.50
            """
        )
        self.assertEqual(
            format_report(EXAMPLE_TRANSACTIONS, EXAMPLE_RULES, Decimal("100")), expected
        )

    def test_ends_with_exactly_one_newline(self):
        report = format_report(EXAMPLE_TRANSACTIONS, EXAMPLE_RULES, Decimal("100"))
        self.assertTrue(report.endswith("\n"))
        self.assertFalse(report.endswith("\n\n"))

    def test_no_transactions_reports_only_the_opening_balance(self):
        self.assertEqual(format_report([], [], Decimal("0")), "\nclosing balance: 0.00\n")
        self.assertEqual(
            format_report([], [], Decimal("42.5")), "\nclosing balance: 42.50\n"
        )


if __name__ == "__main__":
    unittest.main()
```

Check of `test_a_rule_category_named_uncategorized_merges_and_stays_last`: coffee `-7.50` plus the unmatched payroll `2500.00` = `2492.50` under `uncategorized`; rent stays `-900.00`.

- [ ] **Step 2: Run the tests to verify they fail**

Run: `python3 -m unittest test_report -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'ledgerlite.report'`.

- [ ] **Step 3: Implement the report module**

Create `ledgerlite/report.py`:

```python
"""Per-category totals and report text."""

from decimal import Decimal

from .balance import closing_balance
from .model import Transaction
from .rules import Rule, categorize

UNCATEGORIZED = "uncategorized"


def format_amount(amount: Decimal) -> str:
    """Format an amount with exactly two fractional digits and no separators."""
    if amount == 0:
        amount = Decimal(0)  # Decimal keeps the sign of -0.00; the report must not.
    return f"{amount:.2f}"


def category_totals(
    transactions: list[Transaction], rules: list[Rule]
) -> list[tuple[str, Decimal]]:
    """Total each category, alphabetically, with UNCATEGORIZED last."""
    totals: dict[str, Decimal] = {}
    for transaction in transactions:
        category = categorize(transaction.description, rules) or UNCATEGORIZED
        totals[category] = totals.get(category, Decimal(0)) + transaction.amount

    names = sorted(name for name in totals if name != UNCATEGORIZED)
    if UNCATEGORIZED in totals:
        names.append(UNCATEGORIZED)
    return [(name, totals[name]) for name in names]


def format_report(
    transactions: list[Transaction], rules: list[Rule], opening: Decimal
) -> str:
    """Render the whole report, one category per line then the closing balance."""
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

- [ ] **Step 4: Run the whole suite to verify it passes**

Run: `python3 -m unittest -v`
Expected: PASS, four test modules.

- [ ] **Step 5: Commit**

```bash
git add ledgerlite/report.py test_report.py
git commit -m "feat: total transactions by category and format the report"
```

---

## Task 5: CLI, error handling, and exit codes

**Files:**
- Create: `ledgerlite/cli.py`
- Create: `ledgerlite/__main__.py`
- Test: `test_cli.py`

**Interfaces:**
- Consumes: `parse_amount`, `parse_transactions`, `ParseError` (Task 1); `parse_rules` (Task 2); `format_report` (Task 4).
- Produces:
  - `ledgerlite.cli.ReadError` — exception whose `str()` is the human-readable reason a file could not be read.
  - `ledgerlite.cli.read_text(path: str) -> str` — raises `ReadError`.
  - `ledgerlite.cli.main(argv: list[str] | None = None) -> int` — returns the exit code; writes the report to stdout and errors to stderr.

- [ ] **Step 1: Write the failing tests**

Create `test_cli.py`:

```python
"""Tests for ledgerlite.cli, exercised end to end through main()."""

import contextlib
import io
import os
import subprocess
import sys
import tempfile
import textwrap
import unittest

from ledgerlite.cli import main

TRANSACTIONS = textwrap.dedent(
    """\
    date,amount,description
    2026-03-05,2500.00,ACME Payroll
    2026-03-04,-7.50,Coffee shop
    2026-03-06,-900.00,Rent March
    """
)
RULES = "coffee=food\nrent=housing\n"
EXPECTED_REPORT = textwrap.dedent(
    """\
    food: -7.50
    housing: -900.00
    uncategorized: 2500.00

    closing balance: 1692.50
    """
)


class CliTestCase(unittest.TestCase):
    """Base class giving each test a scratch directory and a run() helper."""

    def setUp(self):
        self.directory = tempfile.TemporaryDirectory()
        self.addCleanup(self.directory.cleanup)

    def path(self, name: str, content: str, encoding: str = "utf-8") -> str:
        """Write a file into the scratch directory and return its path."""
        full = os.path.join(self.directory.name, name)
        with open(full, "w", encoding=encoding) as handle:
            handle.write(content)
        return full

    def run_main(self, *argv: str):
        """Run main(argv), returning (exit code, stdout, stderr)."""
        out, err = io.StringIO(), io.StringIO()
        with contextlib.redirect_stdout(out), contextlib.redirect_stderr(err):
            code = main(list(argv))
        return code, out.getvalue(), err.getvalue()


class SuccessTest(CliTestCase):
    def test_prints_the_report_and_returns_zero(self):
        code, out, err = self.run_main(
            "report",
            self.path("t.csv", TRANSACTIONS),
            "--rules",
            self.path("rules.txt", RULES),
            "--opening",
            "100",
        )
        self.assertEqual((code, err), (0, ""))
        self.assertEqual(out, EXPECTED_REPORT)

    def test_opening_defaults_to_zero(self):
        code, out, _ = self.run_main("report", self.path("t.csv", TRANSACTIONS))
        self.assertEqual(code, 0)
        self.assertEqual(out, "uncategorized: 1592.50\n\nclosing balance: 1592.50\n")

    def test_without_rules_everything_is_uncategorized(self):
        code, out, _ = self.run_main(
            "report", self.path("t.csv", TRANSACTIONS), "--opening", "100"
        )
        self.assertEqual(code, 0)
        self.assertEqual(out, "uncategorized: 1592.50\n\nclosing balance: 1692.50\n")

    def test_header_only_file_reports_the_opening_balance(self):
        code, out, _ = self.run_main(
            "report",
            self.path("t.csv", "date,amount,description\n"),
            "--opening",
            "42",
        )
        self.assertEqual(code, 0)
        self.assertEqual(out, "\nclosing balance: 42.00\n")

    def test_accepts_negative_opening(self):
        code, out, _ = self.run_main(
            "report", self.path("t.csv", "date,amount,description\n"), "--opening", "-5.25"
        )
        self.assertEqual(code, 0)
        self.assertEqual(out, "\nclosing balance: -5.25\n")


class UnreadableFileTest(CliTestCase):
    def test_missing_transactions_file_returns_one(self):
        missing = os.path.join(self.directory.name, "nope.csv")
        code, out, err = self.run_main("report", missing)
        self.assertEqual((code, out), (1, ""))
        self.assertEqual(err, f"ledgerlite: cannot read {missing}: No such file or directory\n")

    def test_directory_as_transactions_file_returns_one(self):
        code, out, err = self.run_main("report", self.directory.name)
        self.assertEqual((code, out), (1, ""))
        self.assertTrue(err.startswith(f"ledgerlite: cannot read {self.directory.name}: "))

    def test_non_utf8_transactions_file_returns_one(self):
        path = os.path.join(self.directory.name, "latin.csv")
        with open(path, "wb") as handle:
            handle.write(b"date,amount,description\n2026-03-04,-1.00,Caf\xe9\n")
        code, out, err = self.run_main("report", path)
        self.assertEqual((code, out), (1, ""))
        self.assertEqual(err, f"ledgerlite: cannot read {path}: not valid UTF-8 text\n")

    def test_missing_rules_file_returns_one(self):
        missing = os.path.join(self.directory.name, "nope.txt")
        code, out, err = self.run_main(
            "report", self.path("t.csv", TRANSACTIONS), "--rules", missing
        )
        self.assertEqual((code, out), (1, ""))
        self.assertEqual(err, f"ledgerlite: cannot read {missing}: No such file or directory\n")


class MalformedInputTest(CliTestCase):
    def test_malformed_row_returns_two_and_prints_nothing_to_stdout(self):
        text = "date,amount,description\n2026-03-04,-1.00,Coffee\n2026-03-05,1.005,Interest\n"
        path = self.path("t.csv", text)
        code, out, err = self.run_main("report", path)
        self.assertEqual((code, out), (2, ""))
        self.assertEqual(
            err, f"ledgerlite: {path}:3: amount '1.005' has more than two decimal places\n"
        )

    def test_bad_date_returns_two(self):
        path = self.path("t.csv", "date,amount,description\n2026-02-30,-1.00,Coffee\n")
        code, out, err = self.run_main("report", path)
        self.assertEqual((code, out), (2, ""))
        self.assertEqual(err, f"ledgerlite: {path}:2: bad date '2026-02-30'\n")

    def test_wrong_column_count_returns_two(self):
        path = self.path("t.csv", "date,amount,description\n2026-03-04,-1.00\n")
        code, out, err = self.run_main("report", path)
        self.assertEqual((code, out), (2, ""))
        self.assertEqual(err, f"ledgerlite: {path}:2: expected 3 columns, got 2\n")

    def test_missing_header_returns_two(self):
        path = self.path("t.csv", "2026-03-04,-1.00,Coffee\n")
        code, out, err = self.run_main("report", path)
        self.assertEqual((code, out), (2, ""))
        self.assertEqual(
            err, f"ledgerlite: {path}:1: expected header 'date,amount,description'\n"
        )

    def test_malformed_rules_line_returns_two(self):
        rules_path = self.path("rules.txt", "coffee=food\ngroceries food\n")
        code, out, err = self.run_main(
            "report", self.path("t.csv", TRANSACTIONS), "--rules", rules_path
        )
        self.assertEqual((code, out), (2, ""))
        self.assertEqual(
            err, f"ledgerlite: {rules_path}:2: rule is missing '=': 'groceries food'\n"
        )

    def test_bad_opening_returns_two(self):
        for value in ["abc", "1.005", "nan"]:
            with self.subTest(value=value):
                code, out, err = self.run_main(
                    "report", self.path("t.csv", TRANSACTIONS), "--opening", value
                )
                self.assertEqual((code, out), (2, ""))
                self.assertEqual(err, f"ledgerlite: bad --opening amount {value!r}\n")


class ModuleEntryPointTest(CliTestCase):
    def test_python_m_ledgerlite_prints_the_report(self):
        result = subprocess.run(
            [
                sys.executable,
                "-m",
                "ledgerlite",
                "report",
                self.path("t.csv", TRANSACTIONS),
                "--rules",
                self.path("rules.txt", RULES),
                "--opening",
                "100",
            ],
            capture_output=True,
            text=True,
            cwd=os.path.dirname(os.path.abspath(__file__)),
        )
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(result.stdout, EXPECTED_REPORT)

    def test_python_m_ledgerlite_exits_one_for_a_missing_file(self):
        result = subprocess.run(
            [sys.executable, "-m", "ledgerlite", "report", "no-such-file.csv"],
            capture_output=True,
            text=True,
            cwd=os.path.dirname(os.path.abspath(__file__)),
        )
        self.assertEqual(result.returncode, 1)
        self.assertEqual(result.stdout, "")
        self.assertIn("cannot read no-such-file.csv", result.stderr)


if __name__ == "__main__":
    unittest.main()
```

Note on `test_opening_defaults_to_zero` versus `test_without_rules_everything_is_uncategorized`: with no rules every transaction lands in `uncategorized`, whose total is `2500.00 - 7.50 - 900.00 = 1592.50`; the closing balance differs between the two tests only because of `--opening`.

- [ ] **Step 2: Run the tests to verify they fail**

Run: `python3 -m unittest test_cli -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'ledgerlite.cli'`.

- [ ] **Step 3: Implement the CLI**

Create `ledgerlite/cli.py`:

```python
"""Command-line entry point: arguments, files, error messages, exit codes."""

import argparse
import sys

from .parse import ParseError, parse_amount, parse_transactions
from .report import format_report
from .rules import Rule, parse_rules

PROGRAM = "ledgerlite"


class ReadError(Exception):
    """A file could not be read; str() is the reason to show the user."""


def read_text(path: str) -> str:
    """Read a whole text file as UTF-8, raising ReadError with a reason."""
    try:
        with open(path, encoding="utf-8", newline="") as handle:
            return handle.read()
    except UnicodeDecodeError:
        raise ReadError("not valid UTF-8 text") from None
    except OSError as error:
        raise ReadError(error.strerror or str(error)) from None


def _build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog=PROGRAM, description="Summarize bank transactions by category."
    )
    subcommands = parser.add_subparsers(dest="command", required=True)
    report = subcommands.add_parser(
        "report", help="print per-category totals and the closing balance"
    )
    report.add_argument("transactions", help="path to the transactions CSV")
    report.add_argument("--rules", help="path to the rules file")
    report.add_argument(
        "--opening", default="0", help="opening balance (default: 0)"
    )
    return parser


def _cannot_read(path: str, error: ReadError) -> None:
    print(f"{PROGRAM}: cannot read {path}: {error}", file=sys.stderr)


def _malformed(path: str, error: ParseError) -> None:
    print(f"{PROGRAM}: {path}:{error.line}: {error.message}", file=sys.stderr)


def main(argv: list[str] | None = None) -> int:
    """Run the CLI. Return the process exit code; print nothing to stdout on error."""
    args = _build_parser().parse_args(argv)

    try:
        opening = parse_amount(args.opening)
    except ValueError:
        print(f"{PROGRAM}: bad --opening amount {args.opening!r}", file=sys.stderr)
        return 2

    try:
        text = read_text(args.transactions)
    except ReadError as error:
        _cannot_read(args.transactions, error)
        return 1
    try:
        transactions = parse_transactions(text)
    except ParseError as error:
        _malformed(args.transactions, error)
        return 2

    rules: list[Rule] = []
    if args.rules is not None:
        try:
            rules_text = read_text(args.rules)
        except ReadError as error:
            _cannot_read(args.rules, error)
            return 1
        try:
            rules = parse_rules(rules_text)
        except ParseError as error:
            _malformed(args.rules, error)
            return 2

    sys.stdout.write(format_report(transactions, rules, opening))
    return 0
```

Checks run in this order — `--opening`, then the transactions file, then the rules file — so when more than one input is bad the earliest one is reported. `format_report` is written only after every input has validated, which is what keeps stdout empty on failure.

Create `ledgerlite/__main__.py`:

```python
"""Allow `python3 -m ledgerlite ...`."""

import sys

from .cli import main

sys.exit(main())
```

- [ ] **Step 4: Run the whole suite to verify it passes**

Run: `python3 -m unittest -v`
Expected: PASS, all five test modules.

- [ ] **Step 5: Check the tool by hand**

```bash
printf 'date,amount,description\n2026-03-05,2500.00,ACME Payroll\n2026-03-04,-7.50,Coffee shop\n2026-03-06,-900.00,Rent March\n' > /tmp/ledgerlite-t.csv
printf 'coffee=food\nrent=housing\n' > /tmp/ledgerlite-rules.txt
python3 -m ledgerlite report /tmp/ledgerlite-t.csv --rules /tmp/ledgerlite-rules.txt --opening 100
echo "exit: $?"
python3 -m ledgerlite report /tmp/nope.csv; echo "exit: $?"
python3 -m ledgerlite report --help
```

Expected: the design's example report then `exit: 0`; then `ledgerlite: cannot read /tmp/nope.csv: No such file or directory` on stderr with `exit: 1`; then usage text listing `transactions`, `--rules`, `--opening`.

- [ ] **Step 6: Commit**

```bash
git add ledgerlite/cli.py ledgerlite/__main__.py test_cli.py
git commit -m "feat: add ledgerlite CLI with report command and exit codes"
```

---

## Final verification

- [ ] **Step 1: Full suite from a clean checkout state**

Run: `python3 -m unittest -v` from the repo root.
Expected: PASS, zero failures, zero errors.

- [ ] **Step 2: Confirm the global constraints hold**

```bash
grep -rn "float(" ledgerlite/ || echo "no float() — good"
grep -rn "^import \|^from " ledgerlite/ | grep -v "ledgerlite\|argparse\|csv\|io\|re\|sys\|dataclasses\|datetime\|decimal" || echo "stdlib only — good"
git status --short
```
Expected: both greps print their "good" message; `git status` is clean.

- [ ] **Step 3: Confirm the layout matches the design**

```bash
ls ledgerlite/ && ls test_*.py
```
Expected: `__init__.py __main__.py balance.py cli.py model.py parse.py report.py rules.py` and the five root test modules.
