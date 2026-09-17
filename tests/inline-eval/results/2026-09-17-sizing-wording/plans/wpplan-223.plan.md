# ledgerlite Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `ledgerlite`, a standard-library-only Python command-line tool that reads a transactions CSV, categorizes each row with a rules file, and prints per-category totals plus the closing balance.

**Architecture:** Six small modules in one package, each with one responsibility: `model` (the `Transaction` dataclass), `parse` (CSV text → transactions, plus the shared `ParseError` and amount/date validators), `rules` (rules text → `(substring, category)` pairs and matching), `balance` (date ordering and the running balance), `report` (per-category totals and text formatting), `cli` (argparse, exit codes, stderr messages). Data flows one way — `cli` reads files via `parse`/`rules`, hands the results to `report`, and turns exceptions into exit codes. All money is `decimal.Decimal` end to end; no `float` appears anywhere.

**Tech Stack:** Python 3.11+, standard library only (`csv`, `decimal`, `datetime`, `argparse`, `re`, `dataclasses`), `unittest` for tests.

**Spec:** `design.md` (in this directory — read it before starting; every message string and rule below comes from it)

## Global Constraints

- Python 3.11+. Do not use syntax or stdlib features newer than 3.11 (no PEP 695 `type`/generic syntax, no 3.12+ stdlib additions). The local interpreter is newer than 3.11, so it will not catch this for you.
- Standard library only. No third-party dependencies, no `pyproject.toml`, no `setup.py`, no `requirements.txt`.
- Money is parsed and carried as `decimal.Decimal`, never `float`. `float` must not appear in the package.
- Package layout is fixed by the spec: `ledgerlite/` containing `__init__.py`, `model.py`, `parse.py`, `rules.py`, `balance.py`, `report.py`, `cli.py`. One addition beyond the spec's list: `ledgerlite/__main__.py`, a two-line shim so `python3 -m ledgerlite …` runs the CLI the spec describes.
- Tests live at the repo root as `test_<module>.py` and must pass under `python3 -m unittest`. A shared helper module `testsupport.py` also lives at the root (unittest discovery only collects `test_*.py`, so it is imported, never collected).
- Exit codes: `0` success, `1` a file could not be read, `2` a file was read but its contents are malformed.
- Error message formats, copied verbatim from the spec — these are contracts, assert on them exactly:
  - `ledgerlite: cannot read <path>: <reason>`
  - `ledgerlite: <path>:<line>: <what is wrong>`
- Amounts print with exactly two fractional digits, a leading `-` only for genuinely negative values, and no thousands separators: `-12.50`, `0.00`, `1200.00`.
- Work directly on `main`. This is a local scratch repo with no remote; commit after each task, never push.

## Review Focus

The spec describes what a well-formed ledger looks like; these are the inputs it does not describe but a user will still hand the program. Each line names the behavior a reasonable person expects and the task that pins it with a test.

- **Empty transactions file, and header-only file** → zero transactions, report is just `closing balance: <opening>` with no leading blank line (the blank line separates the category block from the closing line; with no categories there is nothing to separate). Tested in Task 1, Task 4, Task 5.
- **Missing or misspelled header row** → exit 2 with `expected header date,amount,description` at line 1, rather than silently swallowing the first transaction as a header. Tested in Task 1.
- **A blank line in the middle or at the end of the CSV** → a column-count error naming that line, not a crash and not a silently skipped row. Tested in Task 1.
- **Amount forms the spec's "decimal number" excludes** — `1e2`, `1,000.00`, `5.`, `$5`, empty string → `amount is not a number`, distinct from the `more than two fractional digits` message the spec calls out separately. Tested in Task 1.
- **Negative zero** — a category totalling `-0.00` (from an input amount of `-0.00`) prints `0.00`; the spec reserves the leading `-` for negatives. Tested in Task 4.
- **Decimal exactness** — `0.10 + 0.20` is `0.30` exactly, and large values print without separators. Tested in Task 3 and Task 4.
- **Rules file failures** — the spec only specifies error handling for TRANSACTIONS, but `--rules` reads a file too: unreadable → exit 1 `cannot read`, malformed line → exit 2 with the same `<path>:<line>:` format. Tested in Task 2 and Task 5.
- **Rule shapes** — blank lines skipped; whitespace around both sides trimmed so a category never prints with a stray space; only the first `=` splits; an empty substring (`=food`, which would match everything) or empty category (`coffee=`, which would print `: -7.50`) is rejected as malformed. Tested in Task 2.
- **Several rules matching one description** → the first rule in file order wins, matched case-insensitively. Tested in Task 2.
- **Same-date rows** → stable order (input order preserved), and the closing balance is identical no matter what order rows arrive in. Tested in Task 3.
- **A rule whose category is literally `uncategorized`** → merges with the implicit bucket and still prints last. Tested in Task 4.
- **Category names differing only in case** → sorted case-insensitively, so `apple` precedes `Zebra` (codepoint order would put `Zebra` first, which no one would call alphabetical). Tested in Task 4.
- **CRLF line endings and a UTF-8 BOM** (what a spreadsheet export produces) → parsed normally. **Undecodable bytes** → exit 1 `cannot read <path>: not valid UTF-8 text`, since a `UnicodeDecodeError` is a read failure, not a malformed row. Tested in Task 1 and Task 5.
- **Description text is preserved verbatim** (including quoted commas and surrounding spaces) while `date` and `amount` fields tolerate surrounding whitespace. Tested in Task 1.

---

## File Structure

| File | Responsibility |
| --- | --- |
| `ledgerlite/__init__.py` | Package marker, docstring only. No re-exports (nothing needs them). |
| `ledgerlite/model.py` | The frozen `Transaction` dataclass. No logic. |
| `ledgerlite/parse.py` | `ParseError`; `parse_amount`/`parse_date` field validators; `parse_transactions(path)` → `list[Transaction]`. |
| `ledgerlite/rules.py` | `parse_rules(text, path)`, `load_rules(path)`, `categorize(description, rules)`. |
| `ledgerlite/balance.py` | `order_by_date(transactions)`, `closing_balance(opening, transactions)`. |
| `ledgerlite/report.py` | `format_amount`, `category_totals`, `format_report`. |
| `ledgerlite/cli.py` | argparse wiring, exception → exit code translation, `main(argv)`. |
| `ledgerlite/__main__.py` | `python3 -m ledgerlite` shim. |
| `testsupport.py` | `TempFileTestCase`: per-test temp directory plus `write_file`/`write_bytes`/`path_for`. |
| `test_model.py`, `test_parse.py`, `test_rules.py`, `test_balance.py`, `test_report.py`, `test_cli.py` | One test module per package module. |

`parse.py` owns `ParseError` because it is the first module to need it; `rules.py` imports it from there so both malformed-file reports share one message format. Nothing imports `cli`, and `cli` imports everything else — the dependency graph is a DAG with no cycles.

---

## Task 1: Package skeleton, `Transaction`, and CSV parsing

**Files:**
- Create: `ledgerlite/__init__.py`
- Create: `ledgerlite/model.py`
- Create: `ledgerlite/parse.py`
- Create: `.gitignore`
- Create: `testsupport.py`
- Test: `test_model.py`, `test_parse.py`

**Interfaces:**
- Consumes: nothing (first task).
- Produces:
  - `ledgerlite.model.Transaction(date: datetime.date, amount: decimal.Decimal, description: str)` — frozen dataclass, positional construction in that order.
  - `ledgerlite.parse.ParseError(path: str, line: int, message: str)` — exception with `.path`, `.line`, `.message`; `str(error)` is `f"{path}:{line}: {message}"`.
  - `ledgerlite.parse.parse_amount(text: str) -> Decimal` — raises `ValueError` whose message is the full "what is wrong" phrase.
  - `ledgerlite.parse.parse_date(text: str) -> datetime.date` — same `ValueError` contract.
  - `ledgerlite.parse.parse_transactions(path: str) -> list[Transaction]` — rows in file order; raises `ParseError` (malformed), `OSError` (unreadable), `UnicodeDecodeError` (undecodable bytes).
  - `testsupport.TempFileTestCase` — `unittest.TestCase` subclass with `self.directory: Path`, `write_file(text, name="tx.csv") -> str`, `write_bytes(data, name="tx.csv") -> str`, `path_for(name) -> str`.

- [ ] **Step 1: Create the package skeleton and the test helper**

`.gitignore`:

```gitignore
__pycache__/
*.pyc
```

`ledgerlite/__init__.py`:

```python
"""ledgerlite: categorize bank transactions and summarize them."""
```

`testsupport.py`:

```python
"""Shared helpers for the ledgerlite tests (not collected by unittest discovery)."""

import tempfile
import unittest
from pathlib import Path


class TempFileTestCase(unittest.TestCase):
    """Base class giving each test its own temporary directory."""

    def setUp(self):
        directory = tempfile.TemporaryDirectory()
        self.addCleanup(directory.cleanup)
        self.directory = Path(directory.name)

    def path_for(self, name):
        """Return a path inside the temporary directory without creating it."""
        return str(self.directory / name)

    def write_file(self, text, name="tx.csv"):
        path = self.directory / name
        path.write_text(text, encoding="utf-8")
        return str(path)

    def write_bytes(self, data, name="tx.csv"):
        path = self.directory / name
        path.write_bytes(data)
        return str(path)
```

- [ ] **Step 2: Write the failing tests for `Transaction`**

`test_model.py`:

```python
import datetime
import unittest
from dataclasses import FrozenInstanceError
from decimal import Decimal

from ledgerlite.model import Transaction


class TransactionTests(unittest.TestCase):
    def test_fields_are_positional_in_spec_order(self):
        transaction = Transaction(datetime.date(2026, 3, 4), Decimal("-7.50"), "Coffee Bar")
        self.assertEqual(transaction.date, datetime.date(2026, 3, 4))
        self.assertEqual(transaction.amount, Decimal("-7.50"))
        self.assertEqual(transaction.description, "Coffee Bar")

    def test_is_frozen(self):
        transaction = Transaction(datetime.date(2026, 3, 4), Decimal("1.00"), "Tip")
        with self.assertRaises(FrozenInstanceError):
            transaction.amount = Decimal("2.00")

    def test_equality_compares_all_fields(self):
        first = Transaction(datetime.date(2026, 3, 4), Decimal("1.00"), "Tip")
        second = Transaction(datetime.date(2026, 3, 4), Decimal("1.00"), "Tip")
        third = Transaction(datetime.date(2026, 3, 4), Decimal("1.00"), "Other")
        self.assertEqual(first, second)
        self.assertNotEqual(first, third)
```

- [ ] **Step 3: Run the model tests to verify they fail**

Run: `python3 -m unittest test_model -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'ledgerlite.model'`

- [ ] **Step 4: Write `model.py`**

Note the deliberate `import datetime` rather than `from datetime import date`: the field is named `date`, and a bare `date: date` annotation inside the class body is a trap worth avoiding.

```python
"""The one data structure the rest of the package passes around."""

import datetime
from dataclasses import dataclass
from decimal import Decimal


@dataclass(frozen=True)
class Transaction:
    """One row of the transactions CSV, with its fields already parsed."""

    date: datetime.date
    amount: Decimal
    description: str
```

- [ ] **Step 5: Run the model tests to verify they pass**

Run: `python3 -m unittest test_model -v`
Expected: PASS (3 tests)

- [ ] **Step 6: Write the failing tests for `parse.py`**

`test_parse.py`:

```python
import datetime
import unittest
from decimal import Decimal

from ledgerlite.model import Transaction
from ledgerlite.parse import ParseError, parse_amount, parse_date, parse_transactions
from testsupport import TempFileTestCase

HEADER = "date,amount,description\n"


class ParseAmountTests(unittest.TestCase):
    def test_two_fractional_digits(self):
        self.assertEqual(parse_amount("-12.50"), Decimal("-12.50"))

    def test_one_fractional_digit_is_fine(self):
        self.assertEqual(parse_amount("1.5"), Decimal("1.5"))

    def test_integer_is_fine(self):
        self.assertEqual(parse_amount("2500"), Decimal("2500"))

    def test_leading_plus_is_fine(self):
        self.assertEqual(parse_amount("+5.00"), Decimal("5.00"))

    def test_surrounding_whitespace_ignored(self):
        self.assertEqual(parse_amount("  -0.01 "), Decimal("-0.01"))

    def test_three_fractional_digits_rejected(self):
        with self.assertRaises(ValueError) as caught:
            parse_amount("1.005")
        self.assertEqual(
            str(caught.exception),
            "amount has more than two fractional digits: '1.005'",
        )

    def test_non_numbers_rejected(self):
        for text in ["", "abc", "1,000.00", "1e2", "5.", "--1", "$5", "1.2.3"]:
            with self.subTest(text=text):
                with self.assertRaises(ValueError) as caught:
                    parse_amount(text)
                self.assertEqual(
                    str(caught.exception), f"amount is not a number: {text!r}"
                )


class ParseDateTests(unittest.TestCase):
    def test_iso_date(self):
        self.assertEqual(parse_date("2026-03-04"), datetime.date(2026, 3, 4))

    def test_surrounding_whitespace_ignored(self):
        self.assertEqual(parse_date(" 2026-03-04 "), datetime.date(2026, 3, 4))

    def test_wrong_shape_rejected(self):
        for text in ["03/04/2026", "20260304", "2026-3-4", "", "yesterday"]:
            with self.subTest(text=text):
                with self.assertRaises(ValueError) as caught:
                    parse_date(text)
                self.assertEqual(
                    str(caught.exception),
                    f"date is not ISO 8601 (YYYY-MM-DD): {text!r}",
                )

    def test_impossible_calendar_date_rejected(self):
        with self.assertRaises(ValueError) as caught:
            parse_date("2026-02-30")
        self.assertEqual(
            str(caught.exception), "date is not a valid calendar date: '2026-02-30'"
        )


class ParseTransactionsTests(TempFileTestCase):
    def assertParseError(self, path, line, message):
        with self.assertRaises(ParseError) as caught:
            parse_transactions(path)
        error = caught.exception
        self.assertEqual(error.path, path)
        self.assertEqual(error.line, line)
        self.assertEqual(error.message, message)
        self.assertEqual(str(error), f"{path}:{line}: {message}")

    def test_returns_rows_in_file_order(self):
        path = self.write_file(
            HEADER
            + "2026-03-05,-900.00,Rent March\n"
            + "2026-03-04,-7.50,Coffee Bar\n"
        )
        self.assertEqual(
            parse_transactions(path),
            [
                Transaction(datetime.date(2026, 3, 5), Decimal("-900.00"), "Rent March"),
                Transaction(datetime.date(2026, 3, 4), Decimal("-7.50"), "Coffee Bar"),
            ],
        )

    def test_empty_file_has_no_transactions(self):
        self.assertEqual(parse_transactions(self.write_file("")), [])

    def test_header_only_file_has_no_transactions(self):
        self.assertEqual(parse_transactions(self.write_file(HEADER)), [])

    def test_bom_and_crlf_tolerated(self):
        path = self.write_bytes(
            b"\xef\xbb\xbfdate,amount,description\r\n2026-03-04,1.00,Tip\r\n"
        )
        self.assertEqual(
            parse_transactions(path),
            [Transaction(datetime.date(2026, 3, 4), Decimal("1.00"), "Tip")],
        )

    def test_header_case_and_spacing_tolerated(self):
        path = self.write_file("Date, Amount ,DESCRIPTION\n2026-03-04,1.00,Tip\n")
        self.assertEqual(len(parse_transactions(path)), 1)

    def test_description_kept_verbatim(self):
        path = self.write_file(HEADER + '2026-03-04,-1.00,"  Odd,  spacing  "\n')
        self.assertEqual(parse_transactions(path)[0].description, "  Odd,  spacing  ")

    def test_missing_header_is_reported_at_line_one(self):
        path = self.write_file("2026-03-04,-7.50,Coffee Bar\n")
        self.assertParseError(path, 1, "expected header date,amount,description")

    def test_too_few_columns(self):
        path = self.write_file(HEADER + "2026-03-04,-7.50\n")
        self.assertParseError(path, 2, "expected 3 columns, got 2")

    def test_too_many_columns(self):
        path = self.write_file(HEADER + "2026-03-04,-7.50,Coffee,extra\n")
        self.assertParseError(path, 2, "expected 3 columns, got 4")

    def test_blank_line_is_a_malformed_row(self):
        path = self.write_file(HEADER + "2026-03-04,-7.50,Coffee\n\n")
        self.assertParseError(path, 3, "expected 3 columns, got 0")

    def test_bad_date_reports_its_line(self):
        path = self.write_file(
            HEADER + "2026-03-04,-7.50,Coffee\n03/05/2026,-1.00,Tea\n"
        )
        self.assertParseError(
            path, 3, "date is not ISO 8601 (YYYY-MM-DD): '03/05/2026'"
        )

    def test_bad_amount_reports_its_line(self):
        path = self.write_file(HEADER + "2026-03-04,1.005,Coffee\n")
        self.assertParseError(
            path, 2, "amount has more than two fractional digits: '1.005'"
        )

    def test_missing_file_raises_oserror(self):
        with self.assertRaises(OSError):
            parse_transactions(self.path_for("nope.csv"))

    def test_undecodable_bytes_raise_unicodedecodeerror(self):
        path = self.write_bytes(HEADER.encode() + b"2026-03-04,-1.00,caf\xe9\n")
        with self.assertRaises(UnicodeDecodeError):
            parse_transactions(path)
```

- [ ] **Step 7: Run the parse tests to verify they fail**

Run: `python3 -m unittest test_parse -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'ledgerlite.parse'`

- [ ] **Step 8: Write `parse.py`**

```python
"""Read a transactions CSV into Transaction objects."""

import csv
import datetime
import re
from decimal import Decimal

from .model import Transaction

HEADER = ["date", "amount", "description"]

_AMOUNT_RE = re.compile(r"[-+]?\d+(?:\.(?P<fraction>\d+))?\Z")
_DATE_RE = re.compile(r"\d{4}-\d{2}-\d{2}\Z")


class ParseError(Exception):
    """A file was read successfully but one of its lines is malformed."""

    def __init__(self, path, line, message):
        super().__init__(f"{path}:{line}: {message}")
        self.path = path
        self.line = line
        self.message = message


def parse_amount(text):
    """Parse an amount with at most two fractional digits.

    Raises ValueError whose message is the phrase to show the user.
    """
    cleaned = text.strip()
    match = _AMOUNT_RE.match(cleaned)
    if match is None:
        raise ValueError(f"amount is not a number: {text!r}")
    fraction = match.group("fraction")
    if fraction is not None and len(fraction) > 2:
        raise ValueError(f"amount has more than two fractional digits: {text!r}")
    return Decimal(cleaned)


def parse_date(text):
    """Parse an ISO 8601 calendar date. Raises ValueError, as parse_amount does."""
    cleaned = text.strip()
    if _DATE_RE.match(cleaned) is None:
        raise ValueError(f"date is not ISO 8601 (YYYY-MM-DD): {text!r}")
    try:
        return datetime.date.fromisoformat(cleaned)
    except ValueError:
        raise ValueError(f"date is not a valid calendar date: {text!r}") from None


def _row_to_transaction(row, path, line):
    if len(row) != len(HEADER):
        raise ParseError(path, line, f"expected 3 columns, got {len(row)}")
    date_text, amount_text, description = row
    try:
        when = parse_date(date_text)
        amount = parse_amount(amount_text)
    except ValueError as error:
        raise ParseError(path, line, str(error)) from None
    return Transaction(when, amount, description)


def parse_transactions(path):
    """Return every transaction in the file, in file order.

    Raises ParseError if any row is malformed; the caller gets no partial
    result, so the whole file is rejected. OSError and UnicodeDecodeError
    propagate: they mean the file could not be read.
    """
    transactions = []
    # utf-8-sig strips a spreadsheet's BOM; newline="" is what csv requires.
    with open(path, newline="", encoding="utf-8-sig") as handle:
        reader = csv.reader(handle)
        for index, row in enumerate(reader):
            if index == 0:
                if [column.strip().casefold() for column in row] != HEADER:
                    raise ParseError(
                        path, reader.line_num, f"expected header {','.join(HEADER)}"
                    )
                continue
            transactions.append(_row_to_transaction(row, path, reader.line_num))
    return transactions
```

- [ ] **Step 9: Run the parse tests to verify they pass**

Run: `python3 -m unittest test_parse -v`
Expected: PASS (all tests, including the 8 `parse_amount` subtests and 5 `parse_date` subtests)

- [ ] **Step 10: Run the whole suite**

Run: `python3 -m unittest`
Expected: OK

- [ ] **Step 11: Commit**

```bash
git add .gitignore testsupport.py ledgerlite/__init__.py ledgerlite/model.py ledgerlite/parse.py test_model.py test_parse.py
git commit -m "feat: parse transactions CSV into Transaction objects"
```

---

## Task 2: Rules parsing and categorization

**Files:**
- Create: `ledgerlite/rules.py`
- Test: `test_rules.py`

**Interfaces:**
- Consumes: `ledgerlite.parse.ParseError(path, line, message)` from Task 1.
- Produces:
  - `ledgerlite.rules.parse_rules(text: str, path: str) -> list[tuple[str, str]]` — `(substring, category)` pairs in file order; raises `ParseError`. `path` is passed in only so the error can name the file.
  - `ledgerlite.rules.load_rules(path: str) -> list[tuple[str, str]]` — reads the file and calls `parse_rules`; raises `OSError`/`UnicodeDecodeError`/`ParseError`.
  - `ledgerlite.rules.categorize(description: str, rules: list[tuple[str, str]]) -> str | None` — first matching rule's category, or `None`.

- [ ] **Step 1: Write the failing tests**

`test_rules.py`:

```python
import unittest

from ledgerlite.parse import ParseError
from ledgerlite.rules import categorize, load_rules, parse_rules
from testsupport import TempFileTestCase


class ParseRulesTests(unittest.TestCase):
    def test_pairs_in_file_order(self):
        self.assertEqual(
            parse_rules("coffee=food\nrent=housing\n", "rules.txt"),
            [("coffee", "food"), ("rent", "housing")],
        )

    def test_blank_lines_skipped(self):
        self.assertEqual(
            parse_rules("\n   \ncoffee=food\n\n", "rules.txt"), [("coffee", "food")]
        )

    def test_whitespace_around_both_sides_trimmed(self):
        self.assertEqual(
            parse_rules("  coffee  =  food  \n", "rules.txt"), [("coffee", "food")]
        )

    def test_only_the_first_equals_splits(self):
        self.assertEqual(parse_rules("a=b=c\n", "rules.txt"), [("a", "b=c")])

    def test_missing_file_final_newline_is_fine(self):
        self.assertEqual(parse_rules("coffee=food", "rules.txt"), [("coffee", "food")])

    def test_line_without_equals_rejected(self):
        with self.assertRaises(ParseError) as caught:
            parse_rules("coffee=food\njust some text\n", "rules.txt")
        self.assertEqual(
            str(caught.exception), "rules.txt:2: expected <substring>=<category>"
        )

    def test_empty_substring_rejected(self):
        with self.assertRaises(ParseError) as caught:
            parse_rules("=food\n", "rules.txt")
        self.assertEqual(
            str(caught.exception), "rules.txt:1: rule has an empty substring"
        )

    def test_empty_category_rejected(self):
        with self.assertRaises(ParseError) as caught:
            parse_rules("coffee=   \n", "rules.txt")
        self.assertEqual(
            str(caught.exception), "rules.txt:1: rule has an empty category"
        )


class CategorizeTests(unittest.TestCase):
    RULES = [("coffee", "food"), ("coffee shop", "treats"), ("rent", "housing")]

    def test_matches_substring_anywhere(self):
        self.assertEqual(categorize("Monthly RENT payment", self.RULES), "housing")

    def test_matching_is_case_insensitive(self):
        self.assertEqual(categorize("MORNING COFFEE", self.RULES), "food")

    def test_first_matching_rule_wins(self):
        self.assertEqual(categorize("Coffee Shop #4", self.RULES), "food")

    def test_no_match_returns_none(self):
        self.assertIsNone(categorize("Bookshop", self.RULES))

    def test_empty_description_returns_none(self):
        self.assertIsNone(categorize("", self.RULES))

    def test_empty_rule_list_returns_none(self):
        self.assertIsNone(categorize("Coffee Bar", []))


class LoadRulesTests(TempFileTestCase):
    def test_reads_and_parses_the_file(self):
        path = self.write_file("coffee=food\nrent=housing\n", name="rules.txt")
        self.assertEqual(load_rules(path), [("coffee", "food"), ("rent", "housing")])

    def test_error_names_the_real_path(self):
        path = self.write_file("oops\n", name="rules.txt")
        with self.assertRaises(ParseError) as caught:
            load_rules(path)
        self.assertEqual(
            str(caught.exception), f"{path}:1: expected <substring>=<category>"
        )

    def test_missing_file_raises_oserror(self):
        with self.assertRaises(OSError):
            load_rules(self.path_for("nope.txt"))
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `python3 -m unittest test_rules -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'ledgerlite.rules'`

- [ ] **Step 3: Write `rules.py`**

```python
"""Turn a rules file into (substring, category) pairs and apply them."""

from .parse import ParseError


def parse_rules(text, path):
    """Parse rules text. `path` is used only to name the file in errors."""
    rules = []
    for line, raw in enumerate(text.splitlines(), start=1):
        if not raw.strip():
            continue
        if "=" not in raw:
            raise ParseError(path, line, "expected <substring>=<category>")
        substring, category = (part.strip() for part in raw.split("=", 1))
        if not substring:
            # An empty substring would match every description.
            raise ParseError(path, line, "rule has an empty substring")
        if not category:
            raise ParseError(path, line, "rule has an empty category")
        rules.append((substring, category))
    return rules


def load_rules(path):
    """Read and parse a rules file. OSError and UnicodeDecodeError propagate."""
    with open(path, encoding="utf-8-sig") as handle:
        return parse_rules(handle.read(), path)


def categorize(description, rules):
    """Return the first matching rule's category, or None if none match."""
    haystack = description.casefold()
    for substring, category in rules:
        if substring.casefold() in haystack:
            return category
    return None
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `python3 -m unittest test_rules -v`
Expected: PASS (all tests)

- [ ] **Step 5: Run the whole suite**

Run: `python3 -m unittest`
Expected: OK

- [ ] **Step 6: Commit**

```bash
git add ledgerlite/rules.py test_rules.py
git commit -m "feat: parse rules files and categorize descriptions"
```

---

## Task 3: Date ordering and closing balance

**Files:**
- Create: `ledgerlite/balance.py`
- Test: `test_balance.py`

**Interfaces:**
- Consumes: `ledgerlite.model.Transaction` from Task 1.
- Produces:
  - `ledgerlite.balance.order_by_date(transactions: list[Transaction]) -> list[Transaction]` — a new list sorted by date, ties keeping input order; the argument is not mutated.
  - `ledgerlite.balance.closing_balance(opening: Decimal, transactions: list[Transaction]) -> Decimal` — orders internally, so callers cannot get the order wrong; returns `opening` for an empty list.

- [ ] **Step 1: Write the failing tests**

`test_balance.py`:

```python
import datetime
import unittest
from decimal import Decimal

from ledgerlite.balance import closing_balance, order_by_date
from ledgerlite.model import Transaction


def tx(day, amount, description="x"):
    return Transaction(datetime.date(2026, 3, day), Decimal(amount), description)


class OrderByDateTests(unittest.TestCase):
    def test_sorts_by_date(self):
        rows = [tx(5, "1.00"), tx(3, "2.00"), tx(4, "3.00")]
        self.assertEqual([t.date.day for t in order_by_date(rows)], [3, 4, 5])

    def test_ties_keep_input_order(self):
        rows = [tx(4, "1.00", "first-in-file"), tx(3, "2.00", "earlier-date"), tx(4, "3.00", "later-in-file")]
        ordered = order_by_date(rows)
        self.assertEqual(
            [t.description for t in ordered],
            ["earlier-date", "first-in-file", "later-in-file"],
        )

    def test_does_not_mutate_its_argument(self):
        rows = [tx(5, "1.00"), tx(3, "2.00")]
        order_by_date(rows)
        self.assertEqual([t.date.day for t in rows], [5, 3])

    def test_empty_list(self):
        self.assertEqual(order_by_date([]), [])


class ClosingBalanceTests(unittest.TestCase):
    def test_no_transactions_returns_the_opening_amount(self):
        self.assertEqual(closing_balance(Decimal("100"), []), Decimal("100"))

    def test_adds_every_amount(self):
        rows = [tx(4, "-7.50"), tx(5, "-900.00"), tx(6, "2500.00")]
        self.assertEqual(closing_balance(Decimal("100"), rows), Decimal("1692.50"))

    def test_independent_of_input_order(self):
        rows = [tx(6, "2500.00"), tx(4, "-7.50"), tx(5, "-900.00")]
        self.assertEqual(closing_balance(Decimal("100"), rows), Decimal("1692.50"))

    def test_exact_decimal_arithmetic_no_float_drift(self):
        rows = [tx(4, "0.10"), tx(4, "0.20")]
        self.assertEqual(str(closing_balance(Decimal("0"), rows)), "0.30")
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `python3 -m unittest test_balance -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'ledgerlite.balance'`

- [ ] **Step 3: Write `balance.py`**

```python
"""Date-ordered running balance and closing balance."""


def order_by_date(transactions):
    """Return the transactions sorted by date; sorted() is stable, so rows
    sharing a date keep their input order."""
    return sorted(transactions, key=lambda transaction: transaction.date)


def closing_balance(opening, transactions):
    """Walk the transactions in date order, adding each amount to the
    running balance, and return the balance after the last one."""
    balance = opening
    for transaction in order_by_date(transactions):
        balance += transaction.amount
    return balance
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `python3 -m unittest test_balance -v`
Expected: PASS (8 tests)

- [ ] **Step 5: Run the whole suite**

Run: `python3 -m unittest`
Expected: OK

- [ ] **Step 6: Commit**

```bash
git add ledgerlite/balance.py test_balance.py
git commit -m "feat: order transactions by date and compute closing balance"
```

---

## Task 4: Category totals and report formatting

**Files:**
- Create: `ledgerlite/report.py`
- Test: `test_report.py`

**Interfaces:**
- Consumes: `Transaction` (Task 1), `categorize` (Task 2), `closing_balance` (Task 3).
- Produces:
  - `ledgerlite.report.UNCATEGORIZED = "uncategorized"`.
  - `ledgerlite.report.format_amount(amount: Decimal) -> str` — exactly two fractional digits, no separators, no `-` on zero.
  - `ledgerlite.report.category_totals(transactions, rules) -> list[tuple[str, Decimal]]` — already in print order: named categories case-insensitively alphabetical, then `uncategorized` last if present.
  - `ledgerlite.report.format_report(transactions, rules, opening: Decimal) -> str` — the whole report with no trailing newline (the caller's `print` supplies it).

- [ ] **Step 1: Write the failing tests**

`test_report.py`:

```python
import datetime
import unittest
from decimal import Decimal

from ledgerlite.model import Transaction
from ledgerlite.report import category_totals, format_amount, format_report

RULES = [("coffee", "food"), ("rent", "housing")]


def tx(day, amount, description):
    return Transaction(datetime.date(2026, 3, day), Decimal(amount), description)


class FormatAmountTests(unittest.TestCase):
    def test_always_two_fractional_digits(self):
        self.assertEqual(format_amount(Decimal("1200")), "1200.00")
        self.assertEqual(format_amount(Decimal("1.5")), "1.50")
        self.assertEqual(format_amount(Decimal("-12.50")), "-12.50")

    def test_zero_has_no_sign(self):
        self.assertEqual(format_amount(Decimal("0")), "0.00")

    def test_negative_zero_has_no_sign(self):
        self.assertEqual(format_amount(Decimal("-0.00")), "0.00")

    def test_no_thousands_separators(self):
        self.assertEqual(format_amount(Decimal("-1234567.89")), "-1234567.89")


class CategoryTotalsTests(unittest.TestCase):
    def test_alphabetical_with_uncategorized_last(self):
        rows = [
            tx(4, "-7.50", "Coffee Bar"),
            tx(5, "-900.00", "Rent March"),
            tx(6, "2500.00", "Salary"),
        ]
        self.assertEqual(
            category_totals(rows, RULES),
            [
                ("food", Decimal("-7.50")),
                ("housing", Decimal("-900.00")),
                ("uncategorized", Decimal("2500.00")),
            ],
        )

    def test_sums_amounts_within_a_category(self):
        rows = [tx(4, "-7.50", "Coffee Bar"), tx(4, "-2.50", "COFFEE cart")]
        self.assertEqual(category_totals(rows, RULES), [("food", Decimal("-10.00"))])

    def test_alphabetical_order_ignores_case(self):
        rules = [("a", "Zebra"), ("b", "apple")]
        rows = [tx(4, "1.00", "a"), tx(4, "2.00", "b")]
        self.assertEqual(
            [name for name, _ in category_totals(rows, rules)], ["apple", "Zebra"]
        )

    def test_explicit_uncategorized_rule_merges_and_stays_last(self):
        rules = [("mystery", "uncategorized"), ("rent", "housing")]
        rows = [
            tx(4, "1.00", "Mystery fee"),
            tx(5, "-900.00", "Rent March"),
            tx(6, "2.00", "Nothing matches this"),
        ]
        self.assertEqual(
            category_totals(rows, rules),
            [("housing", Decimal("-900.00")), ("uncategorized", Decimal("3.00"))],
        )

    def test_no_transactions_gives_no_lines(self):
        self.assertEqual(category_totals([], RULES), [])

    def test_no_rules_puts_everything_in_uncategorized(self):
        rows = [tx(4, "-7.50", "Coffee Bar"), tx(5, "1.00", "Rent March")]
        self.assertEqual(
            category_totals(rows, []), [("uncategorized", Decimal("-6.50"))]
        )


class FormatReportTests(unittest.TestCase):
    def test_matches_the_design_example(self):
        rows = [
            tx(5, "-900.00", "Rent March"),
            tx(4, "-7.50", "Coffee Bar"),
            tx(6, "2500.00", "Salary"),
        ]
        self.assertEqual(
            format_report(rows, RULES, Decimal("100")),
            "food: -7.50\n"
            "housing: -900.00\n"
            "uncategorized: 2500.00\n"
            "\n"
            "closing balance: 1692.50",
        )

    def test_no_transactions_prints_only_the_closing_balance(self):
        self.assertEqual(
            format_report([], RULES, Decimal("100")), "closing balance: 100.00"
        )

    def test_no_trailing_newline(self):
        rows = [tx(4, "-7.50", "Coffee Bar")]
        self.assertFalse(format_report(rows, RULES, Decimal("0")).endswith("\n"))
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `python3 -m unittest test_report -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'ledgerlite.report'`

- [ ] **Step 3: Write `report.py`**

```python
"""Per-category totals and report formatting."""

from decimal import Decimal

from .balance import closing_balance
from .rules import categorize

UNCATEGORIZED = "uncategorized"

_CENTS = Decimal("0.01")


def format_amount(amount):
    """Format an amount with exactly two fractional digits and no separators."""
    quantized = amount.quantize(_CENTS)
    if quantized == 0:
        # Decimal keeps the sign of -0.00; zero is not negative to a reader.
        quantized = abs(quantized)
    return f"{quantized:f}"


def category_totals(transactions, rules):
    """Return (category, total) pairs in print order: named categories
    alphabetically, then uncategorized last."""
    totals = {}
    for transaction in transactions:
        name = categorize(transaction.description, rules) or UNCATEGORIZED
        totals[name] = totals.get(name, Decimal("0")) + transaction.amount
    named = sorted(
        (name for name in totals if name != UNCATEGORIZED),
        key=lambda name: (name.casefold(), name),
    )
    ordered = [(name, totals[name]) for name in named]
    if UNCATEGORIZED in totals:
        ordered.append((UNCATEGORIZED, totals[UNCATEGORIZED]))
    return ordered


def format_report(transactions, rules, opening):
    """Render the whole report, without a trailing newline."""
    lines = [
        f"{name}: {format_amount(total)}"
        for name, total in category_totals(transactions, rules)
    ]
    if lines:
        # The blank line separates the category block from the closing line;
        # with no categories there is nothing to separate.
        lines.append("")
    lines.append(f"closing balance: {format_amount(closing_balance(opening, transactions))}")
    return "\n".join(lines)
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `python3 -m unittest test_report -v`
Expected: PASS (13 tests)

- [ ] **Step 5: Run the whole suite**

Run: `python3 -m unittest`
Expected: OK

- [ ] **Step 6: Commit**

```bash
git add ledgerlite/report.py test_report.py
git commit -m "feat: total transactions per category and format the report"
```

---

## Task 5: CLI, exit codes, and end-to-end tests

**Files:**
- Create: `ledgerlite/cli.py`
- Create: `ledgerlite/__main__.py`
- Test: `test_cli.py`

**Interfaces:**
- Consumes: `parse.parse_transactions`, `parse.parse_amount`, `parse.ParseError` (Task 1); `rules.load_rules` (Task 2); `report.format_report` (Task 4).
- Produces: `ledgerlite.cli.main(argv: list[str] | None = None) -> int` — returns the exit code; writes the report to stdout and error messages to stderr. Usage errors from argparse (an unknown command, a missing TRANSACTIONS, an unparseable `--opening`) raise `SystemExit(2)`, which is argparse's own behavior and is left alone.

- [ ] **Step 1: Write the failing tests**

`test_cli.py`:

```python
import contextlib
import io
import subprocess
import sys
import unittest
from pathlib import Path

from ledgerlite.cli import main
from testsupport import TempFileTestCase

REPO_ROOT = Path(__file__).resolve().parent

CSV = (
    "date,amount,description\n"
    "2026-03-05,-900.00,Rent March\n"
    "2026-03-04,-7.50,Coffee Bar\n"
    "2026-03-06,2500.00,Salary\n"
)
RULES = "coffee=food\nrent=housing\n"

EXAMPLE_OUTPUT = """food: -7.50
housing: -900.00
uncategorized: 2500.00

closing balance: 1692.50
"""

NO_RULES_OUTPUT = "uncategorized: 1592.50\n\nclosing balance: 1592.50\n"


class CliTestCase(TempFileTestCase):
    def run_cli(self, *argv):
        """Run main() with stdout/stderr captured. Returns (code, out, err)."""
        out, err = io.StringIO(), io.StringIO()
        with contextlib.redirect_stdout(out), contextlib.redirect_stderr(err):
            code = main(list(argv))
        return code, out.getvalue(), err.getvalue()


class ReportCommandTests(CliTestCase):
    def test_reproduces_the_design_example(self):
        transactions = self.write_file(CSV)
        rules = self.write_file(RULES, name="rules.txt")
        code, out, err = self.run_cli(
            "report", transactions, "--rules", rules, "--opening", "100"
        )
        self.assertEqual(err, "")
        self.assertEqual(out, EXAMPLE_OUTPUT)
        self.assertEqual(code, 0)

    def test_without_rules_everything_is_uncategorized_and_opening_is_zero(self):
        code, out, err = self.run_cli("report", self.write_file(CSV))
        self.assertEqual((code, out, err), (0, NO_RULES_OUTPUT, ""))

    def test_negative_opening_amount(self):
        code, out, err = self.run_cli(
            "report", self.write_file(""), "--opening", "-12.5"
        )
        self.assertEqual((code, out, err), (0, "closing balance: -12.50\n", ""))

    def test_header_only_file_reports_the_opening_balance(self):
        path = self.write_file("date,amount,description\n")
        code, out, err = self.run_cli("report", path, "--opening", "100")
        self.assertEqual((code, out, err), (0, "closing balance: 100.00\n", ""))


class UnreadableFileTests(CliTestCase):
    def test_missing_transactions_file(self):
        path = self.path_for("nope.csv")
        code, out, err = self.run_cli("report", path)
        self.assertEqual(code, 1)
        self.assertEqual(out, "")
        self.assertEqual(
            err, f"ledgerlite: cannot read {path}: No such file or directory\n"
        )

    def test_transactions_path_is_a_directory(self):
        path = str(self.directory)
        code, out, err = self.run_cli("report", path)
        self.assertEqual(code, 1)
        self.assertEqual(err, f"ledgerlite: cannot read {path}: Is a directory\n")

    def test_transactions_file_is_not_utf8(self):
        path = self.write_bytes(
            b"date,amount,description\n2026-03-04,-1.00,caf\xe9\n"
        )
        code, out, err = self.run_cli("report", path)
        self.assertEqual(code, 1)
        self.assertEqual(err, f"ledgerlite: cannot read {path}: not valid UTF-8 text\n")

    def test_missing_rules_file(self):
        transactions = self.write_file(CSV)
        path = self.path_for("nope.txt")
        code, out, err = self.run_cli("report", transactions, "--rules", path)
        self.assertEqual(code, 1)
        self.assertEqual(out, "")
        self.assertEqual(
            err, f"ledgerlite: cannot read {path}: No such file or directory\n"
        )


class MalformedFileTests(CliTestCase):
    def test_malformed_row_rejects_the_whole_file(self):
        path = self.write_file(
            "date,amount,description\n"
            "2026-03-04,-7.50,Coffee Bar\n"
            "2026-03-05,1.005,Odd amount\n"
        )
        code, out, err = self.run_cli("report", path)
        self.assertEqual(code, 2)
        self.assertEqual(out, "")
        self.assertEqual(
            err,
            f"ledgerlite: {path}:3: amount has more than two "
            "fractional digits: '1.005'\n",
        )

    def test_missing_header_row(self):
        path = self.write_file("2026-03-04,-7.50,Coffee Bar\n")
        code, out, err = self.run_cli("report", path)
        self.assertEqual(code, 2)
        self.assertEqual(
            err, f"ledgerlite: {path}:1: expected header date,amount,description\n"
        )

    def test_malformed_rules_file(self):
        transactions = self.write_file(CSV)
        rules = self.write_file("coffee=food\noops\n", name="rules.txt")
        code, out, err = self.run_cli("report", transactions, "--rules", rules)
        self.assertEqual(code, 2)
        self.assertEqual(out, "")
        self.assertEqual(
            err, f"ledgerlite: {rules}:2: expected <substring>=<category>\n"
        )

    def test_unparseable_opening_is_a_usage_error(self):
        transactions = self.write_file(CSV)
        stderr = io.StringIO()
        with contextlib.redirect_stderr(stderr):
            with self.assertRaises(SystemExit) as caught:
                main(["report", transactions, "--opening", "1.005"])
        self.assertEqual(caught.exception.code, 2)
        self.assertIn("more than two fractional digits", stderr.getvalue())


class ModuleEntryPointTests(TempFileTestCase):
    def test_python_dash_m_ledgerlite(self):
        path = self.write_file(CSV)
        result = subprocess.run(
            [sys.executable, "-m", "ledgerlite", "report", path],
            capture_output=True,
            text=True,
            cwd=REPO_ROOT,
        )
        self.assertEqual(result.stderr, "")
        self.assertEqual(result.stdout, NO_RULES_OUTPUT)
        self.assertEqual(result.returncode, 0)
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `python3 -m unittest test_cli -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'ledgerlite.cli'`

- [ ] **Step 3: Write `cli.py`**

```python
"""argparse entry point: turn arguments into a report or an exit code."""

import argparse
import sys
from decimal import Decimal

from . import parse, report, rules


class _Failure(Exception):
    """An expected, reportable failure: a message plus the exit code for it."""

    def __init__(self, code, message):
        super().__init__(message)
        self.code = code


def _opening_amount(text):
    try:
        return parse.parse_amount(text)
    except ValueError as error:
        raise argparse.ArgumentTypeError(str(error)) from None


def _build_parser():
    parser = argparse.ArgumentParser(
        prog="ledgerlite", description="Summarize bank transactions by category."
    )
    subparsers = parser.add_subparsers(dest="command", required=True)
    report_parser = subparsers.add_parser(
        "report", help="print per-category totals and the closing balance"
    )
    report_parser.add_argument(
        "transactions", metavar="TRANSACTIONS", help="path to the transactions CSV"
    )
    report_parser.add_argument(
        "--rules", metavar="RULES", help="path to the rules file"
    )
    report_parser.add_argument(
        "--opening",
        metavar="AMOUNT",
        type=_opening_amount,
        default=Decimal("0"),
        help="opening balance (default: 0)",
    )
    return parser


def _read(path, loader):
    """Call loader(path), translating its exceptions into a _Failure."""
    try:
        return loader(path)
    except parse.ParseError as error:
        raise _Failure(2, f"ledgerlite: {error}") from None
    except OSError as error:
        reason = error.strerror or str(error)
        raise _Failure(1, f"ledgerlite: cannot read {path}: {reason}") from None
    except UnicodeDecodeError:
        raise _Failure(
            1, f"ledgerlite: cannot read {path}: not valid UTF-8 text"
        ) from None


def main(argv=None):
    """Run the command line. Returns the process exit code."""
    args = _build_parser().parse_args(argv)
    try:
        transactions = _read(args.transactions, parse.parse_transactions)
        rule_list = _read(args.rules, rules.load_rules) if args.rules else []
    except _Failure as failure:
        print(failure, file=sys.stderr)
        return failure.code
    print(report.format_report(transactions, rule_list, args.opening))
    return 0
```

- [ ] **Step 4: Write `__main__.py`**

```python
"""Support `python3 -m ledgerlite`."""

import sys

from .cli import main

if __name__ == "__main__":
    sys.exit(main())
```

- [ ] **Step 5: Run the CLI tests to verify they pass**

Run: `python3 -m unittest test_cli -v`
Expected: PASS (all tests)

- [ ] **Step 6: Run the whole suite and the tool by hand**

Run: `python3 -m unittest`
Expected: OK

Then reproduce the spec's example end to end:

```bash
printf 'date,amount,description\n2026-03-05,-900.00,Rent March\n2026-03-04,-7.50,Coffee Bar\n2026-03-06,2500.00,Salary\n' > /tmp/tx.csv
printf 'coffee=food\nrent=housing\n' > /tmp/rules.txt
python3 -m ledgerlite report /tmp/tx.csv --rules /tmp/rules.txt --opening 100
echo "exit: $?"
```

Expected:

```
food: -7.50
housing: -900.00
uncategorized: 2500.00

closing balance: 1692.50
exit: 0
```

Then check both error paths:

```bash
python3 -m ledgerlite report /tmp/missing.csv; echo "exit: $?"
printf 'date,amount,description\n2026-03-04,1.005,Odd\n' > /tmp/bad.csv
python3 -m ledgerlite report /tmp/bad.csv; echo "exit: $?"
```

Expected:

```
ledgerlite: cannot read /tmp/missing.csv: No such file or directory
exit: 1
ledgerlite: /tmp/bad.csv:2: amount has more than two fractional digits: '1.005'
exit: 2
```

- [ ] **Step 7: Confirm no `float` slipped into the package**

Run: `grep -rn "float" ledgerlite/ || echo "clean"`
Expected: `clean`

- [ ] **Step 8: Commit**

```bash
git add ledgerlite/cli.py ledgerlite/__main__.py test_cli.py
git commit -m "feat: add ledgerlite report command with spec exit codes"
```

---

## Task 6: README

**Files:**
- Create: `README.md`

**Interfaces:**
- Consumes: the finished CLI from Task 5.
- Produces: nothing other tasks depend on.

- [ ] **Step 1: Write `README.md`**

````markdown
# ledgerlite

Read a CSV of bank transactions, assign each a category from a rules file,
and print a per-category summary with the closing balance. Standard library
only; Python 3.11+.

## Usage

```
python3 -m ledgerlite report TRANSACTIONS [--rules RULES] [--opening AMOUNT]
```

`TRANSACTIONS` is a CSV with the header `date,amount,description`, where
`date` is ISO 8601 (`2026-03-04`) and `amount` is a decimal number with at
most two fractional digits, negative for money out. Rows may be in any order.

`RULES` is a text file of `<substring>=<category>` lines. Matching is
case-insensitive on the description and the first matching rule wins;
transactions matching no rule are reported as `uncategorized`.

`--opening` defaults to `0`.

## Example

```console
$ cat tx.csv
date,amount,description
2026-03-05,-900.00,Rent March
2026-03-04,-7.50,Coffee Bar
2026-03-06,2500.00,Salary
$ cat rules.txt
coffee=food
rent=housing
$ python3 -m ledgerlite report tx.csv --rules rules.txt --opening 100
food: -7.50
housing: -900.00
uncategorized: 2500.00

closing balance: 1692.50
```

## Exit codes

| Code | Meaning |
| --- | --- |
| 0 | The report was printed. |
| 1 | A file could not be read: `ledgerlite: cannot read <path>: <reason>` |
| 2 | A file was read but is malformed: `ledgerlite: <path>:<line>: <what is wrong>` |

## Tests

```
python3 -m unittest
```
````

- [ ] **Step 2: Verify the README example actually works**

Run the `$ ` commands from the README's Example section in a scratch directory and compare the output character for character with what the README claims. Fix the README if they differ.

- [ ] **Step 3: Run the whole suite one last time**

Run: `python3 -m unittest`
Expected: OK

- [ ] **Step 4: Commit**

```bash
git add README.md
git commit -m "docs: add README with usage, example, and exit codes"
```
