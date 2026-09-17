# ledgerlite Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `ledgerlite`, a stdlib-only Python CLI that reads a transactions CSV, categorizes each row from a rules file, and prints per-category totals plus the closing balance.

**Architecture:** Five small pure modules — `model` (the `Transaction` record), `parse` (text → transactions, raising `ParseError`), `rules` (rules text → rule list, plus `categorize`), `balance` (date-ordered running/closing balance), `report` (per-category totals and formatting) — wrapped by a thin `cli` module that does all file I/O, error messages, and exit codes. Every module below `cli` takes strings/objects in and returns values out, so all of it is unit-testable without touching the filesystem; `cli` is the only place that knows about paths, stdout, stderr, and process exit codes.

**Tech Stack:** Python 3.11+, standard library only (`argparse`, `csv`, `dataclasses`, `datetime`, `decimal`, `re`, `unittest`). No third-party packages, no packaging metadata.

**Spec:** `design.md` (repo root)

## Global Constraints

- Python 3.11+. Standard library only — no dependencies, no `pyproject.toml`, no virtualenv setup.
- Money is `decimal.Decimal` everywhere. Never `float`. Never construct a `Decimal` from a `float`.
- Package lives at repo root as `ledgerlite/` with modules exactly: `__init__.py`, `model.py`, `parse.py`, `rules.py`, `balance.py`, `report.py`, `cli.py` (plus `__main__.py`, see Task 5).
- Tests live at the repo root as `test_<module>.py` and run with `python3 -m unittest`.
- All amounts printed with exactly two fractional digits, leading `-` for negatives, no thousands separators.
- Error messages are exactly: `ledgerlite: cannot read <path>: <reason>` (exit 1) and `ledgerlite: <path>:<line>: <what is wrong>` (exit 2). Both go to stderr. On exit 2, stdout gets nothing.
- Work directly on `main`; this scratch repo has no remote. Commit after every task.

## Decisions the spec left open

The spec is silent on these; the plan picks a behavior and pins it with a test. Anyone reviewing should check the choice, not just the code.

1. **Header row must match.** Line 1 must be `date,amount,description` (each field stripped, compared case-insensitively). Anything else — including a completely empty file — is a malformed-file error at line 1 (exit 2).
2. **Blank line inside the CSV** is a row with 0 columns → malformed (exit 2). A trailing newline at end of file is not a row and is fine.
3. **Amount grammar is strict:** `^[+-]?\d+(\.\d+)?$`, then at most two fractional digits. This rejects `1e2`, `NaN`, `Infinity`, `.5`, `1.`, and the empty string as "not a decimal number", and rejects `1.005` with the distinct "more than two fractional digits" message.
4. **Date grammar is strict `YYYY-MM-DD`**, then must be a real date. `20260304` and `2026-W10-1` are rejected even though `date.fromisoformat` would accept them; `2026-02-30` is rejected as not a real date.
5. **Rules file is forgiving:** blank lines, and lines with no `=`, an empty substring, or an empty category are skipped. There is no exit code for a bad rules line in the spec, so bad lines are ignored rather than invented into an error.
6. **An unreadable `--rules` file** is reported with the same `cannot read` message and exit 1.
7. **An invalid `--opening`** is an argparse usage error (message on stderr, exit 2 via `SystemExit`).
8. **Undecodable bytes** are decoded with `errors="replace"` rather than crashing; a UTF-8 BOM is stripped.
9. **No transactions** → the report is just `closing balance: <amount>` with no leading blank line (there are no category lines to separate).
10. **A rules file that maps something to the literal category `uncategorized`** merges into the uncategorized bucket and still prints last.

## Review Focus

Input classes the spec implies but does not spell out. Each has a test in the task named at the end of the line.

- Empty file / missing header / misspelled header → exit 2 at line 1, not a crash or an empty report (Task 1).
- Blank line in the middle of the CSV → malformed, whole file rejected (Task 1).
- CRLF line endings and a UTF-8 BOM → parsed normally, no phantom header mismatch (Task 1).
- Quoted description containing a comma, and a quoted description containing a newline → description preserved, and the reported line number for a later bad row is the *physical* line (Task 1).
- Amounts that `Decimal` accepts but the spec does not: `1e2`, `NaN`, `Infinity`, `.5`, `1.`, empty (Task 1).
- Amount `1.005` gets the "more than two fractional digits" message, distinct from "not a decimal number" (Task 1).
- Non-`YYYY-MM-DD` ISO dates (`20260304`) and impossible dates (`2026-02-30`) (Task 1).
- Rules file lines that are blank, comment-ish, `=`-less, or have an empty side (Task 2).
- Rule matching is case-insensitive in both directions (uppercase description, uppercase rule substring) and first match wins even when a later rule also matches (Task 2).
- Two transactions on the same date keep input order; unsorted input still balances (Task 3).
- A category total that sums to zero prints `0.00`, never `-0.00`, including when the input literally contains `-0.00` (Task 4).
- Rules that produce a category literally named `uncategorized` merge with the no-match bucket and print last (Task 4).
- Zero transactions → no leading blank line, closing balance equals opening (Task 4).
- Directory passed as TRANSACTIONS, and unreadable `--rules` path → exit 1 with the `cannot read` message (Task 5).
- Malformed input produces *nothing* on stdout (Task 5).
- Invalid `--opening` value → usage error, not a traceback (Task 5).

---

### Task 1: Transaction model and CSV parsing

**Files:**
- Create: `ledgerlite/__init__.py`
- Create: `ledgerlite/model.py`
- Create: `ledgerlite/parse.py`
- Test: `test_model.py`, `test_parse.py`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `ledgerlite.model.Transaction` — frozen dataclass, fields `date: datetime.date`, `amount: decimal.Decimal`, `description: str`, in that positional order.
  - `ledgerlite.parse.ParseError(Exception)` with attributes `line: int` and `message: str`.
  - `ledgerlite.parse.parse_transactions(text: str) -> list[Transaction]` — input order preserved, no sorting.
  - `ledgerlite.parse.parse_date(raw: str) -> datetime.date` — raises `ValueError`.
  - `ledgerlite.parse.parse_amount(raw: str) -> Decimal` — raises `ValueError`.
  - `ledgerlite.parse.read_text(path: str) -> str` — raises `OSError`.

- [ ] **Step 1: Write the failing model test**

Create `test_model.py`:

```python
import dataclasses
import datetime
import unittest
from decimal import Decimal

from ledgerlite.model import Transaction


class TransactionTest(unittest.TestCase):
    def test_holds_date_amount_and_description(self):
        txn = Transaction(datetime.date(2026, 3, 4), Decimal("-7.50"), "Coffee Shop")
        self.assertEqual(txn.date, datetime.date(2026, 3, 4))
        self.assertEqual(txn.amount, Decimal("-7.50"))
        self.assertEqual(txn.description, "Coffee Shop")

    def test_is_frozen(self):
        txn = Transaction(datetime.date(2026, 3, 4), Decimal("1.00"), "x")
        with self.assertRaises(dataclasses.FrozenInstanceError):
            txn.amount = Decimal("2.00")


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run it to make sure it fails**

Run: `python3 -m unittest test_model -v`
Expected: FAIL with `ModuleNotFoundError: No module named 'ledgerlite'`

- [ ] **Step 3: Create the package and the model**

Create `ledgerlite/__init__.py`:

```python
"""ledgerlite: categorize bank transactions and report per-category totals."""
```

Create `ledgerlite/model.py`:

```python
"""The transaction record."""

from __future__ import annotations

import datetime
from dataclasses import dataclass
from decimal import Decimal


@dataclass(frozen=True)
class Transaction:
    """One line of a bank statement.

    ``amount`` is negative for money out, positive for money in, and is always
    a ``Decimal`` — never a float.
    """

    date: datetime.date
    amount: Decimal
    description: str
```

- [ ] **Step 4: Run the model test and make sure it passes**

Run: `python3 -m unittest test_model -v`
Expected: 2 tests PASS

- [ ] **Step 5: Write the failing field-parser tests**

Create `test_parse.py`:

```python
import datetime
import unittest
from decimal import Decimal

from ledgerlite.parse import parse_amount, parse_date


class ParseDateTest(unittest.TestCase):
    def test_accepts_iso_calendar_date(self):
        self.assertEqual(parse_date("2026-03-04"), datetime.date(2026, 3, 4))

    def test_rejects_other_shapes(self):
        for raw in ["20260304", "2026-W10-1", "4/3/2026", "2026-3-4", "", "today"]:
            with self.subTest(raw=raw):
                with self.assertRaises(ValueError):
                    parse_date(raw)

    def test_rejects_impossible_date(self):
        with self.assertRaises(ValueError):
            parse_date("2026-02-30")


class ParseAmountTest(unittest.TestCase):
    def test_accepts_zero_one_and_two_fractional_digits(self):
        self.assertEqual(parse_amount("1"), Decimal("1"))
        self.assertEqual(parse_amount("1.5"), Decimal("1.5"))
        self.assertEqual(parse_amount("1.50"), Decimal("1.50"))
        self.assertEqual(parse_amount("-12.50"), Decimal("-12.50"))
        self.assertEqual(parse_amount("+5.00"), Decimal("5.00"))

    def test_rejects_non_decimal_numbers(self):
        for raw in ["abc", "", "1e2", "NaN", "Infinity", "-Infinity", ".5", "1.", "1,000", "1 2"]:
            with self.subTest(raw=raw):
                with self.assertRaises(ValueError) as caught:
                    parse_amount(raw)
                self.assertIn("not a decimal number", str(caught.exception))

    def test_rejects_more_than_two_fractional_digits(self):
        with self.assertRaises(ValueError) as caught:
            parse_amount("1.005")
        self.assertIn("more than two fractional digits", str(caught.exception))


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 6: Run it to make sure it fails**

Run: `python3 -m unittest test_parse -v`
Expected: FAIL with `ImportError: cannot import name 'parse_amount' from 'ledgerlite.parse'` (or `ModuleNotFoundError` for `ledgerlite.parse`)

- [ ] **Step 7: Write the field parsers**

Create `ledgerlite/parse.py`:

```python
"""Parse a transactions CSV into :class:`Transaction` objects."""

from __future__ import annotations

import csv
import datetime
import io
import re
from decimal import Decimal

from .model import Transaction

HEADER = ["date", "amount", "description"]

_DATE_RE = re.compile(r"^\d{4}-\d{2}-\d{2}$")
_AMOUNT_RE = re.compile(r"^[+-]?\d+(\.\d+)?$")


def parse_date(raw: str) -> datetime.date:
    """Parse an ISO calendar date. Raises ValueError on anything else."""
    if not _DATE_RE.match(raw):
        raise ValueError(f"date is not YYYY-MM-DD: {raw!r}")
    try:
        return datetime.date.fromisoformat(raw)
    except ValueError:
        raise ValueError(f"date is not a real date: {raw!r}") from None


def parse_amount(raw: str) -> Decimal:
    """Parse a decimal amount with at most two fractional digits.

    Deliberately stricter than ``Decimal(raw)``: exponents, ``NaN`` and
    ``Infinity`` are not amounts. Raises ValueError otherwise.
    """
    if not _AMOUNT_RE.match(raw):
        raise ValueError(f"amount is not a decimal number: {raw!r}")
    _, _, fraction = raw.partition(".")
    if len(fraction) > 2:
        raise ValueError(f"amount has more than two fractional digits: {raw!r}")
    return Decimal(raw)
```

- [ ] **Step 8: Run the field-parser tests and make sure they pass**

Run: `python3 -m unittest test_parse -v`
Expected: 5 tests PASS

- [ ] **Step 9: Commit**

```bash
git add ledgerlite/__init__.py ledgerlite/model.py ledgerlite/parse.py test_model.py test_parse.py
git commit -m "feat: add Transaction model and strict date/amount parsing"
```

- [ ] **Step 10: Write the failing whole-file parsing tests**

Append to `test_parse.py`, above the `if __name__` block:

```python
from ledgerlite.parse import ParseError, parse_transactions

VALID = (
    "date,amount,description\n"
    "2026-03-04,-7.50,Coffee Shop\n"
    "2026-03-01,-900.00,Monthly Rent\n"
)


class ParseTransactionsTest(unittest.TestCase):
    def test_returns_rows_in_input_order(self):
        txns = parse_transactions(VALID)
        self.assertEqual(len(txns), 2)
        self.assertEqual(txns[0], Transaction(datetime.date(2026, 3, 4), Decimal("-7.50"), "Coffee Shop"))
        self.assertEqual(txns[1].date, datetime.date(2026, 3, 1))
        self.assertEqual(txns[1].description, "Monthly Rent")

    def test_header_only_file_has_no_transactions(self):
        self.assertEqual(parse_transactions("date,amount,description\n"), [])

    def test_tolerates_crlf_line_endings(self):
        text = "date,amount,description\r\n2026-03-04,-7.50,Coffee Shop\r\n"
        txns = parse_transactions(text)
        self.assertEqual(len(txns), 1)
        self.assertEqual(txns[0].description, "Coffee Shop")

    def test_tolerates_whitespace_around_date_and_amount(self):
        txns = parse_transactions("date,amount,description\n 2026-03-04 , -7.50 ,Coffee\n")
        self.assertEqual(txns[0].date, datetime.date(2026, 3, 4))
        self.assertEqual(txns[0].amount, Decimal("-7.50"))

    def test_keeps_quoted_description_verbatim(self):
        text = 'date,amount,description\n2026-03-04,-7.50,"Coffee, Shop"\n'
        self.assertEqual(parse_transactions(text)[0].description, "Coffee, Shop")

    def test_accepts_uppercase_and_padded_header(self):
        text = " Date , Amount , Description \n2026-03-04,-7.50,Coffee\n"
        self.assertEqual(len(parse_transactions(text)), 1)

    def test_rejects_empty_file_at_line_1(self):
        with self.assertRaises(ParseError) as caught:
            parse_transactions("")
        self.assertEqual(caught.exception.line, 1)
        self.assertIn("header", caught.exception.message)

    def test_rejects_wrong_header_at_line_1(self):
        with self.assertRaises(ParseError) as caught:
            parse_transactions("when,how much,what\n2026-03-04,-7.50,Coffee\n")
        self.assertEqual(caught.exception.line, 1)
        self.assertIn("header", caught.exception.message)

    def test_rejects_wrong_column_count_with_line_number(self):
        text = "date,amount,description\n2026-03-04,-7.50,Coffee\n2026-03-05,-1.00\n"
        with self.assertRaises(ParseError) as caught:
            parse_transactions(text)
        self.assertEqual(caught.exception.line, 3)
        self.assertIn("2 columns", caught.exception.message)

    def test_rejects_blank_line_inside_file(self):
        text = "date,amount,description\n2026-03-04,-7.50,Coffee\n\n2026-03-05,-1.00,Tea\n"
        with self.assertRaises(ParseError) as caught:
            parse_transactions(text)
        self.assertEqual(caught.exception.line, 3)
        self.assertIn("0 columns", caught.exception.message)

    def test_rejects_bad_date_with_line_number(self):
        text = "date,amount,description\n20260304,-7.50,Coffee\n"
        with self.assertRaises(ParseError) as caught:
            parse_transactions(text)
        self.assertEqual(caught.exception.line, 2)
        self.assertIn("YYYY-MM-DD", caught.exception.message)

    def test_rejects_bad_amount_with_line_number(self):
        text = "date,amount,description\n2026-03-04,-7.50,Coffee\n2026-03-05,1.005,Tea\n"
        with self.assertRaises(ParseError) as caught:
            parse_transactions(text)
        self.assertEqual(caught.exception.line, 3)
        self.assertIn("more than two fractional digits", caught.exception.message)

    def test_line_number_counts_physical_lines_of_quoted_newline(self):
        text = (
            "date,amount,description\n"
            '2026-03-04,-7.50,"Coffee\nShop"\n'
            "2026-03-05,nope,Tea\n"
        )
        with self.assertRaises(ParseError) as caught:
            parse_transactions(text)
        self.assertEqual(caught.exception.line, 4)


if __name__ == "__main__":
    unittest.main()
```

Also add `from ledgerlite.model import Transaction` to the imports at the top of `test_parse.py`.

- [ ] **Step 11: Run it to make sure it fails**

Run: `python3 -m unittest test_parse -v`
Expected: FAIL with `ImportError: cannot import name 'ParseError' from 'ledgerlite.parse'`

- [ ] **Step 12: Implement whole-file parsing**

Append to `ledgerlite/parse.py`:

```python
class ParseError(Exception):
    """A row of the transactions file is malformed.

    ``line`` is the 1-based physical line number in the file.
    """

    def __init__(self, line: int, message: str) -> None:
        super().__init__(f"{line}: {message}")
        self.line = line
        self.message = message


def parse_transactions(text: str) -> list[Transaction]:
    """Parse the whole transactions CSV, or raise ParseError.

    Rows are returned in input order; sorting is the caller's business.
    """
    reader = csv.reader(io.StringIO(text, newline=""))

    try:
        header = next(reader)
    except StopIteration:
        raise ParseError(1, "missing header row: expected date,amount,description") from None
    if [field.strip().lower() for field in header] != HEADER:
        raise ParseError(1, "bad header row: expected date,amount,description")

    transactions = []
    for row in reader:
        line = reader.line_num
        if len(row) != len(HEADER):
            raise ParseError(line, f"expected 3 columns, got {len(row)}")
        raw_date, raw_amount, description = row
        try:
            date = parse_date(raw_date.strip())
            amount = parse_amount(raw_amount.strip())
        except ValueError as exc:
            raise ParseError(line, str(exc)) from None
        transactions.append(Transaction(date, amount, description))
    return transactions
```

Note: `io.StringIO(text, newline="")` keeps `\r\n` intact so `csv` can handle it, and `reader.line_num` stays a physical line count even across quoted newlines.

- [ ] **Step 13: Run the parsing tests and make sure they pass**

Run: `python3 -m unittest test_parse -v`
Expected: all tests PASS (5 field-parser + 13 file-parser)

- [ ] **Step 14: Write the failing `read_text` test**

Append to `test_parse.py`, above the `if __name__` block:

```python
import pathlib
import tempfile

from ledgerlite.parse import read_text


class ReadTextTest(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.dir = pathlib.Path(self.tmp.name)

    def test_strips_utf8_bom(self):
        path = self.dir / "bom.csv"
        path.write_bytes(b"\xef\xbb\xbfdate,amount,description\n")
        self.assertEqual(read_text(str(path)), "date,amount,description\n")

    def test_keeps_crlf_untranslated(self):
        path = self.dir / "crlf.csv"
        path.write_bytes(b"a\r\nb\r\n")
        self.assertEqual(read_text(str(path)), "a\r\nb\r\n")

    def test_replaces_undecodable_bytes_instead_of_raising(self):
        path = self.dir / "latin1.csv"
        path.write_bytes(b"date,amount,description\n2026-03-04,-7.50,Caf\xe9\n")
        self.assertIn("�", read_text(str(path)))

    def test_raises_oserror_for_missing_file(self):
        with self.assertRaises(OSError):
            read_text(str(self.dir / "nope.csv"))
```

- [ ] **Step 15: Run it to make sure it fails**

Run: `python3 -m unittest test_parse -v`
Expected: FAIL with `ImportError: cannot import name 'read_text' from 'ledgerlite.parse'`

- [ ] **Step 16: Implement `read_text`**

Append to `ledgerlite/parse.py`:

```python
def read_text(path: str) -> str:
    """Read a file as text.

    Reads bytes and decodes them so a UTF-8 BOM is dropped, ``\\r\\n`` survives
    untranslated for ``csv``, and undecodable bytes become U+FFFD rather than
    blowing up on a statement exported in some other encoding.
    """
    with open(path, "rb") as handle:
        return handle.read().decode("utf-8-sig", errors="replace")
```

- [ ] **Step 17: Run the whole file's tests and make sure they pass**

Run: `python3 -m unittest test_parse test_model -v`
Expected: all PASS

- [ ] **Step 18: Commit**

```bash
git add ledgerlite/parse.py test_parse.py
git commit -m "feat: parse transactions CSV with per-line error reporting"
```

---

### Task 2: Rules parsing and categorization

**Files:**
- Create: `ledgerlite/rules.py`
- Test: `test_rules.py`

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces:
  - `ledgerlite.rules.Rule` — type alias for `tuple[str, str]`, `(lowercased_substring, category)`.
  - `ledgerlite.rules.parse_rules(text: str) -> list[Rule]` — file order preserved.
  - `ledgerlite.rules.categorize(description: str, rules: list[Rule]) -> str | None`.

- [ ] **Step 1: Write the failing tests**

Create `test_rules.py`:

```python
import unittest

from ledgerlite.rules import categorize, parse_rules


class ParseRulesTest(unittest.TestCase):
    def test_reads_one_rule_per_line_in_order(self):
        self.assertEqual(
            parse_rules("coffee=food\nrent=housing\n"),
            [("coffee", "food"), ("rent", "housing")],
        )

    def test_lowercases_substring_and_keeps_category_case(self):
        self.assertEqual(parse_rules("COFFEE=Food\n"), [("coffee", "Food")])

    def test_strips_whitespace_around_both_sides(self):
        self.assertEqual(parse_rules("  coffee shop = food  \n"), [("coffee shop", "food")])

    def test_splits_on_the_first_equals_only(self):
        self.assertEqual(parse_rules("a=b=c\n"), [("a", "b=c")])

    def test_skips_blank_and_unusable_lines(self):
        text = "\n   \ncoffee=food\nnoequalshere\n=food\ncoffee=\n"
        self.assertEqual(parse_rules(text), [("coffee", "food")])

    def test_empty_text_gives_no_rules(self):
        self.assertEqual(parse_rules(""), [])


class CategorizeTest(unittest.TestCase):
    def setUp(self):
        self.rules = parse_rules("coffee=food\nrent=housing\n")

    def test_matches_substring_case_insensitively(self):
        self.assertEqual(categorize("MORNING COFFEE RUN", self.rules), "food")

    def test_matches_when_the_rule_is_uppercase(self):
        self.assertEqual(categorize("morning coffee", parse_rules("COFFEE=food\n")), "food")

    def test_first_matching_rule_wins(self):
        rules = parse_rules("coffee=food\ncoffee shop=treats\n")
        self.assertEqual(categorize("Coffee Shop", rules), "food")

    def test_returns_none_when_nothing_matches(self):
        self.assertIsNone(categorize("Salary", self.rules))

    def test_returns_none_with_no_rules(self):
        self.assertIsNone(categorize("Coffee", []))


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run it to make sure it fails**

Run: `python3 -m unittest test_rules -v`
Expected: FAIL with `ModuleNotFoundError: No module named 'ledgerlite.rules'`

- [ ] **Step 3: Implement the minimal code to make the tests pass**

Create `ledgerlite/rules.py`:

```python
"""Turn a rules file into category rules, and apply them to descriptions."""

from __future__ import annotations

Rule = tuple[str, str]
"""A ``(substring, category)`` pair. The substring is already lowercased."""


def parse_rules(text: str) -> list[Rule]:
    """Parse ``<substring>=<category>`` lines, keeping file order.

    Unusable lines — blank, no ``=``, or an empty side — are skipped: the spec
    defines no error path for a bad rules line, and an empty substring would
    match every description.
    """
    rules: list[Rule] = []
    for raw_line in text.splitlines():
        line = raw_line.strip()
        if "=" not in line:
            continue
        substring, _, category = line.partition("=")
        substring = substring.strip()
        category = category.strip()
        if not substring or not category:
            continue
        rules.append((substring.lower(), category))
    return rules


def categorize(description: str, rules: list[Rule]) -> str | None:
    """Return the category of the first matching rule, or None if none match."""
    haystack = description.lower()
    for substring, category in rules:
        if substring in haystack:
            return category
    return None
```

- [ ] **Step 4: Run the tests and make sure they pass**

Run: `python3 -m unittest test_rules -v`
Expected: 11 tests PASS

- [ ] **Step 5: Commit**

```bash
git add ledgerlite/rules.py test_rules.py
git commit -m "feat: add rules file parsing and description categorization"
```

---

### Task 3: Date-ordered balance

**Files:**
- Create: `ledgerlite/balance.py`
- Test: `test_balance.py`

**Interfaces:**
- Consumes: `ledgerlite.model.Transaction` (fields `date`, `amount`, `description`).
- Produces:
  - `ledgerlite.balance.sort_transactions(transactions: list[Transaction]) -> list[Transaction]` — stable sort by date.
  - `ledgerlite.balance.running_balances(opening: Decimal, transactions: list[Transaction]) -> list[Decimal]` — one balance per transaction, in date order.
  - `ledgerlite.balance.closing_balance(opening: Decimal, transactions: list[Transaction]) -> Decimal`.

- [ ] **Step 1: Write the failing tests**

Create `test_balance.py`:

```python
import datetime
import unittest
from decimal import Decimal

from ledgerlite.balance import closing_balance, running_balances, sort_transactions
from ledgerlite.model import Transaction


def txn(day, amount, description="x"):
    return Transaction(datetime.date(2026, 3, day), Decimal(amount), description)


class SortTransactionsTest(unittest.TestCase):
    def test_sorts_by_date(self):
        rows = [txn(4, "-7.50"), txn(1, "-900.00"), txn(2, "2500.00")]
        self.assertEqual([t.date.day for t in sort_transactions(rows)], [1, 2, 4])

    def test_ties_keep_input_order(self):
        rows = [txn(1, "1.00", "second-in-file"), txn(1, "2.00", "third-in-file")]
        self.assertEqual(
            [t.description for t in sort_transactions(rows)],
            ["second-in-file", "third-in-file"],
        )

    def test_does_not_mutate_the_input(self):
        rows = [txn(4, "1.00"), txn(1, "2.00")]
        sort_transactions(rows)
        self.assertEqual([t.date.day for t in rows], [4, 1])


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
    def test_is_the_balance_after_the_last_transaction(self):
        rows = [txn(4, "-7.50"), txn(1, "-900.00"), txn(2, "2500.00")]
        self.assertEqual(closing_balance(Decimal("100"), rows), Decimal("1692.50"))

    def test_is_the_opening_amount_with_no_transactions(self):
        self.assertEqual(closing_balance(Decimal("100"), []), Decimal("100"))

    def test_stays_exact_over_many_small_amounts(self):
        rows = [txn(1, "0.10") for _ in range(10)]
        self.assertEqual(closing_balance(Decimal("0"), rows), Decimal("1.00"))


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run it to make sure it fails**

Run: `python3 -m unittest test_balance -v`
Expected: FAIL with `ModuleNotFoundError: No module named 'ledgerlite.balance'`

- [ ] **Step 3: Implement the minimal code to make the tests pass**

Create `ledgerlite/balance.py`:

```python
"""Date-ordered running balance and closing balance."""

from __future__ import annotations

from decimal import Decimal

from .model import Transaction


def sort_transactions(transactions: list[Transaction]) -> list[Transaction]:
    """Return the transactions ordered by date, ties keeping input order.

    ``sorted`` is stable, which is exactly the tie rule the spec asks for.
    """
    return sorted(transactions, key=lambda txn: txn.date)


def running_balances(opening: Decimal, transactions: list[Transaction]) -> list[Decimal]:
    """Return the balance after each transaction, in date order."""
    balance = opening
    balances = []
    for txn in sort_transactions(transactions):
        balance += txn.amount
        balances.append(balance)
    return balances


def closing_balance(opening: Decimal, transactions: list[Transaction]) -> Decimal:
    """Return the balance after the last transaction, or ``opening`` if none."""
    balances = running_balances(opening, transactions)
    return balances[-1] if balances else opening
```

- [ ] **Step 4: Run the tests and make sure they pass**

Run: `python3 -m unittest test_balance -v`
Expected: 8 tests PASS

- [ ] **Step 5: Commit**

```bash
git add ledgerlite/balance.py test_balance.py
git commit -m "feat: add date-ordered running and closing balance"
```

---

### Task 4: Category totals and report formatting

**Files:**
- Create: `ledgerlite/report.py`
- Test: `test_report.py`

**Interfaces:**
- Consumes: `Transaction`; `ledgerlite.rules.Rule`, `categorize`; `ledgerlite.balance.closing_balance`.
- Produces:
  - `ledgerlite.report.UNCATEGORIZED` — the string `"uncategorized"`.
  - `ledgerlite.report.format_amount(amount: Decimal) -> str`.
  - `ledgerlite.report.category_totals(transactions: list[Transaction], rules: list[Rule]) -> dict[str, Decimal]`.
  - `ledgerlite.report.sorted_category_names(names) -> list[str]`.
  - `ledgerlite.report.format_report(transactions: list[Transaction], rules: list[Rule], opening: Decimal) -> str` — ends with a trailing newline.

- [ ] **Step 1: Write the failing formatting tests**

Create `test_report.py`:

```python
import datetime
import unittest
from decimal import Decimal

from ledgerlite.model import Transaction
from ledgerlite.report import (
    UNCATEGORIZED,
    category_totals,
    format_amount,
    format_report,
    sorted_category_names,
)
from ledgerlite.rules import parse_rules


def txn(day, amount, description):
    return Transaction(datetime.date(2026, 3, day), Decimal(amount), description)


class FormatAmountTest(unittest.TestCase):
    def test_always_two_fractional_digits(self):
        self.assertEqual(format_amount(Decimal("1200")), "1200.00")
        self.assertEqual(format_amount(Decimal("1.5")), "1.50")
        self.assertEqual(format_amount(Decimal("-12.50")), "-12.50")
        self.assertEqual(format_amount(Decimal("0")), "0.00")

    def test_no_thousands_separators(self):
        self.assertEqual(format_amount(Decimal("1234567.89")), "1234567.89")

    def test_zero_never_prints_as_negative_zero(self):
        self.assertEqual(format_amount(Decimal("-0.00")), "0.00")
        self.assertEqual(format_amount(Decimal("-1.50") + Decimal("1.50")), "0.00")


class SortedCategoryNamesTest(unittest.TestCase):
    def test_alphabetical_with_uncategorized_last(self):
        names = ["housing", UNCATEGORIZED, "food", "aaa"]
        self.assertEqual(sorted_category_names(names), ["aaa", "food", "housing", UNCATEGORIZED])

    def test_omits_uncategorized_when_absent(self):
        self.assertEqual(sorted_category_names(["food", "aaa"]), ["aaa", "food"])


class CategoryTotalsTest(unittest.TestCase):
    def setUp(self):
        self.rules = parse_rules("coffee=food\nrent=housing\n")

    def test_sums_per_category_and_buckets_the_rest(self):
        rows = [
            txn(4, "-7.50", "Coffee Shop"),
            txn(5, "-2.50", "COFFEE BEANS"),
            txn(1, "-900.00", "Monthly Rent"),
            txn(2, "2500.00", "Salary"),
        ]
        self.assertEqual(
            category_totals(rows, self.rules),
            {"food": Decimal("-10.00"), "housing": Decimal("-900.00"), UNCATEGORIZED: Decimal("2500.00")},
        )

    def test_no_transactions_gives_no_categories(self):
        self.assertEqual(category_totals([], self.rules), {})

    def test_without_rules_everything_is_uncategorized(self):
        rows = [txn(4, "-7.50", "Coffee Shop"), txn(1, "-900.00", "Monthly Rent")]
        self.assertEqual(category_totals(rows, []), {UNCATEGORIZED: Decimal("-907.50")})

    def test_rule_named_uncategorized_merges_with_the_bucket(self):
        rows = [txn(4, "-7.50", "Coffee Shop"), txn(2, "2500.00", "Salary")]
        rules = parse_rules("coffee=uncategorized\n")
        self.assertEqual(category_totals(rows, rules), {UNCATEGORIZED: Decimal("2492.50")})


class FormatReportTest(unittest.TestCase):
    def test_matches_the_spec_example(self):
        rows = [
            txn(4, "-7.50", "Coffee Shop"),
            txn(1, "-900.00", "Monthly Rent"),
            txn(2, "2500.00", "Salary"),
        ]
        rules = parse_rules("coffee=food\nrent=housing\n")
        self.assertEqual(
            format_report(rows, rules, Decimal("100")),
            "food: -7.50\n"
            "housing: -900.00\n"
            "uncategorized: 2500.00\n"
            "\n"
            "closing balance: 1692.50\n",
        )

    def test_uncategorized_is_last_even_when_alphabetically_first(self):
        rows = [txn(1, "-1.00", "Coffee"), txn(2, "-2.00", "Mystery")]
        rules = parse_rules("coffee=zebra\n")
        self.assertEqual(
            format_report(rows, rules, Decimal("0")),
            "zebra: -1.00\nuncategorized: -2.00\n\nclosing balance: -3.00\n",
        )

    def test_no_transactions_prints_only_the_closing_balance(self):
        self.assertEqual(format_report([], [], Decimal("100")), "closing balance: 100.00\n")

    def test_category_summing_to_zero_prints_zero(self):
        rows = [txn(1, "-1.50", "Coffee"), txn(2, "1.50", "Coffee refund")]
        rules = parse_rules("coffee=food\n")
        self.assertEqual(
            format_report(rows, rules, Decimal("0")),
            "food: 0.00\n\nclosing balance: 0.00\n",
        )


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run it to make sure it fails**

Run: `python3 -m unittest test_report -v`
Expected: FAIL with `ModuleNotFoundError: No module named 'ledgerlite.report'`

- [ ] **Step 3: Implement the minimal code to make the tests pass**

Create `ledgerlite/report.py`:

```python
"""Per-category totals and report formatting."""

from __future__ import annotations

from collections.abc import Iterable
from decimal import Decimal

from .balance import closing_balance
from .model import Transaction
from .rules import Rule, categorize

UNCATEGORIZED = "uncategorized"

_CENTS = Decimal("0.01")


def format_amount(amount: Decimal) -> str:
    """Format an amount with exactly two fractional digits and no separators."""
    quantized = amount.quantize(_CENTS)
    if quantized == 0:
        quantized = abs(quantized)  # never print "-0.00"
    return f"{quantized:f}"


def category_totals(transactions: list[Transaction], rules: list[Rule]) -> dict[str, Decimal]:
    """Sum each transaction into its category, no-match ones into UNCATEGORIZED.

    Categories with no transactions do not appear.
    """
    totals: dict[str, Decimal] = {}
    for txn in transactions:
        category = categorize(txn.description, rules)
        name = UNCATEGORIZED if category is None else category
        totals[name] = totals.get(name, Decimal("0")) + txn.amount
    return totals


def sorted_category_names(names: Iterable[str]) -> list[str]:
    """Category names alphabetically, with UNCATEGORIZED forced last."""
    names = list(names)
    ordered = sorted(name for name in names if name != UNCATEGORIZED)
    if UNCATEGORIZED in names:
        ordered.append(UNCATEGORIZED)
    return ordered


def format_report(
    transactions: list[Transaction], rules: list[Rule], opening: Decimal
) -> str:
    """Render the whole report, ending with a newline."""
    totals = category_totals(transactions, rules)
    lines = [
        f"{name}: {format_amount(totals[name])}" for name in sorted_category_names(totals)
    ]
    if lines:
        lines.append("")  # blank line separating categories from the balance
    lines.append(f"closing balance: {format_amount(closing_balance(opening, transactions))}")
    return "\n".join(lines) + "\n"
```

- [ ] **Step 4: Run the tests and make sure they pass**

Run: `python3 -m unittest test_report -v`
Expected: 12 tests PASS

- [ ] **Step 5: Run the whole suite so far**

Run: `python3 -m unittest -v`
Expected: all tests PASS

- [ ] **Step 6: Commit**

```bash
git add ledgerlite/report.py test_report.py
git commit -m "feat: add per-category totals and report formatting"
```

---

### Task 5: CLI entry point

**Files:**
- Create: `ledgerlite/cli.py`
- Create: `ledgerlite/__main__.py`
- Test: `test_cli.py`

**Interfaces:**
- Consumes: `ledgerlite.parse.ParseError`, `parse_transactions`, `parse_amount`, `read_text`; `ledgerlite.rules.parse_rules`; `ledgerlite.report.format_report`.
- Produces:
  - `ledgerlite.cli.build_parser() -> argparse.ArgumentParser`.
  - `ledgerlite.cli.main(argv: list[str] | None = None) -> int` — returns the exit code, never calls `sys.exit`.

Note: `__main__.py` is not in the spec's layout listing; it is three lines that make the package runnable as `python3 -m ledgerlite` without packaging metadata, which the spec's `ledgerlite report ...` invocation needs.

- [ ] **Step 1: Write the failing happy-path CLI test**

Create `test_cli.py`:

```python
import contextlib
import io
import pathlib
import tempfile
import unittest

from ledgerlite.cli import main

TRANSACTIONS = (
    "date,amount,description\n"
    "2026-03-04,-7.50,Coffee Shop\n"
    "2026-03-01,-900.00,Monthly Rent\n"
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
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.dir = pathlib.Path(self.tmp.name)

    def write(self, name, text):
        path = self.dir / name
        path.write_text(text, encoding="utf-8")
        return str(path)

    def run_cli(self, argv):
        """Run main(argv), returning (code, stdout, stderr)."""
        out, err = io.StringIO(), io.StringIO()
        with contextlib.redirect_stdout(out), contextlib.redirect_stderr(err):
            code = main(argv)
        return code, out.getvalue(), err.getvalue()


class ReportCommandTest(CliTestCase):
    def test_prints_the_spec_example_and_returns_zero(self):
        txns = self.write("txns.csv", TRANSACTIONS)
        rules = self.write("rules.txt", RULES)
        code, out, err = self.run_cli(["report", txns, "--rules", rules, "--opening", "100"])
        self.assertEqual(code, 0)
        self.assertEqual(out, EXPECTED)
        self.assertEqual(err, "")

    def test_without_rules_everything_is_uncategorized(self):
        txns = self.write("txns.csv", TRANSACTIONS)
        code, out, _ = self.run_cli(["report", txns, "--opening", "100"])
        self.assertEqual(code, 0)
        self.assertEqual(out, "uncategorized: 1592.50\n\nclosing balance: 1692.50\n")

    def test_opening_defaults_to_zero(self):
        txns = self.write("txns.csv", TRANSACTIONS)
        code, out, _ = self.run_cli(["report", txns])
        self.assertEqual(code, 0)
        self.assertIn("closing balance: 1592.50\n", out)

    def test_negative_opening_is_accepted(self):
        txns = self.write("txns.csv", "date,amount,description\n")
        code, out, _ = self.run_cli(["report", txns, "--opening", "-12.50"])
        self.assertEqual(code, 0)
        self.assertEqual(out, "closing balance: -12.50\n")


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run it to make sure it fails**

Run: `python3 -m unittest test_cli -v`
Expected: FAIL with `ModuleNotFoundError: No module named 'ledgerlite.cli'`

- [ ] **Step 3: Implement the CLI**

Create `ledgerlite/cli.py`:

```python
"""Command-line entry point."""

from __future__ import annotations

import argparse
import sys
from decimal import Decimal

from .parse import ParseError, parse_amount, parse_transactions, read_text
from .report import format_report
from .rules import parse_rules

PROG = "ledgerlite"


def _opening(raw: str) -> Decimal:
    try:
        return parse_amount(raw)
    except ValueError as exc:
        raise argparse.ArgumentTypeError(str(exc)) from None


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(prog=PROG)
    subparsers = parser.add_subparsers(dest="command", required=True)
    report = subparsers.add_parser("report", help="print a categorized report")
    report.add_argument("transactions", help="path to the transactions CSV")
    report.add_argument("--rules", help="path to the rules file")
    report.add_argument(
        "--opening",
        type=_opening,
        default=Decimal("0"),
        help="opening balance (default: 0)",
    )
    return parser


def main(argv: list[str] | None = None) -> int:
    """Run the CLI and return the process exit code."""
    args = build_parser().parse_args(argv)

    try:
        transactions_text = read_text(args.transactions)
        rules_text = read_text(args.rules) if args.rules is not None else ""
    except OSError as exc:
        path = exc.filename or args.transactions
        reason = exc.strerror or str(exc)
        print(f"{PROG}: cannot read {path}: {reason}", file=sys.stderr)
        return 1

    try:
        transactions = parse_transactions(transactions_text)
    except ParseError as exc:
        print(f"{PROG}: {args.transactions}:{exc.line}: {exc.message}", file=sys.stderr)
        return 2

    sys.stdout.write(format_report(transactions, parse_rules(rules_text), args.opening))
    return 0
```

Create `ledgerlite/__main__.py`:

```python
"""Allow ``python3 -m ledgerlite ...``."""

import sys

from .cli import main

if __name__ == "__main__":
    sys.exit(main())
```

- [ ] **Step 4: Run the happy-path tests and make sure they pass**

Run: `python3 -m unittest test_cli -v`
Expected: 4 tests PASS

- [ ] **Step 5: Commit**

```bash
git add ledgerlite/cli.py ledgerlite/__main__.py test_cli.py
git commit -m "feat: add ledgerlite report CLI"
```

- [ ] **Step 6: Write the failing error-path tests**

Append to `test_cli.py`, above the `if __name__` block:

```python
class ErrorPathTest(CliTestCase):
    def test_missing_transactions_file_returns_1(self):
        missing = str(self.dir / "nope.csv")
        code, out, err = self.run_cli(["report", missing])
        self.assertEqual(code, 1)
        self.assertEqual(out, "")
        self.assertEqual(err, f"ledgerlite: cannot read {missing}: No such file or directory\n")

    def test_directory_as_transactions_returns_1(self):
        code, out, err = self.run_cli(["report", str(self.dir)])
        self.assertEqual(code, 1)
        self.assertEqual(out, "")
        self.assertTrue(err.startswith(f"ledgerlite: cannot read {self.dir}: "))

    def test_missing_rules_file_returns_1(self):
        txns = self.write("txns.csv", TRANSACTIONS)
        missing = str(self.dir / "nope.txt")
        code, out, err = self.run_cli(["report", txns, "--rules", missing])
        self.assertEqual(code, 1)
        self.assertEqual(out, "")
        self.assertEqual(err, f"ledgerlite: cannot read {missing}: No such file or directory\n")

    def test_malformed_row_returns_2_and_prints_nothing_to_stdout(self):
        txns = self.write(
            "bad.csv",
            "date,amount,description\n2026-03-04,-7.50,Coffee\n2026-03-05,1.005,Tea\n",
        )
        code, out, err = self.run_cli(["report", txns])
        self.assertEqual(code, 2)
        self.assertEqual(out, "")
        self.assertEqual(
            err,
            f"ledgerlite: {txns}:3: amount has more than two fractional digits: '1.005'\n",
        )

    def test_bad_date_returns_2(self):
        txns = self.write("bad.csv", "date,amount,description\n04/03/2026,-7.50,Coffee\n")
        code, out, err = self.run_cli(["report", txns])
        self.assertEqual(code, 2)
        self.assertEqual(out, "")
        self.assertIn(f"{txns}:2: date is not YYYY-MM-DD", err)

    def test_wrong_column_count_returns_2(self):
        txns = self.write("bad.csv", "date,amount,description\n2026-03-04,-7.50\n")
        code, out, err = self.run_cli(["report", txns])
        self.assertEqual(code, 2)
        self.assertIn(f"{txns}:2: expected 3 columns, got 2", err)

    def test_empty_file_returns_2(self):
        txns = self.write("empty.csv", "")
        code, out, err = self.run_cli(["report", txns])
        self.assertEqual(code, 2)
        self.assertIn(f"{txns}:1: missing header row", err)

    def test_bad_opening_is_a_usage_error(self):
        txns = self.write("txns.csv", TRANSACTIONS)
        err = io.StringIO()
        with contextlib.redirect_stderr(err):
            with self.assertRaises(SystemExit) as caught:
                main(["report", txns, "--opening", "1.005"])
        self.assertEqual(caught.exception.code, 2)
        self.assertIn("ledgerlite:", err.getvalue())

    def test_missing_subcommand_is_a_usage_error(self):
        err = io.StringIO()
        with contextlib.redirect_stderr(err):
            with self.assertRaises(SystemExit) as caught:
                main([])
        self.assertEqual(caught.exception.code, 2)
```

- [ ] **Step 7: Run the error-path tests and make sure they pass**

Run: `python3 -m unittest test_cli -v`
Expected: all 13 tests PASS (opening a directory raises `IsADirectoryError`, which is an `OSError`, so the `cannot read` branch already covers it).

- [ ] **Step 8: Write the failing `python3 -m ledgerlite` smoke test**

Append to `test_cli.py`, above the `if __name__` block:

```python
import subprocess
import sys as _sys


class ModuleInvocationTest(CliTestCase):
    def test_runs_as_python_m_ledgerlite(self):
        txns = self.write("txns.csv", TRANSACTIONS)
        rules = self.write("rules.txt", RULES)
        result = subprocess.run(
            [_sys.executable, "-m", "ledgerlite", "report", txns, "--rules", rules, "--opening", "100"],
            capture_output=True,
            text=True,
            cwd=str(pathlib.Path(__file__).parent),
        )
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(result.stdout, EXPECTED)

    def test_exit_code_2_reaches_the_shell(self):
        txns = self.write("bad.csv", "date,amount,description\n2026-03-04,x,Coffee\n")
        result = subprocess.run(
            [_sys.executable, "-m", "ledgerlite", "report", txns],
            capture_output=True,
            text=True,
            cwd=str(pathlib.Path(__file__).parent),
        )
        self.assertEqual(result.returncode, 2)
        self.assertEqual(result.stdout, "")
        self.assertIn("amount is not a decimal number", result.stderr)
```

- [ ] **Step 9: Run the smoke tests and make sure they pass**

Run: `python3 -m unittest test_cli.ModuleInvocationTest -v`
Expected: 2 tests PASS

- [ ] **Step 10: Run the whole suite**

Run: `python3 -m unittest -v`
Expected: every test in `test_model`, `test_parse`, `test_rules`, `test_balance`, `test_report`, `test_cli` PASSES

- [ ] **Step 11: Check the spec example by hand**

```bash
printf 'date,amount,description\n2026-03-04,-7.50,Coffee Shop\n2026-03-01,-900.00,Monthly Rent\n2026-03-02,2500.00,Salary\n' > /tmp/ledger-txns.csv
printf 'coffee=food\nrent=housing\n' > /tmp/ledger-rules.txt
python3 -m ledgerlite report /tmp/ledger-txns.csv --rules /tmp/ledger-rules.txt --opening 100
echo "exit=$?"
```

Expected output, byte for byte:

```
food: -7.50
housing: -900.00
uncategorized: 2500.00

closing balance: 1692.50
exit=0
```

- [ ] **Step 12: Commit**

```bash
git add test_cli.py
git commit -m "test: cover ledgerlite CLI error paths and module invocation"
```
