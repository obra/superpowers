# ledgerlite Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `ledgerlite`, a stdlib-only Python command-line tool that reads a transactions CSV, categorizes each row with a rules file, and prints per-category totals plus a closing balance.

**Architecture:** Six small modules in one package, each with a single responsibility and no upward dependencies: `model` (data), `parse` (CSV → `Transaction`, plus the field-level validators and the `ParseError` type everyone else raises), `rules` (rules text → rule list, plus matching), `balance` (date ordering and closing balance), `report` (totals and text formatting), `cli` (argparse, error messages, exit codes). All money is `decimal.Decimal` end to end; no float ever touches an amount. Every module is pure except `parse.parse_transactions` (opens the CSV) and `cli.main` (reads the rules file, writes streams).

**Tech Stack:** Python 3.11+, standard library only (`argparse`, `csv`, `dataclasses`, `datetime`, `decimal`, `re`, `pathlib`, `unittest`).

**Spec:** `design.md` (in the repo root, alongside this plan)

## Global Constraints

- Python 3.11+. Standard library only — no third-party packages, no `pip install`.
- Amounts are `decimal.Decimal`. Never `float`, never `round()`, never arithmetic on the string form.
- Package lives in `ledgerlite/`. Module split is exactly the one in the spec's "Package layout" section.
- Tests live at the repo root as `test_<module>.py` and run with `python3 -m unittest`.
- Exit codes: `0` success, `1` transactions/rules file cannot be read, `2` malformed content in a transactions or rules file.
- Error messages go to stderr and are exactly:
  - `ledgerlite: cannot read <path>: <reason>`
  - `ledgerlite: <path>:<line>: <what is wrong>`
- Amounts are printed with exactly two fractional digits, a leading `-` for negatives, no thousands separators.
- On any error, stdout stays empty.
- Every module starts with `from __future__ import annotations` so annotations like `str | None` and `date: date` are never evaluated at runtime.

### Decisions this plan makes where the spec is silent

The spec is a vision document; these are the readings this plan commits to. They are all pinned by tests, so a reviewer can disagree with the choice by pointing at the test rather than guessing.

1. **The header row is validated.** The first row must be `date,amount,description` (per-cell whitespace and case ignored, UTF-8 BOM tolerated). Anything else — including a zero-byte file — is `ledgerlite: <path>:1: expected header 'date,amount,description'`, exit 2. Silently skipping row 1 would swallow a whole transaction in a headerless file.
2. **Amounts must match `^[+-]?\d+(\.\d{1,2})?$`** after stripping surrounding whitespace. This rejects `NaN`, `Infinity`, `1e2`, `1,000.00`, `.5`, `5.`, and the empty string — all of which `Decimal(...)` would otherwise accept or accept-then-surprise.
3. **Dates must match `^\d{4}-\d{2}-\d{2}$`** and be a real calendar date. `date.fromisoformat` on 3.11+ accepts `20260304` and week dates; `strptime` alone accepts `2026-3-4`. The spec says `2026-03-04`.
4. **Malformed rules lines are exit 2**, reported with the rules path and line number, same format as a malformed CSV row. Blank lines and lines whose first non-space character is `#` are skipped. An unreadable rules file is exit 1, same as an unreadable CSV.
5. **A rule whose category is literally `uncategorized`** merges into the no-category bucket and is printed last with it.
6. **Categories sort case-insensitively** (`key=(name.lower(), name)`), because "alphabetically" to a person means `Food` before `housing`, not after it.
7. **A total of exactly zero prints `0.00`**, never `-0.00`.
8. **A transactions file that is not valid UTF-8** is "cannot read", exit 1, reason `invalid UTF-8`.
9. **An invalid `--opening`** is an argparse usage error: usage on stderr, exit 2.

## Review Focus

Input classes and failure modes the spec implies. Each line names the task whose tests pin it; the reviewer checks these deliberately at the end.

- Zero-byte file, and a file whose first row is data rather than the header → exit 2 at line 1, stdout empty (Task 2).
- Header-only file → valid, empty report: no category lines, a blank line, `closing balance: <opening>` (Tasks 5 and 6).
- `NaN`, `Infinity`, `1e2`, `1,000.00`, `.5`, `5.`, `""`, `1.005` as amounts → all malformed (Task 1).
- `20260304`, `2026-3-4`, `2026-02-30`, `04/03/2026` as dates → all malformed (Task 1).
- A description containing a comma or a quoted embedded newline → column count is still 3, and the reported line number is the file line, not the row index (Task 2).
- CRLF line endings, and a UTF-8 BOM before the header → parse cleanly (Task 2).
- The line number of the first data row is 2, not 1 (Task 2).
- Two transactions on the same date keep their input order (Task 4).
- A rule category of `uncategorized` merges with the no-category bucket and stays last (Task 5).
- Category order is case-insensitive; a category whose total is exactly zero prints `0.00`, not `-0.00` (Task 5).
- A rules line with no `=`, an empty substring, or an empty category → exit 2 naming the rules path and line (Tasks 3 and 6).
- Unreadable transactions path, unreadable rules path, and a path that is a directory → exit 1 with the OS reason (Task 6).
- Non-UTF-8 transactions file → exit 1, reason `invalid UTF-8` (Task 6).
- Invalid `--opening` (`abc`, `1.005`) → exit 2 from argparse, stdout empty (Task 6).
- Only the *first* malformed row is reported and nothing reaches stdout (Task 6).
- Matching is case-insensitive in both directions: rule `COFFEE=food` matches description `Coffee shop` (Task 3).

---

## File Structure

| File | Responsibility |
| --- | --- |
| `ledgerlite/__init__.py` | Package marker; docstring only. No re-exports (keeps import graph obvious). |
| `ledgerlite/model.py` | `Transaction` frozen dataclass. No logic. |
| `ledgerlite/parse.py` | `ParseError`; `parse_date`/`parse_amount` field validators; `parse_transactions(path)`. |
| `ledgerlite/rules.py` | `Rule` alias; `parse_rules(text)`; `categorize(description, rules)`. |
| `ledgerlite/balance.py` | `order_transactions`; `closing_balance`. |
| `ledgerlite/report.py` | `UNCATEGORIZED`; `format_amount`; `category_totals`; `format_report`. |
| `ledgerlite/cli.py` | `main(argv) -> int`: argparse wiring, error messages, exit codes. |
| `ledgerlite/__main__.py` | Three lines so `python3 -m ledgerlite` works. Not in the spec's layout; added because a CLI you cannot run is not a CLI. |
| `test_parse.py` | Tasks 1–2. |
| `test_rules.py` | Task 3. |
| `test_balance.py` | Task 4. |
| `test_report.py` | Task 5. |
| `test_cli.py` | Task 6, end to end through the filesystem. |

Dependency direction: `model` ← `parse` ← `rules` ← `balance`/`report` ← `cli`. `rules` imports only `ParseError` from `parse`.

---

### Task 1: Package skeleton, `Transaction`, and field validators

Everything downstream needs a `Transaction` and needs to know that a bad field raises `ValueError` with a human-readable message. This task builds those and nothing else.

**Files:**
- Create: `ledgerlite/__init__.py`
- Create: `ledgerlite/model.py`
- Create: `ledgerlite/parse.py`
- Test: `test_parse.py`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `ledgerlite.model.Transaction` — frozen dataclass, fields `date: datetime.date`, `amount: decimal.Decimal`, `description: str`, in that positional order.
  - `ledgerlite.parse.ParseError(line: int, message: str)` — `Exception` subclass with `.line: int` and `.message: str` attributes.
  - `ledgerlite.parse.parse_date(text: str) -> datetime.date` — raises `ValueError` with message `unparseable date: <repr>`.
  - `ledgerlite.parse.parse_amount(text: str) -> decimal.Decimal` — raises `ValueError` with message `amount has more than two fractional digits: <repr>` or `unparseable amount: <repr>`.

- [ ] **Step 1: Write the failing test**

Create `test_parse.py`:

```python
"""Tests for ledgerlite.parse."""

from __future__ import annotations

import unittest
from datetime import date
from decimal import Decimal

from ledgerlite.model import Transaction
from ledgerlite.parse import ParseError, parse_amount, parse_date


class TransactionTest(unittest.TestCase):
    def test_fields_are_positional_and_frozen(self):
        txn = Transaction(date(2026, 3, 4), Decimal("-7.50"), "Coffee shop")
        self.assertEqual(txn.date, date(2026, 3, 4))
        self.assertEqual(txn.amount, Decimal("-7.50"))
        self.assertEqual(txn.description, "Coffee shop")
        with self.assertRaises(Exception):
            txn.amount = Decimal("0")


class ParseErrorTest(unittest.TestCase):
    def test_carries_line_and_message(self):
        error = ParseError(7, "expected 3 columns, got 2")
        self.assertEqual(error.line, 7)
        self.assertEqual(error.message, "expected 3 columns, got 2")


class ParseDateTest(unittest.TestCase):
    def test_parses_iso_date(self):
        self.assertEqual(parse_date("2026-03-04"), date(2026, 3, 4))

    def test_tolerates_surrounding_whitespace(self):
        self.assertEqual(parse_date("  2026-03-04 "), date(2026, 3, 4))

    def test_rejects_non_canonical_and_impossible_dates(self):
        for text in ("20260304", "2026-3-4", "2026-02-30", "2026-13-01",
                     "04/03/2026", "2026-W01-1", "", "today"):
            with self.subTest(text=text):
                with self.assertRaises(ValueError) as caught:
                    parse_date(text)
                self.assertIn("unparseable date", str(caught.exception))


class ParseAmountTest(unittest.TestCase):
    def test_parses_the_accepted_shapes(self):
        cases = {
            "0": Decimal("0"),
            "1.5": Decimal("1.5"),
            "1.50": Decimal("1.50"),
            "-12.50": Decimal("-12.50"),
            "+5.00": Decimal("5.00"),
            "1200": Decimal("1200"),
            "  2500.00  ": Decimal("2500.00"),
        }
        for text, expected in cases.items():
            with self.subTest(text=text):
                parsed = parse_amount(text)
                self.assertIsInstance(parsed, Decimal)
                self.assertEqual(parsed, expected)

    def test_rejects_more_than_two_fractional_digits(self):
        with self.assertRaises(ValueError) as caught:
            parse_amount("1.005")
        self.assertIn("more than two fractional digits", str(caught.exception))

    def test_rejects_non_decimal_input(self):
        for text in ("NaN", "nan", "Infinity", "-Infinity", "1e2", "1E2",
                     "1,000.00", ".5", "5.", "", "  ", "$5.00", "five"):
            with self.subTest(text=text):
                with self.assertRaises(ValueError) as caught:
                    parse_amount(text)
                self.assertIn("unparseable amount", str(caught.exception))


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run test to verify it fails**

Run: `python3 -m unittest test_parse -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'ledgerlite'`

- [ ] **Step 3: Write the minimal implementation**

Create `ledgerlite/__init__.py`:

```python
"""ledgerlite: categorize bank transactions and summarize them."""
```

Create `ledgerlite/model.py`:

```python
"""The transaction record."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import date
from decimal import Decimal


@dataclass(frozen=True)
class Transaction:
    """One row of a transactions CSV, already validated."""

    date: date
    amount: Decimal
    description: str
```

Create `ledgerlite/parse.py`:

```python
"""Read transactions CSV files, rejecting malformed input."""

from __future__ import annotations

import re
from datetime import date, datetime
from decimal import Decimal

_DATE_RE = re.compile(r"\d{4}-\d{2}-\d{2}\Z")
_AMOUNT_RE = re.compile(r"[+-]?\d+(\.\d{1,2})?\Z")
_TOO_PRECISE_RE = re.compile(r"[+-]?\d+\.\d{3,}\Z")


class ParseError(Exception):
    """A malformed line in a transactions or rules file."""

    def __init__(self, line: int, message: str) -> None:
        super().__init__(f"{line}: {message}")
        self.line = line
        self.message = message


def parse_date(text: str) -> date:
    """Parse `YYYY-MM-DD`. Nothing else: not `20260304`, not `2026-3-4`."""
    stripped = text.strip()
    if _DATE_RE.match(stripped):
        try:
            return datetime.strptime(stripped, "%Y-%m-%d").date()
        except ValueError:
            pass
    raise ValueError(f"unparseable date: {text!r}")


def parse_amount(text: str) -> Decimal:
    """Parse a decimal with at most two fractional digits.

    The regexes matter: `Decimal` itself would happily accept `NaN`,
    `Infinity` and `1e2`, none of which is a bank amount.
    """
    stripped = text.strip()
    if _TOO_PRECISE_RE.match(stripped):
        raise ValueError(f"amount has more than two fractional digits: {text!r}")
    if not _AMOUNT_RE.match(stripped):
        raise ValueError(f"unparseable amount: {text!r}")
    return Decimal(stripped)
```

- [ ] **Step 4: Run test to verify it passes**

Run: `python3 -m unittest test_parse -v`
Expected: PASS, all tests OK.

- [ ] **Step 5: Commit**

```bash
git add ledgerlite/__init__.py ledgerlite/model.py ledgerlite/parse.py test_parse.py
git commit -m "feat: add Transaction model and transaction field validators"
```

---

### Task 2: Read a transactions CSV

**Files:**
- Modify: `ledgerlite/parse.py` (add `HEADER` and `parse_transactions`; keep everything from Task 1)
- Test: `test_parse.py` (append a new `TestCase`; keep everything from Task 1)

**Interfaces:**
- Consumes: `Transaction(date, amount, description)`, `ParseError(line, message)`, `parse_date`, `parse_amount` from Task 1.
- Produces:
  - `ledgerlite.parse.HEADER: list[str]` — `["date", "amount", "description"]`.
  - `ledgerlite.parse.parse_transactions(path) -> list[Transaction]` — accepts `str` or `os.PathLike`. Returns transactions in **file order** (no sorting here). Raises `ParseError` on bad content; lets `OSError` and `UnicodeDecodeError` propagate for the CLI to report.

- [ ] **Step 1: Write the failing test**

Append to `test_parse.py`, above the `if __name__ == "__main__":` block, and add `import tempfile` plus `from pathlib import Path` and `from ledgerlite.parse import HEADER, parse_transactions` to the imports:

```python
class ParseTransactionsTest(unittest.TestCase):
    def setUp(self):
        self._tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self._tmp.cleanup)
        self.dir = Path(self._tmp.name)

    def write(self, text: str, *, encoding: str = "utf-8", name: str = "txns.csv") -> Path:
        path = self.dir / name
        path.write_text(text, encoding=encoding, newline="")
        return path

    def test_header_constant(self):
        self.assertEqual(HEADER, ["date", "amount", "description"])

    def test_parses_rows_in_file_order(self):
        path = self.write(
            "date,amount,description\n"
            "2026-03-05,-900.00,Rent March\n"
            "2026-03-04,-7.50,Coffee shop\n"
        )
        transactions = parse_transactions(path)
        self.assertEqual(
            transactions,
            [
                Transaction(date(2026, 3, 5), Decimal("-900.00"), "Rent March"),
                Transaction(date(2026, 3, 4), Decimal("-7.50"), "Coffee shop"),
            ],
        )

    def test_accepts_a_string_path(self):
        path = self.write("date,amount,description\n2026-03-04,1.00,x\n")
        self.assertEqual(len(parse_transactions(str(path))), 1)

    def test_header_only_file_is_empty_not_an_error(self):
        path = self.write("date,amount,description\n")
        self.assertEqual(parse_transactions(path), [])

    def test_tolerates_header_case_spacing_and_bom(self):
        path = self.write(
            "﻿ Date , AMOUNT , Description \n2026-03-04,1.00,x\n"
        )
        self.assertEqual(len(parse_transactions(path)), 1)

    def test_tolerates_crlf_line_endings(self):
        path = self.write(
            "date,amount,description\r\n2026-03-04,-7.50,Coffee shop\r\n"
        )
        self.assertEqual(
            parse_transactions(path),
            [Transaction(date(2026, 3, 4), Decimal("-7.50"), "Coffee shop")],
        )

    def test_quoted_description_keeps_commas_and_newlines(self):
        path = self.write(
            'date,amount,description\n'
            '2026-03-04,-7.50,"Coffee, tea\nand cake"\n'
            '2026-03-05,1.00,after\n'
        )
        transactions = parse_transactions(path)
        self.assertEqual(transactions[0].description, "Coffee, tea\nand cake")
        self.assertEqual(transactions[1].description, "after")

    def test_zero_byte_file_reports_missing_header_at_line_1(self):
        path = self.write("")
        with self.assertRaises(ParseError) as caught:
            parse_transactions(path)
        self.assertEqual(caught.exception.line, 1)
        self.assertEqual(
            caught.exception.message,
            "expected header 'date,amount,description'",
        )

    def test_missing_header_reports_line_1(self):
        path = self.write("2026-03-04,-7.50,Coffee shop\n")
        with self.assertRaises(ParseError) as caught:
            parse_transactions(path)
        self.assertEqual(caught.exception.line, 1)
        self.assertIn("expected header", caught.exception.message)

    def test_first_data_row_is_line_2(self):
        path = self.write("date,amount,description\nnope,-7.50,Coffee\n")
        with self.assertRaises(ParseError) as caught:
            parse_transactions(path)
        self.assertEqual(caught.exception.line, 2)
        self.assertEqual(caught.exception.message, "unparseable date: 'nope'")

    def test_wrong_column_count(self):
        path = self.write(
            "date,amount,description\n"
            "2026-03-04,-7.50,Coffee shop\n"
            "2026-03-05,-900.00\n"
        )
        with self.assertRaises(ParseError) as caught:
            parse_transactions(path)
        self.assertEqual(caught.exception.line, 3)
        self.assertEqual(caught.exception.message, "expected 3 columns, got 2")

    def test_blank_line_between_rows_is_a_column_count_error(self):
        path = self.write("date,amount,description\n\n2026-03-04,1.00,x\n")
        with self.assertRaises(ParseError) as caught:
            parse_transactions(path)
        self.assertEqual(caught.exception.line, 2)
        self.assertEqual(caught.exception.message, "expected 3 columns, got 0")

    def test_bad_amount_reports_its_line(self):
        path = self.write(
            "date,amount,description\n"
            "2026-03-04,-7.50,Coffee shop\n"
            "2026-03-05,1.005,Rent\n"
        )
        with self.assertRaises(ParseError) as caught:
            parse_transactions(path)
        self.assertEqual(caught.exception.line, 3)
        self.assertIn("more than two fractional digits", caught.exception.message)

    def test_line_number_accounts_for_embedded_newlines(self):
        path = self.write(
            'date,amount,description\n'
            '2026-03-04,-7.50,"two\nlines"\n'
            '2026-03-05,oops,Rent\n'
        )
        with self.assertRaises(ParseError) as caught:
            parse_transactions(path)
        self.assertEqual(caught.exception.line, 4)

    def test_only_the_first_bad_row_is_reported(self):
        path = self.write(
            "date,amount,description\n"
            "2026-03-04,oops,first\n"
            "2026-03-05,alsobad,second\n"
        )
        with self.assertRaises(ParseError) as caught:
            parse_transactions(path)
        self.assertEqual(caught.exception.line, 2)

    def test_missing_file_raises_oserror(self):
        with self.assertRaises(OSError):
            parse_transactions(self.dir / "nope.csv")

    def test_non_utf8_file_raises_unicodedecodeerror(self):
        path = self.dir / "latin.csv"
        path.write_bytes(b"date,amount,description\n2026-03-04,1.00,caf\xe9\n")
        with self.assertRaises(UnicodeDecodeError):
            parse_transactions(path)
```

- [ ] **Step 2: Run test to verify it fails**

Run: `python3 -m unittest test_parse -v`
Expected: FAIL — `ImportError: cannot import name 'HEADER' from 'ledgerlite.parse'`

- [ ] **Step 3: Write the minimal implementation**

In `ledgerlite/parse.py`, extend the imports. The full import block becomes:

```python
from __future__ import annotations

import csv
import os
import re
from datetime import date, datetime
from decimal import Decimal
from typing import Sequence

from .model import Transaction
```

Add after the module-level regexes:

```python
HEADER = ["date", "amount", "description"]
_HEADER_MESSAGE = "expected header 'date,amount,description'"
```

Append at the end of the file. `reader.line_num` is an attribute that advances as you iterate and counts *file* lines, so it stays correct even when a quoted description contains a newline — read it once per row, before doing anything that can raise:

```python
def parse_transactions(path: str | os.PathLike[str]) -> list[Transaction]:
    """Read a transactions CSV in file order.

    `utf-8-sig` strips a leading BOM if there is one; `newline=""` hands
    line-ending and embedded-newline handling to the csv module, which is
    also what keeps `reader.line_num` equal to the real file line.
    """
    with open(path, newline="", encoding="utf-8-sig") as handle:
        reader = csv.reader(handle)
        transactions: list[Transaction] = []
        header_seen = False
        for row in reader:
            line = reader.line_num
            if not header_seen:
                if [cell.strip().lower() for cell in row] != HEADER:
                    raise ParseError(line, _HEADER_MESSAGE)
                header_seen = True
                continue
            transactions.append(_row_to_transaction(row, line))
        if not header_seen:
            raise ParseError(1, _HEADER_MESSAGE)
        return transactions


def _row_to_transaction(row: Sequence[str], line: int) -> Transaction:
    if len(row) != len(HEADER):
        raise ParseError(line, f"expected {len(HEADER)} columns, got {len(row)}")
    date_text, amount_text, description = row
    try:
        return Transaction(
            date=parse_date(date_text),
            amount=parse_amount(amount_text),
            description=description,
        )
    except ValueError as exc:
        raise ParseError(line, str(exc)) from None
```

- [ ] **Step 4: Run test to verify it passes**

Run: `python3 -m unittest test_parse -v`
Expected: PASS, all tests OK.

- [ ] **Step 5: Commit**

```bash
git add ledgerlite/parse.py test_parse.py
git commit -m "feat: read transactions CSV files with per-line error reporting"
```

---

### Task 3: Rules parsing and categorization

**Files:**
- Create: `ledgerlite/rules.py`
- Test: `test_rules.py`

**Interfaces:**
- Consumes: `ParseError(line, message)` from `ledgerlite.parse`.
- Produces:
  - `ledgerlite.rules.Rule` — type alias for `tuple[str, str]`: `(lowercased_substring, category)`.
  - `ledgerlite.rules.parse_rules(text: str) -> list[Rule]` — preserves file order; skips blank and `#` lines; raises `ParseError`.
  - `ledgerlite.rules.categorize(description: str, rules: Sequence[Rule]) -> str | None` — first match wins, case-insensitive; `None` when nothing matches.

- [ ] **Step 1: Write the failing test**

Create `test_rules.py`:

```python
"""Tests for ledgerlite.rules."""

from __future__ import annotations

import unittest

from ledgerlite.parse import ParseError
from ledgerlite.rules import categorize, parse_rules


class ParseRulesTest(unittest.TestCase):
    def test_parses_rules_in_order_with_lowercased_substrings(self):
        self.assertEqual(
            parse_rules("Coffee=food\nRENT=housing\n"),
            [("coffee", "food"), ("rent", "housing")],
        )

    def test_empty_text_is_no_rules(self):
        self.assertEqual(parse_rules(""), [])
        self.assertEqual(parse_rules("\n\n"), [])

    def test_skips_blank_and_comment_lines(self):
        text = "# groceries first\n\n  coffee=food\n  # trailing note\n"
        self.assertEqual(parse_rules(text), [("coffee", "food")])

    def test_strips_whitespace_around_both_sides(self):
        self.assertEqual(parse_rules("  coffee  =  food  \n"), [("coffee", "food")])

    def test_splits_on_the_first_equals_only(self):
        self.assertEqual(parse_rules("a=b=c\n"), [("a", "b=c")])

    def test_missing_equals_is_a_parse_error_with_its_line(self):
        with self.assertRaises(ParseError) as caught:
            parse_rules("coffee=food\nrent housing\n")
        self.assertEqual(caught.exception.line, 2)
        self.assertIn("missing '='", caught.exception.message)

    def test_empty_substring_is_a_parse_error(self):
        with self.assertRaises(ParseError) as caught:
            parse_rules("=food\n")
        self.assertEqual(caught.exception.line, 1)
        self.assertEqual(caught.exception.message, "rule has an empty substring")

    def test_empty_category_is_a_parse_error(self):
        with self.assertRaises(ParseError) as caught:
            parse_rules("coffee=\n")
        self.assertEqual(caught.exception.line, 1)
        self.assertEqual(caught.exception.message, "rule has an empty category")

    def test_comment_line_numbers_still_count(self):
        with self.assertRaises(ParseError) as caught:
            parse_rules("# note\n\nbroken\n")
        self.assertEqual(caught.exception.line, 3)


class CategorizeTest(unittest.TestCase):
    def test_substring_match_is_case_insensitive_both_ways(self):
        rules = parse_rules("COFFEE=food\n")
        self.assertEqual(categorize("Morning Coffee Shop", rules), "food")
        self.assertEqual(categorize("COFFEE", rules), "food")

    def test_first_matching_rule_wins(self):
        rules = parse_rules("coffee=food\ncoffee=treats\nshop=retail\n")
        self.assertEqual(categorize("coffee shop", rules), "food")

    def test_no_match_returns_none(self):
        self.assertIsNone(categorize("Salary", parse_rules("coffee=food\n")))

    def test_no_rules_returns_none(self):
        self.assertIsNone(categorize("anything", []))

    def test_empty_description_returns_none(self):
        self.assertIsNone(categorize("", parse_rules("coffee=food\n")))

    def test_category_case_is_preserved(self):
        self.assertEqual(categorize("coffee", parse_rules("coffee=Food\n")), "Food")


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run test to verify it fails**

Run: `python3 -m unittest test_rules -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'ledgerlite.rules'`

- [ ] **Step 3: Write the minimal implementation**

Create `ledgerlite/rules.py`:

```python
"""Turn a rules file into rules, and apply them to descriptions."""

from __future__ import annotations

from typing import Sequence

from .parse import ParseError

Rule = tuple[str, str]


def parse_rules(text: str) -> list[Rule]:
    """Parse `<substring>=<category>` lines, keeping file order.

    Substrings are lowercased once here so matching stays cheap; categories
    keep their original case because they are printed.
    """
    rules: list[Rule] = []
    for number, raw in enumerate(text.splitlines(), start=1):
        line = raw.strip()
        if not line or line.startswith("#"):
            continue
        if "=" not in line:
            raise ParseError(number, f"rule missing '=': {line!r}")
        substring, category = (part.strip() for part in line.split("=", 1))
        if not substring:
            raise ParseError(number, "rule has an empty substring")
        if not category:
            raise ParseError(number, "rule has an empty category")
        rules.append((substring.lower(), category))
    return rules


def categorize(description: str, rules: Sequence[Rule]) -> str | None:
    """Return the first matching rule's category, or None."""
    lowered = description.lower()
    for substring, category in rules:
        if substring in lowered:
            return category
    return None
```

- [ ] **Step 4: Run test to verify it passes**

Run: `python3 -m unittest test_rules -v`
Expected: PASS, all tests OK.

- [ ] **Step 5: Run the whole suite**

Run: `python3 -m unittest`
Expected: PASS — Task 1, 2 and 3 tests all OK.

- [ ] **Step 6: Commit**

```bash
git add ledgerlite/rules.py test_rules.py
git commit -m "feat: add rules parsing and case-insensitive categorization"
```

---

### Task 4: Date ordering and closing balance

**Files:**
- Create: `ledgerlite/balance.py`
- Test: `test_balance.py`

**Interfaces:**
- Consumes: `Transaction` from `ledgerlite.model`.
- Produces:
  - `ledgerlite.balance.order_transactions(transactions: Sequence[Transaction]) -> list[Transaction]` — sorted by date, stable, so ties keep input order. Never mutates its argument.
  - `ledgerlite.balance.closing_balance(opening: Decimal, transactions: Sequence[Transaction]) -> Decimal` — opening plus each amount in date order.

- [ ] **Step 1: Write the failing test**

Create `test_balance.py`:

```python
"""Tests for ledgerlite.balance."""

from __future__ import annotations

import unittest
from datetime import date
from decimal import Decimal

from ledgerlite.balance import closing_balance, order_transactions
from ledgerlite.model import Transaction


def txn(day: int, amount: str, description: str = "x") -> Transaction:
    return Transaction(date(2026, 3, day), Decimal(amount), description)


class OrderTransactionsTest(unittest.TestCase):
    def test_sorts_by_date(self):
        rows = [txn(9, "1.00", "c"), txn(4, "2.00", "a"), txn(7, "3.00", "b")]
        self.assertEqual(
            [t.description for t in order_transactions(rows)], ["a", "b", "c"]
        )

    def test_same_date_keeps_input_order(self):
        rows = [
            txn(4, "1.00", "first"),
            txn(4, "2.00", "second"),
            txn(3, "3.00", "earlier"),
            txn(4, "4.00", "third"),
        ]
        self.assertEqual(
            [t.description for t in order_transactions(rows)],
            ["earlier", "first", "second", "third"],
        )

    def test_does_not_mutate_the_input(self):
        rows = [txn(9, "1.00", "c"), txn(4, "2.00", "a")]
        order_transactions(rows)
        self.assertEqual([t.description for t in rows], ["c", "a"])

    def test_empty_input(self):
        self.assertEqual(order_transactions([]), [])


class ClosingBalanceTest(unittest.TestCase):
    def test_adds_every_amount_to_the_opening(self):
        rows = [txn(4, "-7.50"), txn(5, "-900.00"), txn(6, "2500.00")]
        self.assertEqual(closing_balance(Decimal("100"), rows), Decimal("1692.50"))

    def test_no_transactions_returns_the_opening(self):
        self.assertEqual(closing_balance(Decimal("100.00"), []), Decimal("100.00"))
        self.assertEqual(closing_balance(Decimal("0"), []), Decimal("0"))

    def test_result_is_decimal_and_exact(self):
        rows = [txn(4, "0.10"), txn(5, "0.20")]
        total = closing_balance(Decimal("0"), rows)
        self.assertIsInstance(total, Decimal)
        self.assertEqual(total, Decimal("0.30"))

    def test_input_order_does_not_change_the_result(self):
        rows = [txn(6, "2500.00"), txn(4, "-7.50"), txn(5, "-900.00")]
        self.assertEqual(closing_balance(Decimal("100"), rows), Decimal("1692.50"))


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run test to verify it fails**

Run: `python3 -m unittest test_balance -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'ledgerlite.balance'`

- [ ] **Step 3: Write the minimal implementation**

Create `ledgerlite/balance.py`:

```python
"""Date ordering and the running balance."""

from __future__ import annotations

from decimal import Decimal
from typing import Sequence

from .model import Transaction


def order_transactions(transactions: Sequence[Transaction]) -> list[Transaction]:
    """Order by date. `sorted` is stable, so same-date rows keep input order."""
    return sorted(transactions, key=lambda txn: txn.date)


def closing_balance(
    opening: Decimal, transactions: Sequence[Transaction]
) -> Decimal:
    """Walk the transactions in date order, adding each amount to the balance."""
    balance = opening
    for txn in order_transactions(transactions):
        balance += txn.amount
    return balance
```

- [ ] **Step 4: Run test to verify it passes**

Run: `python3 -m unittest test_balance -v`
Expected: PASS, all tests OK.

- [ ] **Step 5: Commit**

```bash
git add ledgerlite/balance.py test_balance.py
git commit -m "feat: add date ordering and closing balance"
```

---

### Task 5: Per-category totals and report text

**Files:**
- Create: `ledgerlite/report.py`
- Test: `test_report.py`

**Interfaces:**
- Consumes: `Transaction`; `Rule`, `categorize`; `order_transactions`, `closing_balance`.
- Produces:
  - `ledgerlite.report.UNCATEGORIZED: str` — `"uncategorized"`.
  - `ledgerlite.report.format_amount(value: Decimal) -> str` — two fractional digits, no separators, never `-0.00`.
  - `ledgerlite.report.category_totals(transactions, rules) -> dict[str, Decimal]` — keys in print order: categories case-insensitively alphabetical, `uncategorized` last if present.
  - `ledgerlite.report.format_report(transactions, rules, opening: Decimal) -> str` — the whole report, ending in exactly one `\n`.

- [ ] **Step 1: Write the failing test**

Create `test_report.py`:

```python
"""Tests for ledgerlite.report."""

from __future__ import annotations

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
from ledgerlite.rules import parse_rules


def txn(day: int, amount: str, description: str) -> Transaction:
    return Transaction(date(2026, 3, day), Decimal(amount), description)


class FormatAmountTest(unittest.TestCase):
    def test_two_fractional_digits_always(self):
        self.assertEqual(format_amount(Decimal("0")), "0.00")
        self.assertEqual(format_amount(Decimal("1.5")), "1.50")
        self.assertEqual(format_amount(Decimal("-12.5")), "-12.50")
        self.assertEqual(format_amount(Decimal("1200")), "1200.00")

    def test_no_thousands_separators(self):
        self.assertEqual(format_amount(Decimal("1234567.89")), "1234567.89")

    def test_negative_zero_prints_as_zero(self):
        self.assertEqual(format_amount(Decimal("-0.00")), "0.00")
        self.assertEqual(format_amount(Decimal("0.00") - Decimal("0.00")), "0.00")


class CategoryTotalsTest(unittest.TestCase):
    def setUp(self):
        self.rules = parse_rules("coffee=food\nrent=housing\n")

    def test_sums_per_category(self):
        rows = [
            txn(4, "-7.50", "Coffee shop"),
            txn(5, "-2.50", "coffee beans"),
            txn(6, "-900.00", "Rent March"),
        ]
        self.assertEqual(
            category_totals(rows, self.rules),
            {"food": Decimal("-10.00"), "housing": Decimal("-900.00")},
        )

    def test_uncategorized_bucket_is_last(self):
        rows = [
            txn(4, "2500.00", "Salary"),
            txn(5, "-900.00", "Rent March"),
            txn(6, "-7.50", "Coffee shop"),
        ]
        totals = category_totals(rows, self.rules)
        self.assertEqual(list(totals), ["food", "housing", UNCATEGORIZED])
        self.assertEqual(totals[UNCATEGORIZED], Decimal("2500.00"))

    def test_categories_are_alphabetical_ignoring_case(self):
        rules = parse_rules("a=Zebra\nb=apple\nc=Mango\n")
        rows = [txn(4, "1.00", "a"), txn(5, "1.00", "b"), txn(6, "1.00", "c")]
        self.assertEqual(list(category_totals(rows, rules)), ["apple", "Mango", "Zebra"])

    def test_rule_category_named_uncategorized_merges_and_stays_last(self):
        rules = parse_rules("mystery=uncategorized\nrent=housing\n")
        rows = [
            txn(4, "1.00", "Mystery charge"),
            txn(5, "2.00", "Unknown thing"),
            txn(6, "-900.00", "Rent March"),
        ]
        totals = category_totals(rows, rules)
        self.assertEqual(list(totals), ["housing", UNCATEGORIZED])
        self.assertEqual(totals[UNCATEGORIZED], Decimal("3.00"))

    def test_no_rules_means_everything_uncategorized(self):
        rows = [txn(4, "-7.50", "Coffee shop"), txn(5, "1.00", "x")]
        self.assertEqual(category_totals(rows, []), {UNCATEGORIZED: Decimal("-6.50")})

    def test_no_transactions_means_no_categories(self):
        self.assertEqual(category_totals([], self.rules), {})


class FormatReportTest(unittest.TestCase):
    def test_matches_the_design_example(self):
        rules = parse_rules("coffee=food\nrent=housing\n")
        rows = [
            txn(6, "2500.00", "Salary"),
            txn(4, "-7.50", "Coffee shop"),
            txn(5, "-900.00", "Rent March"),
        ]
        self.assertEqual(
            format_report(rows, rules, Decimal("100")),
            "food: -7.50\n"
            "housing: -900.00\n"
            "uncategorized: 2500.00\n"
            "\n"
            "closing balance: 1692.50\n",
        )

    def test_no_transactions_prints_only_the_closing_balance(self):
        self.assertEqual(
            format_report([], [], Decimal("100")),
            "\nclosing balance: 100.00\n",
        )

    def test_zero_opening_and_no_transactions(self):
        self.assertEqual(format_report([], [], Decimal("0")), "\nclosing balance: 0.00\n")

    def test_category_total_of_exactly_zero_prints_zero(self):
        rules = parse_rules("coffee=food\n")
        rows = [txn(4, "-7.50", "Coffee shop"), txn(5, "7.50", "Coffee refund")]
        self.assertEqual(
            format_report(rows, rules, Decimal("0")),
            "food: 0.00\n\nclosing balance: 0.00\n",
        )

    def test_ends_with_exactly_one_newline(self):
        text = format_report([txn(4, "1.00", "x")], [], Decimal("0"))
        self.assertTrue(text.endswith("\n"))
        self.assertFalse(text.endswith("\n\n"))


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run test to verify it fails**

Run: `python3 -m unittest test_report -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'ledgerlite.report'`

- [ ] **Step 3: Write the minimal implementation**

Create `ledgerlite/report.py`:

```python
"""Per-category totals and the printed report."""

from __future__ import annotations

from decimal import ROUND_HALF_UP, Decimal
from typing import Sequence

from .balance import closing_balance, order_transactions
from .model import Transaction
from .rules import Rule, categorize

UNCATEGORIZED = "uncategorized"
_CENTS = Decimal("0.01")


def format_amount(value: Decimal) -> str:
    """Two fractional digits, no separators, and no `-0.00`."""
    quantized = value.quantize(_CENTS, rounding=ROUND_HALF_UP)
    if quantized == 0:
        quantized = Decimal("0.00")
    return f"{quantized:f}"


def category_totals(
    transactions: Sequence[Transaction], rules: Sequence[Rule]
) -> dict[str, Decimal]:
    """Sum amounts per category, keyed in the order they are printed.

    A rule whose category is literally `uncategorized` lands in the same
    bucket as the unmatched transactions, which is always printed last.
    """
    totals: dict[str, Decimal] = {}
    for txn in transactions:
        name = categorize(txn.description, rules) or UNCATEGORIZED
        totals[name] = totals.get(name, Decimal("0")) + txn.amount

    named = sorted(
        (name for name in totals if name != UNCATEGORIZED),
        key=lambda name: (name.lower(), name),
    )
    ordered = {name: totals[name] for name in named}
    if UNCATEGORIZED in totals:
        ordered[UNCATEGORIZED] = totals[UNCATEGORIZED]
    return ordered


def format_report(
    transactions: Sequence[Transaction],
    rules: Sequence[Rule],
    opening: Decimal,
) -> str:
    """Render the whole report, newline-terminated."""
    ordered = order_transactions(transactions)
    lines = [
        f"{name}: {format_amount(total)}"
        for name, total in category_totals(ordered, rules).items()
    ]
    lines.append("")
    lines.append(f"closing balance: {format_amount(closing_balance(opening, ordered))}")
    return "\n".join(lines) + "\n"
```

- [ ] **Step 4: Run test to verify it passes**

Run: `python3 -m unittest test_report -v`
Expected: PASS, all tests OK.

- [ ] **Step 5: Commit**

```bash
git add ledgerlite/report.py test_report.py
git commit -m "feat: add per-category totals and report formatting"
```

---

### Task 6: CLI, exit codes, and error messages

**Files:**
- Create: `ledgerlite/cli.py`
- Create: `ledgerlite/__main__.py`
- Test: `test_cli.py`

**Interfaces:**
- Consumes: `ParseError`, `parse_amount`, `parse_transactions`; `parse_rules`; `format_report`.
- Produces: `ledgerlite.cli.main(argv: Sequence[str] | None = None) -> int`.

Behavior contract:

| Situation | stdout | stderr | return |
| --- | --- | --- | --- |
| success | report text | empty | `0` |
| transactions or rules path unreadable / a directory / not UTF-8 | empty | `ledgerlite: cannot read <path>: <reason>` | `1` |
| malformed row or malformed rules line | empty | `ledgerlite: <path>:<line>: <what is wrong>` | `2` |
| bad `--opening`, missing/unknown subcommand | empty | argparse usage | `2` (via `SystemExit`) |

The rules file is read *before* the transactions file, so a broken rules file is reported even when the CSV is also broken.

- [ ] **Step 1: Write the failing test**

Create `test_cli.py`:

```python
"""End-to-end tests for the ledgerlite CLI."""

from __future__ import annotations

import contextlib
import io
import tempfile
import unittest
from pathlib import Path

from ledgerlite.cli import main

TXNS = (
    "date,amount,description\n"
    "2026-03-06,2500.00,Salary March\n"
    "2026-03-04,-7.50,Coffee shop\n"
    "2026-03-05,-900.00,Rent March\n"
)
RULES = "coffee=food\nrent=housing\n"


class CliTestCase(unittest.TestCase):
    def setUp(self):
        self._tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self._tmp.cleanup)
        self.dir = Path(self._tmp.name)

    def write(self, name: str, text: str) -> Path:
        path = self.dir / name
        path.write_text(text, encoding="utf-8", newline="")
        return path

    def run_cli(self, *argv: str) -> tuple[int, str, str]:
        out, err = io.StringIO(), io.StringIO()
        with contextlib.redirect_stdout(out), contextlib.redirect_stderr(err):
            code = main(list(argv))
        return code, out.getvalue(), err.getvalue()

    def run_cli_expecting_exit(self, *argv: str) -> tuple[int, str, str]:
        out, err = io.StringIO(), io.StringIO()
        with contextlib.redirect_stdout(out), contextlib.redirect_stderr(err):
            with self.assertRaises(SystemExit) as caught:
                main(list(argv))
        code = caught.exception.code
        return (code if isinstance(code, int) else 1), out.getvalue(), err.getvalue()


class SuccessTest(CliTestCase):
    def test_design_example(self):
        txns = self.write("txns.csv", TXNS)
        rules = self.write("rules.txt", RULES)
        code, out, err = self.run_cli(
            "report", str(txns), "--rules", str(rules), "--opening", "100"
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
        txns = self.write("txns.csv", TXNS)
        code, out, _ = self.run_cli("report", str(txns), "--rules", str(self.write("r.txt", RULES)))
        self.assertEqual(code, 0)
        self.assertIn("closing balance: 1592.50\n", out)

    def test_without_rules_everything_is_uncategorized(self):
        txns = self.write("txns.csv", TXNS)
        code, out, _ = self.run_cli("report", str(txns))
        self.assertEqual(code, 0)
        self.assertEqual(out, "uncategorized: 1592.50\n\nclosing balance: 1592.50\n")

    def test_header_only_file_prints_the_opening_balance(self):
        txns = self.write("empty.csv", "date,amount,description\n")
        code, out, err = self.run_cli("report", str(txns), "--opening", "42.50")
        self.assertEqual(code, 0)
        self.assertEqual(err, "")
        self.assertEqual(out, "\nclosing balance: 42.50\n")

    def test_negative_opening_is_accepted(self):
        txns = self.write("empty.csv", "date,amount,description\n")
        code, out, _ = self.run_cli("report", str(txns), "--opening", "-12.50")
        self.assertEqual(code, 0)
        self.assertEqual(out, "\nclosing balance: -12.50\n")


class UnreadableInputTest(CliTestCase):
    def test_missing_transactions_file(self):
        missing = self.dir / "nope.csv"
        code, out, err = self.run_cli("report", str(missing))
        self.assertEqual(code, 1)
        self.assertEqual(out, "")
        self.assertEqual(
            err, f"ledgerlite: cannot read {missing}: No such file or directory\n"
        )

    def test_directory_instead_of_file(self):
        code, out, err = self.run_cli("report", str(self.dir))
        self.assertEqual(code, 1)
        self.assertEqual(out, "")
        self.assertTrue(err.startswith(f"ledgerlite: cannot read {self.dir}: "))

    def test_missing_rules_file(self):
        txns = self.write("txns.csv", TXNS)
        missing = self.dir / "nope.txt"
        code, out, err = self.run_cli("report", str(txns), "--rules", str(missing))
        self.assertEqual(code, 1)
        self.assertEqual(out, "")
        self.assertEqual(
            err, f"ledgerlite: cannot read {missing}: No such file or directory\n"
        )

    def test_non_utf8_transactions_file(self):
        path = self.dir / "latin.csv"
        path.write_bytes(b"date,amount,description\n2026-03-04,1.00,caf\xe9\n")
        code, out, err = self.run_cli("report", str(path))
        self.assertEqual(code, 1)
        self.assertEqual(out, "")
        self.assertEqual(err, f"ledgerlite: cannot read {path}: invalid UTF-8\n")


class MalformedInputTest(CliTestCase):
    def test_bad_amount_reports_path_line_and_reason(self):
        txns = self.write(
            "txns.csv",
            "date,amount,description\n"
            "2026-03-04,-7.50,Coffee shop\n"
            "2026-03-05,1.005,Rent March\n",
        )
        code, out, err = self.run_cli("report", str(txns))
        self.assertEqual(code, 2)
        self.assertEqual(out, "")
        self.assertEqual(
            err,
            f"ledgerlite: {txns}:3: amount has more than two fractional "
            "digits: '1.005'\n",
        )

    def test_wrong_column_count(self):
        txns = self.write(
            "txns.csv", "date,amount,description\n2026-03-04,-7.50\n"
        )
        code, out, err = self.run_cli("report", str(txns))
        self.assertEqual(code, 2)
        self.assertEqual(out, "")
        self.assertEqual(err, f"ledgerlite: {txns}:2: expected 3 columns, got 2\n")

    def test_missing_header(self):
        txns = self.write("txns.csv", "2026-03-04,-7.50,Coffee shop\n")
        code, out, err = self.run_cli("report", str(txns))
        self.assertEqual(code, 2)
        self.assertEqual(out, "")
        self.assertEqual(
            err,
            f"ledgerlite: {txns}:1: expected header 'date,amount,description'\n",
        )

    def test_empty_file(self):
        txns = self.write("txns.csv", "")
        code, out, err = self.run_cli("report", str(txns))
        self.assertEqual(code, 2)
        self.assertEqual(out, "")
        self.assertIn(f"{txns}:1:", err)

    def test_only_the_first_bad_row_is_reported(self):
        txns = self.write(
            "txns.csv",
            "date,amount,description\n"
            "2026-03-04,oops,first\n"
            "2026-03-05,alsobad,second\n",
        )
        code, out, err = self.run_cli("report", str(txns))
        self.assertEqual(code, 2)
        self.assertEqual(out, "")
        self.assertEqual(err.count("\n"), 1)
        self.assertIn(f"{txns}:2:", err)

    def test_malformed_rules_line(self):
        txns = self.write("txns.csv", TXNS)
        rules = self.write("rules.txt", "coffee=food\nrent housing\n")
        code, out, err = self.run_cli("report", str(txns), "--rules", str(rules))
        self.assertEqual(code, 2)
        self.assertEqual(out, "")
        self.assertEqual(
            err, f"ledgerlite: {rules}:2: rule missing '=': 'rent housing'\n"
        )

    def test_broken_rules_reported_before_broken_transactions(self):
        txns = self.write("txns.csv", "date,amount,description\n2026-03-04,oops,x\n")
        rules = self.write("rules.txt", "broken\n")
        code, _, err = self.run_cli("report", str(txns), "--rules", str(rules))
        self.assertEqual(code, 2)
        self.assertIn(str(rules), err)
        self.assertNotIn(str(txns), err)


class UsageTest(CliTestCase):
    def test_bad_opening_is_a_usage_error(self):
        txns = self.write("txns.csv", TXNS)
        for bad in ("abc", "1.005", "1e2"):
            with self.subTest(opening=bad):
                code, out, err = self.run_cli_expecting_exit(
                    "report", str(txns), "--opening", bad
                )
                self.assertEqual(code, 2)
                self.assertEqual(out, "")
                self.assertIn("usage:", err)

    def test_missing_subcommand_is_a_usage_error(self):
        code, out, _ = self.run_cli_expecting_exit()
        self.assertEqual(code, 2)
        self.assertEqual(out, "")

    def test_unknown_subcommand_is_a_usage_error(self):
        code, _, _ = self.run_cli_expecting_exit("summarize", "x.csv")
        self.assertEqual(code, 2)

    def test_missing_transactions_argument_is_a_usage_error(self):
        code, _, _ = self.run_cli_expecting_exit("report")
        self.assertEqual(code, 2)


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run test to verify it fails**

Run: `python3 -m unittest test_cli -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'ledgerlite.cli'`

- [ ] **Step 3: Write the minimal implementation**

Create `ledgerlite/cli.py`:

```python
"""Command-line entry point."""

from __future__ import annotations

import argparse
import sys
from decimal import Decimal
from pathlib import Path
from typing import Sequence

from .parse import ParseError, parse_amount, parse_transactions
from .report import format_report
from .rules import Rule, parse_rules

PROG = "ledgerlite"


def _opening_amount(text: str) -> Decimal:
    try:
        return parse_amount(text)
    except ValueError as exc:
        raise argparse.ArgumentTypeError(str(exc)) from None


def _build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog=PROG, description="Categorize bank transactions and summarize them."
    )
    subparsers = parser.add_subparsers(dest="command", required=True)
    report = subparsers.add_parser("report", help="print a categorized report")
    report.add_argument("transactions", help="path to the transactions CSV")
    report.add_argument("--rules", help="path to a <substring>=<category> rules file")
    report.add_argument(
        "--opening",
        type=_opening_amount,
        default=Decimal("0"),
        help="opening balance (default: 0)",
    )
    return parser


def _report_unreadable(path: str, exc: Exception) -> int:
    if isinstance(exc, UnicodeDecodeError):
        reason = "invalid UTF-8"
    else:
        reason = getattr(exc, "strerror", None) or str(exc)
    print(f"{PROG}: cannot read {path}: {reason}", file=sys.stderr)
    return 1


def _report_malformed(path: str, exc: ParseError) -> int:
    print(f"{PROG}: {path}:{exc.line}: {exc.message}", file=sys.stderr)
    return 2


def main(argv: Sequence[str] | None = None) -> int:
    args = _build_parser().parse_args(argv)

    rules: list[Rule] = []
    if args.rules:
        try:
            rules = parse_rules(Path(args.rules).read_text(encoding="utf-8-sig"))
        except (OSError, UnicodeDecodeError) as exc:
            return _report_unreadable(args.rules, exc)
        except ParseError as exc:
            return _report_malformed(args.rules, exc)

    try:
        transactions = parse_transactions(args.transactions)
    except (OSError, UnicodeDecodeError) as exc:
        return _report_unreadable(args.transactions, exc)
    except ParseError as exc:
        return _report_malformed(args.transactions, exc)

    sys.stdout.write(format_report(transactions, rules, args.opening))
    return 0
```

Create `ledgerlite/__main__.py`:

```python
"""Allow `python3 -m ledgerlite`."""

import sys

from .cli import main

sys.exit(main())
```

- [ ] **Step 4: Run test to verify it passes**

Run: `python3 -m unittest test_cli -v`
Expected: PASS, all tests OK.

- [ ] **Step 5: Run the whole suite**

Run: `python3 -m unittest`
Expected: PASS — every test from Tasks 1–6, zero failures, zero errors.

- [ ] **Step 6: Check the real command end to end**

```bash
printf 'date,amount,description\n2026-03-06,2500.00,Salary March\n2026-03-04,-7.50,Coffee shop\n2026-03-05,-900.00,Rent March\n' > /tmp/ledgerlite-txns.csv
printf 'coffee=food\nrent=housing\n' > /tmp/ledgerlite-rules.txt
python3 -m ledgerlite report /tmp/ledgerlite-txns.csv --rules /tmp/ledgerlite-rules.txt --opening 100
echo "exit=$?"
python3 -m ledgerlite report /tmp/nope.csv; echo "exit=$?"
```

Expected: the design's example report then `exit=0`; then
`ledgerlite: cannot read /tmp/nope.csv: No such file or directory` on stderr and `exit=1`.

- [ ] **Step 7: Commit**

```bash
git add ledgerlite/cli.py ledgerlite/__main__.py test_cli.py
git commit -m "feat: add report CLI with exit codes and error messages"
```

---

## Done when

- `python3 -m unittest` passes with no failures or errors.
- `python3 -m ledgerlite report <csv> --rules <rules> --opening 100` reproduces the design's example output byte for byte.
- Every exit code in the Global Constraints table is exercised by a test in `test_cli.py`.
- No file imports anything outside the standard library.
