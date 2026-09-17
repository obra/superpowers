# ledgerlite Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `ledgerlite`, a standard-library-only Python CLI that reads a bank-transaction CSV, categorizes each row from a rules file, and prints per-category totals plus the closing balance.

**Architecture:** Six small modules with one responsibility each, wired together only at the CLI layer: `model` (the record), `parse` (text → records, with typed errors), `rules` (rules text → matchers), `balance` (ordering and closing balance), `report` (totals and formatting), `cli` (argument parsing, file I/O, exit codes). Pure functions take and return strings and values — no module except `cli` touches the filesystem, `sys.argv`, or the streams, so every behavior in the spec is testable without temp files.

**Tech Stack:** Python 3.11+, standard library only (`csv`, `decimal`, `datetime`, `argparse`, `dataclasses`, `re`, `unittest`). No third-party packages, no `pyproject.toml` build step — the package is imported from the repo root.

**Spec:** `design.md` (in this directory)

## Global Constraints

- Python 3.11+. Standard library only — no third-party dependencies.
- Money is `decimal.Decimal` everywhere. Never `float`, at any point, including in tests.
- Package layout is exactly as the spec's "Package layout" section lists: `ledgerlite/{__init__,model,parse,rules,balance,report,cli}.py`. One addition beyond the spec: `ledgerlite/__main__.py`, three lines, so the tool the spec's Behavior section describes is actually invocable (`python3 -m ledgerlite report ...`).
- Tests live at the repo root as `test_<module>.py`, use `unittest`, and run with `python3 -m unittest` from the repo root.
- Error messages go to stderr and start with the literal prefix `ledgerlite: `. Success output goes to stdout only.
- Exit codes: `0` success, `1` unreadable input file, `2` malformed row.
- Amounts are always printed with exactly two fractional digits, a leading `-` only for negative values, and no thousands separators.
- This is a local scratch repo with no remote. Work directly on `main`. Commit after each task.

## Review Focus

Input classes and decisions the spec implies but does not spell out. Each line names the behavior chosen and the task whose tests pin it.

1. `Decimal("nan")` and `Decimal("inf")` parse successfully, so an amount of `nan` would silently become a transaction — non-finite amounts are malformed (Task 2).
2. `date.fromisoformat` on 3.11+ accepts `20260304` and `2026-W10-3`; the spec says `2026-03-04` — only exactly `YYYY-MM-DD` is accepted, everything else is malformed (Task 2).
3. A well-formed but impossible date (`2026-02-30`) is malformed (Task 2).
4. `1.5000` has two significant fractional digits but four written ones — read literally, more than two written fractional digits is malformed, so `1.5000` and `1e-3` are both rejected (Task 2).
5. The header row is skipped unconditionally and never validated; it counts as line 1, so the first data row reports as line 2 (Task 2).
6. A blank line mid-file is a row with the wrong column count, so it is malformed (Task 2).
7. A description containing commas or quotes is one CSV field, not several (Task 2).
8. Rules lines with no `=`, an empty substring, or an empty category are ignored — the spec gives no error channel for the rules file (Task 3). A substring containing `=` is impossible; the split is on the first `=` and the category is the remainder (Task 3).
9. Two rules pointing at the same category sum into one line (Task 5).
10. A rule whose category is the literal word `uncategorized` merges into the no-rule bucket and stays last (Task 5).
11. "Alphabetically" for mixed-case category names means case-insensitive, with the raw name as tiebreak — `Food` sorts next to `food`, not before every lowercase name (Task 5).
12. A total of exactly zero, or an amount written `-0.00`, prints as `0.00` and never `-0.00` (Task 5).
13. A file with no transactions (header only, or completely empty) prints no category lines at all — just the blank line and `closing balance: <opening>` (Tasks 5 and 6).
14. `--rules` pointing at an unreadable path gets the same treatment the spec gives TRANSACTIONS: `cannot read` on stderr, exit 1 (Task 6).
15. A malformed `--opening` value (`abc`, `1.005`) is an argparse usage error, exit 2, message on stderr (Task 6).
16. A transactions file that is not valid UTF-8 raises `UnicodeDecodeError`, which is not an `OSError` — it must be reported as `cannot read`, exit 1, not crash with a traceback (Task 6).
17. On exit 2, stdout is completely empty — the report is formatted only after every row parses (Task 6).

---

## File Structure

| File | Responsibility |
|---|---|
| `ledgerlite/__init__.py` | Package docstring. Nothing else — no re-exports, so import order stays obvious. |
| `ledgerlite/model.py` | `Transaction` frozen dataclass. No logic. |
| `ledgerlite/parse.py` | `ParseError`, `parse_amount`, `parse_date`, `parse_transactions`. Takes CSV *text*, not a path. |
| `ledgerlite/rules.py` | `parse_rules` (text → ordered pairs), `categorize` (description + rules → category or `None`). |
| `ledgerlite/balance.py` | `order_transactions`, `running_balances`, `closing_balance`. |
| `ledgerlite/report.py` | `UNCATEGORIZED`, `format_amount`, `category_totals`, `format_report`. |
| `ledgerlite/cli.py` | `main(argv) -> int`: argparse, file reads, error messages, exit codes. |
| `ledgerlite/__main__.py` | `sys.exit(main())`. |
| `test_model.py` … `test_cli.py` | One test module per source module, repo root. |

Dependency direction is one-way: `model` ← `parse`, `balance`; `rules` ← `report`; `balance`, `report`, `parse`, `rules` ← `cli`. Nothing imports `cli`.

---

## Task 1: Package skeleton and the Transaction record

**Files:**
- Create: `ledgerlite/__init__.py`
- Create: `ledgerlite/model.py`
- Test: `test_model.py`

**Interfaces:**
- Consumes: nothing.
- Produces: `ledgerlite.model.Transaction(date: datetime.date, amount: decimal.Decimal, description: str)` — a frozen dataclass with keyword or positional construction, in that field order. Every later task uses it.

- [ ] **Step 1: Write the failing test**

Create `test_model.py`:

```python
import dataclasses
import datetime
import unittest
from decimal import Decimal

from ledgerlite.model import Transaction


class TransactionTest(unittest.TestCase):
    def test_holds_date_amount_and_description(self):
        transaction = Transaction(
            date=datetime.date(2026, 3, 4),
            amount=Decimal("-7.50"),
            description="Coffee Shop",
        )
        self.assertEqual(transaction.date, datetime.date(2026, 3, 4))
        self.assertEqual(transaction.amount, Decimal("-7.50"))
        self.assertEqual(transaction.description, "Coffee Shop")

    def test_accepts_positional_fields_in_spec_order(self):
        transaction = Transaction(datetime.date(2026, 1, 2), Decimal("2500.00"), "Salary")
        self.assertEqual(transaction.date, datetime.date(2026, 1, 2))
        self.assertEqual(transaction.amount, Decimal("2500.00"))
        self.assertEqual(transaction.description, "Salary")

    def test_is_frozen(self):
        transaction = Transaction(datetime.date(2026, 3, 4), Decimal("1.00"), "x")
        with self.assertRaises(dataclasses.FrozenInstanceError):
            transaction.amount = Decimal("2.00")


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run the test to verify it fails**

Run from the repo root: `python3 -m unittest test_model -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'ledgerlite'`.

- [ ] **Step 3: Write the minimal implementation**

Create `ledgerlite/__init__.py`:

```python
"""ledgerlite: summarize bank transactions by category."""
```

Create `ledgerlite/model.py`:

```python
"""The Transaction record shared by the rest of the package."""

import datetime
from dataclasses import dataclass
from decimal import Decimal


@dataclass(frozen=True)
class Transaction:
    """One row of the transactions CSV, already parsed."""

    date: datetime.date
    amount: Decimal
    description: str
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `python3 -m unittest test_model -v`
Expected: PASS, 3 tests.

- [ ] **Step 5: Commit**

```bash
git add ledgerlite/__init__.py ledgerlite/model.py test_model.py
git commit -m "feat: add ledgerlite package skeleton and Transaction record"
```

---

## Task 2: Parsing the transactions CSV

Three TDD cycles: amounts, dates, then whole rows. Amount and date parsing are separate public functions because the CLI reuses `parse_amount` for `--opening` in Task 6.

**Files:**
- Create: `ledgerlite/parse.py`
- Test: `test_parse.py`

**Interfaces:**
- Consumes: `ledgerlite.model.Transaction` (Task 1).
- Produces:
  - `ParseError(line: int, message: str)` — an `Exception` subclass with `.line` (int, 1-based, counting the header as line 1) and `.message` (str, no path and no line number inside it).
  - `parse_amount(text: str) -> Decimal` — raises `ValueError` whose `str()` is the human-readable reason.
  - `parse_date(text: str) -> datetime.date` — raises `ValueError` likewise.
  - `parse_transactions(text: str) -> list[Transaction]` — takes the full file text, returns rows in input order, raises `ParseError` on the first bad row.

- [ ] **Step 1: Write the failing amount tests**

Create `test_parse.py`:

```python
import datetime
import unittest
from decimal import Decimal

from ledgerlite.model import Transaction
from ledgerlite.parse import ParseError, parse_amount, parse_date, parse_transactions


class ParseAmountTest(unittest.TestCase):
    def test_parses_negative_two_digit_amount(self):
        self.assertEqual(parse_amount("-7.50"), Decimal("-7.50"))

    def test_parses_positive_amount(self):
        self.assertEqual(parse_amount("2500.00"), Decimal("2500.00"))

    def test_parses_one_fractional_digit(self):
        self.assertEqual(parse_amount("1.5"), Decimal("1.5"))

    def test_parses_integer_amount(self):
        self.assertEqual(parse_amount("100"), Decimal("100"))

    def test_result_is_decimal_not_float(self):
        self.assertIsInstance(parse_amount("0.10"), Decimal)

    def test_tolerates_surrounding_whitespace(self):
        self.assertEqual(parse_amount("  -12.50 "), Decimal("-12.50"))

    def test_rejects_three_fractional_digits(self):
        with self.assertRaises(ValueError) as caught:
            parse_amount("1.005")
        self.assertIn("more than two fractional digits", str(caught.exception))

    def test_rejects_trailing_zeros_beyond_two_digits(self):
        # Review Focus 4: read literally, four written fractional digits is too many.
        with self.assertRaises(ValueError):
            parse_amount("1.5000")

    def test_rejects_exponent_form_below_two_digits(self):
        with self.assertRaises(ValueError):
            parse_amount("1e-3")

    def test_rejects_non_numeric(self):
        with self.assertRaises(ValueError) as caught:
            parse_amount("twelve")
        self.assertIn("not a decimal number", str(caught.exception))

    def test_rejects_empty(self):
        with self.assertRaises(ValueError):
            parse_amount("")

    def test_rejects_nan(self):
        # Review Focus 1: Decimal("nan") would otherwise parse fine.
        with self.assertRaises(ValueError):
            parse_amount("nan")

    def test_rejects_infinity(self):
        with self.assertRaises(ValueError):
            parse_amount("-Infinity")


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run the amount tests to verify they fail**

Run: `python3 -m unittest test_parse -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'ledgerlite.parse'`.

- [ ] **Step 3: Implement `parse_amount`**

Create `ledgerlite/parse.py`:

```python
"""Parse transactions CSV text into Transaction records."""

import csv
import datetime
import io
import re
from decimal import Decimal, InvalidOperation

from .model import Transaction

_DATE_PATTERN = re.compile(r"\d{4}-\d{2}-\d{2}\Z")


class ParseError(Exception):
    """A row of the transactions CSV is malformed.

    ``line`` is 1-based over the whole file, counting the header as line 1.
    ``message`` says what is wrong, without the path or the line number;
    the CLI is responsible for prefixing those.
    """

    def __init__(self, line: int, message: str) -> None:
        super().__init__(f"{line}: {message}")
        self.line = line
        self.message = message


def parse_amount(text: str) -> Decimal:
    """Return ``text`` as a Decimal with at most two fractional digits."""
    try:
        amount = Decimal(text.strip())
    except InvalidOperation:
        raise ValueError(f"{text!r} is not a decimal number") from None
    if not amount.is_finite():
        raise ValueError(f"{text!r} is not a decimal number")
    if amount.as_tuple().exponent < -2:
        raise ValueError(f"{text!r} has more than two fractional digits")
    return amount
```

- [ ] **Step 4: Run the amount tests to verify they pass**

Run: `python3 -m unittest test_parse.ParseAmountTest -v`
Expected: PASS, 13 tests. `test_parse` as a whole still fails to import `parse_date`; that is the next cycle.

- [ ] **Step 5: Write the failing date tests**

Append to `test_parse.py`, above the `if __name__` block:

```python
class ParseDateTest(unittest.TestCase):
    def test_parses_iso_date(self):
        self.assertEqual(parse_date("2026-03-04"), datetime.date(2026, 3, 4))

    def test_tolerates_surrounding_whitespace(self):
        self.assertEqual(parse_date(" 2026-03-04 "), datetime.date(2026, 3, 4))

    def test_rejects_compact_iso_form(self):
        # Review Focus 2: date.fromisoformat accepts this on 3.11+; the spec does not.
        with self.assertRaises(ValueError) as caught:
            parse_date("20260304")
        self.assertIn("YYYY-MM-DD", str(caught.exception))

    def test_rejects_iso_week_form(self):
        with self.assertRaises(ValueError):
            parse_date("2026-W10-3")

    def test_rejects_datetime_form(self):
        with self.assertRaises(ValueError):
            parse_date("2026-03-04T09:30:00")

    def test_rejects_us_order(self):
        with self.assertRaises(ValueError):
            parse_date("03/04/2026")

    def test_rejects_unpadded_month_and_day(self):
        with self.assertRaises(ValueError):
            parse_date("2026-3-4")

    def test_rejects_impossible_day(self):
        # Review Focus 3: well-formed shape, no such date.
        with self.assertRaises(ValueError) as caught:
            parse_date("2026-02-30")
        self.assertIn("not a valid date", str(caught.exception))

    def test_rejects_empty(self):
        with self.assertRaises(ValueError):
            parse_date("")
```

- [ ] **Step 6: Run the date tests to verify they fail**

Run: `python3 -m unittest test_parse.ParseDateTest -v`
Expected: FAIL — `ImportError: cannot import name 'parse_date'`.

- [ ] **Step 7: Implement `parse_date`**

Append to `ledgerlite/parse.py`:

```python
def parse_date(text: str) -> datetime.date:
    """Return ``text`` as a date. Only the exact form YYYY-MM-DD is accepted."""
    stripped = text.strip()
    if not _DATE_PATTERN.match(stripped):
        raise ValueError(f"{text!r} is not an ISO 8601 date (YYYY-MM-DD)")
    try:
        return datetime.date.fromisoformat(stripped)
    except ValueError:
        raise ValueError(f"{text!r} is not a valid date") from None
```

- [ ] **Step 8: Run the date tests to verify they pass**

Run: `python3 -m unittest test_parse.ParseDateTest -v`
Expected: PASS, 9 tests.

- [ ] **Step 9: Write the failing row tests**

Append to `test_parse.py`, above the `if __name__` block:

```python
HEADER = "date,amount,description\n"


class ParseTransactionsTest(unittest.TestCase):
    def test_parses_rows_in_input_order(self):
        text = HEADER + "2026-03-04,-7.50,Coffee Shop\n2026-03-01,-900.00,March Rent\n"
        self.assertEqual(
            parse_transactions(text),
            [
                Transaction(datetime.date(2026, 3, 4), Decimal("-7.50"), "Coffee Shop"),
                Transaction(datetime.date(2026, 3, 1), Decimal("-900.00"), "March Rent"),
            ],
        )

    def test_header_only_file_has_no_transactions(self):
        self.assertEqual(parse_transactions(HEADER), [])

    def test_empty_file_has_no_transactions(self):
        self.assertEqual(parse_transactions(""), [])

    def test_first_row_is_skipped_without_being_validated(self):
        # Review Focus 5: the header is skipped, whatever it says.
        text = "whatever,it,says\n2026-03-04,-7.50,Coffee\n"
        self.assertEqual(len(parse_transactions(text)), 1)

    def test_quoted_description_keeps_its_commas(self):
        # Review Focus 7.
        text = HEADER + '2026-03-04,-7.50,"Coffee Shop, Downtown"\n'
        self.assertEqual(parse_transactions(text)[0].description, "Coffee Shop, Downtown")

    def test_reports_line_number_counting_the_header(self):
        # Review Focus 5: first data row is line 2.
        text = HEADER + "2026-03-04,-7.50,Coffee\nnope,-1.00,Bad\n"
        with self.assertRaises(ParseError) as caught:
            parse_transactions(text)
        self.assertEqual(caught.exception.line, 3)

    def test_rejects_too_few_columns(self):
        text = HEADER + "2026-03-04,-7.50\n"
        with self.assertRaises(ParseError) as caught:
            parse_transactions(text)
        self.assertEqual(caught.exception.line, 2)
        self.assertIn("expected 3 columns, got 2", caught.exception.message)

    def test_rejects_too_many_columns(self):
        text = HEADER + "2026-03-04,-7.50,Coffee,extra\n"
        with self.assertRaises(ParseError) as caught:
            parse_transactions(text)
        self.assertIn("expected 3 columns, got 4", caught.exception.message)

    def test_rejects_blank_row(self):
        # Review Focus 6: a blank line has the wrong column count.
        text = HEADER + "2026-03-04,-7.50,Coffee\n\n2026-03-05,-1.00,Tea\n"
        with self.assertRaises(ParseError) as caught:
            parse_transactions(text)
        self.assertEqual(caught.exception.line, 3)

    def test_rejects_bad_date_with_reason(self):
        text = HEADER + "2026-13-99,-7.50,Coffee\n"
        with self.assertRaises(ParseError) as caught:
            parse_transactions(text)
        self.assertIn("date", caught.exception.message)

    def test_rejects_bad_amount_with_reason(self):
        text = HEADER + "2026-03-04,1.005,Coffee\n"
        with self.assertRaises(ParseError) as caught:
            parse_transactions(text)
        self.assertIn("more than two fractional digits", caught.exception.message)

    def test_message_carries_no_line_prefix_but_str_does(self):
        # The CLI adds "<path>:<line>: "; .message must not duplicate it.
        text = HEADER + "2026-03-04,oops,Coffee\n"
        with self.assertRaises(ParseError) as caught:
            parse_transactions(text)
        self.assertFalse(caught.exception.message.startswith("2:"))
        self.assertTrue(str(caught.exception).startswith("2: "))
```

- [ ] **Step 10: Run the row tests to verify they fail**

Run: `python3 -m unittest test_parse.ParseTransactionsTest -v`
Expected: FAIL — `ImportError: cannot import name 'parse_transactions'`.

- [ ] **Step 11: Implement `parse_transactions`**

Append to `ledgerlite/parse.py`:

```python
def parse_transactions(text: str) -> list[Transaction]:
    """Return every data row of ``text`` in input order.

    Raises ParseError on the first malformed row; the caller gets either a
    complete list or an error, never a partial list.
    """
    reader = csv.reader(io.StringIO(text, newline=""))
    transactions: list[Transaction] = []
    for index, row in enumerate(reader):
        if index == 0:
            continue  # header row, skipped unvalidated
        if len(row) != 3:
            raise ParseError(reader.line_num, f"expected 3 columns, got {len(row)}")
        date_text, amount_text, description = row
        try:
            date = parse_date(date_text)
            amount = parse_amount(amount_text)
        except ValueError as exc:
            raise ParseError(reader.line_num, str(exc)) from None
        transactions.append(Transaction(date, amount, description))
    return transactions
```

- [ ] **Step 12: Run the full parse suite to verify it passes**

Run: `python3 -m unittest test_parse -v`
Expected: PASS, 34 tests.

- [ ] **Step 13: Commit**

```bash
git add ledgerlite/parse.py test_parse.py
git commit -m "feat: parse transactions CSV into Transaction records"
```

---

## Task 3: Rules parsing and categorization

**Files:**
- Create: `ledgerlite/rules.py`
- Test: `test_rules.py`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `Rule = tuple[str, str]` — a type alias, imported by `report.py` in Task 5.
  - `parse_rules(text: str) -> list[Rule]` — `(substring, category)` pairs in file order.
  - `categorize(description: str, rules: list[tuple[str, str]]) -> str | None` — first matching rule's category, case-insensitive on the description; `None` when nothing matches.

- [ ] **Step 1: Write the failing tests**

Create `test_rules.py`:

```python
import unittest

from ledgerlite.rules import categorize, parse_rules


class ParseRulesTest(unittest.TestCase):
    def test_parses_pairs_in_file_order(self):
        self.assertEqual(
            parse_rules("coffee=food\nrent=housing\n"),
            [("coffee", "food"), ("rent", "housing")],
        )

    def test_ignores_blank_lines(self):
        self.assertEqual(parse_rules("\ncoffee=food\n\n\n"), [("coffee", "food")])

    def test_strips_whitespace_around_both_halves(self):
        self.assertEqual(parse_rules("  coffee  =  food  \n"), [("coffee", "food")])

    def test_splits_on_first_equals_only(self):
        # Review Focus 8: the category keeps the rest, including later '='.
        self.assertEqual(parse_rules("a=b=c\n"), [("a", "b=c")])

    def test_ignores_line_without_equals(self):
        self.assertEqual(parse_rules("nonsense\ncoffee=food\n"), [("coffee", "food")])

    def test_ignores_empty_substring(self):
        self.assertEqual(parse_rules("=food\ncoffee=food\n"), [("coffee", "food")])

    def test_ignores_empty_category(self):
        self.assertEqual(parse_rules("coffee=\nrent=housing\n"), [("rent", "housing")])

    def test_empty_text_gives_no_rules(self):
        self.assertEqual(parse_rules(""), [])

    def test_keeps_duplicate_categories_as_separate_rules(self):
        self.assertEqual(
            parse_rules("coffee=food\ngrocer=food\n"),
            [("coffee", "food"), ("grocer", "food")],
        )


class CategorizeTest(unittest.TestCase):
    RULES = [("coffee", "food"), ("rent", "housing")]

    def test_matches_substring_anywhere_in_description(self):
        self.assertEqual(categorize("BIG COFFEE SHOP #4", self.RULES), "food")

    def test_matching_is_case_insensitive_both_ways(self):
        self.assertEqual(categorize("coffee shop", [("COFFEE", "food")]), "food")

    def test_first_matching_rule_wins(self):
        rules = [("coffee", "food"), ("coffee shop", "outings")]
        self.assertEqual(categorize("Coffee Shop", rules), "food")

    def test_returns_none_when_nothing_matches(self):
        self.assertIsNone(categorize("Salary", self.RULES))

    def test_returns_none_with_no_rules(self):
        self.assertIsNone(categorize("Coffee", []))


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `python3 -m unittest test_rules -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'ledgerlite.rules'`.

- [ ] **Step 3: Write the minimal implementation**

Create `ledgerlite/rules.py`:

```python
"""Turn rules text into (substring, category) pairs and apply them."""

Rule = tuple[str, str]


def parse_rules(text: str) -> list[Rule]:
    """Return the ``<substring>=<category>`` rules of ``text``, in file order.

    Lines that cannot be a rule -- no '=', an empty substring, or an empty
    category -- are ignored: the spec gives the rules file no error channel.
    """
    rules: list[Rule] = []
    for line in text.splitlines():
        substring, separator, category = line.partition("=")
        if not separator:
            continue
        substring = substring.strip()
        category = category.strip()
        if not substring or not category:
            continue
        rules.append((substring, category))
    return rules


def categorize(description: str, rules: list[Rule]) -> str | None:
    """Return the category of the first rule matching ``description``."""
    lowered = description.lower()
    for substring, category in rules:
        if substring.lower() in lowered:
            return category
    return None
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `python3 -m unittest test_rules -v`
Expected: PASS, 14 tests.

- [ ] **Step 5: Commit**

```bash
git add ledgerlite/rules.py test_rules.py
git commit -m "feat: parse rules file and categorize descriptions"
```

---

## Task 4: Date ordering and closing balance

**Files:**
- Create: `ledgerlite/balance.py`
- Test: `test_balance.py`

**Interfaces:**
- Consumes: `ledgerlite.model.Transaction` (Task 1).
- Produces:
  - `order_transactions(transactions: list[Transaction]) -> list[Transaction]` — sorted by date, ties keeping input order.
  - `running_balances(opening: Decimal, transactions: list[Transaction]) -> list[Decimal]` — the balance after each transaction, in date order.
  - `closing_balance(opening: Decimal, transactions: list[Transaction]) -> Decimal` — the last running balance, or `opening` when there are none.

- [ ] **Step 1: Write the failing tests**

Create `test_balance.py`:

```python
import datetime
import unittest
from decimal import Decimal

from ledgerlite.balance import closing_balance, order_transactions, running_balances
from ledgerlite.model import Transaction


def txn(day, amount, description="x"):
    return Transaction(datetime.date(2026, 3, day), Decimal(amount), description)


class OrderTransactionsTest(unittest.TestCase):
    def test_sorts_by_date(self):
        rows = [txn(4, "-7.50"), txn(1, "-900.00"), txn(2, "2500.00")]
        self.assertEqual([t.date.day for t in order_transactions(rows)], [1, 2, 4])

    def test_ties_keep_input_order(self):
        rows = [txn(1, "-1.00", "first"), txn(1, "-2.00", "second")]
        self.assertEqual([t.description for t in order_transactions(rows)], ["first", "second"])

    def test_does_not_mutate_input(self):
        rows = [txn(4, "-7.50"), txn(1, "-900.00")]
        order_transactions(rows)
        self.assertEqual([t.date.day for t in rows], [4, 1])

    def test_empty_input(self):
        self.assertEqual(order_transactions([]), [])


class RunningBalancesTest(unittest.TestCase):
    def test_accumulates_in_date_order(self):
        rows = [txn(4, "-7.50"), txn(1, "-900.00"), txn(2, "2500.00")]
        self.assertEqual(
            running_balances(Decimal("100"), rows),
            [Decimal("-800.00"), Decimal("1700.00"), Decimal("1692.50")],
        )

    def test_no_transactions_gives_no_balances(self):
        self.assertEqual(running_balances(Decimal("100"), []), [])


class ClosingBalanceTest(unittest.TestCase):
    def test_adds_every_amount_to_the_opening(self):
        rows = [txn(4, "-7.50"), txn(1, "-900.00"), txn(2, "2500.00")]
        self.assertEqual(closing_balance(Decimal("100"), rows), Decimal("1692.50"))

    def test_no_transactions_returns_opening(self):
        self.assertEqual(closing_balance(Decimal("100"), []), Decimal("100"))

    def test_result_is_decimal_not_float(self):
        self.assertIsInstance(closing_balance(Decimal("0"), [txn(1, "0.10")]), Decimal)

    def test_decimal_arithmetic_is_exact(self):
        rows = [txn(1, "0.10"), txn(1, "0.20")]
        self.assertEqual(closing_balance(Decimal("0"), rows), Decimal("0.30"))


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `python3 -m unittest test_balance -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'ledgerlite.balance'`.

- [ ] **Step 3: Write the minimal implementation**

Create `ledgerlite/balance.py`:

```python
"""Date-ordered running balance and closing balance."""

from decimal import Decimal

from .model import Transaction


def order_transactions(transactions: list[Transaction]) -> list[Transaction]:
    """Return ``transactions`` by date; ties keep input order (stable sort)."""
    return sorted(transactions, key=lambda transaction: transaction.date)


def running_balances(opening: Decimal, transactions: list[Transaction]) -> list[Decimal]:
    """Return the balance after each transaction, in date order."""
    balance = opening
    balances: list[Decimal] = []
    for transaction in order_transactions(transactions):
        balance += transaction.amount
        balances.append(balance)
    return balances


def closing_balance(opening: Decimal, transactions: list[Transaction]) -> Decimal:
    """Return the balance after the last transaction, or ``opening`` if none."""
    balances = running_balances(opening, transactions)
    return balances[-1] if balances else opening
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `python3 -m unittest test_balance -v`
Expected: PASS, 10 tests.

- [ ] **Step 5: Commit**

```bash
git add ledgerlite/balance.py test_balance.py
git commit -m "feat: add date ordering and closing balance"
```

---

## Task 5: Category totals and report formatting

Three TDD cycles: amount formatting, totals with their ordering rules, then the assembled report.

**Files:**
- Create: `ledgerlite/report.py`
- Test: `test_report.py`

**Interfaces:**
- Consumes: `Transaction` (Task 1), `rules.categorize` (Task 3), `balance.closing_balance` (Task 4).
- Produces:
  - `UNCATEGORIZED = "uncategorized"`.
  - `format_amount(amount: Decimal) -> str` — exactly two fractional digits, no thousands separators, `-` only for genuinely negative values.
  - `category_totals(transactions, rules) -> list[tuple[str, Decimal]]` — display order: categories case-insensitively alphabetical, then `uncategorized` last. Categories with no transactions do not appear.
  - `format_report(transactions, rules, opening: Decimal) -> str` — the whole report, **without** a trailing newline.

- [ ] **Step 1: Write the failing formatting tests**

Create `test_report.py`:

```python
import datetime
import unittest
from decimal import Decimal

from ledgerlite.model import Transaction
from ledgerlite.report import UNCATEGORIZED, category_totals, format_amount, format_report


def txn(day, amount, description):
    return Transaction(datetime.date(2026, 3, day), Decimal(amount), description)


RULES = [("coffee", "food"), ("rent", "housing")]


class FormatAmountTest(unittest.TestCase):
    def test_negative_keeps_its_sign(self):
        self.assertEqual(format_amount(Decimal("-12.50")), "-12.50")

    def test_zero_has_no_sign(self):
        self.assertEqual(format_amount(Decimal("0")), "0.00")

    def test_pads_to_two_fractional_digits(self):
        self.assertEqual(format_amount(Decimal("1200")), "1200.00")

    def test_keeps_one_fractional_digit_padded(self):
        self.assertEqual(format_amount(Decimal("1.5")), "1.50")

    def test_no_thousands_separators(self):
        self.assertEqual(format_amount(Decimal("1234567.89")), "1234567.89")

    def test_negative_zero_prints_unsigned(self):
        # Review Focus 12.
        self.assertEqual(format_amount(Decimal("-0.00")), "0.00")

    def test_cancelling_total_prints_unsigned(self):
        self.assertEqual(format_amount(Decimal("-5.00") + Decimal("5.00")), "0.00")


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run the formatting tests to verify they fail**

Run: `python3 -m unittest test_report -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'ledgerlite.report'`.

- [ ] **Step 3: Implement `format_amount`**

Create `ledgerlite/report.py`:

```python
"""Per-category totals and report formatting."""

from decimal import Decimal

from .balance import closing_balance
from .model import Transaction
from .rules import Rule, categorize

UNCATEGORIZED = "uncategorized"


def format_amount(amount: Decimal) -> str:
    """Format ``amount`` with exactly two fractional digits, no separators."""
    if amount == 0:
        amount = Decimal(0)  # collapse -0.00 to 0.00
    return f"{amount:.2f}"
```

- [ ] **Step 4: Run the formatting tests to verify they pass**

Run: `python3 -m unittest test_report.FormatAmountTest -v`
Expected: PASS, 7 tests.

- [ ] **Step 5: Write the failing totals tests**

Append to `test_report.py`, above the `if __name__` block:

```python
class CategoryTotalsTest(unittest.TestCase):
    def test_sums_each_category(self):
        rows = [txn(1, "-900.00", "March Rent"), txn(4, "-7.50", "Coffee Shop")]
        self.assertEqual(
            category_totals(rows, RULES),
            [("food", Decimal("-7.50")), ("housing", Decimal("-900.00"))],
        )

    def test_categories_are_alphabetical(self):
        rules = [("a", "zebra"), ("b", "apple"), ("c", "mango")]
        rows = [txn(1, "1.00", "a"), txn(1, "1.00", "b"), txn(1, "1.00", "c")]
        self.assertEqual([name for name, _ in category_totals(rows, rules)], ["apple", "mango", "zebra"])

    def test_alphabetical_is_case_insensitive(self):
        # Review Focus 11.
        rules = [("a", "Zebra"), ("b", "apple")]
        rows = [txn(1, "1.00", "a"), txn(1, "1.00", "b")]
        self.assertEqual([name for name, _ in category_totals(rows, rules)], ["apple", "Zebra"])

    def test_unmatched_transactions_go_to_uncategorized(self):
        rows = [txn(2, "2500.00", "Salary")]
        self.assertEqual(category_totals(rows, RULES), [(UNCATEGORIZED, Decimal("2500.00"))])

    def test_uncategorized_is_last_despite_alphabet(self):
        rows = [txn(1, "1.00", "Salary"), txn(1, "-2.00", "Zoo Trip")]
        rules = [("zoo", "zoo visits")]
        self.assertEqual(
            [name for name, _ in category_totals(rows, rules)],
            ["zoo visits", UNCATEGORIZED],
        )

    def test_two_rules_one_category_sum_together(self):
        # Review Focus 9.
        rules = [("coffee", "food"), ("grocer", "food")]
        rows = [txn(1, "-7.50", "Coffee Shop"), txn(2, "-30.00", "Grocer Ltd")]
        self.assertEqual(category_totals(rows, rules), [("food", Decimal("-37.50"))])

    def test_rule_category_named_uncategorized_merges_and_stays_last(self):
        # Review Focus 10.
        rules = [("coffee", UNCATEGORIZED), ("rent", "housing")]
        rows = [txn(1, "-7.50", "Coffee"), txn(2, "-900.00", "Rent"), txn(3, "2500.00", "Salary")]
        self.assertEqual(
            category_totals(rows, rules),
            [("housing", Decimal("-900.00")), (UNCATEGORIZED, Decimal("2492.50"))],
        )

    def test_no_transactions_gives_no_lines(self):
        # Review Focus 13: no 'uncategorized: 0.00' out of nowhere.
        self.assertEqual(category_totals([], RULES), [])

    def test_no_rules_puts_everything_in_uncategorized(self):
        rows = [txn(1, "-7.50", "Coffee"), txn(2, "-900.00", "Rent")]
        self.assertEqual(category_totals(rows, []), [(UNCATEGORIZED, Decimal("-907.50"))])
```

- [ ] **Step 6: Run the totals tests to verify they fail**

Run: `python3 -m unittest test_report.CategoryTotalsTest -v`
Expected: FAIL — `ImportError: cannot import name 'category_totals'`.

- [ ] **Step 7: Implement `category_totals`**

Append to `ledgerlite/report.py`:

```python
def category_totals(
    transactions: list[Transaction], rules: list[Rule]
) -> list[tuple[str, Decimal]]:
    """Return (category, total) pairs in display order.

    Categories sort case-insensitively; ``uncategorized`` is always last,
    and a category with no transactions never appears.
    """
    totals: dict[str, Decimal] = {}
    for transaction in transactions:
        category = categorize(transaction.description, rules)
        if category is None:
            category = UNCATEGORIZED
        totals[category] = totals.get(category, Decimal(0)) + transaction.amount

    ordered = sorted(
        (name for name in totals if name != UNCATEGORIZED),
        key=lambda name: (name.casefold(), name),
    )
    if UNCATEGORIZED in totals:
        ordered.append(UNCATEGORIZED)
    return [(name, totals[name]) for name in ordered]
```

- [ ] **Step 8: Run the totals tests to verify they pass**

Run: `python3 -m unittest test_report.CategoryTotalsTest -v`
Expected: PASS, 9 tests.

- [ ] **Step 9: Write the failing report tests**

Append to `test_report.py`, above the `if __name__` block:

```python
class FormatReportTest(unittest.TestCase):
    def test_matches_the_spec_example(self):
        rows = [
            txn(4, "-7.50", "Coffee Shop"),
            txn(1, "-900.00", "March Rent"),
            txn(2, "2500.00", "Salary"),
        ]
        self.assertEqual(
            format_report(rows, RULES, Decimal("100")),
            "food: -7.50\n"
            "housing: -900.00\n"
            "uncategorized: 2500.00\n"
            "\n"
            "closing balance: 1692.50",
        )

    def test_has_no_trailing_newline(self):
        rows = [txn(1, "-7.50", "Coffee")]
        self.assertFalse(format_report(rows, RULES, Decimal("0")).endswith("\n"))

    def test_no_transactions_prints_only_the_closing_balance(self):
        # Review Focus 13: blank line, then the closing balance.
        self.assertEqual(format_report([], RULES, Decimal("100")), "\nclosing balance: 100.00")

    def test_zero_opening_and_no_transactions(self):
        self.assertEqual(format_report([], [], Decimal("0")), "\nclosing balance: 0.00")

    def test_amounts_are_formatted_on_every_line(self):
        rows = [txn(1, "-900", "Rent")]
        self.assertEqual(
            format_report(rows, RULES, Decimal("1200")),
            "housing: -900.00\n\nclosing balance: 300.00",
        )
```

- [ ] **Step 10: Run the report tests to verify they fail**

Run: `python3 -m unittest test_report.FormatReportTest -v`
Expected: FAIL — `ImportError: cannot import name 'format_report'`.

- [ ] **Step 11: Implement `format_report`**

Append to `ledgerlite/report.py`:

```python
def format_report(
    transactions: list[Transaction], rules: list[Rule], opening: Decimal
) -> str:
    """Return the whole report: category lines, a blank line, the balance.

    No trailing newline; the caller prints it.
    """
    lines = [
        f"{name}: {format_amount(total)}"
        for name, total in category_totals(transactions, rules)
    ]
    lines.append("")
    lines.append(f"closing balance: {format_amount(closing_balance(opening, transactions))}")
    return "\n".join(lines)
```

- [ ] **Step 12: Run the whole suite to verify it passes**

Run: `python3 -m unittest -v`
Expected: PASS — every test from Tasks 1–5, 82 tests.

- [ ] **Step 13: Commit**

```bash
git add ledgerlite/report.py test_report.py
git commit -m "feat: add category totals and report formatting"
```

---

## Task 6: CLI, file I/O, and exit codes

**Files:**
- Create: `ledgerlite/cli.py`
- Create: `ledgerlite/__main__.py`
- Test: `test_cli.py`

**Interfaces:**
- Consumes: `parse.parse_transactions`, `parse.parse_amount`, `parse.ParseError` (Task 2), `rules.parse_rules` (Task 3), `report.format_report` (Task 5).
- Produces: `main(argv: list[str] | None = None) -> int`. Writes the report to `sys.stdout`, errors to `sys.stderr`, and returns the exit code rather than calling `sys.exit` — `__main__.py` does that.

- [ ] **Step 1: Write the failing tests**

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
    "2026-03-04,-7.50,Coffee Shop\n"
    "2026-03-01,-900.00,March Rent\n"
    "2026-03-02,2500.00,Salary\n"
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
        with open(path, "w", encoding=encoding) as handle:
            handle.write(text)
        return path

    def run_cli(self, argv):
        """Return (exit code, stdout, stderr)."""
        out, err = io.StringIO(), io.StringIO()
        with contextlib.redirect_stdout(out), contextlib.redirect_stderr(err):
            code = main(argv)
        return code, out.getvalue(), err.getvalue()

    def missing_path(self):
        return os.path.join(self.directory.name, "nope.csv")


class SuccessTest(CliTestCase):
    def test_prints_the_spec_example_and_returns_zero(self):
        transactions = self.write("t.csv", TRANSACTIONS)
        rules = self.write("r.txt", RULES)
        code, out, err = self.run_cli(
            ["report", transactions, "--rules", rules, "--opening", "100"]
        )
        self.assertEqual(code, 0)
        self.assertEqual(out, EXPECTED)
        self.assertEqual(err, "")

    def test_opening_defaults_to_zero(self):
        transactions = self.write("t.csv", "date,amount,description\n2026-03-01,-900.00,Rent\n")
        code, out, _ = self.run_cli(["report", transactions])
        self.assertEqual(code, 0)
        self.assertEqual(out, "uncategorized: -900.00\n\nclosing balance: -900.00\n")

    def test_without_rules_everything_is_uncategorized(self):
        transactions = self.write("t.csv", TRANSACTIONS)
        code, out, _ = self.run_cli(["report", transactions, "--opening", "100"])
        self.assertEqual(code, 0)
        self.assertEqual(out, "uncategorized: 1592.50\n\nclosing balance: 1692.50\n")

    def test_header_only_file_reports_the_opening_balance(self):
        # Review Focus 13.
        transactions = self.write("t.csv", "date,amount,description\n")
        code, out, _ = self.run_cli(["report", transactions, "--opening", "42.50"])
        self.assertEqual(code, 0)
        self.assertEqual(out, "\nclosing balance: 42.50\n")

    def test_negative_opening_is_accepted(self):
        transactions = self.write("t.csv", "date,amount,description\n2026-03-01,50.00,Refund\n")
        code, out, _ = self.run_cli(["report", transactions, "--opening", "-10.00"])
        self.assertEqual(code, 0)
        self.assertEqual(out, "uncategorized: 50.00\n\nclosing balance: 40.00\n")


class UnreadableInputTest(CliTestCase):
    def test_missing_transactions_file_returns_one(self):
        path = self.missing_path()
        code, out, err = self.run_cli(["report", path])
        self.assertEqual(code, 1)
        self.assertEqual(out, "")
        self.assertEqual(err, f"ledgerlite: cannot read {path}: No such file or directory\n")

    def test_directory_as_transactions_file_returns_one(self):
        code, out, err = self.run_cli(["report", self.directory.name])
        self.assertEqual(code, 1)
        self.assertEqual(out, "")
        self.assertTrue(err.startswith(f"ledgerlite: cannot read {self.directory.name}: "))

    def test_missing_rules_file_returns_one(self):
        # Review Focus 14.
        transactions = self.write("t.csv", TRANSACTIONS)
        path = self.missing_path()
        code, out, err = self.run_cli(["report", transactions, "--rules", path])
        self.assertEqual(code, 1)
        self.assertEqual(out, "")
        self.assertEqual(err, f"ledgerlite: cannot read {path}: No such file or directory\n")

    def test_non_utf8_transactions_file_returns_one(self):
        # Review Focus 16: UnicodeDecodeError is not an OSError.
        path = os.path.join(self.directory.name, "binary.csv")
        with open(path, "wb") as handle:
            handle.write(b"date,amount,description\n2026-03-04,-7.50,\xff\xfe\n")
        code, out, err = self.run_cli(["report", path])
        self.assertEqual(code, 1)
        self.assertEqual(out, "")
        self.assertTrue(err.startswith(f"ledgerlite: cannot read {path}: "))


class MalformedRowTest(CliTestCase):
    def assert_row_error(self, text, line, fragment):
        path = self.write("t.csv", text)
        code, out, err = self.run_cli(["report", path])
        self.assertEqual(code, 2)
        self.assertEqual(out, "")  # Review Focus 17
        self.assertTrue(err.startswith(f"ledgerlite: {path}:{line}: "), err)
        self.assertIn(fragment, err)

    def test_wrong_column_count(self):
        self.assert_row_error("date,amount,description\n2026-03-04,-7.50\n", 2, "expected 3 columns")

    def test_unparseable_date(self):
        self.assert_row_error("date,amount,description\n04/03/2026,-7.50,Coffee\n", 2, "date")

    def test_non_numeric_amount(self):
        self.assert_row_error(
            "date,amount,description\n2026-03-04,twelve,Coffee\n", 2, "not a decimal number"
        )

    def test_three_fractional_digits(self):
        self.assert_row_error(
            "date,amount,description\n2026-03-04,1.005,Coffee\n",
            2,
            "more than two fractional digits",
        )

    def test_line_number_points_at_the_offending_row(self):
        text = (
            "date,amount,description\n"
            "2026-03-04,-7.50,Coffee\n"
            "2026-03-05,-1.00,Tea\n"
            "2026-03-06,oops,Cake\n"
        )
        self.assert_row_error(text, 4, "not a decimal number")


class UsageErrorTest(CliTestCase):
    def test_bad_opening_is_a_usage_error(self):
        # Review Focus 15.
        transactions = self.write("t.csv", TRANSACTIONS)
        err = io.StringIO()
        with contextlib.redirect_stderr(err), self.assertRaises(SystemExit) as caught:
            main(["report", transactions, "--opening", "abc"])
        self.assertEqual(caught.exception.code, 2)
        self.assertIn("--opening", err.getvalue())

    def test_over_precise_opening_is_a_usage_error(self):
        transactions = self.write("t.csv", TRANSACTIONS)
        with contextlib.redirect_stderr(io.StringIO()), self.assertRaises(SystemExit) as caught:
            main(["report", transactions, "--opening", "1.005"])
        self.assertEqual(caught.exception.code, 2)

    def test_missing_subcommand_is_a_usage_error(self):
        with contextlib.redirect_stderr(io.StringIO()), self.assertRaises(SystemExit) as caught:
            main([])
        self.assertEqual(caught.exception.code, 2)

    def test_usage_message_names_the_program(self):
        err = io.StringIO()
        with contextlib.redirect_stderr(err), self.assertRaises(SystemExit):
            main([])
        self.assertIn("ledgerlite", err.getvalue())


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `python3 -m unittest test_cli -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'ledgerlite.cli'`.

- [ ] **Step 3: Write the minimal implementation**

Create `ledgerlite/cli.py`:

```python
"""argparse entry point: main(argv) -> exit code."""

import argparse
import sys
from decimal import Decimal

from .parse import ParseError, parse_amount, parse_transactions
from .report import format_report
from .rules import parse_rules

PROG = "ledgerlite"


def _opening_amount(text: str) -> Decimal:
    try:
        return parse_amount(text)
    except ValueError as exc:
        raise argparse.ArgumentTypeError(str(exc)) from None


def _build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog=PROG, description="Summarize bank transactions by category."
    )
    subparsers = parser.add_subparsers(dest="command", required=True)
    report = subparsers.add_parser("report", help="print a per-category summary")
    report.add_argument("transactions", metavar="TRANSACTIONS", help="transactions CSV")
    report.add_argument("--rules", metavar="RULES", help="rules file")
    report.add_argument(
        "--opening",
        metavar="AMOUNT",
        type=_opening_amount,
        default=Decimal(0),
        help="opening balance (default: 0)",
    )
    return parser


def _read_text(path: str) -> str:
    with open(path, encoding="utf-8") as handle:
        return handle.read()


def _reason(exc: Exception) -> str:
    if isinstance(exc, OSError) and exc.strerror:
        return exc.strerror
    if isinstance(exc, UnicodeDecodeError):
        return "not valid UTF-8 text"
    return str(exc)


def main(argv: list[str] | None = None) -> int:
    args = _build_parser().parse_args(argv)

    texts = {}
    for key, path in (("transactions", args.transactions), ("rules", args.rules)):
        if path is None:
            continue
        try:
            texts[key] = _read_text(path)
        except (OSError, UnicodeDecodeError) as exc:
            print(f"{PROG}: cannot read {path}: {_reason(exc)}", file=sys.stderr)
            return 1

    rules = parse_rules(texts["rules"]) if "rules" in texts else []

    try:
        transactions = parse_transactions(texts["transactions"])
    except ParseError as exc:
        print(f"{PROG}: {args.transactions}:{exc.line}: {exc.message}", file=sys.stderr)
        return 2

    print(format_report(transactions, rules, args.opening))
    return 0
```

Create `ledgerlite/__main__.py`:

```python
"""Allow `python3 -m ledgerlite ...`."""

import sys

from .cli import main

sys.exit(main())
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `python3 -m unittest test_cli -v`
Expected: PASS, 18 tests.

- [ ] **Step 5: Run the whole suite**

Run: `python3 -m unittest`
Expected: PASS, 100 tests, no failures or errors.

- [ ] **Step 6: Exercise the real command against the spec example**

```bash
printf 'date,amount,description\n2026-03-04,-7.50,Coffee Shop\n2026-03-01,-900.00,March Rent\n2026-03-02,2500.00,Salary\n' > /tmp/ledgerlite-t.csv
printf 'coffee=food\nrent=housing\n' > /tmp/ledgerlite-r.txt
python3 -m ledgerlite report /tmp/ledgerlite-t.csv --rules /tmp/ledgerlite-r.txt --opening 100
echo "exit=$?"
```

Expected, matching the spec's example exactly:

```
food: -7.50
housing: -900.00
uncategorized: 2500.00

closing balance: 1692.50
exit=0
```

Then confirm the two error paths and clean up:

```bash
python3 -m ledgerlite report /tmp/nope.csv; echo "exit=$?"
printf 'date,amount,description\n2026-03-04,1.005,Coffee\n' > /tmp/ledgerlite-bad.csv
python3 -m ledgerlite report /tmp/ledgerlite-bad.csv; echo "exit=$?"
rm -f /tmp/ledgerlite-t.csv /tmp/ledgerlite-r.txt /tmp/ledgerlite-bad.csv
```

Expected: `cannot read /tmp/nope.csv: No such file or directory` with `exit=1`, then `/tmp/ledgerlite-bad.csv:2: '1.005' has more than two fractional digits` with `exit=2`. Both messages carry the `ledgerlite: ` prefix and appear on stderr.

- [ ] **Step 7: Commit**

```bash
git add ledgerlite/cli.py ledgerlite/__main__.py test_cli.py
git commit -m "feat: add ledgerlite report CLI with exit codes"
```

---

## Done when

- `python3 -m unittest` from the repo root passes with no failures or errors.
- `python3 -m ledgerlite report <csv> --rules <rules> --opening 100` reproduces the spec's example byte for byte.
- Exit codes are 0 / 1 / 2 as the spec specifies, with every error message on stderr and stdout empty on failure.
- No `float` and no third-party import appears anywhere in `ledgerlite/` or the tests.
