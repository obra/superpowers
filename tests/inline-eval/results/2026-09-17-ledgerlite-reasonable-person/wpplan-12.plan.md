# ledgerlite Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `ledgerlite`, a standard-library-only Python CLI that reads a transactions CSV, categorizes each row with a rules file, and prints per-category totals plus the closing balance.

**Architecture:** Six small modules with one responsibility each, layered so nothing depends on anything above it: `model` (data), `parse` (CSV text → transactions), `rules` (rules text → rule list, plus matching), `balance` (date ordering and running/closing balance), `report` (totals and text formatting), `cli` (argparse, file I/O, error messages, exit codes). Only `cli` touches the filesystem, `sys.stdout`, or `sys.stderr`; every other module is a pure function over strings and objects, which makes all of them testable without temp files.

**Tech Stack:** Python 3.11+ standard library only — `csv`, `decimal`, `datetime`, `dataclasses`, `argparse`, `re`, `io`, `unittest`.

**Spec:** `design.md` (repo root)

## Global Constraints

- Python 3.11+. Standard library only — no third-party packages, no `pip install`.
- Money is `decimal.Decimal` everywhere. Never `float`. Never `round()`. No arithmetic that converts through `float`.
- Package lives in `ledgerlite/`; module set is exactly the one in the spec's "Package layout" (plus `__main__.py`, see Task 5).
- Tests live at the repo root as `test_<module>.py` and run with `python3 -m unittest` (no args = discovery from the repo root).
- Amounts are printed with exactly two fractional digits, a leading `-` only for negatives, and no thousands separators: `-12.50`, `0.00`, `1200.00`.
- Error messages are byte-exact:
  - unreadable file → `ledgerlite: cannot read <path>: <reason>` on stderr, exit 1
  - malformed line → `ledgerlite: <path>:<line>: <what is wrong>` on stderr, exit 2
  - Both use the path exactly as it appeared on the command line.
- A malformed input file rejects the whole file: nothing is written to stdout.
- Exit codes: 0 success, 1 unreadable file, 2 malformed input (including argparse usage errors).

## Decisions the spec leaves open

The spec is silent on these; the plan resolves them so the code is deterministic. Each is pinned by a test in the task named.

1. **Strict date form.** Only `YYYY-MM-DD` is accepted. `date.fromisoformat` in 3.11+ also accepts `20260304`, so a regex gate comes first. Impossible calendar dates (`2026-02-30`) are malformed. (Task 1)
2. **Strict amount form.** `^[+-]?(\d+(\.\d*)?|\.\d+)$`, so `NaN`, `Infinity`, `1e2`, `--5`, and `` are malformed. Surrounding whitespace on the date and amount fields is stripped; the description is kept verbatim. (Task 1)
3. **Header row is required.** The first line must be `date`, `amount`, `description` (whitespace-stripped, case-insensitive). A missing or wrong header is malformed at line 1. A completely empty file is therefore exit 2; a header-only file is a valid report with zero transactions. (Task 1)
4. **A leading UTF-8 BOM is stripped** from both input files before parsing. (Tasks 1 and 2)
5. **Blank lines inside the CSV are malformed** (`expected 3 columns, got 0`); a single trailing newline at end of file is not a row. (Task 1)
6. **Line numbers come from `csv.reader.line_num`**, so quoted fields with embedded newlines still report the physical line. (Task 1)
7. **Rules files** skip blank/whitespace-only lines; split on the *first* `=` (so `a=b=c` is substring `a`, category `b=c`); strip whitespace around both halves; a line with no `=`, an empty substring, or an empty category is malformed and reported with the line-numbered form at exit 2. There is no comment syntax — `#foo=bar` is a literal substring rule. (Task 2)
8. **An unreadable `--rules` file** gets the same `cannot read` message and exit 1 as the transactions file. (Task 5)
9. **A non-UTF-8 input file** is treated as unreadable: `cannot read <path>: not valid UTF-8 text`, exit 1. (Task 5)
10. **Category lines are printed only for categories that have at least one transaction**, so a report with no uncategorized transactions has no `uncategorized` line. "Always listed last" is about position, not presence. (Task 4)
11. **Alphabetical ordering is case-insensitive** with a codepoint tiebreak: `key=(name.lower(), name)`. A rule whose category is literally `uncategorized` merges into the uncategorized bucket and stays last. (Task 4)
12. **`--opening` uses the same amount validator.** An invalid value is an argparse usage error: usage text on stderr, exit 2. (Task 5)

## File Structure

| File | Responsibility |
| --- | --- |
| `ledgerlite/__init__.py` | Package marker, docstring only. |
| `ledgerlite/model.py` | `Transaction` frozen dataclass. No logic. |
| `ledgerlite/parse.py` | `ParseError`, `parse_date`, `parse_amount`, `parse_transactions`. Pure text → objects. |
| `ledgerlite/rules.py` | `parse_rules`, `categorize`. Reuses `ParseError`. |
| `ledgerlite/balance.py` | `order_by_date`, `running_balances`, `closing_balance`. |
| `ledgerlite/report.py` | `UNCATEGORIZED`, `format_amount`, `category_totals`, `format_report`. |
| `ledgerlite/cli.py` | argparse wiring, file reads, error messages, exit codes, `main(argv)`. |
| `ledgerlite/__main__.py` | `python3 -m ledgerlite` shim. |
| `test_model.py`, `test_parse.py`, `test_rules.py`, `test_balance.py`, `test_report.py`, `test_cli.py` | One test module per source module, repo root. |

Dependency direction: `cli → report → {balance, rules} → parse → model`. Nothing imports `cli`.

## Review Focus

Input classes the spec implies but does not spell out. Each has a test in the task named; the final reviewer should confirm those tests exist and pass.

- Header-only CSV → report is a blank line then `closing balance: <opening>` (Task 4 formatting test, Task 5 end-to-end test).
- Completely empty CSV → exit 2 at line 1 (Task 1, Task 5).
- Leading UTF-8 BOM on either input file → parsed normally, not a malformed header or a broken first rule (Task 1, Task 2).
- CRLF line endings → parsed normally, no stray `\r` in descriptions (Task 1).
- Blank line inside the CSV → malformed with the correct line number (Task 1).
- Quoted description containing a comma, a quote, and a newline → one transaction, verbatim text, later errors still get the right physical line number (Task 1).
- `20260304`, `2026-3-4`, `2026-02-30` → malformed date (Task 1).
- `NaN`, `Infinity`, `1e2`, `1.005`, empty amount → malformed amount, with `1.005` reported as the fractional-digits error and the rest as the not-a-number error (Task 1).
- Amount totals that come out as negative zero (`-0.00`) → printed `0.00` (Task 4).
- Sums stay exact under Decimal — 0.10 + 0.20 == 0.30, which float would break (Task 3, Task 4).
- Rules: blank lines, missing `=`, empty substring, empty category, `a=b=c`, uppercase rule vs lowercase description and vice versa, first-match-wins when two rules match (Task 2).
- Two transactions on the same date → input order preserved through ordering (Task 3).
- Unreadable transactions file, unreadable rules file, a directory passed as a path, a non-UTF-8 file → exit 1 with the exact message (Task 5).
- Invalid `--opening` → exit 2, nothing on stdout (Task 5).
- Any exit-2 path → stdout is completely empty (Task 5).

---

### Task 1: Transaction model and CSV parsing

Creates the package, the data type, and the parser. This is the largest task because the parser's field validators and its row loop are worthless apart — a reviewer judging one judges both.

**Files:**
- Create: `ledgerlite/__init__.py`
- Create: `ledgerlite/model.py`
- Create: `ledgerlite/parse.py`
- Test: `test_model.py`
- Test: `test_parse.py`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `ledgerlite.model.Transaction` — frozen dataclass with fields `date: datetime.date`, `amount: decimal.Decimal`, `description: str` (in that order).
  - `ledgerlite.parse.ParseError(Exception)` with attributes `line: int` and `message: str`.
  - `ledgerlite.parse.parse_date(raw: str) -> datetime.date` — raises `ValueError` whose message is the human-readable "what is wrong" text.
  - `ledgerlite.parse.parse_amount(raw: str) -> decimal.Decimal` — raises `ValueError` likewise.
  - `ledgerlite.parse.parse_transactions(text: str) -> list[Transaction]` — raises `ParseError`. Rows are returned in input order (no sorting here).

- [ ] **Step 1: Write the failing model test**

Create `test_model.py`:

```python
"""Tests for ledgerlite.model."""

import dataclasses
import unittest
from datetime import date
from decimal import Decimal

from ledgerlite.model import Transaction


class TransactionTests(unittest.TestCase):
    def test_holds_date_amount_and_description(self):
        transaction = Transaction(date(2026, 3, 4), Decimal("-7.50"), "Coffee Bar")
        self.assertEqual(transaction.date, date(2026, 3, 4))
        self.assertEqual(transaction.amount, Decimal("-7.50"))
        self.assertEqual(transaction.description, "Coffee Bar")

    def test_is_frozen(self):
        transaction = Transaction(date(2026, 3, 4), Decimal("1.00"), "x")
        with self.assertRaises(dataclasses.FrozenInstanceError):
            transaction.amount = Decimal("2.00")


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run it to make sure it fails**

Run: `python3 -m unittest test_model -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'ledgerlite'`

- [ ] **Step 3: Create the package and the model**

Create `ledgerlite/__init__.py`:

```python
"""ledgerlite: categorize bank transactions and summarize them."""
```

Create `ledgerlite/model.py`:

```python
"""The transaction data type."""

from dataclasses import dataclass
from datetime import date
from decimal import Decimal


@dataclass(frozen=True)
class Transaction:
    """One line of a bank statement. Amounts are negative for money out."""

    date: date
    amount: Decimal
    description: str
```

- [ ] **Step 4: Run it to make sure it passes**

Run: `python3 -m unittest test_model -v`
Expected: PASS (2 tests)

- [ ] **Step 5: Commit**

```bash
git add ledgerlite/__init__.py ledgerlite/model.py test_model.py
git commit -m "feat: add Transaction model"
```

- [ ] **Step 6: Write the failing field-validator tests**

Create `test_parse.py` with the field-level tests only (the row-level tests arrive in Step 9):

```python
"""Tests for ledgerlite.parse."""

import unittest
from datetime import date
from decimal import Decimal

from ledgerlite.parse import ParseError, parse_amount, parse_date


class ParseDateTests(unittest.TestCase):
    def test_accepts_iso_date(self):
        self.assertEqual(parse_date("2026-03-04"), date(2026, 3, 4))

    def test_strips_surrounding_whitespace(self):
        self.assertEqual(parse_date("  2026-03-04 "), date(2026, 3, 4))

    def test_rejects_compact_form(self):
        with self.assertRaises(ValueError) as caught:
            parse_date("20260304")
        self.assertIn("date is not an ISO 8601 date", str(caught.exception))

    def test_rejects_unpadded_form(self):
        with self.assertRaises(ValueError):
            parse_date("2026-3-4")

    def test_rejects_empty(self):
        with self.assertRaises(ValueError):
            parse_date("")

    def test_rejects_impossible_calendar_date(self):
        with self.assertRaises(ValueError) as caught:
            parse_date("2026-02-30")
        self.assertIn("not a valid calendar date", str(caught.exception))


class ParseAmountTests(unittest.TestCase):
    def test_accepts_negative_two_places(self):
        self.assertEqual(parse_amount("-7.50"), Decimal("-7.50"))

    def test_accepts_one_place(self):
        self.assertEqual(parse_amount("1.5"), Decimal("1.5"))

    def test_accepts_integer(self):
        self.assertEqual(parse_amount("2500"), Decimal("2500"))

    def test_accepts_explicit_plus(self):
        self.assertEqual(parse_amount("+5"), Decimal("5"))

    def test_strips_surrounding_whitespace(self):
        self.assertEqual(parse_amount(" -7.50 "), Decimal("-7.50"))

    def test_rejects_three_fractional_digits(self):
        with self.assertRaises(ValueError) as caught:
            parse_amount("1.005")
        self.assertIn("more than two fractional digits", str(caught.exception))

    def test_rejects_non_numbers(self):
        for raw in ["NaN", "Infinity", "1e2", "", "--5", "abc", "1,5"]:
            with self.subTest(raw=raw):
                with self.assertRaises(ValueError) as caught:
                    parse_amount(raw)
                self.assertIn("not a decimal number", str(caught.exception))

    def test_returns_decimal_not_float(self):
        self.assertIsInstance(parse_amount("0.10"), Decimal)


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 7: Run them to make sure they fail**

Run: `python3 -m unittest test_parse -v`
Expected: FAIL — `ImportError: cannot import name 'ParseError' from 'ledgerlite.parse'` (module does not exist yet)

- [ ] **Step 8: Write `parse.py` up to the field validators**

Create `ledgerlite/parse.py`:

```python
"""Parsing transaction CSV text into Transaction objects."""

import csv
import io
import re
from datetime import date
from decimal import Decimal

from .model import Transaction

HEADER = ("date", "amount", "description")

_BOM = "\ufeff"
_DATE_RE = re.compile(r"^\d{4}-\d{2}-\d{2}$")
_AMOUNT_RE = re.compile(r"^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$")


class ParseError(Exception):
    """A line of an input file is malformed."""

    def __init__(self, line: int, message: str) -> None:
        super().__init__(f"line {line}: {message}")
        self.line = line
        self.message = message


def parse_date(raw: str) -> date:
    """Parse a strict YYYY-MM-DD date. Raises ValueError if malformed."""
    text = raw.strip()
    if not _DATE_RE.match(text):
        raise ValueError(f"date is not an ISO 8601 date (YYYY-MM-DD): {raw!r}")
    try:
        return date.fromisoformat(text)
    except ValueError:
        raise ValueError(f"date is not a valid calendar date: {raw!r}") from None


def parse_amount(raw: str) -> Decimal:
    """Parse a decimal amount with at most two fractional digits."""
    text = raw.strip()
    if not _AMOUNT_RE.match(text):
        raise ValueError(f"amount is not a decimal number: {raw!r}")
    _, _, fraction = text.partition(".")
    if len(fraction) > 2:
        raise ValueError(f"amount has more than two fractional digits: {raw!r}")
    return Decimal(text)
```

Note: `date.fromisoformat` accepts `20260304`, so the regex gate is what makes the form strict — do not drop it.

- [ ] **Step 9: Run them to make sure they pass**

Run: `python3 -m unittest test_parse -v`
Expected: PASS (14 tests — `ParseDateTests` and `ParseAmountTests`)

- [ ] **Step 10: Write the failing `parse_transactions` tests**

Change the import line in `test_parse.py` to:

```python
from ledgerlite.parse import ParseError, parse_amount, parse_date, parse_transactions
```

Then append these to `test_parse.py`, above the `if __name__` block:

```python
GOOD_CSV = (
    "date,amount,description\n"
    "2026-03-05,-900.00,Monthly Rent\n"
    "2026-03-04,-7.50,Coffee Bar\n"
    "2026-03-01,2500.00,Salary\n"
)


class ParseTransactionsTests(unittest.TestCase):
    def test_returns_rows_in_input_order(self):
        transactions = parse_transactions(GOOD_CSV)
        self.assertEqual(
            [(t.date, t.amount, t.description) for t in transactions],
            [
                (date(2026, 3, 5), Decimal("-900.00"), "Monthly Rent"),
                (date(2026, 3, 4), Decimal("-7.50"), "Coffee Bar"),
                (date(2026, 3, 1), Decimal("2500.00"), "Salary"),
            ],
        )

    def test_header_only_file_yields_no_transactions(self):
        self.assertEqual(parse_transactions("date,amount,description\n"), [])

    def test_accepts_crlf_line_endings(self):
        text = "date,amount,description\r\n2026-03-04,-7.50,Coffee Bar\r\n"
        transactions = parse_transactions(text)
        self.assertEqual(len(transactions), 1)
        self.assertEqual(transactions[0].description, "Coffee Bar")

    def test_accepts_leading_bom(self):
        transactions = parse_transactions("\ufeff" + GOOD_CSV)
        self.assertEqual(len(transactions), 3)

    def test_accepts_header_with_padding_and_mixed_case(self):
        text = "Date, Amount ,DESCRIPTION\n2026-03-04,-7.50,Coffee Bar\n"
        self.assertEqual(len(parse_transactions(text)), 1)

    def test_keeps_quoted_description_verbatim(self):
        text = 'date,amount,description\n2026-03-04,-7.50,"Cafe, ""The Bar"""\n'
        self.assertEqual(parse_transactions(text)[0].description, 'Cafe, "The Bar"')

    def test_empty_file_is_missing_header(self):
        with self.assertRaises(ParseError) as caught:
            parse_transactions("")
        self.assertEqual(caught.exception.line, 1)
        self.assertEqual(
            caught.exception.message, "expected header row date,amount,description"
        )

    def test_wrong_header_is_rejected(self):
        with self.assertRaises(ParseError) as caught:
            parse_transactions("when,how much,what\n")
        self.assertEqual(caught.exception.line, 1)
        self.assertIn("expected header row", caught.exception.message)

    def test_too_few_columns(self):
        text = "date,amount,description\n2026-03-04,-7.50\n"
        with self.assertRaises(ParseError) as caught:
            parse_transactions(text)
        self.assertEqual(caught.exception.line, 2)
        self.assertEqual(caught.exception.message, "expected 3 columns, got 2")

    def test_too_many_columns(self):
        text = "date,amount,description\n2026-03-04,-7.50,Coffee,extra\n"
        with self.assertRaises(ParseError) as caught:
            parse_transactions(text)
        self.assertEqual(caught.exception.message, "expected 3 columns, got 4")

    def test_blank_line_inside_file(self):
        text = "date,amount,description\n2026-03-04,-7.50,Coffee\n\n2026-03-05,1.00,x\n"
        with self.assertRaises(ParseError) as caught:
            parse_transactions(text)
        self.assertEqual(caught.exception.line, 3)
        self.assertEqual(caught.exception.message, "expected 3 columns, got 0")

    def test_bad_date_reports_its_line(self):
        text = "date,amount,description\n2026-03-04,-7.50,Coffee\n20260305,1.00,x\n"
        with self.assertRaises(ParseError) as caught:
            parse_transactions(text)
        self.assertEqual(caught.exception.line, 3)
        self.assertIn("date is not an ISO 8601 date", caught.exception.message)

    def test_bad_amount_reports_its_line(self):
        text = "date,amount,description\n2026-03-04,1.005,Coffee\n"
        with self.assertRaises(ParseError) as caught:
            parse_transactions(text)
        self.assertEqual(caught.exception.line, 2)
        self.assertIn("more than two fractional digits", caught.exception.message)

    def test_line_numbers_follow_embedded_newlines(self):
        text = (
            "date,amount,description\n"
            '2026-03-04,-7.50,"Cafe\nsecond line"\n'
            "2026-03-05,oops,x\n"
        )
        with self.assertRaises(ParseError) as caught:
            parse_transactions(text)
        self.assertEqual(caught.exception.line, 4)
```

- [ ] **Step 11: Run them to make sure they fail**

Run: `python3 -m unittest test_parse -v`
Expected: FAIL — `ImportError: cannot import name 'parse_transactions'` (or `NotImplementedError` if you added the stub)

- [ ] **Step 12: Implement `parse_transactions`**

Append to `ledgerlite/parse.py`:

```python
def parse_transactions(text: str) -> list[Transaction]:
    """Parse transaction CSV text. Raises ParseError on the first bad line."""
    reader = csv.reader(io.StringIO(text.lstrip(_BOM), newline=""))
    rows = iter(reader)
    try:
        header = next(rows)
    except StopIteration:
        raise ParseError(1, "expected header row date,amount,description") from None
    if tuple(field.strip().lower() for field in header) != HEADER:
        raise ParseError(
            reader.line_num, "expected header row date,amount,description"
        )

    transactions = []
    for row in rows:
        line = reader.line_num
        if len(row) != 3:
            raise ParseError(line, f"expected 3 columns, got {len(row)}")
        raw_date, raw_amount, description = row
        try:
            when = parse_date(raw_date)
            amount = parse_amount(raw_amount)
        except ValueError as err:
            raise ParseError(line, str(err)) from None
        transactions.append(Transaction(when, amount, description))
    return transactions
```

- [ ] **Step 13: Run the whole suite**

Run: `python3 -m unittest -v`
Expected: PASS — all of `test_model` and `test_parse`

- [ ] **Step 14: Commit**

```bash
git add ledgerlite/parse.py test_parse.py
git commit -m "feat: parse transaction CSV text into Transactions"
```

---

### Task 2: Rules parsing and categorization

**Files:**
- Create: `ledgerlite/rules.py`
- Test: `test_rules.py`

**Interfaces:**
- Consumes: `ledgerlite.parse.ParseError(line, message)` from Task 1.
- Produces:
  - `ledgerlite.rules.parse_rules(text: str) -> list[tuple[str, str]]` — list of `(substring, category)` in file order; raises `ParseError`.
  - `ledgerlite.rules.categorize(description: str, rules: list[tuple[str, str]]) -> str | None` — first matching rule's category, or `None`.

- [ ] **Step 1: Write the failing tests**

Create `test_rules.py`:

```python
"""Tests for ledgerlite.rules."""

import unittest

from ledgerlite.parse import ParseError
from ledgerlite.rules import categorize, parse_rules


class ParseRulesTests(unittest.TestCase):
    def test_parses_one_rule_per_line_in_order(self):
        self.assertEqual(
            parse_rules("coffee=food\nrent=housing\n"),
            [("coffee", "food"), ("rent", "housing")],
        )

    def test_skips_blank_and_whitespace_only_lines(self):
        self.assertEqual(
            parse_rules("\ncoffee=food\n   \n\nrent=housing\n"),
            [("coffee", "food"), ("rent", "housing")],
        )

    def test_strips_whitespace_around_both_halves(self):
        self.assertEqual(parse_rules("  coffee = food  \n"), [("coffee", "food")])

    def test_splits_on_first_equals_only(self):
        self.assertEqual(parse_rules("a=b=c\n"), [("a", "b=c")])

    def test_accepts_leading_bom(self):
        self.assertEqual(parse_rules("\ufeffcoffee=food\n"), [("coffee", "food")])

    def test_empty_text_yields_no_rules(self):
        self.assertEqual(parse_rules(""), [])

    def test_line_without_equals_is_malformed(self):
        with self.assertRaises(ParseError) as caught:
            parse_rules("coffee=food\njust some text\n")
        self.assertEqual(caught.exception.line, 2)
        self.assertIn("missing '='", caught.exception.message)

    def test_empty_substring_is_malformed(self):
        with self.assertRaises(ParseError) as caught:
            parse_rules("=food\n")
        self.assertEqual(caught.exception.line, 1)
        self.assertEqual(caught.exception.message, "rule has an empty substring")

    def test_empty_category_is_malformed(self):
        with self.assertRaises(ParseError) as caught:
            parse_rules("coffee=\n")
        self.assertEqual(caught.exception.line, 1)
        self.assertEqual(caught.exception.message, "rule has an empty category")


class CategorizeTests(unittest.TestCase):
    RULES = [("coffee", "food"), ("rent", "housing")]

    def test_matches_substring_anywhere(self):
        self.assertEqual(categorize("Corner Coffee Bar", self.RULES), "food")

    def test_matching_is_case_insensitive_in_description(self):
        self.assertEqual(categorize("COFFEE BAR", self.RULES), "food")

    def test_matching_is_case_insensitive_in_rule(self):
        self.assertEqual(categorize("coffee bar", [("COFFEE", "food")]), "food")

    def test_first_matching_rule_wins(self):
        rules = [("coffee", "food"), ("coffee bar", "entertainment")]
        self.assertEqual(categorize("Coffee Bar", rules), "food")

    def test_returns_none_when_nothing_matches(self):
        self.assertIsNone(categorize("Salary", self.RULES))

    def test_returns_none_with_no_rules(self):
        self.assertIsNone(categorize("Coffee Bar", []))


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run them to make sure they fail**

Run: `python3 -m unittest test_rules -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'ledgerlite.rules'`

- [ ] **Step 3: Implement `rules.py`**

Create `ledgerlite/rules.py`:

```python
"""Rules files: `<substring>=<category>`, first match wins."""

from .parse import ParseError

_BOM = "\ufeff"


def parse_rules(text: str) -> list[tuple[str, str]]:
    """Parse rules text into (substring, category) pairs in file order."""
    rules: list[tuple[str, str]] = []
    for number, raw_line in enumerate(text.lstrip(_BOM).splitlines(), start=1):
        line = raw_line.strip()
        if not line:
            continue
        raw_substring, separator, raw_category = line.partition("=")
        if not separator:
            raise ParseError(number, f"rule is missing '=': {raw_line!r}")
        substring = raw_substring.strip()
        category = raw_category.strip()
        if not substring:
            raise ParseError(number, "rule has an empty substring")
        if not category:
            raise ParseError(number, "rule has an empty category")
        rules.append((substring, category))
    return rules


def categorize(description: str, rules: list[tuple[str, str]]) -> str | None:
    """Return the first matching rule's category, or None."""
    lowered = description.lower()
    for substring, category in rules:
        if substring.lower() in lowered:
            return category
    return None
```

- [ ] **Step 4: Run them to make sure they pass**

Run: `python3 -m unittest test_rules -v`
Expected: PASS (15 tests)

- [ ] **Step 5: Commit**

```bash
git add ledgerlite/rules.py test_rules.py
git commit -m "feat: parse rules files and categorize descriptions"
```

---

### Task 3: Date ordering and balances

**Files:**
- Create: `ledgerlite/balance.py`
- Test: `test_balance.py`

**Interfaces:**
- Consumes: `ledgerlite.model.Transaction` from Task 1.
- Produces:
  - `ledgerlite.balance.order_by_date(transactions: list[Transaction]) -> list[Transaction]` — stable sort by date; input list untouched.
  - `ledgerlite.balance.running_balances(opening: Decimal, transactions: list[Transaction]) -> list[Decimal]` — one balance per transaction, in date order.
  - `ledgerlite.balance.closing_balance(opening: Decimal, transactions: list[Transaction]) -> Decimal` — the last running balance, or `opening` when there are no transactions.

- [ ] **Step 1: Write the failing tests**

Create `test_balance.py`:

```python
"""Tests for ledgerlite.balance."""

import unittest
from datetime import date
from decimal import Decimal

from ledgerlite.balance import closing_balance, order_by_date, running_balances
from ledgerlite.model import Transaction


def txn(day, amount, description="x"):
    return Transaction(date(2026, 3, day), Decimal(amount), description)


class OrderByDateTests(unittest.TestCase):
    def test_sorts_by_date(self):
        transactions = [txn(5, "-900.00"), txn(1, "2500.00"), txn(4, "-7.50")]
        self.assertEqual(
            [t.date.day for t in order_by_date(transactions)], [1, 4, 5]
        )

    def test_ties_keep_input_order(self):
        first = txn(4, "1.00", "first")
        second = txn(4, "2.00", "second")
        ordered = order_by_date([second, first])
        self.assertEqual([t.description for t in ordered], ["second", "first"])

    def test_does_not_mutate_input(self):
        transactions = [txn(5, "1.00"), txn(1, "2.00")]
        order_by_date(transactions)
        self.assertEqual([t.date.day for t in transactions], [5, 1])

    def test_empty_list(self):
        self.assertEqual(order_by_date([]), [])


class RunningBalancesTests(unittest.TestCase):
    def test_accumulates_in_date_order(self):
        transactions = [txn(5, "-900.00"), txn(1, "2500.00"), txn(4, "-7.50")]
        self.assertEqual(
            running_balances(Decimal("100"), transactions),
            [Decimal("2600.00"), Decimal("2592.50"), Decimal("1692.50")],
        )

    def test_empty_list_has_no_balances(self):
        self.assertEqual(running_balances(Decimal("100"), []), [])

    def test_arithmetic_is_exact_decimal(self):
        transactions = [txn(1, "0.10"), txn(2, "0.20")]
        self.assertEqual(running_balances(Decimal("0"), transactions)[-1], Decimal("0.30"))


class ClosingBalanceTests(unittest.TestCase):
    def test_is_balance_after_last_transaction(self):
        transactions = [txn(5, "-900.00"), txn(1, "2500.00"), txn(4, "-7.50")]
        self.assertEqual(closing_balance(Decimal("100"), transactions), Decimal("1692.50"))

    def test_is_opening_when_there_are_no_transactions(self):
        self.assertEqual(closing_balance(Decimal("100"), []), Decimal("100"))

    def test_default_opening_of_zero(self):
        self.assertEqual(closing_balance(Decimal("0"), [txn(1, "-12.50")]), Decimal("-12.50"))


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run them to make sure they fail**

Run: `python3 -m unittest test_balance -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'ledgerlite.balance'`

- [ ] **Step 3: Implement `balance.py`**

Create `ledgerlite/balance.py`:

```python
"""Date ordering and running/closing balances."""

from decimal import Decimal

from .model import Transaction


def order_by_date(transactions: list[Transaction]) -> list[Transaction]:
    """Return the transactions sorted by date, ties keeping input order."""
    return sorted(transactions, key=lambda transaction: transaction.date)


def running_balances(
    opening: Decimal, transactions: list[Transaction]
) -> list[Decimal]:
    """Return the balance after each transaction, in date order."""
    balances = []
    balance = opening
    for transaction in order_by_date(transactions):
        balance += transaction.amount
        balances.append(balance)
    return balances


def closing_balance(opening: Decimal, transactions: list[Transaction]) -> Decimal:
    """Return the balance after the last transaction, or the opening amount."""
    balances = running_balances(opening, transactions)
    return balances[-1] if balances else opening
```

`sorted` is stable, which is exactly what "ties keeping input order" requires — do not add a secondary sort key.

- [ ] **Step 4: Run them to make sure they pass**

Run: `python3 -m unittest test_balance -v`
Expected: PASS (10 tests)

- [ ] **Step 5: Commit**

```bash
git add ledgerlite/balance.py test_balance.py
git commit -m "feat: add date ordering and balance calculation"
```

---

### Task 4: Per-category totals and report formatting

**Files:**
- Create: `ledgerlite/report.py`
- Test: `test_report.py`

**Interfaces:**
- Consumes: `Transaction` (Task 1), `categorize` (Task 2), `closing_balance` (Task 3).
- Produces:
  - `ledgerlite.report.UNCATEGORIZED` — the string `"uncategorized"`.
  - `ledgerlite.report.format_amount(amount: Decimal) -> str` — two fractional digits, `-` only for negatives, no separators.
  - `ledgerlite.report.category_totals(transactions, rules) -> list[tuple[str, Decimal]]` — categories with at least one transaction, case-insensitively alphabetical, `uncategorized` last.
  - `ledgerlite.report.format_report(transactions, rules, opening: Decimal) -> str` — the whole report, ending in exactly one `\n`.

- [ ] **Step 1: Write the failing tests**

Create `test_report.py`:

```python
"""Tests for ledgerlite.report."""

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


def txn(day, amount, description):
    return Transaction(date(2026, 3, day), Decimal(amount), description)


RULES = [("coffee", "food"), ("rent", "housing")]
EXAMPLE = [
    txn(5, "-900.00", "Monthly Rent"),
    txn(4, "-7.50", "Coffee Bar"),
    txn(1, "2500.00", "Salary"),
]


class FormatAmountTests(unittest.TestCase):
    def test_negative(self):
        self.assertEqual(format_amount(Decimal("-12.50")), "-12.50")

    def test_zero(self):
        self.assertEqual(format_amount(Decimal("0")), "0.00")

    def test_negative_zero_has_no_sign(self):
        self.assertEqual(format_amount(Decimal("-0.00")), "0.00")

    def test_pads_to_two_places(self):
        self.assertEqual(format_amount(Decimal("1.5")), "1.50")
        self.assertEqual(format_amount(Decimal("1200")), "1200.00")

    def test_no_thousands_separators(self):
        self.assertEqual(format_amount(Decimal("1234567.89")), "1234567.89")


class CategoryTotalsTests(unittest.TestCase):
    def test_sums_per_category_alphabetically_with_uncategorized_last(self):
        self.assertEqual(
            category_totals(EXAMPLE, RULES),
            [
                ("food", Decimal("-7.50")),
                ("housing", Decimal("-900.00")),
                (UNCATEGORIZED, Decimal("2500.00")),
            ],
        )

    def test_sums_several_transactions_in_one_category(self):
        transactions = [txn(1, "-7.50", "Coffee Bar"), txn(2, "-3.25", "COFFEE hut")]
        self.assertEqual(category_totals(transactions, RULES), [("food", Decimal("-10.75"))])

    def test_omits_uncategorized_when_everything_matches(self):
        transactions = [txn(1, "-7.50", "Coffee Bar")]
        self.assertEqual(
            [name for name, _ in category_totals(transactions, RULES)], ["food"]
        )

    def test_all_uncategorized_without_rules(self):
        self.assertEqual(
            category_totals(EXAMPLE, []), [(UNCATEGORIZED, Decimal("1592.50"))]
        )

    def test_no_transactions_yields_no_lines(self):
        self.assertEqual(category_totals([], RULES), [])

    def test_alphabetical_order_is_case_insensitive(self):
        rules = [("a", "Zebra"), ("b", "apple")]
        transactions = [txn(1, "1.00", "a"), txn(2, "2.00", "b")]
        self.assertEqual(
            [name for name, _ in category_totals(transactions, rules)],
            ["apple", "Zebra"],
        )

    def test_rule_category_named_uncategorized_merges_and_stays_last(self):
        rules = [("coffee", "uncategorized"), ("rent", "housing")]
        transactions = [
            txn(1, "-7.50", "Coffee Bar"),
            txn(2, "-900.00", "Monthly Rent"),
            txn(3, "2500.00", "Salary"),
        ]
        self.assertEqual(
            category_totals(transactions, rules),
            [("housing", Decimal("-900.00")), (UNCATEGORIZED, Decimal("2492.50"))],
        )

    def test_totals_are_exact_decimals(self):
        transactions = [txn(1, "0.10", "Coffee"), txn(2, "0.20", "Coffee")]
        self.assertEqual(category_totals(transactions, RULES), [("food", Decimal("0.30"))])


class FormatReportTests(unittest.TestCase):
    def test_matches_the_design_example(self):
        self.assertEqual(
            format_report(EXAMPLE, RULES, Decimal("100")),
            "food: -7.50\n"
            "housing: -900.00\n"
            "uncategorized: 2500.00\n"
            "\n"
            "closing balance: 1692.50\n",
        )

    def test_no_transactions_prints_blank_line_then_closing_balance(self):
        self.assertEqual(
            format_report([], RULES, Decimal("100")), "\nclosing balance: 100.00\n"
        )

    def test_default_opening_of_zero(self):
        self.assertEqual(
            format_report([txn(1, "-7.50", "Coffee Bar")], RULES, Decimal("0")),
            "food: -7.50\n\nclosing balance: -7.50\n",
        )


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run them to make sure they fail**

Run: `python3 -m unittest test_report -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'ledgerlite.report'`

- [ ] **Step 3: Implement `report.py`**

Create `ledgerlite/report.py`:

```python
"""Per-category totals and report text."""

from decimal import Decimal

from .balance import closing_balance
from .model import Transaction
from .rules import categorize

UNCATEGORIZED = "uncategorized"

_CENTS = Decimal("0.01")


def format_amount(amount: Decimal) -> str:
    """Format an amount with exactly two fractional digits, no separators."""
    quantized = amount.quantize(_CENTS)
    if quantized == 0:
        quantized = abs(quantized)  # turn Decimal("-0.00") into Decimal("0.00")
    return f"{quantized:f}"


def category_totals(
    transactions: list[Transaction], rules: list[tuple[str, str]]
) -> list[tuple[str, Decimal]]:
    """Total each category, alphabetically, with uncategorized last."""
    totals: dict[str, Decimal] = {}
    for transaction in transactions:
        category = categorize(transaction.description, rules)
        name = UNCATEGORIZED if category is None else category
        totals[name] = totals.get(name, Decimal(0)) + transaction.amount

    named = sorted(
        (name for name in totals if name != UNCATEGORIZED),
        key=lambda name: (name.lower(), name),
    )
    lines = [(name, totals[name]) for name in named]
    if UNCATEGORIZED in totals:
        lines.append((UNCATEGORIZED, totals[UNCATEGORIZED]))
    return lines


def format_report(
    transactions: list[Transaction],
    rules: list[tuple[str, str]],
    opening: Decimal,
) -> str:
    """Render the whole report, ending in a single newline."""
    lines = [
        f"{name}: {format_amount(total)}"
        for name, total in category_totals(transactions, rules)
    ]
    lines.append("")
    lines.append(
        f"closing balance: {format_amount(closing_balance(opening, transactions))}"
    )
    return "\n".join(lines) + "\n"
```

- [ ] **Step 4: Run them to make sure they pass**

Run: `python3 -m unittest test_report -v`
Expected: PASS (16 tests)

- [ ] **Step 5: Run the whole suite**

Run: `python3 -m unittest -v`
Expected: PASS — model, parse, rules, balance, report

- [ ] **Step 6: Commit**

```bash
git add ledgerlite/report.py test_report.py
git commit -m "feat: add per-category totals and report formatting"
```

---

### Task 5: CLI, exit codes, and error messages

Wires everything together: argument parsing, the only file reads in the package, the two error message forms, and the `python3 -m ledgerlite` shim. `__main__.py` is not in the spec's layout list; without it the documented command line cannot be invoked at all, so it is included as a two-line delegation to `cli.main`.

**Files:**
- Create: `ledgerlite/cli.py`
- Create: `ledgerlite/__main__.py`
- Test: `test_cli.py`

**Interfaces:**
- Consumes: `parse_amount`, `parse_transactions`, `ParseError` (Task 1); `parse_rules` (Task 2); `format_report` (Task 4).
- Produces: `ledgerlite.cli.main(argv: list[str] | None = None) -> int` — writes the report to stdout, errors to stderr, and returns the exit code. It never raises `SystemExit`; argparse's exit is caught and returned as an int.

- [ ] **Step 1: Write the failing tests**

Create `test_cli.py`:

```python
"""End-to-end tests for ledgerlite.cli."""

import contextlib
import io
import os
import tempfile
import unittest

from ledgerlite.cli import main

GOOD_CSV = (
    "date,amount,description\n"
    "2026-03-05,-900.00,Monthly Rent\n"
    "2026-03-04,-7.50,Coffee Bar\n"
    "2026-03-01,2500.00,Salary\n"
)
GOOD_RULES = "coffee=food\nrent=housing\n"


class CliTestCase(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory()
        self.addCleanup(self.directory.cleanup)

    def write(self, name, text, encoding="utf-8"):
        path = os.path.join(self.directory.name, name)
        with open(path, "w", encoding=encoding, newline="") as handle:
            handle.write(text)
        return path

    def run_cli(self, *argv):
        out, err = io.StringIO(), io.StringIO()
        with contextlib.redirect_stdout(out), contextlib.redirect_stderr(err):
            code = main(list(argv))
        return code, out.getvalue(), err.getvalue()


class SuccessTests(CliTestCase):
    def test_reports_the_design_example(self):
        transactions = self.write("t.csv", GOOD_CSV)
        rules = self.write("r.txt", GOOD_RULES)
        code, out, err = self.run_cli(
            "report", transactions, "--rules", rules, "--opening", "100"
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
        transactions = self.write("t.csv", GOOD_CSV)
        code, out, _ = self.run_cli("report", transactions, "--rules", self.write("r.txt", GOOD_RULES))
        self.assertEqual(code, 0)
        self.assertIn("closing balance: 1592.50\n", out)

    def test_without_rules_everything_is_uncategorized(self):
        transactions = self.write("t.csv", GOOD_CSV)
        code, out, _ = self.run_cli("report", transactions)
        self.assertEqual(code, 0)
        self.assertEqual(out, "uncategorized: 1592.50\n\nclosing balance: 1592.50\n")

    def test_negative_opening(self):
        transactions = self.write("t.csv", "date,amount,description\n")
        code, out, _ = self.run_cli("report", transactions, "--opening", "-12.50")
        self.assertEqual(code, 0)
        self.assertEqual(out, "\nclosing balance: -12.50\n")


class UnreadableFileTests(CliTestCase):
    def test_missing_transactions_file(self):
        path = os.path.join(self.directory.name, "nope.csv")
        code, out, err = self.run_cli("report", path)
        self.assertEqual(code, 1)
        self.assertEqual(out, "")
        self.assertEqual(err, f"ledgerlite: cannot read {path}: No such file or directory\n")

    def test_missing_rules_file(self):
        transactions = self.write("t.csv", GOOD_CSV)
        path = os.path.join(self.directory.name, "nope.txt")
        code, out, err = self.run_cli("report", transactions, "--rules", path)
        self.assertEqual(code, 1)
        self.assertEqual(out, "")
        self.assertEqual(err, f"ledgerlite: cannot read {path}: No such file or directory\n")

    def test_directory_instead_of_file(self):
        code, out, err = self.run_cli("report", self.directory.name)
        self.assertEqual(code, 1)
        self.assertEqual(out, "")
        self.assertTrue(err.startswith(f"ledgerlite: cannot read {self.directory.name}: "))

    def test_non_utf8_file(self):
        path = os.path.join(self.directory.name, "binary.csv")
        with open(path, "wb") as handle:
            handle.write(b"date,amount,description\n2026-03-04,-7.50,\xff\xfe\n")
        code, out, err = self.run_cli("report", path)
        self.assertEqual(code, 1)
        self.assertEqual(out, "")
        self.assertEqual(err, f"ledgerlite: cannot read {path}: not valid UTF-8 text\n")


class MalformedInputTests(CliTestCase):
    def test_bad_amount_reports_path_line_and_reason(self):
        path = self.write("t.csv", "date,amount,description\n2026-03-04,1.005,Coffee\n")
        code, out, err = self.run_cli("report", path)
        self.assertEqual(code, 2)
        self.assertEqual(out, "")
        self.assertEqual(
            err,
            f"ledgerlite: {path}:2: amount has more than two fractional digits: '1.005'\n",
        )

    def test_wrong_column_count(self):
        path = self.write("t.csv", "date,amount,description\n2026-03-04,-7.50\n")
        code, out, err = self.run_cli("report", path)
        self.assertEqual(code, 2)
        self.assertEqual(err, f"ledgerlite: {path}:2: expected 3 columns, got 2\n")

    def test_empty_file(self):
        path = self.write("t.csv", "")
        code, out, err = self.run_cli("report", path)
        self.assertEqual(code, 2)
        self.assertEqual(
            err, f"ledgerlite: {path}:1: expected header row date,amount,description\n"
        )

    def test_whole_file_is_rejected_so_stdout_stays_empty(self):
        path = self.write(
            "t.csv",
            "date,amount,description\n2026-03-04,-7.50,Coffee\n2026-03-05,oops,x\n",
        )
        code, out, _ = self.run_cli("report", path)
        self.assertEqual(code, 2)
        self.assertEqual(out, "")

    def test_malformed_rules_file(self):
        transactions = self.write("t.csv", GOOD_CSV)
        rules = self.write("r.txt", "coffee=food\njust some text\n")
        code, out, err = self.run_cli("report", transactions, "--rules", rules)
        self.assertEqual(code, 2)
        self.assertEqual(out, "")
        self.assertEqual(
            err, f"ledgerlite: {rules}:2: rule is missing '=': 'just some text'\n"
        )


class UsageErrorTests(CliTestCase):
    def test_invalid_opening_is_a_usage_error(self):
        transactions = self.write("t.csv", GOOD_CSV)
        code, out, err = self.run_cli("report", transactions, "--opening", "abc")
        self.assertEqual(code, 2)
        self.assertEqual(out, "")
        self.assertIn("not a decimal number", err)

    def test_missing_subcommand_is_a_usage_error(self):
        code, out, err = self.run_cli()
        self.assertEqual(code, 2)
        self.assertEqual(out, "")
        self.assertIn("usage: ledgerlite", err)

    def test_unknown_subcommand_is_a_usage_error(self):
        code, _, err = self.run_cli("summarize", "t.csv")
        self.assertEqual(code, 2)
        self.assertIn("usage: ledgerlite", err)


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run them to make sure they fail**

Run: `python3 -m unittest test_cli -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'ledgerlite.cli'`

- [ ] **Step 3: Implement `cli.py`**

Create `ledgerlite/cli.py`:

```python
"""Command-line interface."""

import argparse
import sys
from decimal import Decimal
from typing import Callable

from .parse import ParseError, parse_amount, parse_transactions
from .report import format_report
from .rules import parse_rules

PROG = "ledgerlite"


class _Failure(Exception):
    """An input file could not be read or parsed."""

    def __init__(self, message: str, code: int) -> None:
        super().__init__(message)
        self.message = message
        self.code = code


def _opening_amount(raw: str) -> Decimal:
    try:
        return parse_amount(raw)
    except ValueError as err:
        raise argparse.ArgumentTypeError(str(err)) from None


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


def _load(path: str, parse: Callable[[str], object]) -> object:
    try:
        with open(path, encoding="utf-8", newline="") as handle:
            text = handle.read()
    except OSError as err:
        reason = err.strerror or str(err)
        raise _Failure(f"cannot read {path}: {reason}", 1) from None
    except UnicodeDecodeError:
        raise _Failure(f"cannot read {path}: not valid UTF-8 text", 1) from None
    try:
        return parse(text)
    except ParseError as err:
        raise _Failure(f"{path}:{err.line}: {err.message}", 2) from None


def main(argv: list[str] | None = None) -> int:
    """Run the CLI and return the exit code."""
    parser = _build_parser()
    try:
        args = parser.parse_args(argv)
    except SystemExit as exit_request:  # argparse already printed usage to stderr
        return int(exit_request.code or 0)

    try:
        transactions = _load(args.transactions, parse_transactions)
        rules = _load(args.rules, parse_rules) if args.rules else []
    except _Failure as failure:
        print(f"{PROG}: {failure.message}", file=sys.stderr)
        return failure.code

    sys.stdout.write(format_report(transactions, rules, args.opening))
    return 0
```

- [ ] **Step 4: Create the module entry point**

Create `ledgerlite/__main__.py`:

```python
"""Entry point for `python3 -m ledgerlite`."""

from .cli import main

if __name__ == "__main__":
    raise SystemExit(main())
```

- [ ] **Step 5: Run the CLI tests to make sure they pass**

Run: `python3 -m unittest test_cli -v`
Expected: PASS (all 16 tests)

- [ ] **Step 6: Run the whole suite**

Run: `python3 -m unittest -v`
Expected: PASS — every test module, no errors, no skips

- [ ] **Step 7: Verify the design's worked example by hand**

Run:

```bash
printf 'date,amount,description\n2026-03-05,-900.00,Monthly Rent\n2026-03-04,-7.50,Coffee Bar\n2026-03-01,2500.00,Salary\n' > /tmp/ledgerlite-t.csv
printf 'coffee=food\nrent=housing\n' > /tmp/ledgerlite-r.txt
python3 -m ledgerlite report /tmp/ledgerlite-t.csv --rules /tmp/ledgerlite-r.txt --opening 100
echo "exit: $?"
```

Expected output, exactly:

```
food: -7.50
housing: -900.00
uncategorized: 2500.00

closing balance: 1692.50
exit: 0
```

Then check the two error paths:

```bash
python3 -m ledgerlite report /tmp/does-not-exist.csv; echo "exit: $?"
printf 'date,amount,description\n2026-03-04,1.005,Coffee\n' > /tmp/ledgerlite-bad.csv
python3 -m ledgerlite report /tmp/ledgerlite-bad.csv; echo "exit: $?"
```

Expected: `ledgerlite: cannot read /tmp/does-not-exist.csv: No such file or directory` with `exit: 1`, then `ledgerlite: /tmp/ledgerlite-bad.csv:2: amount has more than two fractional digits: '1.005'` with `exit: 2`.

- [ ] **Step 8: Commit**

```bash
git add ledgerlite/cli.py ledgerlite/__main__.py test_cli.py
git commit -m "feat: add ledgerlite report CLI"
```

---

## Done when

- `python3 -m unittest` passes from the repo root with no failures, errors, or skips.
- `python3 -m ledgerlite report ...` reproduces the design example byte-for-byte, and the two error forms match the spec exactly with exit codes 1 and 2.
- No module imports anything outside the standard library; no `float` and no `round()` appears anywhere in `ledgerlite/`. Check with `grep -rn "float\|round(" ledgerlite/` — expect no matches.
