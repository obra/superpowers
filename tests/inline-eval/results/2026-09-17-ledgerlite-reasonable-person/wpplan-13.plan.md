# ledgerlite Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `ledgerlite`, a standard-library-only Python CLI that reads a transactions CSV, categorizes each row from a rules file, and prints per-category totals plus the closing balance.

**Architecture:** Six small modules with one responsibility each, layered so nothing points back up: `model` (data), `parse` (CSV text → transactions, `ParseError`), `rules` (rules text → rule list, categorization), `balance` (date ordering, closing balance), `report` (totals, formatting), `cli` (argparse, file I/O, exit codes, stderr messages). All pure functions take and return values — text in, text out — so every layer is testable without touching the filesystem. Only `cli.py` opens files, prints, or returns exit codes.

**Tech Stack:** Python 3.11+, standard library only (`csv`, `argparse`, `decimal`, `datetime`, `dataclasses`, `re`, `unittest`). No third-party packages, no build tooling.

**Spec:** `design.md` (this repo, alongside this plan)

## Global Constraints

- Python 3.11+. Standard library only — no third-party imports in package or test code.
- Money is always `decimal.Decimal`. Never `float`, never `round()`, no arithmetic on strings-as-numbers. A `float` anywhere in the money path is a defect.
- Package layout is exactly as the spec's "Package layout" section gives it: `ledgerlite/` containing `__init__.py`, `model.py`, `parse.py`, `rules.py`, `balance.py`, `report.py`, `cli.py`. Do not add modules the spec does not list.
- Tests live at the repo root as `test_<module>.py` and run with `python3 -m unittest`.
- CLI surface, verbatim: `ledgerlite report TRANSACTIONS [--rules RULES] [--opening AMOUNT]`
- Exit codes: `0` success, `1` a named file cannot be read, `2` a malformed input row.
- Unreadable-file message, verbatim shape: `ledgerlite: cannot read <path>: <reason>` on stderr.
- Malformed-row message, verbatim shape: `ledgerlite: <path>:<line>: <what is wrong>` on stderr.
- On exit 2 the whole file is rejected and **nothing** is written to stdout.
- Amounts print with exactly two fractional digits, a leading `-` only for negatives, and no thousands separators: `-12.50`, `0.00`, `1200.00`.
- `--opening` defaults to `0`. `--rules` is optional; without it every transaction is uncategorized.
- Work directly on `main`. Commit at the end of every task.

## Review Focus

The spec fixes the happy path and the two error paths. These are inputs it does
not name but that the program will meet; each line states the behavior a
reasonable person would expect, and each has its test assigned to the task that
owns the code. Ordered by how likely each is to bite someone.

1. **Trailing newline / blank lines in the CSV.** Nearly every real file ends with a newline; a blank line must not be reported as a malformed 0-column row. Skip lines that are entirely empty. → Task 2.
2. **Trailing newline / blank lines in the rules file.** Same reasoning: blank lines are skipped, not errors. → Task 3.
3. **Amounts that are numeric to Python but not decimal numbers.** `Decimal("NaN")`, `Decimal("Infinity")`, and `Decimal("1e2")` all parse without complaint and would silently corrupt totals. Validate the text with a regex before constructing the `Decimal`, so these are malformed. → Task 2.
4. **A missing or wrong header row.** The spec says the CSV *has* a header row. Blindly skipping the first line would silently drop a real transaction, so the header is validated (case-insensitive, whitespace-tolerant) and a file lacking it is malformed. → Task 2.
5. **An unreadable `--rules` file.** The spec's exit-1 rule names only TRANSACTIONS, but a missing rules file is the same user mistake and deserves the same message and code. → Task 6.
6. **A malformed rules line** (no `=`, empty substring, empty category). Silently ignoring it would produce a confidently wrong report; treat it as a malformed row: the exit-2 message shape already carries a path, so it fits the rules file too. → Task 3.
7. **Negative zero.** `Decimal("-0.00")` formats as `-0.00` under `:.2f`, and the spec allows a leading `-` only for negatives. Zero prints `0.00`. → Task 5.
8. **A rule whose category is literally `uncategorized`.** Two buckets with one name would print the name twice; merge into the single `uncategorized` bucket, still listed last. → Task 5.
9. **Whitespace around `date` and `amount` fields.** `2026-03-04, -7.50` is a normal hand-edited CSV; strip those two fields before validating. `description` is free text and is preserved byte-for-byte. → Task 2.
10. **A non-UTF-8 or non-file path.** A directory or a binary file must produce the exit-1 message, not a traceback (`UnicodeDecodeError` is not an `OSError`, so it needs its own catch). → Task 6.
11. **An invalid `--opening` value.** Reuse the amount validator so `--opening abc` fails as an argparse usage error (exit 2) instead of crashing. → Task 6.
12. **A report with no categories at all** (header-only CSV). Emitting the spec's blank separator line would open the report with an empty line; print only the `closing balance` line. → Task 5.

---

## Task 1: Package skeleton and the Transaction model

**Files:**
- Create: `ledgerlite/__init__.py`
- Create: `ledgerlite/model.py`
- Create: `.gitignore`
- Test: `test_model.py`

**Interfaces:**
- Consumes: nothing.
- Produces: `ledgerlite.model.Transaction`, a frozen dataclass with fields
  `date: datetime.date`, `amount: decimal.Decimal`, `description: str`, in that
  positional order. Every later task builds and reads these.

Note on style: the field is annotated `datetime.date` (module-qualified) rather
than importing the `date` name, because a field named `date` annotated with a
type named `date` is a shadowing trap. Keep `import datetime`.

- [ ] **Step 1: Write the failing test**

Create `test_model.py`:

```python
import dataclasses
import datetime
import unittest
from decimal import Decimal

from ledgerlite.model import Transaction


class TransactionTests(unittest.TestCase):
    def test_holds_date_amount_and_description(self):
        txn = Transaction(
            date=datetime.date(2026, 3, 4),
            amount=Decimal("-7.50"),
            description="Coffee Shop",
        )
        self.assertEqual(txn.date, datetime.date(2026, 3, 4))
        self.assertEqual(txn.amount, Decimal("-7.50"))
        self.assertEqual(txn.description, "Coffee Shop")

    def test_accepts_positional_arguments_in_spec_order(self):
        txn = Transaction(datetime.date(2026, 3, 4), Decimal("2500.00"), "Salary")
        self.assertEqual(txn.description, "Salary")

    def test_is_frozen(self):
        txn = Transaction(datetime.date(2026, 3, 4), Decimal("1.00"), "x")
        with self.assertRaises(dataclasses.FrozenInstanceError):
            txn.amount = Decimal("2.00")


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `python3 -m unittest test_model -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'ledgerlite'`.

- [ ] **Step 3: Write the minimal implementation**

Create `ledgerlite/__init__.py`:

```python
"""ledgerlite - categorize bank transactions and summarize them."""
```

Create `ledgerlite/model.py`:

```python
"""The one data type the rest of the package passes around."""

import datetime
from dataclasses import dataclass
from decimal import Decimal


@dataclass(frozen=True)
class Transaction:
    """One row of the transactions CSV, already validated.

    `amount` is negative for money out, positive for money in, and is always a
    Decimal - never a float.
    """

    date: datetime.date
    amount: Decimal
    description: str
```

Create `.gitignore`:

```gitignore
__pycache__/
*.pyc
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `python3 -m unittest test_model -v`
Expected: PASS, 3 tests.

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
- Consumes: `ledgerlite.model.Transaction` (Task 1).
- Produces:
  - `ParseError(Exception)` with attributes `.line: int` and `.message: str`; `str(e)` is `"<line>: <message>"`. Task 3 raises this same class; Task 6 formats it.
  - `parse_amount(text: str) -> Decimal` — raises `ValueError` whose message is the `<what is wrong>` text. Task 6 reuses it for `--opening`.
  - `parse_date(text: str) -> datetime.date` — raises `ValueError` likewise.
  - `parse_transactions(text: str) -> list[Transaction]` — takes CSV **text**, not a path; raises `ParseError` on the first bad row. Input order is preserved.

Design notes for the implementer:

- Takes text, not a path, so tests never touch the filesystem. Task 6 does the reading.
- Line numbers come from `csv.reader.line_num` (physical lines consumed), so a quoted field containing a newline still reports a sane line. The header is line 1, so the first data row is line 2.
- Amount validity is decided by a regex *before* `Decimal(...)`, because `Decimal` happily accepts `NaN`, `Infinity`, and `1e2`. Accept an optional sign, then either digits, or optional digits with a dot and one-or-two fractional digits: `5`, `+5`, `-5`, `1.5`, `1.50`, `.50`. Reject `1.005`, `5.`, `1e2`, `1,000.00`, `NaN`, `Infinity`, `abc`, and the empty string.
- An amount with three or more fractional digits gets its own message, since the spec calls that case out by name.

- [ ] **Step 1: Write the failing tests**

Create `test_parse.py`:

```python
import datetime
import unittest
from decimal import Decimal

from ledgerlite.parse import ParseError, parse_amount, parse_date, parse_transactions

HEADER = "date,amount,description\n"


class ParseAmountTests(unittest.TestCase):
    def test_accepts_one_or_two_fractional_digits(self):
        self.assertEqual(parse_amount("1.5"), Decimal("1.5"))
        self.assertEqual(parse_amount("1.50"), Decimal("1.50"))

    def test_accepts_integers_and_signs(self):
        self.assertEqual(parse_amount("5"), Decimal("5"))
        self.assertEqual(parse_amount("+5"), Decimal("5"))
        self.assertEqual(parse_amount("-900.00"), Decimal("-900.00"))
        self.assertEqual(parse_amount(".50"), Decimal("0.50"))

    def test_returns_decimal_not_float(self):
        self.assertIsInstance(parse_amount("0.10"), Decimal)

    def test_rejects_more_than_two_fractional_digits(self):
        with self.assertRaises(ValueError) as caught:
            parse_amount("1.005")
        self.assertIn("more than two fractional digits", str(caught.exception))

    def test_rejects_values_decimal_would_otherwise_accept(self):
        for bad in ("NaN", "Infinity", "-Infinity", "1e2", "1E2"):
            with self.subTest(bad=bad), self.assertRaises(ValueError):
                parse_amount(bad)

    def test_rejects_junk(self):
        for bad in ("", "   ", "abc", "1,000.00", "5.", "$5.00", "1.2.3", "--5"):
            with self.subTest(bad=bad), self.assertRaises(ValueError):
                parse_amount(bad)

    def test_tolerates_surrounding_whitespace(self):
        self.assertEqual(parse_amount("  -7.50 "), Decimal("-7.50"))


class ParseDateTests(unittest.TestCase):
    def test_parses_iso_date(self):
        self.assertEqual(parse_date("2026-03-04"), datetime.date(2026, 3, 4))

    def test_tolerates_surrounding_whitespace(self):
        self.assertEqual(parse_date(" 2026-03-04 "), datetime.date(2026, 3, 4))

    def test_rejects_impossible_and_misshapen_dates(self):
        for bad in ("2026-13-01", "2026-02-30", "2026-3-4", "20260304",
                    "04/03/2026", "", "today"):
            with self.subTest(bad=bad), self.assertRaises(ValueError):
                parse_date(bad)


class ParseTransactionsTests(unittest.TestCase):
    def test_parses_rows_preserving_input_order(self):
        text = HEADER + "2026-03-09,-900.00,Rent\n2026-03-04,-7.50,Coffee Shop\n"
        txns = parse_transactions(text)
        self.assertEqual(len(txns), 2)
        self.assertEqual(txns[0].description, "Rent")
        self.assertEqual(txns[0].date, datetime.date(2026, 3, 9))
        self.assertEqual(txns[0].amount, Decimal("-900.00"))
        self.assertEqual(txns[1].description, "Coffee Shop")

    def test_allows_two_rows_on_the_same_date(self):
        text = HEADER + "2026-03-04,-7.50,Coffee\n2026-03-04,2500.00,Salary\n"
        self.assertEqual(len(parse_transactions(text)), 2)

    def test_header_only_file_has_no_transactions(self):
        self.assertEqual(parse_transactions(HEADER), [])

    def test_header_matching_ignores_case_and_whitespace(self):
        text = " Date , Amount , DESCRIPTION \n2026-03-04,1.00,x\n"
        self.assertEqual(len(parse_transactions(text)), 1)

    def test_missing_header_is_malformed_at_line_1(self):
        with self.assertRaises(ParseError) as caught:
            parse_transactions("2026-03-04,-7.50,Coffee\n")
        self.assertEqual(caught.exception.line, 1)

    def test_empty_file_is_malformed_at_line_1(self):
        with self.assertRaises(ParseError) as caught:
            parse_transactions("")
        self.assertEqual(caught.exception.line, 1)

    def test_skips_blank_lines_including_a_trailing_newline(self):
        text = HEADER + "2026-03-04,-7.50,Coffee\n\n2026-03-05,1.00,Tea\n\n"
        self.assertEqual(len(parse_transactions(text)), 2)

    def test_wrong_column_count_reports_line_and_counts(self):
        text = HEADER + "2026-03-04,-7.50,Coffee\n2026-03-05,1.00\n"
        with self.assertRaises(ParseError) as caught:
            parse_transactions(text)
        self.assertEqual(caught.exception.line, 3)
        self.assertIn("3 columns", caught.exception.message)
        self.assertIn("found 2", caught.exception.message)

    def test_extra_column_is_malformed(self):
        text = HEADER + "2026-03-04,-7.50,Coffee,extra\n"
        with self.assertRaises(ParseError):
            parse_transactions(text)

    def test_bad_date_reports_its_line(self):
        text = HEADER + "2026-03-04,-7.50,Coffee\n2026-13-45,1.00,Tea\n"
        with self.assertRaises(ParseError) as caught:
            parse_transactions(text)
        self.assertEqual(caught.exception.line, 3)
        self.assertIn("2026-13-45", caught.exception.message)

    def test_bad_amount_reports_its_line(self):
        text = HEADER + "2026-03-04,not-a-number,Coffee\n"
        with self.assertRaises(ParseError) as caught:
            parse_transactions(text)
        self.assertEqual(caught.exception.line, 2)
        self.assertIn("not-a-number", caught.exception.message)

    def test_three_fractional_digits_is_malformed(self):
        with self.assertRaises(ParseError) as caught:
            parse_transactions(HEADER + "2026-03-04,1.005,Coffee\n")
        self.assertIn("more than two fractional digits", caught.exception.message)

    def test_description_keeps_its_whitespace_and_commas(self):
        text = HEADER + '2026-03-04,-7.50,"  Coffee, large  "\n'
        self.assertEqual(parse_transactions(text)[0].description, "  Coffee, large  ")

    def test_str_of_error_includes_line_and_message(self):
        error = ParseError(7, "invalid amount 'x'")
        self.assertEqual(str(error), "7: invalid amount 'x'")


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `python3 -m unittest test_parse -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'ledgerlite.parse'`.

- [ ] **Step 3: Write the minimal implementation**

Create `ledgerlite/parse.py`:

```python
"""Transactions CSV text -> validated Transaction objects."""

import csv
import datetime
import io
import re

from decimal import Decimal

from .model import Transaction

HEADER = ["date", "amount", "description"]

# An optional sign, then digits, or (optional digits) "." and one or two
# fractional digits. Applied before Decimal() because Decimal accepts "NaN",
# "Infinity", and "1e2", none of which are decimal numbers for our purposes.
_AMOUNT_RE = re.compile(r"[+-]?(\d+|\d*\.\d{1,2})\Z")
_TOO_PRECISE_RE = re.compile(r"[+-]?\d*\.\d{3,}\Z")
_DATE_RE = re.compile(r"\d{4}-\d{2}-\d{2}\Z")


class ParseError(Exception):
    """A malformed input row. `line` is 1-based; `message` says what is wrong."""

    def __init__(self, line: int, message: str) -> None:
        super().__init__(f"{line}: {message}")
        self.line = line
        self.message = message


def parse_amount(text: str) -> Decimal:
    """Parse a decimal amount with at most two fractional digits."""
    cleaned = text.strip()
    if _TOO_PRECISE_RE.match(cleaned):
        raise ValueError(f"amount {cleaned!r} has more than two fractional digits")
    if not _AMOUNT_RE.match(cleaned):
        raise ValueError(f"invalid amount {cleaned!r}")
    return Decimal(cleaned)


def parse_date(text: str) -> datetime.date:
    """Parse an ISO 8601 calendar date (`2026-03-04`)."""
    cleaned = text.strip()
    if not _DATE_RE.match(cleaned):
        raise ValueError(f"invalid date {cleaned!r}")
    try:
        return datetime.date.fromisoformat(cleaned)
    except ValueError:
        raise ValueError(f"invalid date {cleaned!r}") from None


def parse_transactions(text: str) -> list[Transaction]:
    """Parse CSV text into Transactions, keeping input order.

    Raises ParseError on the first malformed row; the caller rejects the whole
    file.
    """
    reader = csv.reader(io.StringIO(text))
    transactions: list[Transaction] = []
    header_seen = False
    for row in reader:
        line = reader.line_num
        if _is_blank(row):
            continue
        if not header_seen:
            if [field.strip().lower() for field in row] != HEADER:
                raise ParseError(line, "expected header row 'date,amount,description'")
            header_seen = True
            continue
        if len(row) != 3:
            raise ParseError(line, f"expected 3 columns, found {len(row)}")
        raw_date, raw_amount, description = row
        try:
            when = parse_date(raw_date)
            amount = parse_amount(raw_amount)
        except ValueError as error:
            raise ParseError(line, str(error)) from None
        transactions.append(Transaction(when, amount, description))
    if not header_seen:
        raise ParseError(1, "missing header row 'date,amount,description'")
    return transactions


def _is_blank(row: list[str]) -> bool:
    """True for a line with no content - a trailing newline, say."""
    return not row or (len(row) == 1 and not row[0].strip())
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `python3 -m unittest test_parse -v`
Expected: PASS. Then `python3 -m unittest -v` — Task 1's tests still pass.

- [ ] **Step 5: Commit**

```bash
git add ledgerlite/parse.py test_parse.py
git commit -m "feat: parse transactions CSV with strict amount and date validation"
```

---

## Task 3: Rules parsing and categorization

**Files:**
- Create: `ledgerlite/rules.py`
- Test: `test_rules.py`

**Interfaces:**
- Consumes: `ParseError` from `ledgerlite.parse` (Task 2). Importing it keeps one
  exception type for "a line of an input file is malformed", which is what
  Task 6's exit-2 handler wants. `parse.py` must not import `rules.py`.
- Produces:
  - `Rule = tuple[str, str]` — `(lowercased substring, category)`.
  - `parse_rules(text: str) -> list[Rule]` — file order preserved; raises `ParseError`.
  - `categorize(description: str, rules: list[Rule]) -> str | None` — first match wins, `None` if nothing matches.

Design notes: substrings are lowercased once at parse time and the description is
lowercased at match time, which is what "case-insensitive on the description"
buys. Substring and category are stripped of surrounding whitespace, so
`coffee = food` works. Split on the *first* `=`, so `a=b=c` means substring `a`,
category `b=c`.

- [ ] **Step 1: Write the failing tests**

Create `test_rules.py`:

```python
import unittest

from ledgerlite.parse import ParseError
from ledgerlite.rules import categorize, parse_rules


class ParseRulesTests(unittest.TestCase):
    def test_parses_one_rule_per_line_in_file_order(self):
        self.assertEqual(
            parse_rules("coffee=food\nrent=housing\n"),
            [("coffee", "food"), ("rent", "housing")],
        )

    def test_empty_text_is_no_rules(self):
        self.assertEqual(parse_rules(""), [])

    def test_skips_blank_lines_including_a_trailing_newline(self):
        self.assertEqual(parse_rules("\ncoffee=food\n\n   \n"), [("coffee", "food")])

    def test_lowercases_the_substring_and_keeps_category_case(self):
        self.assertEqual(parse_rules("Coffee=Food\n"), [("coffee", "Food")])

    def test_strips_whitespace_around_substring_and_category(self):
        self.assertEqual(parse_rules("  coffee  =  food  \n"), [("coffee", "food")])

    def test_splits_on_the_first_equals_only(self):
        self.assertEqual(parse_rules("a=b=c\n"), [("a", "b=c")])

    def test_line_without_equals_is_malformed_with_its_line_number(self):
        with self.assertRaises(ParseError) as caught:
            parse_rules("coffee=food\njust some text\n")
        self.assertEqual(caught.exception.line, 2)
        self.assertIn("just some text", caught.exception.message)

    def test_empty_substring_is_malformed(self):
        with self.assertRaises(ParseError) as caught:
            parse_rules("=food\n")
        self.assertEqual(caught.exception.line, 1)

    def test_empty_category_is_malformed(self):
        with self.assertRaises(ParseError):
            parse_rules("coffee=\n")


class CategorizeTests(unittest.TestCase):
    def setUp(self):
        self.rules = parse_rules("coffee=food\nrent=housing\n")

    def test_matches_a_substring_of_the_description(self):
        self.assertEqual(categorize("Blue Bottle Coffee Co", self.rules), "food")

    def test_matching_is_case_insensitive(self):
        self.assertEqual(categorize("COFFEE", self.rules), "food")
        self.assertEqual(categorize("coffee", self.rules), "food")

    def test_first_matching_rule_wins(self):
        rules = parse_rules("coffee=food\ncoffee=drink\n")
        self.assertEqual(categorize("Coffee", rules), "food")

    def test_first_in_file_order_wins_even_if_a_later_rule_also_matches(self):
        rules = parse_rules("shop=retail\ncoffee=food\n")
        self.assertEqual(categorize("Coffee Shop", rules), "retail")

    def test_no_match_is_none(self):
        self.assertIsNone(categorize("Salary", self.rules))

    def test_no_rules_means_no_match(self):
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
"""Rules text -> (substring, category) pairs, and matching against them."""

from .parse import ParseError

Rule = tuple[str, str]


def parse_rules(text: str) -> list[Rule]:
    """Parse `<substring>=<category>` lines, keeping file order.

    Substrings are lowercased here so matching can lowercase only the
    description. Blank lines are skipped; anything else without a `=`, or with
    an empty substring or category, is a malformed row.
    """
    rules: list[Rule] = []
    for line_number, line in enumerate(text.splitlines(), start=1):
        stripped = line.strip()
        if not stripped:
            continue
        substring, separator, category = stripped.partition("=")
        substring = substring.strip()
        category = category.strip()
        if not separator or not substring or not category:
            raise ParseError(
                line_number,
                f"expected '<substring>=<category>', found {stripped!r}",
            )
        rules.append((substring.lower(), category))
    return rules


def categorize(description: str, rules: list[Rule]) -> str | None:
    """Return the first matching rule's category, or None if none match."""
    lowered = description.lower()
    for substring, category in rules:
        if substring in lowered:
            return category
    return None
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `python3 -m unittest test_rules -v`
Expected: PASS. Then `python3 -m unittest -v` — everything green.

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
  - `order_by_date(transactions: list[Transaction]) -> list[Transaction]` — sorted by date, ties keeping input order; returns a new list.
  - `closing_balance(transactions: list[Transaction], opening: Decimal) -> Decimal` — the running balance after the last date-ordered transaction, or `opening` when there are none.

Design note: `sorted` is stable, which is exactly the spec's "ties keeping input
order" — do not add a tiebreaker key. `closing_balance` walks the ordered list
accumulating the running balance, which *is* the running balance the spec
describes; no separate exported list of intermediate balances, because nothing
consumes one (YAGNI).

- [ ] **Step 1: Write the failing tests**

Create `test_balance.py`:

```python
import datetime
import unittest
from decimal import Decimal

from ledgerlite.balance import closing_balance, order_by_date
from ledgerlite.model import Transaction


def txn(day, amount, description="x"):
    return Transaction(datetime.date(2026, 3, day), Decimal(amount), description)


class OrderByDateTests(unittest.TestCase):
    def test_sorts_by_date(self):
        rows = [txn(9, "-900.00", "Rent"), txn(4, "-7.50", "Coffee")]
        self.assertEqual(
            [t.description for t in order_by_date(rows)], ["Coffee", "Rent"]
        )

    def test_ties_keep_input_order(self):
        rows = [txn(4, "1.00", "second-in-file"), txn(4, "2.00", "first-was-above")]
        self.assertEqual(
            [t.description for t in order_by_date(rows)],
            ["second-in-file", "first-was-above"],
        )

    def test_does_not_mutate_the_input(self):
        rows = [txn(9, "1.00", "Rent"), txn(4, "2.00", "Coffee")]
        order_by_date(rows)
        self.assertEqual([t.description for t in rows], ["Rent", "Coffee"])

    def test_empty_input(self):
        self.assertEqual(order_by_date([]), [])


class ClosingBalanceTests(unittest.TestCase):
    def test_no_transactions_is_the_opening_amount(self):
        self.assertEqual(closing_balance([], Decimal("100")), Decimal("100"))

    def test_adds_every_amount_to_the_opening_amount(self):
        rows = [txn(4, "-7.50"), txn(9, "-900.00"), txn(1, "2500.00")]
        self.assertEqual(closing_balance(rows, Decimal("100")), Decimal("1692.50"))

    def test_returns_a_decimal_not_a_float(self):
        self.assertIsInstance(closing_balance([txn(4, "0.10")], Decimal("0")), Decimal)

    def test_is_exact_where_float_would_not_be(self):
        rows = [txn(4, "0.10") for _ in range(3)]
        self.assertEqual(closing_balance(rows, Decimal("0")), Decimal("0.30"))

    def test_input_order_does_not_change_the_result(self):
        rows = [txn(9, "-900.00"), txn(4, "-7.50")]
        self.assertEqual(
            closing_balance(rows, Decimal("0")),
            closing_balance(list(reversed(rows)), Decimal("0")),
        )


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `python3 -m unittest test_balance -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'ledgerlite.balance'`.

- [ ] **Step 3: Write the minimal implementation**

Create `ledgerlite/balance.py`:

```python
"""Date ordering and the running balance it defines."""

from decimal import Decimal

from .model import Transaction


def order_by_date(transactions: list[Transaction]) -> list[Transaction]:
    """Return the transactions ordered by date; `sorted` is stable, so rows
    sharing a date keep their input order."""
    return sorted(transactions, key=lambda transaction: transaction.date)


def closing_balance(transactions: list[Transaction], opening: Decimal) -> Decimal:
    """The running balance after the last transaction in date order.

    Returns `opening` when there are no transactions.
    """
    balance = opening
    for transaction in order_by_date(transactions):
        balance += transaction.amount
    return balance
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `python3 -m unittest test_balance -v`
Expected: PASS. Then `python3 -m unittest -v` — everything green.

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
- Consumes: `Transaction` (Task 1), `Rule` and `categorize` (Task 3), `closing_balance` (Task 4).
- Produces:
  - `UNCATEGORIZED = "uncategorized"`
  - `format_amount(amount: Decimal) -> str` — two fractional digits, `-` only for negatives, no thousands separators.
  - `category_totals(transactions, rules) -> list[tuple[str, Decimal]]` — named categories alphabetically, then `uncategorized` last if present.
  - `format_report(transactions, rules, opening) -> str` — the whole report, ending in a single trailing newline. Task 6 writes it to stdout unchanged.

Design notes:

- `format_amount` quantizes to two places and then maps a zero result to
  `Decimal("0.00")`, because `f"{Decimal('-0.00'):.2f}"` is `-0.00` and the spec
  allows a leading `-` only for negatives.
- A transaction whose description matches no rule is counted under
  `UNCATEGORIZED`. A rule whose category is literally `uncategorized` lands in
  the same bucket, so the name is printed once and stays last.
- With no categories at all there is nothing to separate, so the blank line is
  omitted and the report is just the `closing balance` line.

- [ ] **Step 1: Write the failing tests**

Create `test_report.py`:

```python
import datetime
import unittest
from decimal import Decimal

from ledgerlite.model import Transaction
from ledgerlite.report import category_totals, format_amount, format_report
from ledgerlite.rules import parse_rules


def txn(day, amount, description):
    return Transaction(datetime.date(2026, 3, day), Decimal(amount), description)


EXAMPLE = [
    txn(4, "-7.50", "Blue Bottle Coffee"),
    txn(1, "2500.00", "ACME Payroll"),
    txn(9, "-900.00", "March Rent"),
]
EXAMPLE_RULES = parse_rules("coffee=food\nrent=housing\n")


class FormatAmountTests(unittest.TestCase):
    def test_two_fractional_digits(self):
        self.assertEqual(format_amount(Decimal("-12.50")), "-12.50")
        self.assertEqual(format_amount(Decimal("1200.00")), "1200.00")

    def test_pads_to_two_digits(self):
        self.assertEqual(format_amount(Decimal("1.5")), "1.50")
        self.assertEqual(format_amount(Decimal("3")), "3.00")

    def test_zero_has_no_sign(self):
        self.assertEqual(format_amount(Decimal("0")), "0.00")
        self.assertEqual(format_amount(Decimal("0.00")), "0.00")
        self.assertEqual(format_amount(Decimal("-0.00")), "0.00")

    def test_no_thousands_separators(self):
        self.assertEqual(format_amount(Decimal("-1234567.89")), "-1234567.89")


class CategoryTotalsTests(unittest.TestCase):
    def test_sums_each_category_and_lists_names_alphabetically(self):
        self.assertEqual(
            category_totals(EXAMPLE, EXAMPLE_RULES),
            [
                ("food", Decimal("-7.50")),
                ("housing", Decimal("-900.00")),
                ("uncategorized", Decimal("2500.00")),
            ],
        )

    def test_uncategorized_is_last_despite_alphabetical_order(self):
        rules = parse_rules("rent=zzz-housing\n")
        rows = [txn(1, "5.00", "Mystery"), txn(2, "-900.00", "Rent")]
        self.assertEqual(
            [name for name, _ in category_totals(rows, rules)],
            ["zzz-housing", "uncategorized"],
        )

    def test_sums_several_transactions_in_one_category(self):
        rules = parse_rules("coffee=food\n")
        rows = [txn(1, "-7.50", "Coffee"), txn(2, "-2.25", "COFFEE again")]
        self.assertEqual(category_totals(rows, rules), [("food", Decimal("-9.75"))])

    def test_no_rules_puts_everything_in_uncategorized(self):
        self.assertEqual(
            category_totals(EXAMPLE, []), [("uncategorized", Decimal("1592.50"))]
        )

    def test_a_rule_named_uncategorized_merges_into_the_one_bucket(self):
        rules = parse_rules("coffee=uncategorized\n")
        rows = [txn(1, "-7.50", "Coffee"), txn(2, "1.00", "Mystery")]
        self.assertEqual(
            category_totals(rows, rules), [("uncategorized", Decimal("-6.50"))]
        )

    def test_no_transactions_is_no_categories(self):
        self.assertEqual(category_totals([], EXAMPLE_RULES), [])


class FormatReportTests(unittest.TestCase):
    def test_matches_the_worked_example_in_the_design(self):
        expected = (
            "food: -7.50\n"
            "housing: -900.00\n"
            "uncategorized: 2500.00\n"
            "\n"
            "closing balance: 1692.50\n"
        )
        self.assertEqual(
            format_report(EXAMPLE, EXAMPLE_RULES, Decimal("100")), expected
        )

    def test_no_transactions_prints_only_the_closing_balance(self):
        self.assertEqual(
            format_report([], EXAMPLE_RULES, Decimal("100")),
            "closing balance: 100.00\n",
        )

    def test_default_opening_of_zero(self):
        self.assertEqual(
            format_report([], [], Decimal("0")), "closing balance: 0.00\n"
        )


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `python3 -m unittest test_report -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'ledgerlite.report'`.

- [ ] **Step 3: Write the minimal implementation**

Create `ledgerlite/report.py`:

```python
"""Per-category totals and the printable report."""

from decimal import Decimal

from .balance import closing_balance
from .model import Transaction
from .rules import Rule, categorize

UNCATEGORIZED = "uncategorized"
_TWO_PLACES = Decimal("0.01")


def format_amount(amount: Decimal) -> str:
    """Format money with exactly two fractional digits and no separators."""
    quantized = amount.quantize(_TWO_PLACES)
    if quantized == 0:
        # Decimal("-0.00") would otherwise print a leading "-".
        quantized = Decimal("0.00")
    return f"{quantized:.2f}"


def category_totals(
    transactions: list[Transaction], rules: list[Rule]
) -> list[tuple[str, Decimal]]:
    """Total each category: named ones alphabetically, uncategorized last."""
    totals: dict[str, Decimal] = {}
    for transaction in transactions:
        category = categorize(transaction.description, rules) or UNCATEGORIZED
        totals[category] = totals.get(category, Decimal("0.00")) + transaction.amount
    ordered = sorted(
        (name, total) for name, total in totals.items() if name != UNCATEGORIZED
    )
    if UNCATEGORIZED in totals:
        ordered.append((UNCATEGORIZED, totals[UNCATEGORIZED]))
    return ordered


def format_report(
    transactions: list[Transaction], rules: list[Rule], opening: Decimal
) -> str:
    """The whole report, ending in one newline."""
    lines = [
        f"{name}: {format_amount(total)}"
        for name, total in category_totals(transactions, rules)
    ]
    if lines:
        lines.append("")
    lines.append(
        f"closing balance: {format_amount(closing_balance(transactions, opening))}"
    )
    return "\n".join(lines) + "\n"
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `python3 -m unittest test_report -v`
Expected: PASS. Then `python3 -m unittest -v` — everything green.

- [ ] **Step 5: Commit**

```bash
git add ledgerlite/report.py test_report.py
git commit -m "feat: add per-category totals and report formatting"
```

---

## Task 6: CLI entry point, exit codes, and error messages

**Files:**
- Create: `ledgerlite/cli.py`
- Test: `test_cli.py`

**Interfaces:**
- Consumes: `ParseError` and `parse_amount` and `parse_transactions` (Task 2), `parse_rules` (Task 3), `format_report` (Task 5).
- Produces: `main(argv: list[str] | None = None) -> int` — the whole program. Returns `0`, `1`, or `2`; writes the report to stdout and errors to stderr; raises nothing for the error cases the spec names.

Design notes for the implementer:

- Read both files *before* parsing either, and parse everything before writing a
  single byte to stdout. That is what "nothing is printed to stdout" on exit 2
  requires.
- `_load` raises `ReadError`, carrying the path and a printable reason, so the
  message can name the file that actually failed — `UnicodeDecodeError` has no
  filename attribute, and it is not an `OSError`, so it needs its own `except`.
- `--opening` is validated by `parse_amount` through an
  `argparse.ArgumentTypeError`, which makes argparse print usage and exit 2.
- `prog="ledgerlite"` so usage text names the tool, not the module path.
- The `__main__` guard lets a developer run `python3 -m ledgerlite.cli report ...`
  without adding a module the spec's layout does not list.

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
    "2026-03-09,-900.00,March Rent\n"
    "2026-03-01,2500.00,ACME Payroll\n"
    "2026-03-04,-7.50,Blue Bottle Coffee\n"
)
RULES = "coffee=food\nrent=housing\n"


class CliTestCase(unittest.TestCase):
    def setUp(self):
        self._tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self._tmp.cleanup)
        self.dir = self._tmp.name

    def write(self, name, text):
        path = os.path.join(self.dir, name)
        with open(path, "w", encoding="utf-8") as handle:
            handle.write(text)
        return path

    def run_cli(self, argv):
        out, err = io.StringIO(), io.StringIO()
        with contextlib.redirect_stdout(out), contextlib.redirect_stderr(err):
            code = main(argv)
        return code, out.getvalue(), err.getvalue()


class ReportSuccessTests(CliTestCase):
    def test_prints_the_worked_example_and_returns_zero(self):
        transactions = self.write("t.csv", TRANSACTIONS)
        rules = self.write("r.txt", RULES)
        code, out, err = self.run_cli(
            ["report", transactions, "--rules", rules, "--opening", "100"]
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

    def test_without_rules_everything_is_uncategorized(self):
        transactions = self.write("t.csv", TRANSACTIONS)
        code, out, _ = self.run_cli(["report", transactions, "--opening", "100"])
        self.assertEqual(code, 0)
        self.assertEqual(
            out, "uncategorized: 1592.50\n\nclosing balance: 1692.50\n"
        )

    def test_opening_defaults_to_zero(self):
        transactions = self.write("t.csv", "date,amount,description\n")
        code, out, _ = self.run_cli(["report", transactions])
        self.assertEqual(code, 0)
        self.assertEqual(out, "closing balance: 0.00\n")

    def test_negative_opening_is_accepted(self):
        transactions = self.write("t.csv", "date,amount,description\n")
        code, out, _ = self.run_cli(["report", transactions, "--opening", "-50.25"])
        self.assertEqual(code, 0)
        self.assertEqual(out, "closing balance: -50.25\n")


class UnreadableFileTests(CliTestCase):
    def test_missing_transactions_file_returns_1_with_message(self):
        missing = os.path.join(self.dir, "nope.csv")
        code, out, err = self.run_cli(["report", missing])
        self.assertEqual(code, 1)
        self.assertEqual(out, "")
        self.assertEqual(
            err, f"ledgerlite: cannot read {missing}: No such file or directory\n"
        )

    def test_missing_rules_file_returns_1_naming_the_rules_path(self):
        transactions = self.write("t.csv", TRANSACTIONS)
        missing = os.path.join(self.dir, "nope.txt")
        code, out, err = self.run_cli(["report", transactions, "--rules", missing])
        self.assertEqual(code, 1)
        self.assertEqual(out, "")
        self.assertIn(f"cannot read {missing}", err)

    def test_directory_instead_of_a_file_returns_1(self):
        code, out, err = self.run_cli(["report", self.dir])
        self.assertEqual(code, 1)
        self.assertEqual(out, "")
        self.assertTrue(err.startswith(f"ledgerlite: cannot read {self.dir}: "))

    def test_non_utf8_file_returns_1(self):
        path = os.path.join(self.dir, "binary.csv")
        with open(path, "wb") as handle:
            handle.write(b"date,amount,description\n2026-03-04,1.00,\xff\xfe\n")
        code, out, err = self.run_cli(["report", path])
        self.assertEqual(code, 1)
        self.assertEqual(out, "")
        self.assertIn(f"cannot read {path}", err)


class MalformedInputTests(CliTestCase):
    def test_malformed_row_returns_2_with_path_and_line_and_no_stdout(self):
        transactions = self.write(
            "t.csv", "date,amount,description\n2026-03-04,-7.50,Coffee\n2026-03-05,x,Tea\n"
        )
        code, out, err = self.run_cli(["report", transactions])
        self.assertEqual(code, 2)
        self.assertEqual(out, "")
        self.assertTrue(err.startswith(f"ledgerlite: {transactions}:3: "))
        self.assertIn("'x'", err)

    def test_three_fractional_digits_returns_2(self):
        transactions = self.write(
            "t.csv", "date,amount,description\n2026-03-04,1.005,Coffee\n"
        )
        code, out, err = self.run_cli(["report", transactions])
        self.assertEqual(code, 2)
        self.assertEqual(out, "")
        self.assertIn("more than two fractional digits", err)

    def test_wrong_column_count_returns_2(self):
        transactions = self.write(
            "t.csv", "date,amount,description\n2026-03-04,-7.50\n"
        )
        code, _, err = self.run_cli(["report", transactions])
        self.assertEqual(code, 2)
        self.assertIn(f"{transactions}:2: ", err)

    def test_malformed_rules_line_returns_2_naming_the_rules_path(self):
        transactions = self.write("t.csv", TRANSACTIONS)
        rules = self.write("r.txt", "coffee=food\nnonsense\n")
        code, out, err = self.run_cli(["report", transactions, "--rules", rules])
        self.assertEqual(code, 2)
        self.assertEqual(out, "")
        self.assertTrue(err.startswith(f"ledgerlite: {rules}:2: "))


class UsageErrorTests(CliTestCase):
    def test_invalid_opening_is_a_usage_error(self):
        transactions = self.write("t.csv", TRANSACTIONS)
        with contextlib.redirect_stderr(io.StringIO()):
            with self.assertRaises(SystemExit) as caught:
                main(["report", transactions, "--opening", "abc"])
        self.assertEqual(caught.exception.code, 2)

    def test_missing_transactions_argument_is_a_usage_error(self):
        with contextlib.redirect_stderr(io.StringIO()):
            with self.assertRaises(SystemExit) as caught:
                main(["report"])
        self.assertEqual(caught.exception.code, 2)


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `python3 -m unittest test_cli -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'ledgerlite.cli'`.

- [ ] **Step 3: Write the minimal implementation**

Create `ledgerlite/cli.py`:

```python
"""argparse entry point: file I/O, exit codes, and error messages."""

import argparse
import sys

from decimal import Decimal

from .parse import ParseError, parse_amount, parse_transactions
from .report import format_report
from .rules import parse_rules

PROG = "ledgerlite"


class ReadError(Exception):
    """A named file could not be read; `str(self)` is the printable reason."""

    def __init__(self, path: str, reason: str) -> None:
        super().__init__(f"cannot read {path}: {reason}")
        self.path = path
        self.reason = reason


def _load(path: str) -> str:
    """Read a UTF-8 text file, or raise ReadError naming the file."""
    try:
        with open(path, encoding="utf-8") as handle:
            return handle.read()
    except OSError as error:
        raise ReadError(path, error.strerror or str(error)) from None
    except UnicodeDecodeError:
        raise ReadError(path, "invalid UTF-8") from None


def _opening_amount(text: str) -> Decimal:
    try:
        return parse_amount(text)
    except ValueError as error:
        raise argparse.ArgumentTypeError(str(error)) from None


def _build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog=PROG, description="Categorize bank transactions and summarize them."
    )
    subcommands = parser.add_subparsers(dest="command", required=True)
    report = subcommands.add_parser(
        "report", help="print per-category totals and the closing balance"
    )
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
        transactions_text = _load(args.transactions)
        rules_text = _load(args.rules) if args.rules else ""
    except ReadError as error:
        print(f"{PROG}: {error}", file=sys.stderr)
        return 1

    try:
        rules = parse_rules(rules_text)
    except ParseError as error:
        print(f"{PROG}: {args.rules}:{error.line}: {error.message}", file=sys.stderr)
        return 2

    try:
        transactions = parse_transactions(transactions_text)
    except ParseError as error:
        print(
            f"{PROG}: {args.transactions}:{error.line}: {error.message}",
            file=sys.stderr,
        )
        return 2

    sys.stdout.write(format_report(transactions, rules, args.opening))
    return 0


if __name__ == "__main__":
    sys.exit(main())
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `python3 -m unittest test_cli -v`
Expected: PASS.

- [ ] **Step 5: Run the whole suite and the tool by hand**

Run: `python3 -m unittest -v`
Expected: PASS, every test from Tasks 1-6.

Then exercise the real command line, which the unit tests reach only through
`main(argv)`:

```bash
printf 'date,amount,description\n2026-03-09,-900.00,March Rent\n2026-03-01,2500.00,ACME Payroll\n2026-03-04,-7.50,Blue Bottle Coffee\n' > /tmp/t.csv
printf 'coffee=food\nrent=housing\n' > /tmp/r.txt
python3 -m ledgerlite.cli report /tmp/t.csv --rules /tmp/r.txt --opening 100; echo "exit=$?"
```

Expected, exactly:

```
food: -7.50
housing: -900.00
uncategorized: 2500.00

closing balance: 1692.50
exit=0
```

Then confirm the error paths:

```bash
python3 -m ledgerlite.cli report /tmp/missing.csv; echo "exit=$?"
```

Expected: `ledgerlite: cannot read /tmp/missing.csv: No such file or directory` on stderr, `exit=1`.

```bash
printf 'date,amount,description\n2026-03-04,1.005,Coffee\n' > /tmp/bad.csv
python3 -m ledgerlite.cli report /tmp/bad.csv; echo "exit=$?"
```

Expected: `ledgerlite: /tmp/bad.csv:2: amount '1.005' has more than two fractional digits` on stderr, nothing on stdout, `exit=2`.

- [ ] **Step 6: Commit**

```bash
git add ledgerlite/cli.py test_cli.py
git commit -m "feat: add ledgerlite report CLI with spec exit codes and messages"
```

---

## Done when

- `python3 -m unittest` passes with every test from Tasks 1-6.
- `grep -rn "float(" ledgerlite/` finds nothing.
- `grep -rhn "^import \|^from " ledgerlite/ test_*.py` lists only standard-library modules (`argparse`, `contextlib`, `csv`, `dataclasses`, `datetime`, `decimal`, `io`, `os`, `re`, `sys`, `tempfile`, `unittest`) and relative `ledgerlite` imports.
- The `ledgerlite/` directory contains exactly the seven files the spec lists.
- The hand-run commands in Task 6 Step 5 produce the output shown.
